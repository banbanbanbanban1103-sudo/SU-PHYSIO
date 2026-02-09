// ========================================
// SU Physiotherapy Booking System - Main App
// ========================================

// Global Variables
let patients = [];
let currentPatient = null;
let currentPage = 'home'; // Added to track current page properly

// ========================================
// Initialize App
// ========================================
// App စဖွင့်ချိန်မှာ ဒေတာ အရင်ရအောင် Async လုပ်ထားပါတယ်
document.addEventListener('DOMContentLoaded', async function() {
    console.log('SU Physiotherapy App Started 🏥');
    
    // 1. ဒေတာကို အရင်ဆုံး ဆွဲယူပါတယ် (Wait for data loading)
    await loadPatients();
    
    // 2. Navigation စနစ်ကို အသက်သွင်းပါတယ်
    initNavigation();
    
    // 3. Form နှင့် Search စနစ်များကို Initialize လုပ်ပါတယ်
    initBookingForm();
    initSearch();
    
    // Set minimum date for booking (today)
    const dateInput = document.getElementById('appointment-date');
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.min = today;
        dateInput.value = today;
    }
    
    // Set default time
    const timeInput = document.getElementById('appointment-time');
    if (timeInput) {
        timeInput.value = '09:00';
    }
    
    // 4. ဒေတာရပြီဆိုမှ UI ကို စတင်ပြသပါတယ်
    updateDashboard();
    renderPatientsTable();
    
    // Load Telegram settings
    loadTelegramSettings();
});

// ========================================
// Navigation System
// ========================================
function initNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    
    navButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const page = this.dataset.page;
            showPage(page);
        });
    });
}

function showPage(pageName) {
    currentPage = pageName; // Update current page status
    
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // Remove active from all nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected page
    const selectedPage = document.getElementById(pageName + '-page');
    if (selectedPage) {
        selectedPage.classList.add('active');
    }
    
    // Add active to selected nav button
    const selectedBtn = document.querySelector(`[data-page="${pageName}"]`);
    if (selectedBtn) {
        selectedBtn.classList.add('active');
    }
    
    // Update content based on page
    if (pageName === 'calendar') {
        if (typeof renderCalendar === 'function') renderCalendar();
        if (typeof renderTodayAppointments === 'function') renderTodayAppointments();
    } else if (pageName === 'patients') {
        renderPatientsTable();
    } else if (pageName === 'home') {
        updateDashboard();
    }
}

// ========================================
// Local Storage & Data Sync Functions
// ========================================
async function loadPatients() {
    console.log('📦 Loading patients...');
    
    // Check if Sheets API is available
    if (typeof readBookingsFromSheets === 'function' && typeof isSheetsConfigured === 'function') {
        if (isSheetsConfigured()) {
            console.log('☁️ Loading from Google Sheets...');
            await loadPatientsFromSheets();
            return;
        }
    }
    
    // Fallback to localStorage if sheets not available
    const saved = localStorage.getItem('su_patients');
    if (saved) {
        patients = JSON.parse(saved);
        console.log('✅ Loaded patients from localStorage:', patients.length);
    } else {
        patients = [];
        console.log('📋 No existing patients');
    }
}

async function loadPatientsFromSheets() {
    try {
        const data = await readBookingsFromSheets();
        patients = data || [];
        console.log('✅ Loaded patients from Sheets:', patients.length);
        
        // Sheets ကနေ ဒေတာရလာတာနဲ့ လက်ရှိရောက်နေတဲ့ Page အလိုက် UI Refresh လုပ်ပေးပါတယ်
        if (currentPage === 'patients') {
            renderPatientsTable();
        } else if (currentPage === 'calendar') {
            if (typeof renderCalendar === 'function') renderCalendar();
            if (typeof renderTodayAppointments === 'function') renderTodayAppointments();
        } else if (currentPage === 'home') {
            updateDashboard();
        }
    } catch (error) {
        console.error('❌ Error loading from Sheets:', error);
        // Fallback on error
        const saved = localStorage.getItem('su_patients');
        patients = saved ? JSON.parse(saved) : [];
    }
}

