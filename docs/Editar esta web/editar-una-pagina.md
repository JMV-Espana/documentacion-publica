# Editar una página

Es el caso más habitual: corregir una errata, actualizar un dato o ampliar una
explicación de una página que ya existe.

## Paso a paso

### 1. Abre la página y pulsa EDITAR

Ve a la página de esta web que quieras corregir. Justo debajo del título verás
el botón **EDITAR**. Púlsalo.

Te llevará a GitHub, directamente al texto de esa página. Si no has iniciado
sesión, te lo pedirá primero.

### 2. Cambia lo que haga falta

Verás una caja de texto grande con el contenido de la página. Es texto normal,
con algunas marcas para dar formato: `**negrita**`, `- viñetas`, etc. Puedes
consultar [Lo básico de Markdown](markdown-basico.md), pero para corregir una
errata no necesitas saber nada de eso: escribe como escribirías en cualquier
sitio.

Arriba hay dos pestañas: **Edit** (editar) y **Preview** (vista previa). La vista
previa te enseña cómo va a quedar. Úsala antes de enviar.

### 3. Envía tu propuesta

Pulsa el botón verde **Commit changes...** arriba a la derecha. Se abre una
ventana:

1. En **el primer recuadro**, describe en pocas palabras qué has cambiado. Por
   ejemplo: *"Corrijo el email de contacto de Tesorería"*. Esto es lo que verá
   quien revise, así que una frase clara ahorra tiempo.
2. El segundo recuadro es opcional; puedes dejarlo vacío.
3. Abajo aparecen **dos opciones**. Elige siempre la segunda:

    - ~~*Commit directly to the `main` branch*~~ — publica sin revisión.
    - **✅ *Create a new branch for this commit and start a pull request*** —
      envía tu cambio a revisión. **Esta es la buena.**

4. Pulsa **Propose changes**.

### 4. Confirma el envío

Se abre una última pantalla con un botón verde **Create pull request**. Púlsalo.

Ya está. Tu propuesta queda registrada y quien corresponda recibirá el aviso.

!!! success "¿Y ahora qué?"

    No tienes que hacer nada más. Cuando alguien la apruebe, la web se
    actualizará sola en unos minutos. Si hace falta aclarar algo, te
    responderán en esa misma página de la propuesta.

## Cosas que pueden pasar

!!! info "Aparece una cruz roja en tu propuesta"

    Es la comprobación automática avisando de que algo no cuadra: casi siempre
    un enlace mal escrito. **No has roto la web**: la versión publicada sigue
    intacta y el cambio no entra hasta que se arregle. Avisa y se corrige.

!!! warning "Alguien ha editado la misma página mientras tanto"

    GitHub te avisará de un conflicto. No intentes resolverlo por tu cuenta:
    coméntalo con el equipo de webmasters y lo arreglan en un momento.

!!! danger "Si te equivocas, no pasa nada"

    De verdad. Mientras uses la opción de crear una propuesta de cambio (paso
    3), es **imposible** que estropees la web publicada. Todo cambio pasa por
    revisión, y cualquier versión anterior se puede recuperar. Prueba sin miedo.
