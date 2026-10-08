# SkyNudge backend setup

This FastAPI project is intentionally limited to database initialization, checks, and health monitoring. The React frontend should communicate with Supabase directly using Supabase Auth, RLS, Storage, Realtime, and SQL RPC functions. There are no custom sign-in or user-data HTTP endpoints.

## Important security rules

- Put your connection string only in `.env`; it is ignored by Git.
- Use the **Session pooler** connection string from **Supabase Dashboard → Connect**. The direct connection often requires IPv6 and can fail on home networks.
- Ensure the URL ends with `sslmode=require` (the Python code adds it if omitted).
- Use the database password only in your local `.env`. Do not use a Supabase publishable key or service-role key as `DATABASE_URL`.
- The database role bypasses RLS, so this FastAPI service deliberately exposes no user-data APIs.

## 1. Configure `.env`

Copy the Session pooler URL into `BackEnd/.env` and replace its empty value:

```env
DATABASE_URL=postgresql://...your-session-pooler-url...?sslmode=require
RUN_DB_INIT_ON_STARTUP=true
```

If the password contains special characters, URL-encode it first:

```powershell
python encode_password.py
```

The password prompt is hidden; only the encoded value is printed.

## Windows PowerShell

From `C:\Users\thusi\OneDrive\Desktop\La Trobe\La trobe Sem 3\vibe coding\A2\SkyNudgeN\BackEnd`:

```powershell
py -3.11 -m venv .venv
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python test_database_connection.py
python database.py
python check_tables.py
uvicorn main:app --reload
```

Open the FastAPI documentation at `http://127.0.0.1:8000/docs`.

## macOS / Linux

From the `BackEnd` directory:

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
python test_database_connection.py
python database.py
python check_tables.py
uvicorn main:app --reload
```

Open the FastAPI documentation at `http://127.0.0.1:8000/docs`.

## Expected results

After `.env` is configured and the Supabase database accepts the Session pooler connection:

```text
Database connection successful
Database initialization completed successfully
Table found: public.profiles
RLS enabled: public.profiles
...
Trigger found: auth.users.on_auth_user_created
Trigger test passed: auth user created an anonymous profile
```

`check_tables.py` inserts a temporary Auth user inside a transaction, verifies the matching anonymous profile, and rolls the transaction back. No test user remains.

## Schema highlights

- The full idempotent schema lives in `sql/schema.sql`; `database.py` executes that exact file in a transaction.
- Auth-user inserts create a `public.profiles` row with a collision-retried anonymous username.
- RLS is enabled on every application table.
- `verification_requests` are never readable by browser clients; sensitive details are cleared after an administrative decision.
- Browser clients create/read nudges through RPC functions, not direct writes.
- `nudge_pings` is the only application table added to Supabase Realtime.
- The SQL attempts to enable `pg_cron` and gracefully continues if it is unavailable.