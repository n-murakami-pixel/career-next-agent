const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
const menu = document.querySelector('.menu-button');
const nav = document.querySelector('.header nav');
menu.addEventListener('click', () => {
  const open = menu.getAttribute('aria-expanded') !== 'true';
  menu.setAttribute('aria-expanded', String(open));
  menu.setAttribute('aria-label', open ? 'メニューを閉じる' : 'メニューを開く');
  nav.classList.toggle('open', open);
});
nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
  nav.classList.remove('open');
  menu.setAttribute('aria-expanded', 'false');
  menu.setAttribute('aria-label', 'メニューを開く');
}));

const float = document.querySelector('.floating-cta');
const contact = document.querySelector('#contact');
function toggleFloat() {
  const bounds = contact.getBoundingClientRect();
  const contactVisible = bounds.top < window.innerHeight && bounds.bottom > 0;
  float.classList.toggle('visible', window.scrollY > 500 && !contactVisible);
}
window.addEventListener('scroll', toggleFloat, { passive: true });
window.addEventListener('resize', toggleFloat, { passive: true });
toggleFloat();

document.querySelector('#demo-form').addEventListener('submit', e => {
  e.preventDefault();
  const selected = [...document.querySelectorAll('input[name=topic]:checked')].map(el => el.value);
  const result = document.querySelector('#form-result');
  result.hidden = false;
  result.textContent = selected.length
    ? '相談テーマ：' + selected.join('、') + '\nタイミング：' + document.querySelector('#timing').value + '\n\nデモの確認ができました。内容は送信・保存されていません。'
    : '相談したいテーマを1つ以上選んでください。';
  if (!selected.length) document.querySelector('input[name=topic]').focus();
  else result.scrollIntoView({ block: 'nearest', behavior: motionPreference.matches ? 'auto' : 'smooth' });
});
const dialog = document.querySelector('#privacy');
document.querySelector('#privacy-open').addEventListener('click', () => dialog.showModal());
document.querySelector('#privacy-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', e => {
  if (e.target === dialog) {
    const r = dialog.getBoundingClientRect();
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) dialog.close();
  }
});

// Animate only when a section enters view; no hidden CSS state to get stuck in.
// Unsupported APIs or disabled JavaScript leave the complete page readable.
const revealTargets = [...document.querySelectorAll(
  '.intro>div, .section-heading, .step, .reason-grid>article, .recommend-inner>div, .check-list>li, .faq-list>details, .contact-copy, .consult-form'
)];
const activeReveals = new Map();
let revealObserver;
if (!motionPreference.matches && 'IntersectionObserver' in window && 'animate' in Element.prototype) {
  revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const element = entry.target;
      revealObserver.unobserve(element);
      if (motionPreference.matches) return;
      const siblings = [...element.parentElement.children].filter(child => revealTargets.includes(child));
      const delay = Math.min(siblings.indexOf(element) % 3, 2) * 85;
      const animation = element.animate(
        [{ opacity: 0, transform: 'translateY(24px)' }, { opacity: 1, transform: 'translateY(0)' }],
        { duration: 650, delay, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'backwards' }
      );
      activeReveals.set(element, animation);
      animation.onfinish = animation.oncancel = () => activeReveals.delete(element);
    });
  }, { threshold: 0.08 });
  revealTargets.forEach(element => {
    // Preserve browser find-in-page, deep links, and restored scroll positions.
    if (element.getBoundingClientRect().top >= window.innerHeight) revealObserver.observe(element);
  });
}
function showFocusedContent(event) {
  for (const [element, animation] of activeReveals) {
    if (element.contains(event.target)) animation.cancel();
  }
}
document.addEventListener('focusin', showFocusedContent);
function respectMotionChange() {
  if (!motionPreference.matches) return;
  if (revealObserver) revealObserver.disconnect();
  for (const animation of activeReveals.values()) animation.cancel();
  activeReveals.clear();
}
if (motionPreference.addEventListener) motionPreference.addEventListener('change', respectMotionChange);
else if (motionPreference.addListener) motionPreference.addListener(respectMotionChange);
