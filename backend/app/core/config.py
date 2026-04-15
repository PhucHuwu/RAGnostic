from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "RAGnostic"
    app_env: str = "local"
    api_v1_prefix: str = "/api/v1"
    service_name: str = "rag-api"
    log_level: str = "INFO"
    backend_cors_origins: str = "http://localhost:3000"

    jwt_secret: str = "change_me"
    jwt_access_expires_minutes: int = 30
    jwt_refresh_expires_days: int = 7

    postgres_host: str = "localhost"
    postgres_port: int = 5432
    postgres_db: str = "ragnostic"
    postgres_user: str = "ragnostic"
    postgres_password: str = "ragnostic"

    memory_window: int = 10

    upload_max_size_bytes: int = 10 * 1024 * 1024
    upload_allowed_exts: tuple[str, ...] = ("pdf", "docx", "txt")

    openrouter_model: str = "nvidia/nemotron-3-super-120b-a12b:free"

    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.backend_cors_origins.split(",") if origin.strip()]

    def database_url(self) -> str:
        return (
            f"postgresql+psycopg://{self.postgres_user}:{self.postgres_password}"
            f"@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
        )


settings = Settings()
