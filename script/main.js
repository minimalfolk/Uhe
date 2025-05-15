<script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"></script>
<script>
document.addEventListener('DOMContentLoaded', () => {
  const imageInput = document.getElementById('imageInput');
  const originalPreview = document.getElementById('originalPreview');
  const originalImage = document.getElementById('originalImage');
  const fileName = document.getElementById('fileName');
  const fileDimensions = document.getElementById('fileDimensions');
  const fileSize = document.getElementById('fileSize');
  const fileFormat = document.getElementById('fileFormat');
  const compressBtn = document.getElementById('compressBtn');
  const formatSelect = document.getElementById('formatSelect');
  const targetSizeInput = document.getElementById('targetSize');
  const compressedPreviewContainer = document.getElementById('compressedPreviewContainer');
  const compressedImageTemplate = document.getElementById('compressedImageTemplate');
  const downloadAllBtn = document.getElementById('downloadAllBtn');
  const downloadZipBtn = document.getElementById('downloadZipBtn');
  const bulkDownloadControls = document.getElementById('bulkDownloadControls');
  const loadingIndicator = document.getElementById('loadingIndicator');

  let uploadedFiles = [];

  imageInput.addEventListener('change', handleFileUpload);
  compressBtn.addEventListener('click', handleCompression);
  downloadAllBtn.addEventListener('click', downloadAllImages);
  downloadZipBtn.addEventListener('click', downloadZip);

  function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
      originalImage.src = e.target.result;
      originalImage.onload = () => {
        fileName.textContent = file.name;
        fileDimensions.textContent = `Dimensions: ${originalImage.naturalWidth} x ${originalImage.naturalHeight}`;
        fileSize.textContent = `Size: ${(file.size / 1024).toFixed(2)} KB`;
        fileFormat.textContent = `Format: ${file.type}`;
        originalPreview.hidden = false;
        compressBtn.disabled = false;

        uploadedFiles = [{ file, dataURL: e.target.result }];
      };
    };
    reader.readAsDataURL(file);
  }

  async function handleCompression() {
    if (!uploadedFiles.length) return;

    loadingIndicator.hidden = false;
    compressedPreviewContainer.innerHTML = '';

    const format = formatSelect.value;
    const targetSize = parseInt(targetSizeInput.value);

    for (const { file, dataURL } of uploadedFiles) {
      const img = new Image();
      img.src = dataURL;
      await img.decode();

      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);

      let quality = 0.9;
      let outputBlob;

      do {
        outputBlob = await new Promise(resolve =>
          canvas.toBlob(resolve, `image/${format}`, quality)
        );
        quality -= 0.05;
      } while (outputBlob.size / 1024 > targetSize && quality > 0.1);

      const newSize = (outputBlob.size / 1024).toFixed(2);
      const savedPercent = (100 - (outputBlob.size / file.size) * 100).toFixed(1);

      const url = URL.createObjectURL(outputBlob);
      const clone = compressedImageTemplate.content.cloneNode(true);
      const imgTag = clone.querySelector('.compressed-image');
      const nameTag = clone.querySelector('.file-name');
      const dimTag = clone.querySelector('.file-dimensions');
      const sizeTag = clone.querySelector('.file-size');
      const formatTag = clone.querySelector('.file-format');
      const savedTag = clone.querySelector('.file-saved');
      const downloadBtn = clone.querySelector('.download-btn');

      imgTag.src = url;
      nameTag.textContent = `Compressed_${file.name}`;
      dimTag.textContent = `Dimensions: ${img.width} x ${img.height}`;
      sizeTag.textContent = `Size: ${newSize} KB`;
      formatTag.textContent = `Format: ${format.toUpperCase()}`;
      savedTag.textContent = `Saved: ${savedPercent}%`;
      downloadBtn.disabled = false;

      downloadBtn.addEventListener('click', () => {
        const a = document.createElement('a');
        a.href = url;
        a.download = `Compressed_${file.name}`;
        a.click();
      });

      compressedPreviewContainer.appendChild(clone);
      uploadedFiles[0].compressedBlob = outputBlob;
    }

    bulkDownloadControls.hidden = false;
    loadingIndicator.hidden = true;
  }

  function downloadAllImages() {
    uploadedFiles.forEach((item, index) => {
      const blob = item.compressedBlob;
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Compressed_${index + 1}.jpg`;
      a.click();
    });
  }

  async function downloadZip() {
    const zip = new JSZip();
    uploadedFiles.forEach((item, index) => {
      if (item.compressedBlob) {
        zip.file(`Compressed_${index + 1}.jpg`, item.compressedBlob);
      }
    });

    const blob = await zip.generateAsync({ type: 'blob' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'Compressed_Images.zip';
    a.click();
  }
});
</script>
