// /js/feed.js
import { db } from "./firebase/firebase-config.js";
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

// Store all posts for search functionality
let allPosts = [];

// Initialize the application
document.addEventListener("DOMContentLoaded", () => {
  loadAllPosts();
  setupSearch();
});

// Load posts from Firebase
async function loadAllPosts() {
  try {
    // Get all users
    const usersSnapshot = await getDocs(collection(db, "users"));
    const posts = [];

    // For each user, get their posts
    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      const userData = userDoc.data();
      const authorName = userData.username || "Anonymous";

      // Get posts for this user
      const postsRef = collection(db, "users", userId, "posts");
      const q = query(postsRef, orderBy("createdAt", "desc"));
      const postsSnapshot = await getDocs(q);

      // Process each post
      postsSnapshot.forEach((postDoc) => {
        const postData = postDoc.data();
        const postId = postDoc.id;

        // Convert Firebase timestamp to Date
        let postDate;
        if (postData.createdAt && postData.createdAt.toDate) {
          postDate = postData.createdAt.toDate();
        } else {
          postDate = new Date();
        }

        posts.push({
          id: postId,
          userId: userId,
          title: postData.title || "Untitled",
          content: postData.content || "",
          author: authorName,
          createdAt: postDate,
        });
      });
    }

    // Sort all posts by date (newest first)
    posts.sort((a, b) => b.createdAt - a.createdAt);

    // Store and render posts
    allPosts = posts;
    renderPosts(allPosts);
  } catch (error) {
    console.error("Error loading posts:", error);
    postsList.innerHTML = `
      <div class="no-results">
        <p>Failed to load blogs.</p>
        <p style="margin-top: 10px;">Please try again later.</p>
      </div>
    `;
  }
}

// Setup search functionality
function setupSearch() {
  let searchTimeout;

  searchInput.addEventListener("input", (e) => {
    clearTimeout(searchTimeout);

    searchTimeout = setTimeout(() => {
      const searchTerm = e.target.value.trim().toLowerCase();

      if (searchTerm.length === 0) {
        renderPosts(allPosts);
        return;
      }

      // Filter posts based on search term
      const filteredPosts = allPosts.filter((post) => {
        return (
          post.title.toLowerCase().includes(searchTerm) ||
          post.content.toLowerCase().includes(searchTerm) ||
          post.author.toLowerCase().includes(searchTerm)
        );
      });

      renderPosts(filteredPosts, searchTerm);
    }, 300); // 300ms debounce delay
  });
}

// Render posts to the DOM
function renderPosts(posts, searchTerm = "") {
  if (posts.length === 0) {
    postsList.innerHTML = `
      <div class="no-results">
        <p>No blogs found${searchTerm ? ` for "${searchTerm}"` : ""}.</p>
        <p style="margin-top: 10px;">Try adjusting your search terms.</p>
      </div>
    `;
    searchResultsInfo.textContent = "";
    return;
  }

  let postsHtml = "";

  posts.forEach((post) => {
    // Highlight search terms in the content
    let highlightedContent = post.content;
    let highlightedTitle = post.title;

    if (searchTerm) {
      const regex = new RegExp(`(${searchTerm})`, "gi");
      highlightedContent = post.content.replace(regex, "<mark>$1</mark>");
      highlightedTitle = post.title.replace(regex, "<mark>$1</mark>");
    }

    postsHtml += `
      <article class="post-card" data-post-id="${post.id}" data-user-id="${post.userId}">
        <h3>${highlightedTitle}</h3>
        <p class="excerpt">${highlightedContent.substring(0, 150)}...</p>
        
        <div class="full-content" style="display:none;">
          ${highlightedContent}
        </div>

        <small>
          By ${post.author} 
          on ${post.createdAt.toLocaleDateString()}
        </small>

        <div class="post-footer-actions"> 
          <button class="toggle-btn primary-action-button">Read More</button> 
          <a href="comment.html?userId=${post.userId}&postId=${post.id}" class="comment-btn">
            💬 Comment
          </a>
        </div>
      </article>
    `;
  });

  postsList.innerHTML = postsHtml;

  // Update search results info
  if (searchTerm) {
    searchResultsInfo.textContent = `Found ${posts.length} result${
      posts.length !== 1 ? "s" : ""
    } for "${searchTerm}"`;
  } else {
    searchResultsInfo.textContent = `Showing all ${posts.length} blog${
      posts.length !== 1 ? "s" : ""
    }`;
  }

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
}