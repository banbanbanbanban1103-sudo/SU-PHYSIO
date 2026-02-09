// ==========================================
// SU Physiotherapy - Google Sheets API
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
        const response = await fetch(GOOGLE_SHEETS_CONFIG.WEB_APP_URL, {
            method: 'POST',
            mode: 'no-cors',  // Important for Apps Script
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'create',
                booking: booking
            })
        });
        
        console.log('✅ Booking sent to Google Sheets');
        
        // Backup to localStorage
        if (GOOGLE_SHEETS_CONFIG.USE_LOCAL_BACKUP) {
            backupToLocalStorage(booking);
        }
        
        return { success: true, message: 'Booking saved to Sheets' };
        
    } catch (error) {
        console.error('❌ Error saving to Sheets:', error);
        
        // Fallback to localStorage
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
        if (GOOGLE_SHEETS_CONFIG.DEBUG_MODE) {
            console.log('⚠️ Google Sheets not configured, loading from localStorage');
        }
        return loadFromLocalStorage();
    }
    
    console.log('📥 Loading bookings from Google Sheets...');
    
    try {
        const response = await fetch(GOOGLE_SHEETS_CONFIG.WEB_APP_URL + '?action=read', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            console.log('✅ Loaded', result.data.length, 'bookings from Sheets');
            
            // Backup to localStorage
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
        console.log('📦 Falling back to localStorage');
        return loadFromLocalStorage();
    }
}

// ==========================================
// Update Booking in Sheets
// ==========================================
async function updateBookingInSheets(bookingId, updates) {
    if (!isSheetsConfigured()) {
        if (GOOGLE_SHEETS_CONFIG.DEBUG_MODE) {
            console.log('⚠️ Google Sheets not configured, updating localStorage only');
        }
        return updateInLocalStorage(bookingId, updates);
    }
    
    console.log('📤 Updating booking in Google Sheets...');
    
    try {
        const response = await fetch(GOOGLE_SHEETS_CONFIG.WEB_APP_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'update',
                id: bookingId,
                updates: updates
            })
        });
        
        console.log('✅ Booking updated in Google Sheets');
        
        // Update localStorage backup
        if (GOOGLE_SHEETS_CONFIG.USE_LOCAL_BACKUP) {
            updateInLocalStorage(bookingId, updates);
        }
        
        return { success: true };
        
    } catch (error) {
        console.error('❌ Error updating in Sheets:', error);
        
        // Fallback to localStorage
        if (GOOGLE_SHEETS_CONFIG.USE_LOCAL_BACKUP) {
            return updateInLocalStorage(bookingId, updates);
        }
        
        return { success: false };
    }
}

// ==========================================
// Delete Booking from Sheets
// ==========================================
async function deleteBookingFromSheets(bookingId) {
    if (!isSheetsConfigured()) {
        if (GOOGLE_SHEETS_CONFIG.DEBUG_MODE) {
            console.log('⚠️ Google Sheets not configured, deleting from localStorage only');
        }
        return deleteFromLocalStorage(bookingId);
    }
    
    console.log('📤 Deleting booking from Google Sheets...');
    
    try {
        const response = await fetch(GOOGLE_SHEETS_CONFIG.WEB_APP_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'delete',
                id: bookingId
            })
        });
        
        console.log('✅ Booking deleted from Google Sheets');
        
        // Delete from localStorage backup
        if (GOOGLE_SHEETS_CONFIG.USE_LOCAL_BACKUP) {
            deleteFromLocalStorage(bookingId);
        }
        
        return { success: true };
        
    } catch (error) {
        console.error('❌ Error deleting from Sheets:', error);
        
        // Fallback to localStorage
        if (GOOGLE_SHEETS_CONFIG.USE_LOCAL_BACKUP) {
            return deleteFromLocalStorage(bookingId);
        }
        
        return { success: false };
    }
}

// ==========================================
// LocalStorage Backup Functions
// ==========================================

function backupToLocalStorage(booking) {
    try {
        let patients = [];
        const saved = localStorage.getItem('su_patients');
        if (saved) {
            patients = JSON.parse(saved);
        }
        
        // Check if booking already exists
        const existingIndex = patients.findIndex(p => p.id === booking.id);
        if (existingIndex >= 0) {
            patients[existingIndex] = booking;
        } else {
            patients.push(booking);
        }
        
        localStorage.setItem('su_patients', JSON.stringify(patients));
        console.log('💾 Backed up to localStorage');
        
    } catch (error) {
        console.error('❌ Error backing up to localStorage:', error);
    }
}

