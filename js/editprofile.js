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
  reload
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

// Domain check for debugging
const currentDomain = window.location.hostname;
console.log("🌐 Current domain:", currentDomain);
console.log("🔥 Firebase project:", "blog-6e175");

if (currentDomain === 'aryanbhimani.github.io') {
  console.log("🚀 Running on GitHub Pages - ensure this domain is in Firebase authorized domains");
} else if (currentDomain === 'localhost' || currentDomain === '127.0.0.1') {
  console.log("🛠️ Running on localhost - should work fine");
}

// Enhanced error handling function
function handleError(error, context) {
  console.error(`❌ ${context} error:`, error);
  
  let errorMessage = `Error in ${context}: `;
  
  switch (error.code) {
    case 'auth/unauthorized-domain':
      errorMessage += `Domain '${currentDomain}' is not authorized. Please add it to Firebase Console → Authentication → Settings → Authorized domains.`;
      break;
    case 'auth/network-request-failed':
      errorMessage += "Network error. Please check your internet connection.";
      break;
    case 'permission-denied':
      errorMessage += "Access denied. Please check your login status and try again.";
      break;
    case 'unavailable':
      errorMessage += "Service temporarily unavailable. Please try again later.";
      break;
    case 'auth/user-token-expired':
      errorMessage += "Session expired. Please logout and login again.";
      break;
    default:
      errorMessage += error.message || "Unknown error occurred.";
  }
  
  alert(errorMessage);
  return errorMessage;
}

// Load existing user data
onAuthStateChanged(auth, async (user) => {
  console.log("🔄 Auth state changed:", user ? `User authenticated: ${user.uid}` : "No user");
  
  if (user) {
    currentUser = user;
    console.log("👤 User email:", user.email);
    console.log("👤 Display name:", user.displayName);

    try {
      console.log("📊 Loading user data from Firestore...");
      
      // Load existing Firestore data
      const userDocRef = doc(db, "users", user.uid);
      const snap = await getDoc(userDocRef);
      
      if (snap.exists()) {
        const data = snap.data();
        console.log("✅ Loaded data from Firestore:", data);
        
        // Populate form fields
        if (usernameInput) {
          usernameInput.value = data.username || user.displayName || "";
        }
        if (bioInput) {
          bioInput.value = data.bio || "";
        }
        
        console.log("✅ Form populated with existing data");
      } else {
        console.log("📝 No Firestore document found, using Auth data");
        
        // Use Firebase Auth data as fallback
        if (usernameInput) {
          usernameInput.value = user.displayName || "";
        }
        if (bioInput) {
          bioInput.value = "";
        }
        
        console.log("ℹ️ Form populated with Auth data");
      }
    } catch (error) {
      handleError(error, "loading profile data");
      
      // Fallback to Auth data even on error
      if (usernameInput) {
        usernameInput.value = user.displayName || "";
      }
      if (bioInput) {
        bioInput.value = "";
      }
    }
  } else {
    console.log("🔒 No user authenticated");
    
    // Check if it's an unauthorized domain issue
    if (currentDomain !== 'localhost' && currentDomain !== '127.0.0.1') {
      console.error(`⚠️ Potential unauthorized domain issue for: ${currentDomain}`);
      alert(`⚠️ Authentication may not work on this domain (${currentDomain}). Please ensure this domain is added to Firebase Console → Authentication → Settings → Authorized domains.`);
    } else {
      alert("⚠️ Please login first!");
    }
    
    window.location.href = "auth.html";
  }
});

// Handle profile update
editProfileForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  
  console.log("🚀 Profile update initiated");
  
  if (!currentUser) {
    alert("❌ Please login first!");
    return;
  }

  const newUsername = usernameInput?.value?.trim() || "";
  const newBio = bioInput?.value?.trim() || "";

  // Validation
  if (!newUsername) {
    alert("❌ Username is required!");
    return;
  }

  if (newUsername.length < 3) {
    alert("❌ Username must be at least 3 characters long!");
    return;
  }

  if (newBio.length > 500) {
    alert("❌ Bio must be less than 500 characters!");
    return;
  }

  console.log("📝 New username:", newUsername);
  console.log("📝 New bio length:", newBio.length);

  // Show loading state
  const submitButton = e.target.querySelector('button[type="submit"]');
  const originalText = submitButton.textContent;
  submitButton.textContent = "Updating...";
  submitButton.disabled = true;

  try {
    console.log("🔄 Step 1: Updating Firebase Auth profile...");
    
    // Update Firebase Auth (for displayName)
    await updateProfile(currentUser, { displayName: newUsername });
    console.log("✅ Firebase Auth profile updated");

    console.log("🔄 Step 2: Reloading user data...");
    
    // Reload user to ensure consistency
    await reload(currentUser);
    console.log("✅ User data reloaded");

    console.log("🔄 Step 3: Updating Firestore document...");
    
    // Save/update Firestore user document
    const userDocRef = doc(db, "users", currentUser.uid);
    await setDoc(
      userDocRef,
      {
        uid: currentUser.uid,
        username: newUsername,
        bio: newBio,
        email: currentUser.email,
        updatedAt: serverTimestamp(),
        lastModified: new Date().toISOString() // Fallback timestamp
      },
      { merge: true }
    );
    console.log("✅ Firestore document updated");

    // Verify the update
    const updatedDoc = await getDoc(userDocRef);
    if (updatedDoc.exists()) {
      console.log("✅ Update verification successful:", updatedDoc.data());
    }

    alert("✅ Profile updated successfully!");
    
    // Redirect after success
    setTimeout(() => {
      window.location.href = "profile.html";
    }, 1000);

  } catch (error) {
    handleError(error, "profile update");
  } finally {
    // Reset button state
    submitButton.textContent = originalText;
    submitButton.disabled = false;
  }
});

// Add character counter for bio
if (bioInput) {
  const charCounter = document.createElement('div');
  charCounter.style.cssText = `
    font-size: 12px;
    color: #666;
    margin-top: 5px;
    text-align: right;
  `;
  
  bioInput.parentNode.appendChild(charCounter);
  
  function updateCounter() {
    const length = bioInput.value.length;
    charCounter.textContent = `${length}/500 characters`;
    charCounter.style.color = length > 450 ? '#e74c3c' : '#666';
  }
  
  bioInput.addEventListener('input', updateCounter);
  updateCounter(); // Initial count
}

// Debug info (only show in development)
if (currentDomain === 'localhost' || currentDomain === '127.0.0.1') {
  console.log("🔧 Development mode detected");
  console.log("🔧 Add debug=true to URL for more info");
  
  if (window.location.search.includes('debug=true')) {
    setInterval(() => {
      console.log('=== DEBUG INFO ===');
      console.log('Current User:', currentUser);
      console.log('Auth State:', auth.currentUser);
      console.log('Username:', usernameInput?.value);
      console.log('Bio:', bioInput?.value);
      console.log('==================');
    }, 10000);
  }
}
