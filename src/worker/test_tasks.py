import pytest
import os
import kombu.exceptions
import logging
from ..celery_handler import celery_app as celapp

logger = logging.getLogger(__name__)


@pytest.fixture(scope="module")
def celery_app():
    return celapp


@pytest.mark.skipif(os.environ.get("PYTEST_CI_MODE"), reason="does not work in CI pipeline")
def test_task_train(celery_app):
    pytest.skip()
    problem_id: str = "7f3c6b2a-4c1e-4f7b-bb59-3c9e5c1f0e8d"
    task = celery_app.send_task(
        "train.task", args=[problem_id])
    # try:
    #     problem_id: str = "7f3c6b2a-4c1e-4f7b-bb59-3c9e5c1f0e8d"
    #     task = celery_app.send_task(
    #         "train.task", args=[problem_id])
    # except kombu.exceptions.OperationalError as e:
    #     logger.warning(e)
    #     pytest.skip("Skip pytest case as Celery/Redis is probably not available")
