import { auth, db } from "./firebase/firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import {
  collection, addDoc, serverTimestamp,
  doc, getDoc, updateDoc
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

const createSection = document.getElementById("create-post");
const postBtn = document.getElementById("submit-post");
const titleInput = document.getElementById("post-title");
const contentInput = document.getElementById("post-content");
const heading = document.querySelector("#create-post h2");

const editId = new URLSearchParams(window.location.search).get("edit");
const isEdit = !!editId;

if (isEdit) {
  heading.textContent = "Edit Your Blog";
  postBtn.textContent = "Update Post";
}

let currentUser = null;

onAuthStateChanged(auth, async (user) => {
  if (!user) return window.location.href = "auth.html";
  currentUser = user;
  createSection.style.display = "block";

  if (isEdit) {
    const ref = doc(db, "users", user.uid, "posts", editId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return window.location.href = "profile.html";

    const p = snap.data();
    titleInput.value = p.title;
    contentInput.value = p.content;
  }
});

postBtn.onclick = async (e) => {
  e.preventDefault();
  if (!currentUser) return alert("Please log in!");

  const title = titleInput.value.trim();
  const content = contentInput.value.trim();
  if (!title || !content) return alert("Enter title & content");

  if (isEdit) {
    await updateDoc(doc(db, "users", currentUser.uid, "posts", editId), {
      title,
      content
    });
    alert("Updated!");
  } else {
    await addDoc(collection(db, "users", currentUser.uid, "posts"), {
      title,
      content,
      createdAt: serverTimestamp(),
    });
    alert("Posted!");
  }

  window.location.href = "profile.html";
};
