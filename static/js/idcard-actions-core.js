// ID Card Actions - Core Utilities Module
// Contains: CSRF token, toast notifications, sidebar toggle, checkbox functionality

// ==========================================
// GLOBAL STATE
// ==========================================
window.IDCardApp = window.IDCardApp || {};

// ==========================================
// TABLE ID HELPER
// ==========================================
function getTableId() {
    return typeof TABLE_ID !== 'undefined' ? TABLE_ID : (window.IDCardApp?.tableId || null);
}

// Expose globally
window.getTableId = getTableId;
window.IDCardApp.getTableId = getTableId;

// ==========================================
// CSRF TOKEN HELPER
// ==========================================
function getCSRFToken() {
    const cookie = document.cookie.split(';').find(c => c.trim().startsWith('csrftoken='));
    return cookie ? cookie.split('=')[1] : '';
}

// Expose globally
window.getCSRFToken = getCSRFToken;
window.IDCardApp.getCSRFToken = getCSRFToken;

// ==========================================
// TOAST NOTIFICATION SYSTEM
// ==========================================

let downloadToastTimeout = null;

function showToast(message, isSuccess = true) {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    const toastIcon = document.getElementById('toastIcon');
    const toastProgress = document.getElementById('toastProgress');
    const toastProgressBar = document.getElementById('toastProgressBar');
    
    if (toast && toastMessage) {
        toastMessage.textContent = message;
        
        // Hide progress bar for regular toasts
        if (toastProgress) {
            toastProgress.style.display = 'none';
        }
        if (toastProgressBar) {
            toastProgressBar.classList.remove('indeterminate');
            toastProgressBar.style.width = '0%';
        }
        
        // Set icon based on success/error
        if (toastIcon) {
            toastIcon.className = isSuccess ? 'fa-solid fa-check-circle' : 'fa-solid fa-times-circle';
        }
        
        toast.className = 'toast show ' + (isSuccess ? 'success' : 'error');
        setTimeout(() => {
            toast.className = 'toast';
        }, 3000);
    }
}

function showProgressToast(message, progress = -1) {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    const toastIcon = document.getElementById('toastIcon');
    const toastProgress = document.getElementById('toastProgress');
    const toastProgressBar = document.getElementById('toastProgressBar');
    const toastPercent = document.getElementById('toastPercent');
    
    // Clear any existing timeout
    if (downloadToastTimeout) {
        clearTimeout(downloadToastTimeout);
        downloadToastTimeout = null;
    }
    
    if (toast && toastMessage) {
        toastMessage.textContent = message;
        
        // Set downloading icon (spinner)
        if (toastIcon) {
            toastIcon.className = 'fa-solid fa-spinner';
        }
        
        // Show progress bar
        if (toastProgress) {
            toastProgress.style.display = 'block';
        }
        
        // Show/update percentage
        if (toastPercent) {
            if (progress >= 0) {
                toastPercent.style.display = 'inline';
                toastPercent.textContent = Math.round(progress) + '%';
            } else {
                toastPercent.style.display = 'none';
            }
        }
        
        if (toastProgressBar) {
            if (progress < 0) {
                // Indeterminate progress
                toastProgressBar.classList.add('indeterminate');
                toastProgressBar.style.width = '30%';
            } else {
                // Determinate progress
                toastProgressBar.classList.remove('indeterminate');
                toastProgressBar.style.width = Math.min(progress, 100) + '%';
            }
        }
        
        toast.className = 'toast show downloading';
    }
}

function showDownloadComplete(message = 'Successfully downloaded!') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    const toastIcon = document.getElementById('toastIcon');
    const toastProgress = document.getElementById('toastProgress');
    const toastProgressBar = document.getElementById('toastProgressBar');
    const toastPercent = document.getElementById('toastPercent');
    
    // Clear any existing timeout
    if (downloadToastTimeout) {
        clearTimeout(downloadToastTimeout);
        downloadToastTimeout = null;
    }
    
    if (toast && toastMessage) {
        toastMessage.textContent = message;
        
        // Set success icon
        if (toastIcon) {
            toastIcon.className = 'fa-solid fa-check-circle';
        }
        
        // Show progress bar at 100%
        if (toastProgress) {
            toastProgress.style.display = 'block';
        }
        
        if (toastProgressBar) {
            toastProgressBar.classList.remove('indeterminate');
            toastProgressBar.style.width = '100%';
        }
        
        // Show 100% text
        if (toastPercent) {
            toastPercent.style.display = 'inline';
            toastPercent.textContent = '100%';
        }
        
        toast.className = 'toast show download-complete';
        
        // Auto-hide after 3 seconds
        downloadToastTimeout = setTimeout(() => {
            hideProgressToast();
        }, 3000);
    }
}

