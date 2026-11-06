import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/generate-ped.js';
function response(){return {statusCode:200,headers:{},body:null,status(code){this.statusCode=code;return this},setHeader(name,value){this.headers[name.toLowerCase()]=value;return this},json(body){this.body=body;return this}}}
test('Endpoint AI risulta disattivato',()=>{
 const res=response();handler({method:'GET',headers:{}},res);
 assert.equal(res.statusCode,200);assert.deepEqual(res.body,{enabled:false});assert.equal(res.headers['cache-control'],'no-store');
});
test('Nessuna chiamata AI possibile, anche con POST',()=>{
 for(const method of ['POST','PUT','DELETE']){
  const res=response();handler({method,headers:{origin:'https://primo-ped.vercel.app'},body:{}},res);
  assert.equal(res.statusCode,503);assert.match(res.body.error,/AI disattivata/);
 }
});
