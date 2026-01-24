import os
import json
import re
from pathlib import Path
from typing import Dict, Any
from dotenv import load_dotenv
from flask import jsonify

load_dotenv()

# OpenAI - Use env var (SECURITY)
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
from openai import OpenAI
client = OpenAI(api_key=OPENAI_API_KEY) if OPENAI_API_KEY else None

# Global Mistral LLM (lazy loaded from previous fix)
from service.llm_model import get_llm  # Remove . prefix

def evaluate_answer(question: str, answer: str, max_questions: int, current_index: int) -> Dict[str, Any]:
    """Evaluate candidate answer and suggest next question"""
    
    if not client:
        return {
            "evaluation": {"score": 0, "feedback": "OpenAI API key missing"},
            "next_question": {"question": "Please continue.", "type": "General"},
            "stop": False
        }
    
    prompt = f"""
You are an experienced technical interviewer.
Evaluate the candidate's answer based on their resume and the asked question.

Question: {question}
Answer: {answer}

Instructions:
1. Score 0-10 based on correctness, clarity, depth, and relevance to question
2. Give 1-2 sentences of constructive feedback
3. Suggest ONE relevant follow-up question (Technical/HR/General)
4. Set "stop": true if {current_index+1} >= {max_questions}

Return JSON only - exact format:
{{
  "evaluation": {{
    "score": 7,
    "feedback": "Good explanation of X, but elaborate on Y"
  }},
  "next_question": {{
    "question": "Your follow-up question here",
    "type": "Technical"
  }},
  "stop": false
}}
"""
    
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "system", "content": "Return ONLY valid JSON. No explanations."},
                     {"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=300
        )
        
        content = response.choices[0].message.content.strip()
        
        # Robust JSON extraction
        json_match = re.search(r'\{.*\}', content, re.DOTALL)
        if json_match:
            result = json.loads(json_match.group())
        else:
            result = json.loads(content)
            
    except Exception as e:
        result = {
            "evaluation": {"score": 0, "feedback": f"Evaluation error: {str(e)}"},
            "next_question": {"question": "Please continue.", "type": "General"},
            "stop": False
        }
    
    return result

def clean_report(raw_data: str) -> Dict[str, Any]:
    """Parse markdown report into structured data"""
    sections = re.split(r'\n## ', raw_data)
    report_dict = {}
    
    for sec in sections:
        if sec.strip():
            lines = sec.strip().split('\n', 1)
            header = lines[0].strip('# ').strip()
            content = lines[1].strip() if len(lines) > 1 else ''
            report_dict[header] = content
    
    return report_dict

def generate_final_report(candidate_session_data: str) -> Dict[str, Any]:
    """Generate comprehensive final interview report using Mistral"""
    
    llm = get_llm()  # From your fixed model loader
    
    prompt = f"""
You are a Senior Hiring Manager creating a candidate evaluation report.

CANDIDATE SESSION DATA:
{candidate_session_data}

Generate structured JSON report following this EXACT format:

{{
  "candidate_overview": {{
    "name": "Candidate Name",
    "email": "candidate@email.com",
    "summary": "2-sentence professional summary"
  }},
  "overall_performance": {{
    "average_score": 3.8,
    "performance_level": "Advanced",
    "summary": "Executive summary"
  }},
  "strengths": ["Strength 1", "Strength 2"],
  "weaknesses": ["Weakness 1", "Weakness 2"],
  "section_wise_evaluation": {{
    "Technical": {{"average_score": 4.2, "feedback": "Technical feedback"}},
    "HR": {{"average_score": 3.5, "feedback": "HR feedback"}},
    "General": {{"average_score": 3.8, "feedback": "General feedback"}}
  }},
  "final_recommendation": {{
    "decision": "Hire",
    "justification": "Reason for decision"
  }}
}}

Return JSON ONLY - no markdown or explanations.
"""
    
    formatted_prompt = f"<s>[INST] {prompt.strip()} [/INST]"
    
    try:
        output = llm(
            formatted_prompt,
            max_tokens=2048,
            temperature=0.1,
            echo=False
        )
        
        report_text = output["choices"][0]["text"].strip()
        
        # Clean common markdown wrappers
        report_text = re.sub(r'^```json\s*', '', report_text)
        report_text = re.sub(r'```$\s*', '', report_text, flags=re.MULTILINE)
        
        # Extract JSON
        json_match = re.search(r'\{.*\}', report_text, re.DOTALL)
        if json_match:
            final_report = json.loads(json_match.group())
        else:
            final_report = json.loads(report_text)
            
        return final_report
        
    except Exception as e:
        return {
            "error": "Report generation failed",
            "details": str(e),
            "raw_output": report_text if 'report_text' in locals() else ""
        }
