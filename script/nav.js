// Toggle mobile menu
function toggleMenu() {
  const navLinks = document.querySelector('.nav-links');
  navLinks.classList.toggle('active');
  
  // Close menu when clicking on a link
  document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('active');
    });
  });
}

// Sticky header on scroll
window.addEventListener('scroll', () => {
  const header = document.querySelector('.sticky-header');
  if (window.scrollY > 50) {
    header.classList.add('scrolled');
  } else {
    header.classList.remove('scrolled');
  }
});

// Close mobile menu when clicking outside
document.addEventListener('click', (e) => {
  const navLinks = document.querySelector('.nav-links');
  const hamburger = document.querySelector('.hamburger-menu');
  
  if (!navLinks.contains(e.target) && !hamburger.contains(e.target)) {
    navLinks.classList.remove('active');
  }
});

// Set current year in footer
document.getElementById('currentYear').textContent = new Date().getFullYear();

// To Faq Questions
document.addEventListener('DOMContentLoaded', function() {
    const faqQuestions = document.querySelectorAll('.faq-question');
    
    faqQuestions.forEach(question => {
      question.addEventListener('click', () => {
        // Toggle active class on question
        question.classList.toggle('active');
        
        // Get the answer element
        const answer = question.nextElementSibling;
        
        // Toggle show class on answer
        answer.classList.toggle('show');
      });
    });
  });
