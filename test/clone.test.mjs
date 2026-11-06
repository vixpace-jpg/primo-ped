import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const js = html.match(/<script>([\s\S]*?)<\/script>/)?.[1] || '';
test('JavaScript inline valido', () => { new vm.Script(js); });
test('Primo avvio senza temi o Content', () => {
  assert.match(js, /const offlineLibrary=\[\]/);
  assert.match(js, /const defaultState=\{themes:\[\],months:\{\},selectedMonth:currentMonth\}/);
  assert.doesNotMatch(js, /for\(const entry of offlineLibrary\)/);
  assert.doesNotMatch(js, /URLSearchParams\(location.search\).has\('demo'\)/);
});
test('Storage separato e nessun dato editoriale di origine', () => {
  assert.match(js, /primo-ped-v1/);
  assert.match(js, /primo-ped-refs/);
  assert.doesNotMatch(html, /Erreics|20 temi|const titles=|Benessere quotidiano/);
  assert.doesNotMatch(js, /localStorage\.(?:getItem|setItem)\('ped-studio-v1'/);
  assert.doesNotMatch(js, /indexedDB.open\('ped-studio-refs'/);
});
test('Azioni e formati compatibili', () => {
  for (const id of ['addContent','resetMonth','themeSelect','loadThemeButton','generate','deliver','exportProject','importProject']) {
    assert.match(html,new RegExp('id="'+id+'"'));
  }
  assert.match(js, /\$\('#generate'\).addEventListener\('click',openThemeBuilder\)/);
  assert.match(js, /ped-studio-theme-v1/);
  assert.match(js, /ped-studio-v2/);
  assert.match(js, /word\/document.xml/);
});

test('La ricerca temi usa la repository editoriale completa, senza prepopolare lo stato',()=>{
 const data=JSON.parse(readFileSync(new URL('../content-library.json',import.meta.url),'utf8'));
 assert.equal(data.contents.length,60);
 assert.equal(new Set(data.contents.map(t=>t.category)).size,12);
 assert.match(js,/fetch\('\.\/content-library\.json'/);
 assert.match(js,/repositoryThemes=payload\.contents/);
 assert.match(js,/function availableThemeChoices\(\)/);
 assert.match(js,/function chooseTheme\(id\)/);
 assert.match(js,/state\.themes\.push\(found\)/);
 const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('it').trim();
 for(const query of ['impianti','ortodonzia','spazzolino','tartaro']){
  const hits=data.contents.filter(t=>norm(t.title).includes(norm(query))||norm(t.category).includes(norm(query))||norm(t.rubric).includes(norm(query)));
  assert.ok(hits.length>0,'Nessun suggerimento per '+query);
 }
 assert.ok(data.contents.every(t=>t.title&&t.category));
});
