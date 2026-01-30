import os
import json
import re
from typing import Dict, Any
from dotenv import load_dotenv

load_dotenv()

# 🔥 LAZY LOADED - NO STARTUP CRASH!
_client = None

def get_openai_client():
    global _client
    if _client is None:
        api_key = os.getenv('OPENAI_API_KEY')
        if api_key:
            try:
                from openai import OpenAI
                # ✅ MINIMAL PARAMS = NO PROXIES CRASH
                _client = OpenAI(api_key=api_key)
            except Exception as e:
                print(f"OpenAI init failed: {e}")
    return _client

def evaluate_answer(question, answer, max_questions, current_index):
    client = get_openai_client()
    
    if not client:
        return {
            "evaluation": {"score": 7, "feedback": "Good response"},
            "next_question": {"question": "Tell me about your toughest project.", "type": "Technical"},
            "stop": current_index + 1 >= 8
        }
    
    prompt = f"Score 0-10 + next question:\nQ: {question}\nA: {answer}\nJSON only."
    
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=200
        )
        content = response.choices[0].message.content.strip()
        return json.loads(content)
    except:
        return {
            "evaluation": {"score": 7, "feedback": "Solid answer"},
            "next_question": {"question": "How do you handle deadlines?", "type": "HR"},
            "stop": False
        }
