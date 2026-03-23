from __future__ import annotations

import os
import json
import uuid
import contextlib
from typing import Any, Optional, Tuple, List, Dict, Literal

import pymysql
from pymysql.cursors import DictCursor

# -------------------------------------------------------------------
# MODEL PATH CONFIG
# -------------------------------------------------------------------

MODEL_DIR = os.getenv("MODEL_BASE_PATH", "/models")

# -------------------------------------------------------------------
# DB CONFIG
# -------------------------------------------------------------------

DB_HOST = os.getenv("DB_HOST", "127.0.0.1")
DB_PORT = int(os.getenv("DB_PORT", "3306"))
DB_NAME = os.getenv("DB_NAME", "team1_db")
DB_USER = os.getenv("DB_USER", "team1_user")
DB_PASS = os.getenv("DB_PASS", "team1_pass")

DB_CFG = {
    "host": DB_HOST,
    "port": DB_PORT,
    "user": DB_USER,
    "password": DB_PASS,
    "database": DB_NAME,
    "autocommit": True,
    "cursorclass": DictCursor,
}


def _json_dump(data: Optional[dict]) -> Optional[str]:
    if data is None:
        return None
    return json.dumps(data)


# -------------------------------------------------------------------
# CONNECTION / CURSOR HELPERS
# -------------------------------------------------------------------

def get_conn():
    return pymysql.connect(**DB_CFG)


@contextlib.contextmanager
def cursor():
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            yield cur
    finally:
        conn.close()


def _build_update_sql(table: str, id_col: str, id_val: str, fields: Dict[str, Any]) -> Tuple[Optional[str], Optional[List[Any]]]:
    set_parts = []
    params: List[Any] = []
    for col, val in fields.items():
        if val is None:
            continue
        set_parts.append(f"{col}=%s")
        params.append(val)

    if not set_parts:
        return None, None

    sql = f"UPDATE {table} SET " + ", ".join(set_parts) + f" WHERE {id_col}=%s"
    params.append(id_val)
    return sql, params


# -------------------------------------------------------------------
# USERS
# -------------------------------------------------------------------

def create_user(username: str, email: Optional[str] = None) -> str:
    user_id = str(uuid.uuid4())
    sql = "INSERT INTO users (id, username, email) VALUES (%s, %s, %s)"
    with cursor() as cur:
        cur.execute(sql, (user_id, username, email))
    return user_id


def get_user(user_id: str) -> Optional[dict]:
    sql = "SELECT * FROM users WHERE id = %s"
    with cursor() as cur:
        cur.execute(sql, (user_id,))
        return cur.fetchone()


# -------------------------------------------------------------------
# DATASETS
# -------------------------------------------------------------------

def create_dataset(name: str, owner_id: Optional[str] = None) -> str:
    dataset_id = str(uuid.uuid4())
    sql = "INSERT INTO datasets (id, name, owner_id) VALUES (%s, %s, %s)"
    with cursor() as cur:
        cur.execute(sql, (dataset_id, name, owner_id))
    return dataset_id


def db_get_dataset(dataset_id: str) -> Optional[dict]:
    sql = "SELECT * FROM datasets WHERE id = %s"
    with cursor() as cur:
        cur.execute(sql, (dataset_id,))
        return cur.fetchone()
    

ALLOWED_DATASET_SORT_FIELDS = {
    "name": "name",
    "created_at": "created_at",
}

def get_datasets(
    page: int,
    size: int,
    sort: str,
    dir: Literal["asc", "desc"],
    q: Optional[str] = None,
    id: Optional[str] = None,
    name: Optional[str] = None,
) -> Tuple[List[Dict], int]:
    '''
    Return (items, total) for datasets with pagination, sorting and optional search.
    '''
    ### SORTING ###
    sort_column = ALLOWED_DATASET_SORT_FIELDS.get(sort, "created_at")
    dir_sql = "ASC" if dir=="asc" else "DESC"

    ### WHERE CLAUSES - FORMING THE SEARCH QUERIES ###
    where_clauses = []
    params = []

    if q:
        like = f"%{q}%" # Search anything that contains q
        where_clauses.append("name LIKE %s") # If there are more later change name LIKE %s -> (name LIKE %s OR owner_name LIKE %s OR ...)
        params.append(like) # If there are more later swap with .extend and like -> [like, like] -> [like, like, ...]

    if id:
        where_clauses.append("id = %s")
        params.append(id)

    if name:
        like = f"%{name}%" # Search name for anything that contains name
        where_clauses.append("name LIKE %s")
        params.append(like)
    
    where_sql = ""
    if where_clauses:
        where_sql = "WHERE " + " AND ".join(where_clauses)

    ### TOTAL CALCULATION ###
    count_sql = f"SELECT COUNT(*) AS total FROM datasets {where_sql}"
    with cursor() as cur:
        cur.execute(count_sql, params)
        row = cur.fetchone()
        total = row["total"] if row else 0

    ### RETURN ###
    offset = (page-1)*size
    datasets_sql = f"SELECT * FROM datasets {where_sql} ORDER BY {sort_column} {dir_sql} LIMIT %s OFFSET %s"
    with cursor() as cur:
        cur.execute(datasets_sql, params + [size, offset]) # [size, offset] are not extended in params, so that params is not mutated and only includes the WHERE clauses params
        items = cur.fetchall()

    return items, total


def update_dataset(dataset_id: str, name: Optional[str] = None, owner_id: Optional[str] = None) -> bool:
    sql, params = _build_update_sql("datasets", "id", dataset_id, {"name": name, "owner_id": owner_id})
    if not sql:
        return False
    with cursor() as cur:
        cur.execute(sql, params)
        return cur.rowcount > 0


# -------------------------------------------------------------------
# DATASET VERSIONS
# -------------------------------------------------------------------

def create_dataset_version(
    dataset_id: str,
    uri: str,
    name: str,
    filename: str,
    schema_json: Optional[dict] = None,
    profile_json: Optional[dict] = None,
    row_count: Optional[int] = None,
) -> str:
    version_id = str(uuid.uuid4())
    sql = """
        INSERT INTO dataset_versions
        (id, name, dataset_id, filename, uri, schema_json, profile_json, row_count)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
    """
    with cursor() as cur:
        cur.execute(
            sql,
            (
                version_id,
                name,
                dataset_id,
                filename,
                uri,
                _json_dump(schema_json),
                _json_dump(profile_json),
                row_count,
            ),
        )
    return version_id


