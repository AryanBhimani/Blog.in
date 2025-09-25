// import { auth, db } from "/js/firebase/firebase-config.js";
// import {
//   onAuthStateChanged,
//   updateProfile,
// } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
// import {
//   doc,
//   setDoc,
//   getDoc,
// } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// const editProfileForm = document.getElementById("editProfileForm");
// const usernameInput = document.getElementById("username");
// const bioInput = document.getElementById("bio");

// let currentUser = null;

// // Load existing user data
// onAuthStateChanged(auth, async (user) => {
//   if (user) {
//     currentUser = user;

//     // Load existing Firestore data
//     const snap = await getDoc(doc(db, "users", user.uid));
//     if (snap.exists()) {
//       const data = snap.data();
//       usernameInput.value = data.username || user.displayName || "";
//       bioInput.value = data.bio || "";
//     } else {
//       usernameInput.value = user.displayName || "";
//     }
//   } else {
//     alert("⚠️ Please login first!");
//     window.location.href = "auth.html";
//   }
// });

// // Handle profile update
// editProfileForm.addEventListener("submit", async (e) => {
//   e.preventDefault();

//   if (!currentUser) return;

//   const newUsername = usernameInput.value.trim();
//   const newBio = bioInput.value.trim();

//   try {
//     // Update Firebase Auth (for displayName)
//     await updateProfile(currentUser, { displayName: newUsername });

//     // Save/update Firestore user document
//     await setDoc(
//       doc(db, "users", currentUser.uid),
//       {
//         username: newUsername,
//         bio: newBio,
//       },
//       { merge: true }
//     );

//     alert("✅ Profile updated successfully!");
//     window.location.href = "profile.html";
//   } catch (error) {
//     console.error("❌ Profile update error:", error);
//     alert("❌ Error updating profile.");
//   }
// });



import { auth, db } from "/js/firebase/firebase-config.js";
import {
  onAuthStateChanged,
  updateProfile,
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

const editProfileForm = document.getElementById("editProfileForm");
const usernameInput = document.getElementById("username");
const bioInput = document.getElementById("bio");

let currentUser = null;

// Load existing user data
onAuthStateChanged(auth, async (user) => {
  console.log("Auth state changed:", user ? "User authenticated" : "No user");
  
  if (user) {
    currentUser = user;
    console.log("Current user ID:", user.uid);
    console.log("Current display name:", user.displayName);

    try {
      // Load existing Firestore data
      const userDocRef = doc(db, "users", user.uid);
      const snap = await getDoc(userDocRef);
      
      if (snap.exists()) {
        const data = snap.data();
        console.log("Loaded user data from Firestore:", data);
        usernameInput.value = data.username || user.displayName || "";
        bioInput.value = data.bio || "";
      } else {
        console.log("No Firestore document found, using Auth data");
        usernameInput.value = user.displayName || "";
        bioInput.value = "";
      }
    } catch (error) {
      console.error("Error loading user data:", error);
      usernameInput.value = user.displayName || "";
      bioInput.value = "";
    }
  } else {
    console.log("No user authenticated, redirecting to auth");
    alert("⚠️ Please login first!");
    window.location.href = "auth.html";
  }
});

// Handle profile update
editProfileForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  
  if (!currentUser) {
    alert("❌ Please login first!");
    return;
  }

  const newUsername = usernameInput.value.trim();
  const newBio = bioInput.value.trim();

  // Basic validation
  if (!newUsername) {
    alert("❌ Username is required!");
    return;
  }

  if (newUsername.length < 3) {
    alert("❌ Username must be at least 3 characters long!");
    return;
  }

  console.log("Starting profile update...");
  console.log("New username:", newUsername);
  console.log("New bio:", newBio);

  // Show loading state
  const submitButton = e.target.querySelector('button[type="submit"]');
  const originalText = submitButton.textContent;
  submitButton.textContent = "Updating...";
  submitButton.disabled = true;

  try {
    // Step 1: Update Firebase Auth profile
    console.log("Updating Firebase Auth profile...");
    await updateProfile(currentUser, { 
      displayName: newUsername 
    });
    console.log("✅ Firebase Auth profile updated");

    // Step 2: Update Firestore document
    console.log("Updating Firestore document...");
    const userDocRef = doc(db, "users", currentUser.uid);
    await setDoc(
      userDocRef,
      {
        uid: currentUser.uid,
        username: newUsername,
        bio: newBio,
        email: currentUser.email,
        updatedAt: serverTimestamp()
      },
      { merge: true }
    );
    console.log("✅ Firestore document updated");

    alert("✅ Profile updated successfully!");
    
    // Redirect after short delay
    setTimeout(() => {
      window.location.href = "profile.html";
    }, 1000);

  } catch (error) {
    console.error("❌ Profile update error:", error);
    console.error("Error code:", error.code);
    console.error("Error message:", error.message);
    
    let errorMessage = "❌ Error updating profile: ";
    
    switch (error.code) {
      case 'auth/network-request-failed':
        errorMessage += "Network error. Please check your connection.";
        break;
      case 'auth/too-many-requests':
        errorMessage += "Too many requests. Try again later.";
        break;
      case 'permission-denied':
        errorMessage += "Permission denied. Check your login status.";
        break;
      default:
        errorMessage += error.message || "Unknown error occurred.";
    }
    
    alert(errorMessage);
  } finally {
    // Reset button state
    submitButton.textContent = originalText;
    submitButton.disabled = false;
  }
});

// Add character counter for bio
if (bioInput) {
  const charCounter = document.createElement('div');
  charCounter.style.fontSize = '12px';
  charCounter.style.color = '#666';
  charCounter.style.marginTop = '5px';
  charCounter.style.textAlign = 'right';
  bioInput.parentNode.appendChild(charCounter);
  
  const updateCounter = () => {
    const length = bioInput.value.length;
    charCounter.textContent = `${length}/500 characters`;
    charCounter.style.color = length > 450 ? '#e74c3c' : '#666';
  };
  
  bioInput.addEventListener('input', updateCounter);
  updateCounter(); // Initial count
}
