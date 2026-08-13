# Environment Variables Reference

This document serves as the authoritative source of truth for all environment variables used in the **HazelWhat** application.

> [!IMPORTANT]
> **Policy**: Every environment variable used in this codebase MUST be documented in this file first before being used in code or committed.

---

## Variable Registry

| Exact Variable Name (Case-Sensitive) | Description & Purpose | Provider / Service | Scope |
| :--- | :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | The public HTTPS endpoint URL of the Supabase project instance (e.g. `https://your-project.supabase.co`). | Supabase | Public (Client & Server) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | The public anonymous API key for Supabase client side interactions, subject to RLS rules. | Supabase | Public (Client & Server) |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret administrative key for Supabase bypassing Row Level Security. Must NEVER be exposed to the client. | Supabase | Server-Only (Private) |

---

## Provider Overview

### 1. Supabase
- **`NEXT_PUBLIC_SUPABASE_URL`**: Used by `@supabase/supabase-js` and `@supabase/ssr` to direct API requests to the Supabase backend.
- **`NEXT_PUBLIC_SUPABASE_ANON_KEY`**: Used to authorize client-side queries under Row Level Security (RLS).
- **`SUPABASE_SERVICE_ROLE_KEY`**: Used for server-side admin operations (e.g., in server actions, API routes, or backend tasks).

---

## Local Development & Setup

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
2. Fill in the required credentials in `.env.local`. `.env.local` is ignored by Git and should never be committed.