def db_get_dataset_version(version_id: str) -> Optional[dict]:
    sql = "SELECT * FROM dataset_versions WHERE id = %s"
    with cursor() as cur:
        cur.execute(sql, (version_id,))
        return cur.fetchone()


ALLOWED_DATASET_VERSION_SORT_FIELDS = {
    "name": "name",
    "created_at": "created_at",
}


def get_dataset_versions(
    dataset_id: str,
    page: int,
    size: int,
    sort: str,
    dir: Literal["asc", "desc"],
    q: Optional[str] = None,
    id: Optional[str] = None,
    name: Optional[str] = None,
) -> Tuple[List[Dict], int]:
    '''
    Return (items, total) for dataset_versions for a given dataset_id with pagination, sorting and optional search.
    '''
    ### SORTING ###
    sort_column = ALLOWED_DATASET_VERSION_SORT_FIELDS.get(sort, "created_at")
    dir_sql = "ASC" if dir=="asc" else "DESC"

    ### WHERE CLAUSES - FORMING THE SEARCH QUERIES ###
    where_clauses = []
    params = []

    if q:
        like = f"%{q}%" # Search anything that contains q
        where_clauses.append("name LIKE %s") # If there are more later change name LIKE %s -> (name LIKE %s OR owner_name LIKE %s OR ...)
        params.append(like) # If there are more later swap with .extend and like -> [like, like] -> [like, like, ...]

    if id:
        where_clauses.append("id = %s")
        params.append(id)

    if name:
        like = f"%{name}%" # Search name for anything that contains name
        where_clauses.append("name LIKE %s")
        params.append(like)
    
    where_sql = ""
    if where_clauses:
        where_sql = " AND " + " AND ".join(where_clauses)

    ### TOTAL CALCULATION ###
    count_sql = f"SELECT COUNT(*) AS total FROM dataset_versions WHERE dataset_id = %s {where_sql}"
    with cursor() as cur:
        cur.execute(count_sql, [dataset_id] + params)
        row = cur.fetchone()
        total = row["total"] if row else 0

    ### RETURN ###
    offset = (page-1)*size
    dataset_versions_sql = f"SELECT * FROM dataset_versions WHERE dataset_id = %s {where_sql} ORDER BY {sort_column} {dir_sql} LIMIT %s OFFSET %s"
    with cursor() as cur:
        cur.execute(dataset_versions_sql, [dataset_id] + params + [size, offset]) # [size, offset] are not extended in params, so that params is not mutated and only includes the WHERE clauses params
        items = cur.fetchall()

    return items, total


def update_dataset_version(
    version_id: str,
    name: Optional[str] = None,
    uri: Optional[str] = None,
    upload_id: Optional[str] = None,
    schema_json: Optional[dict] = None,
    profile_json: Optional[dict] = None,
    row_count: Optional[int] = None,
) -> bool:
    sql, params = _build_update_sql(
        "dataset_versions",
        "id",
        version_id,
        {
            "name": name,
            "uri": uri,
            "upload_id": upload_id,
            "schema_json": _json_dump(schema_json) if schema_json is not None else None,
            "profile_json": _json_dump(profile_json) if profile_json is not None else None,
            "row_count": row_count,
        },
    )
    if not sql:
        return False
    with cursor() as cur:
        cur.execute(sql, params)
        return cur.rowcount > 0


# -------------------------------------------------------------------
# ML PROBLEMS
# -------------------------------------------------------------------

def create_ml_problem(
    dataset_version_id: str,
    task: str,
    target: str,
    name: str,
    dataset_version_uri: Optional[str] = None,
    feature_strategy_json: Optional[dict] = "auto",
    schema_snapshot: Optional[dict] = None,
    semantic_types: Optional[dict] = None,
    current_model_id: Optional[str] = None,
) -> str:
    problem_id = str(uuid.uuid4())
    sql = """
        INSERT INTO ml_problems
        (id, dataset_version_id, name, dataset_version_uri, task, target,
        feature_strategy_json, schema_snapshot, semantic_types, current_model_id)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """
    with cursor() as cur:
        cur.execute(
            sql,
            (
                problem_id,
                dataset_version_id,
                name,
                dataset_version_uri,
                task,
                target,
                _json_dump(feature_strategy_json),
                _json_dump(schema_snapshot),
                _json_dump(semantic_types),
                current_model_id,
            ),
        )
    return problem_id


def get_ml_problem(problem_id: str) -> Optional[dict]:
    sql = "SELECT * FROM ml_problems WHERE id = %s"
    with cursor() as cur:
        cur.execute(sql, (problem_id,))
        return cur.fetchone()
    

ALLOWED_ML_PROBLEM_SORT_FIELDS = {
    "name": "name",
    "task": "task",
    "target": "target",
    "created_at": "created_at",
}


