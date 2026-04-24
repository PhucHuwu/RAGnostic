"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ApiError, login } from "@/lib/api";
import { setAuthSession } from "@/lib/auth";

import {
  Eye,
  EyeOff,
  ArrowRight,
  Brain,
  FileText,
  Shield,
  Zap,
  Target,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const Login = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (!username || !password) {
      setError("Vui lòng nhập tên đăng nhập và mật khẩu");
      setIsLoading(false);
      return;
    }

    try {
      const response = await login(username, password);
      setAuthSession({
        accessToken: response.access_token,
        refreshToken: response.refresh_token,
        user: {
          id: response.user.id,
          username: response.user.username,
          role: response.user.role,
        },
      });
      const fallbackPath =
        response.user.role === "ADMIN" ? "/admin/users" : "/app/profiles/new";
      const requestedPath = searchParams.get("next");
      const canUseRequestedPath =
        typeof requestedPath === "string" &&
        requestedPath.startsWith("/") &&
        !requestedPath.startsWith("/admin") === (response.user.role !== "ADMIN");

      router.push(canUseRequestedPath ? requestedPath : fallbackPath);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Không thể đăng nhập. Vui lòng thử lại.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-background">
      {/* Left Side - Login Form */}
      <div className="flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="w-full max-w-md animate-fade-in">
          {/* Logo */}
          <Link href="/" className="inline-flex items-center gap-2 mb-12">
            <div className="w-10 h-10 rounded-lg bg-gradient-ai flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold font-display">RAGnostic</span>
          </Link>

          <div className="mb-8">
            <h1 className="text-3xl font-display font-bold mb-2">Đăng nhập</h1>
            <p className="text-muted-foreground">
              Nhập thông tin của bạn để tiếp tục
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive/30">
              <p className="text-sm font-medium text-destructive">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username Field */}
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium mb-2"
              >
                Tên đăng nhập
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="nhập tên đăng nhập"
                disabled={isLoading}
                className="w-full px-4 py-3 rounded-lg border border-border bg-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium mb-2"
              >
                Mật khẩu
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="nhập mật khẩu"
                  disabled={isLoading}
                  className="w-full px-4 py-3 rounded-lg border border-border bg-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all pr-12 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember & Forgot */}
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-border bg-input"
                  disabled={isLoading}
                />
                <span className="text-muted-foreground">Ghi nhớ tôi</span>
              </label>
              <a
                href="mailto:support@ragnostic.io?subject=Yeu%20cau%20ho%20tro%20khoi%20phuc%20tai%20khoan"
                className="text-primary hover:text-primary/80 transition-colors"
              >
                Quên mật khẩu?
              </a>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-lg font-semibold text-white bg-primary hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                  <span>Đang đăng nhập...</span>
                </>
              ) : (
                <>
                  <span>Đăng nhập</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Sign Up Link */}
          <div className="mt-8 text-center text-sm">
            <span className="text-muted-foreground">
              Bạn chưa có tài khoản?{" "}
            </span>
            <Link
              href="/register"
              className="font-medium text-primary hover:text-primary/80 transition-colors"
            >
              Đăng ký ngay
            </Link>
          </div>

          {/* Demo Credentials */}
          <div className="mt-8 p-4 rounded-lg bg-muted/30 border border-border/50">
            <p className="text-xs font-medium text-muted-foreground mb-2">
              Thông tin demo:
            </p>
            <div className="space-y-1 text-xs text-muted-foreground">
              <p>
                <span className="font-mono">user</span> /{" "}
                <span className="font-mono">password</span>
              </p>
              <p>
                <span className="font-mono">admin</span> /{" "}
                <span className="font-mono">password</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Info Panel (Desktop only) */}
      <div className="hidden lg:flex flex-col items-center justify-center px-8 py-12 bg-card/50 relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-20 right-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 left-20 w-80 h-80 bg-secondary/10 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-md text-center animate-slide-up">
          <div className="mb-8">
            <div className="w-20 h-20 rounded-2xl bg-gradient-ai flex items-center justify-center mx-auto mb-6">
              <Brain className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-display font-bold mb-4">Chào mừng</h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Khám phá sức mạnh của RAG - Retrieval-Augmented Generation. Hãy
              xây dựng các ứng dụng AI thông minh với dữ liệu của bạn.
            </p>
          </div>

          <div className="space-y-4 mt-12">
            <Feature icon={FileText} text="Xử lý tài liệu tự động" />
            <Feature icon={Shield} text="Bảo mật dữ liệu cao" />
            <Feature icon={Zap} text="Truy vấn siêu nhanh" />
            <Feature icon={Target} text="Kết quả chính xác" />
          </div>

          <div className="mt-12 pt-8 border-t border-border">
            <p className="text-sm text-muted-foreground mb-4">
              Bạn không có tài khoản?
            </p>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 font-semibold text-primary hover:text-primary/80 transition-colors"
            >
              Yêu cầu truy cập
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

interface FeatureProps {
  icon: LucideIcon;
  text: string;
}

const Feature = ({ icon: Icon, text }: FeatureProps) => (
  <div className="flex items-center gap-3 p-4 rounded-lg bg-background/50 border border-border/30 hover:border-secondary/30 transition-colors">
    <Icon className="w-6 h-6 text-primary" />
    <span className="font-medium">{text}</span>
  </div>
);

export default Login;
