const path = require('node:path');
const { chromium } = require('C:/Users/freecar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  const page = await browser.newPage({ viewport: { width: 2400, height: 2000 }, deviceScaleFactor: 1 });
  for (let number = 1; number <= 47; number += 1) {
    const code = String(number).padStart(2, '0');
    const source = path.resolve(`assets/maps/overlays/${code}.svg`).replaceAll('\\', '/');
    await page.goto(`file:///${source}`);
    await page.evaluate(() => {
      const svg = document.documentElement;
      svg.setAttribute('width', '2400');
      svg.setAttribute('height', '2000');
      svg.style.display = 'block';
      svg.style.background = 'transparent';
    });
    await page.screenshot({ path: `assets/maps/overlays/${code}.png`, omitBackground: true });
  }
  await browser.close();
  console.log('Rendered 47 official-data overlays at 2400 x 2000.');
})().catch((error) => { console.error(error); process.exit(1); });
