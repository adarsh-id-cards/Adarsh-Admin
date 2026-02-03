// Manage Client Page JavaScript

document.addEventListener('DOMContentLoaded', function() {
    
    // ====================
    // Filter Dropdown
    // ====================
    const dropdownToggle = document.getElementById('dropdownToggle');
    const dropdownOptions = document.getElementById('dropdownOptions');
    const selectedText = document.getElementById('selectedText');
    const searchInput = document.getElementById('searchInput');
    
    if (dropdownToggle && dropdownOptions) {
        dropdownToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            dropdownOptions.classList.toggle('show');
        });
        
        dropdownOptions.querySelectorAll('.dropdown-option').forEach(option => {
            option.addEventListener('click', function() {
                const value = this.dataset.value;
                const text = this.textContent;
                
                selectedText.textContent = text;
                
                if (searchInput) {
                    searchInput.placeholder = value === 'all' ? 'Search All...' : `Search ${text}...`;
                }
                
                dropdownOptions.querySelectorAll('.dropdown-option').forEach(opt => {
                    opt.classList.remove('selected');
                });
                this.classList.add('selected');
                
                dropdownOptions.classList.remove('show');
            });
        });
        
        document.addEventListener('click', function() {
            dropdownOptions.classList.remove('show');
        });
    }
    
    // ====================
    // Table Row Selection (Single select only)
    // ====================
    const tbody = document.getElementById('client-table-body');
    let selectedRow = null;
    let selectedClientId = null;

    if (tbody) {
        tbody.addEventListener('click', function(e) {
            const row = e.target.closest('tr');
            if (row && row.dataset.clientId && !row.classList.contains('no-data-row')) {
                // Remove selection from previous row
                if (selectedRow) {
                    selectedRow.classList.remove('selected');
                }
                
                // Select current row
                row.classList.add('selected');
                selectedRow = row;
                selectedClientId = row.dataset.clientId;
                enableActionButtons(true);
                updateActiveButtonState();
            }
        });
    }

    function enableActionButtons(enable) {
        const addBtn = document.getElementById('addClientBtn');
        const editBtn = document.getElementById('editClientBtn');
        const activeBtn = document.getElementById('activeClientBtn');
        const deleteBtn = document.getElementById('deleteClientBtn');
        const viewBtn = document.getElementById('viewClientBtn');
        const viewStaffBtn = document.getElementById('viewStaffBtn');
        
        // Add button is disabled when a row IS selected
        if (addBtn) addBtn.disabled = enable;
        // Other buttons are enabled when a row is selected
        if (editBtn) editBtn.disabled = !enable;
        if (activeBtn) activeBtn.disabled = !enable;
        if (deleteBtn) deleteBtn.disabled = !enable;
        if (viewBtn) viewBtn.disabled = !enable;
        if (viewStaffBtn) viewStaffBtn.disabled = !enable;
    }
    
    // ====================
    // Drawer Modal Logic
    // ====================
    const clientDrawer = document.getElementById('client-drawer');
    const closeClientDrawer = document.getElementById('closeClientDrawer');
    const cancelClientDrawer = document.getElementById('cancelClientDrawer');
    const clientForm = document.getElementById('clientForm');
    const drawerIcon = document.getElementById('drawerIcon');
    const drawerTitleText = document.getElementById('drawerTitleText');
    const submitClientBtn = document.getElementById('submitClientBtn');
    
    let currentMode = 'add'; // 'add', 'edit', 'view'
    
    function openDrawer(mode) {
        currentMode = mode;
        
        if (mode === 'add') {
            drawerIcon.className = 'fa-solid fa-user-plus';
            drawerTitleText.textContent = 'Add New Client';
            submitClientBtn.textContent = 'Add Client';
            submitClientBtn.style.display = 'inline-flex';
            clearForm();
            enableFormInputs(true);
        } else if (mode === 'edit') {
            drawerIcon.className = 'fa-solid fa-pen-to-square';
            drawerTitleText.textContent = 'Edit Client';
            submitClientBtn.textContent = 'Save Changes';
            submitClientBtn.style.display = 'inline-flex';
            populateFormFromRow();
            enableFormInputs(true);
        } else if (mode === 'view') {
            drawerIcon.className = 'fa-solid fa-eye';
            drawerTitleText.textContent = 'View Client Details';
            submitClientBtn.style.display = 'none';
            populateFormFromRow();
            enableFormInputs(false);
        }
        
        clientDrawer.classList.add('open');
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }
    
    function closeDrawer() {
        clientDrawer.classList.remove('open');
        document.body.style.overflow = ''; // Restore background scrolling
    }
    
    function clearForm() {
        document.getElementById('clientName').value = '';
        document.getElementById('clientAddress').value = '';
        document.getElementById('clientEmail').value = '';
        document.getElementById('clientPhone').value = '';
        
        // Reset profile preview
        const profilePreview = document.getElementById('profilePreview');
        profilePreview.innerHTML = '<i class="fa-solid fa-user"></i>';
        
        // Uncheck all permission toggles
        document.querySelectorAll('.permission-toggle-item input').forEach(cb => cb.checked = false);
    }
    
    function populateFormFromRow() {
        if (!selectedRow) return;
        
        const cells = selectedRow.querySelectorAll('td');
        document.getElementById('clientName').value = cells[0].textContent;
        document.getElementById('clientEmail').value = cells[1].textContent;
        document.getElementById('clientPhone').value = cells[2].textContent;
        document.getElementById('clientAddress').value = 'Sample Address, City, State - 123456';
        
        // Demo: randomly check some permissions
        document.querySelectorAll('.permission-toggle-item input').forEach(cb => {
            cb.checked = Math.random() > 0.5;
        });
    }
    
    function enableFormInputs(enable) {
        const inputs = clientDrawer.querySelectorAll('input, select, textarea');
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
    
    // Add button - opens drawer in add mode (no selection needed)
    const addClientBtn = document.getElementById('addClientBtn');
    if (addClientBtn) {
        addClientBtn.addEventListener('click', function() {
            openDrawer('add');
        });
    }
    
    // Edit button - opens drawer in edit mode
    const editClientBtn = document.getElementById('editClientBtn');
    if (editClientBtn) {
        editClientBtn.addEventListener('click', function() {
            if (selectedRow) {
                openDrawer('edit');
            }
        });
    }
    
    // View button - opens drawer in view mode
    const viewClientBtn = document.getElementById('viewClientBtn');
    if (viewClientBtn) {
        viewClientBtn.addEventListener('click', function() {
            if (selectedRow) {
                openDrawer('view');
            }
        });
    }
    
    // Close drawer events
    if (closeClientDrawer) {
        closeClientDrawer.addEventListener('click', closeDrawer);
    }
    if (cancelClientDrawer) {
        cancelClientDrawer.addEventListener('click', function(e) {
            e.preventDefault();
            closeDrawer();
        });
    }
    
    // Form submission
    if (clientForm) {
        clientForm.addEventListener('submit', function(e) {
            e.preventDefault();
            closeDrawer();
            console.log('Form submitted in mode:', currentMode);
        });
    }
    
    // ====================
    // Profile Picture Upload Preview
    // ====================
    const profilePicInput = document.getElementById('clientProfilePic');
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
    
    // ====================
    // Active/Inactive Toggle Button
    // ====================
    const activeClientBtn = document.getElementById('activeClientBtn');
    
    function updateActiveButtonState() {
        if (!selectedRow || !activeClientBtn) return;
        
        const statusBadge = selectedRow.querySelector('.status-badge');
        const isActive = statusBadge && statusBadge.classList.contains('active');
        
        if (isActive) {
            // Client is active, button should offer to deactivate (show red)
            activeClientBtn.innerHTML = '<i class="fa-solid fa-ban"></i> Deactivate';
            activeClientBtn.classList.remove('btn-active');
            activeClientBtn.classList.add('btn-inactive');
        } else {
            // Client is inactive, button should offer to activate (show green)
            activeClientBtn.innerHTML = '<i class="fa-solid fa-check"></i> Activate';
            activeClientBtn.classList.remove('btn-inactive');
            activeClientBtn.classList.add('btn-active');
        }
    }
    
    if (activeClientBtn) {
        activeClientBtn.addEventListener('click', function() {
            if (!selectedRow) return;
            
            const statusBadge = selectedRow.querySelector('.status-badge');
            if (!statusBadge) return;
            
            const isActive = statusBadge.classList.contains('active');
            
            if (isActive) {
                // Deactivate
                statusBadge.classList.remove('active');
                statusBadge.classList.add('inactive');
                statusBadge.textContent = 'Inactive';
            } else {
                // Activate
                statusBadge.classList.remove('inactive');
                statusBadge.classList.add('active');
                statusBadge.textContent = 'Active';
            }
            
            updateActiveButtonState();
            console.log('Status toggled for:', selectedRow.querySelector('td').textContent);
        });
    }
    
    // ====================
    // Delete Button
    // ====================
    const deleteClientBtn = document.getElementById('deleteClientBtn');
    if (deleteClientBtn) {
        deleteClientBtn.addEventListener('click', function() {
            if (!selectedRow) return;
            
            const clientName = selectedRow.querySelector('td').textContent;
            if (confirm(`Are you sure you want to delete "${clientName}"?`)) {
                selectedRow.remove();
                selectedRow = null;
                enableActionButtons(false);
                console.log('Deleted client:', clientName);
            }
        });
    }
    
    // ====================
    // View Staff Drawer
    // ====================
    const viewStaffDrawer = document.getElementById('viewStaffDrawer');
    const viewStaffBtn = document.getElementById('viewStaffBtn');
    const closeStaffDrawer = document.getElementById('closeStaffDrawer');
    const closeStaffDrawerBtn = document.getElementById('closeStaffDrawerBtn');
    const staffClientName = document.getElementById('staffClientName');
    const staffList = document.getElementById('staffList');
    const noStaffMessage = document.getElementById('noStaffMessage');
    const totalStaffCount = document.getElementById('totalStaffCount');
    const activeStaffCount = document.getElementById('activeStaffCount');
    const inactiveStaffCount = document.getElementById('inactiveStaffCount');
    
    // Mock staff data for demo with more details
    const mockStaffData = {
        'roshan': [
            { 
                name: 'Amit Kumar', 
                role: 'Manager', 
                email: 'amit@example.com', 
                phone: '9876543210',
                status: 'active',
                createdAt: '15-01-2026',
                lastLogin: '01-02-2026 10:30 AM',
                permissions: ['Id Card Add', 'Id Card Edit', 'Id Card Verify']
            },
            { 
                name: 'Priya Singh', 
                role: 'Data Entry', 
                email: 'priya@example.com', 
                phone: '9876543211',
                status: 'active',
                createdAt: '20-01-2026',
                lastLogin: '31-01-2026 04:15 PM',
                permissions: ['Id Card Add', 'Id Card Edit']
            }
        ],
        'Sant Hirdaram Medical College (SHMC)': [
            { 
                name: 'Dr. Rajesh Sharma', 
                role: 'Coordinator', 
                email: 'rajesh@shmc.com', 
                phone: '9876543212',
                status: 'active',
                createdAt: '21-01-2026',
                lastLogin: '01-02-2026 09:00 AM',
                permissions: ['Id Card Add', 'Id Card Edit', 'Id Card Delete', 'Id Card Verify', 'Id Card Approve']
            },
            { 
                name: 'Sunita Verma', 
                role: 'Admin Staff', 
                email: 'sunita@shmc.com', 
                phone: '9876543213',
                status: 'active',
                createdAt: '22-01-2026',
                lastLogin: '01-02-2026 11:45 AM',
                permissions: ['Id Card Add', 'Id Card Edit', 'Id Card Verify']
            },
            { 
                name: 'Vikram Patel', 
                role: 'Data Entry', 
                email: 'vikram@shmc.com', 
                phone: '9876543214',
                status: 'inactive',
                createdAt: '25-01-2026',
                lastLogin: '28-01-2026 02:30 PM',
                permissions: ['Id Card Add']
            }
        ],
        'Umang Nasha Mukti Kendra': [],
        'Mansarovar Global University': [
            { 
                name: 'Prof. Anil Gupta', 
                role: 'HOD', 
                email: 'anil@mgu.com', 
                phone: '9876543215',
                status: 'active',
                createdAt: '30-12-2025',
                lastLogin: '31-01-2026 06:00 PM',
                permissions: ['Id Card Add', 'Id Card Edit', 'Id Card Delete', 'Id Card Verify', 'Id Card Approve', 'Bulk Upload']
            }
        ]
    };
    
    function openStaffDrawer() {
        if (!selectedRow) return;
        
        const clientName = selectedRow.querySelector('td').textContent;
        staffClientName.textContent = clientName;
        
        const staffData = mockStaffData[clientName] || [];
        
        // Update summary counts
        const activeCount = staffData.filter(s => s.status === 'active').length;
        const inactiveCount = staffData.filter(s => s.status === 'inactive').length;
        
        totalStaffCount.textContent = staffData.length;
        activeStaffCount.textContent = activeCount;
        inactiveStaffCount.textContent = inactiveCount;
        
        if (staffData.length === 0) {
            staffList.style.display = 'none';
            noStaffMessage.style.display = 'flex';
        } else {
            staffList.style.display = 'flex';
            noStaffMessage.style.display = 'none';
            
            staffList.innerHTML = staffData.map(staff => `
                <div class="staff-card">
                    <div class="staff-card-header">
                        <div class="staff-avatar ${staff.status}">
                            <i class="fa-solid fa-user"></i>
                        </div>
                        <div class="staff-main-info">
                            <div class="staff-name">${staff.name}</div>
                            <div class="staff-role">${staff.role}</div>
                        </div>
                        <span class="staff-status-badge ${staff.status}">${staff.status === 'active' ? 'Active' : 'Inactive'}</span>
                    </div>
                    <div class="staff-card-body">
                        <div class="staff-detail-row">
                            <div class="staff-detail">
                                <i class="fa-solid fa-envelope"></i>
                                <span>${staff.email}</span>
                            </div>
                            <div class="staff-detail">
                                <i class="fa-solid fa-phone"></i>
                                <span>${staff.phone}</span>
                            </div>
                        </div>
                        <div class="staff-detail-row">
                            <div class="staff-detail">
                                <i class="fa-solid fa-calendar-plus"></i>
                                <span>Created: ${staff.createdAt}</span>
                            </div>
                            <div class="staff-detail">
                                <i class="fa-solid fa-clock"></i>
                                <span>Last Login: ${staff.lastLogin}</span>
                            </div>
                        </div>
                        <div class="staff-permissions">
                            <div class="permissions-label"><i class="fa-solid fa-shield-halved"></i> Permissions:</div>
                            <div class="permissions-tags">
                                ${staff.permissions.map(p => `<span class="permission-tag">${p}</span>`).join('')}
                            </div>
                        </div>
                    </div>
                </div>
            `).join('');
        }
        
        viewStaffDrawer.classList.add('open');
        document.body.style.overflow = 'hidden';
    }
    
    function closeStaffDrawerFn() {
        viewStaffDrawer.classList.remove('open');
        document.body.style.overflow = '';
    }
    
    if (viewStaffBtn) {
        viewStaffBtn.addEventListener('click', openStaffDrawer);
    }
    if (closeStaffDrawer) {
        closeStaffDrawer.addEventListener('click', closeStaffDrawerFn);
    }
    if (closeStaffDrawerBtn) {
        closeStaffDrawerBtn.addEventListener('click', closeStaffDrawerFn);
    }
    
    // Close drawer on overlay click
    if (viewStaffDrawer) {
        viewStaffDrawer.addEventListener('click', function(e) {
            if (e.target === viewStaffDrawer) {
                closeStaffDrawerFn();
            }
        });
    }
});
