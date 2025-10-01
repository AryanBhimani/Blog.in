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



Blog.in-main/
│── about.html # About page
│── auth.html # Login/Register page
│── comment.html # Comment page
│── contact.html # Contact page
│── editprofile.html # Edit user profile
│── index.html # Home page (blog feed)
│── post.html # Single post page
│── profile.html # User profile page
│── assets/ # Images and static assets
│── components/ # Navbar & Footer
│── css/ # Styling (CSS files per page)
│── js/ # JavaScript (functionality per page)
│ ├── firebase/ # Firebase config & auth handling
│ ├── feed.js # Blog feed handling
│ ├── post.js # Blog posting logic
│ ├── profile.js # User profile logic
│ └── ...
│── README.md # Documentation


---

## ⚙️ Tech Stack

- **Frontend:** HTML5, CSS3, JavaScript (Vanilla JS)
- **Backend/Database:** Firebase Firestore
- **Authentication:** Firebase Auth
- **Hosting:** Firebase Hosting (or any static hosting)

---

## 🔑 System Architecture

```mermaid
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