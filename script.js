document.addEventListener("DOMContentLoaded", function () {
    function setupHamburgerMenu() {
        const hamburgerMenu = document.querySelector(".hamburger-menu");
        const navLinks = document.querySelector(".nav-links");

        if (!hamburgerMenu || !navLinks) return;

        hamburgerMenu.addEventListener("click", function (event) {
            event.stopPropagation();
            navLinks.classList.toggle("active");
        });

        document.addEventListener("click", function (event) {
            if (!navLinks.contains(event.target) && !hamburgerMenu.contains(event.target)) {
                navLinks.classList.remove("active");
            }
        });

        navLinks.addEventListener("click", function (event) {
            if (event.target.tagName === "A") {
                navLinks.classList.remove("active");
            }
        });
    }

    setupHamburgerMenu();

    // Elements
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

    let originalFile, originalFileSize, compressedBlob;

    // Handle file upload
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
            alert("Please upload a valid image file.");
            return;
        }

        originalFile = file;
        originalFileSize = file.size;
        const reader = new FileReader();

        reader.onload = function (e) {
            originalPreview.hidden = false;
            compressedPreview.hidden = true; // Hide compressed preview when new file is uploaded
            originalImage.src = e.target.result;

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

    // Update estimated compression size
    compressRange.addEventListener("input", updateCompressionDetails);

    function updateCompressionDetails() {
        const compressPercentage = compressRange.value;
        compressValue.textContent = `${compressPercentage}%`;

        // Estimate new file size accurately
        const estimatedNewSize = originalFileSize * (compressPercentage / 100);
        let readableSize = formatSize(estimatedNewSize);

        estimatedSize.textContent = `You will get size: ${readableSize}`;
    }

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

                // Calculate accurate compression ratio
                const compressRatio = compressRange.value / 100;
                const estimatedSizeBytes = Math.max(1, originalFileSize * compressRatio); // Ensure a valid size

                let compressionQuality = 1 - compressRatio;
                if (formatSelect.value === "image/png") compressionQuality = 1; // PNG should have max quality

                // Resize image while maintaining aspect ratio
                const scaleFactor = Math.sqrt(compressRatio);
                const newWidth = Math.max(1, Math.round(img.width * scaleFactor));
                const newHeight = Math.max(1, Math.round(img.height * scaleFactor));

                canvas.width = newWidth;
                canvas.height = newHeight;
                ctx.drawImage(img, 0, 0, newWidth, newHeight);

                canvas.toBlob(
                    (blob) => {
                        loadingIndicator.hidden = true;
                        compressedPreview.hidden = false;

                        compressedBlob = blob;
                        compressedImage.src = URL.createObjectURL(blob);

                        const newSize = blob.size;
                        const savedSize = originalFileSize - newSize;

                        compressedDetails.innerHTML = `
                            Dimensions: ${newWidth} x ${newHeight} <br>
                            Size saved: ${formatSize(savedSize)} <br>
                            <strong>New size: ${formatSize(newSize)}</strong>
                        `;

                        downloadBtn.disabled = false;

                        // Ensure final size is displayed correctly
                        estimatedSize.textContent = `You will get size: ${formatSize(newSize)}`;
                    },
                    formatSelect.value,
                    compressionQuality
                );
            };
        };
    }

    function formatSize(size) {
        return size > 1024 * 1024
            ? (size / (1024 * 1024)).toFixed(2) + " MB"
            : (size / 1024).toFixed(2) + " KB";
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
