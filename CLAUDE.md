# Contexto del proyecto — JMV España, documentación (repo PÚBLICO: documentacion-publica)

Este archivo lo escribió Claude (en una sesión de Cowork) para que retomes el proyecto aquí, en VS Code, con todo el contexto de las decisiones ya tomadas. Hay un repo hermano, `documentacion-interna`, en la carpeta de al lado en el Escritorio, con esta misma copia del archivo.

**Estado real de ESTE repo ahora mismo:** `mkdocs.yml` ya está escrito a mano con la estructura completa de navegación (Corporativo, Secretaría, Tesorería, Actividades, Google Workspace...). Todavía faltan por crear: los archivos `.md` de contenido (la mayoría no existen todavía, `mkdocs.yml` los referencia por adelantado), los workflows de GitHub Actions de despliegue y comprobación (sección 5 de la guía), y la conexión del dominio propio (sección 6, de momento aplazada porque la web de la asociación no está lista).

Todo lo demás — arquitectura completa, decisiones ya tomadas y por qué, y los pasos que faltan — está en la guía íntegra a continuación. Sigue el checklist de la sección 12 para saber por dónde continuar.

---

# Guía de implementación — Web de documentación JMV España

Estado de partida: la organización de JMV España en GitHub ya existe. Generador elegido: MkDocs Material. Nivel técnico de los socios que editarán: sin conocimientos técnicos (edición desde el navegador). Se quiere una parte pública y una parte privada con inicio de sesión mediante Google Workspace. Con ~92 cuentas activas y crecimiento previsto, se descartó Cloudflare Access (ver "Decisión revisada" más abajo) a favor de Google Cloud Identity-Aware Proxy.

**Fase actual (piloto):** todavía no tenéis acceso a GitHub for Nonprofits, así que `documentacion-interna` sigue siendo un repo público — por eso, hasta que se apruebe el plan Team y podáis pasarlo a privado, el sitio interno se rellena solo con **contenido de prueba (placeholders)**, nunca con los documentos reales de tesorería, altas de socios o menores. Sirve para validar que toda la arquitectura (Cloud Run + IAP + Google Group) funciona de verdad antes de exponer nada sensible. Tampoco hay todavía dominio propio operativo para JMV España: la web de la asociación, desde la que se redirigirán `docs.` e `intranet.`, aún no está lista, así que de momento se usan las URL gratuitas por defecto — `jmv-espana.github.io/documentacion-publica` y la URL `*.run.app` que asigna Cloud Run. Todo lo de dominio/DNS en la sección 6 y las URL personalizadas mencionadas en el resto de la guía son, por ahora, opcionales: se activan más adelante, cuando la web esté lista, simplemente apuntando esos subdominios a las mismas URL gratuitas — no hace falta cambiar nada en GitHub Pages, Cloud Run ni IAP para dar ese paso después.

## 0. Arquitectura elegida

Dos repositorios y dos sitios, mismo contenido en Markdown + MkDocs Material, pero con **hosting distinto** según necesiten acceso real controlado o no:

- **`documentacion-publica`** (repo público) → GitHub Pages → de momento en `jmv-espana.github.io/documentacion-publica`; más adelante en `docs.jmvespana.org` cuando la web de la asociación esté lista y redirija hacia aquí (sección 6). Accesible para cualquiera. Estatutos, protocolo de protección de menores, quiénes somos, contacto, memoria/transparencia si queréis publicarla.
- **`documentacion-interna`** (repo privado si es posible) → **Cloud Run + Identity-Aware Proxy (IAP) de Google Cloud**, no GitHub Pages → de momento en la URL `*.run.app` que os asigna Cloud Run; más adelante, opcionalmente, en `intranet.jmvespana.org`. Por ahora, mientras el repo sigue siendo público (sin GitHub for Nonprofits todavía), se rellena solo con contenido de prueba — no con el manual de tesorería, altas de socios o procesos con menores reales. El acceso se concede a un **Google Group** (p. ej. `socios@jmvespana.org`) que ya administráis en Workspace: añadir o quitar a alguien de ese grupo da o quita el acceso a la intranet, sin límite de personas ni coste por usuario.

### Decisión revisada: por qué no Cloudflare Access

