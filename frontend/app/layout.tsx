import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Fira_Code, Fira_Sans } from "next/font/google";
import { SkipLink } from "@/components/common/skip-link";
import { RootProviders } from "@/components/providers/root-providers";
import "./globals.css";

const firaSans = Fira_Sans({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin", "vietnamese"],
  variable: "--font-sans"
});

const firaCode = Fira_Code({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-mono"
});

export const metadata: Metadata = {
  title: "RAGnostic",
  description: "Domain-agnostic RAG platform for profile-based AI assistants"
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="vi">
      <body className={`${firaSans.variable} ${firaCode.variable}`}>
        <SkipLink />
        <RootProviders>{children}</RootProviders>
      </body>
    </html>
  );
}
