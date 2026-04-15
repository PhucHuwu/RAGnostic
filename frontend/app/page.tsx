import Link from "next/link";

export default function HomePage() {
  return (
    <main className="landing">
      <section className="hero">
        <p className="kicker">RAGnostic Platform</p>
        <h1>Build profile-based knowledge assistants without domain lock-in</h1>
        <p className="subtitle">
          Multi-tenant RAG with document ingest pipeline, profile isolation, BM25 re-ranking,
          and admin observability.
        </p>
        <div className="actions">
          <Link href="/chat" className="btn primary">
            Open Chat UI
          </Link>
          <Link href="/admin" className="btn ghost">
            Open Admin UI
          </Link>
        </div>
      </section>
    </main>
  );
}
