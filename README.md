# 🐾 HALT Animal Card Generator

A web app for [Helping All Little Things](https://helpingalllittlethings.org) team members to generate adorable trading cards for rescue animals. Upload a photo, fill in the details, choose an AI art style, and download a high-resolution card to share.

---

## Features

- **Photo upload** — click or drag & drop (JPG, PNG, WEBP, up to 10 MB)
- **Photo editor** — crop (locked to card ratio), rotate, brightness/contrast/saturation, auto-adjust
- **AI art styles** — transform any photo into Pokémon TCG, Kawaii, Comic Book, or Watercolor art with a single click; results are cached so you can compare styles
- **Animal details** — name, species, sex, age, weight, personality traits, bio, fun fact
- **Friendliness HP slider** — a pink heart-meter score for the card
- **Adoption status badge** — Available, In Foster, or Sanctuary Resident banner
- **Species color theming** — card header color changes automatically per species
- **Live card preview** — updates in real time; flip to see the card back
- **Download as PNG** — exports at full resolution using a canvas renderer

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + TypeScript + Vite 7 |
| Styling | Tailwind CSS 4 + shadcn/ui |
| Backend | Express 4 + tRPC 11 |
| Database | Drizzle ORM + MySQL/TiDB |
| AI Image Generation | Manus Forge Image API |
| Card Export | Canvas API |
| Package Manager | pnpm |

---

## Local Development

### Prerequisites

- [Node.js](https://nodejs.org) v18 or higher
- [pnpm](https://pnpm.io) (`npm install -g pnpm`)
- A MySQL-compatible database (local or cloud)

### Setup

```bash
git clone https://github.com/AlannaBurke/card-generator.git
cd card-generator
pnpm install
```

Copy `.env.example` to `.env` and fill in the required values (see [Environment Variables](#environment-variables) below), then run:

```bash
pnpm db:push   # create database tables
pnpm dev       # start the dev server
```

The app will be available at `http://localhost:3000`.

### Build for Production

```bash
pnpm build
```

Output is written to `dist/public/` (frontend) and `dist/index.js` (backend server).

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | MySQL connection string, e.g. `mysql://user:pass@host:3306/dbname` |
| `JWT_SECRET` | Yes | Long random string for signing session cookies |
| `BUILT_IN_FORGE_API_KEY` | Yes | API key for the Manus AI image generation service |
| `BUILT_IN_FORGE_API_URL` | Yes | Base URL for the Manus AI image generation service |
| `VITE_APP_ID` | Optional | Manus OAuth app ID (leave blank to disable login) |
| `OAUTH_SERVER_URL` | Optional | Manus OAuth backend URL |
| `VITE_OAUTH_PORTAL_URL` | Optional | Manus login portal URL |

> **Note:** When deploying on Manus, all of the above are injected automatically — no manual configuration needed.

---

## Deployment

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for the full step-by-step guide. A summary of available options:

| Option | AI Styles | Free Tier | Difficulty |
|---|---|---|---|
| **Manus** (recommended) | ✅ | ✅ | One click |
| **Railway** | ✅ | ✅ (500 hrs/mo) | Low |
| **Render** | ✅ | ✅ (spins down on idle) | Low |
| **Fly.io** | ✅ | ✅ | Medium |
| **GitHub Pages** | ❌ (static only) | ✅ | Low |
| **VPS / cPanel** | ✅ | Varies | Medium |

### Quickest path — Manus

The app is already configured for one-click deployment on Manus. After saving a checkpoint, click the **Publish** button in the Management UI. The live URL is:

> **https://haltcards-ksanxky3.manus.space**

### GitHub Pages (static, no AI features)

```bash
git pull
pnpm install
pnpm gh-deploy
```

Live at: **https://AlannaBurke.github.io/card-generator/**

> Note: `pnpm deploy` is reserved by pnpm — use `pnpm gh-deploy` instead.

---

## Customization

All card assets (background texture, hero image, species icons) are hosted on a CDN. Their URLs are defined as constants in `client/src/components/AnimalCard.tsx` and `client/src/pages/Home.tsx`. Replace them with your own hosted images to customize the card design.

Species color theming is defined in `client/src/components/AnimalCard.tsx` in the `SPECIES_COLORS` object — add new species or adjust colors there.

AI style prompts are defined in `server/routers.ts` in the `STYLE_PROMPTS` object — edit them to tune the style output.

---

## Running Tests

```bash
pnpm test
```

Test files live in `server/*.test.ts` and use [Vitest](https://vitest.dev/).

---

## License

Built for [Helping All Little Things](https://helpingalllittlethings.org) — a 501(c)(3) small animal rescue based in New Hampshire.
