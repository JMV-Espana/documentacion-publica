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
// El sitio es estático (GitHub Pages), así que el formulario se envía a un Apps
// Script de Google (la dirección está en extra.dudas_endpoint de mkdocs.yml). El
// script guarda la duda en la hoja de cálculo que los equipos gestionan desde
// AppSheet y avisa por correo al que corresponda. No hace falta cuenta de JMV
// para usarlo. Ver appsheet/README.md.

(function () {
  // El navegador muestra los avisos de "campo obligatorio" en su propio idioma,
  // no en el de la página: quien lo tenga en inglés vería "Please fill out this
  // field" en una web en español. Por eso se sustituyen por estos.
  var AVISOS = {
    categoria: "Elige sobre qué es tu duda.",
    nombre: "Escribe tu nombre.",
    correo: "Escribe tu correo electrónico para que podamos contestarte, por ejemplo nombre@gmail.com",
    asunto: "Escribe un asunto.",
    pregunta: "Cuéntanos tu duda."
  };

  // "invalid" no burbujea, así que se escucha en la fase de captura.
  document.addEventListener("invalid", function (evento) {
    var campo = evento.target;
    if (campo.form && campo.form.id === "jmv-form-dudas" && AVISOS[campo.name]) {
      campo.setCustomValidity(AVISOS[campo.name]);
    }
  }, true);

  // Un mensaje personalizado deja el campo marcado como inválido hasta que se
  // borra; sin esto seguiría rechazándolo aunque el usuario ya lo hubiera
  // corregido. En los radio hay que limpiar todo el grupo, no solo el marcado.
  function limpiarAviso(evento) {
    var campo = evento.target;
    if (!campo.form || campo.form.id !== "jmv-form-dudas") {
      return;
    }
    campo.form.querySelectorAll("[name='" + campo.name + "']").forEach(function (otro) {
      otro.setCustomValidity("");
    });
  }
  document.addEventListener("input", limpiarAviso);
  document.addEventListener("change", limpiarAviso);

  function mostrarEstado(texto, tipo) {
    var estado = document.getElementById("jmv-dudas-estado");
    estado.textContent = texto;
    estado.className = "jmv-dialogo__estado" + (tipo ? " jmv-dialogo__estado--" + tipo : "");
  }

  // Alterna entre el formulario y el panel de "¡Enviado, gracias!". El
  // aria-labelledby del diálogo se cambia con ellos para que los lectores de
  // pantalla anuncien el título que se ve.
  function mostrarHecho(form, hecho) {
    var dialogo = form.closest("dialog");
    var panel = document.getElementById("jmv-dudas-hecho");
    form.hidden = hecho;
    panel.hidden = !hecho;
    dialogo.setAttribute("aria-labelledby", hecho ? "jmv-dudas-hecho-titulo" : "jmv-dialogo-titulo");
    if (hecho) {
      document.getElementById("jmv-dudas-hecho-titulo").focus();
    }
  }

  // Al cerrar tras un envío, el diálogo se deja listo para otra duda: se vacía
  // la pregunta pero se conservan nombre y correo, por si la misma persona
  // quiere preguntar otra cosa desde la misma página. "close" no burbujea, así
  // que se escucha en la fase de captura.
  document.addEventListener("close", function (evento) {
    if (evento.target.id !== "jmv-dialogo-dudas" ||
        document.getElementById("jmv-dudas-hecho").hidden) {
      return;
    }
    var form = document.getElementById("jmv-form-dudas");
    form.elements.pregunta.value = "";
    mostrarEstado("");
    mostrarHecho(form, false);
  }, true);

  document.addEventListener("submit", function (evento) {
    var form = evento.target;
    if (form.id !== "jmv-form-dudas") {
      return;
    }
    evento.preventDefault();

    var enviar = document.getElementById("jmv-enviar");
    var datos = new URLSearchParams(new FormData(form));
    datos.append("pagina", window.location.href);

    enviar.disabled = true;
    mostrarEstado("Enviando…");

    // Se envía como formulario (application/x-www-form-urlencoded) y no como
    // JSON: así es una petición "simple" que no necesita la comprobación previa
    // de CORS, que Apps Script no sabe contestar.
    fetch(form.action, { method: "POST", body: datos })
      .then(function (respuesta) {
        return respuesta.json();
      })
      .then(function (resultado) {
        if (!resultado.ok) {
          throw new Error(resultado.error || "error");
        }
        // La referencia también va en el correo de confirmación; aquí se
        // muestra por si ese correo tarda o acaba en spam.
        document.getElementById("jmv-dudas-hecho-texto").textContent =
          (resultado.referencia ? "Tu número de referencia es " + resultado.referencia + ". " : "") +
          "Te hemos enviado una confirmación a " + form.elements.correo.value +
          " y te contestaremos allí lo antes posible.";
        mostrarHecho(form, true);
      })
      .catch(function () {
        mostrarEstado(
          "No hemos podido enviar tu duda. Inténtalo de nuevo en un rato o escribe directamente a ecn@jmvesp.org.",
          "error"
        );
      })
      .then(function () {
        enviar.disabled = false;
      });
  });
})();
