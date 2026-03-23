def get_feature_names(preprocessor) -> dict[str, list[str]]:
    """
    Get feature names for SHAP from `preprocessor.transform(X)` output.
    """

    transformer_specs = preprocessor.transformers
    # Input column lists that were passed during model creation
    cat_columns = list(transformer_specs[0][2]) if transformer_specs and len(transformer_specs) > 0 else []
    num_columns = list(transformer_specs[1][2]) if len(transformer_specs) > 1 else []
    bool_columns = list(transformer_specs[2][2]) if len(transformer_specs) > 2 else []

    feature_names = []
    # The parent term for the OHE
    feature_parents = []

    # Categorical Columns (OHE Block)
    # Access the fitted categorical pipeline and fitted OneHotEncoder
    cat_pipeline = preprocessor.named_transformers_["cat"]
    ohe = cat_pipeline.named_steps["ohe"]

    # Parallel reading of initial cat_columns and cat_columns from OHE to create a clean naming schema
    for column, categories in zip(cat_columns, ohe.categories_):
        for category in categories:
            feature_names.append(f"{str(column)}={str(category)}")
            feature_parents.append(str(column))
    
    # Numerical Columns (Passthrough Block)
    for column in num_columns:
        feature_names.append(str(column))
        feature_parents.append(str(column))

    # Boolean Columns (Passthrough Block)
    for column in bool_columns:
        feature_names.append(str(column))
        feature_parents.append(str(column))
    
    return {
        "feature_names": feature_names,
        "feature_parents": feature_parents, 
    }
