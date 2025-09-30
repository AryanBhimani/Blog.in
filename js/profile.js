// /js/profile.js
import { auth, db } from "./firebase/firebase-config.js";
import { onAuthStateChanged, signOut } 
  from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { 
  doc, 
  getDoc, 
  collection, 
  query, 
  orderBy, 
  onSnapshot, // Import onSnapshot for real-time updates
  deleteDoc, 
  updateDoc 
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
  const nameEl = document.getElementById("profile-name");
  const bioEl = document.getElementById("profile-bio");
  const loginBtn = document.getElementById("Login");
  const editBtn = document.getElementById("edit-profile");
  const postsList = document.getElementById("user-posts-list");
  
  // 1. Get the element where the post count is displayed (assuming structure from profile.html)
  const statsSection = document.querySelector('.profile-stats');
  const postCounterEl = statsSection ? statsSection.querySelector('h3') : null; 
  
  // NOTE: Based on your profile.html, the posts counter is the *first* h3 inside .profile-stats
  // profile.html structure:
  // <section class="profile-stats">
  //   <div> <h3>12</h3> <p>Posts</p> </div> <-- TARGET

  onAuthStateChanged(auth, async (user) => {
    if (user) {
      // ---- Logged In ----
      if (loginBtn) {
        loginBtn.textContent = "Logout";
        loginBtn.onclick = async () => { await signOut(auth); };
      }

      // Load profile data (one-time fetch)
      try {
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
      }

      if (editBtn) {
        editBtn.onclick = () => { window.location.href = "editprofile.html"; };
      }

      // 🔥 2. Load and listen to user's blog posts (Live Updates)
      if (postsList) {
        const postsQuery = query(
          collection(db, "users", user.uid, "posts"),
          orderBy("createdAt", "desc")
        );
        
        // Use onSnapshot to listen for real-time changes
        onSnapshot(postsQuery, (querySnapshot) => {
          
          // A. Update the Live Counter
          const postCount = querySnapshot.size;
          if (postCounterEl) {
              postCounterEl.textContent = postCount;
          }

          // B. Update the Posts List HTML
          if (querySnapshot.empty) {
            postsList.innerHTML = "<p>No blogs yet. Start writing one!</p>";
            return;
          }
          
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
          
          // Re-attach event listeners for delete and edit actions
          attachPostEventListeners(user, postsList);

        }, (error) => {
          console.error("❌ Failed to load user posts in real-time:", error);
          postsList.innerHTML = "<p>Failed to load blogs.</p>";
        });
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
        if (postCounterEl) postCounterEl.textContent = '0';
      }
    }
  });

  // 3. Helper function to attach event listeners (must be inside DOMContentLoaded)
  function attachPostEventListeners(user, postsList) {
    // 🔄 Attach event listeners for delete
    postsList.querySelectorAll(".delete-post").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        const postId = e.target.closest("article").dataset.id;
        if (confirm("Are you sure you want to delete this post?")) {
          // Deleting the document will automatically trigger the onSnapshot update
          await deleteDoc(doc(db, "users", user.uid, "posts", postId));
          alert("✅ Post deleted!");
          // The onSnapshot listener will re-render the list, so no need to remove HTML here.
        }
      });
    });

    // ✏️ Redirect to post.html for editing
    postsList.querySelectorAll(".edit-post").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const postId = e.target.closest("article").dataset.id;
        window.location.href = `post.html?edit=${postId}`;
      });
    });
  }
});