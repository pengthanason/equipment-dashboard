// ==================== CONFIGURATION & INITIAL MOCK DATA ====================
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin';
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyslB1Jv5FeXj5VaGGVeiKqm5rPLAuMg3bUA2riKLbvOQYLcpCAYk08VL5S-X4cAIs2sQ/exec';

// Helper to get local date string YYYY-MM-DD
function getLocalDateString(dateObj = new Date()) {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Helper to get local ISO string YYYY-MM-DDTHH:MM:SS
function getLocalISOString(dateObj = new Date()) {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  const hours = String(dateObj.getHours()).padStart(2, '0');
  const minutes = String(dateObj.getMinutes()).padStart(2, '0');
  const seconds = String(dateObj.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
}

const todayStr = getLocalDateString(); // e.g. "2026-06-11"

// Prepopulate data if LocalStorage is empty
const defaultRecords = [
  {
    id: 'rec-1',
    timestamp: '2026-06-11T10:15:30',
    name: 'สมเกียรติ',
    surname: 'รักษ์ดี',
    equipment: 'iPad Pro 11-inch (IT-01)',
    borrowDate: '2026-06-11',
    returnDate: '2026-06-14',
    status: 'กำลังยืม',
    notes: 'ยืมใช้งานทดสอบระบบแอปพลิเคชันห้องประชุมใหญ่'
  },
  {
    id: 'rec-2',
    timestamp: '2026-06-11T09:05:12',
    name: 'กานดา',
    surname: 'แสนทวี',
    equipment: 'Sony Mirrorless Camera (AV-03)',
    borrowDate: '2026-06-08',
    returnDate: '2026-06-11',
    status: 'คืนแล้ว',
    notes: 'นำถ่ายทำวีดีโอสรุปโครงการประจำปี'
  },
  {
    id: 'rec-3',
    timestamp: '2026-06-10T14:20:45',
    name: 'วิชัย',
    surname: 'บุญมี',
    equipment: 'MacBook Air M2 (IT-04)',
    borrowDate: '2026-06-07',
    returnDate: '2026-06-10',
    status: 'กำลังยืม',
    notes: 'ยืมพัฒนาเว็บสำหรับงานจัดแสดงสัมมนา (เกินกำหนดคืน)'
  },
  {
    id: 'rec-4',
    timestamp: '2026-06-09T11:45:00',
    name: 'นภาพร',
    surname: 'โชคดี',
    equipment: 'Projector Epson (IT-12)',
    borrowDate: '2026-06-09',
    returnDate: '2026-06-09',
    status: 'คืนแล้ว',
    notes: 'ใช้บรรยายวิชาสัมมนาวิชาการภาคบ่าย'
  },
  {
    id: 'rec-5',
    timestamp: '2026-06-11T13:30:00',
    name: 'ชลทิศ',
    surname: 'ศรีสว่าง',
    equipment: 'Wireless Microphone (AV-09)',
    borrowDate: '2026-06-11',
    returnDate: '2026-06-15',
    status: 'กำลังยืม',
    notes: 'ยืมทำกิจกรรมสันทนาการของพนักงานในออฟฟิศ'
  }
];

let records = [];

async function loadRecords() {
  try {
    const res = await fetch(APPS_SCRIPT_URL, { redirect: 'follow' });
    const json = await res.json();
    if (json.status === 'ok' && json.records.length > 0) {
      records = json.records;
      localStorage.setItem('borrow_records', JSON.stringify(records));
      return;
    }
  } catch (e) {
    // ถ้าโหลดจาก Sheets ไม่ได้ ใช้ cache จาก localStorage
  }
  const cached = localStorage.getItem('borrow_records');
  if (cached) {
    records = JSON.parse(cached);
  } else {
    records = defaultRecords;
    localStorage.setItem('borrow_records', JSON.stringify(records));
  }
}

async function refreshFromSheets() {
  try {
    const res = await fetch(APPS_SCRIPT_URL, { redirect: 'follow' });
    const json = await res.json();
    if (json.status === 'ok' && json.records.length > 0) {
      records = json.records;
      localStorage.setItem('borrow_records', JSON.stringify(records));
      renderDashboardData();
    }
  } catch (e) {}
}

// ==================== APP INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', async () => {
  await loadRecords();
  initAuth();
  initDashboard();
  initModals();
  setInterval(refreshFromSheets, 30000);
});

