// Import Firebase modules and configuration
import { db } from './firebase/firebase-config.js';
import { collection, getDocs, doc, getDoc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// DOM elements
const queryInput = document.getElementById('query');
const resultsEl = document.getElementById('results');
const clearBtn = document.getElementById('clearBtn');
const searchBtn = document.getElementById('searchBtn');
const searchHelp = document.getElementById('searchHelp');
const firebaseStatus = document.getElementById('firebaseStatus');
const filterBtns = document.querySelectorAll('.filter-btn');
const profileModal = document.getElementById('profileModal');
const profileModalContent = document.getElementById('profileModalContent');
const profileModalClose = document.querySelector('.profile-modal-close');

// Search state
let postsIndex = [];
let usersIndex = [];
let lastQuery = '';  
let currentFilter = 'all';
let firebaseInitialized = false;

// Initialize Firebase and load data
async function initializeFirebase() {
    try {
        updateFirebaseStatus('Connecting to Firebase...', 'loading');
        
        updateFirebaseStatus('Loading data from Firestore...', 'loading');
        
        // Load posts and users from Firestore
        const [postsSnapshot, usersSnapshot] = await Promise.all([
            getDocs(collection(db, 'posts')),
            getDocs(collection(db, 'users'))
        ]);
        
        // Map posts data
        postsIndex = postsSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                type: 'post',
                title: data.title || '',
                url: data.url || data.slug || `#post-${doc.id}`,
                excerpt: data.excerpt || data.description || data.content?.substring(0, 200) || '',
                tags: Array.isArray(data.tags) ? data.tags : 
                      (data.tags ? String(data.tags).split(',').map(s => s.trim()) : []),
                date: formatDate(data.date || data.published || data.createdAt || data.timestamp || ''),
                content: data.content || data.body || '',
                author: data.author || data.user || '',
                authorId: data.authorId || data.uid || ''
            };
        });

        // Map users data with followers/following
        usersIndex = await Promise.all(
            usersSnapshot.docs.map(async (doc) => {
                const data = doc.data();
                const userId = doc.id;
                
                // Get followers count
                const followersSnapshot = await getDocs(collection(db, 'users', userId, 'followers'));
                const followersCount = followersSnapshot.size;
                
                // Get following count
                const followingSnapshot = await getDocs(collection(db, 'users', userId, 'following'));
                const followingCount = followingSnapshot.size;
                
                return {
                    id: userId,
                    type: 'user',
                    name: data.name || '',
                    username: data.username || '',
                    email: data.email || '',
                    bio: data.bio || '',
                    createdAt: formatDate(data.createdAt || ''),
                    updatedAt: formatDate(data.updatedAt || data.lastModified || ''),
                    uid: data.uid || userId,
                    followersCount: followersCount,
                    followingCount: followingCount,
                    profileImage: data.profileImage || data.avatar || ''
                };
            })
        );
        
        firebaseInitialized = true;
        updateFirebaseStatus(`✅ Successfully loaded ${postsIndex.length} posts and ${usersIndex.length} users from Firebase`, 'success');
        updateUIState('ready');
        
        // If there's a query in URL, perform search
        const params = new URLSearchParams(location.search);
        const q = params.get('q') || '';
        if (q) {
            queryInput.value = q;
            doSearch(q);
        }
        
    } catch (error) {
        console.error('Firebase initialization error:', error);
        updateFirebaseStatus(`❌ Error loading data from Firebase: ${error.message}`, 'error');
        updateUIState('error', 'Failed to load data from Firebase. Please check console for details.');
    }
}

// Format date from various possible formats
function formatDate(dateValue) {
    if (!dateValue) return '';
    
    try {
        // If it's a Firestore timestamp
        if (dateValue.toDate) {
            return dateValue.toDate().toLocaleDateString();
        }
        
        // If it's a string or number
        const date = new Date(dateValue);
        if (!isNaN(date.getTime())) {
            return date.toLocaleDateString();
        }
        
        return String(dateValue);
    } catch (e) {
        return String(dateValue);
    }
}

