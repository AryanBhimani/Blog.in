import { auth, db } from "./firebase/firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

const createPostSection = document.getElementById("create-post");
const postBtn = document.getElementById("submit-post");
const titleInput = document.getElementById("post-title");
const contentInput = document.getElementById("post-content");
const headingEl = createPostSection.querySelector("h2");

// Get ?edit=ID from URL
const getQueryParam = (param) => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
};

const postIdToEdit = getQueryParam("edit");
let isEditMode = !!postIdToEdit;

// UI for edit mode
if (isEditMode) {
  headingEl.textContent = "✏️ Edit Your Blog";
  postBtn.textContent = "Update Post";
}

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    alert("⚠️ You must log in first!");
    window.location.href = "auth.html";
    return;
  }

  createPostSection.style.display = "block";

  // Load data in edit mode
  if (isEditMode) {
    try {
      const postRef = doc(db, "users", user.uid, "posts", postIdToEdit);
      const postSnap = await getDoc(postRef);

      if (!postSnap.exists()) {
        alert("❌ Post not found!");
        window.location.href = "profile.html";
        return;
      }

      const postData = postSnap.data();
      titleInput.value = postData.title;
      contentInput.value = postData.content;

    } catch (error) {
      console.error("Error loading post:", error);
      alert("❌ Error loading post!");
      window.location.href = "profile.html";
      return;
    }
  }

  // CREATE OR UPDATE
  postBtn.addEventListener("click", async (e) => {
    e.preventDefault();   // FIX #1: prevent default page reload

    const title = titleInput.value.trim();
    const content = contentInput.value.trim();

    if (!title || !content) {
      alert("⚠️ Please fill in both title and content!");
      return;
    }

    try {
      if (isEditMode) {
        const postRef = doc(db, "users", user.uid, "posts", postIdToEdit);
        await updateDoc(postRef, {
          title,
          content,
        });

        alert("✅ Post updated successfully!");
      } else {
        await addDoc(collection(db, "users", user.uid, "posts"), {
          title,
          content,
          createdAt: serverTimestamp(),
        });

        alert("✅ Blog posted successfully!");
      }

      window.location.href = "profile.html";
    } catch (error) {
      console.error("Error:", error);
      alert("❌ Failed to save your blog");
    }
  });
});