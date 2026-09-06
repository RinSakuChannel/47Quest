import { createWriteStream } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { once } from 'node:events';

const files = [
  'assets/maps/regions/N03-20240101_01.geojson',
  'assets/maps/regions/N03-20240101_52_prefecture.geojson',
  'assets/maps/regions/N03-20240101_53_prefecture.geojson',
  'assets/maps/regions/N03-20240101_54_prefecture.geojson',
  'assets/maps/regions/N03-20240101_55_prefecture.geojson',
  'assets/maps/regions/N03-20240101_56_prefecture.geojson',
  'assets/maps/regions/N03-20240101_57_prefecture.geojson',
  'assets/maps/regions/N03-20240101_58_prefecture.geojson',
  'assets/maps/regions/N03-20240101_59_prefecture.geojson',
  'assets/maps/selected/N03-20240101_47.geojson',
];

const output = 'assets/maps/japan-prefectures.svg';
const overlayDirectory = 'assets/maps/overlays';
const width = 1200;
const height = 1000;
const padding = 24;
const bounds = { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity };
const landColors = ['#f6ce63', '#79d2b0', '#f4a38f', '#8fc8ee', '#d6b3e8', '#b8d77a', '#f1b56f', '#76c9cf'];

const mercator = ([longitude, latitude]) => {
  const x = longitude * Math.PI / 180;
  const clamped = Math.max(-85, Math.min(85, latitude));
  const y = Math.log(Math.tan(Math.PI / 4 + clamped * Math.PI / 360));
  return [x, y];
};

const walk = (coordinates, visit) => {
  if (typeof coordinates[0] === 'number') {
    visit(coordinates);
    return;
  }
  coordinates.forEach((child) => walk(child, visit));
};

for (const file of files) {
  const geojson = JSON.parse(await readFile(file, 'utf8'));
  geojson.features.forEach((feature) => walk(feature.geometry.coordinates, (coordinate) => {
    const [x, y] = mercator(coordinate);
    bounds.minX = Math.min(bounds.minX, x);
    bounds.maxX = Math.max(bounds.maxX, x);
    bounds.minY = Math.min(bounds.minY, y);
    bounds.maxY = Math.max(bounds.maxY, y);
  }));
}

const sourceWidth = bounds.maxX - bounds.minX;
const sourceHeight = bounds.maxY - bounds.minY;
const scale = Math.min((width - padding * 2) / sourceWidth, (height - padding * 2) / sourceHeight);
const offsetX = (width - sourceWidth * scale) / 2;
const offsetY = (height - sourceHeight * scale) / 2;

const project = (coordinate) => {
  const [x, y] = mercator(coordinate);
  return [offsetX + (x - bounds.minX) * scale, height - (offsetY + (y - bounds.minY) * scale)];
};

const pathFor = (coordinates) => {
  if (typeof coordinates[0][0] === 'number') {
    return `${coordinates.map((coordinate, index) => {
      const [x, y] = project(coordinate);
      return `${index ? 'L' : 'M'}${x.toFixed(2)} ${y.toFixed(2)}`;
    }).join('')}Z`;
  }
  return coordinates.map(pathFor).join('');
};

const largestRing = (coordinates, rings = []) => {
  if (typeof coordinates[0]?.[0] === 'number') {
    rings.push(coordinates);
    return rings;
  }
  coordinates.forEach((child) => largestRing(child, rings));
  return rings;
};

const ringAreaAndCenter = (ring) => {
  let areaTwice = 0;
  let centerX = 0;
  let centerY = 0;
  for (let index = 0; index < ring.length - 1; index += 1) {
    const [x1, y1] = project(ring[index]);
    const [x2, y2] = project(ring[index + 1]);
    const cross = x1 * y2 - x2 * y1;
    areaTwice += cross;
    centerX += (x1 + x2) * cross;
    centerY += (y1 + y2) * cross;
  }
  const area = areaTwice / 2;
  if (Math.abs(area) < .001) return { area: 0, x: 0, y: 0 };
  return { area: Math.abs(area), x: centerX / (3 * areaTwice), y: centerY / (3 * areaTwice) };
};

