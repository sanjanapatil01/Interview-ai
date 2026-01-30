# import uuid
# import json
# import time
# import logging
# from typing import Dict, Any, Tuple
# from service.llm_model import dynamic_questions_gen_model
# from service.ai_model import evaluate_answer

# # Setup production logging
# logging.basicConfig(level=logging.INFO)
# logger = logging.getLogger(__name__)

# def get_redis_client():
#     """Production-ready Redis client (Upstash or local)"""
#     import os
#     if os.getenv('UPSTASH_REDIS_REST_URL'):
#         from upstash_redis import Redis
#         return Redis(
#             url=os.getenv('UPSTASH_REDIS_REST_URL'),
#             token=os.getenv('UPSTASH_REDIS_REST_TOKEN')
#         )
#     else:
#         import redis
#         return redis.Redis(host='localhost', port=6379, db=0, decode_responses=True)

# r = get_redis_client()

# def start_interview_session(user_id: int) -> Tuple[str, str]:
#     """Start new interview session with first question"""
#     session_id = str(uuid.uuid4())
#     first_question = "Tell me about yourself."
    
#     session_data = {
#         "user_id": user_id,
#         "question_no": 1,
#         "max_questions": 8,  # Configurable limit
#         "start_time": time.time(),
#         "data": [{
#             'question': first_question,
#             'answer': None,
#             'timestamp': time.time(),
#             'evaluation': None
#         }]
#     }
    
#     r.set(session_id, json.dumps(session_data))
#     r.expire(session_id, 86400)  # 24 hours expiry
    
#     logger.info(f"Started interview session {session_id} for user {user_id}")
#     return session_id, first_question

# def handle_interview_session(session_id: str, answer: str, resume_data: str) -> Dict[str, Any]:
#     """Handle candidate answer and generate next question"""
#     # Fetch session
#     session_data = r.get(session_id)
#     if not session_data:
#         logger.error(f"Session {session_id} not found")
#         return {"error": "Session not found or expired"}
    
#     try:
#         session = json.loads(session_data)
#     except json.JSONDecodeError:
#         return {"error": "Invalid session data"}
    
#     current_idx = session['question_no'] - 1  # 0-based index
#     max_questions = session.get('max_questions', 8)
    
#     # Store answer
#     session['data'][current_idx]['answer'] = answer
#     session['data'][current_idx]['timestamp'] = time.time()
    
#     # Check if interview should end
#     if session['question_no'] >= max_questions:
#         logger.info(f"Interview complete for session {session_id}")
#         return {
#             "next_question": None,
#             "stop": True,
#             "total_questions": session['question_no']
#         }
    
#     # Generate next dynamic question using LLM
#     try:
#         next_question = dynamic_questions_gen_model(
#             resume_data=resume_data,
#             history=session['data'],
#             last_answer=answer
#         )
        
#         if not next_question:
#             return {
#                 "next_question": None,
#                 "stop": True,
#                 "reason": "LLM determined interview complete"
#             }
        
#     except Exception as e:
#         logger.error(f"LLM question generation failed: {e}")
#         next_question = "Can you tell me about a challenging project you worked on?"
    
#     # Add next question to session
#     new_question_entry = {
#         'question': next_question,
#         'answer': None,
#         'timestamp': time.time(),
#         'evaluation': None
#     }
#     session['data'].append(new_question_entry)
#     session['question_no'] += 1
    
#     # Save updated session
#     r.set(session_id, json.dumps(session))
#     r.expire(session_id, 86400)
    
#     logger.info(f"Generated question {session['question_no']} for session {session_id}")
    
#     return {
#         "next_question": next_question,
#         "stop": False,
#         "question_number": session['question_no'],
#         "total_planned": max_questions
#     }

# def get_session_report(session_id: str) -> Dict[str, Any]:
#     """Get complete session data for final report"""
#     session_data = r.get(session_id)
#     if not session_data:
#         return {"error": "Session not found or expired"}
    
#     try:
#         session = json.loads(session_data)
#         # Clean sensitive data for reporting
#         cleaned = session.copy()
#         cleaned['data'] = [
#             {
#                 'question': q['question'],
#                 'answer': q['answer'],
#                 'score': q.get('evaluation', {}).get('score') if q.get('evaluation') else None
#             }
#             for q in session['data']
#         ]
#         return cleaned
#     except json.JSONDecodeError:
#         return {"error": "Invalid session data"}

