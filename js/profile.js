// /js/profile.js
import { auth, db } from "./firebase/firebase-config.js";
import { onAuthStateChanged, signOut } 
  from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { doc, getDoc, collection, query, orderBy, getDocs, deleteDoc, updateDoc } 
  from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
  const nameEl = document.getElementById("profile-name");
  const bioEl = document.getElementById("profile-bio");
  const loginBtn = document.getElementById("Login");
  const editBtn = document.getElementById("edit-profile");
  const postsList = document.getElementById("user-posts-list");

  onAuthStateChanged(auth, async (user) => {
    if (user) {
      // ---- Logged In ----
      if (loginBtn) {
        loginBtn.textContent = "Logout";
        loginBtn.onclick = async () => { await signOut(auth); };
      }

      try {
        // Load profile data from Firestore
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists()) {
          const data = snap.data();
          nameEl.textContent = data.username || "Anonymous";
          bioEl.textContent = data.bio || "No bio yet.";
        } else {
          nameEl.textContent = user.displayName || "Anonymous";
          bioEl.textContent = "No bio yet.";
        }
      } catch (err) {
        console.error("❌ Failed to load profile:", err);
        nameEl.textContent = user.displayName || "Anonymous";
        bioEl.textContent = "No bio yet.";
      }

      if (editBtn) {
        editBtn.onclick = () => { window.location.href = "editprofile.html"; };
      }

      // 🔥 Load this user's blog posts
      if (postsList) {
        try {
          const q = query(
            collection(db, "users", user.uid, "posts"),
            orderBy("createdAt", "desc")
          );
          const querySnapshot = await getDocs(q);

          if (querySnapshot.empty) {
            postsList.innerHTML = "<p>No blogs yet. Start writing one!</p>";
          } else {
            postsList.innerHTML = "";
            querySnapshot.forEach((docSnap) => {
              const post = docSnap.data();
              const postId = docSnap.id;

              postsList.innerHTML += `
                <article class="post-card" data-id="${postId}">
                  <h3>${post.title}</h3>
                  <p>${post.content}</p>
                  <small>
                    Posted on ${post.createdAt?.toDate().toLocaleString() || ""}
                  </small>
                  <div class="post-actions">
                    <button class="edit-post">✏️ Edit</button>
                    <button class="delete-post">🗑️ Delete</button>
                  </div>
                </article>
              `;
            });

            // 🔄 Attach event listeners for edit & delete
            postsList.querySelectorAll(".delete-post").forEach((btn) => {
              btn.addEventListener("click", async (e) => {
                const postId = e.target.closest("article").dataset.id;
                if (confirm("Are you sure you want to delete this post?")) {
                  await deleteDoc(doc(db, "users", user.uid, "posts", postId));
                  alert("✅ Post deleted!");
                  e.target.closest("article").remove();
                }
              });
            });

            postsList.querySelectorAll(".edit-post").forEach((btn) => {
              btn.addEventListener("click", async (e) => {
                const article = e.target.closest("article");
                const postId = article.dataset.id;
                const titleEl = article.querySelector("h3");
                const contentEl = article.querySelector("p");

                const newTitle = prompt("Edit title:", titleEl.textContent);
                const newContent = prompt("Edit content:", contentEl.textContent);

                if (newTitle && newContent) {
                  await updateDoc(doc(db, "users", user.uid, "posts", postId), {
                    title: newTitle,
                    content: newContent,
                  });
                  alert("✅ Post updated!");
                  titleEl.textContent = newTitle;
                  contentEl.textContent = newContent;
                }
              });
            });
          }
        } catch (err) {
          console.error("❌ Failed to load user posts:", err);
          postsList.innerHTML = "<p>Failed to load blogs.</p>";
        }
      }

    } else {
      // ---- Logged Out ----
      if (loginBtn) {
        loginBtn.textContent = "Login";
        loginBtn.onclick = () => { window.location.href = "auth.html"; };
      }
      if (editBtn) {
        editBtn.onclick = () => {
          alert("⚠️ Please login to edit your profile.");
          window.location.href = "auth.html";
        };
      }
      if (postsList) {
        postsList.innerHTML = "<p>⚠️ Please log in to see your blogs.</p>";
      }
    }
  });
});
