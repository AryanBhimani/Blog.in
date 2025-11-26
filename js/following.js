import { db, auth } from "./firebase/firebase-config.js";
import {
  doc, getDoc, getDocs, collection, deleteDoc
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

const params = new URLSearchParams(window.location.search);
const userId = params.get("userId");

const followingList = document.getElementById("following-list");

async function loadFollowing() {
  const snap = await getDocs(collection(db, "users", userId, "following"));

  if (snap.empty) {
    followingList.innerHTML = "<p>Not following anyone.</p>";
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
        <button class="remove-btn" id="remove-${fid}">Remove</button>
      </div>
    `;
  }

  followingList.innerHTML = html;
  setupRemoveButtons();
}

function setupRemoveButtons() {
  const currentUser = auth.currentUser;

  document.querySelectorAll(".remove-btn").forEach((btn) => {
    const uid = btn.id.replace("remove-", "");

    btn.onclick = async () => {
      const ok = confirm("Remove this user?");
      if (!ok) return;

      await deleteDoc(doc(db, "users", currentUser.uid, "following", uid));
      await deleteDoc(doc(db, "users", uid, "followers", currentUser.uid));

      btn.parentElement.remove();
    };
  });
}

loadFollowing();
