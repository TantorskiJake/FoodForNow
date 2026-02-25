#!/usr/bin/env node
/**
 * Generates 32x32 and 192x192 favicon sizes from the main logo.
 * "Cover" resize makes the logo fill the square so it appears bigger in the tab.
 */
import sharp from 'sharp';
import { readFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const publicDir = join(root, 'public');
const src = join(root, 'public', 'icon.png');

if (!existsSync(src)) {
  console.error('public/icon.png not found. Run after copying the logo to public/icon.png.');
  process.exit(1);
}

const sizes = [32, 192];

await Promise.all(
  sizes.map((size) =>
    sharp(src)
      .resize(size, size, { fit: 'cover', position: 'center' })
      .png()
      .toFile(join(publicDir, `icon-${size}.png`))
  )
);

console.log('Generated icon-32.png and icon-192.png');
