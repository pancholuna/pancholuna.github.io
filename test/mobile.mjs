/**
 * Prueba de layout móvil para index.html.
 *
 * Carga el sitio con emulación REAL de viewport (Playwright) en varios anchos
 * de teléfono y verifica dos regresiones que ya nos mordieron:
 *   1. Sin scroll horizontal: document.scrollWidth <= window.innerWidth.
 *   2. El nombre del hero no se parte: cada palabra del <h1> entra en una línea.
 *
 * Por qué Playwright y no `chrome --headless --window-size`: en Windows la
 * ventana de Chrome no baja de ~500px, así que --window-size=320 miente y
 * renderiza a ~500px. Playwright emula el viewport por DevTools Protocol, así
 * 320px es 320px de verdad.
 *
 * Uso: npm run test:mobile   (guarda capturas en test/screenshots/)
 */
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import { mkdir } from 'node:fs/promises';

const SITE = new URL('../index.html', import.meta.url).href;
const SHOTS = fileURLToPath(new URL('./screenshots/', import.meta.url));

// Anchos de teléfono representativos. 320 es el piso realista (iPhone SE / Android viejos).
const WIDTHS = [320, 360, 375, 414];

await mkdir(SHOTS, { recursive: true });

// Usa el Chrome instalado en el sistema (channel: 'chrome') en vez del Chromium
// que descarga Playwright — la descarga falla tras inspección SSL de red.
const browser = await chromium.launch({ channel: 'chrome' });
let failures = 0;

for (const width of WIDTHS) {
  const context = await browser.newContext({
    viewport: { width, height: 740 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  await page.goto(SITE, { waitUntil: 'networkidle' });
  await page.screenshot({ path: `${SHOTS}${width}.png`, fullPage: true });

  const result = await page.evaluate(() => {
    const scrollWidth = document.documentElement.scrollWidth;
    const innerWidth = window.innerWidth;

    // ¿Alguna palabra del h1 es más ancha que el espacio disponible? (se partiría)
    const h1 = document.querySelector('h1');
    const cs = getComputedStyle(h1);
    const probe = document.createElement('span');
    Object.assign(probe.style, {
      position: 'absolute',
      visibility: 'hidden',
      whiteSpace: 'nowrap',
      fontFamily: cs.fontFamily,
      fontSize: cs.fontSize,
      fontWeight: cs.fontWeight,
      fontStyle: cs.fontStyle,
      letterSpacing: cs.letterSpacing,
    });
    document.body.appendChild(probe);
    // El h1 separa las líneas con <br>, no con espacios: reconstruir cada
    // línea recorriendo los nodos hijos y cortando en cada <br>.
    const lines = [];
    let current = '';
    for (const node of h1.childNodes) {
      if (node.nodeName === 'BR') { lines.push(current); current = ''; }
      else { current += node.textContent; }
    }
    lines.push(current);

    // Cada línea del nombre es una sola palabra: si no entra, se parte.
    const tooWide = [];
    for (const line of lines.map((l) => l.trim()).filter(Boolean)) {
      probe.textContent = line;
      if (Math.ceil(probe.getBoundingClientRect().width) > h1.clientWidth) {
        tooWide.push(line);
      }
    }
    probe.remove();

    return { scrollWidth, innerWidth, tooWide };
  });

  const overflow = result.scrollWidth > result.innerWidth;
  const wraps = result.tooWide.length > 0;
  const ok = !overflow && !wraps;
  if (!ok) failures++;

  const tag = ok ? 'PASS' : 'FAIL';
  console.log(`[${tag}] ${width}px`);
  if (overflow) {
    console.log(`   ✗ scroll horizontal: scrollWidth=${result.scrollWidth} > innerWidth=${result.innerWidth}`);
  }
  if (wraps) {
    console.log(`   ✗ el nombre se parte: no entra ${result.tooWide.join(', ')}`);
  }
}

await browser.close();

console.log(`\nCapturas en test/screenshots/`);
if (failures > 0) {
  console.log(`${failures} ancho(s) con problemas.`);
  // Código distintivo: "la prueba corrió y encontró una regresión real".
  // Otros fallos (node/Chrome ausente, crash) salen con el código por defecto,
  // y el hook pre-push los distingue de esto para no bloquear por entorno.
  process.exitCode = 3;
} else {
  console.log('Todo en orden en móvil.');
}
