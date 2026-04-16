"""
Standalone training function for portfolio mode (no Celery, no Redis).
Called directly from the API in a ThreadPoolExecutor thread.
"""
from __future__ import annotations

import json
import logging
from typing import Literal

logger = logging.getLogger(__name__)


def run_training(
    job_id: str,
    name: str,
    problem_id: str,
    model_id: str,
    model_uri: str,
    algorithm: str = "auto",
    train_mode: Literal["fast", "balanced", "accurate"] = "balanced",
    evaluation_strategy: Literal["cv", "holdout"] = "cv",
    explanation: bool = True,
    test_size_ratio: float = 0.2,
    random_seed: int = 42,
) -> dict:
    """
    Core training logic. No Celery, no Redis. Pure function.
    Updates job status in DB directly.
    Returns result dict on success, raises on failure.
    """
    from db.db import update_job_status, update_model
    from mlcore.train.trainer import train

    try:
        update_job_status(job_id, status="running", progress=0, message="Starting training...")

        model_id_out, model_uri_out = train(
            name=name,
            problem_id=problem_id,
            model_id=model_id,
            model_uri=model_uri,
            algorithm=algorithm,
            train_mode=train_mode,
            evaluation_strategy=evaluation_strategy,
            explain=explanation,
            test_size_ratio=test_size_ratio,
            random_seed=random_seed,
        )

        result = {"model_id": model_id_out, "model_uri": model_uri_out}
        update_job_status(
            job_id,
            status="completed",
            progress=100,
            message="Training completed successfully.",
            result=result,
        )
        return result

    except Exception as ex:
        logger.exception("Training failed for job %s", job_id)
        update_model(model_id=model_id, status="failed")
        update_job_status(
            job_id,
            status="failed",
            message=str(ex),
            error=str(ex),
        )
        raise
