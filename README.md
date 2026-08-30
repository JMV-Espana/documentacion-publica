# Documentación pública de JMV España

Código fuente de la web de documentación de JMV España, publicada en
[jmv-espana.github.io/documentacion-publica](https://jmv-espana.github.io/documentacion-publica).

Está hecha con [MkDocs](https://www.mkdocs.org/) y el tema
[Material](https://squidfunk.github.io/mkdocs-material/): las páginas se
escriben en Markdown dentro de `docs/` y el sitio se publica solo al fusionar en
`main`.

> **¿Vienes a corregir o añadir una guía, no a tocar el código?**
> No necesitas nada de este README ni instalar nada. Todo se hace desde el
> navegador y está explicado en la sección
> [Editar esta web](https://jmv-espana.github.io/documentacion-publica/Editar%20esta%20web/).

## Cómo trabajar en local

Hace falta Python 3.

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install mkdocs-material mkdocs-awesome-nav mkdocs-exporter beautifulsoup4
playwright install chromium --with-deps   # solo para generar los PDF
```

Levantar el sitio con recarga automática:

```bash
mkdocs serve
```

Construirlo como lo hace el despliegue:

```bash
mkdocs build --strict
```

`--strict` convierte los avisos en errores, así que un enlace interno roto tumba
la construcción en vez de publicar el sitio roto. **Es la misma comprobación que
se ejecuta sobre cada Pull Request**, así que si pasa en local, pasará en CI.

Generar los PDF abre un Chrome por página y tarda. Para iterar rápido sobre el
contenido o el CSS conviene desactivarlos:

```bash
MKDOCS_EXPORTER_PDF_ENABLED=false mkdocs build --strict
```

## Estructura

| Carpeta | Qué contiene |
|---|---|
| `docs/` | El contenido en Markdown, sus imágenes y el CSS/JS del sitio |
| `hooks/` | Hooks de MkDocs que modifican el HTML al construir |
| `overrides/` | Plantillas Jinja que sobrescriben partes del tema |
| `pdf/` | Estilos que solo se aplican al generar los PDF |
| `.github/workflows/` | Comprobación de Pull Requests y despliegue |

## Cosas que no se deducen mirando el código

Cuatro decisiones que conviene conocer antes de tocar nada, porque lo que parece
el sitio evidente para un cambio no siempre lo es.

### La navegación no está en `mkdocs.yml`

Se usa el plugin **awesome-nav**, que **ignora por completo** la clave `nav:` de
`mkdocs.yml`. El menú se define en los archivos `.nav.yml` de cada carpeta de
`docs/`.

`append_unmatched: true` en `docs/.nav.yml` se hereda hacia abajo: **cualquier
página nueva aparece sola en el menú**, al final de su sección, sin tocar
configuración. Solo hace falta editar un `.nav.yml` para fijar el orden o poner
un título distinto del encabezado de la página.

### Los PDF no se generan del HTML final

mkdocs-exporter guarda una copia de cada página (`page.html`) en `on_post_page`
con prioridad 100 —antes de que corra ningún hook— y renderiza el PDF al
terminar el build, a partir de esa copia.

Consecuencias prácticas:

- Lo que un hook añada al HTML devuelto **no sale en el PDF** (por eso los
  botones EDITAR y DESCARGAR PDF no aparecen en ellos).
- Para que algo sí salga, hay que escribir en `page.html`, como hace
  `hooks/encabezado_pdf.py` con el encabezado.
- El renderizador carga **Paged.js**, así que en `pdf/encabezado.css` funcionan
  `@page`, los encabezados repetidos con `position: running()` y los contadores
  de página.

`pdf/` está fuera de `docs/` a propósito, para que ese CSS no se publique como
un recurso más del sitio.

### Una página puede quedarse sin PDF a propósito

Con `pdf: false` en el *front matter*, el plugin no genera PDF para esa página
**y su botón de descarga desaparece solo**, porque solo se muestra cuando la
página tiene PDF. Es lo que usan los documentos oficiales —como los estatutos—
para que el único icono de descarga sea el del PDF firmado alojado en Drive.

Ojo: el `buttons:` del *front matter* **se suma** a los botones globales del
plugin, no los sustituye. Sin `pdf: false`, esas páginas acabarían con dos
iconos de descarga.

### Los colores tiran del verde oscuro, no del verde de marca

En `docs/assets/extra.css`, los textos y botones usan
`--md-primary-fg-color--dark` (`#146F5C`) en lugar del verde de marca
(`#188870`). No es un descuido: el verde base da 4,38:1 de contraste sobre
blanco y se queda por debajo del 4,5 que exige WCAG AA. El oscuro da 6,07:1. El
dorado de acento (2,42:1) no debe usarse para texto.

## Publicación

Al fusionar en `main`, `deploy.yml` construye el sitio y lo publica en la rama
`gh-pages` con `mkdocs gh-deploy --force --strict`.

Si añades un plugin a `mkdocs.yml`, acuérdate de añadirlo también al
`pip install` de **los dos** workflows: si no, la construcción funcionará en
local y fallará en CI.
