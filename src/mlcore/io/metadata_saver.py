from pathlib import Path
import json

def save_metadata(
    metadata: dict,
    uri: str,
)-> str:
    base_path = Path(uri)
    base_path.mkdir(parents=True, exist_ok=True)

    model_path = base_path / "model.joblib"
    metadata_path = base_path / "metadata.json"

    # Store POSIX-style path in metadata for portability (works in Linux and Windows)
    metadata["model_uri"] = model_path.as_posix()
    
    try:
        with open(metadata_path, "w") as f:
            json.dump(metadata, f, indent=4)
        return "Success"
    except Exception as e:
        print(f"Failed to save metadata: {e}")
        raise

    

    
