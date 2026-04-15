import { env } from "@/lib/env";
import { tokenStore } from "@/lib/token-store";
import type {
  ApiErrorPayload,
  AuthTokens,
  AuthUser,
  ChatMessage,
  ChatSession,
  DocumentStatus
} from "@/lib/types";

type RequestOptions = RequestInit & {
  withAuth?: boolean;
};

type Profile = {
  id: string;
  name: string;
  topic: string;
  description: string;
  chunkStrategy: "OUTLINE" | "PARAGRAPH" | "SEMANTIC" | "CHARACTER";
  topK: number;
  rerankTopN: number;
};

type ProfileInput = Omit<Profile, "id">;

type DocumentItem = {
  id: string;
  fileName: string;
  status: DocumentStatus;
  uploadedAt: string;
};

type AdminUser = {
  id: string;
  username: string;
  role: "USER" | "ADMIN";
  status: "ACTIVE" | "LOCKED" | "DISABLED";
  createdAt: string;
};

type AdminSystemModel = {
  provider: string;
  modelName: string;
  temperature: number;
  maxTokens: number;
};

type LoginPayload = {
  username: string;
  password: string;
};

type LoginResponse = {
  access_token: string;
  refresh_token: string;
  user: {
    id: string;
    username: string;
    role: "USER" | "ADMIN";
  };
};

let refreshInFlight: Promise<string | null> | null = null;

export class ApiError extends Error {
  status: number;
  payload: ApiErrorPayload | null;

  constructor(status: number, payload: ApiErrorPayload | null) {
    super(payload?.message ?? "Request failed");
    this.status = status;
    this.payload = payload;
  }
}

type ApiService = {
  login: (input: LoginPayload) => Promise<{ tokens: AuthTokens; user: AuthUser }>;
  logout: () => Promise<void>;
  me: () => Promise<AuthUser>;
  listProfiles: () => Promise<Profile[]>;
  createProfile: (input: ProfileInput) => Promise<Profile>;
  updateProfile: (profileId: string, input: Partial<ProfileInput>) => Promise<Profile>;
  deleteProfile: (profileId: string) => Promise<void>;
  listDocuments: (profileId: string) => Promise<DocumentItem[]>;
  uploadDocument: (
    profileId: string,
    file: File
  ) => Promise<{ document_id: string; status: DocumentStatus }>;
  previewDocument: (documentId: string) => Promise<{ content: string }>;
  deleteDocument: (documentId: string) => Promise<void>;
  createSession: (profileId: string) => Promise<ChatSession>;
  listSessions: (profileId: string) => Promise<ChatSession[]>;
  listMessages: (sessionId: string) => Promise<ChatMessage[]>;
  sendMessage: (sessionId: string, content: string) => Promise<ChatMessage>;
  listAdminUsers: () => Promise<AdminUser[]>;
  createAdminUser: (input: {
    username: string;
    role: "USER" | "ADMIN";
    password: string;
  }) => Promise<AdminUser>;
  updateAdminUser: (
    userId: string,
    input: Partial<Pick<AdminUser, "role" | "status">>
  ) => Promise<AdminUser>;
  resetAdminPassword: (userId: string) => Promise<{ password: string }>;
  listAdminDocuments: () => Promise<DocumentItem[]>;
  deleteAdminDocument: (documentId: string) => Promise<void>;
  getSystemModel: () => Promise<AdminSystemModel>;
  updateSystemModel: (input: AdminSystemModel) => Promise<AdminSystemModel>;
};

const parseErrorPayload = async (response: Response): Promise<ApiErrorPayload | null> => {
  try {
    return (await response.json()) as ApiErrorPayload;
  } catch {
    return null;
  }
};

const withBaseUrl = (path: string) => {
  if (path.startsWith("http")) {
    return path;
  }

  return `${env.apiBaseUrl}${path.startsWith("/") ? path : `/${path}`}`;
};

const refreshAccessToken = async () => {
  if (refreshInFlight) {
    return refreshInFlight;
  }

  refreshInFlight = (async () => {
    const tokens = tokenStore.get();

    if (!tokens) {
      return null;
    }

    const response = await fetch(withBaseUrl("/auth/refresh"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ refresh_token: tokens.refreshToken })
    });

    if (!response.ok) {
      tokenStore.clear();
      return null;
    }

    const payload = (await response.json()) as { access_token: string; refresh_token?: string };
    const nextTokens: AuthTokens = {
      accessToken: payload.access_token,
      refreshToken: payload.refresh_token ?? tokens.refreshToken
    };

    tokenStore.set(nextTokens);

    return nextTokens.accessToken;
  })();

  const result = await refreshInFlight;
  refreshInFlight = null;
  return result;
};

