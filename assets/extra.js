// El recuadro de búsqueda de la página de inicio es un <label> asociado al
// checkbox #__search de Material, así que al pulsarlo el buscador se abre solo.
// Lo que no hace Material es enfocar el campo: solo lo enfoca cuando la búsqueda
// se abre desde su propio botón de la cabecera. Sin esto habría que pulsar dos
// veces, y en el móvil no aparecería el teclado.
//
// El listener va sobre document (delegación) para que siga funcionando aunque el
// contenido de la página se reemplace.
document.addEventListener("click", function (evento) {
  if (!evento.target.closest(".jmv-buscador")) {
    return;
  }

  // Se espera un instante: el foco se pierde si se pide antes de que Material
  // termine de abrir y montar el panel de búsqueda.
  setTimeout(function () {
    var campo = document.querySelector(".md-search__input");
    if (campo) {
      campo.focus();
    }
  }, 50);
});

// ---------------------------------------------------------------------------
// Formulario de dudas del final de cada guía
// ---------------------------------------------------------------------------
// El sitio es estático (GitHub Pages), así que no hay servidor que pueda enviar
// correos. El formulario no envía nada: compone un enlace mailto: con el
// destinatario, el asunto y el cuerpo ya rellenos, y deja que sea el programa de
// correo del propio usuario quien lo mande. Así no hacen falta servicios de
// terceros ni pasa por ningún sitio el contenido del mensaje.

(function () {
  function destinoElegido() {
    var marcado = document.querySelector("input[name='jmv-destino']:checked");
    return marcado ? marcado.value : "gestiones.grupo@jmvesp.org";
  }

  // Mantiene al día la dirección que se muestra en el aviso de "si no se abre
  // nada", para que quien tenga que copiarla a mano copie la correcta.
  function refrescarAviso() {
    document.querySelectorAll(".jmv-dialogo__destino").forEach(function (nodo) {
      nodo.textContent = destinoElegido();
    });
  }

  document.addEventListener("change", function (evento) {
    if (evento.target.name === "jmv-destino") {
      refrescarAviso();
    }
  });

  // Un mensaje personalizado deja el campo marcado como inválido hasta que se
  // borra; sin esto seguiría rechazándolo aunque el usuario ya lo hubiera
  // corregido.
  document.addEventListener("input", function (evento) {
    if (evento.target.id === "jmv-remitente") {
      evento.target.setCustomValidity("");
    }
  });

  document.addEventListener("click", function (evento) {
    if (!evento.target.closest("#jmv-enviar")) {
      return;
    }

    var remitente = document.getElementById("jmv-remitente");
    var asunto = document.getElementById("jmv-asunto");
    var mensaje = document.getElementById("jmv-mensaje");

    // El navegador no valida solo porque el botón es type="button": si fuera
    // submit, cerraría el diálogo (method="dialog") antes de abrir el correo.
    //
    // El mensaje se pone a mano porque el nativo sale en el idioma del
    // navegador, no en el de la página: quien tenga el navegador en inglés
    // vería "Please include an '@'..." en una web en español.
    if (!remitente.checkValidity()) {
      remitente.setCustomValidity(
        "Escribe tu correo electrónico para que podamos contestarte, por ejemplo nombre@jmvesp.org"
      );
      remitente.reportValidity();
      return;
    }

    // El remitente va también en el cuerpo: el "De" del correo lo pone el
    // programa del usuario, que puede ser una cuenta personal distinta de la
    // que ha escrito aquí, y quien responda necesita saber a dónde contestar.
    var cuerpo =
      (mensaje.value || "") +
      "\n\n---\n" +
      "Escribe: " + remitente.value + "\n" +
      "Página: " + window.location.href;

    var enlace =
      "mailto:" + encodeURIComponent(destinoElegido()) +
      "?subject=" + encodeURIComponent(asunto.value) +
      "&body=" + encodeURIComponent(cuerpo);

    // Se abre pinchando un <a> en vez de asignando window.location: para
    // esquemas como mailto: es más fiable y no deja la página en un estado raro
    // si el sistema no tiene programa de correo asociado.
    var ancla = document.createElement("a");
    ancla.href = enlace;
    ancla.click();

    document.getElementById("jmv-dialogo-dudas").close();
  });

  refrescarAviso();
})();
