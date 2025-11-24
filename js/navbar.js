// /js/navbar.js
import { auth } from "./firebase/firebase-config.js";
import { onAuthStateChanged, signOut } 
  from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

// Load navbar into every page
fetch("./components/navbar.html")
  .then(res => res.text())
  .then(data => {
    document.body.insertAdjacentHTML("afterbegin", data);

    // Mobile menu toggle + close on outside click
    const menuToggle = document.querySelector(".menu-toggle");
    const navLinks = document.querySelector(".nav-links");

    if (menuToggle && navLinks) {

      // Toggle menu when clicking the 3 lines
      menuToggle.addEventListener("click", (event) => {
        event.stopPropagation();   // Prevent immediate close
        navLinks.classList.toggle("show");
      });

      // Close menu when clicking outside
      document.addEventListener("click", (event) => {
        if (
          navLinks.classList.contains("show") && 
          !navLinks.contains(event.target) && 
          !menuToggle.contains(event.target)
        ) {
          navLinks.classList.remove("show");
        }
      });
    }

    // Get the login/logout button
    const authButton = document.getElementById('auth-btn');

    if (authButton) {
      // ✅ Use Firebase Auth state
      onAuthStateChanged(auth, (user) => {
        if (user) {
          authButton.textContent = 'Logout';
          authButton.classList.add('logout-button');
          authButton.onclick = async () => {
            await signOut(auth);
          };
        } else {
          authButton.textContent = 'Login';
          authButton.classList.remove('logout-button');
          authButton.onclick = () => {
            window.location.href = './auth.html';
          };
        }
      });
    }
  })
  .catch(err => console.error("Navbar load error:", err));


// FAB Add Blog Button
const fabButton = document.getElementById("fab-add-post");

let currentUser = null;

// Track login state
onAuthStateChanged(auth, (user) => {
  currentUser = user;

  if (user) {
    // Auth button as usual
    authButton.textContent = 'Logout';
    authButton.classList.add('logout-button');
    authButton.onclick = async () => { await signOut(auth); };
  } else {
    authButton.textContent = 'Login';
    authButton.classList.remove('logout-button');
    authButton.onclick = () => { window.location.href = './auth.html'; };
  }
});

// FAB button action (always visible)
if (fabButton) {
  fabButton.style.display = "flex"; // Always visible

  fabButton.onclick = () => {
    if (!currentUser) {
      // User not logged in → show alert
      alert("Please login first to post a blog!");
      return;
    }

    // User logged in → open post page
    window.location.href = "./post.html";
  };
}