const request = async <T>(path: string, options: RequestOptions = {}): Promise<T> => {
  const { withAuth = true, headers, ...rest } = options;
  const tokens = tokenStore.get();
  const requestHeaders = new Headers(headers);

  if (!requestHeaders.has("Content-Type") && !(rest.body instanceof FormData)) {
    requestHeaders.set("Content-Type", "application/json");
  }

  if (withAuth && tokens?.accessToken) {
    requestHeaders.set("Authorization", `Bearer ${tokens.accessToken}`);
  }

  const execute = async () =>
    fetch(withBaseUrl(path), {
      ...rest,
      headers: requestHeaders
    });

  let response = await execute();

  if (response.status === 401 && withAuth && tokens?.refreshToken) {
    const nextAccessToken = await refreshAccessToken();

    if (nextAccessToken) {
      requestHeaders.set("Authorization", `Bearer ${nextAccessToken}`);
      response = await execute();
    }
  }

  if (!response.ok) {
    const payload = await parseErrorPayload(response);
    throw new ApiError(response.status, payload);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
};

const mapLoginResponse = (payload: LoginResponse) => ({
  tokens: {
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token
  },
  user: payload.user
});

export const apiClient: ApiService = {
  async login(input: LoginPayload): Promise<{ tokens: AuthTokens; user: AuthUser }> {
    const payload = await request<LoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(input),
      withAuth: false
    });

    return mapLoginResponse(payload);
  },

  async logout() {
    const tokens = tokenStore.get();

    await request<void>("/auth/logout", {
      method: "POST",
      body: JSON.stringify({ refresh_token: tokens?.refreshToken })
    });
  },

  me() {
    return request<AuthUser>("/auth/me");
  },

  listProfiles() {
    return request<Profile[]>("/profiles");
  },

  createProfile(input: ProfileInput) {
    return request<Profile>("/profiles", {
      method: "POST",
      body: JSON.stringify(input)
    });
  },

  updateProfile(profileId: string, input: Partial<ProfileInput>) {
    return request<Profile>(`/profiles/${profileId}`, {
      method: "PATCH",
      body: JSON.stringify(input)
    });
  },

  deleteProfile(profileId: string) {
    return request<void>(`/profiles/${profileId}`, {
      method: "DELETE"
    });
  },

  listDocuments(profileId: string) {
    return request<DocumentItem[]>(`/profiles/${profileId}/documents`);
  },

  uploadDocument(profileId: string, file: File) {
    const formData = new FormData();
    formData.append("file", file);

    return request<{ document_id: string; status: DocumentStatus }>(
      `/profiles/${profileId}/documents/upload`,
      {
        method: "POST",
        body: formData
      }
    );
  },

  previewDocument(documentId: string) {
    return request<{ content: string }>(`/documents/${documentId}/preview`);
  },

  deleteDocument(documentId: string) {
    return request<void>(`/documents/${documentId}`, {
      method: "DELETE"
    });
  },

  createSession(profileId: string) {
    return request<ChatSession>(`/profiles/${profileId}/sessions`, {
      method: "POST"
    });
  },

  listSessions(profileId: string) {
    return request<ChatSession[]>(`/profiles/${profileId}/sessions`);
  },

  listMessages(sessionId: string) {
    return request<ChatMessage[]>(`/sessions/${sessionId}/messages`);
  },

  sendMessage(sessionId: string, content: string) {
    return request<ChatMessage>(`/sessions/${sessionId}/messages`, {
      method: "POST",
      body: JSON.stringify({ content, stream: false })
    });
  },

  listAdminUsers() {
    return request<AdminUser[]>("/admin/users");
  },

  createAdminUser(input: { username: string; role: "USER" | "ADMIN"; password: string }) {
    return request<AdminUser>("/admin/users", {
      method: "POST",
      body: JSON.stringify(input)
    });
  },

  updateAdminUser(userId: string, input: Partial<Pick<AdminUser, "role" | "status">>) {
    return request<AdminUser>(`/admin/users/${userId}`, {
      method: "PATCH",
      body: JSON.stringify(input)
    });
  },

  resetAdminPassword(userId: string) {
    return request<{ password: string }>(`/admin/users/${userId}/reset-password`, {
      method: "POST"
    });
  },

  listAdminDocuments() {
    return request<DocumentItem[]>("/admin/documents");
  },

  deleteAdminDocument(documentId: string) {
    return request<void>(`/admin/documents/${documentId}`, {
      method: "DELETE"
    });
  },

  getSystemModel() {
    return request<AdminSystemModel>("/admin/system-config/model");
  },

  updateSystemModel(input: AdminSystemModel) {
    return request<AdminSystemModel>("/admin/system-config/model", {
      method: "PUT",
      body: JSON.stringify({
        provider: input.provider,
        model_name: input.modelName,
        params: {
          temperature: input.temperature,
          max_tokens: input.maxTokens
        }
      })
    });
  }
};

export type { Profile, ProfileInput, DocumentItem, AdminUser, AdminSystemModel };
export type { ApiService };
