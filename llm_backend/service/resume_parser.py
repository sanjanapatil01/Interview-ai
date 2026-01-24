#!/usr/bin/env python
# coding: utf-8
import os
import re
import time
import pdfplumber
import docx
from pathlib import Path
from typing import Dict, Any, List
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def clean_spacing(text: str) -> str:
    """Fix camelCase spacing and normalize whitespace"""
    text = re.sub(r"([a-z])([A-Z])", r"\1 \2", text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def normalize_bullets(text: str) -> str:
    """Convert various bullet styles to standard bullets"""
    replacements = {
        '\uf0b7': '•', '': '•', '◦': '•', '▪': '•', '▫': '•',
        '•': '\n•', '*': '\n*', '-': '\n-'
    }
    for old, new in replacements.items():
        text = text.replace(old, new)
    return text

def extract_sections(text: str) -> Dict[str, str]:
    """Extract major resume sections using improved regex"""
    headers = [
        "Objective", "Summary", "Profile", "Education", "Experience", "Work Experience",
        "Projects", "Skills", "Technical Skills", "Achievements", "Awards",
        "Extra[-_]?Curricular", "Activities", "Certifications", "NLP", "PCMC", "SSLC"
    ]
    
    # More robust section detection
    pattern = r"(?mi)(?:" + "|".join(headers) + r")[\s:]*?(.*?)(?=(?:" + "|".join(headers) + r")[\s:]*?|$)"
    matches = re.finditer(pattern, text, re.DOTALL | re.IGNORECASE)
    
    sections = {}
    for match in matches:
        header = match.group(1).strip().lower().replace(" ", "_").replace("-", "_")
        content = clean_spacing(match.group(2).strip())
        sections[header] = content
    
    return sections

def parse_education_block(text: str) -> Dict[str, str]:
    """Parse education entries with | or comma separation"""
    # Handle common formats: "BE|8.5 CGPA|2021-2025|College Name"
    patterns = [
        r"([^|,\n]+?)\s*[|,\n]\s*([\d.]+(?:CGPA|%)?)?\s*[|,\n]\s*(\d{4}[-\d]*)?\s*[|,\n]*(.*)",
        r"(\w+)\s+([\d.]+)\s+(\d{4}-\d{4})\s+(.*)"
    ]
    
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return {
                "stream": match.group(1).strip(),
                "percentage": match.group(2).strip() if match.group(2) else None,
                "duration": match.group(3).strip() if match.group(3) else None,
                "institution": clean_spacing(match.group(4).strip()) if match.group(4) else None
            }
    return {"raw": text.strip()}

def parse_projects(text: str) -> List[Dict[str, str]]:
    """Improved project parsing"""
    lines = [clean_spacing(line.strip()) for line in text.split('\n') if line.strip()]
    projects = []
    current_project = {"title": "", "description": []}
    
    for line in lines:
        # Project title patterns
        if (re.match(r"^[A-Z][A-Za-z\s]+(?:\(.*\))?$", line) or 
            re.match(r"^\d+\.\s+[A-Z]", line) or
            len(line.split()[0]) <= 3 and line.split()[0].isupper()):
            
            if current_project["title"]:
                if current_project["description"]:
                    current_project["description"] = " ".join(current_project["description"]).strip()
                    projects.append(current_project)
            
            current_project = {"title": line.strip("•*- "), "description": []}
        else:
            current_project["description"].append(line)
    
    # Add last project
    if current_project["title"] and current_project["description"]:
        current_project["description"] = " ".join(current_project["description"]).strip()
        projects.append(current_project)
    
    return projects or [{"title": "Projects", "description": text.strip()}]

def parse_skills(text: str) -> Dict[str, List[str]]:
    """Parse skills with categories or flat list"""
    skills = {"misc": []}
    
    # Category: Skills section
    category_pattern = r"([A-Za-z\s]+?):\s*(.*?)(?=\n[A-Za-z\s]+:|\n\n|$)"
    categories = re.findall(category_pattern, text, re.DOTALL | re.IGNORECASE)
    
    for category, items in categories:
        category = category.strip().lower().replace(" ", "_")
        skill_list = [s.strip() for s in re.split(r'[,\n•*-]', items) if s.strip()]
        skills[category] = skill_list
    
    # Fallback: flat list
    if not any(skills.values()):
        flat_skills = [s.strip() for s in re.split(r'[,\n•*-]', text) if s.strip()]
        skills["misc"] = flat_skills
    
    return skills

def parse_bullets(text: str) -> List[str]:
    """Extract bullet points"""
    bullets = re.split(r'\n[•*-]\s*', text)
    return [clean_spacing(b.strip()) for b in bullets if b.strip()]

def parse_resume12(raw_text: str) -> Dict[str, Any]:
    """Main resume parsing function - Production ready"""
    if not raw_text or len(raw_text.strip()) < 50:
        return {"error": "Resume text too short or empty"}
    
    raw_text = normalize_bullets(raw_text)
    sections = extract_sections(raw_text)
    structured = {}
    
    # Objective/Summary
    for key in ["objective", "summary", "profile"]:
        if key in sections:
            structured["objective"] = sections[key][:500]  # Truncate long objectives
            break
    
    # Education
    structured["education"] = {}
    for edu_key in ["pcmc", "sslc", "bachelor", "be", "btech", "mtech"]:
        if edu_key in sections:
            structured["education"][edu_key] = parse_education_block(sections[edu_key])
    
    # Projects
    if "projects" in sections:
        structured["projects"] = parse_projects(sections["projects"])
    
    # Skills
    structured["skills"] = {}
    for skill_key in ["skills", "technical_skills", "nlp"]:
        if skill_key in sections:
            structured["skills"].update(parse_skills(sections[skill_key]))
    
    # Achievements & Activities
    if "achievements" in sections:
        structured["achievements"] = parse_bullets(sections["achievements"])[:10]
    if "extra_curricular_activities" in sections:
        structured["extra_curricular"] = parse_bullets(sections["extra_curricular_activities"])[:10]
    
    # Add raw text for LLM context
    structured["raw_text"] = raw_text[:4000]  # Truncate for LLM context window
    
    return structured

# ========== FILE EXTRACTION ==========
def extract_text_from_pdf(pdf_path: str) -> str:
    """Extract text from PDF with error handling"""
    try:
        with pdfplumber.open(pdf_path) as pdf:
            text = ""
            for page in pdf.pages:
                page_text = page.extract_text() or ""
                text += page_text + "\n"
            return text.strip()
    except Exception as e:
        logger.error(f"PDF extraction failed: {e}")
        return ""

def extract_text_from_docx(docx_path: str) -> str:
    """Extract text from DOCX"""
    try:
        doc = docx.Document(docx_path)
        full_text = [para.text for para in doc.paragraphs if para.text.strip()]
        return "\n".join(full_text)
    except Exception as e:
        logger.error(f"DOCX extraction failed: {e}")
        return ""

def extract_text(file_path: str) -> str:
    """Universal text extraction"""
    path = Path(file_path)
    if not path.exists():
        raise FileNotFoundError(f"File not found: {file_path}")
    
    if path.suffix.lower() == ".pdf":
        return extract_text_from_pdf(str(path))
    elif path.suffix.lower() in [".docx", ".doc"]:
        return extract_text_from_docx(str(path))
    else:
        raise ValueError(f"Unsupported file type: {path.suffix}. Only PDF/DOCX allowed")

# ========== USAGE EXAMPLE ==========
if __name__ == "__main__":
    # Test parsing
    sample_text = """
    Objective: Seeking Software Engineering role...
    Education: BE Computer Science | 8.5 CGPA | 2021-2025 | ABC College
    Projects:
    • E-commerce App (React, Node.js): Full-stack app...
    Skills: Python, JavaScript, React, Node.js
    """
    
    result = parse_resume12(sample_text)
    print(json.dumps(result, indent=2))
