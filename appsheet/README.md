# Dudas de la web: formulario, Apps Script y AppSheet

El botón **«¿Alguna duda? ¡Pregúntanos!»** del final de cada guía abre un
formulario dentro de la propia web. **Cualquiera puede usarlo, tenga o no cuenta
@jmvesp.org.** La duda queda registrada en una hoja de cálculo y el aviso llega
al equipo que corresponde:

| Categoría que elige quien pregunta | Se avisa a |
| --- | --- |
| Técnica (correo, Drive, cuentas, esta web…) | `gestiones.grupo@jmvesp.org` |
| Administrativa (altas y bajas, certificados, trámites…) | `secretariado@jmvesp.org` |
| Organización y consultas generales (estatutos, funcionamiento, actividades…) | `ecn@jmvesp.org` |

Quien pregunta recibe al momento un correo de confirmación con su duda y un
**número de referencia** (del tipo `D-2026-0001`). Los equipos gestionan y
contestan las dudas desde una app de **AppSheet**, y la respuesta le llega por
correo a quien preguntó. Todos los correos salen desde `no-reply@jmvesp.org`.

Esta carpeta está fuera de `docs/`, así que **no se publica en la web**: solo es
la guía para quien monte o mantenga el sistema.

```text
Web (GitHub Pages)            Apps Script (Codigo.gs)             Equipos
──────────────────            ───────────────────────             ───────
Formulario «¿Alguna duda?» ─▶ doPost: guarda la fila en Dudas ─▶ correo a la categoría
  (sin cuenta de JMV)           con su referencia y avisa              │
                                al equipo
Correo de quien preguntó ◀─── confirmación con la referencia           │
                                                                       ▼
                                                     App de AppSheet «Dudas web»:
                                                     escriben la respuesta y pulsan
                                                     «Marcar como respondida»
                                                                       │
Correo de quien preguntó ◀─ enviarRespuestas (cada 5 min) ◀────────────┘
```

## Por qué no es todo AppSheet

- **AppSheet exige iniciar sesión.** Con la licencia AppSheet Core incluida en
  Workspace, la app solo admite cuentas del dominio. Quien no es socio no podría
  ni abrirla.
- **AppSheet no envía correos fuera del dominio.** Con la seguridad de AppSheet
  Core activada (lo predeterminado), sus bots no pueden escribir a direcciones
  de fuera de jmvesp.org, así que no podrían contestar a un @gmail.com.
- **Los bots de AppSheet no saltan con filas escritas desde fuera.** Si una fila
  entra en la hoja por otra vía (en este caso, desde el script), AppSheet no se
  entera y no lanza el aviso.

Por eso la recepción y los correos los hace un Apps Script, y AppSheet queda
como herramienta interna de los equipos, que es donde más aporta.

---

## 1. La hoja de cálculo

1. En una **unidad compartida** de Drive (no en «Mi unidad» de una persona, para
   que nada dependa de quien la creó), cread una hoja de cálculo `Dudas web`.
2. Cread dos pestañas y copiad en cada una el contenido del CSV de esta carpeta
   que tiene su mismo nombre:
   - `Dudas`: solo la fila de cabeceras de [Dudas.csv](Dudas.csv).
   - `Categorias`: las cabeceras y las tres filas de [Categorias.csv](Categorias.csv).
3. En `Categorias`, columna `Gestores`, escribid los correos **personales**
   (`nombre@jmvesp.org`, separados por comas) de quienes contestan cada tipo de
   duda. Los grupos no sirven aquí: AppSheet compara este campo con el correo de
   quien abre la app, no con su pertenencia a un grupo.

Para cambiar a quién llega cada aviso, basta con editar la columna `Correo` de
`Categorias`, sin tocar el script, la app ni la web.

**No cambiéis** los nombres de las cabeceras ni los valores de la columna
`Categoria` (`Técnica`, `Administrativa`, `Organización`): el script y el
formulario de la web los usan tal cual. Sí podéis cambiar el orden de las
columnas.

## 2. El Apps Script

### 2.0 Qué cuenta ejecuta el script y desde dónde salen los correos

Son dos cosas distintas:

- **La cuenta que ejecuta el script:** `automatizaciones@jmvesp.org`, una
  cuenta de Workspace institucional, de nadie en concreto, para este script y
  los que vengan.
- **La dirección desde la que salen los correos:** `no-reply@jmvesp.org`, que
  es solo un **alias** de esa cuenta y no recibe correo.

