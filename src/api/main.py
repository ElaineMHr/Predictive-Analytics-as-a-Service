import shutil
import uuid
import tempfile
from concurrent.futures import ThreadPoolExecutor
from fastapi import FastAPI, File, Form, HTTPException, Request, Query, UploadFile
from fastapi.responses import RedirectResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
import starlette.status as status
from typing import Any, Literal, Optional
import logging
import json
import time
import os
from pathlib import Path
import pandas as pd
from io import BytesIO
from pydantic import BaseModel

try:
    from config import settings
except ImportError:
    from src.config import settings

from db.init_db import main as init_db_main
from db.db import (
    create_dataset, create_dataset_version, create_ml_problem, create_model,
    create_prediction, create_job, db_get_dataset, db_get_dataset_version,
    delete_dataset, delete_dataset_version, delete_ml_problem, delete_model,
    delete_prediction, get_dashboard_stats, get_dataset_versions_all_joined,
    get_datasets, get_dataset_versions, get_ml_predictions_all_joined,
    get_ml_problem, get_ml_problems, get_ml_problems_all_joined, get_model,
    get_models, get_models_all_joined, get_prediction, get_predictions,
    get_predictions_all_joined, set_model_to_production, update_dataset,
    update_dataset_version, update_ml_problem, update_model, update_prediction,
    update_job_status, get_job,
)
from mlcore.profile.profiler import suggest_profile, suggest_schema
from mlcore.io.data_reader import get_dataframe_from_csv, preprocess_dataframe, get_semantic_types
from api.events import router as events_router

logger = logging.getLogger(__name__)

# ──────────────────────────────────────────────────────────────────────────────
# App setup
# ──────────────────────────────────────────────────────────────────────────────

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(events_router, prefix="/events")

# Thread pool for synchronous execution in portfolio mode
_executor = ThreadPoolExecutor(max_workers=2)


# ──────────────────────────────────────────────────────────────────────────────
# Storage helpers
# ──────────────────────────────────────────────────────────────────────────────

def _check_storage_writable() -> None:
    for path, name in [
        (settings.MODEL_BASE_PATH, "MODEL_BASE_PATH"),
        (settings.UPLOAD_DIR, "UPLOAD_DIR"),
    ]:
        os.makedirs(path, exist_ok=True)
        try:
            test_file = os.path.join(path, ".write_test")
            with open(test_file, "w") as f:
                f.write("ok")
            os.remove(test_file)
        except OSError as e:
            raise RuntimeError(
                f"Storage directory {name}={path!r} is not writable: {e}. "
                "Check directory permissions or update the env var."
            )


# ──────────────────────────────────────────────────────────────────────────────
# Startup
# ──────────────────────────────────────────────────────────────────────────────

@app.on_event("startup")
def on_startup():
    delay = int(os.getenv("DELAY_DB_CONN_ON_STARTUP", 0))
    if delay > 0:
        logger.warning(f"Waiting {delay}s for DB to start...")
        time.sleep(delay)

    init_db_main(apply_seed=False)
    _check_storage_writable()

    if settings.SEED_TEST_DATA:
        try:
            if settings.is_portfolio:
                from db.seed_portfolio import run as seed_run
                seed_run()
            else:
                test_data_path = os.getenv("TEST_DATA_PATH", "db/test_db.txt")
                from db.init_test_db import seed_db
                seed_db(test_data_path, reset=True)
        except Exception as e:
            logger.error("Failed to seed the DB: %s", e)


# ──────────────────────────────────────────────────────────────────────────────
# Health
# ──────────────────────────────────────────────────────────────────────────────

@app.get("/health")
async def health_check():
    db_ok = True
    db_error = None
    try:
        from db.db import get_conn
        conn = get_conn()
        with conn.cursor() as cur:
            cur.execute("SELECT 1")
        conn.close()
    except Exception as e:
        db_ok = False
        db_error = str(e)

    return {
        "status": "ok" if db_ok else "degraded",
        "mode": settings.APP_MODE,
        "database": "connected" if db_ok else f"error: {db_error}",
        "storage": {
            "models": settings.MODEL_BASE_PATH,
            "uploads": settings.UPLOAD_DIR,
        },
    }


