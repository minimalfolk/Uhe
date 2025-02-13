document.addEventListener("DOMContentLoaded", function () {
    // ✅ Fix: Optimized Hamburger Menu
    (function setupHamburgerMenu() {
        const hamburgerMenu = document.querySelector(".hamburger-menu");
        const navLinks = document.querySelector(".nav-links");

        if (!hamburgerMenu || !navLinks) return;

        hamburgerMenu.addEventListener("click", (event) => {
            event.stopPropagation();
            navLinks.classList.toggle("active");
            hamburgerMenu.classList.toggle("open");
        });

        document.addEventListener("click", (event) => {
            if (!navLinks.contains(event.target) && !hamburgerMenu.contains(event.target)) {
                navLinks.classList.remove("active");
                hamburgerMenu.classList.remove("open");
            }
        });

        navLinks.addEventListener("click", (event) => {
            if (event.target.tagName === "A") {
                navLinks.classList.remove("active");
                hamburgerMenu.classList.remove("open");
            }
        });
    })();

    // ✅ Optimize DOM References (Reduce Queries)
    const elements = {
        imageInput: document.getElementById("imageInput"),
        uploadBox: document.getElementById("uploadBox"),
        originalPreview: document.getElementById("originalPreview"),
        originalImage: document.getElementById("originalImage"),
        originalDetails: document.getElementById("originalDetails"),
        compressRange: document.getElementById("compressRange"),
        compressValue: document.getElementById("compressValue"),
        compressBtn: document.getElementById("compressBtn"),
        loadingIndicator: document.getElementById("loadingIndicator"),
        compressedPreview: document.getElementById("compressedPreview"),
        compressedImage: document.getElementById("compressedImage"),
        compressedDetails: document.getElementById("compressedDetails"),
        downloadBtn: document.getElementById("downloadBtn"),
        formatSelect: document.getElementById("formatSelect"),
        estimatedSizeText: document.getElementById("estimatedSize")
    };

    let originalFile, originalSize, compressedBlob;

    elements.uploadBox.addEventListener("click", () => elements.imageInput.click());
    elements.imageInput.addEventListener("change", handleFileUpload);
    elements.uploadBox.addEventListener("dragover", (event) => event.preventDefault());
    elements.uploadBox.addEventListener("drop", handleDrop);

    function handleFileUpload(event) {
        const file = event.target.files[0];
        if (file) processImage(file);
    }

    function handleDrop(event) {
        event.preventDefault();
        const file = event.dataTransfer.files[0];
        if (file) processImage(file);
    }

    async function processImage(file) {
        if (!file.type.startsWith("image/") || file.size > 50 * 1024 * 1024) {
            alert("Invalid image file or exceeds 50MB.");
            return;
        }

        originalFile = file;
        originalSize = file.size;
        elements.originalPreview.hidden = false;

        const img = new Image();
        img.src = URL.createObjectURL(file);
        img.loading = "lazy"; // ✅ Lazy Load Image

        img.onload = () => {
            elements.originalImage.src = img.src;
            elements.originalDetails.innerHTML = `Dimensions: ${img.width} x ${img.height}<br>Size: ${formatSize(originalSize)}`;
            elements.compressBtn.disabled = false;
            updateEstimatedSize();
        };
    }

    elements.compressRange.addEventListener("input", () => {
        elements.compressValue.textContent = `${elements.compressRange.value}%`;
        updateEstimatedSize();
    });

    elements.compressBtn.addEventListener("click", async () => {
        if (!originalFile) return alert("Please upload an image first.");
        await compressImage(originalFile);
    });

    async function compressImage(file) {
        elements.loadingIndicator.hidden = false;
        elements.compressedPreview.hidden = true;

        const imgBitmap = await createImageBitmap(file);
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        let compressPercentage = parseInt(elements.compressRange.value);
        let targetSize = Math.round((compressPercentage / 100) * originalSize);
        targetSize = Math.min(targetSize, originalSize); // ✅ Prevent Oversizing

        let scaleFactor = Math.sqrt(compressPercentage / 100);
        canvas.width = Math.max(1, Math.round(imgBitmap.width * scaleFactor));
        canvas.height = Math.max(1, Math.round(imgBitmap.height * scaleFactor));
        ctx.drawImage(imgBitmap, 0, 0, canvas.width, canvas.height);

        const selectedFormat = elements.formatSelect.value;
        const compressionQuality = selectedFormat === "image/png" ? 1 : compressPercentage / 100;

        canvas.toBlob((blob) => {
            elements.loadingIndicator.hidden = true;
            elements.compressedPreview.hidden = false;

            compressedBlob = blob;
            elements.compressedImage.src = URL.createObjectURL(blob);

            let newSize = blob.size;
            let savedSize = originalSize - newSize;

            elements.compressedDetails.innerHTML = `
                <strong>New Size:</strong> <strong>${formatSize(newSize)}</strong><br>
                <strong>Saved Size:</strong> ${formatSize(savedSize)}<br>
                <strong>New Dimensions:</strong> ${canvas.width} x ${canvas.height}
            `;

            elements.downloadBtn.disabled = false;
        }, selectedFormat, compressionQuality);
    }

    function formatSize(size) {
        return size >= 1024 * 1024 ? (size / (1024 * 1024)).toFixed(2) + " MB" : (size / 1024).toFixed(2) + " KB";
    }

    function updateEstimatedSize() {
        if (!originalFile) return;

        const compressPercentage = elements.compressRange.value;
        let estimatedSize = Math.round((compressPercentage / 100) * originalSize);
        elements.estimatedSizeText.textContent = `Estimated Size: ${formatSize(estimatedSize)}`;
    }

    elements.downloadBtn.addEventListener("click", () => {
        if (!compressedBlob) return alert("No compressed image available.");

        const downloadLink = document.createElement("a");
        downloadLink.href = URL.createObjectURL(compressedBlob);
        downloadLink.download = `compressed-image.${elements.formatSelect.value.split("/")[1]}`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
    });
});
