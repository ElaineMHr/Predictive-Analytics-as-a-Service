from sklearn.pipeline import Pipeline
from mlcore.io.preset_loader import loader
from mlcore.io.data_reader import get_dataframe_from_csv, preprocess_dataframe, get_semantic_types
from mlcore.io.model_saver import save_model
from mlcore.io.metadata_saver import save_metadata
from mlcore.profile.profiler import suggest_profile
from mlcore.explain.explanator import explain_model
from mlcore.metrics.metrics_calculator import calculate_metrics
from mlcore.metrics.cv_calculator import calculate_cv
from mlcore.explain.get_feature_names import get_feature_names
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from typing import Literal, Tuple
import pandas as pd
from db.db import db_get_dataset_version, get_ml_problem, create_model, update_model
import json
from pathlib import Path
import logging
logger = logging.getLogger(__name__)

BASE_DIR = "./testdata/models"
PRESET_DIR = "/code/mlcore/presets"
NAME = None

def train(
    name: str,
    problem_id: str,
    model_id: str | None = None,
    model_uri: str | None = None,
    algorithm: str = "auto",
    train_mode: Literal["fast", "balanced", "accurate"] = "balanced",
    evaluation_strategy: Literal["cv", "holdout"] = "cv",
    explain: bool = True,
    test_size_ratio: float = 0.2,
    random_seed: int = 42,
    preset_dir: str = PRESET_DIR,
) -> Tuple[str, str]:

    problem = get_ml_problem(problem_id)
    dataset_version_id = problem.get("dataset_version_id", False)
    target = problem.get("target", False)
    dataset_version = db_get_dataset_version(dataset_version_id)

    df = get_dataframe_from_csv(
        dataset_version.get("uri", False))
    raw_profile = dataset_version.get("profile_json")
    profile = json.loads(raw_profile) if isinstance(
        raw_profile, str) else raw_profile
    if not profile:
        profile = suggest_profile(pd.DataFrame(df))
    # multi_class = profile.get("columns", {}).get(
    #     target, {}).get("cardinality", 0) > 2

    feature_strategy_json = problem.get("feature_strategy_json", False)
    if feature_strategy_json:
        feature_strategy = json.loads(feature_strategy_json)
    else:
        feature_strategy = "auto"

    X, y = preprocess_dataframe(df, target, profile, feature_strategy)
    semantic_types = get_semantic_types(X, profile)
    task = problem.get("task")

    categorical = semantic_types["categorical"]
    numeric = semantic_types["numeric"]
    boolean = semantic_types["boolean"]

    if task == "classification":
        X_train, X_test, y_train, y_test = train_test_split(
            # stratify to keep class proportions
            X, y, test_size=test_size_ratio, stratify=y, random_state=random_seed
        )
    else:
        X_train, X_test, y_train, y_test = train_test_split(
            # no stratify for regression
            X, y, test_size=test_size_ratio, random_state=random_seed
        )

    label_encoder = None
    if task == "classification":
        label_encoder = LabelEncoder()
        label_encoder.fit(y_train)
        y_train = label_encoder.transform(y_train)
        y_test = label_encoder.transform(y_test)

    build_model = loader(task, algorithm.lower(), preset_dir)

    model, metadata = build_model(categorical, numeric, boolean, train_mode)

    logger.info("[TRAIN] fitting model...")
    model.fit(X_train, y_train)
    logger.info("[TRAIN] fit done")

    est = model.named_steps["est"]
    pre = model.named_steps["pre"]

    if algorithm.lower() == "auto":
        metadata["selected_model"] = est.best_model_name_

    logger.info("[TRAIN] predicting holdout...")
    y_pred = model.predict(X_test)
    logger.info("[TRAIN] predict done")

    if label_encoder is not None:
        y_test_dec = label_encoder.inverse_transform(y_test)
        y_pred_dec = label_encoder.inverse_transform(y_pred)
    else:
        y_test_dec = y_test
        y_pred_dec = y_pred

    metrics = calculate_metrics(y_test_dec, y_pred_dec, task) #, multi_class)

    if evaluation_strategy == "cv":
        logger.info("[TRAIN] starting CV...")
        if algorithm.lower() == "auto":
            metadata["cross_validation"] = est.cv_summary_
        else:
            cv = calculate_cv(model, X_train, y_train, task) #, multi_class)
            metadata["cross_validation"] = cv
        logger.info("[TRAIN] CV done")

    explaination_summary = {}
    label_classes = None
    if task == "classification":
        label_classes = label_encoder.classes_.tolist()

    if explain:
        logger.info("[TRAIN] starting explain...")
        if algorithm.lower() == "auto":
            model_shap = est.best_estimator_
        else:
            model_shap = est

        # Get feature names from transformed output
        feature_info = get_feature_names(pre)
        feature_names = feature_info["feature_names"]
        feature_parents = feature_info["feature_parents"]

        # Store in metadata for UI + future use
        metadata["feature_names"] = feature_names
        metadata["feature_parents"] = feature_parents

        X_train_shap = pre.transform(X_train)
        X_test_shap = pre.transform(X_test)
        # explanation = explain_model(task, model_shap, X_train_shap, X_test_shap)
        explaination_summary = explain_model(
            task=task,
            model=model_shap,
            X_train=X_train_shap,
            X_test=X_test_shap,
            feature_names=feature_names,
            feature_parents=feature_parents,
            label_classes=label_classes,
            n_ref_max=200,
            n_explain_max=500,
            top_k=30,
            include_distributions=True,
            random_seed=random_seed,
        )
        logger.info("[TRAIN] explain done")

    metadata["model_name"] = name
    metadata["problem_id"] = problem_id
    metadata["target"] = target
    metadata["schema_snapshot"]["X"] = {
        column: str(X[column].dtype) for column in X.columns
    }
    metadata["schema_snapshot"]["y"] = {
        y.name: str(y.dtype)
    }
    metadata["schema_snapshot"]["feature_order"] = list(X.columns)
    metadata["metrics"] = metrics
    if explaination_summary:
        metadata["explanation"] = explaination_summary
    
    if task == "classification":
        metadata["label_classes"] = label_classes

    if not model_id and not model_uri:
        model_id, model_uri = create_model(
            problem_id=problem_id,
            algorithm=algorithm.lower(),
            status="staging",
            train_mode=train_mode,
            evaluation_strategy=evaluation_strategy,
            metrics_json=metrics,
            uri=None,
            metadata_json=metadata,
            explanation_json=explaination_summary,
            created_by=NAME,
            name=name,
        )
        metadata["model_id"] = model_id
        metadata["model_uri"] = model_uri
    else:
        metadata["model_id"] = model_id
        metadata["model_uri"] = model_uri
        update_model(
            model_id=model_id,
            status="staging",
            metrics_json=json.dumps(metrics),
            uri=model_uri,
            metadata_json=json.dumps(metadata),
            explanation_json=json.dumps(explaination_summary),
        )

    parent_path = Path(model_uri).parent

    if algorithm.lower() == "auto":
        model_to_save = Pipeline([
            ("pre", pre),
            ("est", est.best_estimator_),
        ])
    else:
        model_to_save = model

    if save_model(model_to_save, parent_path):
        logger.info(f"[SAVE_MODEL] Model saved at: {model_uri}")
        if save_metadata(metadata, parent_path):
            logger.info(f"[SAVE_MODEL_METADATA] Model's metadata saved at: {model_uri}")
            return model_id, model_uri
        else:
            logger.error(f"[SAVE_MODEL_METADATA] Failed to save model's metadata at: {model_uri}")
            raise RuntimeError(
                f"Failed to save the model's metadata at {parent_path}")
    else:
        logger.error(f"[SAVE_MODEL] Failed to save model at: {model_uri}")
        raise RuntimeError(f"Failed to save the model at {parent_path}")
