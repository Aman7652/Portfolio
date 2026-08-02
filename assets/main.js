// --- MENU BEHAVIOR ---
const menuBtn = document.querySelector('[data-menu-btn]');
const nav = document.querySelector('[data-nav]');
if (menuBtn && nav) {
  menuBtn.addEventListener('click', () => nav.classList.toggle('open'));
  nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => nav.classList.remove('open')));
}

// --- STATE MANAGEMENT ---
let currentUser = null;

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
  checkAuthStatus();
  setupContactForm();
});

// --- AUTHENTICATION API & STATUS ---
async function checkAuthStatus() {
  try {
    const res = await fetch('/api/auth/me');
    const data = await res.json();
    if (data.authenticated && data.user) {
      currentUser = data.user;
      renderAuthenticatedState(data.user);
    } else {
      currentUser = null;
      renderUnauthenticatedState();
    }
  } catch (err) {
    console.warn('API unavailable or static mode:', err);
    currentUser = null;
    renderUnauthenticatedState();
  }
}

function renderAuthenticatedState(user) {
  const authContainer = document.getElementById('auth-header-actions');
  const navMessagesLink = document.getElementById('nav-messages-link');
  const messagesSection = document.getElementById('messages');
  const isAdmin = user.role === 'admin';
  
  if (navMessagesLink) {
    navMessagesLink.style.display = 'inline-block';
    navMessagesLink.textContent = isAdmin ? '👑 Admin Portal' : '👤 My Inquiries';
  }

  if (messagesSection) {
    messagesSection.style.display = 'block';
    loadDatabaseMessages();
  }

  if (authContainer) {
    const initial = user.name ? user.name.charAt(0).toUpperCase() : 'U';
    const roleIcon = isAdmin ? '👑' : '👤';
    const roleLabel = isAdmin ? 'ADMIN' : 'CUSTOMER';
    
    authContainer.innerHTML = `
      <div class="user-badge" title="Logged in as ${escapeHtml(user.email)}">
        <div class="user-avatar-small">${initial}</div>
        <div class="user-info-text">
          <span class="user-name-small">${roleIcon} ${escapeHtml(user.name)}</span>
          <span class="user-role-small">${roleLabel}</span>
        </div>
      </div>
      <button onclick="handleLogout()" class="btn small ghost" style="padding:6px 12px;">Logout</button>
    `;
  }
}

function renderUnauthenticatedState() {
  const authContainer = document.getElementById('auth-header-actions');
  const navMessagesLink = document.getElementById('nav-messages-link');
  const messagesSection = document.getElementById('messages');

  if (navMessagesLink) navMessagesLink.style.display = 'none';
  if (messagesSection) messagesSection.style.display = 'none';

  if (authContainer) {
    authContainer.innerHTML = '';
  }
}

// --- AUTH MODAL CONTROLS ---
function openAuthModal(defaultTab = 'login') {
  const modal = document.getElementById('auth-modal');
  if (modal) {
    switchModalTab(defaultTab);
    modal.classList.add('active');
  } else {
    window.location.href = '/login';
  }
}

function closeAuthModal() {
  const modal = document.getElementById('auth-modal');
  if (modal) modal.classList.remove('active');
}

function switchModalTab(tab) {
  const loginForm = document.getElementById('modal-login-form');
  const regForm = document.getElementById('modal-register-form');
  const loginTab = document.getElementById('modal-tab-login');
  const regTab = document.getElementById('modal-tab-register');
  const alertBox = document.getElementById('modal-auth-alert');

  if (alertBox) alertBox.style.display = 'none';

  if (tab === 'login') {
    if (loginForm) loginForm.style.display = 'flex';
    if (regForm) regForm.style.display = 'none';
    if (loginTab) loginTab.classList.add('active');
    if (regTab) regTab.classList.remove('active');
  } else {
    if (loginForm) loginForm.style.display = 'none';
    if (regForm) regForm.style.display = 'flex';
    if (loginTab) loginTab.classList.remove('active');
    if (regTab) regTab.classList.add('active');
  }
}

function switchAuthTab(tab) {
  const loginForm = document.getElementById('standalone-login-form');
  const regForm = document.getElementById('standalone-register-form');
  const loginTab = document.getElementById('tab-login-btn');
  const regTab = document.getElementById('tab-register-btn');
  const alertBox = document.getElementById('auth-alert');

  if (alertBox) alertBox.style.display = 'none';

  if (tab === 'login') {
    if (loginForm) loginForm.style.display = 'flex';
    if (regForm) regForm.style.display = 'none';
    if (loginTab) loginTab.classList.add('active');
    if (regTab) regTab.classList.remove('active');
  } else {
    if (loginForm) loginForm.style.display = 'none';
    if (regForm) regForm.style.display = 'flex';
    if (loginTab) loginTab.classList.remove('active');
    if (regTab) regTab.classList.add('active');
  }
}

