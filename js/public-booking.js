// ========================================
// Public Booking Page - JavaScript
// ========================================

let currentBookingCode = '';

// ========================================
// Initialize
// ========================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('Public Booking Page Loaded 📋');
    
    // Set minimum date to tomorrow for all date inputs
    const dateInputs = ['pub-date', 'quick-date', 'new-date'];
    const tomorrow = getTomorrowDate();
    
    dateInputs.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.min = tomorrow;
            input.value = tomorrow;
        }
    });
    
    // Check for saved booking (Session Storage)
    checkSavedBooking();
    
    // Initialize tabs
    initTabs();
    
    // Initialize forms
    initNewCustomerForm();
    initQuickBookingForm();
    initCheckStatusForm();
});

function getTomorrowDate() {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
}

// ========================================
// Helper: Normalize Phone Number
// ========================================
function normalizePhone(phone) {
    if (!phone) return '';
    
    // Convert to string first (in case it's a number)
    const phoneStr = String(phone);
    
    // Remove all non-digit characters
    let cleaned = phoneStr.replace(/\D/g, '');
    
    // If starts with 95 (country code), remove it
    if (cleaned.startsWith('95') && cleaned.length > 9) {
        cleaned = cleaned.substring(2);
    }
    
    // Return as-is for flexible matching
    return cleaned;
}

// ========================================
// New Customer Form
// ========================================
function initNewCustomerForm() {
    const form = document.getElementById('new-customer-form');
    
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            handleNewCustomerBooking();
        });
    }
}

async function handleNewCustomerBooking() {
    console.log('📝 New customer booking...');
    
    // Get form values
    const name = document.getElementById('new-name').value.trim();
    let phone = document.getElementById('new-phone').value.trim();
    const address = document.getElementById('new-address').value.trim();
    const date = document.getElementById('new-date').value;
    const time = document.getElementById('new-time').value;
    const treatment = document.getElementById('new-treatment').value;
    const notes = document.getElementById('new-notes').value.trim();
    
    // Normalize phone number (add 0 if missing)
    phone = normalizePhone(phone);
    
    // Validate
    if (!name || !phone || !address || !date || !time || !treatment) {
        alert('⚠️ ကျေးဇူးပြု၍ လိုအပ်သော အချက်အလက်များကို ဖြည့်ပါ');
        return;
    }
    
    if (phone.length < 10 || phone.length > 11) {
        alert('⚠️ ဖုန်းနံပါတ် မှန်ကန်ပါစေ (09xxxxxxxxx)');
        return;
    }
    
    console.log('📞 Checking if customer exists...');
    
    // Check if customer already exists
    const existingCustomer = await findCustomerByPhone(phone);
    
    if (existingCustomer) {
        const useExisting = confirm(
            `ဤဖုန်းနံပါတ် မှတ်ပုံတင်ပြီးသားဖြစ်ပါသည်။\n\n` +
            `အမည်: ${existingCustomer.name}\n` +
            `လိပ်စာ: ${existingCustomer.address}\n\n` +
            `Quick Booking အသုံးပြုလိုပါသလား?`
        );
        
        if (useExisting) {
            // Switch to quick booking tab
            switchTab('quick-booking');
            document.getElementById('quick-phone').value = phone;
            lookupCustomer();
            return;
        }
    }
    
    // Create new customer
    console.log('👤 Creating new customer...');
    
    const newCustomer = {
        name: name,
        phone: phone,
        address: address
    };
    
    const customerResult = await createCustomerInSheets(newCustomer);
    
    let customerId = null;
    if (customerResult && customerResult.success) {
        customerId = customerResult.data ? customerResult.data.id : Date.now();
        console.log('✅ Customer created, ID:', customerId);
    } else {
        customerId = Date.now();
        console.log('⚠️ Using fallback customer ID');
    }
    
    // Create booking
    const bookingCode = generateBookingCode();
    
    const newBooking = {
        id: Date.now(),
        bookingCode: bookingCode,
        customerId: customerId,
        name: name,
        phone: phone,
        address: address,
        date: date,
        time: time,
        treatment: treatment,
        notes: notes,
        status: 'pending',
        createdAt: new Date().toISOString(),
        source: 'public'
    };
    
    // Save booking
    await saveBookingAsync(newBooking);
    
    // Save to session
    sessionStorage.setItem('su_booking_code', bookingCode);
    sessionStorage.setItem('su_booking_phone', phone);
    
    // Show success
    showSuccessModal(newBooking);
    
    // Reset form
    document.getElementById('new-customer-form').reset();
    document.getElementById('new-date').value = getTomorrowDate();
    
    console.log('✅ New customer booking complete!');
}

