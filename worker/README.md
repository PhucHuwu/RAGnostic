# Worker

Async ingest worker skeleton for document pipeline:

1. parse (Docling)
2. chunk
3. index

## Run

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -e .[dev]
python -m worker_app.main
```
