"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  AlertCircle,
  FileText,
  FileUp,
  Loader,
  MessageSquare,
  PanelLeft,
  PencilLine,
  Plus,
  Search,
  Send,
  Settings,
  Trash2,
} from "lucide-react";
import UserLayout from "@/components/layouts/UserLayout";
import { ApiErrorState } from "@/components/common/api-state";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  ApiError,
  createChatSession,
  deleteProfile,
  deleteChatSession,
  getProfile,
  listDocuments,
  listChatSessions,
  listMessages,
  sendMessage,
  deleteDocument,
  updateProfile,
  updateChatSessionTitle,
  uploadDocument,
  type ChatMessageResponse,
  type DocumentResponse,
  type ChatSessionResponse,
} from "@/lib/api";
import {
  getAllProfileIconNames,
  getProfileIconComponent,
} from "@/lib/profile-icons";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

type AssistantDraft = {
  name: string;
  topic: string;
  description: string;
  iconName: string;
};

const QUICK_ICON_NAMES = [
  "Bot",
  "Sparkles",
  "UserRound",
  "Briefcase",
  "BookOpenText",
  "Cpu",
  "ShieldCheck",
  "MessageCircleHeart",
];

function formatIconLabel(name: string) {
  return name.replace(/([a-z0-9])([A-Z])/g, "$1 $2");
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const profileId = params.profileId;

  const [sessions, setSessions] = useState<UiSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [profileName, setProfileName] = useState<string | null>(null);
  const [profileIconName, setProfileIconName] = useState<string | null>(null);
  const [assistantDraft, setAssistantDraft] = useState<AssistantDraft | null>(null);
  const [isAssistantDialogOpen, setIsAssistantDialogOpen] = useState(false);
  const [isAssistantSaving, setIsAssistantSaving] = useState(false);
  const [assistantError, setAssistantError] = useState<string | null>(null);
  const [assistantIconQuery, setAssistantIconQuery] = useState("");
  const [isAssistantIconPickerExpanded, setIsAssistantIconPickerExpanded] =
    useState(false);
  const [isDeleteAssistantOpen, setIsDeleteAssistantOpen] = useState(false);
  const [isDeletingAssistant, setIsDeletingAssistant] = useState(false);
  const [pendingDeleteSessionId, setPendingDeleteSessionId] = useState<string | null>(null);
  const [pendingDeleteDocumentId, setPendingDeleteDocumentId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);
  const [renamingSessionId, setRenamingSessionId] = useState<string | null>(null);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingSessionTitle, setEditingSessionTitle] = useState("");
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [isSessionsOpen, setIsSessionsOpen] = useState(false);
  const [isDocumentsVisible, setIsDocumentsVisible] = useState(false);
  const [documents, setDocuments] = useState<DocumentResponse[]>([]);
  const [isDocumentsLoading, setIsDocumentsLoading] = useState(true);
  const [deletingDocumentId, setDeletingDocumentId] = useState<string | null>(null);
  const [isUploadingDocuments, setIsUploadingDocuments] = useState(false);
  const [documentsError, setDocumentsError] = useState<string | null>(null);
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

  const loadDocuments = useCallback(async () => {
    if (!profileId) {
      return;
    }

    setIsDocumentsLoading(true);
    setDocumentsError(null);
    try {
      const data = await listDocuments(profileId);
      setDocuments(data);
    } catch (err) {
      if (err instanceof ApiError) {
        setDocumentsError(err.message);
      } else {
        setDocumentsError("Không thể tải danh sách tài liệu");
      }
    } finally {
      setIsDocumentsLoading(false);
    }
  }, [profileId]);

  useEffect(() => {
    void loadDocuments();
  }, [loadDocuments]);

  useEffect(() => {
    if (searchParams.get("panel") === "documents") {
      setIsDocumentsVisible(true);
    }
  }, [searchParams]);

  useEffect(() => {
    if (editingSessionId && editingSessionId !== activeSessionId) {
      setEditingSessionId(null);
      setEditingSessionTitle("");
    }
  }, [activeSessionId, editingSessionId]);

  useEffect(() => {
    const loadProfileMeta = async () => {
      if (!profileId) {
        return;
      }

      try {
        const profile = await getProfile(profileId);
        setProfileName(profile.name);
        setProfileIconName(profile.icon_name);
        setAssistantDraft({
          name: profile.name,
          topic: profile.topic,
          description: profile.description ?? "",
          iconName: profile.icon_name,
        });
      } catch {
        setProfileName(null);
        setProfileIconName(null);
        setAssistantDraft(null);
      }
    };

    void loadProfileMeta();
  }, [profileId]);

  const AssistantIcon = useMemo(
    () => getProfileIconComponent(profileIconName),
    [profileIconName],
  );

  const allIconNames = useMemo(() => getAllProfileIconNames(), []);
  const quickAssistantIconNames = useMemo(
    () => QUICK_ICON_NAMES.filter((name) => allIconNames.includes(name)),
    [allIconNames],
  );
  const assistantIconCandidates = useMemo(() => {
    const query = assistantIconQuery.trim().toLowerCase();
    if (!query) {
      return allIconNames.slice(0, 140);
    }
    return allIconNames
      .filter((item) => item.toLowerCase().includes(query))
      .slice(0, 220);
  }, [allIconNames, assistantIconQuery]);
  const selectedAssistantIconName = assistantDraft?.iconName ?? "Bot";
  const SelectedAssistantIcon = useMemo(
    () => getProfileIconComponent(selectedAssistantIconName),
    [selectedAssistantIconName],
  );

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

  const handleDeleteSession = async () => {
    const sessionId = pendingDeleteSessionId;
    if (!sessionId) {
      return;
    }

    if (deletingSessionId) {
      return;
    }

    setDeletingSessionId(sessionId);
    setError(null);
    try {
      await deleteChatSession(sessionId);
      const remaining = sessions.filter((item) => item.id !== sessionId);
      setSessions(remaining);

      if (activeSessionId === sessionId) {
        const nextSession = remaining[0];
        setActiveSessionId(nextSession?.id ?? null);
        if (!nextSession) {
          setMessages([]);
        }
      }
      setPendingDeleteSessionId(null);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Không thể xóa phiên chat");
      }
    } finally {
      setDeletingSessionId(null);
    }
  };

  const beginRenameSession = (session: UiSession) => {
    if (renamingSessionId || deletingSessionId) {
      return;
    }

    setEditingSessionId(session.id);
    setEditingSessionTitle(session.title);
    setError(null);
  };

  const cancelRenameSession = () => {
    setEditingSessionId(null);
    setEditingSessionTitle("");
  };

  const submitRenameSession = async () => {
    if (!editingSessionId) {
      return;
    }

    const session = sessions.find((item) => item.id === editingSessionId);
    if (!session) {
      cancelRenameSession();
      return;
    }

    const trimmedTitle = editingSessionTitle.trim();
    if (!trimmedTitle) {
      setError("Tên phiên không được để trống");
      return;
    }

    if (trimmedTitle === session.title) {
      cancelRenameSession();
      return;
    }

    setRenamingSessionId(session.id);
    setError(null);
    try {
      const updated = await updateChatSessionTitle(session.id, trimmedTitle);
      setSessions((prev) =>
        prev.map((item) =>
          item.id === session.id ? { ...item, title: updated.title } : item,
        ),
      );
      cancelRenameSession();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Không thể đổi tên phiên chat");
      }
    } finally {
      setRenamingSessionId(null);
    }
  };

  const canSaveAssistant = useMemo(() => {
    if (!assistantDraft) {
      return false;
    }
    return (
      assistantDraft.name.trim().length > 0 &&
      assistantDraft.topic.trim().length > 0
    );
  }, [assistantDraft]);

  const handleSaveAssistant = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!profileId || !assistantDraft || !canSaveAssistant) {
      return;
    }

    setIsAssistantSaving(true);
    setAssistantError(null);
    try {
      const updated = await updateProfile(profileId, {
        name: assistantDraft.name.trim(),
        topic: assistantDraft.topic.trim(),
        description: assistantDraft.description.trim() || undefined,
        icon_name: assistantDraft.iconName,
      });
      setProfileName(updated.name);
      setProfileIconName(updated.icon_name);
      setAssistantDraft({
        name: updated.name,
        topic: updated.topic,
        description: updated.description ?? "",
        iconName: updated.icon_name,
      });
      setIsAssistantDialogOpen(false);
      setAssistantIconQuery("");
      window.dispatchEvent(new Event("ragnostic:profiles-updated"));
    } catch (err) {
      if (err instanceof ApiError) {
        setAssistantError(err.message);
      } else {
        setAssistantError("Không thể cập nhật trợ lý");
      }
    } finally {
      setIsAssistantSaving(false);
    }
  };

  const handleDeleteAssistant = async () => {
    if (!profileId || isDeletingAssistant) {
      return;
    }

    setIsDeletingAssistant(true);
    setAssistantError(null);
    try {
      await deleteProfile(profileId);
      window.dispatchEvent(new Event("ragnostic:profiles-updated"));
      router.push("/app/profiles/new");
    } catch (err) {
      if (err instanceof ApiError) {
        setAssistantError(err.message);
      } else {
        setAssistantError("Không thể xóa trợ lý");
      }
      setIsDeleteAssistantOpen(false);
    } finally {
      setIsDeletingAssistant(false);
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

  const handleUploadFiles = async (files: FileList | null) => {
    if (!files || !profileId || isUploadingDocuments) {
      return;
    }

    const MAX_FILE_SIZE = 10 * 1024 * 1024;
    const ALLOWED_EXTS = new Set(["pdf", "docx", "txt"]);
    const selectedFiles = Array.from(files);

    if (selectedFiles.length === 0) {
      return;
    }

    setIsUploadingDocuments(true);
    setError(null);
    setDocumentsError(null);

    try {
      let uploadedCount = 0;
      const failedFileMessages: string[] = [];

      for (const file of selectedFiles) {
        const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
        if (!ALLOWED_EXTS.has(ext)) {
          failedFileMessages.push(`${file.name}: định dạng không hỗ trợ`);
          continue;
        }
        if (file.size > MAX_FILE_SIZE) {
          failedFileMessages.push(`${file.name}: vượt quá 10MB`);
          continue;
        }

        try {
          await uploadDocument(profileId, file);
          uploadedCount += 1;
        } catch (err) {
          if (err instanceof ApiError) {
            failedFileMessages.push(`${file.name}: ${err.message}`);
          } else {
            failedFileMessages.push(`${file.name}: upload thất bại`);
          }
        }
      }

      const firstFailure = failedFileMessages[0];
      if (uploadedCount === 0) {
        setDocumentsError(
          firstFailure
            ? `Không thể tải lên tài liệu: ${firstFailure}`
            : "Không có tệp nào được chọn.",
        );
        return;
      }

      await loadDocuments();

      if (firstFailure) {
        setDocumentsError(
          `Đã tải lên ${uploadedCount} tài liệu, ${failedFileMessages.length} tệp lỗi. ${firstFailure}`,
        );
      }
    } finally {
      setIsUploadingDocuments(false);
    }
  };

  const handleDeleteDocument = async () => {
    const documentId = pendingDeleteDocumentId;
    if (!documentId) {
      return;
    }

    if (deletingDocumentId) {
      return;
    }

    setDeletingDocumentId(documentId);
    setDocumentsError(null);
    try {
      await deleteDocument(documentId);
      setDocuments((prev) => prev.filter((item) => item.id !== documentId));
      setPendingDeleteDocumentId(null);
    } catch (err) {
      if (err instanceof ApiError) {
        setDocumentsError(err.message);
      } else {
        setDocumentsError("Không thể xóa tài liệu");
      }
    } finally {
      setDeletingDocumentId(null);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) {
      return `${bytes} B`;
    }
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  const documentStatusLabel = (status: string) => {
    if (status === "READY") return "Sẵn sàng";
    if (status === "FAILED") return "Lỗi";
    if (status === "PARSING") return "Đang phân tích";
    if (status === "CHUNKING") return "Đang chia nhỏ";
    if (status === "INDEXING") return "Đang lập chỉ mục";
    if (status === "UPLOADED") return "Đã tải lên";
    return status;
  };

  const filteredSessions = useMemo(
    () =>
      sessions.filter((session) =>
        session.title.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    [searchQuery, sessions],
  );

  const pendingDeleteSession = useMemo(
    () =>
      pendingDeleteSessionId
        ? sessions.find((item) => item.id === pendingDeleteSessionId)
        : null,
    [pendingDeleteSessionId, sessions],
  );

  const pendingDeleteDocument = useMemo(
    () =>
      pendingDeleteDocumentId
        ? documents.find((item) => item.id === pendingDeleteDocumentId)
        : null,
    [pendingDeleteDocumentId, documents],
  );

  const currentSession = sessions.find((s) => s.id === activeSessionId);

  const closeSessionsDrawer = () => setIsSessionsOpen(false);

  const sessionsPanel = (isMobile = false) => (
    <div className="flex h-full flex-col bg-card rounded-xl border border-border overflow-hidden">
      <div className="p-4 border-b border-border space-y-3">
        <button
          onClick={handleCreateSession}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Phiên mới
        </button>

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
              <div
                key={session.id}
                className={`px-3 py-2 rounded-lg transition-colors ${
                  activeSessionId === session.id
                    ? "bg-primary/10 border border-primary/30"
                    : "hover:bg-muted/50 border border-transparent"
                }`}
              >
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setActiveSessionId(session.id);
                      if (isMobile) {
                        closeSessionsDrawer();
                      }
                    }}
                    className="flex-1 min-w-0 text-left"
                  >
                    <p className="font-medium text-foreground truncate text-sm">
                      {session.title}
                    </p>
                    <p className="text-[11px] text-muted-foreground leading-4">
                      {session.messageCount} tin nhắn
                    </p>
                  </button>
                  <button
                    onClick={() => setPendingDeleteSessionId(session.id)}
                    disabled={deletingSessionId === session.id || renamingSessionId === session.id}
                    className="text-[11px] px-2 py-1 rounded-md border border-border text-muted-foreground hover:text-destructive hover:border-destructive/50 hover:bg-destructive/10 transition-colors disabled:opacity-50 shrink-0"
                  >
                    {deletingSessionId === session.id ? "Đang xóa..." : "Xóa"}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  const documentsPanel = (inputId: string) => (
    <div className="flex h-full flex-col bg-card rounded-xl border border-border overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Kho tài liệu</h3>
        <span className="text-xs text-muted-foreground">{documents.length} tài liệu</span>
      </div>

      <div className="p-4 border-b border-border space-y-3">
        <div>
          <p className="text-xs text-muted-foreground">
            PDF, DOCX, TXT - tối đa 10MB mỗi tệp.
          </p>
        </div>

        <input
          id={inputId}
          type="file"
          multiple
          accept=".pdf,.docx,.txt"
          className="hidden"
          onChange={(event) => void handleUploadFiles(event.currentTarget.files)}
        />

        <button
          onClick={() => document.getElementById(inputId)?.click()}
          disabled={isUploadingDocuments}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted/40 transition-colors disabled:opacity-50"
        >
          {isUploadingDocuments ? (
            <Loader className="w-4 h-4 animate-spin" />
          ) : (
            <FileUp className="w-4 h-4" />
          )}
          {isUploadingDocuments ? "Đang tải tệp..." : "Tải tài liệu"}
        </button>

        {documentsError && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {documentsError}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-border">
        {isDocumentsLoading ? (
          <div className="p-4 text-sm text-muted-foreground">Đang tải tài liệu...</div>
        ) : documents.length === 0 ? (
          <div className="p-4 text-sm text-muted-foreground">
            Chưa có tài liệu nào cho trợ lý này.
          </div>
        ) : (
          documents.map((doc) => (
            <div key={doc.id} className="px-4 py-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{doc.file_name}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatBytes(doc.file_size_bytes)} • {documentStatusLabel(doc.status)}
                </p>
              </div>
              <button
                onClick={() => setPendingDeleteDocumentId(doc.id)}
                disabled={deletingDocumentId === doc.id}
                className="text-[11px] px-2 py-1 rounded-md border border-border text-muted-foreground hover:text-destructive hover:border-destructive/50 hover:bg-destructive/10 transition-colors disabled:opacity-50 shrink-0"
              >
                {deletingDocumentId === doc.id ? "Đang xóa..." : "Xóa"}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <UserLayout>
      <div className="grid grid-cols-1 lg:grid-cols-6 gap-3 sm:gap-4 lg:gap-6 h-[calc(100dvh-96px)] sm:h-[calc(100dvh-112px)] lg:h-[calc(100vh-128px)] -mx-4 sm:mx-0">
        <div className="hidden lg:block lg:col-span-1">{sessionsPanel()}</div>

        <div className={`${isDocumentsVisible ? "lg:col-span-4" : "lg:col-span-5"} flex flex-col bg-card rounded-none sm:rounded-xl border-t border-x sm:border border-border overflow-hidden`}>
          <div className="p-3 sm:p-4 border-b border-border bg-card/50">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                  {currentSession && editingSessionId === currentSession.id ? (
                    <>
                      <input
                        type="text"
                        value={editingSessionTitle}
                        onChange={(event) => setEditingSessionTitle(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault();
                            void submitRenameSession();
                          }
                          if (event.key === "Escape") {
                            event.preventDefault();
                            cancelRenameSession();
                          }
                        }}
                        disabled={renamingSessionId === currentSession.id}
                        className="h-8 w-full max-w-sm px-3 rounded-md border border-border bg-input text-foreground text-sm font-display font-bold focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50"
                        placeholder="Nhập tên phiên"
                        autoFocus
                      />
                      <button
                        onClick={() => void submitRenameSession()}
                        disabled={renamingSessionId === currentSession.id}
                        className="text-[11px] px-2 py-1 rounded-md border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 hover:bg-primary/10 transition-colors disabled:opacity-50 shrink-0"
                      >
                        {renamingSessionId === currentSession.id ? "Đang lưu..." : "Lưu"}
                      </button>
                      <button
                        onClick={cancelRenameSession}
                        disabled={renamingSessionId === currentSession.id}
                        className="text-[11px] px-2 py-1 rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors disabled:opacity-50 shrink-0"
                      >
                        Hủy
                      </button>
                    </>
                  ) : (
                    <>
                      <h2 className="font-display font-bold text-lg text-foreground truncate">
                        {currentSession?.title || "Chat"}
                      </h2>
                      {currentSession && (
                        <button
                          onClick={() => beginRenameSession(currentSession)}
                          disabled={renamingSessionId === currentSession.id || deletingSessionId === currentSession.id}
                          aria-label="Đổi tên phiên"
                          title="Đổi tên phiên"
                          className="text-[11px] px-2 py-1 rounded-md border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 hover:bg-primary/10 transition-colors disabled:opacity-50 shrink-0"
                        >
                          <PencilLine className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </>
                  )}
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Trợ lý: {profileName ?? "Đang tải tên trợ lý..."}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap justify-end shrink-0">
                <button
                  onClick={() => setIsDocumentsVisible((prev) => !prev)}
                  className="inline-flex items-center gap-2 px-2.5 sm:px-3 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted/40 transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  <span className="hidden sm:inline">
                    {isDocumentsVisible ? "Ẩn tài liệu" : "Kho tài liệu"}
                  </span>
                </button>
                <button
                  onClick={() => setIsSessionsOpen(true)}
                  className="lg:hidden inline-flex items-center gap-2 px-2.5 sm:px-3 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted/40 transition-colors"
                >
                  <PanelLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Phiên chat</span>
                </button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="inline-flex items-center justify-center px-2.5 sm:px-3 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted/40 transition-colors"
                      aria-label="Tùy chọn trợ lý"
                      title="Tùy chọn trợ lý"
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem
                      onClick={() => {
                        setAssistantError(null);
                        setAssistantIconQuery("");
                        setIsAssistantIconPickerExpanded(false);
                        setIsAssistantDialogOpen(true);
                      }}
                    >
                      <PencilLine className="w-4 h-4 mr-2" />
                      Chỉnh sửa trợ lý
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        setAssistantError(null);
                        setIsDeleteAssistantOpen(true);
                      }}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Xóa trợ lý
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
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

          {assistantError && (
            <div className="mx-6 mt-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3">
              <p className="text-sm text-destructive font-medium">{assistantError}</p>
            </div>
          )}

          {isDocumentsVisible && (
            <div className="lg:hidden px-3 sm:px-4 pt-3 pb-1 h-[38%] min-h-[200px] max-h-[320px] sm:h-[42%] sm:min-h-[240px]">
              {documentsPanel("chat-doc-upload-mobile")}
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-4">
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
                      {message.role === "user" ? (
                        "U"
                      ) : (
                        <AssistantIcon className="w-4 h-4" />
                      )}
                    </div>

                    <div
                      className={`min-w-0 max-w-[90%] sm:max-w-[85%] lg:max-w-md overflow-hidden px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg ${
                        message.role === "user"
                          ? "bg-primary text-white rounded-br-none"
                          : "bg-primary/10 border border-primary/30 text-foreground rounded-bl-none"
                      }`}
                    >
                      {message.role === "assistant" ? (
                        <div className="prose prose-sm max-w-none leading-relaxed break-words [overflow-wrap:anywhere] prose-p:my-2 prose-headings:my-2 prose-ul:my-2 prose-ol:my-2 prose-pre:my-2 prose-pre:max-w-full prose-pre:overflow-x-auto prose-code:break-all">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {message.content}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                          {message.content}
                        </div>
                      )}
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
                  <AssistantIcon className="w-4 h-4" />
                </div>
                <div className="px-4 py-3 rounded-lg bg-primary/10 border border-primary/30 rounded-bl-none">
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

          <div className="p-3 sm:p-4 border-t border-border bg-card/50">
            <div className="flex items-center gap-2 sm:gap-3">
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
                className="flex-1 h-11 px-4 py-3 rounded-lg border border-border bg-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:opacity-50"
              />
              <button
                onClick={() => void handleSendMessage()}
                disabled={isLoading || !inputValue.trim() || !activeSessionId}
                className="h-11 px-4 sm:px-6 rounded-lg bg-primary text-white font-semibold hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2 shrink-0"
              >
                {isLoading ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
            <p className="mt-2 text-center text-[11px] text-muted-foreground">
              {profileName ?? "Trợ lý này"} là trí tuệ nhân tạo nên có thể mắc lỗi. Hãy kiểm tra các thông tin quan trọng.
            </p>
          </div>
        </div>

        {isDocumentsVisible && (
          <div className="hidden lg:block lg:col-span-1">
            {documentsPanel("chat-doc-upload-desktop")}
          </div>
        )}
      </div>

      <Sheet open={isSessionsOpen} onOpenChange={setIsSessionsOpen}>
        <SheetContent side="left" className="w-[88vw] max-w-sm p-0">
          <SheetHeader className="px-4 py-3 border-b border-border">
            <SheetTitle>Danh sách phiên chat</SheetTitle>
          </SheetHeader>
          <div className="h-[calc(100dvh-64px)] p-3">{sessionsPanel(true)}</div>
        </SheetContent>
      </Sheet>

      <Dialog open={isAssistantDialogOpen} onOpenChange={setIsAssistantDialogOpen}>
        <DialogContent className="w-[calc(100vw-1rem)] sm:w-full max-w-2xl max-h-[90dvh] sm:max-h-[85vh] overflow-hidden flex flex-col p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa trợ lý</DialogTitle>
            <DialogDescription>
              Cập nhật nhanh tên, lĩnh vực, mô tả và biểu tượng trợ lý.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={handleSaveAssistant}
            className="flex min-h-0 flex-1 flex-col gap-3 sm:gap-4"
          >
            <div className="min-h-0 space-y-4 overflow-y-auto pr-0 sm:pr-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Tên trợ lý
                </label>
                <input
                  value={assistantDraft?.name ?? ""}
                  onChange={(event) =>
                    setAssistantDraft((prev) =>
                      prev ? { ...prev, name: event.target.value } : prev,
                    )
                  }
                  maxLength={120}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Lĩnh vực hỗ trợ
                  </label>
                  <input
                    value={assistantDraft?.topic ?? ""}
                    onChange={(event) =>
                      setAssistantDraft((prev) =>
                        prev ? { ...prev, topic: event.target.value } : prev,
                      )
                    }
                    maxLength={240}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Mô tả
                </label>
                <textarea
                  rows={4}
                  value={assistantDraft?.description ?? ""}
                  onChange={(event) =>
                    setAssistantDraft((prev) =>
                      prev ? { ...prev, description: event.target.value } : prev,
                    )
                  }
                  maxLength={2000}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent max-h-[28dvh] sm:max-h-[35vh] resize-y"
                />
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-semibold text-foreground">
                  Biểu tượng trợ lý
                </label>
                <div className="rounded-lg border border-border bg-card/60 p-2.5 sm:p-3 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 text-primary">
                      <SelectedAssistantIcon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {formatIconLabel(selectedAssistantIconName)}
                      </p>
                      <p className="text-xs text-muted-foreground">Icon đang chọn</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {quickAssistantIconNames.map((name) => {
                      const Icon = getProfileIconComponent(name);
                      const selected = selectedAssistantIconName === name;
                      return (
                        <button
                          key={name}
                          type="button"
                          onClick={() =>
                            setAssistantDraft((prev) =>
                              prev ? { ...prev, iconName: name } : prev,
                            )
                          }
                          className={`inline-flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-md border transition-colors ${
                            selected
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border hover:bg-muted/40"
                          }`}
                          title={formatIconLabel(name)}
                          aria-label={formatIconLabel(name)}
                        >
                          <Icon className="w-4 h-4" />
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      onClick={() => setIsAssistantIconPickerExpanded((prev) => !prev)}
                      className="inline-flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-md border border-dashed border-border text-muted-foreground hover:bg-muted/40 transition-colors"
                      title="Thêm biểu tượng"
                      aria-label="Thêm biểu tượng"
                    >
                      ...
                    </button>
                  </div>

                  {isAssistantIconPickerExpanded && (
                    <>
                      <input
                        type="text"
                        value={assistantIconQuery}
                        onChange={(event) => setAssistantIconQuery(event.target.value)}
                        placeholder="Tìm icon theo tên..."
                        className="w-full px-3 py-2 rounded-lg border border-border bg-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      />

                      <div className="max-h-56 overflow-y-auto rounded-lg border border-border p-2">
                        {assistantIconCandidates.length === 0 ? (
                          <p className="px-2 py-3 text-sm text-muted-foreground">
                            Không tìm thấy icon phù hợp.
                          </p>
                        ) : (
                          <div className="grid grid-cols-5 sm:grid-cols-8 gap-2">
                            {assistantIconCandidates.map((name) => {
                              const Icon = getProfileIconComponent(name);
                              const selected = selectedAssistantIconName === name;
                              return (
                                <button
                                  key={name}
                                  type="button"
                                  onClick={() =>
                                    setAssistantDraft((prev) =>
                                      prev ? { ...prev, iconName: name } : prev,
                                    )
                                  }
                                  className={`inline-flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-md border transition-colors ${
                                    selected
                                      ? "border-primary bg-primary/10 text-primary"
                                      : "border-border hover:bg-muted/40"
                                  }`}
                                  title={formatIconLabel(name)}
                                  aria-label={formatIconLabel(name)}
                                >
                                  <Icon className="w-4 h-4" />
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <DialogFooter className="border-t border-border pt-3 sm:pt-4 gap-2 sm:gap-0">
              <button
                type="button"
                onClick={() => setIsAssistantDialogOpen(false)}
                className="inline-flex h-10 w-full sm:w-auto items-center justify-center px-4 rounded-lg border border-border text-sm font-medium hover:bg-muted/40 transition-colors"
                disabled={isAssistantSaving}
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={!canSaveAssistant || isAssistantSaving}
                className="inline-flex h-10 w-full sm:w-auto items-center justify-center gap-2 px-4 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {isAssistantSaving ? <Loader className="w-4 h-4 animate-spin" /> : null}
                Lưu thay đổi
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteAssistantOpen} onOpenChange={setIsDeleteAssistantOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa trợ lý này?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này sẽ xóa trợ lý hiện tại và không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingAssistant}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void handleDeleteAssistant()}
              disabled={isDeletingAssistant}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeletingAssistant ? "Đang xóa..." : "Xóa trợ lý"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={Boolean(pendingDeleteSessionId)}
        onOpenChange={(open) => {
          if (!open && !deletingSessionId) {
            setPendingDeleteSessionId(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa phiên chat này?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDeleteSession
                ? `Bạn sắp xóa phiên \"${pendingDeleteSession.title}\". Hành động này không thể hoàn tác.`
                : "Bạn sắp xóa một phiên chat. Hành động này không thể hoàn tác."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={Boolean(deletingSessionId)}>
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void handleDeleteSession()}
              disabled={Boolean(deletingSessionId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletingSessionId ? "Đang xóa..." : "Xóa phiên chat"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={Boolean(pendingDeleteDocumentId)}
        onOpenChange={(open) => {
          if (!open && !deletingDocumentId) {
            setPendingDeleteDocumentId(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa tài liệu này?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDeleteDocument
                ? `Bạn sắp xóa tài liệu \"${pendingDeleteDocument.file_name}\". Hành động này không thể hoàn tác.`
                : "Bạn sắp xóa một tài liệu. Hành động này không thể hoàn tác."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={Boolean(deletingDocumentId)}>
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void handleDeleteDocument()}
              disabled={Boolean(deletingDocumentId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletingDocumentId ? "Đang xóa..." : "Xóa tài liệu"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </UserLayout>
  );
};

export default AppChat;
