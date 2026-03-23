from .profiler import suggest_profile, suggest_schema
from mlcore.io.data_reader import get_dataframe_from_csv
import pandas as pd


def test_suggest_profile():
    df = get_dataframe_from_csv("./testdata/test_train.csv")
    profile = suggest_profile(pd.DataFrame(df))
    print(profile)
    assert isinstance(profile, dict)


if __name__ == "__main__":
    test_suggest_profile()
