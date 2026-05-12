import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
    
    @classmethod
    def get_gemini_key(cls):
        return cls.GEMINI_API_KEY or os.getenv("GEMINI_API_KEY", "")
