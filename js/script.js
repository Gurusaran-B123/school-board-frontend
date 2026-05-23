// ===== CONFIGURATION =====
// Ensure this matches your Render backend URL exactly
const API_URL = 'https://school-board-backend-ob5n.onrender.com';

// State management
let currentUser = JSON.parse(localStorage.getItem('user')) || null;
let currentRole = localStorage.getItem('currentRole') || 'student'; // 'student' or 'parent'

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    console.log("Scripts loaded. Current Page:", window.location.pathname);
    
    // 1. Setup Role Selection (Index Page)
    setupRoleSelector();

    // 2. Setup Form Listeners
    const loginForm = document.getElementById('loginForm');
    if (loginForm) loginForm.addEventListener('submit', handleLogin);

    const submitBtn = document.getElementById('submitBtn');
    if (submitBtn) submitBtn.addEventListener('click', handleUpload);

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);

    const clearBtn = document.getElementById('clearBtn');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            document.getElementById('textInput').value = '';
            document.getElementById('youtubeLink').value = '';
        });
    }

    // 3. Page Guards and Content Loading
    const path = window.location.pathname;
    if (path.includes('dashboard.html') || path.includes('upload.html')) {
        if (!currentUser) {
            console.warn("No user found in storage, redirecting to login...");
            window.location.href = 'index.html';
            return;
        }
        updateUI();
        loadContent();
    }
});

// ===== CORE FUNCTIONS =====

// Handle Role Toggle on Login Page
function setupRoleSelector() {
    const roleButtons = document.querySelectorAll('.role-btn');
    if (roleButtons.length > 0) {
        roleButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                roleButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentRole = btn.dataset.role; // 'student' or 'parent'
                localStorage.setItem('currentRole', currentRole);
            });
        });
    }
}

// Handle Login
async function handleLogin(e) {
    e.preventDefault();
    
    const name = document.getElementById('name').value.trim();
    const key = document.getElementById('key').value.trim();
    const loginBtn = document.getElementById('loginBtn');
    const errorMsg = document.getElementById('errorMessage');

    if (!name || !key) return;

    // Map 'parent' to 'admin' for the Python backend
    const backendRole = (currentRole === 'parent') ? 'admin' : 'student';

    loginBtn.disabled = true;
    loginBtn.innerHTML = '<i class="bi bi-hourglass-split"></i> Logging in...';

    try {
        const response = await fetch(`${API_URL}/api/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, key, role: backendRole })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('user', JSON.stringify(data.user));
            localStorage.setItem('currentRole', currentRole);
            
            // Redirect based on role
            if (currentRole === 'parent') {
                window.location.href = 'upload.html';
            } else {
                window.location.href = 'dashboard.html';
            }
        } else {
            showError(data.message || "Invalid login credentials");
        }
    } catch (err) {
        showError("Server error. Please try again later.");
        console.error("Login fetch error:", err);
    } finally {
        loginBtn.disabled = false;
        loginBtn.innerHTML = 'Login';
    }
}

// Handle Admin Upload
async function handleUpload() {
    const text = document.getElementById('textInput').value.trim();
    const url = document.getElementById('youtubeLink').value.trim();
    const submitBtn = document.getElementById('submitBtn');

    if (!text && !url) {
        alert("Please enter a message or a YouTube link");
        return;
    }

    submitBtn.disabled = true;
    submitBtn.innerText = "Sharing...";

    try {
        const response = await fetch(`${API_URL}/api/content`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: currentUser.name,
                key: currentUser.key,
                text: text,
                youtube_url: url
            })
        });

        if (response.ok) {
            document.getElementById('textInput').value = '';
            document.getElementById('youtubeLink').value = '';
            alert("Shared with students!");
            loadContent(); // Refresh the feed
        } else {
            alert("Upload failed.");
        }
    } catch (err) {
        alert("Network error.");
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerText = "Share Content";
    }
}

// Load Content based on the User's Key (The Pairing Logic)
async function loadContent() {
    const contentGrid = document.getElementById('contentGrid');
    if (!contentGrid) return;

    try {
        // Fetch only content linked to THIS user's key
        const response = await fetch(`${API_URL}/api/content/${currentUser.key}`);
        const data = await response.json();

        if (!data || data.length === 0) {
            contentGrid.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📭</div>
                    <p>No content shared for key: <b>${currentUser.key}</b></p>
                </div>`;
            return;
        }

        contentGrid.innerHTML = data.map(item => {
            const videoId = extractYoutubeId(item.youtube_url);
            let videoHtml = '';

            if (videoId) {
                videoHtml = `
                    <div class="video-container">
                        <iframe 
                            src="https://www.youtube.com/embed/${videoId}" 
                            frameborder="0" 
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                            allowfullscreen>
                        </iframe>
                    </div>`;
            }

            return `
                <div class="content-card">
                    ${videoHtml}
                    <div class="content-info">
                        <div class="content-meta">Posted by ${item.admin_name}</div>
                        <div class="content-text">${item.text_comment || ''}</div>
                        <div style="font-size: 0.75rem; color: #94a3b8; margin-top: 10px;">
                            ${new Date(item.created_at).toLocaleDateString()}
                        </div>
                    </div>
                </div>
            `;
        }).join('');

    } catch (err) {
        console.error("Load Content error:", err);
    }
}

// ===== UTILITIES =====

function updateUI() {
    const nameEl = document.getElementById('userName');
    const roleEl = document.getElementById('userRole');
    if (nameEl) nameEl.innerText = currentUser.name;
    if (roleEl) roleEl.innerText = currentRole === 'parent' ? 'Parent/Admin' : 'Student';
}

function handleLogout() {
    localStorage.clear();
    window.location.href = 'index.html';
}

function showError(msg) {
    const errorMsg = document.getElementById('errorMessage');
    if (errorMsg) {
        errorMsg.style.display = 'block';
        errorMsg.innerText = msg;
        setTimeout(() => errorMsg.style.display = 'none', 5000);
    }
}

function extractYoutubeId(url) {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}
