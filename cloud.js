
let SB = null;
let CLOUD_DATA = null;
const LOCAL_FALLBACK_KEY = 'courtsideDataV2';

function clone(x){ return JSON.parse(JSON.stringify(x)); }

function normalizeContent(d){
  const merge=(base,extra)=>{
    if(Array.isArray(base)) return Array.isArray(extra)?extra:base;
    if(base && typeof base==='object'){
      const out={...base};
      if(extra && typeof extra==='object') for(const k of Object.keys(extra)) out[k]=k in out?merge(out[k],extra[k]):extra[k];
      return out;
    }
    return extra===undefined?base:extra;
  };
  const baseData=(typeof DEFAULT_DATA!=='undefined'?DEFAULT_DATA:{});
  const DATA_VERSION='2026-08-12-final-stats-v1';
  const incoming=d||{};
  const needsFinalStats=incoming.contentVersion!==DATA_VERSION;
  const x=merge(clone(baseData),clone(incoming));
  x.contentVersion=DATA_VERSION;
  x.site=x.site||{}; x.forecast=x.forecast||{}; x.forecast.arguments=Array.isArray(x.forecast.arguments)?x.forecast.arguments:[]; x.gi=x.gi||{}; x.players=Array.isArray(x.players)?x.players:[]; x.goat=Array.isArray(x.goat)?x.goat:[]; x.news=Array.isArray(x.news)?x.news:[];
  x.currentGI=Array.isArray(x.currentGI)?x.currentGI:[];
  if(needsFinalStats){ x.currentGI=clone(baseData.currentGI||[]); x.goat=clone(baseData.goat||[]); }
  if(!x.currentGI.length && Array.isArray(baseData.currentGI)) x.currentGI=clone(baseData.currentGI);
  // Never let an incomplete/empty cloud payload erase the working built-in content.
  const defaults=clone(baseData);
  if(!x.players.length && Array.isArray(defaults.players)) x.players=clone(defaults.players);
  if(!x.goat.length && Array.isArray(defaults.goat)) x.goat=clone(defaults.goat);
  if(!x.news.length && Array.isArray(defaults.news)) x.news=clone(defaults.news);
  if(!x.forecast.mvp) x.forecast.mvp=defaults.forecast?.mvp||'Nikola Jokić';
  if(!x.forecast.dpoy) x.forecast.dpoy=defaults.forecast?.dpoy||'Victor Wembanyama';
  if(!x.forecast.roy) x.forecast.roy=defaults.forecast?.roy||'Cam Boozer';
  if(!x.forecast.mip) x.forecast.mip=defaults.forecast?.mip||'Stephon Castle';
  if(!x.forecast.champion) x.forecast.champion=defaults.forecast?.champion||'Oklahoma City Thunder';
  x.photos=x.photos||{}; x.gallery=Array.isArray(x.gallery)?x.gallery:[]; x.media=Array.isArray(x.media)?x.media:[];
  x.forecast.reasoning=x.forecast.reasoning||'Мы ставим Nikola Jokić первым, потому что его влияние не зависит от одного показателя: он одновременно создаёт эффективное нападение, контролирует подбор и стабильно превращает владения в качественные броски для себя и партнёров.';
  if(!x.forecast.arguments.length) x.forecast.arguments=['Эффективность и объём производства остаются элитными одновременно.','Создание моментов через пас и игру из поста повышает ценность каждого владения.','Его влияние меньше зависит от попаданий одного конкретного типа и лучше переносится между матчами.'];
  x.pages=x.pages||{};
  x.pages.gi={eyebrow:'04 · GOAT INDEX',title:x.gi.title||'GOAT Index',intro:x.gi.text||'',methodTitle:'Что такое GI',methodText:'GI — GOAT Index. Это внутренняя шкала COURTSIDE для сравнения силы игрока. Она не заменяет PTS, REB, AST или TS%.',...x.pages.gi};
  if(!x.pages.gi.eyebrow)x.pages.gi.eyebrow='04 · GOAT INDEX';
  if(!x.pages.gi.title)x.pages.gi.title='GOAT Index';
  if(!x.pages.gi.intro)x.pages.gi.intro=x.gi.text;
  if(!x.pages.gi.methodTitle)x.pages.gi.methodTitle='Что такое GI';
  if(!x.pages.gi.methodText)x.pages.gi.methodText='GI — GOAT Index. Это внутренняя шкала COURTSIDE для сравнения силы игрока. Она не заменяет PTS, REB, AST или TS%.';
  x.pages.goat={eyebrow:'05 · ALL-TIME',title:'GOAT по GI.',intro:'Исторический GOAT Index оценивает карьеру, пик, стабильность, победы и контекст эпохи. Это рейтинг COURTSIDE, а не официальная награда NBA.',...x.pages.goat};
  if(!x.pages.goat.eyebrow)x.pages.goat.eyebrow='05 · ALL-TIME';
  if(!x.pages.goat.title)x.pages.goat.title='GOAT по GI.';
  if(!x.pages.goat.intro)x.pages.goat.intro='Исторический GOAT Index оценивает карьеру, пик, стабильность, победы и контекст эпохи. Это рейтинг COURTSIDE, а не официальная награда NBA.';
  x.pages.stats={eyebrow:'06 · PLAYER LAB',title:'Top 100 GI · 2025–26',intro:'Сезонный рейтинг игроков по основным показателям и GOAT Index.',...x.pages.stats};
  if(!x.pages.stats.eyebrow)x.pages.stats.eyebrow='06 · PLAYER LAB';
  if(!x.pages.stats.title)x.pages.stats.title='Top 100 GI · 2025–26';
  if(!x.pages.stats.intro)x.pages.stats.intro='Сезонный рейтинг игроков по основным показателям и GOAT Index.';
  x.pages.forum={eyebrow:'07 · DISCUSSION',title:'Форум.',intro:'Обсуждаем матчи, рейтинги, прогнозы и спорные решения.',topics:[{title:'Кто должен быть №1 по GI?',tag:'GI',text:'Сравните лидеров текущего рейтинга и объясните, что для вас важнее: производство, эффективность или влияние.',replies:12},{title:'Главный вопрос сезона 2025–26',tag:'SEASON',text:'Какая команда или игрок сильнее всего изменили ваши ожидания?',replies:8},{title:'GOAT: пик против карьеры',tag:'HISTORY',text:'Должен ли исторический рейтинг сильнее учитывать пик игрока?',replies:21}],...x.pages.forum};
  if(x.gi.title==='Game Impact Index' || !x.gi.title) x.gi.title='GOAT Index';
  if(!x.gi.text || x.gi.text.includes('влияние игрока через')) x.gi.text='GI — GOAT Index, наша единая шкала для сравнения силы игрока. Для сезона она учитывает производство, эффективность, создание моментов, защиту, стабильность и вклад в победы. Для исторического рейтинга добавляется карьерный вес и контекст эпохи. GI не является официальной наградой NBA.';
  if(Array.isArray(x.goat)) x.goat=x.goat.map(p=>[p[0],Number(p[1])||0,Number(p[2])||0,Number(p[3])||0,Number(p[4])||0,Number(p[5])||0]);
  return x;
}
function esc(s){ return String(s ?? '').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m])); }
function isCloudConfigured(){
  const c=window.COURTSIDE_CONFIG||{};
  return !!(c.SUPABASE_URL && c.SUPABASE_KEY &&
    !c.SUPABASE_URL.includes('PASTE_') && !c.SUPABASE_KEY.includes('PASTE_'));
}
async function ensureSupabase(){
  if(!isCloudConfigured()) return null;
  if(SB) return SB;
  if(!window.supabase) throw new Error('Supabase library did not load.');
  const c=window.COURTSIDE_CONFIG;
  SB=window.supabase.createClient(c.SUPABASE_URL,c.SUPABASE_KEY);
  return SB;
}
function localData(){
  try { const s=JSON.parse(localStorage.getItem(LOCAL_FALLBACK_KEY)||'null'); return s||clone(DEFAULT_DATA); }
  catch { return clone(DEFAULT_DATA); }
}
async function getData(){
  const fallback=normalizeContent(localData());
  if(CLOUD_DATA) return normalizeContent(CLOUD_DATA);
  try{
    const sb=await ensureSupabase();
    if(sb){
      const query=sb.from('site_content').select('payload').eq('id',1).maybeSingle();
      const result=await Promise.race([
        query,
        new Promise((_,reject)=>setTimeout(()=>reject(new Error('Cloud read timeout')),2200))
      ]);
      const {data,error}=result;
      if(error) throw error;
      if(data?.payload){
        const remote=normalizeContent(data.payload);
        // A partially initialized Supabase row should not blank the public site.
        if(remote.gi?.text && remote.players?.length && remote.goat?.length){
          CLOUD_DATA=remote;
          localStorage.setItem(LOCAL_FALLBACK_KEY,JSON.stringify(CLOUD_DATA));
          return CLOUD_DATA;
        }
        console.warn('Cloud payload is incomplete; keeping local/default content.');
      }
    }
  }catch(e){ console.warn('Cloud read failed, using local/default content:',e.message); }
  return fallback;
}
async function saveCloud(payload){
  const sb=await ensureSupabase();
  if(!sb) throw new Error('Supabase не настроен. Заполни config.js.');
  const {data:{user}}=await sb.auth.getUser();
  if(!user) throw new Error('Нужно войти в админ-панель.');
  const {data:profile,error:pe}=await sb.from('profiles').select('is_admin').eq('id',user.id).maybeSingle();
  if(pe) throw pe;
  if(!profile?.is_admin) throw new Error('У этого аккаунта нет прав администратора.');
  const {error}=await sb.from('site_content').upsert({id:1,payload,updated_at:new Date().toISOString()});
  if(error) throw error;
  CLOUD_DATA=clone(payload);
  localStorage.setItem(LOCAL_FALLBACK_KEY,JSON.stringify(payload));
}
function assetUrl(path){ return path || ''; }

