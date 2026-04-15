"use client";

import Link from "next/link";

export default function GlobalError() {
  return (
    <main className="center-screen" id="main-content">
      <section className="state-block glass-panel state-error">
        <h1>500 - Server error</h1>
        <p>An internal error occurred while processing your request.</p>
        <Link href="/" className="btn btn-secondary">
          Back to home
        </Link>
      </section>
    </main>
  );
}