El script funciona *como* la cuenta que hace la implementación de la aplicación
web y crea el activador: con su identidad escribe en la hoja y envía los
correos desde su Gmail. Por eso no debe ser la cuenta de una persona:

- **El sistema depende de esa persona.** Si deja la entidad y se suspende su
  cuenta, se paran el formulario, los avisos y las respuestas.
- **El script tiene permiso sobre su Gmail.** Es una pieza pública, a la que
  cualquiera puede enviar datos.
- **Su buzón se llena.** Las copias de todos los correos se le acumulan en
  *Enviados*.
- **No ve sus propios avisos en la bandeja de entrada.** Si está en un grupo
  destinatario, Gmail solo los deja en *Enviados*.

**Tampoco debe ser una cuenta de superadministrador** (`admin@`,
`administrador@`…). Google recomienda usarlas solo para administrar. Si el
permiso que se le da al script se viera comprometido, tendría detrás una cuenta
con control sobre todo el dominio.

Pasos:

1. admin.google.com → *Directorio → Usuarios → Añadir usuario* →
   `automatizaciones@jmvesp.org`, como usuario normal, sin privilegios de
   administrador. En la edición gratuita de Workspace para ONG no tiene coste.
2. En ese mismo usuario → *Información de usuario → Direcciones de correo
   alternativas* → añadir `no-reply`.
3. Dadle acceso de *Gestor de contenido* a la unidad compartida donde está la
   hoja `Dudas web`.
4. Guardad la contraseña donde guardéis las demás cuentas institucionales, y
   poned como verificación en dos pasos y correo de recuperación algo del
   equipo `webmaster`, no de una persona.
5. Entrando en Gmail con `automatizaciones@` → *Configuración → Ver todos los
   ajustes → Cuentas → Enviar como → Añadir otra dirección de correo* →
   nombre `JMV España`, dirección `no-reply@jmvesp.org`, con *Tratar como alias*
   marcado. Al ser un alias de la propia cuenta, no pide verificación.
6. Haced que `no-reply@` no reciba correo (ver «Que no reciba correo», más
   abajo).

Si el alias no está configurado, el script no falla: envía desde
`automatizaciones@` y deja un aviso en *Apps Script → Ejecuciones*.

#### Qué hay que hacer entrando con `automatizaciones@` y qué no

Apps Script no permite elegir con qué cuenta se ejecuta el script: siempre es
la de quien implementa y la de quien crea el activador. Por eso:

| Tarea | ¿Con qué cuenta? |
| --- | --- |
| Editar y guardar el código | La vuestra (basta con ser editor de la hoja) |
| Probar funciones desde el editor | La vuestra, pero ojo: se ejecutan como vosotros y los correos salen desde vuestra cuenta |
| Crear o actualizar la implementación (*Nueva versión*) | `automatizaciones@` |
| Crear o borrar el activador | `automatizaciones@` |
| Volver a autorizar permisos | `automatizaciones@` |

Para no tener que cerrar sesión cada vez, cread en Chrome un **perfil
aparte** con `automatizaciones@`, que se abre en otra ventana.

Para comprobar con qué cuenta se ejecuta, id a *Implementar → Gestionar
implementaciones*. Junto a *Ejecutar como* aparece el correo. Si al editar la
implementación con vuestra cuenta aparece la vuestra, al guardar pasaría a
ejecutarse como vosotros: cancelad y hacedlo desde `automatizaciones@`.

#### Que no reciba correo

Un filtro de Gmail no basta, porque el correo llega igualmente al buzón y solo
lo archiva o lo borra. Para que la dirección rechace los correos en el
servidor, antes de entrar, se crea una regla de enrutamiento:

admin.google.com → *Aplicaciones → Google Workspace → Gmail → Enrutamiento* →
*Enrutamiento* → **Configurar** (en la unidad organizativa principal):

1. **Descripción:** `no-reply no recibe correo`.
2. **Mensajes a los que afecta:** marcad *Entrantes* y *Interno: recepción*,
   para que se rechace tanto lo que llegue de fuera como lo que envíe alguien
   de jmvesp.org.
3. **Acción:** *Rechazar mensaje*, con este aviso personalizado:

   > Esta dirección solo envía avisos automáticos y no admite correos. Si
   > tienes una duda, responde al correo que te enviamos (te llegará al equipo
   > que la lleva) o usa el botón «¿Alguna duda?» de la web de documentación.

4. **Mostrar opciones → Filtro de sobre:** marcad *Solo afectar a destinatarios
   de sobre específicos* → *Dirección de correo única* → `no-reply@jmvesp.org`.
5. **Guardar.** Puede tardar hasta una hora en aplicarse.