async function listMediaLibrary(){
  const sb=await ensureSupabase(); if(!sb) throw new Error('Supabase не настроен.');
  const {data,error}=await sb.storage.from('site-images').list('',{limit:100,sortBy:{column:'created_at',order:'desc'}});
  if(error) throw error;
  return (data||[]).filter(x=>x.name && !x.name.endsWith('/')).map(x=>{
    const path=x.name;
    const {data:u}=sb.storage.from('site-images').getPublicUrl(path);
    return {name:x.name,path,url:u.publicUrl,size:x.metadata?.size||0,created_at:x.created_at||''};
  });
}
async function deleteMediaImage(path){
  const sb=await ensureSupabase(); if(!sb) throw new Error('Supabase не настроен.');
  if(!(await isAdmin())) throw new Error('Нет прав администратора.');
  const {error}=await sb.storage.from('site-images').remove([path]);
  if(error) throw error;
}
async function addGalleryImage(url,title='Новая фотография',caption=''){
  const d=await getData(); d.gallery=Array.isArray(d.gallery)?d.gallery:[];
  d.gallery.unshift({title,caption,image:url}); await saveCloud(d); return d;
}

async function uploadImage(file, slot){
  const sb=await ensureSupabase();
  if(!sb) throw new Error('Supabase не настроен.');
  const {data:{user}}=await sb.auth.getUser();
  if(!user) throw new Error('Сначала войди.');
  const ext=(file.name.split('.').pop()||'jpg').toLowerCase().replace(/[^a-z0-9]/g,'') || 'jpg';
  const safeSlot=String(slot).replace(/[^a-z0-9_-]/gi,'-');
  const path=`${safeSlot}-${Date.now()}.${ext}`;
  const {error}=await sb.storage.from('site-images').upload(path,file,{upsert:false,contentType:file.type||'image/jpeg',cacheControl:'3600'});
  if(error) throw error;
  const {data}=sb.storage.from('site-images').getPublicUrl(path);
  return data.publicUrl;
}

async function isAdmin(){
  try{
    const sb=await ensureSupabase();
    if(!sb) return false;
    const {data:{user}}=await sb.auth.getUser();
    if(!user) return false;
    const {data,error}=await sb.from('profiles').select('is_admin').eq('id',user.id).maybeSingle();
    return !error && !!data?.is_admin;
  }catch{return false}
}

function nav(active){
  document.querySelectorAll('.links a').forEach(a=>a.classList.toggle('active',a.dataset.page===active));
}

function renderStatsTable(arr){
  return arr.map((p,i)=>`<tr>
    <td class="rank-cell">${i+1}</td>
    <td><div class="player-cell"><b>${esc(p[0])}</b><span>${esc(p[1])}</span></div></td>
    <td>${esc(p[2])}</td><td>${p[3]}</td><td>${p[4]}</td><td>${p[5]}</td><td>${p[6]}%</td><td class="gi-cell">${p[7]}</td>
  </tr>`).join('');
}

function renderCurrentGITable(arr){
  return arr.map((p,i)=>`<tr><td class="rank-cell">${i+1}</td><td><div class="player-cell"><b>${esc(p[0])}</b></div></td><td>${esc(p[1])}</td><td class="gi-cell">${Number(p[2]).toFixed(1)}</td></tr>`).join('');
}
function renderGoatRows(arr){
  return arr.map((p,i)=>`<div class="rank-row"><span class="rank">${String(i+1).padStart(2,'0')}</span><div><b>${esc(p[0])}</b><small>Peak ${Number(p[2]).toFixed(1)} · Off ${Number(p[3]).toFixed(1)} · Def ${Number(p[4]).toFixed(1)} · Conf ${Number(p[5]).toFixed(1)}%</small></div><strong>${Number(p[1]).toFixed(1)}</strong></div>`).join('');
}


