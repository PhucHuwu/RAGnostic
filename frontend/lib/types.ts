export type UserRole = "USER" | "ADMIN";

export type AuthUser = {
  id: string;
  username: string;
  role: UserRole;
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export type ApiErrorPayload = {
  code?: string;
  message?: string;
  details?: Record<string, unknown>;
  request_id?: string;
};

export type DocumentStatus = "UPLOADED" | "PARSING" | "CHUNKING" | "INDEXING" | "READY" | "FAILED";

export type ChatSession = {
  id: string;
  title: string;
  status: "ACTIVE" | "ARCHIVED" | "CLOSED";
  lastMessageAt: string;
};

export type ChatMessage = {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  createdAt: string;
};
