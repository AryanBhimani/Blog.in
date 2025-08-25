// Posts CRUD functions
import { db } from "./firebase-config.js";
import { collection, addDoc, getDocs, orderBy, query, updateDoc, doc } 
from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// Add Post
export async function createPost(title, content, authorId) {
  await addDoc(collection(db, "posts"), {
    title,
    content,
    authorId,
    createdAt: Date.now(),
    likesCount: 0
  });
}

// Get Posts
export async function fetchPosts() {
  const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// Like Post
export async function likePost(postId, currentLikes) {
  const postRef = doc(db, "posts", postId);
  await updateDoc(postRef, { likesCount: currentLikes + 1 });
}
