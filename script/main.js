document.addEventListener('DOMContentLoaded', function() {
  // DOM Elements
  const uploadBox = document.getElementById('uploadBox');
  const imageInput = document.getElementById('imageInput');
  const originalPreview = document.getElementById('originalPreview');
  const originalImage = document.getElementById('originalImage');
  const fileName = document.getElementById('fileName');
  const fileDimensions = document.getElementById('fileDimensions');
  const fileSize = document.getElementById('fileSize');
  const fileFormat = document.getElementById('fileFormat');
  const targetSize = document.getElementById('targetSize');
  const formatSelect = document.getElementById('formatSelect');
  const compressBtn = document.getElementById('compressBtn');
  const loadingIndicator = document.getElementById('loadingIndicator');
  const errorMessage = document.getElementById('errorMessage');
  const compressedPreviewContainer = document.getElementById('compressedPreviewContainer');
  const bulkDownloadControls = document.getElementById('bulkDownloadControls');
  const downloadAllBtn = document.getElementById('downloadAllBtn');
  const downloadZipBtn = document.getElementById('downloadZipBtn');
  
  // Global variables
  let originalFile = null;
  let compressedFiles = [];
  
  // Event Listeners
  uploadBox.addEventListener('click', () => imageInput.click());
  imageInput.addEventListener('change', handleImageUpload);
  compressBtn.addEventListener('click', compressImage);
  downloadAllBtn.addEventListener('click', downloadAllImages);
  downloadZipBtn.addEventListener('click', downloadAllAsZip);
  
  // Functions
  function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'];
    if (!validTypes.includes(file.type)) {
      showError('Please upload a valid image file (JPG, PNG, GIF, WebP, BMP)');
      return;
    }
    
    // Validate file size (50MB max)
    if (file.size > 50 * 1024 * 1024) {
      showError('File size exceeds 50MB limit. Please choose a smaller file.');
      return;
    }
    
    originalFile = file;
    errorMessage.hidden = true;
    
    // Display original image preview
    const reader = new FileReader();
    reader.onload = function(e) {
      originalImage.src = e.target.result;
      originalPreview.hidden = false;
      
      // Get image dimensions
      const img = new Image();
      img.onload = function() {
        fileDimensions.textContent = `Dimensions: ${this.width} × ${this.height} px`;
      };
      img.src = e.target.result;
      
      // Set file info
      fileName.textContent = file.name;
      fileSize.textContent = `Size: ${formatFileSize(file.size)}`;
      fileFormat.textContent = `Format: ${file.type.split('/')[1].toUpperCase()}`;
      
      // Enable compress button
      compressBtn.disabled = false;
      
      // Scroll to preview
      originalPreview.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };
    reader.readAsDataURL(file);
  }
  
  function compressImage() {
    if (!originalFile) return;
    
    // Show loading indicator
    loadingIndicator.hidden = false;
    compressBtn.disabled = true;
    compressedPreviewContainer.innerHTML = '';
    bulkDownloadControls.hidden = true;
    
    // Simulate compression (in a real app, you would use a compression library)
    setTimeout(() => {
      loadingIndicator.hidden = true;
      
      // Create a compressed version (mock)
      const compressedBlob = originalFile.slice(0, originalFile.size * 0.7); // Mock 30% reduction
      const compressedFile = new File([compressedBlob], `compressed_${originalFile.name}`, {
        type: originalFile.type
      });
      
      // Add to compressed files array
      compressedFiles = [compressedFile];
      
      // Display compressed preview
      displayCompressedImage(compressedFile);
      
      // Show bulk download options if multiple files
      if (compressedFiles.length > 1) {
        bulkDownloadControls.hidden = false;
      }
    }, 1500);
  }
  
  function displayCompressedImage(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      // Create compressed image card
      const card = document.createElement('div');
      card.className = 'compressed-details-card slide-up';
      
      card.innerHTML = `
        <img class="compressed-image" src="${e.target.result}" alt="Compressed image preview" loading="lazy" />
        <div class="file-meta">
          <h4 class="file-name">${file.name}</h4>
          <p class="file-dimensions">Dimensions: Loading...</p>
          <p class="file-size">Size: ${formatFileSize(file.size)}</p>
          <p class="file-format">Format: ${file.type.split('/')[1].toUpperCase()}</p>
          <p class="file-saved">Saved: ${Math.round((originalFile.size - file.size) / originalFile.size * 100)}%</p>
        </div>
        <button class="download-btn">Download</button>
      `;
      
      // Add to container
      compressedPreviewContainer.appendChild(card);
      
      // Get actual dimensions
      const img = new Image();
      img.onload = function() {
        card.querySelector('.file-dimensions').textContent = `Dimensions: ${this.width} × ${this.height} px`;
      };
      img.src = e.target.result;
      
      // Add download event
      const downloadBtn = card.querySelector('.download-btn');
      downloadBtn.addEventListener('click', () => downloadImage(file));
    };
    reader.readAsDataURL(file);
  }
  
  function downloadImage(file) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(file);
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
  }
  
  function downloadAllImages() {
    compressedFiles.forEach(file => downloadImage(file));
  }
  
  function downloadAllAsZip() {
    // In a real implementation, you would use JSZip to create a zip file
    alert('In a real implementation, this would download all images as a ZIP file.');
  }
  
  function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(2) + ' KB';
    else return (bytes / 1048576).toFixed(2) + ' MB';
  }
  
  function showError(message) {
    errorMessage.textContent = message;
    errorMessage.hidden = false;
    originalPreview.hidden = true;
    compressBtn.disabled = true;
  }
  
  // Drag and drop functionality
  uploadBox.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadBox.style.borderColor = var('--primary-dark');
    uploadBox.style.backgroundColor = rgba(67, 97, 238, 0.1);
  });
  
  uploadBox.addEventListener('dragleave', () => {
    uploadBox.style.borderColor = var('--primary-color');
    uploadBox.style.backgroundColor = rgba(67, 97, 238, 0.05);
  });
  
  uploadBox.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadBox.style.borderColor = var('--primary-color');
    uploadBox.style.backgroundColor = rgba(67, 97, 238, 0.05);
    
    if (e.dataTransfer.files.length) {
      imageInput.files = e.dataTransfer.files;
      const event = new Event('change');
      imageInput.dispatchEvent(event);
    }
  });
});