def get_ml_problems(
    dataset_version_id: str,
    page: int,
    size: int,
    sort: str,
    dir: Literal["asc", "desc"],
    q: Optional[str] = None,
    id: Optional[str] = None,
    task: Optional[str] = None,
    target: Optional[str] = None,
    name: Optional[str] = None,
) -> Tuple[List[Dict], int]:
    '''
    Return (items, total) for dataset_versions for a given dataset_id with pagination, sorting and optional search.
    '''
    ### SORTING ###
    sort_column = ALLOWED_ML_PROBLEM_SORT_FIELDS.get(sort, "created_at")
    dir_sql = "ASC" if dir=="asc" else "DESC"

    ### WHERE CLAUSES - FORMING THE SEARCH QUERIES ###
    where_clauses = []
    params = []

    if q:
        like = f"%{q}%" # Search anything that contains q
        where_clauses.append(
            "("
            "name LIKE %s OR task LIKE %s OR target LIKE %s"
            ")"
        ) # If there are more later change name LIKE %s -> (name LIKE %s OR owner_name LIKE %s OR ...)
        params.extend([like, like, like]) # If there are more later swap with .extend and like -> [like, like] -> [like, like, ...]

    if id:
        where_clauses.append("id = %s")
        params.append(id)

    if name:
        like = f"%{name}%" # Search name for anything that contains name
        where_clauses.append("name LIKE %s")
        params.append(like)

    if task:
        like = f"%{task}%" # Search target for anything that contains target
        where_clauses.append("task LIKE %s")
        params.append(like)

    if target:
        like = f"%{target}%" # Search target for anything that contains target
        where_clauses.append("target LIKE %s")
        params.append(like)
    
    where_sql = ""
    if where_clauses:
        where_sql = " AND " + " AND ".join(where_clauses)

    ### TOTAL CALCULATION ###
    count_sql = f"SELECT COUNT(*) AS total FROM ml_problems WHERE dataset_version_id = %s {where_sql}"
    with cursor() as cur:
        cur.execute(count_sql, [dataset_version_id] + params)
        row = cur.fetchone()
        total = row["total"] if row else 0

    ### RETURN ###
    offset = (page-1)*size
    ml_problems_sql = f"SELECT * FROM ml_problems WHERE dataset_version_id = %s {where_sql} ORDER BY {sort_column} {dir_sql} LIMIT %s OFFSET %s"
    with cursor() as cur:
        cur.execute(ml_problems_sql, [dataset_version_id] + params + [size, offset]) # [size, offset] are not extended in params, so that params is not mutated and only includes the WHERE clauses params
        items = cur.fetchall()

    return items, total


def update_ml_problem(
    problem_id: str,
    name: Optional[str] = None,
    task: Optional[str] = None,
    target: Optional[str] = None,
    dataset_version_uri: Optional[str] = None,
    feature_strategy_json: Optional[dict] = None,
    schema_snapshot: Optional[dict] = None,
    semantic_types: Optional[dict] = None,
    current_model_id: Optional[str] = None,
) -> bool:
    sql, params = _build_update_sql(
        "ml_problems",
        "id",
        problem_id,
        {
            "name": name,
            "task": task,
            "target": target,
            "dataset_version_uri": dataset_version_uri,
            "feature_strategy_json": _json_dump(feature_strategy_json) if feature_strategy_json is not None else None,
            "schema_snapshot": _json_dump(schema_snapshot) if schema_snapshot is not None else None,
            "semantic_types": _json_dump(semantic_types) if semantic_types is not None else None,
            "current_model_id": current_model_id,
        },
    )
    if not sql:
        return False
    with cursor() as cur:
        cur.execute(sql, params)
        return cur.rowcount > 0


# -------------------------------------------------------------------
# MODELS
# -------------------------------------------------------------------

def build_model_uri(problem_id: str, model_id: str) -> str:
    # storage-agnostic default
    return f"{MODEL_DIR}/{problem_id}/{model_id}/model.joblib"

def create_model(
    problem_id: str,
    algorithm: str,
    status: str,
    name: str,
    train_mode: Optional[str] = None,
    evaluation_strategy: Optional[str] = None,
    metrics_json: Optional[dict] = None,
    uri: Optional[str] = None,         
    metadata_json: Optional[dict] = None,
    explanation_json: Optional[dict] = None,
    created_by: Optional[str] = None,
) -> Tuple[str, str]:
    model_id = str(uuid.uuid4())

    # Default URI derived from IDs
    if uri is None:
        uri = build_model_uri(problem_id, model_id)

    sql = """
        INSERT INTO models
        (id, problem_id, name, algorithm, train_mode, evaluation_strategy, status,
         metrics_json, uri, metadata_json, explanation_json, created_by)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """
    with cursor() as cur:
        cur.execute(
            sql,
            (
                model_id,
                problem_id,
                name,
                algorithm,
                train_mode,
                evaluation_strategy,
                status,
                _json_dump(metrics_json),
                uri,
                _json_dump(metadata_json),
                _json_dump(explanation_json),
                created_by,
            ),
        )
    return model_id, uri


def get_model(model_id: str) -> Optional[dict]:
    sql = "SELECT * FROM models WHERE id = %s"
    with cursor() as cur:
        cur.execute(sql, (model_id,))
        return cur.fetchone()


ALLOWED_MODEL_SORT_FIELDS = {
    "name": "name",
    "status": "status",
    "created_at": "created_at",
}


def get_models(
    problem_id: str,
    page: int,
    size: int,
    sort: str,
    dir: Literal["asc", "desc"],
    q: Optional[str] = None,
    id: Optional[str] = None,
    name: Optional[str] = None,
    algorithm: Optional[str] = None,
    train_mode: Optional[str] = None,
    evaluation_strategy: Optional[str] = None,
    status: Optional[str] = None,
) -> Tuple[List[Dict], int]:
    '''
    Return (items, total) for dataset_versions for a given dataset_id with pagination, sorting and optional search.
    '''
    ### SORTING ###
    sort_column = ALLOWED_MODEL_SORT_FIELDS.get(sort, "created_at")
    dir_sql = "ASC" if dir=="asc" else "DESC"

    ### WHERE CLAUSES - FORMING THE SEARCH QUERIES ###
    where_clauses = []
    params = []

    if q:
        like = f"%{q}%" # Search anything that contains q
        where_clauses.append(
            "("
            "name LIKE %s OR algorithm LIKE %s OR train_mode LIKE %s OR evaluation_strategy LIKE %s OR status LIKE %s"
            ")"
            ) # If there are more later change name LIKE %s -> (name LIKE %s OR owner_name LIKE %s OR ...)
        params.extend([like, like, like, like, like]) # If there are more later swap with .extend and like -> [like, like] -> [like, like, ...]

    if id:
        where_clauses.append("id = %s")
        params.append(id)

    if name:
        like = f"%{name}%" # Search name for anything that contains name
        where_clauses.append("name LIKE %s")
        params.append(like)

    if algorithm:
        like = f"%{algorithm}%"
        where_clauses.append("algorithm LIKE %s")
        params.append(like)

    if train_mode:
        like = f"%{train_mode}%"
        where_clauses.append("train_mode LIKE %s")
        params.append(like)
    
    if evaluation_strategy:
        like = f"%{evaluation_strategy}%"
        where_clauses.append("evaluation_strategy LIKE %s")
        params.append(like)

    if status:
        like = f"%{status}%"
        where_clauses.append("status LIKE %s")
        params.append(like)
    
    where_sql = ""
    if where_clauses:
        where_sql = " AND " + " AND ".join(where_clauses)

    ### TOTAL CALCULATION ###
    count_sql = f"SELECT COUNT(*) AS total FROM models WHERE problem_id = %s {where_sql}"
    with cursor() as cur:
        cur.execute(count_sql, [problem_id] + params)
        row = cur.fetchone()
        total = row["total"] if row else 0

    ### RETURN ###
    offset = (page-1)*size
    models_sql = f"SELECT * FROM models WHERE problem_id = %s {where_sql} ORDER BY {sort_column} {dir_sql} LIMIT %s OFFSET %s"
    with cursor() as cur:
        cur.execute(models_sql, [problem_id] + params + [size, offset]) # [size, offset] are not extended in params, so that params is not mutated and only includes the WHERE clauses params
        items = cur.fetchall()

    return items, total


