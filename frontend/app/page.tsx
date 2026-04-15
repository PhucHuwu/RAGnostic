import Link from "next/link";
import { DatabaseIcon, PulseIcon, ShieldIcon, SparkIcon } from "@/components/common/icons";

export default function HomePage() {
  const features = [
    {
      title: "Profile-isolated knowledge",
      description: "Each chatbot profile owns its own documents, sessions, and retrieval settings.",
      icon: <DatabaseIcon />
    },
    {
      title: "BM25 + semantic retrieval",
      description:
        "Hybrid ranking keeps answers grounded and precise across long enterprise documents.",
      icon: <SparkIcon />
    },
    {
      title: "Admin-grade observability",
      description:
        "Track model config, user permissions, and real-time logs from a single control room.",
      icon: <PulseIcon />
    },
    {
      title: "Role-based governance",
      description:
        "Dedicated User and Admin experiences with protected workflows and auditable actions.",
      icon: <ShieldIcon />
    }
  ];

  return (
    <main id="main-content" className="landing-page">
      <header className="floating-nav glass-panel">
        <Link href="/" className="brand">
          RAGnostic
        </Link>
        <nav className="nav-actions" aria-label="Primary">
          <Link href="/profiles" className="nav-link">
            Profiles
          </Link>
          <Link href="/documents" className="nav-link">
            Documents
          </Link>
          <Link href="/chat" className="nav-link">
            Chat
          </Link>
          <Link href="/admin" className="btn btn-ghost">
            Admin
          </Link>
          <Link href="/auth/login" className="btn btn-primary">
            Sign In
          </Link>
        </nav>
      </header>

      <section className="hero-shell">
        <article className="hero-copy glass-panel">
          <p className="kicker">AI Knowledge Operating System</p>
          <h1>Build profile-based assistants without domain lock-in</h1>
          <p className="subtitle">
            RAGnostic helps teams ingest documents, isolate profile knowledge, and answer with
            markdown-ready responses backed by retrieval evidence.
          </p>
          <div className="hero-cta">
            <Link href="/chat" className="btn btn-primary">
              Start Chat Workspace
            </Link>
            <Link href="/profiles" className="btn btn-secondary">
              Create Profile
            </Link>
          </div>
        </article>
        <article className="hero-stats glass-panel" aria-label="System snapshot">
          <h2>System Snapshot</h2>
          <dl>
            <div>
              <dt>Memory window</dt>
              <dd>10 user turns</dd>
            </div>
            <div>
              <dt>Supported files</dt>
              <dd>PDF, DOCX, TXT</dd>
            </div>
            <div>
              <dt>Default model</dt>
              <dd>Nemotron via OpenRouter</dd>
            </div>
            <div>
              <dt>Logs stream</dt>
              <dd>SSE / WebSocket</dd>
            </div>
          </dl>
        </article>
      </section>

      <section className="feature-section">
        <h2>Core Capabilities</h2>
        <div className="feature-grid">
          {features.map((feature) => (
            <article key={feature.title} className="feature-card glass-panel">
              <span className="feature-icon">{feature.icon}</span>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="journey-section glass-panel">
        <h2>MVP User Journey</h2>
        <ol>
          <li>Sign in and create a chatbot profile with chunk and retrieval settings.</li>
          <li>Upload knowledge files and track ingest status from uploaded to ready.</li>
          <li>Start a chat session, send prompts, and review markdown answers.</li>
          <li>Admin monitors users, documents, model config, and real-time logs.</li>
        </ol>
        <div className="hero-cta">
          <Link href="/auth/login" className="btn btn-primary">
            Try Demo Login
          </Link>
          <Link href="/admin" className="btn btn-ghost">
            Open Control Room
          </Link>
        </div>
      </section>
    </main>
  );
}