// Show user profile in modal with followers/following
async function showUserProfile(user) {
    try {
        // Get fresh followers and following data
        const followersSnapshot = await getDocs(collection(db, 'users', user.id, 'followers'));
        const followingSnapshot = await getDocs(collection(db, 'users', user.id, 'following'));
        
        const followersCount = followersSnapshot.size;
        const followingCount = followingSnapshot.size;
        
        profileModalContent.innerHTML = `
            <div class="user-item">
                <div class="user-avatar" style="width: 80px; height: 80px; font-size: 32px; ${user.profileImage ? `background-image: url('${escapeHtml(user.profileImage)}'); background-size: cover;` : ''}">
                    ${user.profileImage ? '' : (user.name ? user.name.charAt(0).toUpperCase() : 'U')}
                </div>
                <div class="user-info">
                    <div class="user-name">${escapeHtml(user.name || 'Unknown User')}</div>
                    <div class="user-username">@${escapeHtml(user.username || '')}</div>
                    <div class="user-bio">${escapeHtml(user.bio || 'No bio available')}</div>
                    
                    <div class="user-stats" style="display: flex; gap: 20px; margin: 16px 0; padding: 16px; background: #f8f9fa; border-radius: 8px;">
                        <div class="stat">
                            <div class="stat-number">${followersCount}</div>
                            <div class="stat-label">Followers</div>
                        </div>
                        <div class="stat">
                            <div class="stat-number">${followingCount}</div>
                            <div class="stat-label">Following</div>
                        </div>
                    </div>
                    
                    <div class="meta">
                        <span class="user-badge">User Profile</span>
                        <span>Joined: ${escapeHtml(user.createdAt || 'Unknown')}</span>
                    </div>
                    <div style="margin-top: 16px;">
                        <h4>Contact</h4>
                        <p>Email: ${escapeHtml(user.email || 'Not provided')}</p>
                    </div>
                </div>
            </div>
        `;
        profileModal.classList.add('active');
    } catch (error) {
        console.error('Error loading user profile:', error);
        profileModalContent.innerHTML = `
            <div class="error-notice">
                Error loading user profile. Please try again.
            </div>
        `;
        profileModal.classList.add('active');
    }
}

// Show post details in modal
function showPostDetails(post) {
    profileModalContent.innerHTML = `
        <div>
            <h3>${escapeHtml(post.title || 'Untitled Post')}</h3>
            <div class="meta" style="margin: 12px 0;">
                <time>${escapeHtml(post.date || 'Unknown date')}</time>
                ${post.author ? `<span>by ${escapeHtml(post.author)}</span>` : ''}
            </div>
            <div class="excerpt">
                ${escapeHtml(post.content || post.excerpt || 'No content available')}
            </div>
            ${Array.isArray(post.tags) && post.tags.length > 0 ? `
                <div class="meta" style="margin-top: 16px;">
                    ${post.tags.map(tag => `<span class="post-badge">${escapeHtml(tag)}</span>`).join('')}
                </div>
            ` : ''}
        </div>
    `;
    profileModal.classList.add('active');
}

// Update Firebase connection status
function updateFirebaseStatus(message, type = 'info') {
    const className = type === 'error' ? 'error-notice' : 
                    type === 'success' ? 'success-notice' : 
                    type === 'loading' ? 'info-notice' : 'info-notice';
    
    firebaseStatus.innerHTML = message;
    firebaseStatus.className = className;
}

// Update UI based on state
function updateUIState(state, message = '') {
    switch(state) {
        case 'loading':
            searchBtn.disabled = true;
            searchHelp.textContent = 'Loading search index...';
            break;
        case 'ready':
            searchBtn.disabled = false;
            const query = queryInput.value.trim();
            if (!query) {
                searchHelp.textContent = `Ready to search ${postsIndex.length} posts and ${usersIndex.length} users`;
            }
            break;
        case 'error':
            searchBtn.disabled = false;
            searchHelp.textContent = message;
            break;
    }
}

// Highlight search terms in text
function highlight(text, terms) {
    if (!terms.length) return escapeHtml(text);
    
    let highlighted = escapeHtml(text);
    terms.forEach(term => {
        const regex = new RegExp(`(${escapeRegExp(term)})`, 'gi');
        highlighted = highlighted.replace(regex, '<mark>$1</mark>');
    });
    return highlighted;
}

// Escape HTML to prevent XSS
function escapeHtml(s) {
    if (typeof s !== 'string') return '';
    return s.replace(/[&<>"']/g, c => 
        ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])
    );
}

