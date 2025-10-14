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
  updateDoc,
  setDoc,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
  const nameEl = document.getElementById("profile-name");
  const bioEl = document.getElementById("profile-bio");
  const loginBtn = document.getElementById("Login");
  const editBtn = document.getElementById("edit-profile");
  const postsList = document.getElementById("user-posts-list");
  
  // NEW ELEMENTS
  const followBtn = document.getElementById("follow-btn");
  const followersCountEl = document.getElementById("followers-count");
  const followingCountEl = document.getElementById("following-count");
  
  // NEW CLICKABLE STATS
  const followersStat = document.getElementById("followers-stat");
  const followingStat = document.getElementById("following-stat");
  
  // NEW LIST CONTAINERS
  const followersListContainer = document.getElementById("followers-users");
  const followingListContainer = document.getElementById("following-users");
  const followersListSection = document.getElementById("followers-list-section");
  const followingListSection = document.getElementById("following-list-section");
  
  const statsSection = document.querySelector('.profile-stats');
  const postCounterEl = document.getElementById("posts-count"); 

  // Function to get query parameters
  const getQueryParam = (param) => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
  };
  
  const targetUserId = getQueryParam("userId");

  // --- Core Follow/Unfollow Logic ---

  const checkFollowingStatus = async (currentUserId, targetId) => {
      const followRef = doc(db, "following", currentUserId, "userFollowing", targetId);
      const docSnap = await getDoc(followRef);
      return docSnap.exists();
  };

  const toggleFollow = async (currentUserId, targetId, isCurrentlyFollowing) => {
      const followingRef = doc(db, "following", currentUserId, "userFollowing", targetId);
      const followersRef = doc(db, "followers", targetId, "userFollowers", currentUserId);

      if (isCurrentlyFollowing) {
          await deleteDoc(followingRef);
          await deleteDoc(followersRef);
      } else {
          await setDoc(followingRef, { followedAt: new Date() }); 
          await setDoc(followersRef, { followedAt: new Date() });
      }
  };
  
  // --- Live Stats Listener ---

  const loadFollowStats = (viewingUser) => {
      // 1. Load Followers count
      const followersQuery = collection(db, "followers", viewingUser, "userFollowers");
      onSnapshot(followersQuery, (snapshot) => {
          if (followersCountEl) {
              followersCountEl.textContent = snapshot.size;
          }
      });

      // 2. Load Following count
      const followingQuery = collection(db, "following", viewingUser, "userFollowing");
      onSnapshot(followingQuery, (snapshot) => {
          if (followingCountEl) {
              followingCountEl.textContent = snapshot.size;
          }
      });
  };

  // --- List Fetching Logic ---
  
  // Helper to fetch user data and render list item (NO AVATARS)
  const renderUserList = async (listContainer, userIds, emptyMessage) => {
      if (userIds.length === 0) {
          listContainer.innerHTML = `<p>${emptyMessage}</p>`;
          return;
      }
      
      let listHtml = "";
      for (const userId of userIds) {
          const userSnap = await getDoc(doc(db, "users", userId));
          if (userSnap.exists()) {
              const userData = userSnap.data();
              const username = userData.username || "Anonymous";
              listHtml += `
                  <a href="profile.html?userId=${userId}" class="user-list-item">
                      <span>${username}</span>
                  </a>
              `;
          }
      }
      listContainer.innerHTML = listHtml;
  };
  
  /** Fetches all user data for lists and Renders it (visibility controlled by click handlers). */
  const fetchAndRenderUserLists = async (viewingUser) => {
      // 1. Get Followers List
      const followersQuery = collection(db, "followers", viewingUser, "userFollowers");
      const followersSnapshot = await getDocs(followersQuery);
      const followerIds = followersSnapshot.docs.map(doc => doc.id);
      
      // 2. Get Following List
      const followingQuery = collection(db, "following", viewingUser, "userFollowing");
      const followingSnapshot = await getDocs(followingQuery);
      const followingIds = followingSnapshot.docs.map(doc => doc.id);
      
      // Render both lists
      await renderUserList(followersListContainer, followerIds, "This user is not followed by anyone.");
      await renderUserList(followingListContainer, followingIds, "This user is not following anyone.");
  };

  // --- Click Handler Logic ---

  if (followersStat) {
    followersStat.addEventListener('click', () => {
        // Hide the other list and show/hide the followers list
        followingListSection.style.display = 'none';
        followersListSection.style.display = 
            followersListSection.style.display === 'none' ? 'block' : 'none';
    });
  }

  if (followingStat) {
    followingStat.addEventListener('click', () => {
        // Hide the other list and show/hide the following list
        followersListSection.style.display = 'none';
        followingListSection.style.display = 
            followingListSection.style.display === 'none' ? 'block' : 'none';
    });
  }


  // --- Main Auth Observer ---

  onAuthStateChanged(auth, async (user) => {
    
    const viewingUser = targetUserId || (user ? user.uid : null);
    const isOwner = user && user.uid === viewingUser;
    const isLoggedIn = !!user;

    if (viewingUser) {
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

      // FOLLOW BUTTON LOGIC
      if (followBtn && isLoggedIn && !isOwner) {
          followBtn.style.display = 'inline-block';
          
          const updateButton = async () => {
              const isFollowing = await checkFollowingStatus(user.uid, viewingUser);
              followBtn.textContent = isFollowing ? "Unfollow" : "Follow";
              followBtn.classList.toggle('unfollow', isFollowing);
              
              followBtn.onclick = async () => {
                  await toggleFollow(user.uid, viewingUser, isFollowing);
                  await updateButton();
              };
          };
          await updateButton();
      } else if (followBtn) {
          followBtn.style.display = 'none'; 
      }
      
      // LOAD FOLLOW STATS (counts)
      loadFollowStats(viewingUser);
      
      // FETCH AND RENDER LISTS IMMEDIATELY (visibility controlled by click handlers)
      fetchAndRenderUserLists(viewingUser);


      // Hide/Show Edit/Post Buttons based on ownership
      if (editBtn) editBtn.style.display = isOwner ? 'inline-block' : 'none';
      const postButton = document.getElementById("post");
      if (postButton) postButton.style.display = isOwner ? 'inline-block' : 'none';
      

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

      // Load and listen to the target user's blog posts (Live Updates)
      if (postsList) {
        const postsQuery = query(
          collection(db, "users", viewingUser, "posts"),
          orderBy("createdAt", "desc")
        );
        
        onSnapshot(postsQuery, (querySnapshot) => {
          
          const postCount = querySnapshot.size;
          if (postCounterEl) {
              postCounterEl.textContent = postCount;
          }
          
          const postsTitle = document.querySelector('#user-posts h2');
          if (postsTitle) postsTitle.textContent = isOwner ? "📝 My Blogs" : "Recent Blogs";

          if (querySnapshot.empty) {
            postsList.innerHTML = "<p>No blogs yet.</p>";
            return;
          }
          
          postsList.innerHTML = "";
          querySnapshot.forEach((docSnap) => {
            const post = docSnap.data();
            const postId = docSnap.id;
            
            // 🚨 CRITICAL CHANGE HERE: Wrap buttons in .action-buttons-group
            const actionsHtml = isOwner ? `
                <div class="post-actions">
                  <div class="action-buttons-group">
                    <button class="edit-post subtle-action-button">✏️ Edit</button>
                    <button class="delete-post subtle-action-button">🗑️ Delete</button>
                  </div>
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
      if (followBtn) followBtn.style.display = 'none'; 
      const postButton = document.getElementById("post");
      if (postButton) postButton.style.display = 'none';

      nameEl.textContent = "Guest";
      bioEl.textContent = "Please log in to manage your profile.";
      if (postsList) {
        postsList.innerHTML = "<p>⚠️ Please log in to view blogs.</p>";
        if (postCounterEl) postCounterEl.textContent = '0';
      }
      if (followersCountEl) followersCountEl.textContent = '0';
      if (followingCountEl) followingCountEl.textContent = '0';
      
      // Clear lists when logged out
      if (followersListContainer) followersListContainer.innerHTML = "";
      if (followingListContainer) followingListContainer.innerHTML = "";
    }
  });

  // 3. Helper function to attach post event listeners
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