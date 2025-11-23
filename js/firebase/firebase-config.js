// Firebase Config
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyB6sJPUbTMsOFNMh5c11-eC8SmG3KHdc84",
  authDomain: "blog-6e175.firebaseapp.com",
  projectId: "blog-6e175",
  storageBucket: "blog-6e175.firebasestorage.app",
  messagingSenderId: "1030746340117",
  appId: "1:1030746340117:web:7551aab0da35192040871c",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Export for use in other modules
export { app, auth, db, storage };

// Also make available globally for compatibility
window.firebaseApp = app;
window.firebaseAuth = auth;
window.firebaseDb = db;
window.firebaseStorage = storage;

console.log('Firebase v11.0.1 initialized successfully');