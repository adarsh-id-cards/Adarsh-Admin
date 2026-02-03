// Manage Staff Page JavaScript

document.addEventListener('DOMContentLoaded', function() {
    
    // ==================== ELEMENTS ====================
    const staffDrawer = document.getElementById('staff-drawer');
    const staffDrawerOverlay = document.getElementById('staff-drawer-overlay');
    const staffForm = document.getElementById('staff-form');
    const drawerTitle = document.getElementById('drawer-title-text');
    const drawerIcon = document.getElementById('drawer-icon');
    const submitBtn = document.getElementById('drawer-submit-btn');
    
    const addStaffBtn = document.getElementById('addStaffBtn');
    const editStaffBtn = document.getElementById('editStaffBtn');
    const viewStaffBtn = document.getElementById('viewStaffBtn');
    const deleteStaffBtn = document.getElementById('deleteStaffBtn');
    const activeStaffBtn = document.getElementById('activeStaffBtn');
    
    const closeStaffDrawer = document.getElementById('drawer-close-btn');
    const cancelStaffDrawer = document.getElementById('drawer-cancel-btn');
    
    const table = document.getElementById('staff-table');
    const tbody = document.getElementById('staff-table-body');
    
    let selectedStaffId = null;
    let selectedRow = null;
    let currentMode = 'add';

    // ==================== TOAST FUNCTIONS ====================
    function showToast(message, type = 'success') {
        // Create toast if not exists
        let toast = document.getElementById('toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'toast';
            toast.className = 'toast';
            toast.innerHTML = '<i class="fa-solid fa-check-circle"></i><span id="toastMessage">Success!</span>';
            document.body.appendChild(toast);
        }
        
        const iconClass = type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-times-circle' : 'fa-info-circle';
        toast.querySelector('i').className = 'fa-solid ' + iconClass;
        toast.querySelector('span').textContent = message;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    }

    // ==================== ROW SELECTION ====================
    console.log('Staff page loaded - tbody:', tbody ? 'found' : 'NOT FOUND');
    
    function selectStaffRow(row) {
        console.log('selectStaffRow called', row);
        if (!row || !row.dataset.staffId) return;
        
        // Remove selection from all rows and uncheck all checkboxes
        if (tbody) {
            tbody.querySelectorAll('tr').forEach(r => {
                r.classList.remove('selected');
                const cb = r.querySelector('.row-checkbox');
                if (cb) cb.checked = false;
            });
        }
        
        // Select current row and check its checkbox
        row.classList.add('selected');
        const checkbox = row.querySelector('.row-checkbox');
        console.log('Checkbox found:', checkbox);
        if (checkbox) {
            checkbox.checked = true;
            console.log('Checkbox checked:', checkbox.checked);
        }
        
        selectedRow = row;
        selectedStaffId = row.dataset.staffId;
        enableActionButtons(true);
        updateActiveButtonState();
    }
    
    function clearStaffSelection() {
        if (tbody) {
            tbody.querySelectorAll('tr').forEach(r => {
                r.classList.remove('selected');
                const cb = r.querySelector('.row-checkbox');
                if (cb) cb.checked = false;
            });
        }
        selectedRow = null;
        selectedStaffId = null;
        enableActionButtons(false);
    }
    
    // Set up row click handlers
    if (tbody) {
        console.log('Setting up row click handlers on tbody');
        // Row click - select row and check checkbox
        tbody.addEventListener('click', function(e) {
            console.log('Row click detected, target:', e.target.tagName);
            // If clicking directly on checkbox, let the change handler deal with it
            if (e.target.type === 'checkbox') return;
            
            const row = e.target.closest('tr');
            console.log('Row found:', row, 'staffId:', row?.dataset?.staffId);
            if (row && row.dataset.staffId && !row.classList.contains('no-data-row')) {
                selectStaffRow(row);
            }
        });
        
        // Checkbox change handler
        tbody.addEventListener('change', function(e) {
            if (e.target.type === 'checkbox' && e.target.classList.contains('row-checkbox')) {
                const row = e.target.closest('tr');
                if (row && row.dataset.staffId) {
                    if (e.target.checked) {
                        selectStaffRow(row);
                    } else {
                        clearStaffSelection();
                    }
                }
            }
        });
    }

    function enableActionButtons(enable) {
        if (editStaffBtn) editStaffBtn.disabled = !enable;
        if (activeStaffBtn) activeStaffBtn.disabled = !enable;
        if (deleteStaffBtn) deleteStaffBtn.disabled = !enable;
        if (viewStaffBtn) viewStaffBtn.disabled = !enable;
    }

    function updateActiveButtonState() {
        if (!selectedRow || !activeStaffBtn) return;
        
        const status = selectedRow.dataset.staffStatus;
        const isActive = status === 'active';
        
        if (isActive) {
            activeStaffBtn.innerHTML = '<i class="fa-solid fa-ban"></i> Inactive';
            activeStaffBtn.classList.remove('btn-active');
            activeStaffBtn.classList.add('btn-inactive');
        } else {
            activeStaffBtn.innerHTML = '<i class="fa-solid fa-check"></i> Active';
            activeStaffBtn.classList.remove('btn-inactive');
            activeStaffBtn.classList.add('btn-active');
        }
    }

    // ==================== PERMISSION FIELDS ====================
    const permissionFields = [
        'perm-staff-list', 'perm-staff-add', 'perm-staff-edit', 'perm-staff-delete', 'perm-staff-status',
        'perm-idcard-setting-list', 'perm-idcard-setting-add', 'perm-idcard-setting-edit', 
        'perm-idcard-setting-delete', 'perm-idcard-setting-status'
    ];

    // ==================== DRAWER FUNCTIONS ====================
    function openDrawer(mode = 'add', staffData = null) {
        currentMode = mode;
        staffForm.reset();
        
        // Reset all permission toggles to unchecked
        permissionFields.forEach(field => {
            const el = document.getElementById(field);
            if (el) el.checked = false;
        });
        
        const submitBtnText = document.getElementById('submit-btn-text');
        
        if (mode === 'add') {
            drawerTitle.textContent = 'Add New Staff';
            drawerIcon.className = 'fa-solid fa-user-plus';
            if (submitBtnText) submitBtnText.textContent = 'Add Staff';
            submitBtn.style.display = 'inline-flex';
            enableFormInputs(true);
        } else if (mode === 'edit') {
            drawerTitle.textContent = 'Edit Staff';
            drawerIcon.className = 'fa-solid fa-pen-to-square';
            if (submitBtnText) submitBtnText.textContent = 'Save Changes';
            submitBtn.style.display = 'inline-flex';
            enableFormInputs(true);
            
            if (staffData) {
                document.getElementById('staff-name').value = staffData.name || '';
                document.getElementById('staff-email').value = staffData.email || '';
                document.getElementById('staff-phone').value = staffData.phone || '';
                document.getElementById('staff-address').value = staffData.address || '';
                
                // Set permissions from staff data
                permissionFields.forEach(field => {
                    const el = document.getElementById(field);
                    const apiField = field.replace(/-/g, '_');
                    if (el) el.checked = staffData[apiField] === true;
                });
            }
        } else if (mode === 'view') {
            drawerTitle.textContent = 'View Staff Details';
            drawerIcon.className = 'fa-solid fa-eye';
            submitBtn.style.display = 'none';
            enableFormInputs(false);
            
            if (staffData) {
                document.getElementById('staff-name').value = staffData.name || '';
                document.getElementById('staff-email').value = staffData.email || '';
                document.getElementById('staff-phone').value = staffData.phone || '';
                document.getElementById('staff-address').value = staffData.address || '';
                
                // Set permissions from staff data
                permissionFields.forEach(field => {
                    const el = document.getElementById(field);
                    const apiField = field.replace(/-/g, '_');
                    if (el) el.checked = staffData[apiField] === true;
                });
            }
        }
        
        staffDrawer.classList.add('open');
        if (staffDrawerOverlay) staffDrawerOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    
    function closeDrawer() {
        staffDrawer.classList.remove('open');
        if (staffDrawerOverlay) staffDrawerOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }
    
    function enableFormInputs(enable) {
        const inputs = staffDrawer.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.disabled = !enable;
            if (!enable) {
                input.style.backgroundColor = '#f5f5f5';
                input.style.cursor = 'not-allowed';
            } else {
                input.style.backgroundColor = '';
                input.style.cursor = '';
            }
        });
    }

    // ==================== API CALLS ====================
    async function fetchStaffDetails(staffId) {
        try {
            const response = await fetch(`/api/staff/${staffId}/`);
            const data = await response.json();
            if (data.success) {
                return data.staff;
            } else {
                showToast(data.message || 'Failed to fetch staff details', 'error');
                return null;
            }
        } catch (error) {
            showToast('Network error. Please try again.', 'error');
            return null;
        }
    }
    
    async function createStaff(formData) {
        try {
            const response = await fetch('/api/staff/create/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            return await response.json();
        } catch (error) {
            return { success: false, message: 'Network error. Please try again.' };
        }
    }
    
    async function updateStaff(staffId, formData) {
        try {
            const response = await fetch(`/api/staff/${staffId}/update/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            return await response.json();
        } catch (error) {
            return { success: false, message: 'Network error. Please try again.' };
        }
    }
    
    async function deleteStaffApi(staffId) {
        try {
            const response = await fetch(`/api/staff/${staffId}/delete/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            return await response.json();
        } catch (error) {
            return { success: false, message: 'Network error. Please try again.' };
        }
    }
    
    async function toggleStaffStatus(staffId) {
        try {
            const response = await fetch(`/api/staff/${staffId}/toggle-status/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            return await response.json();
        } catch (error) {
            return { success: false, message: 'Network error. Please try again.' };
        }
    }

    // ==================== EVENT HANDLERS ====================
    if (addStaffBtn) {
        addStaffBtn.addEventListener('click', () => openDrawer('add'));
    }
    
    if (editStaffBtn) {
        editStaffBtn.addEventListener('click', async () => {
            if (!selectedStaffId) return;
            const staffData = await fetchStaffDetails(selectedStaffId);
            if (staffData) openDrawer('edit', staffData);
        });
    }
    
    if (viewStaffBtn) {
        viewStaffBtn.addEventListener('click', async () => {
            if (!selectedStaffId) return;
            const staffData = await fetchStaffDetails(selectedStaffId);
            if (staffData) openDrawer('view', staffData);
        });
    }
    
    if (deleteStaffBtn) {
        deleteStaffBtn.addEventListener('click', () => {
            if (!selectedStaffId || !selectedRow) return;
            
            const staffName = selectedRow.querySelector('td:first-child').textContent;
            openDeleteModal(staffName);
        });
    }
    
    if (activeStaffBtn) {
        activeStaffBtn.addEventListener('click', async () => {
            if (!selectedStaffId) return;
            const result = await toggleStaffStatus(selectedStaffId);
            if (result.success) {
                showToast(result.message, 'success');
                selectedRow.dataset.staffStatus = result.status;
                const statusBadge = selectedRow.querySelector('.status-badge');
                statusBadge.textContent = result.status_display;
                statusBadge.className = 'status-badge ' + (result.status === 'active' ? 'active' : 'inactive');
                updateActiveButtonState();
            } else {
                showToast(result.message || 'Failed to update status', 'error');
            }
        });
    }
    
    if (staffForm) {
        staffForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = {
                name: document.getElementById('staff-name').value,
                email: document.getElementById('staff-email').value,
                phone: document.getElementById('staff-phone').value,
                address: document.getElementById('staff-address').value,
                password: document.getElementById('staff-password').value,
                is_active: document.getElementById('staff-status').value === 'true',
            };
            
            // Add all permissions (convert hyphen-case to underscore for API)
            permissionFields.forEach(field => {
                const el = document.getElementById(field);
                const apiField = field.replace(/-/g, '_');
                if (el) formData[apiField] = el.checked;
            });
            
            let result;
            
            if (currentMode === 'edit' && selectedStaffId) {
                result = await updateStaff(selectedStaffId, formData);
            } else {
                result = await createStaff(formData);
            }
            
            if (result.success) {
                showToast(result.message, 'success');
                closeDrawer();
                setTimeout(() => location.reload(), 500);
            } else {
                showToast(result.message || 'Operation failed', 'error');
            }
        });
    }
    
    // Close drawer events
    if (closeStaffDrawer) {
        closeStaffDrawer.addEventListener('click', closeDrawer);
    }
    if (cancelStaffDrawer) {
        cancelStaffDrawer.addEventListener('click', function(e) {
            e.preventDefault();
            closeDrawer();
        });
    }
    
    // Close drawer on overlay click
    if (staffDrawerOverlay) {
        staffDrawerOverlay.addEventListener('click', closeDrawer);
    }

    // ==================== PROFILE PICTURE UPLOAD ====================
    const profilePicInput = document.getElementById('profile-input');
    const profilePreview = document.getElementById('profile-preview');
    
    if (profilePicInput && profilePreview) {
        console.log('Profile pic input found, attaching listener');
        profilePicInput.addEventListener('change', function(e) {
            console.log('File input changed', e.target.files);
            const file = e.target.files[0];
            if (file) {
                console.log('File selected:', file.name);
                const reader = new FileReader();
                reader.onload = function(event) {
                    console.log('File read complete');
                    profilePreview.innerHTML = `<img src="${event.target.result}" alt="Profile" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
                };
                reader.onerror = function(error) {
                    console.error('FileReader error:', error);
                };
                reader.readAsDataURL(file);
            }
        });
    } else {
        console.log('Profile elements not found - Input:', profilePicInput, 'Preview:', profilePreview);
    }

    // ==================== FILTER & SEARCH ====================
    const dropdownToggle = document.getElementById('statusToggle');
    const dropdownOptions = document.getElementById('statusOptions');
    const filterDropdown = document.getElementById('status-dropdown');
    const selectedText = document.getElementById('statusSelectedText');
    const searchInput = document.getElementById('search-input');
    
    let currentFilter = '';
    
    // Column map for staff table (with checkbox as column 0)
    const filterColumnMap = {
        '': null,  // All - search all columns
        'active': 4,  // Status column
        'inactive': 4
    };
    
    function performSearch() {
        const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
        const rows = document.querySelectorAll('.data-table tbody tr');
        
        rows.forEach(row => {
            if (row.classList.contains('no-data-row')) return;
            
            const cells = row.querySelectorAll('td');
            let matchSearch = false;
            let matchStatus = true;
            
            // Check status filter first
            if (currentFilter === 'active' || currentFilter === 'inactive') {
                const rowStatus = row.dataset.staffStatus;
                matchStatus = rowStatus === currentFilter;
            }
            
            // Then check search term
            if (!searchTerm) {
                matchSearch = true;
            } else {
                cells.forEach(cell => {
                    if (cell.textContent.toLowerCase().includes(searchTerm)) {
                        matchSearch = true;
                    }
                });
            }
            
            row.style.display = (matchSearch && matchStatus) ? '' : 'none';
        });
    }
    
    if (searchInput) {
        searchInput.addEventListener('input', performSearch);
    }
    
    if (dropdownToggle && dropdownOptions && filterDropdown) {
        dropdownToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            filterDropdown.classList.toggle('open');
        });
        
        dropdownOptions.querySelectorAll('.dropdown-option').forEach(option => {
            option.addEventListener('click', function() {
                dropdownOptions.querySelectorAll('.dropdown-option').forEach(opt => {
                    opt.classList.remove('selected');
                });
                this.classList.add('selected');
                
                const value = this.dataset.value;
                const text = this.textContent;
                
                selectedText.textContent = text;
                currentFilter = value;
                
                if (searchInput) {
                    searchInput.placeholder = value === 'all' ? 'Search All...' : `Search ${text}...`;
                }
                
                filterDropdown.classList.remove('open');
                performSearch();
            });
        });
        
        document.addEventListener('click', function() {
            filterDropdown.classList.remove('open');
        });
    }

    // ==================== AUTO-OPEN DRAWER FROM URL ====================
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('add') === '1') {
        openDrawer('add');
        window.history.replaceState({}, document.title, window.location.pathname);
    }

    // ==================== DELETE MODAL ====================
    const deleteModal = document.getElementById('delete-modal');
    const closeDeleteModal = document.getElementById('closeDeleteModal');
    const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    const deleteStaffNameEl = document.getElementById('deleteStaffName');

    function openDeleteModal(staffName) {
        if (deleteStaffNameEl) {
            deleteStaffNameEl.textContent = staffName;
        }
        if (deleteModal) {
            deleteModal.classList.add('show');
        }
    }

    function closeDeleteModalFn() {
        if (deleteModal) {
            deleteModal.classList.remove('show');
        }
    }

    if (closeDeleteModal) {
        closeDeleteModal.addEventListener('click', closeDeleteModalFn);
    }

    if (cancelDeleteBtn) {
        cancelDeleteBtn.addEventListener('click', closeDeleteModalFn);
    }

    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', async () => {
            if (!selectedStaffId) return;

            const result = await deleteStaffApi(selectedStaffId);
            if (result.success) {
                showToast(result.message, 'success');
                closeDeleteModalFn();
                selectedRow.remove();
                selectedStaffId = null;
                selectedRow = null;
                enableActionButtons(false);
            } else {
                showToast(result.message || 'Failed to delete staff', 'error');
            }
        });
    }

    // Close modal on overlay click
    if (deleteModal) {
        deleteModal.addEventListener('click', (e) => {
            if (e.target === deleteModal) {
                closeDeleteModalFn();
            }
        });
    }
});