function hideProgressToast() {
    const toast = document.getElementById('toast');
    const toastProgress = document.getElementById('toastProgress');
    const toastPercent = document.getElementById('toastPercent');
    const toastProgressBar = document.getElementById('toastProgressBar');
    
    if (toast) {
        toast.className = 'toast';
    }
    if (toastProgress) {
        toastProgress.style.display = 'none';
    }
    if (toastPercent) {
        toastPercent.style.display = 'none';
    }
    if (toastProgressBar) {
        toastProgressBar.style.width = '0%';
        toastProgressBar.classList.remove('indeterminate');
    }
}

// Expose toast functions globally
window.showToast = showToast;
window.showProgressToast = showProgressToast;
window.showDownloadComplete = showDownloadComplete;
window.hideProgressToast = hideProgressToast;
window.IDCardApp.showToast = showToast;
window.IDCardApp.showProgressToast = showProgressToast;
window.IDCardApp.showDownloadComplete = showDownloadComplete;
window.IDCardApp.hideProgressToast = hideProgressToast;

// ==========================================
// API CALL HELPER
// ==========================================

function apiCall(url, method, data = null) {
    const options = {
        method: method,
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCSRFToken()
        }
    };
    if (data) options.body = JSON.stringify(data);
    
    return fetch(url, options)
        .then(response => response.json())
        .catch(error => {
            console.error('API Error:', error);
            showToast('Error: ' + error.message, false);
            throw error;
        });
}

// Expose globally
window.apiCall = apiCall;
window.IDCardApp.apiCall = apiCall;

// ==========================================
// SIDEBAR FUNCTIONALITY
// ==========================================

function initSidebar() {
    const sidebar = document.getElementById("sidebar");
    const sidebarToggle = document.getElementById("sidebarToggle");
    
    if (sidebarToggle && sidebar) {
        const isCollapsed = localStorage.getItem("sidebarCollapsed") === "true";
        if (isCollapsed) {
            sidebar.classList.add("collapsed");
            document.body.classList.add("sidebar-collapsed");
            sidebarToggle.innerHTML = '<i class="fa-solid fa-bars"></i>';
        } else {
            sidebarToggle.innerHTML = '<i class="fa-solid fa-xmark"></i>';
        }
        
        sidebarToggle.addEventListener("click", function() {
            sidebar.classList.toggle("collapsed");
            document.body.classList.toggle("sidebar-collapsed");
            
            const collapsed = sidebar.classList.contains("collapsed");
            localStorage.setItem("sidebarCollapsed", collapsed);
            sidebarToggle.innerHTML = collapsed ? '<i class="fa-solid fa-bars"></i>' : '<i class="fa-solid fa-xmark"></i>';
        });
    }
    
    // Set active sidebar link
    const activeClientsLink = document.getElementById('activeClientsLink');
    const allClientsLink = document.getElementById('allClientsLink');
    if (activeClientsLink) activeClientsLink.classList.add('active');
    if (allClientsLink) allClientsLink.classList.remove('active');
}

// Expose globally
window.IDCardApp.initSidebar = initSidebar;

// ==========================================
// CHECKBOX FUNCTIONALITY
// ==========================================

// Track last clicked checkbox for Shift+Click range selection
let lastClickedCheckboxIndex = null;

// Function to get current row checkboxes (live query)
function getRowCheckboxes() {
    return document.querySelectorAll(".rowCheckbox");
}

function getSelectedCardIds() {
    const checked = document.querySelectorAll('.rowCheckbox:checked');
    return [...checked].map(cb => cb.closest('tr').getAttribute('data-card-id'));
}

// Get all visible card IDs from current list
function getAllVisibleCardIds() {
    const allRows = document.querySelectorAll('#cardsTableBody tr[data-card-id]');
    return [...allRows].map(row => row.getAttribute('data-card-id')).filter(id => id);
}

// Get card IDs - selected if any, otherwise all visible
function getCardIdsForAction() {
    const selectedIds = getSelectedCardIds();
    return selectedIds.length > 0 ? selectedIds : getAllVisibleCardIds();
}

