import numpy as np
import shap
from scipy.sparse import issparse

from mlcore.explain.summary_calculator import calculate_summary

def _force_2D(X):
    # Force 2D to avoid errors due to dimension mismatch
    if issparse(X):
        # Transform to CSR and to array to make it dense
        X = X.tocsr().toarray()
    else:
        # Transform to np array to use .ndim and .reshape()
        X = np.asarray(X)
    if X.ndim == 1:
        X = X.reshape(1, -1)
    return X

def explain_model(
    task: str,
    model,
    X_train: np.ndarray,
    X_test: np.ndarray,
    feature_names: list[str],
    feature_parents: list[str],
    label_classes: list[str] | None = None,
    n_ref_max: int = 200,
    n_explain_max: int = 500,
    top_k: int = 30,
    include_distributions: bool = True,
    quantiles: list[float] = [0.10, 0.25, 0.50, 0.75, 0.90],
    random_seed: int = 42,    
    )-> dict:

    rng = np.random.default_rng(random_seed)
    
    # Reducing samples by a random percentage to reduce running time of Explain
    # Background sample percentage (1–10%)
    # pct_ref = rng.integers(1, 11) / 100.0
    # n_rows = X_train.shape[0]
    # n_ref = max(1, int(n_rows * pct_ref))

    # Fixed sample size for reproducability
    n_rows = X_train.shape[0]
    n_ref = min(n_ref_max, n_rows)
    
    # Equivalent to .sample method of pandas
    idx_ref = rng.choice(n_rows, size=n_ref, replace=False)
    X_ref = X_train[idx_ref]
    
    # Explanation sample percentage (5–20%)
    # pct_explain = rng.integers(5, 21) / 100.0
    # n_rows_explain = X_test.shape[0]
    # n_explain = max(1, int(n_rows_explain * pct_explain))

    # Fixed explanation sample size for reproducability
    n_rows_explain = X_test.shape[0]
    n_explain = min(n_explain_max, n_rows_explain)

    # Equivalent to .sample method of pandas
    idx_explain = rng.choice(n_rows_explain, size=n_explain, replace=False)
    X_explain = X_test[idx_explain]
    
    # Force 2D due to error with sparce data and dimension mismatch after OHE
    X_ref = _force_2D(X_ref)
    X_explain = _force_2D(X_explain)   

    if task == "classification":
        shap_values = classification_explanation(model, X_ref, X_explain, feature_names)
        model_output = "predict_proba"
        output_space = "probability"
    elif task == "regression":
        shap_values = regression_explanation(model, X_ref, X_explain, feature_names)
        model_output = "predict"
        output_space = "raw"
    else:
        raise ValueError(f"Invalid task: '{task}'. Expected 'classification' or 'regression'.")
    
    explanation_summary = calculate_summary(
        shap_values=shap_values,
        task=task,
        model_output=model_output,
        output_space=output_space,
        feature_names=feature_names,
        feature_parents=feature_parents,
        label_classes=label_classes,
        n_ref=n_ref,
        top_k=top_k,
        include_distributions=include_distributions,
        quantiles=quantiles,
        random_seed=random_seed,
    )
       
    return explanation_summary

def classification_explanation(
    model,
    X_ref: np.ndarray,
    X_explain: np.ndarray,
    feature_names: list[str],
    ):
    explainer = shap.Explainer(model.predict_proba, X_ref, feature_names=feature_names)
    shap_values = explainer(X_explain)
    return shap_values

def regression_explanation(
    model,
    X_ref: np.ndarray,
    X_explain: np.ndarray,
    feature_names: list[str],
    ):
    explainer = shap.Explainer(model.predict, X_ref, feature_names=feature_names)
    shap_values = explainer(X_explain)
    return shap_values

