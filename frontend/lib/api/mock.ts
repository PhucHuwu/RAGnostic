import type { AuthTokens, AuthUser, ChatMessage, ChatSession, DocumentStatus } from "@/lib/types";
import type {
  ApiService,
  AdminSystemModel,
  AdminUser,
  DocumentItem,
  Profile,
  ProfileInput
} from "@/lib/api/client";

type MockState = {
  users: AdminUser[];
  currentUser: AuthUser;
  profiles: Profile[];
  documents: Record<string, DocumentItem[]>;
  sessions: Record<string, ChatSession[]>;
  messages: Record<string, ChatMessage[]>;
  model: AdminSystemModel;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const id = () => Math.random().toString(36).slice(2, 10);

const now = () => new Date().toISOString();

let state: MockState = {
  users: [
    { id: "u-admin", username: "admin", role: "ADMIN", status: "ACTIVE", createdAt: now() },
    { id: "u-user", username: "user", role: "USER", status: "ACTIVE", createdAt: now() }
  ],
  currentUser: { id: "u-user", username: "user", role: "USER" },
  profiles: [
    {
      id: "p-general",
      name: "General Assistant",
      topic: "General",
      description: "Ho tro tra loi tong quat",
      chunkStrategy: "SEMANTIC",
      topK: 8,
      rerankTopN: 4
    }
  ],
  documents: {
    "p-general": [
      {
        id: "d-welcome",
        fileName: "onboarding.pdf",
        status: "READY",
        uploadedAt: now()
      }
    ]
  },
  sessions: {
    "p-general": [
      {
        id: "s-demo",
        title: "Demo session",
        status: "ACTIVE",
        lastMessageAt: now()
      }
    ]
  },
  messages: {
    "s-demo": [
      { id: "m-1", role: "USER", content: "Tom tat he thong RAGnostic", createdAt: now() },
      {
        id: "m-2",
        role: "ASSISTANT",
        content:
          "# RAGnostic\n\nRAGnostic ho tro da profile, ingest tai lieu va truy xuat tri thuc voi BM25 re-ranking.",
        createdAt: now()
      }
    ]
  },
  model: {
    provider: "openrouter",
    modelName: "nvidia/nemotron-3-super-120b-a12b:free",
    temperature: 0.2,
    maxTokens: 2048
  }
};

const resolveStatus = (): DocumentStatus => {
  const statuses: DocumentStatus[] = ["UPLOADED", "PARSING", "CHUNKING", "INDEXING", "READY"];
  return statuses[Math.min(Math.floor(Math.random() * statuses.length), statuses.length - 1)];
};

export const mockApi: ApiService = {
  async login(input): Promise<{ tokens: AuthTokens; user: AuthUser }> {
    await sleep(250);
    const role = input.username === "admin" ? "ADMIN" : "USER";
    state.currentUser = {
      id: role === "ADMIN" ? "u-admin" : "u-user",
      username: input.username,
      role
    };
    return {
      tokens: {
        accessToken: `mock_access_${id()}`,
        refreshToken: `mock_refresh_${id()}`
      },
      user: state.currentUser
    };
  },

  async me() {
    await sleep(180);
    return state.currentUser;
  },

  async logout() {
    await sleep(120);
  },

  async listProfiles() {
    await sleep(220);
    return [...state.profiles];
  },

  async createProfile(input: ProfileInput) {
    await sleep(280);
    const profile: Profile = { id: `p-${id()}`, ...input };
    state.profiles = [profile, ...state.profiles];
    state.documents[profile.id] = [];
    state.sessions[profile.id] = [];
    return profile;
  },

  async updateProfile(profileId: string, input: Partial<ProfileInput>) {
    await sleep(220);
    state.profiles = state.profiles.map((item) =>
      item.id === profileId ? { ...item, ...input } : item
    );
    const profile = state.profiles.find((item) => item.id === profileId);
    if (!profile) {
      throw new Error("Profile not found");
    }
    return profile;
  },

  async deleteProfile(profileId: string) {
    await sleep(200);
    state.profiles = state.profiles.filter((item) => item.id !== profileId);
    delete state.documents[profileId];
    delete state.sessions[profileId];
  },

  async listDocuments(profileId: string) {
    await sleep(200);
    return [...(state.documents[profileId] ?? [])];
  },

  async uploadDocument(profileId: string, file: File) {
    await sleep(350);
    const next: DocumentItem = {
      id: `d-${id()}`,
      fileName: file.name,
      status: resolveStatus(),
      uploadedAt: now()
    };
    state.documents[profileId] = [next, ...(state.documents[profileId] ?? [])];
    return { document_id: next.id, status: next.status };
  },

  async previewDocument(documentId: string) {
    await sleep(180);
    return {
      content: `# Preview ${documentId}\n\nNoi dung parse/chunk mock de test giao dien xem truoc.`
    };
  },

  async deleteDocument(documentId: string) {
    await sleep(160);
    Object.keys(state.documents).forEach((key) => {
      state.documents[key] = state.documents[key].filter((doc) => doc.id !== documentId);
    });
  },

  async createSession(profileId: string) {
    await sleep(220);
    const session: ChatSession = {
      id: `s-${id()}`,
      title: "New session",
      status: "ACTIVE",
      lastMessageAt: now()
    };
    state.sessions[profileId] = [session, ...(state.sessions[profileId] ?? [])];
    state.messages[session.id] = [];
    return session;
  },

  async listSessions(profileId: string) {
    await sleep(180);
    return [...(state.sessions[profileId] ?? [])];
  },

  async listMessages(sessionId: string) {
    await sleep(180);
    return [...(state.messages[sessionId] ?? [])];
  },

  async sendMessage(sessionId: string, content: string) {
    await sleep(700);
    const userMessage: ChatMessage = {
      id: `m-${id()}`,
      role: "USER",
      content,
      createdAt: now()
    };
    const assistantMessage: ChatMessage = {
      id: `m-${id()}`,
      role: "ASSISTANT",
      content: `## Phan hoi\n\nBan vua hoi: **${content}**\n\n- Memory window: 10 user turns\n- BM25 re-rank: enabled`,
      createdAt: now()
    };
    state.messages[sessionId] = [
      ...(state.messages[sessionId] ?? []),
      userMessage,
      assistantMessage
    ];

    return assistantMessage;
  },

  async listAdminUsers() {
    await sleep(240);
    return [...state.users];
  },

  async createAdminUser(input: { username: string; role: "USER" | "ADMIN"; password: string }) {
    await sleep(260);
    const user: AdminUser = {
      id: `u-${id()}`,
      username: input.username,
      role: input.role,
      status: "ACTIVE",
      createdAt: now()
    };
    state.users = [user, ...state.users];
    return user;
  },

  async updateAdminUser(userId: string, input: Partial<Pick<AdminUser, "role" | "status">>) {
    await sleep(220);
    state.users = state.users.map((item) => (item.id === userId ? { ...item, ...input } : item));
    const user = state.users.find((item) => item.id === userId);
    if (!user) {
      throw new Error("User not found");
    }
    return user;
  },

  async resetAdminPassword() {
    await sleep(260);
    return { password: `temp-${id()}` };
  },

  async listAdminDocuments() {
    await sleep(220);
    return Object.values(state.documents).flat();
  },

  async deleteAdminDocument(documentId: string) {
    return this.deleteDocument(documentId);
  },

  async getSystemModel() {
    await sleep(180);
    return state.model;
  },

  async updateSystemModel(input: AdminSystemModel) {
    await sleep(200);
    state.model = input;
    return state.model;
  }
};
