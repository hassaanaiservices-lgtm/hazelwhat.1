# Production Cutover & Instant Rollback Plan

This document outlines the authoritative deployment procedures, domain cutover protocol, and instant 3-minute emergency rollback plan for **HazelWhat**.

---

## 1. Domain Cutover Protocol

> [!CAUTION]
> **STRICT RULE**: Do NOT touch real production DNS under any circumstance without explicit, separate user confirmation following a 100% pass of `SMOKE_TEST_CHECKLIST.md` on the staging environment.

### Cutover Execution Steps (Only After User Confirmation)
1. Confirm staging deployment build succeeds and passes all tests (`npx tsx tests/two-tenant-e2e.test.ts`).
2. Obtain explicit written approval from project owner.
3. Access DNS registrar (Cloudflare / Namecheap / Route 53) and update CNAME / A records:
   - `app.hazelwhat.com` → Railway Service Domain (`hazelwhat-production.up.railway.app`).
4. Verify SSL certificate auto-issuance on Railway.
5. Perform post-cutover smoke test on production URL.

---

## 2. Emergency Rollback Plan (3-Minute Recovery Window)

If a critical issue or regression is discovered post-cutover, follow these steps to instantly revert to the previous known-good deployment:

### Step 1: Railway Instant Deployment Rollback (1 Minute)
1. Open the [Railway Dashboard](https://railway.app).
2. Select project **HazelWhat** → service **hazelwhat-production**.
3. Go to the **Deployments** tab.
4. Locate the previous successful deployment commit.
5. Click **Redeploy** on the previous known-good commit. Railway will switch active traffic to the previous container build within 30 seconds.

### Step 2: DNS Emergency Failover (1 Minute - Optional)
If Railway service is unresponsive:
1. Access DNS Registrar / Cloudflare dashboard.
2. Repoint `app.hazelwhat.com` back to the legacy server IP / backup CNAME.
3. Lower TTL to 60 seconds.

### Step 3: Database Schema Migration Rollback (Supabase - 1 Minute)
If a database migration caused a breaking schema issue:
1. Access [Supabase Dashboard](https://supabase.com/dashboard).
2. Navigate to **SQL Editor**.
3. Run the relevant inverse migration script stored in `supabase/migrations/` (e.g. dropping newly added column or reverting RLS policy).

---

## 3. Deployment Environments & Branches

| Environment | Railway Service Name | GitHub Branch | Domain / URL | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **Staging** | `hazelwhat-staging` | `staging` | `hazelwhat-staging.up.railway.app` | Integration testing, client UAT, pre-release smoke testing |
| **Production** | `hazelwhat-production` | `main` | `app.hazelwhat.com` | Production environment |
