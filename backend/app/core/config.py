from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Env-driven app settings. See .env.example for the full list."""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    DATABASE_URL: str
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 480  # 8h — internal admin tool, no refresh flow; re-login next day
    FRONTEND_ORIGIN: str = "http://localhost:3000"
    UPLOAD_DIR: str = "uploads"  # relative to backend/ CWD — see app/main.py's static mount


settings = Settings()