Quien escriba a `no-reply@` recibe al momento un aviso de rechazo con ese
texto, y el correo nunca llega a entrar en el buzón. Esto no afecta al envío:
el script sigue mandando correos con normalidad. Las respuestas normales
tampoco se pierden, porque todos los correos llevan un «responder a» que no es
`no-reply@`. Como `no-reply` es un alias, solo se rechaza lo que va a esa
dirección: `automatizaciones@` sigue recibiendo con normalidad.

Un efecto secundario: si alguien escribe mal su correo en el formulario, esa
persona no recibirá la confirmación ni la respuesta. El aviso de «dirección
inexistente» puede acabar rechazado si vuelve a `no-reply@`, así que no contéis
con verlo. Si alguien no contesta en un tiempo razonable, revisad el correo que
escribió en la hoja.

### 2.1 Instalar el script

1. En la hoja: *Extensiones → Apps Script*. Borrad el contenido de `Código.gs`
   y pegad el de [Codigo.gs](Codigo.gs).
2. *Configuración del proyecto* (rueda dentada) → zona horaria **Europe/Madrid**.
3. **Implementar → Nueva implementación** → tipo *Aplicación web*:
   - *Ejecutar como*: **Yo**.
   - *Quién tiene acceso*: **Cualquier usuario**. Es lo que permite usar el
     formulario sin cuenta. Si esta opción no aparece, el administrador de
     Workspace tiene limitado el uso compartido fuera del dominio y hay que
     permitirlo en admin.google.com (Drive y Docs → Opciones para compartir).
   - Autorizad los permisos que pide (hoja de cálculo y Gmail; Gmail lo pide
     para poder enviar desde el alias `no-reply@`).
   - Copiad la **URL de la aplicación web**, que acaba en `/exec`.
4. En el editor, elegid la función `instalarActivador` en el desplegable y
   pulsad **Ejecutar** una sola vez. Crea el activador que cada 5 minutos envía
   las respuestas.
5. Cuando tengáis la app de AppSheet (sección 3), pegad su enlace en la
   constante `APP_DUDAS` del principio del script. Así el aviso al equipo
   incluye un enlace directo a la app.

### 2.2 Pasar el script de una cuenta a otra

Si el script ya está funcionando con la cuenta de una persona y se quiere pasar
a `automatizaciones@` (o a cualquier otra):

1. **Con la cuenta nueva:** abrid la hoja → *Extensiones → Apps Script* →
   **Implementar → Nueva implementación** con los mismos ajustes del paso 2.1.3.
   Saldrá una **URL nueva**.
2. **Con la cuenta nueva:** ejecutad `instalarActivador` (paso 2.1.4).
3. Poned la URL nueva en `dudas_endpoint` de `mkdocs.yml` y publicad la web.
4. **Con la cuenta antigua**, una vez publicada la web:
   - *Implementar → Gestionar implementaciones* → su implementación → **Archivar**.
   - *Activadores* (icono de reloj en el menú izquierdo) → borrad su activador
     de `enviarRespuestas`. Si no se borra, las respuestas seguirían saliendo
     también desde esa cuenta.
   - Si se le añadió el alias `no-reply`, quitádselo en admin.google.com.

El número de referencia no se reinicia: el contador se guarda en el propio
script, no en la cuenta.

**Si modificáis el script más adelante**, guardad y publicad los cambios en *Implementar →
Gestionar implementaciones → editar (lápiz) → Versión: nueva versión*. Así se
mantiene la misma URL. Una *Nueva implementación* crea otra URL distinta y la
web dejaría de funcionar hasta actualizarla.

### Protecciones que ya lleva

- **Campo trampa contra robots:** es un campo oculto que solo rellenan los
  robots; esos envíos se descartan sin avisar.
- **Límite de 25 dudas por hora entre todos los visitantes:** evita que una
  avalancha de spam agote la cuota de correos (1500 al día; cada duda gasta
  dos, el aviso y la confirmación, y una más al responderla). Se cambia en
  `MAX_DUDAS_POR_HORA`.
- **Límite de 3 dudas por hora desde una misma dirección:** como la
  confirmación se envía al correo que alguien escribe en el formulario, sin
  este límite se podría usar para llenar de correos el buzón de otra persona.
  Se cambia en `MAX_DUDAS_POR_CORREO`.
- **Validación de los datos:** comprueba la longitud de cada campo, que el
  correo tenga un formato válido y que la categoría exista en la hoja.
