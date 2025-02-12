document.addEventListener("DOMContentLoaded", function () {
    // Function to handle hamburger menu
    function setupHamburgerMenu() {
        const hamburgerMenu = document.querySelector(".hamburger-menu");
        const navLinks = document.querySelector(".nav-links");

        if (!hamburgerMenu || !navLinks) return; // Exit if elements are missing

        // Toggle menu on click
        hamburgerMenu.addEventListener("click", function (event) {
            event.stopPropagation(); // Prevent event bubbling
            navLinks.classList.toggle("active");
        });

        // Close menu when clicking outside
        document.addEventListener("click", function (event) {
            if (!navLinks.contains(event.target) && !hamburgerMenu.contains(event.target)) {
                navLinks.classList.remove("active");
            }
        });

        // Close menu when clicking a nav link
        navLinks.addEventListener("click", function (event) {
            if (event.target.tagName === "A") {
                navLinks.classList.remove("active");
            }
        });
    }

    // Call the hamburger menu setup function
    setupHamburgerMenu();

    // Handle Image Upload
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
    const sizeSaved = document.getElementById("sizeSaved");
    const downloadBtn = document.getElementById("downloadBtn");
    const formatSelect = document.getElementById("formatSelect");
    const estimatedSize = document.getElementById("estimatedSize"); // New element for estimated size display

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

    // Update compression percentage value and show estimated file size
    compressRange.addEventListener("input", updateCompressionDetails);

    function updateCompressionDetails() {
        const compressPercentage = compressRange.value;
        compressValue.textContent = `${compressPercentage}%`;

        // Display the compression text
        const compressionText = `Reducing image by ${compressPercentage}%`;
        document.getElementById("compressionText").textContent = compressionText;

        // Estimate new file size based on compression percentage
        const estimatedNewSize = originalFileSize * (compressPercentage / 100);
        const estimatedSavedSize = originalFileSize - estimatedNewSize;
        let readableSize = formatSize(estimatedNewSize);

        // Update the size display
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

                const scaleFactor = 1 - compressRange.value / 100;
                const newWidth = Math.max(1, Math.round(img.width * scaleFactor));
                const newHeight = Math.max(1, Math.round(img.height * scaleFactor));

                canvas.width = newWidth;
                canvas.height = newHeight;
                ctx.drawImage(img, 0, 0, newWidth, newHeight);

                const selectedFormat = formatSelect.value;
                let compressionQuality = 1 - compressRange.value / 100;

                if (selectedFormat === "image/png") {
                    compressionQuality = 1;
                }

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

                        // Ensure estimated size matches the actual size
                        estimatedSize.textContent = `You will get size: ${formatSize(newSize)}`;
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
