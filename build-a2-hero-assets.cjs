// The background is an opaque, object-free plate. Animated objects must not
// leave cut-out silhouettes in any stationary image beneath them.
const fs = require('node:fs');
const path = require('node:path');

const packageRoot = path.resolve(__dirname, '../../node_modules/.pnpm');
const sharpPackage = fs.readdirSync(packageRoot).find(name => name.startsWith('sharp@0.35.4_'));
if (!sharpPackage) throw new Error('Sharp 0.35.4 is required to rebuild the hero assets');
const sharp = require(path.join(packageRoot, sharpPackage, 'node_modules/sharp'));
const width = 1672;
const height = 941;
const file = name => path.join(__dirname, name);
const pixelIndex = (x, y) => (y * width + x) * 4;

async function pixels(name) {
  const { data, info } = await sharp(file(name)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  if (info.width !== width || info.height !== height || info.channels !== 4) {
    throw new Error(`${name} must be ${width}×${height} RGBA`);
  }
  return data;
}

function sample(data, x, y, channel) {
  const column = Math.round(x);
  const row = Math.round(y);
  if (column < 0 || column >= width || row < 0 || row >= height) return 0;
  return data[pixelIndex(column, row) + channel];
}

function alpha(value) {
  return Math.max(0, Math.min(1, (value - 8) / 232));
}

function islandSourceY(x, y) {
  const across = Math.max(0, Math.min(1, (x - 650) / 200));
  const downward = Math.max(0, Math.min(1, (y - 280) / 120));
  const rightSide = across * across * (3 - 2 * across);
  const lowerEdge = downward * downward * (3 - 2 * downward);
  return (y - 9 * rightSide * lowerEdge) * 1.25 + 80;
}

function softenMask(mask, radius) {
  const horizontal = new Uint8Array(width * height);
  const result = new Uint8Array(width * height);
  for (let axis = 0; axis < 2; axis++) {
    const source = axis === 0 ? mask : horizontal;
    const target = axis === 0 ? horizontal : result;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let total = 0;
        let count = 0;
        for (let step = -radius; step <= radius; step++) {
          const column = axis === 0 ? x + step : x;
          const row = axis === 1 ? y + step : y;
          if (column < 0 || column >= width || row < 0 || row >= height) continue;
          const value = source[row * width + column];
          total += value;
          count++;
        }
        target[y * width + x] = Math.round(total / count);
      }
    }
  }
  return result;
}

async function main() {
  const [poster, islandSource, shipSource, wordmarkSource] = await Promise.all([
    pixels('a2-hero-wordmark.png'),
    pixels('a4-island-mask-source.png'),
    pixels('a4-ship-mask-source.png'),
    pixels('a2-layer-wordmark.png'),
  ]);
  const shipMask = new Uint8Array(width * height);
  const islandMask = new Uint8Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const point = y * width + x;
      shipMask[point] = Math.round(alpha(shipSource[pixelIndex(x, y) + 3]) * 255);
      const sourceX = x * 1.25;
      const sourceY = islandSourceY(x, y);
      islandMask[point] = Math.round(alpha(sample(islandSource, sourceX, sourceY, 3)) * 255);
    }
  }

  const islandEdge = softenMask(islandMask, 1);
  const layers = {
    island: Buffer.alloc(width * height * 4),
    ship: Buffer.alloc(width * height * 4),
    wordmark: Buffer.alloc(width * height * 4),
  };
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const point = y * width + x;
      const offset = point * 4;
      const sourceX = x * 1.25;
      const sourceY = islandSourceY(x, y);
      for (let channel = 0; channel < 3; channel++) {
        layers.island[offset + channel] = islandEdge[point]
          ? sample(islandSource, sourceX, sourceY, channel)
          : 0;
        layers.ship[offset + channel] = shipMask[point] ? poster[offset + channel] : 0;
      }
      layers.island[offset + 3] = islandEdge[point];
      layers.ship[offset + 3] = shipMask[point];

      // Use the standalone textured lettering, not poster pixels containing
      // the ropes and mountains that will move away from behind the wordmark.
      const letterX = (x - width / 2) / .7 + width / 2;
      const letterY = (y + 120) / .65;
      for (let channel = 0; channel < 3; channel++) {
        layers.wordmark[offset + channel] = sample(wordmarkSource, letterX, letterY, 3)
          ? Math.round(sample(wordmarkSource, letterX, letterY, channel) * .35 + [247, 249, 245][channel] * .65)
          : 0;
      }
      layers.wordmark[offset + 3] = Math.round(alpha(sample(wordmarkSource, letterX, letterY, 3)) * 255);
    }
  }

  const raw = { raw: { width, height, channels: 4 } };
  await Promise.all(Object.entries(layers).map(([name, data]) => sharp(data, raw)
    .png({ compressionLevel: 9, palette: false })
    .toFile(file(`a2r-clean-${name}.png`))));
  await sharp(file('a2r-clean-backplate.png'))
    .composite(['wordmark', 'island', 'ship'].map(name => ({ input: file(`a2r-clean-${name}.png`), left: 0, top: 0 })))
    .png({ compressionLevel: 9 })
    .toFile('/tmp/Codex-screenshot-a2r-clean-reconstructed.png');
  console.log('Rebuilt clean island, ship, and wordmark layers without shared object pixels');
}

main().catch(error => { console.error(error); process.exitCode = 1; });
