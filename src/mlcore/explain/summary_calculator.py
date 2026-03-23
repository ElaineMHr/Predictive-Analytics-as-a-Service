from collections import defaultdict
import numpy as np
import shap

def calculate_summary(
        shap_values: shap.Explanation,
        task: str,
        model_output: str,
        output_space: str,
        feature_names: list[str],
        feature_parents: list[str],
        n_ref: int,
        label_classes: list[str] | None = None,
        top_k: int = 30,
        include_distributions: bool = True,
        quantiles: list[float] = [0.10, 0.25, 0.50, 0.75, 0.90],
        random_seed: int = 42,
) -> dict:
    
    # Data validation checks
    if not feature_names:
        raise ValueError("feature_names is required and cannot be empty.")
    if not feature_parents:
        raise ValueError("feature_parents is required and cannot be empty.")
    if len(feature_names) != len(feature_parents):
        raise ValueError("Feature mismatch: feature_names and feature_parents must have the same length.")
    n_shap_features = shap_values.values.shape[1]
    if n_shap_features != len(feature_names):
        raise ValueError(
            f"Feature mismatch: shap has {n_shap_features} features but feature_names has {len(feature_names)}."
    )
    values = np.asarray(shap_values.values)
    if values.ndim not in (2, 3):
        raise ValueError(f"Unexpected shap_values.values ndim={values.ndim} (expected 2 or 3).")

    summary = {
        "task": task,
        "metadata": {
            "model_output": model_output,
            "output_space": output_space,
            "n_ref": n_ref,
            "n_explain": values.shape[0],
            "top_k": top_k,
            "quantiles": quantiles,
            "seed": random_seed,
        },
        "features": [
            {"fid": i, "name": feature_names[i], "parent": feature_parents[i]}
            for i in range(len(feature_names))
        ],
        "global": {},
        "distributions": {},
    }

    X = getattr(shap_values, "data", None)
    if include_distributions and X is not None:
        X = np.asarray(X)
        if X.ndim == 1:
            X = X.reshape(1, -1)
    else:
        X = None

    q = np.asarray(quantiles)

    if task == "regression":
        if values.ndim != 2:
            raise ValueError("Expected 2D SHAP values (n_rows, n_features) for regression.")

        shap_matrix = values

        # abs because right now we only care about importance of features, not positive/negative (to calculate top_fids)
        mean_abs = np.mean(np.abs(shap_matrix), axis=0)
        top_k_eff = min(top_k, len(feature_names))
        # fid = feature id (index)
        top_fids = np.argsort(-mean_abs)[:top_k_eff]

        summary["global"] = {
            "mean_abs": [
                {"fid": int(fid), "value": round(float(mean_abs[fid]), 4)}
                for fid in top_fids
            ]
        }

        # Parent aggregation
        parent_sums = defaultdict(float)
        for fid, parent in enumerate(feature_parents):
            parent_sums[parent] += mean_abs[fid]

        parent_sorted = sorted(parent_sums.items(), key=lambda kv: kv[1], reverse=True)
        summary["global"]["mean_abs_parent"] = [
            {"parent": p, "value": round(float(v), 4)}
            for p, v in parent_sorted[:min(top_k, len(parent_sorted))]
        ]

        if include_distributions and X is not None:
            per_feature = []
            for fid in top_fids:
                # Calculate flactuation of influence for each feature in shap explanation
                shap_q = np.quantile(shap_matrix[:, fid], q).tolist()
                # in "try" because this can fail
                try:
                    # Calculate flctuation of values for each feature
                    X_q = np.quantile(X[:, fid], q).tolist()
                except Exception:
                    X_q = [None] * len(quantiles)

                per_feature.append(
                    {
                        # Types inserted to avoid numpy serialisation errors during JSON dumps
                        "fid": int(fid),
                        "shap_quantiles": [round(float(v), 4) for v in shap_q],
                        "X_quantiles": [round(float(v), 4) if v is not None else None for v in X_q],
                    }
                )
            summary["distributions"] = {"per_feature": per_feature}
        else:
            summary["distributions"] = {"per_feature": []}

        return summary

    elif task == "classification":
            if values.ndim != 3:
                raise ValueError("Expected 3D SHAP values (n_rows, n_features, n_classes) for classification.")

            n_classes = values.shape[2]
            summary["metadata"]["n_classes"] = int(n_classes)
            if label_classes is not None:
                if len(label_classes) != n_classes:
                    raise ValueError(
                        f"label_classes length={len(label_classes)} must match n_classes={n_classes}"
                    )
                summary["metadata"]["label_classes"] = label_classes

            mean_abs_per_class = {}
            mean_abs_parent_per_class = {}
            distributions_per_class = {}

            for c in range(n_classes):
                shap_matrix_c = values[:, :, c]
                # abs because right now we only care about importance of features (per class), not positive/negative (to calculate top_fids)
                mean_abs_c = np.mean(np.abs(shap_matrix_c), axis=0)
                top_k_eff = min(top_k, len(feature_names))
                # fid = feature id (index)
                top_fids = np.argsort(-mean_abs_c)[:top_k_eff]

                mean_abs_per_class[str(c)] = [
                    {"fid": int(fid), "value": round(float(mean_abs_c[fid]), 4)}
                    for fid in top_fids
                ]

                parent_sums = defaultdict(float)
                for fid, parent in enumerate(feature_parents):
                    parent_sums[parent] += float(mean_abs_c[fid])

                parent_sorted = sorted(parent_sums.items(), key=lambda kv: kv[1], reverse=True)
                mean_abs_parent_per_class[str(c)] = [
                    {"parent": p, "value": round(float(v), 4)}
                    for p, v in parent_sorted[:min(top_k, len(parent_sorted))]
                ]

                if include_distributions and X is not None:
                    per_feature = []
                    for fid in top_fids:
                        # Calculate flactuation of influence for each feature in shap explanation
                        shap_q = np.quantile(shap_matrix_c[:, fid], q).tolist()
                        # in "try" because this can fail
                        try:
                            # Calculate flctuation of values for each feature
                            X_q = np.quantile(X[:, fid], q).tolist()
                        except Exception:
                            X_q = [None] * len(quantiles)

                        per_feature.append(
                            {
                                # Types inserted to avoid numpy serialisation errors during JSON dumps
                                "fid": int(fid),
                                "shap_quantiles": [round(float(v), 4) for v in shap_q],
                                "X_quantiles": [round(float(v), 4) if v is not None else None for v in X_q],
                            }
                        )
                    distributions_per_class[str(c)] = {"per_feature": per_feature}
                else:
                    distributions_per_class[str(c)] = {"per_feature": []}

                mean_abs_parent_per_class[str(c)] = mean_abs_parent_per_class[str(c)]

            summary["global"] = {
                "mean_abs_per_class": mean_abs_per_class,
                "mean_abs_parent_per_class": mean_abs_parent_per_class,
            }
            summary["distributions"] = distributions_per_class if include_distributions else {}

            return summary

    else:
        raise ValueError(f"Invalid task: '{task}'. Expected 'classification' or 'regression'.")