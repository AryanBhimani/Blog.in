import { db, auth } from "./firebase/firebase-config.js";
import {
  doc, getDoc, getDocs, collection, setDoc, deleteDoc
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

const params = new URLSearchParams(window.location.search);
const userId = params.get("userId");

const followersList = document.getElementById("followers-list");

async function loadFollowers() {
  const snap = await getDocs(collection(db, "users", userId, "followers"));

  if (snap.empty) {
    followersList.innerHTML = "<p>No followers yet.</p>";
    return;
  }

  let html = "";

  for (const s of snap.docs) {
    const fid = s.id;
    const userSnap = await getDoc(doc(db, "users", fid));
    const data = userSnap.exists() ? userSnap.data() : {};

    html += `
      <div class="user-list-item">
        <span onclick="window.location.href='profile.html?userId=${fid}'">
          ${data.username || "Unknown User"}
        </span>
        <button class="follow-btn-small" id="btn-${fid}">...</button>
      </div>
    `;
  }

  followersList.innerHTML = html;
  setupButtons();
}

async function setupButtons() {
  const currentUser = auth.currentUser;
  if (!currentUser) return;

  const snaps = await getDocs(collection(db, "users", currentUser.uid, "following"));
  const followingSet = new Set(snaps.docs.map(d => d.id));

  document.querySelectorAll(".follow-btn-small").forEach((btn) => {
    const uid = btn.id.replace("btn-", "");

    if (followingSet.has(uid)) {
      btn.textContent = "Unfollow";
      btn.className = "follow-btn-small unfollow";
    } else {
      btn.textContent = "Follow";
      btn.className = "follow-btn-small follow";
    }

    btn.onclick = async () => {
      if (btn.textContent === "Follow") {
        await setDoc(doc(db, "users", currentUser.uid, "following", uid), {});
        await setDoc(doc(db, "users", uid, "followers", currentUser.uid), {});
        btn.textContent = "Unfollow";
        btn.className = "follow-btn-small unfollow";
      } else {
        await deleteDoc(doc(db, "users", currentUser.uid, "following", uid));
        await deleteDoc(doc(db, "users", uid, "followers", currentUser.uid));
        btn.textContent = "Follow";
        btn.className = "follow-btn-small follow";
      }
    };
  });
}

loadFollowers();
