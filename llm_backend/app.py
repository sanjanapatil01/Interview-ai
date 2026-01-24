import os
import json
import redis
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_session import Session
from flask_migrate import Migrate
from config import DevelopmentConfig, ProductionConfig
from service.resume_parser import parse_resume12, extract_text
from service.interview_session import start_interview_session, handle_interview_session, get_session_report
from service.ai_model import generate_final_report
from models import db, Candidate, FinalReport
from dotenv import load_dotenv

load_dotenv()

# Upstash Redis client (replaces localhost Redis)
def get_redis_client():
    if os.getenv('UPSTASH_REDIS_REST_URL'):
        from upstash_redis import Redis
        return Redis(url=os.getenv('UPSTASH_REDIS_REST_URL'), token=os.getenv('UPSTASH_REDIS_REST_TOKEN'))
    return redis.Redis(host='localhost', port=6379, db=0, decode_responses=True)

r = get_redis_client()

def create_app():
    app = Flask(__name__)
    
    # Load correct config
    env = os.getenv('FLASK_ENV', 'development')
    config_class = ProductionConfig if env == 'production' else DevelopmentConfig
    app.config.from_object(config_class)
    
    # Initialize extensions
    db.init_app(app)
    CORS(app, resources={r"/api/*": {"origins": "*"}})
    
    # Redis-backed sessions
    app.config['SESSION_TYPE'] = 'filesystem'  # Fallback
    Session(app)
    
    # Database migrations
    migrate = Migrate(app, db)
    
    # Create tables (only in dev)
    with app.app_context():
        if not env == 'production':
            db.create_all()
    
    return app

app = create_app()

def save_resume_file(file):
    """Save uploaded resume securely"""
    upload_dir = "uploads/"
    os.makedirs(upload_dir, exist_ok=True)
    timestamp = int(time.time())
    file_extension = os.path.splitext(file.filename)[1]
    safe_filename = f"resume_{timestamp}_{request.form.get('name', 'user')}{file_extension}"
    file_path = os.path.join(upload_dir, safe_filename)
    file.save(file_path)
    return file_path

@app.route('/api/flask/upload_resume', methods=['POST'])
def upload_resume():
    try:
        file = request.files['resume']
        name = request.form['name']
        email = request.form['email']
        
        if not file or not name or not email:
            return jsonify({"error": "Missing required fields"}), 400
        
        file_path = save_resume_file(file)
        resume_text = extract_text(file_path)
        
        user = Candidate(name=name, email=email, resume_text=resume_text, resume_path=file_path)
        db.session.add(user)
        db.session.commit()
        
        return jsonify({
            "user_id": user.id,
            "message": "Resume uploaded successfully"
        })
    
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@app.route('/api/flask/start_interview', methods=['POST'])
def start_interview():
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        
        if not user_id:
            return jsonify({"error": "user_id required"}), 400
        
        user = Candidate.query.get(user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        session_id, first_question = start_interview_session(user_id)
        
        return jsonify({
            "session_id": session_id,
            "first_question": first_question
        })
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/flask/submit_answer/<int:user_id>', methods=['POST'])
def submit_answer(user_id):
    try:
        data = request.get_json()
        session_id = data.get('session_id')
        answer = data.get('answer')
        
        if not session_id or not answer:
            return jsonify({"error": "session_id and answer required"}), 400
        
        user = Candidate.query.get(user_id)
        resume_data = user.resume_text if user else ""
        
        result = handle_interview_session(session_id, answer, resume_data)
        
        if result.get("stop"):
            # Generate final report
            session_data = r.get(session_id)
            if session_data:
                session = json.loads(session_data)
                final_report_data = generate_final_report(session)
                
                # Save report to DB
                report_text = json.dumps(final_report_data) if isinstance(final_report_data, dict) else str(final_report_data)
                report = FinalReport(user_id=user_id, report_text=report_text)
                db.session.add(report)
                db.session.commit()
                
                r.delete(session_id)
                return jsonify({
                    "message": "Interview Finished!",
                    "final_report": final_report_data
                })
        
        return jsonify(result)
    
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@app.route('/api/flask/get_report/<int:user_id>', methods=['GET'])
def get_report(user_id):
    try:
        user = Candidate.query.get(user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        report = FinalReport.query.filter_by(user_id=user_id).order_by(FinalReport.id.desc()).first()
        if not report:
            return jsonify({"error": "No report found"}), 404
        
        report_data = json.loads(report.report_text)
        return jsonify({
            "user_id": user.id,
            "name": user.name,
            "email": user.email,
            "report": report_data
        })
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
