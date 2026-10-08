// Φτιάχνει από τα 3 πρωτότυπα (resources-src/originals) όλα τα γραφικά:
//   assets/   → πηγές για το @capacitor/assets (εικονίδιο + οθόνη έναρξης Android)
//   public/icons/ → εικονίδια για το web
//   store/    → γραφικά για το Google Play (εικονίδιο 512, graphic 1024x500)
const sharp = require('sharp'), path = require('path'), fs = require('fs');
const root = path.join(__dirname, '..'), orig = (f) => path.join(__dirname, 'originals', f);
const out = (...p) => path.join(root, ...p);
const TOP = '#016aa9', BOTTOM = '#08c1e7';
const FONT = 'DejaVu Sans, Arial, sans-serif';

(async () => {
  for (const d of ['assets', 'store', 'public/icons']) fs.mkdirSync(out(d), { recursive: true });

  // 1) Εικονίδιο
  const icon = await sharp(orig('icon.png')).resize(1024, 1024).png().toBuffer();
  await sharp(icon).toFile(out('assets/icon-only.png'));
  await sharp(icon).toFile(out('assets/icon-foreground.png'));
  // φόντο του adaptive icon: το ίδιο σχέδιο, πολύ θολό, ώστε να δένει με τις άκρες
  await sharp(icon).resize(1024, 1024).blur(60).modulate({ brightness: 0.98 }).png().toFile(out('assets/icon-background.png'));
  await sharp(icon).resize(512, 512).png().toFile(out('store/icon-512.png'));
  for (const [n, s] of [['icon-192.png', 192], ['icon-512.png', 512], ['apple-touch-icon.png', 180], ['favicon-32.png', 32]])
    await sharp(icon).resize(s, s).png().toFile(out('public/icons', n));
  const mask = Buffer.from('<svg width="64" height="64"><rect width="64" height="64" rx="14"/></svg>');
  await sharp(icon).resize(64, 64).composite([{ input: mask, blend: 'dest-in' }]).png().toFile(out('public/icons/favicon-64.png'));

  // 2) Οθόνη έναρξης (τετράγωνη· το εργαλείο την κόβει σε κάθετη/οριζόντια)
  const N = 2732, L = 820, r = 190;
  const bg = Buffer.from(`<svg width="${N}" height="${N}"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${TOP}"/><stop offset="1" stop-color="${BOTTOM}"/></linearGradient></defs>
    <rect width="${N}" height="${N}" fill="url(#g)"/></svg>`);
  const rounded = await sharp(icon).resize(L, L)
    .composite([{ input: Buffer.from(`<svg width="${L}" height="${L}"><rect width="${L}" height="${L}" rx="${r}"/></svg>`), blend: 'dest-in' }]).png().toBuffer();
  const title = Buffer.from(`<svg width="${N}" height="400"><text x="${N / 2}" y="170" text-anchor="middle" font-family="${FONT}" font-weight="bold" font-size="190" fill="#fff" letter-spacing="4">LesvosGo</text></svg>`);
  const lx = (N - L) / 2, ly = 790;
  await sharp(bg).composite([
    { input: rounded, left: lx, top: ly },
    { input: title, left: 0, top: ly + L + 60 },
  ]).png().toFile(out('assets/splash.png'));
  fs.copyFileSync(out('assets/splash.png'), out('assets/splash-dark.png'));

  // 3) Feature graphic 1024x500 για το Google Play (με τίτλο στην ήσυχη αριστερή πλευρά)
  const W = 1024, H = 500;
  const feat = await sharp(orig('feature.png')).resize(W, H, { fit: 'cover' }).toBuffer();
  const txt = Buffer.from(`<svg width="${W}" height="${H}">
    <defs><filter id="s" x="-10%" y="-10%" width="120%" height="140%"><feDropShadow dx="0" dy="3" stdDeviation="5" flood-color="#00203a" flood-opacity=".55"/></filter></defs>
    <g filter="url(#s)" font-family="${FONT}" fill="#fff">
      <text x="60" y="235" font-size="92" font-weight="bold" letter-spacing="1">LesvosGo</text>
      <text x="64" y="292" font-size="32" fill="#e8f7ff">Find the calmest beach on Lesvos</text>
    </g></svg>`);
  await sharp(feat).composite([{ input: txt }]).png().toFile(out('store/feature-graphic-1024x500.png'));
  console.log('ok');
})();
