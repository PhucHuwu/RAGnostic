from __future__ import annotations

import hashlib
import json
import math
import re
from urllib import error, request

from app.core.config import settings


def _tokenize(text: str) -> list[str]:
    return re.findall(r"\w+", text.lower(), flags=re.UNICODE)


def compute_embedding(text: str, dim: int | None = None) -> list[float]:
    if dim is None:
        dim = settings.embedding_dimensions
    tokens = _tokenize(text)
    if not tokens:
        return [0.0] * dim
    vec = [0.0] * dim
    for token in tokens:
        digest = hashlib.sha256(token.encode("utf-8")).hexdigest()
        idx = int(digest[:8], 16) % dim
        sign = 1.0 if (int(digest[8:10], 16) % 2 == 0) else -1.0
        vec[idx] += sign
    norm = math.sqrt(sum(value * value for value in vec)) or 1.0
    return [value / norm for value in vec]


def _cosine_similarity(a: list[float], b: list[float]) -> float:
    if not a or not b or len(a) != len(b):
        return 0.0
    return float(sum(x * y for x, y in zip(a, b, strict=False)))


def _normalize_vector(value: object) -> list[float]:
    if value is None:
        return []
    if isinstance(value, list):
        return [float(item) for item in value]
    if isinstance(value, tuple):
        return [float(item) for item in value]
    if hasattr(value, "tolist"):
        converted = value.tolist()
        if isinstance(converted, list):
            return [float(item) for item in converted]
    return []


def retrieve_context(query: str, chunks: list[dict], top_k: int) -> list[dict]:
    query_vec = compute_embedding(query)
    query_tokens = set(_tokenize(query))
    scored: list[dict] = []
    for chunk in chunks:
        chunk_tokens = set(_tokenize(chunk["content"]))
        overlap = len(query_tokens.intersection(chunk_tokens))
        lexical_score = overlap / max(1, len(query_tokens))
        vec_score = _cosine_similarity(query_vec, _normalize_vector(chunk.get("embedding_vector")))
        hybrid = (0.4 * vec_score) + (0.6 * lexical_score)
        scored.append(
            {
                "chunk_id": chunk["chunk_id"],
                "score": hybrid,
                "vector_score": vec_score,
                "lexical_score": lexical_score,
                "content": chunk["content"],
                "source_ref": chunk.get("source_ref"),
                "section_title": chunk.get("section_title"),
            }
        )
    scored.sort(key=lambda item: item["score"], reverse=True)
    return scored[: max(1, top_k)]


def mock_retrieve_context(user_message: str, top_k: int) -> list[dict]:
    return [
        {
            "chunk_id": f"chunk_{idx}",
            "score": 1.0 / (idx + 1),
            "vector_score": 0.0,
            "lexical_score": 0.0,
            "content": f"Retrieved knowledge candidate {idx + 1} for: {user_message}",
            "source_ref": f"mock-{idx + 1}",
            "section_title": None,
        }
        for idx in range(max(1, top_k))
    ]


def merge_vector_and_lexical_results(
    *,
    query: str,
    vector_candidates: list[dict],
    lexical_candidates: list[dict],
    top_k: int,
) -> list[dict]:
    query_tokens = set(_tokenize(query))
    merged: dict[str, dict] = {}

    for candidate in vector_candidates:
        item = dict(candidate)
        item.setdefault("lexical_score", 0.0)
        item.setdefault("vector_score", candidate.get("score", 0.0))
        item["score"] = (0.5 * item["vector_score"]) + (0.5 * item["lexical_score"])
        merged[item["chunk_id"]] = item

    for candidate in lexical_candidates:
        chunk_id = candidate["chunk_id"]
        lexical_score = candidate.get("score", 0.0)
        if chunk_id in merged:
            merged[chunk_id]["lexical_score"] = max(merged[chunk_id]["lexical_score"], lexical_score)
            merged[chunk_id]["score"] = (0.5 * merged[chunk_id]["vector_score"]) + (
                0.5 * merged[chunk_id]["lexical_score"]
            )
        else:
            content = candidate.get("content", "")
            overlap = 0
            if query_tokens:
                overlap = len(query_tokens.intersection(set(_tokenize(content))))
            merged[chunk_id] = {
                **candidate,
                "vector_score": 0.0,
                "lexical_score": lexical_score,
                "score": (0.5 * 0.0) + (0.5 * lexical_score) + (0.01 * overlap),
            }

    items = list(merged.values())
    items.sort(key=lambda value: value["score"], reverse=True)
    return items[: max(1, top_k)]


def _bm25_score(
    query_tokens: list[str],
    doc_tokens: list[str],
    doc_freq: dict[str, int],
    avg_doc_len: float,
    corpus_size: int,
    k1: float = 1.5,
    b: float = 0.75,
) -> float:
    score = 0.0
    if not doc_tokens:
        return score
    tf: dict[str, int] = {}
    for token in doc_tokens:
        tf[token] = tf.get(token, 0) + 1
    doc_len = len(doc_tokens)
    for token in query_tokens:
        if token not in tf:
            continue
        n = doc_freq.get(token, 0)
        idf = math.log(1 + ((corpus_size - n + 0.5) / (n + 0.5)))
        freq = tf[token]
        denominator = freq + k1 * (1 - b + b * (doc_len / max(avg_doc_len, 1e-6)))
        score += idf * ((freq * (k1 + 1)) / max(denominator, 1e-6))
    return score


