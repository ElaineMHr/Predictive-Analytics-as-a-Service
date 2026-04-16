import os

try:
    from config import settings
except ImportError:
    from src.config import settings

CELERY_BROKER_URL = settings.REDISSERVER
CELERY_RESULT_BACKEND = settings.REDISSERVER

if settings.is_portfolio:
    celery_app = None
else:
    from celery import Celery
    celery_app = Celery(
        "celery",
        backend=CELERY_RESULT_BACKEND,
        broker=CELERY_BROKER_URL,
    )