// ========================================
// Quick Booking Form
// ========================================
function initQuickBookingForm() {
    const form = document.getElementById('quick-booking-form');
    
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            handleQuickBooking();
        });
    }
}

async function lookupCustomer() {
    let phone = document.getElementById('quick-phone').value.trim();
    phone = normalizePhone(phone); // Normalize phone
    
    if (!phone) {
        alert('⚠️ ဖုန်းနံပါတ် ရိုက်ပါ');
        return;
    }
    
    if (phone.length < 10 || phone.length > 11) {
        alert('⚠️ ဖုန်းနံပါတ် မှန်ကန်ပါစေ');
        return;
    }
    
    console.log('🔍 Looking up customer:', phone);
    
    const customer = await findCustomerByPhone(phone);
    
    if (customer) {
        // Show customer info
        document.getElementById('customer-info').classList.remove('hidden');
        document.getElementById('cust-name').textContent = customer.name;
        document.getElementById('cust-address').textContent = customer.address;
        document.getElementById('cust-bookings').textContent = customer.totalBookings || 0;
        document.getElementById('quick-customer-id').value = customer.id;
        
        console.log('✅ Customer found');
    } else {
        document.getElementById('customer-info').classList.add('hidden');
        alert('❌ ဤဖုန်းနံပါတ် မှတ်ပုံတင်ထားခြင်း မရှိပါ။\n\nကျေးဇူးပြု၍ "New Customer" tab မှ မှတ်ပုံတင်ပါ။');
        
        // Switch to new customer tab
        switchTab('new-customer');
        document.getElementById('new-phone').value = phone;
    }
}

async function handleQuickBooking() {
    console.log('⚡ Quick booking...');
    
    const customerId = document.getElementById('quick-customer-id').value;
    
    if (!customerId) {
        alert('⚠️ ကျေးဇူးပြု၍ အရင် "🔍 ရှာမည်" ကို နှိပ်ပြီး customer ရှာပါ');
        return;
    }
    
    let phone = document.getElementById('quick-phone').value.trim();
    phone = normalizePhone(phone); // Normalize phone
    
    const date = document.getElementById('quick-date').value;
    const time = document.getElementById('quick-time').value;
    const treatment = document.getElementById('quick-treatment').value;
    const notes = document.getElementById('quick-notes').value.trim();
    
    if (!date || !time || !treatment) {
        alert('⚠️ ကျေးဇူးပြု၍ ရက်စွဲ၊ အချိန်၊ ကုသမှု ရွေးပါ');
        return;
    }
    
    // Get customer info from display
    const name = document.getElementById('cust-name').textContent;
    const address = document.getElementById('cust-address').textContent;
    
    // Create booking
    const bookingCode = generateBookingCode();
    
    const newBooking = {
        id: Date.now(),
        bookingCode: bookingCode,
        customerId: customerId,
        name: name,
        phone: phone,
        address: address,
        date: date,
        time: time,
        treatment: treatment,
        notes: notes,
        status: 'pending',
        createdAt: new Date().toISOString(),
        source: 'public'
    };
    
    // Save booking
    await saveBookingAsync(newBooking);
    
    // Save to session
    sessionStorage.setItem('su_booking_code', bookingCode);
    sessionStorage.setItem('su_booking_phone', phone);
    
    // Show success
    showSuccessModal(newBooking);
    
    // Reset form (keep customer info)
    document.getElementById('quick-date').value = getTomorrowDate();
    document.getElementById('quick-time').value = '';
    document.getElementById('quick-treatment').value = '';
    document.getElementById('quick-notes').value = '';
    
    console.log('✅ Quick booking complete!');
}

