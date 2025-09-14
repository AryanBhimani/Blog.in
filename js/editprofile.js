// /js/editprofile.js
import { auth, db } from "./firebase/firebase-config.js";
import {
  onAuthStateChanged,
  updateProfile,
  reload,
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import {
  doc,
  setDoc,
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
  const usernameInput = document.getElementById("username");
  const bioInput = document.getElementById("bio");
  const form = document.getElementById("editProfileForm");
  const message = document.getElementById("message");

  // Prefill if user logged in
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      usernameInput.value = user.displayName || "";
      // (Optional) could also fetch Firestore bio to prefill
    } else {
      window.location.href = "auth.html";
    }
  });

  // Handle form submit
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return;

    try {
      // Update Firebase Auth displayName
      await updateProfile(user, {
        displayName: usernameInput.value.trim(),
      });

      // Ensure latest user info is loaded
      await reload(user);

      // Save to Firestore (merge so we don’t overwrite other fields)
      await setDoc(
        doc(db, "users", user.uid),
        {
          username: usernameInput.value.trim(),
          bio: bioInput.value.trim(),
          email: user.email,
        },
        { merge: true }
      );

      console.log("✅ Saved to Firestore:", {
        username: usernameInput.value.trim(),
        bio: bioInput.value.trim(),
      });

      message.style.display = "block";
      setTimeout(() => {
        window.location.href = "profile.html";
      }, 1000);
    } catch (err) {
      console.error("❌ Profile update failed:", err);
      alert("Failed: " + err.message);
    }
  });
});
