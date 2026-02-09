// ========================================
// SU Physiotherapy Booking System - Main App
// ========================================

// Global Variables
let patients = [];
let currentPatient = null;
let currentPage = 'home'; // Track current page for UI updates

// ========================================
// Initialize App
// ========================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('SU Physiotherapy App Started 🏥');
    
    // Load data from localStorage
    loadPatients();
    
    // Initialize navigation
    initNavigation();
    
    // Initialize booking form
    initBookingForm();
    
    // Initialize search
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
    
    // Load initial data
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
    // Update current page
    currentPage = pageName;
    
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
        renderCalendar();
        renderTodayAppointments();
    } else if (pageName === 'patients') {
        renderPatientsTable();
    } else if (pageName === 'home') {
        updateDashboard();
    }
}

// ========================================
// Local Storage Functions
// ========================================
function loadPatients() {
    console.log('📦 Loading patients...');
    
    // Check if Sheets API is available
    if (typeof readBookingsFromSheets === 'function' && typeof isSheetsConfigured === 'function') {
        if (isSheetsConfigured()) {
            console.log('☁️ Loading from Google Sheets...');
            loadPatientsFromSheets();
            return;
        }
    }
    
    // Fallback to localStorage
    console.log('📦 Loading from localStorage...');
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
        
        // Update UI if needed
        if (currentPage === 'patients') {
            renderPatientsTable();
        } else if (currentPage === 'calendar') {
            renderCalendar();
            renderTodayAppointments();
        } else if (currentPage === 'home') {
            updateDashboard();
        }
    } catch (error) {
        console.error('❌ Error loading from Sheets:', error);
        // Fallback to localStorage
        const saved = localStorage.getItem('su_patients');
        if (saved) {
            patients = JSON.parse(saved);
        } else {
            patients = [];
        }
    }
}

function savePatients() {
    localStorage.setItem('su_patients', JSON.stringify(patients));
    console.log('✅ Patients saved to localStorage');
    // Note: Sheets updates happen via updateBookingInSheets() in specific functions
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
    // Get form values
    const name = document.getElementById('patient-name').value.trim();
    const phone = document.getElementById('patient-phone').value.trim();
    const address = document.getElementById('patient-address').value.trim();
    const date = document.getElementById('appointment-date').value;
    const time = document.getElementById('appointment-time').value;
    const treatment = document.getElementById('treatment-type').value;
    const notes = document.getElementById('patient-notes').value.trim();
    
    // Validate
    if (!name || !phone || !date || !time) {
        alert('⚠️ ကျေးဇူးပြု၍ လိုအပ်သော အချက်အလက်များကို ဖြည့်ပါ');
        return;
    }
    
    // Create new patient object
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
    
    // Add to patients array
    patients.push(newPatient);
    
    // Save to localStorage
    savePatients();
    
    // Send Telegram notification
    sendTelegramNotification(newPatient, 'new');
    
    // Show success message
    alert('✅ Booking အောင်မြင်ပါသည်!\n\nလူနာ: ' + name + '\nရက်စွဲ: ' + date + '\nအချိန်: ' + time);
    
    // Reset form
    document.getElementById('booking-form').reset();
    
    // Set defaults again
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('appointment-date').value = today;
    document.getElementById('appointment-time').value = '09:00';
    
    // Update UI
    updateDashboard();
    renderPatientsTable();
    
    // Switch to patients page
    showPage('patients');
}

// ========================================
// Dashboard/Home Page
// ========================================
function updateDashboard() {
    // Total patients
    const totalPatientsEl = document.getElementById('total-patients');
    if (totalPatientsEl) {
        totalPatientsEl.textContent = patients.length;
    }
    
    // Today's appointments
    const today = new Date().toISOString().split('T')[0];
    const todayAppointments = patients.filter(p => p.date === today);
    const todayCountEl = document.getElementById('today-appointments');
    if (todayCountEl) {
        todayCountEl.textContent = todayAppointments.length;
    }
    
    // Pending bookings
    const pendingBookings = patients.filter(p => p.status === 'pending');
    const pendingCountEl = document.getElementById('pending-bookings');
    if (pendingCountEl) {
        pendingCountEl.textContent = pendingBookings.length;
    }
}

