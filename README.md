# 🐾 HALT Animal Card Generator

A web app for [Helping All Little Things](https://helpingalllittlethings.org) team members to generate adorable Pokémon-style trading cards for sanctuary animals. Upload a photo, fill in the details, and download a high-resolution card to share.

![HALT Logo](https://d2xsxph8kpxj0f.cloudfront.net/310519663404885239/KSAnxKy3iVwgftKj5yQJFJ/logo-square_17e2654f.png)

---

## Features

- **Photo upload** — click or drag & drop (JPG, PNG, WEBP, up to 10 MB)
- **Animal details** — name, species, sex, age, weight, personality traits, bio
- **Friendliness HP slider** — a heart-meter score for the card
- **Species color theming** — card header color changes automatically per species
- **Live card preview** — updates in real time; flip to see the card back
- **Download as PNG** — exports at 2× resolution, ready to share

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 + TypeScript |
| Styling | Tailwind CSS 4 |
| UI Components | shadcn/ui (Radix UI) |
| Build Tool | Vite 7 |
| Card Export | html2canvas |
| Package Manager | pnpm |

This is a **100% static frontend** app — no server, no database, no API keys required.

---

## Local Development

### Prerequisites

- [Node.js](https://nodejs.org) v18 or higher
- [pnpm](https://pnpm.io) v8 or higher (`npm install -g pnpm`)

### Setup

```bash
git clone https://github.com/AlannaBurke/card-generator.git
cd card-generator
pnpm install
pnpm dev
```

The app will be available at `http://localhost:3000`.

### Build for Production

```bash
pnpm build
```

Output is written to `dist/public/`. This folder contains everything needed — just upload it to any static host.

---

## Deployment

### Option 1 — Netlify (Recommended, free tier available)

1. Go to [app.netlify.com](https://app.netlify.com) → **Add new site → Import an existing project**
2. Connect your GitHub account and select `AlannaBurke/card-generator`
3. Netlify will auto-detect the settings from `netlify.toml`:
   - **Build command:** `pnpm install && pnpm build`
   - **Publish directory:** `dist/public`
4. Click **Deploy site** — done!

The `netlify.toml` file in this repo handles SPA routing, security headers, and asset caching automatically.

### Option 2 — Vercel (free tier available)

1. Go to [vercel.com](https://vercel.com) → **Add New Project**
2. Import `AlannaBurke/card-generator` from GitHub
3. Vercel will read `vercel.json` automatically — no manual configuration needed
4. Click **Deploy**

### Option 3 — Cloudflare Pages (free tier available)

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com) → **Pages → Create a project**
2. Connect GitHub and select the repo
3. Set:
   - **Build command:** `pnpm install && pnpm build`
   - **Build output directory:** `dist/public`
4. Deploy — the `_redirects` file in `client/public/` handles SPA routing automatically

### Option 4 — GitHub Pages

1. In your repo, go to **Settings → Pages**
2. Set source to **GitHub Actions**
3. Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pages: write
      id-token: write
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 10
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install
      - run: pnpm build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist/public
      - uses: actions/deploy-pages@v4
```

### Option 5 — cPanel / Shared Hosting (Bluehost, SiteGround, DreamHost, etc.)

1. Run `pnpm build` locally (or in CI)
2. Upload the contents of `dist/public/` to your `public_html` folder via FTP or the File Manager
3. The `.htaccess` file in `client/public/` is automatically included in the build and handles SPA routing on Apache servers

---

## Analytics (Optional)

The app ships with no analytics by default. To add your own, open `client/index.html` and replace the comment placeholder with your preferred analytics script (Plausible, Fathom, Google Analytics, etc.):

```html
<!-- Analytics: add your own script here if needed -->
```

---

## Customization

All card assets (background texture, card back, hero image) are hosted on a CDN. Their URLs are defined as constants at the top of `client/src/pages/Home.tsx`:

```ts
const LOGO_URL = "...";
const CARD_BG_URL = "...";
const HERO_BG_URL = "...";
const CARD_BACK_URL = "...";
```

Replace these with your own hosted images if you want to customize the card design.

Species color theming is defined in `client/src/components/AnimalCard.tsx` in the `SPECIES_COLORS` object — add new species or adjust colors there.

---

## License

Built for [Helping All Little Things](https://helpingalllittlethings.org) — a 501(c)(3) small animal rescue based in New Hampshire.