// ========================================
// Check for Saved Booking (Session Storage)
// ========================================
function checkSavedBooking() {
    const savedCode = sessionStorage.getItem('su_booking_code');
    const savedPhone = sessionStorage.getItem('su_booking_phone');
    
    if (savedCode && savedPhone) {
        console.log('✅ Found saved booking:', savedCode);
        
        // Auto-load the booking
        autoLoadBooking(savedCode, savedPhone);
    }
}

async function autoLoadBooking(bookingCode, phone) {
    console.log('🔍 Auto-loading booking:', bookingCode);
    
    let booking = null;
    
    // Try Google Sheets first
    if (typeof readBookingsFromSheets === 'function' && typeof isSheetsConfigured === 'function') {
        if (isSheetsConfigured()) {
            console.log('☁️ Loading from Google Sheets...');
            try {
                const bookings = await readBookingsFromSheets();
                booking = bookings.find(p => 
                    p.bookingCode === bookingCode && p.phone === phone
                );
            } catch (error) {
                console.error('❌ Error loading from Sheets:', error);
            }
        }
    }
    
    // Fallback to localStorage
    if (!booking) {
        console.log('📦 Trying localStorage...');
        const saved = localStorage.getItem('su_patients');
        if (saved) {
            const patients = JSON.parse(saved);
            booking = patients.find(p => 
                p.bookingCode === bookingCode && p.phone === phone
            );
        }
    }
    
    if (!booking) {
        console.log('❌ Booking not found, clearing session');
        sessionStorage.removeItem('su_booking_code');
        sessionStorage.removeItem('su_booking_phone');
        return;
    }
    
    console.log('✅ Booking found:', booking);
    
    // Switch to check status tab
    switchTab('check-status');
    
    // Wait for DOM to be ready
    setTimeout(() => {
        // Show welcome message
        showWelcomeBack(booking);
        
        // Show booking status
        showBookingStatus(booking);
    }, 100);
}

// ========================================
// Tab System
// ========================================
function initTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    
    tabButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const tabName = this.dataset.tab;
            switchTab(tabName);
        });
    });
}

function switchTab(tabName) {
    // Remove active from all tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // Add active to selected tab
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(tabName).classList.add('active');
}

// ========================================
// Public Booking Form
// ========================================
function initPublicBookingForm() {
    const form = document.getElementById('public-booking-form');
    
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            handlePublicBooking();
        });
    }
}

function handlePublicBooking() {
    console.log('🔵 handlePublicBooking called');
    
    // Get form values
    const name = document.getElementById('pub-name').value.trim();
    const phone = document.getElementById('pub-phone').value.trim();
    const address = document.getElementById('pub-address').value.trim();
    const date = document.getElementById('pub-date').value;
    const time = document.getElementById('pub-time').value;
    const treatment = document.getElementById('pub-treatment').value;
    const notes = document.getElementById('pub-notes').value.trim();
    
    console.log('📋 Form values:', { name, phone, address, date, time, treatment });
    
    // Validate
    if (!name || !phone || !address || !date || !time || !treatment) {
        console.log('❌ Validation failed');
        alert('⚠️ ကျေးဇူးပြု၍ လိုအပ်သော အချက်အလက်များကို ဖြည့်ပါ');
        return;
    }
    
    // Validate phone number
    if (phone.length < 9 || phone.length > 11) {
        console.log('❌ Phone validation failed');
        alert('⚠️ ဖုန်းနံပါတ် မှန်ကန်ပါစေ (09xxxxxxxxx)');
        return;
    }
    
    console.log('✅ Validation passed');
    
    // Generate booking code
    const bookingCode = generateBookingCode();
    console.log('🔢 Generated booking code:', bookingCode);
    
    // Create patient object
    const newPatient = {
        id: Date.now(),
        bookingCode: bookingCode,
        name: name,
        phone: phone,
        address: address,
        date: date,
        time: time,
        treatment: treatment,
        notes: notes,
        status: 'pending',
        createdAt: new Date().toISOString(),
        confirmedAt: null,
        cancelReason: null,
        cancelledAt: null,
        source: 'public'
    };
    
    console.log('👤 New patient object:', newPatient);
    
    // Save to Google Sheets (or localStorage)
    saveBookingAsync(newPatient);
    
    // Save to Session Storage for auto-login
    sessionStorage.setItem('su_booking_code', bookingCode);
    sessionStorage.setItem('su_booking_phone', phone);
    
    console.log('✅ Public booking created');
    console.log('💾 Saved to session storage for auto-login');
    
    // Show success modal
    console.log('🎉 Showing success modal...');
    showSuccessModal(newPatient);
    
    // Reset form
    document.getElementById('public-booking-form').reset();
    console.log('🔄 Form reset');
    
    // Reset date to tomorrow
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    document.getElementById('pub-date').value = tomorrow.toISOString().split('T')[0];
    console.log('✅ Booking process complete!');
}

