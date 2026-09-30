import assert from 'node:assert/strict';
import { chromium } from '/Applications/ChatGPT.app/Contents/Resources/cua_node/lib/node_modules/playwright-core/index.mjs';

const browser = await chromium.launch({
  executablePath: '/Users/nate/Library/Caches/ms-playwright/chromium-1200/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',
  headless: true,
});
const base = process.env.LANDING_PREVIEW_URL ?? 'http://127.0.0.1:4173/';
const errors = [];
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.status() >= 400) errors.push(response.status() + ' ' + response.url()); });
  await page.goto(base);
  await page.evaluate(async () => {
    document.querySelectorAll('img').forEach(image => { image.loading = 'eager'; });
    await document.fonts.ready;
    await Promise.all([...document.images].map(image => image.decode()));
  });
  assert.equal(await page.locator('.site-brand').textContent(), '✧Open Odyssey');
  assert.equal(await page.locator('.hero-journey').count(), 1);
  assert.equal(await page.locator('.hero-scene > img').count(), 5);
  assert.equal(await page.locator('.hero-scene > img').evaluateAll(images => new Set(images.map(image => image.getAttribute('src'))).size), 4);
  assert.equal(await page.locator('.hero-ocean').getAttribute('src'), await page.locator('.hero-backplate').getAttribute('src'), 'water plane must use the registered clean plate');
  assert.notEqual(await page.locator('.hero-ocean').evaluate(image => getComputedStyle(image).maskImage), 'none', 'water plane must blend below the horizon');
  const transparentSamples = await page.evaluate(() => {
    const checks = [['hero-island', 800, 100], ['hero-ship', 800, 100], ['hero-wordmark', 800, 800]];
    return checks.map(([name, x, y]) => {
      const image = document.querySelector(`.${name}`);
      const canvas = document.createElement('canvas');
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const context = canvas.getContext('2d');
      context.drawImage(image, 0, 0);
      return [name, context.getImageData(x, y, 1, 1).data[3]];
    });
  });
  assert.ok(transparentSamples.every(([, alpha]) => alpha < 16), `layer transparency: ${JSON.stringify(transparentSamples)}`);
  const rightIslandAlpha = await page.locator('.hero-island').evaluate(image => {
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext('2d');
    context.drawImage(image, 0, 0);
    return {
      cliff: context.getImageData(1200, 390, 1, 1).data[3],
      shoreline: context.getImageData(1200, 417, 1, 1).data[3],
    };
  });
  assert.ok(rightIslandAlpha.cliff > 240, `right island cliff became translucent: ${rightIslandAlpha.cliff}`);
  assert.ok(rightIslandAlpha.shoreline > 120, `right island floats above the sea: ${rightIslandAlpha.shoreline}`);
  assert.equal(await page.locator('.hero-backplate').evaluate(image => {
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext('2d');
    context.drawImage(image, 0, 0);
    return context.getImageData(800, 100, 1, 1).data[3];
  }), 255, 'the background must remain opaque behind moving objects');
  assert.equal(await page.locator('.passage').evaluate(element => getComputedStyle(element).backgroundImage.includes('url(')), false);
  assert.equal(await page.locator('.harbor-backdrop').count(), 1);
  assert.equal(await page.locator('main > section').count(), 5);
  for (const [name, selector] of [
    ['hero', '#top'], ['journal', '#journal'],
    ['atlas', '#atlas'], ['companions', '#companions'], ['harbor', '#harbor'],
  ]) {
    await page.locator(selector).evaluate(element => scrollTo({top:element.offsetTop,behavior:'instant'}));
    await page.waitForTimeout(180);
    await page.screenshot({path:'/tmp/Codex-screenshot-open-odyssey-a2-' + name + '.png'});
  }
  await page.evaluate(() => scrollTo({top:0,behavior:'instant'}));
  const before = await page.locator('.hero-ship').evaluate(element => getComputedStyle(element).transform);
  await page.mouse.wheel(0, 260);
  await page.waitForFunction(() => scrollY > 0);
  await page.waitForFunction(initial => getComputedStyle(document.querySelector('.hero-ship')).transform !== initial, before);
  await page.evaluate(() => scrollTo({top:(document.querySelector('.hero-journey').offsetHeight-innerHeight)*.65,behavior:'instant'}));
  await page.waitForFunction(() => Number(document.querySelector('.hero-sticky').style.getPropertyValue('--hero-progress')) > .6);
  await page.waitForFunction(initial => getComputedStyle(document.querySelector('.hero-ship')).transform !== initial, before);
  const layerTransforms = await page.locator('.hero-scene > img').evaluateAll(images => images.map(image => getComputedStyle(image).transform));
  assert.ok(new Set(layerTransforms).size >= 4, 'hero layers need distinct parallax motion');
  assert.notEqual(await page.locator('.hero-ocean').evaluate(image => getComputedStyle(image).transform), await page.locator('.hero-backplate').evaluate(image => getComputedStyle(image).transform), 'near water needs its own depth response');
  const depthScales = await page.evaluate(() => ['hero-island','hero-backplate','hero-ocean','hero-ship'].map(name => new DOMMatrixReadOnly(getComputedStyle(document.querySelector(`.${name}`)).transform).a));
  assert.ok(depthScales.every((scale,index) => index === 0 || scale > depthScales[index-1]), `depth should grow from island to ship: ${depthScales}`);
  await page.screenshot({path:'/tmp/Codex-screenshot-open-odyssey-a2-parallax.png'});
  const progressDistance = await page.locator('.hero-journey').evaluate(element => element.offsetHeight - innerHeight);
  await page.evaluate(distance => scrollTo({top:distance*.99,behavior:'instant'}), progressDistance);
  await page.waitForFunction(() => Number(getComputedStyle(document.querySelector('.chart-overlay')).opacity) > .95);
  await page.screenshot({path:'/tmp/Codex-screenshot-open-odyssey-a2-chart.png'});
  await page.getByRole('button', {name:'往前一步'}).click();
  assert.match(await page.locator('[data-entry]').textContent(), /終於把心裡的話/);
  assert.match(await page.locator('.weather-status').textContent(), /雲漸漸散開/);
  await page.getByRole('button', {name:'聽見別的聲音'}).click();
  assert.match(await page.locator('.journal-weather img').getAttribute('src'), /a2-siren\.jpg$/);
  await page.waitForFunction(() => getComputedStyle(document.querySelector('.journal-weather img')).filter === 'none');
  assert.equal(await page.locator('.journal-weather img').evaluate(element => getComputedStyle(element).filter), 'none');
  await page.locator('[data-sea="2"]').focus();
  await page.keyboard.press('Enter');
  assert.equal(await page.locator('[data-sea-name]').textContent(), '塞壬之海');
  assert.equal(await page.locator('.atlas-stage img.is-current').count(), 1);
  assert.equal(await page.locator('.weather-rose').getAttribute('data-selected'), '2');
  await page.keyboard.press('ArrowRight');
  assert.equal(await page.locator('[data-sea-name]').textContent(), '卡呂普索');
  await page.getByRole('button', {name:'送一陣風'}).click();
  assert.match(await page.locator('.wind-status').textContent(), /怡君/);
  await page.waitForFunction(() => document.querySelector('.companions-section').classList.contains('is-windy'));
  await page.getByRole('button', {name:'減少動態'}).click();
  await page.waitForTimeout(300);
  assert.equal(await page.locator('.hero-ship').evaluate(element => getComputedStyle(element).transform), 'none');
  await page.getByRole('button', {name:'恢復動態'}).click();
  assert.equal(await page.locator('.motion-button').getAttribute('aria-pressed'), 'false');
  const sizes = [[320,700],[390,844],[768,1024],[1024,768],[1050,900],[1240,900],[1280,800],[1440,900],[1672,941],[1920,1080],[2560,1080]];
  for (const [width,height] of sizes) {
    await page.setViewportSize({width,height});
    await page.goto(base);
    await page.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.querySelectorAll('.hero-scene img, .hero-mobile-scene')].map(image => image.decode())); });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'horizontal overflow at ' + width);
    const heading = await page.locator('.hero-copy h1').boundingBox();
    assert.ok(heading && heading.x >= 0 && heading.x + heading.width <= width && heading.y + heading.height <= height, `heading clipped at ${width}x${height}`);
    if ([390,768,1240,1280,1440,2560].includes(width)) {
      const distance = await page.locator('.hero-journey').evaluate(element => element.offsetHeight - innerHeight);
      for (const [name,progress] of [['start',0],['quarter',.3],['middle',.5],['late',.7],['chart',.9]]) {
        await page.evaluate(position => scrollTo({top:position,behavior:'instant'}),distance*progress);
        await page.waitForTimeout(100);
        if (name === 'middle') {
          const chartOpacity = await page.locator('.chart-overlay').evaluate(element => Number(getComputedStyle(element).opacity));
          assert.ok(chartOpacity < .02, `chart begins too early at ${width}x${height}`);
        }
        await page.screenshot({path:`/tmp/Codex-screenshot-open-odyssey-a2-${width}-${name}.png`});
      }
      await page.evaluate(() => scrollTo({top:0,behavior:'instant'}));
      await page.waitForFunction(() => scrollY === 0 && Number(document.querySelector('.hero-sticky').style.getPropertyValue('--hero-progress')) <= .01);
      await page.waitForTimeout(120);
      if (width >= 1024) {
        await page.mouse.move(2,height/2);
        await page.waitForTimeout(320);
        const left = await page.locator('.hero-ship').evaluate(element => ({translate:getComputedStyle(element).translate,rect:element.getBoundingClientRect().toJSON()}));
        const islandAtLeft = await page.locator('.hero-island').evaluate(element => ({translate:getComputedStyle(element).translate,transform:getComputedStyle(element).transform}));
        if (width === 1280) await page.screenshot({path:'/tmp/Codex-screenshot-open-odyssey-a2-1280-pointer-left.png'});
        await page.mouse.move(width-2,height/2);
        await page.waitForTimeout(320);
        const right = await page.locator('.hero-ship').evaluate(element => ({translate:getComputedStyle(element).translate,rect:element.getBoundingClientRect().toJSON()}));
        const islandAtRight = await page.locator('.hero-island').evaluate(element => ({translate:getComputedStyle(element).translate,transform:getComputedStyle(element).transform}));
        if (width === 1280) await page.screenshot({path:'/tmp/Codex-screenshot-open-odyssey-a2-1280-pointer-right.png'});
        assert.notEqual(left.translate,right.translate,`mouse parallax missing at ${width}x${height}`);
        assert.deepEqual(islandAtLeft,islandAtRight,`island moves with pointer at ${width}x${height}`);
        for (const [side,result] of [['left',left],['right',right]]) {
          assert.ok(result.rect.left <= 0 && result.rect.right >= width,`ship edge exposed on ${side} at ${width}x${height}`);
        }
        await page.mouse.move(width/2,height/2);
      }
    }
    if (width === 390) {
      for (const [name,selector] of [['hero','#top'],['journal','#journal'],['atlas','#atlas'],['companions','#companions'],['harbor','#harbor']]) {
        await page.locator(selector).evaluate(element => scrollTo({top:element.offsetTop,behavior:'instant'}));
        await page.waitForTimeout(130);
        await page.screenshot({path:'/tmp/Codex-screenshot-open-odyssey-a2-mobile-' + name + '.png'});
      }
    }
  }
  await page.setViewportSize({width:1280,height:800});
  await page.goto(base);
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.waitForFunction(() => document.body.classList.contains('reduced-motion'));
  await page.waitForFunction(() => getComputedStyle(document.querySelector('.hero-ship')).transform === 'none');
  assert.equal(await page.locator('.hero-ship').evaluate(element => getComputedStyle(element).transform), 'none');
  const reducedLayout = await page.evaluate(() => ({
    frameBottom: document.querySelector('.hero-frame').getBoundingClientRect().bottom,
    chartTop: document.querySelector('.chart-overlay').getBoundingClientRect().top,
  }));
  assert.ok(reducedLayout.chartTop >= reducedLayout.frameBottom - 1, 'reduced-motion chart overlaps the hero');
  await page.screenshot({path:'/tmp/Codex-screenshot-open-odyssey-a2-reduced-motion.png'});
  await page.getByRole('link',{name:'開始我的航程'}).click();
  await page.waitForFunction(() => location.hash === '#top');
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({pass:true,sizes,imagesDecoded:true,parallax:true,journal:true,seaKeyboard:true,wind:true,motionPreferences:true,errors},null,2));
} finally {
  await browser.close();
}
