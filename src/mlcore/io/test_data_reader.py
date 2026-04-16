"""
Tests for load_dataset_version_df() — the DB-backed dataset reader.

No DB connection required. All tests run purely in-memory.
Run with: PYTHONPATH=src python -m pytest src/mlcore/io/test_data_reader.py -v
"""
import os
import tempfile
import pytest
import pandas as pd

from mlcore.io.data_reader import load_dataset_version_df


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

_SIMPLE_CSV = "col_a,col_b,col_c\n1,hello,0.1\n2,world,0.2\n3,foo,0.3\n"


def _dv(csv_content=None, uri=None, id="test-version"):
    """Build a minimal dataset_version dict for testing."""
    return {"id": id, "csv_content": csv_content, "uri": uri}


# ---------------------------------------------------------------------------
# 1. csv_content present — primary path (portfolio mode)
# ---------------------------------------------------------------------------

def test_loads_from_csv_content():
    df = load_dataset_version_df(_dv(csv_content=_SIMPLE_CSV))
    assert isinstance(df, pd.DataFrame)
    assert list(df.columns) == ["col_a", "col_b", "col_c"]
    assert len(df) == 3


def test_csv_content_takes_priority_over_uri(tmp_path):
    """csv_content wins even when a uri is also present."""
    uri_file = tmp_path / "other.csv"
    uri_file.write_text("x,y\n99,99\n")
    df = load_dataset_version_df(_dv(csv_content=_SIMPLE_CSV, uri=str(uri_file)))
    assert list(df.columns) == ["col_a", "col_b", "col_c"]


def test_csv_content_whitespace_only_raises():
    with pytest.raises(ValueError, match="empty csv_content"):
        load_dataset_version_df(_dv(csv_content="   \n\t  "))


def test_csv_content_header_only_returns_empty_dataframe():
    # A header-only CSV (no data rows) is valid and should load without error.
    df = load_dataset_version_df(_dv(csv_content="col_a,col_b\n"))
    assert isinstance(df, pd.DataFrame)
    assert list(df.columns) == ["col_a", "col_b"]
    assert len(df) == 0


# ---------------------------------------------------------------------------
# 2. uri fallback — legacy / Docker mode
# ---------------------------------------------------------------------------

def test_loads_from_uri_when_no_content(tmp_path):
    f = tmp_path / "data.csv"
    f.write_text(_SIMPLE_CSV)
    df = load_dataset_version_df(_dv(uri=str(f)))
    assert list(df.columns) == ["col_a", "col_b", "col_c"]
    assert len(df) == 3


def test_uri_missing_file_raises_file_not_found():
    with pytest.raises(FileNotFoundError, match="test-legacy"):
        load_dataset_version_df(_dv(uri="/nonexistent/path/data.csv", id="test-legacy"))


def test_uri_missing_file_error_includes_path():
    missing = "/some/deleted/file.csv"
    with pytest.raises(FileNotFoundError, match=missing):
        load_dataset_version_df(_dv(uri=missing))


# ---------------------------------------------------------------------------
# 3. Both missing — clear error
# ---------------------------------------------------------------------------

def test_both_missing_raises_value_error():
    with pytest.raises(ValueError, match="neither csv_content nor a uri"):
        load_dataset_version_df(_dv())


def test_error_includes_version_id():
    with pytest.raises(ValueError, match="my-special-id"):
        load_dataset_version_df(_dv(id="my-special-id"))


# ---------------------------------------------------------------------------
# 4. Restart-resilience smoke test
# ---------------------------------------------------------------------------

def test_db_content_survives_simulated_restart():
    """
    Simulates the deploy scenario: content stored in DB at upload time,
    then loaded fresh (no file on disk) at training time.
    """
    csv_at_upload = "feature_1,feature_2,label\n0.1,0.2,A\n0.3,0.4,B\n0.5,0.6,A\n"

    # Simulate what gets persisted to DB (just the text)
    persisted_content = csv_at_upload

    # Simulate what trainer receives from db_get_dataset_version (no uri, content present)
    dataset_version_from_db = {
        "id": "abc-123",
        "csv_content": persisted_content,
        "uri": None,
    }

    df = load_dataset_version_df(dataset_version_from_db)
    assert list(df.columns) == ["feature_1", "feature_2", "label"]
    assert len(df) == 3
    assert df["label"].tolist() == ["A", "B", "A"]


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
