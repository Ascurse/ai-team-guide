import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const tokensCss = readFileSync(new URL('../src/styles/tokens.css', import.meta.url), 'utf8');

function token(name) {
  const found = tokensCss.match(new RegExp(`${name}:\\s*oklch\\(([\\d.]+)%\\s+([\\d.]+)\\s+([\\d.]+)\\)`));
  assert.ok(found, `Токен ${name} не найден`);
  return found.slice(1).map(Number);
}

function luminance([lightness, chroma, hue]) {
  const L = lightness / 100;
  const a = chroma * Math.cos((hue * Math.PI) / 180);
  const b = chroma * Math.sin((hue * Math.PI) / 180);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const linear = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ].map((channel) => Math.min(1, Math.max(0, channel)));
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

function contrast(foreground, background) {
  const [dark, light] = [luminance(token(foreground)), luminance(token(background))].sort((x, y) => x - y);
  return (light + 0.05) / (dark + 0.05);
}

const TEXT_PAIRS = [
  ['--color-accent-ink', '--color-accent'],
  ['--color-ink', '--color-accent-ink'],
  ['--band-ink', '--band-paper-2'],
  ['--band-on-accent', '--band-accent'],
  ['--band-on-accent', '--signal-yellow'],
  ['--on-signal', '--signal-red'],
  ['--color-link', '--color-paper'],
  ['--color-muted', '--color-paper'],
];

for (const [foreground, background] of TEXT_PAIRS) {
  test(`${foreground} на ${background} не ниже 4.5:1`, () => {
    assert.ok(contrast(foreground, background) >= 4.5, contrast(foreground, background).toFixed(2));
  });
}
