import * as path from 'path';
import type SharpFn from 'sharp';

/**
 * Shared image pipeline, used by the content seed and (phase c) admin uploads:
 * resize large images, convert JPG/PNG to WebP. Uploads and seeding must behave the same.
 *
 * sharp is a native module and could fail to load on the host. We load it lazily inside try/catch;
 * if it is unavailable we store the ORIGINAL file untouched (no resize) and log a warning, so uploads
 * keep working instead of crashing the app.
 */
type Sharp = typeof SharpFn;
let sharpModule: Sharp | null | undefined; // undefined = not tried yet, null = unavailable

export function loadSharp(): Sharp | null {
  if (sharpModule !== undefined) return sharpModule;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const m = require('sharp');
    sharpModule = (m.default ?? m) as Sharp;
  } catch (e) {
    console.warn(`[images] sharp could not be loaded, images will be stored without resizing: ${(e as Error).message}`);
    sharpModule = null;
  }
  return sharpModule;
}

export type ProcessedImage = {
  buffer: Buffer;
  /** File extension including the dot, e.g. ".webp". */
  ext: string;
  mimeType: string;
  width: number | null;
  height: number | null;
  /** false when the original was kept as-is (sharp unavailable, or a format we don't convert). */
  optimized: boolean;
};

export type ProcessOptions = {
  /** Longest allowed width in px (never enlarges). Default 1920. */
  maxWidth?: number;
  /** WebP quality 1-100. Default 80. */
  quality?: number;
};

const MIME_BY_EXT: Record<string, string> = {
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp',
  '.svg': 'image/svg+xml', '.gif': 'image/gif', '.ico': 'image/x-icon',
};
const CONVERTIBLE = new Set(['.jpg', '.jpeg', '.png', '.webp']);

export function mimeFromExt(ext: string): string {
  return MIME_BY_EXT[ext.toLowerCase()] || 'application/octet-stream';
}

/**
 * @param originalName used only to find the original extension (e.g. "banner.png")
 */
export async function processImage(input: Buffer, originalName: string, opts: ProcessOptions = {}): Promise<ProcessedImage> {
  const origExt = path.extname(originalName).toLowerCase();
  const keepOriginal = (): ProcessedImage => ({
    buffer: input, ext: origExt, mimeType: mimeFromExt(origExt), width: null, height: null, optimized: false,
  });

  // SVG / GIF / ICO are kept as they are (vector or tiny).
  if (!CONVERTIBLE.has(origExt)) return keepOriginal();

  const sharp = loadSharp();
  if (!sharp) return keepOriginal();

  try {
    const { data, info } = await sharp(input)
      .rotate() // honour EXIF orientation
      .resize({ width: opts.maxWidth ?? 1920, withoutEnlargement: true })
      .webp({ quality: opts.quality ?? 80 })
      .toBuffer({ resolveWithObject: true });
    return { buffer: data, ext: '.webp', mimeType: 'image/webp', width: info.width, height: info.height, optimized: true };
  } catch (e) {
    console.warn(`[images] could not process ${originalName}, storing original: ${(e as Error).message}`);
    return keepOriginal();
  }
}
