from openai import OpenAI
import json
import re
import os

client = OpenAI(
    api_key=os.getenv('OPENAI_API_KEY')
)

def evaluate_answer( question, answer, max_questions, current_index):
    prompt = f"""
You are an experienced technical interviewer.
Evaluate the candidate's answer based on their resume and the asked question.




Question:
{question}

Answer:
{answer}

Instructions:
1. Give a score from 0 to 10 based on correctness, clarity, and relevance.
2. Provide short constructive feedback (1-2 sentences).
3. Suggest the next question (related to the resume or previous question).
4. If {current_index+1} >= {max_questions}, then stop the interview.

Return JSON only in this exact format:
{{
  "evaluation": {{
    "score": 0-10,
    "feedback": "short feedback"
  }},
  "next_question": {{
    "question": "text of the next question",
    "type": "Technical|HR|General"
  }},
  "stop": true|false
}}
"""

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "system", "content": "You are a helpful interviewer AI."},
                  {"role": "user", "content": prompt}],
        temperature=0.3 
    )

    
    try:
        result = json.loads(response.choices[0].message.content)
    except Exception as e:
        result = {
            "evaluation": {"score": 0, "feedback": "Error parsing AI response."},
            "next_question": {"question": "Please continue.", "type": "General"},
            "stop": False
        }
    return result

def clean_report(raw_data):
    sections = re.split(r'\n## ', raw_data)  

    report_dict = {}

    for sec in sections:
        if sec.strip():
            lines = sec.strip().split('\n', 1)
            header = lines[0].strip()
            content = lines[1].strip() if len(lines) > 1 else ''
            report_dict[header] = content
    result=json.loads(report_dict) 
    return result
      


import json

"""
# def generate_final_report(session_data):
#     prompt = f""# You are an AI interview evaluator. You are given a candidate’s interview session data:
# {session_data}

# Your task is to generate a structured final report in **JSON format only**. 
# The JSON must have the following structure:

# {{
#   "candidate_overview": {{
#     "name": "<candidate name>",
#     "email": "<candidate email>",
#     "summary": "<brief summary based on resume>"
#   }},
#   "overall_performance": {{
#     "average_score": <average score>,
#     "performance_level": "<Beginner|Intermediate|Advanced>",
#     "summary": "<2-3 line summary of overall performance>"
#   }},
#   "strengths": ["<bullet points of strengths>"],
#   "weaknesses": ["<bullet points of weaknesses>"],
#   "section_wise_evaluation": {{
#     "Technical": {{
#       "average_score": <score>,
#       "feedback": "<short feedback>"
#     }},
#     "HR": {{
#       "average_score": <score>,
#       "feedback": "<short feedback>"
#     }},
#     "General": {{
#       "average_score": <score>,
#       "feedback": "<short feedback>"
#     }}
#   }},
#   "question_wise_breakdown": [
#     {{
#       "question": "<question text>",
#       "answer": "<candidate answer>",
#       "score": <score>,
#       "feedback": "<feedback>",
#       "type": "<Technical|HR|General>"
#     }}
#   ],
#   "final_recommendation": {{
#     "decision": "<Hire|Consider with Training|Not Recommended>",
#     "justification": "<1-2 sentence justification>"
#   }}
# }}

# Return the JSON **only**, do not add any text or explanation outside the JSON.
# ""

#     response = client.chat.completions.create(
#         model="gpt-4o-mini",
#         messages=[{"role": "user", "content": prompt}]
#     )

#     content = response.choices[0].message.content.strip()

#     try:
#         result = json.loads(content)
#     except json.JSONDecodeError:
#         # fallback if AI fails to generate valid JSON
#         result = {"error": "AI did not return valid JSON", "raw_output": content}

#     return result
"""

from llama_cpp import Llama
from flask import jsonify
llm=Llama(model_path='models/mistral-7b-instruct-v0.1.Q4_K_M.gguf',n_ctx=4096)


