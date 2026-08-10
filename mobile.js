
(() => {
  const button = document.getElementById('mobileMenu');
  const nav = document.querySelector('.links');
  if (!button || !nav) return;
  const icon = button.querySelector('svg');
  const openPath = 'M4 7h16M4 12h16M4 17h16';
  const closePath = 'M6 6l12 12M18 6L6 18';
  const setOpen = (open) => {
    nav.classList.toggle('open', open);
    button.setAttribute('aria-expanded', String(open));
    button.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    if (icon) icon.innerHTML = `<path d="${open ? closePath : openPath}"/>`;
  };
  button.addEventListener('click', () => setOpen(!nav.classList.contains('open')));
  nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setOpen(false)));
  window.addEventListener('resize', () => { if (window.innerWidth > 760) setOpen(false); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') setOpen(false); });
})();
