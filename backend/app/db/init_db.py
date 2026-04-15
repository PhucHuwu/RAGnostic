import logging

from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.db.base import Base
from app.db.session import SessionLocal, engine
from app.services.store import store


def init_database() -> None:
    logger = logging.getLogger("app")
    try:
        Base.metadata.create_all(bind=engine)
        with SessionLocal() as db:
            db.execute(text("SELECT 1"))
            store.bootstrap_defaults(db)
    except SQLAlchemyError as exc:
        logger.warning(
            "Database init skipped",
            extra={
                "event": "db.init.skipped",
                "metadata": {"reason": str(exc)},
            },
        )
