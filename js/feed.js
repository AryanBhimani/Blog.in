// feed.js (RESTORED DESIGN + FIXED LOGIC — NO CSS CHANGE)

import { db, auth } from "./firebase/firebase-config.js";
import {
  collection,
  getDocs,
  query,
  orderBy,
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// DOM Elements
const postsList = document.getElementById("all-posts-list");
const searchInput = document.getElementById("search-input");
const searchResultsInfo = document.getElementById("search-results-info");
const clearSearchBtn = document.getElementById("clear-search");
const searchBtn = document.getElementById("search-button");

// Store all posts (for search)
let allPosts = [];

// Load everything when page loads
document.addEventListener("DOMContentLoaded", () => {
  loadAllPosts();
  setupSearch();
});

/* ------------------------------------------
   Load ALL posts from ALL users
--------------------------------------------- */
async function loadAllPosts() {
  postsList.innerHTML = `
    <div class="loading">
      <div class="loading-spinner"></div>
      <p>Loading blogs...</p>
    </div>
  `;

  try {
    const usersSnap = await getDocs(collection(db, "users"));
    const posts = [];

    for (const userDoc of usersSnap.docs) {
      const userId = userDoc.id;
      const userData = userDoc.data();
      const authorName = userData.username || "Unknown";

      const postsRef = collection(db, "users", userId, "posts");
      const q = query(postsRef, orderBy("createdAt", "desc"));
      const postsSnap = await getDocs(q);

      postsSnap.forEach((postDoc) => {
        const postData = postDoc.data();
        posts.push({
          id: postDoc.id,
          userId,
          title: postData.title || "",
          content: postData.content || "",
          createdAt: postData.createdAt?.toDate?.() || new Date(),
          author: authorName,
        });
      });
    }

    posts.sort((a, b) => b.createdAt - a.createdAt);

    allPosts = posts;
    renderPosts(allPosts);
  } catch (err) {
    console.error("Error loading posts:", err);
    postsList.innerHTML = `<p>Failed to load blogs. Try again.</p>`;
  }
}

/* ------------------------------------------
   SEARCH SETUP
--------------------------------------------- */
function setupSearch() {
  if (!searchInput) return;

  let timeout;

  searchInput.addEventListener("input", () => {
    clearTimeout(timeout);

    timeout = setTimeout(() => {
      const term = searchInput.value.trim().toLowerCase();

      if (!term) {
        renderPosts(allPosts);
        searchResultsInfo.textContent = "";
        return;
      }

      const filtered = allPosts.filter((p) =>
        p.title.toLowerCase().includes(term) ||
        p.content.toLowerCase().includes(term) ||
        p.author.toLowerCase().includes(term)
      );

      renderPosts(filtered, term);
      searchResultsInfo.textContent = `Showing ${filtered.length} results for "${term}"`;
    }, 250);
  });

  clearSearchBtn.onclick = () => {
    searchInput.value = "";
    searchResultsInfo.textContent = "";
    renderPosts(allPosts);
  };

  searchBtn.onclick = () => {
    const term = searchInput.value.trim().toLowerCase();
    const filtered = allPosts.filter((p) =>
      p.title.toLowerCase().includes(term) ||
      p.content.toLowerCase().includes(term) ||
      p.author.toLowerCase().includes(term)
    );

    renderPosts(filtered, term);
    searchResultsInfo.textContent = `Showing ${filtered.length} results for "${term}"`;
  };
}

/* ------------------------------------------
   RENDER POSTS (KEEP ORIGINAL DESIGN)
--------------------------------------------- */
function renderPosts(posts, highlightTerm = "") {
  if (!posts.length) {
    postsList.innerHTML = `<p>No blogs found.</p>`;
    return;
  }

  let html = "";

  posts.forEach((post) => {
    const excerpt = escapeHtml(post.content.substring(0, 150));
    const fullContent = escapeHtml(post.content);

    const title = escapeHtml(post.title);

    html += `
      <article class="post-card" data-post-id="${post.id}">
        <h3>${highlight(title, highlightTerm)}</h3>

        <p class="excerpt">${highlight(excerpt, highlightTerm)}${post.content.length > 150 ? "..." : ""}</p>

        <p class="full-content" style="display:none;">
          ${highlight(fullContent, highlightTerm)}
        </p>

        <small>By ${escapeHtml(post.author)} on ${post.createdAt.toLocaleDateString()}</small>

        <div class="post-footer-actions">
          <button class="toggle-btn primary-action-button">Read More</button>
          <a href="comment.html?userId=${post.userId}&postId=${post.id}" class="comment-btn">💬 Comment</a>
        </div>
      </article>
    `;
  });

  postsList.innerHTML = html;

  /* ENABLE READ MORE / SHOW LESS */
  document.querySelectorAll(".toggle-btn").forEach((btn) => {
    btn.onclick = (e) => {
      const card = e.target.closest(".post-card");
      const excerpt = card.querySelector(".excerpt");
      const full = card.querySelector(".full-content");

      if (full.style.display === "none") {
        full.style.display = "block";
        excerpt.style.display = "none";
        btn.textContent = "Show Less";
      } else {
        full.style.display = "none";
        excerpt.style.display = "block";
        btn.textContent = "Read More";
      }
    };
  });
}

/* ------------------------------------------
   UTILITIES (KEEP ORIGINAL FORMAT)
--------------------------------------------- */
function escapeHtml(str) {
  return str
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function highlight(text, term) {
  if (!term) return text;
  const regex = new RegExp(`(${escapeRegExp(term)})`, "gi");
  return text.replace(regex, "<mark>$1</mark>");
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
