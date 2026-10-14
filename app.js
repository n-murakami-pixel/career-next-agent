const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
const content = window.SITE_CONTENT || {};
document.querySelectorAll('[data-copy]').forEach(element => {
  const value = content[element.dataset.copy];
  if (typeof value === 'string' && value.trim()) element.textContent = value;
});
// Only verified HTTPS social URLs become links; missing URLs remain plain preparation notices.
for (const name of ['instagram', 'x']) {
  const value = content.social?.[name];
  try {
    if (!value) continue;
    const url = new URL(value);
    const allowed = name === 'instagram' ? ['instagram.com', 'www.instagram.com'] : ['x.com', 'www.x.com', 'twitter.com', 'www.twitter.com'];
    if (url.protocol !== 'https:' || !allowed.includes(url.hostname) || url.username || url.password) continue;
    const link = document.querySelector(`[data-social-link="${name}"]`);
    link.href = url.href; link.hidden = false;
    document.querySelector(`[data-social-status="${name}"]`).hidden = true;
  } catch { /* Invalid/unset URLs never become fake links. */ }
}
const menu = document.querySelector('.menu-button');
const nav = document.querySelector('.header nav');
nav.id = 'mobile-navigation';
function closeMenu() { nav.classList.remove('open'); menu.setAttribute('aria-expanded', 'false'); menu.setAttribute('aria-label', 'メニューを開く'); }
menu.addEventListener('click', () => { const open = menu.getAttribute('aria-expanded') !== 'true'; nav.classList.toggle('open', open); menu.setAttribute('aria-expanded', String(open)); menu.setAttribute('aria-label', open ? 'メニューを閉じる' : 'メニューを開く'); });
nav.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
document.addEventListener('keydown', e => { if (e.key === 'Escape' && nav.classList.contains('open')) { closeMenu(); menu.focus(); } });
const floating = document.querySelector('.floating-cta');
const contact = document.querySelector('#contact');
function toggleFloat() {
  const box = contact.getBoundingClientRect();
  const show = window.scrollY > 700 && !(box.top < innerHeight && box.bottom > 0) && !document.querySelector('#contact:focus-within');
  floating.classList.toggle('visible', show);
  floating.setAttribute('aria-hidden', String(!show)); floating.tabIndex = show ? 0 : -1;
}
window.addEventListener('scroll', toggleFloat, { passive: true });
window.addEventListener('resize', toggleFloat, { passive: true });
document.addEventListener('focusin', toggleFloat); toggleFloat();
const form = document.querySelector('#consult-form');
const confirmation = document.querySelector('#confirmation');
const confirmButton = document.querySelector('#confirm-button');
const error = document.querySelector('#form-error');
form.addEventListener('submit', e => e.preventDefault());
confirmButton.disabled = false;
confirmButton.addEventListener('click', () => {
  error.hidden = true;
  const topic = document.querySelector('#topic');
  const method = form.querySelector('input[name="method"]:checked');
  if (!topic.value || !method) {
    error.textContent = !topic.value ? '相談テーマを選択してください。' : '希望する相談方法を選択してください。'; error.hidden = false;
    (!topic.value ? topic : form.querySelector('input[name="method"]')).focus(); return;
  }
  document.querySelector('#confirm-topic').textContent = topic.value;
  document.querySelector('#confirm-method').textContent = method.value;
  document.querySelector('#confirm-message').textContent = document.querySelector('#message').value.trim() || '未入力';
  form.hidden = true; confirmation.hidden = false;
  document.querySelector('#confirmation-title').focus(); toggleFloat();
});
document.querySelector('#edit-button').addEventListener('click', () => { confirmation.hidden = true; form.hidden = false; document.querySelector('#topic').focus(); toggleFloat(); });
// Form values live only in the current DOM. No network submission or browser storage is used.

// Start the first-view sequence only after the photo is ready and the tab is visible.
// Without JavaScript, motion support, or a loaded photo, all content remains readable.
(() => {
  const hero = document.querySelector('.hero');
  const photo = document.querySelector('.hero-photo');
  if (!hero || !photo || motionPreference.matches) return;
  let started = false;
  let ready = false;
  let framePending = false;
  function startWhenVisible() {
    if (!ready || started || framePending || document.visibilityState !== 'visible') return;
    framePending = true;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      framePending = false;
      if (started || document.visibilityState !== 'visible') return;
      started = true;
      document.removeEventListener('visibilitychange', startWhenVisible);
      // Do not replay an entrance after restoring a scroll position or opening a deep link.
      if (motionPreference.matches || window.scrollY > 100) return;
      hero.classList.add('hero-motion-running');
    }));
  }
  function photoReady() {
    ready = true;
    startWhenVisible();
  }
  document.addEventListener('visibilitychange', startWhenVisible);
  if (typeof photo.decode === 'function') {
    photo.decode().then(photoReady, photoReady);
  } else if (photo.complete) {
    photoReady();
  } else {
    photo.addEventListener('load', photoReady, { once: true });
    photo.addEventListener('error', photoReady, { once: true });
  }
  function stopHeroMotion() {
    if (motionPreference.matches) {
      started = true;
      hero.classList.remove('hero-motion-running');
      document.removeEventListener('visibilitychange', startWhenVisible);
    }
  }
  if (motionPreference.addEventListener) motionPreference.addEventListener('change', stopHeroMotion);
  else if (motionPreference.addListener) motionPreference.addListener(stopHeroMotion);
})();