// Update button states when checkboxes change
function updateButtonStates() {
    const rowCheckboxes = getRowCheckboxes();
    const checkedBoxes = [...rowCheckboxes].filter(cb => cb.checked);
    const singleSelected = checkedBoxes.length === 1;
    const anySelected = checkedBoxes.length >= 1;
    const noneSelected = checkedBoxes.length === 0;
    
    // No-selection buttons (Add, Upload XLSX) - disabled when any row is selected
    const addBtn = document.getElementById('addBtn');
    const uploadXlsxBtn = document.getElementById('uploadXlsxBtn');
    if (addBtn) addBtn.disabled = anySelected;
    if (uploadXlsxBtn) uploadXlsxBtn.disabled = anySelected;
    
    // Enable/disable buttons based on selection
    // Single select buttons (Edit, View)
    document.querySelectorAll('[id^="editBtn"], [id^="viewBtn"]').forEach(btn => {
        if (btn) btn.disabled = !singleSelected;
    });
    
    // Multi select buttons (Delete, Verify, Approve, Unapproved, Retrieve, Unverify)
    document.querySelectorAll('[id^="deleteBtn"], [id^="verifyBtn"], [id^="approveBtn"], [id^="unapprovedBtn"], [id^="retrieveBtn"], [id^="unverifyBtn"]').forEach(btn => {
        if (btn) btn.disabled = !anySelected;
    });
    
    // Delete Permanent button (Pool list only)
    const deletePermanentBtn = document.getElementById('deletePermanentBtnP');
    if (deletePermanentBtn) deletePermanentBtn.disabled = !anySelected;
}

function initCheckboxes() {
    const selectAll = document.getElementById("selectAll");
    
    // Select All checkbox
    if (selectAll) {
        selectAll.addEventListener("change", function() {
            const rowCheckboxes = getRowCheckboxes();
            rowCheckboxes.forEach(cb => {
                cb.checked = this.checked;
            });
            updateButtonStates();
            
            // If unchecking, also deactivate the Select All DB button
            if (!this.checked) {
                const selectAllDbBtn = document.getElementById('selectAllDbBtn');
                if (selectAllDbBtn) {
                    selectAllDbBtn.classList.remove('active');
                    window.IDCardApp.allDbCardIds = null;
                }
            }
        });
    }
    
    // Individual row checkboxes - use event delegation
    const tableBody = document.getElementById('cardsTableBody');
    if (tableBody) {
        // Handle Shift+Click for range selection
        tableBody.addEventListener('click', function(e) {
            if (e.target.classList.contains('rowCheckbox')) {
                const rowCheckboxes = [...getRowCheckboxes()];
                const currentIndex = rowCheckboxes.indexOf(e.target);
                
                // Shift+Click range selection
                if (e.shiftKey && lastClickedCheckboxIndex !== null && currentIndex !== lastClickedCheckboxIndex) {
                    e.preventDefault(); // Prevent default checkbox behavior
                    
                    const start = Math.min(lastClickedCheckboxIndex, currentIndex);
                    const end = Math.max(lastClickedCheckboxIndex, currentIndex);
                    
                    // Check all checkboxes in range (set to checked state)
                    for (let i = start; i <= end; i++) {
                        if (rowCheckboxes[i]) {
                            rowCheckboxes[i].checked = true;
                        }
                    }
                    
                    // Trigger change event for button state update
                    e.target.dispatchEvent(new Event('change', { bubbles: true }));
                }
                
                // Update last clicked index (only for checked boxes or regular clicks)
                if (!e.shiftKey || e.target.checked) {
                    lastClickedCheckboxIndex = currentIndex;
                }
            }
        });
        
        // Handle checkbox state changes
        tableBody.addEventListener('change', function(e) {
            if (e.target.classList.contains('rowCheckbox')) {
                const rowCheckboxes = getRowCheckboxes();
                if (!e.target.checked) {
                    selectAll.checked = false;
                    // Also deactivate Select All DB if any checkbox is unchecked
                    const selectAllDbBtn = document.getElementById('selectAllDbBtn');
                    if (selectAllDbBtn) {
                        selectAllDbBtn.classList.remove('active');
                        window.IDCardApp.allDbCardIds = null;
                    }
                } else if ([...rowCheckboxes].every(c => c.checked)) {
                    selectAll.checked = true;
                }
                updateButtonStates();
            }
        });
    }
    
    // Reset last clicked index when page changes or data reloads
    window.IDCardApp.resetShiftClickIndex = function() {
        lastClickedCheckboxIndex = null;
    };
    
    // Select All Database button
    initSelectAllDbButton();
    
    // Initial button state
    updateButtonStates();
}

