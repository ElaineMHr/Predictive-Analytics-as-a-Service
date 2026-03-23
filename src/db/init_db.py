# src/db/init_db.py
import os
import pymysql

DB_HOST = os.getenv("DB_HOST", "127.0.0.1")
DB_PORT = int(os.getenv("DB_PORT", "3306"))
DB_NAME = os.getenv("DB_NAME", "team1_db")
DB_USER = os.getenv("DB_USER", "team1_user")
DB_PASS = os.getenv("DB_PASS", "team1_pass")

dir = os.path.dirname(os.path.realpath(__file__))
SCHEMA_PATH = os.getenv("SCHEMA_PATH", os.path.join(dir, "schema_mysql.sql"))
SEED_PATH = os.getenv("SEED_PATH", os.path.join(dir, "seed.sql"))


def run_sql_file(cur, path):
    with open(path, "r", encoding="utf-8") as f:
        sql = f.read()

    statements = [s.strip() for s in sql.split(";") if s.strip()]
    for stmt in statements:
        cur.execute(stmt)


def main(apply_seed: bool = True):
    print(
        f"Connecting to MySQL {DB_HOST}:{DB_PORT} db={DB_NAME} as {DB_USER} ...")
    conn = pymysql.connect(
        host=DB_HOST, port=DB_PORT, user=DB_USER, password=DB_PASS,
        database=DB_NAME, autocommit=True, cursorclass=pymysql.cursors.DictCursor,
    )
    try:
        with conn.cursor() as cur:
            print(f"Applying schema: {SCHEMA_PATH}")
            run_sql_file(cur, SCHEMA_PATH)
            if apply_seed and os.path.exists(SEED_PATH):
                print(f"Applying seed:   {SEED_PATH}")
                run_sql_file(cur, SEED_PATH)
        print("DB initialized.")
    finally:
        conn.close()


if __name__ == "__main__":
    main(apply_seed=False)
