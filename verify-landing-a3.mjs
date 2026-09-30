import assert from 'node:assert/strict';
import { chromium } from '/Applications/ChatGPT.app/Contents/Resources/cua_node/lib/node_modules/playwright-core/index.mjs';

const browser = await chromium.launch({
  executablePath: '/Users/nate/Library/Caches/ms-playwright/chromium-1200/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',
  headless: true,
});
const url = process.env.A3_PREVIEW_URL ?? 'http://127.0.0.1:4173/a3.html';
const sizes = [
  [320, 700], [390, 844], [768, 1024], [1024, 768], [1050, 900],
  [1100, 800], [1240, 900], [1366, 768], [1440, 900], [1672, 941], [1920, 1080],
];
const errors = [];

try {
  const page = await browser.newPage();
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => {
    if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`);
  });

  for (const [width, height] of sizes) {
    await page.setViewportSize({ width, height });
    await page.goto(url);
    await page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all([...document.querySelectorAll('.voyage-plane, .voyage-mobile img')].map(image => image.decode()));
    });
    const first = await page.evaluate(() => {
      const word = document.querySelector('.voyage-wordmark text').getBoundingClientRect();
      const heading = document.querySelector('.hero-copy h1').getBoundingClientRect();
      const isMobile = innerWidth <= 700;
      const photo = document.querySelector(isMobile ? '.voyage-mobile img' : '.voyage-ship');
      return {
        pageWidth: document.documentElement.scrollWidth,
        word: { left: word.left, right: word.right, top: word.top, bottom: word.bottom },
        heading: { left: heading.left, right: heading.right, bottom: heading.bottom },
        photo: photo.currentSrc,
        transform: getComputedStyle(photo).transform,
        layers: [...document.querySelectorAll('.voyage-plane')].map(image => ({
          width: image.getBoundingClientRect().width,
          height: image.getBoundingClientRect().height,
          fit: getComputedStyle(image).objectFit,
          loaded: image.naturalWidth === 1672,
        })),
      };
    });
    assert.ok(first.pageWidth <= width + 1, `horizontal overflow at ${width}x${height}`);
    assert.ok(first.word.left >= -2 && first.word.right <= width + 2, `wordmark cropped at ${width}x${height}: ${JSON.stringify(first.word)}`);
    assert.ok(first.heading.left >= 0 && first.heading.right <= width && first.heading.bottom <= height, `heading cropped at ${width}x${height}`);
    assert.ok(first.layers.every(layer => layer.loaded && (width <= 700 || (layer.width === width && layer.height === height && layer.fit === 'cover'))), `parallax planes have mismatched geometry at ${width}x${height}`);
    if ([320, 1024].includes(width)) await page.screenshot({ path: `/tmp/Codex-screenshot-open-odyssey-a3-${width}-start.png` });
    const distance = await page.locator('.hero-journey').evaluate(element => element.offsetHeight - innerHeight);
    assert.ok(distance > height * .7, `hero lacks scroll journey at ${width}x${height}`);
    await page.evaluate(scrollDistance => scrollTo({ top: scrollDistance * .55, behavior: 'instant' }), distance);
    await page.waitForFunction(() => Number(document.querySelector('.hero-sticky').style.getPropertyValue('--hero-progress')) >= .54);
    const middleTransform = await page.locator(width <= 700 ? '.voyage-mobile img' : '.voyage-ship').evaluate(element => getComputedStyle(element).transform);
    assert.notEqual(middleTransform, first.transform, `no scene movement at ${width}x${height}`);
    if (width > 700) {
      const motions = await page.locator('.voyage-sky, .voyage-ocean, .voyage-island, .voyage-ship').evaluateAll(elements => elements.map(element => getComputedStyle(element).transform));
      assert.equal(new Set(motions).size, 4, `planes are not moving independently at ${width}x${height}`);
    }
    await page.evaluate(scrollDistance => scrollTo({ top: scrollDistance, behavior: 'instant' }), distance);
    await page.waitForFunction(() => Number(document.querySelector('.hero-sticky').style.getPropertyValue('--hero-progress')) >= .99);
    const chartOpacity = await page.locator('.chart-overlay').evaluate(element => Number(getComputedStyle(element).opacity));
    assert.ok(chartOpacity >= .99, `chart does not take over at ${width}x${height}`);
    if ([390, 768, 1240, 1440].includes(width)) {
      for (const [label, progress] of [['start', 0], ['middle', .52], ['chart', 1]]) {
        await page.evaluate(position => scrollTo({ top: position, behavior: 'instant' }), distance * progress);
        await page.waitForTimeout(130);
        await page.screenshot({ path: `/tmp/Codex-screenshot-open-odyssey-a3-${width}-${label}.png` });
      }
      await page.evaluate(position => scrollTo({ top: position, behavior: 'instant' }), distance + height * .28);
      await page.waitForTimeout(130);
      await page.screenshot({ path: `/tmp/Codex-screenshot-open-odyssey-a3-${width}-handoff.png` });
    }
  }

  await page.setViewportSize({ width: 1240, height: 900 });
  await page.goto(url);
  await page.getByRole('link', { name: '向下探索' }).click();
  await page.waitForFunction(() => {
    const journey = document.querySelector('.hero-journey');
    return scrollY >= (journey.offsetHeight - innerHeight) * .7;
  });
  await page.getByRole('button', { name: '往前一步' }).click();
  assert.match(await page.locator('[data-entry]').textContent(), /終於把心裡的話/);
  await page.getByRole('button', { name: '塞壬之海' }).click();
  assert.equal(await page.locator('[data-sea-name]').textContent(), '塞壬之海');
  await page.getByRole('button', { name: '送一陣風' }).click();
  assert.match(await page.locator('.wind-status').textContent(), /怡君/);
  await page.getByRole('button', { name: '減少動態' }).click();
  assert.equal(await page.locator('.motion-button').getAttribute('aria-pressed'), 'true');
  assert.ok(await page.locator('.chart-overlay').evaluate(element => Number(getComputedStyle(element).opacity) === 1));
  await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
  await page.waitForFunction(() => getComputedStyle(document.querySelector('.hero-copy')).opacity === '1');
  assert.equal(await page.locator('.voyage-frame').evaluate(element => element.inert), false);
  await page.screenshot({ path: '/tmp/Codex-screenshot-open-odyssey-a3-reduced-start.png' });
  await page.locator('.chart-overlay').scrollIntoViewIfNeeded();
  await page.screenshot({ path: '/tmp/Codex-screenshot-open-odyssey-a3-reduced-chart.png' });
  const reducedLayout = await page.evaluate(() => {
    const frame = document.querySelector('.voyage-frame').getBoundingClientRect();
    const chart = document.querySelector('.chart-overlay').getBoundingClientRect();
    return { frameBottom: frame.bottom, chartTop: chart.top };
  });
  assert.ok(Math.abs(reducedLayout.chartTop - reducedLayout.frameBottom) <= 2, 'reduced-motion chart should follow the image without overlap');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.waitForFunction(() => document.body.classList.contains('reduced-motion'));
  assert.equal(await page.locator('.hero-copy').evaluate(element => getComputedStyle(element).opacity), '1');
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ pass: true, sizes, sceneMotion: true, chartTransition: true, interaction: true, reducedMotion: true, errors }, null, 2));
} finally {
  await browser.close();
}
