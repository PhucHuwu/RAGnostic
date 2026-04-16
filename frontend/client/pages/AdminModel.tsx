"use client";

import { useCallback, useEffect, useState } from "react";
import { Save, AlertCircle, CheckCircle } from "lucide-react";
import AdminLayout from "@/components/layouts/AdminLayout";
import { ApiError, getModelConfig, updateModelConfig } from "@/lib/api";
import { ApiErrorState } from "@/components/common/api-state";
import { Skeleton } from "@/components/ui/skeleton";

interface ModelConfig {
  provider: string;
  modelName: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
}

const AdminModel = () => {
  const [config, setConfig] = useState<ModelConfig>({
    provider: "openrouter",
    modelName: "nvidia/nemotron-3-super-120b-a12b:free",
    temperature: 0.2,
    maxTokens: 2048,
    topP: 1,
    frequencyPenalty: 0,
    presencePenalty: 0,
  });

  const [changes, setChanges] = useState<Partial<ModelConfig>>({});
  const [showModal, setShowModal] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRetrying, setIsRetrying] = useState(false);

  const loadConfig = useCallback(async (isManualRetry = false) => {
    if (isManualRetry) {
      setIsRetrying(true);
    } else {
      setIsLoading(true);
    }
    setError(null);
    try {
      const response = await getModelConfig();
      const params = response.params ?? {};
      setConfig({
        provider: response.provider,
        modelName: response.model_name,
        temperature: Number(params.temperature ?? 0.2),
        maxTokens: Number(params.max_tokens ?? 2048),
        topP: Number(params.top_p ?? 1),
        frequencyPenalty: Number(params.frequency_penalty ?? 0),
        presencePenalty: Number(params.presence_penalty ?? 0),
      });
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

  const handleInputChange = (
    field: keyof ModelConfig,
    value: string | number,
  ) => {
    const newValue =
      typeof config[field] === "number" ? parseFloat(String(value)) : value;
    setChanges({
      ...changes,
      [field]: newValue,
    });
  };

  const handleSave = () => {
    setShowModal(true);
  };

  const handleConfirmSave = async () => {
    const nextConfig = {
      ...config,
      ...changes,
    };

    try {
      await updateModelConfig({
        provider: nextConfig.provider,
        model_name: nextConfig.modelName,
        params: {
          temperature: nextConfig.temperature,
          max_tokens: nextConfig.maxTokens,
          top_p: nextConfig.topP,
          frequency_penalty: nextConfig.frequencyPenalty,
          presence_penalty: nextConfig.presencePenalty,
        },
      });
      setConfig(nextConfig);
      setChanges({});
      setShowModal(false);
      setSaveSuccess(true);
      setError(null);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Không thể lưu cấu hình model");
      }
    }
  };

  const hasChanges = Object.keys(changes).length > 0;

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground mb-2">
            Cấu hình Model
          </h1>
          <p className="text-muted-foreground">
            Quản lý cấu hình AI model cho toàn bộ hệ thống
          </p>
        </div>

        {isLoading && (
          <div className="p-4 rounded-lg bg-card border border-border space-y-3">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-64" />
            <Skeleton className="h-40 w-full" />
          </div>
        )}

        {error && (
          <ApiErrorState
            message={error}
            onRetry={() => void loadConfig(true)}
            isRetrying={isRetrying}
          />
        )}

        {/* Success Message */}
        {saveSuccess && (
          <div className="p-4 rounded-lg bg-green-100/20 border border-green-500/30 flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-green-700 dark:text-green-400">
                Lưu thành công
              </p>
              <p className="text-sm text-green-600/70 dark:text-green-400/70">
                Cấu hình model đã được cập nhật thành công.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Current Model Info */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 rounded-xl border border-border bg-card p-6 space-y-6">
              <div>
                <h3 className="text-lg font-display font-bold mb-4">
                  Model hiện tại
                </h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                      Provider
                    </p>
                    <p className="text-lg font-semibold text-foreground capitalize">
                      {config.provider}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                      Model
                    </p>
                    <p className="text-lg font-semibold text-foreground">
                      {config.modelName}
                    </p>
                  </div>
                  <div className="pt-4 border-t border-border space-y-3">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">
                        Temperature
                      </p>
                      <p className="font-mono text-sm font-medium">
                        {config.temperature}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">
                        Max Tokens
                      </p>
                      <p className="font-mono text-sm font-medium">
                        {config.maxTokens}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-1">
                  Trạng thái
                </p>
                <p className="text-sm text-primary">Đang hoạt động ✓</p>
              </div>
            </div>
          </div>

          {/* Configuration Form */}
          <div className="lg:col-span-2">
            <div className="rounded-xl border border-border bg-card p-8 space-y-8">
              {/* Provider Selection */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-3">
                  AI Provider
                </label>
                <select
                  value={changes.provider ?? config.provider}
                  onChange={(e) =>
                    handleInputChange(
                      "provider",
                      e.target.value as ModelConfig["provider"],
                    )
                  }
                  className="w-full px-4 py-3 rounded-lg border border-border bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="openrouter">OpenRouter</option>
                  <option value="openai">OpenAI</option>
                  <option value="anthropic">Anthropic (Claude)</option>
                  <option value="google">Google (Gemini)</option>
                  <option value="local">Local Model</option>
                </select>
                <p className="text-xs text-muted-foreground mt-2">
                  Chọn provider AI mà bạn muốn sử dụng cho hệ thống.
                </p>
              </div>

              {/* Model Name */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-3">
                  Model Name
                </label>
                <input
                  type="text"
                  value={changes.modelName ?? config.modelName}
                  onChange={(e) =>
                    handleInputChange("modelName", e.target.value)
                  }
                  placeholder="e.g., gpt-4, claude-3-opus, gemini-pro"
                  className="w-full px-4 py-3 rounded-lg border border-border bg-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Tên model AI cụ thể từ provider đã chọn.
                </p>
              </div>

              {/* Temperature */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-3">
                  Temperature: {changes.temperature ?? config.temperature}
                </label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={changes.temperature ?? config.temperature}
                  onChange={(e) =>
                    handleInputChange("temperature", parseFloat(e.target.value))
                  }
                  className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Kiểm soát tính sáng tạo của mô hình (0 = xác định, 2 = sáng
                  tạo)
                </p>
              </div>

              {/* Max Tokens */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-3">
                  Max Tokens
                </label>
                <input
                  type="number"
                  value={changes.maxTokens ?? config.maxTokens}
                  onChange={(e) =>
                    handleInputChange("maxTokens", parseInt(e.target.value))
                  }
                  min="100"
                  max="8000"
                  className="w-full px-4 py-3 rounded-lg border border-border bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Độ dài tối đa của phản hồi (100-8000 tokens)
                </p>
              </div>

              {/* Top P */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-3">
                  Top P: {changes.topP ?? config.topP}
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={changes.topP ?? config.topP}
                  onChange={(e) =>
                    handleInputChange("topP", parseFloat(e.target.value))
                  }
                  className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Lấy mẫu hạt nhân (0.9 là tiêu chuẩn)
                </p>
              </div>

              {/* Frequency Penalty */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-3">
                  Frequency Penalty:{" "}
                  {changes.frequencyPenalty ?? config.frequencyPenalty}
                </label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={changes.frequencyPenalty ?? config.frequencyPenalty}
                  onChange={(e) =>
                    handleInputChange(
                      "frequencyPenalty",
                      parseFloat(e.target.value),
                    )
                  }
                  className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Giảm lặp lại các token thường xuyên (0 = không, 2 = mạnh)
                </p>
              </div>

              {/* Presence Penalty */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-3">
                  Presence Penalty:{" "}
                  {changes.presencePenalty ?? config.presencePenalty}
                </label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={changes.presencePenalty ?? config.presencePenalty}
                  onChange={(e) =>
                    handleInputChange(
                      "presencePenalty",
                      parseFloat(e.target.value),
                    )
                  }
                  className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Khuyến khích độ đa dạng chủ đề (0 = không, 2 = mạnh)
                </p>
              </div>

              {/* Warning */}
              <div className="p-4 rounded-lg bg-amber-100/20 border border-amber-500/30 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-amber-700 dark:text-amber-400 text-sm">
                    Thay đổi cấu hình sẽ ảnh hưởng đến tất cả phiên chat mới
                  </p>
                  <p className="text-xs text-amber-600/70 dark:text-amber-400/70 mt-1">
                    Các phiên hiện tại sẽ tiếp tục sử dụng cấu hình cũ.
                  </p>
                </div>
              </div>

              {/* Save Button */}
              <button
                onClick={handleSave}
                disabled={!hasChanges}
                className="w-full px-6 py-3 rounded-lg font-semibold text-white bg-primary hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Save className="w-5 h-5" />
                Lưu cấu hình
              </button>
            </div>
          </div>
        </div>

        {/* Confirmation Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-card rounded-xl border border-border max-w-md w-full p-6 animate-fade-in">
              <h3 className="text-xl font-display font-bold mb-2 text-foreground">
                Xác nhận thay đổi
              </h3>
              <p className="text-muted-foreground mb-6">
                Bạn sắp cập nhật cấu hình model. Điều này sẽ ảnh hưởng đến tất
                cả phiên chat mới. Bạn có chắc chắn muốn tiếp tục?
              </p>
              <div className="space-y-2 mb-6 p-4 rounded-lg bg-muted/30">
                {Object.entries(changes).map(([key, value]) => (
                  <div key={key} className="text-sm">
                    <span className="text-muted-foreground">{key}: </span>
                    <span className="font-mono font-medium text-foreground">
                      {String(value)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 rounded-lg border border-border text-foreground hover:bg-muted/50 font-semibold transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={handleConfirmSave}
                  className="flex-1 px-4 py-2 rounded-lg bg-primary text-white font-semibold hover:bg-primary/90 transition-colors"
                >
                  Xác nhận
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminModel;
