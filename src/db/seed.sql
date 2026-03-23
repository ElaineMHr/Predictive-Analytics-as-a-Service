-- seed.sql (UUID-compatible seed + RESET at end)

-- =========================
-- 0) Start clean
-- =========================
SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE predictions;
TRUNCATE TABLE jobs;
TRUNCATE TABLE models;
TRUNCATE TABLE ml_problems;
TRUNCATE TABLE dataset_versions;
TRUNCATE TABLE datasets;
TRUNCATE TABLE users;

SET FOREIGN_KEY_CHECKS = 1;

-- =========================
-- 1) Seed minimal demo graph
-- =========================
SET @user_id    = '11111111-1111-1111-1111-111111111111';
SET @dataset_id  = '22222222-2222-2222-2222-222222222222';
SET @version_id  = '33333333-3333-3333-3333-333333333333';
SET @problem_id  = '44444444-4444-4444-4444-444444444444';
SET @model_id    = '55555555-5555-5555-5555-555555555555';
SET @job_id      = '66666666-6666-6666-6666-666666666666';
SET @pred_id     = '77777777-7777-7777-7777-777777777777';

INSERT INTO users (id, username, email)
VALUES (@user_id, 'demo_user', 'demo_user@example.com');

INSERT INTO datasets (id, name, owner_id)
VALUES (@dataset_id, 'sales_store_1', @user_id);

INSERT INTO dataset_versions (id, dataset_id, uri, schema_json, profile_json, row_count)
VALUES (
  @version_id,
  @dataset_id,
  '/data/sales_2025_01.csv',
  JSON_OBJECT('date','DATE','sales','INT'),
  JSON_OBJECT('note','seed profile'),
  1000
);

-- NOTE: validation_strategy is removed from ml_problems now
INSERT INTO ml_problems (
  id, dataset_version_id, dataset_version_uri, task, target,
  feature_strategy_json, schema_snapshot, semantic_types, current_model_id
) VALUES (
  @problem_id,
  @version_id,
  '/data/sales_2025_01.csv',
  'timeseries',
  'sales',
  JSON_OBJECT('include', JSON_ARRAY('date')),
  JSON_OBJECT('date','DATE','sales','INT'),
  JSON_OBJECT('date','datetime','sales','target'),
  NULL
);

-- NOTE: evaluation_strategy moved to models
INSERT INTO models (
  id, problem_id, name, algorithm, train_mode, evaluation_strategy, status,
  metrics_json, uri, metadata_json, explanation_json, created_by
) VALUES (
  @model_id,
  @problem_id,
  'seed_model',
  'prophet',
  'auto',
  'train_test_split',
  'staging',
  JSON_OBJECT('MAE', 1.23),
  '/models/seed_model.joblib',
  NULL,
  NULL,
  @user_id
);

INSERT INTO jobs (
  id, type, status, task_id, requested_by, problem_id, model_id, started_at, finished_at, error
) VALUES (
  @job_id,
  'train',
  'completed',
  'seed-task',
  @user_id,
  @problem_id,
  @model_id,
  NULL,
  NULL,
  NULL
);

INSERT INTO predictions (
  id, model_id, input_uri, inputs_json, outputs_json, outputs_uri, requested_by
) VALUES (
  @pred_id,
  @model_id,
  '/data/predict_input.json',
  JSON_OBJECT('date', '2025-01-31'),
  JSON_OBJECT('sales_hat', 123),
  '/data/predict_output.json',
  @user_id
);

-- =========================
-- 2) RESET (delete what was written)
-- =========================
SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE predictions;
TRUNCATE TABLE jobs;
TRUNCATE TABLE models;
TRUNCATE TABLE ml_problems;
TRUNCATE TABLE dataset_versions;
TRUNCATE TABLE datasets;
TRUNCATE TABLE users;

SET FOREIGN_KEY_CHECKS = 1;
