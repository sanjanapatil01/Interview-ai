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
from openai import OpenAI
import json
import os

client = OpenAI(
    api_key=os.getenv('OPENAI_API_KEY')
)

def dynamic_questions_gen_model(resume_data, history, last_answer):
    """Generate next interview question using OpenAI"""
    
    prompt = f"""
You are continuing a professional job interview as an expert HR and Technical interviewer.

# Resume Data:
{resume_data}

# Candidate's Last Answer:
{last_answer}

# TASK: Generate EXACTLY ONE follow-up question following these rules:
1. **Drill-Down (Priority 1):** If candidate mentioned specific tech/project, ask HARD follow-up about that detail
2. **Topic Rotation (Priority 2):** Switch to uncovered resume skill (Technical > HR > General)
3. **Terminate if complete:** Output {{"terminate": true}} if fully assessed

Return ONLY JSON:
{{
  "question": "Single generated question text"
}}
OR
{{
  "terminate": true
}}
"""
    
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
        max_tokens=150
    )
    
    content = response.choices[0].message.content.strip()
    
    try:
        parsed = json.loads(content)
        
        # Handle terminate case
        if parsed.get("terminate"):
            return None  # Signals end of interview
            
        # Return question
        if "question" in parsed:
            return parsed["question"]
            
        raise ValueError("Invalid JSON format")
        
    except (json.JSONDecodeError, ValueError) as e:
        print(f"JSON parse error: {e}")
        # Fallback questions based on history length
        fallbacks = [
            "Explain your MERN stack project architecture.",
            "Describe a challenging bug you debugged.",
            "How do you optimize React performance?",
            "Tell me about a team conflict you resolved."
        ]
        return fallbacks[len(history) % len(fallbacks)]
