// Auth functions (signup, login, logout)
import { auth, db } from "./firebase-config.js";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile } 
from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { 
  getFirestore, 
  doc, 
  setDoc 
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";


export async function signup(email, password) {
  const name = document.getElementById("signup-name").value.trim();

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Save name to Firebase Auth profile
    await updateProfile(user, { displayName: name });

    // Save user info in Firestore
    await setDoc(doc(db, "users", user.uid), {
      name: name,
      email: email,
      createdAt: new Date().toISOString()
    });

    alert("Signup successful ✅");
    window.location.href = "index.html"; // redirect after signup
  } catch (error) {
    alert("Signup failed ❌: " + error.message);
  }
}

// -------------------- LOGIN --------------------
export async function login(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // --- NEW: Store a unique token in localStorage on successful login ---
    localStorage.setItem('authToken', user.uid);

    alert(`Welcome back, ${user.displayName || "User"} 🎉`);
    window.location.href = "index.html"; // redirect after login
  } catch (error) {
    alert("Login failed ❌: " + error.message);
  }
}

// Logout
export async function logout() {
  try {
    await signOut(auth);

    // --- NEW: Clear the token from localStorage on logout ---
    localStorage.removeItem('authToken');

    alert("Logged out!");
    window.location.href = "index.html"; // Redirect to homepage after logout
  } catch (error) {
    alert("Logout failed ❌: " + error.message);
  }
}