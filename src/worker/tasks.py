# add project root to path for celery to work inside Docker
import sys  # nopep8
import os
import time  # nopep8
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))  # nopep8
from db.db import create_model, update_model, update_prediction

from celery_handler import celery_app
from mlcore.profile.profiler import suggest_profile
from mlcore.predict.predictor import predict
from mlcore.train.trainer import train
from celery import states
import traceback
from time import sleep
import pandas as pd
from typing import Literal
import json
import redis


REDIS_URL = os.getenv("REDISSERVER", "redis://redis_server:6379")
CHANNEL = "jobs:global" # f"jobs:user:{user_id}" to add later -> Channel per user

def publish_job_event(event: str, payload: dict) -> None:
    redis_con = redis.Redis.from_url(REDIS_URL, decode_responses=True)
    redis_con.publish(CHANNEL, json.dumps({"event": event, "job": payload}))


@celery_app.task(name="hello.task", bind=True)
def hello_world(self, name):
    try:
        # if name is error
        if name == "error":
            # will raise ZeroDivisionError
            a, b = 1, 0
            a = a / b

        # update task state every 1 second
        for i in range(10):
            sleep(1)
            self.update_state(state="PROGRESS", meta={"done": i, "total": 10})

        # return result
        return {"result": f"hello {name}"}

    # if any error occurs
    except Exception as ex:
        # update task state to failure
        self.update_state(
            state=states.FAILURE,
            meta={
                "exc_type": type(ex).__name__,
                "exc_message": traceback.format_exc().split("\n"),
            },
        )

        # raise exception
        raise ex


@celery_app.task(name="train.task", bind=True)
def train_task(
    self,
    name: str,
    problem_id: str,
    model_id: str,
    model_uri: str,
    algorithm: str = "auto",
    train_mode: Literal["fast", "balanced", "accurate"] = "balanced",
    evaluation_strategy: Literal["cv", "holdout"] = "cv",
    explain: bool = True,
    test_size_ratio: float = 0.2,
    random_seed: int = 42,
):
    """
    Celery wrapper around mlcore.train.
    This is what FastAPI will call asynchronously for train.
    """
    try:
        self.update_state(state="STARTED", meta={"problem_id": problem_id})

        # Call core training logic
        model_id, model_uri = train(
            name=name,
            problem_id=problem_id,
            model_id=model_id,
            model_uri=model_uri,
            algorithm=algorithm,
            train_mode=train_mode,
            evaluation_strategy = evaluation_strategy,
            explain=explain,
            test_size_ratio=test_size_ratio,
            random_seed=random_seed,
        )

        publish_job_event("job.completed", {
            "type": "train",
            "status": "completed",
            "problem_id": problem_id,
            "model_id": model_id,
            "model_uri": model_uri,
            "task_id": self.request.id,
            "ts": time.time(),
        })

        # IF DB jobs table added -> update job status here
        return {"model_id": model_id, "model_uri": model_uri}

    except Exception as ex:
        # update Celery state and meta to FAILURE
        self.update_state(
            state=states.FAILURE,
            meta={
                "exc_type": type(ex).__name__,
                "exc_message": traceback.format_exc().split("\n"),
            },
        )
        update_model(
            model_id=model_id,
            status="failed",
        )

        publish_job_event("job.failed", {
            "type": "train",
            "status": "failed",
            "problem_id": problem_id,
            "model_id": model_id,
            "model_uri": model_uri,
            "task_id": self.request.id,
            "error": str(ex),
            "ts": time.time(),
        })

        # IF DB jobs table added -> update job status here
        raise

@celery_app.task(name="predict.task", bind=True)
def predict_task(
    self,
    name: str,
    prediction_id: str,
    input_json: str | None = None,
    input_uri: str | None = None,
    problem_id: str | None = None,
    model_id: str = "production",
):
    """
    Celery wrapper around mlcore.predict.
    """
    try:
        self.update_state(state="STARTED", meta={"problem_id": problem_id})

        input_df = None
        if input_json is not None:
            try:
                raw = json.loads(input_json)
                input_df = pd.DataFrame(raw)
            except json.JSONDecodeError:
                raise ValueError("Input string is not valid JSON.")

        X, y_pred, summary = predict(
            name=name,
            prediction_id=prediction_id,
            input_df=input_df,
            input_uri=input_uri,
            problem_id=problem_id,
            model_id=model_id,
        )

        publish_job_event("job.completed", {
            "type": "predict",
            "status": "completed",
            "prediction_id": prediction_id,
            "problem_id": problem_id,
            "model_id": model_id,
            "task_id": self.request.id,
            "ts": time.time(),
        })

        return {
            "X": summary["X"],
            "y_pred": summary["y_pred"],
            "model_metadata": summary["model_metadata"],
        }

    except Exception as ex:
        self.update_state(
            state=states.FAILURE,
            meta={
                "exc_type": type(ex).__name__,
                "exc_message": traceback.format_exc().split("\n"),
            },
        )
        update_prediction(
            prediction_id=prediction_id,
            status="failed",
        )

        publish_job_event("job.completed", {
            "type": "predict",
            "status": "failed",
            "prediction_id": prediction_id,
            "problem_id": problem_id,
            "model_id": model_id,
            "task_id": self.request.id,
            "ts": time.time(),
        })

        raise


# @celery_app.task(name="profile.task", bind=True)
# def suggest_profile_task(self, df_dict: dict | pd.DataFrame):
#     """
#     Celery wrapper for suggest_profile(df).
#     df_dict = DataFrame serialized as dict-of-lists
#     """
#     try:
#         self.update_state(state="STARTED")

#         if isinstance(df, dict):
#             df = pd.DataFrame(df)

#         profile = suggest_profile(df)

#         return profile

#     except Exception as ex:
#         self.update_state(
#             state=states.FAILURE,
#             meta={
#                 "exc_type": type(ex).__name__,
#                 "exc_message": traceback.format_exc().split("\n"),
#             },
#         )
#         raise
