"""Añade a los PDF generados un encabezado con el logotipo, el nombre del grupo
de trabajo y el título del documento.

El encabezado se inyecta SOLO en el PDF, nunca en la web. El truco está en que
mkdocs-exporter no genera el PDF a partir del HTML final de la página, sino de
`page.html`, una copia que el plugin guarda en on_post_page con prioridad 100 —
es decir, antes de que corra ningún hook. Ese renderizado además no ocurre en ese
momento: se encola y se ejecuta al terminar todo el build.

De ahí las dos particularidades de este hook:

- Modifica `page.html` y devuelve None, para no tocar el HTML que se publica.
  Por eso el encabezado no necesita ocultarse con CSS en la web: sencillamente no
  está ahí. (Es también el motivo de que los botones EDITAR / DESCARGAR PDF nunca
  hayan salido en los PDF: se añaden con prioridad -100, cuando `page.html` ya
  está copiado.)
- Puede correr con prioridad baja sin problema, porque el renderizado del PDF
  sucede mucho después, en on_post_build.

La ruta del logo se escribe absoluta a propósito. El renderizador convierte cada
src en una ruta file:// y, para las rutas absolutas, las resuelve contra la raíz
del sitio; así el mismo valor sirve para páginas a cualquier profundidad, sin
tener que contar "../" por nivel.
"""
from datetime import datetime

from bs4 import BeautifulSoup
from mkdocs.plugins import event_priority

GRUPO = "Grupo de Trabajo de Soporte Operativo"
LOGO = "/assets/logo.svg"

MESES = ("enero", "febrero", "marzo", "abril", "mayo", "junio", "julio",
         "agosto", "septiembre", "octubre", "noviembre", "diciembre")

# Se calcula una sola vez, al importar el hook, para que todos los PDF de un
# mismo despliegue lleven exactamente la misma fecha aunque el build tarde en
# recorrer todas las páginas.
#
# Es la fecha de GENERACIÓN, no la de descarga: el PDF se produce al publicar la
# web y ese mismo archivo es el que se descarga siempre. De ahí el rótulo
# "Actualizado el", que además informa de si el documento está al día. No se usa
# locale.setlocale para el nombre del mes porque las locales en español no están
# garantizadas en el runner de GitHub Actions.
_hoy = datetime.now()
FECHA = f"Actualizado el {_hoy.day} de {MESES[_hoy.month - 1]} de {_hoy.year}"


@event_priority(-300)
def on_post_page(output: str, page, config) -> None:
    html = getattr(page, "html", None)
    if not html:
        # El plugin del exporter está desactivado: no hay PDF que encabezar.
        return None

    soup = BeautifulSoup(html, "html.parser")
    article = soup.find("article", class_="md-content__inner")
    if article is None:
        return None

    cabecera = soup.new_tag("header")
    cabecera["class"] = "jmv-pdf-cabecera"

    logo = soup.new_tag("img", src=LOGO, alt="")
    logo["class"] = "jmv-pdf-logo"

    fecha = soup.new_tag("p")
    fecha["class"] = "jmv-pdf-fecha"
    fecha.string = FECHA

    textos = soup.new_tag("div")
    textos["class"] = "jmv-pdf-textos"

    grupo = soup.new_tag("p")
    grupo["class"] = "jmv-pdf-grupo"
    grupo.string = GRUPO

    titulo = soup.new_tag("p")
    titulo["class"] = "jmv-pdf-titulo"
    titulo.string = page.title or ""

    textos.append(grupo)
    textos.append(titulo)

    # El orden importa: los dos flotados (logo a la izquierda, fecha a la
    # derecha) tienen que ir antes del bloque de textos para que este los esquive.
    cabecera.append(logo)
    cabecera.append(fecha)
    cabecera.append(textos)
    article.insert(0, cabecera)

    page.html = str(soup)

    # Devolver None deja intacto el HTML que se publica en la web.
    return None
