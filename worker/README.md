# Worker

Async ingest worker skeleton for document pipeline:

1. parse (Docling)
2. chunk
3. index

## Run with uvx

```bash
uvx --from pip pip --python .venv/bin/python install -e ".[dev]"
.venv/bin/python -m worker_app.main
```