La primera propuesta usaba Cloudflare Access para el login de Google. Con 92 cuentas activas y previsión de crecimiento, esa opción deja de tener sentido: el plan gratuito cubre hasta 50 usuarios (usuarios únicos que se autentican alguna vez, no sesiones), y en cuanto se supera hay que pasar al plan de pago, que cobra **7$/usuario/mes sobre el total de usuarios**, no solo sobre el exceso — con 92 personas serían del orden de 640$/mes, y subiendo con cada alta nueva. Cloudflare tiene un programa de seguridad Zero Trust gratuita para ONG (Project Galileo), pero está pensado para organizaciones "en riesgo" (defensores de derechos humanos, periodismo, sitios electorales) y se gestiona a través de un número limitado de socios curadores, no es un descuento nonprofit de solicitud directa — no es una vía fiable para una asociación juvenil.

**Google Cloud Identity-Aware Proxy (IAP)** resuelve lo mismo sin ese problema de escala: es gratuito en sí mismo (solo pagáis el hosting del sitio, que en Cloud Run entra de sobra en su capa gratuita permanente para el tráfico de una intranet de asociación), no cobra por usuario, y usa exactamente la misma identidad que ya tenéis — vuestro Google Workspace — restringiendo el acceso a un Google Group en vez de a una lista de correos sueltos. Es más trabajo de configuración inicial (un contenedor y un proyecto de Google Cloud, en vez de un par de menús en Cloudflare), pero ese trabajo lo hace una vez el equipo `webmaster`; para los socios que editan o consultan documentos no cambia nada del flujo descrito en la sección 8.

Capas de protección del sitio interno:
1. **Google Cloud IAP** — la barrera real: nadie ve una sola página sin iniciar sesión con una cuenta de Google que sea miembro del grupo `socios@jmvespana.org`. Sin límite de usuarios ni coste adicional por persona.
2. **Repositorio privado en GitHub** (opcional, capa adicional) — protege también el código fuente en Markdown, no solo el sitio publicado. Requiere el plan GitHub Team en la organización (de pago, ~4$/persona/mes) porque en el plan gratuito de organizaciones no se puede tener Actions con ciertas protecciones avanzadas sobre repos privados (aunque construir el contenedor para Cloud Run sí funciona igual desde un repo privado en el plan gratuito, a diferencia de GitHub Pages). Como asociación registrada, podéis solicitar GitHub Team gratis a través de GitHub for Nonprofits (ver sección 11).

## 1. Organización y equipos en GitHub

Como la organización ya existe, entrad en **Settings → People / Teams** y cread (si no existen) dos equipos:

- **`webmaster`** (o `junta-tic`): 2-3 personas de confianza, permiso *Write* o *Admin* en ambos repos. Son quienes revisarán y fusionarán los cambios propuestos por el resto de socios.
- **`socios`**: el resto de personas que necesiten editar. Permiso *Write* en `documentacion-interna` (para poder proponer cambios) y *Write* o *Triage* en `documentacion-publica` según cuánto confiéis en la edición directa.

Si algunos socios no van a editar nunca, ni siquiera hace falta que tengan cuenta de GitHub para *leer* la documentación interna: como el acceso real lo controla Google Cloud IAP (con su cuenta de Google Workspace, vía el grupo `socios@jmvespana.org`), pueden entrar sin ser miembros de la organización de GitHub. GitHub solo hace falta para quien vaya a **editar**.

## 2. Crear los dos repositorios

Repo público:
```
gh repo create JMV-Espana/documentacion-publica --public --add-readme
```

Repo interno (empezamos público por simplicidad; lo pasáis a privado cuando tengáis el plan Team):
```
gh repo create JMV-Espana/documentacion-interna --public --add-readme
```
(o hacedlo desde la web: *New repository* dentro de la organización).

## 3. Instalar y configurar MkDocs Material

En local (o en Codespaces), para cada repositorio:

```bash
pip install mkdocs-material
mkdocs new .
```

Esto crea `mkdocs.yml` y una carpeta `docs/` con `index.md`. Sustituid `mkdocs.yml` por algo como esto (ejemplo para el repo público; el interno es igual cambiando `site_url` y `repo_url`):

