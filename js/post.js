// /js/post.js
import { auth, db } from "./firebase/firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import {
  collection,
  addDoc,
  serverTimestamp,
  doc, // Import doc for referencing existing post
  getDoc, // Import getDoc to fetch existing post data
  updateDoc, // Import updateDoc to save edits
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

const createPostSection = document.getElementById("create-post");
const postBtn = document.getElementById("submit-post");
const titleInput = document.getElementById("post-title");
const contentInput = document.getElementById("post-content");
const headingEl = createPostSection.querySelector("h2");

// Function to get query parameters from the URL
const getQueryParam = (param) => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
};

const postIdToEdit = getQueryParam("edit");
let isEditMode = !!postIdToEdit;

if (isEditMode) {
  headingEl.textContent = "✏️ Edit Your Blog";
  postBtn.textContent = "Update Post";
}

onAuthStateChanged(auth, async (user) => {
  if (user) {
    createPostSection.style.display = "block";

    // 1. If in Edit Mode, Load the Post Data
    if (isEditMode) {
      try {
        // Reference to the specific post document
        const postRef = doc(db, "users", user.uid, "posts", postIdToEdit);
        const postSnap = await getDoc(postRef);

        if (postSnap.exists()) {
          const postData = postSnap.data();
          titleInput.value = postData.title;
          contentInput.value = postData.content;
        } else {
          alert("❌ Post not found or you don't have permission to edit it!");
          window.location.href = "profile.html"; // Redirect back
          return;
        }
      } catch (error) {
        console.error("❌ Error loading post for edit:", error);
        alert("❌ Failed to load post for editing");
        window.location.href = "profile.html";
        return;
      }
    }

    // 2. Attach the Submit/Update Handler
    postBtn.addEventListener("click", async () => {
      const title = titleInput.value.trim();
      const content = contentInput.value.trim();

      if (!title || !content) {
        alert("⚠️ Please fill in both title and content!");
        return;
      }

      try {
        if (isEditMode) {
          // **UPDATE EXISTING POST**
          const postRef = doc(db, "users", user.uid, "posts", postIdToEdit);
          await updateDoc(postRef, {
            title,
            content,
          });
          alert("✅ Post updated successfully!");
        } else {
          // **CREATE NEW POST**
          await addDoc(collection(db, "users", user.uid, "posts"), {
            title,
            content,
            createdAt: serverTimestamp(),
          });
          alert("✅ Post published successfully!");
        }

        // Redirect after success
        window.location.href = "profile.html";
      } catch (error) {
        console.error("❌ Error processing post:", error);
        alert(`❌ Failed to ${isEditMode ? "update" : "publish"} post`);
      }
    });
  } else {
    alert("⚠️ You must log in first!");
    window.location.href = "auth.html";
  }
});