// Select All Database functionality
function initSelectAllDbButton() {
    const selectAllDbBtn = document.getElementById('selectAllDbBtn');
    if (!selectAllDbBtn) return;
    
    selectAllDbBtn.addEventListener('click', async function() {
        const tableId = window.IDCardApp.tableId;
        const currentStatus = window.IDCardApp.currentStatus || new URLSearchParams(window.location.search).get('status') || 'pending';
        
        if (!tableId) {
            showToast('Table ID not found', false);
            return;
        }
        
        // If already active, deselect all
        if (this.classList.contains('active')) {
            this.classList.remove('active');
            window.IDCardApp.allDbCardIds = null;
            
            // Uncheck all visible checkboxes
            const selectAll = document.getElementById("selectAll");
            if (selectAll) {
                selectAll.checked = false;
                selectAll.dispatchEvent(new Event('change', { bubbles: true }));
            }
            showToast('Selection cleared');
            return;
        }
        
        // Show loading state
        const originalContent = this.innerHTML;
        this.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Loading...';
        this.disabled = true;
        
        try {
            const response = await fetch(`/api/table/${tableId}/cards/all-ids/?status=${currentStatus}`);
            const data = await response.json();
            
            if (data.success && data.card_ids) {
                // Store all card IDs globally
                window.IDCardApp.allDbCardIds = data.card_ids;
                
                // Mark button as active
                this.classList.add('active');
                
                // Check all visible checkboxes
                const selectAll = document.getElementById("selectAll");
                if (selectAll) {
                    selectAll.checked = true;
                    const rowCheckboxes = getRowCheckboxes();
                    rowCheckboxes.forEach(cb => {
                        cb.checked = true;
                    });
                }
                
                updateButtonStates();
                showToast(`Selected all ${data.total_count} cards`);
            } else {
                showToast(data.message || 'Failed to get card IDs', false);
            }
        } catch (error) {
            console.error('Error fetching all card IDs:', error);
            showToast('Error fetching card IDs', false);
        } finally {
            this.innerHTML = originalContent;
            this.disabled = false;
        }
    });
}

// Override getSelectedCardIds to use all DB IDs when Select All DB is active
const originalGetSelectedCardIds = getSelectedCardIds;
function getSelectedCardIdsWithDbSelect() {
    // If Select All DB is active, return all DB card IDs
    if (window.IDCardApp.allDbCardIds && window.IDCardApp.allDbCardIds.length > 0) {
        const selectAllDbBtn = document.getElementById('selectAllDbBtn');
        if (selectAllDbBtn && selectAllDbBtn.classList.contains('active')) {
            return window.IDCardApp.allDbCardIds;
        }
    }
    // Otherwise, return selected visible checkboxes
    return originalGetSelectedCardIds();
}

// Expose globally
window.getRowCheckboxes = getRowCheckboxes;
window.getSelectedCardIds = getSelectedCardIdsWithDbSelect;
window.getAllVisibleCardIds = getAllVisibleCardIds;
window.getCardIdsForAction = getCardIdsForAction;
window.updateButtonStates = updateButtonStates;
window.IDCardApp.getRowCheckboxes = getRowCheckboxes;
window.IDCardApp.getSelectedCardIds = getSelectedCardIdsWithDbSelect;
window.IDCardApp.getAllVisibleCardIds = getAllVisibleCardIds;
window.IDCardApp.getCardIdsForAction = getCardIdsForAction;
window.IDCardApp.updateButtonStates = updateButtonStates;
window.IDCardApp.initCheckboxes = initCheckboxes;
window.IDCardApp.initSelectAllDbButton = initSelectAllDbButton;

// ==========================================
// DROPDOWN FUNCTIONALITY
// ==========================================

function setupDropdown(dropdownId) {
    const dropdown = document.getElementById(dropdownId);
    if (!dropdown) return;
    
    const toggle = dropdown.querySelector('.dropdown-toggle');
    const options = dropdown.querySelectorAll('.dropdown-option');
    
    toggle.addEventListener('click', function(e) {
        e.stopPropagation();
        // Close other dropdowns
        document.querySelectorAll('.custom-dropdown.open').forEach(d => {
            if (d !== dropdown) d.classList.remove('open');
        });
        dropdown.classList.toggle('open');
    });
    
    options.forEach(option => {
        option.addEventListener('click', function() {
            options.forEach(o => o.classList.remove('selected'));
            this.classList.add('selected');
            
            // Update toggle text if needed
            const selectedText = toggle.querySelector('span');
            if (selectedText) {
                selectedText.textContent = this.textContent;
            }
            
            dropdown.classList.remove('open');
        });
    });
}

