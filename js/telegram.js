// ========================================
// SU Physiotherapy - Telegram Bot Integration
// ========================================

// ========================================
// Send Telegram Notification
// ========================================
async function sendTelegramNotification(patient, type) {
    const botToken = localStorage.getItem('telegram_bot_token');
    const chatId = localStorage.getItem('telegram_chat_id');
    
    // Check if Telegram is configured
    if (!botToken || !chatId) {
        console.log('⚠️ Telegram not configured');
        return false;
    }
    
    // Build message based on type
    let message = '';
    
    switch(type) {
        case 'new':
            message = buildNewBookingMessage(patient);
            break;
        case 'status_update':
            message = buildStatusUpdateMessage(patient);
            break;
        case 'cancelled':
            message = buildCancelledMessage(patient);
            break;
        case 'reminder':
            message = buildReminderMessage(patient);
            break;
        default:
            message = buildDefaultMessage(patient);
    }
    
    // Send to Telegram
    try {
        const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: chatId,
                text: message,
                parse_mode: 'HTML'
            })
        });
        
        const result = await response.json();
        
        if (result.ok) {
            console.log('✅ Telegram notification sent successfully');
            return true;
        } else {
            console.error('❌ Telegram error:', result.description);
            return false;
        }
    } catch (error) {
        console.error('❌ Failed to send Telegram notification:', error);
        return false;
    }
}

// ========================================
// Build New Booking Message
// ========================================
function buildNewBookingMessage(patient) {
    const treatments = {
        'general': 'ယေဘုယျ ကုထုံး',
        'sports': 'အားကစား ထိခိုက်မှု',
        'orthopedic': 'အရိုးအဆစ်',
        'neuro': 'အာရုံကြော',
        'geriatric': 'သက်ကြီးရွယ်အို'
    };
    
    const treatmentName = treatments[patient.treatment] || patient.treatment;
    
    const message = `
🆕 <b>လူနာအသစ် Booking</b>

👤 <b>အမည်:</b> ${patient.name}
📞 <b>ဖုန်း:</b> ${patient.phone}
📍 <b>လိပ်စာ:</b> ${patient.address || 'မရှိ'}

📅 <b>ရက်စွဲ:</b> ${formatDateMM(patient.date)}
🕐 <b>အချိန်:</b> ${patient.time}
💊 <b>ကုသမှု:</b> ${treatmentName}

📝 <b>မှတ်ချက်:</b> ${patient.notes || 'မရှိ'}

⏳ <b>အခြေအနေ:</b> စောင့်ဆိုင်းဆဲ

🔔 ကျေးဇူးပြု၍ အတည်ပြုပေးပါ။
    `.trim();
    
    return message;
}

// ========================================
// Build Status Update Message
// ========================================
function buildStatusUpdateMessage(patient) {
    const statusMap = {
        'pending': '⏳ စောင့်ဆိုင်းဆဲ',
        'confirmed': '✅ အတည်ပြုပြီး',
        'cancelled': '❌ ပယ်ဖျက်ပြီး',
        'completed': '✔️ ပြီးစီးပြီ'
    };
    
    const statusText = statusMap[patient.status] || patient.status;
    
    const message = `
🔄 <b>အခြေအနေ ပြောင်းလဲမှု</b>

👤 <b>လူနာ:</b> ${patient.name}
📞 <b>ဖုန်း:</b> ${patient.phone}
📅 <b>ရက်စွဲ:</b> ${formatDateMM(patient.date)} | ${patient.time}

✅ <b>အခြေအနေ:</b> ${statusText}
    `.trim();
    
    return message;
}

