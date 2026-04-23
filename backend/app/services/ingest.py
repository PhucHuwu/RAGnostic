from __future__ import annotations

import hashlib
import json
import math
import re
import tempfile
import zipfile
from io import BytesIO
from pathlib import Path
from xml.etree import ElementTree as ET

from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.db import ChatbotProfileDB, DocumentDB
from app.services.rag import compute_embedding
from app.services.store import store


def _safe_decode(raw: bytes) -> str:
    text = raw.decode("utf-8", errors="ignore").replace("\x00", "").strip()
    if text:
        return text
    return raw.decode("latin-1", errors="ignore").replace("\x00", "").strip()


def _sanitize_text(text: str) -> str:
    return text.replace("\x00", "").strip()


def _escape_table_cell(value: str) -> str:
    return value.replace("|", "\\|").replace("\n", " ").strip()


def _table_to_markdown(rows: list[list[str]]) -> str:
    if not rows:
        return ""
    max_cols = max(len(row) for row in rows)
    normalized = [row + [""] * (max_cols - len(row)) for row in rows]
    header = normalized[0]
    separators = ["---"] * max_cols

    output = [
        "| " + " | ".join(_escape_table_cell(cell) for cell in header) + " |",
        "| " + " | ".join(separators) + " |",
    ]
    for row in normalized[1:]:
        output.append("| " + " | ".join(_escape_table_cell(cell) for cell in row) + " |")
    return "\n".join(output)


def _extract_text_value(item: object) -> str:
    for attr in ("text", "content", "orig", "markdown"):
        value = getattr(item, attr, None)
        if isinstance(value, str) and value.strip():
            return _sanitize_text(value)
    export_md = getattr(item, "export_to_markdown", None)
    if callable(export_md):
        try:
            value = export_md()
            if isinstance(value, str) and value.strip():
                return _sanitize_text(value)
        except Exception:
            pass
    return ""


def _classify_block_type(label: str) -> str:
    lower = label.lower()
    if "table" in lower:
        return "table"
    if "figure" in lower or "picture" in lower or "image" in lower:
        return "image"
    if "formula" in lower or "equation" in lower:
        return "formula"
    return "text"


def _extract_ordered_blocks_from_docling(doc: object) -> list[dict]:
    blocks: list[dict] = []
    iterate_items = getattr(doc, "iterate_items", None)
    if not callable(iterate_items):
        return blocks

    order = 1
    try:
        for entry in iterate_items():
            item = entry[0] if isinstance(entry, tuple) else entry
            label = str(getattr(item, "label", item.__class__.__name__))
            content = _extract_text_value(item)
            if not content:
                continue
            block_type = _classify_block_type(label)
            source_ref = str(getattr(item, "self_ref", f"item-{order}"))
            blocks.append(
                {
                    "order": order,
                    "type": block_type,
                    "label": label,
                    "content": content,
                    "source_ref": source_ref,
                }
            )
            order += 1
    except Exception:
        return []
    return blocks


