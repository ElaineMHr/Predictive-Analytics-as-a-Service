import json
from pathlib import Path
from db.db import get_ml_problem, get_model


def load_metadata(
    metadata_uri: str,
    problem_id: str | None = None,
    model_id: str | None = "production",
    base_dir: str = "./testdata/models",
) -> dict:
    """
    Load the metadata of a model either from a given URI or based on
    problem and model identifiers.
    """
    if not metadata_uri:
        raise ValueError(
            "No metadata_uri was provided. Provide a metadata_uri.")

    try:
        if metadata_uri:
            metadata_path = Path(metadata_uri)
        else:
            if model_id == "production":
                problem = get_ml_problem(problem_id)
                model_id = problem.get("current_model_id", False)
                model = get_model(model_id)
                model_path = model.get("uri", False)
                metadata_path = model_path.with_name("metadata.json")
            else:
                metadata_path = Path(base_dir) / problem_id / \
                    model_id / "metadata.json"
        with open(metadata_path, "r") as f:
            metadata = json.load(f)
        return metadata
    except Exception as e:
        print(f"Failed to load metadata: {e}")
        raise
