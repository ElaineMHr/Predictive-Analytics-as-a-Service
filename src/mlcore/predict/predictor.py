import json
from typing import Any
import pandas as pd
from pathlib import Path
from mlcore.io.data_reader import get_dataframe_from_csv
from mlcore.io.model_loader import load_model
from mlcore.io.metadata_loader import load_metadata
from db.db import get_ml_problem, get_model, create_prediction, update_prediction
import numpy as np
import logging
logger = logging.getLogger(__name__)

def predict(
    name: str,
    prediction_id: str | None = None,
    input_df: pd.DataFrame | None = None,
    input_uri: str | None = None,
    problem_id: str | None = None,
    model_id: str | None = "production",
) -> tuple[pd.DataFrame, Any, dict]:

    if input_df is None and not input_uri:
        raise ValueError(
            "No input dataframe was specified. Provide an input or an input_uri.")

    if model_id == "production" and not problem_id:
        raise ValueError(
            "Not specified which model to load. Provide a problem_id or a model_id.")

    if input_uri:
        X = get_dataframe_from_csv(input_uri)
    else:
        X = input_df
    if X is None:
        raise ValueError("Input resolved to None.")

    if model_id == "production":
        problem = get_ml_problem(problem_id)
        if not problem.get("current_model_id"):
            raise ValueError("No production model set for this problem.")
        model_id = problem.get("current_model_id")
        model_db = get_model(model_id)
        if not model_db or not model_db.get("uri"):
            raise ValueError(f"Model '{model_id}' not found or has no uri.")
        model_path = Path(model_db.get("uri"))
        model = load_model(model_uri=model_path)
        metadata_path = model_path.with_name("metadata.json")
        metadata = load_metadata(metadata_path)
        target = metadata.get("target")
    else:
        model_db = get_model(model_id)
        model_path = Path(model_db.get("uri", False))
        model = load_model(model_uri=model_path)
        metadata_path = model_path.with_name("metadata.json")
        metadata = load_metadata(metadata_path)
        target = metadata.get("target")

    if target in X.columns:
        X = X.drop(columns=[target])

    # Check schema snapshot and feature order and compare with X -> reorder if needed
    schema_snapshot = metadata.get("schema_snapshot")
    if not schema_snapshot:
        raise ValueError("schema_snapshot is missing from model metadata.")
    feature_order = schema_snapshot.get("feature_order")
    if not feature_order:
        raise ValueError("schema_snapshot.feature_order is missing from model metadata.")

    input_order = list(X.columns)

    # Empty or invalid columns names check
    if any(column is None or column.strip() == "" for column in input_order):
        raise ValueError("Input contains empty or invalid column names.")

    # Duplicate columns check
    if len(set(input_order)) != len(input_order):
        raise ValueError("Input contains duplicate column names.")

    # Missing columns check
    expected = set(feature_order)
    got = set(input_order)

    missing = [column for column in feature_order if column not in got]
    if missing:
        raise ValueError(f"Missing required columns: {missing}")

    # Extra columns check
    extra = [column for column in input_order if column not in expected]
    if extra:
        logger.warning("[PREDICT] Dropping extra columns not used by model: {extra}")
        # X = X.drop(columns=extra)

    # Reorder to training order for safety (X.drop is integrated here)
    X = X[feature_order]

    y_pred = model.predict(X)

    label_classes = metadata.get("label_classes", None)
    if label_classes is not None:
        classes = np.array(label_classes, dtype=object) # dtype=object is not "needed", it is just for safety
        y_pred = classes[y_pred]

    prediction_summary = {
        "X": X.to_dict(orient="records"),
        "y_pred": y_pred.tolist() if hasattr(y_pred, "tolist") else list(y_pred),
        "model_metadata": metadata,
    }

    if input_df is None:
        inputs_to_store = None
    else:
        inputs_to_store = input_df.to_dict(orient="records")

    if not prediction_id:
        create_prediction(
            name=name,
            model_id=model_id,
            input_uri=input_uri,
            input_json=inputs_to_store,
            output_json=prediction_summary,
            output_uri=None,
            status="completed",
            requested_by=None,
            )
    else:
        update_prediction(
            prediction_id=prediction_id,
            model_id=model_id,
            input_uri=input_uri,
            inputs_json=json.dumps(inputs_to_store),
            outputs_json=json.dumps(prediction_summary),
            outputs_uri=None,
            status="completed",
            requested_by=None
            )

    return X, y_pred, prediction_summary
