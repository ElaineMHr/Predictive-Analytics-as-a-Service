from typing import Literal, Tuple
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from mlcore.presets.metadata_presets import metadata_preset

VERSION = "1.0"

PRESETS = {
    "C": {
        "fast": 1.0,
        "balanced": 1.0,
        "accurate": 0.5,
    },
    "max_iter": {
        "fast": 300,
        "balanced": 800,
        "accurate": 2000,
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
        "preset": "logistic_regression",
        "version": VERSION,
        "framework": "scikit-learn",
        "algorithm": "LogisticRegression",
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
                ("scale", StandardScaler()),
            ]), numeric),
            ("bool", Pipeline([
                ("impute", SimpleImputer(strategy="most_frequent")),
                ("pass", "passthrough"),
            ]), boolean),
        ]
    )

    params = {
        "C": PRESETS["C"][train_mode],
        "max_iter": PRESETS["max_iter"][train_mode],
        "solver": "lbfgs",
        "n_jobs": -1,
    }
    metadata["params"] = params

    model = Pipeline([
        ("pre", preprocessor),
        ("est", LogisticRegression(**params)),
    ])

    return model, metadata