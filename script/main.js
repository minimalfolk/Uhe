const uploadBox = document.getElementById('uploadBox');
      const imageInput = document.getElementById('imageInput');
      const originalPreview = document.getElementById('originalPreview');
      const originalImage = document.getElementById('originalImage');
      const originalDetails = document.getElementById('originalDetails');
      const compressBtn = document.getElementById('compressBtn');
      const formatSelect = document.getElementById('formatSelect');
      const loadingIndicator = document.getElementById('loadingIndicator');
      const compressedPreview = document.getElementById('compressedPreview');
      const compressedImage = document.getElementById('compressedImage');
      const compressedDetails = document.getElementById('compressedDetails');
      const downloadBtn = document.getElementById('downloadBtn');
      const errorMessage = document.getElementById('errorMessage');

      // Variables
      let originalFile = null;
      let compressedBlob = null;

      // Event Listeners
      uploadBox.addEventListener('click', () => imageInput.click());
      uploadBox.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadBox.style.borderColor = '#3498db';
        uploadBox.style.backgroundColor = '#f8f9fa';
      });
      uploadBox.addEventListener('dragleave', () => {
        uploadBox.style.borderColor = '#bdc3c7';
        uploadBox.style.backgroundColor = 'transparent';
      });
      uploadBox.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadBox.style.borderColor = '#bdc3c7';
        uploadBox.style.backgroundColor = 'transparent';
        
        if (e.dataTransfer.files.length) {
          handleImageUpload(e.dataTransfer.files[0]);
        }
      });
      
      imageInput.addEventListener('change', (e) => {
        if (e.target.files.length) {
          handleImageUpload(e.target.files[0]);
        }
      });
      
      compressBtn.addEventListener('click', compressImage);
      downloadBtn.addEventListener('click', downloadImage);

      // Set current year in footer
      document.getElementById("currentYear").textContent = new Date().getFullYear();

      // Functions
      function handleImageUpload(file) {
        // Reset previous state
        errorMessage.style.display = 'none';
        originalPreview.style.display = 'none';
        compressedPreview.style.display = 'none';
        compressBtn.disabled = true;
        
        // Validate file
        if (!file.type.match('image.*')) {
          showError('Please upload an image file (JPEG, PNG, etc.)');
          return;
        }
        
        if (file.size > 50 * 1024 * 1024) { // 50MB limit
          showError('Image size should be less than 50MB');
          return;
        }
        
        originalFile = file;
        
        // Display original image
        const reader = new FileReader();
        reader.onload = function(e) {
          originalImage.src = e.target.result;
          originalDetails.textContent = `Original: ${formatFileSize(file.size)} • ${file.type}`;
          originalPreview.style.display = 'block';
          compressBtn.disabled = false;
        };
        reader.readAsDataURL(file);
      }
      
      function compressImage() {
        if (!originalFile) return;
        
        // Show loading indicator
        loadingIndicator.style.display = 'block';
        compressBtn.disabled = true;
        
        // Get selected format
        const format = formatSelect.value;
        
        // Use setTimeout to allow UI to update before compression starts
        setTimeout(() => {
          const targetSize = 20 * 1024; // 20KB in bytes
          compressToTargetSize(originalFile, targetSize, format)
            .then(blob => {
              compressedBlob = blob;
              const compressedUrl = URL.createObjectURL(blob);
              
              compressedImage.src = compressedUrl;
              compressedDetails.textContent = `Compressed: ${formatFileSize(blob.size)} • ${format}`;
              compressedPreview.style.display = 'block';
              downloadBtn.disabled = false;
              
              loadingIndicator.style.display = 'none';
            })
            .catch(error => {
              showError('Error compressing image: ' + error.message);
              loadingIndicator.style.display = 'none';
              compressBtn.disabled = false;
            });
        }, 100);
      }
      
      function compressToTargetSize(file, targetSize, format) {
        return new Promise((resolve, reject) => {
          const img = new Image();
          const reader = new FileReader();
          
          reader.onload = function(e) {
            img.src = e.target.result;
          };
          
          img.onload = function() {
            // Create canvas
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Initial dimensions
            let width = img.width;
            let height = img.height;
            
            // Quality settings
            let quality = 0.9;
            let step = 0.05;
            let blob = null;
            
            // Binary search approach to find optimal quality/size
            function attemptCompression() {
              canvas.width = width;
              canvas.height = height;
              ctx.drawImage(img, 0, 0, width, height);
              
              let mimeType = 'image/jpeg';
              if (format === 'png') mimeType = 'image/png';
              if (format === 'webp') mimeType = 'image/webp';
              
              canvas.toBlob(
                resultBlob => {
                  if (!resultBlob) {
                    reject(new Error('Failed to compress image'));
                    return;
                  }
                  
                  if (Math.abs(resultBlob.size - targetSize) < 500 || quality <= 0.1) {
                    // Close enough or minimum quality reached
                    resolve(resultBlob);
                  } else if (resultBlob.size > targetSize) {
                    // Need to reduce quality/size
                    if (quality > 0.1) {
                      quality -= step;
                      attemptCompression();
                    } else {
                      // If quality is already low, reduce dimensions
                      width = Math.floor(width * 0.95);
                      height = Math.floor(height * 0.95);
                      quality = 0.7; // Reset quality
                      attemptCompression();
                    }
                  } else {
                    // Can try higher quality
                    quality += step;
                    step /= 2;
                    attemptCompression();
                  }
                },
                mimeType,
                quality
              );
            }
            
            attemptCompression();
          };
          
          img.onerror = function() {
            reject(new Error('Failed to load image'));
          };
          
          reader.readAsDataURL(file);
        });
      }
      
      function downloadImage() {
        if (!compressedBlob) return;
        
        const a = document.createElement('a');
        a.href = URL.createObjectURL(compressedBlob);
        a.download = `compressed-20kb.${formatSelect.value}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
      
      function showError(message) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
      }
      
      function formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' bytes';
        else if (bytes < 1048576) return (bytes / 1024).toFixed(2) + ' KB';
        else return (bytes / 1048576).toFixed(2) + ' MB';
      }
    });
