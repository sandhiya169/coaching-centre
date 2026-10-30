(() => {
  const $ = (s, c = document) => c.querySelector(s), $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Header shows the email passed from the login page (read once from the URL, then removed from it)
  const p = new URLSearchParams(location.search), em = (p.get('email') || '').trim(), via = p.get('via');
  const ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(em) && em.length <= 80;
  let label = ok ? em : via ? 'Signed in with ' + (via === 'facebook' ? 'Facebook' : 'Google') : '';
  // Keep the label for this browser tab only, so a refresh still shows it once the URL is cleaned
  try { label ? sessionStorage.setItem('stackly-who', label) : label = sessionStorage.getItem('stackly-who') || ''; } catch (_) { }
  label = label || 'Guest (not logged in)';
  const start = location.hash.slice(1);
  // Clean address bar: no ?email=... or #tab after the page name
  if (location.search || location.hash) history.replaceState(null, '', location.pathname);
  $('#who-side').textContent = label; $('#who-side').title = label;
  const whoTop = $('#who'); if (whoTop) { whoTop.textContent = label; whoTop.title = label; }

  const btns = $$('.menu button'), panels = $$('.panel'), side = $('#side'), shade = $('#shade'), burger = $('#dburger');
  const set = o => {
    side.classList.toggle('open', o); shade.classList.toggle('on', o);
    burger.setAttribute('aria-expanded', o);
    document.documentElement.classList.toggle('menu-lock', o);
  };
  const close = () => set(false);

  const animate = t => {
    if (calm || !window.gsap) return;
    gsap.from($$('.blk', t), { opacity: 0, y: 28, stagger: .1, duration: .6, ease: 'power3.out', clearProps: 'all' });
    gsap.from($$('.bar i', t), { width: 0, duration: 1, delay: .25, ease: 'power3.out', clearProps: 'width' });
    gsap.from($$('.chart i', t), { scaleY: 0, transformOrigin: 'bottom', duration: .8, delay: .25, stagger: .06, ease: 'power3.out', clearProps: 'transform' });
    $$('[data-n]', t).forEach(el => {
      const end = +el.dataset.n, pre = el.dataset.p || '', suf = el.dataset.s || '', o = { v: 0 };
      gsap.to(o, { v: end, duration: 1.4, ease: 'power2.out', onUpdate: () => el.textContent = pre + Math.round(o.v).toLocaleString('en-IN') + suf });
    });
  };

  const go = (id, push) => {
    const t = panels.find(x => x.id === id) || panels[0];
    panels.forEach(x => x.classList.toggle('on', x === t));
    btns.forEach(b => b.dataset.go === t.id ? b.setAttribute('aria-current', 'page') : b.removeAttribute('aria-current'));
    $('#ptitle').textContent = t.dataset.title;
    document.title = t.dataset.title + ' | Stackly';
    scrollTo(0, 0); close(); animate(t);
  };

  btns.forEach(b => b.addEventListener('click', () => go(b.dataset.go, true)));
  burger.addEventListener('click', () => set(!side.classList.contains('open')));
  shade.addEventListener('click', close);
  addEventListener('keydown', e => e.key === 'Escape' && close());
  addEventListener('resize', () => innerWidth > 820 && close());
  addEventListener('hashchange', () => location.hash && go(location.hash.slice(1)));
  go(start);
})();