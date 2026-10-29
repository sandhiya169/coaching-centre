(() => {
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  AOS.init({ duration: 800, once: true, offset: 40, disable: calm });

  document.getElementById('back').addEventListener('click', () => {
    history.length > 1 ? history.back() : (location.href = 'index.html');
  });

  if (calm) return;

  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
  tl.from('.d', { y: -140, opacity: 0, rotate: i => [-14, 10, -8][i], stagger: .12, duration: 1, ease: 'bounce.out' })
    .fromTo('.ring path', { strokeDasharray: 1, strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: .9, ease: 'power2.inOut' }, '-=.1')
    .from('.stamp', { scale: 2.6, opacity: 0, rotate: 30, duration: .45, ease: 'power4.in' }, '-=.1')
    .to('.stamp', { x: 3, yoyo: true, repeat: 3, duration: .05 })
    .fromTo('mark', { backgroundSize: '0% .5em' }, { backgroundSize: '100% .5em', duration: .8, ease: 'power2.inOut' }, '-=.1');

  gsap.to('.pencil', { y: -14, rotate: -25, repeat: -1, yoyo: true, duration: 1.6, ease: 'sine.inOut' });
})();