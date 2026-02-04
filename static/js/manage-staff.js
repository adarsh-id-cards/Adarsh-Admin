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
    
    // Profile and password elements (used in drawer)
    const profilePicInput = document.getElementById('profile-input');
    const profilePreview = document.getElementById('profile-preview');
    const profilePathDisplay = document.getElementById('staff-profile-path');
    const togglePasswordBtn = document.getElementById('toggle-password');
    const passwordInput = document.getElementById('staff-password');
    const passwordRequired = document.getElementById('password-required');
    
    let selectedStaffId = null;
    let selectedRow = null;
    let currentMode = 'add';
    let selectedProfileFile = null; // Store the selected file for upload

    // ==================== TOAST FUNCTIONS ====================
    // Using shared showToast from utils.js

    // ==================== ROW SELECTION ====================
    
    function selectStaffRow(row) {
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
        if (checkbox) {
            checkbox.checked = true;
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
        // Row click - select row and check checkbox
        tbody.addEventListener('click', function(e) {
            // If clicking directly on checkbox, let the change handler deal with it
            if (e.target.type === 'checkbox') return;
            
            const row = e.target.closest('tr');
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
        
        // Reset profile preview and file
        selectedProfileFile = null;
        if (profilePreview) {
            profilePreview.innerHTML = '<i class="fa-solid fa-user"></i>';
            profilePreview.classList.remove('has-image');
        }
        if (profilePicInput) profilePicInput.value = '';
        
        // Reset path display
        if (profilePathDisplay) {
            profilePathDisplay.textContent = 'No image';
            profilePathDisplay.classList.remove('has-path', 'not-found');
            profilePathDisplay.classList.add('no-path');
        }
        
        // Reset all permission toggles to unchecked
        permissionFields.forEach(field => {
            const el = document.getElementById(field);
            if (el) el.checked = false;
        });
        
        const submitBtnText = document.getElementById('submit-btn-text');
        const passwordField = document.getElementById('staff-password');
        const passwordWrapper = passwordField ? passwordField.closest('.form-group') : null;
        
        if (mode === 'add') {
            drawerTitle.textContent = 'Add New Staff';
            drawerIcon.className = 'fa-solid fa-user-plus';
            if (submitBtnText) submitBtnText.textContent = 'Add Staff';
            submitBtn.style.display = 'inline-flex';
            enableFormInputs(true);
            // Password required on add
            if (passwordField) {
                passwordField.required = true;
                passwordField.placeholder = 'Enter password';
            }
            if (passwordRequired) passwordRequired.style.display = '';
        } else if (mode === 'edit') {
            drawerTitle.textContent = 'Edit Staff';
            drawerIcon.className = 'fa-solid fa-pen-to-square';
            if (submitBtnText) submitBtnText.textContent = 'Save Changes';
            submitBtn.style.display = 'inline-flex';
            enableFormInputs(true);
            // Password optional on edit
            if (passwordField) {
                passwordField.required = false;
                passwordField.placeholder = 'Leave blank to keep current';
            }
            if (passwordRequired) passwordRequired.style.display = 'none';
            
            if (staffData) {
                document.getElementById('staff-name').value = staffData.name || '';
                document.getElementById('staff-email').value = staffData.email || '';
                document.getElementById('staff-phone').value = staffData.phone || '';
                document.getElementById('staff-address').value = staffData.address || '';
                document.getElementById('staff-status').value = staffData.status === 'active' ? 'true' : 'false';
                
                // Load existing photo if available
                if (staffData.profile_image_url && profilePreview) {
                    profilePreview.innerHTML = `<img src="${staffData.profile_image_url}" alt="Profile" style="width: 100%; height: 100%; object-fit: cover;">`;
                    profilePreview.classList.add('has-image');
                    // Update path display
                    if (profilePathDisplay) {
                        profilePathDisplay.textContent = staffData.profile_image_url;
                        profilePathDisplay.classList.remove('no-path', 'not-found');
                        profilePathDisplay.classList.add('has-path');
                    }
                }
                
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
            // Hide password field in view mode
            if (passwordWrapper) passwordWrapper.style.display = 'none';
            
            if (staffData) {
                document.getElementById('staff-name').value = staffData.name || '';
                document.getElementById('staff-email').value = staffData.email || '';
                document.getElementById('staff-phone').value = staffData.phone || '';
                document.getElementById('staff-address').value = staffData.address || '';
                document.getElementById('staff-status').value = staffData.status === 'active' ? 'true' : 'false';
                
                // Load existing photo if available
                if (staffData.profile_image_url && profilePreview) {
                    profilePreview.innerHTML = `<img src="${staffData.profile_image_url}" alt="Profile" style="width: 100%; height: 100%; object-fit: cover;">`;
                    profilePreview.classList.add('has-image');
                    // Update path display
                    if (profilePathDisplay) {
                        profilePathDisplay.textContent = staffData.profile_image_url;
                        profilePathDisplay.classList.remove('no-path', 'not-found');
                        profilePathDisplay.classList.add('has-path');
                    }
                }
                
                // Set permissions from staff data
                permissionFields.forEach(field => {
                    const el = document.getElementById(field);
                    const apiField = field.replace(/-/g, '_');
                    if (el) el.checked = staffData[apiField] === true;
                });
            }
        }
        
        // Show password field if not view mode
        if (mode !== 'view' && passwordWrapper) {
            passwordWrapper.style.display = '';
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
    
    async function createStaff(formData, file = null) {
        try {
            // Use FormData if there's a file to upload
            if (file) {
                const data = new FormData();
                data.append('profile_image', file);
                // Add all other form fields
                Object.keys(formData).forEach(key => {
                    data.append(key, typeof formData[key] === 'boolean' ? (formData[key] ? 'true' : 'false') : formData[key]);
                });
                const response = await fetch('/api/staff/create/', {
                    method: 'POST',
                    body: data
                });
                return await response.json();
            } else {
                const response = await fetch('/api/staff/create/', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
                return await response.json();
            }
        } catch (error) {
            return { success: false, message: 'Network error. Please try again.' };
        }
    }
    
    async function updateStaff(staffId, formData, file = null) {
        try {
            // Use FormData if there's a file to upload
            if (file) {
                const data = new FormData();
                data.append('profile_image', file);
                // Add all other form fields
                Object.keys(formData).forEach(key => {
                    data.append(key, typeof formData[key] === 'boolean' ? (formData[key] ? 'true' : 'false') : formData[key]);
                });
                const response = await fetch(`/api/staff/${staffId}/update/`, {
                    method: 'POST',
                    body: data
                });
                return await response.json();
            } else {
                const response = await fetch(`/api/staff/${staffId}/update/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
                return await response.json();
            }
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
            if (!selectedStaffId || !selectedRow) {
                return;
            }
            
            // Name is in the 2nd column (index 1), not first (checkbox is first)
            const staffName = selectedRow.querySelector('td:nth-child(2)').textContent;
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
            
            // Prevent double submission
            const submitBtn = staffForm.querySelector('button[type="submit"]');
            if (submitBtn.disabled) return;
            submitBtn.disabled = true;
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';
            
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
            
            try {
                if (currentMode === 'edit' && selectedStaffId) {
                    result = await updateStaff(selectedStaffId, formData, selectedProfileFile);
                } else {
                    result = await createStaff(formData, selectedProfileFile);
                }
                
                if (result.success) {
                    showToast(result.message, 'success');
                    selectedProfileFile = null; // Reset after successful upload
                    closeDrawer();
                    setTimeout(() => location.reload(), 500);
                } else {
                    showToast(result.message || 'Operation failed', 'error');
                    // Re-enable button on error
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalText;
                }
            } catch (error) {
                showToast('An error occurred', 'error');
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
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

    // ==================== PASSWORD TOGGLE ====================
    if (togglePasswordBtn && passwordInput) {
        togglePasswordBtn.addEventListener('click', function() {
            const type = passwordInput.type === 'password' ? 'text' : 'password';
            passwordInput.type = type;
            const icon = this.querySelector('i');
            if (icon) {
                icon.className = type === 'password' ? 'fa-solid fa-eye' : 'fa-solid fa-eye-slash';
            }
        });
    }

    // ==================== SELECT ALL CHECKBOX ====================
    const selectAllCheckbox = document.getElementById('select-all-checkbox');
    
    if (selectAllCheckbox && tbody) {
        selectAllCheckbox.addEventListener('change', function() {
            const checkboxes = tbody.querySelectorAll('.row-checkbox');
            checkboxes.forEach(cb => {
                cb.checked = this.checked;
            });
            
            // If checked, select first row; if unchecked, clear selection
            if (this.checked) {
                const firstRow = tbody.querySelector('tr[data-staff-id]');
                if (firstRow) selectStaffRow(firstRow);
            } else {
                clearStaffSelection();
            }
        });
    }

    // ==================== PROFILE PICTURE UPLOAD ====================
    if (profilePicInput && profilePreview) {
        profilePicInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                // Validate file size (max 2MB)
                if (file.size > 2 * 1024 * 1024) {
                    showToast('Image size must be less than 2MB', 'error');
                    profilePicInput.value = '';
                    return;
                }
                
                // Validate file type
                if (!file.type.startsWith('image/')) {
                    showToast('Please select a valid image file', 'error');
                    profilePicInput.value = '';
                    return;
                }
                
                selectedProfileFile = file;
                const reader = new FileReader();
                reader.onload = function(event) {
                    profilePreview.innerHTML = `<img src="${event.target.result}" alt="Profile" style="width: 100%; height: 100%; object-fit: cover;">`;
                    profilePreview.classList.add('has-image');
                    // Update path display
                    if (profilePathDisplay) {
                        profilePathDisplay.textContent = file.name;
                        profilePathDisplay.classList.remove('no-path', 'not-found');
                        profilePathDisplay.classList.add('has-path');
                    }
                };
                reader.onerror = function(error) {
                    console.error('FileReader error:', error);
                    showToast('Failed to read image file', 'error');
                };
                reader.readAsDataURL(file);
            }
        });
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
                    searchInput.placeholder = value === '' ? 'Search All...' : `Search ${text}...`;
                }
                
                filterDropdown.classList.remove('open');
                // Will be overridden by performSearchWithPagination later
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
            document.body.style.overflow = 'hidden';
        }
    }

    function closeDeleteModalFn() {
        if (deleteModal) {
            deleteModal.classList.remove('show');
            document.body.style.overflow = '';
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

    // ==================== PAGINATION ====================
    const rowCountEl = document.getElementById('row-count');
    const pageNumbersEl = document.getElementById('page-numbers');
    const firstPageBtn = document.getElementById('firstPage');
    const prevPageBtn = document.getElementById('prevPage');
    const nextPageBtn = document.getElementById('nextPage');
    const lastPageBtn = document.getElementById('lastPage');
    const rowsDropdown = document.getElementById('rowsDropdown');
    const rowsToggle = document.getElementById('rowsToggle');
    const rowsOptions = document.getElementById('rowsOptions');
    const rowsSelectedText = document.getElementById('rowsSelectedText');
    
    let currentPage = 1;
    let rowsPerPage = 10;
    let allRows = [];
    let filteredRows = [];
    
    function initPagination() {
        if (!tbody) return;
        
        // Get all data rows (exclude no-data row)
        allRows = Array.from(tbody.querySelectorAll('tr:not(.no-data-row)'));
        filteredRows = [...allRows];
        
        updatePagination();
    }
    
    function updatePagination() {
        // Filter rows based on search and filter criteria
        filteredRows = allRows.filter(row => row.style.display !== 'none');
        
        const totalRows = filteredRows.length;
        const totalPages = Math.max(1, Math.ceil(totalRows / rowsPerPage));
        
        // Ensure current page is valid
        if (currentPage > totalPages) currentPage = totalPages;
        if (currentPage < 1) currentPage = 1;
        
        const startIndex = (currentPage - 1) * rowsPerPage;
        const endIndex = Math.min(startIndex + rowsPerPage, totalRows);
        
        // Hide all rows first, then show only current page
        allRows.forEach(row => {
            row.style.display = 'none';
        });
        
        filteredRows.slice(startIndex, endIndex).forEach(row => {
            row.style.display = '';
        });
        
        // Update row count text
        if (rowCountEl) {
            if (totalRows === 0) {
                rowCountEl.innerHTML = 'Showing <strong>0</strong> results';
            } else {
                rowCountEl.innerHTML = `Showing <strong>${startIndex + 1}-${endIndex}</strong> of <strong>${totalRows}</strong> results`;
            }
        }
        
        // Update page numbers
        if (pageNumbersEl) {
            pageNumbersEl.innerHTML = '';
            const maxVisiblePages = 5;
            let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
            let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
            
            if (endPage - startPage < maxVisiblePages - 1) {
                startPage = Math.max(1, endPage - maxVisiblePages + 1);
            }
            
            for (let i = startPage; i <= endPage; i++) {
                const pageBtn = document.createElement('button');
                pageBtn.className = 'page-num' + (i === currentPage ? ' active' : '');
                pageBtn.textContent = i;
                pageBtn.addEventListener('click', () => goToPage(i));
                pageNumbersEl.appendChild(pageBtn);
            }
        }
        
        // Update button states
        if (firstPageBtn) firstPageBtn.disabled = currentPage === 1;
        if (prevPageBtn) prevPageBtn.disabled = currentPage === 1;
        if (nextPageBtn) nextPageBtn.disabled = currentPage === totalPages;
        if (lastPageBtn) lastPageBtn.disabled = currentPage === totalPages;
    }
    
    function goToPage(page) {
        currentPage = page;
        clearStaffSelection();
        updatePagination();
    }
    
    // Pagination button events
    if (firstPageBtn) firstPageBtn.addEventListener('click', () => goToPage(1));
    if (prevPageBtn) prevPageBtn.addEventListener('click', () => goToPage(currentPage - 1));
    if (nextPageBtn) nextPageBtn.addEventListener('click', () => goToPage(currentPage + 1));
    if (lastPageBtn) {
        lastPageBtn.addEventListener('click', () => {
            const totalPages = Math.ceil(filteredRows.length / rowsPerPage);
            goToPage(totalPages);
        });
    }
    
    // Rows per page dropdown
    if (rowsDropdown && rowsToggle && rowsOptions) {
        rowsToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            rowsDropdown.classList.toggle('open');
        });
        
        rowsOptions.querySelectorAll('.dropdown-option').forEach(option => {
            option.addEventListener('click', function() {
                rowsOptions.querySelectorAll('.dropdown-option').forEach(opt => {
                    opt.classList.remove('selected');
                });
                this.classList.add('selected');
                
                rowsPerPage = parseInt(this.dataset.value);
                if (rowsSelectedText) rowsSelectedText.textContent = rowsPerPage;
                
                currentPage = 1;
                rowsDropdown.classList.remove('open');
                updatePagination();
            });
        });
        
        document.addEventListener('click', function(e) {
            if (!rowsDropdown.contains(e.target)) {
                rowsDropdown.classList.remove('open');
            }
        });
    }
    
    // Override performSearch to integrate with pagination
    const originalPerformSearch = performSearch;
    function performSearchWithPagination() {
        const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
        
        // Reset visibility for pagination recalculation
        allRows.forEach(row => {
            const cells = row.querySelectorAll('td');
            let matchSearch = false;
            let matchStatus = true;
            
            // Check status filter
            if (currentFilter === 'active' || currentFilter === 'inactive') {
                const rowStatus = row.dataset.staffStatus;
                matchStatus = rowStatus === currentFilter;
            }
            
            // Check search term
            if (!searchTerm) {
                matchSearch = true;
            } else {
                cells.forEach(cell => {
                    if (cell.textContent.toLowerCase().includes(searchTerm)) {
                        matchSearch = true;
                    }
                });
            }
            
            // Mark row as filtered or not (using data attribute instead of display)
            row.dataset.filtered = (matchSearch && matchStatus) ? 'true' : 'false';
            row.style.display = (matchSearch && matchStatus) ? '' : 'none';
        });
        
        // Reset to page 1 and update pagination
        currentPage = 1;
        updatePagination();
    }
    
    // Override the original performSearch globally
    performSearch = performSearchWithPagination;
    
    // Replace search handler
    if (searchInput) {
        searchInput.removeEventListener('input', originalPerformSearch);
        searchInput.addEventListener('input', performSearchWithPagination);
    }
    
    // Initialize pagination on page load
    initPagination();
});
