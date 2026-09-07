const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const sharp = require('sharp');

const root = path.resolve(__dirname, '..');
const sources = [
  'Dev/Dev Code/iFare_Frontend',
  'Prd/Prd Code/iFare_Frontend',
].map((source) => path.join(root, source));
const filename = 'og-logo-safe-20260903.png';
const background = { r: 255, g: 250, b: 247, alpha: 1 };

async function main() {
  const logos = await Promise.all(sources.map((source) =>
    fs.readFile(path.join(source, 'assets/img/Mobile-Menu-Logo.svg'))
  ));
  assert.ok(logos[0].equals(logos[1]), 'DEV and PRD must use the same approved logo');

  // Rasterize the original paths without redrawing the mark or its lettering.
  const logo = await sharp(logos[0], { density: 576 })
    .resize({ width: 560 })
    .png()
    .toBuffer();
  const png = await sharp({ create: { width: 1200, height: 630, channels: 4, background } })
    .composite([{ input: logo, gravity: 'centre' }])
    .png()
    .toBuffer();
  const { data, info } = await sharp(png).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  let minX = info.width, minY = info.height, maxX = -1, maxY = -1;
  for (let y = 0; y < info.height; y += 1) {
    for (let x = 0; x < info.width; x += 1) {
      const i = (y * info.width + x) * info.channels;
      if (Math.max(Math.abs(data[i] - 255), Math.abs(data[i + 1] - 250), Math.abs(data[i + 2] - 247)) > 16) {
        minX = Math.min(minX, x); maxX = Math.max(maxX, x);
        minY = Math.min(minY, y); maxY = Math.max(maxY, y);
      }
    }
  }
  assert.ok(maxX > minX && maxY > minY, 'Logo must not be blank');
  assert.ok(minX >= 320 && maxX < 880, 'Logo must fit the centered square with 35px side padding');
  assert.ok(minY >= 35 && maxY < 595, 'Logo must have vertical crop padding');

  for (const source of sources) {
    await fs.writeFile(path.join(source, 'public', filename), png);
  }
  const previewDir = path.join(root, 'docs/og-preview');
  await fs.mkdir(previewDir, { recursive: true });
  await fs.writeFile(path.join(previewDir, filename), png);
  await sharp(png).extract({ left: 285, top: 0, width: 630, height: 630 })
    .toFile(path.join(previewDir, 'og-logo-mobile-square-preview.png'));
  console.log(JSON.stringify({ filename, width: info.width, height: info.height, bytes: png.length,
    logoBounds: { minX, minY, maxX, maxY }, centeredSquareCrop: 'PASS', outputs: sources }, null, 2));
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