- **Protección contra fórmulas:** si un texto empieza por `=`, `+`, `-` o `@`, se
  guarda como texto para que la hoja no lo ejecute como fórmula.

## 3. La app de AppSheet (solo para los equipos)

Desde la hoja: *Extensiones → AppSheet → Crear una aplicación*. Añadid la otra
pestaña desde *Data → Add table*.

### 3.1 Tabla `Categorias`

| Columna | Tipo | Key | Label |
| --- | --- | --- | --- |
| Categoria | Text | ✔ | ✔ |
| Etiqueta | Text | | |
| Correo | Email | | |
| Gestores | EnumList (base Email, separador `,`) | | |

*Are updates allowed?*: **Read-only**. Esta tabla se edita en la hoja.

### 3.2 Tabla `Dudas`

*Are updates allowed?*: solo **Updates**. Las dudas las crea el script, no la
app, y no se borran, para que quede un historial.

| Columna | Tipo | Editable? | Notas |
| --- | --- | --- | --- |
| ID | Text | No | Key. Display name «Referencia». Es el número de referencia (`D-2026-0001`) que recibe quien pregunta. **Label desmarcado.** |
| Fecha | DateTime | No | |
| Correo | Email | No | Display name «Correo de quien pregunta». |
| Nombre | Name | No | |
| Categoria | Ref → `Categorias` | Sí | Editable para poder reasignar una duda mal clasificada. |
| Asunto | Text | No | **Label**: es el título con el que se ve cada duda en la app. Sin esto, AppSheet usa el ID. |
| Pregunta | LongText | No | |
| Pagina | Url | No | Display name «Página de la web». |
| Estado | Enum: `Pendiente`, `En curso`, `Respondida` | Sí | |
| Respuesta | LongText | Sí | Es lo que se envía a quien preguntó. *Required_If*: `CONTEXT("View") = "Responder"`. |
| RespondidoPor | Email | No | |
| FechaRespuesta | DateTime | No | |
| Notificado | DateTime | No | Display name «Respuesta enviada». La rellena el script al enviar. |

**Security filter** de `Dudas` (*Security → Security filters*), para que cada
equipo vea solo las dudas de su categoría:

```text
IN(
  USEREMAIL(),
  SPLIT(SUBSTITUTE(CONCATENATE([Categoria].[Gestores]), " ", ""), ",")
)
```

La fórmula sencilla, `IN(USEREMAIL(), [Categoria].[Gestores])`, solo funciona si
`Gestores` es de tipo EnumList. Al importar la hoja, AppSheet suele detectarla
como Text o Email, y entonces da el error *Parameter 2 of function IN is of the
wrong type*. Esta versión convierte el campo en texto, quita los espacios y lo
parte por las comas, así que funciona sea cual sea el tipo de la columna. No se
usa `CONTAINS()` porque busca trozos de texto: `ana@jmvesp.org` daría acceso a
las dudas de `juana@jmvesp.org`.

Si una persona está en `Gestores` de varias categorías, verá las dudas de todas
ellas.

### 3.3 Slice para responder

*Data → Slices → New slice*:

- **Name:** `DudasResponder`
- **Source table:** `Dudas`
- **Slice columns:** solo `Respuesta`. El formulario de responder mostrará solo
  ese campo; la pregunta ya se ha leído en el detalle.
- **Update mode:** solo *Updates*.

### 3.4 Vistas

| Vista | Tipo | Datos | Posición | Notas |
| --- | --- | --- | --- | --- |
| Bandeja | Table | Dudas | Primary | *Starting view*. Group by `Estado`, orden por `Fecha` descendente. *Column order*: `ID`, `Fecha`, `Asunto`, `Nombre`, `Categoria`, `Estado`. |
| Dudas_Detail | Detail | Dudas | (la crea AppSheet) | Es la que se abre al pulsar una duda en la Bandeja. |
| Responder | Form | DudasResponder | Ref | *Behavior → Event actions → Form Saved*: `Marcar como respondida`. |

### 3.5 Acciones

Crear las dos en *Actions → New action*, tabla `Dudas`, **en este orden** (la
segunda usa la primera).

**«Marcar como respondida»**: la ejecuta sola el formulario al guardar, así que
no necesita botón propio.

- **Do this:** *Data: set the values of some columns in this row*
  - `Estado` = `"Respondida"`
  - `RespondidoPor` = `USEREMAIL()`
  - `FechaRespuesta` = `NOW()`
- **Only if this condition is true:** `ISNOTBLANK([Respuesta])`
- **Position:** Hide.

**«Responder»**: es el botón que ve el gestor.

