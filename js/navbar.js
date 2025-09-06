// Function to check if the user is logged in
const isLoggedIn = () => {
  // Check for the existence of an authentication token in localStorage
  return localStorage.getItem('authToken') !== null;
};

// Function to handle the logout process
const logout = () => {
  // Remove the authentication token from localStorage
  localStorage.removeItem('authToken');
  // Optional: Remove any other user-related data
  // localStorage.removeItem('userProfile');

  // Redirect to the home page or login page
  window.location.href = './index.html';
};

// Load navbar into every page
fetch("./components/navbar.html")
  .then(res => res.text())
  .then(data => {
    document.body.insertAdjacentHTML("afterbegin", data);

    // Mobile menu toggle
    const menuToggle = document.querySelector(".menu-toggle");
    const navLinks = document.querySelector(".nav-links");

    if (menuToggle && navLinks) {
      menuToggle.addEventListener("click", () => {
        navLinks.classList.toggle("show");
      });
    }

    // Get the login/logout button
    const authButton = document.getElementById('auth-btn');

    // Check login status and set up the button
    if (authButton) {
      if (isLoggedIn()) {
        // User is logged in, change button to "Logout"
        authButton.textContent = 'Logout';
        authButton.classList.add('logout-button'); // Optional: Add a class for different styling
        authButton.addEventListener('click', logout);
      } else {
        // User is not logged in, keep button as "Login"
        authButton.textContent = 'Login';
        authButton.classList.remove('logout-button');
        authButton.addEventListener('click', () => {
          window.location.href = './auth.html';
        });
      }
    }
  })
  .catch(err => console.error("Navbar load error:", err));