from __future__ import annotations

from app.core.config import settings


def mock_retrieve_context(user_message: str, top_k: int) -> list[dict]:
    return [
        {
            "chunk_id": f"chunk_{idx}",
            "score": 1.0 / (idx + 1),
            "content": f"Retrieved knowledge candidate {idx + 1} for: {user_message}",
        }
        for idx in range(top_k)
    ]


def mock_bm25_rerank(candidates: list[dict], rerank_top_n: int) -> list[dict]:
    return candidates[:rerank_top_n]


def build_assistant_answer(question: str, reranked: list[dict], memory_window: list[str]) -> str:
    memory_note = ""
    if memory_window:
        memory_note = f"\n\nMemory ({len(memory_window)} turns): " + " | ".join(memory_window)
    citations = "\n".join(
        [f"- [{item['chunk_id']}] score={item['score']:.3f}" for item in reranked]
    )
    return (
        f"## Tra loi cho cau hoi\n\n{question}\n\n"
        f"Model: `{settings.openrouter_model}`\n\n"
        f"Ngu canh da truy xuat:\n{citations}{memory_note}"
    )
