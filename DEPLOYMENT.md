# HALT Animal Card Generator — Deployment Guide

**Project:** HALT Animal Card Generator  
**Stack:** React 19 + Vite + Express 4 + tRPC 11 + Drizzle ORM + MySQL  
**Hosting:** Manus (recommended) or any Node.js-capable platform

---

## Overview

The card generator supports two deployment modes depending on which features you need:

| Target | AI Style Transfer | Database | Auth | Complexity |
|---|---|---|---|---|
| **Manus (full-stack)** | ✅ Yes (auto) | ✅ Yes | ✅ Yes | Low — click Publish |
| **Railway** | ✅ Yes (needs `OPENAI_API_KEY`) | ✅ Yes | Optional | Low — connect GitHub |
| **Render** | ✅ Yes (needs `OPENAI_API_KEY`) | ✅ Yes | Optional | Low — connect GitHub |
| **VPS / Self-hosted** | ✅ Yes (needs `OPENAI_API_KEY`) | ✅ Yes | Optional | Medium |
| **GitHub Pages (static)** | ❌ No | ❌ No | ❌ No | Medium — one command |

The AI Style Transfer feature (Pokémon, Kawaii, Comic Book, Watercolor) requires a live backend server and **cannot run on GitHub Pages**. For all non-Manus deployments, you need an **OpenAI API key** — the app uses `gpt-image-1` for image editing.

---

## AI Image Generation — Backend Selection

The app automatically selects the image generation backend based on which credentials are present:

1. **OpenAI** (`OPENAI_API_KEY`) — used first if set. Works on any platform. Uses `gpt-image-1` with image editing for style transfer.
2. **Manus Forge** (`BUILT_IN_FORGE_API_KEY` + `BUILT_IN_FORGE_API_URL`) — used automatically when running inside the Manus platform. No setup required.

If neither is configured, the AI Style tab will return an error. For Railway, Render, and VPS deployments, set `OPENAI_API_KEY`.

