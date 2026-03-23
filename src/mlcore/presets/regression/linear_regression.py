from typing import Literal, Tuple
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LinearRegression
from mlcore.presets.metadata_presets import metadata_preset

VERSION = "1.0"

PRESETS = {}

def build_model(
    categorical: list = [],
    numeric: list = [],
    boolean: list = [],
    train_mode: Literal["fast", "balanced", "accurate"] = "balanced",
    random_seed: int = 42,
)-> Tuple[Pipeline, dict]:
    
    metadata = {
        **metadata_preset,  # merge metadata with the preset
        "task": "regression",
        "preset": "linear_regression",
        "version": VERSION,
        "framework": "scikit-learn",
        "algorithm": "LinearRegression",
        "semantic_types": {
            "categorical": categorical,
            "numeric": numeric,
            "boolean": boolean,
            },
        "train_mode": train_mode,   # kept for interface consistency
        "random_seed": random_seed, # kept for interface consistency
        "notes": "LinearRegression has no hyperparameters to tune and ignores random_seed."
        }

    preprocessor = ColumnTransformer(
        transformers=[
            ("cat", Pipeline([
                ("impute", SimpleImputer(strategy = "constant", fill_value = "__missing__")),
                ("ohe", OneHotEncoder(handle_unknown="ignore")),
                ]), categorical),
            ("num", Pipeline([
                ("impute", SimpleImputer(strategy = "median")),
                ("pass", "passthrough"),
                ]), numeric),
            ("bool", Pipeline([
                ("impute", SimpleImputer(strategy = "most_frequent")),
                ("pass", "passthrough"),
            ]), boolean)
        ]
    )
    
    params = {
        "fit_intercept": True,
        "n_jobs": -1,
    }
    metadata["params"] = params
    
    model = Pipeline([
        ("pre", preprocessor),
        ("est", LinearRegression(**params)),
    ])
    
    return model, metadata