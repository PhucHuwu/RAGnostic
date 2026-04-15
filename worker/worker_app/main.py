import logging
import time


def run_worker_loop() -> None:
    logger = logging.getLogger("worker")
    logger.info("Worker started")
    while True:
        logger.debug("Polling ingest queue")
        time.sleep(5)


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    run_worker_loop()
