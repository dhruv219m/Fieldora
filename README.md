# Fieldora — GitHub and Vercel source

The complete redesigned Fieldora interface, its backend, assets, tests and deployment files. The root project is a **standard Next.js app for Vercel**. A copy of the original ChatGPT Sites/Cloudflare source is included in `original-sites-source.zip`, with visible branding updated to Fieldora.

## Start here

1. Extract this ZIP. Use the folder containing this `README.md`, `package.json` and `app/` as your project root.
2. Install **Node.js 24 LTS**, then open a terminal in that folder.
3. Run:

```sh
npm ci
npm run setup:local
npm run db:migrate
npm run dev
```

Open **http://localhost:3000**. Local development uses an actual SQLite database in `.data/fieldora.sqlite`. The setup command creates `.env.local` with a random session secret and will not overwrite an existing file.

## Upload to GitHub

Upload the **extracted project files**, not just the ZIP. `package.json`, `package-lock.json`, `app/`, `lib/`, `public/`, `scripts/`, `migrations/`, `next.config.mjs`, `postcss.config.mjs`, `tsconfig.json` and `vercel.json` must be in the repository root.

Include `.gitignore`, `.env.example` and `.github/`. Do not upload `.env.local`, `.data`, `.next` or `node_modules`. The original source ZIP is an optional backup; it is not needed to deploy the Vercel edition.

If using Git from a terminal:

```sh
git init
git add .
git commit -m "Add Fieldora website"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/fieldora.git
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username and create an empty repository first.

## Deploy to Vercel

The website backend needs a persistent database on Vercel. This version supports **Turso through its official SQL-over-HTTP protocol**. Local SQLite is intentionally refused inside Vercel Functions because a local file is not durable hosted storage.

1. Create a Turso database and obtain its URL and database auth token. See [docs/DEPLOY_TO_VERCEL.md](docs/DEPLOY_TO_VERCEL.md).
2. Put the Turso settings in your local `.env.local`, keeping your random `SESSION_SECRET`, and run `npm run db:migrate` once against that database.
3. In Vercel choose **Add New → Project**, import your GitHub repository, and select **Next.js**. Use the repository root; do not select the nested original Sites backup.
4. Set these environment variables for the production deployment:

| Variable | Value |
|---|---|
| `DATABASE_PROVIDER` | `turso` |
| `TURSO_DATABASE_URL` | The HTTPS, `libsql://` or `turso://` URL provided by Turso |
| `TURSO_AUTH_TOKEN` | Your database auth token |
| `SESSION_SECRET` | Your own random secret, at least 32 characters |

5. Deploy. `vercel.json` selects Next.js, `npm ci`, and `npm run build`; `package.json` selects Node.js 24.x. Keep the default Next.js output directory.

**Read the step-by-step guide in [docs/DEPLOY_TO_VERCEL.md](docs/DEPLOY_TO_VERCEL.md) if this is your first deployment.** No Vercel or Turso account has been created or connected for you; add your own settings.

## What works

- Redesigned illustrated homepage with three user-controlled farming scenes and English/Hindi switching.
- Farm onboarding, saved profile, task checklist and dashboard.
- Rule-based crop planning with assumptions and missing inputs shown.
- Produce listing creation, preview, editing before bidding, simulated buyer bids and reviewed acceptance.
- Sell-now-versus-storage calculator, the supplied default figures, cost breakdown, break-even price and saved comparisons.
- Crop-suitable storage, itemized quotes, demo requests and explicit status transitions.
- Saved input/rental interests, financial information/checklists and private assistance notes.
- Low-data view, accessible controls and optional browser read-aloud.

## Authentication and data portability

The Vercel edition uses **signed, HttpOnly browser demo sessions**. It does not trust caller-supplied ChatGPT identity headers or use ChatGPT sign-in. A farm is private to its browser session cookie, stored for up to 30 days. Clearing that cookie, switching browsers/devices, or changing `SESSION_SECRET` starts a separate workspace. This is a demonstration session system, not a production account/login service.

The existing hosted Cloudflare database records and credentials are **not** included. A new database starts with the fictional Meera Devi farm. The original source is included unchanged for reference. See [docs/PORTABILITY_NOTES.md](docs/PORTABILITY_NOTES.md) for the exact runtime changes.

All weather, buyers, bids, quality attributes, market prices, facilities, stock, bookings and payment states are illustrative. Live feeds, real payments, verified partners, delivery fulfilment, photo uploads and production multi-device authentication remain outside this demo.

## Commands

| Command | Purpose |
|---|---|
| `npm ci` | Install locked dependencies |
| `npm run setup:local` | Create local SQLite settings and a random secret |
| `npm run db:migrate` | Apply the initial schema to the configured database |
| `npm run dev` | Start the development server |
| `npm run typecheck` | Check TypeScript |
| `npm test` | Run business logic, storage and session tests |
| `npm run build` | Build the standard Next.js production app |
| `npm run test:integration` | Test the production API after building |
| `npm start` | Run the production build locally |

The integration test uses its own temporary SQLite database and random secret; it does not touch your configured farm data or remote database. Vercel runs the production server itself; you do not run `npm start` in its dashboard.

## Main folders

| Path | Contents |
|---|---|
| `app/` | Responsive React pages, styling and Next.js API routes |
| `lib/domain.ts` | Crop rules, calculator, bids, storage quotes and validation |
| `lib/server.ts` | Signed sessions and database-backed farm workspaces |
| `lib/storage.ts` | Local SQLite and hosted Turso adapters |
| `public/` | All images, SVG favicon, display font and font license |
| `migrations/` | Portable initial SQL schema |
| `scripts/` | Local setup and schema migration commands |
| `tests/` | Calculation, validation, session, storage and HTTP integration tests |
| `docs/` | Deployment, migration and validation notes |
| `original-sites-source.zip` | Exact original source snapshot, commit `36c570f2bf5917581632cfbe079e51c190e5b371` |

Official references: [Vercel + Next.js](https://vercel.com/docs/frameworks/full-stack/nextjs), [Node.js versions on Vercel](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions), [Turso HTTP reference](https://docs.turso.tech/sdk/http/reference).
