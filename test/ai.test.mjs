import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import handler from '../api/generate-ped.js';

const api=readFileSync(new URL('../api/generate-ped.js',import.meta.url),'utf8');
function response(){
 return {
  statusCode:200,headers:{},body:null,
  status(code){this.statusCode=code;return this},
  setHeader(name,value){this.headers[name.toLowerCase()]=value;return this},
  json(body){this.body=body;return this}
 };
}
test('API GET dichiara soltanto stato di configurazione',async()=>{
 const res=response();
 await handler({method:'GET',headers:{}},res);
 assert.equal(res.statusCode,200);
 assert.equal(typeof res.body.enabled,'boolean');
 assert.equal(res.headers['cache-control'],'no-store');
 assert.ok(!JSON.stringify(res.body).includes('sk-'));
});
test('API rifiuta metodi diversi da GET e POST',async()=>{
 const res=response();
 await handler({method:'DELETE',headers:{}},res);
 assert.equal(res.statusCode,405);
});
test('API rifiuta POST cross-origin senza raggiungere OpenAI',async()=>{
 const res=response();
 await handler({method:'POST',headers:{origin:'https://attacker.example'},body:{}},res);
 assert.equal(res.statusCode,403);
});
test('Backend usa solo categorie della repository, JSON strutturato e secret server-side',()=>{
 const contents=JSON.parse(readFileSync(new URL('../content-library.json',import.meta.url),'utf8')).contents;
 const cats=new Set(contents.map(x=>x.category));
 assert.equal(cats.size,12);
 assert.match(api,/categoryMatch=library\.find/);
 assert.match(api,/const categoryEntries=library\.filter/);
 assert.match(api,/KNOWLEDGE BASE editoriale/);
 assert.match(api,/text:\{format:\{type:'json_schema'/);
 assert.match(api,/process\.env\.OPENAI_API_KEY/);
 assert.match(api,/store:false/);
 assert.match(api,/validCode\(req\.headers\['x-ped-ai-code'\]\)/);
 assert.match(api,/await allowQuota\(req\)/);
 assert.doesNotMatch(api,/AIza[0-9A-Za-z_-]+|sk-proj-[0-9A-Za-z_-]+/);
});

test('Origini Vercel ufficiali consentite, domini esterni rifiutati',async()=>{
 const allowed=[
  ['https://primo-ped.vercel.app','primo-ped.vercel.app'],
  ['https://primo-ped-vpace-9250.vercel.app','primo-ped-vpace-9250.vercel.app'],
  ['https://primo-ped-git-main-vpace-9250.vercel.app','primo-ped-git-main-vpace-9250.vercel.app'],
  ['https://primo-pmapvaz33-vpace-9250.vercel.app','primo-pmapvaz33-vpace-9250.vercel.app']
 ];
 for(const [origin,host] of allowed){
  const res=response();
  await handler({method:'POST',headers:{origin,host},body:{}},res);
  assert.notEqual(res.statusCode,403,'Rifiutata origine valida '+origin);
 }
 const res=response();
 await handler({method:'POST',headers:{origin:'https://evil.example',host:'primo-ped.vercel.app'},body:{}},res);
 assert.equal(res.statusCode,403);
});

test('Fetch Metadata ammette il progetto stesso, anche da URL di deploy, e blocca le richieste cross-site',async()=>{
 const variants=[
  ['https://primo-ped.vercel.app','primo-ped.vercel.app'],
  ['https://primo-new123-vpace-9250.vercel.app','primo-new123-vpace-9250.vercel.app']
 ];
 for(const [origin,host] of variants){
  const res=response();
  await handler({method:'POST',headers:{origin,host,'sec-fetch-site':'same-origin'},body:{}},res);
  assert.notEqual(res.statusCode,403);
 }
 const res=response();
 await handler({method:'POST',headers:{origin:'https://attacker.example',host:'primo-ped.vercel.app','sec-fetch-site':'cross-site'},body:{}},res);
 assert.equal(res.statusCode,403);
});