// ========================================
// Build Cancelled Message
// ========================================
function buildCancelledMessage(patient) {
    const message = `
❌ <b>Booking ပယ်ဖျက်ခြင်း</b>

👤 <b>လူနာ:</b> ${patient.name}
📞 <b>ဖုန်း:</b> ${patient.phone}
📅 <b>ရက်စွဲ:</b> ${formatDateMM(patient.date)} | ${patient.time}

🚫 <b>အကြောင်းပြချက်:</b>
${patient.cancelReason || 'အကြောင်းပြချက် မဖော်ပြပါ'}

⏰ <b>ပယ်ဖျက်ချိန်:</b> ${new Date().toLocaleString('my-MM')}
    `.trim();
    
    return message;
}

// ========================================
// Build Reminder Message
// ========================================
function buildReminderMessage(patient) {
    const message = `
🔔 <b>ချိန်းဆိုမှု သတိပေးချက်</b>

👤 <b>လူနာ:</b> ${patient.name}
📞 <b>ဖုန်း:</b> ${patient.phone}
📍 <b>လိပ်စာ:</b> ${patient.address || 'မရှိ'}

📅 <b>ရက်စွဲ:</b> ${formatDateMM(patient.date)}
🕐 <b>အချိန်:</b> ${patient.time}

💊 <b>ကုသမှု:</b> ${patient.treatment}
📝 <b>မှတ်ချက်:</b> ${patient.notes || 'မရှိ'}

⏰ မနက်ဖြန် ချိန်းဆိုမှု ရှိပါသည်!
    `.trim();
    
    return message;
}

// ========================================
// Build Default Message
// ========================================
function buildDefaultMessage(patient) {
    const message = `
📋 <b>SU Physiotherapy</b>

👤 ${patient.name}
📞 ${patient.phone}
📅 ${formatDateMM(patient.date)} | ${patient.time}
    `.trim();
    
    return message;
}

// ========================================
// Format Date to Myanmar
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
// Send Daily Summary
// ========================================
async function sendDailySummary() {
    const botToken = localStorage.getItem('telegram_bot_token');
    const chatId = localStorage.getItem('telegram_chat_id');
    
    if (!botToken || !chatId) {
        console.log('⚠️ Telegram not configured');
        return false;
    }
    
    // Get today's appointments
    const today = new Date().toISOString().split('T')[0];
    const todayAppointments = patients.filter(p => p.date === today);
    
    // Count by status
    const confirmed = todayAppointments.filter(p => p.status === 'confirmed').length;
    const pending = todayAppointments.filter(p => p.status === 'pending').length;
    const completed = todayAppointments.filter(p => p.status === 'completed').length;
    const cancelled = todayAppointments.filter(p => p.status === 'cancelled').length;
    
    let message = `
📊 <b>ယနေ့ ချိန်းဆိုမှု အကျဉ်း</b>

📅 <b>ရက်စွဲ:</b> ${formatDateMM(today)}

📈 <b>စုစုပေါင်း:</b> ${todayAppointments.length} ဦး
✅ <b>အတည်ပြု:</b> ${confirmed} ဦး
⏳ <b>စောင့်ဆိုင်း:</b> ${pending} ဦး
✔️ <b>ပြီးစီး:</b> ${completed} ဦး
❌ <b>ပယ်ဖျက်:</b> ${cancelled} ဦး
    `.trim();
    
    // Add list of appointments
    if (todayAppointments.length > 0) {
        message += '\n\n<b>အသေးစိတ်:</b>\n';
        
        todayAppointments.forEach((patient, index) => {
            const statusEmoji = {
                'pending': '⏳',
                'confirmed': '✅',
                'cancelled': '❌',
                'completed': '✔️'
            };
            
            message += `\n${index + 1}. ${statusEmoji[patient.status] || '📌'} ${patient.name} - ${patient.time}`;
        });
    }
    
    try {
        const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: chatId,
                text: message,
                parse_mode: 'HTML'
            })
        });
        
        const result = await response.json();
        
        if (result.ok) {
            console.log('✅ Daily summary sent');
            return true;
        } else {
            console.error('❌ Telegram error:', result.description);
            return false;
        }
    } catch (error) {
        console.error('❌ Failed to send daily summary:', error);
        return false;
    }
}