```yaml
site_name: JMV España — Documentación
site_url: https://docs.jmvespana.org
repo_url: https://github.com/JMV-Espana/documentacion-publica
repo_name: documentacion-publica

theme:
  name: material
  language: es
  palette:
    primary: indigo
  features:
    - navigation.tabs
    - navigation.top
    - search.suggest
    - content.action.edit   # añade un lápiz "Editar esta página" que lleva directo al editor de GitHub

plugins:
  - search

nav:
  - Inicio: index.md
  - Quiénes somos: quienes-somos.md
  - Estatutos: estatutos.md
  - Protección de menores: protocolo-proteccion-menores.md
  - Contacto: contacto.md
```

El detalle importante para socios sin conocimientos técnicos es `content.action.edit`: añade automáticamente, en la esquina de cada página, un lápiz que abre esa misma página en el editor web de GitHub (ver sección 9). No hace falta clonar nada ni instalar Git.

Para probar en local: `mkdocs serve` y abrid `http://127.0.0.1:8000`.

### 3.1 Secciones que crecen solas: nav automático por carpeta (opcional)

En MkDocs vanilla el `nav:` es todo o nada: o se omite por completo y se autogenera desde la estructura de `docs/` (todo automático, sin títulos personalizados), o se escribe a mano, y entonces cada `.md` nuevo hay que añadirlo a mano en `mkdocs.yml` — que es justo el caso de la sección **Actividades** ya montada en `documentacion-publica`, con sus 5 páginas listadas una a una.

Para que una sección concreta (por ejemplo `Actividades`) se rellene sola con cualquier `.md` que se añada dentro de su carpeta, sin tocar `mkdocs.yml` cada vez, hace falta el plugin **mkdocs-awesome-nav** (sucesor activamente mantenido del clásico `mkdocs-awesome-pages-plugin`, que ya está descontinuado bajo ese nombre). Permite mezclar: el resto del `nav` se queda exactamente como lo tenéis escrito, y solo esa sección se vuelve automática.

```bash
pip install mkdocs-awesome-nav
```

```yaml
plugins:
  - search
  - awesome-nav
```

Y en `mkdocs.yml`, cambiar el bloque actual de `Actividades` (con sus 5 archivos listados) por un simple puntero a la carpeta, tras mover esos 5 `.md` a `docs/actividades/`:

```yaml
nav:
  - Inicio: index.md
  - Corporativo: [...]
  - Secretaría: [...]
  - Tesorería: [...]
  - Actividades: actividades
  - Google Workspace: [...]
```

A partir de ahí, cualquier `.md` que un socio añada dentro de `docs/actividades/` aparece solo en el menú, sin ninguna Pull Request sobre `mkdocs.yml`. Dos detalles a tener en cuenta:

- **Orden:** sin configuración adicional, las páginas de esa carpeta se listan en un orden por defecto (básicamente alfabético por nombre de archivo), que puede no coincidir con el orden actual (`actividad-centro`, `actividad-entre-centros`, `actividad-area`, `actividades-nacionales`, `contabilidad-actividad`). Si el orden importa, se puede crear un `docs/actividades/.nav.yml` fijando el orden exacto, pero eso vuelve a obligar a tocar un archivo de configuración cada vez que se añade una página nueva — la alternativa que no rompe la automatización es simplemente nombrar los archivos de forma que el orden alfabético ya sea el que queréis (por ejemplo, con un pequeño ajuste de nombres, o prefijos como `1-actividad-centro.md`, `2-actividad-entre-centros.md`...).
- **Títulos:** cada página puede llevar su propio título en el *front matter* (`title: Actividad de Centro`) si el texto derivado automáticamente del nombre de archivo no queda como queréis; comprobadlo al activarlo, ya que ahora mismo tenéis títulos en español cuidados a mano en el `nav`.

Merece la pena aplicarlo solo donde de verdad vais a ir añadiendo páginas con frecuencia (Actividades es un buen candidato; también podría servir en el futuro para algo como actas o memorias anuales). El resto de secciones, que cambian poco, pueden seguir listadas a mano tal cual las tenéis: no hace falta convertir todo el sitio a nav automático para aprovechar esto en una sola sección.

## 4. Estructura de contenidos

