from sklearn.pipeline import Pipeline
from sklearn.model_selection import cross_val_score, StratifiedKFold, KFold
import pandas as pd

def calculate_cv(
    model: Pipeline,
    X_train: pd.DataFrame,
    y_train: pd.Series,
    task: str,
    #multi_class: bool | None = False,
    n_splits: int = 5,
    random_seed: int = 42,
)-> dict:
    
    if task == "classification":
        metrics = classification_cv(model=model, X_train=X_train, y_train=y_train, n_splits=n_splits, random_seed=random_seed) #, multi_class=multi_class
    elif task == "regression":
        metrics = regression_cv(model=model, X_train=X_train, y_train=y_train, n_splits=n_splits, random_seed=random_seed)
    else:
        raise ValueError(f"Invalid task: '{task}'. Expected 'classification' or 'regression'.")
    return metrics

def classification_cv(
    model: Pipeline,
    X_train: pd.DataFrame,
    y_train: pd.Series,
    #multi_class: bool | None = False,
    n_splits: int = 5,
    random_seed: int = 42,
)-> dict:
    cv = StratifiedKFold(
        n_splits = n_splits,
        shuffle = True,
        random_state = random_seed,
    )

    scoring = "f1_macro" # if multi_class else "f1"
    cv_scores = cross_val_score(
        model,
        X_train,
        y_train,
        cv = cv,
        scoring = scoring,
        n_jobs=-1,
    )

    cv_summary = {
        "scoring": scoring,
        "cv_folds": [round(float(v), 4) for v in cv_scores],
        "mean": round(float(cv_scores.mean()), 4),
        "std": round(float(cv_scores.std()), 4),
    }

    return cv_summary

def regression_cv(
    model: Pipeline,
    X_train: pd.DataFrame,
    y_train: pd.Series,
    n_splits: int = 5,
    random_seed: int = 42,
)-> dict:
    cv = KFold(
        n_splits = n_splits,
        shuffle = True,
        random_state = random_seed,
    )

    cv_scores = cross_val_score(
        model,
        X_train,
        y_train,
        cv = cv,
        scoring = "r2",
        n_jobs=-1,
    )

    cv_summary = {
        "scoring": "r2",
        "cv_folds": [round(float(v), 4) for v in cv_scores],
        "mean": round(float(cv_scores.mean()), 4),
        "std": round(float(cv_scores.std()), 4),
    }

    return cv_summary