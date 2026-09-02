from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "Hermes"
    environment: str = "development"

    secret_key: str = "change-me-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 12

    database_url: str = "sqlite:///./hermes.db"

    cors_origins: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:5500",
    ]

    demo_user_email: str = "demo@hermes.dev"
    demo_user_password: str = "demo-password-not-real"

    rate_limit_auth: str = "10/minute"


@lru_cache
def get_settings() -> Settings:
    return Settings()
