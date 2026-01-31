// All Client Page JavaScript

document.addEventListener('DOMContentLoaded', function() {
    
    // Filter Dropdown
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
                
                // Update search placeholder
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
        
        // Close dropdown when clicking outside
        document.addEventListener('click', function() {
            dropdownOptions.classList.remove('show');
        });
    }
    
    // Table Row Selection
    const tableRows = document.querySelectorAll('.table-container tbody tr');
    let selectedRow = null;
    
    tableRows.forEach(row => {
        row.addEventListener('click', function() {
            // Remove selection from previous row
            if (selectedRow) {
                selectedRow.classList.remove('selected');
            }
            
            // Select current row
            this.classList.add('selected');
            selectedRow = this;
            
            // Enable action buttons
            enableActionButtons(true);
        });
    });
    
    function enableActionButtons(enable) {
        const editBtn = document.getElementById('editClientBtn');
        const activeBtn = document.getElementById('activeClientBtn');
        const deleteBtn = document.getElementById('deleteClientBtn');
        const viewBtn = document.getElementById('viewClientBtn');
        const viewStaffBtn = document.getElementById('viewStaffBtn');
        
        if (editBtn) editBtn.disabled = !enable;
        if (activeBtn) activeBtn.disabled = !enable;
        if (deleteBtn) deleteBtn.disabled = !enable;
        if (viewBtn) viewBtn.disabled = !enable;
        if (viewStaffBtn) viewStaffBtn.disabled = !enable;
    }
    
    // Add Client Button
    const addClientBtn = document.getElementById('addClientBtn');
    if (addClientBtn) {
        addClientBtn.addEventListener('click', function() {
            // TODO: Open add client modal/form
            console.log('Add client clicked');
        });
    }
    
    // Edit Client Button
    const editClientBtn = document.getElementById('editClientBtn');
    if (editClientBtn) {
        editClientBtn.addEventListener('click', function() {
            if (selectedRow) {
                // TODO: Open edit client modal/form with selected row data
                console.log('Edit client clicked', selectedRow);
            }
        });
    }
    
    // Delete Client Button
    const deleteClientBtn = document.getElementById('deleteClientBtn');
    if (deleteClientBtn) {
        deleteClientBtn.addEventListener('click', function() {
            if (selectedRow) {
                // TODO: Show confirmation and delete client
                console.log('Delete client clicked', selectedRow);
            }
        });
    }
    
    // View Client Button
    const viewClientBtn = document.getElementById('viewClientBtn');
    if (viewClientBtn) {
        viewClientBtn.addEventListener('click', function() {
            if (selectedRow) {
                // TODO: Navigate to client details page
                console.log('View client clicked', selectedRow);
            }
        });
    }
    
    // View Staff Button
    const viewStaffBtn = document.getElementById('viewStaffBtn');
    if (viewStaffBtn) {
        viewStaffBtn.addEventListener('click', function() {
            if (selectedRow) {
                // TODO: Navigate to staff page for this client
                console.log('View staff clicked', selectedRow);
            }
        });
    }
    
    // Active Client Button
    const activeClientBtn = document.getElementById('activeClientBtn');
    if (activeClientBtn) {
        activeClientBtn.addEventListener('click', function() {
            if (selectedRow) {
                // TODO: Toggle client active status
                console.log('Toggle active clicked', selectedRow);
            }
        });
    }
});
