# Lo básico de Markdown

Las páginas de esta web se escriben en **Markdown**: texto normal con unas pocas
marcas para dar formato. La idea es que se lea bien incluso sin procesar.

No hace falta aprendérselo. Esta página es una chuleta: consúltala cuando la
necesites. Con lo de aquí abajo se cubre el 95% de lo que vas a escribir.

!!! success "El truco que evita todos los errores"

    En GitHub, la pestaña **Preview** te enseña cómo va a quedar antes de
    enviar. Escribe, mira la vista previa, corrige. No hay que memorizar nada.

## Títulos y apartados

Se marcan con almohadillas. Cuantas más, más pequeño el apartado.

```markdown
# Título de la página
## Un apartado
### Un subapartado
```

!!! danger "Una sola `#` por página"

    La almohadilla sola se usa **una única vez**, al principio, para el título
    de la página. Los apartados van con `##` y los subapartados con `###`. Si
    repites `#`, el índice de la derecha deja de funcionar.

## Negrita y cursiva

```markdown
Esto es **negrita** y esto es *cursiva*.
```

Esto es **negrita** y esto es *cursiva*.

Usa la negrita para lo que alguien debe encontrar de un vistazo (el nombre de un
botón, un plazo, una advertencia corta). Si se subraya todo, no destaca nada.

## Listas

Con guion para las listas sin orden, y con números cuando el orden importa:

```markdown
- Primer punto
- Segundo punto

1. Primer paso
2. Segundo paso
```

- Primer punto
- Segundo punto

1. Primer paso
2. Segundo paso

!!! info "Deja una línea en blanco antes de la lista"

    Si pegas la lista al párrafo anterior sin dejar una línea vacía, no se ve
    como lista. Es el fallo más común.

## Enlaces

Entre corchetes el texto que se ve, entre paréntesis el destino.

**A una web de fuera:**

```markdown
Consulta la [web de JMV España](https://jmvesp.org).
```

**A otra página de esta web:** se apunta al archivo `.md`, con la misma cuenta de
`../` que se explica en [Subir imágenes](subir-imagenes.md).

```markdown
Mira primero [Editar una página](editar-una-pagina.md).
```

!!! warning "Escribe enlaces con texto, no direcciones sueltas"

    Mejor `[el formulario de altas](https://...)` que pegar la dirección
    entera. Se lee mejor y es más accesible.

## Imágenes

Igual que un enlace, pero con `!` delante. Tienen su propia página:
[Subir imágenes](subir-imagenes.md).

```markdown
![Descripción de la imagen](../assets/img/mi-pagina/01.png)
```

## Avisos de colores

Son los recuadros que ves por toda esta web. Se escriben con `!!!`, el tipo de
aviso y, entre comillas, el título:

```markdown
!!! warning "Título del aviso"

    El texto del aviso va aquí, dejando una línea en blanco
    y **cuatro espacios** de sangría al principio de cada línea.
```

!!! danger "Los cuatro espacios son obligatorios"

    Si el texto de dentro no lleva cuatro espacios de sangría, el aviso sale
    vacío y el texto se queda fuera. Es el error más habitual con los avisos.

Hay cuatro tipos disponibles:

```markdown
!!! success "Para algo que ha salido bien o un consejo útil"
!!! info "Para una aclaración o un detalle adicional"
!!! warning "Para algo que conviene tener en cuenta"
!!! danger "Para algo importante que no se debe pasar por alto"
```

Y así se ven:

!!! success "success"

    Un consejo, un resultado correcto, el camino recomendado.

!!! info "info"

    Una aclaración que no es urgente pero ayuda a entender.

!!! warning "warning"

    Algo que conviene tener en cuenta antes de seguir.

!!! danger "danger"

    Algo importante de verdad: un dato sensible, un paso irreversible.

Úsalos con moderación. Si media página son recuadros de colores, dejan de
llamar la atención.

## Tablas

```markdown
| Concepto | Plazo |
|---|---|
| Altas de socios | Antes del 31 de octubre |
| Memoria anual | Antes del 30 de junio |
```

| Concepto | Plazo |
|---|---|
| Altas de socios | Antes del 31 de octubre |
| Memoria anual | Antes del 30 de junio |

La línea de guiones del medio es obligatoria: separa el encabezado del
contenido.

## Separar párrafos

Deja **una línea en blanco** entre párrafos. Si te limitas a pulsar Enter una
vez, las dos frases se pegan en el mismo párrafo.

```markdown
Este es un párrafo.

Y este es otro distinto.
```

## Y si algo no sale

Prueba en la vista previa, y si se resiste, envía la propuesta igualmente
explicando qué querías conseguir: quien la revise lo ajusta. Es preferible una
página con el contenido correcto y el formato regular, que una página que nadie
escribió por miedo a equivocarse.
