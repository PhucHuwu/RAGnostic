"use client";

import { FormEvent, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AuthGate } from "@/components/auth/auth-gate";
import { Badge } from "@/components/common/badge";
import { Button } from "@/components/common/button";
import { Drawer } from "@/components/common/drawer";
import { EmptyState, ErrorState, LoadingState } from "@/components/common/state";
import { AppShell } from "@/components/layout/app-shell";
import { useToast } from "@/components/providers/toast-provider";
import { api } from "@/lib/api";
import type { ChatMessage, ChatSession } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";

const PAGE_SIZE = 10;

export default function ChatPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [profileId, setProfileId] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [draft, setDraft] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [messagePage, setMessagePage] = useState(1);

  const profilesQuery = useQuery({
    queryKey: ["profiles"],
    queryFn: () => api.listProfiles()
  });

  const activeProfileId = profileId || profilesQuery.data?.[0]?.id || "";

  const sessionsQuery = useQuery({
    queryKey: ["sessions", activeProfileId],
    queryFn: () => api.listSessions(activeProfileId),
    enabled: Boolean(activeProfileId)
  });

  const activeSessionId = sessionId || sessionsQuery.data?.[0]?.id || "";

  const messagesQuery = useQuery({
    queryKey: ["messages", activeSessionId],
    queryFn: () => api.listMessages(activeSessionId),
    enabled: Boolean(activeSessionId)
  });

  const createSessionMutation = useMutation({
    mutationFn: () => api.createSession(activeProfileId),
    onSuccess: (session) => {
      void queryClient.invalidateQueries({ queryKey: ["sessions", activeProfileId] });
      setSessionId(session.id);
      setMessagePage(1);
      showToast({ title: "Da tao session moi", variant: "success" });
    }
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const timeout = new Promise<never>((_, reject) => {
        window.setTimeout(() => reject(new Error("Request timeout")), 12_000);
      });

      return Promise.race([api.sendMessage(activeSessionId, content), timeout]);
    },
    onMutate: async (content) => {
      setIsTyping(true);
      const optimistic: ChatMessage = {
        id: `tmp-${Date.now()}`,
        role: "USER",
        content,
        createdAt: new Date().toISOString()
      };
      queryClient.setQueryData<ChatMessage[]>(["messages", activeSessionId], (current = []) => [
        ...current,
        optimistic
      ]);
    },
    onSuccess: (assistantMessage) => {
      queryClient.setQueryData<ChatMessage[]>(["messages", activeSessionId], (current = []) => [
        ...current.filter((item) => !item.id.startsWith("tmp-")),
        assistantMessage
      ]);

      queryClient.setQueryData<ChatSession[]>(["sessions", activeProfileId], (current = []) =>
        current.map((session) =>
          session.id === activeSessionId
            ? {
                ...session,
                title:
                  session.title === "New session"
                    ? draft.slice(0, 52) || "New session"
                    : session.title,
                lastMessageAt: new Date().toISOString()
              }
            : session
        )
      );
      setDraft("");
      showToast({ title: "Tin nhan da duoc gui", variant: "success" });
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", activeSessionId] });
      showToast({
        title: "Gui tin nhan that bai",
        description: "He thong qua tai hoac timeout. Vui long thu lai.",
        variant: "error"
      });
    },
    onSettled: () => {
      setIsTyping(false);
    }
  });

  const allMessages = useMemo(() => messagesQuery.data ?? [], [messagesQuery.data]);
  const totalPages = Math.max(1, Math.ceil(allMessages.length / PAGE_SIZE));
  const visibleMessages = useMemo(() => {
    const start = Math.max(0, allMessages.length - messagePage * PAGE_SIZE);
    return allMessages.slice(start);
  }, [allMessages, messagePage]);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const content = draft.trim();
    if (!content || !activeSessionId) {
      return;
    }
    sendMessageMutation.mutate(content);
  };

  return (
    <AuthGate>
      <AppShell
        title="Chat Workspace"
        description="Session-isolated RAG chat with markdown rendering and short-term memory."
        actions={
          <Button
            onClick={() => createSessionMutation.mutate()}
            disabled={!activeProfileId}
            isLoading={createSessionMutation.isPending}
          >
            New session
          </Button>
        }
      >
        <section className="chat-layout">
          <Drawer title="Profiles & Sessions">
            <div className="chip-list" role="listbox" aria-label="Profiles">
              {(profilesQuery.data ?? []).map((profile) => (
                <button
                  type="button"
                  key={profile.id}
                  className={`chip ${activeProfileId === profile.id ? "chip-active" : ""}`}
                  onClick={() => {
                    setProfileId(profile.id);
                    setSessionId("");
                    setMessagePage(1);
                  }}
                >
                  {profile.name}
                </button>
              ))}
            </div>

            <div className="session-list">
              {(sessionsQuery.data ?? []).map((session) => (
                <button
                  type="button"
                  key={session.id}
                  className={`session-item ${activeSessionId === session.id ? "session-item-active" : ""}`}
                  onClick={() => {
                    setSessionId(session.id);
                    setMessagePage(1);
                  }}
                >
                  <strong>{session.title}</strong>
                  <span>{formatDateTime(session.lastMessageAt)}</span>
                </button>
              ))}
            </div>
          </Drawer>

          <section className="chat-panel glass-panel">
            <header className="chat-header">
              <div>
                <h2>Session memory: 10 latest user turns</h2>
                <p>Markdown enabled. Stream-ready endpoint supported by backend.</p>
              </div>
              <Badge variant="info">BM25 rerank</Badge>
            </header>

            {messagesQuery.isLoading ? <LoadingState title="Loading messages..." /> : null}
            {messagesQuery.isError ? (
              <ErrorState
                title="Khong tai duoc lich su message"
                actionLabel="Thu lai"
                onAction={() => messagesQuery.refetch()}
              />
            ) : null}

            {!messagesQuery.isLoading && !messagesQuery.isError ? (
              visibleMessages.length > 0 ? (
                <>
                  {messagePage < totalPages ? (
                    <div className="chat-page-actions">
                      <Button variant="ghost" onClick={() => setMessagePage((page) => page + 1)}>
                        Load older messages
                      </Button>
                    </div>
                  ) : null}
                  <div className="messages">
                    {visibleMessages.map((message) => (
                      <article
                        key={message.id}
                        className={`message ${message.role === "USER" ? "message-user" : "message-assistant"}`}
                      >
                        {message.role === "ASSISTANT" ? (
                          <ReactMarkdown>{message.content}</ReactMarkdown>
                        ) : (
                          <p>{message.content}</p>
                        )}
                        <time>{formatDateTime(message.createdAt)}</time>
                      </article>
                    ))}
                    {isTyping ? <p className="typing-indicator">Assistant is typing...</p> : null}
                  </div>
                </>
              ) : (
                <EmptyState
                  title="Bat dau cuoc tro chuyen"
                  description="Gui cau hoi dau tien de tao context theo session hien tai."
                />
              )
            ) : null}

            <form className="composer" onSubmit={onSubmit}>
              <label htmlFor="chat-input" className="sr-only">
                Your message
              </label>
              <input
                id="chat-input"
                type="text"
                placeholder="Nhap cau hoi..."
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                disabled={!activeSessionId || sendMessageMutation.isPending}
              />
              <Button
                type="submit"
                isLoading={sendMessageMutation.isPending}
                disabled={!activeSessionId}
              >
                Send
              </Button>
              {sendMessageMutation.isPending ? (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    sendMessageMutation.reset();
                    setIsTyping(false);
                  }}
                >
                  Cancel
                </Button>
              ) : null}
            </form>
          </section>
        </section>
      </AppShell>
    </AuthGate>
  );
}
