# src/db/init_test_db.py
from __future__ import annotations

import argparse
import json
import os
import re
import uuid
from typing import Any, Dict, Optional

import pymysql
from pymysql.cursors import DictCursor

TEST_DB = os.getenv("TEST_DB_NAME", "team1_db_test")

DB_HOST = os.getenv("DB_HOST", "127.0.0.1")
DB_PORT = int(os.getenv("DB_PORT", "3306"))
DB_USER = os.getenv("DB_USER", "team1_user")
DB_PASS = os.getenv("DB_PASS", "team1_pass")


def _conn(database: Optional[str] = None):
    return pymysql.connect(
        host=DB_HOST,
        port=DB_PORT,
        user=DB_USER,
        password=DB_PASS,
        database=database,
        autocommit=True,
        cursorclass=DictCursor,
    )


def _read_block(text: str, header: str) -> Dict[str, Any]:
    m = re.search(rf"{re.escape(header)}\s*", text)
    if not m:
        raise ValueError(f"Header not found: {header}")
    start = text.find("{", m.end())
    if start == -1:
        raise ValueError(f"No JSON after: {header}")
    depth = 0
    end = None
    for i in range(start, len(text)):
        if text[i] == "{":
            depth += 1
        elif text[i] == "}":
            depth -= 1
            if depth == 0:
                end = i + 1
                break
    if end is None:
        raise ValueError(f"Unclosed JSON after: {header}")
    return json.loads(text[start:end])


def _first_entry(d: Dict[str, Any]) -> Dict[str, Any]:
    return next(iter(d.values()))


def _ensure_test_db_exists() -> None:
    # connect without specifying database
    with _conn() as c:
        with c.cursor() as cur:
            cur.execute(f"CREATE DATABASE IF NOT EXISTS {TEST_DB};")


def _reset_tables() -> None:
    with _conn(TEST_DB) as c:
        with c.cursor() as cur:
            cur.execute("SET FOREIGN_KEY_CHECKS=0;")
            for t in ["predictions", "jobs", "models", "ml_problems", "dataset_versions", "datasets", "users"]:
                cur.execute(f"TRUNCATE TABLE {t};")
            cur.execute("SET FOREIGN_KEY_CHECKS=1;")


def main(input_path: str, reset: bool) -> None:
    # 1) create DB (may fail if user lacks CREATE privilege)
    try:
        _ensure_test_db_exists()
    except Exception as e:
        raise SystemExit(
            f"Could not create {TEST_DB} with current MySQL user.\n"
            f"Fix: create it once with root, then rerun.\n"
            f"Error: {e}"
        )

    # 2) apply schema into test DB (reuse your init_db.py)
    os.environ["DB_NAME"] = TEST_DB
    from ..db.init_db import main as init_db_main
    init_db_main(apply_seed=False)
    
    seed_db(input_path=input_path, reset=reset)


def seed_db(input_path: str, reset: bool) -> None:
    """
    Seed DB with test_db data. Assumes init_db_main(apply_seed=False) is already done, and DB Schema exists.
    """ 
    
    # 3) optionally wipe tables
    if reset:
        _reset_tables()

    # 4) import helpers AFTER setting DB_NAME so they connect to test DB
    from ..db.db import (
        create_user,
        create_dataset,
        create_dataset_version,
        create_ml_problem,
        create_model,
        create_job,
        create_prediction,
    )

    raw = open(input_path, "r", encoding="utf-8").read()
    dv = _first_entry(_read_block(raw, "DATASET_VERSIONS:"))
    mp = _first_entry(_read_block(raw, "ML_PROBLEMS:"))

    # minimal parsing from file
    dv_uri = dv.get("dataset_version_uri") or dv.get("uri") or "/data/test.csv"
    schema_json = dv.get("schema") or {}
    profile_json = dv.get("profile") or {}
    row_count = None
    try:
        row_count = int(profile_json.get("summary", {}).get("n_rows"))
    except Exception:
        pass

    task = mp.get("task", "classification")
    target = mp.get("target", "target")
    feature_strategy = mp.get("feature_strategy") or mp.get(
        "feature_strategy_json") or {}
    schema_snapshot = mp.get("schema_snapshot") or schema_json or {}

    semantic_types = {"categorical": [], "numeric": [], "boolean": []}
    cols = profile_json.get("columns", {})
    if isinstance(cols, dict):
        for col, info in cols.items():
            st = (info or {}).get("semantic_type")
            if st in semantic_types and col != target:
                semantic_types[st].append(col)

    evaluation_strategy = mp.get("validation_strategy") or "train_test_split"

    # 5) insert 1 row per table
    user_id = create_user("test_user", "test_user@example.com")
    dataset_id = create_dataset("test_dataset", owner_id=user_id)

    version_id = create_dataset_version(
        dataset_id=dataset_id,
        uri=dv_uri,
        schema_json=schema_json,
        profile_json=profile_json,
        row_count=row_count,
    )

    problem_id = create_ml_problem(
        dataset_version_id=version_id,
        dataset_version_uri=dv_uri,
        task=task,
        target=target,
        feature_strategy_json=feature_strategy,
        schema_snapshot=schema_snapshot,
        semantic_types=semantic_types,
        current_model_id=None,
    )

    model_id, model_uri = create_model(
        problem_id=problem_id,
        name="test_model",
        algorithm="dummy_algorithm",
        train_mode="auto",
        evaluation_strategy=evaluation_strategy,
        status="staging",
        metrics_json={"note": "test model row"},
        uri=None,
        metadata_json=None,
        explanation_uri=None,
        created_by=user_id,
    )

    job_id = create_job(
        job_type="train",
        status="completed",
        task_id="test-task-1",
        requested_by=user_id,
        problem_id=problem_id,
        model_id=model_id,
    )

    pred_id = create_prediction(
        model_id=model_id,
        input_uri=dv_uri,
        inputs_json={"example": "input"},
        outputs_json={"example": "output"},
        outputs_uri="/outputs/test_prediction.json",
        requested_by=user_id,
    )

    print(f"Test DB ready: {TEST_DB}")
    print(
        f"users={user_id} datasets={dataset_id} versions={version_id} problems={problem_id}")
    print(f"models={model_id} jobs={job_id} predictions={pred_id}")


if __name__ == "__main__":
    ap = argparse.ArgumentParser(
        description="Create and populate team1_db_test with 1 row per table.")
    ap.add_argument("--input", default="src/db/test_db.txt",
                    help="Path to test_db.txt")
    ap.add_argument("--reset", action="store_true",
                    help="TRUNCATE tables before inserting")
    args = ap.parse_args()
    main(args.input, args.reset)
