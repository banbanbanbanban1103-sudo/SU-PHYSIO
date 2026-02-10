// ==========================================
// SU Physiotherapy - Google Sheets API
// FULL OPTIMIZED VERSION (CORS & CACHE FIXED)
// ==========================================

// 1. Configuration Check
function isSheetsConfigured() {
    return typeof GOOGLE_SHEETS_CONFIG !== 'undefined' && 
           GOOGLE_SHEETS_CONFIG.WEB_APP_URL && 
           GOOGLE_SHEETS_CONFIG.WEB_APP_URL !== '';
}

// ==========================================
// Create Booking in Sheets (Enhanced Date Handling)
// ==========================================
async function createBookingInSheets(booking) {
    if (!isSheetsConfigured()) {
        if (GOOGLE_SHEETS_CONFIG.DEBUG_MODE) console.log('⚠️ Sheets not configured');
        backupToLocalStorage(booking);
        return { success: false, message: 'Using localStorage only' };
    }
    
    console.log('📤 Sending booking to Google Sheets...');
    
    try {
        // Admin dashboard မှာ Date/Time မြင်ရတာ မှန်အောင် ပို့ပေးခြင်း
        const response = await fetch(GOOGLE_SHEETS_CONFIG.WEB_APP_URL, {
            method: 'POST',
            mode: 'no-cors', // Google Script အတွက် မရှိမဖြစ်လိုအပ်
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'create',
                booking: booking
            })
        });
        
        // no-cors mode ကြောင့် response.ok ကို စစ်မရသော်လည်း အောင်မြင်သည်ဟု ယူဆပြီး backup လုပ်သည်
        if (GOOGLE_SHEETS_CONFIG.USE_LOCAL_BACKUP) {
            backupToLocalStorage(booking);
        }
        
        console.log('✅ Booking sent to Google Sheets');
        return { success: true, message: 'Booking saved' };
        
    } catch (error) {
        console.error('❌ Error saving to Sheets:', error);
        backupToLocalStorage(booking);
        return { success: false, message: error.message };
    }
}

// ==========================================
// Read All Bookings (Admin Confirm သိအောင် Fix လုပ်ထားသည်)
// ==========================================
async function readBookingsFromSheets() {
    if (!isSheetsConfigured()) return loadFromLocalStorage();
    
    console.log('📥 Loading fresh data from Google Sheets...');
    
    try {
        // ✅ URL မှာ t=... ထည့်ခြင်းဖြင့် browser က data အဟောင်း (cache) ကိုမပြဘဲ Sheet ထဲက data အသစ်ကို အမြဲဆွဲပါသည်
        const url = GOOGLE_SHEETS_CONFIG.WEB_APP_URL + '?action=read&t=' + Date.now();
        
        const response = await fetch(url, {
            method: 'GET',
            redirect: 'follow'
        });
        
        if (!response.ok) throw new Error('HTTP Error ' + response.status);
        
        const text = await response.text();
        const result = JSON.parse(text);
        
        if (result.success) {
            console.log('✅ Loaded', result.data.length, 'bookings');
            // Sheet ထဲက data အသစ်ရတာနဲ့ LocalStorage ကိုပါ update လုပ်ပေးမည်
            if (GOOGLE_SHEETS_CONFIG.USE_LOCAL_BACKUP) {
                localStorage.setItem('su_patients', JSON.stringify(result.data));
            }
            return result.data;
        } else {
            console.error('❌ Sheet Error:', result.message);
            return loadFromLocalStorage();
        }
        
    } catch (error) {
        console.error('❌ Fetch Error:', error);
        return loadFromLocalStorage();
    }
}

// ==========================================
// Update Booking in Sheets (For Admin Dashboard)
// ==========================================
async function updateBookingInSheets(bookingId, updates) {
    if (!isSheetsConfigured()) return updateInLocalStorage(bookingId, updates);
    
    console.log('📤 Updating status in Google Sheets...');
    
    try {
        await fetch(GOOGLE_SHEETS_CONFIG.WEB_APP_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'update',
                id: bookingId,
                updates: updates
            })
        });
        
        // LocalStorage ကိုပါ တပြိုင်တည်း update လုပ်သည်
        updateInLocalStorage(bookingId, updates);
        return { success: true };
    } catch (error) {
        console.error('❌ Update Error:', error);
        return updateInLocalStorage(bookingId, updates);
    }
}

// ==========================================
// Delete Booking from Sheets
// ==========================================
async function deleteBookingFromSheets(bookingId) {
    if (!isSheetsConfigured()) return deleteFromLocalStorage(bookingId);
    
    try {
        await fetch(GOOGLE_SHEETS_CONFIG.WEB_APP_URL, {
            method: 'POST',
            mode: 'no-cors',
            body: JSON.stringify({ action: 'delete', id: bookingId })
        });
        deleteFromLocalStorage(bookingId);
        return { success: true };
    } catch (error) {
        return deleteFromLocalStorage(bookingId);
    }
}

// ==========================================
// LocalStorage Backup Functions (မူလ Logic များ)
// ==========================================

function backupToLocalStorage(booking) {
    try {
        let patients = loadFromLocalStorage();
        const index = patients.findIndex(p => p.id === booking.id);
        if (index >= 0) {
            patients[index] = booking;
        } else {
            patients.push(booking);
        }
        localStorage.setItem('su_patients', JSON.stringify(patients));
        console.log('💾 Data backed up to local storage');
    } catch (e) { console.error('LocalStorage Error', e); }
}

function loadFromLocalStorage() {
    const saved = localStorage.getItem('su_patients');
    return saved ? JSON.parse(saved) : [];
}

function updateInLocalStorage(bookingId, updates) {
    let patients = loadFromLocalStorage();
    const index = patients.findIndex(p => p.id == bookingId);
    if (index >= 0) {
        patients[index] = { ...patients[index], ...updates };
        localStorage.setItem('su_patients', JSON.stringify(patients));
        return { success: true };
    }
    return { success: false };
}

function deleteFromLocalStorage(bookingId) {
    let patients = loadFromLocalStorage();
    patients = patients.filter(p => p.id != bookingId);
    localStorage.setItem('su_patients', JSON.stringify(patients));
    return { success: true };
}

// ==========================================
// Customer Management (Find/Create)
// ==========================================

async function findCustomerByPhone(phone) {
    // Read bookings ထဲကနေ phone နဲ့ တိုက်စစ်ခြင်း
    const bookings = await readBookingsFromSheets();
    const customer = bookings.find(p => p.phone === phone);
    if (customer) return customer;
    
    return findCustomerInLocalStorage(phone);
}

function findCustomerInLocalStorage(phone) {
    const saved = localStorage.getItem('su_customers');
    if (saved) {
        const customers = JSON.parse(saved);
        return customers.find(c => c.phone === phone) || null;
    }
    return null;
}

// ==========================================
// Export Initialization
// ==========================================
console.log('✅ Sheets API (Cache Optimized) Loaded');
