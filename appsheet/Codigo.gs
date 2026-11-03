/**
 * Dudas de la web de documentación de JMV España.
 *
 * Va vinculado a la hoja de cálculo "Dudas web" (Extensiones → Apps Script) y
 * hace de cartero entre la web, la hoja y el correo:
 *
 *   - doPost: recibe el formulario "¿Alguna duda?" de la web (sin cuenta de JMV),
 *     guarda la duda en la pestaña Dudas con un número de referencia, avisa al
 *     equipo de su categoría y manda una confirmación a quien pregunta.
 *   - enviarRespuestas: cada 5 minutos, manda a quien preguntó las respuestas
 *     que los equipos han marcado como respondidas desde AppSheet.
 *
 * Los correos se mandan desde aquí y no desde los bots de AppSheet porque
 * AppSheet no ve las filas que escribe este script (no lanzaría el aviso) y,
 * con la seguridad de AppSheet Core, tampoco puede escribir a correos de fuera
 * de jmvesp.org (no podría contestar a quien no es socio).
 *
 * Montaje paso a paso: appsheet/README.md del repo documentacion-publica.
 */

var HOJA_DUDAS = "Dudas";
var HOJA_CATEGORIAS = "Categorias";

// Enlace de la app de AppSheet que usan los equipos, para incluirlo en el aviso.
var APP_DUDAS = "https://www.appsheet.com/start/PEGAR-AQUI-EL-ID-DE-LA-APP";

// Tope de dudas por hora entre todos los visitantes. Frena una avalancha de spam
// antes de que agote la cuota diaria de correos de Apps Script (1500 al día);
// cada duda gasta dos (aviso y confirmación) y una más al responderla.
var MAX_DUDAS_POR_HORA = 25;

// Tope de dudas por hora desde una misma dirección. Como cada duda manda una
// confirmación al correo que se escribe en el formulario, sin esto alguien
// podría usarlo para llenar de correos el buzón de otra persona.
var MAX_DUDAS_POR_CORREO = 3;

// Dirección desde la que salen los correos. Tiene que ser un alias de la cuenta
// que implementa el script y crea el activador (automatizaciones@), configurado
// en su Gmail en "Enviar como", o bien esa misma cuenta (ver README). Si no es
// ninguna de las dos cosas, los correos salen desde la cuenta que ejecuta el
// script y queda un aviso en Ejecuciones.
//
// No se usa la opción noReply de Apps Script porque anula el replyTo, y los dos
// correos dependen de él para que las respuestas lleguen a quien deben.
var REMITENTE = "no-reply@jmvesp.org";
var NOMBRE_REMITENTE = "JMV España";

// ---------------------------------------------------------------------------
// Recepción de dudas desde la web
// ---------------------------------------------------------------------------