function defaultHomeBlocks(){return [
  {id:'hero',type:'hero',visible:true,eyebrow:'01 · COURTSIDE',title:'{{headline}}',text:'{{intro}}',quote:'Смотреть на игру целиком. Не только на строку с очками.',image:'hero'},
  {id:'book',type:'split',visible:true,eyebrow:'THE BOOK',title:'Смотреть глубже.',heading:'Сначала цифры. Потом выводы.',text:'Статистика показывает результат. GOAT Index помогает собрать картину целиком.',buttonText:'Статистика →',buttonHref:'stats.html',image:'stats'},
  {id:'forecast',type:'feature',visible:true,eyebrow:'02 · FORECAST',title:'Прогноз на сезон.',text:'{{forecastText}}',buttonText:'Все прогнозы →',buttonHref:'forecast.html'},
  {id:'gi',type:'feature',visible:true,eyebrow:'03 · GOAT INDEX',title:'{{giTitle}}',text:'{{giText}}',buttonText:'Открыть GI →',buttonHref:'gi.html',image:'gi'},
  {id:'news',type:'news',visible:true,eyebrow:'04 · NEWSROOM',title:'Последние записи.',limit:3},
  {id:'custom',type:'text',visible:false,eyebrow:'05 · NOTE',title:'Новая глава.',text:'Добавь сюда свой текст из админки.'}
]}
function homeBlocks(d){d.site=d.site||{};if(!Array.isArray(d.site.blocks)||!d.site.blocks.length)d.site.blocks=defaultHomeBlocks();return d.site.blocks}
function resolveToken(v,d){return String(v??'').replace(/\{\{headline\}\}/g,d.site.headline).replace(/\{\{intro\}\}/g,d.site.intro).replace(/\{\{forecastText\}\}/g,d.forecast.text).replace(/\{\{giTitle\}\}/g,d.gi.title).replace(/\{\{giText\}\}/g,d.gi.text)}
function blockImage(d,key){if(!key)return ''; if(/^https?:\/\//i.test(String(key)))return String(key); return d.photos?.[key]||key}
function renderHomeBlocks(d){const root=document.querySelector('#homeCanvas');if(!root)return;const blocks=homeBlocks(d).filter(b=>b.visible!==false);const img=(b)=>blockImage(d,b.image);root.innerHTML=blocks.map(b=>{
 const e=esc(b.eyebrow||'');const t=esc(resolveToken(b.title||'',d));const x=esc(resolveToken(b.text||'',d));
 if(b.type==='hero')return `<section class="hero cs-reveal"><div class="hero-copy"><div class="eyebrow">${e}</div><h1>${t}</h1><p class="lead">${x}</p><div class="rule"></div><p class="quote">${esc(b.quote||'')}</p></div><div class="hero-photo cs-3d"><img src="${esc(img(b)||'nba-1.jpg')}" alt=""><div class="caption">${esc(b.caption||'REGULAR SEASON · SPEED · SPACE · READING THE POSSESSION')}</div><div class="hero-data-chip"><b>GI</b><strong>${esc(d.players?.[0]?.[7]??'98.0')}</strong><span>LEADERS</span></div></div></section>`;
 if(b.type==='split')return `<section class="section cs-reveal"><div class="rule"></div><div class="grid2"><div><div class="eyebrow">${e}</div><h2 class="section-title">${t}</h2><h3>${esc(b.heading||'')}</h3><p class="lead">${x}</p></div><div class="card cs-3d">${img(b)?`<img class="block-image" src="${esc(img(b))}" alt="">`:''}<h3>${esc(b.cardTitle||b.heading||'Открыть Player Lab')}</h3><p class="muted">${x}</p><a class="btn" href="${esc(b.buttonHref||'stats.html')}">${esc(b.buttonText||'Открыть →')}</a></div></div></section>`;
 if(b.type==='news'){const ns=d.news.slice(0,Number(b.limit)||3);return `<section class="section cs-reveal"><div class="eyebrow">${e}</div><h2 class="section-title">${t}</h2><div class="news-grid">${ns.map(n=>`<article class="news-card cs-3d"><img src="${esc(/^https?:\/\//i.test(String(n.image||''))?n.image:(d.photos?.[n.image]||n.image||'nba-1.jpg'))}" alt=""><span>${esc(n.tag)}</span><h3>${esc(n.title)}</h3><p>${esc(n.text)}</p></article>`).join('')}</div></section>`}
 if(b.type==='feature')return `<section class="section cs-reveal"><div class="card cs-3d">${img(b)?`<img class="block-image" src="${esc(img(b))}" alt="">`:''}<div class="eyebrow">${e}</div><h2 class="section-title">${t}</h2><p class="lead">${x}</p>${b.buttonHref?`<a class="btn" href="${esc(b.buttonHref)}">${esc(b.buttonText||'Открыть →')}</a>`:''}</div></section>`;
 if(b.type==='image')return `<section class="section cs-reveal"><div class="eyebrow">${e}</div><h2 class="section-title">${t}</h2><figure class="studio-image"><img src="${esc(img(b)||b.imageUrl||'')}" alt="${t}"><figcaption>${x}</figcaption></figure></section>`;
 return `<section class="section cs-reveal"><div class="eyebrow">${e}</div><h2 class="section-title">${t}</h2><p class="lead">${x}</p>${b.buttonHref?`<a class="btn" href="${esc(b.buttonHref)}">${esc(b.buttonText||'Открыть →')}</a>`:''}</section>`
 }).join('');requestAnimationFrame(()=>{root.querySelectorAll('.cs-reveal').forEach((e,i)=>setTimeout(()=>e.classList.add('cs-in'),i*70));root.querySelectorAll('.cs-3d').forEach(e=>{e.onpointermove=x=>{const r=e.getBoundingClientRect(),a=(x.clientX-r.left)/r.width-.5,c=(x.clientY-r.top)/r.height-.5;e.style.setProperty('--rx',`${-c*3}deg`);e.style.setProperty('--ry',`${a*4}deg`)};e.onpointerleave=()=>{e.style.setProperty('--rx','0deg');e.style.setProperty('--ry','0deg')}})})}
function renderStudio(d){const box=document.querySelector('#pageStudio');if(!box)return;const blocks=homeBlocks(d);const types={hero:'Hero',split:'Два блока',feature:'Акцент',news:'Новости',text:'Текст',image:'Фото'};box.innerHTML=`<div class="studio-toolbar"><button class="btn" id="studioSave">Сохранить порядок</button><button class="btn secondary" id="studioAddText">+ Текст</button><button class="btn secondary" id="studioAddImage">+ Фото</button><button class="btn secondary" id="studioReset">Сбросить блоки</button></div><div class="studio-list">${blocks.map((b,i)=>`<article class="studio-row" draggable="true" data-i="${i}"><div class="studio-drag">${String(i+1).padStart(2,'0')}</div><div class="studio-fields"><div class="studio-top"><b>${types[b.type]||b.type}</b><label class="switch"><input class="sv" type="checkbox" ${b.visible!==false?'checked':''}><span></span></label></div><div class="studio-grid"><input class="sb-eyebrow" value="${esc(b.eyebrow||'')}"><input class="sb-title" value="${esc(b.title||'')}"><textarea class="sb-text">${esc(b.text||'')}</textarea><input class="sb-image" value="${esc(b.image||b.imageUrl||'')}" placeholder="photo role или URL"><input class="sb-button" value="${esc(b.buttonText||'')}"><input class="sb-href" value="${esc(b.buttonHref||'')}"></div></div><div class="studio-actions"><button class="mini up">↑</button><button class="mini down">↓</button><button class="danger mini remove">Удалить</button></div></article>`).join('')}</div>`;
 const rows=[...box.querySelectorAll('.studio-row')]; const move=(r,dir)=>{const n=dir<0?r.previousElementSibling:r.nextElementSibling;if(n)dir<0?r.parentNode.insertBefore(r,n):r.parentNode.insertBefore(n,r)};rows.forEach(r=>{r.querySelector('.up').onclick=()=>move(r,-1);r.querySelector('.down').onclick=()=>move(r,1);r.querySelector('.remove').onclick=()=>r.remove()});
 const collect=()=>[...box.querySelectorAll('.studio-row')].map(r=>{const i=Number(r.dataset.i),old=blocks[i]||{type:r.dataset.type||'text'};return {...old,visible:r.querySelector('.sv').checked,eyebrow:r.querySelector('.sb-eyebrow').value,title:r.querySelector('.sb-title').value,text:r.querySelector('.sb-text').value,image:r.querySelector('.sb-image').value,buttonText:r.querySelector('.sb-button').value,buttonHref:r.querySelector('.sb-href').value}});
 box.querySelector('#studioSave').onclick=async()=>{try{const n=await getData();n.site.blocks=collect();await saveCloud(n);renderHomeBlocks(n);setMsg('Главная страница сохранена.','ok')}catch(e){setMsg(e.message,'error')}};
 box.querySelector('#studioAddText').onclick=()=>{const n=box.querySelector('.studio-list'),r=document.createElement('article');r.className='studio-row';r.draggable=true;r.dataset.i=blocks.length;r.dataset.type='text';r.innerHTML=`<div class="studio-drag">+</div><div class="studio-fields"><div class="studio-top"><b>Текст</b><label class="switch"><input class="sv" type="checkbox" checked><span></span></label></div><div class="studio-grid"><input class="sb-eyebrow" value="NEW · NOTE"><input class="sb-title" value="Новый блок"><textarea class="sb-text">Напиши здесь свой текст.</textarea><input class="sb-image" value=""><input class="sb-button" value=""><input class="sb-href" value=""></div></div><div class="studio-actions"><button class="mini up">↑</button><button class="mini down">↓</button><button class="danger mini remove">Удалить</button></div>`;n.appendChild(r);r.querySelector('.up').onclick=()=>move(r,-1);r.querySelector('.down').onclick=()=>move(r,1);r.querySelector('.remove').onclick=()=>r.remove()};
 box.querySelector('#studioAddImage').onclick=()=>{const n=box.querySelector('.studio-list'),r=document.createElement('article');r.className='studio-row';r.dataset.i=blocks.length;r.dataset.type='image';r.innerHTML=`<div class="studio-drag">+</div><div class="studio-fields"><div class="studio-top"><b>Фото</b><label class="switch"><input class="sv" type="checkbox" checked><span></span></label></div><div class="studio-grid"><input class="sb-eyebrow" value="NEW · IMAGE"><input class="sb-title" value="Новая фотография"><textarea class="sb-text" placeholder="Подпись"></textarea><input class="sb-image" placeholder="URL фото из Media Library"><input class="sb-button"><input class="sb-href"></div></div><div class="studio-actions"><button class="mini up">↑</button><button class="mini down">↓</button><button class="danger mini remove">Удалить</button></div>`;n.appendChild(r);r.querySelector('.up').onclick=()=>move(r,-1);r.querySelector('.down').onclick=()=>move(r,1);r.querySelector('.remove').onclick=()=>r.remove()};
 box.querySelector('#studioReset').onclick=async()=>{if(!confirm('Вернуть исходную структуру главной?'))return;const n=await getData();n.site.blocks=defaultHomeBlocks();await saveCloud(n);renderStudio(n);renderHomeBlocks(n)}
}

async function initHome(){
  const d=await getData();
  const canvas=document.querySelector('#homeCanvas');
  if(canvas){renderHomeBlocks(d);nav('home');return;}
  const h=document.querySelector('#headline'), intro=document.querySelector('#intro'), hero=document.querySelector('#heroImage');
  if(h) h.innerHTML=esc(d.site.headline).replace(/\n/g,'<br>');
  if(intro) intro.textContent=d.site.intro;
  if(hero) hero.src=d.photos.hero || 'nba-1.jpg';
  document.querySelectorAll('[data-season]').forEach(e=>e.textContent=d.site.season);
  nav('home');
}
async function initForecast(){
  const d=await getData();
  const vals={mvp:d.forecast.mvp,dpoy:d.forecast.dpoy,roy:d.forecast.roy,mip:d.forecast.mip,champion:d.forecast.champion,confidence:d.forecast.confidence,forecastText:d.forecast.text,forecastReasoning:d.forecast.reasoning||''};
  for(const [id,val] of Object.entries(vals)){const e=document.querySelector('#'+id);if(e)e.textContent=val;}
  const args=document.querySelector('#forecastArguments');
  const argumentsList=(d.forecast.arguments||[]).filter(Boolean);
  if(args) args.innerHTML=(argumentsList.length?argumentsList:['Аргументы пока не добавлены. Открой Админ → Тексты и прогнозы и заполни поля «Аргумент №1–3».']).map((x,i)=>`<div class="forecast-argument"><span class="argument-no">${String(i+1).padStart(2,'0')}</span><p>${esc(x)}</p></div>`).join('');
  nav('forecast');
}
async function initStats(){
  const d=await getData(), body=document.querySelector('#statsBody'); if(!body)return;
  const pg=d.pages?.stats||{}; const ey=document.querySelector('#statsEyebrow'), title=document.querySelector('#statsTitle'), intro=document.querySelector('#statsIntro');
  if(ey)ey.textContent=pg.eyebrow||'06 · PLAYER LAB'; if(title)title.textContent=pg.title||'Top 100 GI · 2025–26'; if(intro)intro.textContent=pg.intro||'';
  const search=document.querySelector('#search'), pos=document.querySelector('#pos'), sort=document.querySelector('#sort');
  function draw(){
    const q=(search.value||'').toLowerCase(), p=pos.value, s=sort.value;
    const idx={gi:7,pts:3,reb:4,ast:5,ts:6}[s];
    let a=d.players.filter(x=>x[0].toLowerCase().includes(q)&&(p==='all'||x[2]===p)).slice().sort((a,b)=>b[idx]-a[idx]);
    body.innerHTML=renderStatsTable(a);
  }
  search.oninput=draw; pos.onchange=sort.onchange=draw; draw(); nav('stats');
  const im=document.querySelector('#statsImage'); if(im) im.src=d.photos.stats||'nba-4.jpg';
}
async function initGI(){
  const d=await getData(), pg=d.pages?.gi||{}, body=document.querySelector('#giBody');
  const current=Array.isArray(d.currentGI)&&d.currentGI.length?d.currentGI:(DEFAULT_DATA?.currentGI||[]);
  if(body) body.innerHTML=renderCurrentGITable(current);
  const ey=document.querySelector('#giEyebrow'), t=document.querySelector('#giText'), title=document.querySelector('#giTitle'), intro=document.querySelector('#giMethodText'), method=document.querySelector('#giMethodTitle'), im=document.querySelector('#giImage');
  if(ey)ey.textContent=pg.eyebrow||'04 · GOAT INDEX'; if(t)t.textContent=pg.intro||d.gi.text; if(title)title.textContent=pg.title||d.gi.title; if(method)method.textContent=pg.methodTitle||'Что такое GI'; if(intro)intro.textContent=pg.methodText||d.gi.text; if(im)im.src=d.photos.gi||'nba-2.jpg';
  nav('gi');
}
async function initGoat(){
  const d=await getData(), pg=d.pages?.goat||{}, el=document.querySelector('#goatBody');
  const ey=document.querySelector('#goatEyebrow'), title=document.querySelector('#goatTitle'), intro=document.querySelector('#goatIntro');
  if(ey)ey.textContent=pg.eyebrow||'05 · ALL-TIME'; if(title)title.textContent=pg.title||'GOAT по GI.'; if(intro)intro.textContent=pg.intro||'';
  const goatRows=Array.isArray(d.goat)&&d.goat.length?d.goat:(DEFAULT_DATA?.goat||[]);
  if(el)el.innerHTML=renderGoatRows(goatRows);
  const im=document.querySelector('#goatImage');if(im)im.src=d.photos.goat||'nba-3.jpg'; nav('goat');
}
async function initNews(){
  const d=await getData(), el=document.querySelector('#newsGrid');if(!el)return;
  el.innerHTML=d.news.map((n,i)=>`<article class="news-card"><img src="${esc(/^https?:\/\//i.test(String(n.image||''))?n.image:(d.photos?.[n.image]||n.image||'nba-1.jpg'))}" alt=""><span>${esc(n.tag)}</span><h3>${esc(n.title)}</h3><p>${esc(n.text)}</p></article>`).join('');
  nav('news');
}

async function initForum(){
  const d=await getData(), pg=d.pages?.forum||{}, list=document.querySelector('#forumTopics'); if(!list)return;
  const ey=document.querySelector('#forumEyebrow'), title=document.querySelector('#forumTitle'), intro=document.querySelector('#forumIntro');
  if(ey)ey.textContent=pg.eyebrow||'07 · DISCUSSION'; if(title)title.textContent=pg.title||'Форум.'; if(intro)intro.textContent=pg.intro||'';
  const topics=Array.isArray(pg.topics)?pg.topics:[];
  list.innerHTML=topics.map((x,i)=>`<article class="forum-topic cs-3d"><div class="forum-topic-no">${String(i+1).padStart(2,'0')}</div><div class="forum-topic-main"><span>${esc(x.tag||'DISCUSSION')}</span><h3>${esc(x.title||'Без названия')}</h3><p>${esc(x.text||'')}</p></div><div class="forum-topic-meta"><b>${Number(x.replies)||0}</b><small>ответов</small></div></article>`).join('') || '<div class="card"><h3>Пока нет тем.</h3><p class="muted">Администратор может добавить первую тему через Admin Desk.</p></div>';
  nav('forum');
}

function setMsg(text,type='',target='adminMsg'){
  const e=document.querySelector('#'+target);
  if(e){e.textContent=text;e.className='msg '+type;}
}

async function initEditor(){
  nav('editor');
  const login=document.querySelector('#loginPanel'), dash=document.querySelector('#dashboard'), userLine=document.querySelector('#userLine');
  const sb=await ensureSupabase();
  if(!sb){
    login.style.display='block'; dash.style.display='none';
    setMsg('Сначала заполни config.js: URL и Publishable key проекта Supabase.','error','loginMsg');
    return;
  }
  const {data:{session}}=await sb.auth.getSession();
  if(!session){login.style.display='block';dash.style.display='none';bindLogin();return;}
  if(!(await isAdmin())){login.style.display='block';dash.style.display='none';setMsg('Вход выполнен, но этот аккаунт не является администратором.','error','loginMsg');return;}
  login.style.display='none';dash.style.display='block';userLine.textContent=session.user.email;
  bindAdmin();
  const content=await getData();
  fillEditor(content);
  renderStudio(content);
}
function bindLogin(){
  const form=document.querySelector('#loginForm'); if(!form||form.dataset.bound)return; form.dataset.bound='1';
  form.onsubmit=async e=>{
    e.preventDefault(); setMsg('Выполняю вход…','','loginMsg');
    try{
      const sb=await ensureSupabase();
      const email=document.querySelector('#loginEmail').value.trim(), password=document.querySelector('#loginPassword').value;
      const {error}=await sb.auth.signInWithPassword({email,password});
      if(error) throw error;
      location.reload();
    }catch(err){setMsg(err.message||'Ошибка входа','error','loginMsg');}
  };
}
function fillEditor(d){
  const map={e_siteHeadline:d.site.headline,e_siteIntro:d.site.intro,e_season:d.site.season,e_model:d.site.model,e_mvp:d.forecast.mvp,e_dpoy:d.forecast.dpoy,e_roy:d.forecast.roy,e_mip:d.forecast.mip,e_champion:d.forecast.champion,e_confidence:d.forecast.confidence,e_forecastText:d.forecast.text,e_forecastReasoning:d.forecast.reasoning||'',e_forecastArg1:d.forecast.arguments?.[0]||'',e_forecastArg2:d.forecast.arguments?.[1]||'',e_forecastArg3:d.forecast.arguments?.[2]||'',e_giTitle:d.gi.title,e_giText:d.gi.text};
  for(const [id,v] of Object.entries(map)){const e=document.getElementById(id);if(e)e.value=v;}
  renderPlayerEditor(d.players); renderGoatEditor(d.goat); renderNewsEditor(d.news); renderPageSettings(d); renderForumEditor(d.pages?.forum||{});
  for(const key of ['hero','gi','goat','stats']){const im=document.getElementById('prev_'+key);if(im)im.src=d.photos[key]||'';}
}
function rowInput(value,cls=''){return `<input class="${cls}" value="${esc(value)}">`;}
function renderPlayerEditor(players){
  const el=document.querySelector('#playerEditor'); if(!el)return;
  el.innerHTML=`<div class="editor-table"><table><thead><tr><th>#</th><th>Игрок</th><th>Команда</th><th>Позиция</th><th>PTS</th><th>REB</th><th>AST</th><th>TS%</th><th>GI</th><th></th></tr></thead><tbody>${players.map((p,i)=>`<tr data-i="${i}"><td>${i+1}</td><td>${rowInput(p[0])}</td><td>${rowInput(p[1])}</td><td>${rowInput(p[2])}</td><td>${rowInput(p[3])}</td><td>${rowInput(p[4])}</td><td>${rowInput(p[5])}</td><td>${rowInput(p[6])}</td><td>${rowInput(p[7])}</td><td><button class="danger mini del-player">Удалить</button></td></tr>`).join('')}</tbody></table></div><button class="btn secondary" id="addPlayer">+ Добавить игрока</button>`;
  el.querySelectorAll('.del-player').forEach(b=>b.onclick=()=>{b.closest('tr').remove();renumber(el,'player')});
  el.querySelector('#addPlayer').onclick=()=>{const tb=el.querySelector('tbody');const i=tb.rows.length;const tr=document.createElement('tr');tr.dataset.i=i;tr.innerHTML=`<td>${i+1}</td><td>${rowInput('New Player')}</td><td>${rowInput('TEAM')}</td><td>${rowInput('G')}</td><td>${rowInput(0)}</td><td>${rowInput(0)}</td><td>${rowInput(0)}</td><td>${rowInput(0)}</td><td>${rowInput(0)}</td><td><button class="danger mini del-player">Удалить</button></td>`;tb.appendChild(tr);tr.querySelector('.del-player').onclick=()=>{tr.remove();renumber(el,'player')};};
}
function renumber(el){[...el.querySelectorAll('tbody tr')].forEach((tr,i)=>tr.querySelector('td').textContent=i+1);}
function collectPlayers(){
  return [...document.querySelectorAll('#playerEditor tbody tr')].map(tr=>{
    const v=[...tr.querySelectorAll('input')].map(x=>x.value.trim());
    return [v[0],v[1],v[2],Number(v[3])||0,Number(v[4])||0,Number(v[5])||0,Number(v[6])||0,Number(v[7])||0];
  });
}
function renderGoatEditor(goat){
  const el=document.querySelector('#goatEditor');if(!el)return;
  const val=(p,i)=>Number(p[i]??0);
  el.innerHTML=`<div class="editor-list">${goat.map((p,i)=>`<div class="edit-row goat-edit-row" data-i="${i}"><span class="drag-rank">${i+1}</span>${rowInput(p[0])}${rowInput(val(p,1))}${rowInput(val(p,2))}${rowInput(val(p,3))}${rowInput(val(p,4))}${rowInput(val(p,5))}<button class="danger mini del-goat">Удалить</button></div>`).join('')}</div><button class="btn secondary" id="addGoat">+ Добавить</button>`;
  el.querySelectorAll('.del-goat').forEach(b=>b.onclick=()=>b.closest('.edit-row').remove());
  el.querySelector('#addGoat').onclick=()=>{const r=document.createElement('div');r.className='edit-row goat-edit-row';r.innerHTML=`<span class="drag-rank">+</span>${rowInput('Player')}${rowInput(0)}${rowInput(0)}${rowInput(0)}${rowInput(0)}${rowInput(0)}<button class="danger mini del-goat">Удалить</button>`;el.querySelector('.editor-list').appendChild(r);r.querySelector('.del-goat').onclick=()=>r.remove();};
}
function collectGoat(){return [...document.querySelectorAll('#goatEditor .edit-row')].map(r=>{const v=[...r.querySelectorAll('input')].map(x=>x.value.trim());return [v[0],Number(v[1])||0,Number(v[2])||0,Number(v[3])||0,Number(v[4])||0,Number(v[5])||0];});}
function renderNewsEditor(news){
  const el=document.querySelector('#newsEditor');if(!el)return;
  el.innerHTML=news.map((n,i)=>`<div class="news-edit" data-i="${i}"><div class="news-edit-head"><b>Новость ${i+1}</b><button class="danger mini del-news">Удалить</button></div><div class="edit-grid"><div class="field"><label>Заголовок</label><input class="n-title" value="${esc(n.title)}"></div><div class="field"><label>Категория</label><input class="n-tag" value="${esc(n.tag)}"></div><div class="field" style="grid-column:1/-1"><label>Текст</label><textarea class="n-text">${esc(n.text)}</textarea></div><div class="field"><label>URL фотографии</label><input class="n-image" value="${esc(n.image||'')}"></div><div class="field"><label>Загрузить фото</label><input class="n-file" type="file" accept="image/*"></div></div></div>`).join('')+`<button class="btn secondary" id="addNews">+ Добавить новость</button>`;
  el.querySelectorAll('.del-news').forEach(b=>b.onclick=()=>b.closest('.news-edit').remove());
  el.querySelectorAll('.n-file').forEach(input=>input.onchange=async e=>{
    const f=e.target.files[0]; if(!f)return;
    try{
      setMsg('Загружаю фотографию новости…');
      const url=await uploadImage(f,'news');
      input.closest('.news-edit').querySelector('.n-image').value=url;
      setMsg('Фото новости загружено. Нажми «Сохранить всё».','ok');
    }catch(err){setMsg(err.message,'error');}
  });
  el.querySelector('#addNews').onclick=()=>{const n=document.createElement('div');n.className='news-edit';n.innerHTML=`<div class="news-edit-head"><b>Новая новость</b><button class="danger mini del-news">Удалить</button></div><div class="edit-grid"><div class="field"><label>Заголовок</label><input class="n-title"></div><div class="field"><label>Категория</label><input class="n-tag" value="NEWS"></div><div class="field" style="grid-column:1/-1"><label>Текст</label><textarea class="n-text"></textarea></div><div class="field"><label>URL фотографии</label><input class="n-image"></div><div class="field"><label>Загрузить фото</label><input class="n-file" type="file" accept="image/*"></div></div>`;el.insertBefore(n,el.querySelector('#addNews'));n.querySelector('.del-news').onclick=()=>n.remove();n.querySelector('.n-file').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{setMsg('Загружаю фотографию новости…');const url=await uploadImage(f,'news');n.querySelector('.n-image').value=url;setMsg('Фото новости загружено. Нажми «Сохранить всё».','ok')}catch(err){setMsg(err.message,'error')}};};
}
function collectNews(){return [...document.querySelectorAll('#newsEditor .news-edit')].map(r=>({title:r.querySelector('.n-title').value.trim(),tag:r.querySelector('.n-tag').value.trim(),text:r.querySelector('.n-text').value.trim(),image:r.querySelector('.n-image').value.trim()}));}

function renderPageSettings(d){
  const el=document.querySelector('#pageSettingsEditor'); if(!el)return; const p=d.pages||{};
  const rows=[['gi','GI',p.gi],['goat','GOAT',p.goat],['stats','Статистика',p.stats]];
  el.innerHTML=rows.map(([key,label,x])=>`<div class="page-settings-card" data-page-setting="${key}"><div class="page-settings-head"><div><span class="smallcaps">${label}</span><b>Настройки страницы</b></div><span class="page-setting-id">${key}</span></div><div class="edit-grid"><div class="field"><label>Eyebrow</label><input class="pg-eyebrow" value="${esc(x?.eyebrow||'')}"></div><div class="field"><label>Заголовок</label><input class="pg-title" value="${esc(x?.title||'')}"></div><div class="field" style="grid-column:1/-1"><label>Вступление</label><textarea class="pg-intro">${esc(x?.intro||'')}</textarea></div>${key==='gi'?`<div class="field"><label>Заголовок методики</label><input class="pg-method-title" value="${esc(x?.methodTitle||'')}"></div><div class="field"><label>Текст методики</label><textarea class="pg-method-text">${esc(x?.methodText||'')}</textarea></div>`:''}</div></div>`).join('');
}
function collectPageSettings(d){
  d.pages=d.pages||{};
  document.querySelectorAll('#pageSettingsEditor .page-settings-card').forEach(card=>{const k=card.dataset.pageSetting;const x=d.pages[k]||{};x.eyebrow=card.querySelector('.pg-eyebrow').value;x.title=card.querySelector('.pg-title').value;x.intro=card.querySelector('.pg-intro').value;if(k==='gi'){x.methodTitle=card.querySelector('.pg-method-title').value;x.methodText=card.querySelector('.pg-method-text').value;}d.pages[k]=x;});return d;
}
function renderForumEditor(pg){
  const el=document.querySelector('#forumEditor');if(!el)return; const topics=Array.isArray(pg.topics)?pg.topics:[];
  el.innerHTML=`<div class="edit-grid forum-base"><div class="field"><label>Eyebrow</label><input id="forumEyebrowEdit" value="${esc(pg.eyebrow||'07 · DISCUSSION')}"></div><div class="field"><label>Заголовок</label><input id="forumTitleEdit" value="${esc(pg.title||'Форум.')}"></div><div class="field" style="grid-column:1/-1"><label>Описание</label><textarea id="forumIntroEdit">${esc(pg.intro||'')}</textarea></div></div><div id="forumTopicEditor">${topics.map((t,i)=>forumTopicRow(t,i)).join('')}</div><button class="btn secondary" id="addForumTopic">+ Добавить тему</button>`;
  el.querySelectorAll('.del-forum-topic').forEach(b=>b.onclick=()=>b.closest('.forum-topic-edit').remove());
  el.querySelector('#addForumTopic').onclick=()=>{const wrap=el.querySelector('#forumTopicEditor');const r=document.createElement('div');r.innerHTML=forumTopicRow({title:'Новая тема',tag:'DISCUSSION',text:'',replies:0},Date.now());const row=r.firstElementChild;wrap.appendChild(row);row.querySelector('.del-forum-topic').onclick=()=>row.remove();};
}
function forumTopicRow(t,i){return `<div class="forum-topic-edit" data-i="${i}"><div class="forum-topic-edit-head"><b>Тема</b><button type="button" class="danger mini del-forum-topic">Удалить</button></div><div class="edit-grid"><div class="field"><label>Заголовок</label><input class="ft-title" value="${esc(t.title||'')}"></div><div class="field"><label>Тег</label><input class="ft-tag" value="${esc(t.tag||'DISCUSSION')}"></div><div class="field"><label>Ответов</label><input class="ft-replies" type="number" min="0" value="${Number(t.replies)||0}"></div><div class="field" style="grid-column:1/-1"><label>Текст</label><textarea class="ft-text">${esc(t.text||'')}</textarea></div></div></div>`;}
function collectForum(d){d.pages=d.pages||{};const pg=d.pages.forum||{};pg.eyebrow=document.querySelector('#forumEyebrowEdit')?.value||'07 · DISCUSSION';pg.title=document.querySelector('#forumTitleEdit')?.value||'Форум.';pg.intro=document.querySelector('#forumIntroEdit')?.value||'';pg.topics=[...document.querySelectorAll('#forumTopicEditor .forum-topic-edit')].map(r=>({title:r.querySelector('.ft-title').value.trim(),tag:r.querySelector('.ft-tag').value.trim(),text:r.querySelector('.ft-text').value.trim(),replies:Number(r.querySelector('.ft-replies').value)||0}));d.pages.forum=pg;return d;}

function collectBase(d){
  d.site.headline=document.querySelector('#e_siteHeadline').value;
  d.site.intro=document.querySelector('#e_siteIntro').value;
  d.site.season=document.querySelector('#e_season').value;
  d.site.model=document.querySelector('#e_model').value;
  d.forecast.mvp=document.querySelector('#e_mvp').value;
  d.forecast.dpoy=document.querySelector('#e_dpoy').value;
  d.forecast.roy=document.querySelector('#e_roy').value;
  d.forecast.mip=document.querySelector('#e_mip').value;
  d.forecast.champion=document.querySelector('#e_champion').value;
  d.forecast.confidence=Number(document.querySelector('#e_confidence').value)||0;
  d.forecast.text=document.querySelector('#e_forecastText').value;
  d.forecast.reasoning=document.querySelector('#e_forecastReasoning').value;
  d.forecast.arguments=[
    document.querySelector('#e_forecastArg1').value.trim(),
    document.querySelector('#e_forecastArg2').value.trim(),
    document.querySelector('#e_forecastArg3').value.trim()
  ].filter(Boolean);
  d.gi.title=document.querySelector('#e_giTitle').value;
  d.gi.text=document.querySelector('#e_giText').value;
  return collectForum(collectPageSettings(d));
}
function bindAdmin(){
  document.querySelector('#logout').onclick=async()=>{await SB.auth.signOut();location.reload();};
  document.querySelector('#saveAll').onclick=async()=>{
    try{ let d=collectBase(await getData()); d.players=collectPlayers(); d.goat=collectGoat(); d.news=collectNews(); await saveCloud(d); setMsg('Сохранено. Изменения теперь общие для всех посетителей.','ok'); }
    catch(e){setMsg(e.message,'error');}
  };
  for(const key of ['hero','gi','goat','stats']){
    document.querySelector('#img_'+key).onchange=async e=>{
      const f=e.target.files[0]; if(!f)return;
      try{ setMsg(`Загружаю фото: ${key}…`); const url=await uploadImage(f,key); const d=await getData(); d.photos[key]=url; await saveCloud(d); document.querySelector('#prev_'+key).src=url; await refreshMediaLibrary(); setMsg('Фото сохранено и опубликовано для всех.','ok'); }
      catch(err){setMsg(err.message,'error');}
    };
  }
  document.querySelector('#addNewsImage')?.addEventListener('change',async e=>{
    const f=e.target.files[0];if(!f)return;
    try{const url=await uploadImage(f,'news');document.querySelector('#newNewsImageUrl').value=url;await refreshMediaLibrary();setMsg('Фото новости загружено.','ok');}
    catch(err){setMsg(err.message,'error');}
  });
  document.querySelector('#mediaUpload')?.addEventListener('change',async e=>{
    const files=[...e.target.files]; if(!files.length)return;
    let ok=0;
    for(const f of files){try{await uploadImage(f,'media');ok++;}catch(err){setMsg(`${f.name}: ${err.message}`,'error');}}
    e.target.value=''; await refreshMediaLibrary(); if(ok)setMsg(`Загружено: ${ok} ${ok===1?'файл':'файлов'}.`,'ok');
  });
  document.querySelector('#mediaRefresh')?.addEventListener('click',refreshMediaLibrary);
  refreshMediaLibrary();
}
async function refreshMediaLibrary(){
  const grid=document.querySelector('#mediaLibraryGrid'); if(!grid)return;
  grid.innerHTML='<div class="media-loading">Загружаю медиатеку…</div>';
  try{
    const files=await listMediaLibrary(); const d=await getData(); const photos=d.photos||{}; const gallery=d.gallery||[];
    const role=(url)=>Object.entries(photos).filter(([,v])=>v===url).map(([k])=>k.toUpperCase()).join(' · ');
    grid.innerHTML=files.length?files.map(f=>{
      const r=role(f.url); const inGallery=gallery.some(x=>x.image===f.url);
      const kb=f.size?Math.max(1,Math.round(f.size/1024))+' KB':'';
      return `<article class="media-item" data-path="${esc(f.path)}" data-url="${esc(f.url)}"><div class="media-thumb"><img src="${esc(f.url)}" alt=""><span class="media-badge">${r||'MEDIA'}</span></div><div class="media-meta"><b title="${esc(f.name)}">${esc(f.name)}</b><small>${kb} · ${inGallery?'В галерее':'Не назначено'}</small></div><div class="media-actions"><button data-role="hero">Главная</button><button data-role="gi">GI</button><button data-role="goat">GOAT</button><button data-role="stats">Stats</button><button data-gallery="1">${inGallery?'Убрать из галереи':'В галерею'}</button><button class="media-delete" data-delete="1">Удалить</button></div></article>`;
    }).join(''):'<div class="media-empty"><strong>Медиатека пока пуста.</strong><span>Загрузи первую фотографию выше.</span></div>';
    grid.querySelectorAll('[data-role]').forEach(btn=>btn.onclick=async()=>{try{const item=btn.closest('.media-item'),d=await getData();d.photos[btn.dataset.role]=item.dataset.url;await saveCloud(d);await refreshMediaLibrary();setMsg(`Фото назначено: ${btn.dataset.role}.`,'ok')}catch(e){setMsg(e.message,'error')}});
    grid.querySelectorAll('[data-gallery]').forEach(btn=>btn.onclick=async()=>{try{const item=btn.closest('.media-item'),d=await getData();d.gallery=Array.isArray(d.gallery)?d.gallery:[];const ix=d.gallery.findIndex(x=>x.image===item.dataset.url);if(ix>=0)d.gallery.splice(ix,1);else d.gallery.unshift({title:item.querySelector('.media-meta b').textContent,caption:'',image:item.dataset.url});await saveCloud(d);await refreshMediaLibrary();setMsg(ix>=0?'Убрано из галереи.':'Добавлено в галерею.','ok')}catch(e){setMsg(e.message,'error')}});
    grid.querySelectorAll('[data-delete]').forEach(btn=>btn.onclick=async()=>{if(!confirm('Удалить это изображение из Supabase Storage?'))return;try{const item=btn.closest('.media-item'),d=await getData();for(const k of Object.keys(d.photos||{}))if(d.photos[k]===item.dataset.url)d.photos[k]='';d.gallery=(d.gallery||[]).filter(x=>x.image!==item.dataset.url);await deleteMediaImage(item.dataset.path);await saveCloud(d);await refreshMediaLibrary();setMsg('Изображение удалено.','ok')}catch(e){setMsg(e.message,'error')}});
  }catch(e){grid.innerHTML=`<div class="media-empty"><strong>Не удалось загрузить медиатеку.</strong><span>${esc(e.message)}</span></div>`;setMsg(e.message,'error')}
}
async function startPage(kind){
  try{
    if(kind==='home') await initHome();
    if(kind==='forecast') await initForecast();
    if(kind==='stats') await initStats();
    if(kind==='gi') await initGI();
    if(kind==='goat') await initGoat();
    if(kind==='news') await initNews();
    if(kind==='forum') await initForum();
    if(kind==='editor') await initEditor();
  }catch(e){
    console.error(e);
    try{
      CLOUD_DATA=null;
      // Keep local data intact. A temporary cloud/network error must never erase edits.
      if(kind==='home') await initHome();
      if(kind==='forecast') await initForecast();
      if(kind==='stats') await initStats();
      if(kind==='gi') await initGI();
      if(kind==='goat') await initGoat();
      if(kind==='news') await initNews();
      if(kind==='forum') await initForum();
    }catch(fallbackError){console.error(fallbackError)}
  }
}
