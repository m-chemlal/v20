from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List
import os


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=False,
        extra="allow"  # Allow extra fields from .env
    )
    # Database
    database_url: str = os.getenv("DATABASE_URL", "mysql+pymysql://root:momo12@localhost:3306/impacttracker?charset=utf8mb4")
    db_host: str = os.getenv("DB_HOST", "localhost")
    db_port: int = int(os.getenv("DB_PORT", "3306"))
    db_name: str = os.getenv("DB_NAME", "impacttracker")
    db_user: str = os.getenv("DB_USER", "root")
    db_password: str = os.getenv("DB_PASSWORD", "momo12")

    # JWT
    jwt_secret: str = os.getenv("JWT_SECRET", "your-super-secret-jwt-key-change-in-production-min-32-chars")
    refresh_token_secret: str = os.getenv("REFRESH_TOKEN_SECRET", "your-super-secret-refresh-token-key-change-in-production-min-32-chars")
    access_token_expire_minutes: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
    refresh_token_expire_days: int = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "30"))
    algorithm: str = "HS256"

    # Encryption (MySQL uses AES_ENCRYPT/AES_DECRYPT, not pgcrypto)
    enc_key: str = os.getenv("ENC_KEY", "enc_demo_key_ChangeMe!")

    # Password Policy
    password_min_length: int = int(os.getenv("PASSWORD_MIN_LENGTH", "12"))
    password_expire_days: int = int(os.getenv("PASSWORD_EXPIRE_DAYS", "90"))
    password_history_count: int = int(os.getenv("PASSWORD_HISTORY_COUNT", "5"))
    max_login_attempts: int = int(os.getenv("MAX_LOGIN_ATTEMPTS", "5"))
    lockout_duration_minutes: int = int(os.getenv("LOCKOUT_DURATION_MINUTES", "15"))

    # S3 Storage
    s3_endpoint_url: str = os.getenv("S3_ENDPOINT_URL", "https://s3.amazonaws.com")
    s3_access_key_id: str = os.getenv("S3_ACCESS_KEY_ID", "")
    s3_secret_access_key: str = os.getenv("S3_SECRET_ACCESS_KEY", "")
    s3_bucket_name: str = os.getenv("S3_BUCKET_NAME", "impacttracker-bucket")
    s3_region: str = os.getenv("S3_REGION", "us-east-1")

    # File Upload
    max_upload_size_mb: int = int(os.getenv("MAX_UPLOAD_SIZE_MB", "5"))
    allowed_file_types: str = os.getenv("ALLOWED_FILE_TYPES", "pdf,jpg,jpeg,png,xlsx")
    
    @property
    def allowed_file_types_list(self) -> List[str]:
        return [t.strip() for t in self.allowed_file_types.split(",")]

    # SMTP
    smtp_host: str = os.getenv("SMTP_HOST", "smtp.gmail.com")
    smtp_port: int = int(os.getenv("SMTP_PORT", "587"))
    smtp_user: str = os.getenv("SMTP_USER", "")
    smtp_password: str = os.getenv("SMTP_PASSWORD", "")
    smtp_from_email: str = os.getenv("SMTP_FROM_EMAIL", "noreply@impacttracker.org")
    smtp_from_name: str = os.getenv("SMTP_FROM_NAME", "ImpactTracker")
    smtp_use_tls: bool = os.getenv("SMTP_USE_TLS", "True").lower() == "true"

    # Application
    app_name: str = os.getenv("APP_NAME", "ImpactTracker API")
    app_env: str = os.getenv("APP_ENV", "development")
    debug: bool = os.getenv("DEBUG", "True").lower() == "true"
    api_v1_prefix: str = os.getenv("API_V1_PREFIX", "/api/v1")

    # Rate Limiting
    rate_limit_enabled: bool = os.getenv("RATE_LIMIT_ENABLED", "True").lower() == "true"
    rate_limit_per_hour: int = int(os.getenv("RATE_LIMIT_PER_HOUR", "100"))
    rate_limit_login_attempts: int = int(os.getenv("RATE_LIMIT_LOGIN_ATTEMPTS", "5"))
    rate_limit_login_window_minutes: int = int(os.getenv("RATE_LIMIT_LOGIN_WINDOW_MINUTES", "15"))

    # Redis
    redis_url: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")

    # CORS
    allowed_origins: str = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:5173")
    cors_origins: str = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:5173")
    
    @property
    def allowed_origins_list(self) -> List[str]:
        return [o.strip() for o in self.allowed_origins.split(",")]
    
    @property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.cors_origins.split(",")]


settings = Settings()

