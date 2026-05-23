// ===== CONFIGURATION =====
const API_URL = 'https://school-board-backend-ob5n.onrender.com';
let currentUser = null;
let currentRole = 'student';

// ===== DOM ELEMENTS =====
const loginPage = document.getElementById('loginPage');
const loginForm = document.getElementById('loginForm');
const roleButtons = document.querySelectorAll('.role-btn');
const nameInput = document.getElementById('name');
const keyInput = document.getElementById('key');
const loginBtn = document.getElementById('loginBtn');
const errorMessage = document.getElementById('errorMessage');
const successMessage = document.getElementById('successMessage');

const dashboard = document.getElementById('dashboard');
const logoutBtn = document.getElementById('logoutBtn');
const userNameDisplay = document.getElementById('userName');
const userRoleDisplay = document.getElementById('userRole');
const contentGrid = document.getElementById('contentGrid');
const textInput = document.getElementById('textInput');
const youtubeLink = document.getElementById('youtubeLink');
const submitBtn = document.getElementById('submitBtn');
const clearBtn = document.getElementById('clearBtn');

// ===== EVENT LISTENERS =====

if (roleButtons.length > 0) {
    roleButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            roleButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentRole = btn.dataset.role;
        });
    });
}

if (loginForm) loginForm.addEventListener('submit', handleLogin);
if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
if (submitBtn) submitBtn.addEventListener('click', handleSubmit);
if (clearBtn) clearBtn.addEventListener('click', clearForm);

// ===== MAIN FUNCTIONS =====

function showError(msg) {
    if (errorMessage) {
        errorMessage.textContent = msg;
        errorMessage.style.display = 'block';
        setTimeout(() => errorMessage.style.display = 'none', 5000);
    }
}

function showSuccess(msg) {
    if (successMessage) {
        successMessage.textContent = msg;
        successMessage.style.display = 'block';
        setTimeout(() => successMessage.style.display = 'none', 5000);
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const name = nameInput.value.trim();
    const key = keyInput.value.trim();

    if (!name || !key) {
        showError('Fill all fields');
        return;
    }

    loginBtn.disabled = true;
    loginBtn.innerHTML = '<span class="loading"></span>';

    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, key, role: currentRole })
        });

        const data = await response.json();

        if (response.ok) {
            currentUser = data.user;
            localStorage.setItem('user', JSON.stringify(data.user));
            localStorage.setItem('currentRole', currentRole);
            window.location.href = currentRole === 'student' ? 'dashboard.html' : 'upload.html';
        } else {
            showError(data.message || 'Login failed');
        }
    } catch (error) {
        showError('Error: ' + error.message);
    } finally {
        loginBtn.disabled = false;
        loginBtn.innerHTML = 'Login';
    }
}

function handleLogout() {
    localStorage.removeItem('user');
    localStorage.removeItem('currentRole');
    window.location.href = 'index.html';
}

async function handleSubmit() {
    const text = textInput.value.trim();
    const link = youtubeLink.value.trim();

    if (!text && !link) {
        showError('Enter message or YouTube link');
        return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="loading"></span>';

    try {
        const response = await fetch(`${API_URL}/content`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, youtube_link: link, parent_id: currentUser.id })
        });

        const data = await response.json();

        if (response.ok) {
            showSuccess('Content shared!');
            clearForm();
            loadContent();
        } else {
            showError(data.message || 'Failed');
        }
    } catch (error) {
        showError('Error: ' + error.message);
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Share Content';
    }
}

function clearForm() {
    if (textInput) textInput.value = '';
    if (youtubeLink) youtubeLink.value = '';
}

function extractYoutubeId(url) {
    if (!url) return null;

    try {
        const parsedUrl = new URL(url);

        // youtube.com/watch?v=
        if (parsedUrl.hostname.includes("youtube.com")) {
            return parsedUrl.searchParams.get("v");
        }

        // youtu.be/
        if (parsedUrl.hostname.includes("youtu.be")) {
            return parsedUrl.pathname.substring(1);
        }

        return null;

    } catch {
        return null;
    }
}
async function loadContent() {
    try {
        const response = await fetch(`${API_URL}/content`);
        const data = await response.json();
        if (response.ok) displayContent(data.content);
    } catch (error) {
        console.error('Load error:', error);
    }
}

function displayContent(contents) {
    if (!contentGrid) return;

    if (!contents || contents.length === 0) {
        contentGrid.innerHTML = '<div class="empty-state"><div class="empty-icon">📭</div><p>No content yet</p></div>';
        return;
    }

    contentGrid.innerHTML = contents.map(content => {
        let videoHtml = '';
        
        if (content.youtube_link) {
            const videoId = extractYoutubeId(content.youtube_link);
            if (videoId) {
                videoHtml = `<div class="video-container"><iframe src="https://www.youtube.com/embed/${videoId}" allowfullscreen=""></iframe></div>`;
            } else {
                videoHtml = `<div class="video-container" style="background: #ef4444; display: flex; align-items: center; justify-content: center; color: white; text-align: center;">
                    <div>
                        <div style="font-size: 2rem;">⚠️</div>
                        <div>Video unavailable</div>
                        <a href="${content.youtube_link}" target="_blank" style="color: #fca5a5; text-decoration: underline; font-size: 0.9rem; display: block; margin-top: 0.5rem;">Watch on YouTube</a>
                    </div>
                </div>`;
            }
        } else {
            videoHtml = '<div class="video-container"><div class="video-placeholder">📄</div></div>';
        }

        const deleteBtn = currentRole === 'parent' ? `<button class="delete-btn" onclick="deleteContent(${content.id})">Delete</button>` : '';

        return `<div class="content-card">
            ${videoHtml}
            <div class="content-info">
                <div class="content-meta">By ${content.parent_name} • ${new Date(content.created_at).toLocaleDateString()}</div>
                <div class="content-text">${content.text || 'Video'}</div>
                ${deleteBtn}
            </div>
        </div>`;
    }).join('');
}

