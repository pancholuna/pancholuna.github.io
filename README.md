# pancholuna.github.io

CV + Portafolio — sitio estático de un solo `index.html`, publicado con GitHub Pages.

## Setup

```bash
npm install
npx playwright install chromium   # solo la primera vez
```

> **Norton / proxy corporativo:** si la descarga falla con error de certificado,
> exportar el cert raíz y pasarlo a Node:
> ```powershell
> $cert = Get-ChildItem Cert:\LocalMachine\Root | Where-Object { $_.Subject -match "Norton" }
> Export-Certificate -Cert $cert -FilePath "$env:USERPROFILE\norton-root.cer" -Type CERT
> certutil -encode "$env:USERPROFILE\norton-root.cer" "$env:USERPROFILE\norton-root.pem"
> $env:NODE_EXTRA_CA_CERTS = "$env:USERPROFILE\norton-root.pem"
> npx playwright install chromium
> ```

## Pruebas

### Layout móvil

Verifica que no haya scroll horizontal ni que el nombre del hero se parta,
a 320 / 360 / 375 / 414 px. Guarda capturas en `test/screenshots/` (ignoradas por git).

```bash
npm run test:mobile
```

### Galería

Verifica que todas las imágenes del portafolio carguen y que los links externos
tengan `https://`, `target=_blank` y `rel=noopener`.

```bash
npm run test:gallery
```

## Hook pre-push

El hook en `.githooks/pre-push` corre ambas pruebas automáticamente antes de
cada `git push` y aborta si alguna detecta una regresión. En un clon nuevo,
activarlo con:

```bash
git config core.hooksPath .githooks
```

Para saltarlo en un caso puntual: `git push --no-verify`.