**`documentacion-publica/docs/`**
```
index.md                       Bienvenida institucional
quienes-somos.md               Historia, misión, organigrama
estatutos.md                   Estatutos de la asociación
protocolo-proteccion-menores.md
contacto.md
transparencia.md               (opcional: memoria anual, cuentas resumidas)
```

**`documentacion-interna/docs/`** (misma estructura final prevista, pero de momento con contenido de prueba en vez de los documentos reales — ver "Fase actual" al principio de la guía)
```
index.md                                       Bienvenida socios
primeros-pasos/acceso-google-workspace.md      Cómo entrar en la plataforma de Google
tesoreria/manual-tesoreria.md
tesoreria/reembolsos-gastos.md
socios/alta-nuevos-socios.md
socios/baja-socios.md
actividades-menores/autorizaciones.md
actividades-menores/protocolo-organizacion-actividad.md
gobierno/actas-juntas.md                       (si aplica)
```

Para la fase piloto, cada uno de estos archivos puede llevar simplemente un título y una frase de relleno (p. ej. "Contenido de prueba — pendiente de migrar el manual real"), solo para comprobar que la navegación, el buscador y el acceso con IAP funcionan como se espera. Sustituidlos por los documentos reales cuando `documentacion-interna` pase a privado (sección 11).

Migrar vuestros documentos actuales (Word, PDF, Google Docs) es básicamente copiar el texto a un `.md` nuevo por documento, con un único `# Título` al principio. No hace falta *front matter* ni configuración especial por página.

## 5. Despliegue automático (GitHub Actions + GitHub Pages)

En cada repo, `.github/workflows/deploy.yml`:

```yaml
name: Publicar documentación
on:
  push:
    branches: [main]
permissions:
  contents: write
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.x"
      - run: pip install mkdocs-material
      - run: mkdocs gh-deploy --force --strict
```

`--strict` hace que la publicación falle (en vez de publicar algo roto) si hay enlaces internos rotos o markdown mal formado — una red de seguridad útil cuando edita gente sin experiencia técnica.

Además, un segundo workflow que valida cada Pull Request *antes* de fusionarlo, sin publicar nada, para detectar errores antes de que lleguen a producción:

```yaml
name: Comprobar documentación
on:
  pull_request:
    branches: [main]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.x"
      - run: pip install mkdocs-material
      - run: mkdocs build --strict
```

Por último, en **Settings → Pages** del repo, seleccionad *Deploy from a branch* → rama `gh-pages` → `/ (root)` (esta rama la crea sola el primer `mkdocs gh-deploy`).

## 6. Dominio propio para el sitio público (pendiente — la web de la asociación aún no está lista)

Cuando la web de JMV España esté lista, se redirigirá `docs.jmvespana.org` (u otro subdominio) hacia este sitio. Hasta entonces no hace falta hacer nada aquí: el sitio público funciona igual de bien en `jmv-espana.github.io/documentacion-publica`, y enlazarlo desde donde haga falta (redes sociales, la futura web) no requiere que tenga un dominio propio.

Cuando llegue el momento, los pasos son solo estos dos, sin tocar nada de lo ya construido:

1. Crear un registro CNAME `docs` → `jmv-espana.github.io` en el DNS del dominio de la asociación (o, si preferís redirigir en vez de tener un subdominio propio con contenido servido directamente, un simple redirect 301 desde la web a la URL de GitHub Pages).
2. En el repo `documentacion-publica`, **Settings → Pages → Custom domain**, escribid `docs.jmvespana.org` y verificad la propiedad si GitHub os lo pide (registro TXT).

## 7. Despliegue del sitio interno en Cloud Run

El sitio interno ya no se publica con GitHub Pages (que solo puede publicar en abierto), sino como una pequeña aplicación en **Cloud Run**, el servicio de Google Cloud para contenedores, que luego se protege con IAP.

### 7.0 Crear el proyecto y el servicio (primer despliegue, a mano)

Antes de automatizar nada con GitHub Actions, conviene desplegar una vez a mano para comprobar que todo arranca. Lo más rápido es hacerlo desde **Cloud Shell** (el botón de terminal `>_` arriba a la derecha en console.cloud.google.com): es un terminal en el navegador con `gcloud` ya instalado, sin nada que configurar en vuestro Mac. Si preferís hacerlo desde vuestro propio terminal, instalad antes el Google Cloud CLI.

