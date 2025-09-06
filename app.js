// Variables globales
const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const botonCapturar = document.getElementById("capture");
const botonCambiarCamara = document.getElementById("switch-camera");
const resultado = document.getElementById("resultado");
const status = document.getElementById("status");
const loading = document.getElementById("loading");
const confidence = document.getElementById("confidence");
const confidenceText = document.getElementById("confidence-text");

let modelo;
let stream;
let camaraActual = "environment"; // 'user' para cámara frontal, 'environment' para trasera

// Configuración inicial de cámara
function getConfigCamara() {
  return {
    video: {
      width: { ideal: 640 },
      height: { ideal: 480 },
      facingMode: camaraActual,
    },
    audio: false,
  };
}

// Mostrar estado en la UI
function mostrarEstado(mensaje, tipo = "loading") {
  status.textContent = mensaje;
  status.className = `status-indicator ${tipo}`;
}

// Vibrar si está disponible
function vibrar(duracion = 50) {
  if (navigator.vibrate) {
    navigator.vibrate(duracion);
  }
}

// Iniciar cámara con la configuración actual
async function iniciarCamara() {
  try {
    mostrarEstado("🔄 Iniciando cámara...", "loading");

    // Detener stream anterior si existe
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }

    // Solicitar acceso a la cámara
    stream = await navigator.mediaDevices.getUserMedia(getConfigCamara());
    video.srcObject = stream;

    // Esperar a que el video esté listo
    return new Promise((resolve) => {
      video.onloadedmetadata = () => {
        video.play();
        mostrarEstado("📹 Cámara lista", "ready");
        resolve();
      };
    });
  } catch (error) {
    console.error("Error al acceder a la cámara:", error);
    mostrarEstado("❌ Error de cámara", "error");

    if (error.name === "NotAllowedError") {
      alert(
        "❌ Permiso de cámara denegado. Por favor, permite el acceso a la cámara en la configuración del navegador."
      );
    } else if (error.name === "NotFoundError") {
      alert("❌ No se encontró cámara en el dispositivo.");
    } else {
      alert(
        "❌ Error al acceder a la cámara. Asegúrate de estar usando HTTPS."
      );
    }
  }
}

// Cambiar entre cámara frontal y trasera
async function cambiarCamara() {
  vibrar();
  camaraActual = camaraActual === "environment" ? "user" : "environment";
  await iniciarCamara();
}

// Cargar modelo MobileNet
async function cargarModelo() {
  try {
    mostrarEstado("🔄 Cargando modelo de IA...", "loading");
    modelo = await mobilenet.load({ version: 2, alpha: 1.0 });
    mostrarEstado("✅ Modelo cargado. Listo para clasificar.", "ready");
    botonCapturar.disabled = false;
    botonCapturar.classList.add("pulse");
  } catch (error) {
    console.error("Error al cargar modelo:", error);
    mostrarEstado("❌ Error al cargar modelo", "error");
    alert("Error al cargar el modelo de IA. Revisa tu conexión a internet.");
  }
}

// Clasificar imagen capturada
async function clasificarImagen() {
  try {
    loading.style.display = "flex";
    botonCapturar.disabled = true;
    botonCapturar.classList.remove("pulse");

    // Capturar frame del video en canvas
    ctx.drawImage(video, 0, 0, 224, 224);

    // Obtener tensor de imagen
    const imgTensor = tf.browser.fromPixels(canvas);

    // Clasificar con MobileNet
    const predicciones = await modelo.classify(imgTensor);

    if (predicciones.length > 0) {
      const mejorPrediccion = predicciones[0];
      const nombre = mejorPrediccion.className;
      const probabilidad = mejorPrediccion.probability;

      resultado.innerHTML = `🎯 <strong>${nombre}</strong>`;
      confidence.style.width = `${(probabilidad * 100).toFixed(1)}%`;
      confidenceText.textContent = `${(probabilidad * 100).toFixed(1)}%`;
    } else {
      resultado.textContent = "No se pudo clasificar la imagen.";
      confidence.style.width = "0%";
      confidenceText.textContent = "0%";
    }

    imgTensor.dispose();
  } catch (error) {
    console.error("Error en clasificación:", error);
    resultado.textContent = "❌ Error al procesar la imagen";
    confidence.style.width = "0%";
    confidenceText.textContent = "0%";
  } finally {
    loading.style.display = "none";
    botonCapturar.disabled = false;
    botonCapturar.classList.add("pulse");
  }
}

// Eventos
botonCapturar.addEventListener("click", clasificarImagen);
botonCambiarCamara.addEventListener("click", cambiarCamara);

// Inicialización al cargar DOM
document.addEventListener("DOMContentLoaded", async () => {
  botonCapturar.disabled = true;
  await iniciarCamara();
  await cargarModelo();
});
