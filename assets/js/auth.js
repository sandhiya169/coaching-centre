(() => {
  const $ = (s, c = document) => c.querySelector(s), $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const form = $('form'); let role = 'student';

  // Validation rules only: nothing is stored or checked against any account
  const R = {
    name: v => v.trim().length < 2 ? 'Enter the student\u2019s full name.' : '',
    email: v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? '' : 'Enter a valid email address.',
    phone: v => /^[0-9]{10}$/.test(v.trim()) ? '' : 'Enter a 10-digit phone number.',
    loginpw: v => v ? '' : 'Enter your password.',
    password: v => v.length < 8 ? 'Use at least 8 characters.' : !/[A-Za-z]/.test(v) || !/\d/.test(v) ? 'Include at least one letter and one number.' : '',
    confirm: (v, f) => v && v === f.elements.password.value ? '' : 'Passwords do not match.',
    terms: (v, f, el) => el.checked ? '' : 'Accept the terms to continue.'
  };
  const check = el => {
    const m = R[el.dataset.rule](el.value, form, el);
    $('#e-' + el.name).textContent = m;
    m ? el.setAttribute('aria-invalid', 'true') : el.removeAttribute('aria-invalid');
    return !m;
  };
  const fields = $$('[data-rule]', form);
  fields.forEach(el => {
    el.addEventListener('blur', () => check(el));
    el.addEventListener('input', () => {
      if (el.hasAttribute('aria-invalid')) check(el);
      if (el.name === 'password' && form.elements.confirm?.value) check(form.elements.confirm);
    });
    el.addEventListener('change', () => el.type === 'checkbox' && check(el));
  });

  $$('[data-eye]').forEach(b => b.addEventListener('click', () => {
    const i = $('input', b.parentElement), show = i.type === 'password';
    i.type = show ? 'text' : 'password';
    b.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
    $('i', b).className = show ? 'fas fa-eye-slash' : 'fas fa-eye';
  }));

  const dest = () => role === 'admin' ? 'admin-dashboard.html' : 'student-dashboard.html';

  form.addEventListener('submit', e => {
    e.preventDefault();
    const bad = fields.filter(el => !check(el));
    if (bad.length) { bad[0].focus(); return; }
    if (form.id === 'login') {
      // Email is passed in the URL only so the dashboard can show it; no storage
      location.href = dest() + '?email=' + encodeURIComponent(form.elements.email.value.trim());
    } else {
      $('#sub-btn').disabled = true;
      const ok = $('#ok'); ok.textContent = 'Account created. Taking you to login\u2026'; ok.hidden = false;
      form.reset(); // clears email and password; nothing is kept
      setTimeout(() => location.href = 'login.html?signup=success', 1500);
    }
  });

  if (form.id === 'login') {
    if (location.search.includes('signup=success')) $('#ok').hidden = false;
    $$('[data-role]').forEach(b => b.addEventListener('click', () => {
      role = b.dataset.role;
      $$('[data-role]').forEach(x => x.setAttribute('aria-pressed', x === b));
      $('#hint').textContent = role === 'admin' ? 'For centre staff managing batches, students and fees.' : 'For students and parents checking classes, tests and fees.';
      $('#sub-btn').innerHTML = 'Log in as ' + role + ' <i class="fas fa-right-to-bracket"></i>';
    }));
    $$('[data-social]').forEach(b => b.addEventListener('click', () => location.href = '404.html'));
  }

  if (!calm && window.gsap) {
    gsap.from('.auth-card>*', { opacity: 0, y: 24, stagger: .07, duration: .7, ease: 'power3.out', clearProps: 'all' });
    gsap.from('.arch img', { clipPath: 'inset(100% 0 0 0)', duration: 1.1, ease: 'power4.out' });
  }

  // Forward mouse wheel scrolling over the left sticky art column to the form side
  const art = $('.auth-art');
  const main = $('.auth-main');
  if (art && main) {
    art.addEventListener('wheel', e => {
      main.scrollTop += e.deltaY;
    }, { passive: true });
  }
})();