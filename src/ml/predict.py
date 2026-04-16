"""
Standalone prediction function for portfolio mode (no Celery, no Redis).
Called directly from the API in a ThreadPoolExecutor thread.
"""
from __future__ import annotations

import json
import logging
from typing import Optional

import pandas as pd

logger = logging.getLogger(__name__)


def run_prediction(
    job_id: str,
    name: str,
    prediction_id: str,
    input_json: Optional[str] = None,
    input_uri: Optional[str] = None,
    problem_id: Optional[str] = None,
    model_id: str = "production",
) -> dict:
    """
    Core prediction logic. No Celery, no Redis. Pure function.
    Updates job status in DB directly.
    Returns result dict on success, raises on failure.
    """
    from db.db import update_job_status, update_prediction
    from mlcore.predict.predictor import predict

    try:
        update_job_status(job_id, status="running", progress=0, message="Starting prediction...")

        input_df = None
        if input_json is not None:
            raw = json.loads(input_json)
            input_df = pd.DataFrame(raw)

        X, y_pred, summary = predict(
            name=name,
            prediction_id=prediction_id,
            input_df=input_df,
            input_uri=input_uri,
            problem_id=problem_id,
            model_id=model_id,
        )

        result = {
            "prediction_id": prediction_id,
            "X": summary.get("X"),
            "y_pred": summary.get("y_pred"),
            "model_metadata": summary.get("model_metadata"),
        }
        update_job_status(
            job_id,
            status="completed",
            progress=100,
            message="Prediction completed successfully.",
            result={"prediction_id": prediction_id},
        )
        return result

    except Exception as ex:
        logger.exception("Prediction failed for job %s", job_id)
        update_prediction(prediction_id=prediction_id, status="failed")
        update_job_status(
            job_id,
            status="failed",
            message=str(ex),
            error=str(ex),
        )
        raise
