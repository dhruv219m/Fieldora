import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {randomBytes} from 'node:crypto';
import {identity,readWorkspace,database,sameOrigin} from '../lib/server.ts';
import {executeSql,provider} from '../lib/storage.ts';
process.env.SESSION_SECRET=randomBytes(48).toString('hex');
const dir=await mkdtemp(join(tmpdir(),'fieldora-unit-'));
process.env.DATABASE_PROVIDER='sqlite';process.env.SQLITE_DATABASE_FILE=join(dir,'farm.sqlite');delete process.env.VERCEL;
await executeSql(await readFile(new URL('../migrations/001_initial.sql',import.meta.url),'utf8'));
const request=(cookie='',headers={})=>new Request('https://farm.example/api/workspace',{headers:{...headers,...(cookie?{cookie}:{})}});
test('signed session cookie is stable, HttpOnly, secure and isolated from untrusted identity headers',()=>{
 const first=identity(request());assert.match(first.cookie,/HttpOnly; SameSite=Strict/);assert.match(first.cookie,/; Secure$/);
 const cookie=first.cookie.split(';')[0];const next=identity(request(cookie));assert.equal(next.owner,first.owner);assert.equal(next.cookie,null);
 const impersonator=identity(request('',{'oai-authenticated-user-id':first.owner}));assert.notEqual(impersonator.owner,first.owner);
 const changed=cookie.slice(0,8)+(cookie[8]==='a'?'b':'a')+cookie.slice(9);assert.notEqual(identity(request(changed)).owner,first.owner);
 const future=Math.floor(Date.now()/1000)+31*86400;assert.notEqual(identity(request(cookie),future).owner,first.owner);
});
test('SQLite data persists by owner and revision updates reject stale writes',async()=>{
 const a=identity(request()).owner,b=identity(request()).owner;
 const initial=await readWorkspace(a);assert.equal(initial.revision,0);assert.equal(initial.profile.name,'Meera Devi');
 initial.profile.name='Saved test profile';delete initial.revision;
 const result=await database().prepare('UPDATE workspaces SET data = ?, revision = revision + 1 WHERE owner = ? AND revision = ?').bind(JSON.stringify(initial),a,0).run();assert.equal(result.meta.changes,1);
 assert.equal((await readWorkspace(a)).profile.name,'Saved test profile');assert.equal((await readWorkspace(b)).profile.name,'Meera Devi');
 const stale=await database().prepare('UPDATE workspaces SET revision = revision + 1 WHERE owner = ? AND revision = ?').bind(a,0).run();assert.equal(stale.meta.changes,0);
});
test('Turso uses HTTPS, bound parameters, a closed connection and typed row decoding',async()=>{
 const original=globalThis.fetch;process.env.DATABASE_PROVIDER='turso';process.env.TURSO_DATABASE_URL='libsql://example-org.turso.io';process.env.TURSO_AUTH_TOKEN='unit-test-token';
 let seen;
 globalThis.fetch=async(url,options)=>{seen={url,options,body:JSON.parse(options.body)};return Response.json({results:[{type:'ok',response:{type:'execute',result:{cols:[{name:'name'},{name:'revision'},{name:'optional'}],rows:[[{type:'text',value:'test'},{type:'integer',value:'3'},{type:'null'}]],affected_row_count:0}}},{type:'ok',response:{type:'close'}}]});};
 try{const payload="x'; DROP TABLE workspaces; --";const r=await executeSql('SELECT name, revision, optional FROM example WHERE name = ?',[payload],true);assert.equal(seen.url,'https://example-org.turso.io/v2/pipeline');assert.equal(seen.body.requests[0].stmt.sql.includes(payload),false);assert.equal(seen.body.requests[0].stmt.args[0].value,payload);assert.equal(seen.body.requests[1].type,'close');assert.deepEqual(r.rows,[{name:'test',revision:3,optional:null}]);}
 finally{globalThis.fetch=original;process.env.DATABASE_PROVIDER='sqlite';delete process.env.TURSO_DATABASE_URL;delete process.env.TURSO_AUTH_TOKEN;}
});
test('Vercel cannot accidentally use ephemeral local SQLite',()=>{
 process.env.VERCEL='1';assert.throws(()=>provider(),/Configure Turso/);delete process.env.VERCEL;
});

test('same-origin validation works behind Next.js proxy URLs and rejects cross-origin writes',()=>{
 const proxied=new Request('http://localhost:3000/api/actions',{headers:{host:'farm.example',origin:'https://farm.example','x-forwarded-proto':'https'}});assert.equal(sameOrigin(proxied),true);
 const wrong=new Request('http://localhost:3000/api/actions',{headers:{host:'farm.example',origin:'https://wrong.example','x-forwarded-proto':'https'}});assert.equal(sameOrigin(wrong),false);
 assert.equal(sameOrigin(new Request('https://farm.example/api/actions')),false);
});