function initDropdowns() {
    setupDropdown('filterDropdown');
    setupDropdown('rowsDropdown');
    setupDropdown('classFilterDropdown');
    setupDropdown('sectionFilterDropdown');
    
    // Close dropdowns when clicking outside
    document.addEventListener('click', function(e) {
        // Don't close if clicking inside a dropdown
        if (e.target.closest('.custom-dropdown')) return;
        
        document.querySelectorAll('.custom-dropdown.open').forEach(d => {
            d.classList.remove('open');
        });
    });
}

// Expose globally
window.IDCardApp.setupDropdown = setupDropdown;
window.IDCardApp.initDropdowns = initDropdowns;

// ==========================================
// DYNAMIC TEXT ALIGNMENT
// ==========================================

function applyDynamicAlignment() {
    const table = document.querySelector('.idcard-table table');
    if (!table) return;
    
    const rows = table.querySelectorAll('tbody tr[data-card-id]');
    if (rows.length === 0) return;
    
    // Get all dynamic field columns (skip checkbox, sr no, image fields, action, fixed cols)
    const headerCells = table.querySelectorAll('thead th');
    const columnAlignments = [];
    
    // First pass: determine if any cell in each column has long text (> 15 chars)
    headerCells.forEach((th, colIndex) => {
        // Skip non-dynamic columns
        if (th.classList.contains('checkbox-col') || 
            th.classList.contains('sr-col') || 
            th.classList.contains('image-col') ||
            th.classList.contains('action-col') ||
            th.classList.contains('fixed-col')) {
            columnAlignments[colIndex] = null; // Don't change these
            return;
        }
        
        // Check all cells in this column
        let hasLongText = false;
        rows.forEach(row => {
            const cell = row.cells[colIndex];
            if (cell && cell.classList.contains('dynamic-field')) {
                const text = cell.textContent.trim();
                if (text.length > 15) {
                    hasLongText = true;
                }
            }
        });
        
        // If any cell has long text, all cells in column should be left aligned
        columnAlignments[colIndex] = hasLongText ? 'left' : 'left'; // Always left for consistency
    });
    
    // Second pass: apply alignment to all cells in each column
    rows.forEach(row => {
        row.querySelectorAll('td.dynamic-field').forEach(cell => {
            cell.style.textAlign = 'left';
        });
    });
    
    // Sr No column - center
    document.querySelectorAll('.idcard-table td:nth-child(2)').forEach(cell => {
        cell.style.textAlign = 'center';
    });
}

// Expose globally
window.applyDynamicAlignment = applyDynamicAlignment;
window.IDCardApp.applyDynamicAlignment = applyDynamicAlignment;

// ==========================================
// HORIZONTAL SCROLL WITH ALT + MOUSE WHEEL
// ==========================================

function initHorizontalScroll() {
    const tableContainer = document.querySelector('.idcard-table');
    if (tableContainer) {
        tableContainer.addEventListener('wheel', function(e) {
            // If Alt key is held, scroll horizontally
            if (e.altKey) {
                e.preventDefault();
                // Slow scroll speed - 25% for smoother scrolling
                this.scrollLeft += e.deltaY * 0.25;
            }
        }, { passive: false });
    }
}

// Expose globally
window.IDCardApp.initHorizontalScroll = initHorizontalScroll;

// ==========================================
// TOAST STYLES (inline CSS)
// ==========================================

const toastStyle = document.createElement('style');
toastStyle.textContent = `
    .toast {
        position: fixed;
        bottom: 80px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 8px;
        background: #333;
        color: #fff;
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 14px;
        z-index: 9999;
        transform: translateY(100px);
        opacity: 0;
        transition: all 0.3s ease;
    }
    .toast.show {
        transform: translateY(0);
        opacity: 1;
    }
    .toast.success {
        background: #22c55e;
    }
    .toast.error {
        background: #ef4444;
    }
`;
document.head.appendChild(toastStyle);

// ==========================================
// CORE MODULE INITIALIZATION
// ==========================================

function initCoreModule() {
    initSidebar();
    initCheckboxes();
    initDropdowns();
    initHorizontalScroll();
    applyDynamicAlignment();
}

// Expose globally
window.IDCardApp.initCoreModule = initCoreModule;

console.log('IDCard Actions Core module loaded');
