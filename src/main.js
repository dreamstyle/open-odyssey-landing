const siteHeader = document.querySelector('.site-header');
const heroJourney = document.querySelector('.hero-journey');
const heroStage = document.querySelector('.hero-sticky');
const heroFrame = document.querySelector('.hero-frame') ?? document.querySelector('.voyage-frame');
const exploreLink = document.querySelector('.scroll-invitation');
const hasLayeredHero = Boolean(document.querySelector('.hero-scene'));
const journalSection = document.querySelector('.journal-section');
const companionSection = document.querySelector('.companions-section');
const harborSection = document.querySelector('.harbor-section');
const systemMotion = matchMedia('(prefers-reduced-motion: reduce)');
const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
let isScrollQueued = false;

const clamp = (value, minimum, maximum) => Math.max(minimum, Math.min(maximum, value));
const isMotionReduced = () => systemMotion.matches;

function updateMotion() {
  const isReduced = isMotionReduced();
  document.body.classList.toggle('reduced-motion', isReduced);
  document.documentElement.classList.toggle('reduced-motion', isReduced);
  heroFrame.inert = false;
  if (isReduced) {
    heroStage.style.setProperty('--hero-progress', '0');
    heroStage.style.setProperty('--pointer-x', '0px');
    heroStage.style.setProperty('--pointer-y', '0px');
  }
  updateScroll();
}

function updateScroll() {
  siteHeader.classList.toggle('is-scrolled', scrollY > 85);
  if (isMotionReduced()) return;

  const heroDistance = Math.max(1, heroJourney.offsetHeight - innerHeight);
  const heroProgress = clamp((scrollY - heroJourney.offsetTop) / heroDistance, 0, 1);
  heroStage.style.setProperty('--hero-progress', heroProgress.toFixed(3));
  heroFrame.inert = heroProgress > (hasLayeredHero ? .71 : .48);

  for (const [section, target, factor] of [
    [journalSection, '.journal-weather img', 110],
    [journalSection, '.journal-sheet', -45],
    [companionSection, '.companions-image img', 190],
    [harborSection, '.harbor-backdrop', 100],
  ]) {
    const bounds = section.getBoundingClientRect();
    if (bounds.bottom < 0 || bounds.top > innerHeight) continue;
    const progress = clamp((innerHeight / 2 - bounds.top) / (bounds.height / 2 + innerHeight), 0, 1);
    const property = target.includes('sheet') ? '--sheet-parallax' : target.includes('weather') ? '--journal-parallax' : target.includes('companions') ? '--companion-parallax' : '--harbor-parallax';
    section.style.setProperty(property, ((progress - .5) * factor).toFixed(1) + 'px');
  }
}

addEventListener('scroll', () => {
  if (isScrollQueued) return;
  isScrollQueued = true;
  requestAnimationFrame(() => {
    updateScroll();
    isScrollQueued = false;
  });
}, { passive: true });
addEventListener('resize', updateScroll);
if (hasLayeredHero) {
  heroStage.addEventListener('pointermove', event => {
    if (isMotionReduced() || !finePointer.matches || getComputedStyle(document.querySelector('.hero-scene')).display === 'none') return;
    const bounds = heroStage.getBoundingClientRect();
    const horizontal = clamp((event.clientX - bounds.left) / bounds.width * 2 - 1, -1, 1);
    const vertical = clamp((event.clientY - bounds.top) / bounds.height * 2 - 1, -1, 1);
    heroStage.style.setProperty('--pointer-x', `${(horizontal * 8).toFixed(1)}px`);
    heroStage.style.setProperty('--pointer-y', `${(vertical * 4).toFixed(1)}px`);
  }, { passive: true });
  heroStage.addEventListener('pointerleave', () => {
    heroStage.style.setProperty('--pointer-x', '0px');
    heroStage.style.setProperty('--pointer-y', '0px');
  });
  exploreLink.addEventListener('click', event => {
    if (isMotionReduced()) return;
    event.preventDefault();
    const distance = heroJourney.offsetHeight - innerHeight;
    scrollTo({ top: heroJourney.offsetTop + distance * .98, behavior: 'smooth' });
  });
}
systemMotion.addEventListener('change', updateMotion);
updateMotion();

