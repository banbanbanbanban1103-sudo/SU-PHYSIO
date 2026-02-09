// ==========================================
// SU Physiotherapy - Configuration
// ==========================================

// Google Sheets Configuration
const GOOGLE_SHEETS_CONFIG = {
    // ⚠️ IMPORTANT: ဒီ 2 ခု ကို သင့်ရဲ့ values တွေ နဲ့ အစားထိုး!
    
    // Web App URL from Apps Script deployment
    // Format: https://script.google.com/macros/s/AKfycby.../exec
    WEB_APP_URL: 'https://script.google.com/macros/s/AKfycbxV9RzWhsGNm000f9wY_8tfnt7q1vOJBNiBOz6doxPKCi1RTOGs73p-TLgEkmJ-vywypA/exec',
    
    // Google Sheet ID from the URL
    // Format: 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms
    SHEET_ID: '1JaeyuyiAniAnneNpeyIFXpp9nLUFihjD6UZWAotIhMs',
    
    // Enable/disable features
    USE_SHEETS: true,           // true = Use Google Sheets, false = Use localStorage
    USE_LOCAL_BACKUP: true,     // Backup to localStorage as fallback
    DEBUG_MODE: true            // Show console logs
};

// Helper function to check if Sheets is configured
function isSheetsConfigured() {
    return GOOGLE_SHEETS_CONFIG.WEB_APP_URL !== 'YOUR_WEB_APP_URL_HERE' &&
           GOOGLE_SHEETS_CONFIG.SHEET_ID !== 'YOUR_SHEET_ID_HERE' &&
           GOOGLE_SHEETS_CONFIG.USE_SHEETS;
}

// Log configuration status
if (GOOGLE_SHEETS_CONFIG.DEBUG_MODE) {
    console.log('📋 Configuration loaded:');
    console.log('  - Sheets configured:', isSheetsConfigured());
    console.log('  - Use Sheets:', GOOGLE_SHEETS_CONFIG.USE_SHEETS);
    console.log('  - Local backup:', GOOGLE_SHEETS_CONFIG.USE_LOCAL_BACKUP);
}
