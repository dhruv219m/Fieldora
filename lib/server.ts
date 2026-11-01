import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { seed, type Workspace } from './domain.ts';
import { database } from './storage.ts';
export { database } from './storage.ts';
const SESSION_SECONDS=30*24*60*60;
function secret(){const s=process.env.SESSION_SECRET;if(!s||s.length<32||s.startsWith('replace-this'))throw new Error('Set SESSION_SECRET to a random secret of at least 32 characters.');return s;}
function signature(value:string){return createHmac('sha256',secret()).update(value).digest('base64url');}
export function identity(request:Request,now=Math.floor(Date.now()/1000)){
  const candidate=request.headers.get('cookie')?.split(';').map(s=>s.trim()).find(s=>s.startsWith('ks_demo='))?.slice(8);
  if(candidate){
    const parts=candidate.split('.'),[id,expires,mac]=parts;
    if(parts.length===3&&/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(id)&&/^\d{10}$/.test(expires)&&/^[a-zA-Z0-9_-]{43}$/.test(mac)&&Number(expires)>now&&Number(expires)<=now+SESSION_SECONDS){
      const expected=Buffer.from(signature(`${id}.${expires}`));const supplied=Buffer.from(mac);
      if(expected.length===supplied.length&&timingSafeEqual(expected,supplied))return {owner:'demo:'+id,cookie:null};
    }
  }
  const id=randomUUID(),value=`${id}.${now+SESSION_SECONDS}`;
  const secure=new URL(request.url).protocol==='https:'||!!process.env.VERCEL;
  return {owner:'demo:'+id,cookie:`ks_demo=${value}.${signature(value)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${SESSION_SECONDS}${secure?'; Secure':''}`};
}
export function sameOrigin(request:Request){
  const origin=request.headers.get('origin');if(!origin)return false;
  try{
    const internal=new URL(request.url),host=request.headers.get('host')||internal.host;
    const forwarded=request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim();
    const protocol=process.env.VERCEL?'https':(forwarded||internal.protocol.slice(0,-1));
    if(!['http','https'].includes(protocol)||/[\s,\/\\]/.test(host))return false;
    const expected=new URL(`${protocol}://${host}`).origin;
    return origin===expected;
  }catch{return false;}
}
export async function readWorkspace(owner:string){
  const db=database();let row=await db.prepare('SELECT data, revision FROM workspaces WHERE owner = ?').bind(owner).first<{data:string;revision:number}>();
  if(!row){await db.prepare('INSERT INTO workspaces (owner, data, revision, updated_at) VALUES (?, ?, 0, ?) ON CONFLICT(owner) DO NOTHING').bind(owner,JSON.stringify(seed()),new Date().toISOString()).run();row=await db.prepare('SELECT data, revision FROM workspaces WHERE owner = ?').bind(owner).first<{data:string;revision:number}>();}
  if(!row)throw new Error('Unable to load your farm.');return {...JSON.parse(row.data),revision:row.revision} as Workspace & {revision:number};
}
export function json(data:unknown,status=200,cookie:string|null=null){const headers:Record<string,string>={'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};if(cookie)headers['Set-Cookie']=cookie;return new Response(JSON.stringify(data),{status,headers});}