def update_model(
        model_id: str,
        name: Optional[str] = None,
        status: Optional[str] = None,
        metrics_json: Optional[str] = None,
        uri: Optional[str] = None,
        metadata_json: Optional[str] = None,
        explanation_json: Optional[str] = None,
        ) -> bool:
    sql, params = _build_update_sql("models", "id", model_id, {
        "name": name,
        "status": status,
        "metrics_json": metrics_json,
        "uri": uri,
        "metadata_json": metadata_json,
        "explanation_json": explanation_json,
        })
    if not sql:
        return False
    with cursor() as cur:
        cur.execute(sql, params)
        return cur.rowcount > 0


# -------------------------------------------------------------------
# JOBS
# -------------------------------------------------------------------

def create_job(
    job_type: str,
    problem_id: Optional[str] = None,
    model_id: Optional[str] = None,
    status: str = "queued",
    task_id: Optional[str] = None,
    requested_by: Optional[str] = None,
) -> str:
    job_id = str(uuid.uuid4())
    sql = """
        INSERT INTO jobs
        (id, type, problem_id, model_id, status, task_id, requested_by)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
    """
    with cursor() as cur:
        cur.execute(
            sql,
            (job_id, job_type, problem_id, model_id, status, task_id, requested_by),
        )
    return job_id


def update_job_status(job_id: str, status: str, error: Optional[str] = None) -> None:
    """
    Simple status update:
    - if status == 'running'  -> set started_at
    - if status in ('completed', 'failed') -> set finished_at
    - error (if given) is stored
    """
    if status == "running":
        sql = "UPDATE jobs SET status=%s, started_at=NOW(), error=%s WHERE id=%s"
        params = (status, error, job_id)
    elif status in ("completed", "failed"):
        sql = "UPDATE jobs SET status=%s, finished_at=NOW(), error=%s WHERE id=%s"
        params = (status, error, job_id)
    else:
        sql = "UPDATE jobs SET status=%s, error=%s WHERE id=%s"
        params = (status, error, job_id)

    with cursor() as cur:
        cur.execute(sql, params)


def get_job(job_id: str) -> Optional[dict]:
    sql = "SELECT * FROM jobs WHERE id = %s"
    with cursor() as cur:
        cur.execute(sql, (job_id,))
        return cur.fetchone()


# -------------------------------------------------------------------
# PREDICTIONS
# -------------------------------------------------------------------

def create_prediction(
    name: str,
    model_id: Optional[str] = None,
    input_uri: Optional[str] = None,
    inputs_json: Optional[dict] = None,
    outputs_json: Optional[dict] = None,
    outputs_uri: Optional[str] = None,
    status: Optional[str] = None,
    requested_by: Optional[str] = None,
) -> str:
    prediction_id = str(uuid.uuid4())
    sql = """
        INSERT INTO predictions
        (id, model_id, name, input_uri, inputs_json, outputs_json, outputs_uri, status, requested_by)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
    """
    with cursor() as cur:
        cur.execute(
            sql,
            (
                prediction_id,
                model_id,
                name,
                input_uri,
                _json_dump(inputs_json),
                _json_dump(outputs_json),
                outputs_uri,
                status,
                requested_by,
            ),
        )
    return prediction_id


def get_prediction(prediction_id: str) -> Optional[dict]:
    sql = "SELECT * FROM predictions WHERE id = %s"
    with cursor() as cur:
        cur.execute(sql, (prediction_id,))
        return cur.fetchone()
    

ALLOWED_PREDICTION_SORT_FIELDS = {
    "name": "name",
    "created_at": "created_at",
}


def get_predictions(
    model_id: str,
    page: int,
    size: int,
    sort: str,
    dir: Literal["asc", "desc"],
    q: Optional[str] = None,
    id: Optional[str] = None,
    name: Optional[str] = None,
) -> Tuple[List[Dict], int]:
    '''
    Return (items, total) for predictions for a given dataset_id with pagination, sorting and optional search.
    '''
    ### SORTING ###
    sort_column = ALLOWED_PREDICTION_SORT_FIELDS.get(sort, "created_at")
    dir_sql = "ASC" if dir=="asc" else "DESC"

    ### WHERE CLAUSES - FORMING THE SEARCH QUERIES ###
    where_clauses = []
    params = []

    if q:
        like = f"%{q}%" # Search anything that contains q
        where_clauses.append("name LIKE %s") # If there are more later change name LIKE %s -> (name LIKE %s OR owner_name LIKE %s OR ...)
        params.append(like) # If there are more later swap with .extend and like -> [like, like] -> [like, like, ...]

    if id:
        where_clauses.append("id = %s")
        params.append(id)

    if name:
        like = f"%{name}%" # Search name for anything that contains name
        where_clauses.append("name LIKE %s")
        params.append(like)
    
    where_sql = ""
    if where_clauses:
        where_sql = " AND " + " AND ".join(where_clauses)

    ### TOTAL CALCULATION ###
    count_sql = f"SELECT COUNT(*) AS total FROM predictions WHERE model_id = %s {where_sql}"
    with cursor() as cur:
        cur.execute(count_sql, [model_id] + params)
        row = cur.fetchone()
        total = row["total"] if row else 0

    ### RETURN ###
    offset = (page-1)*size
    dataset_versions_sql = f"SELECT * FROM predictions WHERE model_id = %s {where_sql} ORDER BY {sort_column} {dir_sql} LIMIT %s OFFSET %s"
    with cursor() as cur:
        cur.execute(dataset_versions_sql, [model_id] + params + [size, offset]) # [size, offset] are not extended in params, so that params is not mutated and only includes the WHERE clauses params
        items = cur.fetchall()

    return items, total


