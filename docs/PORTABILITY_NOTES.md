# What changed for the Vercel edition

The original site runs Vinext on Cloudflare Workers and saves structured data to Cloudflare D1. Those runtime bindings and the dispatch-owned ChatGPT identity headers are specific to Sites and are not a self-contained Vercel backend.

This export preserves the redesigned React interface, local assets, Hindi strings, domain calculations, rules and demonstration workflows. Its root project replaces the hosting layer:

| Original Sites source | Vercel-ready root project |
|---|---|
| Vinext/Vite Workers build | Standard Next.js App Router with `next build --webpack` |
| `cloudflare:workers` DB binding | Server-side SQL adapter using local SQLite or hosted Turso HTTP |
| D1 workspaces table | Same logical owner/data/revision/updated_at schema in a fresh database |
| Trusted ChatGPT identity headers | Signed, expiring HttpOnly browser-demo session cookie |
| Sites source/deploy helpers | npm scripts, npm lockfile, `vercel.json` and a GitHub CI workflow |
| Cloudflare schema deployment | `npm run db:migrate` against the selected database |

A branding-updated copy of the original source is inside `original-sites-source.zip`, extracted into `fieldora-sites-original/`. Its full commit is `36c570f2bf5917581632cfbe079e51c190e5b371`.

## Included and excluded

Included: all original tracked source files in the nested backup, the complete adapted Next.js frontend and backend, images, custom SVG illustrations, font and license, migrations, tests, lockfile and instructions.

Excluded: dependency folders, generated builds, tool/cache state, repository history, local environment files, credentials and the existing hosted database records. Dependency folders are recreated with `npm ci`.

## Session behavior

The Vercel copy intentionally ignores `oai-authenticated-user-id`, email and similar incoming headers: an ordinary visitor can supply those headers outside the Sites gateway. A random workspace ID is signed server-side with HMAC and stored in an HttpOnly SameSite cookie. Writes also require the page's own Origin and a matching record revision.

Sessions last up to 30 days. Deleting the cookie, changing browser/device, expiration or rotating the signing secret creates a new workspace. This is a practical prototype session model, not a production identity/permission system. Real login and account recovery would require an authentication provider.

## Data and feature boundaries

The Turso adapter uses the documented HTTPS SQL pipeline with bound parameters and closes each connection. The local adapter uses Node.js 24's built-in SQLite module. The Vercel runtime refuses local SQLite to avoid pretending that temporary function files are persistent records.

Sample data is inserted when a new browser workspace first loads. Migration SQL only creates schema. All crop, price, weather, buyer, quality, storage, rental, supplier and payment illustrations retain their demo boundaries. No external application or financial transaction is submitted.

A migration of actual D1 records would be a separate, user-authorized data-export/import task. This code export does not read or transfer those records, and its session ownership scheme is different.
