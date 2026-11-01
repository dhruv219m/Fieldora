import { readdir,readFile } from 'node:fs/promises';
import { executeSql, provider } from '../lib/storage.ts';
try {
  for(const name of (await readdir(new URL('../migrations/',import.meta.url))).filter(n=>n.endsWith('.sql')).sort()){
    const sql=await readFile(new URL('../migrations/'+name,import.meta.url),'utf8');
    // Migration 001 is a single, idempotent schema statement. No user records are seeded here.
    await executeSql(sql);console.log('Applied '+name+' to '+provider()+'.');
  }
} catch(e){console.error('Migration failed:',e instanceof Error?e.message:'Unknown error.');process.exitCode=1;}
