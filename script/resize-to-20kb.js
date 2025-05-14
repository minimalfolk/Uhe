
const imageInput = document.getElementById("imageInput");
const uploadBox = document.getElementById("uploadBox");
const compressBtn = document.getElementById("compressBtn");
const formatSelect = document.getElementById("formatSelect");
const errorMessage = document.getElementById("errorMessage");

const originalImage = document.getElementById("originalImage");
const originalPreview = document.getElementById("originalPreview");
const originalDetails = document.getElementById("originalDetails");

const compressedImage = document.getElementById("compressedImage");
const compressedPreview = document.getElementById("compressedPreview");
const compressedDetails = document.getElementById("compressedDetails");
const downloadBtn = document.getElementById("downloadBtn");

const loadingIndicator = document.getElementById("loadingIndicator");

let uploadedFile;
const TARGET_SIZE = 20 * 1024; // 20KB

uploadBox.addEventListener("click", () => imageInput.click());

imageInput.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    showError("Please upload a valid image file.");
    return;
  }

  uploadedFile = file;
  errorMessage.hidden = true;
  compressBtn.disabled = false;

  const imageURL = URL.createObjectURL(file);
  originalImage.src = imageURL;
  originalDetails.textContent = `Original size: ${(file.size / 1024).toFixed(2)} KB`;
  originalPreview.hidden = false;
  compressedPreview.hidden = true;
});

compressBtn.addEventListener("click", async () => {
  if (!uploadedFile) return;

  compressBtn.disabled = true;
  loadingIndicator.hidden = false;
  compressedPreview.hidden = true;

  const format = formatSelect.value;
  const result = await compressToTargetSize(uploadedFile, TARGET_SIZE, format);

  if (!result) {
    showError("Could not compress image to 20KB. Try a different format or smaller image.");
    loadingIndicator.hidden = true;
    compressBtn.disabled = false;
    return;
  }

  const { blob, dataUrl } = result;

  compressedImage.src = dataUrl;
  compressedDetails.textContent = `Compressed size: ${(blob.size / 1024).toFixed(2)} KB`;
  downloadBtn.disabled = false;
  downloadBtn.onclick = () => downloadBlob(blob, `compressed-20kb.${format}`);
  compressedPreview.hidden = false;
  loadingIndicator.hidden = true;
  compressBtn.disabled = false;
});

function showError(msg) {
  errorMessage.textContent = msg;
  errorMessage.hidden = false;
}

function downloadBlob(blob, filename) {
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

async function compressToTargetSize(file, targetSize, format) {
  const imageBitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  let width = imageBitmap.width;
  let height = imageBitmap.height;
  canvas.width = width;
  canvas.height = height;
  ctx.drawImage(imageBitmap, 0, 0);

  let quality = 0.9;
  let step = 0.05;
  let minQuality = 0.2;
  let scale = 1.0;
  let blob = null;

  const mimeMap = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    gif: "image/gif",
    bmp: "image/bmp"
  };

  const mimeType = mimeMap[format] || "image/jpeg";

  while (quality >= minQuality) {
    blob = await new Promise((resolve) =>
      canvas.toBlob(resolve, mimeType, mimeType === "image/jpeg" || mimeType === "image/webp" ? quality : undefined)
    );
    if (blob && blob.size <= targetSize) break;
    quality -= step;
  }

  while (blob && blob.size > targetSize && scale > 0.5) {
    scale -= 0.05;
    canvas.width = width * scale;
    canvas.height = height * scale;
    ctx.drawImage(imageBitmap, 0, 0, canvas.width, canvas.height);
    blob = await new Promise((resolve) =>
      canvas.toBlob(resolve, mimeType, mimeType === "image/jpeg" || mimeType === "image/webp" ? quality : undefined)
    );
  }

  if (!blob || blob.size > targetSize) return null;

  return {
    blob,
    dataUrl: await blobToDataURL(blob)
  };
}

function blobToDataURL(blob) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
}
