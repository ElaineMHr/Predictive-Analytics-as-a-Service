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
  owner_id CHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS dataset_versions (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(255),
  dataset_id CHAR(36) NOT NULL,
  filename VARCHAR(255),
  uri TEXT NOT NULL,
  schema_json JSONB,
  profile_json JSONB,
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
  name VARCHAR(255),
  dataset_version_uri TEXT,
  task VARCHAR(64) NOT NULL,
  target VARCHAR(255) NOT NULL,
  feature_strategy_json JSONB,
  schema_snapshot JSONB,
  semantic_types JSONB,
  current_model_id CHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (dataset_version_id) REFERENCES dataset_versions(id)
);

-- ==========================================
-- MODELS
-- ==========================================

CREATE TABLE IF NOT EXISTS models (
  id CHAR(36) PRIMARY KEY,
  problem_id CHAR(36) NOT NULL,
  name VARCHAR(255),
  algorithm VARCHAR(128) NOT NULL,
  train_mode VARCHAR(64),
  evaluation_strategy VARCHAR(128),
  status VARCHAR(32) NOT NULL,
  metrics_json JSONB,
  uri TEXT,
  metadata_json JSONB,
  explanation_json JSONB,
  created_by CHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (problem_id) REFERENCES ml_problems(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- ==========================================
-- JOBS
-- ==========================================

CREATE TABLE IF NOT EXISTS jobs (
  id CHAR(36) PRIMARY KEY,
  type VARCHAR(32) NOT NULL,
  problem_id CHAR(36),
  model_id CHAR(36),
  status VARCHAR(32) NOT NULL,
  progress INTEGER DEFAULT 0,
  message TEXT,
  result JSONB,
  task_id VARCHAR(128),
  requested_by CHAR(36),
  started_at TIMESTAMP,
  finished_at TIMESTAMP,
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
  model_id CHAR(36),
  name VARCHAR(255),
  input_uri TEXT,
  inputs_json JSONB,
  outputs_json JSONB,
  outputs_uri TEXT,
  status VARCHAR(32) NOT NULL,
  requested_by CHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (model_id) REFERENCES models(id),
  FOREIGN KEY (requested_by) REFERENCES users(id)
);
