const botones = document.querySelectorAll(".btn");
const vistas = document.querySelectorAll(".vista");
const botonesVolver = document.querySelectorAll(".btn-volver");

function cambiarVista(vistaDestino) {

  console.log("Cambiando a:", vistaDestino);

  vistas.forEach(vista => {
    vista.classList.remove("activa");
  });

  const nuevaVista = document.getElementById("vista-" + vistaDestino);

  if (nuevaVista) {
    nuevaVista.classList.add("activa");
  }
}

botones.forEach(boton => {
  boton.addEventListener("click", function () {
    const vista = boton.getAttribute("data-vista");
    cambiarVista(vista);
  });
});

botonesVolver.forEach(boton => {
  boton.addEventListener("click", function () {
    cambiarVista("inicio");
  });
});