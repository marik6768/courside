
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

async function initHome(){
  const d=await getData();
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
  search.oninput=draw; pos.onchange=sort.onchange=draw; draw(); nav('stats');
  const im=document.querySelector('#statsImage'); if(im) im.src=d.photos.stats||'nba-4.jpg';
}
async function initGI(){
  const d=await getData(), body=document.querySelector('#giBody');
  if(body) body.innerHTML=renderStatsTable(d.players.slice().sort((a,b)=>b[7]-a[7]));
  const t=document.querySelector('#giText'); if(t)t.textContent=d.gi.text;
  const title=document.querySelector('#giTitle'); if(title)title.textContent=d.gi.title;
  const im=document.querySelector('#giImage'); if(im)im.src=d.photos.gi||'nba-2.jpg';
  nav('gi');
}
async function initGoat(){
  const d=await getData(), el=document.querySelector('#goatBody');
  if(el)el.innerHTML=d.goat.map((p,i)=>`<div class="rank-row"><span class="rank">${String(i+1).padStart(2,'0')}</span><div><b>${esc(p[0])}</b><small>${esc(p[1])}</small></div><strong>${p[2]}</strong></div>`).join('');
  const im=document.querySelector('#goatImage');if(im)im.src=d.photos.goat||'nba-3.jpg'; nav('goat');
}
async function initNews(){
  const d=await getData(), el=document.querySelector('#newsGrid');if(!el)return;
  el.innerHTML=d.news.map((n,i)=>`<article class="news-card"><img src="${esc(n.image||'')}" alt=""><span>${esc(n.tag)}</span><h3>${esc(n.title)}</h3><p>${esc(n.text)}</p></article>`).join('');
  nav('news');
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
  fillEditor(await getData());
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
    try{
      let d=collectBase(await getData()); d.players=collectPlayers(); d.goat=collectGoat(); d.news=collectNews();
      await saveCloud(d); setMsg('Сохранено. Изменения теперь общие для всех посетителей.','ok');
    }catch(e){setMsg(e.message,'error');}
  };
  for(const key of ['hero','gi','goat','stats']){
    document.querySelector('#img_'+key).onchange=async e=>{
      const f=e.target.files[0]; if(!f)return;
      try{
        setMsg(`Загружаю фото: ${key}…`);
        const url=await uploadImage(f,key);
        const d=await getData(); d.photos[key]=url; await saveCloud(d);
        document.querySelector('#prev_'+key).src=url; setMsg('Фото сохранено и опубликовано для всех.','ok');
      }catch(err){setMsg(err.message,'error');}
    };
  }
  document.querySelector('#addNewsImage')?.addEventListener('change',async e=>{
    const f=e.target.files[0];if(!f)return;
    try{const url=await uploadImage(f,'news');document.querySelector('#newNewsImageUrl').value=url;setMsg('Фото новости загружено. Вставь/оставь URL в новости.','ok');}catch(err){setMsg(err.message,'error');}
  });
}
async function startPage(kind){
  try{
    if(kind==='home') await initHome();
    if(kind==='forecast') await initForecast();
    if(kind==='stats') await initStats();
    if(kind==='gi') await initGI();
    if(kind==='goat') await initGoat();
    if(kind==='news') await initNews();
    if(kind==='editor') await initEditor();
  }catch(e){console.error(e);setMsg?.(e.message,'error');}
}
