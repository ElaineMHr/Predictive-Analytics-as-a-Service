from typing import Literal, Tuple
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder
from sklearn.impute import SimpleImputer
from sklearn.ensemble import ExtraTreesClassifier
from mlcore.presets.metadata_presets import metadata_preset

VERSION = "1.0"

PRESETS = {
    "n_estimators": {
        "fast": 400,
        "balanced": 1200,
        "accurate": 3000,
    },
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
        "preset": "extra_trees",
        "version": VERSION,
        "framework": "scikit-learn",
        "algorithm": "ExtraTreesClassifier",
        "semantic_types": {
            "categorical": categorical,
            "numeric": numeric,
            "boolean": boolean,
        },
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
        "n_jobs": -1,
        "random_state": random_seed,
    }
    metadata["params"] = params

    model = Pipeline([
        ("pre", preprocessor),
        ("est", ExtraTreesClassifier(**params)),
    ])

    return model, metadata