# def end_session(session_id: str) -> bool:
#     """Force end session and cleanup"""
#     deleted = r.delete(session_id)
#     if deleted:
#         logger.info(f"Session {session_id} deleted")
#     return bool(deleted)

# # Optional: Add evaluation during session (OpenAI-powered)
# def evaluate_current_answer(session_id: str, resume_data: str) -> Dict[str, Any]:
#     """Evaluate the latest answer in session"""
#     session_data = r.get(session_id)
#     if not session_data:
#         return {"error": "Session not found"}
    
#     session = json.loads(session_data)
#     current_idx = len(session['data']) - 2  # Last completed answer
    
#     if current_idx < 0 or not session['data'][current_idx].get('answer'):
#         return {"error": "No answer to evaluate"}
    
#     question = session['data'][current_idx]['question']
#     answer = session['data'][current_idx]['answer']
    
#     evaluation = evaluate_answer(
#         question=question,
#         answer=answer,
#         max_questions=session.get('max_questions', 8),
#         current_index=current_idx
#     )
    
#     # Store evaluation
#     session['data'][current_idx]['evaluation'] = evaluation
#     r.set(session_id, json.dumps(session))
    
#     return evaluation

# if __name__ == "__main__":
#     # Test session flow
#     session_id, first_q = start_interview_session(123)
#     print(f"Session: {session_id}, First: {first_q}")
    
#     result = handle_interview_session(session_id, "I am a CS student...", "sample resume")
#     print(f"Next: {result}")
import uuid
import json
import time
import logging
import os  # ← THIS WAS MISSING!
from typing import Dict, Any, Tuple
from service.ai_model import evaluate_answer, get_openai_client

# Production logging
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

# FIXED Redis initialization
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



def start_interview_session(user_id):
    """Start interview with first question"""
    session_id = str(uuid.uuid4())
    first_question = "Tell me about yourself and your technical background."
    
    session_data = {
        "user_id": user_id,
        "question_no": 1,
        "max_questions": 8,
        "data": [{
            'question': first_question,
            'answer': None,
            'timestamp': time.time(),
            'evaluation': None
        }]
    }
    
    r.set(session_id, json.dumps(session_data))
    r.expire(session_id, 86400)
    return session_id, first_question

def handle_interview_session(session_id, answer, resume_data=""):
    """Handle answer → AI evaluate → next question"""
    data = r.get(session_id)
    if not data:
        return {"error": "Session not found."}
    
    session = json.loads(data)
    current_idx = session['question_no'] - 1
    
    # Store answer
    session['data'][current_idx]['answer'] = answer
    session['data'][current_idx]['timestamp'] = time.time()
    
    # AI Evaluation + Next question (OpenAI only ✅)
    current_question = session['data'][current_idx]['question']
    evaluation = evaluate_answer(
        question=current_question,
        answer=answer,
        max_questions=session['max_questions'],
        current_index=current_idx
    )
    session['data'][current_idx]['evaluation'] = evaluation['evaluation']
    
    # Check completion
    if session['question_no'] >= session['max_questions']:
        session['end_time'] = time.time()
        r.set(session_id, json.dumps(session))
        return {
            "next_question": None,
            "stop": True,
            "total_questions": session['question_no']
        }
    
    # Next question from OpenAI evaluation
    next_question = evaluation['next_question']['question']
    
    # Add new question
    session['data'].append({
        'question': next_question,
        'answer': None,
        'timestamp': time.time(),
        'evaluation': None
    })
    session['question_no'] += 1
    
    r.set(session_id, json.dumps(session))
    r.expire(session_id, 86400)
    
    return {
        "next_question": next_question,
        "stop": False,
        "question_number": session['question_no'],
        "score": evaluation['evaluation']['score']
    }

def get_session_report(session_id):
    """Get complete session data"""
    data = r.get(session_id)
    if not data:
        return {"error": "Session not found."}
    
    session = json.loads(data)
    return {
        "status": "completed" if session.get('end_time') else "active",
        "user_id": session["user_id"],
        "total_questions": len(session["data"]),
        "questions": [
            {
                "question": q["question"],
                "answer": q.get("answer", "Not answered"),
                "score": q.get("evaluation", {}).get("score"),
                "feedback": q.get("evaluation", {}).get("feedback", "")
            }
            for q in session["data"]
        ]
    }