def generate_final_report(candidate_session_data):

    prompt = f"""
        You are an AI interview evaluator and a Senior Hiring Manager. Your task is to generate a structured, objective, and detailed final report in **JSON format ONLY**.

        The quality of this report is critical for filtering candidates; therefore, all scores and feedback must be rigorously justified based *only* on the provided interview data and resume claims.

        # CANDIDATE INTERVIEW SESSION DATA:
        {candidate_session_data}

        # SCORING CRITERIA (1-5 Scale):
        - **Score 1 (Poor):** Demonstrates fundamental lack of knowledge.
        - **Score 3 (Competent):** Demonstrates solid, but surface-level, understanding.
        - **Score 5 (Expert):** Demonstrates mastery, critical thinking, and real-world application.
        - *Use scores of 2 or 4 for intermediate performance levels.*

        # EVALUATION INSTRUCTIONS:
        1.  **Data Extraction:** Accurately pull 'name', 'email', and 'summary' details from the session data/resume embedded in the CANDIDATE INTERVIEW SESSION DATA.
        2.  **Section Evaluation:** You must internally analyze every single Q&A turn to determine its type (Technical, HR, or General) and assign it a **Score (1-5)** based on the SCORING CRITERIA.
        3.  **Section Averages:** Calculate the simple arithmetic mean for each section (`Technical`, `HR`, `General`) based on the scores assigned internally.
        4.  **Overall Performance:**
            * Calculate the final **`average_score`** across *all* scored questions.
            * Determine **`performance_level`** based on the final average score:
                * Average Score < 2.5: **Beginner**
                * Average Score 2.5 - 3.9: **Intermediate**
                * Average Score ≥ 4.0: **Advanced**
        5.  **Strengths/Weaknesses:** List points that are **actionable** and tied directly to recurring patterns in the internal scoring (e.g., specific technology mastery vs. lack of architectural detail).
        6.  **Final Recommendation:** Base the `decision` strictly on the `overall_performance` level and the balance of strengths vs. weaknesses.
            * Advanced: **Hire**
            * Intermediate: **Consider with Training**
            * Beginner: **Not Recommended**

        # FINAL REPORT STRUCTURE (JSON FORMAT ONLY):
        {{
          "candidate_overview": {{
            "name": "<candidate name>",
            "email": "<candidate email>",
            "summary": "<brief summary based on resume>"
          }},
          "overall_performance": {{
            "average_score": <overall average score to 1 decimal place>,
            "performance_level": "<Beginner|Intermediate|Advanced>",
            "summary": "<2-3 line executive summary of overall performance>"
          }},
          "strengths": ["<bullet points of key strengths>"],
          "weaknesses": ["<bullet points of key weaknesses>"],
          "section_wise_evaluation": {{
            "Technical": {{
              "average_score": <section average score to 1 decimal place>,
              "feedback": "<short feedback on technical depth and problem-solving ability>"
            }},
            "HR": {{
              "average_score": <section average score to 1 decimal place>,
              "feedback": "<short feedback on behavioral maturity and decision-making>"
            }},
            "General": {{
              "average_score": <section average score to 1 decimal place>,
              "feedback": "<short feedback on career clarity and industry knowledge>"
            }}
          }},
          "final_recommendation": {{
            "decision": "<Hire|Consider with Training|Not Recommended>",
            "justification": "<1-2 sentence justification based on overall performance and critical areas>"
          }}
        }}

        Return the JSON **only**, do not add any text or explanation outside the JSON.
        """
    formatted_prompt = f"<s>[INST] {prompt.strip()} [/INST]"

    try:
        output = llm(
            formatted_prompt, 
            max_tokens=2048, 
            temperature=0.01, 
            stream=False,
            echo=False
        )
        
        report_text = output["choices"][0]["text"].strip()
        
        if report_text.startswith("```json"):
            report_text = report_text.strip("```json").strip()
        
        final_report = json.loads(report_text)
        return final_report

    except json.JSONDecodeError as e:
        return {
            "error": "Failed to generate valid JSON report.",
            "llm_output": report_text,
            "details": str(e)
        }
    except Exception as e:
        return {"error": f"LLM generation failed: {str(e)}"}