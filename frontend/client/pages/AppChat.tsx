"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import {
  AlertCircle,
  Loader,
  MessageSquare,
  MoreVertical,
  Plus,
  Search,
  Send,
} from "lucide-react";
import UserLayout from "@/components/layouts/UserLayout";
import { ApiErrorState } from "@/components/common/api-state";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ApiError,
  createChatSession,
  listChatSessions,
  listMessages,
  sendMessage,
  type ChatMessageResponse,
  type ChatSessionResponse,
} from "@/lib/api";

interface UiSession {
  id: string;
  title: string;
  createdAt: string;
  messageCount: number;
}

interface UiMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  status?: "sent" | "failed";
}

function toUiSession(item: ChatSessionResponse): UiSession {
  return {
    id: item.id,
    title: item.title,
    createdAt: item.started_at,
    messageCount: 0,
  };
}

function toUiMessage(item: ChatMessageResponse): UiMessage {
  return {
    id: item.id,
    role: item.role === "USER" ? "user" : "assistant",
    content: item.content_md || item.content_text,
    timestamp: new Date(item.created_at).toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    }),
    status: "sent",
  };
}

const AppChat = () => {
  const params = useParams<{ profileId: string }>();
  const profileId = params.profileId;

  const [sessions, setSessions] = useState<UiSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const bootstrap = useCallback(
    async (isManualRetry = false) => {
      if (!profileId) {
        return;
      }

      if (isManualRetry) {
        setIsRetrying(true);
      }
      setIsBootstrapping(true);
      setError(null);

      try {
        const serverSessions = await listChatSessions(profileId);
        let normalizedSessions = serverSessions;

        if (normalizedSessions.length === 0) {
          const initialSession = await createChatSession(
            profileId,
            "Phiên mới",
          );
          normalizedSessions = [initialSession];
        }

        const uiSessions = normalizedSessions.map(toUiSession);
        setSessions(uiSessions);
        setActiveSessionId(uiSessions[0]?.id ?? null);
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError("Không thể tải danh sách phiên chat");
        }
      } finally {
        setIsBootstrapping(false);
        setIsRetrying(false);
      }
    },
    [profileId],
  );

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  useEffect(() => {
    if (!activeSessionId) {
      setMessages([]);
      return;
    }

    const loadMessages = async () => {
      setIsLoading(true);
      try {
        const response = await listMessages(activeSessionId);
        const uiMessages = response.items.map(toUiMessage);
        setMessages(uiMessages);
        setSessions((prev) =>
          prev.map((session) =>
            session.id === activeSessionId
              ? { ...session, messageCount: response.items.length }
              : session,
          ),
        );
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError("Không thể tải nội dung chat");
        }
      } finally {
        setIsLoading(false);
      }
    };

    void loadMessages();
  }, [activeSessionId]);

  const handleCreateSession = async () => {
    if (!profileId || isLoading) {
      return;
    }

    setError(null);
    try {
      const created = await createChatSession(
        profileId,
        `Phiên ${sessions.length + 1}`,
      );
      const uiSession = toUiSession(created);
      setSessions((prev) => [uiSession, ...prev]);
      setActiveSessionId(uiSession.id);
      setMessages([]);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Không thể tạo phiên chat mới");
      }
    }
  };

  const handleSendMessage = async () => {
    if (!activeSessionId || !inputValue.trim() || isLoading) {
      return;
    }

    const pending = inputValue.trim();
    setInputValue("");
    setIsLoading(true);

    const optimisticUserMessage: UiMessage = {
      id: `temp-${Date.now()}`,
      role: "user",
      content: pending,
      timestamp: new Date().toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      status: "sent",
    };
    setMessages((prev) => [...prev, optimisticUserMessage]);

    try {
      const response = await sendMessage(activeSessionId, pending);
      setMessages((prev) => [
        ...prev.filter((item) => item.id !== optimisticUserMessage.id),
        toUiMessage(response.user_message),
        toUiMessage(response.assistant_message),
      ]);
      setSessions((prev) =>
        prev.map((session) =>
          session.id === activeSessionId
            ? { ...session, messageCount: session.messageCount + 2 }
            : session,
        ),
      );
    } catch (err) {
      setMessages((prev) =>
        prev.map((item) =>
          item.id === optimisticUserMessage.id
            ? { ...item, status: "failed" }
            : item,
        ),
      );
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Không thể gửi tin nhắn");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const filteredSessions = useMemo(
    () =>
      sessions.filter((session) =>
        session.title.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    [searchQuery, sessions],
  );

  const currentSession = sessions.find((s) => s.id === activeSessionId);

  return (
    <UserLayout>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-200px)]">
        <div className="lg:col-span-1 flex flex-col bg-card rounded-xl border border-border overflow-hidden">
          <div className="p-4 border-b border-border">
            <button
              onClick={handleCreateSession}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Phiên mới
            </button>
          </div>

          <div className="px-4 py-3 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Tìm phiên..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-input text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="p-2 space-y-2">
              {isBootstrapping ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  Đang tải phiên...
                </div>
              ) : filteredSessions.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  Không tìm thấy phiên nào
                </div>
              ) : (
                filteredSessions.map((session) => (
                  <button
                    key={session.id}
                    onClick={() => setActiveSessionId(session.id)}
                    className={`w-full text-left p-3 rounded-lg transition-colors group ${
                      activeSessionId === session.id
                        ? "bg-primary/10 border border-primary/30"
                        : "hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate text-sm">
                          {session.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {session.messageCount} tin nhắn
                        </p>
                      </div>
                      <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/10 rounded transition-all">
                        <MoreVertical className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 flex flex-col bg-card rounded-xl border border-border overflow-hidden">
          <div className="p-4 border-b border-border bg-card/50">
            <h2 className="font-display font-bold text-lg text-foreground">
              {currentSession?.title || "Chat"}
            </h2>
            <p className="text-xs text-muted-foreground">
              Profile ID: {profileId}
            </p>
          </div>

          {error && (
            <div className="mx-6 mt-4">
              <ApiErrorState
                message={error}
                onRetry={() => void bootstrap(true)}
                isRetrying={isRetrying}
              />
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {isBootstrapping
              ? Array.from({ length: 4 }).map((_, idx) => (
                  <div key={idx} className="flex gap-3">
                    <Skeleton className="w-8 h-8 rounded-full" />
                    <div className="space-y-2 w-full max-w-md">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-4/5" />
                    </div>
                  </div>
                ))
              : messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 animate-slide-up ${
                      message.role === "user" ? "flex-row-reverse" : "flex-row"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-semibold ${
                        message.role === "user"
                          ? "bg-primary/20 text-primary"
                          : "bg-secondary/20 text-secondary"
                      }`}
                    >
                      {message.role === "user" ? "U" : "A"}
                    </div>

                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                        message.role === "user"
                          ? "bg-primary text-white rounded-br-none"
                          : "bg-muted text-foreground rounded-bl-none"
                      }`}
                    >
                      <div className="text-sm leading-relaxed whitespace-pre-wrap">
                        {message.content}
                      </div>
                      <div className="mt-1 flex items-center justify-between gap-2">
                        <span className="text-xs opacity-70">
                          {message.timestamp}
                        </span>
                        {message.status === "failed" && (
                          <AlertCircle className="w-3 h-3 text-yellow-500" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}

            {isLoading && (
              <div className="flex gap-3 animate-fade-in">
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-semibold bg-secondary/20 text-secondary">
                  A
                </div>
                <div className="px-4 py-3 rounded-lg bg-muted rounded-bl-none">
                  <Loader className="w-4 h-4 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}

            {messages.length === 0 && !isLoading && (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                <div className="text-center space-y-2">
                  <MessageSquare className="w-6 h-6 mx-auto" />
                  <p>Chưa có tin nhắn. Hãy bắt đầu cuộc trò chuyện.</p>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 border-t border-border bg-card/50">
            <div className="flex gap-3">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void handleSendMessage();
                  }
                }}
                placeholder="Nhập câu hỏi..."
                disabled={isLoading || !activeSessionId}
                className="flex-1 px-4 py-3 rounded-lg border border-border bg-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:opacity-50"
              />
              <button
                onClick={() => void handleSendMessage()}
                disabled={isLoading || !inputValue.trim() || !activeSessionId}
                className="px-6 py-3 rounded-lg bg-primary text-white font-semibold hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isLoading ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </UserLayout>
  );
};

export default AppChat;