- **Do this:** *App: go to another view within this app*
- **Target:** `LINKTOROW([ID], "Responder")`
- **Only if this condition is true:** `[Estado] <> "Respondida"`
- **Position:** Prominent. Si queréis que salga también como icono en cada fila
  de la Bandeja, marcad además *Display inline*. Icono: `reply`.

El flujo para quien contesta es este:

1. En «Bandeja», pulsa la duda: se abre su detalle con la pregunta completa.
2. Pulsa **Responder**, escribe la respuesta y guarda.
3. La duda pasa sola a `Respondida`. En menos de 5 minutos, el script envía la
   respuesta y rellena «Respuesta enviada».

Si alguien prefiere contestar directamente desde Gmail (el aviso lleva a quien
preguntó como Reply-To), luego debe cambiar a mano el `Estado` a `Respondida` en la
app, **dejando `Respuesta` vacía**. El script solo envía cuando hay una respuesta
escrita, así que no se manda un segundo correo.

### 3.6 Compartir

*Manage → Deploy → Move app to deployed state*. Después, *Share*: compartid la
app con los grupos de los tres equipos (o con quienes figuren en `Gestores`).
No hace falta compartir la hoja de cálculo.

## 4. Conectar la web

En `mkdocs.yml`, sección `extra:`, sustituid el texto de ejemplo por la URL de la
aplicación web del paso 2.3:

```yaml
extra:
  dudas_endpoint: https://script.google.com/macros/s/<id>/exec
```

El formulario está en `overrides/main.html` y el envío en `docs/assets/extra.js`.
Si algún día cambiáis las categorías, los `value` de los botones de opción del
formulario tienen que coincidir con la columna `Categoria` de la hoja.

## 5. Pruebas antes de dar por bueno el sistema

- [ ] Desde una guía de la web, en una ventana de incógnito y **sin iniciar
      sesión**, enviar una duda. Debe aparecer «¡Recibido!».
- [ ] Al correo escrito en el formulario llega la confirmación, desde
      `no-reply@jmvesp.org`, con la duda y el mismo número de referencia que
      muestra la web.
- [ ] Contestar a esa confirmación: la respuesta debe llegar al equipo de la
      categoría, no a `no-reply@`.
- [ ] Escribir directamente a `no-reply@jmvesp.org`, desde fuera y desde una
      cuenta de jmvesp.org: en ambos casos debe volver al momento el aviso de
      rechazo, y en el buzón de `no-reply@` no debe aparecer nada.
- [ ] Enviar una duda de cada categoría y comprobar que el aviso llega a
      `gestiones.grupo@`, `secretariado@` y `ecn@` respectivamente, y que en la
      hoja aparece la fila con la página desde la que se envió.
- [ ] En AppSheet, cada gestor ve solo las dudas de su categoría.
- [ ] Contestar una duda enviada desde un @gmail.com y pulsar **Marcar como
      respondida**. En menos de 5 minutos debe llegar la respuesta a ese
      @gmail.com y rellenarse «Respuesta enviada».
- [ ] Contestar a ese correo de respuesta desde el @gmail.com: debe llegar al
      correo del equipo de la categoría.
- [ ] Con la URL del script mal escrita en `mkdocs.yml` (en local), el
      formulario debe mostrar el mensaje de error con la dirección alternativa.

## 6. Si algo no funciona

**La duda llega a la hoja pero no llega el aviso por correo.** Revisad, por este
orden:

1. **Enviados de la cuenta que implementó el script.** Si esa cuenta es miembro
   del grupo destinatario (por ejemplo, `gestiones.grupo@`), Gmail no le pone
   en la bandeja de entrada su propia copia: el correo solo aparece en
   *Enviados*. El resto de miembros sí lo reciben.
2. **Apps Script → Ejecuciones** (icono de lista en el menú izquierdo). Cada
   envío del formulario aparece como una ejecución de `doPost`. Si está en rojo,
   al abrirla se ve el error.
3. **Moderación del grupo.** En groups.google.com → el grupo → *Conversaciones
   pendientes*. Si el grupo solo acepta mensajes de sus miembros, el aviso se
   queda retenido.
4. **Spam** de quien debía recibirlo.

**Cada duda aparece con su ID como título.** Falta marcar `Asunto` como *Label*
en la tabla `Dudas` (sección 3.2).

**No aparece el botón «Responder».** Solo sale en el detalle de la duda (o en la
fila, si tiene *Display inline*) y solo mientras no esté `Respondida`.
Comprobad también que la tabla `Dudas` tiene permitido *Updates*.
