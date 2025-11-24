import { auth, db } from "./firebase/firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { 
  doc, getDoc, setDoc, deleteDoc, collection, getDocs, query, orderBy, onSnapshot
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
  const nameEl = document.getElementById("profile-name");
  const bioEl = document.getElementById("profile-bio");
  const loginBtn = document.getElementById("Login");
  const editBtn = document.getElementById("edit-profile");
  const postsList = document.getElementById("user-posts-list");
  const followBtn = document.getElementById("follow-btn");
  const followersCountEl = document.getElementById("followers-count");
  const followingCountEl = document.getElementById("following-count");
  const followersListContainer = document.getElementById("followers-users");
  const followingListContainer = document.getElementById("following-users");
  const followersListSection = document.getElementById("followers-list-section");
  const followingListSection = document.getElementById("following-list-section");
  const postCounterEl = document.getElementById("posts-count");

  const getQueryParam = (param) => new URLSearchParams(window.location.search).get(param);
  const targetUserId = getQueryParam("userId");

  // Subcollection Follows Logic
  const checkFollowingStatus = async (currentUserId, targetId) => {
    const ref = doc(db, "users", currentUserId, "following", targetId);
    const snap = await getDoc(ref);
    return snap.exists();
  };

  const followUser = async (myUserId, theirUserId) => {
    await setDoc(doc(db, "users", myUserId, "following", theirUserId), {});
    await setDoc(doc(db, "users", theirUserId, "followers", myUserId), {});
  };

  const unfollowUser = async (myUserId, theirUserId) => {
    await deleteDoc(doc(db, "users", myUserId, "following", theirUserId));
    await deleteDoc(doc(db, "users", theirUserId, "followers", myUserId));
  };

  const loadFollowStats = async (userId) => {
    const followersSnap = await getDocs(collection(db, "users", userId, "followers"));
    followersCountEl.textContent = followersSnap.size;
    const followingSnap = await getDocs(collection(db, "users", userId, "following"));
    followingCountEl.textContent = followingSnap.size;
  };

  const renderUserList = async (container, userId, relation, emptyMsg) => {
    const collSnap = await getDocs(collection(db, "users", userId, relation));
    if (collSnap.empty) {
      container.innerHTML = `<p>${emptyMsg}</p>`;
      return;
    }
    let html = "";
    for (const docSnap of collSnap.docs) {
      const theirId = docSnap.id;
      const userSnap = await getDoc(doc(db, "users", theirId));
      const theirData = userSnap.exists() ? userSnap.data() : {};
      html += `<a href="profile.html?userId=${theirId}" class="user-list-item"><span>${theirData.username || theirId}</span></a>`;
    }
    container.innerHTML = html;
  };

  const fetchAndRenderUserLists = async (userId) => {
    await renderUserList(followersListContainer, userId, "followers", "No followers yet.");
    await renderUserList(followingListContainer, userId, "following", "Not following anyone.");
  };

  document.getElementById("followers-stat").addEventListener("click", () => {
    followingListSection.style.display = "none";
    followersListSection.style.display = followersListSection.style.display === "none" ? "block" : "none";
  });
  document.getElementById("following-stat").addEventListener("click", () => {
    followersListSection.style.display = "none";
    followingListSection.style.display = followingListSection.style.display === "none" ? "block" : "none";
  });

  onAuthStateChanged(auth, async (user) => {
    const viewingUser = targetUserId || (user ? user.uid : null);
    const isOwner = user && user.uid === viewingUser;
    const isLoggedIn = !!user;

    if (viewingUser) {
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

      if (followBtn && isLoggedIn && !isOwner) {
        followBtn.style.display = 'inline-block';
        const updateButton = async () => {
          const isFollowing = await checkFollowingStatus(user.uid, viewingUser);
          followBtn.textContent = isFollowing ? "Unfollow" : "Follow";
          followBtn.onclick = async () => {
            if (isFollowing) await unfollowUser(user.uid, viewingUser);
            else await followUser(user.uid, viewingUser);
            await updateButton();
            await loadFollowStats(viewingUser);
            await fetchAndRenderUserLists(viewingUser);
          };
        };
        await updateButton();
      } else if (followBtn) {
        followBtn.style.display = 'none';
      }

      loadFollowStats(viewingUser);
      fetchAndRenderUserLists(viewingUser);

      if (editBtn) editBtn.style.display = isOwner ? 'inline-block' : 'none';
      const postButton = document.getElementById("post");
      if (postButton) postButton.style.display = isOwner ? 'inline-block' : 'none';

      if (loginBtn) {
        if (user) {
          loginBtn.textContent = "Logout";
          loginBtn.onclick = async () => { await signOut(auth); };
        } else {
          loginBtn.textContent = "Login";
          loginBtn.onclick = () => { window.location.href = "auth.html"; };
        }
      }

      if (postsList) {
        const postsQuery = query(
          collection(db, "users", viewingUser, "posts"),
          orderBy("createdAt", "desc")
        );
        onSnapshot(postsQuery, (querySnapshot) => {
          postCounterEl.textContent = querySnapshot.size;
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
            const actionsHtml = isOwner ? `
              <div class="post-actions">
                <div class="action-buttons-group">
                  <button class="edit-post subtle-action-button">✏️ Edit</button>
                  <button class="delete-post subtle-action-button">🗑️ Delete</button>
                </div>
              </div>` : '';
            postsList.innerHTML += `
              <article class="post-card" data-id="${postId}">
                <h3>${post.title}</h3>
                <p>${post.content}</p>
                <small>Posted on ${post.createdAt?.toDate().toLocaleString() || ""}</small>
                ${actionsHtml}
              </article>`;
          });
          if (isOwner) attachPostEventListeners(user, postsList);
        }, (error) => {
          console.error("❌ Failed to load user posts in real-time:", error);
          postsList.innerHTML = "<p>Failed to load blogs.</p>";
        });
      }
    } else {
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
      followersCountEl.textContent = '0';
      followingCountEl.textContent = '0';
      followersListContainer.innerHTML = "";
      followingListContainer.innerHTML = "";
    }
  });

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
