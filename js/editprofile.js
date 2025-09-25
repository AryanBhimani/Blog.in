import { auth, db } from "./firebase/firebase-config.js";
import {
  onAuthStateChanged,
  updateProfile,
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import {
  doc,
  setDoc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

const editProfileForm = document.getElementById("editProfileForm");
const usernameInput = document.getElementById("username");
const bioInput = document.getElementById("bio");

let currentUser = null;

// Load existing user data
onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user;

    // Load existing Firestore data
    const snap = await getDoc(doc(db, "users", user.uid));
    if (snap.exists()) {
      const data = snap.data();
      usernameInput.value = data.username || user.displayName || "";
      bioInput.value = data.bio || "";
    } else {
      usernameInput.value = user.displayName || "";
    }
  } else {
    alert("⚠️ Please login first!");
    window.location.href = "auth.html";
  }
});

// Handle profile update
editProfileForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!currentUser) return;

  const newUsername = usernameInput.value.trim();
  const newBio = bioInput.value.trim();

  try {
    // Update Firebase Auth (for displayName)
    await updateProfile(currentUser, { displayName: newUsername });

    // Save/update Firestore user document
    await setDoc(
      doc(db, "users", currentUser.uid),
      {
        username: newUsername,
        bio: newBio,
      },
      { merge: true }
    );

    alert("✅ Profile updated successfully!");
    window.location.href = "profile.html";
  } catch (error) {
    console.error("❌ Profile update error:", error);
    alert("❌ Error updating profile.");
  }
});