def update_prediction(
        prediction_id: str,
        name: Optional[str] = None,
        model_id: Optional[str] = None,
        input_uri: Optional[str] = None,
        inputs_json: Optional[str] = None,
        outputs_json: Optional[str] = None,
        outputs_uri: Optional[str] = None,
        status: Optional[str] = None,
        requested_by: Optional[str] = None,
        ) -> bool:
    sql, params = _build_update_sql("predictions", "id", prediction_id, {
        "name": name,
        "model_id": model_id,
        "input_uri": input_uri,
        "inputs_json": inputs_json,
        "outputs_json": outputs_json,
        "outputs_uri": outputs_uri,
        "status": status,
        "requested_by": requested_by,
        })
    if not sql:
        return False
    with cursor() as cur:
        cur.execute(sql, params)
        return cur.rowcount > 0
    

# -------------------------------------------------------------------
# DASHBOARD STATS
# -------------------------------------------------------------------

def get_dashboard_stats() -> Optional[dict]:
    sql = """
    SELECT
      (SELECT COUNT(*) FROM users)            AS users,
      (SELECT COUNT(*) FROM datasets)         AS datasets,
      (SELECT COUNT(*) FROM dataset_versions) AS dataset_versions,
      (SELECT COUNT(*) FROM ml_problems)      AS ml_problems,
      (SELECT COUNT(*) FROM models)           AS models,
      (SELECT COUNT(*) FROM jobs)             AS jobs,
      (SELECT COUNT(*) FROM predictions)      AS predictions
    """
    with cursor() as cur:
        cur.execute(sql)
        return cur.fetchone()


# -------------------------------------------------------------------
# DELETE HELPERS
# -------------------------------------------------------------------

def delete_prediction(prediction_id: str) -> bool:
    sql = "DELETE FROM predictions WHERE id=%s"
    with cursor() as cur:
        cur.execute(sql, (prediction_id,))
        return cur.rowcount > 0


def delete_job(job_id: str) -> bool:
    sql = "DELETE FROM jobs WHERE id=%s"
    with cursor() as cur:
        cur.execute(sql, (job_id,))
        return cur.rowcount > 0


def delete_model(model_id: str) -> bool:
    """
    Deletes:
      - predictions (by model_id)
      - jobs (by model_id)
      - clears ml_problems.current_model_id if it matches
      - model row
    """
    with cursor() as cur:
        cur.execute("DELETE FROM predictions WHERE model_id=%s", (model_id,))
        cur.execute("DELETE FROM jobs WHERE model_id=%s", (model_id,))
        cur.execute("UPDATE ml_problems SET current_model_id=NULL WHERE current_model_id=%s", (model_id,))
        cur.execute("DELETE FROM models WHERE id=%s", (model_id,))
        return cur.rowcount > 0


def delete_ml_problem(problem_id: str) -> bool:
    """
    Deletes:
      - models (+ predictions/jobs)
      - jobs (by problem_id)
      - ml_problem row
    """
    with cursor() as cur:
        cur.execute("SELECT id FROM models WHERE problem_id=%s", (problem_id,))
        model_ids = [r["id"] for r in (cur.fetchall() or [])]

    for mid in model_ids:
        delete_model(mid)

    with cursor() as cur:
        cur.execute("DELETE FROM jobs WHERE problem_id=%s", (problem_id,))
        cur.execute("DELETE FROM ml_problems WHERE id=%s", (problem_id,))
        return cur.rowcount > 0


def delete_dataset_version(version_id: str) -> bool:
    """
    Deletes:
      - ml_problems (+ models/predictions/jobs)
      - dataset_version row
    """
    with cursor() as cur:
        cur.execute("SELECT id FROM ml_problems WHERE dataset_version_id=%s", (version_id,))
        problem_ids = [r["id"] for r in (cur.fetchall() or [])]

    for pid in problem_ids:
        delete_ml_problem(pid)

    with cursor() as cur:
        cur.execute("DELETE FROM dataset_versions WHERE id=%s", (version_id,))
        return cur.rowcount > 0


def delete_dataset(dataset_id: str) -> bool:
    """
    Deletes:
      - dataset_versions (+ problems/models/predictions/jobs)
      - dataset row
    """
    with cursor() as cur:
        cur.execute("SELECT id FROM dataset_versions WHERE dataset_id=%s", (dataset_id,))
        version_ids = [r["id"] for r in (cur.fetchall() or [])]

    for vid in version_ids:
        delete_dataset_version(vid)

    with cursor() as cur:
        cur.execute("DELETE FROM datasets WHERE id=%s", (dataset_id,))
        return cur.rowcount > 0


# -------------------------------------------------------------------
# JOIN HELPERS
# -------------------------------------------------------------------

def get_dataset_version_detail(version_id: str) -> Optional[dict]:
    """
    Returns dataset_versions + dataset name/owner_id.
    """
    sql = """
        SELECT dv.*, d.name AS dataset_name, d.owner_id AS dataset_owner_id
        FROM dataset_versions dv
        JOIN datasets d ON d.id = dv.dataset_id
        WHERE dv.id = %s
    """
    with cursor() as cur:
        cur.execute(sql, (version_id,))
        return cur.fetchone()


def get_ml_problem_detail(problem_id: str) -> Optional[dict]:
    """
    Returns ml_problems + dataset_version info + dataset name.
    """
    sql = """
        SELECT mp.*,
               dv.id AS dataset_version_id,
               dv.created_at AS dataset_version_created_at,
               d.id AS dataset_id,
               d.name AS dataset_name
        FROM ml_problems mp
        JOIN dataset_versions dv ON dv.id = mp.dataset_version_id
        JOIN datasets d ON d.id = dv.dataset_id
        WHERE mp.id = %s
    """
    with cursor() as cur:
        cur.execute(sql, (problem_id,))
        return cur.fetchone()


