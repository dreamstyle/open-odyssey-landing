const body = document.body;
const systemMotion = matchMedia('(prefers-reduced-motion: reduce)');
const motionButton = document.querySelector('[data-motion]');
let motionOverride = null;
let animationFrame = 0;
let pointerX = 0;
let pointerY = 0;
const hero = document.querySelector('.hero');
const heroPicture = document.querySelector('.hero-picture');
const heroCopy = document.querySelector('.hero-copy');
const rigging = document.querySelector('.rigging');
const mist = document.querySelector('.hero .mist');
const arrival = document.querySelector('.arrival');
const arrivalImage = document.querySelector('.arrival-image');
const arrivalFog = document.querySelector('.arrival-fog');
const journalArt = document.querySelector('.journal-art');
const clamp = value => Math.min(1, Math.max(0, value));
function renderMotion() {
  animationFrame = 0;
  if (!body.classList.contains('film') || body.classList.contains('reduced-motion')) return;
  const heroBounds = hero.getBoundingClientRect();
  const progress = clamp(-heroBounds.top / Math.max(1, heroBounds.height - innerHeight));
  heroPicture.style.transform = 'translate3d(' + pointerX * 9 + 'px,' + (progress * -65 + pointerY * 7) + 'px,0) scale(' + (1.02 + progress * .21) + ')';
  heroCopy.style.transform = 'translateY(' + progress * -110 + 'px)';
  heroCopy.style.opacity = String(1 - clamp((progress - .25) / .5));
  rigging.style.transform = 'translate3d(' + pointerX * 24 + 'px,' + progress * -180 + 'px,0) scale(' + (1 + progress * .15) + ')';
  mist.style.transform = 'translate3d(' + (progress * 100 + pointerX * -15) + 'px,' + progress * -30 + 'px,0)';
  mist.style.opacity = String(.2 + progress * .75);
  const arrivalBounds = arrival.getBoundingClientRect();
  const arrivalProgress = clamp((innerHeight - arrivalBounds.top) / (innerHeight + arrivalBounds.height * .4));
  arrivalImage.style.transform = 'translateY(' + (1 - arrivalProgress) * 45 + 'px) scale(' + (1.08 - arrivalProgress * .07) + ')';
  arrivalFog.style.opacity = String((1 - arrivalProgress) * .8);
  const journalBounds = journalArt.getBoundingClientRect();
  journalArt.style.setProperty('--journal-offset', (clamp((innerHeight - journalBounds.top) / (innerHeight + journalBounds.height)) - .5) * -50 + 'px');
}
function scheduleMotion() {
  if (!animationFrame) animationFrame = requestAnimationFrame(renderMotion);
}
function applyMotionPreference() {
  const isReduced = motionOverride ?? systemMotion.matches;
  body.classList.toggle('reduced-motion', isReduced);
  motionButton.setAttribute('aria-pressed', String(isReduced));
  motionButton.textContent = isReduced ? '恢復完整動態' : '減少動態效果';
  scheduleMotion();
}
motionButton.addEventListener('click', () => {
  motionOverride = !body.classList.contains('reduced-motion');
  applyMotionPreference();
});
systemMotion.addEventListener('change', () => { motionOverride = null; applyMotionPreference(); });
addEventListener('scroll', scheduleMotion, { passive: true });
addEventListener('resize', scheduleMotion, { passive: true });
document.querySelector('.hero-stage').addEventListener('pointermove', event => {
  pointerX = event.clientX / innerWidth - .5;
  pointerY = event.clientY / innerHeight - .5;
  scheduleMotion();
});
document.querySelector('.hero-stage').addEventListener('pointerleave', () => { pointerX = 0; pointerY = 0; scheduleMotion(); });
applyMotionPreference();
const seas = [
  {name:'開放海域', description:'有些日子，只要繼續航行就好。', art:'open-sea-backdrop.png'},
  {name:'風暴', description:'計畫被打亂了，仍然可以照顧好眼前的自己。', art:'storm-backdrop.png'},
  {name:'塞壬之海', description:'每個方向都在呼喚；你可以重新聽見自己的聲音。', art:'siren-waters-backdrop.png'},
  {name:'卡呂普索', description:'舒服的停留，也可以慢慢辨認它的代價。', art:'calypso-backdrop.png'},
  {name:'伊薩卡', description:'抵達不是獎盃，何時靠岸由你決定。', art:'ithaca-backdrop.png'}
];
const seaButtons = [...document.querySelectorAll('[data-sea]')];
const seaImages = [...document.querySelectorAll('.sea-image')];
seaButtons.forEach(button => button.addEventListener('click', () => {
  const index = Number(button.dataset.sea);
  seaButtons.forEach((item, position) => item.setAttribute('aria-pressed', String(position === index)));
  seaImages.forEach((item, position) => item.classList.toggle('is-active', position === index));
  document.querySelector('[data-sea-title]').textContent = seas[index].name;
  document.querySelector('[data-sea-description]').textContent = seas[index].description;
}));
const examples = [
  {text:'今天很難，先照顧自己。', sea:1},
  {text:'今天終於把作品拿給一個人看了。', sea:0},
  {text:'今天一直在看別人走的路。', sea:2}
];
let journalTimer = 0;
const exampleButtons = [...document.querySelectorAll('[data-example]')];
exampleButtons.forEach(button => button.addEventListener('click', () => {
  const index = Number(button.dataset.example);
  const example = examples[index];
  exampleButtons.forEach((item, position) => item.setAttribute('aria-pressed', String(position === index)));
  document.querySelector('[data-journal-text]').textContent = example.text;
  const image = journalArt.querySelector('img');
  journalArt.classList.add('changing');
  document.querySelector('.journal-copy').classList.add('is-changing');
  image.src = '../../public/art/' + seas[example.sea].art;
  image.alt = seas[example.sea].name + '海景示例';
  document.querySelector('[data-journal-status]').textContent = '示例海象：' + seas[example.sea].name;
  clearTimeout(journalTimer);
  journalTimer = setTimeout(() => {
    journalArt.classList.remove('changing');
    document.querySelector('.journal-copy').classList.remove('is-changing');
  }, 1000);
}));
const windButton = document.querySelector('[data-wind]');
let windTimer = 0;
windButton.addEventListener('click', () => {
  const companions = document.querySelector('.companions');
  clearTimeout(windTimer);
  companions.classList.remove('is-windy');
  void companions.offsetWidth;
  companions.classList.add('is-windy');
  document.querySelector('[data-wind-status]').textContent = '一陣風已送向遠方的帆影（互動示例）';
  windTimer = setTimeout(() => companions.classList.remove('is-windy'), 2400);
});
const dialog = document.querySelector('dialog');
document.querySelectorAll('[data-start]').forEach(button => button.addEventListener('click', () => dialog.showModal()));
document.querySelector('[data-close-dialog]').addEventListener('click', () => dialog.close());
