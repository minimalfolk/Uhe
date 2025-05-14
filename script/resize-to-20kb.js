// resize-to-20kb.js

const imageInput = document.getElementById("imageInput");
const uploadBox = document.getElementById("uploadBox");
const compressBtn = document.getElementById("compressBtn");
const formatSelect = document.getElementById("formatSelect");
const loadingIndicator = document.getElementById("loadingIndicator");
const errorMessage = document.getElementById("errorMessage");
const originalPreview = document.getElementById("originalPreview");
const originalImage = document.getElementById("originalImage");
const originalDetails = document.getElementById("originalDetails");
const compressedPreview = document.getElementById("compressedPreview");
const compressedImage = document.getElementById("compressedImage");
const compressedDetails = document.getElementById("compressedDetails");
const downloadBtn = document.getElementById("downloadBtn");

let originalFile;

uploadBox.addEventListener("click", () => imageInput.click());

imageInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    showError("Please upload a valid image file.");
    return;
  }

  originalFile = file;
  const reader = new FileReader();
  reader.onload = (e) => {
    originalImage.src = e.target.result;
    originalImage.onload = () => {
      originalDetails.textContent = `${file.name} | ${Math.round(file.size / 1024)}KB | ${originalImage.naturalWidth}x${originalImage.naturalHeight}`;
      originalPreview.hidden = false;
      compressBtn.disabled = false;
      errorMessage.hidden = true;
    };
  };
  reader.readAsDataURL(file);
});

compressBtn.addEventListener("click", async () => {
  if (!originalFile) return;

  compressBtn.disabled = true;
  loadingIndicator.hidden = false;
  compressedPreview.hidden = true;

  const format = formatSelect.value;
  const targetSize = 20 * 1024; // 20KB in bytes

  const img = new Image();
  img.src = originalImage.src;
  await img.decode();

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  let scale = 1.0;
  let blob = null;
  let quality = 0.9;

  for (let i = 0; i < 10; i++) {
    canvas.width = img.width * scale;
    canvas.height = img.height * scale;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const mimeType = `image/${format}`;
    blob = await new Promise((resolve) => canvas.toBlob(resolve, mimeType, quality));

    if (blob.size <= targetSize * 0.975) break;

    scale -= 0.1;
    quality -= 0.1;
    if (scale <= 0.2 || quality <= 0.2) break;
  }

  if (!blob || blob.size > targetSize * 1.05) {
    showError("Could not compress image to under 20KB. Try a smaller or simpler image.");
    loadingIndicator.hidden = true;
    compressBtn.disabled = false;
    return;
  }

  const compressedUrl = URL.createObjectURL(blob);
  compressedImage.src = compressedUrl;
  compressedImage.onload = () => URL.revokeObjectURL(compressedUrl);
  compressedDetails.textContent = `${Math.round(blob.size / 1024)}KB | ${canvas.width}x${canvas.height}`;

  downloadBtn.onclick = () => {
    const a = document.createElement("a");
    a.href = compressedUrl;
    a.download = `compressed-20kb.${format}`;
    a.click();
  };

  loadingIndicator.hidden = true;
  compressedPreview.hidden = false;
  downloadBtn.disabled = false;
});

function showError(message) {
  errorMessage.textContent = message;
  errorMessage.hidden = false;
  originalPreview.hidden = true;
  compressedPreview.hidden = true;
  compressBtn.disabled = true;
}
