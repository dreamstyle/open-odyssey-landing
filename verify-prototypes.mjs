import assert from 'node:assert/strict';
import { chromium } from '/Applications/ChatGPT.app/Contents/Resources/cua_node/lib/node_modules/playwright-core/index.mjs';
const browser = await chromium.launch({
  executablePath: '/Users/nate/Library/Caches/ms-playwright/chromium-1200/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',
  headless: true,
});
const base = 'http://127.0.0.1:4187/design/landing-page-v2/';
const results = [];
try {
  await import('./verify-landing-a.mjs');
  for (const variant of ['b', 'c']) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 960 }, reducedMotion: 'no-preference' });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', response => {
      if (response.status() >= 400 && !response.url().endsWith('favicon.ico')) errors.push(response.status() + ' ' + response.url());
    });
    await page.goto(base + variant + '.html');
    await page.evaluate(() => document.fonts.ready);
    await page.locator('.hero-picture').evaluate(image => image.decode());
    await page.screenshot({ path: '/tmp/Codex-screenshot-odyssey-' + variant + '-hero.png' });
    assert.equal(await page.locator('main > section').count(), 6);
    await page.getByRole('button', { name: '往前了一點', exact: true }).click();
    await page.waitForFunction(() => document.querySelector('[data-journal-status]').textContent === '示例海象：開放海域');
    assert.equal(await page.locator('[data-journal-text]').textContent(), '今天終於把作品拿給一個人看了。');
    assert.ok((await page.locator('.journal-art img').getAttribute('src')).endsWith('open-sea-backdrop.png'));
    await page.locator('[data-sea="2"]').focus();
    await page.keyboard.press('Enter');
    assert.equal(await page.locator('[data-sea-title]').textContent(), '塞壬之海');
    assert.equal(await page.locator('[data-sea="2"]').getAttribute('aria-pressed'), 'true');
    assert.equal(await page.locator('.sea-image.is-active').count(), 1);
    await page.getByRole('button', { name: '送一陣風', exact: true }).click();
    assert.match(await page.locator('[data-wind-status]').textContent(), /已送向/);
    assert.equal(await page.locator('.companions').evaluate(element => element.classList.contains('is-windy')), true);
    await page.getByRole('button', { name: '開始我的航程', exact: true }).click();
    assert.equal(await page.locator('dialog').evaluate(dialog => dialog.open), true);
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('dialog').evaluate(dialog => dialog.open), false);
    await page.getByRole('button', { name: '減少動態效果', exact: true }).click();
    assert.equal(await page.locator('body').evaluate(element => element.classList.contains('reduced-motion')), true);
    assert.equal(await page.locator('.hero-picture').evaluate(element => getComputedStyle(element).transform), 'none');
    await page.getByRole('button', { name: '恢復完整動態', exact: true }).click();
    assert.equal(await page.locator('body').evaluate(element => element.classList.contains('reduced-motion')), false);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(base + variant + '.html');
    await page.evaluate(() => document.fonts.ready);
    await page.locator('.hero-picture').evaluate(image => image.decode());
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'Mobile horizontal overflow in ' + variant);
    await page.screenshot({ path: '/tmp/Codex-screenshot-odyssey-' + variant + '-mobile.png' });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.waitForFunction(() => document.body.classList.contains('reduced-motion'));
    assert.equal(await page.locator('.wind-lines').evaluate(element => getComputedStyle(element).display), 'none');
    assert.deepEqual(errors, [], 'Browser errors in ' + variant);
    results.push({variant,sections:6,scrollParallax:variant==='a',journalExample:true,seaKeyboardSelection:true,wind:true,dialogEscape:true,motionToggle:true,systemReducedMotion:true,mobileOverflow:false,browserErrors:errors});
    await context.close();
  }
  const galleryContext = await browser.newContext({viewport: {width: 1440, height: 960}});
  const galleryPage = await galleryContext.newPage();
  await galleryPage.goto(base);
  await galleryPage.evaluate(() => Promise.all([...document.images].map(image => image.decode())));
  assert.equal(await galleryPage.locator('article').count(), 3);
  await galleryPage.screenshot({path: '/tmp/Codex-screenshot-odyssey-comparison.png'});
  for (const variant of ['a', 'b', 'c']) {
    await galleryPage.goto(base + 'gallery-' + variant + '.html');
    await galleryPage.evaluate(() => {
      for (const image of document.images) image.loading = 'eager';
      return Promise.all([...document.images].map(image => image.decode()));
    });
    assert.equal(await galleryPage.locator('figure img').count(), 6);
    assert.ok(await galleryPage.evaluate(() => [...document.images].every(image => image.naturalWidth > 1000)));
  }
  await galleryContext.close();
  results.push({gallery: true, comparisonVariants: 3, sectionImages: 18});
  console.log(JSON.stringify(results, null, 2));
} finally {
  await browser.close();
}
