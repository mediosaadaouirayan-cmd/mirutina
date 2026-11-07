import webpush from 'web-push';
import { store, getVapid } from './push-config.mjs';
const titles={peso:'Registra tu peso',desayuno:'Hora de desayunar',entreno:'Tu entrenamiento',comida:'Hora de comer',merienda:'Hora de merendar',cena:'Hora de cenar',creatina:'Creatina diaria'};
const bodies={peso:'Pésate al levantarte y guarda tu registro.',desayuno:'Consulta el desayuno de hoy en Mi rutina.',entreno:'¿Entrenas hoy? Recuerda registrar tu sesión.',comida:'Tienes tu comida y cantidades en la app.',merienda:'Consulta la merienda de hoy.',cena:'Tu cena está en el menú de hoy.',creatina:'Recuerda tu dosis habitual de 3–5 g.'};
export default async function handler(){
 const v=getVapid();if(!v.publicKey||!v.privateKey||!v.subject){console.error('Missing VAPID environment variables');return new Response('Missing configuration',{status:503})}
 webpush.setVapidDetails(v.subject,v.publicKey,v.privateKey);
 const now=new Date();const dateParts=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Madrid',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23',weekday:'short'}).formatToParts(now);
 const part=(type)=>dateParts.find(x=>x.type===type)?.value;
 const day=`${part('year')}-${part('month')}-${part('day')}`;const minute=Number(part('minute'));const current=`${part('hour')}:${String(Math.floor(minute/15)*15).padStart(2,'0')}`;
 const db=store();const {blobs}=await db.list({prefix:'device/'});let sent=0;
 for(const b of blobs){
  try{
   const d=await db.get(b.key,{type:'json'});if(!d?.subscription)continue;
   let changed=false;
   for(const [type,setting] of Object.entries(d.reminders||{})){
     if(!setting.on||setting.time!==current)continue;
     // Evita reenvíos en la misma fecha / tipo si se ejecuta de nuevo el cron.
     const key=`${day}:${type}`;if(d.lastSent?.[type]===key)continue;
     // Marca antes de enviar: reintentos de red no duplican avisos.
     d.lastSent={...(d.lastSent||{}),[type]:key};changed=true;
     await db.setJSON(b.key,d);
     try{await webpush.sendNotification(d.subscription,JSON.stringify({title:titles[type]||'Mi rutina',body:bodies[type]||'Consulta tu rutina',url:'/'}),{TTL:900});sent++}
     catch(e){if(e.statusCode===404||e.statusCode===410){await db.delete(b.key);break;}console.error('Push error',e.statusCode||e.message)}
   }
  }catch(e){console.error('Record error',e.message)}
 }
 return new Response(`Enviadas: ${sent}`);
}
