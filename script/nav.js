// Lightweight navigation script
document.addEventListener('DOMContentLoaded', () => {
  const navLinks = document.querySelector('.nav-links');
  const hamburger = document.querySelector('.hamburger-menu');

  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      navLinks.classList.toggle('show');
    });

    // close when clicking a link (event delegation)
    navLinks.addEventListener('click', (e) => {
      if (e.target.tagName === 'A') navLinks.classList.remove('show');
    });

    // close on outside click
    document.addEventListener('click', (e) => {
      if (!navLinks.contains(e.target) && !hamburger.contains(e.target)) {
        navLinks.classList.remove('show');
      }
    });
  }

  // sticky class on scroll (light)
  const header = document.querySelector('.sticky-header');
  window.addEventListener('scroll', () => {
    if (!header) return;
    header.classList.toggle('scrolled', window.scrollY > 40);
  });

  // set current year once
  const yearEl = document.getElementById('currentYear');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // FAQ toggle (simple)
  document.querySelectorAll('.faq-item h3').forEach(h => {
    h.addEventListener('click', () => {
      const p = h.nextElementSibling;
      if (!p) return;
      p.style.display = p.style.display === 'block' ? 'none' : 'block';
    });
  });
});
