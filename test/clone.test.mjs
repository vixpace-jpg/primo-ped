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
  assert.match(js, /\$\('#generate'\).addEventListener\('click',createPedFromSelectedTheme\)/);
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

test('Crea PED è basato sulla repository, AI disattivata',()=>{
 assert.match(html,/id="generate"[^>]*>[\s\S]*?Crea PED<\/button>/);
 assert.match(html,/Crea PED con l'AI<\/button>/);
 assert.match(html,/disabled aria-disabled="true"/);
 assert.match(js,/function createPedFromSelectedTheme\(\)/);
 assert.match(js,/function buildPedContentFromTopic\(topic,existingPosts\)/);
 assert.match(js,/libraryTopicId:topic\.id/);
 assert.match(js,/usedIds\.has\(t\.id\)/);
 assert.match(js,/usedTitles\.has\(norm\(t\.title\)\)/);
 assert.doesNotMatch(js,/fetch\('\/api\/generate-ped'/);
 assert.doesNotMatch(html,/id="pedAICategory"|id="pedAIAccessCode"/);
 const repoPage=readFileSync(new URL('../repository.html',import.meta.url),'utf8');
 assert.match(repoPage,/function addItem\(/);
 assert.match(repoPage,/data-add/);
});

test('La barra Reset mese non interrompe la renderizzazione e la selezione dei temi',()=>{
 assert.doesNotMatch(js,/(?<!\$)\$\('#resetMonth,#resetMonthMobile'\)\.forEach/);
 assert.match(js,/\$\$\('#resetMonth,#resetMonthMobile'\)\.forEach\(b=>b\.disabled/);
 assert.match(js,/\$\$\('#resetMonth,#resetMonthMobile'\)\.forEach\(button=>button\.addEventListener/);
 assert.match(js,/function chooseTheme\(id\)/);
 assert.match(js,/renderThemeSearch\(\)/);
});

test('Link condivisibile avvia un workspace vuoto senza cancellare i progetti esistenti',()=>{
 assert.match(html,/id="shareCleanLink"/);
 assert.match(html,/id="shareCleanLinkMobile"/);
 assert.match(html,/<symbol id="i-link"/);
 assert.match(js,/launchParams\.get\('nuovo'\)==='1'/);
 assert.match(js,/history\.replaceState\(null,'',launchUrl\.pathname\+launchUrl\.search\+launchUrl\.hash\)/);
 assert.match(js,/launchUrl\.searchParams\.set\('workspace',uid\(\)\)/);
 assert.match(js,/primo-ped-workspace-/);
 assert.match(js,/localStorage\.getItem\(storageKey\)/);
 assert.match(js,/localStorage\.setItem\(storageKey,JSON\.stringify\(state\)\)/);
 assert.match(js,/url\.searchParams\.set\('nuovo','1'\)/);
 assert.match(js,/\$\$\('#shareCleanLink,#shareCleanLinkMobile'\)\.forEach/);
 assert.match(js,/function createPedFromSelectedTheme\(\)/);
});

test('Animazione iniziale elegante, una sola volta per scheda, accessibile',()=>{
 assert.match(html,/<style id="ped-entry-motion">/);
 assert.match(html,/pedEnterHeader/);
 assert.match(html,/pedEnterLeft/);
 assert.match(html,/pedEnterUp/);
 assert.match(html,/html\.ped-first-enter \.workspace > \.main/);
 assert.match(html,/prefers-reduced-motion:reduce/);
 assert.match(html,/sessionStorage\.getItem\('primo-ped-entry-seen'\)/);
 assert.match(html,/sessionStorage\.setItem\('primo-ped-entry-seen','1'\)/);
 assert.doesNotMatch(html,/id="introOverlay"|id="splashScreen"/);
});
