document.getElementById("uploadBox").addEventListener("click", () => {
  document.getElementById("fileInput").click();
});

document.getElementById("fileInput").addEventListener("change", function (e) {
  const file = e.target.files[0];
  if (!file.type.startsWith("image/")) {
    alert("Please upload an image file.");
    return;
  }

  const reader = new FileReader();
  reader.onload = function (e) {
    document.getElementById("preview").src = e.target.result;
    document.getElementById("preview").style.display = "block";
    document.getElementById("imageSize").textContent = `Size: ${(file.size / 1024).toFixed(2)} KB`;
    document.getElementById("compressButton").style.display = "block";
  };
  reader.readAsDataURL(file);
});

function compressImage() {
  const img = document.getElementById("preview");
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  canvas.width = img.width;
  canvas.height = img.height;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  document.getElementById("processing").style.display = "block";

  canvas.toBlob((blob) => {
    document.getElementById("compressedImg").src = URL.createObjectURL(blob);
    document.getElementById("compressedImg").style.display = "block";
    document.getElementById("downloadButton").style.display = "block";
    document.getElementById("processing").style.display = "none";
  }, "image/jpeg", 0.7);
}

function toggleDarkMode() {
  document.body.classList.toggle("dark-mode");
}

function shareOnFacebook() {
  window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, "_blank");
}