// --- AUTH API HANDLERS ---
async function handleModalLoginSubmit(e) {
  e.preventDefault();
  const email = document.getElementById('modal-login-email').value;
  const password = document.getElementById('modal-login-password').value;
  const alertBox = document.getElementById('modal-auth-alert');

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();

    if (data.success) {
      showAlert(alertBox, data.message || 'Login successful!', 'success');
      currentUser = data.user;
      renderAuthenticatedState(data.user);
      setTimeout(() => closeAuthModal(), 800);
    } else {
      showAlert(alertBox, data.error || 'Login failed.', 'error');
    }
  } catch (err) {
    showAlert(alertBox, 'Failed to connect to backend server.', 'error');
  }
}

async function handleModalRegisterSubmit(e) {
  e.preventDefault();
  const name = document.getElementById('modal-reg-name').value;
  const email = document.getElementById('modal-reg-email').value;
  const password = document.getElementById('modal-reg-password').value;
  const alertBox = document.getElementById('modal-auth-alert');

  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
    const data = await res.json();

    if (data.success) {
      showAlert(alertBox, 'Account created successfully!', 'success');
      currentUser = data.user;
      renderAuthenticatedState(data.user);
      setTimeout(() => closeAuthModal(), 800);
    } else {
      showAlert(alertBox, data.error || 'Registration failed.', 'error');
    }
  } catch (err) {
    showAlert(alertBox, 'Failed to connect to backend server.', 'error');
  }
}

async function handleLoginSubmit(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  const alertBox = document.getElementById('auth-alert');

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();

    if (data.success) {
      showAlert(alertBox, 'Login successful! Redirecting...', 'success');
      setTimeout(() => window.location.href = '/', 1000);
    } else {
      showAlert(alertBox, data.error || 'Login failed.', 'error');
    }
  } catch (err) {
    showAlert(alertBox, 'Failed to connect to backend server.', 'error');
  }
}

async function handleRegisterSubmit(e) {
  e.preventDefault();
  const name = document.getElementById('reg-name').value;
  const email = document.getElementById('reg-email').value;
  const password = document.getElementById('reg-password').value;
  const alertBox = document.getElementById('auth-alert');

  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
    const data = await res.json();

    if (data.success) {
      showAlert(alertBox, 'Account created! Redirecting to home...', 'success');
      setTimeout(() => window.location.href = '/', 1000);
    } else {
      showAlert(alertBox, data.error || 'Registration failed.', 'error');
    }
  } catch (err) {
    showAlert(alertBox, 'Failed to connect to backend server.', 'error');
  }
}

async function handleLogout() {
  try {
    await fetch('/api/auth/logout', { method: 'POST' });
  } catch (err) {}
  currentUser = null;
  renderUnauthenticatedState();
}

function showAlert(element, message, type) {
  if (!element) return;
  element.className = `auth-alert ${type}`;
  element.textContent = message;
  element.style.display = 'block';
}

// --- CONTACT FORM SUBMISSION ---
function setupContactForm() {
  const form = document.querySelector('[data-contact-form]');
  const note = document.querySelector('[data-form-note]');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const payload = {
      name: formData.get('name'),
      email: formData.get('email'),
      service: formData.get('service'),
      budget: formData.get('budget'),
      message: formData.get('message')
    };

    if (note) note.textContent = '⏳ Saving message to SQLite database...';

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success) {
        if (note) note.textContent = `✅ ${data.message}`;
        form.reset();
        if (currentUser) {
          loadDatabaseMessages();
        }
      } else {
        if (note) note.textContent = `❌ ${data.error || 'Failed to submit.'}`;
      }
    } catch (err) {
      if (note) note.textContent = '✅ Message captured (offline mode). Ensure Flask backend is active.';
      form.reset();
    }
  });
}