// ==========================================
// Save Booking (Async)
// ==========================================
async function saveBookingAsync(booking) {
    console.log('💾 Saving booking...');
    
    // Check if Sheets is configured
    if (typeof isSheetsConfigured === 'function' && isSheetsConfigured()) {
        console.log('☁️ Using Google Sheets...');
        try {
            const result = await createBookingInSheets(booking);
            if (result.success) {
                console.log('✅ Saved to Google Sheets');
            } else {
                console.log('⚠️ Sheets save failed, using localStorage');
                saveToLocalStorageOnly(booking);
            }
        } catch (error) {
            console.error('❌ Error:', error);
            saveToLocalStorageOnly(booking);
        }
    } else {
        // No Sheets configured - use localStorage
        console.log('📦 Using localStorage only');
        saveToLocalStorageOnly(booking);
    }
}

// ==========================================
// Save to localStorage Only
// ==========================================
function saveToLocalStorageOnly(booking) {
    let patients = [];
    const saved = localStorage.getItem('su_patients');
    if (saved) {
        patients = JSON.parse(saved);
    }
    patients.push(booking);
    localStorage.setItem('su_patients', JSON.stringify(patients));
    console.log('✅ Saved to localStorage');
}

// ========================================
// Generate Booking Code
// ========================================
function generateBookingCode() {
    const year = new Date().getFullYear();
    
    // Get existing bookings count for sequential number
    let bookingNumber = 1;
    
    const saved = localStorage.getItem('su_patients');
    if (saved) {
        const patients = JSON.parse(saved);
        // Count bookings from this year
        const thisYearBookings = patients.filter(p => 
            p.bookingCode && p.bookingCode.startsWith(`SU-${year}`)
        );
        bookingNumber = thisYearBookings.length + 1;
    }
    
    // Format: SU-2026-001
    const code = `SU-${year}-${bookingNumber.toString().padStart(3, '0')}`;
    return code.toUpperCase();
}

// ========================================
// Success Modal
// ========================================
function showSuccessModal(patient) {
    currentBookingCode = patient.bookingCode;
    
    // Populate modal
    document.getElementById('display-booking-code').textContent = patient.bookingCode;
    document.getElementById('display-name').textContent = patient.name;
    document.getElementById('display-date').textContent = formatDateMM(patient.date);
    document.getElementById('display-time').textContent = patient.time;
    
    // Show modal
    document.getElementById('success-modal').classList.add('active');
}

function closeSuccessModal() {
    document.getElementById('success-modal').classList.remove('active');
    currentBookingCode = '';
}

function copyBookingCode() {
    const code = currentBookingCode;
    
    // Copy to clipboard
    navigator.clipboard.writeText(code).then(() => {
        alert('✅ Booking Code ကူးယူပြီးပါပြီ!\n\n' + code);
    }).catch(() => {
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = code;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        alert('✅ Booking Code ကူးယူပြီးပါပြီ!\n\n' + code);
    });
}

