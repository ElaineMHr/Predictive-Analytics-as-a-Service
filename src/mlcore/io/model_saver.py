from joblib import dump
from pathlib import Path
import logging
logger = logging.getLogger(__name__)

def save_model(
    model,
    parent_path: str,
)-> str:
    base_path = Path(parent_path)
    base_path.mkdir(parents=True, exist_ok=True)

    model_path = base_path / "model.joblib"
    
    try:
        dump(model, model_path, compress=3)
        logger.info(f"[SAVE_MODEL] Model saved successfully to {model_path!s}")
        return str(model_path)
    except Exception as e:
        logger.error(f"[SAVE_MODEL] Failed to save model: {e}")
        raise

    

    