function doPost(e) {
  try {
    var p = e.parameter;

    // Campo trampa: solo lo rellenan los robots. Se responde "ok" para que no
    // sepan que se les ha descartado y no prueben otra cosa.
    if (p.web) {
      return responder({ ok: true });
    }

    var duda = {
      nombre: limpiar(p.nombre, 100),
      correo: limpiar(p.correo, 200),
      categoria: limpiar(p.categoria, 50),
      asunto: limpiar(p.asunto, 200),
      pregunta: limpiar(p.pregunta, 5000),
      pagina: limpiar(p.pagina, 500)
    };

    if (!duda.nombre || !duda.asunto || !duda.pregunta ||
        !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(duda.correo)) {
      return responder({ ok: false, error: "datos" });
    }

    var categoria = buscarCategoria(duda.categoria);
    if (!categoria) {
      return responder({ ok: false, error: "categoria" });
    }

    // El bloqueo evita que dos envíos simultáneos se pisen el contador del
    // límite o la fila de la hoja.
    var bloqueo = LockService.getScriptLock();
    bloqueo.waitLock(10000);
    try {
      if (!dentroDelLimite("global", MAX_DUDAS_POR_HORA) ||
          !dentroDelLimite(duda.correo.toLowerCase(), MAX_DUDAS_POR_CORREO)) {
        return responder({ ok: false, error: "limite" });
      }
      var referencia = nuevaReferencia();
      anadirFila(HOJA_DUDAS, {
        ID: referencia,
        Fecha: new Date(),
        Correo: duda.correo,
        Nombre: duda.nombre,
        Categoria: categoria.nombre,
        Asunto: duda.asunto,
        Pregunta: duda.pregunta,
        Pagina: duda.pagina,
        Estado: "Pendiente"
      });
    } finally {
      bloqueo.releaseLock();
    }

    // Reply-To es quien pregunta: si el equipo contesta directamente desde
    // Gmail, la respuesta le llega a esa persona. Aun así conviene contestar
    // desde AppSheet, para que la respuesta quede registrada en la hoja.
    enviarCorreo({
      to: categoria.correo,
      replyTo: duda.correo,
      name: "Dudas web " + NOMBRE_REMITENTE,
      subject: "[" + categoria.nombre + "] " + referencia + " · " + duda.asunto,
      body:
        duda.nombre + " (" + duda.correo + ") ha enviado una duda desde la web de documentación.\n\n" +
        "Referencia: " + referencia + "\n" +
        "Categoría: " + categoria.nombre + "\n" +
        "Página: " + duda.pagina + "\n\n" +
        duda.pregunta + "\n\n" +
        "---\n" +
        "Contesta desde la app de dudas: " + APP_DUDAS + "\n" +
        "(Pulsa «Responder», escribe la respuesta y guarda: se le enviará sola.)"
    });

    // Reply-To es el equipo: si quien pregunta quiere añadir algo, contestando
    // a la confirmación le llega a quien va a responderle.
    enviarCorreo({
      to: duda.correo,
      replyTo: categoria.correo,
      name: NOMBRE_REMITENTE,
      subject: "Hemos recibido tu duda (" + referencia + ")",
      body:
        "Hola, " + duda.nombre + ":\n\n" +
        "Hemos recibido tu duda y se la hemos pasado al equipo que mejor puede " +
        "ayudarte. Te contestaremos a este correo lo antes posible.\n\n" +
        "Tu número de referencia es " + referencia + ". Si necesitas escribirnos " +
        "sobre esta duda, indícalo para que podamos localizarla.\n\n" +
        "---\n" +
        "Asunto: " + duda.asunto + "\n" +
        "Categoría: " + categoria.nombre + "\n" +
        "Página: " + duda.pagina + "\n\n" +
        duda.pregunta + "\n\n" +
        "---\n" +
        "Un saludo,\n" + NOMBRE_REMITENTE + "\n\n" +
        "Si no has enviado tú esta duda, puedes ignorar este correo."
    });

    return responder({ ok: true, referencia: referencia });
  } catch (error) {
    console.error(error);
    return responder({ ok: false, error: "interno" });
  }
}

// ---------------------------------------------------------------------------
// Envío de respuestas (activador cada 5 minutos)
// ---------------------------------------------------------------------------

function enviarRespuestas() {
  var hoja = SpreadsheetApp.getActive().getSheetByName(HOJA_DUDAS);
  var valores = hoja.getDataRange().getValues();
  var col = indicesDeCabecera(valores[0]);

  for (var i = 1; i < valores.length; i++) {
    var fila = valores[i];
    if (fila[col.Estado] !== "Respondida" || !fila[col.Respuesta] || fila[col.Notificado]) {
      continue;
    }

    var categoria = buscarCategoria(fila[col.Categoria]);
    enviarCorreo({
      to: fila[col.Correo],
      // Si quien preguntó quiere seguir la conversación, su respuesta va al
      // equipo de la categoría y no a la cuenta que ejecuta este script.
      replyTo: categoria ? categoria.correo : "",
      name: NOMBRE_REMITENTE,
      subject: "Respuesta a tu duda " + fila[col.ID] + ": " + fila[col.Asunto],
      body:
        "Hola, " + fila[col.Nombre] + ":\n\n" +
        fila[col.Respuesta] + "\n\n" +
        "Un saludo,\n" + NOMBRE_REMITENTE + "\n\n" +
        "---\n" +
        "Tu pregunta:\n" + fila[col.Pregunta]
    });

    // Se marca fila a fila, justo después de enviar: si el script se corta a
    // mitad, la siguiente ejecución no repite los correos ya mandados.
    hoja.getRange(i + 1, col.Notificado + 1).setValue(new Date());
  }
}

/**
 * Crea el activador de enviarRespuestas. Ejecutadlo UNA vez a mano desde el
 * editor de Apps Script; si ya existe, no crea otro.
 */