def get_model_detail(model_id: str) -> Optional[dict]:
    """
    Returns models + problem task/target + dataset name.
    """
    sql = """
        SELECT m.*,
               mp.task AS problem_task,
               mp.target AS problem_target,
               d.name AS dataset_name
        FROM models m
        JOIN ml_problems mp ON mp.id = m.problem_id
        JOIN dataset_versions dv ON dv.id = mp.dataset_version_id
        JOIN datasets d ON d.id = dv.dataset_id
        WHERE m.id = %s
    """
    with cursor() as cur:
        cur.execute(sql, (model_id,))
        return cur.fetchone()
    
    
# -------------------------------------------------------------------
# JOIN FUNCTIONS
# -------------------------------------------------------------------


ALLOWED_DATASET_VERSION_JOIN_SORT_FIELDS = {
    "dataset_name": "d.name",
    "name": "dv.name",
    "created_at": "dv.created_at",
}

def get_dataset_versions_all_joined(
    page: int,
    size: int,
    sort: str,
    dir: Literal["asc", "desc"],
    q: Optional[str] = None,
    dataset_name: Optional[str] = None,
    version_name: Optional[str] = None,
) -> Tuple[List[Dict], int]:
    """
    Return (items, total) for ALL dataset_versions,
    joined with datasets for names only.
    """
    ### SORTING ###
    sort_column = ALLOWED_DATASET_VERSION_JOIN_SORT_FIELDS.get(sort, "dv.created_at")
    dir_sql = "ASC" if dir == "asc" else "DESC"

    ### WHERE CLAUSES ###
    where_clauses = []
    params = []

    if q:
        like = f"%{q}%"
        where_clauses.append("(d.name LIKE %s OR dv.name LIKE %s)")
        params.extend([like, like])

    if dataset_name:
        like = f"%{dataset_name}%"
        where_clauses.append("d.name LIKE %s")
        params.append(like)

    if version_name:
        like = f"%{version_name}%"
        where_clauses.append("dv.name LIKE %s")
        params.append(like)

    where_sql = ""
    if where_clauses:
        where_sql = "WHERE " + " AND ".join(where_clauses)

    ### TOTAL ###
    count_sql = f"""
        SELECT COUNT(*) AS total
        FROM dataset_versions dv
        JOIN datasets d ON d.id = dv.dataset_id
        {where_sql}
    """
    with cursor() as cur:
        cur.execute(count_sql, params)
        row = cur.fetchone()
        total = row["total"] if row else 0

    ### RETURN ###
    offset = (page - 1) * size
    items_sql = f"""
        SELECT
            dv.*,
            d.id   AS dataset_id,
            d.name AS dataset_name
        FROM dataset_versions dv
        JOIN datasets d ON d.id = dv.dataset_id
        {where_sql}
        ORDER BY {sort_column} {dir_sql}
        LIMIT %s OFFSET %s
    """
    with cursor() as cur:
        cur.execute(items_sql, params + [size, offset])
        items = cur.fetchall()

    return items, total


ALLOWED_ML_PROBLEM_JOINED_SORT_FIELDS = {
    "name": "mp.name",
    "task": "mp.task",
    "target": "mp.target",
    "dataset_version_name": "dv.name",
    "dataset_name": "d.name",
    "created_at": "mp.created_at",
}

def get_ml_problems_all_joined(
    page: int,
    size: int,
    sort: str,
    dir: Literal["asc", "desc"],
    q: Optional[str] = None,
    id: Optional[str] = None,
    task: Optional[str] = None,
    target: Optional[str] = None,
    dataset_name: Optional[str] = None,
    dataset_version_name: Optional[str] = None,
    problem_name: Optional[str] = None,
) -> Tuple[List[Dict], int]:
    """
    Return (items, total) for ALL ml_problems, joined for names only:
      - dv.name AS dataset_version_name
      - d.name  AS dataset_name
    """
    ### SORTING ###
    sort_column = ALLOWED_ML_PROBLEM_JOINED_SORT_FIELDS.get(sort, "mp.created_at")
    dir_sql = "ASC" if dir == "asc" else "DESC"

    ### WHERE CLAUSES ###
    where_clauses = []
    params = []

    if q:
        like = f"%{q}%"
        where_clauses.append(
            "("
            "mp.name LIKE %s OR mp.task LIKE %s OR mp.target LIKE %s OR "
            "dv.name LIKE %s OR d.name LIKE %s"
            ")"
        )
        params.extend([like, like, like, like, like])

    if id:
        where_clauses.append("mp.id = %s")
        params.append(id)

    if problem_name:
        like = f"%{problem_name}%"
        where_clauses.append("mp.name LIKE %s")
        params.append(like)

    if task:
        like = f"%{task}%"
        where_clauses.append("mp.task LIKE %s")
        params.append(like)

    if target:
        like = f"%{target}%"
        where_clauses.append("mp.target LIKE %s")
        params.append(like)

    if dataset_version_name:
        like = f"%{dataset_version_name}%"
        where_clauses.append("dv.name LIKE %s")
        params.append(like)

    if dataset_name:
        like = f"%{dataset_name}%"
        where_clauses.append("d.name LIKE %s")
        params.append(like)

    where_sql = ""
    if where_clauses:
        where_sql = "WHERE " + " AND ".join(where_clauses)

    ### TOTAL ###
    count_sql = f"""
        SELECT COUNT(*) AS total
        FROM ml_problems mp
        JOIN dataset_versions dv ON dv.id = mp.dataset_version_id
        JOIN datasets d ON d.id = dv.dataset_id
        {where_sql}
    """
    with cursor() as cur:
        cur.execute(count_sql, params)
        row = cur.fetchone()
        total = row["total"] if row else 0

    ### RETURN ###
    offset = (page - 1) * size
    items_sql = f"""
        SELECT
            mp.*,
            dv.id   AS dataset_version_id,
            dv.name AS dataset_version_name,
            d.id    AS dataset_id,
            d.name  AS dataset_name
        FROM ml_problems mp
        JOIN dataset_versions dv ON dv.id = mp.dataset_version_id
        JOIN datasets d ON d.id = dv.dataset_id
        {where_sql}
        ORDER BY {sort_column} {dir_sql}
        LIMIT %s OFFSET %s
    """
    with cursor() as cur:
        cur.execute(items_sql, params + [size, offset])
        items = cur.fetchall()

    return items, total


