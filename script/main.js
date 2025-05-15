function displayImageDetails(file) {
  const reader = new FileReader();
  reader.onload = function (e) {
    const img = new Image();
    img.onload = function () {
      const fileSizeKB = (file.size / 1024).toFixed(2);
      const fileFormat = file.type.split('/')[1].toUpperCase();

      document.getElementById('originalImage').src = e.target.result;
      document.getElementById('fileName').textContent = file.name;
      document.getElementById('fileDimensions').textContent = `Dimensions: ${img.width} x ${img.height}px`;
      document.getElementById('fileSize').textContent = `Size: ${fileSizeKB} KB`;
      document.getElementById('fileFormat').textContent = `Format: ${fileFormat}`;
      document.getElementById('originalPreview').hidden = false;
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}
function compressToTargetSize(file, targetSizeKB, callback) {
  const reader = new FileReader();
  reader.onload = function (event) {
    const img = new Image();
    img.onload = function () {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);

      let quality = 0.9;
      const step = 0.05;

      function tryCompress() {
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        const byteString = atob(dataUrl.split(',')[1]);
        const sizeKB = byteString.length / 1024;

        if (sizeKB <= targetSizeKB || quality <= 0.05) {
          callback(dataUrl, Math.round(sizeKB));
        } else {
          quality -= step;
          tryCompress();
        }
      }

      tryCompress();
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);
}
