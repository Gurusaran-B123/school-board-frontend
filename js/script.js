const API_URL = 'https://school-board-backend-ob5n.onrender.com';
let currentUser = JSON.parse(localStorage.getItem('user'));

// 1. LOGIN LOGIC (index.html)
async function handleLogin(e) {
    e.preventDefault();
    const name = document.getElementById('name').value;
    const key = document.getElementById('key').value;
    const role = document.querySelector('.role-btn.active').dataset.role;

    const res = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ name, key, role })
    });

    const data = await res.json();
    if (res.ok) {
        localStorage.setItem('user', JSON.stringify(data.user));
        // Redirect based on role
        window.location.href = (role === 'admin') ? 'upload.html' : 'dashboard.html';
    } else {
        alert(data.message);
    }
}

// 2. UPLOAD LOGIC (upload.html)
async function handleUpload() {
    const text = document.getElementById('textInput').value;
    const url = document.getElementById('youtubeLink').value;

    const res = await fetch(`${API_URL}/api/content`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ 
            text, 
            youtube_url: url, 
            key: currentUser.key, 
            name: currentUser.name 
        })
    });

    if (res.ok) {
        alert("Shared successfully!");
        location.reload();
    }
}

// 3. DASHBOARD LOGIC (dashboard.html)
async function loadDashboardContent() {
    const res = await fetch(`${API_URL}/api/content/${currentUser.key}`);
    const contents = await res.json();
    
    const grid = document.getElementById('contentGrid');
    grid.innerHTML = contents.map(item => `
        <div class="content-card">
            <iframe src="https://www.youtube.com/embed/${extractId(item.youtube_url)}" frameborder="0" allowfullscreen></iframe>
            <div class="content-info">
                <p>${item.text_comment}</p>
                <small>From Admin: ${item.admin_name}</small>
            </div>
        </div>
    `).join('');
}

function extractId(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}
