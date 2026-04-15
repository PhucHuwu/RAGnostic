"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/common/button";
import { Input } from "@/components/common/input";
import { useAuth } from "@/components/providers/auth-provider";
import { useToast } from "@/components/providers/toast-provider";

export default function LoginPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const { login, isAuthenticated, user } = useAuth();
  const [username, setUsername] = useState("user");
  const [password, setPassword] = useState("123456");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated && user) {
      router.replace(user.role === "ADMIN" ? "/admin" : "/profiles");
    }
  }, [isAuthenticated, router, user]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const currentUser = await login(username, password);
      showToast({
        title: "Dang nhap thanh cong",
        description: `Xin chao ${currentUser.username}`,
        variant: "success"
      });
      router.push(currentUser.role === "ADMIN" ? "/admin" : "/profiles");
    } catch {
      const nextError = "Thong tin dang nhap khong hop le";
      setError(nextError);
      showToast({
        title: "Dang nhap that bai",
        description: nextError,
        variant: "error"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main id="main-content" className="auth-page">
      <section className="auth-card glass-panel">
        <p className="kicker">RAGnostic Access</p>
        <h1>Sign in to workspace</h1>
        <p>Use `admin/123456` for admin panel or `user/123456` for user workspace.</p>

        <form onSubmit={onSubmit} className="stack-form">
          <Input
            label="Username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            autoComplete="username"
            required
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
            error={error ?? undefined}
          />
          <Button type="submit" isLoading={isSubmitting}>
            Continue
          </Button>
        </form>

        <div className="auth-footnote">
          <span>Need overview first?</span>
          <Link href="/" className="inline-link">
            Back to landing page
          </Link>
        </div>
      </section>
    </main>
  );
}
