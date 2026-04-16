"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import UserLayout from "@/components/layouts/UserLayout";
import { ApiError, getProfile, updateProfile } from "@/lib/api";
import { ApiErrorState } from "@/components/common/api-state";
import { Skeleton } from "@/components/ui/skeleton";

type FormState = {
  name: string;
  topic: string;
  description: string;
  modelOverride: string;
  chunkStrategy: string;
  chunkSize: number;
  chunkOverlap: number;
  topK: number;
  rerankTopN: number;
  temperature: number;
  isActive: boolean;
};

const AppProfileDetails = () => {
  const params = useParams<{ profileId: string }>();
  const router = useRouter();
  const profileId = params.profileId;

  const [form, setForm] = useState<FormState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  const loadProfile = useCallback(
    async (isManualRetry = false) => {
      if (!profileId) {
        return;
      }

      if (isManualRetry) {
        setIsRetrying(true);
      } else {
        setIsLoading(true);
      }
      setError(null);
      try {
        const data = await getProfile(profileId);
        setForm({
          name: data.name,
          topic: data.topic,
          description: data.description ?? "",
          modelOverride: data.model_override ?? "",
          chunkStrategy: data.chunk_strategy,
          chunkSize: data.chunk_size,
          chunkOverlap: data.chunk_overlap,
          topK: data.top_k,
          rerankTopN: data.rerank_top_n,
          temperature: data.temperature,
          isActive: data.is_active,
        });
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError("Không thể tải chi tiết profile");
        }
      } finally {
        setIsLoading(false);
        setIsRetrying(false);
      }
    },
    [profileId],
  );

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const canSave = useMemo(() => {
    if (!form) {
      return false;
    }
    return form.name.trim().length > 0 && form.topic.trim().length > 0;
  }, [form]);

  const updateField = <K extends keyof FormState>(
    key: K,
    value: FormState[K],
  ) => {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!profileId || !form || !canSave) {
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await updateProfile(profileId, {
        name: form.name.trim(),
        topic: form.topic.trim(),
        description: form.description.trim() || undefined,
        model_override: form.modelOverride.trim() || undefined,
        chunk_strategy: form.chunkStrategy,
        chunk_size: form.chunkSize,
        chunk_overlap: form.chunkOverlap,
        top_k: form.topK,
        rerank_top_n: form.rerankTopN,
        temperature: form.temperature,
        is_active: form.isActive,
      });
      setSuccess("Cập nhật profile thành công");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Không thể cập nhật profile");
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <UserLayout>
        <div className="rounded-lg border border-border bg-card/50 p-6 space-y-4">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
      </UserLayout>
    );
  }

  if (!form) {
    return (
      <UserLayout>
        <ApiErrorState
          message={error ?? "Không có dữ liệu profile"}
          onRetry={() => void loadProfile(true)}
          isRetrying={isRetrying}
        />
      </UserLayout>
    );
  }

  return (
    <UserLayout>
      <div className="max-w-4xl space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground mb-2">
              Chi tiết Profile
            </h1>
            <p className="text-muted-foreground">
              Cập nhật cấu hình retrieval và hành vi trả lời của chatbot.
            </p>
          </div>
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-foreground hover:bg-muted/50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại
          </button>
        </div>

        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4">
            <p className="text-sm text-destructive font-medium">{error}</p>
          </div>
        )}

        {success && (
          <div className="rounded-lg border border-green-600/30 bg-green-100/20 p-4">
            <p className="text-sm text-green-700 font-medium">{success}</p>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-xl border border-border bg-card p-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-semibold mb-2 text-foreground"
              >
                Tên profile
              </label>
              <input
                id="name"
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                maxLength={120}
                className="w-full px-4 py-3 rounded-lg border border-border bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div>
              <label
                htmlFor="topic"
                className="block text-sm font-semibold mb-2 text-foreground"
              >
                Chủ đề
              </label>
              <input
                id="topic"
                value={form.topic}
                onChange={(e) => updateField("topic", e.target.value)}
                maxLength={240}
                className="w-full px-4 py-3 rounded-lg border border-border bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-semibold mb-2 text-foreground"
            >
              Mô tả
            </label>
            <textarea
              id="description"
              rows={4}
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
              maxLength={2000}
              className="w-full px-4 py-3 rounded-lg border border-border bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2 text-foreground">
                Chunk size
              </label>
              <input
                type="number"
                min={100}
                max={10000}
                value={form.chunkSize}
                onChange={(e) =>
                  updateField("chunkSize", Number(e.target.value))
                }
                className="w-full px-4 py-3 rounded-lg border border-border bg-input text-foreground"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-foreground">
                Chunk overlap
              </label>
              <input
                type="number"
                min={0}
                max={2000}
                value={form.chunkOverlap}
                onChange={(e) =>
                  updateField("chunkOverlap", Number(e.target.value))
                }
                className="w-full px-4 py-3 rounded-lg border border-border bg-input text-foreground"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-foreground">
                Top K
              </label>
              <input
                type="number"
                min={1}
                max={20}
                value={form.topK}
                onChange={(e) => updateField("topK", Number(e.target.value))}
                className="w-full px-4 py-3 rounded-lg border border-border bg-input text-foreground"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2 text-foreground">
                Rerank top N
              </label>
              <input
                type="number"
                min={1}
                max={20}
                value={form.rerankTopN}
                onChange={(e) =>
                  updateField("rerankTopN", Number(e.target.value))
                }
                className="w-full px-4 py-3 rounded-lg border border-border bg-input text-foreground"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-foreground">
                Temperature
              </label>
              <input
                type="number"
                step={0.1}
                min={0}
                max={2}
                value={form.temperature}
                onChange={(e) =>
                  updateField("temperature", Number(e.target.value))
                }
                className="w-full px-4 py-3 rounded-lg border border-border bg-input text-foreground"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-foreground">
                Chunk strategy
              </label>
              <input
                value={form.chunkStrategy}
                onChange={(e) => updateField("chunkStrategy", e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-border bg-input text-foreground"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2 text-foreground">
                Model override
              </label>
              <input
                value={form.modelOverride}
                onChange={(e) => updateField("modelOverride", e.target.value)}
                placeholder="vd: gpt-4o-mini"
                className="w-full px-4 py-3 rounded-lg border border-border bg-input text-foreground"
              />
            </div>
            <div className="flex items-end">
              <label className="inline-flex items-center gap-3 text-sm font-semibold text-foreground">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => updateField("isActive", e.target.checked)}
                  className="w-4 h-4"
                />
                Profile đang hoạt động
              </label>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!canSave || isSaving}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-white font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Lưu thay đổi
            </button>
          </div>
        </form>
      </div>
    </UserLayout>
  );
};

export default AppProfileDetails;
