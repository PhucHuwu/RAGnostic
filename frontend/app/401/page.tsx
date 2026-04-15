import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <main className="center-screen">
      <section className="state-block glass-panel">
        <h1>401 - Unauthorized</h1>
        <p>Your session is not valid for this request.</p>
        <Link href="/auth/login" className="btn btn-primary">
          Go to login
        </Link>
      </section>
    </main>
  );
}
