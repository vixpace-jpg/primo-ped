import {readFileSync} from 'node:fs';
import {createHash,timingSafeEqual} from 'node:crypto';
const library=JSON.parse(readFileSync(new URL('../content-library.json',import.meta.url),'utf8')).contents;
const MODEL='openrouter/free'; // Solo router gratuito: non permettere modelli a pagamento tramite configurazione.
const schema={type:'object',additionalProperties:false,required:['contents'],properties:{contents:{type:'array',items:{type:'object',additionalProperties:false,required:['title','headline','subhead','body','other','caption','format','slides'],properties:{title:{type:'string'},headline:{type:'string'},subhead:{type:'string'},body:{type:'string'},other:{type:'string'},caption:{type:'string'},format:{type:'string',enum:['post','story','carousel']},slides:{type:'array',items:{type:'object',additionalProperties:false,required:['headline','subhead','body'],properties:{headline:{type:'string'},subhead:{type:'string'},body:{type:'string'}}}}}}}}};
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('it').trim();
const send=(res,status,object)=>res.status(status).setHeader('Cache-Control','no-store').setHeader('X-Content-Type-Options','nosniff').json(object);
const isConfigured=()=>Boolean(process.env.OPENROUTER_API_KEY&&process.env.PED_AI_ACCESS_CODE&&process.env.UPSTASH_REDIS_REST_URL&&process.env.UPSTASH_REDIS_REST_TOKEN);
function validCode(code){if(typeof code!=='string'||code.length>256||!code||!process.env.PED_AI_ACCESS_CODE)return false;return timingSafeEqual(createHash('sha256').update(code).digest(),createHash('sha256').update(process.env.PED_AI_ACCESS_CODE).digest())}
function originAllowed(origin,req){
 // Browser-verified Fetch Metadata is the primary same-origin signal.
 // It works for all project aliases, preview URLs, and custom domains.
 // Cross-site browser requests never reach the billable OpenAI endpoint.
 const site=String(req.headers['sec-fetch-site']||'').toLowerCase();
 if(site==='cross-site')return false;
 const host=String(req.headers['x-forwarded-host']||req.headers.host||'').split(',')[0].trim().toLowerCase();
 let currentHost='';
 try{currentHost=new URL('https://'+host).host}catch{return false}
 const fixed=new Set(['primo-ped.vercel.app','primo-ped-vpace-9250.vercel.app','primo-ped-git-main-vpace-9250.vercel.app']);
 const configuredOrigin=(()=>{try{return process.env.PED_ALLOWED_ORIGIN?new URL(process.env.PED_ALLOWED_ORIGIN).origin:null}catch{return null}})();
 const sameHostOrigin=typeof origin==='string'&&origin==='https://'+currentHost;
 const configured=typeof origin==='string'&&configuredOrigin===origin;
 const fixedOrigin=(()=>{try{return typeof origin==='string'&&new URL(origin).protocol==='https:'&&fixed.has(new URL(origin).hostname)}catch{return false}})();
 if(site==='same-origin'&&(sameHostOrigin||fixedOrigin||configured))return true;
 if(origin&&site!=='none'){
  try{
   const source=new URL(origin);
   if(source.protocol==='https:'&&(source.hostname===currentHost||fixed.has(source.hostname)||configured))return true;
  }catch{return false}
 }
 // For browsers omitting Origin, require an explicit matching referrer plus
 // the browser-generated same-origin fetch metadata.
 if(site==='same-origin'&&!origin){
  try{return new URL(req.headers.referer||'').hostname===currentHost}catch{return false}
 }
 return false;
}
async function rateLimit(key,ttl){const script='local n=redis.call("INCR",KEYS[1]); if n==1 then redis.call("EXPIRE",KEYS[1],ARGV[1]) end; return n';const url=process.env.UPSTASH_REDIS_REST_URL.replace(/\/$/,'');const response=await fetch(url,{method:'POST',headers:{Authorization:'Bearer '+process.env.UPSTASH_REDIS_REST_TOKEN,'Content-Type':'application/json'},body:JSON.stringify(['EVAL',script,'1',key,String(ttl)]),signal:AbortSignal.timeout(5000)});if(!response.ok)throw Error('rate limiter unavailable');const data=await response.json();if(data.error||!Number.isFinite(Number(data.result)))throw Error('rate limiter unavailable');return Number(data.result)}
async function allowQuota(req){const ip=String(req.headers['x-vercel-forwarded-for']||req.headers['x-real-ip']||req.headers['x-forwarded-for']||'unknown').split(',')[0].slice(0,80);const id=createHash('sha256').update(ip).digest('hex').slice(0,20);const hour=Math.floor(Date.now()/3600000),day=Math.floor(Date.now()/86400000);const [client,total]=await Promise.all([rateLimit('ped:client:'+id+':'+hour,3700),rateLimit('ped:daily:'+day,90000)]);return client<=10&&total<=80}
function validate(body){
 if(!body||typeof body!=='object'||Array.isArray(body))return null;
 const {category,topicId='',month,count,tone,existingTitles}=body;
 if(typeof category!=='string'||category.length>100||typeof topicId!=='string'||topicId.length>80||
 !/^\d{4}-(0[1-9]|1[0-2])$/.test(month||'')||![4,6,8,10].includes(count)||
 !['primo','informativo','audace'].includes(tone)||!Array.isArray(existingTitles)||
 existingTitles.length>50||existingTitles.some(x=>typeof x!=='string'||x.length>150))return null;
 const categoryMatch=library.find(x=>norm(x.category)===norm(category));
 if(!categoryMatch)return null;
 const topic=topicId?library.find(x=>x.id===topicId&&norm(x.category)===norm(categoryMatch.category)):null;
 if(topicId&&!topic)return null;
 return {category:categoryMatch.category,topic,month,count,tone,existingTitles};
}
function outputText(data){if(data.error||data.status==='incomplete')throw Error('Incomplete output');const blocks=(data.output||[]).flatMap(x=>x.content||[]);if(blocks.some(x=>x.type==='refusal'))throw Error('Model refusal');return JSON.parse(blocks.filter(x=>x.type==='output_text').map(x=>x.text).join(''))}
const clip=(s,n)=>typeof s==='string'?s.trim().slice(0,n):'';
function cleanContents(data,count,existing){if(!data||!Array.isArray(data.contents)||data.contents.length!==count)throw Error('Invalid response count');const titles=new Set(existing.map(norm));return data.contents.map(c=>{if(!c||!['post','story','carousel'].includes(c.format))throw Error('Invalid format');const result={title:clip(c.title,140),headline:clip(c.headline,250),subhead:clip(c.subhead,250),body:clip(c.body,3000),other:clip(c.other,2000),caption:clip(c.caption,5500),format:c.format,slides:Array.isArray(c.slides)?c.slides.slice(0,8).map(sl=>({headline:clip(sl.headline,250),subhead:clip(sl.subhead,250),body:clip(sl.body,1500)})):[]};if(!result.title||!result.headline||!result.body||result.caption.length<250||titles.has(norm(result.title)))throw Error('Missing or duplicated content');if(c.format==='carousel'&&(result.slides.length<3||result.slides.some(x=>!x.headline)))throw Error('Invalid carousel slides');titles.add(norm(result.title));return result})}
export default async function handler(req,res){
 if(req.method==='GET')return send(res,200,{enabled:isConfigured()});
 if(req.method!=='POST'){res.setHeader('Allow','GET, POST');return send(res,405,{error:'Metodo non consentito'})}
 if(!originAllowed(req.headers.origin,req))return send(res,403,{error:'Origine non autorizzata'});
 if(!isConfigured())return send(res,503,{error:'OpenRouter non ancora configurato su Vercel: aggiungi OPENROUTER_API_KEY'});
 if(Number(req.headers['content-length']||0)>12000)return send(res,413,{error:'Richiesta troppo grande'});
 if(!validCode(req.headers['x-ped-ai-code']))return send(res,401,{error:'Codice di accesso AI non valido'});
 const input=validate(req.body);if(!input)return send(res,400,{error:'Seleziona una categoria della repository e da 4 a 10 Content'});
 try{if(!await allowQuota(req))return send(res,429,{error:'Limite di generazioni raggiunto. Riprova più tardi.'})}catch(e){console.error('PED rate limiter unavailable');return send(res,503,{error:'Protezione temporaneamente non disponibile'})}
 const {category,topic,month,count,tone,existingTitles}=input;
 const categoryEntries=library.filter(x=>x.category===category);
 const examples=(topic?[topic,...categoryEntries.filter(x=>x.id!==topic.id)]:categoryEntries).slice(0,10).map(x=>({title:x.title,hook:x.hook,explanation:x.explanation,advice:x.advice,format:x.format,rubric:x.rubric}));
 const instructions=[
 'Sei copywriter senior per Centri Dentistici Primo. Genera un piano editoriale odontoiatrico in italiano, utile, accurato, originale.',
 'La categoria scelta determina il PED. Tratta la repository fornita come KNOWLEDGE BASE editoriale e scegli autonomamente sotto-temi, angoli diversi, falsi miti e consigli. Un eventuale focus indica una preferenza e non un testo da replicare.',
 'Leggi la knowledge base per capirne lessico, rigore clinico, struttura e stile, poi elabora contenuti originali: non copiare hook, titoli o caption. Non introdurre dati medici non supportati dalla knowledge base.',
 'Tono richiesto: '+tone+'. Usa un tono Primo: chiaro, autorevole, accessibile, non enfatico. Caption più lunghe e argomentate, circa 900–1500 caratteri, 3–6 paragrafi, hook iniziale e conclusione sobria.',
 'Per ogni Content produci titolo, headline, subhead, testo informativo body, approfondimento other, caption completa e format.',
 'Distribuisci formati post, story e carousel. Per i carousel scrivi 4–6 slide (headline, subhead, body); negli altri formati slides vuoto.',
 'Evita promesse di risultati, garanzie di efficacia, diagnosi individuali, prezzi, omaggi, gratis/gratuito/free, superlativi sanitari e claim non comprovati.',
 'Raccomanda una valutazione professionale quando appropriato. Non inventare dati clinici o statistiche.',
 'I titoli devono essere diversi da quelli già presenti. Rispondi soltanto nel JSON dello schema.'
 ].join('\n');
 try{
  const response=await fetch('https://openrouter.ai/api/v1/responses',{method:'POST',headers:{Authorization:'Bearer '+process.env.OPENROUTER_API_KEY,'Content-Type':'application/json','HTTP-Referer':'https://primo-ped.vercel.app','X-Title':'PRIMO PED'},body:JSON.stringify({model:MODEL,store:false,max_output_tokens:12000,instructions,input:JSON.stringify({task:'Genera esattamente '+count+' Content originali',month,category,focusTopic:topic?.title||null,knowledgeBase:examples,existingTitles}),text:{format:{type:'json_schema',name:'primo_ped_content',strict:true,schema}}}),signal:AbortSignal.timeout(115000)});
  const data=await response.json().catch(()=>({}));
  if(!response.ok){
   const code=String(data?.error?.code||data?.error?.metadata?.code||'');
   console.error('OpenRouter request status',response.status,code||'unknown');
   if(code==='credit_balance_exhausted'||code==='insufficient_quota'||code==='billing_hard_limit_reached'){
    return send(res,402,{error:'La quota gratuita OpenRouter è esaurita o non disponibile. Non è necessario acquistare credito: riprova quando si rinnova il limite.'});
   }
   if(response.status===429||response.status===503){
    return send(res,429,{error:'OpenRouter gratuito ha raggiunto il limite di richieste (anche quelle fallite contano). Riprova più tardi o domani.'});
   }
   if(response.status===401)return send(res,502,{error:'Chiave API OpenRouter non valida: verifica OPENROUTER_API_KEY su Vercel.'});
   return send(res,502,{error:'OpenRouter non è riuscito a generare il PED. Verifica la chiave e riprova.'});
  }
  const contents=cleanContents(outputText(data),count,existingTitles);
  return send(res,200,{contents,category,focus:topic?.title||null,model:data.model||MODEL});
 }catch(e){console.error('PED generation failed',e.message);return send(res,502,{error:'Il modello gratuito non ha completato il PED. Prova con 4 Content e riprova.'})}
}