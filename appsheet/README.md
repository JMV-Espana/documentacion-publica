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

Los equipos gestionan y contestan las dudas desde una app de **AppSheet**, y la
respuesta le llega por correo a quien preguntó.

Esta carpeta está fuera de `docs/`, así que **no se publica en la web**: solo es
la guía para quien monte o mantenga el sistema.

```text
Web (GitHub Pages)            Apps Script (Codigo.gs)             Equipos
──────────────────            ───────────────────────             ───────
Formulario «¿Alguna duda?» ─▶ doPost: guarda la fila en Dudas ─▶ correo a la categoría
  (sin cuenta de JMV)           y avisa al equipo                      │
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

Hacedlo con una **cuenta institucional** (no personal), porque los correos
salen desde la dirección de quien implementa el script.

1. En la hoja: *Extensiones → Apps Script*. Borrad el contenido de `Código.gs`
   y pegad el de [Codigo.gs](Codigo.gs).
2. *Configuración del proyecto* (rueda dentada) → zona horaria **Europe/Madrid**.
3. **Implementar → Nueva implementación** → tipo *Aplicación web*:
   - *Ejecutar como*: **Yo**.
   - *Quién tiene acceso*: **Cualquier usuario**. Es lo que permite usar el
     formulario sin cuenta. Si esta opción no aparece, el administrador de
     Workspace tiene limitado el uso compartido fuera del dominio y hay que
     permitirlo en admin.google.com (Drive y Docs → Opciones para compartir).
   - Autorizad los permisos que pide (hoja de cálculo y envío de correo).
   - Copiad la **URL de la aplicación web**, que acaba en `/exec`.
4. En el editor, elegid la función `instalarActivador` en el desplegable y
   pulsad **Ejecutar** una sola vez. Crea el activador que cada 5 minutos envía
   las respuestas.
5. Cuando tengáis la app de AppSheet (sección 3), pegad su enlace en la
   constante `APP_DUDAS` del principio del script. Así el aviso al equipo
   incluye un enlace directo a la app.

**Si modificáis el script más adelante**, publicad los cambios en *Implementar →
Gestionar implementaciones → editar (lápiz) → Versión: nueva versión*. Así se
mantiene la misma URL. Una *Nueva implementación* crea otra URL distinta y la
web dejaría de funcionar hasta actualizarla.

### Protecciones que ya lleva

- **Campo trampa contra robots:** es un campo oculto que solo rellenan los
  robots; esos envíos se descartan sin avisar.
- **Límite de 30 dudas por hora entre todos los visitantes:** evita que una
  avalancha de spam agote la cuota de correos (1500 al día). Se cambia en
  `MAX_DUDAS_POR_HORA`.
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
| ID | Text | No | Key. Oculta. |
| Fecha | DateTime | No | |
| Correo | Email | No | Display name «Correo de quien pregunta». |
| Nombre | Name | No | |
| Categoria | Ref → `Categorias` | Sí | Editable para poder reasignar una duda mal clasificada. |
| Asunto | Text | No | |
| Pregunta | LongText | No | |
| Pagina | Url | No | Display name «Página de la web». |
| Estado | Enum: `Pendiente`, `En curso`, `Respondida` | Sí | |
| Respuesta | LongText | Sí | Es lo que se envía a quien preguntó. |
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

### 3.3 Vistas

| Vista | Tipo | Datos | Notas |
| --- | --- | --- | --- |
| Bandeja | Table | Dudas | *Starting view*. Group by `Estado`, orden por `Fecha` descendente. |
| Detalle | Detail | Dudas | La que crea AppSheet por defecto. |

### 3.4 Acción «Marcar como respondida»

*Actions → New action*, tabla `Dudas`:

- **Do this:** *Data: set the values of some columns in this row*
  - `Estado` = `"Respondida"`
  - `RespondidoPor` = `USEREMAIL()`
  - `FechaRespuesta` = `NOW()`
- **Only if this condition is true:**
  `AND([Estado] <> "Respondida", ISNOTBLANK([Respuesta]))`
- **Position:** Prominent. Icono: `check`.

El flujo para quien contesta es este: abre la duda en «Bandeja», la edita,
escribe la respuesta, guarda y pulsa **Marcar como respondida**. En menos de 5
minutos, el script envía la respuesta y rellena «Respuesta enviada».

Si alguien prefiere contestar directamente desde Gmail (el aviso lleva a quien
preguntó como Reply-To), luego debe cambiar a mano el `Estado` a `Respondida` en la
app, **dejando `Respuesta` vacía**. El script solo envía cuando hay una respuesta
escrita, así que no se manda un segundo correo.

### 3.5 Compartir

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
