# src/db/init_db.py
import os

try:
    from config import settings
except ImportError:
    from src.config import settings

dir = os.path.dirname(os.path.realpath(__file__))

if settings.is_portfolio:
    SCHEMA_PATH = os.getenv("SCHEMA_PATH", os.path.join(dir, "schema_postgresql.sql"))
else:
    SCHEMA_PATH = os.getenv("SCHEMA_PATH", os.path.join(dir, "schema_mysql.sql"))

SEED_PATH = os.getenv("SEED_PATH", os.path.join(dir, "seed.sql"))


def _run_postgresql(apply_seed: bool):
    import psycopg2
    import psycopg2.extras

    dsn = settings.DATABASE_URL
    print(f"Connecting to PostgreSQL via DATABASE_URL ...")
    conn = psycopg2.connect(dsn, cursor_factory=psycopg2.extras.RealDictCursor)
    conn.autocommit = True
    try:
        with conn.cursor() as cur:
            print(f"Applying schema: {SCHEMA_PATH}")
            with open(SCHEMA_PATH, "r", encoding="utf-8") as f:
                sql = f.read()
            # Execute each statement separately
            statements = [s.strip() for s in sql.split(";") if s.strip()]
            for stmt in statements:
                cur.execute(stmt)
            if apply_seed and os.path.exists(SEED_PATH):
                print(f"Applying seed:   {SEED_PATH}")
                with open(SEED_PATH, "r", encoding="utf-8") as f:
                    seed_sql = f.read()
                seed_stmts = [s.strip() for s in seed_sql.split(";") if s.strip()]
                for stmt in seed_stmts:
                    cur.execute(stmt)
        print("DB initialized.")
    finally:
        conn.close()


def _run_mysql(apply_seed: bool):
    import pymysql

    DB_HOST = os.getenv("DB_HOST", "127.0.0.1")
    DB_PORT = int(os.getenv("DB_PORT", "3306"))
    DB_NAME = os.getenv("DB_NAME", "team1_db")
    DB_USER = os.getenv("DB_USER", "team1_user")
    DB_PASS = os.getenv("DB_PASS", "team1_pass")

    mysql_schema_path = os.getenv("SCHEMA_PATH", os.path.join(dir, "schema_mysql.sql"))

    print(f"Connecting to MySQL {DB_HOST}:{DB_PORT} db={DB_NAME} as {DB_USER} ...")
    conn = pymysql.connect(
        host=DB_HOST, port=DB_PORT, user=DB_USER, password=DB_PASS,
        database=DB_NAME, autocommit=True, cursorclass=pymysql.cursors.DictCursor,
    )
    try:
        with conn.cursor() as cur:
            print(f"Applying schema: {mysql_schema_path}")
            with open(mysql_schema_path, "r", encoding="utf-8") as f:
                sql = f.read()
            statements = [s.strip() for s in sql.split(";") if s.strip()]
            for stmt in statements:
                cur.execute(stmt)
            if apply_seed and os.path.exists(SEED_PATH):
                print(f"Applying seed:   {SEED_PATH}")
                with open(SEED_PATH, "r", encoding="utf-8") as f:
                    seed_sql = f.read()
                seed_stmts = [s.strip() for s in seed_sql.split(";") if s.strip()]
                for stmt in seed_stmts:
                    cur.execute(stmt)
        print("DB initialized.")
    finally:
        conn.close()


def main(apply_seed: bool = True):
    if settings.is_portfolio:
        _run_postgresql(apply_seed)
    else:
        _run_mysql(apply_seed)


if __name__ == "__main__":
    main(apply_seed=False)