// Close modal when clicking outside
document.getElementById('success-modal')?.addEventListener('click', function(e) {
    if (e.target === this) {
        closeSuccessModal();
    }
});

// ========================================
// Check Status Form
// ========================================
function initCheckStatusForm() {
    const form = document.getElementById('check-status-form');
    
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            handleCheckStatus();
        });
    }
}

async function handleCheckStatus() {
    const bookingCode = document.getElementById('booking-code').value.trim().toUpperCase();
    const phone = document.getElementById('verify-phone').value.trim();
    
    if (!bookingCode || !phone) {
        alert('⚠️ Booking Code နှင့် ဖုန်းနံပါတ် ဖြည့်ပါ');
        return;
    }
    
    console.log('🔍 Checking status for:', bookingCode, '/', phone);
    
    // Show loading
    const resultDiv = document.getElementById('status-result');
    resultDiv.innerHTML = `
        <div style="text-align: center; padding: 30px;">
            <div style="font-size: 48px; margin-bottom: 15px;">⏳</div>
            <p>Status စစ်ဆေးနေသည်...</p>
        </div>
    `;
    resultDiv.classList.remove('hidden');
    
    // Normalize phone for comparison
    const phoneDigits = normalizePhone(phone);
    
    // Try to get latest data from Sheets
    let booking = null;
    
    if (typeof readBookingsFromSheets === 'function' && typeof isSheetsConfigured === 'function') {
        if (isSheetsConfigured()) {
            console.log('☁️ Fetching from Google Sheets...');
            try {
                const bookings = await readBookingsFromSheets();
                console.log('📊 Total bookings:', bookings.length);
                
                // Flexible phone matching
                booking = bookings.find(p => {
                    const codeMatch = (p.bookingCode || '').toUpperCase() === bookingCode;
                    
                    // Compare phone numbers (with or without 0)
                    const pPhone = normalizePhone(p.phone || '');
                    const phoneMatch = pPhone === phoneDigits || 
                                      pPhone === '0' + phoneDigits || 
                                      '0' + pPhone === phoneDigits;
                    
                    console.log(`Checking: ${p.bookingCode} / ${p.phone} -> code:${codeMatch} phone:${phoneMatch}`);
                    
                    return codeMatch && phoneMatch;
                });
                
                if (booking) {
                    console.log('✅ Found in Sheets:', booking);
                }
            } catch (error) {
                console.error('❌ Error fetching from Sheets:', error);
            }
        }
    }
    
    // Fallback to localStorage if not found in Sheets
    if (!booking) {
        console.log('📦 Checking localStorage...');
        const saved = localStorage.getItem('su_patients');
        if (saved) {
            const patients = JSON.parse(saved);
            
            booking = patients.find(p => {
                const codeMatch = (p.bookingCode || '').toUpperCase() === bookingCode;
                
                const pPhone = normalizePhone(p.phone || '');
                const phoneMatch = pPhone === phoneDigits || 
                                  pPhone === '0' + phoneDigits || 
                                  '0' + pPhone === phoneDigits;
                
                return codeMatch && phoneMatch;
            });
        }
    }
    
    if (!booking) {
        showNoBookingFound();
        return;
    }
    
    // Show booking details
    showBookingStatus(booking);
}

function showNoBookingFound() {
    const resultDiv = document.getElementById('status-result');
    resultDiv.innerHTML = `
        <div style="text-align: center; padding: 30px;">
            <div style="font-size: 48px; margin-bottom: 15px;">❌</div>
            <h4 style="color: var(--danger-color); margin-bottom: 10px;">
                Booking မတွေ့ပါ
            </h4>
            <p style="color: var(--gray-text);">
                Booking Code နှင့် ဖုန်းနံပါတ် မှန်ကန်ကြောင်း စစ်ဆေးပါ
            </p>
        </div>
    `;
    resultDiv.classList.remove('hidden');
}

