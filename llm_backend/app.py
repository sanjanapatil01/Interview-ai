from flask import Flask, jsonify, request
from flask_cors import CORS, cross_origin
import os
import json
import uuid
from service.resume_parser import extract_text
from service.interview_session import start_interview_session, handle_interview_session
from service.ai_model import generate_final_report
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SimpleRedis:
    def __init__(self): 
        self.data = {}
    def get(self, key): return self.data.get(key)
    def set(self, key, value, ex=None): 
        self.data[key] = value
        return True
    def delete(self, key): 
        self.data.pop(key, None)
        return True
    def expire(self, key, seconds): return True
    def ping(self): return True
    def hset(self, key, field, value):
        if key not in self.data: self.data[key] = {}
        self.data[key][field] = value
        return 1
    def hgetall(self, key): return self.data.get(key, {})

# Redis setup
try:
    if os.getenv('UPSTASH_REDIS_REST_URL'):
        from upstash_redis import Redis
        r = Redis(url=os.getenv('UPSTASH_REDIS_REST_URL'), token=os.getenv('UPSTASH_REDIS_REST_TOKEN'))
    else:
        r = SimpleRedis()
except:
    r = SimpleRedis()

app = Flask(__name__)

# 🔥 NUCLEAR CORS - Fix ALL preflight issues
@app.before_request
def handle_preflight():
    if request.method == 'OPTIONS':
        response = jsonify({})
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
        return response, 200

CORS(app, origins=["*"], supports_credentials=False)

def save_resume_file(file):
    upload_dir = "uploads/"
    os.makedirs(upload_dir, exist_ok=True)
    file_path = os.path.join(upload_dir, file.filename)
    file.save(file_path)
    return file_path

@app.route('/', methods=['GET'])
def health():
    return jsonify({"status": "AI Interviewer LIVE!"})

@app.route('/api/flask/upload_resume', methods=['POST', 'OPTIONS'])
@cross_origin()
def upload_resume():
    try:
        file = request.files['resume']
        name = request.form['name']
        email = request.form['email']
    except:
        return jsonify({"error": "Missing file or form data"}), 400

    file_path = save_resume_file(file)
    resume_text = extract_text(file_path)
    
    user_id = str(uuid.uuid4())[:8]
    for field, value in {"name": name, "email": email, "resume_text": resume_text, "resume_path": file_path}.items():
        r.hset(f"user:{user_id}", field, value)
    r.expire(f"user:{user_id}", 86400 * 7)

    return jsonify({"user_id": user_id, "message": "Resume uploaded"})

@app.route('/api/flask/start_interview', methods=['POST', 'OPTIONS'])
@cross_origin()
def start_interview():
    user_id = request.json.get('user_id')
    user_data = r.hgetall(f"user:{user_id}")
    
    if not user_data:
        return jsonify({"error": "User not found"}), 404

    session_id, first_question = start_interview_session(user_id)
    return jsonify({"session_id": session_id, "first_question": first_question})

# 🔥 FIX: Accept ANY string as user_id (not just int)
@app.route('/api/flask/submit_answer/<user_id>', methods=['POST', 'OPTIONS'])
@cross_origin()
def submit_answer(user_id):
    data = request.json
    session_id = data.get('session_id')
    answer = data.get('answer')

    if not session_id or not answer:
        return jsonify({"error": "session_id and answer required"}), 400

    user_data = r.hgetall(f"user:{user_id}")
    resume_data = user_data.get('resume_text', '') if user_data else ""

    result = handle_interview_session(session_id, answer, resume_data)

    if result.get("stop"):
        session_data = r.get(session_id)
        if session_data:
            session = json.loads(session_data)
            final_report_data = generate_final_report(session)
            report_key = f"report:{user_id}"
            r.setex(report_key, 86400, json.dumps(final_report_data))
            r.delete(session_id)
            
            return jsonify({
                "message": "Interview Finished!",
                "final_report": final_report_data,
                "user_id": user_id
            })

    return jsonify(result)

@app.route('/api/flask/get_report/<user_id>', methods=['GET', 'OPTIONS'])
@cross_origin()
def get_report(user_id):
    report_key = f"report:{user_id}"
    report = r.get(report_key)
    
    if not report:
        return jsonify({"error": "Report not found"}), 404
    
    user_data = r.hgetall(f"user:{user_id}")
    
    return jsonify({
        "user_id": user_id,
        "name": user_data.get('name', 'Unknown'),
        "email": user_data.get('email', 'Unknown'),
        "report_text": json.loads(report)
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    host = '0.0.0.0'
    app.run(host=host, port=port, debug=False)
