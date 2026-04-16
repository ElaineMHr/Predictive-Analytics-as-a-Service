FROM python:3.13-slim

WORKDIR /code

# Install dependencies
COPY requirements.portfolio.txt .
RUN pip install --no-cache-dir -r requirements.portfolio.txt

# Copy source — flat layout (no __init__.py at /code/ so fastapi run
# adds /code/ itself to sys.path, making bare imports like
# "from config import settings" resolve correctly)
COPY src/config.py           /code/config.py
COPY src/api/                /code/api/
COPY src/db/                 /code/db/
COPY src/ml/                 /code/ml/
COPY src/mlcore/             /code/mlcore/

# Default storage paths (override via env vars)
ENV MODEL_BASE_PATH=/tmp/models \
    UPLOAD_DIR=/tmp/uploads

EXPOSE 8000

CMD ["fastapi", "run", "api/main.py", "--port", "8000"]
