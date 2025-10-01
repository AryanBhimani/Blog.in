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
  onSnapshot, 
  deleteDoc, 
  updateDoc 
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
  const nameEl = document.getElementById("profile-name");
  const bioEl = document.getElementById("profile-bio");
  const loginBtn = document.getElementById("Login");
  const editBtn = document.getElementById("edit-profile");
  const postsList = document.getElementById("user-posts-list");
  
  const statsSection = document.querySelector('.profile-stats');
  const postCounterEl = statsSection ? statsSection.querySelector('h3') : null; 

  // Function to get query parameters
  const getQueryParam = (param) => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
  };
  
  const targetUserId = getQueryParam("userId");

  onAuthStateChanged(auth, async (user) => {
    
    // Determine the user whose profile we are viewing
    const viewingUser = targetUserId || (user ? user.uid : null);
    const isOwner = user && user.uid === viewingUser;

    if (viewingUser) {
      // ---- Viewing a Profile (Self or Other) ----
      
      // Hide/Show Edit Button based on ownership
      if (editBtn) {
        editBtn.style.display = isOwner ? 'inline-block' : 'none';
      }
      
      // Handle Login/Logout button display
      if (loginBtn) {
        if (user) {
          loginBtn.textContent = "Logout";
          loginBtn.onclick = async () => { await signOut(auth); };
        } else {
          loginBtn.textContent = "Login";
          loginBtn.onclick = () => { window.location.href = "auth.html"; };
        }
      }

      // Load profile data (one-time fetch)
      try {
        const snap = await getDoc(doc(db, "users", viewingUser));
        if (snap.exists()) {
          const data = snap.data();
          nameEl.textContent = data.username || "Anonymous";
          bioEl.textContent = data.bio || "No bio yet.";
        } else {
          nameEl.textContent = "User Profile";
          bioEl.textContent = "Profile data not found.";
        }
      } catch (err) {
        console.error("❌ Failed to load profile:", err);
      }

      // 🔥 Load and listen to the target user's blog posts (Live Updates)
      if (postsList) {
        // Hide post creation button if viewing someone else's profile
        const postButton = document.getElementById("post");
        if (postButton) postButton.style.display = isOwner ? 'inline-block' : 'none';

        const postsQuery = query(
          collection(db, "users", viewingUser, "posts"),
          orderBy("createdAt", "desc")
        );
        
        onSnapshot(postsQuery, (querySnapshot) => {
          
          // A. Update the Live Counter
          const postCount = querySnapshot.size;
          if (postCounterEl) {
              postCounterEl.textContent = postCount;
          }
          
          // Update the section title
          const postsTitle = document.querySelector('#user-posts h2');
          if (postsTitle) postsTitle.textContent = isOwner ? "📝 My Blogs" : "Recent Blogs";

          // B. Update the Posts List HTML
          if (querySnapshot.empty) {
            postsList.innerHTML = "<p>No blogs yet.</p>";
            return;
          }
          
          postsList.innerHTML = "";
          querySnapshot.forEach((docSnap) => {
            const post = docSnap.data();
            const postId = docSnap.id;
            
            // Only show Edit/Delete buttons if the current user is the owner
            const actionsHtml = isOwner ? `
                <div class="post-actions">
                  <button class="edit-post subtle-action-button">✏️ Edit</button>
                  <button class="delete-post subtle-action-button">🗑️ Delete</button>
                </div>
            ` : '';

            postsList.innerHTML += `
              <article class="post-card" data-id="${postId}">
                <h3>${post.title}</h3>
                <p>${post.content}</p>
                <small>
                  Posted on ${post.createdAt?.toDate().toLocaleString() || ""}
                </small>
                ${actionsHtml}
              </article>
            `;
          });
          
          // Re-attach event listeners only if the user is the owner (i.e., buttons exist)
          if(isOwner) {
            attachPostEventListeners(user, postsList);
          }

        }, (error) => {
          console.error("❌ Failed to load user posts in real-time:", error);
          postsList.innerHTML = "<p>Failed to load blogs.</p>";
        });
      }

    } else {
      // ---- Not Logged In and No targetUserId ----
      if (loginBtn) {
        loginBtn.textContent = "Login";
        loginBtn.onclick = () => { window.location.href = "auth.html"; };
      }
      if (editBtn) editBtn.style.display = 'none';
      const postButton = document.getElementById("post");
      if (postButton) postButton.style.display = 'none';

      nameEl.textContent = "Guest";
      bioEl.textContent = "Please log in to manage your profile.";
      if (postsList) {
        postsList.innerHTML = "<p>⚠️ Please log in to view blogs.</p>";
        if (postCounterEl) postCounterEl.textContent = '0';
      }
    }
  });

  // 3. Helper function to attach event listeners (only for the profile owner)
  function attachPostEventListeners(user, postsList) {
    postsList.querySelectorAll(".delete-post").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        const postId = e.target.closest("article").dataset.id;
        if (confirm("Are you sure you want to delete this post?")) {
          await deleteDoc(doc(db, "users", user.uid, "posts", postId));
          alert("✅ Post deleted!");
        }
      });
    });

    postsList.querySelectorAll(".edit-post").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const postId = e.target.closest("article").dataset.id;
        window.location.href = `post.html?edit=${postId}`;
      });
    });
  }
});