ALLOWED_MODEL_JOINED_SORT_FIELDS = {
    "name": "m.name",
    "status": "m.status",
    "created_at": "m.created_at",
    "algorithm": "m.algorithm",
    "train_mode": "m.train_mode",
    "evaluation_strategy": "m.evaluation_strategy",
    "problem_name": "mp.name",
    "dataset_version_name": "dv.name",
    "dataset_name": "d.name",
}

def get_models_all_joined(
    page: int,
    size: int,
    sort: str,
    dir: Literal["asc", "desc"],
    q: Optional[str] = None,
    id: Optional[str] = None,
    name: Optional[str] = None,
    algorithm: Optional[str] = None,
    train_mode: Optional[str] = None,
    evaluation_strategy: Optional[str] = None,
    status: Optional[str] = None,
    problem_name: Optional[str] = None,
    dataset_version_name: Optional[str] = None,
    dataset_name: Optional[str] = None,
) -> Tuple[List[Dict], int]:
    """
    Return (items, total) for ALL models, joined for names only:
      - mp.name AS problem_name
      - dv.name AS dataset_version_name
      - d.name  AS dataset_name
    """
    ### SORTING ###
    sort_column = ALLOWED_MODEL_JOINED_SORT_FIELDS.get(sort, "m.created_at")
    dir_sql = "ASC" if dir == "asc" else "DESC"

    ### WHERE CLAUSES ###
    where_clauses = []
    params = []

    if q:
        like = f"%{q}%"
        where_clauses.append(
            "("
            "m.name LIKE %s OR m.algorithm LIKE %s OR m.train_mode LIKE %s OR "
            "m.evaluation_strategy LIKE %s OR "
            "mp.name LIKE %s OR dv.name LIKE %s OR d.name LIKE %s"
            ")"
        )
        params.extend([like, like, like, like, like, like, like])

    if id:
        where_clauses.append("m.id = %s")
        params.append(id)

    if name:
        like = f"%{name}%"
        where_clauses.append("m.name LIKE %s")
        params.append(like)

    if algorithm:
        like = f"%{algorithm}%"
        where_clauses.append("m.algorithm LIKE %s")
        params.append(like)

    if train_mode:
        like = f"%{train_mode}%"
        where_clauses.append("m.train_mode LIKE %s")
        params.append(like)

    if evaluation_strategy:
        like = f"%{evaluation_strategy}%"
        where_clauses.append("m.evaluation_strategy LIKE %s")
        params.append(like)

    if status:
        like = f"%{status}%"
        where_clauses.append("m.status LIKE %s")
        params.append(like)

    if problem_name:
        like = f"%{problem_name}%"
        where_clauses.append("mp.name LIKE %s")
        params.append(like)

    if dataset_version_name:
        like = f"%{dataset_version_name}%"
        where_clauses.append("dv.name LIKE %s")
        params.append(like)

    if dataset_name:
        like = f"%{dataset_name}%"
        where_clauses.append("d.name LIKE %s")
        params.append(like)

    where_sql = ""
    if where_clauses:
        where_sql = "WHERE " + " AND ".join(where_clauses)

    ### TOTAL ###
    count_sql = f"""
        SELECT COUNT(*) AS total
        FROM models m
        JOIN ml_problems mp ON mp.id = m.problem_id
        JOIN dataset_versions dv ON dv.id = mp.dataset_version_id
        JOIN datasets d ON d.id = dv.dataset_id
        {where_sql}
    """
    with cursor() as cur:
        cur.execute(count_sql, params)
        row = cur.fetchone()
        total = row["total"] if row else 0

    ### RETURN ###
    offset = (page - 1) * size
    items_sql = f"""
        SELECT
            m.*,
            mp.id   AS problem_id,
            mp.name AS problem_name,
            dv.id   AS dataset_version_id,
            dv.name AS dataset_version_name,
            d.id    AS dataset_id,
            d.name  AS dataset_name
        FROM models m
        JOIN ml_problems mp ON mp.id = m.problem_id
        JOIN dataset_versions dv ON dv.id = mp.dataset_version_id
        JOIN datasets d ON d.id = dv.dataset_id
        {where_sql}
        ORDER BY {sort_column} {dir_sql}
        LIMIT %s OFFSET %s
    """
    with cursor() as cur:
        cur.execute(items_sql, params + [size, offset])
        items = cur.fetchall()

    return items, total


ALLOWED_PREDICTION_JOINED_SORT_FIELDS = {
    "name": "p.name",
    "created_at": "p.created_at",
    "status": "p.status",
    "model_name": "m.name",
    "problem_name": "mp.name",
    "dataset_version_name": "dv.name",
    "dataset_name": "d.name",
}

