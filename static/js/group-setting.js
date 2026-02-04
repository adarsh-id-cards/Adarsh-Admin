// Group Setting Page JavaScript - Table Layout

document.addEventListener('DOMContentLoaded', function() {

    // ==================== ELEMENTS ====================
    const tablesBody = document.getElementById('tablesBody');
    
    const addBtn = document.getElementById('addBtn');
    const editBtn = document.getElementById('editBtn');
    const viewBtn = document.getElementById('viewBtn');
    const deleteBtn = document.getElementById('deleteBtn');
    const toggleStatusBtn = document.getElementById('toggle-status-btn');
    
    const addDrawer = document.getElementById('add-drawer');
    const closeDrawer = document.getElementById('closeDrawer');
    const cancelDrawer = document.getElementById('cancelDrawer');
    const saveDrawer = document.getElementById('saveDrawer');
    const drawerTitle = document.getElementById('drawerTitle');
    const drawerIcon = document.getElementById('drawerIcon');
    const tableNameInput = document.getElementById('tableName');
    const fieldList = document.getElementById('field-list');
    const fieldCountSpan = document.getElementById('fieldCount');
    const noFieldsMessage = document.getElementById('no-fields-message');
    const addFieldSection = document.querySelector('.add-field-section');
    
    const newFieldName = document.getElementById('new-field-name');
    const newFieldType = document.getElementById('new-field-type');
    const addFieldBtn = document.getElementById('add-field-btn');
    
    const statusModal = document.getElementById('status-modal');
    const modalClose = document.getElementById('modal-close');
    const modalCancel = document.getElementById('modal-cancel');
    const modalConfirm = document.getElementById('modal-confirm');
    const modalMessage = document.getElementById('modal-message');
    const modalIcon = document.getElementById('modalIcon');
    
    const deleteModal = document.getElementById('delete-modal');
    const closeDeleteModal = document.getElementById('closeDeleteModal');
    const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    const deleteTableName = document.getElementById('deleteTableName');
    
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    
    const searchInput = document.getElementById('searchInput');
    const filterDropdown = document.getElementById('filterDropdown');
    const dropdownToggle = document.getElementById('dropdownToggle');
    const dropdownOptions = document.getElementById('dropdownOptions');
    const selectedText = document.getElementById('selectedText');
    
    let selectedRow = null;
    let selectedTableId = null;
    let currentMode = 'add';
    let currentFields = [];
    const MAX_FIELDS = 20;

    const groupId = typeof GROUP_ID !== 'undefined' ? GROUP_ID : null;

    // ==================== TOAST FUNCTIONS ====================
    // Using shared showToast from utils.js

    function updateFieldCount() {
        if (fieldCountSpan) fieldCountSpan.textContent = currentFields.length;
        if (noFieldsMessage) noFieldsMessage.style.display = currentFields.length === 0 ? 'block' : 'none';
        if (addFieldBtn) addFieldBtn.disabled = currentFields.length >= MAX_FIELDS;
    }

    // ==================== ROW SELECTION ====================
    if (tablesBody) {
        tablesBody.addEventListener('click', function(e) {
            // Handle download button click
            if (e.target.closest('.download-btn')) {
                e.stopPropagation();
                const btn = e.target.closest('.download-btn');
                const tableId = btn.dataset.tableId;
                downloadTableFields(tableId);
                return;
            }
            
            const row = e.target.closest('tr');
            if (!row || !row.dataset.tableId || row.classList.contains('no-data-row')) return;
            
            if (selectedRow === row) {
                row.classList.remove('selected');
                selectedRow = null;
                selectedTableId = null;
            } else {
                if (selectedRow) selectedRow.classList.remove('selected');
                row.classList.add('selected');
                selectedRow = row;
                selectedTableId = row.dataset.tableId;
            }
            updateActionButtons();
        });
    }

    function updateActionButtons() {
        const hasSelection = selectedRow !== null;
        if (editBtn) editBtn.disabled = !hasSelection;
        if (viewBtn) viewBtn.disabled = !hasSelection;
        if (deleteBtn) deleteBtn.disabled = !hasSelection;
        if (toggleStatusBtn) toggleStatusBtn.disabled = !hasSelection;
        
        // Update toggle status button text and class based on current status
        if (hasSelection && toggleStatusBtn) {
            const currentStatus = selectedRow.dataset.tableStatus;
            if (currentStatus === 'active') {
                // Row is Active, so button should show "Inactive" to deactivate
                toggleStatusBtn.innerHTML = '<i class="fa-solid fa-times"></i> Inactive';
                toggleStatusBtn.classList.remove('btn-active');
                toggleStatusBtn.classList.add('btn-inactive');
            } else {
                // Row is Inactive, so button should show "Active" to activate
                toggleStatusBtn.innerHTML = '<i class="fa-solid fa-check"></i> Active';
                toggleStatusBtn.classList.remove('btn-inactive');
                toggleStatusBtn.classList.add('btn-active');
            }
        } else if (toggleStatusBtn) {
            toggleStatusBtn.innerHTML = '<i class="fa-solid fa-check"></i> Active';
            toggleStatusBtn.classList.remove('btn-inactive');
            toggleStatusBtn.classList.add('btn-active');
        }
    }

    // ==================== DOWNLOAD EXCEL FUNCTION ====================
    async function downloadTableFields(tableId) {
        try {
            const response = await fetch(`/api/table/${tableId}/`);
            const data = await response.json();
            
            if (!data.success) {
                showToast(data.message || 'Error fetching table data', 'error');
                return;
            }
            
            const table = data.table;
            const fields = table.fields || [];
            
            if (fields.length === 0) {
                showToast('No fields to download!', 'error');
                return;
            }
            
            // Create Excel workbook using SheetJS
            const headers = fields.map(f => f.name);
            
            // Create worksheet with headers only
            const wsData = [headers];
            const ws = XLSX.utils.aoa_to_sheet(wsData);
            
            // Set column widths based on header lengths
            const colWidths = headers.map(h => ({ wch: Math.max(h.length + 5, 15) }));
            ws['!cols'] = colWidths;
            
            // Create workbook
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Template');
            
            // Generate filename
            const filename = `${table.name.replace(/[^a-z0-9]/gi, '_')}_template.xlsx`;
            
            // Download the Excel file
            XLSX.writeFile(wb, filename);
            
            showToast('Excel template downloaded successfully!', 'success');
        } catch (error) {
            console.error('Download error:', error);
            showToast('Error downloading template', 'error');
        }
    }

    // ==================== DRAWER FUNCTIONS ====================
    function renderFieldList() {
        if (!fieldList) return;
        fieldList.innerHTML = '';
        
        currentFields.forEach((field, idx) => {
            const li = document.createElement('li');
            li.className = 'field-list-item';
            li.dataset.idx = idx;
            li.draggable = currentMode !== 'view';
            
            const typeOptions = ['text', 'number', 'date', 'email', 'image', 'textarea'];
            const typeOptionsHtml = typeOptions.map(t => 
                `<option value="${t}" ${field.type === t ? 'selected' : ''}>${t.charAt(0).toUpperCase() + t.slice(1)}</option>`
            ).join('');
            
            li.innerHTML = `
                <span class="field-drag"><i class="fa-solid fa-grip-vertical"></i></span>
                <span class="field-name">${field.name}</span>
                <span class="field-type-cell">
                    <select class="field-type-select" data-idx="${idx}" ${currentMode === 'view' ? 'disabled' : ''}>
                        ${typeOptionsHtml}
                    </select>
                </span>
                <span class="field-action">
                    ${currentMode !== 'view' ? `<button class="remove-field-btn" data-idx="${idx}"><i class="fa-solid fa-xmark"></i></button>` : ''}
                </span>
            `;
            fieldList.appendChild(li);
        });
        
        updateFieldCount();
        if (currentMode !== 'view') setupDragAndDrop();
    }

    function setupDragAndDrop() {
        const items = fieldList.querySelectorAll('.field-list-item');
        let draggedItem = null;

        items.forEach(item => {
            item.addEventListener('dragstart', function(e) {
                draggedItem = this;
                this.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
            });

            item.addEventListener('dragend', function() {
                this.classList.remove('dragging');
                draggedItem = null;
                updateFieldOrder();
            });

            item.addEventListener('dragover', function(e) {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                const afterElement = getDragAfterElement(fieldList, e.clientY);
                if (afterElement == null) {
                    fieldList.appendChild(draggedItem);
                } else {
                    fieldList.insertBefore(draggedItem, afterElement);
                }
            });
        });
    }

    function getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.field-list-item:not(.dragging)')];
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    function updateFieldOrder() {
        const items = fieldList.querySelectorAll('.field-list-item');
        const newFields = [];
        items.forEach((item, idx) => {
            const oldIdx = parseInt(item.dataset.idx);
            if (currentFields[oldIdx]) newFields.push({...currentFields[oldIdx], order: idx});
        });
        currentFields = newFields;
        renderFieldList();
    }

    function openDrawer(mode, data = null) {
        currentMode = mode;
        addDrawer.classList.remove('view-mode');
        
        if (mode === 'add') {
            drawerTitle.textContent = 'Create New Table';
            drawerIcon.className = 'fa-solid fa-table-list';
            tableNameInput.value = '';
            tableNameInput.disabled = false;
            currentFields = [];
            saveDrawer.style.display = 'inline-flex';
            saveDrawer.innerHTML = '<i class="fa-solid fa-plus"></i> Create';
            saveDrawer.className = 'btn btn-save';
            if (addFieldSection) addFieldSection.style.display = 'block';
        } else if (mode === 'edit') {
            drawerTitle.textContent = 'Edit Table';
            drawerIcon.className = 'fa-solid fa-pen-to-square';
            tableNameInput.value = data.name || '';
            tableNameInput.disabled = false;
            currentFields = data.fields || [];
            saveDrawer.style.display = 'inline-flex';
            saveDrawer.innerHTML = '<i class="fa-solid fa-check"></i> Update';
            saveDrawer.className = 'btn btn-update';
            if (addFieldSection) addFieldSection.style.display = 'block';
        } else if (mode === 'view') {
            drawerTitle.textContent = 'View Table';
            drawerIcon.className = 'fa-solid fa-eye';
            tableNameInput.value = data.name || '';
            tableNameInput.disabled = true;
            currentFields = data.fields || [];
            saveDrawer.style.display = 'none';
            if (addFieldSection) addFieldSection.style.display = 'none';
            addDrawer.classList.add('view-mode');
        }
        
        renderFieldList();
        addDrawer.classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    function closeDrawerModal() {
        addDrawer.classList.remove('open');
        addDrawer.classList.remove('view-mode');
        document.body.style.overflow = '';
        currentFields = [];
        if (newFieldName) newFieldName.value = '';
        if (newFieldType) newFieldType.value = 'text';
    }

    // ==================== API FUNCTIONS ====================
    async function fetchTableData(tableId) {
        try {
            const response = await fetch(`/api/table/${tableId}/`);
            const data = await response.json();
            if (data.success) return data.table;
            showToast(data.message || 'Error fetching table data', 'error');
            return null;
        } catch (error) {
            showToast('Error fetching table data', 'error');
            return null;
        }
    }

    async function saveTable() {
        const name = tableNameInput.value.trim();
        if (!name) {
            showToast('Please enter a table name!', 'error');
            tableNameInput.focus();
            return;
        }

        if (currentFields.length === 0) {
            showToast('Please add at least one field!', 'error');
            return;
        }

        const payload = {
            name: name,
            fields: currentFields.map((f, idx) => ({ name: f.name, type: f.type, order: idx }))
        };

        try {
            let url = currentMode === 'add' ? `/api/group/${groupId}/table/create/` : `/api/table/${selectedTableId}/update/`;
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await response.json();

            if (data.success) {
                showToast(data.message || 'Table saved successfully!', 'success');
                closeDrawerModal();
                setTimeout(() => window.location.reload(), 500);
            } else {
                showToast(data.message || 'Error saving table', 'error');
            }
        } catch (error) {
            showToast('Error saving table', 'error');
        }
    }

    async function toggleStatus() {
        if (!selectedTableId) return;
        try {
            const response = await fetch(`/api/table/${selectedTableId}/toggle-status/`, { method: 'POST' });
            const data = await response.json();

            if (data.success) {
                showToast(data.message || 'Status updated!', 'success');
                setTimeout(() => window.location.reload(), 500);
            } else {
                showToast(data.message || 'Error updating status', 'error');
            }
        } catch (error) {
            showToast('Error updating status', 'error');
        }
    }

    // ==================== EVENT HANDLERS ====================
    if (addBtn) addBtn.addEventListener('click', () => openDrawer('add'));

    if (editBtn) {
        editBtn.addEventListener('click', async () => {
            if (selectedTableId) {
                const tableData = await fetchTableData(selectedTableId);
                if (tableData) openDrawer('edit', tableData);
            }
        });
    }

    if (viewBtn) {
        viewBtn.addEventListener('click', async () => {
            if (selectedTableId) {
                const tableData = await fetchTableData(selectedTableId);
                if (tableData) openDrawer('view', tableData);
            }
        });
    }

    if (toggleStatusBtn) {
        toggleStatusBtn.addEventListener('click', () => {
            if (!selectedRow) return;
            const name = selectedRow.dataset.tableName;
            const currentStatus = selectedRow.dataset.tableStatus;
            const newStatus = currentStatus === 'active' ? 'Inactive' : 'Active';
            
            if (modalMessage) modalMessage.textContent = `Are you sure you want to set "${name}" to ${newStatus}?`;
            if (modalIcon) {
                if (currentStatus === 'active') {
                    modalIcon.innerHTML = '<i class="fa-solid fa-toggle-off"></i>';
                } else {
                    modalIcon.innerHTML = '<i class="fa-solid fa-toggle-on"></i>';
                }
            }
            if (statusModal) statusModal.classList.add('show');
        });
    }

    // Delete button click handler
    if (deleteBtn) {
        deleteBtn.addEventListener('click', () => {
            if (!selectedRow) return;
            const name = selectedRow.dataset.tableName;
            if (deleteTableName) deleteTableName.textContent = name;
            if (deleteModal) deleteModal.classList.add('show');
        });
    }

    // Delete modal handlers
    if (closeDeleteModal) closeDeleteModal.addEventListener('click', () => deleteModal.classList.remove('show'));
    if (cancelDeleteBtn) cancelDeleteBtn.addEventListener('click', () => deleteModal.classList.remove('show'));
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', async () => {
            deleteModal.classList.remove('show');
            if (!selectedTableId) return;
            
            try {
                const response = await fetch(`/api/table/${selectedTableId}/delete/`, { method: 'DELETE' });
                const data = await response.json();
                
                if (data.success) {
                    showToast(data.message || 'Table deleted successfully!', 'success');
                    // Remove the row from DOM
                    if (selectedRow) selectedRow.remove();
                    selectedRow = null;
                    selectedTableId = null;
                    updateActionButtons();
                } else {
                    showToast(data.message || 'Error deleting table', 'error');
                }
            } catch (error) {
                console.error('Error deleting table:', error);
                showToast('Error deleting table', 'error');
            }
        });
    }
    if (deleteModal) deleteModal.addEventListener('click', (e) => { if (e.target === deleteModal) deleteModal.classList.remove('show'); });

    if (modalClose) modalClose.addEventListener('click', () => statusModal.classList.remove('show'));
    if (modalCancel) modalCancel.addEventListener('click', () => statusModal.classList.remove('show'));
    if (modalConfirm) modalConfirm.addEventListener('click', () => {
        statusModal.classList.remove('show');
        toggleStatus();
    });
    if (statusModal) statusModal.addEventListener('click', (e) => { if (e.target === statusModal) statusModal.classList.remove('show'); });

    if (closeDrawer) closeDrawer.addEventListener('click', closeDrawerModal);
    if (cancelDrawer) cancelDrawer.addEventListener('click', closeDrawerModal);
    if (saveDrawer) saveDrawer.addEventListener('click', saveTable);
    if (addDrawer) addDrawer.addEventListener('click', (e) => { if (e.target === addDrawer) closeDrawerModal(); });

    if (addFieldBtn) {
        addFieldBtn.addEventListener('click', () => {
            const name = newFieldName.value.trim();
            const type = newFieldType.value;

            if (!name) { showToast('Please enter a field name!', 'error'); newFieldName.focus(); return; }
            if (currentFields.length >= MAX_FIELDS) { showToast(`Maximum ${MAX_FIELDS} fields allowed!`, 'error'); return; }
            if (currentFields.some(f => f.name.toLowerCase() === name.toLowerCase())) { showToast('Field with this name already exists!', 'error'); return; }

            currentFields.push({ name: name, type: type, order: currentFields.length });
            renderFieldList();
            newFieldName.value = '';
            newFieldType.value = 'text';
            showToast('Field added!', 'success');
        });
    }

    if (newFieldName) newFieldName.addEventListener('keypress', (e) => { if (e.key === 'Enter') { e.preventDefault(); addFieldBtn.click(); } });

    if (fieldList) {
        fieldList.addEventListener('click', (e) => {
            if (e.target.closest('.remove-field-btn')) {
                const idx = parseInt(e.target.closest('.remove-field-btn').dataset.idx);
                currentFields.splice(idx, 1);
                renderFieldList();
                showToast('Field removed!', 'info');
            }
        });

        fieldList.addEventListener('change', (e) => {
            if (e.target.classList.contains('field-type-select')) {
                const idx = parseInt(e.target.dataset.idx);
                currentFields[idx].type = e.target.value;
            }
        });
    }

    // ==================== SEARCH & FILTER ====================
    let currentFilter = 'name';

    function performSearch() {
        const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
        const rows = tablesBody ? tablesBody.querySelectorAll('tr:not(.no-data-row)') : [];
        
        rows.forEach(row => {
            const name = row.querySelector('td:first-child')?.textContent.toLowerCase() || '';
            const status = row.dataset.tableStatus || '';
            const createdAt = row.querySelector('td:nth-child(3)')?.textContent.toLowerCase() || '';
            const updatedAt = row.querySelector('td:nth-child(4)')?.textContent.toLowerCase() || '';
            let match = false;
            
            if (!searchTerm) {
                match = true;
            } else if (currentFilter === 'name') {
                match = name.includes(searchTerm);
            } else if (currentFilter === 'status') {
                match = status.includes(searchTerm);
            } else if (currentFilter === 'date') {
                match = createdAt.includes(searchTerm) || updatedAt.includes(searchTerm);
            }
            
            row.style.display = match ? '' : 'none';
        });
    }

    if (searchInput) searchInput.addEventListener('input', performSearch);

    if (dropdownToggle && dropdownOptions && filterDropdown) {
        dropdownToggle.addEventListener('click', (e) => { e.stopPropagation(); filterDropdown.classList.toggle('open'); });

        dropdownOptions.querySelectorAll('.dropdown-option').forEach(option => {
            option.addEventListener('click', function() {
                dropdownOptions.querySelectorAll('.dropdown-option').forEach(o => o.classList.remove('selected'));
                this.classList.add('selected');
                selectedText.textContent = this.textContent;
                currentFilter = this.dataset.value;
                filterDropdown.classList.remove('open');
                searchInput.placeholder = `Search by ${this.textContent}...`;
                performSearch();
            });
        });

        document.addEventListener('click', () => filterDropdown.classList.remove('open'));
    }

    updateActionButtons();
    updateFieldCount();
});
