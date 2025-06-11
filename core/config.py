# core/config.py

from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # Версия приложения
    APP_VERSION: str = "0.1.0" # <-- ДОБАВЬ ЭТУ СТРОКУ

    # JWT Настройки
    SECRET_KEY: str = "your_super_secret_key_that_is_long_and_random"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    GROQ_API_KEY: str | None = None
    # Ollama (LLM) Настройки
    OLLAMA_HOST: str = "http://ollama"
    OLLAMA_PORT: int = 11434
    OLLAMA_DEFAULT_MODEL: str = "llama3:8b-instruct-q4_K_M"
    CHROMA_HOST: str = "chroma"
    CHROMA_PORT: int = 8000

    # Redis Настройки
    REDIS_HOST: str = "redis"
    REDIS_PORT: int = 6379

    # Модель для .env файла
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding='utf-8', extra='ignore')

settings = Settings()