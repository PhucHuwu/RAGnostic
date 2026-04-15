import Link from "next/link";

export default function NotFoundPage() {
  return (
    <main className="center-screen" id="main-content">
      <section className="state-block glass-panel">
        <h1>404 - Page not found</h1>
        <p>The page you requested does not exist or has moved.</p>
        <Link href="/" className="btn btn-primary">
          Return home
        </Link>
      </section>
    </main>
  );
}
