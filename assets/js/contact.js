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

  // ---- Header: menu, scroll lock, active link, smooth scroll (same as the home page) ----
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
  const page = location.pathname.split('/').pop() || 'index.html';
  $$('#menu a:not(.btn)').forEach(a => a.classList.toggle('active', a.getAttribute('href') === page));
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

  // ---- GSAP ----
  if (!calm) {
    $$('.phero .ln').forEach(l => l.innerHTML = `<i>${l.textContent}</i>`);
    const heroTl = gsap.timeline({ paused: true, defaults: { ease: 'power4.out' } })
      .from('.hero-tags', { opacity: 0, y: 16, duration: .5 })
      .from('.phero .ln>i', { yPercent: 110, duration: 1, stagger: .12 }, '-=.35')
      .from('.phero .lead,.phero .cta-row', { opacity: 0, y: 24, stagger: .1, duration: .7 }, '-=.5')
      .from('.phero .qchips li', { opacity: 0, y: 20, stagger: .09, duration: .6 }, '-=.45')
      .from('.phero-art img', { clipPath: 'inset(0 0 100% 0)', duration: 1.2 }, 0.3)
      .from('.phero .pcard', { opacity: 0, y: 18, scale: .94, stagger: .12, duration: .6, clearProps: 'transform,opacity' }, '-=.7');
    onPreloaderDone(() => heroTl.play()); // hero animates only after the preloader
    gsap.from('.way .ic', { scale: 0, rotate: -40, stagger: .12, ease: 'back.out(2)', duration: .7, scrollTrigger: { trigger: '.ways', start: 'top 80%' } });
    gsap.fromTo('.flow', { '--p': 0 }, { '--p': 1, ease: 'none', scrollTrigger: { trigger: '.flow', start: 'top 80%', end: 'bottom 60%', scrub: true } });
    gsap.from('.flow li', { opacity: 0, x: -20, stagger: .25, scrollTrigger: { trigger: '.flow', start: 'top 80%' } });
    gsap.to('.o1', { yPercent: 40, ease: 'none', scrollTrigger: { trigger: '.band', scrub: true } });
    gsap.to('.o2', { yPercent: -40, ease: 'none', scrollTrigger: { trigger: '.band', scrub: true } });
  }

  // ---- Opening hours: highlight today and show open or closed ----
  const now = new Date(), day = now.getDay(), hr = now.getHours() + now.getMinutes() / 60;
  $(`.hrow[data-d="${day}"]`)?.classList.add('today');
  const st = $('#status'), open = day !== 0 && hr >= 6 && hr < 20;
  st.textContent = open ? 'Open now. Walk in or call us.' : 'Closed now. Send an enquiry and we will call you back.';
  st.classList.add(open ? 'open' : 'closed');

  // Hero floating hours card mirrors the same status
  const hCard = $('.card-hours');
  if (hCard) {
    $('#heroOpen').textContent = open ? 'Open now' : 'Closed now';
    $('#heroHours').textContent = open ? 'Mon–Sat · 6 am – 8 pm'
      : day === 0 ? 'Opens Monday at 6 am'
        : hr < 6 ? 'Opens today at 6 am'
          : day === 6 ? 'Opens Monday at 6 am'
            : 'Opens tomorrow at 6 am';
    hCard.classList.toggle('is-closed', !open);
  }

  // ---- FAQ accordion (one open at a time) ----
  $$('.faq .crow button').forEach(b => b.addEventListener('click', () => {
    const row = b.parentElement, was = row.classList.contains('on');
    $$('.faq .crow').forEach(r => { r.classList.remove('on'); $('button', r).setAttribute('aria-expanded', 'false'); });
    if (!was) { row.classList.add('on'); b.setAttribute('aria-expanded', 'true'); }
    setTimeout(() => { lenis && lenis.resize(); ScrollTrigger.refresh(); }, 450); // page height changed
  }));

  // Map: the embedded iframe swallows scrolling, so it only reacts after a click
  const map = $('.map');
  map.addEventListener('click', () => map.classList.add('active'));
  map.addEventListener('mouseleave', () => map.classList.remove('active'));

  // ---- Enquiry form (front-end only: connect to your backend or a form service) ----
  const f = $('#cform'), msg = $('#cmsg');
  const rules = {
    student: v => v.trim() ? '' : "Enter the student's name.",
    phone: v => /^[6-9]\d{9}$/.test(v.replace(/\s/g, '')) ? '' : 'Enter a 10-digit mobile number.',
    email: v => !v || /^\S+@\S+\.\S+$/.test(v) ? '' : 'Enter a valid email address.',
    programme: v => v ? '' : 'Choose a programme.'
  };
  const check = el => {
    const err = el.closest('label').querySelector('.err'), m = rules[el.name]?.(el.value) || '';
    if (err) err.textContent = m; el.setAttribute('aria-invalid', !!m);
    return !m;
  };
  Object.keys(rules).forEach(n => f.elements[n].addEventListener('blur', e => check(e.target)));
  f.addEventListener('submit', e => {
    e.preventDefault();
    const bad = Object.keys(rules).map(n => f.elements[n]).filter(el => !check(el));
    if (bad.length) { bad[0].focus(); msg.textContent = ''; return; }
    // Clear every field and error, then go to the 404 page
    f.reset();
    $$('.err', f).forEach(e => e.textContent = '');
    $$('[aria-invalid]', f).forEach(el => el.removeAttribute('aria-invalid'));
    location.href = '404.html';
  });

  $$('img').forEach(im => im.addEventListener('error', () => im.style.visibility = 'hidden'));
})();