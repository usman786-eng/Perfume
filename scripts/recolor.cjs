// Remap the warm-beige palette to: bright white / metallic gold / rich black.
//
// Classification notes:
//  - Uses CHROMA (max-min channel spread), not HSL saturation. HSL saturation
//    is useless at the light end: #f2ece4 is cream text but scores s=0.35, which
//    a naive threshold reads as a saturated accent.
//  - Classification is property-aware: the same warm hue means "dark surface"
//    as a background and "gold accent" as a colour.
//  - Neutral greys are shifted BRIGHTER, not preserved. The old greys sat at
//    ~3.7:1 on the black background, which is part of why the site reads muted.
const fs = require('fs');

const FILES = ['src/styles.css', 'src/pages.css', 'src/shop/shop.css'];
const BG = '#0a090c'; // new page background, for the contrast check

const hex2rgb = (h) => {
  h = h.replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  return [0, 2, 4].map((i) => parseInt(h.substr(i, 2), 16));
};
const rgb2hex = (r) => '#' + r.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
const lum = (rgb) => {
  const a = rgb.map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
  return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
};
const contrast = (c1, c2) => {
  const l1 = lum(hex2rgb(c1)), l2 = lum(hex2rgb(c2));
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
};
const hue = (rgb) => {
  const [r, g, b] = rgb.map((v) => v / 255);
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  if (!d) return 0;
  if (mx === r) return ((g - b) / d + (g < b ? 6 : 0)) * 60;
  if (mx === g) return ((b - r) / d + 2) * 60;
  return ((r - g) / d + 4) * 60;
};
function hsl2rgb(h, s, l) {
  h = ((h % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let t = [0, 0, 0];
  if (h < 60) t = [c, x, 0]; else if (h < 120) t = [x, c, 0]; else if (h < 180) t = [0, c, x];
  else if (h < 240) t = [0, x, c]; else if (h < 300) t = [x, 0, c]; else t = [c, 0, x];
  return t.map((v) => (v + m) * 255);
}
const ramp = (stops, t) => {
  t = Math.max(0, Math.min(1, t));
  const seg = Math.min(stops.length - 2, Math.floor(t * (stops.length - 1)));
  const lt = t * (stops.length - 1) - seg;
  const a = hex2rgb(stops[seg]), b = hex2rgb(stops[seg + 1]);
  return rgb2hex([0, 1, 2].map((i) => a[i] + (b[i] - a[i]) * lt));
};

const BLACK = ['#040305', '#0a090c', '#141217', '#1e1b22', '#2a2630', '#3d3947'];
const WHITE = ['#e4e1da', '#f2f0ea', '#fbfaf7', '#ffffff'];
// brighter than the originals on purpose - old greys were ~3.7:1 on black
const GREY = ['#6e6c74', '#8b8990', '#a7a5ab', '#c1bfc4', '#d9d7da', '#f0eef0'];
const GOLD = ['#6d5216', '#a8801f', '#d4af37', '#e3c55c', '#f0d98f', '#f7e7a8'];

function propRole(prop) {
  const p = prop.trim().toLowerCase();
  if (/^(background|background-color|background-image)/.test(p)) return 'surface';
  if (/box-shadow|text-shadow/.test(p)) return 'shadow';
  if (/^(border|outline|column-rule)/.test(p) || /-color$/.test(p)) return 'hairline';
  if (/^(color|fill|stroke|caret-color|text-decoration-color)/.test(p)) return 'text';
  return 'other';
}

function classify(hex, role) {
  const rgb = hex2rgb(hex);
  const mx = Math.max(...rgb), mn = Math.min(...rgb);
  const chroma = mx - mn;              // absolute spread, 0..255
  const l = (mx + mn) / 2 / 255;
  const h = hue(rgb);
  // warm family = meaningful chroma AND a warm hue (includes rose pink ~350)
  const warm = chroma >= 22 && (h < 75 || h > 320);

  if (chroma < 26) {
    // neutral family: black -> white ramp
    if (l < 0.34) return { role: 'dark', out: ramp(BLACK, Math.pow(l / 0.34, 0.8)) };
    return { role: l > 0.72 ? 'white' : 'grey', out: ramp(l > 0.72 ? WHITE : GREY, (l - 0.34) / 0.66) };
  }
  if (!warm) return { role: 'other', out: hex };

  // saturated warm: role decides whether it becomes gold or a dark surface
  const surfaceish = role === 'surface' || role === 'shadow' || role === 'hairline';
  if (l < 0.30 && surfaceish) {
    return { role: 'surface', out: ramp(BLACK, 0.40 + (l / 0.30) * 0.42) };
  }
  if (l < 0.22) return { role: 'dark', out: ramp(BLACK, l / 0.22 * 0.55) };

  // gold ramp; preserve relative lightness so gradients stay smooth
  const t = Math.max(0, Math.min(1, (l - 0.22) / 0.68));
  const target = 0.16 + t * 0.74;
  return { role: 'gold', out: ramp(GOLD, t) };
}

const write = process.argv.includes('--write');
const report = {};
let total = 0, changed = 0;
const risky = [];

for (const f of FILES) {
  let css = fs.readFileSync(f, 'utf8');
  css = css.replace(/([a-z-]+)\s*:\s*([^;{}]*#[0-9a-fA-F]{3,8}[^;{}]*)/gi, (match, prop, val) => {
    const role = propRole(prop);
    let out = val;
    val.replace(/#[0-9a-fA-F]{6}\b/g, (hx) => {
      total++;
      const low = hx.toLowerCase();
      const c = classify(low, role);
      report[c.role] = (report[c.role] || 0) + 1;
      if (low !== c.out) {
        changed++;
        // only flag colours that were readable on black and are not afterwards
        const before = contrast(low, BG), after = contrast(c.out, BG);
        if (before >= 4.5 && after < 4.5) risky.push(`${low}->${c.out} (${before.toFixed(1)}->${after.toFixed(1)}) in ${f} [${role}]`);
        out = out.replace(hx, c.out);
      }
      return hx;
    });
    return match.replace(val, out);
  });
  if (write) fs.writeFileSync(f, css, 'utf8');
}

console.log('mode: ' + (write ? 'WRITE' : 'dry-run'));
console.log(`hex: ${total}  changed: ${changed} (${((changed / total) * 100).toFixed(0)}%)`);
console.log('roles: ' + JSON.stringify(report));
console.log('\nregressions (>=4.5:1 before, <4.5:1 after vs ' + BG + '): ' + risky.length);
risky.slice(0, 20).forEach((r) => console.log('  ' + r));

const samples = ['#f2ece4', '#f1eee6', '#e9e5dc', '#f5eee7', '#716b62', '#8d7a6c', '#a3907c',
  '#a16c53', '#94765f', '#d09a82', '#ddb489', '#c98292', '#4a3a30', '#b68b5a', '#817b71', '#b2735a'];
console.log('\nsample mapping (as text colour):');
for (const s of samples) {
  const c = classify(s, 'text');
  console.log(`  ${s} -> ${c.out}  ${c.role.padEnd(7)} contrast ${contrast(s, BG).toFixed(1)} -> ${contrast(c.out, BG).toFixed(1)}`);
}
console.log('\nsample mapping (as background/surface):');
for (const s of ['#241d20', '#30262a', '#29251f', '#2b2224', '#4a3a30']) {
  const c = classify(s, 'surface');
  console.log(`  ${s} -> ${c.out}  ${c.role}`);
}