// Escape regex special characters
function escapeRegExp(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Perform search on the indexes
function search(q) {
    q = (q || '').trim();
    if (!q) return { posts: [], users: [] };
    
    const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
    const termSet = new Set(terms);
    
    // Search posts
    const postResults = postsIndex
        .map(item => {
            const searchText = [
                item.title || '',
                item.excerpt || '',
                item.content || '',
                Array.isArray(item.tags) ? item.tags.join(' ') : '',
                item.author || ''
            ].join(' ').toLowerCase();
            
            let score = 0;
            for (const term of termSet) {
                if (item.title && item.title.toLowerCase().includes(term)) {
                    score += 5;
                }
                
                if (Array.isArray(item.tags) && item.tags.some(tag => 
                    tag.toLowerCase().includes(term))) {
                    score += 3;
                }
                
                const contentMatches = (item.content || '').toLowerCase().split(term).length - 1;
                score += contentMatches * 0.1;
                
                const excerptMatches = (item.excerpt || '').toLowerCase().split(term).length - 1;
                score += excerptMatches * 0.5;
                
                if (item.author && item.author.toLowerCase().includes(term)) {
                    score += 2;
                }
            }
            
            return {item, score};
        })
        .filter(r => r.score > 0)
        .sort((a, b) => b.score - a.score)
        .map(r => r.item);

    // Search users
    const userResults = usersIndex
        .map(item => {
            const searchText = [
                item.name || '',
                item.username || '',
                item.bio || '',
                item.email || ''
            ].join(' ').toLowerCase();
            
            let score = 0;
            for (const term of termSet) {
                if (item.name && item.name.toLowerCase().includes(term)) {
                    score += 5;
                }
                
                if (item.username && item.username.toLowerCase().includes(term)) {
                    score += 4;
                }
                
                if (item.bio && item.bio.toLowerCase().includes(term)) {
                    score += 3;
                }
                
                if (item.email && item.email.toLowerCase().includes(term)) {
                    score += 1;
                }
            }
            
            return {item, score};
        })
        .filter(r => r.score > 0)
        .sort((a, b) => b.score - a.score)
        .map(r => r.item);
    
    return { posts: postResults, users: userResults };
}

// Render search results
function render(results, q) {
    const terms = q ? q.toLowerCase().split(/\s+/).filter(Boolean) : [];
    const { posts, users } = results;
    
    let totalResults = 0;
    let filteredResults = [];
    
    // Filter results based on current filter
    if (currentFilter === 'all') {
        filteredResults = [
            ...posts.map(item => ({ ...item, type: 'post' })),
            ...users.map(item => ({ ...item, type: 'user' }))
        ];
        totalResults = posts.length + users.length;
    } else if (currentFilter === 'posts') {
        filteredResults = posts.map(item => ({ ...item, type: 'post' }));
        totalResults = posts.length;
    } else if (currentFilter === 'users') {
        filteredResults = users.map(item => ({ ...item, type: 'user' }));
        totalResults = users.length;
    }
    
    // Update search stats
    if (q) {
        let filterText = '';
        if (currentFilter === 'posts') filterText = ' in posts';
        if (currentFilter === 'users') filterText = ' in users';
        
        searchHelp.textContent = totalResults === 0 ? 
            `No results found for "${q}"${filterText}` : 
            `Found ${totalResults} result${totalResults !== 1 ? 's' : ''} for "${q}"${filterText}`;
    } else {
        if (firebaseInitialized) {
            searchHelp.textContent = `Ready to search ${postsIndex.length} posts and ${usersIndex.length} users`;
        } else {
            searchHelp.textContent = 'Loading search data...';
        }
    }
    
    // Render results
    if (!q) {
        resultsEl.innerHTML = '<div class="no-results">Enter a query to search posts and users.</div>';
        return;
    }
    
    if (totalResults === 0) {
        resultsEl.innerHTML = '<div class="no-results">No results found. Try different keywords.</div>';
        return;
    }
    
    const frag = document.createDocumentFragment();
    
    for (const item of filteredResults) {
        const div = document.createElement('div');
        div.className = 'item';
        
        if (item.type === 'post') {
            // Render post item
            const title = document.createElement('div');
            title.className = 'title';
            title.innerHTML = `<a href="${escapeHtml(item.url || '#')}" class="profile-link" data-type="post" data-id="${item.id}">${highlight(item.title || 'Untitled Post', terms)}</a>`;
            
            const meta = document.createElement('div');
            meta.className = 'meta';
            
            const dateParts = [];
            if (item.date) {
                dateParts.push(`<time>${escapeHtml(item.date)}</time>`);
            }
            
            if (item.author) {
                dateParts.push(`by <span class="profile-link" data-type="user" data-username="${item.author}">${escapeHtml(item.author)}</span>`);
            }
            
            const tags = Array.isArray(item.tags) && item.tags.length > 0 ? 
                item.tags.map(t => `<span class="post-badge">${escapeHtml(t)}</span>`).join('') : '';
            
            meta.innerHTML = dateParts.join(' • ');
            if (tags) {
                const tagsDiv = document.createElement('div');
                tagsDiv.innerHTML = tags;
                tagsDiv.style.marginTop = '8px';
                meta.appendChild(tagsDiv);
            }
            
            const excerpt = document.createElement('div');
            excerpt.className = 'excerpt';
            excerpt.innerHTML = highlight(item.excerpt || '', terms);
            
            div.appendChild(title);
            if (meta.innerHTML) div.appendChild(meta);
            if (excerpt.innerHTML) div.appendChild(excerpt);
        } else if (item.type === 'user') {
            // Render user item with followers/following
            div.className = 'item user-item';
            
            const avatar = document.createElement('div');
            avatar.className = 'user-avatar';
            if (item.profileImage) {
                avatar.style.backgroundImage = `url('${escapeHtml(item.profileImage)}')`;
                avatar.style.backgroundSize = 'cover';
                avatar.style.backgroundPosition = 'center';
            } else {
                avatar.textContent = item.name ? item.name.charAt(0).toUpperCase() : 'U';
            }
            
            const userInfo = document.createElement('div');
            userInfo.className = 'user-info';
            
            const name = document.createElement('div');
            name.className = 'user-name';
            name.innerHTML = `<span class="profile-link" data-type="user" data-username="${item.username}">${highlight(item.name || 'Unknown User', terms)}</span>`;
            
            const username = document.createElement('div');
            username.className = 'user-username';
            username.innerHTML = `@${highlight(item.username, terms)}`;
            
            const bio = document.createElement('div');
            bio.className = 'user-bio';
            bio.innerHTML = highlight(item.bio || '', terms);
            
            // Add followers/following stats
            const stats = document.createElement('div');
            stats.className = 'user-stats';
            stats.innerHTML = `
                <span class="stat">
                    <strong>${item.followersCount || 0}</strong> Followers
                </span>
                <span class="stat">
                    <strong>${item.followingCount || 0}</strong> Following
                </span>
            `;
            
            const meta = document.createElement('div');
            meta.className = 'meta';
            meta.innerHTML = `<span class="user-badge">User</span>`;
            
            userInfo.appendChild(name);
            userInfo.appendChild(username);
            if (bio.innerHTML.trim()) userInfo.appendChild(bio);
            userInfo.appendChild(stats);
            userInfo.appendChild(meta);
            
            div.appendChild(avatar);
            div.appendChild(userInfo);
        }
        
        frag.appendChild(div);
    }
    
    resultsEl.innerHTML = '';
    resultsEl.appendChild(frag);

    // Add click listeners to profile links
    document.querySelectorAll('.profile-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const type = link.dataset.type;
            const id = link.dataset.id;
            const username = link.dataset.username;
            
            if (type === 'user') {
                const user = usersIndex.find(u => u.username === username) || 
                           usersIndex.find(u => u.name === username);
                if (user) {
                    showUserProfile(user);
                }
            } else if (type === 'post') {
                const post = postsIndex.find(p => p.id === id);
                if (post) {
                    showPostDetails(post);
                }
            }
        });
    });
}

