from typing import Literal, Tuple
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder
from sklearn.impute import SimpleImputer
from sklearn.ensemble import HistGradientBoostingClassifier
from mlcore.presets.metadata_presets import metadata_preset

VERSION = "1.0"

PRESETS = {
    "max_iter": {"fast": 200, "balanced": 600, "accurate": 1500},
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
        "preset": "hist_gradient_boosting",
        "version": VERSION,
        "framework": "scikit-learn",
        "algorithm": "HistGradientBoostingClassifier",
        "semantic_types": {"categorical": categorical, "numeric": numeric, "boolean": boolean},
        "train_mode": train_mode,
        "random_seed": random_seed,
    }

    preprocessor = ColumnTransformer(
        transformers=[
            ("cat", Pipeline([
                ("impute", SimpleImputer(strategy="constant", fill_value="__missing__")),
                ("ohe", OneHotEncoder(sparse_output=False, handle_unknown="ignore")), # this model needs dense data to run
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
        "max_iter": PRESETS["max_iter"][train_mode],
        "learning_rate": PRESETS["learning_rate"][train_mode],
        "random_state": random_seed,
    }
    metadata["params"] = params

    model = Pipeline([
        ("pre", preprocessor),
        ("est", HistGradientBoostingClassifier(**params)),
    ])

    return model, metadata