function showBookingStatus(booking) {
    const resultDiv = document.getElementById('status-result');
    
    // Get treatment name
    const treatments = {
        'general': 'ယေဘုယျ ကုထုံး',
        'sports': 'အားကစား ထိခိုက်မှု',
        'orthopedic': 'အရိုးအဆစ်',
        'neuro': 'အာရုံကြော',
        'geriatric': 'သက်ကြီးရွယ်အို'
    };
    
    const treatmentName = treatments[booking.treatment] || booking.treatment;
    
    // Get status info
    const statusInfo = getStatusInfo(booking.status);
    
    let html = `
        <div class="status-header">
            <h4>📋 Booking အသေးစိတ်</h4>
            <span class="status-badge-large ${booking.status}">${statusInfo.text}</span>
        </div>
        
        <div class="status-details">
            <div class="detail-row">
                <span class="detail-label">Booking Code:</span>
                <span class="detail-value"><strong>${booking.bookingCode}</strong></span>
            </div>
            <div class="detail-row">
                <span class="detail-label">အမည်:</span>
                <span class="detail-value">${booking.name}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">ဖုန်း:</span>
                <span class="detail-value">${booking.phone}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">လိပ်စာ:</span>
                <span class="detail-value">${booking.address}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">ရက်စွဲ:</span>
                <span class="detail-value">${formatDateMM(booking.date)}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">အချိန်:</span>
                <span class="detail-value">${booking.time}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">ကုသမှု:</span>
                <span class="detail-value">${treatmentName}</span>
            </div>
            ${booking.notes ? `
            <div class="detail-row">
                <span class="detail-label">မှတ်ချက်:</span>
                <span class="detail-value">${booking.notes}</span>
            </div>
            ` : ''}
            ${booking.cancelReason ? `
            <div class="detail-row">
                <span class="detail-label">ပယ်ဖျက်ရခြင်း:</span>
                <span class="detail-value" style="color: var(--danger-color);">${booking.cancelReason}</span>
            </div>
            ` : ''}
        </div>
        
        <div style="padding: 15px; background: ${statusInfo.bgColor}; border-left: 4px solid ${statusInfo.color}; border-radius: 8px; margin-top: 20px;">
            <p style="margin: 0; color: var(--dark-text);">${statusInfo.message}</p>
        </div>
    `;
    
    // Add cancel option for confirmed/pending bookings
    if (booking.status === 'confirmed' || booking.status === 'pending') {
        html += `
            <div class="cancel-section">
                <h5>❌ Booking ပယ်ဖျက်ရန်</h5>
                <textarea id="cancel-reason-text" placeholder="ပယ်ဖျက်ရခြင်း အကြောင်းပြချက် ဖြည့်ပါ..." rows="3"></textarea>
                <button class="btn-cancel" onclick="cancelPublicBooking('${booking.bookingCode}', '${booking.phone}')">
                    ပယ်ဖျက်မည်
                </button>
            </div>
        `;
    }
    
    resultDiv.innerHTML = html;
    resultDiv.classList.remove('hidden');
}

function getStatusInfo(status) {
    const statusMap = {
        'pending': {
            text: '⏳ စောင့်ဆိုင်းဆဲ',
            message: 'သင့် booking ကို လက်ရှိ စီစစ်ဆဲဖြစ်ပါသည်။ Admin မှ မကြာမီ အတည်ပြုပါလိမ့်မည်။',
            color: '#f59e0b',
            bgColor: '#fef3c7'
        },
        'confirmed': {
            text: '✅ အတည်ပြုပြီး',
            message: 'သင့် booking ကို အတည်ပြုပြီးပါပြီ။ သတ်မှတ်ချိန်တွင် အသင့်ရှိပါစေ။',
            color: '#10b981',
            bgColor: '#d1fae5'
        },
        'cancelled': {
            text: '❌ ပယ်ဖျက်ပြီး',
            message: 'ဤ booking ကို ပယ်ဖျက်ပြီးပါပြီ။',
            color: '#ef4444',
            bgColor: '#fee2e2'
        },
        'completed': {
            text: '✔️ ပြီးစီးပြီ',
            message: 'ကုသမှု ပြီးစီးပါပြီ။ ကျေးဇူးတင်ပါသည်။',
            color: '#2563eb',
            bgColor: '#dbeafe'
        }
    };
    
    return statusMap[status] || statusMap['pending'];
}

