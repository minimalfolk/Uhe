const imageInput = document.getElementById('imageInput');
const uploadBox = document.getElementById('uploadBox');
const compressBtn = document.getElementById('compressBtn');
const formatSelect = document.getElementById('formatSelect');
const errorMessage = document.getElementById('errorMessage');
const loadingIndicator = document.getElementById('loadingIndicator');
const originalImage = document.getElementById('originalImage');
const originalDetails = document.getElementById('originalDetails');
const originalPreview = document.getElementById('originalPreview');
const compressedImage = document.getElementById('compressedImage');
const compressedDetails = document.getElementById('compressedDetails');
const compressedPreview = document.getElementById('compressedPreview');
const downloadBtn = document.getElementById('downloadBtn');

let originalFile = null;
let compressedBlob = null;

// Handle Upload UI
uploadBox.addEventListener('click', () => imageInput.click());
uploadBox.addEventListener('dragover', (e) => e.preventDefault());
uploadBox.addEventListener('drop', (e) => {
  e.preventDefault();
  handleFile(e.dataTransfer.files[0]);
});
imageInput.addEventListener('change', (e) => handleFile(e.target.files[0]));

function handleFile(file) {
  if (!file || !file.type.startsWith('image/')) {
    showError('Please upload a valid image file.');
    return;
  }

  originalFile = file;
  const reader = new FileReader();
  reader.onload = (e) => {
    originalImage.src = e.target.result;
    originalImage.onload = () => {
      originalDetails.textContent = `Original: ${(file.size / 1024).toFixed(2)} KB, ${originalImage.naturalWidth}×${originalImage.naturalHeight}px`;
      originalPreview.hidden = false;
      compressBtn.disabled = false;
      errorMessage.hidden = true;
    };
  };
  reader.readAsDataURL(file);
}

function showError(msg) {
  errorMessage.textContent = msg;
  errorMessage.hidden = false;
}

// Compress with size targeting
async function compressToTargetSize(file, targetKB = 19.5, format = 'image/jpeg') {
  const targetBytes = targetKB * 1024;
  const img = new Image();
  img.src = URL.createObjectURL(file);

  return new Promise((resolve) => {
    img.onload = () => {
      let [width, height] = [img.width, img.height];
      let quality = 0.92;

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      const tryCompress = () => {
        canvas.width = width;
        canvas.height = height;
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob((blob) => {
          if (blob.size <= targetBytes) {
            resolve(blob);
          } else if (quality > 0.5) {
            quality -= 0.05;
            tryCompress();
          } else if (width > 200 && height > 200) {
            width = Math.floor(width * 0.9);
            height = Math.floor(height * 0.9);
            quality = 0.92;
            tryCompress();
          } else {
            resolve(blob); // Best-effort fallback
          }
        }, format, quality);
      };

      tryCompress();
    };
  });
}

// Button click handler
compressBtn.addEventListener('click', async () => {
  if (!originalFile) return;

  compressBtn.disabled = true;
  loadingIndicator.hidden = false;

  const selectedFormat = formatSelect.value;
  const mimeMap = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    gif: 'image/gif',
    bmp: 'image/bmp'
  };
  const mimeType = mimeMap[selectedFormat] || 'image/jpeg';

  const blob = await compressToTargetSize(originalFile, 19.5, mimeType);
  compressedBlob = blob;

  const compressedURL = URL.createObjectURL(blob);
  compressedImage.src = compressedURL;
  compressedImage.onload = () => {
    const originalSize = (originalFile.size / 1024).toFixed(2);
    const compressedSize = (blob.size / 1024).toFixed(2);
    const reduction = (((originalSize - compressedSize) / originalSize) * 100).toFixed(2);

    compressedDetails.textContent = `Compressed: ${compressedSize} KB (${reduction}% smaller)`;
    compressedPreview.hidden = false;
    downloadBtn.disabled = false;
    loadingIndicator.hidden = true;
  };
});

// Download logic
downloadBtn.addEventListener('click', () => {
  const link = document.createElement('a');
  link.href = URL.createObjectURL(compressedBlob);
  link.download = `compressed-${originalFile.name}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
});
