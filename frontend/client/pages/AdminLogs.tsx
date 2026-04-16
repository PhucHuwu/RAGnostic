import { useState, useEffect, useRef } from "react";
import { Search, Pause, Play, Trash2, Download } from "lucide-react";
import AdminLayout from "@/components/layouts/AdminLayout";

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
  const [logs, setLogs] = useState<LogEntry[]>([
    {
      id: "1",
      timestamp: "2024-01-28 14:32:45",
      level: "INFO",
      service: "chat-service",
      message: "User john_doe started a new chat session",
      userId: "2",
      sessionId: "sess_12345",
      requestId: "req_abc123",
    },
    {
      id: "2",
      timestamp: "2024-01-28 14:32:46",
      level: "DEBUG",
      service: "document-processor",
      message: "Processing document: Hướng dẫn sử dụng sản phẩm.pdf",
      requestId: "req_abc124",
    },
    {
      id: "3",
      timestamp: "2024-01-28 14:32:48",
      level: "INFO",
      service: "indexing-service",
      message: "Document indexed successfully with 42 chunks",
      requestId: "req_abc124",
    },
    {
      id: "4",
      timestamp: "2024-01-28 14:32:50",
      level: "WARN",
      service: "chat-service",
      message: "High latency detected: response time 2.5s",
      sessionId: "sess_12345",
      requestId: "req_abc125",
    },
    {
      id: "5",
      timestamp: "2024-01-28 14:32:52",
      level: "INFO",
      service: "auth-service",
      message: "User jane_smith logged in",
      userId: "3",
      requestId: "req_abc126",
    },
    {
      id: "6",
      timestamp: "2024-01-28 14:32:55",
      level: "ERROR",
      service: "document-processor",
      message: "Failed to parse file: corrupted PDF format",
      requestId: "req_abc127",
    },
    {
      id: "7",
      timestamp: "2024-01-28 14:32:58",
      level: "DEBUG",
      service: "cache-service",
      message: "Cache hit for query: gpt-4 embeddings",
      requestId: "req_abc128",
    },
    {
      id: "8",
      timestamp: "2024-01-28 14:33:00",
      level: "INFO",
      service: "api-gateway",
      message: "Request quota: 450/1000 used today",
      requestId: "req_abc129",
    },
  ]);

  const [isPaused, setIsPaused] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState<"" | "INFO" | "WARN" | "ERROR" | "DEBUG">("");
  const [serviceFilter, setServiceFilter] = useState("");
  const [quickSearch, setQuickSearch] = useState("");
  const [quickSearchType, setQuickSearchType] = useState<"requestId" | "userId" | "sessionId">(
    "requestId"
  );
  const logsEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (!isPaused) {
      scrollToBottom();
    }
  }, [logs, isPaused]);

  // Simulate realtime logs
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      const newLog: LogEntry = {
        id: String(logs.length + 1),
        timestamp: new Date().toLocaleTimeString("vi-VN", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
        level: ["INFO", "WARN", "ERROR", "DEBUG"][
          Math.floor(Math.random() * 4)
        ] as LogEntry["level"],
        service: [
          "chat-service",
          "document-processor",
          "indexing-service",
          "auth-service",
          "api-gateway",
        ][Math.floor(Math.random() * 5)],
        message: [
          "Processing request...",
          "User interaction detected",
          "Cache updated",
          "Data synchronized",
          "Background job completed",
        ][Math.floor(Math.random() * 5)],
        requestId: `req_${Math.random().toString(36).substr(2, 6)}`,
      };

      setLogs((prev) => [...prev, newLog]);
    }, 3000);

    return () => clearInterval(interval);
  }, [isPaused, logs.length]);

  const uniqueServices = Array.from(new Set(logs.map((log) => log.service)));

  const filteredLogs = logs.filter((log) => {
    const matchesSearch = log.message
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesLevel = !levelFilter || log.level === levelFilter;
    const matchesService = !serviceFilter || log.service === serviceFilter;
    const matchesQuickSearch =
      !quickSearch ||
      (quickSearchType === "requestId" &&
        log.requestId?.includes(quickSearch)) ||
      (quickSearchType === "userId" && log.userId?.includes(quickSearch)) ||
      (quickSearchType === "sessionId" &&
        log.sessionId?.includes(quickSearch));

    return (
      matchesSearch && matchesLevel && matchesService && matchesQuickSearch
    );
  });

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
      <div className="space-y-6 h-[calc(100vh-200px)] flex flex-col">
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
        <div className="space-y-4">
          {/* Main Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-foreground">
                Tìm kiếm
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm theo thông điệp..."
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-foreground">
                Level
              </label>
              <select
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value as any)}
                className="w-full px-4 py-2 rounded-lg border border-border bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
              >
                <option value="">Tất cả level</option>
                <option value="DEBUG">DEBUG</option>
                <option value="INFO">INFO</option>
                <option value="WARN">WARN</option>
                <option value="ERROR">ERROR</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-foreground">
                Service
              </label>
              <select
                value={serviceFilter}
                onChange={(e) => setServiceFilter(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-border bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
              >
                <option value="">Tất cả service</option>
                {uniqueServices.map((service) => (
                  <option key={service} value={service}>
                    {service}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-foreground">
                Kết quả
              </label>
              <div className="px-4 py-2 rounded-lg border border-border bg-muted/30 text-foreground text-sm font-medium h-10 flex items-center">
                {filteredLogs.length} log
              </div>
            </div>
          </div>

          {/* Quick Search */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
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
              <select
                value={quickSearchType}
                onChange={(e) =>
                  setQuickSearchType(
                    e.target.value as "requestId" | "userId" | "sessionId"
                  )
                }
                className="w-full px-4 py-2 rounded-lg border border-border bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
              >
                <option value="requestId">Request ID</option>
                <option value="userId">User ID</option>
                <option value="sessionId">Session ID</option>
              </select>
            </div>
          </div>
        </div>

        {/* Logs Container */}
        <div className="flex-1 flex flex-col">
          {/* Controls */}
          <div className="flex items-center justify-between pb-4 border-b border-border">
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
          <div className="flex-1 overflow-y-auto bg-background rounded-lg border border-border p-4 font-mono text-xs space-y-1">
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
                      log.level
                    )} cursor-pointer group hover:bg-muted/20`}
                  >
                    <div className="flex gap-4">
                      <span className="text-muted-foreground flex-shrink-0">
                        {log.timestamp}
                      </span>
                      <span
                        className={`font-bold flex-shrink-0 w-12 ${getLogColor(
                          log.level
                        )}`}
                      >
                        [{log.level}]
                      </span>
                      <span className="text-secondary flex-shrink-0">
                        {log.service}
                      </span>
                      <span className="text-foreground flex-1 break-words">
                        {log.message}
                      </span>
                      <span className="text-muted-foreground flex-shrink-0 hidden group-hover:inline">
                        {log.requestId && `${log.requestId}`}
                      </span>
                    </div>
                    {(log.userId || log.sessionId) && (
                      <div className="ml-32 text-muted-foreground text-xs mt-1">
                        {log.userId && <span>userId: {log.userId}</span>}
                        {log.userId && log.sessionId && <span> | </span>}
                        {log.sessionId && <span>sessionId: {log.sessionId}</span>}
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
