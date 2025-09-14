// /js/navbar.js
import { auth } from "./firebase/firebase-config.js";
import {
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

// Load navbar into every page
fetch("./components/navbar.html")
  .then((res) => res.text())
  .then((data) => {
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
    const authButton = document.getElementById("auth-btn");

    if (authButton) {
      // ✅ Use Firebase Auth state
      onAuthStateChanged(auth, (user) => {
        if (user) {
          authButton.textContent = "Logout";
          authButton.classList.add("logout-button");
          authButton.onclick = async () => {
            await signOut(auth);
          };
        } else {
          authButton.textContent = "Login";
          authButton.classList.remove("logout-button");
          authButton.onclick = () => {
            window.location.href = "./auth.html";
          };
        }
      });
    }
  })
  .catch((err) => console.error("Navbar load error:", err));
