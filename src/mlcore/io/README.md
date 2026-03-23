# MLCore I/O Module (`src/mlcore/io`)

I/O utilities used by training and prediction pipelines.

This module is responsible for loading input data, loading/saving model artifacts, loading/saving metadata, and dynamically resolving preset builders.

## Scope

- Read CSV files into pandas DataFrames.
- Preprocess dataset columns and target split.
- Derive semantic feature groups from profiling output.
- Persist trained models (`model.joblib`).
- Persist and load model metadata (`metadata.json`).
- Dynamically load algorithm presets from `mlcore/presets`.

## Module Map

- `data_reader.py`
  - `get_dataframe_from_csv(uri)`
  - `preprocess_dataframe(df, target, profile, feature_strategy)`
  - `get_semantic_types(X, profile)`
- `model_saver.py`
  - `save_model(model, parent_path)`
- `model_loader.py`
  - `load_model(model_uri)`
- `metadata_saver.py`
  - `save_metadata(metadata, uri)`
- `metadata_loader.py`
  - `load_metadata(metadata_uri, ...)`
- `preset_loader.py`
  - `loader(task, algorithm, base_dir)`

## Artifact Conventions

Default model URI is assembled in `src/db/db.py`:

```text
{MODEL_BASE_PATH}/{problem_id}/{model_id}/model.joblib
```

Typical artifact directory:

```text
/models/<problem_id>/<model_id>/
|- model.joblib
|- metadata.json
```

`metadata_saver.py` writes `model_uri` in POSIX format for cross-platform portability.

## Data Preprocessing Contract

`preprocess_dataframe` expects:

- `target` column present in the input DataFrame.
- `profile` to include `exclude_suggestions` when `feature_strategy="auto"`.
- Non-empty target values.

Behavior:

- Includes/excludes columns based on feature strategy and profile.
- Drops rows with empty target values.
- Returns `(X, y)` where `X` excludes the target column.

## Preset Loading

`preset_loader.loader(task, algorithm)` dynamically imports:

```text
mlcore/presets/<task>/<algorithm>.py
```

The target preset module must define:

```python
def build_model(categorical, numeric, boolean, train_mode):
    ...
    return model, metadata
```

If `build_model` is missing, an `AttributeError` is raised.

## Usage Examples

### Save a trained model and metadata

```python
from pathlib import Path
from mlcore.io.model_saver import save_model
from mlcore.io.metadata_saver import save_metadata

parent = Path("/models/<problem>/<model>")
save_model(model, parent)
save_metadata(metadata, parent)
```

### Load for inference

```python
from mlcore.io.model_loader import load_model
from mlcore.io.metadata_loader import load_metadata

model = load_model("/models/<problem>/<model>/model.joblib")
metadata = load_metadata("/models/<problem>/<model>/metadata.json")
```

## Integration Points

- Training pipeline: `src/mlcore/train/trainer.py`
- Prediction pipeline: `src/mlcore/predict/predictor.py`
- DB model URI generation: `src/db/db.py`

## Extension Guide

To add a new algorithm preset:

1. Add `src/mlcore/presets/<task>/<algorithm>.py`.
2. Implement `build_model(...)` with returned `(model, metadata)`.
3. Call training with `algorithm="<algorithm>"`.
4. Verify it appears in API preset listing (`GET /presets/{task}`).

## Failure Modes

Common exceptions from this module:

- `ValueError`: missing URI, missing profile, missing target, invalid input columns.
- `FileNotFoundError`: preset module path does not exist.
- Loader/runtime errors from invalid serialized artifacts.

Keep error messages explicit, because they surface directly in async worker job failures.
