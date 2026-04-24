import {
  clearAuthSession,
  getAccessToken,
  getRefreshToken,
  updateAccessToken,
} from "@/lib/auth";

export class ApiError extends Error {
  status: number;
  code?: string;
  details?: unknown;

  constructor(
    message: string,
    status: number,
    code?: string,
    details?: unknown,
  ) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

function getApiBaseUrl() {
  return process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";
}

function joinUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getApiBaseUrl()}${normalizedPath}`;
}

type HttpMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

interface RequestOptions {
  method?: HttpMethod;
  body?: unknown;
  headers?: Record<string, string>;
  auth?: boolean;
  isFormData?: boolean;
  timeoutMs?: number;
}

async function refreshAccessToken() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    return false;
  }

  const response = await fetch(joinUrl("/auth/refresh"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  if (!response.ok) {
    clearAuthSession();
    return false;
  }

  const payload = (await response.json()) as {
    access_token: string;
    refresh_token: string;
  };
  updateAccessToken(payload.access_token, payload.refresh_token);
  return true;
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const {
    method = "GET",
    body,
    headers = {},
    auth = true,
    isFormData = false,
    timeoutMs,
  } = options;

  const requestHeaders: Record<string, string> = { ...headers };
  if (!isFormData) {
    requestHeaders["Content-Type"] = "application/json";
  }

  if (auth) {
    const token = getAccessToken();
    if (token) {
      requestHeaders.Authorization = `Bearer ${token}`;
    }
  }

  const requestBody = body
    ? isFormData
      ? (body as BodyInit)
      : JSON.stringify(body)
    : undefined;

  const runRequest = async () => {
    const controller = timeoutMs ? new AbortController() : undefined;
    const timeoutId =
      timeoutMs && controller
        ? setTimeout(() => controller.abort(), timeoutMs)
        : undefined;

    try {
      return await fetch(joinUrl(path), {
        method,
        headers: requestHeaders,
        body: requestBody,
        signal: controller?.signal,
      });
    } catch (error) {
      if (
        timeoutMs &&
        error instanceof DOMException &&
        error.name === "AbortError"
      ) {
        throw new ApiError(
          "Yeu cau qua thoi gian cho phep, vui long thu lai voi tep nho hon.",
          408,
          "REQUEST_TIMEOUT",
        );
      }
      throw error;
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }
  };

  let response = await runRequest();

  if (response.status === 401 && auth) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      const nextToken = getAccessToken();
      if (nextToken) {
        requestHeaders.Authorization = `Bearer ${nextToken}`;
      }
      response = await runRequest();
    }
  }

  if (!response.ok) {
    const errorPayload = (await response.json().catch(() => null)) as {
      message?: string;
      code?: string;
      details?: unknown;
    } | null;

    throw new ApiError(
      errorPayload?.message ?? `Request failed with status ${response.status}`,
      response.status,
      errorPayload?.code,
      errorPayload?.details,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export interface LoginPayload {
  access_token: string;
  refresh_token: string;
  user: {
    id: string;
    username: string;
    role: "ADMIN" | "USER";
  };
}

export interface RegisterPayload {
  id: string;
  username: string;
  role: "ADMIN" | "USER";
}

export interface ProfileResponse {
  id: string;
  user_id: string;
  name: string;
  topic: string;
  description: string | null;
  icon_name: string;
  model_override: string | null;
  chunk_strategy: string;
  chunk_size: number;
  chunk_overlap: number;
  top_k: number;
  rerank_top_n: number;
  temperature: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProfileCreatePayload {
  name: string;
  topic: string;
  description?: string;
  icon_name?: string;
}

export interface ProfileUpdatePayload {
  name?: string;
  topic?: string;
  description?: string;
  icon_name?: string;
  model_override?: string;
  chunk_strategy?: string;
  chunk_size?: number;
  chunk_overlap?: number;
  top_k?: number;
  rerank_top_n?: number;
  temperature?: number;
  is_active?: boolean;
}

export interface DocumentResponse {
  id: string;
  owner_user_id: string;
  profile_id: string;
  file_name: string;
  file_ext: string;
  mime_type: string;
  file_size_bytes: number;
  storage_bucket: string;
  storage_key: string;
  checksum_sha256: string;
  status:
    | "UPLOADED"
    | "PARSING"
    | "CHUNKING"
    | "INDEXING"
    | "READY"
    | "FAILED"
    | "DELETED";
  chunk_count: number;
  error_message: string | null;
  uploaded_at: string;
  updated_at: string;
}

export interface DocumentPreviewResponse {
  document_id: string;
  profile_id: string;
  preview: string;
}

export interface DocumentChunkDetailResponse {
  id: string;
  chunk_index: number;
  token_count: number;
  char_count: number;
  section_title: string | null;
  page_no: number | null;
  source_ref: string | null;
  chunk_hash: string;
  content: string;
}

export interface DocumentChunksResponse {
  document_id: string;
  profile_id: string;
  total_chunks: number;
  strategy: string | null;
  items: DocumentChunkDetailResponse[];
}

export interface ChatSessionResponse {
  id: string;
  profile_id: string;
  user_id: string;
  title: string;
  status: string;
  started_at: string;
  last_message_at: string | null;
}

export interface ChatMessageResponse {
  id: string;
  session_id: string;
  role: "USER" | "ASSISTANT";
  content_md: string;
  content_text: string;
  seq_no: number;
  request_id: string | null;
  latency_ms: number | null;
  prompt_tokens: number | null;
  completion_tokens: number | null;
  total_tokens: number | null;
  created_at: string;
}

export interface AdminUserResponse {
  id: string;
  username: string;
  email: string | null;
  role: "ADMIN" | "USER";
  status: "ACTIVE" | "LOCKED" | "DISABLED";
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export type AdminUserStatus = "ACTIVE" | "LOCKED" | "DISABLED";

export interface LogsSearchResponse {
  items: Array<{
    timestamp: string;
    level: "INFO" | "WARNING" | "ERROR" | "DEBUG" | "CRITICAL";
    service: string;
    event: string;
    message: string;
    request_id: string | null;
    session_id: string | null;
    user_id: string | null;
  }>;
}

export function login(username: string, password: string) {
  return apiRequest<LoginPayload>("/auth/login", {
    method: "POST",
    auth: false,
    body: { username, password },
  });
}

export function register(username: string, password: string, email?: string) {
  return apiRequest<RegisterPayload>("/auth/register", {
    method: "POST",
    auth: false,
    body: {
      username,
      password,
      email,
    },
  });
}

export function logout() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    return Promise.resolve({ message: "Logged out" });
  }

  return apiRequest<{ message: string }>("/auth/logout", {
    method: "POST",
    body: { refresh_token: refreshToken },
  });
}

export function listProfiles() {
  return apiRequest<ProfileResponse[]>("/profiles");
}

export function createProfile(payload: ProfileCreatePayload) {
  return apiRequest<ProfileResponse>("/profiles", {
    method: "POST",
    body: payload,
  });
}

export function getProfile(profileId: string) {
  return apiRequest<ProfileResponse>(`/profiles/${profileId}`);
}

export function updateProfile(
  profileId: string,
  payload: ProfileUpdatePayload,
) {
  return apiRequest<ProfileResponse>(`/profiles/${profileId}`, {
    method: "PATCH",
    body: payload,
  });
}

export function deleteProfile(profileId: string) {
  return apiRequest<{ message: string }>(`/profiles/${profileId}`, {
    method: "DELETE",
  });
}

export function listDocuments(profileId: string) {
  return apiRequest<DocumentResponse[]>(`/profiles/${profileId}/documents`);
}

export function uploadDocument(profileId: string, file: File) {
  const formData = new FormData();
  formData.append("file", file);
  return apiRequest<DocumentResponse>(
    `/profiles/${profileId}/documents/upload`,
    {
      method: "POST",
      body: formData,
      isFormData: true,
      timeoutMs: 120000,
    },
  );
}

export function deleteDocument(documentId: string) {
  return apiRequest<{ message: string }>(`/documents/${documentId}`, {
    method: "DELETE",
  });
}

export function previewDocument(documentId: string) {
  return apiRequest<DocumentPreviewResponse>(`/documents/${documentId}/preview`);
}

export function getDocumentChunks(documentId: string) {
  return apiRequest<DocumentChunksResponse>(`/documents/${documentId}/chunks`);
}

export function listChatSessions(profileId: string) {
  return apiRequest<ChatSessionResponse[]>(`/profiles/${profileId}/sessions`);
}

export function createChatSession(profileId: string, title: string) {
  return apiRequest<ChatSessionResponse>(`/profiles/${profileId}/sessions`, {
    method: "POST",
    body: { title },
  });
}

export function deleteChatSession(sessionId: string) {
  return apiRequest<{ message: string }>(`/sessions/${sessionId}`, {
    method: "DELETE",
  });
}

export function listMessages(sessionId: string) {
  return apiRequest<{
    items: ChatMessageResponse[];
    next_cursor: number | null;
  }>(`/sessions/${sessionId}/messages`);
}

export function sendMessage(sessionId: string, content: string) {
  return apiRequest<{
    user_message: ChatMessageResponse;
    assistant_message: ChatMessageResponse;
  }>(`/sessions/${sessionId}/messages`, {
    method: "POST",
    body: { content, stream: false },
  });
}

export function listAdminUsers() {
  return apiRequest<AdminUserResponse[]>("/admin/users");
}

export function updateAdminUserRole(userId: string, role: "ADMIN" | "USER") {
  return apiRequest<{ id: string; role: "ADMIN" | "USER"; status: string }>(
    `/admin/users/${userId}`,
    {
      method: "PATCH",
      body: { role },
    },
  );
}

export function updateAdminUserStatus(userId: string, status: AdminUserStatus) {
  return apiRequest<{
    id: string;
    role: "ADMIN" | "USER";
    status: AdminUserStatus;
  }>(`/admin/users/${userId}`, {
    method: "PATCH",
    body: { status },
  });
}

export function resetAdminUserPassword(userId: string, newPassword: string) {
  return apiRequest<{ message: string }>(
    `/admin/users/${userId}/reset-password`,
    {
      method: "POST",
      body: { new_password: newPassword },
    },
  );
}

export function listAdminDocuments() {
  return apiRequest<DocumentResponse[]>("/admin/documents");
}

export function deleteAdminDocument(documentId: string) {
  return apiRequest<{ message: string }>(`/admin/documents/${documentId}`, {
    method: "DELETE",
  });
}

export function getModelConfig() {
  return apiRequest<{
    provider: string;
    model_name: string;
    params: Record<string, unknown>;
  }>("/admin/system-config/model");
}

export function updateModelConfig(payload: {
  provider: string;
  model_name: string;
  params: Record<string, unknown>;
}) {
  return apiRequest<{
    provider: string;
    model_name: string;
    params: Record<string, unknown>;
  }>("/admin/system-config/model", {
    method: "PUT",
    body: payload,
  });
}

export function searchLogs(params: {
  level?: string;
  service?: string;
  q?: string;
  request_id?: string;
  session_id?: string;
  user_id?: string;
}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      query.set(key, value);
    }
  });
  const suffix = query.toString() ? `?${query.toString()}` : "";
  return apiRequest<LogsSearchResponse>(`/admin/logs/search${suffix}`);
}
