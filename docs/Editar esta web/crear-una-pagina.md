# Crear una página nueva

Cuando quieras documentar algo que todavía no está: un proceso, una guía, un
protocolo.

!!! info "Antes de empezar"

    Piensa en qué sección encaja (Secretaría, Tesorería, Actividades...). Si no
    lo tienes claro, pregunta antes de crearla: mover páginas de sitio después
    rompe los enlaces que apunten a ellas.

## Paso a paso

### 1. Ve a la carpeta de la sección

Entra en el repositorio en GitHub:
**[github.com/JMV-Espana/documentacion-publica](https://github.com/JMV-Espana/documentacion-publica)**

Abre la carpeta `docs` y, dentro, la carpeta de la sección donde quieras crear la
página. Cada carpeta de `docs` es una sección del menú de esta web.

### 2. Crea el archivo

Pulsa el botón **Add file** (arriba a la derecha) y elige **Create new file**.

En el recuadro del nombre, escribe el nombre del archivo terminado en `.md`.

!!! warning "Cómo nombrar el archivo"

    El nombre del archivo acaba siendo parte de la dirección web de la página,
    así que conviene:

    - **Todo en minúsculas**, separando palabras con guiones:
      `alta-de-socios.md`, no `Alta de Socios.md`.
    - **Sin acentos ni eñes** en el nombre del archivo: `gestion-economica.md`,
      no `gestión-económica.md`. En el texto de dentro, acentos todos los que
      hagan falta.
    - **Que acabe en `.md`**. Sin eso, no se publica como página.

### 3. Escribe el contenido

Empieza **siempre** con el título de la página precedido de una almohadilla:

```markdown
# Alta de nuevos socios

Aquí va la explicación...
```

Ese `#` es el título que verá la gente y el que aparecerá en el menú.

!!! danger "Una sola almohadilla por página"

    Usa `#` **una única vez**, al principio. Para los apartados de dentro usa
    dos (`##`) y para los subapartados tres (`###`). Si pones varios `#` en la
    misma página, el índice lateral deja de funcionar bien.

Para el resto del formato, tienes [Lo básico de Markdown](markdown-basico.md).

### 4. Envíala igual que una corrección

Al final de la página, pulsa **Commit changes...** y sigue exactamente los mismos
pasos que en [Editar una página](editar-una-pagina.md): describe el cambio,
elige **crear una propuesta de cambio** y confirma.

## No hace falta tocar el menú

Esta es la parte cómoda: **la página aparecerá sola en el menú lateral**, dentro
de la sección donde la hayas creado, en cuanto se apruebe. No tienes que editar
ningún archivo de configuración ni pedir que nadie la añada.

!!! info "¿Y el orden en que aparece?"

    Las páginas nuevas se colocan al final de su sección. Si necesitas que vaya
    en otra posición concreta, díselo al equipo de webmasters: es un ajuste de
    un minuto en la configuración de esa carpeta.

## Crear una sección nueva

Si lo que hace falta es una sección entera del menú, y no una página suelta,
mejor coméntalo antes con el equipo de webmasters. Se hace creando una carpeta
dentro de `docs`, pero conviene decidir entre todos el nombre y en qué orden
aparece, porque el nombre de la carpeta es el que se ve en el menú.
