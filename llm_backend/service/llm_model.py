# import json
# import os
# from pathlib import Path
# from typing import Dict, Any
# from flask import jsonify
# from llama_cpp import Llama
# from huggingface_hub import hf_hub_download

# # Global model - lazy load on first use
# _model = None
# MODEL_PATH = "models/mistral-7b-instruct-v0.1.Q4_K_M.gguf"
# MODEL_REPO = "TheBloke/Mistral-7B-Instruct-v0.1-GGUF"

# def get_llm():
#     """Lazy load model with auto-download"""
#     global _model
#     if _model is None:
#         if not os.path.exists(MODEL_PATH):
#             print("Downloading Mistral model (4GB, ~10-15min)...")
#             os.makedirs("models", exist_ok=True)
#             hf_hub_download(
#                 repo_id=MODEL_REPO,
#                 filename="mistral-7b-instruct-v0.1.Q4_K_M.gguf",
#                 local_dir="models",
#                 local_dir_use_symlinks=False
#             )
#             print("Model downloaded!")
        
#         print("Loading Mistral model into memory...")
#         _model = Llama(
#             model_path=MODEL_PATH,
#             n_ctx=4096,
#             n_threads=4,  # Use 4 CPU threads
#             verbose=False
#         )
#         print("Model loaded!")
#     return _model

# def dynamic_questions_gen_model(resume_data: str, history: list, last_answer: str) -> str:
#     """Generate dynamic interview question based on resume and conversation history"""
    
#     llm = get_llm()
    
#     prompt = f"""
#     You are continuing a professional job interview. You are an expert HR and Technical interviewer.
    
#     # Resume Data:
#     {resume_data}
    
#     # Conversation History (most recent last):
#     {json.dumps(history[-5:], indent=2)}  # Last 5 exchanges
    
#     # Candidate's Last Answer Analysis:
#     The candidate just answered: "{last_answer}"
    
#     # NEXT QUESTION LOGIC (Strict Priority):
#     1. TECHNICAL DRILL-DOWN: If last_answer mentioned specific tech/projects/metrics, 
#        ask HARD follow-up on THAT detail only.
#     2. UNCOVERED RESUME SKILLS: Pick strongest unasked skill from resume.
#     3. BEHAVIORAL/HR: If technical covered, ask conflict/decision-making.
#     4. TERMINATE: If all areas assessed (3+ technical, 1+ behavioral), end interview.
    
#     # OUTPUT ONLY VALID JSON - NO OTHER TEXT:
#     {{"action": "ask", "question": "Single hard question here"}} 
#     OR 
#     {{"action": "terminate", "reason": "Interview complete"}}
#     """
    
#     formatted = f"<s>[INST] {prompt.strip()} [/INST]"
    
#     output = llm(
#         formatted,
#         max_tokens=300,
#         temperature=0.1,  # Low temp for consistent JSON
#         top_p=0.9,
#         stop=["</s>", "[/INST]"],
#         echo=False
#     )
    
#     question_text = output["choices"][0]["text"].strip()
    
#     # Robust JSON extraction
#     start = question_text.find('{')
#     end = question_text.rfind('}') + 1
#     if start == -1 or end == 0:
#         raise ValueError("No JSON found in LLM output")
    
#     json_str = question_text[start:end]
    
#     parsed = json.loads(json_str)
    
#     if parsed.get("action") == "terminate":
#         return None  # Signal end of interview
    
#     if not isinstance(parsed, dict) or "question" not in parsed:
#         raise ValueError(f"Invalid JSON structure: {parsed}")
    
#     return parsed["question"]

# # Initial question generator (first question)
# def generate_initial_questions(resume_data: str) -> Dict[str, Any]:
#     """Generate first set of questions"""
#     llm = get_llm()
    
#     prompt = f"""
#     You are an expert technical interviewer. Based ONLY on this resume:
#     {resume_data}
    
#     Generate EXACTLY 3 hard technical questions + 1 behavioral question.
#     Focus on candidate's listed skills/projects.
    
#     Output ONLY JSON:
#     {{
#       "technical": ["Q1", "Q2", "Q3"],
#       "hr": ["Single behavioral question"]
#     }}
#     """
    
#     formatted = f"<s>[INST] {prompt.strip()} [/INST]"
#     output = llm(formatted, max_tokens=400, temperature=0.1)
    
#     json_str = output["choices"][0]["text"].strip()
#     start = json_str.find('{')
#     end = json_str.rfind('}') + 1
#     parsed = json.loads(json_str[start:end])
    
#     return parsed
import os
import json
from typing import Dict, Any

_openai_client = None

def get_openai_client():
    global _openai_client
    if _openai_client is None:
        api_key = os.getenv('OPENAI_API_KEY')
        if api_key:
            from openai import OpenAI
            _openai_client = OpenAI(api_key=api_key)
    return _openai_client

def get_llm():
    """OpenAI GPT-4o-mini as Mistral replacement"""
    client = get_openai_client()
    if not client:
        raise Exception("OpenAI API key missing")
    return client

def dynamic_questions_gen_model(resume_data: str, history: list, last_answer: str) -> str:
    client = get_llm()
    
    prompt = f"""
    You are continuing a professional job interview. Expert HR + Technical interviewer.
    
    Resume: {resume_data}
    Last 5 exchanges: {json.dumps(history[-5:], indent=2)}
    Candidate's last answer: "{last_answer}"
    
    NEXT QUESTION LOGIC:
    1. TECHNICAL DRILL-DOWN on last_answer details
    2. UNCOVERED RESUME SKILLS  
    3. BEHAVIORAL/HR questions
    4. TERMINATE after 5-7 questions
    
    Return ONLY JSON:
    {{"action": "ask", "question": "Single hard question"}} 
    OR 
    {{"action": "terminate", "reason": "Interview complete"}}
    """
    
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.1,
        max_tokens=200
    )
    
    result = json.loads(response.choices[0].message.content)
    return result["question"] if result["action"] == "ask" else None

def generate_initial_questions(resume_data: str) -> Dict[str, Any]:
    client = get_llm()
    
    prompt = f"""
    Based on resume: {resume_data}
    
    Generate EXACTLY 3 hard technical + 1 behavioral question.
    
    JSON format:
    {{"technical": ["Q1", "Q2", "Q3"], "hr": ["Behavioral question"]}}
    """
    
    response = client.chat.completions.create(
        model="gpt-4o-mini", 
        messages=[{"role": "user", "content": prompt}],
        temperature=0.1
    )
    
    return json.loads(response.choices[0].message.content)
