"""
Portfolio seed script — populates demo data for the lightweight deployment.
Idempotent: uses INSERT ... ON CONFLICT DO NOTHING so it is safe to run twice.

Usage:
    PYTHONPATH=src python -m db.seed_portfolio
    or invoked automatically when SEED_TEST_DATA=true via api/main.py startup.
"""
from __future__ import annotations

import uuid
import json

try:
    from config import settings
except ImportError:
    from src.config import settings

# Fixed UUIDs so the seed is idempotent (ON CONFLICT DO NOTHING + stable IDs)
SEED_USER_ID = "00000000-0000-0000-0000-000000000001"
SEED_DATASET_ID = "00000000-0000-0000-0000-000000000002"
SEED_VERSION_ID = "00000000-0000-0000-0000-000000000003"
SEED_PROBLEM_ID = "00000000-0000-0000-0000-000000000004"
SEED_MODEL_ID = "00000000-0000-0000-0000-000000000005"
SEED_PREDICTION_ID = "00000000-0000-0000-0000-000000000006"


def seed(conn) -> None:
    """Insert demo rows. conn must be a psycopg2 connection (autocommit=True)."""
    with conn.cursor() as cur:
        # Users
        cur.execute(
            """
            INSERT INTO users (id, username, email)
            VALUES (%s, %s, %s)
            ON CONFLICT (id) DO NOTHING
            """,
            (SEED_USER_ID, "demo_user", "demo@example.com"),
        )

        # Dataset
        cur.execute(
            """
            INSERT INTO datasets (id, name, owner_id)
            VALUES (%s, %s, %s)
            ON CONFLICT (id) DO NOTHING
            """,
            (SEED_DATASET_ID, "Demo Iris Dataset", SEED_USER_ID),
        )

        # Dataset version
        profile_json = json.dumps({
            "summary": {"n_rows": 150, "n_cols": 5},
            "columns": {
                "sepal_length": {"semantic_type": "numeric"},
                "sepal_width": {"semantic_type": "numeric"},
                "petal_length": {"semantic_type": "numeric"},
                "petal_width": {"semantic_type": "numeric"},
                "species": {"semantic_type": "categorical"},
            },
        })
        schema_json = json.dumps({
            "sepal_length": "float64",
            "sepal_width": "float64",
            "petal_length": "float64",
            "petal_width": "float64",
            "species": "object",
        })
        # CSV content stored in DB — no filesystem dependency on Render.
        iris_csv = (
            "sepal_length,sepal_width,petal_length,petal_width,species\n"
            "5.1,3.5,1.4,0.2,setosa\n5.4,3.9,1.7,0.4,setosa\n4.6,3.4,1.4,0.3,setosa\n"
            "5.0,3.4,1.5,0.2,setosa\n4.4,2.9,1.4,0.2,setosa\n4.9,3.1,1.5,0.1,setosa\n"
            "5.4,3.7,1.5,0.2,setosa\n4.8,3.4,1.6,0.2,setosa\n4.8,3.0,1.4,0.1,setosa\n"
            "4.3,3.0,1.1,0.1,setosa\n5.8,4.0,1.2,0.2,setosa\n5.7,4.4,1.5,0.4,setosa\n"
            "5.4,3.9,1.3,0.4,setosa\n5.1,3.5,1.4,0.3,setosa\n5.7,3.8,1.7,0.3,setosa\n"
            "5.1,3.8,1.5,0.3,setosa\n5.4,3.4,1.7,0.2,setosa\n5.1,3.7,1.5,0.4,setosa\n"
            "4.6,3.6,1.0,0.2,setosa\n5.1,3.3,1.7,0.5,setosa\n4.8,3.4,1.9,0.2,setosa\n"
            "5.0,3.0,1.6,0.2,setosa\n5.0,3.4,1.6,0.4,setosa\n5.2,3.5,1.5,0.2,setosa\n"
            "5.2,3.4,1.4,0.2,setosa\n4.7,3.2,1.6,0.2,setosa\n4.8,3.1,1.6,0.2,setosa\n"
            "5.4,3.4,1.5,0.4,setosa\n5.2,4.1,1.5,0.1,setosa\n5.5,4.2,1.4,0.2,setosa\n"
            "4.9,3.1,1.5,0.2,setosa\n5.0,3.2,1.2,0.2,setosa\n5.5,3.5,1.3,0.2,setosa\n"
            "4.9,3.6,1.4,0.1,setosa\n4.4,3.0,1.3,0.2,setosa\n5.1,3.4,1.5,0.2,setosa\n"
            "5.0,3.5,1.3,0.3,setosa\n4.5,2.3,1.3,0.3,setosa\n4.4,3.2,1.3,0.2,setosa\n"
            "5.0,3.5,1.6,0.6,setosa\n5.1,3.8,1.9,0.4,setosa\n4.8,3.0,1.4,0.3,setosa\n"
            "5.1,3.8,1.6,0.2,setosa\n4.6,3.2,1.4,0.2,setosa\n5.3,3.7,1.5,0.2,setosa\n"
            "5.0,3.3,1.4,0.2,setosa\n7.0,3.2,4.7,1.4,versicolor\n6.4,3.2,4.5,1.5,versicolor\n"
            "6.9,3.1,4.9,1.5,versicolor\n5.5,2.3,4.0,1.3,versicolor\n6.5,2.8,4.6,1.5,versicolor\n"
            "5.7,2.8,4.5,1.3,versicolor\n6.3,3.3,4.7,1.6,versicolor\n4.9,2.4,3.3,1.0,versicolor\n"
            "6.6,2.9,4.6,1.3,versicolor\n5.2,2.7,3.9,1.4,versicolor\n5.0,2.0,3.5,1.0,versicolor\n"
            "5.9,3.0,4.2,1.5,versicolor\n6.0,2.2,4.0,1.0,versicolor\n6.1,2.9,4.7,1.4,versicolor\n"
            "5.6,2.9,3.6,1.3,versicolor\n6.7,3.1,4.4,1.4,versicolor\n5.6,3.0,4.5,1.5,versicolor\n"
            "5.8,2.7,4.1,1.0,versicolor\n6.2,2.2,4.5,1.5,versicolor\n5.6,2.5,3.9,1.1,versicolor\n"
            "5.9,3.2,4.8,1.8,versicolor\n6.1,2.8,4.0,1.3,versicolor\n6.3,2.5,4.9,1.5,versicolor\n"
            "6.1,2.8,4.7,1.2,versicolor\n6.4,2.9,4.3,1.3,versicolor\n6.6,3.0,4.4,1.4,versicolor\n"
            "6.8,2.8,4.8,1.4,versicolor\n6.7,3.0,5.0,1.7,versicolor\n6.0,2.9,4.5,1.5,versicolor\n"
            "5.7,2.6,3.5,1.0,versicolor\n5.5,2.4,3.8,1.1,versicolor\n5.5,2.4,3.7,1.0,versicolor\n"
            "5.8,2.7,3.9,1.2,versicolor\n6.0,2.7,5.1,1.6,versicolor\n5.4,3.0,4.5,1.5,versicolor\n"
            "6.0,3.4,4.5,1.6,versicolor\n6.7,3.1,4.7,1.5,versicolor\n6.3,2.3,4.4,1.3,versicolor\n"
            "5.6,3.0,4.1,1.3,versicolor\n5.5,2.5,4.0,1.3,versicolor\n5.5,2.6,4.4,1.2,versicolor\n"
            "6.1,3.0,4.6,1.4,versicolor\n5.8,2.6,4.0,1.2,versicolor\n5.0,2.3,3.3,1.0,versicolor\n"
            "5.6,2.7,4.2,1.3,versicolor\n5.7,3.0,4.2,1.2,versicolor\n5.7,2.9,4.2,1.3,versicolor\n"
            "6.2,2.9,4.3,1.3,versicolor\n5.1,2.5,3.0,1.1,versicolor\n5.7,2.8,4.1,1.3,versicolor\n"
            "6.3,3.3,6.0,2.5,virginica\n5.8,2.7,5.1,1.9,virginica\n7.1,3.0,5.9,2.1,virginica\n"
            "6.3,2.9,5.6,1.8,virginica\n6.5,3.0,5.8,2.2,virginica\n7.6,3.0,6.6,2.1,virginica\n"
            "4.9,2.5,4.5,1.7,virginica\n7.3,2.9,6.3,1.8,virginica\n6.7,2.5,5.8,1.8,virginica\n"
            "7.2,3.6,6.1,2.5,virginica\n6.5,3.2,5.1,2.0,virginica\n6.4,2.7,5.3,1.9,virginica\n"
            "6.8,3.0,5.5,2.1,virginica\n5.7,2.5,5.0,2.0,virginica\n5.8,2.8,5.1,2.4,virginica\n"
            "6.4,3.2,5.3,2.3,virginica\n6.5,3.0,5.5,1.8,virginica\n7.7,3.8,6.7,2.2,virginica\n"
            "7.7,2.6,6.9,2.3,virginica\n6.0,2.2,5.0,1.5,virginica\n6.9,3.2,5.7,2.3,virginica\n"
            "5.6,2.8,4.9,2.0,virginica\n7.7,2.8,6.7,2.0,virginica\n6.3,2.7,4.9,1.8,virginica\n"
            "6.7,3.3,5.7,2.1,virginica\n7.2,3.2,6.0,1.8,virginica\n6.2,2.8,4.8,1.8,virginica\n"
            "6.1,3.0,4.9,1.8,virginica\n6.4,2.8,5.6,2.1,virginica\n7.2,3.0,5.8,1.6,virginica\n"
            "7.4,2.8,6.1,1.9,virginica\n7.9,3.8,6.4,2.0,virginica\n6.4,2.8,5.6,2.2,virginica\n"
            "6.3,2.8,5.1,1.5,virginica\n6.1,2.6,5.6,1.4,virginica\n7.7,3.0,6.1,2.3,virginica\n"
            "6.3,3.4,5.6,2.4,virginica\n6.4,3.1,5.5,1.8,virginica\n6.0,3.0,4.8,1.8,virginica\n"
            "6.9,3.1,5.4,2.1,virginica\n6.7,3.1,5.6,2.4,virginica\n6.9,3.1,5.1,2.3,virginica\n"
            "5.8,2.7,5.1,1.9,virginica\n6.8,3.2,5.9,2.3,virginica\n6.7,3.3,5.7,2.5,virginica\n"
            "6.7,3.0,5.2,2.3,virginica\n6.3,2.5,5.0,1.9,virginica\n6.5,3.0,5.2,2.0,virginica\n"
            "6.2,3.4,5.4,2.3,virginica\n5.9,3.0,5.1,1.8,virginica\n"
        )

        cur.execute(
            """
            INSERT INTO dataset_versions
                (id, name, dataset_id, filename, uri, csv_content, schema_json, profile_json, row_count)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (id) DO NOTHING
            """,
            (
                SEED_VERSION_ID,
                "v1 — Iris",
                SEED_DATASET_ID,
                "demo_iris.csv",
                None,
                iris_csv,
                schema_json,
                profile_json,
                150,
            ),
        )

        # ML Problem
        feature_strategy = json.dumps({"exclude": ["species"]})
        cur.execute(
            """
            INSERT INTO ml_problems
                (id, dataset_version_id, name, dataset_version_uri, task, target,
                 feature_strategy_json, current_model_id)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (id) DO NOTHING
            """,
            (
                SEED_PROBLEM_ID,
                SEED_VERSION_ID,
                "Iris Species Classification",
                None,
                "classification",
                "species",
                feature_strategy,
                None,
            ),
        )

        # Model
        metrics_json = json.dumps({
            "accuracy": 0.967,
            "f1_macro": 0.966,
            "precision_macro": 0.967,
            "recall_macro": 0.966,
        })
        model_uri = f"/tmp/models/{SEED_PROBLEM_ID}/{SEED_MODEL_ID}/model.joblib"
        cur.execute(
            """
            INSERT INTO models
                (id, problem_id, name, algorithm, train_mode, evaluation_strategy,
                 status, metrics_json, uri)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (id) DO NOTHING
            """,
            (
                SEED_MODEL_ID,
                SEED_PROBLEM_ID,
                "Demo Random Forest",
                "random_forest",
                "balanced",
                "cv",
                "production",
                metrics_json,
                model_uri,
            ),
        )

        # Set model as production on the problem
        cur.execute(
            """
            UPDATE ml_problems SET current_model_id = %s WHERE id = %s
              AND current_model_id IS NULL
            """,
            (SEED_MODEL_ID, SEED_PROBLEM_ID),
        )

        # Prediction
        outputs_json = json.dumps({
            "predictions": ["setosa", "versicolor", "virginica"],
            "probabilities": [[0.97, 0.02, 0.01], [0.01, 0.95, 0.04], [0.01, 0.03, 0.96]],
        })
        cur.execute(
            """
            INSERT INTO predictions
                (id, model_id, name, inputs_json, outputs_json, status)
            VALUES (%s, %s, %s, %s, %s, %s)
            ON CONFLICT (id) DO NOTHING
            """,
            (
                SEED_PREDICTION_ID,
                SEED_MODEL_ID,
                "Demo Prediction",
                json.dumps([
                    {"sepal_length": 5.1, "sepal_width": 3.5, "petal_length": 1.4, "petal_width": 0.2},
                    {"sepal_length": 6.7, "sepal_width": 3.1, "petal_length": 4.7, "petal_width": 1.5},
                    {"sepal_length": 7.7, "sepal_width": 2.6, "petal_length": 6.9, "petal_width": 2.3},
                ]),
                outputs_json,
                "completed",
            ),
        )

    print("Portfolio seed complete.")
    print(f"  user={SEED_USER_ID}")
    print(f"  dataset={SEED_DATASET_ID}  version={SEED_VERSION_ID}")
    print(f"  problem={SEED_PROBLEM_ID}  model={SEED_MODEL_ID}")
    print(f"  prediction={SEED_PREDICTION_ID}")


def run() -> None:
    import psycopg2
    import psycopg2.extras

    dsn = settings.DATABASE_URL
    print(f"Seeding portfolio demo data into PostgreSQL ...")
    conn = psycopg2.connect(dsn, cursor_factory=psycopg2.extras.RealDictCursor)
    conn.autocommit = True
    try:
        seed(conn)
    finally:
        conn.close()


if __name__ == "__main__":
    run()