function savePatients() {
    localStorage.setItem('su_patients', JSON.stringify(patients));
    console.log('✅ Patients saved to localStorage');
}

// ========================================
// Booking Form Logic
// ========================================
function initBookingForm() {
    const form = document.getElementById('booking-form');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            handleBooking();
        });
    }
}

function handleBooking() {
    const name = document.getElementById('patient-name').value.trim();
    const phone = document.getElementById('patient-phone').value.trim();
    const address = document.getElementById('patient-address').value.trim();
    const date = document.getElementById('appointment-date').value;
    const time = document.getElementById('appointment-time').value;
    const treatment = document.getElementById('treatment-type').value;
    const notes = document.getElementById('patient-notes').value.trim();
    
    if (!name || !phone || !date || !time) {
        alert('⚠️ ကျေးဇူးပြု၍ လိုအပ်သော အချက်အလက်များကို ဖြည့်ပါ');
        return;
    }
    
    const newPatient = {
        id: Date.now(),
        name: name,
        phone: phone,
        address: address,
        date: date,
        time: time,
        treatment: treatment,
        notes: notes,
        status: 'pending',
        createdAt: new Date().toISOString()
    };
    
    patients.push(newPatient);
    savePatients();
    
    // Telegram notification logic remains unchanged
    if (typeof sendTelegramNotification === 'function') {
        sendTelegramNotification(newPatient, 'new');
    }
    
    alert('✅ Booking အောင်မြင်ပါသည်!\n\nလူနာ: ' + name + '\nရက်စွဲ: ' + date + '\nအချိန်: ' + time);
    
    document.getElementById('booking-form').reset();
    
    // Reset defaults
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('appointment-date').value = today;
    document.getElementById('appointment-time').value = '09:00';
    
    updateDashboard();
    renderPatientsTable();
    showPage('patients');
}

// ========================================
// Dashboard Logic
// ========================================
function updateDashboard() {
    const totalPatientsEl = document.getElementById('total-patients');
    if (totalPatientsEl) {
        totalPatientsEl.textContent = patients.length;
    }
    
    const today = new Date().toISOString().split('T')[0];
    const todayAppointments = patients.filter(p => p.date === today);
    const todayCountEl = document.getElementById('today-appointments');
    if (todayCountEl) {
        todayCountEl.textContent = todayAppointments.length;
    }
    
    const pendingBookings = patients.filter(p => p.status === 'pending');
    const pendingCountEl = document.getElementById('pending-bookings');
    if (pendingCountEl) {
        pendingCountEl.textContent = pendingBookings.length;
    }
}