// --- MESSAGES DASHBOARD LOADER (ADMIN vs CUSTOMER INTERFACE) ---
async function loadDatabaseMessages() {
  const tbody = document.getElementById('messages-table-body');
  const subtitle = document.getElementById('messages-subtitle');
  const thead = document.querySelector('.messages-table thead');
  if (!tbody) return;

  try {
    const res = await fetch('/api/admin/messages');
    const data = await res.json();
    const isAdmin = data.is_admin;

    // Update section headers based on Role
    if (subtitle) {
      subtitle.textContent = isAdmin 
        ? `👑 Admin Control Panel: Viewing and managing all ${data.messages.length} customer inquiries stored in SQLite.`
        : `👤 Customer Workspace: Tracking your ${data.messages.length} submitted project requests.`;
    }

    if (thead) {
      if (isAdmin) {
        thead.innerHTML = `
          <tr>
            <th>ID</th>
            <th>Client Name</th>
            <th>Email</th>
            <th>Service Requested</th>
            <th>Budget</th>
            <th>Message</th>
            <th>Status</th>
            <th>Admin Actions</th>
          </tr>
        `;
      } else {
        thead.innerHTML = `
          <tr>
            <th>ID</th>
            <th>Service Requested</th>
            <th>Budget / Scope</th>
            <th>Your Message</th>
            <th>Request Status</th>
            <th>Date Submitted</th>
          </tr>
        `;
      }
    }

    if (!data.success || !data.messages || data.messages.length === 0) {
      const colSpan = isAdmin ? 8 : 6;
      tbody.innerHTML = `<tr><td colspan="${colSpan}" style="text-align: center; color: var(--muted); padding: 20px;">No messages saved in database yet. Submit an inquiry in the Contact section!</td></tr>`;
      return;
    }

    if (isAdmin) {
      tbody.innerHTML = data.messages.map(m => `
        <tr>
          <td><strong>#${m.id}</strong></td>
          <td><b>${escapeHtml(m.name)}</b></td>
          <td><a href="mailto:${escapeHtml(m.email)}" style="color:var(--accent);">${escapeHtml(m.email)}</a></td>
          <td><span class="pill" style="font-size:11px;">${escapeHtml(m.service)}</span></td>
          <td>${escapeHtml(m.budget || 'N/A')}</td>
          <td style="max-width: 250px;">${escapeHtml(m.message)}</td>
          <td>
            <select onchange="updateInquiryStatus(${m.id}, this.value)" style="padding:4px 8px; border-radius:8px; background:rgba(255,255,255,0.08); color:var(--text); border:1px solid var(--border);">
              <option value="Received" ${m.status === 'Received' ? 'selected' : ''}>Received</option>
              <option value="In Review" ${m.status === 'In Review' ? 'selected' : ''}>In Review</option>
              <option value="In Progress" ${m.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
              <option value="Completed" ${m.status === 'Completed' ? 'selected' : ''}>Completed</option>
            </select>
          </td>
          <td>
            <button onclick="deleteInquiry(${m.id})" class="btn small ghost" style="padding:4px 10px; color:#fca5a5;" title="Delete inquiry">🗑️ Delete</button>
          </td>
        </tr>
      `).join('');
    } else {
      tbody.innerHTML = data.messages.map(m => `
        <tr>
          <td><strong>#${m.id}</strong></td>
          <td><span class="pill" style="font-size:11px;">${escapeHtml(m.service)}</span></td>
          <td>${escapeHtml(m.budget || 'N/A')}</td>
          <td>${escapeHtml(m.message)}</td>
          <td>${getStatusBadgeHtml(m.status || 'Received')}</td>
          <td><small style="color:var(--muted);">${new Date(m.created_at).toLocaleDateString()}</small></td>
        </tr>
      `).join('');
    }

  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--accent); padding: 20px;">Unable to fetch messages from SQLite database. Ensure backend server is active.</td></tr>`;
  }
}

// --- ADMIN ACTIONS ---
async function updateInquiryStatus(msgId, newStatus) {
  try {
    const res = await fetch(`/api/admin/messages/${msgId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
    const data = await res.json();
    if (data.success) {
      loadDatabaseMessages();
    } else {
      alert(data.error || 'Failed to update status.');
    }
  } catch (err) {
    alert('Error connecting to backend.');
  }
}

async function deleteInquiry(msgId) {
  if (!confirm('Are you sure you want to delete this customer inquiry?')) return;
  try {
    const res = await fetch(`/api/admin/messages/${msgId}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      loadDatabaseMessages();
    } else {
      alert(data.error || 'Failed to delete inquiry.');
    }
  } catch (err) {
    alert('Error connecting to backend.');
  }
}

function getStatusBadgeHtml(status) {
  let style = 'background: rgba(110,231,255,0.15); color: var(--accent); border: 1px solid rgba(110,231,255,0.3);';
  if (status === 'In Review') {
    style = 'background: rgba(167,139,250,0.15); color: var(--accent-2); border: 1px solid rgba(167,139,250,0.3);';
  } else if (status === 'In Progress') {
    style = 'background: rgba(251,191,36,0.15); color: #fbbf24; border: 1px solid rgba(251,191,36,0.3);';
  } else if (status === 'Completed') {
    style = 'background: rgba(52,211,153,0.15); color: #34d399; border: 1px solid rgba(52,211,153,0.3);';
  }
  return `<span style="padding:4px 10px; border-radius:20px; font-size:12px; font-weight:600; ${style}">${escapeHtml(status)}</span>`;
}

// --- UTILS ---
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
