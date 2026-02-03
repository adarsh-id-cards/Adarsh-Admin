// ID Card Actions - Modal Module
// Contains: Side modal (add/edit/view), delete modal

// ==========================================
// SIDE MODAL STATE
// ==========================================

let currentModalMode = 'add';
let currentEditCardId = null;

// ==========================================
// SIDE MODAL FUNCTIONS
// ==========================================

function openSideModal(mode, cardData = null) {
    const sideModalOverlay = document.getElementById('sideModalOverlay');
    const sideModal = document.getElementById('sideModal');
    const sideModalTitle = document.getElementById('sideModalTitle');
    const saveSideModalBtn = document.getElementById('saveSideModal');
    const formPhotoPreview = document.getElementById('formPhotoPreview');
    const photoUploadLabel = document.getElementById('photoUploadLabel');
    
    currentModalMode = mode;
    currentEditCardId = cardData?.id || null;
    
    // Reset form
    const form = document.getElementById('cardForm');
    if (form) form.reset();
    
    // Reset photo preview
    if (formPhotoPreview) {
        formPhotoPreview.classList.remove('no-path', 'path-not-found', 'has-image');
        formPhotoPreview.classList.add('no-path');
        formPhotoPreview.innerHTML = '<i class="fa-solid fa-user"></i>';
    }
    
    const photoPathDisplay = document.getElementById('photoPathDisplay');
    if (photoPathDisplay) {
        photoPathDisplay.classList.remove('not-found');
        photoPathDisplay.classList.add('no-path');
        photoPathDisplay.textContent = 'No image';
    }
    
    // Reset all image field previews
    document.querySelectorAll('.image-preview-small').forEach(preview => {
        preview.classList.remove('no-path', 'path-not-found', 'has-image');
        preview.classList.add('no-path');
        preview.innerHTML = '<i class="fa-solid fa-image"></i>';
    });
    document.querySelectorAll('.image-path-display').forEach(pathDisplay => {
        pathDisplay.classList.remove('not-found');
        pathDisplay.classList.add('no-path');
        pathDisplay.textContent = 'No image';
    });
    
    // Update modal title
    if (sideModalTitle) {
        const titleSpan = sideModalTitle.querySelector('span');
        const titleIcon = sideModalTitle.querySelector('i');
        
        if (mode === 'add') {
            titleIcon.className = 'fa-solid fa-plus';
            titleSpan.textContent = 'Add New Card';
        } else if (mode === 'edit') {
            titleIcon.className = 'fa-solid fa-pen-to-square';
            titleSpan.textContent = 'Edit Card Details';
        } else if (mode === 'view') {
            titleIcon.className = 'fa-solid fa-eye';
            titleSpan.textContent = 'View Card Details';
        }
    }
    
    // Update save button
    if (saveSideModalBtn) {
        const btnSpan = saveSideModalBtn.querySelector('span');
        if (mode === 'add') {
            btnSpan.textContent = 'Add Card';
            saveSideModalBtn.style.display = '';
        } else if (mode === 'edit') {
            btnSpan.textContent = 'Save Changes';
            saveSideModalBtn.style.display = '';
        } else if (mode === 'view') {
            saveSideModalBtn.style.display = 'none';
        }
    }
    
    // Set form fields readonly in view mode
    if (sideModal) {
        sideModal.classList.toggle('view-mode', mode === 'view');
        const inputs = sideModal.querySelectorAll('.form-control');
        inputs.forEach(input => {
            input.readOnly = mode === 'view';
            input.disabled = mode === 'view';
        });
    }
    
    // Hide/show photo upload label
    if (photoUploadLabel) {
        photoUploadLabel.style.display = mode === 'view' ? 'none' : '';
    }
    
    // Populate form fields
    if ((mode === 'edit' || mode === 'view') && cardData) {
        populateFormFields(cardData);
    }
    
    // Show modal
    if (sideModalOverlay) {
        sideModalOverlay.classList.add('active');
    }
}

