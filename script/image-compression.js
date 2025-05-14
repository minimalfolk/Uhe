document.addEventListener("DOMContentLoaded", function () {
  const imageInput = document.getElementById("imageInput");
  const uploadBox = document.getElementById("uploadBox");
  const errorMessage = document.getElementById("errorMessage");
  const originalPreview = document.getElementById("originalPreview");
  const originalImage = document.getElementById("originalImage");
  const originalDetails = document.getElementById("originalDetails");
  const compressRange = document.getElementById("compressRange");
  const compressValue = document.getElementById("compressValue");
  const compressBtn = document.getElementById("compressBtn");
  const loadingIndicator = document.getElementById("loadingIndicator");
  const compressedPreview = document.getElementById("compressedPreview");
  const compressedImage = document.getElementById("compressedImage");
  const compressedDetails = document.getElementById("compressedDetails");
  const downloadBtn = document.getElementById("downloadBtn");
  const formatSelect = document.getElementById("formatSelect");

  let originalFile, originalSize, compressedBlob, originalType;

  uploadBox.addEventListener("click", () => imageInput.click());
  uploadBox.addEventListener("dragover", (e) => e.preventDefault());
  uploadBox.addEventListener("drop", handleDrop);
  imageInput.addEventListener("change", handleFileUpload);
  compressRange.addEventListener("input", updateCompressionDisplay);
  compressBtn.addEventListener("click", compressAndRenderImage);
  downloadBtn.addEventListener("click", downloadImage);

  function handleDrop(event) {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) processImage(file);
  }

  function handleFileUpload(event) {
    const file = event.target.files[0];
    if (file) processImage(file);
  }

  function processImage(file) {
    clearUI();

    if (!file.type.startsWith("image/")) {
      showError("Please upload a valid image file.");
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      showError("Please upload an image smaller than 50MB.");
      return;
    }

    originalFile = file;
    originalSize = file.size;
    originalType = file.type;

    setAvailableFormats(originalType);

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target.result;

      img.onload = function () {
        originalPreview.hidden = false;
        originalImage.src = e.target.result;
        originalDetails.innerHTML = `Format: ${originalType.split("/")[1].toUpperCase()}<br>
                                     Dimensions: ${img.width} x ${img.height}<br>
                                     Size: ${formatSize(originalSize)}`;
        compressBtn.disabled = false;
      };
    };
    reader.readAsDataURL(file);
  }

  function setAvailableFormats(type) {
    const format = type.split("/")[1];
    const options = [
      { label: "JPG (.jpg)", value: "jpg" },
      { label: "JPEG (.jpeg)", value: "jpeg" },
      { label: "PNG (.png)", value: "png" },
      { label: "WebP (.webp)", value: "webp" },
      { label: "GIF (.gif)", value: "gif" },
      { label: "BMP (.bmp)", value: "bmp" },
    ];

    formatSelect.innerHTML = "";
    options.forEach((opt) => {
      if (opt.value === format || (format === "jpg" && opt.value === "jpeg") || (format === "jpeg" && opt.value === "jpg")) {
        formatSelect.innerHTML += `<option value="${opt.value}" selected>${opt.label}</option>`;
      } else {
        formatSelect.innerHTML += `<option value="${opt.value}">${opt.label}</option>`;
      }
    });
  }

  function updateCompressionDisplay() {
    compressValue.textContent = `${compressRange.value}%`;
  }

  async function compressAndRenderImage() {
    if (!originalFile) {
      showError("Please upload an image first.");
      return;
    }

    loadingIndicator.hidden = false;
    compressedPreview.hidden = true;

    const reader = new FileReader();
    reader.onload = function (event) {
      const img = new Image();
      img.src = event.target.result;

      img.onload = async function () {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        const targetScale = parseInt(compressRange.value) / 100;
        const targetSize = originalSize * targetScale;

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const selectedFormat = formatSelect.value;
        const mimeType = selectedFormat === "jpg" || selectedFormat === "jpeg" ? "image/jpeg" : `image/${selectedFormat}`;

        let quality = 0.95;
        let step = 0.05;
        let blob = await tryCompress(canvas, mimeType, quality);

        while (blob.size > targetSize && quality > 0.05) {
          quality -= step;
          blob = await tryCompress(canvas, mimeType, quality);
        }

        if (blob.size > originalSize) {
          quality = 0.85;
          blob = await tryCompress(canvas, mimeType, quality);
        }

        displayCompressedImage(blob, img.width, img.height, selectedFormat);
      };
    };
    reader.readAsDataURL(originalFile);
  }

  function tryCompress(canvas, mimeType, quality) {
    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), mimeType, quality);
    });
  }

  function displayCompressedImage(blob, width, height, formatExt) {
    loadingIndicator.hidden = true;
    compressedPreview.hidden = false;

    compressedBlob = blob;
    compressedImage.src = URL.createObjectURL(blob);

    const newSize = blob.size;
    const savedSize = originalSize - newSize;

    compressedDetails.innerHTML = `
      <strong>New Size:</strong> <strong>${formatSize(newSize)}</strong><br>
      <strong>Saved Size:</strong> ${formatSize(savedSize)}<br>
      <strong>New Dimensions:</strong> ${width} x ${height}<br>
      <strong>Format:</strong> ${formatExt.toUpperCase()}
    `;

    downloadBtn.disabled = false;
  }

  function downloadImage() {
    if (!compressedBlob) {
      showError("No compressed image available.");
      return;
    }

    const ext = formatSelect.value;
    const downloadLink = document.createElement("a");
    downloadLink.href = URL.createObjectURL(compressedBlob);
    downloadLink.download = `compressed-image.${ext}`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  }

  function formatSize(size) {
    return size >= 1024 * 1024
      ? (size / (1024 * 1024)).toFixed(2) + " MB"
      : (size / 1024).toFixed(2) + " KB";
  }

  function showError(message) {
    errorMessage.hidden = false;
    errorMessage.textContent = message;
  }

  function clearUI() {
    errorMessage.hidden = true;
    errorMessage.textContent = "";
    originalPreview.hidden = true;
    compressedPreview.hidden = true;
    loadingIndicator.hidden = true;
    compressBtn.disabled = true;
    downloadBtn.disabled = true;
  }
});