1. **Crear el proyecto** (o usad uno que ya tengáis; el nombre del proyecto es único a nivel global, así que puede que tengáis que ajustarlo):
   ```bash
   gcloud projects create jmv-espana-docs
   gcloud config set project jmv-espana-docs
   ```
2. **Vincular una cuenta de facturación** al proyecto (imprescindible para poder usar Cloud Run, aunque el consumo real de una intranet de asociación se quede en 0€ dentro de la capa gratuita). Si es la primera vez que usáis Google Cloud, primero hay que crear la cuenta de facturación y después vincularla:
   - **Crearla** (si no tenéis ninguna todavía): console.cloud.google.com/billing → *Crear cuenta* → nombre de la cuenta → país (o la organización, si ya tenéis un perfil de pago como asociación) → *Continuar* → añadir una tarjeta → *Enviar y activar la facturación*. Como cuenta nueva os dan automáticamente 300$ en crédito gratuito para probar, aparte de la capa gratuita permanente de Cloud Run — de sobra para esto.
   - **Vincularla al proyecto** (si ya tenéis cuenta de facturación creada, de este proyecto o de otro anterior): en esa misma página de *Administrar cuentas de facturación*, pestaña *Mis proyectos* → buscad `jmv-espana-docs` (pondrá "La facturación no está habilitada") → menú de tres puntos → *Cambiar facturación* → elegid la cuenta → *Establecer cuenta*.
3. **Activar las APIs necesarias:**
   ```bash
   gcloud services enable run.googleapis.com cloudbuild.googleapis.com iap.googleapis.com
   ```
4. **Dar permiso a la cuenta de servicio de Cloud Build** para desplegar en Cloud Run (Google lo pide explícitamente en proyectos nuevos):
   ```bash
   PROJECT_NUMBER=$(gcloud projects describe jmv-espana-docs --format='value(projectNumber)')
   gcloud projects add-iam-policy-binding jmv-espana-docs \
       --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
       --role="roles/run.builder"
   ```
5. **Clonar (o subir) el repo `documentacion-interna`** al entorno donde estéis ejecutando estos comandos (en Cloud Shell: `git clone https://github.com/JMV-Espana/documentacion-interna.git && cd documentacion-interna`), asegurándoos de que ya tiene el `Dockerfile` de más abajo, y desplegad directamente desde el código fuente — sin necesidad de instalar Docker en ningún sitio, `gcloud` construye la imagen por vosotros con Cloud Build:
   ```bash
   gcloud run deploy documentacion-interna --source . --region europe-west1
   ```
   Os pedirá confirmación del nombre del servicio y la región (aceptad los valores por defecto que acabáis de pasar), y al final os preguntará si permitís acceso público sin autenticación. Como en esta fase piloto el contenido son solo placeholders, podéis responder que sí únicamente para comprobar que la página carga en la URL `*.run.app` que os da — e inmediatamente después seguir con la sección 8 para activar IAP y cerrar ese acceso público. Si preferís no dejarlo abierto ni un segundo, respondded que no y comprobad el resultado del despliegue desde el propio dashboard de Cloud Run en vez de visitar la URL directamente.

Este primer despliegue ya crea el servicio `documentacion-interna` en Cloud Run. El workflow de GitHub Actions de más abajo, cuando lo configuréis, simplemente actualiza ese mismo servicio en cada cambio — no hace falta crearlo de nuevo.

> **Fallo típico a vigilar:** si en algún momento añadís un plugin nuevo a `plugins:` en `mkdocs.yml` (por ejemplo `awesome-nav` de la sección 3.1, o `exporter` de la sección 10), acordaos de añadirlo también al `pip install` del `Dockerfile` (más abajo) y al del workflow `check.yml` de la sección 9 — si el plugin está declarado en `mkdocs.yml` pero no instalado en esos dos sitios, `mkdocs build` falla con un error de "plugin no instalado", y eso es lo que suele estar detrás de un despliegue de Cloud Run que falla justo en el paso de construir la imagen. También comprobad que cada `.md` que aparezca en el `nav:` existe de verdad dentro de `docs/` — un `nav` apuntando a un archivo inexistente rompe el build igual.