def _parse_with_docling(file_name: str, file_ext: str, raw: bytes) -> dict | None:
    try:
        import docling
        from docling.document_converter import DocumentConverter
    except Exception:
        return None

    tmp_path: Path | None = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=f".{file_ext}") as handle:
            handle.write(raw)
            tmp_path = Path(handle.name)

        converter = DocumentConverter()
        result = converter.convert(str(tmp_path))
        doc = getattr(result, "document", result)

        markdown_export = ""
        export_to_markdown = getattr(doc, "export_to_markdown", None)
        if callable(export_to_markdown):
            markdown_export = _sanitize_text(export_to_markdown())

        ordered_blocks = _extract_ordered_blocks_from_docling(doc)
        if not markdown_export and ordered_blocks:
            markdown_export = "\n\n".join(block["content"] for block in ordered_blocks)
        if not markdown_export:
            return None

        table_blocks = [
            block["content"]
            for block in ordered_blocks
            if block.get("type") == "table" and block.get("content")
        ]
        image_blocks = [
            block for block in ordered_blocks if block.get("type") == "image"
        ]

        full_text = markdown_export
        lines = [line.strip() for line in full_text.splitlines() if line.strip()]
        paragraphs = [p.strip() for p in re.split(r"\n\s*\n", full_text) if p.strip()]
        sentences = [s.strip() for s in re.split(r"(?<=[.!?])\s+", full_text) if s.strip()]

        return {
            "file_name": file_name,
            "file_ext": file_ext,
            "lines": lines,
            "paragraphs": paragraphs,
            "sentences": sentences,
            "full_text": full_text,
            "table_markdown_blocks": table_blocks,
            "table_count": len(table_blocks),
            "image_count": len(image_blocks),
            "ordered_blocks": ordered_blocks,
            "parser_name": "docling",
            "parser_version": getattr(docling, "__version__", "unknown"),
        }
    except Exception:
        return None
    finally:
        if tmp_path is not None:
            try:
                tmp_path.unlink(missing_ok=True)
            except Exception:
                pass


def _extract_docx_structured(raw: bytes) -> dict | None:
    namespace = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}
    w_ns = namespace["w"]

    try:
        with zipfile.ZipFile(BytesIO(raw)) as archive:
            xml_bytes = archive.read("word/document.xml")
    except (KeyError, zipfile.BadZipFile, RuntimeError):
        return None

    try:
        root = ET.fromstring(xml_bytes)
    except ET.ParseError:
        return None

    body = root.find("w:body", namespace)
    if body is None:
        return None

    paragraph_blocks: list[str] = []
    table_blocks: list[str] = []
    all_blocks: list[str] = []

    for child in body:
        if child.tag == f"{{{w_ns}}}p":
            runs = [node.text or "" for node in child.findall(".//w:t", namespace)]
            paragraph_text = _sanitize_text("".join(runs))
            if paragraph_text:
                paragraph_blocks.append(paragraph_text)
                all_blocks.append(paragraph_text)
            continue

        if child.tag == f"{{{w_ns}}}tbl":
            rows: list[list[str]] = []
            for tr in child.findall("./w:tr", namespace):
                row: list[str] = []
                for tc in tr.findall("./w:tc", namespace):
                    cell_runs = [node.text or "" for node in tc.findall(".//w:t", namespace)]
                    cell_text = _sanitize_text(" ".join(cell_runs))
                    row.append(cell_text)
                if any(cell for cell in row):
                    rows.append(row)
            table_md = _table_to_markdown(rows)
            if table_md:
                table_blocks.append(table_md)
                all_blocks.append(table_md)

    full_text = "\n\n".join(all_blocks)
    lines = [line.strip() for line in full_text.splitlines() if line.strip()]
    paragraphs = [p.strip() for p in re.split(r"\n\s*\n", full_text) if p.strip()]
    sentences = [s.strip() for s in re.split(r"(?<=[.!?])\s+", full_text) if s.strip()]

    return {
        "lines": lines,
        "paragraphs": paragraphs,
        "sentences": sentences,
        "full_text": full_text,
        "table_markdown_blocks": table_blocks,
        "table_count": len(table_blocks),
    }


def _extract_pdf_text(raw: bytes) -> tuple[str, int, str | None]:
    try:
        from pypdf import PdfReader
    except Exception:
        return "", 0, "pypdf_not_installed"

    try:
        reader = PdfReader(BytesIO(raw))
    except Exception:
        return "", 0, "pdf_open_failed"

    blocks: list[str] = []
    image_count = 0
    for page_idx, page in enumerate(reader.pages):
        try:
            text = _sanitize_text(page.extract_text() or "")
        except Exception:
            text = ""
        if text:
            blocks.append(f"[Page {page_idx + 1}]\n{text}")

        try:
            resources = page.get("/Resources")
            if resources and "/XObject" in resources:
                xobjects = resources["/XObject"].get_object()
                for obj in xobjects.values():
                    target = obj.get_object()
                    if target.get("/Subtype") == "/Image":
                        image_count += 1
        except Exception:
            pass

    if blocks:
        return "\n\n".join(blocks), image_count, None
    return "", image_count, "no_text_layer"


