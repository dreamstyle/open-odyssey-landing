const a3Journey = document.querySelector('.hero-journey');
const a3Stage = document.querySelector('.hero-sticky');
const a3Frame = document.querySelector('.voyage-frame');
const a3Explore = document.querySelector('.scroll-invitation');

function updateHeroInteractivity() {
  const isReduced = document.body.classList.contains('reduced-motion');
  if (isReduced) a3Stage.style.setProperty('--hero-progress', '0');
  const distance = Math.max(1, a3Journey.offsetHeight - innerHeight);
  const progress = Math.max(0, Math.min(1, (scrollY - a3Journey.offsetTop) / distance));
  a3Frame.inert = !isReduced && progress > .48;
}

a3Explore.addEventListener('click', event => {
  if (document.body.classList.contains('reduced-motion')) return;
  event.preventDefault();
  const distance = a3Journey.offsetHeight - innerHeight;
  scrollTo({ top: a3Journey.offsetTop + distance * .84, behavior: 'smooth' });
});

addEventListener('scroll', updateHeroInteractivity, { passive: true });
addEventListener('resize', updateHeroInteractivity);
document.querySelector('.motion-button').addEventListener('click', updateHeroInteractivity);
updateHeroInteractivity();