const journalEntries = [
  { entry: '今天的浪很大\n我想先學會穩住自己', weather: '判讀：風暴', image: '/images/journal-storm.jpg', kind: 'storm' },
  { entry: '終於把心裡的話說出口\n船好像走得更遠了', weather: '判讀：開放海域', image: '/images/sea-open.jpg', kind: 'open' },
  { entry: '聽見好多聲音\n我要找回自己的方向', weather: '判讀：海妖海域', image: '/images/sea-siren.jpg', kind: 'siren' },
];
const journalImage = document.querySelector('.journal-weather img');
const writtenEntry = document.querySelector('[data-entry]');
for (const button of document.querySelectorAll('[data-journal]')) {
  button.addEventListener('click', () => {
    const selected = Number(button.dataset.journal);
    const entry = journalEntries[selected];
    document.querySelectorAll('[data-journal]').forEach(control => {
      control.setAttribute('aria-pressed', String(control === button));
    });
    writtenEntry.textContent = entry.entry;
    journalImage.src = entry.image;
    document.querySelector('.journal-stage').dataset.weather = entry.kind;
    document.querySelector('.weather-status').textContent = entry.weather;
    if (!isMotionReduced()) writtenEntry.animate([{ opacity: .3, transform: 'translateY(.5rem)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 460, easing: 'cubic-bezier(.22,1,.36,1)' });
  });
}

const seas = [
  { english: 'OPEN SEA', name: '開放海域', description: '眼前有許多可能，還不必知道目的地' },
  { english: 'STORM', name: '風暴', description: '即使風浪很大，船仍在你手裡' },
  { english: 'SIREN WATERS', name: '海妖海域', description: '外界期待或誘惑，正在影響你的方向' },
  { english: 'CALYPSO', name: '卡呂普索', description: '舒服的地方，有時讓人捨不得離開' },
  { english: 'ITHACA', name: '伊薩卡', description: '何時靠岸，由你決定' },
];
const seaButtons = [...document.querySelectorAll('[data-sea]')];
const seaImages = [...document.querySelectorAll('[data-sea-image]')];
const atlasStage = document.querySelector('.atlas-stage');
const atlasNavigation = document.querySelector('.atlas-navigation');
let strikeTimeout;
function selectSea(index) {
  const sea = seas[index];
  if (!sea) return;
  seaButtons.forEach((button, buttonIndex) => button.setAttribute('aria-pressed', String(buttonIndex === index)));
  seaImages.forEach((image, imageIndex) => image.classList.toggle('is-current', imageIndex === index));
  document.querySelector('[data-sea-english]').textContent = sea.english;
  document.querySelector('[data-sea-name]').textContent = sea.name;
  document.querySelector('[data-sea-description]').textContent = sea.description;
  atlasNavigation.style.setProperty('--bearing-position', `${10 + index * 20}%`);
  clearTimeout(strikeTimeout);
  atlasStage.classList.remove('is-striking');
  if (index === 1 && !isMotionReduced()) {
    void atlasStage.offsetWidth;
    atlasStage.classList.add('is-striking');
    strikeTimeout = setTimeout(() => atlasStage.classList.remove('is-striking'), 500);
  }
}
seaButtons.forEach((button, index) => {
  button.addEventListener('click', () => selectSea(index));
  button.addEventListener('keydown', event => {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowRight' && event.key !== 'ArrowUp' && event.key !== 'ArrowLeft') return;
    event.preventDefault();
    const step = event.key === 'ArrowDown' || event.key === 'ArrowRight' ? 1 : -1;
    const nextIndex = (index + step + seas.length) % seas.length;
    selectSea(nextIndex);
    seaButtons[nextIndex].focus();
  });
});

const windButton = document.querySelector('.send-wind');
let windTimeout;
windButton.addEventListener('click', () => {
  clearTimeout(windTimeout);
  companionSection.classList.remove('is-windy');
  if (!isMotionReduced()) {
    void companionSection.offsetWidth;
    companionSection.classList.add('is-windy');
    windTimeout = setTimeout(() => companionSection.classList.remove('is-windy'), 1900);
  }
  document.querySelector('.wind-status').textContent = '已送出鼓勵，Mia 的船會收到一陣順風';
  windButton.firstChild.textContent = '再次送出鼓勵 ';
});