const stream = createWriteStream(output, { encoding: 'utf8' });
const writeTo = async (target, value) => {
  if (!target.write(value)) await once(target, 'drain');
};
const write = (value) => writeTo(stream, value);

await mkdir(overlayDirectory, { recursive: true });
const overlayStreams = new Map();
const centers = {};
const overlayFor = async (code, name) => {
  if (overlayStreams.has(code)) return overlayStreams.get(code);
  const target = createWriteStream(`${overlayDirectory}/${code}.svg`, { encoding: 'utf8' });
  overlayStreams.set(code, target);
  await writeTo(target, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="${name}"><g fill="#ff6255">`);
  return target;
};

await write(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="map-title map-desc"><title id="map-title">日本全国47都道府県地図</title><desc id="map-desc">国土交通省の行政区域データを同じ縮尺と投影で描いた日本地図。沖縄と島しょ部も実際の位置にあります。</desc><style>.ocean{fill:#dff5f7}.prefecture{stroke:none}.prefecture:target{fill:#ff6255!important}.north,.source{fill:#37637a;font-family:sans-serif}.north{font-size:24px;font-weight:800}.north-arrow{fill:none;stroke:#37637a;stroke-width:5;stroke-linecap:round;stroke-linejoin:round}.source{font-size:14px}</style><rect class="ocean" width="1200" height="1000" rx="32"/><g class="prefectures" filter="drop-shadow(0 3px 2px rgba(55,99,122,.22))">`);

let openCode = null;
for (const file of files) {
  const geojson = JSON.parse(await readFile(file, 'utf8'));
  for (const feature of geojson.features) {
    const name = feature.properties.N03_001;
    const code = String(feature.properties.N03_007 || '').slice(0, 2);
    if (code !== openCode) {
      if (openCode !== null) await write('</g>');
      const fill = landColors[(Number(code) - 1) % landColors.length];
      await write(`<g id="p${code}" class="prefecture" data-code="${code}" data-name="${name}" style="fill:${fill}" tabindex="0" role="button" aria-label="${name}"><title>${name}</title>`);
      openCode = code;
    }
    const path = pathFor(feature.geometry.coordinates);
    await write(`<path d="${path}"/>`);
    const overlay = await overlayFor(code, name);
    await writeTo(overlay, `<path d="${path}"/>`);
    for (const ring of largestRing(feature.geometry.coordinates)) {
      const candidate = ringAreaAndCenter(ring);
      if (!centers[code] || candidate.area > centers[code].area) centers[code] = { ...candidate, name };
    }
  }
}
if (openCode !== null) await write('</g>');
await write('</g><text class="north" x="1137" y="66">N</text><path class="north-arrow" d="M1142 78v54m0-54-11 22m11-22 11 22"/><text class="source" x="24" y="980">国土数値情報（行政区域データ・2024年）国土交通省 / 加工: 47Quest</text></svg>');
stream.end();
await once(stream, 'finish');

for (const target of overlayStreams.values()) {
  await writeTo(target, '</g></svg>');
  target.end();
}
await Promise.all([...overlayStreams.values()].map((target) => once(target, 'finish')));
const mapPoints = Object.fromEntries(Object.entries(centers).map(([code, center]) => [code, {
  x: Number((center.x / width * 100).toFixed(3)),
  y: Number((center.y / height * 100).toFixed(3)),
}]));
await writeFile('src/map-points.js', `window.PREFECTURE_MAP_POINTS = ${JSON.stringify(mapPoints, null, 2)};\n`, 'utf8');
await writeFile('assets/maps/map-points-official.json', `${JSON.stringify(mapPoints, null, 2)}\n`, 'utf8');

console.log(`Created ${output}, 47 exact overlays, and map points without coordinate simplification.`);
