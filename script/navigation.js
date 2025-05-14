// navigation.js
document.addEventListener("DOMContentLoaded", function () {
    // ✅ Hamburger Menu Setup
    function setupHamburgerMenu() {
        const hamburgerMenu = document.querySelector(".hamburger-menu");
        const navLinks = document.querySelector(".nav-links");

        if (!hamburgerMenu || !navLinks) return;

        hamburgerMenu.addEventListener("click", (e) => {
            e.stopPropagation();
            navLinks.classList.toggle("active");
            hamburgerMenu.classList.toggle("open");
        });

        document.addEventListener("click", (e) => {
            if (!navLinks.contains(e.target) && !hamburgerMenu.contains(e.target)) {
                navLinks.classList.remove("active");
                hamburgerMenu.classList.remove("open");
            }
        });

        navLinks.addEventListener("click", (e) => {
            if (e.target.tagName === "A") {
                navLinks.classList.remove("active");
                hamburgerMenu.classList.remove("open");
            }
        });
    }

    // Add more reusable UI behavior functions here if needed (e.g. footer logic)

    setupHamburgerMenu();
});
