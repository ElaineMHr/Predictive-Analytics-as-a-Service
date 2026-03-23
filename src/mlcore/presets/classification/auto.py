from typing import Literal, Tuple
import numpy as np
from sklearn.base import BaseEstimator, ClassifierMixin
from sklearn.model_selection import StratifiedKFold, cross_val_score
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.impute import SimpleImputer
from sklearn.ensemble import RandomForestClassifier, ExtraTreesClassifier
from sklearn.linear_model import LogisticRegression
from xgboost import XGBClassifier
from mlcore.presets.metadata_presets import metadata_preset
from mlcore.presets.classification.random_forest import PRESETS as RF_PRESETS
from mlcore.presets.classification.extra_trees import PRESETS as ET_PRESETS
from mlcore.presets.classification.logistic_regression import PRESETS as LR_PRESETS
from mlcore.presets.classification.xgboost import PRESETS as XGB_PRESETS

VERSION = "1.0" # Based on https://scikit-learn.org/stable/developers/develop.html

CV_FOLDS = {"fast": 3, "balanced": 5, "accurate": 5}

class AutoClassifier(ClassifierMixin, BaseEstimator):
    def __init__(
        self,
        train_mode: Literal["fast", "balanced", "accurate"] = "balanced",
        scoring: str = "f1_macro",
        n_jobs: int = -1,
        random_state: int = 42,
        ):
        self.train_mode = train_mode
        self.scoring = scoring
        self.n_jobs = n_jobs
        self.random_state = random_state

    def candidates(self):
        train_mode = self.train_mode
        n_jobs = self.n_jobs
        random_state = self.random_state

        return [
            (
                "LogisticRegression",
                LogisticRegression(
                    C=LR_PRESETS["C"][train_mode],
                    max_iter=LR_PRESETS["max_iter"][train_mode],
                    solver="lbfgs",
                    n_jobs=n_jobs,
                    random_state=random_state,
                ),
            ),
            (
                "RandomForestClassifier",
                RandomForestClassifier(
                    n_estimators=RF_PRESETS["n_estimators"][train_mode],
                    n_jobs=n_jobs,
                    random_state=random_state,
                ),
            ),
            (
                "ExtraTreesClassifier",
                ExtraTreesClassifier(
                    n_estimators=ET_PRESETS["n_estimators"][train_mode],
                    n_jobs=n_jobs,
                    random_state=random_state,
                ),
            ),
            (
                "XGBClassifier",
                XGBClassifier(
                    n_estimators=XGB_PRESETS["n_estimators"][train_mode],
                    max_depth=XGB_PRESETS["max_depth"][train_mode],
                    learning_rate=XGB_PRESETS["learning_rate"][train_mode],
                    subsample=0.9,
                    colsample_bytree=0.9,
                    random_state=random_state,
                    n_jobs=n_jobs,
                    tree_method="hist",
                    eval_metric="logloss",
                ),
            ),
        ]
    
    def fit(self, X, y):
        train_mode = self.train_mode
        n_jobs = self.n_jobs
        random_state = self.random_state
        scoring = self.scoring

        cv = StratifiedKFold(
            n_splits = CV_FOLDS[train_mode],
            shuffle = True,
            random_state = random_state,
        )

        best_model_name = None
        best_est = None
        best_scores = None
        best_mean = -np.inf

        for name, est in self.candidates():
            cv_scores = cross_val_score(
                estimator=est,
                X=X,
                y=y,
                scoring=scoring,
                cv=cv,
                n_jobs=n_jobs,
            )
            if cv_scores.mean() > best_mean:
                best_model_name = name
                best_est  = est
                best_scores = cv_scores
                best_mean = cv_scores.mean()

        if best_est is None:
            raise RuntimeError("AutoClassifier: no candidate model could be evaluated successfully.")
        best_est.fit(X, y)

        # Scikit-learn convention -> attributes learned from data after fit with trailing underscore
        self.best_estimator_ = best_est
        self.best_model_name_ = best_model_name
        self.cv_summary_ = {
            "score": self.scoring,
            "cv_folds": [round(float(v), 4) for v in best_scores],
            "mean": round(float(best_scores.mean()), 4),
            "std": round(float(best_scores.std()), 4),
        }

        # Return the classifier
        return self
    
    def predict(self, X):
        return self.best_estimator_.predict(X)
    
    def predict_proba(self, X):
        if hasattr(self.best_estimator_, "predict_proba"):
            return self.best_estimator_.predict_proba(X)
        raise AttributeError(f"{self.best_model_name_} does not support predict_proba")
    
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
        "preset": "auto",
        "version": VERSION,
        "framework": "scikit-learn",
        "algorithm": "AutoClassifier",
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
        "train_mode": train_mode,
        "scoring": "f1_macro",
        "n_jobs": -1,
        "random_state": random_seed,
    }
    metadata["params"] = params

    model = Pipeline([
        ("pre", preprocessor),
        ("est", AutoClassifier(**params)),
    ])

    return model, metadata