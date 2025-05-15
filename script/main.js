document.addEventListener('DOMContentLoaded', function() {
  // DOM Elements
  const uploadBox = document.getElementById('uploadBox');
  const imageInput = document.getElementById('imageInput');
  const originalPreview = document.getElementById('originalPreview');
  const originalImage = document.getElementById('originalImage');
  const originalDetails = document.getElementById('originalDetails');
  const compressedPreview = document.getElementById('compressedPreview');
  const compressedImage = document.getElementById('compressedImage');
  const compressedDetails = document.getElementById('compressedDetails');
  const downloadBtn = document.getElementById('downloadBtn');
  const compressBtn = document.getElementById('compressBtn');
  const targetSizeInput = document.getElementById('targetSize');
  const formatSelect = document.getElementById('formatSelect');
  const loadingIndicator = document.getElementById('loadingIndicator');
  const errorMessage = document.getElementById('errorMessage');

  // State
  let filesQueue = [];
  let currentIndex = 0;
  let compressedBlobs = [];

  // Event Listeners
  uploadBox.addEventListener('click', () => imageInput.click());
  uploadBox.addEventListener('dragover', handleDragOver);
  uploadBox.addEventListener('dragleave', handleDragLeave);
  uploadBox.addEventListener('drop', handleDrop);
  imageInput.addEventListener('change', handleFileSelect);
  compressBtn.addEventListener('click', compressNextImage);
  downloadBtn.addEventListener('click', downloadAllCompressedImages);

  function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    uploadBox.style.backgroundColor = 'rgba(67, 97, 238, 0.1)';
  }

  function handleDragLeave() {
    uploadBox.style.backgroundColor = 'rgba(67, 97, 238, 0.05)';
  }

  function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    uploadBox.style.backgroundColor = 'rgba(67, 97, 238, 0.05)';

    if (e.dataTransfer.files.length) {
      imageInput.files = e.dataTransfer.files;
      handleFileSelect({ target: imageInput });
    }
  }

  function handleFileSelect(e) {
    const files = Array.from(e.target.files);

    if (files.length > 10) {
      showError('Maximum 10 images allowed.');
      return;
    }

    const uniqueFiles = files.filter(file => {
      return !filesQueue.some(f => f.name === file.name && f.size === file.size);
    });

    if (uniqueFiles.length === 0) {
      showError('Duplicate files are not allowed.');
      return;
    }

    filesQueue = uniqueFiles;
    currentIndex = 0;
    compressedBlobs = [];
    hideError();

    showImagePreview(filesQueue[0]);
    compressBtn.disabled = false;
  }

  function showImagePreview(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      originalImage.src = e.target.result;
      originalPreview.style.display = 'block';
      originalDetails.innerHTML = `
        <div class="file-meta">
          <p><strong>Name:</strong> <span>${file.name}</span></p>
          <p><strong>Type:</strong> <span>${file.type}</span></p>
          <p><strong>Size:</strong> <span>${formatFileSize(file.size)}</span></p>
          <p><strong>Dimensions:</strong> <span id="originalDimensions">Calculating...</span></p>
        </div>
      `;
      const img = new Image();
      img.onload = function() {
        document.getElementById('originalDimensions').textContent = `${img.width} × ${img.height} px`;
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  async function compressNextImage() {
    if (currentIndex >= filesQueue.length) {
      showError('All images have been compressed.');
      return;
    }

    try {
      showLoading(true);
      hideError();
      compressedPreview.style.display = 'none';

      const file = filesQueue[currentIndex];
      const targetSizeKB = parseInt(targetSizeInput.value) || 100;
      const format = formatSelect.value;

      const compressedDataUrl = await compressImageUsingCanvas(file, targetSizeKB, format);
      const blob = dataURItoBlob(compressedDataUrl);
      compressedBlobs.push({ blob, name: file.name });

      compressedImage.src = compressedDataUrl;
      compressedPreview.style.display = 'block';

      compressedDetails.innerHTML = `
        <div class="file-meta">
          <p><strong>New Size:</strong> <span>${formatFileSize(blob.size)}</span></p>
          <p><strong>Reduction:</strong> <span>${calculateReduction(file.size, blob.size)}%</span></p>
          <p><strong>Format:</strong> <span>${format.toUpperCase()}</span></p>
          <p><strong>Dimensions:</strong> <span id="compressedDimensions">Calculating...</span></p>
        </div>
      `;
      const img = new Image();
      img.onload = function() {
        document.getElementById('compressedDimensions').textContent = `${img.width} × ${img.height} px`;
      };
      img.src = compressedDataUrl;

      downloadBtn.disabled = false;
      currentIndex++;

      if (currentIndex < filesQueue.length) {
        showImagePreview(filesQueue[currentIndex]);
      }
    } catch (error) {
      showError('Error compressing image: ' + error.message);
      console.error('Compression error:', error);
    } finally {
      showLoading(false);
    }
  }

  function compressImageUsingCanvas(file, targetSizeKB, format) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = function(event) {
        const img = new Image();
        img.onload = function() {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          let width = img.width;
          let height = img.height;
          const MAX_DIMENSION = 2000;
          if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
            const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
            width *= ratio;
            height *= ratio;
          }
          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);

          let quality = 0.8;
          let dataUrl;
          let minQuality = 0.1;
          let maxQuality = 1.0;
          let iterations = 0;
          const maxIterations = 10;

          function attemptCompression() {
            iterations++;
            let mimeType = 'image/jpeg';
            if (format === 'png') mimeType = 'image/png';
            else if (format === 'webp') mimeType = 'image/webp';
            else if (format === 'gif') mimeType = 'image/gif';
            else if (format === 'bmp') mimeType = 'image/bmp';

            dataUrl = canvas.toDataURL(mimeType, quality);
            const sizeKB = (dataUrl.length * 0.75) / 1024;

            if (iterations >= maxIterations || Math.abs(sizeKB - targetSizeKB) < targetSizeKB * 0.1) {
              resolve(dataUrl);
              return;
            }

            if (sizeKB > targetSizeKB) {
              maxQuality = quality;
              quality = (quality + minQuality) / 2;
            } else {
              minQuality = quality;
              quality = (quality + maxQuality) / 2;
            }

            setTimeout(attemptCompression, 0);
          }

          attemptCompression();
        };
        img.onerror = function() {
          reject(new Error('Failed to load image'));
        };
        img.src = event.target.result;
      };
      reader.onerror = function() {
        reject(new Error('Failed to read file'));
      };
      reader.readAsDataURL(file);
    });
  }

  function downloadAllCompressedImages() {
    compressedBlobs.forEach(({ blob, name }, index) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `compressed_${index + 1}_${name}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  }

  function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  }

  function calculateReduction(originalSize, newSize) {
    return Math.round((1 - (newSize / originalSize)) * 100);
  }

  function dataURItoBlob(dataURI) {
    const byteString = atob(dataURI.split(',')[1]);
    const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeString });
  }

  function showLoading(show) {
    loadingIndicator.hidden = !show;
    compressBtn.disabled = show;
  }

  function showError(message) {
    errorMessage.textContent = message;
    errorMessage.hidden = false;
  }

  function hideError() {
    errorMessage.hidden = true;
  }

  compressBtn.disabled = true;
  downloadBtn.disabled = true;
  loadingIndicator.hidden = true;
  errorMessage.hidden = true;
});