// ========================================
// Patients Table
// ========================================
function renderPatientsTable(filteredPatients = null) {
    const tbody = document.getElementById('patients-tbody');
    
    if (!tbody) return;
    
    // Use filtered patients or all patients
    const displayPatients = filteredPatients || patients;
    
    // Sort by date (newest first)
    const sortedPatients = [...displayPatients].sort((a, b) => {
        const dateA = new Date(a.date + ' ' + a.time);
        const dateB = new Date(b.date + ' ' + b.time);
        return dateB - dateA;
    });
    
    // Clear table
    tbody.innerHTML = '';
    
    // If no patients
    if (sortedPatients.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center" style="padding: 30px;">
                    📋 လူနာမရှိသေးပါ
                </td>
            </tr>
        `;
        return;
    }
    
    // Render each patient
    sortedPatients.forEach(patient => {
        const row = document.createElement('tr');
        
        // Format date
        const dateObj = new Date(patient.date);
        const formattedDate = dateObj.toLocaleDateString('my-MM', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
        
        // Status badge
        let statusClass = 'pending';
        let statusText = 'စောင့်ဆိုင်း';
        
        if (patient.status === 'confirmed') {
            statusClass = 'confirmed';
            statusText = 'အတည်ပြု';
        } else if (patient.status === 'cancelled') {
            statusClass = 'cancelled';
            statusText = 'ပယ်ဖျက်';
        } else if (patient.status === 'completed') {
            statusClass = 'completed';
            statusText = 'ပြီးစီး';
        }
        
        row.innerHTML = `
            <td>${patient.name}</td>
            <td>${patient.phone}</td>
            <td>${formattedDate}</td>
            <td>${patient.time}</td>
            <td>
                <span class="status-badge ${statusClass}">${statusText}</span>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="btn-small btn-view" onclick="viewPatient(${patient.id})">
                        👁️ ကြည့်
                    </button>
                    <button class="btn-small btn-delete" onclick="deletePatient(${patient.id})">
                        🗑️ ဖျက်
                    </button>
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
            
            const filtered = patients.filter(p => {
                return p.name.toLowerCase().includes(query) ||
                       p.phone.includes(query) ||
                       p.date.includes(query);
            });
            
            renderPatientsTable(filtered);
        });
    }
}

// ========================================
// View Patient Details
// ========================================
function viewPatient(patientId) {
    const patient = patients.find(p => p.id === patientId);
    
    if (!patient) {
        alert('လူနာ ရှာမတွေ့ပါ');
        return;
    }
    
    currentPatient = patient;
    
    // Get treatment name
    const treatments = {
        'general': 'ယေဘုယျ ကုထုံး',
        'sports': 'အားကစား ထိခိုက်မှု',
        'orthopedic': 'အရိုးအဆစ်',
        'neuro': 'အာရုံကြော',
        'geriatric': 'သက်ကြီးရွယ်အို'
    };
    
    const treatmentName = treatments[patient.treatment] || patient.treatment;
    
    // Populate modal
    const detailsDiv = document.getElementById('patient-details');
    
    // Check if this is a public booking
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
    
    // Hide cancellation reason form
    document.getElementById('cancellation-reason').classList.add('hidden');
    
    // Show modal
    document.getElementById('patient-modal').classList.add('active');
}

function getStatusText(status) {
    const statusMap = {
        'pending': 'စောင့်ဆိုင်း',
        'confirmed': 'အတည်ပြု',
        'cancelled': 'ပယ်ဖျက်',
        'completed': 'ပြီးစီး'
    };
    return statusMap[status] || status;
}

