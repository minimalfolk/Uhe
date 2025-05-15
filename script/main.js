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
  
  // Event Listeners
  uploadBox.addEventListener('click', () => imageInput.click());
  uploadBox.addEventListener('dragover', handleDragOver);
  uploadBox.addEventListener('drop', handleDrop);
  imageInput.addEventListener('change', handleFileSelect);
  compressBtn.addEventListener('click', compressImage);
  downloadBtn.addEventListener('click', downloadCompressedImage);
  
  // Functions
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
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/bmp'];
    if (!validTypes.includes(file.type)) {
      showError('Please select a valid image file (JPG, PNG, WebP, GIF, BMP)');
      return;
    }
    
    // Validate file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      showError('File size too large. Maximum 50MB allowed.');
      return;
    }
    
    originalFile = file;
    hideError();
    
    // Display original image preview
    const reader = new FileReader();
    reader.onload = function(e) {
      originalImage.src = e.target.result;
      originalPreview.style.display = 'block';
      
      // Show file details
      originalDetails.innerHTML = `
        <div class="file-meta">
          <p><strong>Name:</strong> <span>${file.name}</span></p>
          <p><strong>Type:</strong> <span>${file.type}</span></p>
          <p><strong>Size:</strong> <span>${formatFileSize(file.size)}</span></p>
          <p><strong>Dimensions:</strong> <span id="originalDimensions">Calculating...</span></p>
        </div>
      `;
      
      // Get image dimensions
      const img = new Image();
      img.onload = function() {
        document.getElementById('originalDimensions').textContent = `${img.width} × ${img.height} px`;
      };
      img.src = e.target.result;
      
      // Enable compress button
      compressBtn.disabled = false;
    };
    reader.readAsDataURL(file);
  }
  
  async function compressImage() {
    if (!originalFile) return;
    
    try {
      showLoading(true);
      hideError();
      compressedPreview.style.display = 'none';
      
      const targetSizeKB = parseInt(targetSizeInput.value) || 100; // Default 100KB
      const format = formatSelect.value;
      
      // Use Canvas API for compression
      const compressedDataUrl = await compressImageUsingCanvas(originalFile, targetSizeKB, format);
      
      // Create blob from data URL
      const blob = dataURItoBlob(compressedDataUrl);
      compressedBlob = blob;
      
      // Display compressed image
      compressedImage.src = compressedDataUrl;
      compressedPreview.style.display = 'block';
      
      // Show compressed file details
      compressedDetails.innerHTML = `
        <div class="file-meta">
          <p><strong>New Size:</strong> <span>${formatFileSize(blob.size)}</span></p>
          <p><strong>Reduction:</strong> <span>${calculateReduction(originalFile.size, blob.size)}%</span></p>
          <p><strong>Format:</strong> <span>${format.toUpperCase()}</span></p>
          <p><strong>Dimensions:</strong> <span id="compressedDimensions">Calculating...</span></p>
        </div>
      `;
      
      // Get compressed image dimensions
      const img = new Image();
      img.onload = function() {
        document.getElementById('compressedDimensions').textContent = `${img.width} × ${img.height} px`;
      };
      img.src = compressedDataUrl;
      
      // Enable download button
      downloadBtn.disabled = false;
      
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
          
          // Calculate new dimensions (optional: maintain aspect ratio)
          let width = img.width;
          let height = img.height;
          
          // For very large images, scale down first
          const MAX_DIMENSION = 2000;
          if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
            const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
            width *= ratio;
            height *= ratio;
          }
          
          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);
          
          // Quality adjustment (for formats that support it)
          let quality = 0.8; // Start with 80% quality
          let dataUrl;
          
          // Binary search for optimal quality to hit target size
          let minQuality = 0.1;
          let maxQuality = 1.0;
          let iterations = 0;
          const maxIterations = 10;
          
          function attemptCompression() {
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
            
            dataUrl = canvas.toDataURL(mimeType, quality);
            const sizeKB = (dataUrl.length * 0.75) / 1024; // Approximate KB
            
            if (iterations >= maxIterations || Math.abs(sizeKB - targetSizeKB) < targetSizeKB * 0.1) {
              // Close enough or max iterations reached
              resolve(dataUrl);
              return;
            }
            
            if (sizeKB > targetSizeKB) {
              // Need lower quality
              maxQuality = quality;
              quality = (quality + minQuality) / 2;
            } else {
              // Can try higher quality
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
      
      reader.readAsDataURL(file);
    });
  }
  
  function downloadCompressedImage() {
    if (!compressedBlob) return;
    
    const url = URL.createObjectURL(compressedBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `compressed_${originalFile.name.replace(/\.[^/.]+$/, '')}.${formatSelect.value}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
  
  // Initialize
  compressBtn.disabled = true;
  downloadBtn.disabled = true;
  loadingIndicator.hidden = true;
  errorMessage.hidden = true;
});