def _chunk_ordered_blocks(
    ordered_blocks: list[dict],
    chunk_size: int,
    chunk_overlap: int,
    strategy: str,
) -> list[dict]:
    if not ordered_blocks:
        return []

    if strategy == "CHARACTER":
        merged_text = "\n\n".join(block["content"] for block in ordered_blocks)
        return [
            {
                "content": part,
                "section_title": "READING_ORDER",
                "source_ref": f"ordered-window-{idx + 1}",
            }
            for idx, part in enumerate(_split_by_chars(merged_text, chunk_size, chunk_overlap))
        ]

    pieces: list[dict] = []
    for block in ordered_blocks:
        content = _sanitize_text(block.get("content", ""))
        if not content:
            continue
        block_type = str(block.get("type", "text")).upper()
        order = int(block.get("order", len(pieces) + 1))
        source_ref = str(block.get("source_ref", f"item-{order}"))
        for idx, part in enumerate(_split_by_chars(content, chunk_size, chunk_overlap)):
            pieces.append(
                {
                    "content": part,
                    "section_title": block_type,
                    "source_ref": f"order-{order}:{block_type}:{source_ref}:part-{idx + 1}",
                }
            )
    return pieces


def _tokenize(text: str) -> set[str]:
    return set(re.findall(r"\w+", text.lower(), flags=re.UNICODE))


def _split_by_chars(text: str, chunk_size: int, chunk_overlap: int) -> list[str]:
    text = _sanitize_text(text)
    if not text:
        return []
    if len(text) <= chunk_size:
        return [text]
    step = max(1, chunk_size - max(0, chunk_overlap))
    parts: list[str] = []
    for start in range(0, len(text), step):
        piece = _sanitize_text(text[start : start + chunk_size])
        if piece:
            parts.append(piece)
        if start + chunk_size >= len(text):
            break
    return parts


def _apply_tail_overlap(chunks: list[str], chunk_overlap: int) -> list[str]:
    if not chunks or chunk_overlap <= 0:
        return chunks
    merged: list[str] = [chunks[0]]
    for chunk in chunks[1:]:
        prev = merged[-1]
        prefix = prev[-chunk_overlap:].strip()
        if prefix:
            merged.append(f"{prefix}\n{chunk}")
        else:
            merged.append(chunk)
    return merged


