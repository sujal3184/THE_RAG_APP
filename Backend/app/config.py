from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # Database
    DATABASE_URL: str
    
    # JWT
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Optional Groq API Key
    GROQ_API_KEY: Optional[str] = None
    
    # Server
    PORT: int = 8000
    
    # Embeddings
    EMBEDDING_MODEL: str = "intfloat/e5-small-v2"
    EMBEDDING_DIMENSION: int = 384
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
