
(() => {
  window.onPreloaderDone = fn => window.__plDone ? fn() : addEventListener('preloader:done', fn, { once: true });
  const el = document.getElementById('preloader');
  if (!el) { window.__plDone = true; return; }
  const bar = el.querySelector('.preloader__bar span');
  const MIN_TIME = 700;   
  const MAX_TIME = 5000;  
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

  // ---- Header (same behaviour as the other pages) ----
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

  const goTo = id => {
    const el = $(id); if (!el) return;
    lenis ? lenis.scrollTo(el, { offset: -60 }) : el.scrollIntoView({ behavior: 'smooth' });
  };

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

  // ---- Hero + scroll motion ----
  if (!calm) {
    $$('.bl-hero h1 span').forEach(l => l.innerHTML = `<i>${l.textContent}</i>`);
    const heroTl = gsap.timeline({ paused: true, defaults: { ease: 'power4.out' } })
      .from('.hero-tags', { opacity: 0, y: 20, duration: .6 })
      .from('.bl-hero h1 i', { yPercent: 110, duration: 1, stagger: .12 }, '-=.3')
      .from('.bl-hero .bl-lead,.cta-row', { opacity: 0, y: 24, stagger: .1, duration: .7 }, '-=.5')
      .from('.bl-topics > *', { opacity: 0, y: 16, stagger: .05, duration: .5 }, '-=.45')
      .from('.bl-hero-img', { clipPath: 'inset(100% 0 0 0)', duration: 1.2 }, 0.3)
      .from('.bl-note', { opacity: 0, y: 18, scale: .94, duration: .6, clearProps: 'transform,opacity' }, '-=.7')
      .from('.bl-badge', { scale: 0, rotate: -12, duration: .6, ease: 'back.out(2)', clearProps: 'transform' }, '-=.35');
    onPreloaderDone(() => heroTl.play());
    gsap.to('.bl-fimg img', { yPercent: -6, ease: 'none', scrollTrigger: { trigger: '.bl-feat', scrub: true } });
    gsap.from('.bl-sticker', { scale: 0, rotate: -40, duration: .6, ease: 'back.out(2.5)', scrollTrigger: { trigger: '.bl-fimg', start: 'top 75%' } });
  }

  const relayout = () => requestAnimationFrame(() => { if (window.AOS) AOS.refresh(); ScrollTrigger.refresh(); });

  // ---- Articles: filter chips + search ----
  const rows = $$('.bl-row'), chips = $$('.bl-chip'), empty = $('#empty'), count = $('#count');
  let cat = 'All';

  const apply = animate => {
    let n = 0;
    rows.forEach(r => {
      const ok = cat === 'All' || r.dataset.cat === cat;
      r.hidden = !ok;
      if (ok) $('.n', r).textContent = String(++n).padStart(2, '0');
    });
    empty.hidden = n > 0;
    count.textContent = n + (n === 1 ? ' note' : ' notes');
    if (animate && !calm) gsap.from(rows.filter(r => !r.hidden), { opacity: 0, y: 24, stagger: .06, duration: .5, ease: 'power3.out', clearProps: 'all' });
    relayout();
  };
  const setCat = c => {
    cat = c;
    chips.forEach(b => b.setAttribute('aria-pressed', b.dataset.f === c));
    apply(true);
  };
  chips.forEach(b => b.addEventListener('click', () => setCat(b.dataset.f)));

  // ---- Hero topic pills: keep their counts honest and apply the filter on click ----
  $$('.bl-topic').forEach(a => {
    const n = rows.filter(r => r.dataset.cat === a.dataset.f).length;
    const c = $('b', a); if (c) c.textContent = n;
    a.addEventListener('click', () => setCat(a.dataset.f));
  });

  // ---- Browse by exam: outlined index + reading panel (accordion on mobile) ----
  const exams = $$('.bl-exams li'), wide = matchMedia('(min-width:900px)'), canHover = matchMedia('(hover:hover)');
  const openExam = li => exams.forEach(x => {
    const on = x === li;
    x.classList.toggle('on', on);
    $('.xn', x).setAttribute('aria-expanded', on);
  });
  exams.forEach(li => {
    const f = li.dataset.f, mine = rows.filter(r => r.dataset.cat === f), top = mine[0];
    $('.xp-n strong', li).textContent = mine.length;
    $('.xp-n span', li).textContent = mine.length === 1 ? 'note' : 'notes';
    if (top) {
      $('h3', li).textContent = $('h3', top).textContent;
      $('.xp-m', li).textContent = $('.bl-info span', top).textContent + ' read';
    }
    $('.xn', li).addEventListener('click', () => {
      if (!wide.matches && li.classList.contains('on')) { li.classList.remove('on'); $('.xn', li).setAttribute('aria-expanded', 'false'); }
      else openExam(li);
      relayout();
    });
    $('.xn', li).addEventListener('mouseenter', () => { if (wide.matches && canHover.matches) { openExam(li); relayout(); } });
    $('.xp-go', li).addEventListener('click', () => { setCat(f); goTo('#articles'); });
  });


  // ---- Classroom tour: photo and ledger stay in sync; cycles gently until the reader takes over ----
  const shots = $$('.bl-frame img'), pts = $$('.bl-points li'), capN = $('.bl-cap b'), capT = $('.bl-cap span');
  let cur = 0, auto = !calm, tick;
  const pick = i => {
    cur = i;
    shots.forEach((p, k) => p.classList.toggle('on', k === i));
    pts.forEach((p, k) => { p.classList.toggle('on', k === i); $('button', p).setAttribute('aria-current', k === i); });
    capN.textContent = String(i + 1).padStart(2, '0');
    capT.textContent = $('b', pts[i]).textContent;
  };
  const stopTour = () => { clearInterval(tick); tick = null; };
  const startTour = () => { if (auto && !tick) tick = setInterval(() => pick((cur + 1) % pts.length), 4500); };
  const take = i => { auto = false; stopTour(); pick(i); };
  pts.forEach((p, k) => {
    $('button', p).addEventListener('click', () => take(k));
    $('button', p).addEventListener('mouseenter', () => { if (matchMedia('(hover:hover)').matches) take(k); });
  });
  ScrollTrigger.create({ trigger: '.bl-tour', start: 'top 60%', end: 'bottom 30%', onToggle: s => s.isActive ? startTour() : stopTour() });

  // ---- Newsletter (front-end only: connect to your email service) ----
  const sub = $('#sub');
  const rules = {
    name: v => /^[A-Za-z][A-Za-z .'-]+$/.test(v.trim()) ? '' : v.trim() ? 'Use letters only in the name.' : 'Enter your name.',
    email: v => !v.trim() ? 'Enter your email address.' : /^\S+@\S+\.\S+$/.test(v.trim()) ? '' : 'Enter a valid email address.',
    p: v => v ? '' : 'Choose a topic.'
  };
  const check = el => {
    const m = rules[el.name](el.value), err = $('.err', el.closest('label'));
    err.textContent = m; el.setAttribute('aria-invalid', !!m);
    return !m;
  };
  Object.keys(rules).forEach(n => {
    const el = sub.elements[n];
    el.addEventListener('blur', () => check(el));
    el.addEventListener('input', () => { if (el.getAttribute('aria-invalid') === 'true') check(el); });
    el.addEventListener('change', () => { if (el.getAttribute('aria-invalid') === 'true') check(el); });
  });
  sub.addEventListener('submit', e => {
    e.preventDefault();
    const bad = Object.keys(rules).map(n => sub.elements[n]).filter(el => !check(el));
    if (bad.length) { bad[0].focus(); return; }
    // Clear every field and error, then go to the 404 page
    sub.reset();
    $$('.err', sub).forEach(x => x.textContent = '');
    $$('[aria-invalid]', sub).forEach(el => el.removeAttribute('aria-invalid'));
    location.href = '404.html';
  });

  // Broken image fallback keeps layout intact
  $$('img').forEach(im => im.addEventListener('error', () => im.style.visibility = 'hidden'));
})();