
let SB = null;
let CLOUD_DATA = null;
const LOCAL_FALLBACK_KEY = 'courtsideDataV2';

function clone(x){ return JSON.parse(JSON.stringify(x)); }

function normalizeContent(d){
  const x=clone(d||{});
  x.gi=x.gi||{};
  if(x.gi.title==='Game Impact Index' || !x.gi.title) x.gi.title='GOAT Index';
  if(!x.gi.text || x.gi.text.includes('влияние игрока через')) {
    x.gi.text='GI — GOAT Index, наша единая шкала для сравнения силы игрока. Для сезона она учитывает производство, эффективность, создание моментов, защиту, стабильность и вклад в победы. Для исторического рейтинга добавляется карьерный вес и контекст эпохи.';
  }
  if(Array.isArray(x.goat)) x.goat=x.goat.map(p=>{ const q=[...p]; const v=Number(q[2]); if(Number.isFinite(v)&&v>100) q[2]=(v/10).toFixed(2); return q; });
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
  try { const s=JSON.parse(localStorage.getItem(LOCAL_FALLBACK_KEY)||'null'); return s?Object.assign(clone(DEFAULT_DATA),s):clone(DEFAULT_DATA); }
  catch { return clone(DEFAULT_DATA); }
}
async function getData(){
  try{
    const sb=await ensureSupabase();
    if(sb){
      const {data,error}=await sb.from('site_content').select('payload').eq('id',1).maybeSingle();
      if(error) throw error;
      if(data?.payload){ CLOUD_DATA=normalizeContent(data.payload); return CLOUD_DATA; }
    }
  }catch(e){ console.warn('Cloud read failed:',e.message); }
  return normalizeContent(localData());
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
function blockImage(d,key){if(!key)return ''; if(/^https?:\/\//i.test(String(key)))return String(key); return d.photos?.[key]||''}
function renderHomeBlocks(d){const root=document.querySelector('#homeCanvas');if(!root)return;const blocks=homeBlocks(d).filter(b=>b.visible!==false);const img=(b)=>blockImage(d,b.image);root.innerHTML=blocks.map(b=>{
 const e=esc(b.eyebrow||'');const t=esc(resolveToken(b.title||'',d));const x=esc(resolveToken(b.text||'',d));
 if(b.type==='hero')return `<section class="hero cs-reveal"><div class="hero-copy"><div class="eyebrow">${e}</div><h1>${t}</h1><p class="lead">${x}</p><div class="rule"></div><p class="quote">${esc(b.quote||'')}</p></div><div class="hero-photo cs-3d"><img src="${esc(img(b)||'nba-1.jpg')}" alt=""><div class="caption">${esc(b.caption||'REGULAR SEASON · SPEED · SPACE · READING THE POSSESSION')}</div></div></section>`;
 if(b.type==='split')return `<section class="section cs-reveal"><div class="rule"></div><div class="grid2"><div><div class="eyebrow">${e}</div><h2 class="section-title">${t}</h2><h3>${esc(b.heading||'')}</h3><p class="lead">${x}</p></div><div class="card cs-3d">${img(b)?`<img class="block-image" src="${esc(img(b))}" alt="">`:''}<h3>${esc(b.cardTitle||b.heading||'Открыть Player Lab')}</h3><p class="muted">${x}</p><a class="btn" href="${esc(b.buttonHref||'stats.html')}">${esc(b.buttonText||'Открыть →')}</a></div></div></section>`;
 if(b.type==='news'){const ns=d.news.slice(0,Number(b.limit)||3);return `<section class="section cs-reveal"><div class="eyebrow">${e}</div><h2 class="section-title">${t}</h2><div class="news-grid">${ns.map(n=>`<article class="news-card cs-3d"><img src="${esc(n.image||'')}" alt=""><span>${esc(n.tag)}</span><h3>${esc(n.title)}</h3><p>${esc(n.text)}</p></article>`).join('')}</div></section>`}
 if(b.type==='feature')return `<section class="section cs-reveal"><div class="card cs-3d">${img(b)?`<img class="block-image" src="${esc(img(b))}" alt="">`:''}<div class="eyebrow">${e}</div><h2 class="section-title">${t}</h2><p class="lead">${x}</p>${b.buttonHref?`<a class="btn" href="${esc(b.buttonHref)}">${esc(b.buttonText||'Открыть →')}</a>`:''}</div></section>`;
 if(b.type==='image')return `<section class="section cs-reveal"><div class="eyebrow">${e}</div><h2 class="section-title">${t}</h2><figure class="studio-image"><img src="${esc(img(b)||b.imageUrl||'')}" alt="${t}"><figcaption>${x}</figcaption></figure></section>`;
 return `<section class="section cs-reveal"><div class="eyebrow">${e}</div><h2 class="section-title">${t}</h2><p class="lead">${x}</p>${b.buttonHref?`<a class="btn" href="${esc(b.buttonHref)}">${esc(b.buttonText||'Открыть →')}</a>`:''}</section>`
 }).join('');requestAnimationFrame(()=>{root.querySelectorAll('.cs-reveal').forEach((e,i)=>setTimeout(()=>e.classList.add('cs-in'),i*70));root.querySelectorAll('.cs-3d').forEach(e=>{e.onpointermove=x=>{const r=e.getBoundingClientRect(),a=(x.clientX-r.left)/r.width-.5,c=(x.clientY-r.top)/r.height-.5;e.style.setProperty('--rx',`${-c*3}deg`);e.style.setProperty('--ry',`${a*4}deg`)};e.onpointerleave=()=>{e.style.setProperty('--rx','0deg');e.style.setProperty('--ry','0deg')}})})}
function renderStudio(d){const box=document.querySelector('#pageStudio');if(!box)return;const blocks=homeBlocks(d);const types={hero:'Hero',split:'Два блока',feature:'Акцент',news:'Новости',text:'Текст',image:'Фото'};box.innerHTML=`<div class="studio-toolbar"><button class="btn" id="studioSave">Сохранить порядок</button><button class="btn secondary" id="studioAddText">+ Текст</button><button class="btn secondary" id="studioAddImage">+ Фото</button><button class="btn secondary" id="studioReset">Сбросить блоки</button></div><div class="studio-list">${blocks.map((b,i)=>`<article class="studio-row" draggable="true" data-i="${i}"><div class="studio-drag">${String(i+1).padStart(2,'0')}</div><div class="studio-fields"><div class="studio-top"><b>${types[b.type]||b.type}</b><label class="switch"><input class="sv" type="checkbox" ${b.visible!==false?'checked':''}><span></span></label></div><div class="studio-grid"><input class="sb-eyebrow" value="${esc(b.eyebrow||'')}"><input class="sb-title" value="${esc(b.title||'')}"><textarea class="sb-text">${esc(b.text||'')}</textarea><input class="sb-image" value="${esc(b.image||b.imageUrl||'')}" placeholder="photo role или URL"><input class="sb-button" value="${esc(b.buttonText||'')}"><input class="sb-href" value="${esc(b.buttonHref||'')}"></div></div><div class="studio-actions"><button class="mini up">↑</button><button class="mini down">↓</button><button class="danger mini remove">Удалить</button></div></article>`).join('')}</div>`;
 const rows=[...box.querySelectorAll('.studio-row')]; const move=(r,dir)=>{const n=dir<0?r.previousElementSibling:r.nextElementSibling;if(n)dir<0?r.parentNode.insertBefore(r,n):r.parentNode.insertBefore(n,r)};rows.forEach(r=>{r.querySelector('.up').onclick=()=>move(r,-1);r.querySelector('.down').onclick=()=>move(r,1);r.querySelector('.remove').onclick=()=>r.remove()});
 const collect=()=>[...box.querySelectorAll('.studio-row')].map(r=>{const i=Number(r.dataset.i),old=blocks[i]||{type:r.dataset.type||'text'};return {...old,visible:r.querySelector('.sv').checked,eyebrow:r.querySelector('.sb-eyebrow').value,title:r.querySelector('.sb-title').value,text:r.querySelector('.sb-text').value,image:r.querySelector('.sb-image').value,buttonText:r.querySelector('.sb-button').value,buttonHref:r.querySelector('.sb-href').value}});
 box.querySelector('#studioSave').onclick=async()=>{try{const n=await getData();n.site.blocks=collect();await saveCloud(n);renderHomeBlocks(n);setMsg('Главная страница сохранена.','ok')}catch(e){setMsg(e.message,'error')}};
 box.querySelector('#studioAddText').onclick=()=>{const n=box.querySelector('.studio-list'),r=document.createElement('article');r.className='studio-row';r.draggable=true;r.dataset.i=blocks.length;r.dataset.type='text';r.innerHTML=`<div class="studio-drag">+</div><div class="studio-fields"><div class="studio-top"><b>Текст</b><label class="switch"><input class="sv" type="checkbox" checked><span></span></label></div><div class="studio-grid"><input class="sb-eyebrow" value="NEW · NOTE"><input class="sb-title" value="Новый блок"><textarea class="sb-text">Напиши здесь свой текст.</textarea><input class="sb-image" value=""><input class="sb-button" value=""><input class="sb-href" value=""></div></div><div class="studio-actions"><button class="mini up">↑</button><button class="mini down">↓</button><button class="danger mini remove">Удалить</button></div>`;n.appendChild(r);r.querySelector('.up').onclick=()=>move(r,-1);r.querySelector('.down').onclick=()=>move(r,1);r.querySelector('.remove').onclick=()=>r.remove()};
 box.querySelector('#studioAddImage').onclick=()=>{const n=box.querySelector('.studio-list'),r=document.createElement('article');r.className='studio-row';r.dataset.i=blocks.length;r.dataset.type='text';r.innerHTML=`<div class="studio-drag">+</div><div class="studio-fields"><div class="studio-top"><b>Фото</b><label class="switch"><input class="sv" type="checkbox" checked><span></span></label></div><div class="studio-grid"><input class="sb-eyebrow" value="NEW · IMAGE"><input class="sb-title" value="Новая фотография"><textarea class="sb-text" placeholder="Подпись"></textarea><input class="sb-image" placeholder="URL фото из Media Library"><input class="sb-button"><input class="sb-href"></div></div><div class="studio-actions"><button class="mini up">↑</button><button class="mini down">↓</button><button class="danger mini remove">Удалить</button></div>`;n.appendChild(r);r.querySelector('.up').onclick=()=>move(r,-1);r.querySelector('.down').onclick=()=>move(r,1);r.querySelector('.remove').onclick=()=>r.remove()};
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
  const vals={mvp:d.forecast.mvp,dpoy:d.forecast.dpoy,roy:d.forecast.roy,mip:d.forecast.mip,champion:d.forecast.champion,confidence:d.forecast.confidence,forecastText:d.forecast.text};
  for(const [id,val] of Object.entries(vals)){const e=document.querySelector('#'+id);if(e)e.textContent=val;}
  nav('forecast');
  renderPublishedBlocks(d,'forecast');
}
async function initStats(){
  const d=await getData(), body=document.querySelector('#statsBody'); if(!body)return;
  const search=document.querySelector('#search'), pos=document.querySelector('#pos'), sort=document.querySelector('#sort');
  function draw(){
    const q=(search.value||'').toLowerCase(), p=pos.value, s=sort.value;
    const idx={gi:7,pts:3,reb:4,ast:5,ts:6}[s];
    let a=d.players.filter(x=>x[0].toLowerCase().includes(q)&&(p==='all'||x[2]===p)).slice().sort((a,b)=>b[idx]-a[idx]);
    body.innerHTML=renderStatsTable(a);
  }
  search.oninput=draw; pos.onchange=sort.onchange=draw; draw(); renderPublishedBlocks(d,'stats'); nav('stats');
  const im=document.querySelector('#statsImage'); if(im) im.src=d.photos.stats||'nba-4.jpg';
}
async function initGI(){
  const d=await getData(), body=document.querySelector('#giBody');
  if(body) body.innerHTML=renderStatsTable(d.players.slice().sort((a,b)=>b[7]-a[7]));
  const t=document.querySelector('#giText'); if(t)t.textContent=d.gi.text;
  const title=document.querySelector('#giTitle'); if(title)title.textContent=d.gi.title;
  const im=document.querySelector('#giImage'); if(im)im.src=d.photos.gi||'nba-2.jpg';
  nav('gi');
  renderPublishedBlocks(d,'gi');
}
async function initGoat(){
  const d=await getData(), el=document.querySelector('#goatBody');
  if(el)el.innerHTML=d.goat.map((p,i)=>`<div class="rank-row"><span class="rank">${String(i+1).padStart(2,'0')}</span><div><b>${esc(p[0])}</b><small>${esc(p[1])}</small></div><strong>${p[2]}</strong></div>`).join('');
  const im=document.querySelector('#goatImage');if(im)im.src=d.photos.goat||'nba-3.jpg'; nav('goat');
  renderPublishedBlocks(d,'goat');
}
async function initNews(){
  const d=await getData(), el=document.querySelector('#newsGrid');if(!el)return;
  el.innerHTML=d.news.map((n,i)=>`<article class="news-card"><img src="${esc(n.image||'')}" alt=""><span>${esc(n.tag)}</span><h3>${esc(n.title)}</h3><p>${esc(n.text)}</p></article>`).join('');
  nav('news');
  renderPublishedBlocks(d,'news');
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
  renderStudio(content); renderUniversalStudio(content);
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
  const map={e_siteHeadline:d.site.headline,e_siteIntro:d.site.intro,e_season:d.site.season,e_model:d.site.model,e_mvp:d.forecast.mvp,e_dpoy:d.forecast.dpoy,e_roy:d.forecast.roy,e_mip:d.forecast.mip,e_champion:d.forecast.champion,e_confidence:d.forecast.confidence,e_forecastText:d.forecast.text,e_giTitle:d.gi.title,e_giText:d.gi.text};
  for(const [id,v] of Object.entries(map)){const e=document.getElementById(id);if(e)e.value=v;}
  renderPlayerEditor(d.players); renderGoatEditor(d.goat); renderNewsEditor(d.news);
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
  el.innerHTML=`<div class="editor-list">${goat.map((p,i)=>`<div class="edit-row" data-i="${i}"><span class="drag-rank">${i+1}</span>${rowInput(p[0])}${rowInput(p[1])}${rowInput(p[2])}<button class="danger mini del-goat">Удалить</button></div>`).join('')}</div><button class="btn secondary" id="addGoat">+ Добавить</button>`;
  el.querySelectorAll('.del-goat').forEach(b=>b.onclick=()=>b.closest('.edit-row').remove());
  el.querySelector('#addGoat').onclick=()=>{const r=document.createElement('div');r.className='edit-row';r.innerHTML=`<span class="drag-rank">+</span>${rowInput('Player')}${rowInput('TEAM')}${rowInput(0)}<button class="danger mini del-goat">Удалить</button>`;el.querySelector('.editor-list').appendChild(r);r.querySelector('.del-goat').onclick=()=>r.remove();};
}
function collectGoat(){return [...document.querySelectorAll('#goatEditor .edit-row')].map(r=>{const v=[...r.querySelectorAll('input')].map(x=>x.value.trim());return [v[0],v[1],v[2]];});}
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
  d.gi.title=document.querySelector('#e_giTitle').value;
  d.gi.text=document.querySelector('#e_giText').value;
  return d;
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
/* COURTSIDE v8 · Universal Page Studio */
const CMS_PAGES = {
  home:'Главная', forecast:'Прогнозы', stats:'Статистика', gi:'GI', goat:'GOAT', news:'Новости', forum:'Форум'
};
function cmsDefaults(){
  return {
    home:[],
    forecast:[],
    stats:[],
    gi:[],
    goat:[],
    news:[],
    forum:[]
  };
}
function cmsPages(d){
  d.pages=d.pages||{};
  const def=cmsDefaults();
  for(const k of Object.keys(def)) if(!Array.isArray(d.pages[k])) d.pages[k]=def[k];
  return d.pages;
}
function cmsResolve(v,d){
  return resolveToken(String(v??''),d)
    .replace(/\{\{season\}\}/g,d.site?.season||'')
    .replace(/\{\{model\}\}/g,d.site?.model||'');
}
function cmsImage(d,b){
  const v=b.image||'';
  if(/^https?:\/\//i.test(v)) return v;
  return d.photos?.[v]||v;
}
function renderPublishedBlocks(d,page){
  if(page==='home') return;
  const blocks=(cmsPages(d)[page]||[]).filter(b=>b.visible!==false);
  if(!blocks.length) return;
  const main=document.querySelector('main.page .wrap');
  if(!main || main.querySelector('.cms-published')) return;
  const wrap=document.createElement('div'); wrap.className='cms-published';
  wrap.innerHTML=blocks.map(b=>{
    const title=esc(cmsResolve(b.title,d)), text=esc(cmsResolve(b.text,d)), ey=esc(cmsResolve(b.eyebrow,d));
    const image=cmsImage(d,b);
    if(b.type==='image') return `<section class="cms-block cms-image-block"><div class="eyebrow">${ey}</div><figure><img src="${esc(image)}" alt="${title}"><figcaption>${text}</figcaption></figure></section>`;
    if(b.type==='quote') return `<section class="cms-block cms-quote"><div class="eyebrow">${ey}</div><blockquote>${text}</blockquote><small>${esc(b.author||'COURTSIDE')}</small></section>`;
    if(b.type==='callout') return `<section class="cms-block cms-callout"><div><div class="eyebrow">${ey}</div><h2>${title}</h2><p>${text}</p></div>${b.buttonHref?`<a class="btn" href="${esc(b.buttonHref)}">${esc(b.buttonText||'Открыть →')}</a>`:''}</section>`;
    return `<section class="cms-block cms-text-block"><div class="eyebrow">${ey}</div><h2>${title}</h2><p>${text}</p>${b.buttonHref?`<a class="btn" href="${esc(b.buttonHref)}">${esc(b.buttonText||'Открыть →')}</a>`:''}</section>`;
  }).join('');
  main.appendChild(wrap);
  requestAnimationFrame(()=>wrap.querySelectorAll('.cms-block').forEach((x,i)=>setTimeout(()=>x.classList.add('cms-in'),i*80)));
}
function cmsBlock(type='text'){
  const common={id:'cms_'+Date.now()+'_'+Math.random().toString(36).slice(2,7),type,visible:true,eyebrow:'NEW · CHAPTER',title:'Новый блок',text:'Напиши здесь свой текст.'};
  if(type==='image') return {...common,eyebrow:'IMAGE',title:'Новая фотография',image:'',caption:'Подпись к фотографии'};
  if(type==='quote') return {...common,eyebrow:'NOTE',text:'Цитата или короткая мысль.',author:'COURTSIDE'};
  if(type==='callout') return {...common,eyebrow:'FEATURE',title:'Новый акцент',buttonText:'Открыть →',buttonHref:''};
  return common;
}
function renderUniversalStudio(d){
  const box=document.querySelector('#universalStudio'); if(!box)return;
  const pages=cmsPages(d);
  let active=box.dataset.page||'home';
  const draw=()=>{
    const list=pages[active]||[];
    box.innerHTML=`<div class="cms-toolbar">
      <div class="cms-page-tabs">${Object.entries(CMS_PAGES).map(([k,v])=>`<button class="${k===active?'active':''}" data-cmspage="${k}">${v}</button>`).join('')}</div>
      <div class="cms-actions"><button class="btn" id="cmsPublish">Опубликовать</button><button class="btn secondary" id="cmsPreview">Предпросмотр</button><button class="btn secondary" id="cmsAddText">+ Текст</button><button class="btn secondary" id="cmsAddImage">+ Фото</button><button class="btn secondary" id="cmsAddQuote">+ Цитата</button><button class="btn secondary" id="cmsAddCallout">+ Акцент</button></div>
    </div>
    <p class="muted">Страница: <b>${CMS_PAGES[active]}</b>. Перетаскивай карточки мышью, меняй поля и сохраняй. Пустая страница оставляет стандартный интерфейс сайта без изменений.</p>
    <div class="cms-list">${list.map((b,i)=>`<article class="cms-editor-row" draggable="true" data-cms-id="${esc(b.id)}">
      <div class="cms-drag">⠿<small>${String(i+1).padStart(2,'0')}</small></div>
      <div class="cms-editor-fields">
        <div class="cms-editor-head"><b>${esc(b.type)}</b><label class="switch"><input class="cv" type="checkbox" ${b.visible!==false?'checked':''}><span></span></label></div>
        <div class="cms-editor-grid">
          <input class="ce-eyebrow" value="${esc(b.eyebrow||'')}" placeholder="Метка">
          <input class="ce-title" value="${esc(b.title||'')}" placeholder="Заголовок">
          <textarea class="ce-text" placeholder="Текст">${esc(b.text||'')}</textarea>
          <input class="ce-image" value="${esc(b.image||'')}" placeholder="URL или роль из Media Library">
          <input class="ce-button" value="${esc(b.buttonText||'')}" placeholder="Текст кнопки">
          <input class="ce-href" value="${esc(b.buttonHref||'')}" placeholder="Ссылка">
          ${b.type==='quote'?`<input class="ce-author" value="${esc(b.author||'COURTSIDE')}" placeholder="Автор">`:''}
        </div>
      </div>
      <div class="cms-row-actions"><button class="mini cms-up">↑</button><button class="mini cms-down">↓</button><button class="danger mini cms-remove">Удалить</button></div>
    </article>`).join('') || '<div class="media-empty"><strong>Здесь пока нет дополнительных блоков.</strong><span>Добавь первый блок выше.</span></div>'}</div>`;
    box.querySelectorAll('[data-cmspage]').forEach(b=>b.onclick=()=>{active=b.dataset.cmspage;box.dataset.page=active;draw()});
    const current=()=>[...box.querySelectorAll('.cms-editor-row')].map(r=>{const q=s=>r.querySelector(s)?.value??'';return {id:r.dataset.cmsId,type:r.querySelector('.cms-editor-head b').textContent,visible:r.querySelector('.cv').checked,eyebrow:q('.ce-eyebrow'),title:q('.ce-title'),text:q('.ce-text'),image:q('.ce-image'),buttonText:q('.ce-button'),buttonHref:q('.ce-href'),author:q('.ce-author')||'COURTSIDE'}});
    const save=async msg=>{pages[active]=current();await saveCloud(d);setMsg(msg,'ok');};
    box.querySelectorAll('.cms-remove').forEach(b=>b.onclick=async()=>{b.closest('.cms-editor-row').remove();pages[active]=current();});
    box.querySelectorAll('.cms-up').forEach(b=>b.onclick=()=>{const r=b.closest('.cms-editor-row');if(r.previousElementSibling)r.parentNode.insertBefore(r,r.previousElementSibling)});
    box.querySelectorAll('.cms-down').forEach(b=>b.onclick=()=>{const r=b.closest('.cms-editor-row');if(r.nextElementSibling)r.parentNode.insertBefore(r.nextElementSibling,r)});
    let drag=null;
    box.querySelectorAll('.cms-editor-row').forEach(r=>{r.ondragstart=()=>{drag=r;r.classList.add('dragging')};r.ondragend=()=>{drag=null;r.classList.remove('dragging')};r.ondragover=e=>{e.preventDefault();if(drag&&drag!==r){const rect=r.getBoundingClientRect();r.parentNode.insertBefore(drag,e.clientY<rect.top+rect.height/2?r:r.nextSibling)}}});
    box.querySelector('#cmsPublish').onclick=async()=>{try{await save('Опубликовано. Блоки видны посетителям.')}catch(e){setMsg(e.message,'error')}};
    box.querySelector('#cmsPreview').onclick=()=>cmsPreview(d,active,current());
    const add=t=>{pages[active]=current();pages[active].push(cmsBlock(t));draw()};
    box.querySelector('#cmsAddText').onclick=()=>add('text');box.querySelector('#cmsAddImage').onclick=()=>add('image');box.querySelector('#cmsAddQuote').onclick=()=>add('quote');box.querySelector('#cmsAddCallout').onclick=()=>add('callout');
  };
  draw();
}
function cmsPreview(d,page,blocks){
  const modal=document.createElement('div');modal.className='cms-preview-modal';
  const fake={...d,pages:{...cmsPages(d),[page]:blocks}};
  modal.innerHTML=`<div class="cms-preview-shell"><div class="cms-preview-head"><b>Предпросмотр · ${CMS_PAGES[page]}</b><button class="btn secondary" id="closeCmsPreview">Закрыть</button></div><div class="cms-preview-body"><div class="eyebrow">LIVE PREVIEW</div><h1>${esc(d.site.headline)}</h1><div id="cmsPreviewCanvas"></div></div></div>`;
  document.body.appendChild(modal);
  const root=modal.querySelector('#cmsPreviewCanvas');
  root.innerHTML=(blocks||[]).filter(b=>b.visible!==false).map(b=>{
    const im=cmsImage(fake,b),t=esc(cmsResolve(b.title,fake)),x=esc(cmsResolve(b.text,fake)),e=esc(cmsResolve(b.eyebrow,fake));
    if(b.type==='image')return `<section class="cms-block cms-image-block"><div class="eyebrow">${e}</div><img src="${esc(im)}" alt=""><p>${x}</p></section>`;
    if(b.type==='quote')return `<section class="cms-block cms-quote"><div class="eyebrow">${e}</div><blockquote>${x}</blockquote><small>${esc(b.author||'COURTSIDE')}</small></section>`;
    if(b.type==='callout')return `<section class="cms-block cms-callout"><div><div class="eyebrow">${e}</div><h2>${t}</h2><p>${x}</p></div>${b.buttonHref?`<a class="btn" href="${esc(b.buttonHref)}">${esc(b.buttonText||'Открыть →')}</a>`:''}</section>`;
    return `<section class="cms-block cms-text-block"><div class="eyebrow">${e}</div><h2>${t}</h2><p>${x}</p>${b.buttonHref?`<a class="btn" href="${esc(b.buttonHref)}">${esc(b.buttonText||'Открыть →')}</a>`:''}</section>`;
  }).join('');
  modal.querySelector('#closeCmsPreview').onclick=()=>modal.remove();
}

async function startPage(kind){
  try{
    if(kind==='home') await initHome();
    if(kind==='forecast') await initForecast();
    if(kind==='stats') await initStats();
    if(kind==='gi') await initGI();
    if(kind==='goat') await initGoat();
    if(kind==='news') await initNews();
    if(kind==='forum'){ const d=await getData(); renderPublishedBlocks(d,'forum'); nav('forum'); }
    if(kind==='editor') await initEditor();
  }catch(e){console.error(e);setMsg?.(e.message,'error');}
}