# ──────────────────────────────────────────────────────────────────────────────
# Root / Celery check (full mode only)
# ──────────────────────────────────────────────────────────────────────────────

def get_domain(request: Request):
    scheme = request.url.scheme
    hostname = request.url.hostname
    port = request.url.port
    default_ports = {"http": 80, "https": 443}
    domain = f"{scheme}://{hostname}"
    if port != default_ports.get(scheme):
        domain += f":{port}"
    return domain


@app.get("/")
async def read_root():
    if settings.is_portfolio:
        return {"mode": "portfolio", "docs": "/docs", "health": "/health"}
    from celery_handler import celery_app
    logger.info("Sending celery task 'hello.task'")
    task = celery_app.send_task("hello.task", args=["world"])
    return RedirectResponse(url=f"/celery/{task.id}", status_code=status.HTTP_303_SEE_OTHER)


@app.get("/celery/{id}")
def check_task(id: str):
    if settings.is_portfolio:
        raise HTTPException(status_code=404, detail="Celery not available in portfolio mode")
    from celery_handler import celery_app
    task = celery_app.AsyncResult(id)
    if task.state == "SUCCESS":
        return {"status": task.state, "result": task.result, "task_id": id}
    elif task.state == "FAILURE":
        response = json.loads(
            task.backend.get(task.backend.get_key_for_task(task.id)).decode("utf-8")
        )
        del response["children"]
        del response["traceback"]
        return response
    else:
        return {"status": task.state, "result": task.info, "task_id": id}


# ──────────────────────────────────────────────────────────────────────────────
# Jobs polling endpoint (portfolio mode)
# ──────────────────────────────────────────────────────────────────────────────

@app.get("/jobs/{job_id}/status")
async def get_job_status(job_id: str):
    job = get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return {
        "job_id": job_id,
        "status": job["status"],
        "progress": job.get("progress", 0),
        "message": job.get("message"),
        "result": job.get("result"),
    }


# ──────────────────────────────────────────────────────────────────────────────
# Dataset endpoints
# ──────────────────────────────────────────────────────────────────────────────

@app.post("/dataset")
async def post_dataset(name: str):
    dataset_id = create_dataset(name)
    return dataset_id


@app.get("/datasets")
async def get_list_datasets(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    sort: str = Query("created_at"),
    dir: Literal["asc", "desc"] = Query("desc"),
    q: Optional[str] = Query(None),
    id: Optional[str] = Query(None),
    name: Optional[str] = Query(None),
):
    items, total = get_datasets(page=page, size=size, sort=sort, dir=dir, q=q, id=id, name=name)
    total_pages = int((total + size - 1) / size) if size > 0 else 1
    return {"items": items, "page": page, "size": size, "total": total,
            "total_pages": total_pages, "sort": sort, "dir": dir, "q": q, "id": id, "name": name}


@app.get("/dataset/{dataset_id}")
async def get_dataset(dataset_id: str):
    return db_get_dataset(dataset_id)


@app.patch("/dataset/{dataset_id}")
async def patch_dataset(dataset_id: str, name: str):
    return update_dataset(dataset_id, name)


@app.delete("/dataset/{dataset_id}")
async def delete_dataset_ep(dataset_id: str):
    return delete_dataset(dataset_id)


# ──────────────────────────────────────────────────────────────────────────────
# Dataset version endpoints
# ──────────────────────────────────────────────────────────────────────────────

UPLOAD_DIR = Path(settings.UPLOAD_DIR)

def save_file(file: UploadFile):
    if file.filename == "":
        raise HTTPException(status_code=400, detail="No file selected")
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="File must be a CSV")
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    file_path = UPLOAD_DIR / f"{uuid.uuid4()}_{file.filename}"
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        return str(file_path), file.filename
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {e}")


