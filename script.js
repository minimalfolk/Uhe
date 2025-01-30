// Select elements
const uploadBox = document.getElementById('uploadBox');
const imageInput = document.getElementById('imageInput');
const originalImage = document.getElementById('originalImage');
const originalDetails = document.getElementById('originalDetails');
const compressRange = document.getElementById('compressRange');
const compressValue = document.getElementById('compressValue');
const compressBtn = document.getElementById('compressBtn');
const compressedImage = document.getElementById('compressedImage');
const compressedDetails = document.getElementById('compressedDetails');
const sizeSaved = document.getElementById('sizeSaved');
const downloadBtn = document.getElementById('downloadBtn');
const shareBtn = document.getElementById('shareBtn');
const originalPreview = document.getElementById('originalPreview');
const compressedPreview = document.getElementById('compressedPreview');
const loadingIndicator = document.getElementById('loadingIndicator');

let originalFile = null;

// Function to convert size to MB/KB dynamically
function formatFileSize(sizeInBytes) {
  if (sizeInBytes >= 1024 * 1024) {
    return (sizeInBytes / (1024 * 1024)).toFixed(2) + ' MB';
  } else {
    return (sizeInBytes / 1024).toFixed(2) + ' KB';
  }
}

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
      originalPreview.hidden = false;

      // Wait for image to load before getting dimensions
      originalImage.onload = () => {
        originalDetails.textContent = `Dimensions: ${originalImage.naturalWidth} x ${originalImage.naturalHeight} pixels | Size: ${formatFileSize(file.size)}`;
        compressBtn.disabled = false;
      };
    };
    reader.readAsDataURL(file);
  } else {
    alert('Please upload a valid image file.');
  }
}

// Update compression percentage value dynamically
compressRange.addEventListener('input', () => {
  compressValue.textContent = `${compressRange.value}%`;
});

// Compress image when button is clicked
compressBtn.addEventListener('click', () => {
  const quality = parseInt(compressRange.value) / 100;
  compressImage(originalImage, quality);
});

function compressImage(img, quality) {
  loadingIndicator.hidden = false; // Show loading indicator

  setTimeout(() => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        const compressedUrl = URL.createObjectURL(blob);
        compressedImage.src = compressedUrl;
        compressedPreview.hidden = false;
        loadingIndicator.hidden = true; // Hide loading indicator

        compressedDetails.textContent = `Dimensions: ${canvas.width} x ${canvas.height} pixels | Size: ${formatFileSize(blob.size)}`;
        
        const sizeReduction = ((1 - blob.size / originalFile.size) * 100).toFixed(2);
        const savedSize = formatFileSize(originalFile.size - blob.size);
        sizeSaved.textContent = `Size reduced by ${sizeReduction}%! You saved ${savedSize}.`;
        
        downloadBtn.disabled = false;
        shareBtn.disabled = false;

        // Download functionality
        downloadBtn.onclick = () => {
          const link = document.createElement('a');
          link.href = compressedUrl;
          link.download = `compressed_${originalFile.name}`;
          link.click();
        };

        // Share functionality
        shareBtn.onclick = () => {
          navigator.clipboard.writeText(compressedUrl).then(() => {
            alert('Compressed image link copied to clipboard!');
          });
        };
      },
      'image/jpeg',
      quality
    );
  }, 1000); // Simulate processing time
}
