// ========================================
// SU Physiotherapy - Calendar Module
// ========================================

let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();

// ========================================
// Render Calendar
// ========================================
function renderCalendar() {
    const calendarGrid = document.getElementById('calendar-grid');
    if (!calendarGrid) return;
    
    // Update month display
    updateMonthDisplay();
    
    // Clear calendar
    calendarGrid.innerHTML = '';
    
    // Create calendar header (days of week)
    const header = document.createElement('div');
    header.className = 'calendar-header';
    
    const daysOfWeek = ['တနင်္ဂနွေ', 'တနင်္လာ', 'အင်္ဂါ', 'ဗုဒ္ဓဟူး', 'ကြာသပတေး', 'သောကြာ', 'စနေ'];
    
    daysOfWeek.forEach(day => {
        const dayEl = document.createElement('div');
        dayEl.textContent = day;
        header.appendChild(dayEl);
    });
    
    calendarGrid.appendChild(header);
    
    // Create calendar days container
    const daysContainer = document.createElement('div');
    daysContainer.className = 'calendar-days';
    
    // Get first day of month
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const prevLastDay = new Date(currentYear, currentMonth, 0);
    
    const firstDayIndex = firstDay.getDay();
    const lastDateOfMonth = lastDay.getDate();
    const prevLastDate = prevLastDay.getDate();
    
    // Previous month days
    for (let i = firstDayIndex; i > 0; i--) {
        const day = createCalendarDay(
            prevLastDate - i + 1,
            currentMonth === 0 ? 11 : currentMonth - 1,
            currentMonth === 0 ? currentYear - 1 : currentYear,
            true
        );
        daysContainer.appendChild(day);
    }
    
    // Current month days
    for (let i = 1; i <= lastDateOfMonth; i++) {
        const day = createCalendarDay(i, currentMonth, currentYear, false);
        daysContainer.appendChild(day);
    }
    
    // Next month days
    const totalCells = daysContainer.children.length;
    const remainingCells = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
    
    for (let i = 1; i <= remainingCells; i++) {
        const day = createCalendarDay(
            i,
            currentMonth === 11 ? 0 : currentMonth + 1,
            currentMonth === 11 ? currentYear + 1 : currentYear,
            true
        );
        daysContainer.appendChild(day);
    }
    
    calendarGrid.appendChild(daysContainer);
}

// ========================================
// Create Calendar Day Element
// ========================================
function createCalendarDay(date, month, year, isOtherMonth) {
    const dayEl = document.createElement('div');
    dayEl.className = 'calendar-day';
    
    if (isOtherMonth) {
        dayEl.classList.add('other-month');
    }
    
    // Check if today
    const today = new Date();
    const isToday = date === today.getDate() && 
                    month === today.getMonth() && 
                    year === today.getFullYear();
    
    if (isToday && !isOtherMonth) {
        dayEl.classList.add('today');
    }
    
    // Create date string for comparison
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
    
    // Check for appointments on this day
    const appointmentsOnDay = patients.filter(p => p.date === dateStr);
    
    if (appointmentsOnDay.length > 0 && !isOtherMonth) {
        dayEl.classList.add('has-appointment');
    }
    
    // Day number
    const dayNumber = document.createElement('div');
    dayNumber.className = 'day-number';
    dayNumber.textContent = date;
    dayEl.appendChild(dayNumber);
    
    // Appointment count
    if (appointmentsOnDay.length > 0 && !isOtherMonth) {
        const countBadge = document.createElement('div');
        countBadge.className = 'appointment-count';
        countBadge.textContent = appointmentsOnDay.length;
        dayEl.appendChild(countBadge);
    }
    
    // Click event to show appointments
    if (appointmentsOnDay.length > 0 && !isOtherMonth) {
        dayEl.style.cursor = 'pointer';
        dayEl.addEventListener('click', () => {
            showDayAppointments(dateStr, appointmentsOnDay);
        });
    }
    
    return dayEl;
}

// ========================================
// Update Month Display
// ========================================
function updateMonthDisplay() {
    const monthEl = document.getElementById('current-month');
    if (!monthEl) return;
    
    const months = [
        'ဇန်နဝါရီ', 'ဖေဖော်ဝါရီ', 'မတ်', 'ဧပြီ', 'မေ', 'ဇွန်',
        'ဇူလိုင်', 'သြဂုတ်', 'စက်တင်ဘာ', 'အောက်တိုဘာ', 'နိုဝင်ဘာ', 'ဒီဇင်ဘာ'
    ];
    
    monthEl.textContent = `${months[currentMonth]} ${currentYear}`;
}

// ========================================
// Change Month
// ========================================
function changeMonth(direction) {
    currentMonth += direction;
    
    if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    } else if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    }
    
    renderCalendar();
}