@app.post("/datasetVersion")
async def post_dataset_version(
    dataset_id: str = Form(...),
    name: str = Form(...),
    file: Optional[UploadFile] = File(None),
    file_id: Optional[str] = Form(None),
):
    if not file and not file_id:
        return {}
    if file:
        uri, filename = save_file(file)
        if not uri:
            return {}
    if file_id:
        return {}

    df = get_dataframe_from_csv(uri)
    profile_json = suggest_profile(df)
    schema_json = suggest_schema(df)

    dataset_version_id = create_dataset_version(
        dataset_id=dataset_id, uri=uri, filename=filename, name=name,
        schema_json=schema_json, profile_json=profile_json,
    )
    return dataset_version_id


@app.get("/datasetVersion/{version}")
async def get_dataset_version(version: str):
    return db_get_dataset_version(version)


@app.patch("/datasetVersion/{version}")
async def patch_dataset_version(version: str, name: str):
    return update_dataset_version(version, name)


class Exclude(BaseModel):
    exclude: list[str]


@app.patch("/datasetVersion/{version}/exclude_suggestions")
def update_exclude_suggestions(version: str, exclude_body: Exclude) -> bool:
    dataset_version = db_get_dataset_version(version)
    if not dataset_version:
        raise HTTPException(404, "Dataset version not found")

    raw_profile = dataset_version.get("profile_json")
    if not raw_profile:
        raise HTTPException(404, "Dataset Version profile not found")

    profile = json.loads(raw_profile) if isinstance(raw_profile, str) else raw_profile
    profile["exclude_suggestions"] = exclude_body.exclude
    return update_dataset_version(version, profile_json=profile)


@app.post("/datasetVersion/{version}/profile")
def reset_dataset_version_profile(version: str) -> bool:
    dataset_version = db_get_dataset_version(version)
    if not dataset_version:
        raise HTTPException(404, "Dataset version not found")

    uri = dataset_version.get("uri")
    if not uri:
        raise HTTPException(404, "Dataset version URI not found")

    df = get_dataframe_from_csv(uri)
    profile_json = suggest_profile(df)
    schema_json = suggest_schema(df)
    return update_dataset_version(version, profile_json=profile_json, schema_json=schema_json)


@app.delete("/datasetVersion/{version}")
async def delete_dataset_version_ep(version: str):
    return delete_dataset_version(version)


@app.get("/datasetVersions/{dataset_id}")
async def get_list_dataset_versions(
    dataset_id: str,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    sort: str = Query("created_at"),
    dir: Literal["asc", "desc"] = Query("desc"),
    q: Optional[str] = Query(None),
    id: Optional[str] = Query(None),
):
    items, total = get_dataset_versions(dataset_id=dataset_id, page=page, size=size,
                                        sort=sort, dir=dir, q=q, id=id)
    total_pages = int((total + size - 1) / size) if size > 0 else 1
    return {"items": items, "page": page, "size": size, "total": total,
            "total_pages": total_pages, "sort": sort, "dir": dir, "q": q, "id": id}


# ──────────────────────────────────────────────────────────────────────────────
# ML Problem endpoints
# ──────────────────────────────────────────────────────────────────────────────

@app.get("/datasetVersionProblems/{dataset_version_id}")
async def get_list_problems(
    dataset_version_id: str,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    sort: str = Query("created_at"),
    dir: Literal["asc", "desc"] = Query("desc"),
    q: Optional[str] = Query(None),
    id: Optional[str] = Query(None),
    task: Optional[str] = Query(None),
    target: Optional[str] = Query(None),
    name: Optional[str] = Query(None),
):
    items, total = get_ml_problems(dataset_version_id=dataset_version_id, page=page,
                                   size=size, sort=sort, dir=dir, q=q, id=id,
                                   task=task, target=target, name=name)
    total_pages = int((total + size - 1) / size) if size > 0 else 1
    return {"items": items, "page": page, "size": size, "total": total,
            "total_pages": total_pages, "sort": sort, "dir": dir, "q": q, "id": id,
            "task": task, "target": target, "name": name}


@app.post("/profile/{dataset_version_id}")
async def post_profile(dataset_version_id: str):
    return {}


