import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ICONS_DIR = path.join(__dirname, '..', 'public', 'icons');
const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];

// Theme colors
const BG  = [0x0d, 0x0d, 0x1a]; // #0d0d1a
const FG  = [0x8b, 0x5c, 0xf6]; // #8b5cf6 (primary purple)
const FG2 = [0xf5, 0x9e, 0x0b]; // #f59e0b (gold accent)

function crc32(buf) {
  const table = [];
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = (c & 1) ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
    table[i] = c;
  }
  let crc = 0xFFFFFFFF;
  for (const b of buf) crc = table[(crc ^ b) & 0xFF] ^ (crc >>> 8);
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function pngChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf  = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length);
  const crcBuf  = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function generatePNG(size) {
  const sig = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8]  = 8; // bit depth
  ihdr[9]  = 2; // RGB
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

  const c  = size / 2;
  const s  = size;
  const rows = [];

  for (let y = 0; y < s; y++) {
    const row = [0]; // filter byte = None
    const ny = (y - c) / s;

    for (let x = 0; x < s; x++) {
      const nx = (x - c) / s;

      // Sword blade: thin vertical stripe, top 80%
      const blade  = Math.abs(nx) < 0.05 && ny > -0.44 && ny < 0.30;
      // Sword tip: triangle at top
      const tip    = Math.abs(nx) < (-ny - 0.30) * 0.6 && ny < -0.30 && ny > -0.44;
      // Crossguard: horizontal bar
      const guard  = Math.abs(nx) < 0.28 && Math.abs(ny - 0.05) < 0.045;
      // Handle
      const handle = Math.abs(nx) < 0.07 && ny > 0.12 && ny < 0.40;
      // Pommel: small rounded circle
      const pommel = (nx * nx + (ny - 0.43) * (ny - 0.43)) < 0.009;

      if (blade || tip || guard || handle || pommel) {
        row.push(FG[0], FG[1], FG[2]);
      } else {
        row.push(BG[0], BG[1], BG[2]);
      }
    }
    rows.push(Buffer.from(row));
  }

  const raw        = Buffer.concat(rows);
  const compressed = zlib.deflateSync(raw, { level: 9 });

  return Buffer.concat([
    sig,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', compressed),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

fs.mkdirSync(ICONS_DIR, { recursive: true });

for (const size of SIZES) {
  const buf  = generatePNG(size);
  const dest = path.join(ICONS_DIR, `icon-${size}x${size}.png`);
  fs.writeFileSync(dest, buf);
  console.log(`✓ icon-${size}x${size}.png  (${(buf.length / 1024).toFixed(1)} KB)`);
}

console.log(`\n✅ ${SIZES.length} ícones gerados em public/icons/`);