def _parse_to_structured_json(file_name: str, file_ext: str, raw: bytes) -> dict:
    if file_ext in {"docx", "pdf"}:
        parsed_by_docling = _parse_with_docling(file_name=file_name, file_ext=file_ext, raw=raw)
        if parsed_by_docling is not None:
            return parsed_by_docling

    if file_ext == "txt":
        text = _safe_decode(raw)
        table_markdown_blocks: list[str] = []
        table_count = 0
        image_count = 0
        ordered_blocks: list[dict] = []
        parser_name = "fallback-local"
        parser_version = "v1"
    elif file_ext == "docx":
        docx_data = _extract_docx_structured(raw)
        if docx_data is not None:
            return {
                "file_name": file_name,
                "file_ext": file_ext,
                "lines": docx_data["lines"],
                "paragraphs": docx_data["paragraphs"],
                "sentences": docx_data["sentences"],
                "full_text": docx_data["full_text"],
                "table_markdown_blocks": docx_data["table_markdown_blocks"],
                "table_count": docx_data["table_count"],
                "image_count": 0,
                "ordered_blocks": [],
                "parser_name": "fallback-local",
                "parser_version": "v1",
            }
        text = ""
        table_markdown_blocks = []
        table_count = 0
        image_count = 0
        ordered_blocks = []
        parser_name = "fallback-local"
        parser_version = "v1"
        if not text:
            text = (
                f"DOCX document '{file_name}' uploaded but could not extract readable text. "
                "Please verify the file content or try exporting as TXT."
            )
    elif file_ext == "pdf":
        text, image_count, pdf_reason = _extract_pdf_text(raw)
        table_markdown_blocks = []
        table_count = 0
        ordered_blocks = []
        parser_name = "fallback-local"
        parser_version = "v1"
        if not text:
            if pdf_reason == "pypdf_not_installed":
                text = (
                    f"PDF document '{file_name}' uploaded but PDF parser dependency is missing. "
                    "Install backend dependency 'pypdf' and re-upload."
                )
            elif image_count > 0:
                text = (
                    f"PDF document '{file_name}' uploaded but no text layer was found. "
                    f"Detected {image_count} embedded image(s), OCR integration is required."
                )
            else:
                text = (
                    f"PDF document '{file_name}' uploaded but no extractable text was found. "
                    "This file may be scanned or protected; OCR integration is required."
                )
    else:
        text = (
            f"Binary document '{file_name}' ({file_ext}) uploaded successfully. "
            "Text extraction for this format is not enabled in local mock parser yet."
        )
        table_markdown_blocks = []
        table_count = 0
        image_count = 0
        ordered_blocks = []
        parser_name = "fallback-local"
        parser_version = "v1"
    if not text:
        text = f"No extractable text from {file_name} ({file_ext})"

    lines = [line.strip() for line in text.splitlines() if line.strip()]
    paragraphs = [p.strip() for p in re.split(r"\n\s*\n", text) if p.strip()]

    return {
        "file_name": file_name,
        "file_ext": file_ext,
        "lines": lines,
        "paragraphs": paragraphs,
        "sentences": [
            s.strip() for s in re.split(r"(?<=[.!?])\s+", text) if s.strip()
        ],
        "full_text": text,
        "table_markdown_blocks": table_markdown_blocks,
        "table_count": table_count,
        "image_count": image_count,
        "ordered_blocks": ordered_blocks,
        "parser_name": parser_name,
        "parser_version": parser_version,
    }


def _is_outline_header(line: str) -> bool:
    line = line.strip()
    if not line:
        return False
    if line.startswith("#"):
        return True
    if bool(re.match(r"^\d+(\.\d+)*[\)\.]?\s+", line)):
        return True
    if line.endswith(":") and len(line) < 120:
        return True
    words = re.findall(r"[A-Za-z0-9_]+", line)
    if 1 <= len(words) <= 8 and line.upper() == line and any(char.isalpha() for char in line):
        return True
    return False


def _chunk_outline(structured: dict, chunk_size: int, chunk_overlap: int) -> list[dict]:
    sections: list[tuple[str, list[str]]] = []
    current_title = "Untitled"
    current_lines: list[str] = []

    for line in structured.get("lines", []):
        if _is_outline_header(line):
            if current_lines:
                sections.append((current_title, current_lines))
            current_title = line.strip("# ").strip()
            current_lines = []
        else:
            current_lines.append(line)

    if current_lines:
        sections.append((current_title, current_lines))

    if not sections:
        full_text = structured.get("full_text", "")
        if not full_text:
            return []
        return [
            {
                "content": part,
                "section_title": None,
                "source_ref": f"outline-chunk-{idx + 1}",
            }
            for idx, part in enumerate(_split_by_chars(full_text, chunk_size, chunk_overlap))
        ]

    output: list[dict] = []
    for section_idx, (title, lines) in enumerate(sections):
        body = "\n".join(lines).strip()
        section_text = f"{title}\n\n{body}" if body else title
        section_chunks = _split_by_chars(section_text, chunk_size, chunk_overlap)
        for idx, part in enumerate(section_chunks):
            output.append(
                {
                    "content": part,
                    "section_title": title,
                    "source_ref": f"section-{section_idx + 1}-chunk-{idx + 1}",
                }
            )
    return output


