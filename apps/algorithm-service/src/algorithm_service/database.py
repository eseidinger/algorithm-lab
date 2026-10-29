from sqlalchemy import create_engine
from sqlalchemy.engine import Engine

from algorithm_service.config import Settings


def create_database_engine(settings: Settings) -> Engine:
    return create_engine(
        settings.database_url,
        pool_pre_ping=True,
        connect_args={"options": "-csearch_path=executions"},
    )