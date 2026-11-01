# Deploy Fieldora to GitHub and Vercel

## 1. Prepare the project

Extract `Fieldora_GitHub_Vercel_Complete.zip`. Open the extracted project folder in VS Code. Its top level must contain `package.json` and `app/`.

Install Node.js 24 LTS from the official [Node.js download page](https://nodejs.org/en/download). Open a terminal in the project folder and run:

```sh
npm ci
npm run setup:local
npm run db:migrate
npm run dev
```

Open http://localhost:3000. Stop the development server with Ctrl+C when finished. `npm run setup:local` creates a private `.env.local` file with a random session secret. Save this file locally; `.gitignore` excludes it from Git.

## 2. Create the hosted database

Vercel runs the application. Turso stores the farm records. You need your own account and a database; none is bundled into the source download.

Create a database in the [Turso dashboard](https://turso.tech/), or follow the official [CLI installation](https://docs.turso.tech/cli/installation) and sign-in instructions and run:

```sh
turso db create fieldora
turso db show fieldora --http-url
turso db tokens create fieldora
```

The second command displays the database URL. The third creates a database auth token. These are server settings, not values to put into React code.

Edit `.env.local` to use:

```dotenv
DATABASE_PROVIDER=turso
TURSO_DATABASE_URL=https://YOUR_DATABASE_URL_FROM_TURSO
TURSO_AUTH_TOKEN=YOUR_DATABASE_AUTH_TOKEN
SESSION_SECRET=KEEP_YOUR_RANDOM_SECRET_FROM_LOCAL_SETUP
```

Use the real values supplied by your database provider, not the capitalized placeholder text. `libsql://` and `turso://` database URLs are also accepted. The app converts the scheme to HTTPS for the `/v2/pipeline` endpoint. Do not prefix any token or session secret with `NEXT_PUBLIC_`.

Apply the schema:

```sh
npm run db:migrate
```

The expected success message is `Applied 001_initial.sql to turso.` This only creates the `workspaces` table if it is absent; it does not copy records from the existing Sites database. Alternatively, run the statement in `migrations/001_initial.sql` through Turso's official SQL tools.

To return to local-only development later, set `DATABASE_PROVIDER=sqlite` and `SQLITE_DATABASE_FILE=.data/fieldora.sqlite` in `.env.local`.

## 3. Upload the source to GitHub

Create an empty GitHub repository. Upload the extracted project contents using GitHub's file upload or the Git commands in the root README.

Verify that `package.json`, `package-lock.json`, `vercel.json`, `next.config.mjs`, `app/` and `public/` appear at the repository root. Include the hidden configuration files and folders supplied with the project, especially `.gitignore` and `.env.example`. Do not upload your local `.env.local`, `.data/`, `.next/` or `node_modules/`.

`original-sites-source.zip` is an optional backup of the original Cloudflare/Vinext project. You may keep it locally instead of uploading it to GitHub. The Vercel app does not depend on it.

## 4. Import the repository into Vercel

In [Vercel](https://vercel.com/) choose Add New → Project, connect GitHub, and select your repository. Configure:

| Setting | Value |
|---|---|
| Framework preset | Next.js |
| Root directory | The directory containing this package.json; normally the repository root |
| Install command | `npm ci` |
| Build command | `npm run build` |
| Output directory | Leave the Next.js default |
| Node.js | 24.x, also declared in package.json |

Add the following environment variables before deployment:

| Key | Where to get it |
|---|---|
| `DATABASE_PROVIDER` | Set to `turso` |
| `TURSO_DATABASE_URL` | Turso database URL |
| `TURSO_AUTH_TOKEN` | Turso database auth token |
| `SESSION_SECRET` | Random value generated in your local `.env.local`, at least 32 characters |

Set them for Production. Set appropriate values for Preview too if you want database-backed branch previews. Redeploy after changing environment variables so a new deployment uses them.

Click Deploy. No Cloudflare account, Workers configuration, ChatGPT secret, or Sites project ID is needed for this Vercel edition. Do not use a static HTML framework preset: `/api/workspace` and `/api/actions` are server routes.

## 5. Confirm your deployment

On your Vercel URL:

1. Open Explore Demo and confirm that the dashboard loads.
2. Edit the sample farm, save it, and refresh. The change should remain in that browser.
3. Save a calculator comparison and check it in the dashboard.
4. Create a demo listing and try a simulated bid above its reserve price.
5. Review a storage quote and create a demonstration request.

These actions are demonstrations; no actual trade, payment, message or booking is sent to an outside service.

## Troubleshooting

| Symptom | Check |
|---|---|
| Homepage opens but the dashboard cannot load | All four environment variables are present and the database migration succeeded. |
| Vercel logs say to configure Turso | `DATABASE_PROVIDER` must be `turso`; local SQLite is not enabled in Vercel Functions. |
| Session-secret error | Use a random value of at least 32 characters, not the placeholder from `.env.example`. |
| Database HTTP error | Verify the database URL, token, token expiry and database availability. |
| Missing workspaces table | Run `npm run db:migrate` against the same Turso database used by Vercel. |
| Invalid module/cloudflare:workers error | Import the root Next.js project, not the nested original Sites backup. |
| Vercel cannot find the Next.js project | Move `package.json` and `app/` to the repository root or select their containing folder as Root Directory. |
| Old changes seem missing | Cookies are browser-specific. Clearing them or using a different browser starts a new demo farm. |
| A second browser has a different farm | This edition uses isolated browser sessions, not cross-device accounts. |
| Farm changed in another tab | Refresh and retry. Revision checks prevent one tab silently overwriting another. |

## Official documentation

- [Deploying Next.js on Vercel](https://vercel.com/docs/frameworks/full-stack/nextjs)
- [Vercel environment variables](https://vercel.com/docs/environment-variables)
- [Supported Node.js versions](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions)
- [Turso SQL over HTTP](https://docs.turso.tech/sdk/http/reference)
- [Create a Turso database](https://docs.turso.tech/cli/db/create)
- [Turso database tokens](https://docs.turso.tech/cli/db/tokens/create)

Documentation checked for this export on 1 November 2026. Dashboard labels can change; the supplied `vercel.json` and `package.json` contain the required build settings.