// ========================================
// Send Upcoming Reminders
// ========================================
async function sendUpcomingReminders() {
    const botToken = localStorage.getItem('telegram_bot_token');
    const chatId = localStorage.getItem('telegram_chat_id');
    
    if (!botToken || !chatId) {
        console.log('⚠️ Telegram not configured');
        return false;
    }
    
    // Get tomorrow's appointments
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    const tomorrowAppointments = patients.filter(p => 
        p.date === tomorrowStr && 
        (p.status === 'confirmed' || p.status === 'pending')
    );
    
    if (tomorrowAppointments.length === 0) {
        console.log('📅 No appointments tomorrow');
        return true;
    }
    
    let message = `
🔔 <b>မနက်ဖြန် ချိန်းဆိုမှုများ</b>

📅 <b>ရက်စွဲ:</b> ${formatDateMM(tomorrowStr)}
👥 <b>လူနာ:</b> ${tomorrowAppointments.length} ဦး

<b>အသေးစိတ်:</b>
    `.trim();
    
    tomorrowAppointments.forEach((patient, index) => {
        const statusEmoji = patient.status === 'confirmed' ? '✅' : '⏳';
        message += `\n\n${index + 1}. ${statusEmoji} <b>${patient.name}</b>`;
        message += `\n   📞 ${patient.phone}`;
        message += `\n   🕐 ${patient.time}`;
        message += `\n   📍 ${patient.address || 'လိပ်စာ မရှိ'}`;
    });
    
    try {
        const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: chatId,
                text: message,
                parse_mode: 'HTML'
            })
        });
        
        const result = await response.json();
        
        if (result.ok) {
            console.log('✅ Reminders sent');
            return true;
        } else {
            console.error('❌ Telegram error:', result.description);
            return false;
        }
    } catch (error) {
        console.error('❌ Failed to send reminders:', error);
        return false;
    }
}

// ========================================
// Test Telegram Connection
// ========================================
async function testTelegramConnection() {
    const botToken = localStorage.getItem('telegram_bot_token');
    const chatId = localStorage.getItem('telegram_chat_id');
    
    if (!botToken || !chatId) {
        alert('⚠️ Telegram Bot Token နှင့် Chat ID ဖြည့်ပါ');
        return false;
    }
    
    const message = `
✅ <b>SU Physiotherapy</b>

🔔 Telegram Bot ချိတ်ဆက်မှု အောင်မြင်ပါသည်။

📱 App မှ notifications များ ဤနေရာတွင် ရောက်ရှိပါလိမ့်မည်။
    `.trim();
    
    try {
        const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: chatId,
                text: message,
                parse_mode: 'HTML'
            })
        });
        
        const result = await response.json();
        
        if (result.ok) {
            alert('✅ Telegram ချိတ်ဆက်မှု အောင်မြင်ပါသည်!\n\nTelegram တွင် message ကို စစ်ဆေးပါ။');
            return true;
        } else {
            alert('❌ Telegram ချိတ်ဆက်မှု မအောင်မြင်ပါ!\n\nအမှား: ' + result.description);
            return false;
        }
    } catch (error) {
        alert('❌ Connection error!\n\n' + error.message);
        return false;
    }
}

// ========================================
// Get Bot Info
// ========================================
async function getBotInfo() {
    const botToken = localStorage.getItem('telegram_bot_token');
    
    if (!botToken) {
        console.log('⚠️ Bot token not configured');
        return null;
    }
    
    try {
        const response = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
        const result = await response.json();
        
        if (result.ok) {
            console.log('🤖 Bot Info:', result.result);
            return result.result;
        } else {
            console.error('❌ Failed to get bot info:', result.description);
            return null;
        }
    } catch (error) {
        console.error('❌ Error getting bot info:', error);
        return null;
    }
}

// ========================================
// Export Functions
// ========================================
console.log('✅ Telegram.js loaded successfully');