// ==================== AUTHENTICATION SECTION ====================
function initAuth() {
  const loginForm = document.getElementById('login-form');
  const loginScreen = document.getElementById('login-screen');
  const dashboardScreen = document.getElementById('dashboard-screen');
  const btnLogout = document.getElementById('btn-logout');
  const togglePassword = document.getElementById('toggle-password');
  const passwordInput = document.getElementById('password');

  // Check login state
  const isLoggedIn = sessionStorage.getItem('admin_logged_in') === 'true';
  if (isLoggedIn) {
    loginScreen.style.display = 'none';
    dashboardScreen.style.display = 'flex';
    renderDashboardData();
  } else {
    loginScreen.style.display = 'flex';
    dashboardScreen.style.display = 'none';
  }

  // Toggle Password Visibility
  togglePassword.addEventListener('click', () => {
    const isPassword = passwordInput.getAttribute('type') === 'password';
    passwordInput.setAttribute('type', isPassword ? 'text' : 'password');
    togglePassword.querySelector('i').className = isPassword ? 'fa-regular fa-eye-slash' : 'fa-regular fa-eye';
  });

  // Handle Login
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const userVal = document.getElementById('username').value.trim();
    const passVal = passwordInput.value;

    if (userVal === ADMIN_USERNAME && passVal === ADMIN_PASSWORD) {
      sessionStorage.setItem('admin_logged_in', 'true');
      showToast('เข้าสู่ระบบสำเร็จ ยินดีต้อนรับครับ!', 'success');
      
      // Clear inputs
      document.getElementById('username').value = '';
      passwordInput.value = '';
      
      // Page transition
      loginScreen.style.display = 'none';
      dashboardScreen.style.display = 'flex';
      renderDashboardData();
    } else {
      showToast('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง กรุณาลองอีกครั้ง', 'danger');
    }
  });

  // Handle Logout
  btnLogout.addEventListener('click', () => {
    sessionStorage.removeItem('admin_logged_in');
    showToast('ออกจากระบบเรียบร้อยแล้ว', 'info');
    
    dashboardScreen.style.display = 'none';
    loginScreen.style.display = 'flex';
  });
}

// ==================== DASHBOARD SECTION ====================
function initDashboard() {
  // Current Date display
  const currentDateElement = document.getElementById('current-date');
  if (currentDateElement) {
    currentDateElement.textContent = formatThaiFullDate(new Date());
  }

  // Filters and Search Inputs
  const searchInput = document.getElementById('search-input');
  const statusFilter = document.getElementById('status-filter');

  searchInput.addEventListener('input', renderDashboardData);
  statusFilter.addEventListener('change', renderDashboardData);

  // Edit form submit
  const editForm = document.getElementById('edit-form');
  editForm.addEventListener('submit', handleSaveEdit);

  // Table button delegation
  document.getElementById('records-tbody').addEventListener('click', (e) => {
    const editBtn = e.target.closest('.btn-action-edit');
    const deleteBtn = e.target.closest('.btn-action-delete');
    if (editBtn) openEditModal(editBtn.dataset.id);
    if (deleteBtn) handleDeleteRecord(deleteBtn.dataset.id);
  });
}

