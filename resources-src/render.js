// node render.js  → γράφει τα PNG στο ../assets (χρειάζεται puppeteer)
const path = require('path'), fs = require('fs');
const puppeteer = require(process.env.PUPPETEER || 'puppeteer');
const { files } = require('./art');
(async () => {
  const out = path.join(__dirname, '..', 'assets'); fs.mkdirSync(out, { recursive: true });
  const b = await puppeteer.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
  const p = await b.newPage();
  const all = { ...files, 'splash-dark.png': files['splash.png'] };
  for (const [name, s] of Object.entries(all)) {
    const [, w, h] = s.match(/width="(\d+)" height="(\d+)"/);
    await p.setViewport({ width: +w, height: +h });
    await p.setContent(`<html><body style="margin:0;background:transparent">${s}</body></html>`);
    await p.screenshot({ path: path.join(out, name), omitBackground: true, clip: { x: 0, y: 0, width: +w, height: +h } });
    console.log('wrote', name);
  }
  await b.close();
})();
