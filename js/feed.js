// /js/feed.js
import { db } from "./firebase/firebase-config.js";
import { collection, getDocs, query, orderBy } 
  from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

const postsList = document.getElementById("all-posts-list");

async function loadAllPosts() {
  postsList.innerHTML = "<p>Loading blogs...</p>";

  try {
    const usersSnapshot = await getDocs(collection(db, "users"));
    let postsHtml = "";

    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id; // Get the user ID
      const userData = userDoc.data();
      const authorName = userData.username || "Anonymous";

      const postsRef = collection(db, "users", userId, "posts");
      const q = query(postsRef, orderBy("createdAt", "desc"));
      const postsSnapshot = await getDocs(q);

      postsSnapshot.forEach((postDoc) => {
        const post = postDoc.data();
        const postId = postDoc.id; // Get the post ID

        // Updated structure: Article card with a dedicated "Comment" button
        postsHtml += `
          <article class="post-card" data-post-id="${postId}" data-user-id="${userId}">
            <h3>${post.title}</h3>
            <p>${post.content.substring(0, 150)}...</p>
            <small>
              By ${authorName} 
              on ${post.createdAt?.toDate().toLocaleString() || ""}
            </small>
            <div class="post-actions">
                <a href="comment.html?userId=${userId}&postId=${postId}" class="button comment-btn">
                    💬 Comment
                </a>
            </div>
          </article>
        `;
      });
    }

    postsList.innerHTML = postsHtml || "<p>No blogs yet. Be the first!</p>";
  } catch (error) {
    console.error("Error loading posts:", error);
    postsList.innerHTML = "<p>Failed to load blogs.</p>";
  }
}

loadAllPosts();