"use client";

import { Error500 } from "../client/pages/ErrorPages";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  void error;
  void reset;

  return (
    <html lang="vi">
      <body>
        <Error500 />
      </body>
    </html>
  );
}
