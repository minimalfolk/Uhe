document.addEventListener("DOMContentLoaded", function () {
    // Function to handle hamburger menu
    // Elements for uploading and compressing images
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
    // Elements for uploading and compressing images
    const imageInput = document.getElementById("imageInput");
    const uploadBox = document.getElementById("uploadBox");
    const originalPreview = document.getElementById("originalPreview");
    const originalImage = document.getElementById("originalImage");
    const originalDetails = document.getElementById("originalDetails");
    const compressRange = document.getElementById("compressRange");
    const compressValue = document.getElementById("compressValue");
    const compressBtn = document.getElementById("compressBtn");
    const loadingIndicator = document.getElementById("loadingIndicator");
    const estimatedSize = document.getElementById("estimatedSize");
    const formatSelect = document.getElementById("formatSelect");
    const downloadBtn = document.getElementById("downloadBtn");

    let originalFile, originalFileSize, compressedBlob;

    // Handle file upload (drag and drop or click)
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

    // Process the uploaded image
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
                updateCompressionDetails(); // Update compression details after loading the image
            };
        };

        reader.readAsDataURL(file);
    }

    // Update compression percentage and display estimated size
    compressRange.addEventListener("input", updateCompressionDetails);

    function updateCompressionDetails() {
        const compressPercentage = compressRange.value;
        compressValue.textContent = `${compressPercentage}%`;

        // Estimate new file size based on compression percentage
        const estimatedNewSize = originalFileSize * (compressPercentage / 100);
        let readableSize = formatSize(estimatedNewSize);

        // Update the size display
        estimatedSize.textContent = `You will get size: ${readableSize}`;
    }

    // Compress the image when the button is clicked
    compressBtn.addEventListener("click", function () {
        if (!originalFile) {
            alert("Please upload an image first.");
            return;
        }

        compressImage(originalFile);
    });

    // Perform image compression
    function compressImage(file) {
        loadingIndicator.hidden = false;
        const reader = new FileReader();
        reader.readAsDataURL(file);

        reader.onload = function (event) {
            const img = new Image();
            img.src = event.target.result;

            img.onload = function () {
                const canvas = document.createElement("canvas");
                const ctx = canvas.getContext("2d");

                // Compression scale factor based on the selected percentage
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

                // Create a compressed image blob
                canvas.toBlob(
                    (blob) => {
                        loadingIndicator.hidden = true;
                        compressedBlob = blob;

                        // Show compressed image and details
                        const compressedPreview = document.getElementById("compressedPreview");
                        compressedPreview.hidden = false;

                        // Show the new compressed image
                        const compressedImage = document.createElement("img");
                        compressedImage.src = URL.createObjectURL(blob);
                        compressedImage.style.width = "50%"; // Set to 50% of original preview size
                        compressedPreview.appendChild(compressedImage);

                        const newSize = blob.size;
                        const savedSize = originalFileSize - newSize;

                        // Show the new image details
                        document.getElementById("compressedDetails").innerHTML = `
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

    // Format the size of the file in KB or MB
    function formatSize(size) {
        return size > 1024 * 1024
            ? (size / (1024 * 1024)).toFixed(2) + " MB"
            : (size / 1024).toFixed(2) + " KB";
    }

    // Enable downloading the compressed image
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
