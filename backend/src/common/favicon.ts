import * as fs from 'fs';
import * as path from 'path';
import { loadSharp } from './image-processor';

/**
 * Generates the favicon set from one source image (the site logo or whatever the founder picked):
 *   favicon.ico (16 + 32), favicon-32x32.png, apple-touch-icon.png (180), icon-192.png, icon-512.png
 * Each icon is drawn on a SQUARE canvas with padding so the logo stays readable at small sizes.
 * The files are written to a folder outside the app (UPLOAD_DIR/_favicon) and served by FaviconController
 * at /favicon.ico, /apple-touch-icon.png, ... Called by the content seed and whenever settings.faviconId changes.
 */
export const FAVICON_FILES = ['favicon.ico', 'favicon-32x32.png', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png'];

const TRANSPARENT = { r: 0, g: 0, b: 0, alpha: 0 };
const WHITE = { r: 255, g: 255, b: 255, alpha: 1 };

/** @param padding fraction of the canvas left empty on each side (0.04 = 4%) */
async function squareIcon(sharp: NonNullable<ReturnType<typeof loadSharp>>, source: Buffer, size: number, padding: number, background = TRANSPARENT) {
  const inner = Math.max(1, Math.round(size * (1 - 2 * padding)));
  const logo = await sharp(source, { density: 300 })
    .resize(inner, inner, { fit: 'contain', background: TRANSPARENT })
    .png()
    .toBuffer();
  return sharp({ create: { width: size, height: size, channels: 4, background } })
    .composite([{ input: logo, gravity: 'centre' }])
    .png()
    .toBuffer();
}

/** Minimal ICO container holding PNG images (supported by all current browsers). */
function buildIco(images: { size: number; png: Buffer }[]): Buffer {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(images.length, 4);
  const entries = Buffer.alloc(16 * images.length);
  let offset = 6 + entries.length;
  images.forEach((img, i) => {
    const e = i * 16;
    entries.writeUInt8(img.size >= 256 ? 0 : img.size, e); // width
    entries.writeUInt8(img.size >= 256 ? 0 : img.size, e + 1); // height
    entries.writeUInt8(0, e + 2); // palette
    entries.writeUInt8(0, e + 3); // reserved
    entries.writeUInt16LE(1, e + 4); // colour planes
    entries.writeUInt16LE(32, e + 6); // bits per pixel
    entries.writeUInt32LE(img.png.length, e + 8);
    entries.writeUInt32LE(offset, e + 12);
    offset += img.png.length;
  });
  return Buffer.concat([header, entries, ...images.map((i) => i.png)]);
}

/** @returns true when the set was written, false when sharp is unavailable (the site then simply has no favicon links). */
export async function generateFaviconSet(source: Buffer, outDir: string): Promise<boolean> {
  const sharp = loadSharp();
  if (!sharp) return false;
  fs.mkdirSync(outDir, { recursive: true });

  // Tiny sizes get very little padding, otherwise the logo becomes unreadable.
  const p16 = await squareIcon(sharp, source, 16, 0.03);
  const p32 = await squareIcon(sharp, source, 32, 0.04);
  const files: Record<string, Buffer> = {
    'favicon.ico': buildIco([{ size: 16, png: p16 }, { size: 32, png: p32 }]),
    'favicon-32x32.png': p32,
    // iOS fills transparent areas with black, so the touch icon gets a white background.
    'apple-touch-icon.png': await squareIcon(sharp, source, 180, 0.1, WHITE),
    'icon-192.png': await squareIcon(sharp, source, 192, 0.08),
    'icon-512.png': await squareIcon(sharp, source, 512, 0.08),
  };
  for (const [name, data] of Object.entries(files)) fs.writeFileSync(path.join(outDir, name), data);
  return true;
}

export function removeFaviconSet(outDir: string) {
  for (const name of FAVICON_FILES) fs.rmSync(path.join(outDir, name), { force: true });
}
