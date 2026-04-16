import type { Metadata } from "next";
import type { ReactNode } from "react";
import Providers from "../client/providers";
import "../client/global.css";

export const metadata: Metadata = {
  title: "RAGnostic",
  description: "Multi-tenant, domain-agnostic RAG platform",
};

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="vi">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