**Getting an OpenAI API key:**
1. Go to [platform.openai.com](https://platform.openai.com) and create an account
2. Navigate to **API Keys** → **Create new secret key**
3. Copy the key (it starts with `sk-...`) and add it as `OPENAI_API_KEY` in your deployment environment

---

## Option 1 — Manus Hosted Deployment (Recommended)

This is the simplest path. The Manus platform manages the server, database, environment variables, CDN, and AI image generation automatically — no OpenAI key required.

### Prerequisites

- Access to the Manus project at `haltcards-ksanxky3.manus.space`
- A saved checkpoint (the agent creates these automatically after each significant change)

### Steps

**1. Ensure a checkpoint exists.** After any code change, the agent saves a checkpoint. You can verify this by checking the Checkpoint card in the Manus chat panel — it shows a screenshot of the current state.

**2. Click the Publish button.** In the Manus Management UI, click the **Publish** button in the top-right corner of the header. This builds the project, pushes it to the Manus CDN, and makes it live at your domain.

**3. Verify the deployment.** Visit `https://haltcards-ksanxky3.manus.space` to confirm the live site matches the preview.

### Custom Domain

To serve the app from a custom domain such as `cards.helpingalllittlethings.org`:

1. Open the Management UI → **Settings** → **Domains**
2. Enter your custom domain and follow the DNS configuration instructions shown
3. Add a `CNAME` record in your DNS provider pointing to the Manus-provided hostname
4. Manus provisions an SSL certificate automatically within a few minutes

### Environment Variables

All required secrets are injected automatically by the Manus platform. No manual setup is required:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | MySQL/TiDB connection string |
| `JWT_SECRET` | Session cookie signing key |
| `BUILT_IN_FORGE_API_KEY` | Backend API key for AI image generation (Manus internal) |
| `BUILT_IN_FORGE_API_URL` | AI image generation endpoint (Manus internal) |
| `VITE_APP_ID` | Manus OAuth application ID |
| `OAUTH_SERVER_URL` | Manus OAuth backend |

If you want to use OpenAI instead of Forge on the Manus platform, add `OPENAI_API_KEY` via **Settings → Secrets** and it will take priority automatically.

---

## Option 2 — GitHub Pages (Static, No AI Features)

This deploys only the frontend as a static site. The AI Style Transfer tab will be present in the UI but calls to the backend will fail. All other features (card creation, crop, adjust, download) work fully.

### Prerequisites

- Node.js 18+ and `pnpm` installed locally (`npm install -g pnpm`)
- The repository cloned: `git clone https://github.com/AlannaBurke/card-generator.git`
- GitHub Pages enabled in the repository settings

### One-time Setup — Enable GitHub Pages

1. Go to [github.com/AlannaBurke/card-generator/settings/pages](https://github.com/AlannaBurke/card-generator/settings/pages)
2. Under **Source**, select **Deploy from a branch**
3. Set branch to **`gh-pages`**, folder to **`/ (root)`**
4. Click **Save**

### Deploying

```bash
# From the project root
git pull                  # get latest code
pnpm install              # install dependencies
pnpm gh-deploy            # build and push to gh-pages branch
```

The `gh-deploy` script builds the Vite frontend with `GITHUB_PAGES=true` (sets the `/card-generator/` base path) and pushes `dist/public/` to the `gh-pages` branch. The live site will be available at **https://AlannaBurke.github.io/card-generator/** within about 60 seconds.

> **Note:** `deploy` is a reserved command in pnpm workspaces. The script is named `gh-deploy` to avoid the conflict.

### SPA Routing

The repository includes `client/public/404.html` and a redirect decode script in `client/index.html`. These handle GitHub Pages' lack of server-side routing — any direct URL (e.g., `/print`) is redirected back through `index.html` so Wouter can handle it client-side.

---

## Option 3 — Railway (Full-Stack, Free Tier Available)

[Railway](https://railway.app) is a modern PaaS that can run the full-stack app with AI features. It has a generous free tier (500 hours/month) and deploys directly from GitHub.

### Steps

**1. Create a Railway account** at [railway.app](https://railway.app).

**2. Provision a MySQL database.** In your Railway project dashboard, click **+ New** → **Database** → **MySQL**. Railway creates the database and exposes a `DATABASE_URL` variable automatically.

**3. Create a new service from GitHub.** Click **+ New** → **GitHub Repo** → select `AlannaBurke/card-generator`. Railway detects `package.json` and uses `pnpm build` + `pnpm start` automatically.

**4. Set environment variables.** In the service settings, go to **Variables** and add:

| Variable | Value |
|---|---|
| `DATABASE_URL` | Auto-populated from the MySQL service — use the `${{MySQL.DATABASE_URL}}` reference |
| `JWT_SECRET` | A long random string — generate with `openssl rand -hex 32` |
| `OPENAI_API_KEY` | Your OpenAI API key (starts with `sk-...`) — required for AI Style Transfer |
| `NODE_ENV` | `production` |

**5. Run the database migration.** In the Railway service, open the **Shell** tab and run:

```bash
pnpm db:push
```

**6. Deploy.** Railway deploys automatically on every push to `main`. Your app will be live at a `*.railway.app` URL within a few minutes.

### Custom Domain on Railway

In your service settings, go to **Settings** → **Domains** → **Custom Domain**. Add your domain and follow the CNAME instructions. Railway provisions SSL automatically.

---

## Option 4 — Render (Full-Stack, Free Tier Available)

[Render](https://render.com) is another PaaS option with a free tier. Note that free-tier web services on Render **spin down after 15 minutes of inactivity** and take ~30 seconds to wake up on the next request. Upgrade to a paid plan to avoid cold starts.

### Steps

**1. Create a Render account** at [render.com](https://render.com).

**2. Provision a database.** Render's managed database is PostgreSQL, not MySQL. You have two options:
- Use an external MySQL provider such as [PlanetScale](https://planetscale.com) (free tier available) or [Aiven](https://aiven.io) and paste the MySQL connection string as `DATABASE_URL`.
- Switch the Drizzle dialect from `mysql2` to `pg` in `drizzle/schema.ts` and `server/db.ts` to use Render's native PostgreSQL.

**3. Create a Web Service.** Click **New** → **Web Service** → connect your GitHub repo. Set:

| Setting | Value |
|---|---|
| **Environment** | Node |
| **Build Command** | `pnpm install && pnpm build` |
| **Start Command** | `node dist/index.js` |
| **Node Version** | 22 |

**4. Set environment variables.** In the **Environment** tab, add:

| Variable | Value |
|---|---|
| `DATABASE_URL` | Your MySQL or PostgreSQL connection string |
| `JWT_SECRET` | A long random string — generate with `openssl rand -hex 32` |
| `OPENAI_API_KEY` | Your OpenAI API key — required for AI Style Transfer |
| `NODE_ENV` | `production` |

**5. Run the database migration.** Use the Render **Shell** tab (available on paid plans) or run `pnpm db:push` locally with the production `DATABASE_URL` set.

**6. Deploy.** Render deploys automatically on every push to `main`.

---

## Option 5 — Self-Hosted (VPS / cPanel)

For a traditional Linux VPS (DigitalOcean, Linode, Hetzner, etc.) or shared hosting with Node.js support.

### Build

```bash
pnpm install
pnpm build
```

This produces:

- `dist/public/` — the compiled frontend (serve as static files)
- `dist/index.js` — the compiled Express server

### Run

```bash
NODE_ENV=production node dist/index.js
```

The server listens on the port defined by the `PORT` environment variable (defaults to `3000`).

### Required Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | MySQL connection string, e.g. `mysql://user:pass@host:3306/dbname` |
| `JWT_SECRET` | A long random string for signing session cookies — generate with `openssl rand -hex 32` |
| `OPENAI_API_KEY` | Your OpenAI API key — required for AI Style Transfer |
| `NODE_ENV` | Set to `production` |
| `VITE_APP_ID` | Manus OAuth app ID (required for login; leave blank to disable auth) |
| `OAUTH_SERVER_URL` | Manus OAuth backend URL |
| `VITE_OAUTH_PORTAL_URL` | Manus login portal URL |

### Database Migration

After setting `DATABASE_URL`, run the migration to create all tables:

```bash
pnpm db:push
```

This runs `drizzle-kit generate && drizzle-kit migrate` to apply the schema defined in `drizzle/schema.ts`.

### Reverse Proxy (Nginx example)

```nginx
server {
    listen 443 ssl;
    server_name cards.helpingalllittlethings.org;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## Running Tests

```bash
pnpm test
```

All tests use [Vitest](https://vitest.dev/). Test files live in `server/*.test.ts`. The test suite covers:

- `server/auth.logout.test.ts` — session cookie clearing
- `server/photo.style.test.ts` — style transfer procedure validation

---

## Updating the Live Site

The typical update workflow is:

1. Make changes in the Manus agent chat
2. The agent commits to `github/main` and saves a Manus checkpoint
3. Click **Publish** in the Manus Management UI to go live

For Railway and Render, push to `main` and they redeploy automatically. For GitHub Pages, run `pnpm gh-deploy` after pulling the latest code.

---

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---|---|---|
| Blank page on GitHub Pages | Missing `base` path in Vite config | Ensure `GITHUB_PAGES=true` is set in the build script |
| 404 on page refresh (GitHub Pages) | SPA routing not configured | Confirm `client/public/404.html` exists in the repo |
| AI Style Transfer returns "No image generation backend configured" | Neither `OPENAI_API_KEY` nor Forge credentials are set | Add `OPENAI_API_KEY` to your environment variables |
| AI Style Transfer returns OpenAI error | Invalid or expired API key | Check your key at [platform.openai.com/api-keys](https://platform.openai.com/api-keys) |
| "Please login" error loop | OAuth misconfigured | Check `VITE_APP_ID` and `OAUTH_SERVER_URL` env vars |
| Images missing on card download | CORS on CDN assets | All assets are served from `d2xsxph8kpxj0f.cloudfront.net` with CORS enabled; check browser console for specific errors |
| Database connection refused | Wrong `DATABASE_URL` | Verify the connection string and that the database allows connections from your server's IP |
| Cold start delay on Render free tier | Service spun down after inactivity | Upgrade to a paid Render plan, or use Railway which does not spin down |