def _chunk_paragraph(structured: dict, chunk_size: int, chunk_overlap: int) -> list[dict]:
    paragraphs = [_sanitize_text(p) for p in structured.get("paragraphs", []) if _sanitize_text(p)]
    chunks: list[str] = []
    current = ""
    for paragraph in paragraphs:
        if len(paragraph) > chunk_size:
            if current:
                chunks.append(current.strip())
                current = ""
            chunks.extend(_split_by_chars(paragraph, chunk_size, chunk_overlap))
            continue

        next_piece = f"{current}\n\n{paragraph}" if current else paragraph
        if len(next_piece) > chunk_size and current:
            chunks.append(current.strip())
            current = paragraph
        else:
            current = next_piece
    if current.strip():
        chunks.append(current.strip())

    with_overlap = _apply_tail_overlap(chunks, chunk_overlap)
    return [
        {
            "content": chunk,
            "section_title": None,
            "source_ref": f"paragraph-chunk-{idx + 1}",
        }
        for idx, chunk in enumerate(with_overlap)
    ]


def _chunk_semantic(structured: dict, chunk_size: int, chunk_overlap: int) -> list[dict]:
    sentences = [_sanitize_text(s) for s in structured.get("sentences", []) if _sanitize_text(s)]
    if not sentences:
        return []

    chunks: list[str] = []
    current_sentences: list[str] = []
    current_tokens: set[str] = set()

    for sentence in sentences:
        sentence_tokens = _tokenize(sentence)
        if not current_sentences:
            current_sentences = [sentence]
            current_tokens = set(sentence_tokens)
            continue

        candidate = " ".join(current_sentences + [sentence])
        overlap = len(current_tokens.intersection(sentence_tokens))
        denom = max(1, len(current_tokens.union(sentence_tokens)))
        semantic_similarity = overlap / denom

        if len(candidate) <= chunk_size and semantic_similarity >= 0.08:
            current_sentences.append(sentence)
            current_tokens = current_tokens.union(sentence_tokens)
            continue

        if len(candidate) <= max(chunk_size, int(math.ceil(chunk_size * 1.15))) and len(current_sentences) < 3:
            current_sentences.append(sentence)
            current_tokens = current_tokens.union(sentence_tokens)
            continue

        chunks.append(" ".join(current_sentences).strip())
        current_sentences = [sentence]
        current_tokens = set(sentence_tokens)

    if current_sentences:
        chunks.append(" ".join(current_sentences).strip())

    normalized_chunks: list[str] = []
    for chunk in chunks:
        if len(chunk) > chunk_size:
            normalized_chunks.extend(_split_by_chars(chunk, chunk_size, chunk_overlap))
        else:
            normalized_chunks.append(chunk)

    with_overlap = _apply_tail_overlap(normalized_chunks, chunk_overlap)
    return [
        {
            "content": chunk,
            "section_title": None,
            "source_ref": f"semantic-chunk-{idx + 1}",
        }
        for idx, chunk in enumerate(with_overlap)
    ]


def _chunk_character(structured: dict, chunk_size: int, chunk_overlap: int) -> list[str]:
    text = structured.get("full_text", "")
    if not text:
        return []
    step = max(1, chunk_size - max(0, chunk_overlap))
    chunks: list[str] = []
    start = 0
    while start < len(text):
        piece = text[start : start + chunk_size].strip()
        if piece:
            chunks.append(piece)
        start += step
    return chunks


