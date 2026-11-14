import { deflateSync } from 'node:zlib';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const check = process.argv.includes('--check');
const scale = 4;

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data = Buffer.alloc(0)) {
  const name = Buffer.from(type, 'ascii');
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(Buffer.concat([name, data])));
  return Buffer.concat([length, name, data, checksum]);
}

function encodePng(width, height, rgba) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 6;
  const scanlines = Buffer.alloc(height * (1 + width * 4));
  for (let row = 0; row < height; row += 1) {
    const offset = row * (1 + width * 4);
    scanlines[offset] = 0;
    rgba.copy(scanlines, offset + 1, row * width * 4, (row + 1) * width * 4);
  }
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(scanlines, { level: 9 })),
    chunk('IEND')
  ]);
}

function pointInPolygon(x, y, points) {
  let inside = false;
  for (let current = 0, previous = points.length - 1; current < points.length; previous = current, current += 1) {
    const [currentX, currentY] = points[current];
    const [previousX, previousY] = points[previous];
    if ((currentY > y) !== (previousY > y)
      && x < ((previousX - currentX) * (y - currentY)) / (previousY - currentY) + currentX) {
      inside = !inside;
    }
  }
  return inside;
}

function inZ(x, y, size) {
  const left = size * 0.23;
  const right = size * 0.77;
  const top = size * 0.22;
  const bottom = size * 0.78;
  const bar = size * 0.14;
  if (x >= left && x <= right && ((y >= top && y <= top + bar) || (y >= bottom - bar && y <= bottom))) {
    return true;
  }
  return pointInPolygon(x, y, [
    [right - bar * 0.15, top + bar * 0.7],
    [right, top + bar],
    [left + bar * 0.15, bottom - bar * 0.7],
    [left, bottom - bar]
  ]);
}

function renderIcon(size, background) {
  const highSize = size * scale;
  const high = Buffer.alloc(highSize * highSize * 4);
  for (let y = 0; y < highSize; y += 1) {
    for (let x = 0; x < highSize; x += 1) {
      const offset = (y * highSize + x) * 4;
      const logo = inZ((x + 0.5) / scale, (y + 0.5) / scale, size);
      high[offset] = logo ? 255 : background[0];
      high[offset + 1] = logo ? 255 : background[1];
      high[offset + 2] = logo ? 255 : background[2];
      high[offset + 3] = logo ? 255 : background[3];
    }
  }

  const output = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const totals = [0, 0, 0, 0];
      for (let sampleY = 0; sampleY < scale; sampleY += 1) {
        for (let sampleX = 0; sampleX < scale; sampleX += 1) {
          const offset = (((y * scale + sampleY) * highSize) + x * scale + sampleX) * 4;
          for (let channel = 0; channel < 4; channel += 1) totals[channel] += high[offset + channel];
        }
      }
      const outputOffset = (y * size + x) * 4;
      for (let channel = 0; channel < 4; channel += 1) output[outputOffset + channel] = Math.round(totals[channel] / (scale * scale));
    }
  }
  return encodePng(size, size, output);
}

const assets = [
  { path: 'copilot/color.png', content: renderIcon(192, [7, 95, 206, 255]) },
  { path: 'copilot/outline.png', content: renderIcon(32, [0, 0, 0, 0]) }
];

const stale = assets.filter((asset) => {
  const path = resolve(root, asset.path);
  return !existsSync(path) || !readFileSync(path).equals(asset.content);
});

if (check) {
  if (stale.length) {
    console.error(`Agent icon assets are stale: ${stale.map((asset) => asset.path).join(', ')}`);
    process.exit(1);
  }
  console.log('Validated Zava One agent icons (192px color / 32px outline).');
} else {
  stale.forEach((asset) => writeFileSync(resolve(root, asset.path), asset.content));
  console.log(`Generated ${assets.length} Zava One agent icons.`);
}