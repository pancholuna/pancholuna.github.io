/**
 * Verifica las galerías del portafolio:
 *
 * 1. IMÁGENES — todas renderizadas (naturalWidth > 0 después de load).
 *    Detecta rutas rotas, errores de mayúsculas, %20 mal codificado, etc.
 *
 * 2. LINKS EXTERNOS — atributos HTML correctos: href con https://,
 *    target=_blank, rel=noopener.
 *
 * ¿Por qué no navegar a los links reales?
 *   Instagram, TikTok y YouTube bloquean headless browsers devolviendo
 *   403 o redirigiendo a login. Un HEAD request desde Node funcionaría
 *   para URLs de sitios normales (cinema23.com, casadellago.unam.mx),
 *   pero no para redes sociales. Se verifica solo el HTML — si el href
 *   está bien puesto, el link funciona en el navegador real.
 *
 * Uso: npm run test:gallery
 */
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';

const SITE = new URL('../index.html', import.meta.url).href;

const browser = await chromium.launch();
const page = await browser.newPage();
await page.setViewportSize({ width: 1280, height: 900 });
await page.goto(SITE, { waitUntil: 'networkidle' });

// Esperar a que todas las imágenes de galería terminen de cargar.
// networkidle no es suficiente con file:// — la decodificación de PNGs grandes
// puede completarse después de que el evento se dispara.
await page.evaluate(() =>
  Promise.all(
    [...document.querySelectorAll('.work-gallery img')].map(
      img => img.complete
        ? Promise.resolve()
        : new Promise(r => { img.onload = r; img.onerror = r; })
    )
  )
);

const { imgCount, linkCount, errors } = await page.evaluate(() => {
  const errors = [];

  // ── IMÁGENES ────────────────────────────────────────────────────────────
  for (const img of document.querySelectorAll('.work-gallery img')) {
    if (!img.complete || img.naturalWidth === 0) {
      errors.push(`IMG rota: ${img.getAttribute('src')}`);
    }
  }

  // ── LINKS ───────────────────────────────────────────────────────────────
  for (const a of document.querySelectorAll('a.gallery-item')) {
    const href = a.getAttribute('href') ?? '';
    const label = a.querySelector('img')?.getAttribute('src') ?? href;

    if (!href.startsWith('https://')) {
      errors.push(`Link sin https — ${label}`);
    }
    if (a.getAttribute('target') !== '_blank') {
      errors.push(`Falta target=_blank — ${href}`);
    }
    if (!a.getAttribute('rel')?.includes('noopener')) {
      errors.push(`Falta rel=noopener — ${href}`);
    }
  }

  return {
    imgCount:  document.querySelectorAll('.work-gallery img').length,
    linkCount: document.querySelectorAll('a.gallery-item').length,
    errors,
  };
});

await browser.close();

console.log(`Imágenes revisadas : ${imgCount}`);
console.log(`Links revisados    : ${linkCount}`);

if (errors.length === 0) {
  console.log('Todo en orden.');
} else {
  console.log(`\n${errors.length} problema(s):`);
  for (const e of errors) console.log(`  ✗ ${e}`);
  process.exitCode = 3;
}
