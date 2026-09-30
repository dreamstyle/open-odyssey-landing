import assert from 'node:assert/strict';
import { chromium } from '/Applications/ChatGPT.app/Contents/Resources/cua_node/lib/node_modules/playwright-core/index.mjs';
const browser = await chromium.launch({
  executablePath: '/Users/nate/Library/Caches/ms-playwright/chromium-1200/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',
  headless: true,
});
const url = process.env.A_PREVIEW_URL ?? 'http://127.0.0.1:4173/a.html';
const errors = [];
try {
  const page = await browser.newPage({ viewport: { width: 1672, height: 941 } });
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.status() >= 400) errors.push(response.status() + ' ' + response.url()); });
  await page.goto(url);
  await page.evaluate(async () => {
    for (const picture of document.images) picture.loading = 'eager';
    await document.fonts.ready;
    await Promise.all([...document.images].map(picture => picture.decode()));
  });
  assert.equal(await page.locator('main > section').count(), 6);
  for (const section of ['home', 'journal', 'seas', 'companions', 'arrival', 'start']) {
    await page.locator('#' + section).evaluate(element => scrollTo({ top: element.offsetTop, behavior: 'instant' }));
    await page.waitForTimeout(150);
    await page.screenshot({ path: '/tmp/Codex-screenshot-odyssey-restored-' + section + '.png' });
  }
  await page.evaluate(() => scrollTo({top:0,behavior:'instant'}));
  await page.waitForTimeout(150);
  const transform = await page.locator('.hero-picture').evaluate(element => getComputedStyle(element).transform);
  await page.mouse.wheel(0, 350);
  await page.waitForFunction(before => getComputedStyle(document.querySelector('.hero-picture')).transform !== before, transform);
  await page.getByRole('button', {name: '試試海象回應'}).click();
  assert.equal(await page.locator('dialog').evaluate(element => element.open), true);
  await page.getByRole('button', {name:'往前了一點',exact:true}).click();
  assert.equal(await page.locator('[data-journal-text]').textContent(), '今天終於把作品拿給一個人看了。');
  assert.match(await page.locator('[data-journal-status]').textContent(), /開放海域/);
  assert.equal(await page.locator('dialog').evaluate(element => element.open), false);
  await page.getByRole('button', {name: '試試海象回應'}).click();
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('dialog').evaluate(element => element.open), false);
  assert.equal(await page.locator('[data-open-journal]').evaluate(element => element === document.activeElement), true);
  for (let index = 0; index < 5; index++) {
    await page.locator('[data-sea="' + index + '"]').focus();
    await page.keyboard.press('Enter');
    assert.equal(await page.locator('[data-sea="' + index + '"]').getAttribute('aria-pressed'), 'true');
    assert.equal(await page.locator('.sea-image.is-active').count(), 1);
  }
  await page.getByRole('button', {name:'送一陣風'}).click();
  await page.waitForFunction(() => document.querySelector('.companions').classList.contains('is-windy'));
  assert.match(await page.locator('[data-wind-status]').textContent(), /已送向/);
  await page.getByRole('button', {name:'減少動態',exact:true}).click();
  assert.equal(await page.locator('.hero-picture').evaluate(element => getComputedStyle(element).transform), 'none');
  await page.getByRole('button', {name:'恢復動態',exact:true}).click();
  for (const width of [390, 768, 1440]) {
    await page.setViewportSize({width, height:width===390?844:900});
    await page.goto(url);
    await page.evaluate(() => document.fonts.ready);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'overflow at ' + width);
    if (width === 390) {
      for (const section of ['home','journal','seas','companions','arrival','start']) {
        await page.locator('#' + section).evaluate(element => scrollTo({top:element.offsetTop,behavior:'instant'}));
        await page.waitForTimeout(100);
        await page.screenshot({path:'/tmp/Codex-screenshot-odyssey-restored-mobile-' + section + '.png'});
      }
      await page.getByRole('button', {name:'試試海象回應'}).click();
      await page.getByRole('button', {name:'今天很難',exact:true}).click();
      assert.match(await page.locator('[data-journal-status]').textContent(), /風暴/);
    }
  }
  await page.emulateMedia({ reducedMotion:'reduce' });
  await page.waitForFunction(() => document.body.classList.contains('reduced-motion'));
  assert.equal(await page.locator('.wind-lines').evaluate(element => getComputedStyle(element).display), 'none');
  await page.getByRole('link', {name:'開始我的航程'}).click();
  await page.waitForURL('http://127.0.0.1:4173/');
  await page.waitForFunction(() => (document.querySelector('#root')?.textContent ?? '').length > 20);
  assert.ok((await page.locator('#root').textContent()).length > 20, 'game entry rendered');
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({sections:6,cleanImages:true,scrollParallax:true,journalInteraction:true,dialogEscapeAndFocus:true,allSeaKeyboardSelections:true,wind:true,motionToggle:true,systemReducedMotion:true,responsiveWidths:[390,768,1440,1672],gameEntry:true,browserErrors:errors},null,2));
} finally { await browser.close(); }
