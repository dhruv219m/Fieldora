import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import type { DatabaseSync } from 'node:sqlite';

type SqlValue = string | number | null;
type SqlResult = { rows: Record<string, unknown>[]; changes: number };
type TypedValue = { type: string; value?: string | number; base64?: string };
type PipelineResponse = { results?: { type: string; error?: { message?: string }; response?: { result?: { cols: {name:string}[]; rows: TypedValue[][]; affected_row_count: number } } }[] };
const sqliteConnections = new Map<string, DatabaseSync>();

export function provider(): 'sqlite' | 'turso' {
  const selected = process.env.DATABASE_PROVIDER || (process.env.TURSO_DATABASE_URL ? 'turso' : 'sqlite');
  if (selected !== 'sqlite' && selected !== 'turso') throw new Error('DATABASE_PROVIDER must be sqlite or turso.');
  if (selected === 'sqlite' && process.env.VERCEL) throw new Error('Configure Turso for Vercel; local SQLite is for development only.');
  return selected;
}
export function tursoEndpoint(): string {
  const raw = process.env.TURSO_DATABASE_URL;
  if (!raw || !process.env.TURSO_AUTH_TOKEN) throw new Error('Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN.');
  const url = new URL(raw.replace(/^(libsql|turso):\/\//, 'https://'));
  if (url.protocol !== 'https:' || url.username || url.password) throw new Error('Use the HTTPS, libsql or turso database URL supplied by Turso.');
  return new URL('/v2/pipeline', url).toString();
}
function argument(value: SqlValue): TypedValue {
  if (value === null) return {type:'null'};
  if (typeof value === 'string') return {type:'text',value};
  if (!Number.isFinite(value)) throw new Error('A SQL argument is not finite.');
  return Number.isInteger(value) ? {type:'integer',value:String(value)} : {type:'float',value};
}
function decoded(value: TypedValue): unknown {
  if (value.type === 'null') return null;
  if (value.type === 'integer' || value.type === 'float') return Number(value.value);
  if (value.type === 'text') return value.value ?? '';
  throw new Error('Unexpected database value type.');
}
async function remote(sql: string, args: SqlValue[], rows: boolean): Promise<SqlResult> {
  const response = await fetch(tursoEndpoint(), {
    method:'POST',
    headers:{Authorization:`Bearer ${process.env.TURSO_AUTH_TOKEN}`,'Content-Type':'application/json'},
    body:JSON.stringify({requests:[{type:'execute',stmt:{sql,args:args.map(argument),want_rows:rows}},{type:'close'}]}),
    cache:'no-store',redirect:'error',signal:AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error(`Database HTTP request failed (${response.status}).`);
  const data = await response.json() as PipelineResponse;
  const first=data.results?.[0];
  if (first?.type!=='ok' || !first.response?.result) throw new Error('Database query failed. Check that migrations have been applied.');
  const r=first.response.result;
  return {rows:r.rows.map(row=>Object.fromEntries(r.cols.map((col,i)=>[col.name,decoded(row[i])]))),changes:Number(r.affected_row_count)};
}
async function local(sql: string, args: SqlValue[], rows: boolean): Promise<SqlResult> {
  const file=resolve(process.env.SQLITE_DATABASE_FILE || '.data/fieldora.sqlite');
  let db=sqliteConnections.get(file);
  if(!db){mkdirSync(dirname(file),{recursive:true});const { DatabaseSync }=await import('node:sqlite');db=new DatabaseSync(file);db.exec('PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;');sqliteConnections.set(file,db);}
  const statement=db.prepare(sql);
  if(rows) return {rows:statement.all(...args) as Record<string,unknown>[],changes:0};
  const result=statement.run(...args);
  return {rows:[],changes:Number(result.changes)};
}
export async function executeSql(sql: string,args: SqlValue[]=[],rows=false): Promise<SqlResult> {
  return provider()==='turso'?remote(sql,args,rows):local(sql,args,rows);
}
export function database(){
  return {prepare(sql:string){return {bind(...args:SqlValue[]){return {
    async first<T>(){const r=await executeSql(sql,args,true);return (r.rows[0] as T|undefined)??null;},
    async run(){const r=await executeSql(sql,args);return {meta:{changes:r.changes}};},
  };}};}};
}
