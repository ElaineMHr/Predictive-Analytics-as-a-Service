from typing import Literal, Tuple
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder
from sklearn.impute import SimpleImputer
from xgboost import XGBClassifier
from mlcore.presets.metadata_presets import metadata_preset

VERSION = "1.0"

PRESETS = {
    "n_estimators": {"fast": 300, "balanced": 800, "accurate": 2000},
    "max_depth": {"fast": 4, "balanced": 6, "accurate": 8},
    "learning_rate": {"fast": 0.1, "balanced": 0.05, "accurate": 0.03},
}

def build_model(
    categorical: list = [],
    numeric: list = [],
    boolean: list = [],
    train_mode: Literal["fast", "balanced", "accurate"] = "balanced",
    random_seed: int = 42,
) -> Tuple[Pipeline, dict]:

    metadata = {
        **metadata_preset,
        "task": "classification",
        "preset": "xgboost",
        "version": VERSION,
        "framework": "xgboost",
        "algorithm": "XGBClassifier",
        "semantic_types": {"categorical": categorical, "numeric": numeric, "boolean": boolean},
        "train_mode": train_mode,
        "random_seed": random_seed,
    }

    preprocessor = ColumnTransformer(
        transformers=[
            ("cat", Pipeline([
                ("impute", SimpleImputer(strategy="constant", fill_value="__missing__")),
                ("ohe", OneHotEncoder(handle_unknown="ignore")),
            ]), categorical),
            ("num", Pipeline([
                ("impute", SimpleImputer(strategy="median")),
                ("pass", "passthrough"),
            ]), numeric),
            ("bool", Pipeline([
                ("impute", SimpleImputer(strategy="most_frequent")),
                ("pass", "passthrough"),
            ]), boolean),
        ]
    )

    params = {
        "n_estimators": PRESETS["n_estimators"][train_mode],
        "max_depth": PRESETS["max_depth"][train_mode],
        "learning_rate": PRESETS["learning_rate"][train_mode],
        "subsample": 0.9,
        "colsample_bytree": 0.9,
        "random_state": random_seed,
        "n_jobs": -1,
        "tree_method": "hist",
        "eval_metric": "logloss",
    }
    metadata["params"] = params

    model = Pipeline([
        ("pre", preprocessor),
        ("est", XGBClassifier(**params)),
    ])

    return model, metadata
