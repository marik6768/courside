(function(){
  const nav = document.querySelector('.nav');
  const links = document.querySelector('.links');
  if(!nav || !links) return;

  const toggle = document.createElement('button');
  toggle.className='mobile-menu-toggle';
  toggle.type='button';
  toggle.setAttribute('aria-label','Открыть меню');
  toggle.setAttribute('aria-expanded','false');
  toggle.innerHTML='<span></span><span></span><span></span>';
  nav.appendChild(toggle);

  const panel = document.createElement('div');
  panel.className='mobile-menu';
  panel.innerHTML='<div class="mobile-menu-inner">'+links.innerHTML+'</div>';
  document.body.appendChild(panel);

  function close(){
    panel.classList.remove('open');
    toggle.classList.remove('open');
    toggle.setAttribute('aria-expanded','false');
    document.body.classList.remove('menu-open');
  }
  toggle.addEventListener('click',()=>{
    const open=!panel.classList.contains('open');
    panel.classList.toggle('open',open);
    toggle.classList.toggle('open',open);
    toggle.setAttribute('aria-expanded',String(open));
    document.body.classList.toggle('menu-open',open);
  });
  panel.addEventListener('click',e=>{
    if(e.target.closest('a')) close();
  });
  document.addEventListener('keydown',e=>{if(e.key==='Escape') close();});
  window.addEventListener('resize',()=>{if(window.innerWidth>900) close();});
})();