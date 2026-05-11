"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Pause, Play, Trash2, SlidersHorizontal } from "lucide-react";
import AdminLayout from "@/components/layouts/AdminLayout";
import { ApiError, searchLogs } from "@/lib/api";
import { ApiErrorState, TableSkeleton } from "@/components/common/api-state";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface LogEntry {
  id: string;
  timestamp: string;
  level: "INFO" | "WARN" | "ERROR" | "DEBUG";
  service: string;
  message: string;
  requestId?: string;
  userId?: string;
  sessionId?: string;
}

const AdminLogs = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const [isPaused, setIsPaused] = useState(false);
  const [levelFilter, setLevelFilter] = useState<
    "" | "INFO" | "WARN" | "ERROR" | "DEBUG"
  >("");
  const [quickSearch, setQuickSearch] = useState("");
  const [quickSearchType, setQuickSearchType] = useState<
    "requestId" | "userId" | "sessionId"
  >("requestId");
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRetrying, setIsRetrying] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (!isPaused) {
      scrollToBottom();
    }
  }, [logs, isPaused]);

  const loadLogs = useCallback(
    async (isManualRetry = false) => {
      if (isPaused) {
        return;
      }

      if (isManualRetry) {
        setIsRetrying(true);
      } else {
        setIsLoading(true);
      }
      setError(null);
      try {
        const response = await searchLogs({
          level: levelFilter || undefined,
          request_id:
            quickSearchType === "requestId"
              ? quickSearch || undefined
              : undefined,
          user_id:
            quickSearchType === "userId" ? quickSearch || undefined : undefined,
          session_id:
            quickSearchType === "sessionId"
              ? quickSearch || undefined
              : undefined,
        });

        setLogs(
          response.items.map((item, index) => ({
            id: `${item.timestamp}-${index}`,
            timestamp: new Date(item.timestamp).toLocaleString("vi-VN"),
            level:
              item.level === "WARNING"
                ? "WARN"
                : (item.level as LogEntry["level"]),
            service: item.service,
            message: item.message,
            requestId: item.request_id ?? undefined,
            userId: item.user_id ?? undefined,
            sessionId: item.session_id ?? undefined,
          })),
        );
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError("Không thể tải log hệ thống");
        }
      } finally {
        setIsLoading(false);
        setIsRetrying(false);
      }
    },
    [
      isPaused,
      levelFilter,
      quickSearch,
      quickSearchType,
    ],
  );

  useEffect(() => {
    void loadLogs();
  }, [loadLogs]);


  const filteredLogs = logs.filter((log) => {
    const matchesLevel = !levelFilter || log.level === levelFilter;
    const matchesQuickSearch =
      !quickSearch ||
      (quickSearchType === "requestId" &&
        log.requestId?.includes(quickSearch)) ||
      (quickSearchType === "userId" && log.userId?.includes(quickSearch)) ||
      (quickSearchType === "sessionId" && log.sessionId?.includes(quickSearch));

    return (
      matchesLevel && matchesQuickSearch
    );
  });

  const missingRequestIdCount = useMemo(
    () => logs.filter((log) => !log.requestId).length,
    [logs],
  );

  const getLogColor = (level: LogEntry["level"]) => {
    switch (level) {
      case "INFO":
        return "text-blue-500";
      case "WARN":
        return "text-amber-500";
      case "ERROR":
        return "text-red-500";
      case "DEBUG":
        return "text-cyan-500";
    }
  };

  const getLogBgColor = (level: LogEntry["level"]) => {
    switch (level) {
      case "INFO":
        return "hover:bg-blue-500/5";
      case "WARN":
        return "hover:bg-amber-500/5";
      case "ERROR":
        return "hover:bg-red-500/5";
      case "DEBUG":
        return "hover:bg-cyan-500/5";
    }
  };

  return (
    <AdminLayout>
      <div className="h-[calc(100dvh-64px-2rem)] sm:h-[calc(100dvh-64px-3rem)] lg:h-[calc(100dvh-64px-4rem)] min-h-0 flex flex-col gap-6 overflow-hidden">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground mb-2">
            Nhật ký Hệ thống
          </h1>
          <p className="text-muted-foreground">
            Giám sát các sự kiện và lỗi realtime từ hệ thống
          </p>
        </div>

        {/* Filters */}
        {isLoading && <TableSkeleton />}

        {error && (
          <ApiErrorState
            message={error}
            onRetry={() => void loadLogs(true)}
            isRetrying={isRetrying}
          />
        )}

        <div className="space-y-4 shrink-0">
          <div className="md:hidden">
            <button
              type="button"
              onClick={() => setIsMobileFiltersOpen((prev) => !prev)}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-border bg-card text-sm font-semibold text-foreground hover:bg-muted/40 transition-colors"
            >
              <SlidersHorizontal className="w-4 h-4" />
              {isMobileFiltersOpen ? "Ẩn bộ lọc" : "Hiện bộ lọc"}
            </button>
          </div>

          {/* Filters */}
          <div
            className={`grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 ${
              isMobileFiltersOpen ? "grid" : "hidden"
            } md:grid`}
          >
            <div>
              <label className="block text-sm font-medium mb-2 text-foreground">
                Tìm kiếm nhanh
              </label>
              <input
                type="text"
                value={quickSearch}
                onChange={(e) => setQuickSearch(e.target.value)}
                placeholder={`Tìm kiếm theo ${quickSearchType}...`}
                className="w-full px-4 py-2 rounded-lg border border-border bg-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-foreground">
                Loại tìm kiếm
              </label>
              <Select
                value={quickSearchType}
                onValueChange={(value) =>
                  setQuickSearchType(value as "requestId" | "userId" | "sessionId")
                }
              >
                <SelectTrigger className="w-full bg-input text-foreground text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="requestId">Request ID</SelectItem>
                  <SelectItem value="userId">User ID</SelectItem>
                  <SelectItem value="sessionId">Session ID</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-foreground">
                Level
              </label>
              <Select
                value={levelFilter || "all"}
                onValueChange={(value) =>
                  setLevelFilter(
                    value === "all" ? "" : (value as "INFO" | "WARN" | "ERROR" | "DEBUG"),
                  )
                }
              >
                <SelectTrigger className="w-full bg-input text-foreground text-sm">
                  <SelectValue placeholder="Tất cả level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả level</SelectItem>
                  <SelectItem value="DEBUG">DEBUG</SelectItem>
                  <SelectItem value="INFO">INFO</SelectItem>
                  <SelectItem value="WARN">WARN</SelectItem>
                  <SelectItem value="ERROR">ERROR</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-foreground">
                Kết quả
              </label>
              <div className="px-4 py-2 rounded-lg border border-border bg-muted/30 text-foreground text-sm font-medium h-10 flex items-center justify-between">
                {filteredLogs.length} log
                <span className="text-xs text-muted-foreground">kết quả</span>
              </div>
            </div>
          </div>

          {quickSearchType === "requestId" && missingRequestIdCount > 0 && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-100/20 px-3 py-2 text-xs text-amber-700">
              Có {missingRequestIdCount} log chưa có requestId, nên có thể không tìm được bằng bộ lọc Request ID.
            </div>
          )}
        </div>

        {/* Logs Container */}
        <div className="flex-1 min-h-0 flex flex-col">
          {/* Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-4 border-b border-border">
            <p className="text-sm text-muted-foreground">
              {isPaused ? "Tạm dừng" : "Đang theo dõi realtime"}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setLogs([])}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
                title="Xóa tất cả log"
              >
                <Trash2 className="w-4 h-4 text-muted-foreground hover:text-foreground" />
              </button>
              <button
                onClick={() => setIsPaused(!isPaused)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-muted/50 transition-colors"
              >
                {isPaused ? (
                  <>
                    <Play className="w-4 h-4" />
                    Tiếp tục
                  </>
                ) : (
                  <>
                    <Pause className="w-4 h-4" />
                    Tạm dừng
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Logs List */}
          <div className="flex-1 min-h-0 overflow-y-auto bg-background rounded-lg border border-border p-4 font-mono text-xs space-y-1">
            {filteredLogs.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <p>Không tìm thấy log nào</p>
              </div>
            ) : (
              <>
                {filteredLogs.map((log) => (
                  <div
                    key={log.id}
                    className={`p-2 rounded transition-colors ${getLogBgColor(
                      log.level,
                    )} cursor-pointer group hover:bg-muted/20`}
                  >
                    <div className="flex flex-col sm:flex-row gap-1 sm:gap-4">
                      <span className="text-muted-foreground flex-shrink-0">
                        {log.timestamp}
                      </span>
                      <span
                        className={`font-bold flex-shrink-0 w-12 ${getLogColor(
                          log.level,
                        )}`}
                      >
                        [{log.level}]
                      </span>
                      <span className="text-secondary flex-shrink-0 text-xs sm:text-[11px]">
                        {log.service}
                      </span>
                      <span className="text-foreground flex-1 break-words">
                        {log.message}
                      </span>
                    </div>
                    {(log.requestId || log.userId || log.sessionId) && (
                      <div className="ml-0 sm:ml-32 text-muted-foreground text-xs mt-1 space-x-2">
                        <span>requestId: {log.requestId ?? "N/A"}</span>
                        {log.userId && <span>userId: {log.userId}</span>}
                        {log.userId && log.sessionId && <span>|</span>}
                        {log.sessionId && (
                          <span>sessionId: {log.sessionId}</span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                <div ref={logsEndRef} />
              </>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminLogs;
