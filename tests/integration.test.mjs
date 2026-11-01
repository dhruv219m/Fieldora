import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {randomBytes} from 'node:crypto';
import {spawn,spawnSync} from 'node:child_process';
import {createServer} from 'node:net';
import {defaults} from '../lib/domain.ts';
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
test('production Next.js API saves, validates, isolates sessions and survives reloads',async()=>{
 const folder=await mkdtemp(join(tmpdir(),'fieldora-integration-'));
 const port=await new Promise(resolve=>{const socket=createServer();socket.listen(0,'127.0.0.1',()=>{const n=socket.address().port;socket.close(()=>resolve(n));});});
 const env={...process.env,NODE_ENV:'production',DATABASE_PROVIDER:'sqlite',SQLITE_DATABASE_FILE:join(folder,'farm.sqlite'),SESSION_SECRET:randomBytes(48).toString('hex'),NEXT_TELEMETRY_DISABLED:'1',VERCEL:''};
 const migrate=spawnSync(process.execPath,['scripts/migrate.mjs'],{env,encoding:'utf8'});assert.equal(migrate.status,0,migrate.stderr);
 const app=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port',String(port)],{env,stdio:['ignore','pipe','pipe']});
 let logs='';for(const stream of [app.stdout,app.stderr])stream.on('data',chunk=>{logs=(logs+chunk).slice(-8000);});
 const base=`http://127.0.0.1:${port}`;let cookie='',state;
 const call=async(path,options={},session=cookie)=>{const r=await fetch(base+path,{...options,headers:{...(session?{cookie:session}:{}),...options.headers}});const c=r.headers.get('set-cookie');if(c&&session===cookie)cookie=c.split(';')[0];return {status:r.status,data:await r.json()};};
 const action=async(type,payload,revision=state.revision)=>{const r=await call('/api/actions',{method:'POST',headers:{origin:base,'content-type':'application/json'},body:JSON.stringify({type,payload,revision})});if(r.status===200)state=r.data;return r;};
 try{
  const until=Date.now()+25000;let ready=false;
  while(Date.now()<until){try{const r=await call('/api/workspace');if(r.status===200){state=r.data;ready=true;break;}}catch{}if(app.exitCode!==null)break;await pause(150);}
  assert.ok(ready,'Next.js did not become ready. '+logs);assert.ok(cookie);assert.equal(state.profile.name,'Meera Devi');
  let r=await action('profile',{...state.profile,name:'Integration Farmer'});assert.equal(r.status,200);
  const oldRevision=state.revision;r=await action('comparison',defaults);assert.equal(r.status,200);assert.equal(state.comparisons.length,1);
  r=await action('task',{id:'soil'},oldRevision);assert.equal(r.status,409);
  r=await action('listing',{crop:'Wheat',variety:'Test lot',quantity:20,reserve:2350,grade:'Farmer grade',location:'Karnal',harvest:'2026-04-15',closes:new Date(Date.now()+86400000).toISOString(),quality:'Test only'});assert.equal(r.status,200);const lot=state.listings[0].id;
  r=await action('bid',{listingId:lot,price:2349,transport:0,buyer:'Test Mill'});assert.equal(r.status,400);
  r=await action('bid',{listingId:lot,price:2500,transport:1200,buyer:'Test Mill'});assert.equal(r.status,200);
  r=await action('acceptBid',{listingId:lot,bidId:state.listings[0].bids[0].id});assert.equal(r.status,200);assert.equal(state.listings[0].status,'accepted');
  r=await action('booking',{facility:'grain',crop:'Wheat',quantity:20,duration:35,pickup:'Karnal',start:new Date().toISOString().slice(0,10)});assert.equal(r.status,200);assert.equal(state.bookings[0].total,3700);
  r=await action('advanceBooking',{id:state.bookings[0].id});assert.equal(r.status,200);assert.equal(state.bookings[0].status,1);
  r=await call('/api/workspace');assert.equal(r.data.profile.name,'Integration Farmer');assert.equal(r.data.bookings[0].status,1);
  const other=await call('/api/workspace',{headers:{'oai-authenticated-user-id':'Integration Farmer'}},'');assert.equal(other.data.profile.name,'Meera Devi');
  r=await call('/api/actions',{method:'POST',headers:{origin:'https://wrong.example','content-type':'application/json'},body:'{}'});assert.equal(r.status,403);
  r=await call('/api/actions',{method:'POST',headers:{origin:base,'content-type':'application/json'},body:'{"bad"'});assert.equal(r.status,400);
  r=await action('reset',{});assert.equal(r.status,200);assert.equal(state.profile.name,'Meera Devi');assert.equal(state.comparisons.length,0);assert.equal(state.bookings.length,0);
 }finally{app.kill('SIGTERM');await Promise.race([new Promise(resolve=>app.once('exit',resolve)),pause(3000)]);if(app.exitCode===null)app.kill('SIGKILL');}
});
