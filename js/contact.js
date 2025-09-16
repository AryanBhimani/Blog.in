// contact.js
import { auth, db } from "./firebase/firebase-config.js";
import {
  collection,
  addDoc,
  doc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

document.addEventListener("DOMContentLoaded", () => {
  const contactForm = document.getElementById("contact-form");

  // Watch auth state
  onAuthStateChanged(auth, (user) => {
    if (!user) {
      alert("⚠️ You must be logged in to send a message.", "error");
      contactForm.style.display = "none"; // hide form if not logged in
      return;
    }

    // Handle form submission when user is logged in
    contactForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      // Get form values
      const fullName = contactForm.querySelector("input[placeholder='Full Name']").value.trim();
      const email = contactForm.querySelector("input[placeholder='Email Address']").value.trim();
      const message = contactForm.querySelector("textarea").value.trim();

      if (!fullName || !email || !message) {
        alert("⚠️ Please fill out all fields.", "error");
        return;
      }

      try {
        // Reference to user's contacts subcollection
        const userDocRef = doc(db, "users", user.uid);
        const contactsRef = collection(userDocRef, "contacts");

        // Add contact data
        await addDoc(contactsRef, {
          fullName,
          email,
          message,
          createdAt: serverTimestamp(),
        });

        alert("✅ Message sent successfully!", "success");
        contactForm.reset();
      } catch (error) {
        console.error("Error saving message:", error);
        alert("❌ Failed to send message. Please try again.", "error");
      }
    });
  });
});