@app.post("/problem")
async def post_problem(
    target: str,
    name: str,
    task: Literal["classification", "regression"],
    dataset_version_id: int | str = "latest",
):
    dataset_version = await get_dataset_version(dataset_version_id)
    raw_profile = dataset_version.get("profile_json")
    profile = json.loads(raw_profile) if isinstance(raw_profile, str) and raw_profile else {}
    uri = dataset_version.get("uri")
    if not uri:
        raise HTTPException(status_code=400, detail="Dataset version has no URI")
    df = get_dataframe_from_csv(uri)
    X, y = preprocess_dataframe(df, target, profile)
    semantic_types = get_semantic_types(X, profile)
    ml_problem_id = create_ml_problem(
        target=target, task=task, dataset_version_id=dataset_version_id,
        name=name, semantic_types=semantic_types,
    )
    return ml_problem_id


@app.get("/problem/{problem_id}")
async def get_problem(problem_id: str):
    return get_ml_problem(problem_id)


@app.patch("/problem/{problem_id}")
async def patch_ml_problem(problem_id: str, name: str):
    return update_ml_problem(problem_id, name)


@app.delete("/problem/{problem_id}")
async def delete_ml_problem_ep(problem_id: str):
    return delete_ml_problem(problem_id)


class FeatureStrategy(BaseModel):
    include: list[str] | None = None
    exclude: list[str] | None = None


@app.patch("/problem/{problem_id}/feature_strategy")
def update_feature_strategy(problem_id: str, feature_strategy_body: FeatureStrategy) -> bool:
    problem = get_ml_problem(problem_id)
    if not problem:
        raise HTTPException(404, detail="ML Problem not found")

    raw_feature_strategy = problem.get("feature_strategy_json")
    feature_strategy = {}
    if raw_feature_strategy:
        feature_strategy = json.loads(raw_feature_strategy)
        if feature_strategy == "auto":
            feature_strategy = {}

    if feature_strategy_body.include is not None:
        feature_strategy["include"] = feature_strategy_body.include
    if feature_strategy_body.exclude is not None:
        feature_strategy["exclude"] = feature_strategy_body.exclude
    if feature_strategy.get("include") == []:
        feature_strategy.pop("include", None)

    if feature_strategy == {}:
        return update_ml_problem(problem_id, feature_strategy_json="auto")
    return update_ml_problem(problem_id, feature_strategy_json=feature_strategy)


@app.post("/problem/{problem_id}/feature_strategy/reset")
def reset_feature_strategy(problem_id: str) -> bool:
    return update_ml_problem(problem_id, feature_strategy_json="auto")


# ──────────────────────────────────────────────────────────────────────────────
# Training endpoint
# ──────────────────────────────────────────────────────────────────────────────

@app.post("/train")
async def post_train(
    name: str,
    problem_id: str,
    algorithm: str = "auto",
    train_mode: Literal["fast", "balanced", "accurate"] = "balanced",
    evaluation_strategy: Literal["cv", "holdout"] = "cv",
    explanation: bool = True,
):
    model_id, model_uri = create_model(
        problem_id=problem_id,
        algorithm=algorithm,
        train_mode=train_mode,
        evaluation_strategy=evaluation_strategy,
        name=name,
        status="training",
    )
    job_id = create_job(job_type="train", problem_id=problem_id, model_id=model_id, status="queued")

    if settings.is_portfolio:
        from ml.train import run_training

        def _run():
            run_training(
                job_id=job_id,
                name=name,
                problem_id=problem_id,
                model_id=model_id,
                model_uri=model_uri,
                algorithm=algorithm,
                train_mode=train_mode,
                evaluation_strategy=evaluation_strategy,
                explanation=explanation,
            )

        _executor.submit(_run)
        return {"job_id": job_id, "model_id": model_id, "status": "queued"}

    else:
        from celery_handler import celery_app
        logger.info("Sending celery task 'train.task'")
        task = celery_app.send_task(
            "train.task",
            args=[name, problem_id, model_id, model_uri, algorithm, train_mode, evaluation_strategy, explanation],
        )
        return RedirectResponse(url=f"/celery/{task.id}", status_code=status.HTTP_303_SEE_OTHER)


