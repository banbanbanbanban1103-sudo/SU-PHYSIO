// ==========================================
// SU Physiotherapy - Google Sheets API (Fixed CORS)
// ==========================================

// ==========================================
// Create Booking in Sheets
// ==========================================
async function createBookingInSheets(booking) {
    if (!isSheetsConfigured()) {
        if (GOOGLE_SHEETS_CONFIG.DEBUG_MODE) {
            console.log('⚠️ Google Sheets not configured, using localStorage only');
        }
        return { success: false, message: 'Sheets not configured' };
    }
    
    console.log('📤 Sending booking to Google Sheets...');
    
    try {
        // CORS ပြဿနာမတက်စေရန် header များကို ရိုးရှင်းအောင် ထားရပါမည်
        const response = await fetch(GOOGLE_SHEETS_CONFIG.WEB_APP_URL, {
            method: 'POST',
            mode: 'cors', 
            body: JSON.stringify({
                action: 'create',
                booking: booking
            })
        });
        
        console.log('✅ Booking sent to Google Sheets');
        
        if (GOOGLE_SHEETS_CONFIG.USE_LOCAL_BACKUP) {
            backupToLocalStorage(booking);
        }
        
        return { success: true, message: 'Booking saved to Sheets' };
        
    } catch (error) {
        console.error('❌ Error saving to Sheets:', error);
        if (GOOGLE_SHEETS_CONFIG.USE_LOCAL_BACKUP) {
            backupToLocalStorage(booking);
        }
        return { success: false, message: error.message };
    }
}

// ==========================================
// Read All Bookings from Sheets
// ==========================================
async function readBookingsFromSheets() {
    if (!isSheetsConfigured()) {
        return loadFromLocalStorage();
    }
    
    console.log('📥 Loading bookings from Google Sheets...');
    
    try {
        // GET request တွင် header မပါဘဲ တိုက်ရိုက်ခေါ်ခြင်းက ပိုစိတ်ချရသည်
        const response = await fetch(`${GOOGLE_SHEETS_CONFIG.WEB_APP_URL}?action=read`, {
            method: 'GET',
            mode: 'cors',
            redirect: 'follow'
        });
        
        const result = await response.json();
        
        if (result.success) {
            console.log('✅ Loaded', result.data.length, 'bookings from Sheets');
            if (GOOGLE_SHEETS_CONFIG.USE_LOCAL_BACKUP && result.data.length > 0) {
                localStorage.setItem('su_patients', JSON.stringify(result.data));
            }
            return result.data;
        } else {
            console.error('❌ Failed to load from Sheets:', result.message);
            return loadFromLocalStorage();
        }
        
    } catch (error) {
        console.error('❌ Error loading from Sheets:', error);
        return loadFromLocalStorage();
    }
}

// ==========================================
// Update Booking in Sheets
// ==========================================
async function updateBookingInSheets(bookingId, updates) {
    if (!isSheetsConfigured()) {
        return updateInLocalStorage(bookingId, updates);
    }
    
    console.log('📤 Updating booking in Google Sheets...');
    
    try {
        const response = await fetch(GOOGLE_SHEETS_CONFIG.WEB_APP_URL, {
            method: 'POST',
            mode: 'cors',
            body: JSON.stringify({
                action: 'update',
                id: bookingId,
                updates: updates
            })
        });
        
        console.log('✅ Booking updated in Google Sheets');
        
        if (GOOGLE_SHEETS_CONFIG.USE_LOCAL_BACKUP) {
            updateInLocalStorage(bookingId, updates);
        }
        
        return { success: true };
        
    } catch (error) {
        console.error('❌ Error updating in Sheets:', error);
        return GOOGLE_SHEETS_CONFIG.USE_LOCAL_BACKUP ? updateInLocalStorage(bookingId, updates) : { success: false };
    }
}

