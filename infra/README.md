# Infrastructure

Local development dependencies:

- PostgreSQL with pgvector
- Redis
- MinIO

## Run

```bash
docker compose -f infra/docker-compose.yml up -d
```

Ports:

- Postgres: `5435`
- Redis: `6380`
- MinIO API: `9000`
- MinIO Console: `9001`
