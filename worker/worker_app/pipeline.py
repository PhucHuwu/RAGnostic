from dataclasses import dataclass


@dataclass
class IngestJob:
    document_id: str
    profile_id: str


def process_ingest_job(job: IngestJob) -> None:
    _parse_document(job.document_id)
    _chunk_document(job.document_id, job.profile_id)
    _index_chunks(job.document_id, job.profile_id)


def _parse_document(document_id: str) -> None:
    _ = document_id


def _chunk_document(document_id: str, profile_id: str) -> None:
    _ = (document_id, profile_id)


def _index_chunks(document_id: str, profile_id: str) -> None:
    _ = (document_id, profile_id)