En el repo `documentacion-interna`, añadid un `Dockerfile` que compila el sitio con MkDocs y lo sirve con nginx:

```dockerfile
FROM python:3.12-slim AS build
WORKDIR /docs
COPY . .
RUN pip install mkdocs-material && mkdocs build

FROM nginx:alpine
COPY --from=build /docs/site /usr/share/nginx/html
```

Y un workflow `.github/workflows/deploy.yml` que construye la imagen y la despliega en cada cambio a `main` (usando un proyecto de Google Cloud que cread una vez desde console.cloud.google.com, con facturación asociada pero dentro de la capa gratuita para este uso):

```yaml
name: Publicar intranet
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write
    steps:
      - uses: actions/checkout@v4
      - uses: google-github-actions/auth@v2
        with:
          workload_identity_provider: ${{ secrets.GCP_WIF_PROVIDER }}
          service_account: ${{ secrets.GCP_SA_EMAIL }}
      - uses: google-github-actions/deploy-cloudrun@v2
        with:
          service: documentacion-interna
          region: europe-west1
          source: .
```

La autenticación recomendada por Google es *Workload Identity Federation* (sin claves JSON largas guardadas como secreto) — el codelab oficial de Google explica cómo generarla paso a paso; enlazado en el checklist final. Como alternativa más simple de arrancar (menos recomendable a largo plazo) se puede usar una clave de cuenta de servicio guardada como secreto `GCP_SA_KEY` con `credentials_json` en vez de `workload_identity_provider`.

## 8. Identity-Aware Proxy con Google Workspace (sitio interno)

1. En el proyecto de Google Cloud, activad la API de Identity-Aware Proxy.
2. En el servicio de Cloud Run `documentacion-interna` (pestaña *Security*, o con `gcloud run deploy --iap`), activad **"Require authentication" → Identity-Aware Proxy**.
3. En Google Workspace (admin.google.com), cread un grupo, por ejemplo `socios@jmvespana.org`, y añadid a él a todos los socios con derecho a la intranet. Mantener este grupo actualizado (altas y bajas) es, a partir de ahora, todo lo que hace falta para dar o quitar acceso.
4. Concededle acceso a ese grupo sobre el recurso de IAP con el rol `roles/iap.httpsResourceAccessor` (desde IAM o con `gcloud`, usando `group:socios@jmvespana.org` como principal).
5. Probad en incógnito: la URL de Cloud Run (o `intranet.jmvespana.org` si le mapeáis un dominio propio más adelante) debe pedir iniciar sesión con Google, y solo dejar pasar a cuentas dentro del grupo `socios`.

Sin límite de usuarios, sin coste por asiento: el único gasto es el hosting de Cloud Run, que para el tráfico de una intranet de asociación se queda dentro de la capa gratuita permanente en la inmensa mayoría de los casos.

## 9. Cómo editarán los socios sin conocimientos técnicos

Gracias al `content.action.edit` del paso 3, cada página del sitio publicado tiene un lápiz "Editar esta página" que abre directamente el editor de texto de github.com sobre ese archivo, sin que nadie tenga que clonar el repositorio ni instalar Git.

Flujo recomendado:
1. El socio pulsa el lápiz, edita el Markdown en la caja de texto de GitHub (vista previa incluida).
2. Al final de la página, GitHub le ofrece dos opciones: *"Commit directly to the main branch"* o *"Create a new branch for this commit and start a pull request"*. Recomendad siempre la segunda opción.
3. Se abre automáticamente una Pull Request. En `documentacion-publica` el workflow de "Comprobar documentación" (sección 5) se ejecuta solo y avisa si algo se ha roto; en `documentacion-interna` conviene añadir un workflow equivalente que solo haga `mkdocs build --strict` en cada Pull Request, sin desplegar nada, como comprobación previa al `deploy.yml` de la sección 7.
4. Alguien del equipo `webmaster` revisa el cambio (unos segundos, es solo texto) y pulsa *Merge*. Al fusionar a `main`, el despliegue se publica solo.

Para documentos nuevos: *Add file → Create new file* en la carpeta correspondiente dentro de `docs/`, escribir el contenido empezando por `# Título`, y seguir el mismo flujo de Pull Request.

