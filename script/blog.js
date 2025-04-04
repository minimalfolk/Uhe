document.addEventListener("DOMContentLoaded", () => {
  fetch("blogs.json")
    .then(response => response.json())
    .then(blogs => {
      const blogList = document.getElementById("blogList");

      blogs.forEach(blog => {
        const blogCard = document.createElement("div");
        blogCard.className = "blog-card";

        blogCard.innerHTML = `
          <h2><a href="./blog/${blog.slug}.html">${blog.title}</a></h2>
          <p class="blog-date">${new Date(blog.date).toLocaleDateString()}</p>
          <p>${blog.description}</p>
        `;

        blogList.appendChild(blogCard);
      });
    })
    .catch(error => {
      console.error("Error loading blogs:", error);
    });
});
