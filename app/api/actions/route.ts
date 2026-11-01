import { identity, readWorkspace, json, database, sameOrigin } from '../../../lib/server';
import { mutate } from '../../../lib/domain';
export const dynamic='force-dynamic';
export const runtime='nodejs';
export async function POST(request:Request){
  if(!sameOrigin(request))return json({error:'Please submit from this website.'},403);
  if(!request.headers.get('content-type')?.includes('application/json'))return json({error:'Expected JSON.'},415);
  if(Number(request.headers.get('content-length'))>32000)return json({error:'This request is too large.'},413);
  let action;
  try{const body=await request.text();if(body.length>32000)return json({error:'This request is too large.'},413);action=JSON.parse(body);}
  catch{return json({error:'Invalid JSON request.'},400);}
  if(!action||typeof action.type!=='string'||!Number.isInteger(action.revision))return json({error:'Choose an action and a valid revision.'},400);
  let cookie:string|null=null;
  try{
    const session=identity(request);cookie=session.cookie;const current=await readWorkspace(session.owner);
    if(action.revision!==current.revision)return json({error:'Your farm changed in another tab. We refreshed it; please try again.',workspace:current},409,cookie);
    let next;
    try{next=mutate(current,action);}catch(e){return json({error:e instanceof Error?e.message:'Check your inputs.'},400,cookie);}
    delete next.revision;
    const result=await database().prepare('UPDATE workspaces SET data = ?, revision = revision + 1, updated_at = ? WHERE owner = ? AND revision = ?').bind(JSON.stringify(next),new Date().toISOString(),session.owner,current.revision).run();
    if(!result.meta.changes)return json({error:'Another change was saved. Refresh and try again.'},409,cookie);
    return json({...next,revision:current.revision+1},200,cookie);
  }catch(e){console.error('Workspace save failed:',e instanceof Error?e.message:'error');return json({error:'Your change could not be saved. Check the database and session settings, then retry.'},503,cookie);}
}
