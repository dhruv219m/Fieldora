import { identity, readWorkspace, json } from '../../../lib/server';
export const dynamic='force-dynamic';
export const runtime='nodejs';
export async function GET(request:Request){
  let cookie:string|null=null;
  try{const session=identity(request);cookie=session.cookie;return json(await readWorkspace(session.owner),200,cookie);}
  catch(e){console.error('Workspace read failed:',e instanceof Error?e.message:'error');return json({error:'Your farm could not be loaded. Check the database, migration and session settings, then retry.'},503,cookie);}
}
