// Auth functions (signup, login, logout)
import { auth } from "./firebase-config.js";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } 
from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

// Signup
export async function signup(email, password) {
  await createUserWithEmailAndPassword(auth, email, password);
  alert("Signup successful!");
}

// Login
export async function login(email, password) {
  await signInWithEmailAndPassword(auth, email, password);
  alert("Login successful!");
}

// Logout
export async function logout() {
  await signOut(auth);
  alert("Logged out!");
}
