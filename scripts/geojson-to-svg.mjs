import { mkdir, readFile, writeFile } from 'node:fs/promises';

const root = 'assets/maps/selected';
const configs = [
  ['02', '青森県'],
  ['37', '香川県'],
  ['47', '沖縄県'],
];
const size = { width: 640, height: 330, padding: 14 };

const walk = (coords, visit) => {
  if (typeof coords[0] === 'number') return visit(coords);
  coords.forEach((child) => walk(child, visit));
};
const pathFor = (coords, project) => {
  if (typeof coords[0][0] === 'number') {
    return `${coords.map((point, i) => {
      const [x, y] = project(point);
      return `${i ? 'L' : 'M'}${x.toFixed(3)} ${y.toFixed(3)}`;
    }).join(' ')} Z`;
  }
  return coords.map((child) => pathFor(child, project)).join(' ');
};

await mkdir(`${root}/svg`, { recursive: true });
for (const [code, name] of configs) {
  const geo = JSON.parse(await readFile(`${root}/N03-20240101_${code}.geojson`, 'utf8'));
  const points = [];
  geo.features.forEach((feature) => walk(feature.geometry.coordinates, (point) => points.push(point)));
  const xs = points.map((point) => point[0]);
  const ys = points.map((point) => point[1]);
  const minX = xs.reduce((min, value) => Math.min(min, value), Infinity);
  const maxX = xs.reduce((max, value) => Math.max(max, value), -Infinity);
  const minY = ys.reduce((min, value) => Math.min(min, value), Infinity);
  const maxY = ys.reduce((max, value) => Math.max(max, value), -Infinity);
  const project = ([lon, lat]) => [
    size.padding + ((lon - minX) / (maxX - minX || 1)) * (size.width - size.padding * 2),
    size.padding + ((maxY - lat) / (maxY - minY || 1)) * (size.height - size.padding * 2),
  ];
  const paths = geo.features.map((feature) => `<path d="${pathFor(feature.geometry.coordinates, project)}"><title>${feature.properties.N03_004 || name}</title></path>`).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size.width} ${size.height}" role="img" aria-label="${name}の行政区域地図"><rect width="100%" height="100%" rx="18" fill="#e5f6ff"/><g fill="#a8dfa9" stroke="#277f73" stroke-width=".42" vector-effect="non-scaling-stroke" stroke-linejoin="round">${paths}</g></svg>`;
  await writeFile(`${root}/svg/${code}.svg`, svg);
}
