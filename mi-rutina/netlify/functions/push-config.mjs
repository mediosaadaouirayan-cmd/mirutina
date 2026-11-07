import { getStore } from '@netlify/blobs';
export const store = () => getStore('mi-rutina-reminders');
export const getVapid = () => ({ publicKey: process.env.VAPID_PUBLIC_KEY, privateKey: process.env.VAPID_PRIVATE_KEY, subject: process.env.VAPID_SUBJECT });
export const response = (data,status=200) => new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});
export const validId = id => typeof id === 'string' && /^[A-Za-z0-9_-]{20,80}$/.test(id);
export const validTime = v => typeof v === 'string' && /^([01]\d|2[0-3]):(00|15|30|45)$/.test(v);
export const TYPES = ['peso','desayuno','entreno','comida','merienda','cena','creatina'];
export function sanitizeReminders(input){
 const reminders={};
 for(const type of TYPES){const x=input?.[type];reminders[type]={on: x?.on===true,time:validTime(x?.time)?x.time:'09:00'};}
 return reminders;
}
