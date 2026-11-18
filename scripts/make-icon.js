/**
 * Draws the app icon (the mascot "Cell" on a plain background) and writes it as PNG files:
 *
 *   node scripts/make-icon.js
 *
 * Everything is drawn from shapes in code, the same way the mascot is drawn in the app,
 * so there is no artwork from anywhere else and the icon can be retuned by changing numbers.
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const ACCENT = [47, 91, 234];
const ACCENT_DEEP = [30, 63, 184];
const PAPER = [246, 244, 239];
const WHITE = [255, 255, 255];

/** True if the point is inside a rounded rectangle centred on (cx, cy). */
const inRounded = (x, y, cx, cy, half, r) => {
  const dx = Math.max(Math.abs(x - cx) - (half - r), 0);
  const dy = Math.max(Math.abs(y - cy) - (half - r), 0);
  return dx * dx + dy * dy <= r * r;
};
const inCircle = (x, y, cx, cy, r) => (x - cx) ** 2 + (y - cy) ** 2 <= r * r;

/**
 * The colour of one point of the icon, in a 0..1 square. `bleed` is how much of the
 * square the mascot fills: less for Android's adaptive icon, which crops the edges.
 */
function colourAt(x, y, scale, background) {
  const u = (x - 0.5) / scale + 0.5;
  const v = (y - 0.5) / scale + 0.5;
  // The little selection handle on the corner, as on a selected spreadsheet cell.
  if (inRounded(u, v, 0.79, 0.79, 0.062, 0.014)) return ACCENT_DEEP;
  if (inRounded(u, v, 0.79, 0.79, 0.085, 0.022)) return WHITE;
  // The body: one rounded cell, with a darker rim.
  if (inRounded(u, v, 0.5, 0.5, 0.31, 0.085)) {
    if (!inRounded(u, v, 0.5, 0.5, 0.287, 0.066)) return ACCENT_DEEP;
    // Two happy eyes: arches, made from a ring cut off below its middle.
    for (const ex of [0.405, 0.595]) {
      if (v < 0.455 && inCircle(u, v, ex, 0.455, 0.052) && !inCircle(u, v, ex, 0.455, 0.027)) return WHITE;
    }
    // A wide smile: the lower half of a circle.
    if (v > 0.535 && inCircle(u, v, 0.5, 0.535, 0.1)) return WHITE;
    return ACCENT;
  }
  return background;
}

function render(size, scale, background) {
  const SAMPLES = 3;
  const pixels = Buffer.alloc(size * size * 4);
  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;
      for (let sy = 0; sy < SAMPLES; sy++) {
        for (let sx = 0; sx < SAMPLES; sx++) {
          const colour = colourAt((px + (sx + 0.5) / SAMPLES) / size, (py + (sy + 0.5) / SAMPLES) / size, scale, background);
          if (colour) {
            r += colour[0];
            g += colour[1];
            b += colour[2];
            a += 255;
          }
        }
      }
      const n = SAMPLES * SAMPLES;
      const covered = a / 255 || 1;
      const at = (py * size + px) * 4;
      pixels[at] = Math.round(r / covered);
      pixels[at + 1] = Math.round(g / covered);
      pixels[at + 2] = Math.round(b / covered);
      pixels[at + 3] = Math.round(a / n);
    }
  }
  return pixels;
}

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (buf) => {
  let c = 0xffffffff;
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};

function chunk(type, data) {
  const head = Buffer.alloc(8);
  head.writeUInt32BE(data.length, 0);
  head.write(type, 4, 'ascii');
  const tail = Buffer.alloc(4);
  tail.writeUInt32BE(crc32(Buffer.concat([head.subarray(4), data])), 0);
  return Buffer.concat([head, data, tail]);
}

function png(size, pixels) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8; // bits per channel
  header[9] = 6; // red, green, blue, alpha
  const rows = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) pixels.copy(rows, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', zlib.deflateSync(rows, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const root = path.join(__dirname, '..');
const files = [
  // iPhone, and the general-purpose icon: the mascot fills most of the square.
  { name: 'icon.png', size: 1024, scale: 1.15, background: PAPER },
  // Android crops the outer third of this one into a circle or squircle, so the mascot is smaller.
  { name: 'adaptive-icon.png', size: 1024, scale: 0.78, background: null },
  { name: 'splash-icon.png', size: 512, scale: 1.05, background: null },
  { name: 'favicon.png', size: 64, scale: 1.3, background: null },
  // The web version, added to an iPhone's Home Screen. Served as it is, so it lives in public/.
  { folder: 'public', name: 'apple-touch-icon.png', size: 180, scale: 1.15, background: PAPER },
];
for (const file of files) {
  const dir = path.join(root, file.folder ?? 'assets');
  fs.mkdirSync(dir, { recursive: true });
  const data = png(file.size, render(file.size, file.scale, file.background));
  fs.writeFileSync(path.join(dir, file.name), data);
  console.log(`${file.folder ?? 'assets'}/${file.name}  ${file.size}px  ${data.length} bytes`);
}