Merece la pena crear, dentro de cada sitio, una página `como-editar.md` con capturas de pantalla de este proceso, para que cualquier socio nuevo pueda seguirlo sin ayuda.

## 10. Botón "Descargar en PDF" junto al de editar

Junto al lápiz de "Editar esta página" (sección 9), cada guía debe llevar también un icono de "Descargar en PDF". Se comporta de dos formas distintas según el tipo de documento:

- **Guías y procesos normales** (manual de tesorería, alta de socios, cómo entrar en Google Workspace, etc.): el botón genera un PDF a partir de esa misma página en el momento de publicar el sitio, y lo descarga.
- **Documentos oficiales firmados** (estatutos, protocolo de protección de menores, y cualquier otro que exista como PDF firmado/sellado en vuestro Google Drive): el botón, en vez de generar nada, descarga directamente ese PDF real alojado en Drive — para que nadie confunda un PDF generado automáticamente a partir del Markdown con el documento oficial que tiene validez legal.

### 10.1 Generación automática de PDF por página

El plugin recomendado es **mkdocs-exporter** (activamente mantenido, usa un navegador Chrome controlado por Playwright para renderizar cada página con fidelidad, con soporte explícito para Material). El antiguo `mkdocs-pdf-export-plugin` existe pero está prácticamente abandonado desde 2020 (44 issues sin resolver, sin publicar versión nueva) — no lo uséis para un proyecto que queréis que dure.

Instalación (en cada repo, y en el paso de build de los workflows/`Dockerfile`):
```bash
pip install mkdocs-exporter
playwright install chrome --with-deps
```

En `mkdocs.yml`, añadid el plugin junto a `search`, activando el formato PDF y el botón de descarga en cada página (consultad la documentación de configuración del plugin para la sintaxis exacta más reciente, que combina estas dos piezas):

```yaml
plugins:
  - search
  - exporter:
      formats:
        pdf:
          enabled: !ENV [MKDOCS_EXPORTER_PDF_ENABLED, true]
          buttons:
            - title: Descargar en PDF
              icon: material-file-download-outline
              enabled: !!python/name:mkdocs_exporter.formats.pdf.buttons.download.enabled
              attributes: !!python/name:mkdocs_exporter.formats.pdf.buttons.download.attributes
```

El `!ENV [MKDOCS_EXPORTER_PDF_ENABLED, true]` permite desactivar la generación de PDF (más lenta, porque abre un Chrome por página) en el workflow de "Comprobar documentación" de las Pull Requests —donde solo interesa validar que el Markdown no está roto, no generar PDFs de cada propuesta de cambio— definiendo esa variable de entorno a `false` solo en ese job, y dejándola activa (por defecto `true`) en el despliegue real.

Tened en cuenta que instalar Chrome añade tiempo y tamaño a cada build: en `documentacion-publica` no supone un problema porque los repos públicos tienen minutos de GitHub Actions ilimitados; en el `Dockerfile` de `documentacion-interna` (sección 7), añadid `playwright install chrome --with-deps` en la fase de build (antes de `mkdocs build`) — no afecta al tamaño final de la imagen de Cloud Run porque esa fase se descarta en el `FROM nginx:alpine` final.

### 10.2 Documentos oficiales: enlazar al PDF real de Google Drive

Para las páginas que representan un documento oficial firmado, sobrescribid el botón en el *front matter* (las líneas `---` al principio del archivo Markdown) con la URL directa de descarga de Drive, en vez de dejar que se genere un PDF a partir del texto:

```markdown
---
pdf: false
buttons:
  - title: Descargar el documento oficial (PDF)
    icon: material-file-download-outline
    attributes:
      class: md-content__button md-icon
      href: https://drive.google.com/uc?export=download&id=ID_DEL_ARCHIVO_EN_DRIVE
      target: _blank
---

# Estatutos de la asociación

Este documento es un resumen de referencia. El documento firmado y con validez legal es el PDF descargable arriba.
```

El `ID_DEL_ARCHIVO_EN_DRIVE` es la cadena larga que aparece en la URL para compartir el archivo en Drive (`.../d/ID/view`). El archivo debe estar compartido como "Cualquier persona con el enlace" (o, si preferís, restringido a vuestro dominio de Workspace) para que la descarga funcione sin pedir permiso.