// ========================================
// Show Day Appointments
// ========================================
function showDayAppointments(dateStr, appointments) {
    const dateObj = new Date(dateStr);
    const formattedDate = dateObj.toLocaleDateString('my-MM', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    let message = `📅 ${formattedDate}\n\n`;
    message += `လူနာ ${appointments.length} ဦး ရှိပါသည်:\n\n`;
    
    appointments.forEach((patient, index) => {
        const statusEmoji = {
            'pending': '⏳',
            'confirmed': '✅',
            'cancelled': '❌',
            'completed': '✔️'
        };
        
        message += `${index + 1}. ${patient.name}\n`;
        message += `   ⏰ ${patient.time}\n`;
        message += `   ${statusEmoji[patient.status] || '📌'} ${getStatusText(patient.status)}\n\n`;
    });
    
    alert(message);
}

// ========================================
// Render Today's Appointments
// ========================================
function renderTodayAppointments() {
    const todayList = document.getElementById('today-list');
    if (!todayList) return;
    
    // Get today's date
    const today = new Date().toISOString().split('T')[0];
    
    // Filter today's appointments
    const todayAppointments = patients.filter(p => p.date === today);
    
    // Sort by time
    todayAppointments.sort((a, b) => {
        return a.time.localeCompare(b.time);
    });
    
    // Clear list
    todayList.innerHTML = '';
    
    // If no appointments today
    if (todayAppointments.length === 0) {
        todayList.innerHTML = `
            <div class="appointment-item" style="text-align: center; border-left: none;">
                <p>📅 ယနေ့ ချိန်းဆိုမှု မရှိပါ</p>
            </div>
        `;
        return;
    }
    
    // Render each appointment
    todayAppointments.forEach(patient => {
        const item = document.createElement('div');
        item.className = 'appointment-item';
        
        // Get treatment name
        const treatments = {
            'general': 'ယေဘုယျ ကုထုံး',
            'sports': 'အားကစား ထိခိုက်မှု',
            'orthopedic': 'အရိုးအဆစ်',
            'neuro': 'အာရုံကြော',
            'geriatric': 'သက်ကြီးရွယ်အို'
        };
        
        const treatmentName = treatments[patient.treatment] || patient.treatment;
        
        // Status emoji
        const statusEmoji = {
            'pending': '⏳',
            'confirmed': '✅',
            'cancelled': '❌',
            'completed': '✔️'
        };
        
        item.innerHTML = `
            <h4>${patient.name}</h4>
            <p>⏰ ${patient.time} | 📞 ${patient.phone}</p>
            <p>💊 ${treatmentName}</p>
            ${patient.notes ? `<p>📝 ${patient.notes}</p>` : ''}
            <span class="status-badge ${patient.status}">
                ${statusEmoji[patient.status] || '📌'} ${getStatusText(patient.status)}
            </span>
        `;
        
        // Click to view details
        item.style.cursor = 'pointer';
        item.addEventListener('click', () => {
            viewPatient(patient.id);
        });
        
        todayList.appendChild(item);
    });
}

// ========================================
// Get Appointments for Date Range
// ========================================
function getAppointmentsForDateRange(startDate, endDate) {
    return patients.filter(p => {
        const appointmentDate = new Date(p.date);
        return appointmentDate >= startDate && appointmentDate <= endDate;
    });
}

// ========================================
// Get Upcoming Appointments
// ========================================
function getUpcomingAppointments(days = 7) {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + days);
    
    return patients.filter(p => {
        const appointmentDate = new Date(p.date);
        return appointmentDate >= today && appointmentDate <= futureDate;
    }).sort((a, b) => {
        const dateA = new Date(a.date + ' ' + a.time);
        const dateB = new Date(b.date + ' ' + b.time);
        return dateA - dateB;
    });
}

// ========================================
// Jump to Today
// ========================================
function jumpToToday() {
    const today = new Date();
    currentMonth = today.getMonth();
    currentYear = today.getFullYear();
    renderCalendar();
}

// ========================================
// Jump to Specific Month
// ========================================
function jumpToMonth(month, year) {
    currentMonth = month;
    currentYear = year;
    renderCalendar();
}

// ========================================
// Get Calendar Statistics
// ========================================
function getCalendarStats() {
    const today = new Date();
    const thisMonth = today.getMonth();
    const thisYear = today.getFullYear();
    
    // This month's appointments
    const thisMonthAppointments = patients.filter(p => {
        const date = new Date(p.date);
        return date.getMonth() === thisMonth && date.getFullYear() === thisYear;
    });
    
    // This week's appointments
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    
    const thisWeekAppointments = getAppointmentsForDateRange(startOfWeek, endOfWeek);
    
    return {
        thisMonth: thisMonthAppointments.length,
        thisWeek: thisWeekAppointments.length,
        upcoming: getUpcomingAppointments().length
    };
}

// ========================================
// Export Functions
// ========================================
console.log('✅ Calendar.js loaded successfully');