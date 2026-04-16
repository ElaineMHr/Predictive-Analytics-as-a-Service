import os
from enum import Enum


class AppMode(str, Enum):
    FULL = "full"
    PORTFOLIO = "portfolio"


class Settings:
    APP_MODE: AppMode = AppMode(os.getenv("APP_MODE", "full"))

    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "")

    # Legacy MySQL vars (full mode only, kept for backwards compat)
    DB_HOST: str = os.getenv("DB_HOST", "localhost")
    DB_PORT: int = int(os.getenv("DB_PORT", "3306"))
    DB_NAME: str = os.getenv("DB_NAME", "")
    DB_USER: str = os.getenv("DB_USER", "")
    DB_PASS: str = os.getenv("DB_PASS", "")

    # Redis (full mode only)
    REDISSERVER: str = os.getenv("REDISSERVER", "redis://localhost:6379")

    # Storage
    MODEL_BASE_PATH: str = os.getenv("MODEL_BASE_PATH", "/tmp/models")
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "/tmp/uploads")

    # Frontend
    ALLOWED_ORIGINS: list[str] = os.getenv("ALLOWED_ORIGINS", "*").split(",")

    # Seeding
    SEED_TEST_DATA: bool = os.getenv("SEED_TEST_DATA", "false").lower() == "true"

    @property
    def is_portfolio(self) -> bool:
        return self.APP_MODE == AppMode.PORTFOLIO


settings = Settings()
