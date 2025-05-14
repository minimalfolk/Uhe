// image-compression.js
document.addEventListener("DOMContentLoaded", function () {
    const imageInput = document.getElementById("imageInput");
    const uploadBox = document.getElementById("uploadBox");
    const originalPreview = document.getElementById("originalPreview");
    const originalImage = document.getElementById("originalImage");
    const originalDetails = document.getElementById("originalDetails");
    const compressRange = document.getElementById("compressRange");
    const compressValue = document.getElementById("compressValue");
    const compressBtn = document.getElementById("compressBtn");
    const loadingIndicator = document.getElementById("loadingIndicator");
    const compressedPreview = document.getElementById("compressedPreview");
    const compressedImage = document.getElementById("compressedImage");
    const compressedDetails = document.getElementById("compressedDetails");
    const downloadBtn = document.getElementById("downloadBtn");
    const formatSelect = document.getElementById("formatSelect");
    const estimatedSizeText = document.getElementById("estimatedSize");

    let originalFile, originalSize, compressedBlob;

    uploadBox.addEventListener("click", () => imageInput.click());
    imageInput.addEventListener("change", handleFileUpload);
    uploadBox.addEventListener("dragover", (e) => e.preventDefault());
    uploadBox.addEventListener("drop", handleDrop);

    function handleFileUpload(event) {
        const file = event.target.files[0];
        if (file) processImage(file);
    }

    function handleDrop(event) {
        event.preventDefault();
        const file = event.dataTransfer.files[0];
        if (file) processImage(file);
    }

    function processImage(file) {
        if (!file.type.startsWith("image/")) {
            alert("Please upload a valid image file.");
            return;
        }

        if (file.size > 50 * 1024 * 1024) {
            alert("Please upload an image smaller than 50MB.");
            return;
        }

        originalFile = file;
        originalSize = file.size;

        const reader = new FileReader();
        reader.onload = function (e) {
            originalPreview.hidden = false;
            originalImage.src = e.target.result;

            const img = new Image();
            img.src = e.target.result;

            img.onload = function () {
                originalDetails.innerHTML = `Dimensions: ${img.width} x ${img.height}<br>Size: ${formatSize(originalSize)}`;
                compressBtn.disabled = false;
                updateEstimatedSize();
            };
        };
        reader.readAsDataURL(file);
    }

    compressRange.addEventListener("input", function () {
        compressValue.textContent = `${compressRange.value}%`;
        updateEstimatedSize();
    });

    compressBtn.addEventListener("click", function () {
        if (!originalFile) {
            alert("Please upload an image first.");
            return;
        }

        compressImage(originalFile);
    });

    function compressImage(file) {
        loadingIndicator.hidden = false;
        compressedPreview.hidden = true;

        const reader = new FileReader();
        reader.readAsDataURL(file);

        reader.onload = function (event) {
            const img = new Image();
            img.src = event.target.result;

            img.onload = function () {
                const canvas = document.createElement("canvas");
                const ctx = canvas.getContext("2d");

                const compressPercentage = parseInt(compressRange.value);
                const selectedFormat = formatSelect.value;
                const quality = compressPercentage / 100;

                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);

                canvas.toBlob(
                    (blob) => {
                        if (blob.size >= originalSize && quality < 0.9) {
                            let scale = Math.sqrt(quality);
                            canvas.width = Math.max(1, Math.round(img.width * scale));
                            canvas.height = Math.max(1, Math.round(img.height * scale));
                            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                            canvas.toBlob((retryBlob) => {
                                finalizeCompression(retryBlob, canvas.width, canvas.height);
                            }, selectedFormat, quality);
                        } else {
                            finalizeCompression(blob, img.width, img.height);
                        }
                    },
                    selectedFormat,
                    quality
                );
            };
        };
    }

    function finalizeCompression(blob, width, height) {
        loadingIndicator.hidden = true;
        compressedPreview.hidden = false;

        compressedBlob = blob;
        compressedImage.src = URL.createObjectURL(blob);

        const newSize = blob.size;
        const savedSize = originalSize - newSize;

        compressedDetails.innerHTML = `
            <strong>New Size:</strong> <strong>${formatSize(newSize)}</strong><br>
            <strong>Saved Size:</strong> ${formatSize(savedSize)}<br>
            <strong>New Dimensions:</strong> ${width} x ${height}
        `;

        downloadBtn.disabled = false;
    }

    function formatSize(size) {
        return size >= 1024 * 1024
            ? (size / (1024 * 1024)).toFixed(2) + " MB"
            : (size / 1024).toFixed(2) + " KB";
    }

    function updateEstimatedSize() {
        if (!originalFile) return;
        const quality = parseInt(compressRange.value) / 100;
        let estimated = originalSize * quality * 0.75;
        estimatedSizeText.textContent = `Estimated Size: ${formatSize(estimated)}`;
    }

    downloadBtn.addEventListener("click", function () {
        if (!compressedBlob) {
            alert("No compressed image available.");
            return;
        }

        const downloadLink = document.createElement("a");
        downloadLink.href = URL.createObjectURL(compressedBlob);
        downloadLink.download = `compressed-image.${formatSelect.value.split("/")[1]}`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
    });
});
