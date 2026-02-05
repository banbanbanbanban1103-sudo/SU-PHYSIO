// ========================================
// Authentication & Session Management
// ========================================

// Default admin credentials
const DEFAULT_ADMIN = {
    username: 'admin',
    password: 'admin123' // SHA256: 240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9
};

// ========================================
// Check Admin Credentials
// ========================================
function checkAdminCredentials(username, password) {
    // Get stored credentials from localStorage
    const storedUsername = localStorage.getItem('admin_username') || DEFAULT_ADMIN.username;
    const storedPassword = localStorage.getItem('admin_password') || DEFAULT_ADMIN.password;
    
    return username === storedUsername && password === storedPassword;
}

// ========================================
// Set Admin Session
// ========================================
function setAdminSession(username) {
    const session = {
        username: username,
        loginTime: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
    };
    
    localStorage.setItem('admin_session', JSON.stringify(session));
    console.log('✅ Admin session created');
}

// ========================================
// Check Admin Session
// ========================================
function checkAdminSession() {
    const sessionData = localStorage.getItem('admin_session');
    
    if (!sessionData) {
        return false;
    }
    
    try {
        const session = JSON.parse(sessionData);
        const now = new Date();
        const expiresAt = new Date(session.expiresAt);
        
        if (now > expiresAt) {
            // Session expired
            clearAdminSession();
            return false;
        }
        
        return true;
    } catch (error) {
        console.error('Session error:', error);
        return false;
    }
}

// ========================================
// Get Current Admin
// ========================================
function getCurrentAdmin() {
    const sessionData = localStorage.getItem('admin_session');
    
    if (!sessionData) {
        return null;
    }
    
    try {
        const session = JSON.parse(sessionData);
        return session.username;
    } catch (error) {
        return null;
    }
}

// ========================================
// Clear Admin Session (Logout)
// ========================================
function clearAdminSession() {
    localStorage.removeItem('admin_session');
    console.log('🚪 Admin logged out');
}

// ========================================
// Admin Logout
// ========================================
function adminLogout() {
    const confirmed = confirm('🚪 Logout လုပ်မှာ သေချာပါသလား?');
    
    if (confirmed) {
        clearAdminSession();
        window.location.href = 'admin-login.html';
    }
}

// ========================================
// Change Admin Password
// ========================================
function changeAdminPassword() {
    const currentPassword = prompt('လက်ရှိ Password ထည့်ပါ:');
    
    if (!currentPassword) return;
    
    // Verify current password
    const storedPassword = localStorage.getItem('admin_password') || DEFAULT_ADMIN.password;
    
    if (currentPassword !== storedPassword) {
        alert('❌ လက်ရှိ Password မှားယွင်းနေပါသည်');
        return;
    }
    
    const newPassword = prompt('Password အသစ် ထည့်ပါ:');
    
    if (!newPassword) return;
    
    if (newPassword.length < 6) {
        alert('⚠️ Password သည် အနည်းဆုံး ၆ လုံး ရှိရပါမည်');
        return;
    }
    
    const confirmPassword = prompt('Password အသစ် ထပ်မံ အတည်ပြုပါ:');
    
    if (newPassword !== confirmPassword) {
        alert('❌ Password များ မတူညီပါ');
        return;
    }
    
    // Save new password
    localStorage.setItem('admin_password', newPassword);
    
    alert('✅ Password ပြောင်းလဲပြီးပါပြီ!\n\nနောက်တစ်ကြိမ် login ဝင်ရာတွင် Password အသစ်ကို သုံးပါ။');
}

// ========================================
// Reset Admin Password to Default
// ========================================
function resetAdminPassword() {
    const confirmed = confirm('⚠️ Password ကို default အဖြစ် ပြန်ပြောင်းမှာ သေချာပါသလား?\n\nDefault: admin123');
    
    if (confirmed) {
        localStorage.removeItem('admin_password');
        alert('✅ Password ကို default အဖြစ် ပြန်ပြောင်းပြီးပါပြီ\n\nPassword: admin123');
    }
}

// ========================================
// Protect Admin Pages
// ========================================
function protectAdminPage() {
    // Check if current page is admin page (dashboard.html)
    const currentPage = window.location.pathname;
    
    if (currentPage.includes('dashboard.html')) {
        if (!checkAdminSession()) {
            // Not logged in, redirect to login
            alert('⚠️ ကျေးဇူးပြု၍ အရင် login ဝင်ပါ');
            window.location.href = 'admin-login.html';
        } else {
            // Logged in, show admin info
            showAdminInfo();
        }
    }
}

// ========================================
// Show Admin Info
// ========================================
function showAdminInfo() {
    const adminUsername = getCurrentAdmin();
    
    if (adminUsername) {
        console.log('👤 Logged in as:', adminUsername);
        
        // You can display admin name in header if needed
        // Example: Add a logout button
        addLogoutButton();
    }
}

// ========================================
// Add Logout Button to Admin Panel
// ========================================
function addLogoutButton() {
    // Check if logout button already exists
    if (document.getElementById('admin-logout-btn')) return;
    
    const header = document.querySelector('header .container');
    
    if (header) {
        const logoutBtn = document.createElement('button');
        logoutBtn.id = 'admin-logout-btn';
        logoutBtn.innerHTML = '🚪 Logout';
        logoutBtn.style.cssText = `
            position: absolute;
            right: 20px;
            top: 50%;
            transform: translateY(-50%);
            padding: 8px 16px;
            background: #ef4444;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
        `;
        
        logoutBtn.addEventListener('click', adminLogout);
        
        header.style.position = 'relative';
        header.appendChild(logoutBtn);
    }
}

// ========================================
// Initialize Authentication
// ========================================
document.addEventListener('DOMContentLoaded', function() {
    // Protect admin pages
    protectAdminPage();
});

// ========================================
// Export Functions
// ========================================
console.log('✅ Auth.js loaded');