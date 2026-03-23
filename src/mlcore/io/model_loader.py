from joblib import load
from pathlib import Path
import logging
logger = logging.getLogger(__name__)


def load_model(
    model_uri: str | None = None,
):
    """
    Load a trained model either from a given URI or based on
    problem and model identifiers.
    """
    if not model_uri:
        raise ValueError(
            "Not specified which model to load. Provide a problem_id or a model_uri.")

    try:
        model_path = Path(model_uri)
        model = load(model_path)
        logger.error(f"[LOAD_MODEL] Model loaded from: {model_path}")
        return model
    except Exception as e:
        logger.error(f"[LOAD_MODEL] Failed to load model: {e}")
        raise
