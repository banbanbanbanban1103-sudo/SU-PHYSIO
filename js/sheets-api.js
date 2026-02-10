// ==========================================
// SU Physiotherapy - Google Sheets API
// FULL FIXED VERSION (CORS, Cache & Missing Functions Fixed)
// ==========================================

// 1. Configuration Check
function isSheetsConfigured() {
    return typeof GOOGLE_SHEETS_CONFIG !== 'undefined' && 
           GOOGLE_SHEETS_CONFIG.WEB_APP_URL && 
           GOOGLE_SHEETS_CONFIG.WEB_APP_URL !== '';
}

// ==========================================
// Read All Bookings (Admin Confirm သိအောင် Fix လုပ်ထားသည်)
// ==========================================
async function readBookingsFromSheets() {
    if (!isSheetsConfigured()) {
        console.log('⚠️ Sheets not configured, loading from localStorage');
        return loadFromLocalStorage();
    }
    
    try {
        // ✅ URL မှာ Date.now() ထည့်ခြင်းဖြင့် Admin ဘက်က Status ပြောင်းတာကို Public က ချက်ချင်းသိနိုင်မည်
        const url = GOOGLE_SHEETS_CONFIG.WEB_APP_URL + '?action=read&t=' + Date.now();
        
        console.log('📥 Loading fresh data from Google Sheets...');
        const response = await fetch(url, {
            method: 'GET',
            redirect: 'follow'
        });
        
        if (!response.ok) throw new Error('HTTP Error ' + response.status);
        
        const text = await response.text();
        const result = JSON.parse(text);
        
        if (result.success) {
            console.log('✅ Loaded', result.data.length, 'bookings from Sheets');
            if (GOOGLE_SHEETS_CONFIG.USE_LOCAL_BACKUP) {
                localStorage.setItem('su_patients', JSON.stringify(result.data));
            }
            return result.data;
        } else {
            return loadFromLocalStorage();
        }
    } catch (error) {
        console.error('❌ Error loading from Sheets:', error);
        return loadFromLocalStorage();
    }
}

// ==========================================
// Create Booking in Sheets
// ==========================================
async function createBookingInSheets(booking) {
    if (!isSheetsConfigured()) {
        backupToLocalStorage(booking);
        return { success: false, message: 'Sheets not configured' };
    }
    
    console.log('📤 Sending booking to Google Sheets...');
    
    try {
        await fetch(GOOGLE_SHEETS_CONFIG.WEB_APP_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'create',
                booking: booking
            })
        });
        
        if (GOOGLE_SHEETS_CONFIG.USE_LOCAL_BACKUP) {
            backupToLocalStorage(booking);
        }
        
        return { success: true, message: 'Booking process initiated' };
    } catch (error) {
        console.error('❌ Error saving to Sheets:', error);
        backupToLocalStorage(booking);
        return { success: false, message: error.message };
    }
}

// ==========================================
// Customer API Functions (Missing Functions Added)
// ==========================================

async function findCustomerByPhone(phone) {
    // Fresh data ကိုအရင်ဆွဲပြီး phone နဲ့ရှာမယ်
    const bookings = await readBookingsFromSheets();
    const customer = bookings.find(p => p.phone === phone);
    if (customer) return customer;
    
    return findCustomerInLocalStorage(phone);
}

async function createCustomerInSheets(customer) {
    if (!isSheetsConfigured()) {
        return saveCustomerToLocalStorage(customer);
    }

    console.log('📤 Creating customer in Sheets...');
    try {
        await fetch(GOOGLE_SHEETS_CONFIG.WEB_APP_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'createCustomer',
                customer: customer
            })
        });

        if (GOOGLE_SHEETS_CONFIG.USE_LOCAL_BACKUP) {
            saveCustomerToLocalStorage(customer);
        }
        return { success: true, message: 'Customer created' };
    } catch (error) {
        console.error('❌ Error creating customer:', error);
        return saveCustomerToLocalStorage(customer);
    }
}

// ==========================================
// Update/Delete Functions
// ==========================================
async function updateBookingInSheets(bookingId, updates) {
    if (!isSheetsConfigured()) return updateInLocalStorage(bookingId, updates);
    
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
        updateInLocalStorage(bookingId, updates);
        return { success: true };
    } catch (error) {
        return updateInLocalStorage(bookingId, updates);
    }
}

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
// LocalStorage Helpers
// ==========================================
function backupToLocalStorage(booking) {
    let patients = loadFromLocalStorage();
    const index = patients.findIndex(p => p.id === booking.id);
    if (index >= 0) {
        patients[index] = booking;
    } else {
        patients.push(booking);
    }
    localStorage.setItem('su_patients', JSON.stringify(patients));
}

function loadFromLocalStorage() {
    try {
        const saved = localStorage.getItem('su_patients');
        return saved ? JSON.parse(saved) : [];
    } catch (e) { return []; }
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

function findCustomerInLocalStorage(phone) {
    const saved = localStorage.getItem('su_customers');
    if (saved) {
        const customers = JSON.parse(saved);
        return customers.find(c => c.phone === phone) || null;
    }
    return null;
}

function saveCustomerToLocalStorage(customer) {
    try {
        let customers = [];
        const saved = localStorage.getItem('su_customers');
        if (saved) customers = JSON.parse(saved);
        
        const existing = customers.find(c => c.phone === customer.phone);
        if (!existing) {
            if (!customer.id) customer.id = Date.now();
            customers.push(customer);
            localStorage.setItem('su_customers', JSON.stringify(customers));
        }
        return { success: true, data: customer };
    } catch (e) { return { success: false }; }
}

// ==========================================
// Sync Functions
// ==========================================
async function syncLocalToSheets() {
    if (!isSheetsConfigured()) return false;
    const localPatients = loadFromLocalStorage();
    if (localPatients.length === 0) return true;
    
    for (const patient of localPatients) {
        await createBookingInSheets(patient);
    }
    return true;
}

console.log('✅ Sheets API (Cache Optimized & Full) Loaded');