// ========================================
// Cancel Public Booking
// ========================================
function cancelPublicBooking(bookingCode, phone) {
    const reason = document.getElementById('cancel-reason-text').value.trim();
    
    if (!reason) {
        alert('⚠️ ပယ်ဖျက်ရခြင်း အကြောင်းပြချက် ဖြည့်ပါ');
        return;
    }
    
    const confirmed = confirm('🚫 Booking ပယ်ဖျက်မှာ သေချာပါသလား?\n\nဒီလုပ်ဆောင်ချက်ကို နောက်ပြန်ပြောင်း၍မရပါ။');
    
    if (!confirmed) return;
    
    // Get patients
    const saved = localStorage.getItem('su_patients');
    if (!saved) return;
    
    let patients = JSON.parse(saved);
    
    // Find and update booking
    const bookingIndex = patients.findIndex(p => 
        p.bookingCode === bookingCode && p.phone === phone
    );
    
    if (bookingIndex === -1) {
        alert('❌ Booking ရှာမတွေ့ပါ');
        return;
    }
    
    // Update booking
    patients[bookingIndex].status = 'cancelled';
    patients[bookingIndex].cancelReason = reason;
    patients[bookingIndex].cancelledAt = new Date().toISOString();
    
    // Save
    localStorage.setItem('su_patients', JSON.stringify(patients));
    
    // Send notification
    sendCancellationNotification(patients[bookingIndex]);
    
    alert('✅ Booking ပယ်ဖျက်ပြီးပါပြီ');
    
    // Refresh display
    showBookingStatus(patients[bookingIndex]);
}

// ========================================
// Telegram Notifications (for public bookings)
// ========================================
async function sendPublicBookingNotification(patient) {
    const botToken = localStorage.getItem('telegram_bot_token');
    const chatId = localStorage.getItem('telegram_chat_id');
    
    if (!botToken || !chatId) {
        console.log('⚠️ Telegram not configured');
        return;
    }
    
    const treatments = {
        'general': 'ယေဘုယျ ကုထုံး',
        'sports': 'အားကစား ထိခိုက်မှု',
        'orthopedic': 'အရိုးအဆစ်',
        'neuro': 'အာရုံကြော',
        'geriatric': 'သက်ကြီးရွယ်အို'
    };
    
    const treatmentName = treatments[patient.treatment] || patient.treatment;
    
    const message = `
🌐 <b>Public Booking (Website)</b>

📋 <b>Booking Code:</b> ${patient.bookingCode}

👤 <b>အမည်:</b> ${patient.name}
📞 <b>ဖုန်း:</b> ${patient.phone}
📍 <b>လိပ်စာ:</b> ${patient.address}

📅 <b>ရက်စွဲ:</b> ${formatDateMM(patient.date)}
🕐 <b>အချိန်:</b> ${patient.time}
💊 <b>ကုသမှု:</b> ${treatmentName}

📝 <b>မှတ်ချက်:</b> ${patient.notes || 'မရှိ'}

⏳ <b>အခြေအနေ:</b> စောင့်ဆိုင်းဆဲ

🔔 ကျေးဇူးပြု၍ အတည်ပြုပေးပါ။
    `.trim();
    
    try {
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: message,
                parse_mode: 'HTML'
            })
        });
        console.log('✅ Telegram notification sent');
    } catch (error) {
        console.error('❌ Telegram error:', error);
    }
}

