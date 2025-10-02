# Blog.in - Blogging Platform

Blog.in is a lightweight blogging web application built with **HTML, CSS, JavaScript, and Firebase**.  
It allows users to **sign up, log in, create posts, view blogs, edit their profile, and comment** on posts.  
This project demonstrates **Firebase Authentication and Firestore Database** integration with a clean UI.

---

## 🚀 Features

- 🔐 **User Authentication**
  - Register new users
  - Login/Logout functionality
  - Firebase Authentication

- 📝 **Blog Management**
  - Create, edit, and delete blog posts
  - Rich text editor for posts
  - Store posts linked to logged-in users

- 👤 **User Profiles**
  - Edit profile details
  - View personal blogs
  - Profile picture support

- 💬 **Comments**
  - Comment on blog posts
  - Firebase Firestore integration

- 📱 **Responsive UI**
  - Mobile-friendly design
  - Reusable components (`navbar.html`, `footer.html`)

---

## 🏗️ Project Structure
```
blog-in/
├── assets/
│   └── images/
│       ├── blog.in.png
│       └── mobintix.png
├── components/
│   ├── footer.html
│   └── navbar.html
├── styles/
│   ├── about.css
│   ├── auth.css
│   ├── comments.css
│   ├── contact.css
│   ├── editprofile.css
│   ├── feed.css
│   ├── footer.css
│   ├── main.css
│   ├── navbar.css
│   ├── posts.css
│   ├── profile.css
│   └── responsive.css
├── js/
│   ├── firebase/
│   │   ├── auth.js
│   │   └── firebase-config.js
│   ├── comments.js
│   ├── contact.js
│   ├── editprofile.js
│   ├── feed.js
│   ├── footer.js
│   ├── navbar.js
│   ├── posts.js
│   ├── profile.js
│   └── search.js
├── about.html
├── auth.html
├── comment.html
├── contact.html
├── editprofile.html
├── index.html
├── profile.html
├── search.html
└── README.md
```

---

## ⚙️ Tech Stack

- **Frontend:** HTML5, CSS3, JavaScript (Vanilla JS)
- **Backend/Database:** Firebase Firestore
- **Authentication:** Firebase Auth
- **Hosting:** Firebase Hosting (or any static hosting)

---

## 🔑 System Architecture

```
mermaid
flowchart TD
    A[User] -->|Login / Register| B[Firebase Auth]
    B --> C[Firestore Database]
    A -->|Create Post| C
    A -->|View Posts| C
    A -->|Comment on Post| C
    A -->|Edit Profile| C
    subgraph UI [Frontend (HTML, CSS, JS)]
        A
    end
    subgraph Firebase [Firebase Services]
        B
        C
    end

📌 Future Improvements

Add likes & reactions on posts

Improve blog editor with markdown support

Deploy using Firebase Hosting.
```