def bm25_rerank(query: str, candidates: list[dict], rerank_top_n: int) -> list[dict]:
    if not candidates:
        return []
    tokenized_docs = [_tokenize(item["content"]) for item in candidates]
    query_tokens = _tokenize(query)
    doc_freq: dict[str, int] = {}
    for tokens in tokenized_docs:
        for token in set(tokens):
            doc_freq[token] = doc_freq.get(token, 0) + 1
    avg_doc_len = sum(len(tokens) for tokens in tokenized_docs) / max(len(tokenized_docs), 1)
    corpus_size = len(tokenized_docs)

    reranked: list[dict] = []
    for candidate, tokens in zip(candidates, tokenized_docs, strict=False):
        bm25_score = _bm25_score(
            query_tokens=query_tokens,
            doc_tokens=tokens,
            doc_freq=doc_freq,
            avg_doc_len=avg_doc_len,
            corpus_size=corpus_size,
        )
        merged_score = (0.65 * bm25_score) + (0.35 * candidate["score"])
        reranked.append(
            {
                **candidate,
                "bm25_score": bm25_score,
                "score": merged_score,
            }
        )
    reranked.sort(key=lambda item: item["score"], reverse=True)
    return reranked[: max(1, rerank_top_n)]


def mock_bm25_rerank(candidates: list[dict], rerank_top_n: int) -> list[dict]:
    return candidates[: max(1, rerank_top_n)]


def _fallback_answer(
    question: str, reranked: list[dict], memory_window: list[str], model: str
) -> str:
    memory_note = ""
    if memory_window:
        memory_note = f"\n\nMemory ({len(memory_window)} turns): " + " | ".join(memory_window)
    citations = "\n".join(
        [f"- [{item['chunk_id']}] score={item['score']:.3f}" for item in reranked]
    )
    return (
        f"## Tra loi cho cau hoi\n\n{question}\n\n"
        f"Model: `{model}`\n\n"
        f"Ngu canh da truy xuat:\n{citations}{memory_note}"
    )


def _resolve_model(system_model_config: dict, profile_model_override: str | None) -> str:
    if profile_model_override and profile_model_override.strip():
        return profile_model_override.strip()
    model_name = system_model_config.get("model_name")
    if isinstance(model_name, str) and model_name.strip():
        return model_name.strip()
    return settings.openrouter_model


def build_assistant_answer(
    *,
    question: str,
    reranked: list[dict],
    memory_window: list[str],
    system_model_config: dict,
    profile_model_override: str | None,
) -> tuple[str, dict]:
    model = _resolve_model(
        system_model_config=system_model_config,
        profile_model_override=profile_model_override,
    )

    if not settings.openrouter_api_key:
        answer = _fallback_answer(question, reranked, memory_window, model)
        usage = {
            "prompt_tokens": max(1, len(question) // 4),
            "completion_tokens": max(1, len(answer) // 4),
            "total_tokens": max(1, (len(question) + len(answer)) // 4),
            "provider": "fallback",
            "model": model,
        }
        return answer, usage

    context_lines = [f"[{item['chunk_id']}] {item['content']}" for item in reranked]
    conversation_lines = [f"- {turn}" for turn in memory_window]
    prompt_context = "\n".join(context_lines) if context_lines else "(no retrieved context)"
    prompt_memory = "\n".join(conversation_lines) if conversation_lines else "(no recent memory)"

    payload = {
        "model": model,
        "messages": [
            {
                "role": "system",
                "content": (
                    "You are an assistant for RAG QA. Use the retrieved context first and answer in Markdown. "
                    "Prefer best-effort synthesis from available chunks; do not refuse unless there is truly no related evidence. "
                    "When uncertain, state assumptions briefly and cite chunk ids used."
                ),
            },
            {
                "role": "user",
                "content": (
                    f"Question:\n{question}\n\n"
                    f"Recent memory (last user turns):\n{prompt_memory}\n\n"
                    f"Retrieved context:\n{prompt_context}"
                ),
            },
        ],
        "temperature": system_model_config.get("params", {}).get("temperature", 0.2),
        "max_tokens": system_model_config.get("params", {}).get("max_tokens", 2048),
    }

    req = request.Request(
        url=settings.openrouter_chat_completions_url,
        data=json.dumps(payload).encode("utf-8"),
        method="POST",
        headers={
            "Authorization": f"Bearer {settings.openrouter_api_key}",
            "Content-Type": "application/json",
        },
    )

    try:
        with request.urlopen(req, timeout=settings.openrouter_timeout_seconds) as response:
            raw = response.read().decode("utf-8")
            response_json = json.loads(raw)
    except (error.HTTPError, error.URLError, TimeoutError, json.JSONDecodeError):
        answer = _fallback_answer(question, reranked, memory_window, model)
        usage = {
            "prompt_tokens": max(1, len(question) // 4),
            "completion_tokens": max(1, len(answer) // 4),
            "total_tokens": max(1, (len(question) + len(answer)) // 4),
            "provider": "fallback",
            "model": model,
        }
        return answer, usage

    choices = response_json.get("choices") or []
    answer = ""
    if choices:
        answer = choices[0].get("message", {}).get("content", "")

    if not answer:
        answer = _fallback_answer(question, reranked, memory_window, model)

    usage_obj = response_json.get("usage") or {}
    usage = {
        "prompt_tokens": usage_obj.get("prompt_tokens") or max(1, len(question) // 4),
        "completion_tokens": usage_obj.get("completion_tokens") or max(1, len(answer) // 4),
        "total_tokens": usage_obj.get("total_tokens") or max(1, (len(question) + len(answer)) // 4),
        "provider": "openrouter",
        "model": response_json.get("model") or model,
    }
    return answer, usage