// ==========================================
// Delete Booking from Sheets
// ==========================================
async function deleteBookingFromSheets(bookingId) {
    if (!isSheetsConfigured()) {
        return deleteFromLocalStorage(bookingId);
    }
    
    console.log('📤 Deleting booking from Google Sheets...');
    
    try {
        const response = await fetch(GOOGLE_SHEETS_CONFIG.WEB_APP_URL, {
            method: 'POST',
            mode: 'cors',
            body: JSON.stringify({
                action: 'delete',
                id: bookingId
            })
        });
        
        console.log('✅ Booking deleted from Google Sheets');
        
        if (GOOGLE_SHEETS_CONFIG.USE_LOCAL_BACKUP) {
            deleteFromLocalStorage(bookingId);
        }
        
        return { success: true };
        
    } catch (error) {
        console.error('❌ Error deleting from Sheets:', error);
        return GOOGLE_SHEETS_CONFIG.USE_LOCAL_BACKUP ? deleteFromLocalStorage(bookingId) : { success: false };
    }
}

// ==========================================
// Customer API Functions
// ==========================================

async function findCustomerByPhone(phone) {
    if (!isSheetsConfigured()) {
        return findCustomerInLocalStorage(phone);
    }
    
    console.log('📞 Looking up customer:', phone);
    
    try {
        // Customer lookup ကို GET ဖြင့်ပြောင်းသုံးခြင်းက ပိုမြန်ဆန်ပြီး CORS error ကင်းစေသည်
        const response = await fetch(`${GOOGLE_SHEETS_CONFIG.WEB_APP_URL}?action=findCustomer&phone=${phone}`, {
            method: 'GET',
            mode: 'cors',
            redirect: 'follow'
        });
        
        const result = await response.json();
        
        if (result.success) {
            console.log('✅ Customer found:', result.data);
            return result.data;
        } else {
            console.log('❌ Customer not found');
            return null;
        }
        
    } catch (error) {
        console.error('❌ Error finding customer:', error);
        return findCustomerInLocalStorage(phone);
    }
}

async function createCustomerInSheets(customer) {
    if (!isSheetsConfigured()) {
        return saveCustomerToLocalStorage(customer);
    }
    
    console.log('📤 Creating customer in Sheets...');
    
    try {
        const response = await fetch(GOOGLE_SHEETS_CONFIG.WEB_APP_URL, {
            method: 'POST',
            mode: 'cors',
            body: JSON.stringify({
                action: 'createCustomer',
                customer: customer
            })
        });
        
        console.log('✅ Customer created in Sheets');
        
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
// LocalStorage Backup Functions (Keep as is)
// ==========================================

function backupToLocalStorage(booking) {
    try {
        let patients = [];
        const saved = localStorage.getItem('su_patients');
        if (saved) patients = JSON.parse(saved);
        const existingIndex = patients.findIndex(p => p.id === booking.id);
        if (existingIndex >= 0) { patients[existingIndex] = booking; } else { patients.push(booking); }
        localStorage.setItem('su_patients', JSON.stringify(patients));
    } catch (e) { console.error(e); }
}

function loadFromLocalStorage() {
    try {
        const saved = localStorage.getItem('su_patients');
        return saved ? JSON.parse(saved) : [];
    } catch (e) { return []; }
}

function updateInLocalStorage(bookingId, updates) {
    try {
        let patients = loadFromLocalStorage();
        const index = patients.findIndex(p => p.id == bookingId);
        if (index >= 0) {
            patients[index] = { ...patients[index], ...updates };
            localStorage.setItem('su_patients', JSON.stringify(patients));
            return { success: true };
        }
    } catch (e) { return { success: false }; }
}

function deleteFromLocalStorage(bookingId) {
    try {
        let patients = loadFromLocalStorage();
        patients = patients.filter(p => p.id != bookingId);
        localStorage.setItem('su_patients', JSON.stringify(patients));
        return { success: true };
    } catch (e) { return { success: false }; }
}

function findCustomerInLocalStorage(phone) {
    try {
        const saved = localStorage.getItem('su_customers');
        if (saved) {
            const customers = JSON.parse(saved);
            return customers.find(c => c.phone === phone) || null;
        }
        return null;
    } catch (e) { return null; }
}

function saveCustomerToLocalStorage(customer) {
    try {
        let customers = [];
        const saved = localStorage.getItem('su_customers');
        if (saved) customers = JSON.parse(saved);
        if (!customers.find(c => c.phone === customer.phone)) {
            customer.id = Date.now();
            customers.push(customer);
            localStorage.setItem('su_customers', JSON.stringify(customers));
        }
        return { success: true, data: customer };
    } catch (e) { return { success: false }; }
}

console.log('✅ Sheets API (Fixed) loaded');
