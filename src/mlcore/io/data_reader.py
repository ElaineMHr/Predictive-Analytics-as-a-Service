import io
import logging
import pandas as pd
from typing import Tuple

logger = logging.getLogger(__name__)


def get_dataframe_from_csv(
    uri: str,
) -> pd.DataFrame:
    if not uri:
        raise ValueError("No csv_uri was provided. Provide a csv_uri.")

    try:
        df = pd.read_csv(uri)
        return df
    except Exception as e:
        logger.error("[DATASET] Failed to load CSV from URI '%s': %s", uri, e)
        raise


def load_dataset_version_df(dataset_version: dict) -> pd.DataFrame:
    """
    Load the CSV for a dataset version into a DataFrame.

    Resolution order:
      1. DB-stored csv_content  (portfolio mode — no filesystem dependency)
      2. uri / local file path  (legacy fallback for older rows or Docker mode)

    Raises ValueError / FileNotFoundError with a clear message if neither source
    is available or readable.  Never silently swallows exceptions.
    """
    version_id = dataset_version.get("id", "<unknown>")

    csv_content = dataset_version.get("csv_content")
    if csv_content:
        logger.info("[DATASET] Loading from DB-stored content (version_id=%s)", version_id)
        if not csv_content.strip():
            raise ValueError(
                f"Dataset version {version_id!r} has an empty csv_content field in the DB."
            )
        try:
            return pd.read_csv(io.StringIO(csv_content))
        except Exception as exc:
            logger.error(
                "[DATASET] Failed to parse DB-stored CSV content for version_id=%s: %s",
                version_id, exc,
            )
            raise

    uri = dataset_version.get("uri")
    if uri:
        logger.info(
            "[DATASET] No DB content found — falling back to URI path '%s' (version_id=%s)",
            uri, version_id,
        )
        try:
            return pd.read_csv(uri)
        except FileNotFoundError:
            raise FileNotFoundError(
                f"Dataset version {version_id!r}: file not found at URI '{uri}'. "
                "This version was created before DB content storage was enabled and "
                "the original file is no longer on disk."
            )
        except Exception as exc:
            logger.error(
                "[DATASET] Failed to load dataset from URI '%s' (version_id=%s): %s",
                uri, version_id, exc,
            )
            raise

    raise ValueError(
        f"Dataset version {version_id!r} has neither csv_content nor a uri. "
        "Cannot load the dataset. Re-upload the file to generate a new version."
    )

def _check_profile(profile):
    if not profile:
        raise ValueError("This dataset_version is missing a profile.")

def preprocess_dataframe(
    df: pd.DataFrame,
    target: str,
    profile: dict, 
    feature_strategy: dict | str = "auto",  
)-> Tuple[pd.DataFrame, pd.Series]:
    
    if feature_strategy == "auto":
        include = df.columns
        _check_profile(profile)
        exclude = profile["exclude_suggestions"]
    else:
        if feature_strategy.get("include", False):
            include = feature_strategy.get("include")
        else:
            include = df.columns
        if feature_strategy.get("exclude", False):
            exclude = feature_strategy.get("exclude")
            if target in exclude:
                raise ValueError(f"Target column '{target}' is in the exclusion list.")
        else:
            _check_profile(profile)
            exclude = profile["exclude_suggestions"]
    
    pre_cols = [column for column in df.columns if column in include and column not in exclude]
    df_pre = df[pre_cols]
    
    if target not in df_pre.columns:
        raise ValueError(f"Target column '{target}' not found in dataframe.")
    
    df_pre_notna = df_pre[df_pre[target].notna() & (df_pre[target] != "")]
    
    if not df_pre_notna[target].count():
        raise ValueError(f"Target column '{target}' is empty.")
    
    y = df_pre_notna[target]
    X = df_pre_notna.drop(columns= target)
    
    return X, y

def get_semantic_types(
    X: pd.DataFrame,
    profile: dict,
)-> dict:
    semantic_types = {
        "categorical": [],
        "numeric": [],
        "boolean": [],
    }
    
    _check_profile(profile)
    
    for column in X.columns:
        semantic_type = profile["columns"].get(column, {}).get("semantic_type")
        if semantic_type in semantic_types:
            semantic_types[semantic_type].append(column)

    return semantic_types
