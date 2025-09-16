// /js/post.js
import { auth, db } from "./firebase/firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { collection, addDoc, serverTimestamp } 
  from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

const createPostSection = document.getElementById("create-post");
const postBtn = document.getElementById("submit-post");
const titleInput = document.getElementById("post-title");
const contentInput = document.getElementById("post-content");

onAuthStateChanged(auth, (user) => {
  if (user) {
    createPostSection.style.display = "block";

    postBtn.addEventListener("click", async () => {
      const title = titleInput.value.trim();
      const content = contentInput.value.trim();

      if (!title || !content) {
        alert("Please fill in both title and content!");
        return;
      }

      try {
        // ✅ Only store blog fields, no authorName
        await addDoc(collection(db, "users", user.uid, "posts"), {
          title,
          content,
          createdAt: serverTimestamp()
        });

        alert("✅ Post published successfully!");
        titleInput.value = "";
        contentInput.value = "";
      } catch (error) {
        console.error("Error adding post:", error);
        alert("❌ Failed to publish post");
      }
    });
  } else {
    alert("You must log in first!");
    window.location.href = "auth.html";
  }
});
