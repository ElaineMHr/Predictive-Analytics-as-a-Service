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
        uri = "/tmp/uploads/demo_iris.csv"

        cur.execute(
            """
            INSERT INTO dataset_versions
                (id, name, dataset_id, filename, uri, schema_json, profile_json, row_count)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (id) DO NOTHING
            """,
            (
                SEED_VERSION_ID,
                "v1 — Iris",
                SEED_DATASET_ID,
                "demo_iris.csv",
                uri,
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
                uri,
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
