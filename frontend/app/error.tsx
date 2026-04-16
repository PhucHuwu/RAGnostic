"use client";

import { Error500 } from "../client/pages/ErrorPages";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  void error;
  void reset;
  return <Error500 />;
}
