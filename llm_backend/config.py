import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    # Security
    SECRET_KEY = os.environ.get("SECRET_KEY") or "supersecretkey-change-in-prod"
    
    # Database (SQLite → PostgreSQL for production)
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        "DATABASE_URL", 
        "sqlite:///interview.db"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Redis - FIXED for Upstash (CRITICAL)
    UPSTASH_REDIS_REST_URL = os.environ.get("UPSTASH_REDIS_REST_URL")
    UPSTASH_REDIS_REST_TOKEN = os.environ.get("UPSTASH_REDIS_REST_TOKEN")
    
    # OpenAI
    OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")
    
    # LLM Model
    MODEL_PATH = os.environ.get("MODEL_PATH", "models/mistral-7b-instruct-v0.1.Q4_K_M.gguf")
    MODEL_REPO = os.environ.get("MODEL_REPO", "TheBloke/Mistral-7B-Instruct-v0.1-GGUF")
    
    # Flask Session (Redis-backed)
    SESSION_TYPE = "filesystem"  # Fallback
    SESSION_PERMANENT = False
    SESSION_USE_SIGNER = True
    SESSION_KEY_PREFIX = "interview_"

class DevelopmentConfig(Config):
    DEBUG = True
    TESTING = True
    SQLALCHEMY_DATABASE_URI = "sqlite:///interview_dev.db"

class ProductionConfig(Config):
    DEBUG = False
    TESTING = False
    
    # Force PostgreSQL in production
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        "DATABASE_URL",
        "postgresql://localhost/interview_prod"
    )
    
    # Validate critical vars
    @classmethod
    def validate(cls):
        required = ['SECRET_KEY', 'OPENAI_API_KEY', 'UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN']
        for key in required:
            if not os.environ.get(key):
                raise ValueError(f"Missing required env var: {key}")
        return True