def get_predictions_all_joined(
    page: int,
    size: int,
    sort: str,
    dir: Literal["asc", "desc"],
    q: Optional[str] = None,
    id: Optional[str] = None,
    name: Optional[str] = None,
    status: Optional[str] = None,
    model_name: Optional[str] = None,
    problem_name: Optional[str] = None,
    dataset_version_name: Optional[str] = None,
    dataset_name: Optional[str] = None,
) -> Tuple[List[Dict], int]:
    """
    Return (items, total) for ALL predictions, joined for names only:
      - m.name  AS model_name
      - mp.name AS problem_name
      - dv.name AS dataset_version_name
      - d.name  AS dataset_name
    """
    ### SORTING ###
    sort_column = ALLOWED_PREDICTION_JOINED_SORT_FIELDS.get(sort, "p.created_at")
    dir_sql = "ASC" if dir == "asc" else "DESC"

    ### WHERE CLAUSES ###
    where_clauses = []
    params = []

    if q:
        like = f"%{q}%"
        where_clauses.append(
            "("
            "p.name LIKE %s OR "
            "m.name LIKE %s OR mp.name LIKE %s OR dv.name LIKE %s OR d.name LIKE %s"
            ")"
        )
        params.extend([like, like, like, like, like])

    if id:
        where_clauses.append("p.id = %s")
        params.append(id)

    if name:
        like = f"%{name}%"
        where_clauses.append("p.name LIKE %s")
        params.append(like)

    if status:
        like = f"%{status}%"
        where_clauses.append("p.status LIKE %s")
        params.append(like)

    if model_name:
        like = f"%{model_name}%"
        where_clauses.append("m.name LIKE %s")
        params.append(like)

    if problem_name:
        like = f"%{problem_name}%"
        where_clauses.append("mp.name LIKE %s")
        params.append(like)

    if dataset_version_name:
        like = f"%{dataset_version_name}%"
        where_clauses.append("dv.name LIKE %s")
        params.append(like)

    if dataset_name:
        like = f"%{dataset_name}%"
        where_clauses.append("d.name LIKE %s")
        params.append(like)

    where_sql = ""
    if where_clauses:
        where_sql = "WHERE " + " AND ".join(where_clauses)

    ### TOTAL ###
    count_sql = f"""
        SELECT COUNT(*) AS total
        FROM predictions p
        JOIN models m ON m.id = p.model_id
        JOIN ml_problems mp ON mp.id = m.problem_id
        JOIN dataset_versions dv ON dv.id = mp.dataset_version_id
        JOIN datasets d ON d.id = dv.dataset_id
        {where_sql}
    """
    with cursor() as cur:
        cur.execute(count_sql, params)
        row = cur.fetchone()
        total = row["total"] if row else 0

    ### RETURN ###
    offset = (page - 1) * size
    items_sql = f"""
        SELECT
            p.*,
            m.id    AS model_id,
            m.name  AS model_name,
            mp.id   AS problem_id,
            mp.name AS problem_name,
            dv.id   AS dataset_version_id,
            dv.name AS dataset_version_name,
            d.id    AS dataset_id,
            d.name  AS dataset_name
        FROM predictions p
        JOIN models m ON m.id = p.model_id
        JOIN ml_problems mp ON mp.id = m.problem_id
        JOIN dataset_versions dv ON dv.id = mp.dataset_version_id
        JOIN datasets d ON d.id = dv.dataset_id
        {where_sql}
        ORDER BY {sort_column} {dir_sql}
        LIMIT %s OFFSET %s
    """
    with cursor() as cur:
        cur.execute(items_sql, params + [size, offset])
        items = cur.fetchall()

    return items, total


ALLOWED_ML_PREDICTION_JOINED_SORT_FIELDS = {
    "name": "p.name",
    "created_at": "p.created_at",
    "status": "p.status",
    "model_name": "m.name",
}

def get_ml_predictions_all_joined(
    problem_id: str,
    page: int,
    size: int,
    sort: str,
    dir: Literal["asc", "desc"],
    q: Optional[str] = None,
    name: Optional[str] = None,
    status: Optional[str] = None,
    model_name: Optional[str] = None,
) -> Tuple[List[Dict], int]:
    """
    Return (items, total) for ALL predictions of a given problem_id,
    joined for names only:
      - m.name AS model_name
    """

    ### SORTING ###
    sort_column = ALLOWED_ML_PREDICTION_JOINED_SORT_FIELDS.get(sort, "p.created_at")
    dir_sql = "ASC" if dir == "asc" else "DESC"

    ### WHERE CLAUSES ###
    where_clauses = ["m.problem_id = %s"]
    params = [problem_id]

    if q:
        like = f"%{q}%"
        where_clauses.append(
            "("
            "p.name LIKE %s OR "
            "m.name LIKE %s"
            ")"
        )
        params.extend([like, like])

    if name:
        where_clauses.append("p.name LIKE %s")
        params.append(f"%{name}%")

    if status:
        where_clauses.append("p.status LIKE %s")
        params.append(f"%{status}%")

    if model_name:
        where_clauses.append("m.name LIKE %s")
        params.append(f"%{model_name}%")

    where_sql = "WHERE " + " AND ".join(where_clauses)

    ### TOTAL ###
    count_sql = f"""
        SELECT COUNT(*) AS total
        FROM predictions p
        JOIN models m ON m.id = p.model_id
        {where_sql}
    """
    with cursor() as cur:
        cur.execute(count_sql, params)
        row = cur.fetchone()
        total = row["total"] if row else 0

    ### ITEMS ###
    offset = (page - 1) * size
    items_sql = f"""
        SELECT
            p.*,
            m.id   AS model_id,
            m.name AS model_name
        FROM predictions p
        JOIN models m ON m.id = p.model_id
        {where_sql}
        ORDER BY {sort_column} {dir_sql}
        LIMIT %s OFFSET %s
    """
    with cursor() as cur:
        cur.execute(items_sql, params + [size, offset])
        items = cur.fetchall()

    return items, total


# -------------------------------------------------------------------
# SET MODEL TO PRODUCTION
# -------------------------------------------------------------------

@contextlib.contextmanager
def prod_cursor():
    conn = get_conn()
    conn.autocommit = False
    try:
        with conn.cursor() as cur:
            yield cur
            conn.commit()
    except Exception:
        conn.rollback()
        raise 
    finally:
        conn.close()

def set_model_to_production(problem_id: str, model_id: str) -> bool:
    sql_lock = "SELECT current_model_id FROM ml_problems WHERE id = %s FOR UPDATE" # FOR UPDATE -> Locks selected row so no other transaction can modify it
    sql_update_models = "UPDATE models SET status = %s WHERE id = %s AND problem_id = %s"
    sql_update_ml_problems = "UPDATE ml_problems SET current_model_id = %s WHERE id = %s"
    with prod_cursor() as cur: 
        cur.execute(sql_lock, (problem_id,))

        row = cur.fetchone()
        # If row/ml_problem doesn't exist return False
        if not row:
            return False
        
        prev_model_id = row["current_model_id"]
        if prev_model_id and prev_model_id != model_id:
            cur.execute(sql_update_models, ("archived", prev_model_id, problem_id))
        
        cur.execute(sql_update_models, ("production", model_id, problem_id))
        # Validation check that model belongs to this ml_problem and that it exists
        if cur.rowcount == 0:
            raise ValueError(f"Model with id: {model_id} was not found for the ml_problem with id: {problem_id}")
        
        cur.execute(sql_update_ml_problems, (model_id, problem_id))

        return True


