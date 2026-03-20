# Fix: Missing DATABASE_URL on Render

## Problem
```
error: Tenant or user not found
[TypeOrmModule] Unable to connect to the database. Retrying...
```

**Root Cause**: The `DATABASE_URL` environment variable is not set on Render. TypeORM can't connect to Supabase.

---

## Solution: Add DATABASE_URL to Render

### Step 1: Get Your Supabase Connection String

From your Supabase project:

1. Go to **Supabase Dashboard** → Project Settings
2. Look for **Connection pooler** (NOT direct connection)
3. Select **PostgreSQL** connection type
4. Copy the pooler URL — it looks like:
   ```
   postgres://postgres.[hex]:[password]@aws-0-[region].[hex].pooler.supabase.com:5432/postgres?schema=public
   ```

**IMPORTANT**: Use the **pooler URL**, not the direct connection URL. Pooler avoids connection limit issues.

---

### Step 2: Add to Render Dashboard

1. Go to **https://dashboard.render.com**
2. Select your **worknest-api** service
3. Go to **Settings** → **Environment**
4. Find or add the `DATABASE_URL` variable
5. **Paste your full Supabase pooler URL**
6. Save

---

### Step 3: Verify All Required Variables

Make sure Render has ALL of these set (find in Supabase Settings → API):

| Variable | Source | Format |
|---|---|---|
| `DATABASE_URL` | Supabase Connection Pooler | `postgres://...` |
| `SUPABASE_URL` | Supabase Project URL | `https://xyz.supabase.co` |
| `SUPABASE_ANON_KEY` | Supabase Public Key | API key string |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Service Role | API key string |
| `JWT_SECRET` | (from previous setup) | Random string |
| `JWT_REFRESH_SECRET` | (from previous setup) | Random string |

---

### Step 4: Redeploy

Once all environment variables are set:

1. In Render dashboard, go to **Deployments**
2. Click **Manual Deploy** or wait for auto-redeploy
3. Watch logs for successful connection:
   ```
   [Nest] ... LOG [TypeOrmModule] TypeORM connected successfully...
   ```

---

### Step 5: Run CRUD Tests

Once deployment succeeds:

```bash
cd /home/tafadzwa/Documents/Github/worknest
node scripts/smoke-test-crud.mjs
```

Expected output if everything works:
```
════════════════════════════════════════
  Results: 72+ passed, 0 failed
════════════════════════════════════════
```

---

## Why "Tenant or user not found"?

PostgreSQL returns this when:
1. ❌ CONNECTION STRING is missing → `DATABASE_URL` not set
2. ❌ USERNAME wrong in pooler URL
3. ❌ PASSWORD wrong in pooler URL  
4. ❌ Wrong Supabase project selected

**Fix**: Verify your Supabase pooler URL is copied correctly (especially password with special chars).

---

## Quick Checklist

- [ ] Copied Supabase **pooler URL** (not direct connection)
- [ ] Added `DATABASE_URL` to Render environment
- [ ] Verified all 6 variables are set in Render dashboard
- [ ] Clicked "Manual Deploy" or waited for auto-redeploy
- [ ] Checked deployment logs for "TypeORM connected successfully"
- [ ] Ready to run CRUD tests

---

## Need Help?

If deployment still fails after setting variables:

1. Check Render logs for specific error messages
2. Verify Supabase database is active (not paused)
3. Test pooler connection locally:
   ```bash
   psql "postgres://user:pass@pooler-url:5432/postgres"
   ```

Once connected, NestJS will handle migrations and entity initialization automatically.
