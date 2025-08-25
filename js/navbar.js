// Load navbar into every page
fetch("components/navbar.html")
  .then(res => res.text())
  .then(data => {
    document.body.insertAdjacentHTML("afterbegin", data);

    // Mobile menu toggle
    const menuToggle = document.querySelector(".menu-toggle");
    const navLinks = document.querySelector(".nav-links");

    menuToggle.addEventListener("click", () => {
      navLinks.classList.toggle("show");
    });
  })
  .catch(err => console.error("Navbar load error:", err));
