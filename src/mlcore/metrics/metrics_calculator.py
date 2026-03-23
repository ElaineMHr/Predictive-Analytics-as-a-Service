from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
from sklearn.metrics import mean_absolute_error, mean_squared_error, root_mean_squared_error, mean_absolute_percentage_error, r2_score
import pandas as pd

def calculate_metrics(
    y_true: pd.Series,
    y_pred: pd.Series,
    task: str,
    #multi_class: bool | None = True,
)-> dict:
    
    if task == "classification":
        metrics = classification_metrics(y_true, y_pred) #, multi_class)
    elif task == "regression":
        metrics = regression_metrics(y_true, y_pred)
    else:
        raise ValueError(f"Invalid task: '{task}'. Expected 'classification' or 'regression'.")
    return metrics

def classification_metrics(
    y_true: pd.Series,
    y_pred: pd.Series,
    #multi_class: bool | None = False,
)-> dict:
    # if multi_class:
    accuracy = accuracy_score(y_true, y_pred)
    precision = precision_score(y_true, y_pred, average="macro", zero_division=0)
    recall = recall_score(y_true, y_pred, average="macro", zero_division=0)
    f1 = f1_score(y_true, y_pred, average="macro", zero_division=0)
    # else:
    #     precision = precision_score(y_true, y_pred, zero_division=0)
    #     recall = recall_score(y_true, y_pred, zero_division=0)
    #     f1 = f1_score(y_true, y_pred, zero_division=0)
    metrics = {
        "accuracy": round(accuracy, 4),
        "precision": round(precision, 4),
        "recall": round(recall, 4),
        "f1": round(f1, 4),
    }
    return metrics

def regression_metrics(
    y_true: pd.Series,
    y_pred: pd.Series,
)-> dict:
    metrics = {
        "mae": round(mean_absolute_error(y_true, y_pred), 4),
        "mse": round(mean_squared_error(y_true, y_pred), 4),
        "rmse": round(root_mean_squared_error(y_true, y_pred), 4),
        "r2": round(r2_score(y_true, y_pred), 4),
        "mape": round(mean_absolute_percentage_error(y_true, y_pred), 4),
    }
    return metrics