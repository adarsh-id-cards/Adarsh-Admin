// Manage Staff Page JavaScript

document.addEventListener('DOMContentLoaded', function() {
    
    // ==================== ELEMENTS ====================
    const staffDrawer = document.getElementById('staff-drawer');
    const staffForm = document.getElementById('staffForm');
    const drawerTitle = document.getElementById('drawerTitleText');
    const drawerIcon = document.getElementById('drawerIcon');
    const submitBtn = document.getElementById('submitStaffBtn');
    
    const addStaffBtn = document.getElementById('addStaffBtn');
    const editStaffBtn = document.getElementById('editStaffBtn');
    const viewStaffBtn = document.getElementById('viewStaffBtn');
    const deleteStaffBtn = document.getElementById('deleteStaffBtn');
    const activeStaffBtn = document.getElementById('activeStaffBtn');
    
    const closeStaffDrawer = document.getElementById('closeStaffDrawer');
    const cancelStaffDrawer = document.getElementById('cancelStaffDrawer');
    
    const table = document.getElementById('staffTable');
    const tbody = table ? table.querySelector('tbody') : null;
    
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
    if (tbody) {
        tbody.addEventListener('click', function(e) {
            const row = e.target.closest('tr');
            if (row && row.dataset.staffId) {
                // Remove selection from all rows
                tbody.querySelectorAll('tr').forEach(r => r.classList.remove('selected'));
                // Select current row
                row.classList.add('selected');
                selectedRow = row;
                selectedStaffId = row.dataset.staffId;
                enableActionButtons(true);
                updateActiveButtonState();
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
        'perm_staff_list', 'perm_staff_add', 'perm_staff_edit', 'perm_staff_delete', 'perm_staff_status',
        'perm_idcard_setting_list', 'perm_idcard_setting_add', 'perm_idcard_setting_edit', 
        'perm_idcard_setting_delete', 'perm_idcard_setting_status'
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
        
        if (mode === 'add') {
            drawerTitle.textContent = 'Add New Staff';
            drawerIcon.className = 'fa-solid fa-user-plus';
            submitBtn.textContent = 'Add Staff';
            submitBtn.style.display = 'inline-flex';
            enableFormInputs(true);
        } else if (mode === 'edit') {
            drawerTitle.textContent = 'Edit Staff';
            drawerIcon.className = 'fa-solid fa-pen-to-square';
            submitBtn.textContent = 'Save Changes';
            submitBtn.style.display = 'inline-flex';
            enableFormInputs(true);
            
            if (staffData) {
                document.getElementById('staffName').value = staffData.name || '';
                document.getElementById('staffEmail').value = staffData.email || '';
                document.getElementById('staffPhone').value = staffData.phone || '';
                document.getElementById('staffAddress').value = staffData.address || '';
                
                // Set permissions from staff data
                permissionFields.forEach(field => {
                    const el = document.getElementById(field);
                    if (el) el.checked = staffData[field] === true;
                });
            }
        } else if (mode === 'view') {
            drawerTitle.textContent = 'View Staff Details';
            drawerIcon.className = 'fa-solid fa-eye';
            submitBtn.style.display = 'none';
            enableFormInputs(false);
            
            if (staffData) {
                document.getElementById('staffName').value = staffData.name || '';
                document.getElementById('staffEmail').value = staffData.email || '';
                document.getElementById('staffPhone').value = staffData.phone || '';
                document.getElementById('staffAddress').value = staffData.address || '';
                
                // Set permissions from staff data
                permissionFields.forEach(field => {
                    const el = document.getElementById(field);
                    if (el) el.checked = staffData[field] === true;
                });
            }
        }
        
        staffDrawer.classList.add('open');
        document.body.style.overflow = 'hidden';
    }
    
    function closeDrawer() {
        staffDrawer.classList.remove('open');
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
                name: document.getElementById('staffName').value,
                email: document.getElementById('staffEmail').value,
                phone: document.getElementById('staffPhone').value,
                address: document.getElementById('staffAddress').value,
            };
            
            // Add all permissions
            permissionFields.forEach(field => {
                const el = document.getElementById(field);
                if (el) formData[field] = el.checked;
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
    if (staffDrawer) {
        staffDrawer.addEventListener('click', function(e) {
            if (e.target === staffDrawer) {
                closeDrawer();
            }
        });
    }

    // ==================== PROFILE PICTURE UPLOAD ====================
    const profilePicInput = document.getElementById('staffProfilePic');
    const profilePreview = document.getElementById('profilePreview');
    
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
    const dropdownToggle = document.getElementById('dropdownToggle');
    const dropdownOptions = document.getElementById('dropdownOptions');
    const filterDropdown = document.getElementById('filterDropdown');
    const selectedText = document.getElementById('selectedText');
    const searchInput = document.getElementById('searchInput');
    
    let currentFilter = 'all';
    
    const filterColumnMap = {
        'all': null,
        'name': 0,
        'email': 1,
        'mobile': 2
    };
    
    function performSearch() {
        const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
        const rows = document.querySelectorAll('.table-container tbody tr');
        
        rows.forEach(row => {
            if (row.classList.contains('no-data-row')) return;
            
            const cells = row.querySelectorAll('td');
            let match = false;
            
            if (currentFilter === 'all' || !searchTerm) {
                cells.forEach(cell => {
                    if (cell.textContent.toLowerCase().includes(searchTerm)) {
                        match = true;
                    }
                });
            } else {
                const columnIndex = filterColumnMap[currentFilter];
                if (columnIndex !== null && cells[columnIndex]) {
                    const cellText = cells[columnIndex].textContent.toLowerCase();
                    match = cellText.includes(searchTerm);
                }
            }
            
            row.style.display = match ? '' : 'none';
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
