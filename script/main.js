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
  const seenFiles = new Set();

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

    const uniqueFiles = [];
    const newSeen = new Set();

    for (const file of files) {
      const identifier = `${file.name}-${file.size}-${file.lastModified}`;
      if (!seenFiles.has(identifier) && !newSeen.has(identifier)) {
        newSeen.add(identifier);
        uniqueFiles.push(file);
      }
    }

    if (filesQueue.length + uniqueFiles.length > 10) {
      showError('Maximum 10 images allowed.');
      return;
    }

    if (uniqueFiles.length === 0) {
      showError('Duplicate files are not allowed.');
      return;
    }

    uniqueFiles.forEach(file => {
      const identifier = `${file.name}-${file.size}-${file.lastModified}`;
      seenFiles.add(identifier);
    });

    filesQueue = filesQueue.concat(uniqueFiles);
    hideError();

    if (filesQueue.length > 0) {
      showImagePreview(filesQueue[currentIndex]);
      compressBtn.disabled = false;
      downloadBtn.disabled = true;
    }
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
      compressBtn.disabled = true;
      return;
    }

    try {
      showLoading(true);
      hideError();
      compressedPreview.style.display = 'none';

      const file = filesQueue[currentIndex];
      const targetSizeKB = parseInt(targetSizeInput.value) || 100;
      const format = formatSelect.value;

      const compressedDataUrl = await compressImage(file, targetSizeKB, format);
      const blob = dataURItoBlob(compressedDataUrl);
      compressedBlobs.push({ blob, name: file.name });

      compressedImage.src = compressedDataUrl;
      compressedPreview.style.display = 'block';

      const img = new Image();
      img.onload = function() {
        compressedDetails.innerHTML = `
          <div class="file-meta">
            <p><strong>New Size:</strong> <span>${formatFileSize(blob.size)}</span></p>
            <p><strong>Reduction:</strong> <span>${calculateReduction(file.size, blob.size)}%</span></p>
            <p><strong>Format:</strong> <span>${format.toUpperCase()}</span></p>
            <p><strong>Dimensions:</strong> <span>${img.width} × ${img.height} px</span></p>
            <p><strong>Quality:</strong> <span>${Math.round((blob.size/file.size)*100)}% of original</span></p>
          </div>
        `;
      };
      img.src = compressedDataUrl;

      downloadBtn.disabled = false;
      currentIndex++;

      if (currentIndex < filesQueue.length) {
        showImagePreview(filesQueue[currentIndex]);
      } else {
        compressBtn.disabled = true;
      }
    } catch (error) {
      showError('Error compressing image: ' + error.message);
      console.error('Compression error:', error);
    } finally {
      showLoading(false);
    }
  }

  function downloadAllCompressedImages() {
    if (compressedBlobs.length === 0) {
      showError('No compressed images to download');
      return;
    }

    compressedBlobs.forEach(({ blob, name }, index) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const ext = formatSelect.value || name.split('.').pop();
      a.download = `compressed_${index + 1}_${name.replace(/\.[^/.]+$/, '')}.${ext}`;
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
    loadingIndicator.style.display = show ? 'block' : 'none';
    compressBtn.disabled = show;
  }

  function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
  }

  function hideError() {
    errorMessage.style.display = 'none';
  }

  // Initialize
  compressBtn.disabled = true;
  downloadBtn.disabled = true;
  loadingIndicator.style.display = 'none';
  errorMessage.style.display = 'none';
});
