export default function AdminPage() {
  return (
    <main className="admin-page">
      <header className="glass">
        <h1>Admin Dashboard</h1>
        <p>User, documents, model configuration, and log monitoring.</p>
      </header>

      <section className="grid">
        <article className="card glass">
          <h2>Users</h2>
          <p>Manage user roles and status.</p>
        </article>
        <article className="card glass">
          <h2>Documents</h2>
          <p>Review and moderate system-wide documents.</p>
        </article>
        <article className="card glass">
          <h2>Model Config</h2>
          <p>Set default OpenRouter model for new requests.</p>
        </article>
        <article className="card glass">
          <h2>Logs</h2>
          <p>Real-time stream with filters and trace IDs.</p>
        </article>
      </section>
    </main>
  );
}
