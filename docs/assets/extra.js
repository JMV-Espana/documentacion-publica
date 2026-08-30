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
