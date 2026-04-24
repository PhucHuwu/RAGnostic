# Worker

Async ingest worker skeleton for document pipeline:

1. parse (Docling)
2. chunk
3. index

## Contents

- [Run with uvx](#run-with-uvx)

## Run with uvx

From the `worker/` directory:

```bash
uvx --from pip pip --python .venv/bin/python install -e ".[dev]"
.venv/bin/python -m worker_app.main
```
