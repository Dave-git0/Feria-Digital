import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import {
  getAI,
  getGenerativeModel,
  GoogleAIBackend
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-ai.js";

// =========================
// CONFIGURACIÓN DE FIREBASE
// =========================
const firebaseConfig = {
  apiKey: "AIzaSyB7GMIVsw7hP1ZRK3O-S1Mfx8nCJayPhGI",
  authDomain: "feria-digital-35226.firebaseapp.com",
  projectId: "feria-digital-35226",
  storageBucket: "feria-digital-35226.firebasestorage.app",
  messagingSenderId: "370533804605",
  appId: "1:370533804605:web:481fa9af6ee78315149854"
};

// =========================
// INICIALIZAR FIREBASE
// =========================
const app = initializeApp(firebaseConfig);

// Inicializa Firebase AI Logic usando Gemini Developer API
const ai = getAI(app, { backend: new GoogleAIBackend() });

// Usa un modelo vigente para texto
const model = getGenerativeModel(ai, {
  model: "gemini-2.5-flash-lite"
});

// =========================
// CUANDO CARGA EL HTML
// =========================
document.addEventListener("DOMContentLoaded"), () =>
  console.log("HTML cargado correctamente ✅");
  console.log("Firebase iniciado ✅", app);

  // Elementos generales que ya tenías
  const botones = document.querySelectorAll(".btn");
  const vistas = document.querySelectorAll(".vista");
  const botonesVolver = document.querySelectorAll(".btn-volver");

  // Elementos del chatbot
  const btnEnviar = document.getElementById("btn-enviar");
  const input = document.getElementById("user-input");
  const chatBox = document.getElementById("chat-box");

  if (!btnEnviar || !input || !chatBox) {
    console.warn("No se encontraron los elementos del chatbot en esta página.");
    return;
  }

  function agregarMensaje(texto, tipo) {
    const mensajeDiv = document.createElement("div");
    mensajeDiv.classList.add("mensaje", tipo);
    mensajeDiv.textContent = texto;
    chatBox.appendChild(mensajeDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
  }

  function crearBurbujaTemporal(texto = "Pensando...") {
    const mensajeDiv = document.createElement("div");
    mensajeDiv.classList.add("mensaje", "bot");
    mensajeDiv.textContent = texto;
    chatBox.appendChild(mensajeDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
    return mensajeDiv;
  }

   async function enviarMensaje() {
  const mensaje = input.value.trim();
  if (mensaje === "") return;

  // Mostrar mensaje del usuario
  agregarMensaje(mensaje, "usuario");

  // Limpiar input y bloquear botón mientras responde
  input.value = "";
  btnEnviar.disabled = true;
  input.disabled = true;

  const mensajeTemporal = crearBurbujaTemporal("Pensando...");

  try {
    // Llamar al backend (Cloud Function) que aplica el filtro de dominio
    const textoRespuesta = await askServer(mensaje);

    // Mostrar la respuesta que venga del servidor
    mensajeTemporal.textContent = textoRespuesta || "No recibí texto en la respuesta.";
  } catch (error) {
    console.error("Error al llamar al servidor:", error);
    mensajeTemporal.textContent =
      "Ocurrió un error al consultar el servidor. Revisa la consola del navegador.";
  } finally {
    btnEnviar.disabled = false;
    input.disabled = false;
    input.focus();
    chatBox.scrollTop = chatBox.scrollHeight;
  }
}
