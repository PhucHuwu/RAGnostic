"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Save, Trash2 } from "lucide-react";
import AdminLayout from "@/components/layouts/AdminLayout";
import { ApiError, getModelConfig, updateModelConfig, type SystemModelEntry } from "@/lib/api";
import { ApiErrorState } from "@/components/common/api-state";
import { Skeleton } from "@/components/ui/skeleton";

const SYSTEM_DEFAULT_MODEL_NAME = "nvidia/nemotron-3-super-120b-a12b:free";

type ModelRow = {
  id: string;
  model_name: string;
  temperature: number;
  max_tokens: number;
  top_p: number;
  frequency_penalty: number;
  presence_penalty: number;
};

function toRow(entry: SystemModelEntry, idx: number): ModelRow {
  const params = entry.params ?? {};
  return {
    id: `${entry.model_name}-${idx}`,
    model_name: entry.model_name,
    temperature: Number(params.temperature ?? 0.2),
    max_tokens: Number(params.max_tokens ?? 2048),
    top_p: Number(params.top_p ?? 1),
    frequency_penalty: Number(params.frequency_penalty ?? 0),
    presence_penalty: Number(params.presence_penalty ?? 0),
  };
}

const AdminModel = () => {
  const [rows, setRows] = useState<ModelRow[]>([]);
  const [baselineRows, setBaselineRows] = useState<ModelRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const loadConfig = useCallback(async (isManualRetry = false) => {
    if (isManualRetry) {
      setIsRetrying(true);
    } else {
      setIsLoading(true);
    }
    setError(null);
    try {
      const response = await getModelConfig();
      const mapped = response.models.map(toRow);
      const nextRows =
        mapped.length > 0 ? mapped : [toRow({ model_name: "", params: {} }, 0)];
      setRows(nextRows);
      setBaselineRows(nextRows);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Không thể tải cấu hình model");
      }
    } finally {
      setIsLoading(false);
      setIsRetrying(false);
    }
  }, []);

  useEffect(() => {
    void loadConfig();
  }, [loadConfig]);

  const fingerprintRows = (items: ModelRow[]) =>
    JSON.stringify(
      items.map((row) => ({
        model_name: row.model_name.trim(),
        temperature: Number(row.temperature),
        max_tokens: Number(row.max_tokens),
        top_p: Number(row.top_p),
        frequency_penalty: Number(row.frequency_penalty),
        presence_penalty: Number(row.presence_penalty),
      })),
    );

  const hasChanges = useMemo(
    () => fingerprintRows(rows) !== fingerprintRows(baselineRows),
    [rows, baselineRows],
  );

  const canSave = useMemo(
    () =>
      hasChanges && rows.length > 0 && rows.every((row) => row.model_name.trim().length > 0),
    [rows, hasChanges],
  );

  const updateRow = (id: string, patch: Partial<ModelRow>) => {
    setRows((prev) => prev.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  };

  const addRow = () => {
    setRows((prev) => [
      ...prev,
      {
        id: `new-${Date.now()}`,
        model_name: "",
        temperature: 0.2,
        max_tokens: 2048,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
      },
    ]);
  };

  const removeRow = (id: string) => {
    setRows((prev) => (prev.length > 1 ? prev.filter((row) => row.id !== id) : prev));
  };

  const handleSave = async () => {
    if (!canSave || isSaving) {
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      const models = rows.map((row) => ({
        model_name: row.model_name.trim(),
        params: {
          temperature: row.temperature,
          max_tokens: row.max_tokens,
          top_p: row.top_p,
          frequency_penalty: row.frequency_penalty,
          presence_penalty: row.presence_penalty,
        },
      }));
      await updateModelConfig({ models });
      const nextRows = rows.map((row) => ({ ...row }));
      setBaselineRows(nextRows);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
      setRows(nextRows);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Không thể lưu cấu hình model");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (!hasChanges || isSaving) {
      return;
    }
    setRows(baselineRows.map((row) => ({ ...row })));
    setError(null);
  };

  return (
    <AdminLayout>
      <div className="space-y-5 sm:space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground mb-2">Cấu hình Model</h1>
          <p className="text-muted-foreground">
            Quản lý danh sách model OpenRouter và tham số mặc định cho từng model.
          </p>
        </div>

        {isLoading && (
          <div className="rounded-xl border border-border bg-card p-6 space-y-3">
            <Skeleton className="h-5 w-52" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        )}

        {error && (
          <ApiErrorState
            message={error}
            onRetry={() => void loadConfig(true)}
            isRetrying={isRetrying}
          />
        )}

        {saveSuccess && (
          <div className="rounded-lg border border-green-500/30 bg-green-100/20 px-4 py-3 text-sm text-green-700">
            Đã lưu danh sách model thành công.
          </div>
        )}

        {!isLoading && (
          <div className="rounded-xl border border-border bg-card p-3 sm:p-6 space-y-4">
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 sm:p-4 space-y-2">
              <p className="text-sm font-semibold text-foreground">Hướng dẫn tham số model</p>
              <ul className="text-xs sm:text-sm text-muted-foreground space-y-1">
                <li>- `temperature`: thấp thì ổn định hơn, cao thì sáng tạo hơn (0.0 - 2.0).</li>
                <li>- `max_tokens`: giới hạn độ dài phản hồi cho mỗi lần trả lời.</li>
                <li>- `top_p`: lọc xác suất đầu ra, thường giữ gần 1.0 để tự nhiên.</li>
                <li>- `frequency_penalty`: giảm lặp từ/cụm từ đã dùng nhiều lần.</li>
                <li>- `presence_penalty`: khuyến khích mở rộng sang ý/chủ đề mới.</li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <p className="text-sm text-muted-foreground">Provider: OpenRouter</p>
              <button
                type="button"
                onClick={addRow}
                className="inline-flex w-full sm:w-auto items-center justify-center gap-2 px-3 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted/40 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Thêm model
              </button>
            </div>

            <div className="space-y-3">
              {rows.map((row) => {
                const isSystemDefaultModel =
                  row.model_name.trim() === SYSTEM_DEFAULT_MODEL_NAME;

                return (
                <div key={row.id} className="rounded-lg border border-border p-3 sm:p-4 space-y-3">
                  <div>
                    <div className="mb-1 flex items-center gap-2">
                      <label className="block text-xs font-medium text-muted-foreground">Model name</label>
                      {isSystemDefaultModel && (
                        <span className="inline-flex items-center rounded-md border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                          Model mặc định
                        </span>
                      )}
                    </div>
                    <input
                      value={row.model_name}
                      onChange={(e) => updateRow(row.id, { model_name: e.target.value })}
                      placeholder="vd: openai/gpt-4.1-mini"
                      disabled={isSystemDefaultModel}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-input text-foreground text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 items-end">
                    <div className="lg:col-span-1">
                      <label className="block text-xs font-medium text-muted-foreground mb-1">Temperature</label>
                      <input
                        type="number"
                        step={0.1}
                        min={0}
                        max={2}
                        value={row.temperature}
                        onChange={(e) => updateRow(row.id, { temperature: Number(e.target.value) })}
                        className="w-full h-10 px-3 py-2 rounded-lg border border-border bg-input text-foreground text-sm"
                      />
                    </div>
                    <div className="lg:col-span-1">
                      <label className="block text-xs font-medium text-muted-foreground mb-1">Max tokens</label>
                      <input
                        type="number"
                        min={64}
                        max={8192}
                        value={row.max_tokens}
                        onChange={(e) => updateRow(row.id, { max_tokens: Number(e.target.value) })}
                        className="w-full h-10 px-3 py-2 rounded-lg border border-border bg-input text-foreground text-sm"
                      />
                    </div>
                    <div className="lg:col-span-1">
                      <label className="block text-xs font-medium text-muted-foreground mb-1">Top P</label>
                      <input
                        type="number"
                        step={0.05}
                        min={0}
                        max={1}
                        value={row.top_p}
                        onChange={(e) => updateRow(row.id, { top_p: Number(e.target.value) })}
                        className="w-full h-10 px-3 py-2 rounded-lg border border-border bg-input text-foreground text-sm"
                      />
                    </div>
                    <div className="lg:col-span-1">
                      <label className="block text-xs font-medium text-muted-foreground mb-1">Freq</label>
                      <input
                        type="number"
                        step={0.1}
                        min={0}
                        max={2}
                        value={row.frequency_penalty}
                        onChange={(e) => updateRow(row.id, { frequency_penalty: Number(e.target.value) })}
                        className="w-full h-10 px-3 py-2 rounded-lg border border-border bg-input text-foreground text-sm"
                      />
                    </div>
                    <div className="lg:col-span-1">
                      <label className="block text-xs font-medium text-muted-foreground mb-1">Presence</label>
                      <input
                        type="number"
                        step={0.1}
                        min={0}
                        max={2}
                        value={row.presence_penalty}
                        onChange={(e) => updateRow(row.id, { presence_penalty: Number(e.target.value) })}
                        className="w-full h-10 px-3 py-2 rounded-lg border border-border bg-input text-foreground text-sm"
                      />
                    </div>
                    <div className="lg:col-span-1 flex items-end">
                      <button
                        type="button"
                        onClick={() => removeRow(row.id)}
                        disabled={rows.length <= 1 || isSystemDefaultModel}
                        title={isSystemDefaultModel ? "Model mặc định hệ thống không thể xóa" : "Xóa model"}
                        className="w-full sm:w-auto h-10 px-3 rounded-lg border border-border hover:bg-destructive/10 transition-colors disabled:opacity-40"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
                );
              })}
            </div>

            <div className="flex flex-row gap-2">
              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={!canSave || isSaving}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 rounded-lg font-semibold text-white bg-primary hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {isSaving ? "Đang lưu..." : "Lưu cấu hình"}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={!hasChanges || isSaving}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 rounded-lg font-semibold border border-border text-foreground hover:bg-muted/40 transition-colors disabled:opacity-50"
              >
                Hủy
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminModel;