La línea `pdf: false` es imprescindible y fácil de olvidar: el `buttons` del *front matter* **se suma** a los botones globales del plugin, no los sustituye, así que sin ella la página acaba con **dos** iconos de descarga (el PDF oficial de Drive y otro generado automáticamente a partir del texto) — justo la confusión que la sección 10 quiere evitar. Al poner `pdf: false`, el plugin no genera PDF para esa página y su botón automático desaparece solo, porque solo se muestra cuando la página tiene PDF generado. De paso, ahorra abrir un Chrome para renderizar un PDF que nadie debe usar.

Esto solo cambia el botón de PDF; el lápiz de "Editar esta página" sigue funcionando igual y sigue siendo útil para corregir la introducción o el texto de esa página — no toca el documento firmado, que sigue viviendo solo en Drive. Si queréis un control extra sobre quién puede tocar estas páginas concretas, se puede añadir un archivo `CODEOWNERS` que obligue a que cualquier Pull Request sobre `estatutos.md` o `protocolo-proteccion-menores.md` la revise sí o sí alguien de `webmaster`, aunque el flujo normal de revisión de la sección 9 ya cubre razonablemente ese caso.

## 11. GitHub for Nonprofits (opcional pero recomendable)

Como asociación registrada, JMV España puede solicitar el plan GitHub Team gratuito a través de GitHub for Nonprofits (nonprofits.github.com). Esto os da, sin coste: repositorios privados con más funciones de Actions, ramas protegidas, revisores obligatorios en Pull Requests, más minutos de Actions y Codespaces. El proceso es: entrar en el portal de nonprofits.github.com, validar la organización (a través de su base de datos o subiendo documentación acreditativa), y solicitar la mejora a Team desde el propio portal una vez validados. La revisión puede tardar hasta una semana. Con esto podéis pasar `documentacion-interna` a repositorio privado de verdad — el despliegue a Cloud Run sigue funcionando igual desde un repo privado, y añade esa capa extra de protección al código fuente en Markdown, además del login por IAP.

## 12. Checklist de próximos pasos

1. Crear los dos repositorios dentro de la organización.
2. Instalar MkDocs Material y dejar cada sitio con su `mkdocs.yml` y una primera página de inicio.

**Fase piloto (con las URL gratuitas, sin dominio propio, sin contenido sensible):**

3. Configurar el despliegue del sitio público a GitHub Pages y su comprobación de Pull Requests, con un par de páginas de ejemplo.
4. Crear el proyecto de Google Cloud, el `Dockerfile` y el despliegue a Cloud Run del sitio interno (sección 7), con las páginas de `documentacion-interna` rellenas solo con contenido de prueba; seguir el codelab oficial de Google "How to use 1-click Identity Aware Proxy (IAP) with Cloud Run" para la configuración exacta de Workload Identity Federation e IAP.
5. Activar IAP en el servicio de Cloud Run y crear el grupo `socios@jmvespana.org` en Google Workspace (sección 8). Comprobar con un par de socios de prueba que el login funciona y que quien no está en el grupo se queda fuera.
6. Escribir la página `como-editar.md` en ambos sitios y probar el flujo de edición (sección 9) con algún socio sin perfil técnico, ya que es la parte más nueva para ellos.
7. Añadir `mkdocs-exporter` a ambos sitios y comprobar que el botón de "Descargar en PDF" funciona sobre una página de ejemplo (sección 10.1).

**Cuando estén listas las piezas que faltan:**

8. Migrar el protocolo de protección de menores y los estatutos al repo público (son los documentos con más urgencia de estar accesibles públicamente), y después el resto de manuales y procesos internos al repo interno, sustituyendo los placeholders.
9. Para cada documento oficial firmado que ya tengáis en Drive (estatutos, protocolo de menores...), sobrescribir su botón de PDF con el enlace de descarga directa de Drive (sección 10.2).
10. Solicitar GitHub for Nonprofits y pasar `documentacion-interna` a repositorio privado de verdad (sección 11) — momento natural para sustituir el contenido de prueba por los documentos reales, ya con esa capa extra de protección activa.
11. Cuando la web de la asociación esté lista, conectar `docs.jmvespana.org` (sección 6) y, opcionalmente, un dominio personalizado para el sitio interno en Cloud Run.
