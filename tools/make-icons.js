const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function crc32(buf) {
  const table = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const t = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([t, data])), 0);
  return Buffer.concat([len, t, data, crc]);
}

function encodePng(w, h, rgba) {
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w * 4 + 1)] = 0;
    rgba.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

function renderIcon(size) {
  const SS = 3;
  const S = size * SS;
  const src = new Float32Array(S * S * 4);
  const r = S * 0.225;
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const i = (y * S + x) * 4;
      const cx = Math.min(Math.max(x, r), S - r);
      const cy = Math.min(Math.max(y, r), S - r);
      const dx = x - cx;
      const dy = y - cy;
      if (dx * dx + dy * dy > r * r) { src[i + 3] = 0; continue; }
      const t = (x + y) / (2 * S);
      let cr = 79 + (124 - 79) * t;
      let cg = 110 + (92 - 110) * t;
      let cb = 247 + (255 - 247) * t;
      const inT = (x >= 0.29 * S && x <= 0.71 * S && y >= 0.30 * S && y <= 0.40 * S) ||
                  (x >= 0.45 * S && x <= 0.55 * S && y >= 0.30 * S && y <= 0.74 * S);
      if (inT) { cr = cg = cb = 255; }
      src[i] = cr; src[i + 1] = cg; src[i + 2] = cb; src[i + 3] = 255;
    }
  }
  const out = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let rs = 0, gs = 0, bs = 0, as = 0;
      for (let dy = 0; dy < SS; dy++) {
        for (let dx = 0; dx < SS; dx++) {
          const i = ((y * SS + dy) * S + (x * SS + dx)) * 4;
          const a = src[i + 3] / 255;
          rs += src[i] * a;
          gs += src[i + 1] * a;
          bs += src[i + 2] * a;
          as += src[i + 3];
        }
      }
      const o = (y * size + x) * 4;
      if (as > 0) {
        out[o] = Math.round(rs * 255 / as);
        out[o + 1] = Math.round(gs * 255 / as);
        out[o + 2] = Math.round(bs * 255 / as);
      }
      out[o + 3] = Math.round(as / (SS * SS));
    }
  }
  return encodePng(size, size, out);
}

const dir = path.join(__dirname, '..', 'public', 'icons');
fs.mkdirSync(dir, { recursive: true });
for (const size of [180, 192, 512]) {
  fs.writeFileSync(path.join(dir, `icon-${size}.png`), renderIcon(size));
  console.log(`icon-${size}.png ok`);
}
