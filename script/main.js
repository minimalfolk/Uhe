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
  let originalFile = null;
  let compressedBlob = null;
  let isProcessing = false;
  let abortController = null;

  // Event Listeners
  uploadBox.addEventListener('click', handleUploadBoxClick);
  uploadBox.addEventListener('dragover', handleDragOver);
  uploadBox.addEventListener('dragleave', handleDragLeave);
  uploadBox.addEventListener('drop', handleDrop);
  imageInput.addEventListener('change', handleFileSelect);
  compressBtn.addEventListener('click', compressImage);
  downloadBtn.addEventListener('click', downloadCompressedImage);

  // Functions
  function handleUploadBoxClick() {
    if (!isProcessing) {
      imageInput.value = ''; // Reset input to allow selecting same file again
      imageInput.click();
    }
  }

  function handleDragOver(e) {
    if (isProcessing) return;
    e.preventDefault();
    e.stopPropagation();
    uploadBox.style.backgroundColor = 'rgba(67, 97, 238, 0.1)';
  }
  
  function handleDragLeave() {
    uploadBox.style.backgroundColor = 'rgba(67, 97, 238, 0.05)';
  }
  
  function handleDrop(e) {
    if (isProcessing) return;
    e.preventDefault();
    e.stopPropagation();
    uploadBox.style.backgroundColor = 'rgba(67, 97, 238, 0.05)';
    
    if (e.dataTransfer.files && e.dataTransfer.files.length) {
      resetState();
      imageInput.files = e.dataTransfer.files;
      handleFileSelect({ target: imageInput });
    }
  }
  
  function handleFileSelect(e) {
    if (isProcessing) return;
    
    const file = e.target.files[0];
    if (!file) return;
    
    // Reset previous state
    resetState();
    isProcessing = true;
    showLoading(true);
    
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/bmp'];
    if (!validTypes.includes(file.type)) {
      showError('Please select a valid image file (JPG, PNG, WebP, GIF, BMP)');
      isProcessing = false;
      showLoading(false);
      return;
    }
    
    // Validate file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      showError('File size too large. Maximum 50MB allowed.');
      isProcessing = false;
      showLoading(false);
      return;
    }
    
    originalFile = file;
    hideError();
    
    // Display original image preview
    const reader = new FileReader();
    reader.onload = function(e) {
      originalImage.onload = function() {
        originalImage.src = e.target.result;
        originalPreview.style.display = 'block';
        
        // Show file details
        originalDetails.innerHTML = `
          <div class="file-meta">
            <p><strong>Name:</strong> <span>${escapeHtml(file.name)}</span></p>
            <p><strong>Type:</strong> <span>${file.type}</span></p>
            <p><strong>Size:</strong> <span>${formatFileSize(file.size)}</span></p>
            <p><strong>Dimensions:</strong> <span>${originalImage.naturalWidth} × ${originalImage.naturalHeight} px</span></p>
          </div>
        `;
        
        // Enable compress button
        compressBtn.disabled = false;
        isProcessing = false;
        showLoading(false);
      };
      
      originalImage.onerror = function() {
        showError('Failed to load image');
        isProcessing = false;
        showLoading(false);
      };
      
      originalImage.src = e.target.result;
    };
    
    reader.onerror = function() {
      showError('Failed to read file');
      isProcessing = false;
      showLoading(false);
    };
    
    reader.readAsDataURL(file);
  }
  
  function resetState() {
    compressedPreview.style.display = 'none';
    downloadBtn.disabled = true;
    compressedBlob = null;
    if (abortController) {
      abortController.abort();
      abortController = null;
    }
  }
  
  async function compressImage() {
    if (!originalFile || isProcessing) return;
    
    try {
      isProcessing = true;
      showLoading(true);
      hideError();
      resetState();
      abortController = new AbortController();
      
      const targetSizeKB = parseInt(targetSizeInput.value) || 100; // Default 100KB
      if (targetSizeKB < 10) {
        showError('Minimum target size is 10KB');
        return;
      }
      
      const format = formatSelect.value;
      const signal = abortController.signal;
      
      // Use Canvas API for compression
      const compressedDataUrl = await compressImageUsingCanvas(originalFile, targetSizeKB, format, signal);
      
      if (signal.aborted) return;
      
      // Create blob from data URL
      const blob = dataURItoBlob(compressedDataUrl);
      compressedBlob = blob;
      
      // Display compressed image
      compressedImage.onload = function() {
        compressedImage.src = compressedDataUrl;
        compressedPreview.style.display = 'block';
        
        // Show compressed file details
        compressedDetails.innerHTML = `
          <div class="file-meta">
            <p><strong>New Size:</strong> <span>${formatFileSize(blob.size)}</span></p>
            <p><strong>Reduction:</strong> <span>${calculateReduction(originalFile.size, blob.size)}%</span></p>
            <p><strong>Format:</strong> <span>${format.toUpperCase()}</span></p>
            <p><strong>Dimensions:</strong> <span>${compressedImage.naturalWidth} × ${compressedImage.naturalHeight} px</span></p>
            <p class="file-saved">Quality adjusted automatically</p>
          </div>
        `;
        
        // Enable download button
        downloadBtn.disabled = false;
        isProcessing = false;
        showLoading(false);
      };
      
      compressedImage.onerror = function() {
        showError('Failed to load compressed image');
        isProcessing = false;
        showLoading(false);
      };
      
      compressedImage.src = compressedDataUrl;
      
    } catch (error) {
      if (error.name !== 'AbortError') {
        showError('Error compressing image: ' + error.message);
        console.error('Compression error:', error);
      }
      isProcessing = false;
      showLoading(false);
    }
  }

  function compressImageUsingCanvas(file, targetSizeKB, format, signal) {
    return new Promise((resolve, reject) => {
      if (signal.aborted) return reject(new DOMException('Aborted', 'AbortError'));
      
      const reader = new FileReader();
      reader.onload = function(event) {
        if (signal.aborted) return reject(new DOMException('Aborted', 'AbortError'));
        
        const img = new Image();
        img.onload = function() {
          if (signal.aborted) return reject(new DOMException('Aborted', 'AbortError'));
          
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Calculate new dimensions while maintaining aspect ratio
          let width = img.width;
          let height = img.height;
          
          // For very large images, scale down first
          const MAX_DIMENSION = 2500;
          if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
            const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
            width = Math.floor(width * ratio);
            height = Math.floor(height * ratio);
          }
          
          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);
          
          // Quality adjustment (for formats that support it)
          let quality = 0.85; // Start with 85% quality
          let minQuality = 0.1;
          let maxQuality = 1.0;
          let iterations = 0;
          const maxIterations = 8;
          let bestResult = null;
          let bestSizeDiff = Infinity;
          
          function attemptCompression() {
            if (signal.aborted) return reject(new DOMException('Aborted', 'AbortError'));
            
            iterations++;
            
            // Get the mime type based on selected format
            let mimeType;
            switch(format) {
              case 'jpg':
              case 'jpeg': mimeType = 'image/jpeg'; break;
              case 'png': mimeType = 'image/png'; break;
              case 'webp': mimeType = 'image/webp'; break;
              case 'gif': mimeType = 'image/gif'; break;
              case 'bmp': mimeType = 'image/bmp'; break;
              default: mimeType = 'image/jpeg';
            }
            
            const dataUrl = canvas.toDataURL(mimeType, quality);
            const sizeKB = Math.floor((dataUrl.length * 0.75) / 1024); // Approximate KB
            const sizeDiff = Math.abs(sizeKB - targetSizeKB);
            
            // Keep track of best result so far
            if (sizeDiff < bestSizeDiff) {
              bestSizeDiff = sizeDiff;
              bestResult = dataUrl;
            }
            
            // Check if we're close enough or reached max iterations
            if (sizeDiff < targetSizeKB * 0.1 || iterations >= maxIterations) {
              return resolve(bestResult);
            }
            
            // Adjust quality for next iteration
            if (sizeKB > targetSizeKB) {
              maxQuality = quality;
              quality = (quality + minQuality) / 2;
            } else {
              minQuality = quality;
              quality = (quality + maxQuality) / 2;
            }
            
            setTimeout(attemptCompression, 0); // Prevent UI freeze
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
      
      signal.addEventListener('abort', () => {
        reject(new DOMException('Aborted', 'AbortError'));
      });
      
      reader.readAsDataURL(file);
    });
  }
  
  function downloadCompressedImage() {
    if (!compressedBlob || isProcessing) return;
    
    try {
      const url = URL.createObjectURL(compressedBlob);
      const a = document.createElement('a');
      a.href = url;
      
      // Generate filename: originalname_compressed.format
      const originalName = originalFile.name.replace(/\.[^/.]+$/, '');
      const extension = formatSelect.value === 'jpg' ? 'jpeg' : formatSelect.value;
      a.download = `${originalName}_compressed.${extension}`;
      
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
    } catch (error) {
      showError('Error downloading file: ' + error.message);
    }
  }
  
  // Helper Functions
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
    if (show) {
      loadingIndicator.hidden = false;
      compressBtn.disabled = true;
      uploadBox.style.pointerEvents = 'none';
    } else {
      loadingIndicator.hidden = true;
      compressBtn.disabled = false;
      uploadBox.style.pointerEvents = 'auto';
    }
  }
  
  function showError(message) {
    errorMessage.textContent = message;
    errorMessage.hidden = false;
    setTimeout(() => {
      errorMessage.style.opacity = '1';
    }, 10);
  }
  
  function hideError() {
    errorMessage.style.opacity = '0';
    setTimeout(() => {
      errorMessage.hidden = true;
    }, 300);
  }
  
  function escapeHtml(unsafe) {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
  
  // Initialize
  compressBtn.disabled = true;
  downloadBtn.disabled = true;
  loadingIndicator.hidden = true;
  errorMessage.hidden = true;
  errorMessage.style.opacity = '0';
  errorMessage.style.transition = 'opacity 0.3s ease';
});