async function deleteContent(id) {
    if (!confirm('Delete?')) return;

    try {
        const response = await fetch(`${API_URL}/content/${id}`, { method: 'DELETE' });
        if (response.ok) {
            showSuccess('Deleted');
            loadContent();
        } else {
            showError('Failed to delete');
        }
    } catch (error) {
        showError('Error: ' + error.message);
    }
}

function initDashboard() {
    const saved = localStorage.getItem('user');
    const savedRole = localStorage.getItem('currentRole');

    if (!saved || !savedRole) {
        window.location.href = 'index.html';
        return;
    }

    currentUser = JSON.parse(saved);
    currentRole = savedRole;

    if (userNameDisplay) userNameDisplay.textContent = currentUser.name;
    if (userRoleDisplay) userRoleDisplay.textContent = currentRole === 'student' ? 'Student' : 'Admin';

    loadContent();
}

// ===== INITIALIZE =====

window.addEventListener('load', () => {
    const page = window.location.pathname.split('/').pop() || 'index.html';

    // Add Google Fonts
    if (!document.querySelector('link[href*="fonts.googleapis.com"]')) {
        const link = document.createElement('link');
        link.href = 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=Space+Grotesk:wght@600;700&display=swap';
        link.rel = 'stylesheet';
        document.head.appendChild(link);
    }

    // Initialize dashboard if on dashboard or upload page
    if (page === 'dashboard.html' || page === 'upload.html') {
        initDashboard();
    }

    // ===== ADMIN KEY GENERATION =====

const adminPage = document.getElementById('adminPage');
const adminForm = document.getElementById('adminForm');
const adminNameInput = document.getElementById('adminName');
const adminKeyInput = document.getElementById('adminKey');
const generateKeyBtn = document.getElementById('generateKeyBtn');
const createAdminBtn = document.getElementById('createAdminBtn');
const adminSignupBtn = document.getElementById('adminSignupBtn');
const backToLoginBtn = document.getElementById('backToLoginBtn');
const adminErrorMessage = document.getElementById('adminErrorMessage');
const adminSuccessMessage = document.getElementById('adminSuccessMessage');

// Generate random key
function generateRandomKey() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Show/Hide pages
if (adminSignupBtn) {
    adminSignupBtn.addEventListener('click', () => {
        loginPage.style.display = 'none';
        adminPage.style.display = 'flex';
    });
}

if (backToLoginBtn) {
    backToLoginBtn.addEventListener('click', () => {
        adminPage.style.display = 'none';
        loginPage.style.display = 'flex';
        if (adminForm) adminForm.reset();
        if (adminKeyInput) adminKeyInput.value = '';
    });
}

// Generate key button
if (generateKeyBtn) {
    generateKeyBtn.addEventListener('click', () => {
        if (adminKeyInput) adminKeyInput.value = generateRandomKey();
    });
}

// Show error for admin
function showAdminError(msg) {
    if (adminErrorMessage) {
        adminErrorMessage.textContent = msg;
        adminErrorMessage.style.display = 'block';
        setTimeout(() => adminErrorMessage.style.display = 'none', 5000);
    }
}

// Show success for admin
function showAdminSuccess(msg) {
    if (adminSuccessMessage) {
        adminSuccessMessage.textContent = msg;
        adminSuccessMessage.style.display = 'block';
        setTimeout(() => adminSuccessMessage.style.display = 'none', 5000);
    }
}

// Create admin account
if (adminForm) {
    adminForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const name = adminNameInput.value.trim();
        const key = adminKeyInput.value.trim();
        
        if (!name) {
            showAdminError('Enter admin name');
            return;
        }
        
        if (!key) {
            showAdminError('Generate or enter a key');
            return;
        }
        
        createAdminBtn.disabled = true;
        createAdminBtn.innerHTML = '<span class="loading"></span>';
        
        try {
            const response = await fetch(`${API_URL}/admin/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, key })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                showAdminSuccess(`Admin created! Key: ${key} - Share with students`);
                adminForm.reset();
                adminKeyInput.value = '';
                setTimeout(() => {
                    adminPage.style.display = 'none';
                    loginPage.style.display = 'flex';
                }, 2000);
            } else {
                showAdminError(data.message || 'Failed to create admin');
            }
        } catch (error) {
            showAdminError('Error: ' + error.message);
        } finally {
            createAdminBtn.disabled = false;
            createAdminBtn.innerHTML = 'Create Account';
        }
    });
}
});

