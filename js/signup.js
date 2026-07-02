const API_URL = 'https://school-board-backend-ob5n.onrender.com';
let generatedKeyValue = '';
let adminName = '';

document.getElementById('signupBtn').addEventListener('click', async () => {
  const name = document.getElementById('signupName').value.trim();
  const errorMsg = document.getElementById('errorMsg');
  const btn = document.getElementById('signupBtn');

  errorMsg.style.display = 'none';

  if (!name) {
    errorMsg.textContent = 'Please enter your name';
    errorMsg.style.display = 'block';
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Creating...';

  try {
    const response = await fetch(`${API_URL}/api/admin/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });

    const data = await response.json();

    if (response.ok) {
      generatedKeyValue = data.key;
      adminName = name;
      document.getElementById('generatedKey').textContent = data.key;
      document.getElementById('formSection').style.display = 'none';
      document.getElementById('keyBox').style.display = 'block';
    } else {
      errorMsg.textContent = data.message || 'Signup failed';
      errorMsg.style.display = 'block';
      btn.disabled = false;
      btn.textContent = 'Create Account';
    }
  } catch (err) {
    errorMsg.textContent = 'Server error. Please try again.';
    errorMsg.style.display = 'block';
    btn.disabled = false;
    btn.textContent = 'Create Account';
  }
});

document.getElementById('copyBtn').addEventListener('click', () => {
  navigator.clipboard.writeText(generatedKeyValue).then(() => {
    const btn = document.getElementById('copyBtn');
    const original = btn.textContent;
    btn.textContent = '✅ Copied!';
    setTimeout(() => btn.textContent = original, 2000);
  });
});

document.getElementById('downloadBtn').addEventListener('click', () => {
  const content = `School Board - Admin Access Key\n\nName: ${adminName}\nKey: ${generatedKeyValue}\n\nKeep this safe. You need it to log in and to share with your students.`;
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'school-board-access-key.txt';
  a.click();
  URL.revokeObjectURL(url);
});

document.getElementById('continueBtn').addEventListener('click', () => {
  // Auto-fill login form via localStorage, then redirect to sign in
  localStorage.setItem('prefillName', adminName);
  localStorage.setItem('prefillKey', generatedKeyValue);
  window.location.href = 'index.html';
});