# ──────────────────────────────────────────────────────────────────────────────
# Prediction endpoint
# ──────────────────────────────────────────────────────────────────────────────

@app.post("/predict")
async def post_predict(
    name: str = Form(...),
    input_csv: Optional[UploadFile] = File(None),
    input_json: Optional[str] = Form(None),
    input_uri: Optional[str] = Form(None),
    problem_id: Optional[str] = Form(None),
    model_id: str = Form("production"),
):
    if model_id == "production" and not problem_id:
        raise HTTPException(status_code=400, detail="problem_id is required when using the default model_id (production)")
    if not input_json and not input_uri and not input_csv:
        raise HTTPException(status_code=400, detail="Provide input or input_uri")

    if input_csv:
        if input_csv.filename == "":
            raise HTTPException(status_code=400, detail="No file selected")
        if not input_csv.filename.lower().endswith(".csv"):
            raise HTTPException(status_code=400, detail="File must be a CSV")
        content = await input_csv.read()
        df = pd.read_csv(BytesIO(content))
        input_json = df.to_json(orient="records")

    if model_id != "production":
        prediction_id = create_prediction(name=name, model_id=model_id, status="predicting")
    else:
        problem = get_ml_problem(problem_id)
        if not problem:
            raise HTTPException(status_code=404, detail="ML problem was not found")
        model_id = problem["current_model_id"]
        prediction_id = create_prediction(name=name, model_id=model_id, status="predicting")

    job_id = create_job(job_type="predict", model_id=model_id, status="queued")

    if settings.is_portfolio:
        from ml.predict import run_prediction

        def _run():
            run_prediction(
                job_id=job_id,
                name=name,
                prediction_id=prediction_id,
                input_json=input_json,
                input_uri=input_uri,
                problem_id=problem_id,
                model_id=model_id,
            )

        _executor.submit(_run)
        return {"job_id": job_id, "prediction_id": prediction_id, "status": "queued"}

    else:
        from celery_handler import celery_app
        logger.info("Sending celery task 'predict.task'")
        task = celery_app.send_task(
            "predict.task",
            args=[name, prediction_id, input_json, input_uri, problem_id, model_id],
        )
        return {"task_id": task.id, "status": f"/celery/{task.id}"}


# ──────────────────────────────────────────────────────────────────────────────
# Model endpoints
# ──────────────────────────────────────────────────────────────────────────────

@app.get("/problemModels/{problem_id}")
async def get_list_models(
    problem_id: str,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    sort: str = Query("created_at"),
    dir: Literal["asc", "desc"] = Query("desc"),
    q: Optional[str] = Query(None),
    id: Optional[str] = Query(None),
    name: Optional[str] = Query(None),
    algorithm: Optional[str] = Query(None),
    train_mode: Optional[str] = Query(None),
    evaluation_strategy: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
):
    items, total = get_models(problem_id=problem_id, page=page, size=size, sort=sort,
                               dir=dir, q=q, id=id, name=name, algorithm=algorithm,
                               train_mode=train_mode, evaluation_strategy=evaluation_strategy,
                               status=status)
    total_pages = int((total + size - 1) / size) if size > 0 else 1
    return {"items": items, "page": page, "size": size, "total": total,
            "total_pages": total_pages, "sort": sort, "dir": dir, "q": q, "id": id,
            "name": name, "algorithm": algorithm, "train_mode": train_mode,
            "evaluation_strategy": evaluation_strategy, "status": status}


@app.get("/model/{model_id}")
async def get_model_info(model_id: str):
    return get_model(model_id)


@app.patch("/model/{model_id}")
async def patch_model(model_id: str, name: str):
    return update_model(model_id, name)


@app.delete("/model/{model_id}")
async def delete_model_ep(model_id: str):
    return delete_model(model_id)


@app.patch("/model/{model_id}/set_production")
async def set_model_to_production_ep(model_id: str):
    model = get_model(model_id)
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")
    problem_id = model["problem_id"]
    return set_model_to_production(problem_id, model_id)


