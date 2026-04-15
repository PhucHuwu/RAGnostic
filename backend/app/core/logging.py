import logging
from datetime import UTC, datetime

from pythonjsonlogger import jsonlogger


class StructuredJsonFormatter(jsonlogger.JsonFormatter):
    def add_fields(self, log_record, record, message_dict):
        super().add_fields(log_record, record, message_dict)
        log_record.setdefault(
            "timestamp", datetime.now(UTC).isoformat().replace("+00:00", "Z")
        )
        log_record.setdefault("level", record.levelname)
        log_record.setdefault("service", getattr(record, "service", "rag-api"))
        log_record.setdefault("event", getattr(record, "event", record.name))
        log_record.setdefault("message", record.getMessage())
        log_record.setdefault("request_id", getattr(record, "request_id", None))
        log_record.setdefault("session_id", getattr(record, "session_id", None))
        log_record.setdefault("user_id", getattr(record, "user_id", None))
        log_record.setdefault("metadata", getattr(record, "metadata", {}))


def configure_logging(service_name: str, level: str = "INFO") -> None:
    root = logging.getLogger()
    root.handlers.clear()
    root.setLevel(level.upper())

    handler = logging.StreamHandler()
    formatter = StructuredJsonFormatter()
    handler.setFormatter(formatter)
    root.addHandler(handler)

    logger = logging.getLogger("app")
    logger.info(
        "Logging initialized",
        extra={"service": service_name, "event": "app.logging.init"},
    )
