"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AuthGate } from "@/components/auth/auth-gate";
import { Badge } from "@/components/common/badge";
import { Button } from "@/components/common/button";
import { DataTable } from "@/components/common/table";
import { Input } from "@/components/common/input";
import { Pagination } from "@/components/common/pagination";
import { Select } from "@/components/common/select";
import { Tabs } from "@/components/common/tabs";
import { EmptyState } from "@/components/common/state";
import { AppShell } from "@/components/layout/app-shell";
import { useToast } from "@/components/providers/toast-provider";
import { api } from "@/lib/api";
import type { AdminSystemModel, AdminUser, DocumentItem } from "@/lib/api/client";
import { formatDateTime } from "@/lib/utils";

type AdminTab = "users" | "documents" | "model" | "logs";

type RealtimeLog = {
  id: string;
  level: "DEBUG" | "INFO" | "WARNING" | "ERROR" | "CRITICAL";
  service: string;
  message: string;
  requestId: string;
  sessionId: string;
  userId: string;
  timestamp: string;
};

const pageSize = 6;

const createMockLog = (): RealtimeLog => {
  const levels = ["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"] as const;
  const services = ["auth", "api", "worker", "chat", "ingest"];
  const randomLevel = levels[Math.floor(Math.random() * levels.length)];
  const randomService = services[Math.floor(Math.random() * services.length)];

  return {
    id: crypto.randomUUID(),
    level: randomLevel,
    service: randomService,
    message: `${randomService} event processed`,
    requestId: `req_${Math.random().toString(36).slice(2, 8)}`,
    sessionId: `ses_${Math.random().toString(36).slice(2, 8)}`,
    userId: `usr_${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString()
  };
};

export default function AdminPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<AdminTab>("users");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [newUsername, setNewUsername] = useState("");
  const [newRole, setNewRole] = useState<"USER" | "ADMIN">("USER");
  const [modelDraft, setModelDraft] = useState<AdminSystemModel | null>(null);
  const [logs, setLogs] = useState<RealtimeLog[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [logLevel, setLogLevel] = useState<string>("");
  const [logService, setLogService] = useState("");
  const [traceQuery, setTraceQuery] = useState("");

  const usersQuery = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => api.listAdminUsers()
  });

  const documentsQuery = useQuery({
    queryKey: ["admin-documents"],
    queryFn: () => api.listAdminDocuments()
  });

  const modelQuery = useQuery({
    queryKey: ["admin-model"],
    queryFn: () => api.getSystemModel()
  });

  useEffect(() => {
    if (modelQuery.data) {
      setModelDraft(modelQuery.data);
    }
  }, [modelQuery.data]);

  useEffect(() => {
    if (isPaused) {
      return;
    }

    const timer = window.setInterval(() => {
      setLogs((current) => [createMockLog(), ...current].slice(0, 220));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [isPaused]);

  const createUserMutation = useMutation({
    mutationFn: () =>
      api.createAdminUser({
        username: newUsername,
        role: newRole,
        password: "Temp@123456"
      }),
    onSuccess: () => {
      setNewUsername("");
      void queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      showToast({ title: "Da tao user moi", variant: "success" });
    }
  });

  const updateUserMutation = useMutation({
    mutationFn: ({
      userId,
      input
    }: {
      userId: string;
      input: Partial<Pick<AdminUser, "role" | "status">>;
    }) => api.updateAdminUser(userId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      showToast({ title: "Da cap nhat user", variant: "success" });
    }
  });

  const resetPasswordMutation = useMutation({
    mutationFn: (userId: string) => api.resetAdminPassword(userId),
    onSuccess: (result) => {
      showToast({
        title: "Mat khau tam da duoc reset",
        description: result.password,
        variant: "info"
      });
    }
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: (documentId: string) => api.deleteAdminDocument(documentId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-documents"] });
      showToast({ title: "Da xoa tai lieu", variant: "success" });
    }
  });

  const updateModelMutation = useMutation({
    mutationFn: () => api.updateSystemModel(modelDraft!),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-model"] });
      showToast({ title: "Da cap nhat model", variant: "success" });
    }
  });

  const filteredUsers = useMemo(() => {
    const source = usersQuery.data ?? [];
    if (!search.trim()) {
      return source;
    }
    return source.filter((user) => user.username.toLowerCase().includes(search.toLowerCase()));
  }, [search, usersQuery.data]);

  const pagedUsers = useMemo(
    () => filteredUsers.slice((page - 1) * pageSize, page * pageSize),
    [filteredUsers, page]
  );

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const levelPass = !logLevel || log.level === logLevel;
      const servicePass = !logService || log.service.includes(logService);
      const trace = traceQuery.trim();
      const tracePass =
        !trace ||
        log.requestId.includes(trace) ||
        log.sessionId.includes(trace) ||
        log.userId.includes(trace) ||
        log.message.toLowerCase().includes(trace.toLowerCase());

      return levelPass && servicePass && tracePass;
    });
  }, [logLevel, logService, logs, traceQuery]);

  return (
    <AuthGate roles={["ADMIN"]}>
      <AppShell
        title="Admin Control Room"
        description="Manage users, global documents, model configuration, and real-time system logs."
      >
        <Tabs
          items={[
            { id: "users", label: "Users" },
            { id: "documents", label: "Documents" },
            { id: "model", label: "Model" },
            { id: "logs", label: "Logs" }
          ]}
          activeId={activeTab}
          onChange={(id) => setActiveTab(id as AdminTab)}
        />

        {activeTab === "users" ? (
          <section className="glass-panel admin-section">
            <div className="admin-toolbar">
              <Input
                label="Search user"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              <Input
                label="New username"
                value={newUsername}
                onChange={(event) => setNewUsername(event.target.value)}
              />
              <Select
                label="Role"
                value={newRole}
                onChange={(event) => setNewRole(event.target.value as "USER" | "ADMIN")}
                options={[
                  { value: "USER", label: "USER" },
                  { value: "ADMIN", label: "ADMIN" }
                ]}
              />
              <Button
                onClick={() => createUserMutation.mutate()}
                disabled={!newUsername.trim()}
                isLoading={createUserMutation.isPending}
              >
                Create user
              </Button>
            </div>

            <DataTable
              rows={pagedUsers}
              emptyText="No users found"
              columns={[
                {
                  key: "username",
                  header: "Username",
                  render: (user: AdminUser) => user.username
                },
                {
                  key: "role",
                  header: "Role",
                  render: (user: AdminUser) => <Badge variant="info">{user.role}</Badge>
                },
                {
                  key: "status",
                  header: "Status",
                  render: (user: AdminUser) => <Badge>{user.status}</Badge>
                },
                {
                  key: "created",
                  header: "Created",
                  render: (user: AdminUser) => formatDateTime(user.createdAt)
                },
                {
                  key: "actions",
                  header: "Actions",
                  render: (user: AdminUser) => (
                    <div className="inline-actions">
                      <Button
                        variant="ghost"
                        onClick={() =>
                          updateUserMutation.mutate({
                            userId: user.id,
                            input: { role: user.role === "ADMIN" ? "USER" : "ADMIN" }
                          })
                        }
                      >
                        Toggle role
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => resetPasswordMutation.mutate(user.id)}
                      >
                        Reset password
                      </Button>
                    </div>
                  )
                }
              ]}
            />

            <Pagination page={page} totalPages={totalPages} onChange={setPage} />
          </section>
        ) : null}

        {activeTab === "documents" ? (
          <section className="glass-panel admin-section">
            {documentsQuery.data && documentsQuery.data.length > 0 ? (
              <DataTable
                rows={documentsQuery.data}
                columns={[
                  {
                    key: "file",
                    header: "File",
                    render: (document: DocumentItem) => document.fileName
                  },
                  {
                    key: "status",
                    header: "Status",
                    render: (document: DocumentItem) => (
                      <Badge variant="info">{document.status}</Badge>
                    )
                  },
                  {
                    key: "uploaded",
                    header: "Uploaded",
                    render: (document: DocumentItem) => formatDateTime(document.uploadedAt)
                  },
                  {
                    key: "actions",
                    header: "Actions",
                    render: (document: DocumentItem) => (
                      <Button
                        variant="danger"
                        onClick={() => {
                          if (window.confirm(`Delete ${document.fileName}?`)) {
                            deleteDocumentMutation.mutate(document.id);
                          }
                        }}
                      >
                        Delete
                      </Button>
                    )
                  }
                ]}
              />
            ) : (
              <EmptyState
                title="No documents"
                description="No documents are available for moderation."
              />
            )}
          </section>
        ) : null}

        {activeTab === "model" ? (
          <section className="glass-panel admin-section model-form">
            {modelDraft ? (
              <>
                <Input
                  label="Provider"
                  value={modelDraft.provider}
                  onChange={(event) =>
                    setModelDraft((prev) =>
                      prev ? { ...prev, provider: event.target.value } : prev
                    )
                  }
                />
                <Input
                  label="Model name"
                  value={modelDraft.modelName}
                  onChange={(event) =>
                    setModelDraft((prev) =>
                      prev ? { ...prev, modelName: event.target.value } : prev
                    )
                  }
                />
                <Input
                  label="Temperature"
                  type="number"
                  step="0.1"
                  value={String(modelDraft.temperature)}
                  onChange={(event) =>
                    setModelDraft((prev) =>
                      prev ? { ...prev, temperature: Number(event.target.value) } : prev
                    )
                  }
                />
                <Input
                  label="Max tokens"
                  type="number"
                  value={String(modelDraft.maxTokens)}
                  onChange={(event) =>
                    setModelDraft((prev) =>
                      prev ? { ...prev, maxTokens: Number(event.target.value) } : prev
                    )
                  }
                />
                <Button
                  isLoading={updateModelMutation.isPending}
                  onClick={() => updateModelMutation.mutate()}
                >
                  Update model config
                </Button>
              </>
            ) : null}
          </section>
        ) : null}

        {activeTab === "logs" ? (
          <section className="glass-panel admin-section">
            <div className="admin-toolbar">
              <Select
                label="Level"
                value={logLevel}
                onChange={(event) => setLogLevel(event.target.value)}
                options={[
                  { value: "", label: "All levels" },
                  { value: "DEBUG", label: "DEBUG" },
                  { value: "INFO", label: "INFO" },
                  { value: "WARNING", label: "WARNING" },
                  { value: "ERROR", label: "ERROR" },
                  { value: "CRITICAL", label: "CRITICAL" }
                ]}
              />
              <Input
                label="Service"
                placeholder="auth/api/worker"
                value={logService}
                onChange={(event) => setLogService(event.target.value)}
              />
              <Input
                label="Trace filter"
                placeholder="request_id/session_id/user_id"
                value={traceQuery}
                onChange={(event) => setTraceQuery(event.target.value)}
              />
              <Button
                variant={isPaused ? "secondary" : "ghost"}
                onClick={() => setIsPaused((p) => !p)}
              >
                {isPaused ? "Resume stream" : "Pause stream"}
              </Button>
            </div>

            <div className="log-stream" role="log" aria-live="polite">
              {filteredLogs.length === 0 ? (
                <p className="muted">No logs matched current filters.</p>
              ) : (
                filteredLogs.map((log) => (
                  <article key={log.id} className="log-row">
                    <div>
                      <Badge
                        variant={
                          log.level === "ERROR" || log.level === "CRITICAL"
                            ? "danger"
                            : log.level === "WARNING"
                              ? "warning"
                              : "info"
                        }
                      >
                        {log.level}
                      </Badge>
                    </div>
                    <p>
                      [{formatDateTime(log.timestamp)}] {log.service}: {log.message}
                    </p>
                    <code>
                      {log.requestId} / {log.sessionId} / {log.userId}
                    </code>
                  </article>
                ))
              )}
            </div>
          </section>
        ) : null}
      </AppShell>
    </AuthGate>
  );
}
