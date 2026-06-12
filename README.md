# pancholuna.github.io

CV + Portafolio — sitio estático de un solo `index.html`, publicado con GitHub Pages.

## Prueba de layout móvil

Antes de pushear cambios que toquen el hero o el layout, correr:

```bash
npm install            # solo la primera vez
npm run test:mobile
```

Carga el sitio con emulación real de viewport (Playwright sobre el Chrome
instalado) a 320 / 360 / 375 / 414 px y verifica que no haya scroll horizontal
ni que el nombre del hero se parta. Guarda capturas en `test/screenshots/`
(ignoradas por git) para revisión visual.

Requiere Google Chrome instalado. No descarga navegadores.