// Debounce function to limit search frequency
function debounce(fn, wait = 300) {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => fn(...args), wait);
    };
}

// Perform search with debouncing
const doSearch = debounce((q) => {
    if (q === lastQuery) return;
    
    lastQuery = q;
    const results = search(q);
    render(results, q);
}, 200);

// Event listeners
queryInput.addEventListener('input', (e) => {
    const q = e.target.value;
    
    const u = new URL(location);
    if (q) {
        u.searchParams.set('q', q);
    } else {
        u.searchParams.delete('q');
    }
    history.replaceState({}, '', u);
    
    doSearch(q);
});

clearBtn.addEventListener('click', () => {
    queryInput.value = '';
    queryInput.focus();
    history.replaceState({}, '', location.pathname);
    render({ posts: [], users: [] }, '');
    lastQuery = '';
});

document.getElementById('searchForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const q = queryInput.value;
    doSearch(q);
});

// Filter button event listeners
filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.dataset.filter;
        
        if (lastQuery) {
            const results = search(lastQuery);
            render(results, lastQuery);
        }
    });
});

// Profile modal event listeners
profileModalClose.addEventListener('click', () => {
    profileModal.classList.remove('active');
});

profileModal.addEventListener('click', (e) => {
    if (e.target === profileModal) {
        profileModal.classList.remove('active');
    }
});

// Close modal with Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && profileModal.classList.contains('active')) {
        profileModal.classList.remove('active');
    }
});

// Initialize when page loads
initializeFirebase();