async function sendCancellationNotification(patient) {
    const botToken = localStorage.getItem('telegram_bot_token');
    const chatId = localStorage.getItem('telegram_chat_id');
    
    if (!botToken || !chatId) return;
    
    const message = `
❌ <b>Booking ပယ်ဖျက်ခြင်း (Public)</b>

📋 <b>Booking Code:</b> ${patient.bookingCode}
👤 <b>လူနာ:</b> ${patient.name}
📞 <b>ဖုန်း:</b> ${patient.phone}
📅 <b>ရက်စွဲ:</b> ${formatDateMM(patient.date)} | ${patient.time}

🚫 <b>အကြောင်းပြချက်:</b>
${patient.cancelReason}

⏰ <b>ပယ်ဖျက်ချိန်:</b> ${new Date().toLocaleString('my-MM')}
    `.trim();
    
    try {
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: message,
                parse_mode: 'HTML'
            })
        });
    } catch (error) {
        console.error('❌ Telegram error:', error);
    }
}

// ========================================
// Helper Functions
// ========================================
function formatDateMM(dateString) {
    const months = [
        'ဇန်နဝါရီ', 'ဖေဖော်ဝါရီ', 'မတ်', 'ဧပြီ', 'မေ', 'ဇွန်',
        'ဇူလိုင်', 'သြဂုတ်', 'စက်တင်ဘာ', 'အောက်တိုဘာ', 'နိုဝင်ဘာ', 'ဒီဇင်ဘာ'
    ];
    
    const date = new Date(dateString);
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    
    return `${day} ${month} ${year}`;
}

// ========================================
// Show Welcome Back Message
// ========================================
function showWelcomeBack(booking) {
    console.log('👋 Showing welcome back message for:', booking.name);
    
    const checkStatusSection = document.getElementById('check-status');
    
    if (!checkStatusSection) {
        console.error('❌ check-status section not found');
        return;
    }
    
    // Remove existing welcome message if any
    const existingWelcome = checkStatusSection.querySelector('.welcome-back-message');
    if (existingWelcome) {
        existingWelcome.remove();
    }
    
    // Create welcome message
    const welcomeMsg = document.createElement('div');
    welcomeMsg.className = 'welcome-back-message';
    welcomeMsg.innerHTML = `
        <div style="background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 20px; border-radius: 12px; margin-bottom: 25px; text-align: center; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);">
            <h3 style="margin: 0 0 10px 0; font-size: 22px;">👋 မင်္ဂလာပါ, ${booking.name}!</h3>
            <p style="margin: 0 0 15px 0; opacity: 0.95; font-size: 15px;">သင့် Booking အား အလိုအလျောက် ရှာတွေ့ပါသည်</p>
            <button onclick="checkDifferentBooking()" style="background: white; color: #059669; border: none; padding: 10px 20px; border-radius: 20px; cursor: pointer; font-weight: 500; font-size: 14px;">
                🔍 အခြား Booking ကြည့်မည်
            </button>
        </div>
    `;
    
    // Insert at the beginning of check-status section
    checkStatusSection.insertBefore(welcomeMsg, checkStatusSection.firstChild);
    
    // Hide the status check form
    const statusForm = document.getElementById('check-status-form');
    if (statusForm) {
        statusForm.style.display = 'none';
    }
    
    console.log('✅ Welcome message displayed');
}

// ========================================
// Check Different Booking
// ========================================
function checkDifferentBooking() {
    const statusForm = document.getElementById('check-status-form');
    const welcomeMsg = document.querySelector('.welcome-back-message');
    const statusResult = document.getElementById('status-result');
    
    if (welcomeMsg) welcomeMsg.remove();
    if (statusForm) statusForm.style.display = 'block';
    if (statusResult) statusResult.classList.add('hidden');
    
    // Clear form
    document.getElementById('booking-code').value = '';
    document.getElementById('verify-phone').value = '';
}

// ========================================
// Clear Session Storage
// ========================================
function clearSavedBooking() {
    sessionStorage.removeItem('su_booking_code');
    sessionStorage.removeItem('su_booking_phone');
    console.log('🗑️ Cleared saved booking from session');
}

// ========================================
// Export
// ========================================
console.log('✅ Public Booking JS loaded');