function closeSideModal() {
    const sideModalOverlay = document.getElementById('sideModalOverlay');
    if (sideModalOverlay) {
        sideModalOverlay.classList.remove('active');
    }
    currentModalMode = 'add';
    currentEditCardId = null;
}

function populateFormFields(cardData) {
    const formPhotoPreview = document.getElementById('formPhotoPreview');
    const photoPathDisplay = document.getElementById('photoPathDisplay');
    
    console.log('populateFormFields called with:', cardData);
    console.log('field_data:', cardData.field_data);
    
    // Reset photo preview classes
    if (formPhotoPreview) {
        formPhotoPreview.classList.remove('no-path', 'path-not-found', 'has-image');
    }
    if (photoPathDisplay) {
        photoPathDisplay.classList.remove('no-path', 'not-found');
    }
    
    // Populate main photo - check case-insensitively for PHOTO field
    let photoPath = null;
    if (cardData.field_data) {
        // Try different case variations for PHOTO field
        photoPath = cardData.field_data['PHOTO'] || 
                    cardData.field_data['Photo'] || 
                    cardData.field_data['photo'];
        
        // If still not found, search all keys case-insensitively
        if (!photoPath) {
            for (const [key, value] of Object.entries(cardData.field_data)) {
                if (key.toUpperCase() === 'PHOTO') {
                    photoPath = value;
                    break;
                }
            }
        }
    }
    
    console.log('Photo path found:', photoPath);
    
    if (photoPath && photoPath !== 'NOT_FOUND') {
        // Check if path already includes /media/
        const imgSrc = photoPath.startsWith('/media/') || photoPath.startsWith('http') 
            ? photoPath 
            : `/media/${photoPath}`;
        // Add cache-busting timestamp
        const cacheBuster = `?t=${Date.now()}`;
        console.log('Setting image src to:', imgSrc);
        
        if (formPhotoPreview) {
            formPhotoPreview.classList.add('has-image');
            formPhotoPreview.innerHTML = `<img src="${imgSrc}${cacheBuster}" alt="Photo">`;
        }
        if (photoPathDisplay) {
            // Show full path with /media/ prefix
            const fullPhotoPath = photoPath.startsWith('/media/') || photoPath.startsWith('http') 
                ? photoPath 
                : `/media/${photoPath}`;
            photoPathDisplay.textContent = fullPhotoPath;
        }
    } else if (photoPath === 'NOT_FOUND') {
        if (formPhotoPreview) {
            formPhotoPreview.classList.add('path-not-found');
            formPhotoPreview.innerHTML = `<i class="fa-solid fa-image-slash"></i>`;
        }
        if (photoPathDisplay) {
            photoPathDisplay.classList.add('not-found');
            photoPathDisplay.textContent = 'Path exists but image not found';
        }
    } else {
        if (formPhotoPreview) {
            formPhotoPreview.classList.add('no-path');
            formPhotoPreview.innerHTML = `<i class="fa-solid fa-user"></i>`;
        }
        if (photoPathDisplay) {
            photoPathDisplay.classList.add('no-path');
            photoPathDisplay.textContent = 'No image';
        }
    }
    
    // Fallback to cardData.photo
    if (!photoPath && cardData.photo && formPhotoPreview) {
        formPhotoPreview.classList.remove('no-path');
        formPhotoPreview.classList.add('has-image');
        formPhotoPreview.innerHTML = `<img src="${cardData.photo}" alt="Photo">`;
    }
    
    // Helper function to normalize field names for comparison
    // Removes spaces, dots, underscores, hyphens and converts to uppercase
    const normalizeFieldName = (name) => {
        if (!name) return '';
        return String(name).toUpperCase().replace(/[\s._\-]+/g, '');
    };
    
    // Helper function to find field value with flexible matching
    const findFieldValue = (fieldName) => {
        if (!fieldName || !cardData.field_data) return undefined;
        
        // Direct match first
        if (cardData.field_data[fieldName] !== undefined) {
            return cardData.field_data[fieldName];
        }
        
        // Try uppercase/lowercase
        if (cardData.field_data[fieldName.toUpperCase()] !== undefined) {
            return cardData.field_data[fieldName.toUpperCase()];
        }
        if (cardData.field_data[fieldName.toLowerCase()] !== undefined) {
            return cardData.field_data[fieldName.toLowerCase()];
        }
        
        // Normalized matching (remove spaces, dots, etc.)
        const normalizedFieldName = normalizeFieldName(fieldName);
        for (const [key, value] of Object.entries(cardData.field_data)) {
            if (normalizeFieldName(key) === normalizedFieldName) {
                return value;
            }
        }
        
        return undefined;
    };
    
    // Populate form fields from field_data
    if (cardData.field_data) {
        console.log('Populating form fields from field_data:', cardData.field_data);
        
        // Get ALL inputs in the form container (form-control and image-input)
        const formContainer = document.getElementById('formFieldsContainer');
        if (!formContainer) {
            console.error('formFieldsContainer not found!');
            return;
        }
        
        const allInputs = formContainer.querySelectorAll('input, textarea, select');
        console.log('Found inputs:', allInputs.length);
        
        allInputs.forEach(input => {
            const fieldName = input.getAttribute('data-field-name') || input.getAttribute('name');
            const fieldType = input.getAttribute('data-field-type') || input.type;
            
            if (!fieldName) {
                console.log('Input without field name:', input);
                return;
            }
            
            // Skip PHOTO field - handled separately
            if (fieldName.toUpperCase() === 'PHOTO') {
                return;
            }
            
            console.log(`Processing field: ${fieldName}, type: ${fieldType}`);
            
            // Handle image/file inputs
            if (input.type === 'file' || fieldType === 'image') {
                const previewId = input.getAttribute('data-preview-id');
                let previewContainer = previewId ? document.getElementById(previewId) : null;
                if (!previewContainer) {
                    previewContainer = input.closest('.image-field-row')?.querySelector('.image-preview-small');
                }
                
                const pathDisplayId = previewId ? previewId.replace('preview_', 'path_') : null;
                const pathDisplay = pathDisplayId ? document.getElementById(pathDisplayId) : null;
                
                if (previewContainer) {
                    previewContainer.classList.remove('no-path', 'path-not-found', 'has-image');
                }
                if (pathDisplay) {
                    pathDisplay.classList.remove('no-path', 'not-found');
                }
                
                const imgPath = findFieldValue(fieldName);
                console.log(`Image field ${fieldName}: path = ${imgPath}`);
                
                if (imgPath && imgPath !== 'NOT_FOUND') {
                    const imgSrc = imgPath.startsWith('/media/') || imgPath.startsWith('http') 
                        ? imgPath 
                        : `/media/${imgPath}`;
                    // Add cache-busting timestamp
                    const cacheBuster = `?t=${Date.now()}`;
                    if (previewContainer) {
                        previewContainer.classList.add('has-image');
                        previewContainer.innerHTML = `<img src="${imgSrc}${cacheBuster}" alt="${fieldName}">`;
                    }
                    if (pathDisplay) {
                        // Show full path with /media/ prefix
                        pathDisplay.textContent = imgSrc;
                    }
                } else if (imgPath === 'NOT_FOUND') {
                    if (previewContainer) {
                        previewContainer.classList.add('path-not-found');
                        previewContainer.innerHTML = `<i class="fa-solid fa-image-slash"></i>`;
                    }
                    if (pathDisplay) {
                        pathDisplay.classList.add('not-found');
                        pathDisplay.textContent = 'Path exists but image not found';
                    }
                } else {
                    if (previewContainer) {
                        previewContainer.classList.add('no-path');
                        previewContainer.innerHTML = `<i class="fa-solid fa-image"></i>`;
                    }
                    if (pathDisplay) {
                        pathDisplay.classList.add('no-path');
                        pathDisplay.textContent = 'No image';
                    }
                }
                return;
            }
            
            // Handle text/date/number/email/textarea inputs
            const fieldValue = findFieldValue(fieldName);
            console.log(`Field ${fieldName}: value = ${fieldValue}`);
            
            if (fieldValue !== undefined && fieldValue !== null) {
                // Handle date fields - convert DD-MM-YYYY to YYYY-MM-DD for HTML date input
                if (fieldType === 'date' || input.type === 'date') {
                    const dateStr = String(fieldValue);
                    // Check if it's in DD-MM-YYYY format
                    const ddmmyyyy = dateStr.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
                    if (ddmmyyyy) {
                        const [, day, month, year] = ddmmyyyy;
                        input.value = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
                        console.log(`Date field ${fieldName}: converted ${dateStr} to ${input.value}`);
                    } else {
                        input.value = fieldValue;
                    }
                } else {
                    input.value = fieldValue;
                }
            } else {
                console.log(`No value found for field: ${fieldName}`);
            }
        });
    }
}

