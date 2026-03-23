from ..db.db import (
    create_user,
    create_dataset,
    create_dataset_version,
    create_ml_problem,
    create_model,
    create_job,
    create_prediction,
    db_get_dataset,
    get_model,
    get_prediction,
    get_job,
    get_ml_problem,
    db_get_dataset_version,
)
from ..db import init_db
import os
import pytest
import pymysql

# ---------------------------------------------------------
# Skip in CI (no DB there)
# ---------------------------------------------------------
if os.getenv("PYTEST_CI_MODE") == "True":
    pytest.skip("Skipping smoke tests in CI (no MySQL service).",
                allow_module_level=True)


# ---------------------------------------------------------
# DB reachability check
# ---------------------------------------------------------
def _can_connect() -> bool:
    try:
        conn = pymysql.connect(
            host=os.getenv("DB_HOST", "127.0.0.1"),
            port=int(os.getenv("DB_PORT", "3306")),
            user=os.getenv("DB_USER", "team1_user"),
            password=os.getenv("DB_PASS", "team1_pass"),
            database=os.getenv("DB_NAME", "team1_db"),
            connect_timeout=2,
        )
        conn.close()
        return True
    except Exception:
        return False


if not _can_connect():
    pytest.skip("Skipping smoke tests (MySQL not reachable).",
                allow_module_level=True)


# ---------------------------------------------------------
# Imports from our DB layer
# ---------------------------------------------------------


# ---------------------------------------------------------
# Fixture: ensure schema is applied (no seed)
# ---------------------------------------------------------
@pytest.fixture(scope="session", autouse=True)
def init_schema_no_seed():
    """
    Make sure the schema from schema_mysql.sql is applied.
    We do NOT seed data here.
    """
    os.environ.setdefault("SCHEMA_PATH", "src/db/schema_mysql.sql")
    os.environ.setdefault("SEED_PATH", "/dev/null")
    init_db.main(apply_seed=False)
    yield


# ---------------------------------------------------------
# Smoke test: full happy-path across our helpers
# ---------------------------------------------------------
def test_smoke_full_flow():
    # 1) create a user
    user_id = create_user("smoke_user", "smoke@example.com")
    assert isinstance(user_id, str)

    # 2) create dataset (owned by user)
    ds_id = create_dataset("smoke_dataset", owner_id=user_id)
    assert isinstance(ds_id, str)

    # 3) create dataset version
    dv_id = create_dataset_version(
        ds_id,
        uri="/data/smoke.csv",
        schema_json={"columns": ["x", "y"]},
        profile_json={"row_count": 10},
        row_count=10,
    )
    assert isinstance(dv_id, str)

    # 4) create ml_problem (validation_strategy moved off this table)
    prob_id = create_ml_problem(
        dataset_version_id=dv_id,
        dataset_version_uri="/data/smoke.csv",
        task="timeseries",
        target="y",
        feature_strategy_json={"method": "basic"},
        schema_snapshot={"columns": ["x", "y"]},
        semantic_types={"x": "numeric", "y": "numeric"},
        current_model_id=None,
    )
    assert isinstance(prob_id, str)

    # 5) create model (evaluation_strategy now lives here)
    model_id, uri = create_model(
        problem_id=prob_id,
        algorithm="prophet",
        status="staging",
        train_mode="auto",
        evaluation_strategy="train_test_split",
        metrics_json={"MAE": 1.23},
        uri=None,
        metadata_uri=None,
        explanation_uri=None,
        created_by=user_id,
        name="smoke_model",
    )
    assert isinstance(model_id, str)
    assert isinstance(uri, str)

    # 6) create job for training
    job_id = create_job(
        job_type="train",
        problem_id=prob_id,
        model_id=model_id,
        status="queued",
        task_id="celery-task-123",
        requested_by=user_id,
    )
    assert isinstance(job_id, str)

    # 7) create a prediction (no problem_id here, only model_id)
    pred_id = create_prediction(
        model_id=model_id,
        input_uri=None,
        inputs_json={"x": 42},
        outputs_json={"y_hat": 99.9},
        outputs_uri=None,
        requested_by=user_id,
    )
    assert isinstance(pred_id, str)

    # 8) read a few things back to ensure they exist
    ds = db_get_dataset(ds_id)
    assert ds is not None
    assert ds["id"] == ds_id

    dv = db_get_dataset_version(dv_id)
    assert dv is not None
    assert dv["id"] == dv_id

    prob = get_ml_problem(prob_id)
    assert prob is not None
    assert prob["id"] == prob_id

    model = get_model(model_id)
    assert model is not None
    assert model["id"] == model_id

    job = get_job(job_id)
    assert job is not None
    assert job["id"] == job_id

    pred = get_prediction(pred_id)
    assert pred is not None
    assert pred["id"] == pred_id
