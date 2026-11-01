# Export validation

Validated using Node.js 24.22.1 and Next.js 16.3.4.

| Check | Result |
|---|---|
| Clean npm dependency installation from supplied lockfile | Passed |
| TypeScript checks | Passed |
| Standard Next.js webpack production build | Passed |
| Business logic, database adapter and signed-session tests | 12 passed |
| Production Next.js HTTP API integration test | Passed |
| Local setup command and initial SQLite schema migration | Passed |

The production API test creates a separate temporary database and verifies profile saves, saved comparisons, listing creation, bid reserve checks, simulated offer acceptance, itemized storage requests, status updates, refresh persistence, session isolation, cross-origin rejection, malformed JSON handling and reset.

The Turso adapter was checked against the official HTTP protocol and tested with a controlled protocol fixture. No real Turso account/database credentials were supplied, so a live remote Turso deployment has not been verified. The user must configure the database and environment variables before Vercel can save records.

This export has not been uploaded to the user's GitHub account or deployed to the user's Vercel account. The existing Sites deployment was not modified. The exported UI uses the already-verified redesign and included local assets; the port was checked with a standard Next.js build rather than another visual redesign pass.
