/* ---- Page preloader: shown until the page has fully loaded ---- */
(() => {
  // Other code in this file uses onPreloaderDone(fn) to wait until the loader has gone
  window.onPreloaderDone = fn => window.__plDone ? fn() : addEventListener('preloader:done', fn, { once: true });
  const el = document.getElementById('preloader');
  if (!el) { window.__plDone = true; return; }
  const bar = el.querySelector('.preloader__bar span');
  const MIN_TIME = 700;   // ms - avoids a flash on fast connections
  const MAX_TIME = 5000;  // ms - never trap the visitor on a slow resource
  const start = performance.now();
  let finished = false, p = 0.15;

  if (bar) bar.style.transform = `scaleX(${p})`;
  const tick = setInterval(() => {
    p += (0.9 - p) * 0.12;
    if (bar) bar.style.transform = `scaleX(${p.toFixed(3)})`;
  }, 200);

  const finish = () => {
    if (finished) return;
    finished = true;
    clearInterval(tick);
    if (bar) bar.style.transform = 'scaleX(1)';
    setTimeout(() => {
      el.classList.add('done');
      el.setAttribute('aria-hidden', 'true');
      // start the page animations once the loader has (almost) faded out
      setTimeout(() => { window.__plDone = true; dispatchEvent(new Event('preloader:done')); }, 400);
      setTimeout(() => el.remove(), 700);
    }, 250);
  };
  const finishAfterMin = () => setTimeout(finish, Math.max(0, MIN_TIME - (performance.now() - start)));

  if (document.readyState === 'complete') finishAfterMin();
  else addEventListener('load', finishAfterMin, { once: true });
  setTimeout(finish, MAX_TIME);
  addEventListener('pageshow', e => { if (e.persisted) finish(); }); // back/forward cache
})();

(() => {
  const $ = (s, c = document) => c.querySelector(s), $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  gsap.registerPlugin(ScrollTrigger);

  // Header (same behaviour as main.js)
  const nav = $('#nav'), burger = $('#burger'), menu = $('#menu');
  let lenis;
  const setMenu = open => {
    menu.classList.toggle('open', open);
    nav.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', open);
    document.documentElement.classList.toggle('menu-lock', open);
    if (lenis) open ? lenis.stop() : lenis.start();
  };
  const closeMenu = () => setMenu(false);
  addEventListener('resize', () => innerWidth > 820 && closeMenu());
  burger.addEventListener('click', () => setMenu(!menu.classList.contains('open')));
  $$('#menu a').forEach(a => a.addEventListener('click', closeMenu));
  ScrollTrigger.create({ start: 60, onUpdate: s => nav.classList.toggle('solid', s.scroll() > 60) });

  if (!calm) {
    lenis = new Lenis({ lerp: 0.1 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
      const id = a.getAttribute('href'); if (id.length < 2) return;
      e.preventDefault(); closeMenu(); lenis.scrollTo(id, { offset: -60 });
    }));
  }

  onPreloaderDone(() => AOS.init({ duration: 800, once: true, offset: 80, disable: calm }));

  if (!calm) {
    // Hero: headline lines rise from a mask, image reveals, badge pops
    $$('.ab-hero h1 span').forEach(l => l.innerHTML = `<i>${l.textContent}</i>`);
    const heroTl = gsap.timeline({ paused: true, defaults: { ease: 'power4.out' } })
      .from('.hero-tags', { opacity: 0, y: 16, duration: .6 })
      .from('.ab-hero h1 i', { yPercent: 110, duration: 1, stagger: .12 }, '-=.3')
      .from('.ab-lead,.cta-row', { opacity: 0, y: 24, stagger: .1, duration: .7 }, '-=.5')
      .from('.ab-hero-img', { clipPath: 'inset(100% 0 0 0)', duration: 1.2 }, 0.3)
      .from('.ab-badge', { scale: 0, rotate: -12, duration: .8, ease: 'back.out(2)' }, '-=.4');
    onPreloaderDone(() => heroTl.play()); // hero animates only after the preloader

    gsap.to('.parallax', { yPercent: -8, ease: 'none', scrollTrigger: { trigger: '#story', scrub: true } });

    // Timeline line draws as you scroll
    gsap.fromTo('.tl', { '--p': 0 }, { '--p': 1, ease: 'none', scrollTrigger: { trigger: '.tl', start: 'top 70%', end: 'bottom 60%', scrub: true } });
  }

  // Counters
  $$('[data-n]').forEach(el => {
    const end = +el.dataset.n, s = el.dataset.s || '', o = { v: 0 };
    ScrollTrigger.create({ trigger: el, start: 'top 90%', once: true, onEnter: () => onPreloaderDone(() =>
      gsap.to(o, { v: end, duration: calm ? 0 : 1.8, ease: 'power2.out',
        onUpdate: () => el.textContent = Math.round(o.v).toLocaleString('en-IN') + s,
        onComplete: () => { if (!s && end > 100) el.textContent += '+'; } })) });
  });

  // Broken image fallback keeps layout intact
  $$('img').forEach(im => im.addEventListener('error', () => im.style.visibility = 'hidden'));
})();