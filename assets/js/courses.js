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
  burger.addEventListener('click', () => setMenu(!menu.classList.contains('open')));

  const page = location.pathname.split('/').pop() || 'index.html';
  $$('#menu a:not(.btn)').forEach(a => {
    const on = a.getAttribute('href') === page;
    a.classList.toggle('active', on);
    on ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current');
  });
  $$('#menu a').forEach(a => a.addEventListener('click', closeMenu));
  ScrollTrigger.create({ start: 60, onUpdate: s => nav.classList.toggle('solid', s.scroll() > 60) });


  if (!calm) {
    $$('.cr-hero h1 span').forEach(l => l.innerHTML = `<i>${l.textContent}</i>`);
    const heroTl = gsap.timeline({ paused: true, defaults: { ease: 'power4.out' } })
      .from('.hero-tags', { opacity: 0, y: 20, duration: .6 })
      .from('.cr-hero h1 i', { yPercent: 110, duration: 1, stagger: .12 }, '-=.3')
      .from('.cr-lead,.cta-row', { opacity: 0, y: 24, stagger: .1, duration: .7 }, '-=.5')
      .from('.cr-hero-img', { clipPath: 'inset(100% 0 0 0)', duration: 1.2 }, 0.3)
      .from('.cr-badge', { scale: 0, rotate: -12, duration: .6, ease: 'back.out(2)' }, '-=.4');
    onPreloaderDone(() => heroTl.play()); // hero animates only after the preloader


    $$('.cr-img').forEach(w => {
      gsap.from(w, { clipPath: 'inset(0 0 100% 0)', duration: 1.1, ease: 'power3.out', clearProps: 'clipPath', scrollTrigger: { trigger: w, start: 'top 82%' } });
      gsap.fromTo($('img', w), { yPercent: -7, scale: 1.15 }, { yPercent: 7, ease: 'none', scrollTrigger: { trigger: w, scrub: true } });
    });
    gsap.from('.cr-num', { opacity: 0, x: -40, duration: .8, ease: 'power3.out', stagger: 0, scrollTrigger: { trigger: '#programmes', start: 'top 75%' } });

    gsap.fromTo('.cr-steps', { '--p': 0 }, { '--p': 1, ease: 'none', scrollTrigger: { trigger: '.cr-steps', start: 'top 70%', end: 'bottom 60%', scrub: true } });
    gsap.from('.cr-steps li', { opacity: 0, x: 30, stagger: .2, duration: .7, ease: 'power3.out', scrollTrigger: { trigger: '.cr-steps', start: 'top 80%' } });
  }


  const rec = {
    f: { name: 'Foundation, Class 6–8', text: 'Maths, Science and reasoning built from the basics.', when: 'Mon–Fri, 5 pm', go: '#foundation' },
    b: { name: 'Board Prep, Class 9–12', text: 'Syllabus plus past-paper practice for every subject.', when: 'Mon–Sat, 6 am or 5 pm', go: '#boards' },
    n: { name: 'NEET Two-Year', text: 'Biology, Physics and Chemistry with all-India test series.', when: 'Daily, 7 am', go: '#neet' },
    j: { name: 'JEE Main + Advanced', text: 'Problem-solving labs and weekly timed papers.', when: 'Daily, 7 am', go: '#jee' }
  };
  const picks = $$('.cr-pick button'), res = $('#res');
  const fill = k => {
    const r = rec[k];
    $('#resName').textContent = r.name; $('#resText').textContent = r.text; $('#resWhen span').textContent = r.when;
    $('#resBook').dataset.p = r.name; $('#resGo').setAttribute('href', r.go);
  };
  picks.forEach(b => b.addEventListener('click', () => {
    if (b.getAttribute('aria-pressed') === 'true') return;
    picks.forEach(p => p.setAttribute('aria-pressed', p === b));
    if (calm) return fill(b.dataset.k);
    gsap.to(res.children, { opacity: 0, y: -12, duration: .2, stagger: .03, onComplete() {
      fill(b.dataset.k);
      gsap.fromTo(res.children, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: .45, stagger: .07, ease: 'power3.out' });
    } });
  }));


  const psel = $('#psel');
  document.addEventListener('click', e => {
    const t = e.target.closest('[data-p]');
    if (t) psel.value = t.dataset.p;
  });


  $$('.cr-faq .crow button').forEach(b => b.addEventListener('click', () => {
    const row = b.parentElement, open = !row.classList.contains('on');
    $$('.cr-faq .crow').forEach(r => { r.classList.remove('on'); $('button', r).setAttribute('aria-expanded', false); });
    row.classList.toggle('on', open); b.setAttribute('aria-expanded', open);
  }));


  $$('img').forEach(im => im.addEventListener('error', () => im.style.visibility = 'hidden'));
})();