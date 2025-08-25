// js/feed.js
fetch("./data/posts.json")
  .then(res => res.json())
  .then(posts => {
    const container = document.getElementById("feed-container");
    container.innerHTML = "";

    posts.forEach(post => {
      const card = `
        <div class="post-card">
          <h2><a href="post.html?id=${post.id}">${post.title}</a></h2>
          <p>${post.excerpt}</p>
          <small>By ${post.author} • ${post.date}</small>
        </div>
      `;
      container.innerHTML += card;
    });
  });