// ========================================
// Patients Table Rendering
// ========================================
function renderPatientsTable(filteredPatients = null) {
    const tbody = document.getElementById('patients-tbody');
    if (!tbody) return;
    
    const displayPatients = filteredPatients || patients;
    
    // Sort by date (newest first)
    const sortedPatients = [...displayPatients].sort((a, b) => {
        const dateA = new Date(a.date + ' ' + a.time);
        const dateB = new Date(b.date + ' ' + b.time);
        return dateB - dateA;
    });
    
    tbody.innerHTML = '';
    
    if (sortedPatients.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center" style="padding: 30px;">📋 လူနာမရှိသေးပါ</td></tr>`;
        return;
    }
    
    sortedPatients.forEach(patient => {
        const row = document.createElement('tr');
        const dateObj = new Date(patient.date);
        const formattedDate = dateObj.toLocaleDateString('my-MM', { day: 'numeric', month: 'short', year: 'numeric' });
        
        let statusClass = patient.status || 'pending';
        let statusText = getStatusText(statusClass);
        
        row.innerHTML = `
            <td>${patient.name}</td>
            <td>${patient.phone}</td>
            <td>${formattedDate}</td>
            <td>${patient.time}</td>
            <td><span class="status-badge ${statusClass}">${statusText}</span></td>
            <td>
                <div class="action-buttons">
                    <button class="btn-small btn-view" onclick="viewPatient(${patient.id})">👁️ ကြည့်</button>
                    <button class="btn-small btn-delete" onclick="deletePatient(${patient.id})">🗑️ ဖျက်</button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// ========================================
// Search Functionality
// ========================================
function initSearch() {
    const searchInput = document.getElementById('search-patient');
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            const query = e.target.value.toLowerCase().trim();
            if (query === '') {
                renderPatientsTable();
                return;
            }
            const filtered = patients.filter(p => 
                p.name.toLowerCase().includes(query) || p.phone.includes(query) || p.date.includes(query)
            );
            renderPatientsTable(filtered);
        });
    }
}

// ========================================
// Patient Modal & Actions
// ========================================
function viewPatient(patientId) {
    const patient = patients.find(p => p.id === patientId);
    if (!patient) {
        alert('လူနာ ရှာမတွေ့ပါ');
        return;
    }
    currentPatient = patient;
    
    const treatments = {
        'general': 'ယေဘုယျ ကုထုံး',
        'sports': 'အားကစား ထိခိုက်မှု',
        'orthopedic': 'အရိုးအဆစ်',
        'neuro': 'အာရုံကြော',
        'geriatric': 'သက်ကြီးရွယ်အို'
    };
    const treatmentName = treatments[patient.treatment] || patient.treatment;
    
    const detailsDiv = document.getElementById('patient-details');
    const isPublic = patient.source === 'public';
    const bookingCodeHtml = patient.bookingCode ? `<p><strong>🔖 Booking Code:</strong> ${patient.bookingCode}</p>` : '';
    const sourceHtml = isPublic ? `<p><strong>🌐 Source:</strong> <span style="color: #2563eb; font-weight: 500;">Public Website</span></p>` : '';
    
    detailsDiv.innerHTML = `
        ${bookingCodeHtml}
        ${sourceHtml}
        <p><strong>📛 အမည်:</strong> ${patient.name}</p>
        <p><strong>📞 ဖုန်း:</strong> ${patient.phone}</p>
        <p><strong>📍 လိပ်စာ:</strong> ${patient.address || 'မရှိ'}</p>
        <p><strong>📅 ရက်စွဲ:</strong> ${patient.date}</p>
        <p><strong>🕐 အချိန်:</strong> ${patient.time}</p>
        <p><strong>💊 ကုသမှု:</strong> ${treatmentName}</p>
        <p><strong>📝 မှတ်ချက်:</strong> ${patient.notes || 'မရှိ'}</p>
        <p><strong>✅ အခြေအနေ:</strong> <span class="status-badge ${patient.status}">${getStatusText(patient.status)}</span></p>
        ${patient.cancelReason ? `<p><strong>❌ ပယ်ဖျက်ရခြင်း:</strong> ${patient.cancelReason}</p>` : ''}
    `;
    
    document.getElementById('cancellation-reason').classList.add('hidden');
    document.getElementById('patient-modal').classList.add('active');
}

function updateStatus(newStatus) {
    if (!currentPatient) return;
    if (newStatus === 'cancelled') {
        document.getElementById('cancellation-reason').classList.remove('hidden');
        return;
    }
    const patient = patients.find(p => p.id === currentPatient.id);
    if (patient) {
        patient.status = newStatus;
        savePatients();
        if (typeof updateBookingInSheets === 'function' && typeof isSheetsConfigured === 'function') {
            if (isSheetsConfigured()) updateBookingInSheets(patient.id, { status: newStatus });
        }
        if (typeof sendTelegramNotification === 'function') sendTelegramNotification(patient, 'status_update');
        closeModal();
        renderPatientsTable();
        updateDashboard();
        alert('✅ အခြေအနေ ပြောင်းလဲပြီးပါပြီ');
    }
}

function submitCancellation() {
    if (!currentPatient) return;
    const reason = document.getElementById('cancel-reason').value.trim();
    if (!reason) { alert('⚠️ ကျေးဇူးပြု၍ အကြောင်းပြချက် ဖြည့်ပါ'); return; }
    
    const patient = patients.find(p => p.id === currentPatient.id);
    if (patient) {
        patient.status = 'cancelled';
        patient.cancelReason = reason;
        patient.cancelledAt = new Date().toISOString();
        savePatients();
        if (typeof updateBookingInSheets === 'function' && typeof isSheetsConfigured === 'function') {
            if (isSheetsConfigured()) updateBookingInSheets(patient.id, { status: 'cancelled', cancelReason: reason });
        }
        if (typeof sendTelegramNotification === 'function') sendTelegramNotification(patient, 'cancelled');
        closeModal();
        renderPatientsTable();
        updateDashboard();
        alert('✅ Booking ပယ်ဖျက်ပြီးပါပြီ');
    }
}

function deletePatient(patientId) {
    const patient = patients.find(p => p.id === patientId);
    if (!patient) return;
    if (confirm(`🗑️ ${patient.name} ကို ဖျက်မှာ သေချာပါသလား?\n\nဒီလုပ်ဆောင်ချက်ကို နောက်ပြန်ပြောင်း၍မရပါ။`)) {
        patients = patients.filter(p => p.id !== patientId);
        savePatients();
        if (typeof deleteBookingFromSheets === 'function' && typeof isSheetsConfigured === 'function') {
            if (isSheetsConfigured()) deleteBookingFromSheets(patientId);
        }
        renderPatientsTable();
        updateDashboard();
        alert('✅ လူနာကို ဖျက်ပြီးပါပြီ');
    }
}

// ========================================
// Modal & Telegram Helpers
// ========================================
function closeModal() {
    const modal = document.getElementById('patient-modal');
    if (modal) modal.classList.remove('active');
    currentPatient = null;
    const reasonDiv = document.getElementById('cancellation-reason');
    if (reasonDiv) reasonDiv.classList.add('hidden');
    const reasonInput = document.getElementById('cancel-reason');
    if (reasonInput) reasonInput.value = '';
}

document.getElementById('patient-modal')?.addEventListener('click', function(e) {
    if (e.target === this) closeModal();
});

function toggleTelegramSettings() {
    const config = document.getElementById('telegram-config');
    if (config) config.classList.toggle('hidden');
}

function loadTelegramSettings() {
    const botToken = localStorage.getItem('telegram_bot_token');
    const chatId = localStorage.getItem('telegram_chat_id');
    const tokenInput = document.getElementById('bot-token');
    const idInput = document.getElementById('chat-id');
    if (tokenInput && botToken) tokenInput.value = botToken;
    if (idInput && chatId) idInput.value = chatId;
}

function saveTelegramSettings() {
    const botToken = document.getElementById('bot-token').value.trim();
    const chatId = document.getElementById('chat-id').value.trim();
    if (botToken && chatId) {
        localStorage.setItem('telegram_bot_token', botToken);
        localStorage.setItem('telegram_chat_id', chatId);
        alert('✅ Telegram settings သိမ်းပြီးပါပြီ');
        toggleTelegramSettings();
    } else {
        alert('⚠️ Bot Token နှင့် Chat ID နှစ်ခုလုံး ဖြည့်ပါ');
    }
}

function getStatusText(status) {
    const statusMap = { 'pending': 'စောင့်ဆိုင်း', 'confirmed': 'အတည်ပြု', 'cancelled': 'ပယ်ဖျက်', 'completed': 'ပြီးစီး' };
    return statusMap[status] || status;
}

// Global scope functions for HTML onclick
window.viewPatient = viewPatient;
window.deletePatient = deletePatient;
window.updateStatus = updateStatus;
window.submitCancellation = submitCancellation;
window.closeModal = closeModal;
window.toggleTelegramSettings = toggleTelegramSettings;
window.saveTelegramSettings = saveTelegramSettings;

console.log('✅ App.js loaded successfully with Sync improvements');
