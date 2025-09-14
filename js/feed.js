// // js/feed.js
// fetch("./data/posts.json")
//   .then((res) => res.json())
//   .then((posts) => {
//     const container = document.getElementById("feed-container");
//     container.innerHTML = "";

//     posts.forEach((post) => {
//       const card = `
//         <div class="post-card">
//           <h2><a href="comment.html?id=${post.id}">${post.title}</a></h2>
//           <p>${post.excerpt}</p>
//           <small>By ${post.author} • ${post.date}</small>
//         </div>
//       `;
//       container.innerHTML += card;
//     });
//   });



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
      const userData = userDoc.data();

      // ✅ Always use username from Firestore user profile
      const authorName = userData.username || "Anonymous";

      const postsRef = collection(db, "users", userDoc.id, "posts");
      const q = query(postsRef, orderBy("createdAt", "desc"));
      const postsSnapshot = await getDocs(q);

      postsSnapshot.forEach((postDoc) => {
        const post = postDoc.data();
        postsHtml += `
          <article class="post-card">
            <h3>${post.title}</h3>
            <p>${post.content}</p>
            <small>
              By ${authorName} 
              on ${post.createdAt?.toDate().toLocaleString() || ""}
            </small>
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