function loadFromLocalStorage() {
    try {
        const saved = localStorage.getItem('su_patients');
        if (saved) {
            const patients = JSON.parse(saved);
            console.log('📦 Loaded from localStorage:', patients.length);
            return patients;
        }
        console.log('📦 No data in localStorage');
        return [];
    } catch (error) {
        console.error('❌ Error loading from localStorage:', error);
        return [];
    }
}

function updateInLocalStorage(bookingId, updates) {
    try {
        const saved = localStorage.getItem('su_patients');
        if (saved) {
            let patients = JSON.parse(saved);
            const index = patients.findIndex(p => p.id == bookingId);
            
            if (index >= 0) {
                patients[index] = { ...patients[index], ...updates };
                localStorage.setItem('su_patients', JSON.stringify(patients));
                console.log('💾 Updated in localStorage');
                return { success: true };
            }
        }
        return { success: false };
    } catch (error) {
        console.error('❌ Error updating localStorage:', error);
        return { success: false };
    }
}

function deleteFromLocalStorage(bookingId) {
    try {
        const saved = localStorage.getItem('su_patients');
        if (saved) {
            let patients = JSON.parse(saved);
            patients = patients.filter(p => p.id != bookingId);
            localStorage.setItem('su_patients', JSON.stringify(patients));
            console.log('💾 Deleted from localStorage');
            return { success: true };
        }
        return { success: false };
    } catch (error) {
        console.error('❌ Error deleting from localStorage:', error);
        return { success: false };
    }
}

// ==========================================
// Sync Functions
// ==========================================

async function syncLocalToSheets() {
    if (!isSheetsConfigured()) {
        console.log('⚠️ Cannot sync - Sheets not configured');
        return false;
    }
    
    console.log('🔄 Syncing localStorage to Google Sheets...');
    
    const localPatients = loadFromLocalStorage();
    
    if (localPatients.length === 0) {
        console.log('📦 No local data to sync');
        return true;
    }
    
    let synced = 0;
    for (const patient of localPatients) {
        const result = await createBookingInSheets(patient);
        if (result.success) {
            synced++;
        }
    }
    
    console.log(`✅ Synced ${synced}/${localPatients.length} bookings`);
    return true;
}

// ==========================================
// Export
// ==========================================
console.log('✅ Sheets API loaded');

// ==========================================
// Customer API Functions
// ==========================================

// Find Customer by Phone
async function findCustomerByPhone(phone) {
    if (!isSheetsConfigured()) {
        console.log('⚠️ Sheets not configured, checking localStorage');
        return findCustomerInLocalStorage(phone);
    }
    
    console.log('📞 Looking up customer:', phone);
    
    try {
        const response = await fetch(GOOGLE_SHEETS_CONFIG.WEB_APP_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'findCustomer',
                phone: phone
            })
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

// Create New Customer
async function createCustomerInSheets(customer) {
    if (!isSheetsConfigured()) {
        console.log('⚠️ Sheets not configured, saving to localStorage');
        return saveCustomerToLocalStorage(customer);
    }
    
    console.log('📤 Creating customer in Sheets...');
    
    try {
        const response = await fetch(GOOGLE_SHEETS_CONFIG.WEB_APP_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'createCustomer',
                customer: customer
            })
        });
        
        console.log('✅ Customer created in Sheets');
        
        // Backup to localStorage
        if (GOOGLE_SHEETS_CONFIG.USE_LOCAL_BACKUP) {
            saveCustomerToLocalStorage(customer);
        }
        
        return { success: true, message: 'Customer created' };
        
    } catch (error) {
        console.error('❌ Error creating customer:', error);
        return saveCustomerToLocalStorage(customer);
    }
}

// LocalStorage Customer Functions
function findCustomerInLocalStorage(phone) {
    try {
        const saved = localStorage.getItem('su_customers');
        if (saved) {
            const customers = JSON.parse(saved);
            const customer = customers.find(c => c.phone === phone);
            if (customer) {
                console.log('📦 Found customer in localStorage');
                return customer;
            }
        }
        return null;
    } catch (error) {
        console.error('❌ Error finding customer in localStorage:', error);
        return null;
    }
}

function saveCustomerToLocalStorage(customer) {
    try {
        let customers = [];
        const saved = localStorage.getItem('su_customers');
        if (saved) {
            customers = JSON.parse(saved);
        }
        
        // Check if exists
        const existing = customers.find(c => c.phone === customer.phone);
        if (!existing) {
            customer.id = Date.now();
            customers.push(customer);
            localStorage.setItem('su_customers', JSON.stringify(customers));
            console.log('💾 Customer saved to localStorage');
        }
        
        return { success: true, data: customer };
    } catch (error) {
        console.error('❌ Error saving customer:', error);
        return { success: false };
    }
}
