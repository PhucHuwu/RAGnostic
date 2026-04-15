import Link from "next/link";

export default function ForbiddenPage() {
  return (
    <main className="center-screen">
      <section className="state-block glass-panel">
        <h1>403 - Forbidden</h1>
        <p>You do not have enough permissions to open this section.</p>
        <Link href="/" className="btn btn-primary">
          Return home
        </Link>
      </section>
    </main>
  );
}
