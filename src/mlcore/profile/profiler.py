import pandas as pd
import pandas.api.types as pdtypes
from pandas import CategoricalDtype
import numpy as np


def suggest_schema(
    df: pd.DataFrame,
) -> dict:
    schema = {}
    for column in df.columns:
        schema[column] = str(df[column].dtype)
    return schema


def _is_sequence_like(
    column: pd.Series,
    thresh: float = 0.9,
) -> bool:
    # Check the percentage of the elements that are in sequence. If it is higher than the threshold, the column is sequence-like.
    values = column.dropna().to_numpy()
    if len(values) < 2:
        return False
    differences = np.diff(np.sort(values))
    consecutive_ratio = (differences == 1).mean()
    return consecutive_ratio >= thresh


def _analyse_column(
    column: pd.Series,
) -> dict:
    non_nan_count = column.count()
    missing_pct = round(float(1 - non_nan_count/len(column)), 4)
    column_summary = {
        "dtype_raw": str(column.dtype),
        "semantic_type": "undefined",
        "cardinality": float('nan'),
        "cardinality_ratio": float('nan'),
        "missing_pct": missing_pct,
        "suggested_analysis": "none",
        "is_empty": False,
        "is_constant": False,
        "is_unique": False,
        "exclude_for_analysis": False,
    }

    # Check if the column is empty first, so that cardinality_ratio does not raise an error when non_nan_count = 0
    if non_nan_count == 0:
        column_summary["is_empty"] = True
        column_summary["is_constant"] = True
        column_summary["exclude_for_analysis"] = True
        column_summary["exclusion_reason"] = "empty"
        return column_summary

    # Cardinality_ratio is calculated as (unique non-NaN values)/(total non-NaN values).
    cardinality = column.nunique(dropna=True)
    cardinality_ratio = round(float(cardinality/non_nan_count), 4)
    column_summary["cardinality"] = cardinality
    column_summary["cardinality_ratio"] = cardinality_ratio
    is_unique = cardinality_ratio == 1.0
    is_constant = cardinality < 2
    column_summary["is_constant"] = is_constant
    column_summary["is_unique"] = is_unique

    if pdtypes.is_integer_dtype(column):
        column_summary["semantic_type"] = "numeric"
        column_summary["min"] = int(column.dropna().min())
        column_summary["max"] = int(column.dropna().max())
        column_summary["mean"] = round(float(column.dropna().mean()), 4)
        column_summary["std"] = round(float(column.dropna().std()), 4)

        # Quick check if the column is constant. If it is, suggest exclude.
        if is_constant:
            column_summary["exclude_for_analysis"] = True
            column_summary["exclusion_reason"] = "constant"
            return column_summary

        # For integers: check cardinality to suggest analysis type.
        # 2-rule check:
        #   1) If the cardinality ratio is low <= 20%, suggest classification.
        #   2) If the frequencies of the top 3 integers cover more than 80% of the non-NaN values, suggest classification.
        # If all the checks fail:
        #   1) check if it is sequence-like -> suggest id column.
        #   2) if it is not sequence-like, suggest regression.
        if cardinality_ratio <= 0.2:
            column_summary["suggested_analysis"] = "classification"
        else:
            coverage_top3 = column.value_counts(normalize=True, dropna=True).head(
                # normalize=True to get the frequencies instead of the counts
                3).sum()
            if coverage_top3 >= 0.8:
                column_summary["suggested_analysis"] = "classification"
            else:
                # Quick check if the column is unique or not.
                if is_unique and missing_pct == 0:
                    if _is_sequence_like(column, 0.9):
                        # Column seems like a numeric id-column.
                        column_summary["exclude_for_analysis"] = True
                        column_summary["exclusion_reason"] = "id_like"
                    else:
                        column_summary["suggested_analysis"] = "regression"
                else:
                    column_summary["suggested_analysis"] = "regression"
        return column_summary

    if pdtypes.is_float_dtype(column):
        column_summary["semantic_type"] = "numeric"
        column_summary["min"] = round(float(column.dropna().min()), 4)
        column_summary["max"] = round(float(column.dropna().max()), 4)
        column_summary["mean"] = round(float(column.dropna().mean()), 4)
        column_summary["std"] = round(float(column.dropna().std()), 4)

        if is_constant:
            column_summary["exclude_for_analysis"] = True
            column_summary["exclusion_reason"] = "constant"
            return column_summary
        column_summary["suggested_analysis"] = "regression"
        return column_summary

    if (
        pdtypes.is_object_dtype(column)
        or pdtypes.is_string_dtype(column)
        or isinstance(column.dtype, CategoricalDtype)
        ):
        column_summary["semantic_type"] = "categorical"
        # Quick check if the column is unique. If it is, suggest exclude.
        if is_unique:
            column_summary["exclude_for_analysis"] = True
            column_summary["exclusion_reason"] = "id_like"
            return column_summary

        coverage_top3 = column.value_counts(normalize=True, dropna=True).head(
            3).sum()  # normalize=True to get the frequencies instead of the counts
        value_counts = column.value_counts(dropna=True)
        top_value = value_counts.index[0]
        top_count = int(value_counts.iloc[0])
        top_freq_ratio = float(value_counts.iloc[0] / non_nan_count)
        column_summary["top_value"] = str(top_value)
        column_summary["top_count"] = top_count
        column_summary["top_freq_ratio"] = round(top_freq_ratio, 4)
        column_summary["coverage_top3"] = round(float(coverage_top3), 4)

        if is_constant:
            column_summary["exclude_for_analysis"] = True
            column_summary["exclusion_reason"] = "constant"
            return column_summary

        # For objects: check cardinality to understand if it is a categorical column or not.
        # 2-rule check:
        #   1) If the cardinality ratio is low <= 20%, suggest categorical semantic type.
        #   2) If the frequencies of the top 3 categories cover more than 80% of the non-NaN values, suggest categorical semantic type.
        # If all the checks fail, suggest to drop for analysis (noise).
        if cardinality_ratio <= 0.2:
            column_summary["suggested_analysis"] = "classification"
            column_summary["exclude_for_analysis"] = False
        elif coverage_top3 >= 0.8:
            column_summary["suggested_analysis"] = "classification"
            column_summary["exclude_for_analysis"] = False
        else:
            column_summary["exclude_for_analysis"] = False
            column_summary["warning"] = "high_cardinality"
        return column_summary

    if pdtypes.is_bool_dtype(column):
        column_summary["semantic_type"] = "boolean"
        ratios = column.value_counts(normalize=True, dropna=True)
        true_pct = round(float(ratios.get(True, 0.0)), 4)
        false_pct = round(float(ratios.get(False, 0.0)), 4)
        column_summary["true_pct"] = true_pct
        column_summary["false_pct"] = false_pct

        if is_constant:
            column_summary["exclude_for_analysis"] = True
            column_summary["exclusion_reason"] = "constant"
            return column_summary
        column_summary["suggested_analysis"] = "classification"
        return column_summary

    if pdtypes.is_datetime64_any_dtype(column):
        column_summary["semantic_type"] = "datetime"
        column_summary["earliest_date"] = column.dropna(
        ).min().date().isoformat()
        column_summary["latest_date"] = column.dropna(
        ).max().date().isoformat()

        if is_constant:
            column_summary["exclude_for_analysis"] = True
            column_summary["exclusion_reason"] = "constant"
            return column_summary
        # Datetimes are in general not useful for ML analysis (timestamps, etc), suggest to drop for analysis.
        column_summary["exclude_for_analysis"] = True
        column_summary["exclusion_reason"] = "datetime"
        return column_summary
    
    else:
        # Fallback for unsupported or unusual/unexpected dtypes
        column_summary["semantic_type"] = "unknown"
        column_summary["exclude_for_analysis"] = True
        column_summary["exclusion_reason"] = "unsupported_dtype"
        return column_summary


def suggest_profile(
    df: pd.DataFrame,
) -> dict:
    profile = {}
    n_rows, n_cols = df.shape
    if n_rows == 0 or n_cols == 0:
        return {
            "summary": {"n_rows": n_rows, "n_cols": n_cols, "missing_pct": 0.0},
            "id_candidates": [],
            "exclude_suggestions": [],
            "leakage_columns": [],
            "columns": {},
        }
    non_nan_count = df.count().sum()
    missing_pct = round(1 - non_nan_count/(n_cols*n_rows), 4)
    summary = {}
    summary["n_rows"] = n_rows
    summary["n_cols"] = n_cols
    summary["missing_pct"] = missing_pct
    profile["summary"] = summary
    profile["id_candidates"] = []
    profile["exclude_suggestions"] = []
    profile["leakage_columns"] = []
    columns = {}

    for column in df.columns:
        columns[column] = _analyse_column(df[column])
        if columns[column]["is_unique"]:
            profile["id_candidates"].append(column)
        if columns[column]["exclude_for_analysis"]:
            profile["exclude_suggestions"].append(column)

    profile["columns"] = columns
    return profile
