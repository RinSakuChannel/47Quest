const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const sharp = require('C:/Users/freecar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const { chromium } = require('C:/Users/freecar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

const root = path.resolve(__dirname, '..');
const output = process.env.QUEST_AUDIT_OUTPUT
  ? path.resolve(root, process.env.QUEST_AUDIT_OUTPUT)
  : path.join(root, '.verification', 'all-games');

const mime = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.svg':'image/svg+xml', '.png':'image/png', '.webp':'image/webp', '.wav':'audio/wav', '.json':'application/json' };
const server = http.createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, 'http://local').pathname);
  const requested = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
  const file = path.resolve(root, requested);
  if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    response.writeHead(404); response.end('not found'); return;
  }
  response.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');
  fs.createReadStream(file).pipe(response);
});

async function renderViewport(browser, name, viewport) {
  const directory = path.join(output, name);
  fs.mkdirSync(directory, { recursive:true });
  const context = await browser.newContext({ viewport, hasTouch:viewport.width < 900, isMobile:viewport.width < 600 });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('http://127.0.0.1:4178', { waitUntil:'networkidle' });
  const records = [];
  for (let number = 1; number <= 47; number++) {
    const code = String(number).padStart(2, '0');
    await page.evaluate(code => {
      const pref = PREFECTURES.find(item => item.code === code);
      state.sound = false; state.current = pref; state.round = [pref]; state.roundIndex = 0; state.replay = true;
      renderGame();
    }, code);
    await page.getByRole('button', { name:'スタート', exact:true }).click();
    await page.waitForSelector('.fg-world');
    await page.waitForTimeout(180);
    const canvas = page.locator('.rg-canvas');
    const beforeInput = await canvas.count() ? await canvas.evaluate(node => node.toDataURL()) : '';
    if (await canvas.count()) {
      const box = await canvas.boundingBox();
      await page.mouse.move(box.x + box.width * .5, box.y + box.height * .5);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width * .66, box.y + box.height * .38, { steps:3 });
      await page.mouse.up();
      await page.waitForTimeout(90);
    }
    const inputChanged = await canvas.count() ? beforeInput !== await canvas.evaluate(node => node.toDataURL()) : true;
    const board = page.locator('.game-board');
    const metrics = await board.evaluate(node => {
      const box = node.getBoundingClientRect();
      const canvas = node.querySelector('.rg-canvas');
      const canvasBox = canvas?.getBoundingClientRect();
      return {
        viewport:[innerWidth, innerHeight], board:[box.width, box.height],
        canvas:canvasBox ? [canvasBox.width, canvasBox.height] : null,
        pageScroll:[document.documentElement.scrollWidth-innerWidth, document.documentElement.scrollHeight-innerHeight],
        clipped:node.scrollWidth > node.clientWidth + 2 || node.scrollHeight > node.clientHeight + 2,
      };
    });
    const file = path.join(directory, `${code}.png`);
    await board.screenshot({ path:file });
    records.push({ code, inputChanged, ...metrics });
  }
  fs.writeFileSync(path.join(output, `${name}.json`), JSON.stringify({ errors, records }, null, 2));
  await context.close();
}

async function contactSheet(name, columns, cellWidth) {
  const files = Array.from({ length:47 }, (_, index) => path.join(output, name, `${String(index + 1).padStart(2, '0')}.png`));
  const cellHeight = Math.round(cellWidth * .67) + 28;
  const rows = Math.ceil(files.length / columns);
  const layers = [];
  for (let index = 0; index < files.length; index++) {
    const image = await sharp(files[index]).resize(cellWidth - 8, cellHeight - 32, { fit:'contain', background:'#edf5e5' }).png().toBuffer();
    const code = String(index + 1).padStart(2, '0');
    layers.push({ input:image, left:(index % columns) * cellWidth + 4, top:Math.floor(index / columns) * cellHeight });
    layers.push({ input:Buffer.from(`<svg width="${cellWidth}" height="28"><rect width="100%" height="100%" fill="#173e51"/><text x="50%" y="20" text-anchor="middle" font-family="sans-serif" font-weight="700" font-size="16" fill="white">${code}</text></svg>`), left:(index % columns) * cellWidth, top:Math.floor(index / columns) * cellHeight + cellHeight - 28 });
  }
  await sharp({ create:{ width:columns * cellWidth, height:rows * cellHeight, channels:3, background:'#edf5e5' } }).composite(layers).png().toFile(path.join(output, `${name}-contact-sheet.png`));
}

(async () => {
  fs.mkdirSync(output, { recursive:true });
  await new Promise(resolve => server.listen(4178, '127.0.0.1', resolve));
  const browser = await chromium.launch({ headless:true, executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  try {
    await renderViewport(browser, 'desktop', { width:1440, height:900 });
    await renderViewport(browser, 'phone-portrait', { width:390, height:844 });
    await renderViewport(browser, 'phone-landscape', { width:844, height:390 });
    await contactSheet('desktop', 4, 360);
    await contactSheet('phone-portrait', 4, 240);
    await contactSheet('phone-landscape', 4, 300);
    for (const name of ['desktop','phone-portrait','phone-landscape']) {
      const report = JSON.parse(fs.readFileSync(path.join(output, `${name}.json`), 'utf8'));
      if (report.errors.length) throw new Error(`${name}: browser errors: ${report.errors.join('; ')}`);
      for (const record of report.records) {
        if (record.pageScroll.some(value => value > 2)) throw new Error(`${name} ${record.code}: page scroll ${record.pageScroll}`);
        if (record.clipped) throw new Error(`${name} ${record.code}: game board content clipped`);
        if (!record.inputChanged) throw new Error(`${name} ${record.code}: no visual response to pointer input`);
        if (record.canvas && Math.abs(record.canvas[0] / record.canvas[1] - 5 / 3) > .02) throw new Error(`${name} ${record.code}: distorted game canvas`);
      }
    }
  } finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
  console.log('PASS: 141 individual game renders; no page scroll/clipping/distortion/browser errors, and every game responded visually to pointer input');
})().catch(error => { console.error(error); process.exit(1); });
