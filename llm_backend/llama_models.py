# llama_models.py (ROOT LEVEL - next to app.py)
import os
import json
from pathlib import Path
from typing import Optional
from huggingface_hub import hf_hub_download
from llama_cpp import Llama
import logging

logger = logging.getLogger(__name__)
_model = None

def get_llm() -> Optional[Llama]:
    global _model
    if _model is not None:
        return _model
    
    model_path = "models/mistral-7b-instruct-v0.1.Q4_K_M.gguf"
    model_repo = "TheBloke/Mistral-7B-Instruct-v0.1-GGUF"
    
    if not Path(model_path).exists():
        print("📥 Downloading Mistral model (4GB, ~15 mins)...")
        os.makedirs("models", exist_ok=True)
        hf_hub_download(
            repo_id=model_repo,
            filename="mistral-7b-instruct-v0.1.Q4_K_M.gguf",
            local_dir="models",
            local_dir_use_symlinks=False
        )
        print("✅ Model downloaded!")
    
    try:
        print("🚀 Loading Mistral model...")
        _model = Llama(model_path=model_path, n_ctx=4096, n_threads=4, verbose=False)
        print("✅ Model loaded!")
        return _model
    except Exception as e:
        print(f"❌ Model error: {e}")
        return None
