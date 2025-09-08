let modeloMobilenet, modeloCocoSsd;

const uploadImage = document.getElementById("upload-image");
const imgPreview = document.getElementById("img-preview");
const btnAnalizar = document.getElementById("btn-analizar");
const ulClasificacion = document.getElementById("clasificacion");
const ulDeteccion = document.getElementById("deteccion");
const resultadosSection = document.getElementById("resultados");

const comentario = document.getElementById("comentario");
// const btnSentimiento = document.getElementById("btn-sentimiento"); // Eliminado
const resultadoSentimiento = document.getElementById("resultado-sentimiento");

async function cargarModelos() {
  btnAnalizar.disabled = true;
  // btnSentimiento.disabled = true; // Eliminado
  try {
    modeloMobilenet = await mobilenet.load();
    modeloCocoSsd = await cocoSsd.load();
    // btnSentimiento.disabled = false; // Eliminado
  } catch (error) {
    alert("Error cargando modelos. Revisa tu conexión.");
    console.error(error);
  }
}

uploadImage.addEventListener("change", () => {
  const file = uploadImage.files[0];
  if (!file) {
    imgPreview.style.display = "none";
    btnAnalizar.disabled = true;
    resultadosSection.style.display = "none";
    return;
  }
  const url = URL.createObjectURL(file);
  imgPreview.src = url;
  imgPreview.style.display = "block";
  btnAnalizar.disabled = false;
  resultadosSection.style.display = "none";
  ulClasificacion.innerHTML = "";
  ulDeteccion.innerHTML = "";
  resultadoSentimiento.textContent = "";
});

btnAnalizar.addEventListener("click", async () => {
  if (!imgPreview.src) return;

  btnAnalizar.disabled = true;
  ulClasificacion.innerHTML = "<li>Cargando clasificación...</li>";
  ulDeteccion.innerHTML = "<li>Cargando detección...</li>";
  resultadosSection.style.display = "block";

  try {
    // Clasificación MobileNet
    const resultadosClasificacion = await modeloMobilenet.classify(imgPreview);
    ulClasificacion.innerHTML = "";
    resultadosClasificacion.forEach((item) => {
      const li = document.createElement("li");
      li.textContent = `${item.className} - ${(item.probability * 100).toFixed(
        2
      )}%`;
      ulClasificacion.appendChild(li);
    });

    // Detección COCO-SSD
    const resultadosDeteccion = await modeloCocoSsd.detect(imgPreview);
    ulDeteccion.innerHTML = "";
    if (resultadosDeteccion.length === 0) {
      ulDeteccion.innerHTML = "<li>No se detectaron objetos.</li>";
    } else {
      resultadosDeteccion.forEach((objeto) => {
        const li = document.createElement("li");
        li.textContent = `${objeto.class} - ${(objeto.score * 100).toFixed(
          2
        )}%`;
        ulDeteccion.appendChild(li);
      });
    }
  } catch (error) {
    alert("Error durante el análisis. Intenta de nuevo.");
    console.error(error);
  } finally {
    btnAnalizar.disabled = false;
  }
});

// Eliminado el listener btnSentimiento

// Cargar modelos al iniciar
cargarModelos();
