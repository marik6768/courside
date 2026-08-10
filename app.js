const DB='courtsideDataV2';
const IMG_DB='courtsideImagesV1';
function clone(x){return JSON.parse(JSON.stringify(x))}
function getData(){try{const saved=JSON.parse(localStorage.getItem(DB)||'null');return saved?Object.assign(clone(DEFAULT_DATA),saved):clone(DEFAULT_DATA)}catch{return clone(DEFAULT_DATA)}}
function saveData(d){localStorage.setItem(DB,JSON.stringify(d))}
function esc(s){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
function nav(active){document.querySelectorAll('.links a').forEach(a=>a.classList.toggle('active',a.dataset.page===active))}
function imgUrl(name, fallback){return (window.__images&&window.__images[name])||fallback||name}
async function loadImages(){window.__images={};try{const db=await new Promise((res,rej)=>{const r=indexedDB.open(IMG_DB,1);r.onupgradeneeded=()=>r.result.createObjectStore('images');r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)});const tx=db.transaction('images','readonly'), store=tx.objectStore('images');for(const k of ['hero','gi','goat','stats']){const v=await new Promise(r=>{const q=store.get(k);q.onsuccess=()=>r(q.result);q.onerror=()=>r(null)});if(v)window.__images[k]=v}}catch(e){} }
async function setImage(key,file){const data=await new Promise((resolve,reject)=>{const fr=new FileReader();fr.onload=()=>resolve(fr.result);fr.onerror=reject;fr.readAsDataURL(file)});const db=await new Promise((res,rej)=>{const r=indexedDB.open(IMG_DB,1);r.onupgradeneeded=()=>r.result.createObjectStore('images');r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)});db.transaction('images','readwrite').objectStore('images').put(data,key);window.__images=window.__images||{};window.__images[key]=data;return data}
function clearImages(){try{indexedDB.deleteDatabase(IMG_DB)}catch(e){}}
function tableRows(arr){return arr.map((p,i)=>`<tr><td class="rank-cell" data-label="#">${i+1}</td><td data-label="Игрок"><div class="player-cell"><b>${esc(p[0])}</b><span>${esc(p[1])}</span></div></td><td data-label="Позиция">${p[2]}</td><td data-label="PTS">${p[3]}</td><td data-label="REB">${p[4]}</td><td data-label="AST">${p[5]}</td><td data-label="TS%">${p[6]}%</td><td data-label="GI" class="gi-cell">${p[7]}</td></tr>`).join('')}
function initStats(){const d=getData(), body=document.querySelector('#statsBody');if(!body)return;const search=document.querySelector('#search'),pos=document.querySelector('#pos'),sort=document.querySelector('#sort');function draw(){let q=(search.value||'').toLowerCase(),p=pos.value,s=sort.value,idx={gi:7,pts:3,reb:4,ast:5,ts:6}[s];let a=d.players.filter(x=>x[0].toLowerCase().includes(q)&&(p==='all'||x[2]===p)).sort((a,b)=>b[idx]-a[idx]);body.innerHTML=tableRows(a)}search.oninput=search.onchange=draw;pos.onchange=sort.onchange=draw;draw()}
function initGI(){const d=getData(),body=document.querySelector('#giBody');if(!body)return;const a=d.players.slice().sort((x,y)=>y[7]-x[7]);body.innerHTML=tableRows(a)}
function initGoat(){const d=getData(),el=document.querySelector('#goatBody');if(!el)return;el.innerHTML=d.goat.map((p,i)=>`<div class="rank-row"><span class="rank">${String(i+1).padStart(2,'0')}</span><div><b>${esc(p[0])}</b><small>${esc(p[1])}</small></div><strong>${p[2]}</strong></div>`).join('')}
function initHome(){const d=getData();const h=document.querySelector('#headline'),intro=document.querySelector('#intro'),hero=document.querySelector('#heroImage');if(h)h.innerHTML=esc(d.site.headline).replace(/\n|\n/g,'<br>');if(intro)intro.textContent=d.site.intro;if(hero)hero.src=imgUrl('hero','nba-1.jpg')}
function initForecast(){const d=getData();for(const [id,val] of Object.entries({mvp:d.forecast.mvp,dpoy:d.forecast.dpoy,roy:d.forecast.roy,mip:d.forecast.mip,champion:d.forecast.champion,confidence:d.forecast.confidence,forecastText:d.forecast.text})){const e=document.querySelector('#'+id);if(e)e.textContent=val}}
function initGIPage(){const d=getData();const t=document.querySelector('#giText');const im=document.querySelector('#giImage');if(t)t.textContent=d.gi.text;if(im)im.src=imgUrl('gi','nba-2.jpg')}
function initGoatPage(){const im=document.querySelector('#goatImage');if(im)im.src=imgUrl('goat','nba-3.jpg')}
function initStatsPage(){const im=document.querySelector('#statsImage');if(im)im.src=imgUrl('stats','nba-4.jpg')}
function initNews(){const d=getData(),el=document.querySelector('#newsGrid');if(!el)return;el.innerHTML=d.news.map(n=>`<article class="news-card"><img src="${imgUrl('news_'+d.news.indexOf(n),n.image)}" alt=""><span>${esc(n.tag)}</span><h3>${esc(n.title)}</h3><p>${esc(n.text)}</p></article>`).join('')}
function fillForm(d){const map={siteHeadline:d.site.headline,siteIntro:d.site.intro,season:d.site.season,model:d.site.model,mvp:d.forecast.mvp,dpoy:d.forecast.dpoy,roy:d.forecast.roy,mip:d.forecast.mip,champion:d.forecast.champion,confidence:d.forecast.confidence,forecastText:d.forecast.text,giTitle:d.gi.title,giText:d.gi.text};for(const [id,v] of Object.entries(map)){const e=document.getElementById('e_'+id);if(e)e.value=v}}
function initAdmin(){const d=getData();fillForm(d);renderAdminPlayers(d);renderAdminNews(d);renderAdminGoat(d);for(const key of ['hero','gi','goat','stats','news_0','news_1','news_2']){const input=document.getElementById('img_'+key);if(input)input.onchange=async()=>{if(input.files[0]){await setImage(key,input.files[0]);document.getElementById('msg').textContent='Фото загружено в этом браузере.';renderAdminPreview()}}}document.getElementById('saveAll').onclick=()=>{const n=getData();n.site.headline=document.getElementById('e_siteHeadline').value;n.site.intro=document.getElementById('e_siteIntro').value;n.site.season=document.getElementById('e_season').value;n.site.model=document.getElementById('e_model').value;n.forecast.mvp=document.getElementById('e_mvp').value;n.forecast.dpoy=document.getElementById('e_dpoy').value;n.forecast.roy=document.getElementById('e_roy').value;n.forecast.mip=document.getElementById('e_mip').value;n.forecast.champion=document.getElementById('e_champion').value;n.forecast.confidence=document.getElementById('e_confidence').value;n.forecast.text=document.getElementById('e_forecastText').value;n.gi.title=document.getElementById('e_giTitle').value;n.gi.text=document.getElementById('e_giText').value;saveData(n);document.getElementById('msg').textContent='Сохранено. Изменения видны на этом браузере.'};document.getElementById('resetAll').onclick=()=>{if(confirm('Сбросить все данные к исходным?')){localStorage.removeItem(DB);clearImages();location.reload()}};document.getElementById('exportData').onclick=()=>{const blob=new Blob([JSON.stringify(getData(),null,2)],{type:'application/json'});downloadBlob(blob,'courtside-data.json')};document.getElementById('importData').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{const n=JSON.parse(await f.text());saveData(n);location.reload()}catch{alert('Неверный JSON-файл')}};renderAdminPreview()}
function renderAdminPreview(){const map={hero:'nba-1.jpg',gi:'nba-2.jpg',goat:'nba-3.jpg',stats:'nba-4.jpg'};for(const k in map){const e=document.getElementById('prev_'+k);if(e)e.src=imgUrl(k,map[k])}}
function renderAdminPlayers(d){const box=document.getElementById('playerEditor');if(!box)return;box.innerHTML=d.players.map((p,i)=>`<div class="admin-player" data-i="${i}"><input class="pn" value="${esc(p[0])}"><input class="pt" value="${esc(p[1])}"><select class="pp"><option ${p[2]==='G'?'selected':''}>G</option><option ${p[2]==='F'?'selected':''}>F</option><option ${p[2]==='C'?'selected':''}>C</option></select><input class="ps" type="number" step="0.1" value="${p[3]}"><input class="ps" type="number" step="0.1" value="${p[4]}"><input class="ps" type="number" step="0.1" value="${p[5]}"><input class="ps" type="number" step="0.1" value="${p[6]}"><input class="ps" type="number" step="0.1" value="${p[7]}"><button class="danger del">×</button></div>`).join('')+`<button class="btn secondary" id="addPlayer">+ Добавить игрока</button>`;box.querySelectorAll('.del').forEach(b=>b.onclick=()=>{b.closest('.admin-player').remove()});box.querySelector('#addPlayer').onclick=()=>{const n=box.querySelectorAll('.admin-player').length;const div=document.createElement('div');div.className='admin-player';div.dataset.i=n;div.innerHTML='<input class="pn" placeholder="Игрок"><input class="pt" placeholder="TEAM"><select class="pp"><option>G</option><option>F</option><option>C</option></select><input class="ps" type="number" step="0.1" value="0"><input class="ps" type="number" step="0.1" value="0"><input class="ps" type="number" step="0.1" value="0"><input class="ps" type="number" step="0.1" value="0"><input class="ps" type="number" step="0.1" value="0"><button class="danger del">×</button>';div.querySelector('.del').onclick=()=>div.remove();box.insertBefore(div,box.lastElementChild)};document.getElementById('savePlayers').onclick=()=>{const n=getData();n.players=[...box.querySelectorAll('.admin-player')].map(r=>{const v=r.querySelectorAll('input');return [v[0].value,v[1].value,r.querySelector('.pp').value,...[...r.querySelectorAll('.ps')].map(x=>Number(x.value)||0)]});saveData(n);document.getElementById('msg').textContent='Статистика сохранена.'}}
function renderAdminNews(d){const box=document.getElementById('newsEditor');if(!box)return;box.innerHTML=d.news.map((n,i)=>`<div class="news-edit" data-i="${i}"><input class="nt" value="${esc(n.title)}"><input class="ntag" value="${esc(n.tag)}"><textarea class="ntext">${esc(n.text)}</textarea><input class="nimg" value="${esc(n.image)}"><button class="danger ndel">Удалить</button></div>`).join('')+`<button class="btn secondary" id="addNews">+ Добавить новость</button>`;box.querySelectorAll('.ndel').forEach(b=>b.onclick=()=>b.closest('.news-edit').remove());box.querySelector('#addNews').onclick=()=>{const div=document.createElement('div');div.className='news-edit';div.innerHTML='<input class="nt" placeholder="Заголовок"><input class="ntag" placeholder="TAG"><textarea class="ntext" placeholder="Текст"></textarea><input class="nimg" value="nba-1.jpg"><button class="danger ndel">Удалить</button>';div.querySelector('.ndel').onclick=()=>div.remove();box.insertBefore(div,box.lastElementChild)};document.getElementById('saveNews').onclick=()=>{const n=getData();n.news=[...box.querySelectorAll('.news-edit')].map(r=>({title:r.querySelector('.nt').value,tag:r.querySelector('.ntag').value,text:r.querySelector('.ntext').value,image:r.querySelector('.nimg').value}));saveData(n);document.getElementById('msg').textContent='Новости сохранены.'}}
function renderAdminGoat(d){const box=document.getElementById('goatEditor');if(!box)return;box.innerHTML=d.goat.map((p,i)=>`<div class="goat-edit"><input class="gtname" value="${esc(p[0])}"><input class="gtteam" value="${esc(p[1])}"><input class="gtscore" type="number" step="0.1" value="${p[2]}"><button class="danger gdel">Удалить</button></div>`).join('')+`<button class="btn secondary" id="addGoat">+ Добавить игрока</button>`;box.querySelectorAll('.gdel').forEach(b=>b.onclick=()=>b.closest('.goat-edit').remove());box.querySelector('#addGoat').onclick=()=>{const div=document.createElement('div');div.className='goat-edit';div.innerHTML='<input class="gtname" placeholder="Игрок"><input class="gtteam" placeholder="Команды"><input class="gtscore" type="number" step="0.1" value="0"><button class="danger gdel">Удалить</button>';div.querySelector('.gdel').onclick=()=>div.remove();box.insertBefore(div,box.lastElementChild)};document.getElementById('saveGoat').onclick=()=>{const n=getData();n.goat=[...box.querySelectorAll('.goat-edit')].map(r=>[r.querySelector('.gtname').value,r.querySelector('.gtteam').value,r.querySelector('.gtscore').value]);saveData(n);document.getElementById('msg').textContent='GOAT сохранён.'}}
function downloadBlob(blob,name){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500)}


