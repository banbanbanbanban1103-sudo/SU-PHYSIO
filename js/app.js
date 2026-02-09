// ========================================
// SU Physiotherapy Booking System - Main App
// ========================================

// Global Variables
let patients = [];
let currentPatient = null;
let currentPage = 'home'; // Added global page tracker

// ========================================
// Initialize App
// ========================================
document.addEventListener('DOMContentLoaded', async function() {
    console.log('SU Physiotherapy App Started 🏥');
    
    // 1. Load data from Sheets or LocalStorage first (Wait for it)
    await loadPatients();
    
    // 2. Initialize UI Components
    initNavigation();
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
    
    // 3. Initial UI Render (Data is now guaranteed to be loaded)
    updateDashboard();
    renderPatientsTable();
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
    currentPage = pageName; // Update current page tracker
    
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
// Local Storage & Sheets Functions
// ========================================
async function loadPatients() {
    console.log('📦 Loading patients...');
    
    // Check if Sheets API is available and configured
    if (typeof readBookingsFromSheets === 'function' && typeof isSheetsConfigured === 'function') {
        if (isSheetsConfigured()) {
            console.log('☁️ Attempting to load from Google Sheets...');
            await loadPatientsFromSheets();
            return;
        }
    }
    
    // Fallback to localStorage if Sheets not configured
    loadFromLocalStorage();
}

async function loadPatientsFromSheets() {
    try {
        const data = await readBookingsFromSheets();
        patients = data || [];
        console.log('✅ Loaded patients from Sheets:', patients.length);
        
        // Refresh UI immediately after sheets data arrives
        updateDashboard();
        renderPatientsTable();
        
    } catch (error) {
        console.error('❌ Error loading from Sheets:', error);
        loadFromLocalStorage(); // Fallback on error
    }
}

function loadFromLocalStorage() {
    console.log('📦 Loading from localStorage...');
    const saved = localStorage.getItem('su_patients');
    if (saved) {
        patients = JSON.parse(saved);
        console.log('✅ Loaded patients from localStorage:', patients.length);
    } else {
        patients = [];
        console.log('📋 No existing patients found');
    }
}

function savePatients() {
    localStorage.setItem('su_patients', JSON.stringify(patients));
    console.log('✅ Patients saved to localStorage');
}

// ========================================
// Booking Form
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
    
    // Send to Telegram if function exists
    if (typeof sendTelegramNotification === 'function') {
        sendTelegramNotification(newPatient, 'new');
    }
    
    alert('✅ Booking အောင်မြင်ပါသည်!');
    document.getElementById('booking-form').reset();
    
    updateDashboard();
    renderPatientsTable();
    showPage('patients');
}

// ========================================
// Dashboard Logic
// ========================================
function updateDashboard() {
    const totalPatientsEl = document.getElementById('total-patients');
    if (totalPatientsEl) totalPatientsEl.textContent = patients.length;
    
    const today = new Date().toISOString().split('T')[0];
    const todayAppointments = patients.filter(p => p.date === today);
    const todayCountEl = document.getElementById('today-appointments');
    if (todayCountEl) todayCountEl.textContent = todayAppointments.length;
    
    const pendingBookings = patients.filter(p => p.status === 'pending');
    const pendingCountEl = document.getElementById('pending-bookings');
    if (pendingCountEl) pendingCountEl.textContent = pendingBookings.length;
}

// ========================================
// Patients Table Render
// ========================================
function renderPatientsTable(filteredPatients = null) {
    const tbody = document.getElementById('patients-tbody');
    if (!tbody) return;
    
    const displayPatients = filteredPatients || patients;
    
    const sortedPatients = [...displayPatients].sort((a, b) => {
        return new Date(b.date + ' ' + b.time) - new Date(a.date + ' ' + a.time);
    });
    
    tbody.innerHTML = '';
    
    if (sortedPatients.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center" style="padding: 30px;">📋 လူနာမရှိသေးပါ</td></tr>`;
        return;
    }
    
    sortedPatients.forEach(patient => {
        const row = document.createElement('tr');
        const dateObj = new Date(patient.date);
        const formattedDate = dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
        
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
// Search & Modals & Helpers
// ========================================
function initSearch() {
    const searchInput = document.getElementById('search-patient');
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            const query = e.target.value.toLowerCase().trim();
            const filtered = patients.filter(p => 
                p.name.toLowerCase().includes(query) || p.phone.includes(query)
            );
            renderPatientsTable(filtered);
        });
    }
}

function viewPatient(patientId) {
    const patient = patients.find(p => p.id === patientId);
    if (!patient) return;
    currentPatient = patient;
    
    const detailsDiv = document.getElementById('patient-details');
    detailsDiv.innerHTML = `
        <p><strong>📛 အမည်:</strong> ${patient.name}</p>
        <p><strong>📞 ဖုန်း:</strong> ${patient.phone}</p>
        <p><strong>📅 ရက်စွဲ:</strong> ${patient.date}</p>
        <p><strong>🕐 အချိန်:</strong> ${patient.time}</p>
        <p><strong>✅ အခြေအနေ:</strong> <span class="status-badge ${patient.status}">${getStatusText(patient.status)}</span></p>
    `;
    document.getElementById('patient-modal').classList.add('active');
}

function getStatusText(status) {
    const statusMap = { 'pending': 'စောင့်ဆိုင်း', 'confirmed': 'အတည်ပြု', 'cancelled': 'ပယ်ဖျက်', 'completed': 'ပြီးစီး' };
    return statusMap[status] || status;
}

function closeModal() {
    document.getElementById('patient-modal').classList.remove('active');
}

// Global scope functions for buttons
window.viewPatient = viewPatient;
window.closeModal = closeModal;
window.deletePatient = deletePatient;

console.log('✅ App.js updated and loaded successfully');
