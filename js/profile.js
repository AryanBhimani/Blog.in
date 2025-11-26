import { auth, db } from "./firebase/firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import {
  doc, getDoc, setDoc, deleteDoc,
  collection, getDocs, query, orderBy, onSnapshot
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

let viewingUserId = new URLSearchParams(window.location.search).get("userId");

const nameEl = document.getElementById("profile-name");
const bioEl = document.getElementById("profile-bio");
const editBtn = document.getElementById("edit-profile");
const followBtn = document.getElementById("follow-btn");
const loginBtn = document.getElementById("Login");
const postsList = document.getElementById("user-posts-list");
const followersCountEl = document.getElementById("followers-count");
const followingCountEl = document.getElementById("following-count");
const followersListContainer = document.getElementById("followers-users");
const followingListContainer = document.getElementById("following-users");
const postCounterEl = document.getElementById("posts-count");
const settingsBtn = document.getElementById("settings-btn");
const postBtn = document.getElementById("post");

function clearUI() {
  nameEl.textContent = "Guest";
  bioEl.textContent = "Please login to view profile.";
  followersCountEl.textContent = "0";
  followingCountEl.textContent = "0";
  postsList.innerHTML = "<p>Please login to see posts.</p>";
  settingsBtn.style.display = "none";
  editBtn.style.display = "none";
  postBtn.style.display = "none";
  followBtn.style.display = "none";
}

async function safeDeletePost(userId, postId) {
  const ok = confirm("Are you sure you want to delete this post?");
  if (!ok) return;

  await deleteDoc(doc(db, "users", userId, "posts", postId));

  const el = document.querySelector(`article.post-card[data-id="${postId}"]`);
  if (el) el.remove();

  if (!isNaN(Number(postCounterEl.textContent))) {
    postCounterEl.textContent = Math.max(0, Number(postCounterEl.textContent) - 1);
  }
}

onAuthStateChanged(auth, async (user) => {

  if (user) {
    loginBtn.textContent = "Logout";
    loginBtn.onclick = async () => {
      await signOut(auth);
      clearUI();
      window.location.href = "auth.html";
    };
  } else {
    loginBtn.textContent = "Login";
    loginBtn.onclick = () => window.location.href = "auth.html";
  }

  if (!user && !viewingUserId) {
    clearUI();
    return;
  }

  if (user && !viewingUserId) {
    viewingUserId = user.uid;
    history.replaceState(null, "", `?userId=${user.uid}`);
  }

  const isOwner = user && user.uid === viewingUserId;

  settingsBtn.style.display = isOwner ? "inline-block" : "none";
  settingsBtn.onclick = () => window.location.href = "settings.html";

  editBtn.style.display = isOwner ? "inline-block" : "none";
  postBtn.style.display = isOwner ? "inline-block" : "none";
  followBtn.style.display = (!isOwner && user) ? "inline-block" : "none";

  loadProfile(viewingUserId);
  loadFollowStats(viewingUserId);
  loadUserLists(viewingUserId);
  loadPosts(viewingUserId);

  /* -------------------------
     FOLLOW / UNFOLLOW FIXED
     ------------------------- */
  if (user && !isOwner) {
    // set initial follow state
    const initial = await checkFollowingStatus(user.uid, viewingUserId);
    updateFollowButton(initial);

    followBtn.onclick = async () => {
      const currentState = await checkFollowingStatus(user.uid, viewingUserId);

      if (currentState) {
        await unfollowUser(user.uid, viewingUserId);
      } else {
        await followUser(user.uid, viewingUserId);
      }

      const newState = await checkFollowingStatus(user.uid, viewingUserId);
      updateFollowButton(newState);

      loadFollowStats(viewingUserId);
      loadUserLists(viewingUserId);
    };
  }
});

function updateFollowButton(isFollowing) {
  followBtn.textContent = isFollowing ? "Unfollow" : "Follow";
  followBtn.classList.remove("follow", "unfollow");
  followBtn.classList.add(isFollowing ? "unfollow" : "follow");
}

async function checkFollowingStatus(myId, theirId) {
  return (await getDoc(doc(db, "users", myId, "following", theirId))).exists();
}

async function followUser(myId, theirId) {
  await setDoc(doc(db, "users", myId, "following", theirId), {});
  await setDoc(doc(db, "users", theirId, "followers", myId), {});
}

async function unfollowUser(myId, theirId) {
  await deleteDoc(doc(db, "users", myId, "following", theirId));
  await deleteDoc(doc(db, "users", theirId, "followers", myId));
}

async function loadProfile(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  if (snap.exists()) {
    const d = snap.data();
    nameEl.textContent = d.username;
    bioEl.textContent = d.bio || "No bio yet.";
  }
}

async function loadFollowStats(uid) {
  const f1 = await getDocs(collection(db, "users", uid, "followers"));
  const f2 = await getDocs(collection(db, "users", uid, "following"));
  followersCountEl.textContent = f1.size;
  followingCountEl.textContent = f2.size;
}

async function loadUserLists(uid) {
  await loadList(followersListContainer, uid, "followers", "No followers yet");
  await loadList(followingListContainer, uid, "following", "Not following anyone");
}

async function loadList(container, uid, rel, emptyMsg) {
  const snap = await getDocs(collection(db, "users", uid, rel));
  if (snap.empty) return container.innerHTML = `<p>${emptyMsg}</p>`;

  let html = "";
  for (const s of snap.docs) {
    const usr = await getDoc(doc(db, "users", s.id));
    const d = usr.exists() ? usr.data() : {};
    html += `<a href="profile.html?userId=${s.id}" class="user-list-item"><span>${d.username || s.id}</span></a>`;
  }
  container.innerHTML = html;
}

let unsubPosts = null;
function loadPosts(uid) {
  if (unsubPosts) unsubPosts();

  const q = query(collection(db, "users", uid, "posts"), orderBy("createdAt", "desc"));
  unsubPosts = onSnapshot(q, (snap) => {
    postCounterEl.textContent = snap.size;

    if (snap.empty) {
      postsList.innerHTML = "<p>No blogs yet</p>";
      return;
    }

    postsList.innerHTML = "";
    snap.forEach(docSnap => {
      const p = docSnap.data();
      const id = docSnap.id;
      const isOwner = auth.currentUser && auth.currentUser.uid === uid;

      postsList.innerHTML += `
        <article class="post-card" data-id="${id}">
          <h3>${p.title}</h3>
          <p>${p.content}</p>
          <small>${p.createdAt?.toDate().toLocaleString()}</small>

          ${isOwner ? `
            <div class="post-actions">
              <button class="edit-post">✏️ Edit</button>
              <button class="delete-post">🗑️ Delete</button>
            </div>
          ` : ""}
        </article>
      `;
    });

    attachPostActions(uid);
  });
}

function attachPostActions(uid) {
  document.querySelectorAll(".edit-post").forEach(btn => {
    btn.onclick = (e) => {
      const id = e.target.closest("article").dataset.id;
      window.location.href = `post.html?edit=${id}`;
    };
  });

  document.querySelectorAll(".delete-post").forEach(btn => {
    btn.onclick = (e) => {
      const id = e.target.closest("article").dataset.id;
      safeDeletePost(uid, id);
    };
  });
}

/* Followers / Following page link */
document.getElementById("followers-stat").onclick = () => {
  window.location.href = `followers.html?userId=${viewingUserId}`;
};

document.getElementById("following-stat").onclick = () => {
  window.location.href = `following.html?userId=${viewingUserId}`;
};
