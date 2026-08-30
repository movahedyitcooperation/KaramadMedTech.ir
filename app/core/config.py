from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Env-driven app settings. See .env.example for the full list."""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    DATABASE_URL: str
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 480  # 8h — internal admin tool, no refresh flow; re-login next day
    FRONTEND_ORIGIN: str = "http://localhost:3000"
    UPLOAD_DIR: str = "uploads"  # relative to the repo-root CWD — see app/main.py's static mount

    # --- customer OTP auth (Phase 5) ----------------------------------------
    SMS_PROVIDER: str = "console"  # console | kavenegar | smsir
    SMS_API_KEY: str = ""
    SMS_TEMPLATE: str = ""
    EMAIL_PROVIDER: str = "console"  # console | smtp
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_ADDRESS: str = "no-reply@karamadmedtech.ir"
    OTP_TTL_SECONDS: int = 120
    OTP_MAX_ATTEMPTS: int = 5
    # Matches OtpLoginFlow.tsx's resend countdown exactly (120s) — if either
    # changes, change both, or the frontend's resend button either 429s the
    # backend or feels artificially slow.
    OTP_RESEND_COOLDOWN_SECONDS: int = 120
    OTP_MAX_REQUESTS_PER_CONTACT_PER_HOUR: int = 5
    OTP_MAX_REQUESTS_PER_IP_PER_HOUR: int = 20
    CUSTOMER_JWT_EXPIRE_DAYS: int = 30


settings = Settings()
