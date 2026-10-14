/* No dependencies. Images remain usable when JavaScript or animation APIs are unavailable. */
(function () {
  function createHeroSlideshow(root, env) {
    const { document, window } = env;
    const slides = [...root.querySelectorAll('.hero-slide')];
    const controls = root.querySelector('.hero-controls');
    const prev = root.querySelector('.hero-prev');
    const next = root.querySelector('.hero-next');
    const dots = [...root.querySelectorAll('.hero-dot')];
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const ready = new Set();
    let current = 0, timer = null, paused = motion.matches, inView = true;
    let animations = [];
    function clearTimer() {
      if (timer !== null) window.clearTimeout(timer);
      timer = null;
    }
    function settle() {
      animations.forEach(a => { a.onfinish = null; a.cancel(); });
      animations = [];
      slides.forEach(s => s.classList.remove('is-leaving'));
    }
    function update() {
      const available = [...ready].sort((a, b) => a - b);
      controls.hidden = available.length < 2;
      dots.forEach((dot, i) => {
        dot.disabled = !ready.has(i);
        dot.setAttribute('aria-pressed', String(i === current && ready.has(i)));
        dot.setAttribute('aria-label', `写真${i + 1}を表示${ready.has(i) ? '' : '（読み込み不可）'}`);
      });
      available.forEach((i, n) => slides[i].setAttribute('aria-label', `${n + 1} / ${available.length}`));
    }
    function schedule() {
      clearTimer();
      if (paused || motion.matches || !inView || document.visibilityState !== 'visible' || ready.size < 2) return;
      timer = window.setTimeout(() => { timer = null; move(1, false); }, 5000);
    }
    function show(index, direction = 1, animate = true) {
      if (index === current) return;
      settle();
      const old = slides[current], active = slides[index];
      const oldWasReady = ready.has(current);
      current = index;
      slides.forEach((slide, i) => {
        slide.classList.toggle('is-active', i === current);
        slide.setAttribute('aria-hidden', String(i !== current));
      });
      if (animate && oldWasReady && !motion.matches && typeof active.animate === 'function') {
        old.classList.add('is-leaving');
        const options = { duration: 500, easing: 'ease-in-out' };
        animations = [
          old.animate([{ transform: 'translateX(0)' }, { transform: `translateX(${-direction * 100}%)` }], options),
          active.animate([{ transform: `translateX(${direction * 100}%)` }, { transform: 'translateX(0)' }], options)
        ];
        animations[1].onfinish = settle;
      }
      update();
    }
    function move(direction, manual) {
      clearTimer();
      if (manual) paused = true;
      const available = [...ready].sort((a, b) => a - b);
      if (available.length > 1) {
        const start = available.indexOf(current);
        show(available[(start + direction + available.length) % available.length], direction);
      }
      update();
      schedule();
    }
    dots.forEach((dot, i) => dot.addEventListener('click', () => {
      if (!ready.has(i)) return;
      clearTimer(); paused = true;
      show(i, i >= current ? 1 : -1);
      update(); schedule();
    }));
    prev.addEventListener('click', () => move(-1, true));
    next.addEventListener('click', () => move(1, true));
    root.addEventListener('focusin', event => {
      paused = true; settle(); update(); schedule();
    });
    // Pointer presence alone must not silently stop rotation. Use the explicit
    // dot selection or keyboard focus to stop rotation without hover surprises.
    document.addEventListener('visibilitychange', () => { settle(); schedule(); });
    function respectMotion() { if (motion.matches) { paused = true; settle(); } update(); schedule(); }
    if (motion.addEventListener) motion.addEventListener('change', respectMotion);
    else if (motion.addListener) motion.addListener(respectMotion);
    if (window.IntersectionObserver) {
      new window.IntersectionObserver(entries => { inView = entries[0].isIntersecting; schedule(); }).observe(root);
    }
    slides.forEach((slide, i) => {
      const img = slide.querySelector('img');
      function loaded() {
        if (!img.naturalWidth) return failed();
        ready.add(i);
        if (!ready.has(current)) show(i, 1, false);
        update(); schedule();
      }
      function failed() {
        ready.delete(i);
        if (i === current) {
          const fallback = [...ready][0];
          if (fallback !== undefined) show(fallback, 1, false);
          else { slide.classList.remove('is-active'); slide.setAttribute('aria-hidden', 'true'); }
        }
        update(); schedule();
      }
      img.addEventListener('load', loaded, { once: true });
      img.addEventListener('error', failed, { once: true });
      if (img.complete) loaded();
    });
    update(); schedule();
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = createHeroSlideshow;
  else {
    const root = document.querySelector('.hero');
    if (root) createHeroSlideshow(root, { document, window });
  }
})();
