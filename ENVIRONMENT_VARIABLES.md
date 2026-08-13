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
| `SESSION_SECRET` | Secret key used to sign and verify JWT authentication session cookies (HS256). Must be a long, random string. | HazelWhat Auth | Server-Only (Private) |
| `DEEPSEEK_API_KEY` | Secret API authorization key for DeepSeek AI primary LLM inference service. | DeepSeek | Server-Only (Private) |
| `OPENAI_API_KEY` | Secret API authorization key for OpenAI secondary backup LLM inference service. | OpenAI | Server-Only (Private) |
| `DEEPGRAM_API_KEY` | Secret API authorization key for Deepgram Speech-to-Text voice note transcription service. | Deepgram | Server-Only (Private) |
| `SUPABASE_MEDIA_BUCKET` | The Supabase Storage bucket name for storing incoming customer chat images and voice notes (default `chat-media`). | Supabase Storage | Server-Only (Private) |

---

## Provider Overview

### 1. Supabase
- **`NEXT_PUBLIC_SUPABASE_URL`**: Used by `@supabase/supabase-js` and `@supabase/ssr` to direct API requests to the Supabase backend.
- **`NEXT_PUBLIC_SUPABASE_ANON_KEY`**: Used to authorize client-side queries under Row Level Security (RLS).
- **`SUPABASE_SERVICE_ROLE_KEY`**: Used for server-side admin operations (e.g., in server actions, API routes, or backend tasks).
- **`SUPABASE_MEDIA_BUCKET`**: Bucket name for chat media uploads.

### 2. HazelWhat Auth
- **`SESSION_SECRET`**: Used by Next.js Middleware and authentication services to sign and verify HS256 JWT session tokens stored in HttpOnly cookies.

### 3. AI & Speech Inference Providers
- **`DEEPSEEK_API_KEY`**: Primary LLM provider API key. Tried first on all AI response generation pipelines.
- **`OPENAI_API_KEY`**: Secondary backup LLM provider API key. Fallback provider if DeepSeek experiences a circuit trip or API failure.
- **`DEEPGRAM_API_KEY`**: Speech-to-Text provider API key for transcribing incoming WhatsApp voice notes into plain text.

---

## Local Development & Setup

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
2. Fill in the required credentials in `.env.local`. `.env.local` is ignored by Git and should never be committed.
