"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Plus,
  MessageSquare,
  FileText,
  Edit2,
  Trash2,
  Calendar,
  Zap,
} from "lucide-react";
import UserLayout from "@/components/layouts/UserLayout";
import {
  ApiErrorState,
  StatCardsSkeleton,
} from "@/components/common/api-state";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ApiError,
  deleteProfile,
  listChatSessions,
  listDocuments,
  listProfiles,
  type ProfileResponse,
} from "@/lib/api";

interface Profile {
  id: string;
  name: string;
  topic: string;
  description: string;
  documentsCount: number;
  sessionsCount: number;
  createdAt: string;
  status: "ready" | "processing";
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("vi-VN");
}

async function hydrateProfileStats(profiles: ProfileResponse[]) {
  const mapped = await Promise.all(
    profiles.map(async (profile) => {
      const [documents, sessions] = await Promise.all([
        listDocuments(profile.id).catch(() => []),
        listChatSessions(profile.id).catch(() => []),
      ]);
      return {
        id: profile.id,
        name: profile.name,
        topic: profile.topic,
        description: profile.description ?? "Chưa có mô tả",
        documentsCount: documents.length,
        sessionsCount: sessions.length,
        createdAt: profile.created_at,
        status: profile.is_active
          ? ("ready" as const)
          : ("processing" as const),
      };
    }),
  );

  return mapped;
}

const AppProfiles = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  const loadProfiles = useCallback(async (isManualRetry = false) => {
    if (isManualRetry) {
      setIsRetrying(true);
    } else {
      setIsLoading(true);
    }
    setError(null);
    try {
      const data = await listProfiles();
      const hydrated = await hydrateProfileStats(data);
      setProfiles(hydrated);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Không thể tải danh sách profile");
      }
    } finally {
      setIsLoading(false);
      setIsRetrying(false);
    }
  }, []);

  useEffect(() => {
    void loadProfiles();
  }, [loadProfiles]);

  const handleDelete = async (id: string) => {
    try {
      await deleteProfile(id);
      setProfiles((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Không thể xóa profile");
      }
    }
  };

  const isEmpty = profiles.length === 0;
  const totals = useMemo(
    () => ({
      documents: profiles.reduce((sum, p) => sum + p.documentsCount, 0),
      sessions: profiles.reduce((sum, p) => sum + p.sessionsCount, 0),
    }),
    [profiles],
  );

  return (
    <UserLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground mb-2">
              Danh sách Profile
            </h1>
            <p className="text-muted-foreground">
              Quản lý tất cả các profile chatbot của bạn
            </p>
          </div>
          <Link
            href="/app/profiles/new"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-white bg-primary hover:bg-primary/90 transition-all hover:shadow-lg"
          >
            <Plus className="w-5 h-5" />
            Tạo Profile
          </Link>
        </div>

        {/* Empty State */}
        {isLoading ? (
          <div className="space-y-6">
            <StatCardsSkeleton />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-border bg-card p-6 space-y-3"
                >
                  <Skeleton className="h-5 w-36" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-4/5" />
                </div>
              ))}
            </div>
          </div>
        ) : error ? (
          <ApiErrorState
            message={error}
            onRetry={() => void loadProfiles(true)}
            isRetrying={isRetrying}
          />
        ) : isEmpty ? (
          <div className="flex items-center justify-center min-h-96 rounded-xl border-2 border-dashed border-border bg-card/50 p-8">
            <div className="text-center max-w-md">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <Zap className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-display font-bold mb-2">
                Chưa có profile nào
              </h3>
              <p className="text-muted-foreground mb-6">
                Bắt đầu bằng cách tạo profile đầu tiên để khởi động một chatbot
                mới.
              </p>
              <Link
                href="/app/profiles/new"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-white bg-primary hover:bg-primary/90 transition-all"
              >
                <Plus className="w-5 h-5" />
                Tạo Profile đầu tiên
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg border border-border bg-card/50">
                <p className="text-sm text-muted-foreground mb-1">
                  Tổng Profiles
                </p>
                <p className="text-3xl font-display font-bold">
                  {profiles.length}
                </p>
              </div>
              <div className="p-4 rounded-lg border border-border bg-card/50">
                <p className="text-sm text-muted-foreground mb-1">Tài liệu</p>
                <p className="text-3xl font-display font-bold">
                  {totals.documents}
                </p>
              </div>
              <div className="p-4 rounded-lg border border-border bg-card/50">
                <p className="text-sm text-muted-foreground mb-1">Phiên Chat</p>
                <p className="text-3xl font-display font-bold">
                  {totals.sessions}
                </p>
              </div>
            </div>

            {/* Profiles Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {profiles.map((profile) => (
                <div
                  key={profile.id}
                  className="group rounded-xl border border-border bg-card hover:border-secondary/50 transition-all hover:shadow-lg overflow-hidden"
                >
                  {/* Header */}
                  <div className="p-6 border-b border-border bg-card/50">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-display font-bold text-foreground mb-1">
                          {profile.name}
                        </h3>
                        <p className="text-sm font-medium text-secondary">
                          {profile.topic}
                        </p>
                      </div>
                      <div
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          profile.status === "ready"
                            ? "bg-green-100/20 text-green-700 dark:text-green-400"
                            : "bg-amber-100/20 text-amber-700 dark:text-amber-400"
                        }`}
                      >
                        {profile.status === "ready" ? "Sẵn sàng" : "Đang xử lý"}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {profile.description}
                    </p>
                  </div>

                  {/* Metadata */}
                  <div className="px-6 py-4 space-y-2 border-b border-border">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <FileText className="w-4 h-4" />
                      <span>{profile.documentsCount} tài liệu</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MessageSquare className="w-4 h-4" />
                      <span>{profile.sessionsCount} phiên chat</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(profile.createdAt)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="p-4 flex gap-2">
                    <Link
                      href={`/app/profiles/${profile.id}/chat`}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Chat
                    </Link>
                    <Link
                      href={`/app/profiles/${profile.id}/chat?panel=documents`}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-border text-foreground text-sm font-semibold hover:bg-muted/50 transition-colors"
                    >
                      <FileText className="w-4 h-4" />
                      Tài liệu
                    </Link>
                    <Link
                      href={`/app/profiles/${profile.id}/chat`}
                      className="p-2 rounded-lg border border-border text-foreground hover:bg-muted/50 transition-colors"
                      title="Mở chat"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => handleDelete(profile.id)}
                      className="p-2 rounded-lg border border-border text-destructive hover:bg-destructive/10 transition-colors"
                      title="Xóa"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </UserLayout>
  );
};

export default AppProfiles;
