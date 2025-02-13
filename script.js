document.addEventListener("DOMContentLoaded", function () {
    // Hamburger Menu Functionality
    function toggleMenu() {
        const navLinks = document.querySelector('.nav-links');
        navLinks.classList.toggle('active');
    }

    // Close Hamburger Menu when clicking outside
    document.addEventListener('click', (event) => {
        const navLinks = document.querySelector('.nav-links');
        const hamburgerMenu = document.querySelector('.hamburger-menu');
        if (!navLinks.contains(event.target) && !hamburgerMenu.contains(event.target)) {
            navLinks.classList.remove('active');
        }
    });

    // Image Compression Logic
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
    const estimatedSize = document.getElementById("estimatedSize");
    const downloadBtn = document.getElementById("downloadBtn");
    const formatSelect = document.getElementById("formatSelect");
    const errorMessage = document.getElementById("errorMessage");

    let originalFile, originalFileSize, compressedBlob;

    // Drag and Drop Functionality
    uploadBox.addEventListener("click", () => imageInput.click());
    imageInput.addEventListener("change", handleFileUpload);
    uploadBox.addEventListener("dragover", (event) => event.preventDefault());
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
            errorMessage.textContent = "Please upload a valid image file.";
            errorMessage.hidden = false;
            return;
        }

        errorMessage.hidden = true;
        originalFile = file;
        originalFileSize = file.size;
        const reader = new FileReader();

        reader.onload = function (e) {
            originalPreview.hidden = false;
            originalImage.src = e.target.result;
            compressedPreview.hidden = true;

            const img = new Image();
            img.src = e.target.result;

            img.onload = function () {
                originalDetails.innerHTML = `Dimensions: ${img.width} x ${img.height}<br>Size: ${formatSize(originalFileSize)}`;
                compressBtn.disabled = false;
                updateCompressionDetails();
            };
        };

        reader.readAsDataURL(file);
    }

    // Update Compression Percentage
    compressRange.addEventListener("input", updateCompressionDetails);

    function updateCompressionDetails() {
        const compressPercentage = compressRange.value;
        compressValue.textContent = `${compressPercentage}%`;
        document.getElementById("compressionText").textContent = `Reducing image by ${compressPercentage}%`;

        const estimatedNewSize = (originalFileSize * compressPercentage) / 100; // Adjusted calculation
        estimatedSize.textContent = `You will get size: ${formatSize(estimatedNewSize)}`;
    }

    // Compress Image
    compressBtn.addEventListener("click", function () {
        if (!originalFile) {
            errorMessage.textContent = "Please upload an image first.";
            errorMessage.hidden = false;
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

                const selectedFormat = formatSelect.value;
                const targetSize = (originalFileSize * compressRange.value) / 100; // Adjust target size

                let compressionQuality = 1; // Default max quality

                if (selectedFormat !== "image/png") {
                    compressionQuality = (compressRange.value / 100).toFixed(2); // Scale quality
                }

                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                function adjustQuality(blob) {
                    if (blob.size > targetSize && compressionQuality > 0.05) {
                        compressionQuality -= 0.05; // Reduce quality in steps
                        canvas.toBlob(adjustQuality, selectedFormat, compressionQuality);
                    } else {
                        finalizeCompression(blob);
                    }
                }

                function finalizeCompression(blob) {
                    loadingIndicator.hidden = true;
                    compressedPreview.hidden = false;

                    compressedBlob = blob;
                    compressedImage.src = URL.createObjectURL(blob);

                    const newSize = blob.size;
                    const savedSize = originalFileSize - newSize;

                    compressedDetails.innerHTML = `
                        Dimensions: ${img.width} x ${img.height} <br>
                        Size saved: ${formatSize(savedSize)} <br>
                        <strong>New size: ${formatSize(newSize)}</strong>
                    `;

                    estimatedSize.textContent = `You will get size: ${formatSize(newSize)}`;
                    downloadBtn.disabled = false;
                }

                canvas.toBlob(adjustQuality, selectedFormat, compressionQuality);
            };
        };
    }

    // Format Size Helper Function
    function formatSize(size) {
        return size > 1024 * 1024
            ? (size / (1024 * 1024)).toFixed(2) + " MB"
            : (size / 1024).toFixed(2) + " KB";
    }

    // Download Compressed Image
    downloadBtn.addEventListener("click", function () {
        if (!compressedBlob) {
            errorMessage.textContent = "No compressed image available.";
            errorMessage.hidden = false;
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
