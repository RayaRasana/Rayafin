# Backend Script - Quick Reference

## One-Line Startup

```bash
python run_backend.py
```

## What It Does (In Order)

1. ✓ **Validates Python** (3.11 or 3.12 required)
2. ✓ **Creates virtual environment** (.venv)
3. ✓ **Installs dependencies** from requirements.txt
4. ✓ **Sets up PostgreSQL database** and applies schema
5. ✓ **Runs sanity tests** (imports, CRUD, commission snapshots, audits)
6. ✓ **Starts FastAPI server** at http://127.0.0.1:8000

## Result

```
🎉 Backend is ready and running at http://127.0.0.1:8000

Access points:
- API: http://127.0.0.1:8000
- Swagger UI: http://127.0.0.1:8000/docs
- ReDoc: http://127.0.0.1:8000/redoc
```

## Prerequisites

- **Python 3.11 or 3.12** installed
- **PostgreSQL running** locally (default: localhost:5432)
- **`.env` file** configured (or use defaults)

## Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| Python not found | Install Python 3.11 or 3.12 |
| PostgreSQL error | Verify PostgreSQL is running |
| psycopg fails | Wait for Rust auto-installation |
| .venv corruption | Delete .venv folder, rerun script |
| Port 8000 in use | Change in backend/app/main.py |

## Accessing the API

After server starts:

```bash
# In another terminal - test API
curl -X GET http://127.0.0.1:8000/docs

# List companies
curl -X GET http://127.0.0.1:8000/companies

# Create company
curl -X POST http://127.0.0.1:8000/companies \
  -H "Content-Type: application/json" \
  -d '{"name":"Acme Corp"}'
```

## Manual Activation (If Needed)

```bash
# Windows PowerShell
.\.venv\Scripts\Activate.ps1

# Linux/macOS
source .venv/bin/activate

# Then run:
uvicorn backend.app.main:app --reload
```

## Database Connection

```bash
# Connect to database
psql -U postgres -h localhost -d rr_accounting

# View tables
\dt
```

## Stopping the Server

```
Press Ctrl+C in the terminal
```

## File Structure Expected

```
Rayafin/
├── run_backend.py              ← Current script
├── requirements.txt
├── schema_corrected.sql
├── .env
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   └── models.py
│   └── __init__.py
└── frontend/
```

## Environment Variables (.env)

```ini
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
DB_PORT=5432
DB_NAME=rr_accounting
```

## Full Documentation

See **RUN_BACKEND_GUIDE.md** for comprehensive guide with troubleshooting.

---

**Quick Start**: `python run_backend.py`  
**Docs**: http://127.0.0.1:8000/docs (after startup)
