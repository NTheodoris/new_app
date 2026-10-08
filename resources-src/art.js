// Πηγή του εικονιδίου και της οθόνης έναρξης (SVG). Το render.js τα κάνει PNG στο ../assets.
const BG1 = '#0a5f86', BG2 = '#18a5c6';
const wave = (y, x0, x1, amp = 26, n = 3) => {
  const w = (x1 - x0) / (n * 2);
  let d = `M${x0},${y}`;
  for (let i = 0; i < n * 2; i++) d += ` q${w / 2},${i % 2 ? amp : -amp} ${w},0`;
  return d;
};
// Ήλιος που δύει στη θάλασσα + τρία κύματα. Όλα μέσα στη «ζώνη ασφαλείας» (κεντρικό 66%).
const mark = `
  <defs>
    <clipPath id="above"><rect x="0" y="0" width="1024" height="590"/></clipPath>
    <radialGradient id="sun" cx="50%" cy="45%" r="60%">
      <stop offset="0" stop-color="#ffe08a"/><stop offset="1" stop-color="#ffb52e"/>
    </radialGradient>
  </defs>
  <circle cx="512" cy="470" r="160" fill="url(#sun)" clip-path="url(#above)"/>
  <g fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="44">
    <path d="${wave(600, 262, 762)}" stroke="#ffffff"/>
    <path d="${wave(690, 292, 732)}" stroke="#c4ecf6"/>
    <path d="${wave(780, 332, 692, 22)}" stroke="#86d6ec"/>
  </g>`;
const bgGrad = `<defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color="${BG1}"/><stop offset="1" stop-color="${BG2}"/></linearGradient></defs>`;
const svg = (w, h, body) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>`;

exports.files = {
  'icon-only.png': svg(1024, 1024, `${bgGrad}<rect width="1024" height="1024" fill="url(#bg)"/>${mark}`),
  'icon-foreground.png': svg(1024, 1024, mark),
  'icon-background.png': svg(1024, 1024, `${bgGrad}<rect width="1024" height="1024" fill="url(#bg)"/>`),
  'splash.png': svg(2732, 2732, `${bgGrad}<rect width="2732" height="2732" fill="url(#bg)"/>
    <g transform="translate(649,366) scale(1.4)">${mark}</g>
    <text x="1366" y="1730" text-anchor="middle" font-family="DejaVu Sans" font-weight="bold" font-size="120" fill="#ffffff">Λέσβος · Παραλίες</text>
    <text x="1366" y="1860" text-anchor="middle" font-family="DejaVu Sans" font-size="72" fill="#c4ecf6">Lesvos Beaches</text>`),
};
exports.BG = BG1;
