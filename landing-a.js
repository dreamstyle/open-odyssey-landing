const scenes = [...document.querySelectorAll('.scene')];
const navigation = document.querySelector('.navigation');
const motionButton = document.querySelector('.motion-toggle');
const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
let isManualReduction = false;
let isFrameScheduled = false;

function updateMotionPreference() {
  const isReduced = isManualReduction || motionPreference.matches;
  document.body.classList.toggle('reduced-motion', isReduced);
  document.documentElement.classList.toggle('reduced-motion', isReduced);
  motionButton.setAttribute('aria-pressed', String(isReduced));
  motionButton.textContent = isReduced ? '恢復動態' : '減少動態';
  motionButton.disabled = motionPreference.matches;
  if (motionPreference.matches) motionButton.textContent = '系統減少動態';
  updateScroll();
}

function updateScroll() {
  navigation.classList.toggle('is-scrolled', scrollY > 70);
  if (document.body.classList.contains('reduced-motion')) return;
  for (const scene of scenes) {
    const bounds = scene.getBoundingClientRect();
    if (bounds.bottom < 0 || bounds.top > innerHeight) continue;
    const distance = (innerHeight - bounds.height) / 2 - bounds.top;
    scene.style.setProperty('--drift', Math.max(-35, Math.min(35, distance * .065)) + 'px');
  }
}

addEventListener('scroll', () => {
  if (isFrameScheduled) return;
  isFrameScheduled = true;
  requestAnimationFrame(() => { updateScroll(); isFrameScheduled = false; });
}, { passive: true });
addEventListener('resize', updateScroll);
motionButton.addEventListener('click', () => {
  isManualReduction = !isManualReduction;
  updateMotionPreference();
});
motionPreference.addEventListener('change', updateMotionPreference);
updateMotionPreference();

const seaNames = ['開放海域', '風暴', '塞壬之海', '卡呂普索', '伊薩卡'];
const seaDescriptions = ['有些日子，只要繼續航行就好。', '有些日子，先穩住自己就好。', '分心的時候，聽見自己的聲音。', '安逸也是一片海，不必急著離開。', '何時靠岸，由你決定。'];
const seaPictures = [...document.querySelectorAll('.sea-image')];
const seaButtons = [...document.querySelectorAll('[data-sea]')];
for (const button of seaButtons) {
  button.addEventListener('click', () => {
    const selected = Number(button.dataset.sea);
    seaPictures.forEach((picture, index) => picture.classList.toggle('is-active', index === selected));
    seaButtons.forEach((control, index) => control.setAttribute('aria-pressed', String(index === selected)));
    document.querySelector('[data-sea-title]').textContent = seaNames[selected];
    document.querySelector('[data-sea-description]').textContent = seaDescriptions[selected];
  });
}

const journalDialog = document.querySelector('dialog');
const journalButton = document.querySelector('[data-open-journal]');
journalButton.addEventListener('click', () => journalDialog.showModal());
journalDialog.addEventListener('click', event => {
  if (event.target !== journalDialog) return;
  const bounds = journalDialog.getBoundingClientRect();
  if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) journalDialog.close();
});
const journalExamples = [
  { text: '今天很難，先照顧自己。', picture: 'a-scene-2.jpg', name: '風暴' },
  { text: '今天終於把作品拿給一個人看了。', picture: 'a-scene-1.jpg', name: '開放海域' },
  { text: '好多聲音，想找回自己的方向。', picture: '../../public/art/siren-waters-backdrop.png', name: '塞壬之海' },
];
for (const button of document.querySelectorAll('[data-example]')) {
  button.addEventListener('click', () => {
    const selected = Number(button.dataset.example);
    const example = journalExamples[selected];
    document.querySelector('[data-journal-text]').textContent = example.text;
    const picture = document.querySelector('[data-journal-picture]');
    picture.src = example.picture;
    picture.alt = example.name + '的日誌海象示例';
    document.querySelector('.journal').classList.toggle('is-alternate', selected !== 0);
    document.querySelector('[data-journal-status]').textContent = '示例海象：' + example.name + '。真實的今天，讓海回應。';
    journalDialog.close();
    journalButton.focus({ preventScroll: true });
  });
}

const windButton = document.querySelector('[data-wind]');
let windTimeout;
windButton.addEventListener('click', () => {
  clearTimeout(windTimeout);
  const companions = document.querySelector('.companions');
  companions.classList.remove('is-windy');
  requestAnimationFrame(() => requestAnimationFrame(() => companions.classList.add('is-windy')));
  document.querySelector('[data-wind-status]').textContent = '一陣順風，已送向遠方的帆。';
  windButton.textContent = '再送一陣風 ›';
  windTimeout = setTimeout(() => companions.classList.remove('is-windy'), 2000);
});
