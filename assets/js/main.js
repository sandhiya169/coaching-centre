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
    document.documentElement.classList.toggle('menu-lock', open); // stops background scrolling
    if (lenis) open ? lenis.stop() : lenis.start();
  };
  const closeMenu = () => setMenu(false);
  addEventListener('resize', () => innerWidth > 820 && closeMenu());

  // Lenis smooth scroll synced with ScrollTrigger
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

  // Mark the link for the current page as active
  const page = location.pathname.split('/').pop() || 'index.html';
  $$('#menu a:not(.btn):not(.menu-logo)').forEach(a => {
    const on = a.getAttribute('href') === page;
    a.classList.toggle('active', on);
    on ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current');
  });
  $$('#menu a').forEach(a => a.addEventListener('click', closeMenu));
  ScrollTrigger.create({ start: 60, onUpdate: s => nav.classList.toggle('solid', s.scroll() > 60) });

  if (!calm) {
    // Hero: headline lines rise from behind a mask, then the art settles in
    $$('.ln').forEach(l => l.innerHTML = `<i>${l.textContent}</i>`);
    const heroTl = gsap.timeline({ paused: true, defaults: { ease: 'power4.out' } })
      .from('.hero .chip', { opacity: 0, y: 20, duration: .6 })
      .from('.ln>i', { yPercent: 110, duration: 1, stagger: .12 }, '-=.3')
      .from('.lead,.cta-row', { opacity: 0, y: 24, stagger: .1, duration: .7 }, '-=.5')
      .from('.hero-points li', { opacity: 0, y: 14, stagger: .07, duration: .5 }, '-=.4')
      .from('.hero-stats>div', { opacity: 0, y: 16, stagger: .08, duration: .55 }, '-=.35')
      .from('.hero-img', { clipPath: 'inset(100% 0 0 0)', duration: 1.2 }, 0.3)
      .from('.hero-cards .pcard', { opacity: 0, y: 24, scale: .94, stagger: .12, duration: .6, ease: 'back.out(1.6)' }, '-=.6');
    onPreloaderDone(() => heroTl.play()); // hero animates only after the preloader

    gsap.to('.parallax', { yPercent: -8, ease: 'none', scrollTrigger: { trigger: '#about', scrub: true } });
    gsap.fromTo('.steps', { '--p': 0 }, { '--p': 1, ease: 'none', scrollTrigger: { trigger: '.steps', start: 'top 75%', end: 'bottom 55%', scrub: true } });
    gsap.from('.steps li', { opacity: 0, y: 30, stagger: .2, scrollTrigger: { trigger: '.steps', start: 'top 80%' } });
  }

  // Counters
  $$('[data-n]').forEach(el => {
    const end = +el.dataset.n, s = el.dataset.s || '', o = { v: 0 };
    ScrollTrigger.create({ trigger: el, start: 'top 90%', once: true, onEnter: () => onPreloaderDone(() =>
      gsap.to(o, { v: end, duration: calm ? 0 : 1.8, ease: 'power2.out',
        onUpdate: () => el.textContent = Math.round(o.v).toLocaleString('en-IN') + s,
        onComplete: () => { if (!s && end > 100) el.textContent += '+'; } })) });
  });

  // Courses: accordion rows swap the large image
  const cimg = $('#cimg');
  $$('.crow button').forEach(b => b.addEventListener('click', () => {
    $$('.crow').forEach(r => { r.classList.toggle('on', r === b.parentElement); $('button', r).setAttribute('aria-expanded', r === b.parentElement); });
    gsap.to(cimg, { opacity: 0, duration: .2, onComplete() { cimg.src = b.dataset.img + '?auto=format&fit=crop&w=900&q=70'; cimg.alt = b.firstChild.textContent; cimg.onload = () => gsap.to(cimg, { opacity: 1, duration: .3 }); } });
  }));

  // Testimonials (sample copy: replace with real feedback)
  const quotes = [
    ['My son used to fear Physics. The Saturday tests and Sunday review fixed that in one term.', 'Parent', 'Class 11 student', 'assets/images/testimonial-1.webp'],
    ['Being in a batch of 15 meant my doubts never went unasked.', 'NEET aspirant', '2026 batch', 'assets/images/testimonial-2.webp'],
    ['The monthly progress sheet told us exactly where to help at home.', 'Parent', 'Class 9 student', 'assets/images/testimonial-3.webp']
  ];
  const q = $('#quote'), dots = $('#dots'); let i = 0, timer;
  const restart = () => { clearInterval(timer); timer = setInterval(() => show((i + 1) % quotes.length), 7000); };
  quotes.forEach((x, n) => {
    const b = document.createElement('button');
    b.setAttribute('aria-label', 'Quote ' + (n + 1));
    const avHtml = x[3] ? `<img src="${x[3]}" alt="${x[1]}" loading="lazy">` : x[1][0];
    b.innerHTML = `<span class="av">${avHtml}</span><span class="who"><b>${x[1]}</b><small>${x[2]}</small></span>`;
    b.onclick = () => { show(n); restart(); };
    dots.append(b);
  });
  function show(n) {
    i = n;
    gsap.to(q, { opacity: 0, y: 10, duration: calm ? 0 : .25, onComplete() {
      $('p', q).textContent = quotes[n][0]; $('cite', q).textContent = quotes[n][1] + ', ' + quotes[n][2];
      gsap.to(q, { opacity: 1, y: 0, duration: calm ? 0 : .4 });
    } });
    $$('button', dots).forEach((d, k) => d.classList.toggle('on', k === n));
  }
  show(0); restart();

  // Demo booking enquiry form validation & redirect to 404
  const formEl = $('#form');
  if (formEl) {
    const rules = {
      name: v => v.trim().length < 2 ? "Please enter the student's full name." : '',
      phone: v => /^[6-9]\d{9}$/.test(v.replace(/\s+/g, '')) ? '' : 'Please enter a valid 10-digit mobile number.',
      p: v => v && v.trim() ? '' : 'Please select a programme of interest.'
    };

    const checkField = el => {
      const field = el.closest('.cta-field');
      const errEl = field ? $('.err', field) : null;
      const msg = rules[el.name]?.(el.value) || '';
      if (errEl) errEl.textContent = msg;
      if (msg) {
        el.setAttribute('aria-invalid', 'true');
      } else {
        el.removeAttribute('aria-invalid');
      }
      return !msg;
    };

    ['name', 'phone', 'p'].forEach(fieldName => {
      const fieldInput = formEl.elements[fieldName];
      if (fieldInput) {
        fieldInput.addEventListener('blur', () => checkField(fieldInput));
        fieldInput.addEventListener('input', () => {
          if (fieldInput.hasAttribute('aria-invalid')) checkField(fieldInput);
        });
        fieldInput.addEventListener('change', () => checkField(fieldInput));
      }
    });

    formEl.addEventListener('submit', e => {
      e.preventDefault();
      const fields = ['name', 'phone', 'p'].map(n => formEl.elements[n]).filter(Boolean);
      const invalidFields = fields.filter(el => !checkField(el));

      if (invalidFields.length > 0) {
        invalidFields[0].focus();
        return;
      }

      // Reset and redirect to 404 page
      formEl.reset();
      $$('.err', formEl).forEach(err => err.textContent = '');
      $$('[aria-invalid]', formEl).forEach(el => el.removeAttribute('aria-invalid'));
      location.href = '404.html';
    });
  }

  // Broken image fallback keeps layout intact
  $$('img').forEach(im => im.addEventListener('error', () => im.style.visibility = 'hidden'));
})();