// Render Table and Stats
function renderDashboardData() {
  const tbody = document.getElementById('records-tbody');
  const searchVal = document.getElementById('search-input').value.toLowerCase().trim();
  const filterVal = document.getElementById('status-filter').value;
  const emptyState = document.getElementById('empty-state');
  const tableCard = document.querySelector('.table-card');
  const recordsCount = document.getElementById('records-count');

  // Clear tbody
  tbody.innerHTML = '';

  const activeTodayStr = getLocalDateString(); // Current day reference

  // Filter records
  const filteredRecords = records.filter(rec => {
    // Search match (Name, Surname, Equipment)
    const matchesSearch = 
      rec.name.toLowerCase().includes(searchVal) ||
      rec.surname.toLowerCase().includes(searchVal) ||
      rec.equipment.toLowerCase().includes(searchVal);

    // Status match
    let matchesStatus = true;
    const isOverdue = rec.status === 'กำลังยืม' && rec.returnDate < activeTodayStr;
    
    if (filterVal === 'borrowing') {
      matchesStatus = rec.status === 'กำลังยืม';
    } else if (filterVal === 'returned') {
      matchesStatus = rec.status === 'คืนแล้ว';
    } else if (filterVal === 'overdue') {
      matchesStatus = isOverdue;
    }

    return matchesSearch && matchesStatus;
  });

  // Sort: Latest Form Submission (timestamp) first
  filteredRecords.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  // Render Rows
  if (filteredRecords.length === 0) {
    tbody.innerHTML = '';
    emptyState.style.display = 'flex';
    recordsCount.textContent = `แสดงทั้งหมด 0 รายการ`;
  } else {
    emptyState.style.display = 'none';
    
    filteredRecords.forEach((rec, idx) => {
      const isOverdue = rec.status === 'กำลังยืม' && rec.returnDate < activeTodayStr;
      
      let badgeHtml = '';
      if (rec.status === 'คืนแล้ว') {
        badgeHtml = `<span class="badge badge-success"><i class="fa-solid fa-check"></i> คืนแล้ว</span>`;
      } else if (isOverdue) {
        badgeHtml = `<span class="badge badge-danger"><i class="fa-solid fa-triangle-exclamation"></i> เกืนกำหนด</span>`;
      } else {
        badgeHtml = `<span class="badge badge-warning"><i class="fa-solid fa-hourglass-half"></i> กำลังยืม</span>`;
      }

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="font-weight: 600; text-align: center;">${idx + 1}</td>
        <td>
          <div class="timestamp-text">
            <i class="fa-regular fa-clock"></i> ${formatThaiDate(rec.timestamp.split('T')[0])}
          </div>
        </td>
        <td style="font-weight: 500;">${rec.name} ${rec.surname}</td>
        <td>
          <div style="font-weight: 500; color: var(--primary-color);">
            ${rec.equipment}
          </div>
        </td>
        <td>${formatThaiDate(rec.borrowDate)}</td>
        <td>${formatThaiDate(rec.returnDate)}</td>
        <td style="text-align: center;">${badgeHtml}</td>
        <td>
          <div class="notes-text" title="${rec.notes || '-'}">
            ${rec.notes || '<span style="color:#cbd5e1">-</span>'}
          </div>
        </td>
        <td style="text-align: center;">
          <div class="table-actions">
            <button class="btn-action-edit" data-id="${rec.id}" title="แก้ไข">
              <i class="fa-solid fa-pen"></i> แก้ไข
            </button>
            <button class="btn-action-delete" data-id="${rec.id}" title="ลบ">
              <i class="fa-solid fa-trash-can"></i> ลบ
            </button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });

    recordsCount.textContent = `แสดงทั้งหมด ${filteredRecords.length} รายการ`;
  }

  // Update summaries
  calculateDailyStats();
}

// Calculate summary stats
function calculateDailyStats() {
  const currentTodayStr = getLocalDateString(); // "YYYY-MM-DD"
  
  let borrowsToday = 0;
  let returnsToday = 0;
  let currentlyBorrowed = 0;
  let overdue = 0;

  records.forEach(rec => {
    // 1. Borrows Today (Form submitted today OR borrow date is today)
    const isSubmittedToday = rec.timestamp.startsWith(currentTodayStr);
    const isBorrowDateToday = rec.borrowDate === currentTodayStr;
    if (isSubmittedToday || isBorrowDateToday) {
      borrowsToday++;
    }

    // 2. Returned Today (Returned status AND return date is today)
    const isReturned = rec.status === 'คืนแล้ว';
    const isReturnDateToday = rec.returnDate === currentTodayStr;
    if (isReturned && isReturnDateToday) {
      returnsToday++;
    }

    // 3. Currently Borrowed
    if (rec.status === 'กำลังยืม') {
      currentlyBorrowed++;
      
      // 4. Overdue (status is borrowing AND returnDate has passed today)
      if (rec.returnDate < currentTodayStr) {
        overdue++;
      }
    }
  });

  // Inject UI values
  document.getElementById('stat-borrows-today').textContent = borrowsToday;
  document.getElementById('stat-returns-today').textContent = returnsToday;
  document.getElementById('stat-currently-borrowed').textContent = currentlyBorrowed;
  document.getElementById('stat-overdue').textContent = overdue;
}

// Delete Record
function handleDeleteRecord(id) {
  const recordIndex = records.findIndex(r => r.id === id);
  if (recordIndex === -1) return;

  const target = records[recordIndex];
  const confirmMsg = `คุณต้องการลบบันทึกการยืมของ "${target.name} ${target.surname}" ที่ยืม "${target.equipment}" ใช่หรือไม่?`;
  
  if (confirm(confirmMsg)) {
    records.splice(recordIndex, 1);
    saveRecordsToStorage();
    renderDashboardData();
    showToast('ลบบันทึกสำเร็จแล้ว', 'success');
  }
};

