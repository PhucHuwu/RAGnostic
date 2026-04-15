import { apiClient } from "@/lib/api/client";
import { mockApi } from "@/lib/api/mock";
import { env } from "@/lib/env";

export const api = env.enableMocks ? mockApi : apiClient;