// ========================================
// Update Patient Status
// ========================================
function updateStatus(newStatus) {
    if (!currentPatient) return;
    
    // If cancelling, show reason input
    if (newStatus === 'cancelled') {
        document.getElementById('cancellation-reason').classList.remove('hidden');
        return;
    }
    
    // Update status
    const patient = patients.find(p => p.id === currentPatient.id);
    if (patient) {
        patient.status = newStatus;
        
        // Save to localStorage
        savePatients();
        
        // Update in Google Sheets if configured
        if (typeof updateBookingInSheets === 'function' && typeof isSheetsConfigured === 'function') {
            if (isSheetsConfigured()) {
                updateBookingInSheets(patient.id, { status: newStatus });
            }
        }
        
        // Send Telegram notification
        sendTelegramNotification(patient, 'status_update');
        
        // Close modal
        closeModal();
        
        // Update UI
        renderPatientsTable();
        updateDashboard();
        
        alert('✅ အခြေအနေ ပြောင်းလဲပြီးပါပြီ');
    }
}

function submitCancellation() {
    if (!currentPatient) return;
    
    const reason = document.getElementById('cancel-reason').value.trim();
    
    if (!reason) {
        alert('⚠️ ကျေးဇူးပြု၍ အကြောင်းပြချက် ဖြည့်ပါ');
        return;
    }
    
    // Update patient
    const patient = patients.find(p => p.id === currentPatient.id);
    if (patient) {
        patient.status = 'cancelled';
        patient.cancelReason = reason;
        patient.cancelledAt = new Date().toISOString();
        
        savePatients();
        
        // Update in Google Sheets if configured
        if (typeof updateBookingInSheets === 'function' && typeof isSheetsConfigured === 'function') {
            if (isSheetsConfigured()) {
                updateBookingInSheets(patient.id, { 
                    status: 'cancelled',
                    cancelReason: reason 
                });
            }
        }
        
        // Send Telegram notification with reason
        sendTelegramNotification(patient, 'cancelled');
        
        // Close modal
        closeModal();
        
        // Clear reason field
        document.getElementById('cancel-reason').value = '';
        
        // Update UI
        renderPatientsTable();
        updateDashboard();
        
        alert('✅ Booking ပယ်ဖျက်ပြီးပါပြီ');
    }
}

// ========================================
// Delete Patient
// ========================================
function deletePatient(patientId) {
    const patient = patients.find(p => p.id === patientId);
    
    if (!patient) return;
    
    const confirmed = confirm(`🗑️ ${patient.name} ကို ဖျက်မှာ သေချာပါသလား?\n\nဒီလုပ်ဆောင်ချက်ကို နောက်ပြန်ပြောင်း၍မရပါ။`);
    
    if (confirmed) {
        patients = patients.filter(p => p.id !== patientId);
        savePatients();
        
        // Delete from Google Sheets if configured
        if (typeof deleteBookingFromSheets === 'function' && typeof isSheetsConfigured === 'function') {
            if (isSheetsConfigured()) {
                deleteBookingFromSheets(patientId);
            }
        }
        
        renderPatientsTable();
        updateDashboard();
        
        alert('✅ လူနာကို ဖျက်ပြီးပါပြီ');
    }
}

// ========================================
// Modal Functions
// ========================================
function closeModal() {
    document.getElementById('patient-modal').classList.remove('active');
    currentPatient = null;
    document.getElementById('cancellation-reason').classList.add('hidden');
    document.getElementById('cancel-reason').value = '';
}

// Close modal when clicking outside
document.getElementById('patient-modal')?.addEventListener('click', function(e) {
    if (e.target === this) {
        closeModal();
    }
});

// ========================================
// Telegram Settings
// ========================================
function toggleTelegramSettings() {
    const config = document.getElementById('telegram-config');
    config.classList.toggle('hidden');
}

function loadTelegramSettings() {
    const botToken = localStorage.getItem('telegram_bot_token');
    const chatId = localStorage.getItem('telegram_chat_id');
    
    if (botToken) {
        document.getElementById('bot-token').value = botToken;
    }
    
    if (chatId) {
        document.getElementById('chat-id').value = chatId;
    }
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

// ========================================
// Helper Functions
// ========================================
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('my-MM', options);
}

function formatTime(timeString) {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
}

// ========================================
// Export Functions
// ========================================
console.log('✅ App.js loaded successfully');