# ──────────────────────────────────────────────────────────────────────────────
# Prediction list endpoints
# ──────────────────────────────────────────────────────────────────────────────

@app.get("/problemPredictions/{problem_id}")
async def get_list_predictions_all(
    problem_id: str,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    sort: str = Query("created_at"),
    dir: Literal["asc", "desc"] = Query("desc"),
    q: Optional[str] = Query(None),
    name: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    model_name: Optional[str] = Query(None),
):
    items, total = get_ml_predictions_all_joined(problem_id=problem_id, page=page, size=size,
                                                  sort=sort, dir=dir, q=q, name=name,
                                                  status=status, model_name=model_name)
    total_pages = int((total + size - 1) / size) if size > 0 else 1
    return {"items": items, "page": page, "size": size, "total": total,
            "total_pages": total_pages, "sort": sort, "dir": dir, "q": q,
            "name": name, "status": status, "model_name": model_name}


@app.get("/modelPredictions/{model_id}")
async def get_list_predictions(
    model_id: str,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    sort: str = Query("created_at"),
    dir: Literal["asc", "desc"] = Query("desc"),
    q: Optional[str] = Query(None),
    id: Optional[str] = Query(None),
    name: Optional[str] = Query(None),
):
    items, total = get_predictions(model_id=model_id, page=page, size=size, sort=sort,
                                    dir=dir, q=q, id=id, name=name)
    total_pages = int((total + size - 1) / size) if size > 0 else 1
    return {"items": items, "page": page, "size": size, "total": total,
            "total_pages": total_pages, "sort": sort, "dir": dir, "q": q, "id": id, "name": name}


@app.get("/prediction/{prediction_id}")
async def get_prediction_info(prediction_id: str):
    return get_prediction(prediction_id)


@app.patch("/prediction/{prediction_id}")
async def patch_prediction(prediction_id: str, name: str):
    return update_prediction(prediction_id, name)


@app.delete("/prediction/{prediction_id}")
async def delete_prediction_ep(prediction_id: str):
    return delete_prediction(prediction_id)


# ──────────────────────────────────────────────────────────────────────────────
# Dashboard stats
# ──────────────────────────────────────────────────────────────────────────────

@app.get("/dashboard/stats")
async def get_dashboard_stats_info():
    return get_dashboard_stats()


# ──────────────────────────────────────────────────────────────────────────────
# Presets
# ──────────────────────────────────────────────────────────────────────────────

def list_presets(task: Literal["classification", "regression"]) -> list[str]:
    import importlib.resources
    presets_pkg = f"mlcore.presets.{task}"
    try:
        import importlib
        mod = importlib.import_module(presets_pkg)
        pkg_path = Path(mod.__file__).parent
    except Exception:
        return []

    presets = set()
    for file in os.listdir(pkg_path):
        if not file.endswith(".py"):
            continue
        if file == "__init__.py" or file.startswith("_"):
            continue
        presets.add(os.path.splitext(file)[0])
    return sorted(presets)


@app.get("/presets/{task}")
async def get_presets_list(task: str):
    return list_presets(task)


# ──────────────────────────────────────────────────────────────────────────────
# CSV helper
# ──────────────────────────────────────────────────────────────────────────────

@app.get("/csv/{uri:path}")
async def get_csv(uri: str) -> dict[str, Any]:
    df = get_dataframe_from_csv(uri)
    return {"column_names": list(df.columns), "rows": df.to_dict(orient="records")}


# ──────────────────────────────────────────────────────────────────────────────
# Join endpoints
# ──────────────────────────────────────────────────────────────────────────────

@app.get("/datasetVersionsAll")
async def get_list_dataset_versions_all(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    sort: str = Query("created_at"),
    dir: Literal["asc", "desc"] = Query("desc"),
    q: Optional[str] = Query(None),
    dataset_name: Optional[str] = Query(None),
    version_name: Optional[str] = Query(None),
):
    items, total = get_dataset_versions_all_joined(page=page, size=size, sort=sort, dir=dir,
                                                    q=q, dataset_name=dataset_name,
                                                    version_name=version_name)
    total_pages = int((total + size - 1) / size) if size > 0 else 1
    return {"items": items, "page": page, "size": size, "total": total,
            "total_pages": total_pages, "sort": sort, "dir": dir, "q": q,
            "dataset_name": dataset_name, "version_name": version_name}


