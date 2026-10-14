const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
// Keep native details/summary semantics; animate the measured height reversibly.
document.querySelectorAll('.faq-list details').forEach(details => {
  const summary = details.querySelector('summary');
  const answer = document.createElement('div');
  answer.className = 'faq-answer';
  while (summary.nextSibling) answer.append(summary.nextSibling);
  details.append(answer);
  let expanded = details.open, animation = null, fade = null;
  function finish() {
    if (animation) { animation.onfinish = null; animation.cancel(); }
    if (fade) fade.cancel();
    animation = fade = null;
    details.open = expanded;
    details.style.height = ''; details.style.overflow = '';
    summary.setAttribute('aria-expanded', String(expanded));
  }
  function change(next) {
    const height = details.getBoundingClientRect().height;
    const opacity = details.open ? getComputedStyle(answer).opacity : '0';
    expanded = next;
    if (animation) { animation.onfinish = null; animation.cancel(); }
    if (fade) fade.cancel();
    if (motionPreference.matches || !details.animate) { finish(); return; }
    details.open = true;
    details.style.height = ''; details.style.overflow = 'hidden';
    const target = expanded ? details.getBoundingClientRect().height : summary.getBoundingClientRect().height + parseFloat(getComputedStyle(details).borderTopWidth);
    summary.setAttribute('aria-expanded', String(expanded));
    const options = {duration:500, easing:'cubic-bezier(.25,.1,.25,1)'};
    animation = details.animate([{height:height+'px'}, {height:target+'px'}], options);
    fade = answer.animate([{opacity}, {opacity:expanded ? 1 : 0}], options);
    animation.onfinish = finish;
  }
  summary.addEventListener('click', event => { event.preventDefault(); change(!expanded); });
  window.addEventListener('resize', () => { if (animation) change(expanded); });
  motionPreference.addEventListener('change', () => { if (motionPreference.matches) finish(); });
  summary.setAttribute('aria-expanded', String(expanded));
});
const content = window.SITE_CONTENT || {};
document.querySelectorAll('[data-copy]').forEach(element => {
  const value = content[element.dataset.copy];
  if (typeof value === 'string' && value.trim()) element.textContent = value;
});
const menu = document.querySelector('.menu-button');
const nav = document.querySelector('.header nav');
const compactNav = window.matchMedia('(max-width: 900px)');
const backdrop = document.querySelector('.menu-backdrop');
const navLinks = [...nav.querySelectorAll('a')];
const outsideMenu = [...document.querySelectorAll('main,footer,.floating-cta,.header>.brand,.skip')];
let menuOpen = false;
function syncMenu() {
  document.body.classList.toggle('nav-open', menuOpen);
  nav.classList.toggle('open', menuOpen);
  nav.inert = !menuOpen;
  nav.setAttribute('aria-hidden', String(!menuOpen));
  menu.setAttribute('aria-expanded', String(menuOpen));
  menu.setAttribute('aria-label', menuOpen ? 'メニューを閉じる' : 'メニューを開く');
  const modal = menuOpen && compactNav.matches;
  backdrop.hidden = !modal;
  document.body.classList.toggle('menu-locked', modal);
  outsideMenu.forEach(e => { e.inert = modal; });
}
function closeMenu(restoreFocus = false) {
  menuOpen = false; syncMenu();
  if (restoreFocus) menu.focus();
}
menu.addEventListener('click', () => { menuOpen = !menuOpen; syncMenu(); if (menuOpen) requestAnimationFrame(() => { if (menuOpen) navLinks[0].focus(); }); });
backdrop.addEventListener('click', () => closeMenu(true));
navLinks.forEach(link => link.addEventListener('click', event => {
  event.preventDefault();
  const target = document.querySelector(link.hash);
  closeMenu();
  target.setAttribute('tabindex', '-1');
  target.focus({preventScroll:true});
  target.scrollIntoView({behavior:motionPreference.matches ? 'instant' : 'smooth'});
  history.replaceState(null, '', link.hash);
}));
document.addEventListener('keydown', event => {
  if (!menuOpen) return;
  if (event.key === 'Escape') { event.preventDefault(); closeMenu(true); }
  if (event.key === 'Tab' && compactNav.matches) {
    const focusable = [menu, ...navLinks];
    const current = focusable.indexOf(document.activeElement);
    event.preventDefault();
    focusable[(current + (event.shiftKey ? -1 : 1) + focusable.length) % focusable.length].focus();
  }
});
compactNav.addEventListener('change', () => {
  syncMenu();
  if (menuOpen && compactNav.matches) navLinks[0].focus();
});
function markSection() {
  let active = null;
  navLinks.forEach(link => { if (document.querySelector(link.hash).getBoundingClientRect().top <= innerHeight * .4) active = link; });
  navLinks.forEach(link => { if (link === active) link.setAttribute('aria-current','location'); else link.removeAttribute('aria-current'); });
}
window.addEventListener('scroll', markSection, {passive:true});
window.addEventListener('resize', markSection, {passive:true});
syncMenu(); markSection();

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
