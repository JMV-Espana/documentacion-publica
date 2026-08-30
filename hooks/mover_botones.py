"""Coloca los botones de acción ("EDITAR" / "DESCARGAR PDF") entre el título y
el contenido de la página, en vez de encima del título.

Por qué hace falta un hook y no basta con CSS: en el HTML generado, los dos
botones son hermanos ANTERIORES al <h1> (Material inserta el suyo y
mkdocs-exporter añade el del PDF al principio del <article>). Reordenarlos solo
con CSS obligaría a convertir el <article> en flex o grid, lo que desactiva el
colapso de márgenes de todos sus hijos y duplicaría el espaciado entre párrafos
en todo el sitio. Moverlos aquí, al construir, evita ese efecto secundario.

Se ejecuta con prioridad -200 para ir DESPUÉS de mkdocs-exporter, que inyecta su
botón en on_post_page con prioridad -100: si corriese antes, el botón del PDF
todavía no existiría.
"""
from bs4 import BeautifulSoup
from mkdocs.plugins import event_priority


@event_priority(-200)
def on_post_page(output: str, page, config) -> str:
    soup = BeautifulSoup(output, "html.parser")
    article = soup.find("article", class_="md-content__inner")
    if article is None:
        return output

    botones = article.find_all("a", class_="md-content__button", recursive=False)
    titulo = article.find("h1", recursive=False)
    if not botones or titulo is None:
        return output

    contenedor = soup.new_tag("div")
    contenedor["class"] = "jmv-page-actions"
    for boton in botones:
        contenedor.append(boton.extract())

    titulo.insert_after(contenedor)

    return str(soup)
