import { randomBytes } from 'node:crypto';
import { writeFile,access } from 'node:fs/promises';
try{await access('.env.local');console.log('.env.local already exists; it was not changed.');}
catch{await writeFile('.env.local',`DATABASE_PROVIDER=sqlite\nSQLITE_DATABASE_FILE=.data/fieldora.sqlite\nSESSION_SECRET=${randomBytes(48).toString('base64url')}\n`,{mode:0o600,flag:'wx'});console.log('Created .env.local with a new random demo-session secret.');}
console.log('Next: npm run db:migrate, then npm run dev.');
