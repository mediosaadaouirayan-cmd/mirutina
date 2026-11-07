import { store, getVapid, response, validId, sanitizeReminders } from './push-config.mjs';
export default async function handler(req){
  if(req.method==='GET'){
    const keys=getVapid();return keys.publicKey?response({publicKey:keys.publicKey}):response({error:'Faltan claves VAPID en Netlify'},503);
  }
  if(req.method!=='POST'&&req.method!=='DELETE')return response({error:'Método no permitido'},405);
  try{
    const data=await req.json();
    if(!validId(data.id))return response({error:'Identificador inválido'},400);
    const db=store();
    if(req.method==='DELETE'){await db.delete('device/'+data.id);return response({ok:true});}
    const sub=data.subscription;
    if(!sub||typeof sub.endpoint!=='string'||!sub.endpoint.startsWith('https://')||sub.endpoint.length>2000||!sub.keys?.p256dh||!sub.keys?.auth)return response({error:'Suscripción inválida'},400);
    const reminders=sanitizeReminders(data.reminders);
    await db.setJSON('device/'+data.id,{subscription:sub,reminders,timezone:'Europe/Madrid',lastSent:{}});
    return response({ok:true});
  }catch(e){console.error(e);return response({error:'No se han podido guardar los avisos'},500)}
}
