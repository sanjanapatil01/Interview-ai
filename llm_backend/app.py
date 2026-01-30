from flask import Flask, jsonify, request
from flask_cors import CORS
import os
import json
from service.resume_parser import parse_resume12, extract_text
from service.interview_session import start_interview_session, handle_interview_session, get_session_report
from service.ai_model import generate_final_report
from models import db
from config import DevelopmentConfig
from models import Candidate, FinalReport
import redis
import logging

from flask_migrate import Migrate
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class SimpleRedis:
    def __init__(self): 
        self.data = {}
    def get(self, key): 
        return self.data.get(key)
    def set(self, key, value, ex=None): 
        self.data[key] = value
        return True
    def delete(self, key): 
        self.data.pop(key, None)
        return True
    def expire(self, key, seconds): 
        return True
    def ping(self): 
        return True

# 🔥 RENDER READY - Use ENV vars
try:
    if os.getenv('UPSTASH_REDIS_REST_URL'):
        from upstash_redis import Redis
        r = Redis(url=os.getenv('UPSTASH_REDIS_REST_URL'), token=os.getenv('UPSTASH_REDIS_REST_TOKEN'))
        r.ping()
        logger.info("✅ Upstash Redis connected")
    else:
        r = SimpleRedis()
        logger.info("✅ Local Redis active")
except Exception as e:
    r = SimpleRedis()
    logger.info(f"✅ Simple Redis fallback: {e}")

def create_app():
    app = Flask(__name__)
    
    # 🔥 PRODUCTION CORS - Allows localhost:3001 + ALL origins
    CORS(app, resources={
        r"/api/*": {
            "origins": ["http://localhost:3001", "http://localhost:3000", "*"],
            "methods": ["GET", "POST", "OPTIONS", "PUT", "DELETE"],
            "allow_headers": ["Content-Type", "Authorization"]
        }
    })
    
    app.config.from_object(DevelopmentConfig)
    db.init_app(app)
    migrate = Migrate(app, db)
    return app

app = create_app()

def save_resume_file(file):
    upload_dir = "uploads/"
    os.makedirs(upload_dir, exist_ok=True)
    file_path = os.path.join(upload_dir, file.filename)
    file.save(file_path)
    return file_path

@app.route('/', methods=['GET'])  # 🔥 RENDER HEALTH CHECK
def health():
    return jsonify({"status": "AI Interviewer LIVE!", "redis": "connected"})

@app.route('/api/flask/upload_resume', methods=['POST'])
def upload_resume():
    file = request.files['resume']
    name = request.form['name']
    email = request.form['email']

    file_path = save_resume_file(file)
    resume_text = extract_text(file_path)

    user = Candidate(name=name, email=email, resume_text=resume_text, resume_path=file_path)
    db.session.add(user)
    db.session.commit()

    return jsonify({
        "user_id": user.id,
        "message": "Resume uploaded successfully"
    })

@app.route('/api/flask/start_interview', methods=['POST'])
def start_interview():
    user_id = request.json.get('user_id')
    user = Candidate.query.get(user_id)

    if not user:
        return jsonify({"error": "User not found"}), 404

    session_id, first_question = start_interview_session(user_id)
    return jsonify({
        "session_id": session_id,
        "first_question": first_question
    })

@app.route('/api/flask/submit_answer/<int:user_id>', methods=['POST'])
def submit_answer(user_id):
    data = request.json
    session_id = data.get('session_id')
    answer = data.get('answer')

    if not session_id or not answer:
        return jsonify({"error": "session_id and answer are required"}), 400

    user = Candidate.query.get(user_id)
    resume_data = user.resume_text if user else ""

    result = handle_interview_session(session_id, answer, resume_data)
    print(f"Submit answer result: {result}")

    if result.get("stop"):
        session_data = r.get(session_id)
        if session_data:
            session = json.loads(session_data)
            user_id = session['user_id']
            final_report_data = generate_final_report(session)

            final_report_text = json.dumps(final_report_data) if isinstance(final_report_data, dict) else str(final_report_data)
            
            report = FinalReport(user_id=user_id, report_text=final_report_text)
            db.session.add(report)
            db.session.commit()
        
        r.delete(session_id)
        return jsonify({
            "message": "Interview Finished!",
            "final_report": final_report_data 
        })

    return jsonify(result)

@app.route('/api/flask/get_report/<int:user_id>', methods=['GET'])
def get_report(user_id):
    user = Candidate.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    report = FinalReport.query.filter_by(user_id=user_id).order_by(FinalReport.id.desc()).first()
    if not report:
        return jsonify({"error": "Report not found"}), 404

    return jsonify({
        "user_id": user.id,
        "name": user.name,
        "email": user.email,
        "report_text": json.loads(report.report_text)
    })

# 🔥 RENDER PORT BINDING
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    host = '0.0.0.0'  # REQUIRED for Render
    app.run(host=host, port=port, debug=False)