/* COURTSIDE mobile navigation bootstrap */
(function () {
  function setup() {
    const header = document.querySelector('header, .site-header, .topbar, .header');
    const nav = document.querySelector('header nav, .site-nav, .top-nav, .main-nav, nav');
    if (!header || !nav) return;
    if (document.querySelector('.mobile-menu-toggle')) return;

    nav.classList.add('is-mobile-collapsible');
    header.style.position = header.style.position || 'relative';

    const toggle = document.createElement('button');
    toggle.className = 'mobile-menu-toggle';
    toggle.type = 'button';
    toggle.setAttribute('aria-label', 'Открыть меню');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.textContent = '☰';

    const overlay = document.createElement('div');
    overlay.className = 'mobile-nav-overlay';
    document.body.appendChild(overlay);

    // Put the button near the nav. Prefer the header's right side.
    const row = header.querySelector('.header-inner, .nav-row, .topbar-inner, .container') || header;
    row.appendChild(toggle);

    function close() {
      nav.classList.remove('is-mobile-open');
      overlay.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.textContent = '☰';
    }
    function open() {
      nav.classList.add('is-mobile-open');
      overlay.classList.add('is-open');
      toggle.setAttribute('aria-expanded', 'true');
      toggle.textContent = '×';
    }
    toggle.addEventListener('click', () => {
      nav.classList.contains('is-mobile-open') ? close() : open();
    });
    overlay.addEventListener('click', close);
    nav.querySelectorAll('a').forEach(a => a.addEventListener('click', close));
    window.addEventListener('resize', () => {
      if (window.innerWidth > 820) close();
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setup);
  } else {
    setup();
  }
})();