function getFormData() {
    const fieldData = {};
    const imageFiles = {};
    const inputs = document.querySelectorAll('#formFieldsContainer .form-control, #formFieldsContainer .image-input');
    
    console.log('getFormData: Found', inputs.length, 'inputs');
    
    inputs.forEach(input => {
        const fieldName = input.getAttribute('data-field-name');
        const fieldType = input.getAttribute('data-field-type');
        console.log(`  Input: ${fieldName}, type: ${fieldType}, inputType: ${input.type}`);
        if (fieldName) {
            if (fieldType === 'image') {
                if (input.files && input.files[0]) {
                    imageFiles[fieldName] = input.files[0];
                    console.log(`    -> Image file captured: ${input.files[0].name}`);
                } else {
                    console.log(`    -> No file selected for image field`);
                }
            } else {
                // Convert text values to uppercase
                const value = input.value || '';
                fieldData[fieldName] = typeof value === 'string' ? value.toUpperCase() : value;
            }
        }
    });
    
    console.log('getFormData result:', { fieldData, imageFilesCount: Object.keys(imageFiles).length });
    return { fieldData, imageFiles };
}

function getMainPhotoFile() {
    const formPhotoInput = document.getElementById('formPhotoInput');
    console.log('getMainPhotoFile - formPhotoInput element:', formPhotoInput);
    console.log('getMainPhotoFile - files:', formPhotoInput?.files);
    console.log('getMainPhotoFile - files[0]:', formPhotoInput?.files?.[0]);
    if (formPhotoInput && formPhotoInput.files && formPhotoInput.files[0]) {
        console.log('getMainPhotoFile - returning file:', formPhotoInput.files[0].name);
        return formPhotoInput.files[0];
    }
    console.log('getMainPhotoFile - returning null (no file selected)');
    return null;
}