function instalarActivador() {
  var yaExiste = ScriptApp.getProjectTriggers().some(function (activador) {
    return activador.getHandlerFunction() === "enviarRespuestas";
  });
  if (!yaExiste) {
    ScriptApp.newTrigger("enviarRespuestas").timeBased().everyMinutes(5).create();
  }
}

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------

/**
 * Envía desde el alias REMITENTE con GmailApp, porque MailApp no permite elegir
 * la dirección de envío. Recibe los mismos campos que MailApp.sendEmail
 * (to, subject, body, replyTo, name).
 */
function enviarCorreo(mensaje) {
  var opciones = { name: mensaje.name };
  if (mensaje.replyTo) {
    opciones.replyTo = mensaje.replyTo;
  }
  // Si el script se ejecuta con la propia cuenta del remitente, ya sale desde
  // ella y no hace falta alias.
  if (Session.getEffectiveUser().getEmail() === REMITENTE) {
    // Nada que hacer.
  } else if (GmailApp.getAliases().indexOf(REMITENTE) !== -1) {
    opciones.from = REMITENTE;
  } else {
    console.warn(REMITENTE + " no está en \"Enviar como\" de esta cuenta: el correo sale desde ella.");
  }
  GmailApp.sendEmail(mensaje.to, mensaje.subject, mensaje.body, opciones);
}

function responder(objeto) {
  return ContentService
    .createTextOutput(JSON.stringify(objeto))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Recorta el texto y neutraliza las fórmulas: si alguien escribe algo que
 * empieza por "=", "+", "-" o "@", la hoja lo ejecutaría como fórmula al
 * guardarlo. El apóstrofo delante hace que se guarde como texto.
 */
function limpiar(valor, maximo) {
  var texto = String(valor || "").trim().slice(0, maximo);
  return /^[=+\-@]/.test(texto) ? "'" + texto : texto;
}

function buscarCategoria(nombre) {
  var valores = SpreadsheetApp.getActive().getSheetByName(HOJA_CATEGORIAS)
    .getDataRange().getValues();
  var col = indicesDeCabecera(valores[0]);
  for (var i = 1; i < valores.length; i++) {
    if (valores[i][col.Categoria] === nombre) {
      return { nombre: nombre, correo: valores[i][col.Correo] };
    }
  }
  return null;
}

/**
 * Cuenta los envíos de la hora en curso bajo "quien" (todos los visitantes o
 * una dirección de correo) y dice si todavía no se ha llegado a "maximo".
 */
function dentroDelLimite(quien, maximo) {
  var cache = CacheService.getScriptCache();
  var clave = "dudas-" + Utilities.formatDate(new Date(), "Europe/Madrid", "yyyyMMddHH") + "-" + quien;
  var enviadas = Number(cache.get(clave) || 0);
  if (enviadas >= maximo) {
    return false;
  }
  cache.put(clave, String(enviadas + 1), 3600);
  return true;
}

/**
 * Devuelve la siguiente referencia del año, del tipo D-2026-0001. El contador se
 * guarda en las propiedades del script (no se calcula contando filas) para que
 * nunca se repita aunque alguien borre filas de la hoja. Hay que llamarla con
 * el bloqueo tomado.
 */
function nuevaReferencia() {
  var anio = Utilities.formatDate(new Date(), "Europe/Madrid", "yyyy");
  var propiedades = PropertiesService.getScriptProperties();
  var clave = "contador-" + anio;
  var numero = Number(propiedades.getProperty(clave) || 0) + 1;
  propiedades.setProperty(clave, String(numero));
  return "D-" + anio + "-" + String(numero).padStart(4, "0");
}

/**
 * Añade una fila colocando cada valor bajo su cabecera, para que reordenar o
 * añadir columnas en la hoja (o en AppSheet) no descoloque los datos.
 */
function anadirFila(nombreHoja, datos) {
  var hoja = SpreadsheetApp.getActive().getSheetByName(nombreHoja);
  var cabeceras = hoja.getRange(1, 1, 1, hoja.getLastColumn()).getValues()[0];
  hoja.appendRow(cabeceras.map(function (cabecera) {
    return cabecera in datos ? datos[cabecera] : "";
  }));
}

function indicesDeCabecera(cabeceras) {
  var indices = {};
  cabeceras.forEach(function (cabecera, i) {
    indices[cabecera] = i;
  });
  return indices;
}
