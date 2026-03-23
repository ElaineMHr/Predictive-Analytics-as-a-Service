import importlib.util
from pathlib import Path
from ..presets import presets_path


def loader(
    task: str,
    algorithm: str,
    base_dir: str = presets_path
):
    """
    Dynamically load and return build_model() from
    presets/<task>/<algorithm>.py
    """
    path = Path(base_dir) / task / f"{algorithm}.py"
    if not path.exists():
        raise FileNotFoundError(f"Preset not found: {path}")
    
    # Automatically detect the correct top-level package name (src locally, code in Docker)
    # Use of rsplit because the length from the right side is known, while the length from
    # left side is unknown.
    base_pkg = __package__.rsplit(".",1)[0]

    try:
        # Create a specification of the module from */*.py
        spec = importlib.util.spec_from_file_location(
            f"{base_pkg}.mlcore.presets.{task}.{algorithm}", path)
        if spec is None or spec.loader is None:
            raise ImportError(f"Could not load spec for {path}")
        # Create an empty container/module from this specification
        module = importlib.util.module_from_spec(spec)
        # Run all top-level code to populate the module
        spec.loader.exec_module(module)

        # Check if build_model() exists in the created module
        if not hasattr(module, "build_model"):
            raise AttributeError(
                f"There is no function 'build_model()' in {path.name}")
        return module.build_model
    except Exception as e:
        print(f"Failed to load preset {task}/{algorithm}: {e}")
        raise