// ==================== MODALS LOGIC ====================
function initModals() {
  const closeButtons = document.querySelectorAll('.modal-close-btn');
  
  closeButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      closeAllModals();
    });
  });

  // Close modal when clicking on backdrop
  const backdrops = document.querySelectorAll('.modal-backdrop');
  backdrops.forEach(backdrop => {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) {
        closeAllModals();
      }
    });
  });

}

function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('open');
  }
}

function closeAllModals() {
  const modals = document.querySelectorAll('.modal-backdrop');
  modals.forEach(m => m.classList.remove('open'));
}

function normalizeDate(val) {
  if (!val) return '';
  val = String(val).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(val)) return val.substring(0, 10);
  const parts = val.split('/');
  if (parts.length === 3) {
    const day = parts[0].padStart(2, '0');
    const month = parts[1].padStart(2, '0');
    const year = parts[2].length === 4 ? parts[2] : '20' + parts[2];
    return `${year}-${month}-${day}`;
  }
  try {
    const d = new Date(val);
    if (!isNaN(d.getTime())) {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    }
  } catch(e) {}
  return '';
}

// Open and Prepopulate Edit Modal
function openEditModal(id) {
  const rec = records.find(r => r.id === id);
  if (!rec) return;

  document.getElementById('edit-id').value = rec.id || '';
  document.getElementById('edit-name').textContent = rec.name || '-';
  document.getElementById('edit-surname').textContent = rec.surname || '-';
  document.getElementById('edit-equipment').value = rec.equipment || '';
  document.getElementById('edit-borrow-date').textContent = rec.borrowDate ? formatThaiDate(normalizeDate(rec.borrowDate)) : '-';
  document.getElementById('edit-return-date').value = normalizeDate(rec.returnDate);
  document.getElementById('edit-status').value = rec.status || 'กำลังยืม';
  document.getElementById('edit-timestamp').textContent = rec.timestamp ? formatThaiDate(rec.timestamp.split('T')[0]) : '-';
  document.getElementById('edit-notes').textContent = rec.notes || '-';

  openModal('edit-modal');
};

// Handle Save Edit Form
function handleSaveEdit(e) {
  e.preventDefault();

  const id = document.getElementById('edit-id').value;
  const index = records.findIndex(r => r.id === id);
  if (index === -1) return;

  records[index].equipment = document.getElementById('edit-equipment').value.trim();
  records[index].returnDate = document.getElementById('edit-return-date').value;
  records[index].status = document.getElementById('edit-status').value;

  saveRecordsToStorage();
  closeAllModals();
  renderDashboardData();
  showToast('บันทึกการเปลี่ยนแปลงข้อมูลเรียบร้อย', 'success');
}


// Save to LocalStorage + sync to Google Sheets
function saveRecordsToStorage() {
  localStorage.setItem('borrow_records', JSON.stringify(records));
  fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    redirect: 'follow',
    body: JSON.stringify({ action: 'saveAll', records })
  }).catch(() => {});
}

// ==================== TOAST MESSAGES LOGIC ====================
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  let iconClass = 'fa-solid fa-circle-info';
  if (type === 'success') iconClass = 'fa-solid fa-circle-check';
  if (type === 'danger') iconClass = 'fa-solid fa-circle-exclamation';
  if (type === 'warning') iconClass = 'fa-solid fa-triangle-exclamation';

  toast.innerHTML = `
    <span class="toast-icon"><i class="${iconClass}"></i></span>
    <span class="toast-message">${message}</span>
  `;

  container.appendChild(toast);

  // Auto remove toast after 4 seconds
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-10px)';
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 4000);
}

// ==================== DATE UTILITY TRANSLATORS ====================
function formatThaiDate(dateStr) {
  if (!dateStr) return '-';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  
  const year = parseInt(parts[0]) + 543;
  const months = [
    'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
    'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
  ];
  const month = months[parseInt(parts[1]) - 1];
  const day = parseInt(parts[2]);
  
  return `${day} ${month} ${year}`;
}

function formatThaiDateTime(dateTimeStr) {
  if (!dateTimeStr) return '-';
  const parts = dateTimeStr.split('T');
  const dateStr = parts[0];
  const timeStr = parts[1] ? parts[1].substring(0, 5) : '';
  
  const formattedDate = formatThaiDate(dateStr);
  const formattedTime = timeStr ? `${timeStr} น.` : '';
  
  return `${formattedDate} ${formattedTime}`;
}

function formatThaiFullDate(date) {
  const year = date.getFullYear() + 543;
  const months = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];
  const month = months[date.getMonth()];
  const day = date.getDate();
  
  return `${day} ${month} ${year}`;
}