def build_chunks(
    structured: dict, strategy: str, chunk_size: int, chunk_overlap: int
) -> list[dict]:
    strategy_upper = (strategy or "PARAGRAPH").upper()
    ordered_blocks = structured.get("ordered_blocks") or []
    if ordered_blocks:
        pieces = _chunk_ordered_blocks(ordered_blocks, chunk_size, chunk_overlap, strategy_upper)
    elif strategy_upper == "OUTLINE":
        pieces = _chunk_outline(structured, chunk_size, chunk_overlap)
    elif strategy_upper == "SEMANTIC":
        pieces = _chunk_semantic(structured, chunk_size, chunk_overlap)
    elif strategy_upper == "CHARACTER":
        char_chunks = _chunk_character(structured, chunk_size, chunk_overlap)
        pieces = [
            {
                "content": chunk,
                "section_title": None,
                "source_ref": f"character-chunk-{idx + 1}",
            }
            for idx, chunk in enumerate(char_chunks)
        ]
    else:
        pieces = _chunk_paragraph(structured, chunk_size, chunk_overlap)

    if not pieces:
        full_text = structured.get("full_text", "").strip()
        pieces = (
            [
                {
                    "content": chunk,
                    "section_title": None,
                    "source_ref": f"fallback-chunk-{idx + 1}",
                }
                for idx, chunk in enumerate(_split_by_chars(full_text, chunk_size, chunk_overlap))
            ]
            if full_text
            else []
        )

    chunks: list[dict] = []
    for idx, piece in enumerate(pieces):
        content = piece.get("content", "")
        content = _sanitize_text(content)
        if not content:
            continue
        token_count = max(1, len(re.findall(r"\S+", content)))
        chunk_hash = hashlib.sha256(f"{idx}:{content}".encode("utf-8")).hexdigest()
        chunks.append(
            {
                "content": content,
                "token_count": token_count,
                "char_count": len(content),
                "section_title": piece.get("section_title"),
                "page_no": None,
                "source_ref": piece.get("source_ref") or f"chunk-{idx + 1}",
                "chunk_hash": chunk_hash,
                "embedding_vector": compute_embedding(content),
            }
        )
    return chunks


def run_ingest_pipeline(
    db: Session,
    *,
    document: DocumentDB,
    profile: ChatbotProfileDB,
    raw: bytes,
) -> dict:
    store.update_document_status(db, document.id, "PARSING")
    structured = _parse_to_structured_json(document.file_name, document.file_ext, raw)

    structured_json_path = f"{document.storage_bucket}/{document.storage_key}.structured.json"
    summary = f"Parsed {len(structured.get('paragraphs', []))} paragraphs"
    store.upsert_parse_result(
        db,
        document_id=document.id,
        structured_json_path=structured_json_path,
        summary=summary,
        parser_name=structured.get("parser_name", "docling"),
        parser_version=structured.get("parser_version", "unknown"),
        metadata_json={
            "line_count": len(structured.get("lines", [])),
            "paragraph_count": len(structured.get("paragraphs", [])),
            "table_count": structured.get("table_count", 0),
            "image_count": structured.get("image_count", 0),
            "ordered_block_count": len(structured.get("ordered_blocks") or []),
            "raw_bytes": len(raw),
            "strategy": profile.chunk_strategy,
            "embedding_model": settings.embedding_model,
            "preview": json.dumps(structured, ensure_ascii=True)[:800],
        },
    )

    store.update_document_status(db, document.id, "CHUNKING")
    chunks = build_chunks(
        structured=structured,
        strategy=profile.chunk_strategy,
        chunk_size=profile.chunk_size,
        chunk_overlap=profile.chunk_overlap,
    )

    store.update_document_status(db, document.id, "INDEXING")
    stored_chunks = store.replace_document_chunks(
        db,
        document_id=document.id,
        profile_id=document.profile_id,
        chunks=chunks,
    )

    store.update_document_status(db, document.id, "READY")
    return {
        "chunk_count": len(stored_chunks),
        "status": "READY",
        "strategy": profile.chunk_strategy,
    }
