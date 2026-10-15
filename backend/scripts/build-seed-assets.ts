/**
 * DEVELOPER TOOL (not needed on the server): regenerates backend/prisma/seed-assets/ from the original
 * images in the old static site (reference/). The result (WebP + SVG) is committed to git, so a fresh clone
 * or the server can seed without reference/.
 *
 *   npm run seed:build-assets          (from backend/)
 */
import * as fs from 'fs';
import * as path from 'path';
import { processImage } from '../src/common/image-processor';

const src = path.resolve(__dirname, '..', '..', 'reference', 'acrinnovative-static', 'img');
const out = path.resolve(__dirname, '..', 'prisma', 'seed-assets');

// [source file, output base name, max width]
const rasters: [string, string, number][] = [
  ['banner111.png', 'banner111', 1920],
  ['banner2.jpg', 'banner2', 1920],
  ['banner33.png', 'banner33', 1920],
  ['in-acr-about.jpg', 'in-acr-about', 1920],
  ['in-acr-careers.jpg', 'in-acr-careers', 1920],
  ['in-acr-home-about.jpg', 'in-acr-home-about', 1920],
  ['in-acr-insight-1.jpg', 'in-acr-insight-1', 1920],
  ['in-acr-insight-2.jpg', 'in-acr-insight-2', 1920],
  ['in-acr-insight-3.jpg', 'in-acr-insight-3', 1920],
  ['ACR-Logo.png', 'ACR-Logo', 256], // header logo: shown at 44px
  ['ACR-Logo.png', 'ACR-Logo-icon', 512], // favicon source (square, transparent corners)
];
const svgs = ['footer-logo-3WIDIh.svg', 'in-wave-icon-1.svg', 'in-wave-icon-2.svg', 'in-wave-icon-3.svg', 'in-wave-icon-4.svg'];

async function main() {
  if (!fs.existsSync(src)) throw new Error(`Original images not found at ${src}`);
  fs.mkdirSync(out, { recursive: true });
  for (const [file, base, maxWidth] of rasters) {
    const img = await processImage(fs.readFileSync(path.join(src, file)), file, { maxWidth });
    if (!img.optimized) throw new Error(`sharp is required to build seed assets (${file})`);
    fs.writeFileSync(path.join(out, `${base}${img.ext}`), img.buffer);
    console.log(`${base}${img.ext}  ${img.width}x${img.height}  ${(img.buffer.length / 1024).toFixed(0)} KB`);
  }
  for (const f of svgs) fs.copyFileSync(path.join(src, f), path.join(out, f));
  console.log(`Wrote ${rasters.length} WebP + ${svgs.length} SVG files to ${out}`);
}
main().catch((e) => { console.error(e.message || e); process.exit(1); });
