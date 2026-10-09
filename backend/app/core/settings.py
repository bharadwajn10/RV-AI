from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    SECRET_KEY: str = "dev_secret_key"
    USER_DB_URL: str = "sqlite:///./data/user.db"
    COURSE_DB_URL: str = "sqlite:///./data/course.db"
    UPLOAD_DIR: str = "./data/uploads"
    LOCAL_URL: str = "http://127.0.0.1:8081/v1"
    LOCAL_MODEL: str = "qwen3.5-4b"
    LOCAL_REASON_ESCALATE_TO_AGNES: bool = True
    AGNES_API_KEY: str = ""
    AGNES_BASE_URL: str = "https://apihub.agnes-ai.com/v1"
    AGNES_TEXT_MODEL: str = "agnes-3.0-flash"
    AGNES_RPM: int = 10
    AGNES_INTERACTIVE_RESERVE: int = 6
    CORS_ORIGINS: str = "http://localhost:5173"
    DEMO_MODE: bool = True

    class Config:
        env_file = ".env"
        extra = "ignore"

@lru_cache()
def get_settings() -> Settings:
    return Settings()
