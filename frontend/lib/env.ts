const getRequiredEnv = (key: string, fallback?: string) => {
  const value = process.env[key] ?? fallback;

  if (!value) {
    throw new Error(`Missing environment variable: ${key}`);
  }

  return value;
};

export const env = {
  apiBaseUrl: getRequiredEnv("NEXT_PUBLIC_API_BASE_URL", "http://localhost:8000/api/v1"),
  enableMocks: process.env.NEXT_PUBLIC_ENABLE_MOCKS === "true"
};
