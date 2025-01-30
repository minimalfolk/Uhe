// script.js
const uploadBox = document.getElementById('uploadBox');
const imageInput = document.getElementById('imageInput');
const originalImage = document.getElementById('originalImage');
const originalDetails = document.getElementById('originalDetails');
const compressRange = document.getElementById('compressRange');
const compressBtn = document.getElementById('compressBtn');
const compressedImage = document.getElementById('compressedImage');
const compressedDetails = document.getElementById('compressedDetails');
const sizeSaved = document.getElementById('sizeSaved');
const downloadBtn = document.getElementById('downloadBtn');
const compressedPreview = document.getElementById('compressedPreview');

let originalFile = null;

// Drag and drop functionality
uploadBox.addEventListener('click', () => imageInput.click());
uploadBox.addEventListener('dragover', (e) => {
  e.preventDefault();
  uploadBox.style.borderColor = '#007bff';
});
uploadBox.addEventListener('dragleave', () => {
  uploadBox.style.borderColor = '#ccc';
});
uploadBox.addEventListener('drop', (e) => {
  e.preventDefault();
  uploadBox.style.borderColor = '#ccc';
  originalFile = e.dataTransfer.files[0];
  handleImageUpload(originalFile);
});

// File input change
imageInput.addEventListener('change', (e) => {
  originalFile = e.target.files[0];
  handleImageUpload(originalFile);
});

// Handle image upload
function handleImageUpload(file) {
  if (file && file.type.startsWith('image/')) {
    const reader = new FileReader();
    reader.onload = (e) => {
      originalImage.src = e.target.result;
      originalImage.hidden = false;
      originalDetails.textContent = `Dimensions: ${originalImage.naturalWidth} x ${originalImage.naturalHeight} pixels | Size: ${(file.size / 1024).toFixed(2)} KB`;
      compressBtn.disabled = false;
    };
    reader.readAsDataURL(file);
  } else {
    alert('Please upload a valid image file.');
  }
}

// Compress image
compressBtn.addEventListener('click', () => {
  const quality = parseInt(compressRange.value) / 100;
  compressImage(originalImage, quality);
});

function compressImage(img, quality) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  canvas.toBlob(
    (blob) => {
      const compressedUrl = URL.createObjectURL(blob);
      compressedImage.src = compressedUrl;
      compressedImage.hidden = false;
      compressedDetails.textContent = `Dimensions: ${canvas.width} x ${canvas.height} pixels | Size: ${(blob.size / 1024).toFixed(2)} KB`;
      sizeSaved.textContent = `Size reduced by ${((1 - blob.size / originalFile.size) * 100).toFixed(2)}%! You saved ${((originalFile.size - blob.size) / 1024).toFixed(2)} KB.`;
      compressedPreview.hidden = false;
      downloadBtn.disabled = false;

      // Download functionality
      downloadBtn.addEventListener('click', () => {
        const link = document.createElement('a');
        link.href = compressedUrl;
        link.download = `compressed_${originalFile.name}`;
        link.click();
      });
    },
    'image/jpeg',
    quality
  );
}