function fetchCardAndOpenModal(mode, cardId) {
    console.log('fetchCardAndOpenModal called:', mode, cardId);
    fetch(`/api/card/${cardId}/`)
        .then(response => response.json())
        .then(data => {
            console.log('Card data received:', data);
            if (data.success) {
                openSideModal(mode, data.card);
            } else {
                if (typeof showToast === 'function') showToast('Error loading card data', false);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            if (typeof showToast === 'function') showToast('Error loading card data', false);
        });
}

function createNewCard(fieldData, imageFiles, mainPhoto) {
    const tableId = typeof TABLE_ID !== 'undefined' ? TABLE_ID : (window.IDCardApp?.tableId || null);
    if (!tableId) {
        if (typeof showToast === 'function') showToast('Error: Table ID not found', false);
        return;
    }
    
    // Convert to uppercase
    const uppercaseFieldData = {};
    for (const [key, value] of Object.entries(fieldData)) {
        uppercaseFieldData[key] = typeof value === 'string' ? value.toUpperCase() : value;
    }
    
    const formData = new FormData();
    formData.append('field_data', JSON.stringify(uppercaseFieldData));
    
    if (mainPhoto) {
        formData.append('photo', mainPhoto);
    }
    
    for (const [fieldName, file] of Object.entries(imageFiles)) {
        formData.append(`image_${fieldName}`, file);
    }
    
    fetch(`/api/table/${tableId}/card/create/`, {
        method: 'POST',
        headers: {
            'X-CSRFToken': typeof getCSRFToken === 'function' ? getCSRFToken() : ''
        },
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            if (typeof showToast === 'function') showToast('Card added successfully!');
            closeSideModal();
            window.location.href = `?status=pending`;
        } else {
            if (typeof showToast === 'function') showToast(data.message || 'Error adding card', false);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        if (typeof showToast === 'function') showToast('Error adding card', false);
    });
}

function updateExistingCard(cardId, fieldData, imageFiles, mainPhoto) {
    console.log('updateExistingCard called with:');
    console.log('  cardId:', cardId);
    console.log('  fieldData:', fieldData);
    console.log('  imageFiles:', Object.keys(imageFiles));
    console.log('  mainPhoto:', mainPhoto ? 'Yes' : 'No');
    
    // Convert to uppercase
    const uppercaseFieldData = {};
    for (const [key, value] of Object.entries(fieldData)) {
        uppercaseFieldData[key] = typeof value === 'string' ? value.toUpperCase() : value;
    }
    
    console.log('  uppercaseFieldData:', uppercaseFieldData);
    
    const formData = new FormData();
    formData.append('field_data', JSON.stringify(uppercaseFieldData));
    
    if (mainPhoto) {
        formData.append('photo', mainPhoto);
    }
    
    for (const [fieldName, file] of Object.entries(imageFiles)) {
        formData.append(`image_${fieldName}`, file);
    }
    
    fetch(`/api/card/${cardId}/update/`, {
        method: 'POST',
        headers: {
            'X-CSRFToken': typeof getCSRFToken === 'function' ? getCSRFToken() : ''
        },
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        console.log('Update response:', data);
        if (data.success) {
            if (typeof showToast === 'function') showToast('Card updated successfully!');
            closeSideModal();
            location.reload();
        } else {
            if (typeof showToast === 'function') showToast(data.message || 'Error updating card', false);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        if (typeof showToast === 'function') showToast('Error updating card', false);
    });
}

// ==========================================
// DELETE MODAL
// ==========================================

function closeDeleteModalFn() {
    const deleteModalOverlay = document.getElementById('deleteModalOverlay');
    if (deleteModalOverlay) {
        deleteModalOverlay.classList.remove('active');
    }
    window.pendingDeleteCardIds = null;
}

function initDeleteModal() {
    const deleteModalOverlay = document.getElementById('deleteModalOverlay');
    const closeDeleteModal = document.getElementById('closeDeleteModal');
    const cancelDeleteModal = document.getElementById('cancelDeleteModal');
    const confirmDeleteModal = document.getElementById('confirmDeleteModal');
    
    if (closeDeleteModal) closeDeleteModal.addEventListener('click', closeDeleteModalFn);
    if (cancelDeleteModal) cancelDeleteModal.addEventListener('click', closeDeleteModalFn);
    
    if (deleteModalOverlay) {
        deleteModalOverlay.addEventListener('click', function(e) {
            if (e.target === this) closeDeleteModalFn();
        });
    }
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && deleteModalOverlay?.classList.contains('active')) {
            closeDeleteModalFn();
        }
    });
    
    if (confirmDeleteModal) {
        confirmDeleteModal.addEventListener('click', function() {
            const cardIds = window.pendingDeleteCardIds;
            const tableId = typeof TABLE_ID !== 'undefined' ? TABLE_ID : (window.IDCardApp?.tableId || null);
            
            if (!cardIds || cardIds.length === 0 || !tableId) {
                if (typeof showToast === 'function') showToast('Error: No cards selected or Table ID not found', false);
                closeDeleteModalFn();
                return;
            }
            
            this.disabled = true;
            this.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Deleting...';
            
            fetch(`/api/table/${tableId}/cards/bulk-delete/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': typeof getCSRFToken === 'function' ? getCSRFToken() : ''
                },
                body: JSON.stringify({ card_ids: cardIds })
            })
            .then(response => response.json())
            .then(data => {
                closeDeleteModalFn();
                if (data.success) {
                    if (typeof showToast === 'function') showToast(`${data.deleted_count} card(s) permanently deleted`);
                    location.reload();
                } else {
                    if (typeof showToast === 'function') showToast(data.message || 'Error deleting cards', false);
                    confirmDeleteModal.disabled = false;
                    confirmDeleteModal.innerHTML = '<i class="fa-solid fa-trash"></i> Delete Permanently';
                }
            })
            .catch(error => {
                console.error('Error:', error);
                closeDeleteModalFn();
                if (typeof showToast === 'function') showToast('Error deleting cards', false);
                confirmDeleteModal.disabled = false;
                confirmDeleteModal.innerHTML = '<i class="fa-solid fa-trash"></i> Delete Permanently';
            });
        });
    }
}

// ==========================================
// INITIALIZATION
// ==========================================

function initModalModule() {
    const sideModalOverlay = document.getElementById('sideModalOverlay');
    const formPhotoInput = document.getElementById('formPhotoInput');
    const formPhotoPreview = document.getElementById('formPhotoPreview');
    const saveSideModalBtn = document.getElementById('saveSideModal');
    
    // Close side modal handlers
    document.getElementById('closeSideModal')?.addEventListener('click', closeSideModal);
    document.getElementById('cancelSideModal')?.addEventListener('click', closeSideModal);
    
    if (sideModalOverlay) {
        sideModalOverlay.addEventListener('click', function(e) {
            if (e.target === this) closeSideModal();
        });
    }
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && sideModalOverlay?.classList.contains('active')) {
            closeSideModal();
        }
    });
    
    // Photo upload preview
    if (formPhotoInput) {
        formPhotoInput.addEventListener('change', function() {
            if (this.files && this.files[0]) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    if (formPhotoPreview) {
                        formPhotoPreview.innerHTML = `<img src="${e.target.result}" alt="Photo">`;
                    }
                };
                reader.readAsDataURL(this.files[0]);
            }
        });
    }
    
    // Image field upload previews
    document.querySelectorAll('.image-input').forEach(input => {
        input.addEventListener('change', function() {
            if (this.files && this.files[0]) {
                const previewId = this.getAttribute('data-preview-id');
                const previewEl = document.getElementById(previewId);
                if (previewEl) {
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        previewEl.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
                    };
                    reader.readAsDataURL(this.files[0]);
                }
            }
        });
    });
    
    // Add button
    document.getElementById('addBtn')?.addEventListener('click', function() {
        openSideModal('add');
    });
    
    // Edit buttons
    const editBtnIds = ['editBtn', 'editBtnV', 'editBtnA', 'editBtnD'];
    editBtnIds.forEach(btnId => {
        document.getElementById(btnId)?.addEventListener('click', function() {
            const selectedIds = typeof getSelectedCardIds === 'function' ? getSelectedCardIds() : [];
            if (selectedIds.length === 1) {
                fetchCardAndOpenModal('edit', selectedIds[0]);
            }
        });
    });
    
    // View buttons
    const viewBtnIds = ['viewBtn', 'viewBtnV', 'viewBtnP', 'viewBtnA', 'viewBtnD'];
    viewBtnIds.forEach(btnId => {
        document.getElementById(btnId)?.addEventListener('click', function() {
            const selectedIds = typeof getSelectedCardIds === 'function' ? getSelectedCardIds() : [];
            if (selectedIds.length === 1) {
                fetchCardAndOpenModal('view', selectedIds[0]);
            }
        });
    });
    
    // Edit photo buttons in table rows - use event delegation for dynamic rows
    const dataTable = document.getElementById('data-table');
    if (dataTable) {
        dataTable.addEventListener('click', function(e) {
            const editBtn = e.target.closest('.edit-photo-btn');
            if (!editBtn) return;
            
            e.stopPropagation();
            const selectedIds = typeof getSelectedCardIds === 'function' ? getSelectedCardIds() : [];
            
            if (selectedIds.length > 1) {
                if (typeof showToast === 'function') showToast('Please select only one row to edit', 'error');
                return;
            }
            
            const cardId = editBtn.getAttribute('data-card-id');
            console.log('Edit photo button clicked, cardId:', cardId);
            if (cardId) {
                fetchCardAndOpenModal('edit', cardId);
            }
        });
    }
    
    // Save button
    if (saveSideModalBtn) {
        saveSideModalBtn.addEventListener('click', function() {
            const { fieldData, imageFiles } = getFormData();
            const mainPhoto = getMainPhotoFile();
            
            if (currentModalMode === 'add') {
                createNewCard(fieldData, imageFiles, mainPhoto);
            } else if (currentModalMode === 'edit' && currentEditCardId) {
                updateExistingCard(currentEditCardId, fieldData, imageFiles, mainPhoto);
            }
        });
    }
    
    // Initialize delete modal
    initDeleteModal();
    
    // Delete key handler
    document.addEventListener('keydown', function(e) {
        if (e.key !== 'Delete') return;
        
        const activeElement = document.activeElement;
        if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) return;
        if (sideModalOverlay?.classList.contains('active')) return;
        if (document.getElementById('uploadModalOverlay')?.classList.contains('active')) return;
        if (document.getElementById('deleteModalOverlay')?.classList.contains('active')) return;
        
        const selectedIds = typeof getSelectedCardIds === 'function' ? getSelectedCardIds() : [];
        if (selectedIds.length === 0) return;
        
        e.preventDefault();
        
        const currentStatus = typeof CURRENT_STATUS !== 'undefined' ? CURRENT_STATUS : 'pending';
        
        if (currentStatus === 'pool') {
            directPermanentDelete(selectedIds);
        } else {
            if (typeof bulkDelete === 'function') bulkDelete(selectedIds);
        }
    });
}

function directPermanentDelete(cardIds) {
    const tableId = typeof TABLE_ID !== 'undefined' ? TABLE_ID : (window.IDCardApp?.tableId || null);
    if (!tableId) {
        if (typeof showToast === 'function') showToast('Error: Table ID not found', false);
        return;
    }
    
    fetch(`/api/table/${tableId}/cards/bulk-delete/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': typeof getCSRFToken === 'function' ? getCSRFToken() : ''
        },
        body: JSON.stringify({ card_ids: cardIds })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            if (typeof showToast === 'function') showToast(`${data.deleted_count} card(s) permanently deleted`);
            location.reload();
        } else {
            if (typeof showToast === 'function') showToast(data.message || 'Failed to delete cards', false);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        if (typeof showToast === 'function') showToast('Failed to delete cards', false);
    });
}

// Expose globally
window.IDCardApp = window.IDCardApp || {};
window.IDCardApp.initModalModule = initModalModule;
window.IDCardApp.openSideModal = openSideModal;
window.IDCardApp.closeSideModal = closeSideModal;
window.IDCardApp.fetchCardAndOpenModal = fetchCardAndOpenModal;
window.openSideModal = openSideModal;
window.closeSideModal = closeSideModal;

console.log('IDCard Actions Modal module loaded');
