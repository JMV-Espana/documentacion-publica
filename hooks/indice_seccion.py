"""Añade al final de cada página de entrada de sección un listado con lo que esa
sección contiene.

Se genera automáticamente para que no se desincronice: al añadir una guía nueva
aparece sola en el listado, igual que aparece sola en el menú lateral. Escribir
esas listas a mano garantizaría que tarde o temprano quedaran obsoletas.

El listado hace falta sobre todo en el móvil: allí el menú lateral está oculto
tras el botón de hamburguesa, así que sin él la página de entrada de una sección
sería un callejón sin salida.

Detalle de por qué esto puede leer los títulos de las páginas vecinas: MkDocs
construye en dos pasadas. Primero recorre TODAS las páginas rellenando su título
y su contenido, y solo después lanza los eventos on_post_page. Cuando este hook
corre para la portada de una sección, sus páginas hermanas ya tienen título
aunque se rendericen después.
"""
from bs4 import BeautifulSoup
from mkdocs.plugins import event_priority
from mkdocs.utils import get_relative_url

TITULO = "En esta sección"


def _entradas(seccion, pagina_actual):
    """Páginas y subsecciones de la sección, en el orden del menú."""
    for hijo in seccion.children:
        if getattr(hijo, "is_page", False):
            if hijo is not pagina_actual:
                yield hijo.title, hijo.url
        elif getattr(hijo, "is_section", False):
            # De una subsección se enlaza su primera página, que es su portada
            # cuando la tiene.
            primera = next((p for p in hijo.children if getattr(p, "is_page", False)), None)
            if primera is not None:
                yield hijo.title, primera.url


@event_priority(-250)
def on_post_page(output: str, page, config) -> str:
    if page.file.name != "index":
        return None

    seccion = page.parent
    if seccion is None or not getattr(seccion, "is_section", False):
        return None

    entradas = [(t, u) for t, u in _entradas(seccion, page) if t and u]
    if not entradas:
        return None

    soup = BeautifulSoup(output, "html.parser")
    article = soup.find("article", class_="md-content__inner")
    if article is None:
        return None

    encabezado = soup.new_tag("h2")
    encabezado.string = TITULO

    lista = soup.new_tag("ul")
    for titulo, url in entradas:
        elemento = soup.new_tag("li")
        enlace = soup.new_tag("a", href=get_relative_url(url, page.url))
        enlace.string = titulo
        elemento.append(enlace)
        lista.append(elemento)

    article.append(encabezado)
    article.append(lista)

    return str(soup)
