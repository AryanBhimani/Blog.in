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
      const userId = userDoc.id; 
      const userData = userDoc.data();
      const authorName = userData.username || "Anonymous";

      const postsRef = collection(db, "users", userId, "posts");
      const q = query(postsRef, orderBy("createdAt", "desc"));
      const postsSnapshot = await getDocs(q);

      postsSnapshot.forEach((postDoc) => {
        const post = postDoc.data();
        const postId = postDoc.id; 

        // Each post card with hidden full content
        postsHtml += `
          <article class="post-card" data-post-id="${postId}" data-user-id="${userId}">
            <h3>${post.title}</h3>
            <p class="excerpt">${post.content.substring(0, 150)}...</p>
            
            <div class="full-content" style="display:none;">
              ${post.content}
            </div>

            <small>
              By ${authorName} 
              on ${post.createdAt?.toDate().toLocaleString() || ""}
            </small>

            <div class="post-footer-actions"> 
                <button class="toggle-btn primary-action-button">Read More</button> 
                <a href="comment.html?userId=${userId}&postId=${postId}" class="comment-btn">
                    💬 Comment
                </a>
            </div>
            
          </article>
        `;
      });
    }

    postsList.innerHTML = postsHtml || "<p>No blogs yet. Be the first!</p>";

    // Attach expand/collapse functionality
    document.querySelectorAll(".toggle-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const card = e.target.closest(".post-card");
        const excerpt = card.querySelector(".excerpt");
        const fullContent = card.querySelector(".full-content");

        if (fullContent.style.display === "none") {
          fullContent.style.display = "block";
          excerpt.style.display = "none";
          btn.textContent = "Show Less";
        } else {
          fullContent.style.display = "none";
          excerpt.style.display = "block";
          btn.textContent = "Read More";
        }
      });
    });

  } catch (error) {
    console.error("Error loading posts:", error);
    postsList.innerHTML = "<p>Failed to load blogs.</p>";
  }
}

loadAllPosts();