document.addEventListener("DOMContentLoaded", function () {
    // Hamburger Menu Toggle
    function setupHamburgerMenu() {
        const hamburgerMenu = document.querySelector(".hamburger-menu");
        const navLinks = document.querySelector(".nav-links");

        if (!hamburgerMenu || !navLinks) return;

        hamburgerMenu.addEventListener("click", function (event) {
            event.stopPropagation();
            navLinks.classList.toggle("active");
            hamburgerMenu.classList.toggle("open");
        });

        document.addEventListener("click", function (event) {
            if (!navLinks.contains(event.target) && !hamburgerMenu.contains(event.target)) {
                navLinks.classList.remove("active");
                hamburgerMenu.classList.remove("open");
            }
        });

        navLinks.addEventListener("click", function (event) {
            if (event.target.tagName === "A") {
                navLinks.classList.remove("active");
                hamburgerMenu.classList.remove("open");
            }
        });
    }

    setupHamburgerMenu();

    // -------------------
    // Image Upload & Compression Logic
    // -------------------
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

    let originalFile, compressedBlob;

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

        if (file.size > 50 * 1024 * 1024) { // 50MB limit
            alert("File size is too large. Please upload an image smaller than 50MB.");
            return;
        }

        originalFile = file;
        const reader = new FileReader();

        reader.onload = function (e) {
            originalPreview.hidden = false;
            originalImage.src = e.target.result;

            const img = new Image();
            img.src = e.target.result;

            img.onload = function () {
                originalDetails.innerHTML = `Dimensions: ${img.width} x ${img.height}<br>Size: ${formatSize(file.size)}`;
                compressBtn.disabled = false;
            };
        };

        reader.readAsDataURL(file);
    }

    compressRange.addEventListener("input", function () {
        compressValue.textContent = `${compressRange.value}%`;
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

                const scaleFactor = 1 - compressRange.value / 100;
                const newWidth = Math.max(img.width, Math.round(img.width * scaleFactor));
                const newHeight = Math.max(img.height, Math.round(img.height * scaleFactor));

                // Keep the quality high by slightly adjusting the size if necessary
                canvas.width = newWidth;
                canvas.height = newHeight;
                ctx.drawImage(img, 0, 0, newWidth, newHeight);

                const selectedFormat = formatSelect.value;
                let compressionQuality = 0.9;  // Keeping a high quality (90%) for JPEG or other formats

                if (selectedFormat === "image/png") {
                    compressionQuality = 1; // PNG doesn’t use quality-based compression
                }

                canvas.toBlob(
                    (blob) => {
                        if (!blob) {
                            alert("Compression failed. Please try again.");
                            loadingIndicator.hidden = true;
                            return;
                        }

                        loadingIndicator.hidden = true;
                        compressedPreview.hidden = false;
                        compressedBlob = blob;

                        compressedImage.src = URL.createObjectURL(blob);

                        const newSize = blob.size;
                        const savedSize = originalFile.size - newSize;

                        compressedDetails.innerHTML = `
                            Dimensions: ${newWidth} x ${newHeight} <br>
                            Original Size: ${formatSize(originalFile.size)}<br>
                            New Size: <strong>${formatSize(newSize)}</strong><br>
                            Size Saved: <strong>${formatSize(savedSize)}</strong>
                        `;

                        // Show the download button only after compression
                        downloadBtn.disabled = false;
                    },
                    selectedFormat,
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
            alert("No compressed image available. Please compress an image first.");
            return;
        }

        const fileExtension = formatSelect.value.split("/")[1]; // Extract file extension
        const downloadLink = document.createElement("a");

        downloadLink.href = URL.createObjectURL(compressedBlob);
        downloadLink.download = `compressed-image.${fileExtension}`;
        
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);

        // Revoke the URL to free memory
        setTimeout(() => URL.revokeObjectURL(downloadLink.href), 100);
    });
});
