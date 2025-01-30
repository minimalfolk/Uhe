// Cache DOM elements
const uploadBox = document.getElementById('uploadBox');
const imageInput = document.getElementById('imageInput');
const originalImagesContainer = document.getElementById('originalImages');
const compressRange = document.getElementById('compressRange');
const compressBtn = document.getElementById('compressBtn');
const compressedImagesContainer = document.getElementById('compressedImages');
const sizeSaved = document.getElementById('sizeSaved');
const downloadBtn = document.getElementById('downloadBtn');
const comparisonSlider = document.getElementById('comparisonSlider');
const beforeImage = document.getElementById('beforeImage');
const afterImage = document.getElementById('afterImage');

// SEO Schema Markup
const schemaMarkup = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "How to Compress an Image Online",
  "step": [
    {
      "@type": "HowToStep",
      "name": "Upload Image",
      "text": "Drag and drop or click to upload your image."
    },
    {
      "@type": "HowToStep",
      "name": "Choose Compression Level",
      "text": "Adjust the slider to select how much you want to compress."
    },
    {
      "@type": "HowToStep",
      "name": "Download the Compressed Image",
      "text": "Click the download button to save the reduced file."
    }
  ]
};

document.addEventListener("DOMContentLoaded", () => {
  // Insert schema markup in the head for SEO optimization
  const schemaScript = document.createElement("script");
  schemaScript.type = "application/ld+json";
  schemaScript.innerText = JSON.stringify(schemaMarkup);
  document.head.appendChild(schemaScript);
});

// Handle Image Upload
function handleImageUpload(file) {
  const reader = new FileReader();

  reader.onload = (e) => {
    const imgElement = document.createElement('img');
    imgElement.src = e.target.result;
    imgElement.alt = file.name;
    imgElement.classList.add("uploaded-image");

    // Add to the preview container
    const imagePreview = document.createElement('div');
    imagePreview.classList.add("image-preview");
    imagePreview.appendChild(imgElement);

    // Show image preview in container
    originalImagesContainer.appendChild(imagePreview);

    // Display image details
    const imgSize = file.size >= 1024 ? `${(file.size / 1024).toFixed(2)} MB` : `${(file.size).toFixed(2)} KB`;
    const imgDetails = `Dimensions: ${imgElement.naturalWidth} x ${imgElement.naturalHeight} pixels | Size: ${imgSize}`;
    const imgDetailsElement = document.createElement('p');
    imgDetailsElement.textContent = imgDetails;
    imagePreview.appendChild(imgDetailsElement);

    compressBtn.disabled = false;
  };

  reader.readAsDataURL(file);
}

// Trigger file upload via click
uploadBox.addEventListener('click', () => imageInput.click());

// Handle file input change
imageInput.addEventListener('change', (e) => {
  const files = e.target.files;
  if (files && files.length) {
    // Reset preview
    originalImagesContainer.innerHTML = '';
    Array.from(files).forEach(file => handleImageUpload(file));
});

// Compress image and show preview
compressBtn.addEventListener('click', () => {
  const quality = parseInt(compressRange.value) / 100;
  const images = Array.from(originalImagesContainer.querySelectorAll("img"));
  
  images.forEach((img) => compressImage(img, quality));
});

// Compress the image and show the result
function compressImage(img, quality) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  // Convert to Blob with selected quality
  canvas.toBlob(
    (blob) => {
      const compressedUrl = URL.createObjectURL(blob);
      const compressedImgElement = document.createElement('img');
      compressedImgElement.src = compressedUrl;
      compressedImgElement.classList.add("compressed-image");

      // Append to compressed images container
      const compressedPreview = document.createElement('div');
      compressedPreview.classList.add("compressed-preview");
      compressedPreview.appendChild(compressedImgElement);

      // Display compression details
      const compressedSize = blob.size >= 1024 ? `${(blob.size / 1024).toFixed(2)} MB` : `${(blob.size).toFixed(2)} KB`;
      const imgDetailsElement = document.createElement('p');
      imgDetailsElement.textContent = `Dimensions: ${canvas.width} x ${canvas.height} pixels | Size: ${compressedSize}`;
      compressedPreview.appendChild(imgDetailsElement);
      compressedImagesContainer.appendChild(compressedPreview);

      const reductionPercentage = ((1 - blob.size / img.src.length) * 100).toFixed(2);
      sizeSaved.textContent = `Size reduced by ${reductionPercentage}%`;

      // Enable download button
      downloadBtn.disabled = false;
      downloadBtn.onclick = () => {
        const link = document.createElement('a');
        link.href = compressedUrl;
        link.download = `compressed_${img.alt}`;
        link.click();
      };

      // Show comparison slider
      comparisonSlider.hidden = false;
      beforeImage.src = img.src;
      afterImage.src = compressedUrl;
    },
    'image/jpeg',
    quality
  );
}

// Performance and Fast Loading Optimization
// Using lazy loading for images to enhance performance
const lazyLoadImages = document.querySelectorAll('img[loading="lazy"]');
const lazyLoad = () => {
  lazyLoadImages.forEach((img) => {
    if (img.getBoundingClientRect().top <= window.innerHeight) {
      img.src = img.dataset.src;
      img.removeAttribute('loading');
    }
  });
};

document.addEventListener("scroll", lazyLoad);
lazyLoad();  // Initial call on page load
