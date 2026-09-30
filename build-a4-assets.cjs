// Rebuild the registered parallax planes from one source image. The generated
// transparent images provide silhouettes only; every visible pixel comes from
// a3-hero-clean.png, so moving layers cannot lower its detail or shift color.
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../../node_modules/.pnpm');
const sharpPackage = fs.readdirSync(root).find(name => name.startsWith('sharp@0.35.4_'));
if (!sharpPackage) throw new Error('Sharp 0.35.4 is required to rebuild the hero assets');
const sharp = require(path.join(root, sharpPackage, 'node_modules/sharp'));

const width = 1672;
const height = 941;
const source = path.join(__dirname, 'a3-hero-clean.png');
const empty = path.join(__dirname, 'a4-empty-source.png');
const shipMask = path.join(__dirname, 'a4-ship-mask-source.png');
const islandMask = path.join(__dirname, 'a4-island-mask-source.png');

async function pixels(file) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  if (info.width !== width || info.height !== height || info.channels !== 4) {
    throw new Error(`${path.basename(file)} must be ${width}×${height} RGBA`);
  }
  return data;
}

function islandAlpha(mask, x, y) {
  // The generator isolated the right silhouette but enlarged it 125% and
  // lowered it 80 px. Undo that transform in source-image coordinates.
  const sourceX = Math.round(x * 1.25);
  const sourceY = Math.round(y * 1.25 + 80);
  if (sourceX < 0 || sourceX >= width || sourceY < 0 || sourceY >= height) return 0;
  return mask[(sourceY * width + sourceX) * 4 + 3];
}

function normalizeAlpha(value) {
  // Imagegen's "opaque" interiors are usually 250–254, leaving a translucent
  // duplicate in the stationary sky/ocean when the foreground moves.
  if (value <= 8) return 0;
  if (value >= 240) return 1;
  return (value - 8) / 232;
}

async function main() {
  const [original, background, island, ship] = await Promise.all([
    pixels(source), pixels(empty), pixels(islandMask), pixels(shipMask),
  ]);
  const planes = Object.fromEntries(['sky', 'ocean', 'island', 'ship'].map(name => [name, Buffer.alloc(width * height * 4)]));

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const offset = (y * width + x) * 4;
      const foreground = normalizeAlpha(ship[offset + 3]);
      const land = normalizeAlpha(islandAlpha(island, x, y));
      const openScene = (1 - foreground) * (1 - land);
      const sea = Math.max(0, Math.min(1, (y - 396) / 24));
      const alpha = {
        sky: Math.round(openScene * (1 - sea) * 255),
        ocean: Math.round(openScene * sea * 255),
        island: Math.round(land * 255),
        ship: Math.round(foreground * 255),
      };
      for (const [name, plane] of Object.entries(planes)) {
        const opacity = alpha[name];
        plane[offset] = opacity ? original[offset] : 0;
        plane[offset + 1] = opacity ? original[offset + 1] : 0;
        plane[offset + 2] = opacity ? original[offset + 2] : 0;
        plane[offset + 3] = opacity;
      }
    }
  }

  const options = { raw: { width, height, channels: 4 } };
  await Promise.all(Object.entries(planes).map(([name, plane]) =>
    sharp(plane, options).png({ compressionLevel: 9, palette: false }).toFile(path.join(__dirname, `a4-${name}.png`))
  ));

  // Diagnostic still at zero parallax; compare to the source before shipping.
  await sharp(background, options)
    .composite(['sky', 'ocean', 'island', 'ship'].map(name => ({
      input: path.join(__dirname, `a4-${name}.png`), left: 0, top: 0,
    })))
    .png({ compressionLevel: 9 })
    .toFile('/tmp/Codex-screenshot-a4-reconstruction.png');
}

main().catch(error => { console.error(error); process.exitCode = 1; });
