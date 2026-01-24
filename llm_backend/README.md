
# Interview.ai– AI Interview Evaluation Service

Interview.ai is a Python-based AI interview engine responsible for conducting interviews, evaluating candidate answers, generating follow-up questions, and producing structured interview reports.
It integrates Large Language Models, Redis for session management, and Flask APIs for seamless communication with the frontend.

---

## Project Structure

```
AUTO_INTERVIEW/
│
├── service/
│   ├── ai_model.py
│   ├── llm_model.py
│   ├── interview_session.py
│
├── models/
│   ├── models.py
│
├── uploads/
│
├── migrations/
├── instance/
│
├── app.py
├── config.py
├── requirements.txt
├── README.md
├── .env
└── .gitignore
```

---

## Prerequisites

* Python 3.10 or later
* Docker (for Redis)
* Redis (via Docker container)
* Virtual environment support (recommended)
* LLM runtime (local or API-based, depending on configuration)

---

## Environment Configuration

Create a `.env` file in the root directory.

### `.env`

```env
FLASK_ENV=development
FLASK_APP=app.py


```


---

## Redis Setup (Docker)

Run Redis using Docker:

```bash
docker run -d \
  --name auto_interview_redis \
  -p 6379:6379 \
  redis:latest
```

Verify Redis is running:

```bash
docker ps
```

---

## Python Setup

Create and activate a virtual environment:

```bash
python -m venv venv
source venv/bin/activate   # Linux / Mac
venv\Scripts\activate      # Windows
```

Install dependencies:

```bash
pip install -r requirements.txt
```

---

## Running the Application

Start the Flask server:

```bash
python app.py
```

The service will be available at:

```
http://127.0.0.1:5000
```

---


## Key Features

* AI-driven interview question flow
* Automatic answer evaluation and scoring
* Resume-aware follow-up questions
* Redis-backed session persistence
* Time-based interview control
* Structured final interview reports
* Scalable microservice architecture

---



## Development Notes

* AI evaluation logic is in `service/ai_model.py`
* Session lifecycle handled in `interview_session.py`
* LLM prompts and evaluation rules are configurable
* Designed to integrate with external Node.js backend

---

## License

This project is intended for educational and professional use.
All rights reserved.

---
## Team : SuPrazo Technologies 
< Coded By Suhen.M.G and Sanjana.M.Patil />
