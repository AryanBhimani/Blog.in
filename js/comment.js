// /js/comment.js
import { auth, db } from "./firebase/firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import {
  doc,
  getDoc,
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// Utility to get URL parameters
const getQueryParam = (param) => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
};

const userId = getQueryParam("userId");
const postId = getQueryParam("postId");

const postTitleEl = document.getElementById("post-title");
const postContentEl = document.getElementById("post-content");
const postMetaEl = document.getElementById("post-meta");
const commentFormContainer = document.getElementById("comment-form-container");
const commentInput = document.getElementById("comment-input");
const submitCommentBtn = document.getElementById("submit-comment");
const commentsListEl = document.getElementById("comments-list");

if (!userId || !postId) {
  postTitleEl.textContent = "Error: Invalid Post Link";
  commentsListEl.innerHTML = "<p>Please go back to the <a href='index.html'>Home Feed</a>.</p>";
} else {
    // 1. Load the Blog Post Details
    async function loadPost() {
        try {
            const postRef = doc(db, "users", userId, "posts", postId);
            const postSnap = await getDoc(postRef);

            if (postSnap.exists()) {
                const post = postSnap.data();
                
                // Fetch the author's username from the user profile document
                const userDocSnap = await getDoc(doc(db, "users", userId));
                const authorUsername = userDocSnap.exists() ? userDocSnap.data().username : "Anonymous";

                postTitleEl.textContent = post.title;
                postContentEl.textContent = post.content;
                postMetaEl.textContent = `Posted by ${authorUsername} on ${post.createdAt?.toDate().toLocaleString() || ""}`;
            } else {
                postTitleEl.textContent = "Post Not Found";
                postContentEl.textContent = "The post you are looking for does not exist.";
                postMetaEl.textContent = "";
            }
        } catch (err) {
            console.error("❌ Failed to load post:", err);
            postTitleEl.textContent = "Error Loading Post";
        }
    }
    loadPost();

    // 2. Setup Real-time Comment Listener
    function setupCommentListener() {
        // Reference to the 'comments' subcollection for this specific post
        const commentsRef = collection(db, "users", userId, "posts", postId, "comments");
        const q = query(commentsRef, orderBy("createdAt", "asc")); 

        onSnapshot(q, (snapshot) => {
            if (snapshot.empty) {
                commentsListEl.innerHTML = "<p>Be the first to comment!</p>";
                return;
            }

            commentsListEl.innerHTML = "";
            snapshot.forEach((commentDoc) => {
                const comment = commentDoc.data();
                const profileLink = `profile.html?userId=${comment.userId}`; // Construct profile link

                commentsListEl.innerHTML += `
                    <div class="comment-card">
                        <p>
                            <strong><a href="${profileLink}" class="comment-author-link">${comment.username || "Anonymous"}</a>:</strong> 
                            ${comment.text}
                        </p>
                        <small>${comment.createdAt?.toDate().toLocaleString() || "Just now"}</small>
                    </div>
                `;
            });
        });
    }
    setupCommentListener();

    // 3. Handle Comment Submission (Requires Login)
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            // User is logged in: Show the comment form
            commentFormContainer.style.display = "block";

            submitCommentBtn.onclick = async () => {
                const commentText = commentInput.value.trim();

                if (!commentText) {
                    alert("⚠️ Comment cannot be empty!");
                    return;
                }

                try {
                    // Fetch the logged-in user's display name or username
                    const userDoc = await getDoc(doc(db, "users", user.uid));
                    const username = userDoc.exists() ? userDoc.data().username : user.displayName || "Anonymous";

                    // Add the comment to the 'comments' subcollection
                    await addDoc(collection(db, "users", userId, "posts", postId, "comments"), {
                        text: commentText,
                        userId: user.uid,
                        username: username,
                        createdAt: serverTimestamp(),
                    });

                    commentInput.value = ""; // Clear the input
                } catch (error) {
                    console.error("❌ Error adding comment:", error);
                    alert("❌ Failed to post comment.");
                }
            };

        } else {
            // User is logged out: Hide the comment form and show login prompt
            commentFormContainer.style.display = "none";
            // Check if login prompt is already there to avoid duplicates
            if (!document.querySelector('.login-prompt')) {
                commentsListEl.insertAdjacentHTML('beforebegin', `
                    <p class="login-prompt">
                        <a href="auth.html">Log in</a> to post a comment.
                    </p>
                `);
            }
        }
    });
}