from db import db
from db.init_test_db import main as init_test_db_main
from mlcore.predict.predictor import predict
from .trainer import train
import os
import pymysql
import pytest
from ..presets import presets_path
TEST_DB = "team1_db_test"
os.environ.update({"DB_NAME": TEST_DB, "DB_HOST": "127.0.0.1",
                  "DB_USER": "team1_user", "DB_PASS": "team1_pass"})


def bootstrap_problem_id():
    try:
        init_test_db_main("src/db/test_db.txt", reset=True)
    except (pymysql.err.OperationalError, SystemExit) as e:
        pytest.skip(f"Skipping trainer test: MySQL not available ({e})")
    except Exception as e:
        pytest.skip(f"Skipping trainer test: DB init failed ({e})")
    with db.cursor() as cur:
        cur.execute(
            "SELECT id FROM ml_problems ORDER BY created_at DESC LIMIT 1")
        row = cur.fetchone()
        return row["id"]


def test_trainer():
    problem_id = bootstrap_problem_id()
    model_id, model_uri = train(problem_id, algorithm="random_forest", preset_dir= presets_path)
    input_uri = "./testdata/test_predict.csv"
    prediction = predict(input_uri=input_uri, model_uri=model_uri)
    print(prediction)
    assert model_uri


if __name__ == "__main__":
    test_trainer()