@app.get("/mlProblemsAll")
async def get_list_ml_problems_all(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    sort: str = Query("created_at"),
    dir: Literal["asc", "desc"] = Query("desc"),
    q: Optional[str] = Query(None),
    id: Optional[str] = Query(None),
    task: Optional[str] = Query(None),
    target: Optional[str] = Query(None),
    problem_name: Optional[str] = Query(None),
    dataset_name: Optional[str] = Query(None),
    dataset_version_name: Optional[str] = Query(None),
):
    items, total = get_ml_problems_all_joined(page=page, size=size, sort=sort, dir=dir,
                                               q=q, id=id, task=task, target=target,
                                               problem_name=problem_name,
                                               dataset_name=dataset_name,
                                               dataset_version_name=dataset_version_name)
    total_pages = int((total + size - 1) / size) if size > 0 else 1
    return {"items": items, "page": page, "size": size, "total": total,
            "total_pages": total_pages, "sort": sort, "dir": dir, "q": q, "id": id,
            "task": task, "target": target, "problem_name": problem_name,
            "dataset_name": dataset_name, "dataset_version_name": dataset_version_name}


@app.get("/modelsAll")
async def get_list_models_all(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    sort: str = Query("created_at"),
    dir: Literal["asc", "desc"] = Query("desc"),
    q: Optional[str] = Query(None),
    id: Optional[str] = Query(None),
    name: Optional[str] = Query(None),
    algorithm: Optional[str] = Query(None),
    train_mode: Optional[str] = Query(None),
    evaluation_strategy: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    problem_name: Optional[str] = Query(None),
    dataset_name: Optional[str] = Query(None),
    dataset_version_name: Optional[str] = Query(None),
):
    items, total = get_models_all_joined(page=page, size=size, sort=sort, dir=dir,
                                          q=q, id=id, name=name, algorithm=algorithm,
                                          train_mode=train_mode,
                                          evaluation_strategy=evaluation_strategy,
                                          status=status, problem_name=problem_name,
                                          dataset_name=dataset_name,
                                          dataset_version_name=dataset_version_name)
    total_pages = int((total + size - 1) / size) if size > 0 else 1
    return {"items": items, "page": page, "size": size, "total": total,
            "total_pages": total_pages, "sort": sort, "dir": dir, "q": q, "id": id,
            "name": name, "algorithm": algorithm, "train_mode": train_mode,
            "evaluation_strategy": evaluation_strategy, "status": status,
            "problem_name": problem_name, "dataset_name": dataset_name,
            "dataset_version_name": dataset_version_name}


@app.get("/predictionsAll")
async def get_list_predictions_all_joined(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    sort: str = Query("created_at"),
    dir: Literal["asc", "desc"] = Query("desc"),
    q: Optional[str] = Query(None),
    id: Optional[str] = Query(None),
    name: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    model_name: Optional[str] = Query(None),
    problem_name: Optional[str] = Query(None),
    dataset_name: Optional[str] = Query(None),
    dataset_version_name: Optional[str] = Query(None),
):
    items, total = get_predictions_all_joined(page=page, size=size, sort=sort, dir=dir,
                                               q=q, id=id, name=name, status=status,
                                               model_name=model_name,
                                               problem_name=problem_name,
                                               dataset_name=dataset_name,
                                               dataset_version_name=dataset_version_name)
    total_pages = int((total + size - 1) / size) if size > 0 else 1
    return {"items": items, "page": page, "size": size, "total": total,
            "total_pages": total_pages, "sort": sort, "dir": dir, "q": q, "id": id,
            "name": name, "status": status, "model_name": model_name,
            "problem_name": problem_name, "dataset_name": dataset_name,
            "dataset_version_name": dataset_version_name}
