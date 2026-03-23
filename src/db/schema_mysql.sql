-- ==========================================
-- USERS
-- ==========================================

CREATE TABLE IF NOT EXISTS users (
  id CHAR(36) PRIMARY KEY,
  username VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- DATASETS & VERSIONS
-- ==========================================

CREATE TABLE IF NOT EXISTS datasets (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  owner_id CHAR(36),                        -- FK to users.id
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS dataset_versions (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(255),                        -- human readable name
  dataset_id CHAR(36) NOT NULL,
  filename VARCHAR(255),
  uri TEXT NOT NULL,                        -- where the dataset file is stored
  schema_json JSON,                         -- inferred schema at upload
  profile_json JSON,                        -- data profile / stats
  row_count INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (dataset_id) REFERENCES datasets(id)
);

-- ==========================================
-- ML PROBLEMS
-- ==========================================

CREATE TABLE IF NOT EXISTS ml_problems (
  id CHAR(36) PRIMARY KEY,
  dataset_version_id CHAR(36) NOT NULL,
  name VARCHAR(255),                        -- human readable name
  dataset_version_uri TEXT,                 -- snapshot of the URI used for training
  task VARCHAR(64) NOT NULL,                -- 'timeseries' | 'regression' | 'classification'
  target VARCHAR(255) NOT NULL,             -- target column name
  feature_strategy_json JSON,               -- e.g. {"include": [...], "exclude": [...]}
  schema_snapshot JSON,                     -- schema at training time
  semantic_types JSON,                      -- semantic info per column
  current_model_id CHAR(36),                -- id of current production model (no URI duplication)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (dataset_version_id) REFERENCES dataset_versions(id)
  -- FOREIGN KEY (current_model_id) REFERENCES models(id) -- this can't work at the moment, because at the time of ml_problems table creation, models table is not yet created
                                                          -- and it errors trying to reference a non existent table
);

-- ==========================================
-- MODELS
-- ==========================================

CREATE TABLE IF NOT EXISTS models (
  id CHAR(36) PRIMARY KEY,
  problem_id CHAR(36) NOT NULL,
  name VARCHAR(255),                        -- human readable name
  algorithm VARCHAR(128) NOT NULL,          -- e.g. 'sklearn_random_forest', 'prophet'
  train_mode VARCHAR(64),                   -- e.g. 'auto', 'manual'
  evaluation_strategy VARCHAR(128),         -- e.g. 'train_test_split', 'cv_5fold'
  status VARCHAR(32) NOT NULL,              -- 'staging' | 'production' | 'archived'
  metrics_json JSON,                        -- metrics as JSON (rmse, mae, f1, etc.)
  uri TEXT,                                 -- where the model file is stored (joblib, etc.)
  metadata_json JSON,                       -- optional extra metadata file
  explanation_json JSON,                    -- optional explanation/shap file
  created_by CHAR(36),                      -- FK to users.id (who trained it)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (problem_id) REFERENCES ml_problems(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- ==========================================
-- JOBS
-- ==========================================

CREATE TABLE IF NOT EXISTS jobs (
  id CHAR(36) PRIMARY KEY,
  type VARCHAR(32) NOT NULL,                -- 'train' | 'predict' | 'profile'
  problem_id CHAR(36),
  model_id CHAR(36),
  status VARCHAR(32) NOT NULL,              -- 'queued' | 'running' | 'completed' | 'failed'
  task_id VARCHAR(128),                     -- Celery task id (optional)
  requested_by CHAR(36),                    -- FK: who triggered the job
  started_at TIMESTAMP NULL,
  finished_at TIMESTAMP NULL,
  error TEXT,
  FOREIGN KEY (problem_id) REFERENCES ml_problems(id),
  FOREIGN KEY (model_id) REFERENCES models(id),
  FOREIGN KEY (requested_by) REFERENCES users(id)
);

-- ==========================================
-- PREDICTIONS
-- ==========================================

CREATE TABLE IF NOT EXISTS predictions (
  id CHAR(36) PRIMARY KEY,
  model_id CHAR(36),                        -- which model was used
  name VARCHAR(255),                        -- human readable name
  input_uri TEXT,                           -- file with inputs (e.g. CSV)
  inputs_json JSON,                         -- small inputs inline
  outputs_json JSON,                        -- small outputs inline
  outputs_uri TEXT,                         -- file with outputs (CSV/Parquet)
  status VARCHAR(32) NOT NULL,              -- 'predicting' | 'completed' | 'failed'
  requested_by CHAR(36),                    -- FK: who asked for the prediction
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (model_id) REFERENCES models(id),
  FOREIGN KEY (requested_by) REFERENCES users(id)
);
