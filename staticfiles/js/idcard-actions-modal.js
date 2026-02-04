// ID Card Actions - Modal Module
// Contains: Side modal (add/edit/view), delete modal

// ==========================================
// IMAGE FIELD TYPES
// ==========================================
// Use existing IMAGE_FIELD_TYPES from upload module or define if not exists
if (typeof IMAGE_FIELD_TYPES === 'undefined') {
    var IMAGE_FIELD_TYPES = ['photo', 'mother_photo', 'father_photo', 'barcode', 'qr_code', 'signature', 'image'];
}

function isImageFieldType(fieldType) {
    return IMAGE_FIELD_TYPES.includes(fieldType);
}

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
    
    if (!sideModalOverlay) {
        return;
    }
    
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
    
    // Reset all image field previews (both old and new selectors)
    document.querySelectorAll('.image-preview-small, .image-preview-box').forEach(preview => {
        preview.classList.remove('no-path', 'path-not-found', 'has-image', 'pending-image');
        preview.classList.add('no-path');
        preview.innerHTML = '<i class="fa-solid fa-image"></i>';
    });
    document.querySelectorAll('.image-path-display, .image-path-text').forEach(pathDisplay => {
        pathDisplay.classList.remove('not-found', 'pending');
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
    
    // Hide/show photo upload label (main photo)
    if (photoUploadLabel) {
        photoUploadLabel.style.display = mode === 'view' ? 'none' : '';
    }
    
    // Hide/show all other image upload buttons in view mode
    const allImageUploadBtns = document.querySelectorAll('.image-field-card .image-upload-btn, .image-field-card .image-field-controls');
    allImageUploadBtns.forEach(btn => {
        btn.style.display = mode === 'view' ? 'none' : '';
    });
    
    // Populate form fields
    if ((mode === 'edit' || mode === 'view') && cardData) {
        populateFormFields(cardData);
    }
    
    // Show modal
    if (sideModalOverlay) {
        sideModalOverlay.classList.add('active');
        document.body.style.overflow = 'hidden'; // Lock body scroll
    }
}

function closeSideModal() {
    const sideModalOverlay = document.getElementById('sideModalOverlay');
    if (sideModalOverlay) {
        sideModalOverlay.classList.remove('active');
        document.body.style.overflow = ''; // Restore body scroll
    }
    currentModalMode = 'add';
    currentEditCardId = null;
}

// Helper function to extract short path (last folder + filename)
function getShortPath(fullPath) {
    if (!fullPath) return '';
    // Remove leading /media/ if present
    let path = fullPath.replace(/^\/media\//, '');
    // Split by / and get last 2 parts (folder + filename)
    const parts = path.split('/');
    if (parts.length >= 2) {
        return parts.slice(-2).join('/');
    }
    return parts[parts.length - 1] || path;
}

function populateFormFields(cardData) {
    const formPhotoPreview = document.getElementById('formPhotoPreview');
    const photoPathDisplay = document.getElementById('photoPathDisplay');
    
    
    // Reset photo preview classes
    if (formPhotoPreview) {
        formPhotoPreview.classList.remove('no-path', 'path-not-found', 'has-image', 'pending-image');
    }
    if (photoPathDisplay) {
        photoPathDisplay.classList.remove('no-path', 'not-found', 'pending');
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
    
    
    // Check if it's a PENDING reference
    const isPending = photoPath && photoPath.startsWith('PENDING:');
    const pendingRef = isPending ? photoPath.substring(8) : null;
    
    if (photoPath && !isPending && photoPath !== 'NOT_FOUND') {
        // Valid image path - show the image
        const imgSrc = photoPath.startsWith('/media/') || photoPath.startsWith('http') 
            ? photoPath 
            : `/media/${photoPath}`;
        const cacheBuster = `?t=${Date.now()}`;
        
        if (formPhotoPreview) {
            formPhotoPreview.classList.add('has-image');
            formPhotoPreview.innerHTML = `<img src="${imgSrc}${cacheBuster}" alt="Photo">`;
        }
        if (photoPathDisplay) {
            photoPathDisplay.textContent = getShortPath(imgSrc);
        }
    } else if (isPending) {
        // PENDING - Colorful placeholder (image reference exists but waiting for upload)
        if (formPhotoPreview) {
            formPhotoPreview.classList.add('pending-image');
            formPhotoPreview.innerHTML = `<i class="fa-solid fa-clock"></i>`;
        }
        if (photoPathDisplay) {
            photoPathDisplay.classList.add('pending');
            photoPathDisplay.textContent = `Waiting for: ${pendingRef}`;
        }
    } else if (photoPath === 'NOT_FOUND') {
        // Legacy NOT_FOUND - Colorful placeholder
        if (formPhotoPreview) {
            formPhotoPreview.classList.add('path-not-found');
            formPhotoPreview.innerHTML = `<i class="fa-solid fa-image-slash"></i>`;
        }
        if (photoPathDisplay) {
            photoPathDisplay.classList.add('not-found');
            photoPathDisplay.textContent = 'Path exists but image not found';
        }
    } else {
        // Empty/null - Gray placeholder (no image given at all)
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
        
        // Get ALL inputs in the form (including image section and text fields section)
        const cardForm = document.getElementById('cardForm');
        if (!cardForm) {
            console.error('cardForm not found!');
            return;
        }
        
        // Get inputs from both modal-images-section AND formFieldsContainer
        const allInputs = cardForm.querySelectorAll('input, textarea, select');
        
        allInputs.forEach(input => {
            const fieldName = input.getAttribute('data-field-name') || input.getAttribute('name');
            const fieldType = input.getAttribute('data-field-type') || input.type;
            
            if (!fieldName) {
                return;
            }
            
            // Skip PHOTO field - handled separately
            if (fieldName.toUpperCase() === 'PHOTO') {
                return;
            }
            
            // Handle image/file inputs
            if (input.type === 'file' || isImageFieldType(fieldType)) {
                const previewId = input.getAttribute('data-preview-id');
                let previewContainer = previewId ? document.getElementById(previewId) : null;
                if (!previewContainer) {
                    // Try new structure (.image-field-card) then old structure (.image-field-row)
                    previewContainer = input.closest('.image-field-card')?.querySelector('.image-preview-box') ||
                                       input.closest('.image-field-row')?.querySelector('.image-preview-small');
                }
                
                const pathDisplayId = previewId ? previewId.replace('preview_', 'path_') : null;
                let pathDisplay = pathDisplayId ? document.getElementById(pathDisplayId) : null;
                if (!pathDisplay) {
                    // Try new structure - look for .image-path-display
                    pathDisplay = input.closest('.image-field-card')?.querySelector('.image-path-display');
                }
                
                if (previewContainer) {
                    previewContainer.classList.remove('no-path', 'path-not-found', 'has-image', 'pending-image');
                }
                if (pathDisplay) {
                    pathDisplay.classList.remove('no-path', 'not-found', 'pending');
                }
                
                const imgPath = findFieldValue(fieldName);
                
                // Check if it's a PENDING reference
                const isPendingImg = imgPath && imgPath.startsWith('PENDING:');
                const pendingRefImg = isPendingImg ? imgPath.substring(8) : null;
                
                if (imgPath && !isPendingImg && imgPath !== 'NOT_FOUND') {
                    // Valid image path
                    const imgSrc = imgPath.startsWith('/media/') || imgPath.startsWith('http') 
                        ? imgPath 
                        : `/media/${imgPath}`;
                    const cacheBuster = `?t=${Date.now()}`;
                    if (previewContainer) {
                        previewContainer.classList.add('has-image');
                        previewContainer.innerHTML = `<img src="${imgSrc}${cacheBuster}" alt="${fieldName}">`;
                    }
                    if (pathDisplay) {
                        pathDisplay.textContent = getShortPath(imgSrc);
                    }
                } else if (isPendingImg) {
                    // PENDING - waiting for image upload
                    if (previewContainer) {
                        previewContainer.classList.add('pending-image');
                        previewContainer.innerHTML = `<i class="fa-solid fa-clock"></i>`;
                    }
                    if (pathDisplay) {
                        pathDisplay.classList.add('pending');
                        pathDisplay.textContent = `Waiting for: ${pendingRefImg}`;
                    }
                } else if (imgPath === 'NOT_FOUND') {
                    // Legacy NOT_FOUND
                    if (previewContainer) {
                        previewContainer.classList.add('path-not-found');
                        previewContainer.innerHTML = `<i class="fa-solid fa-image-slash"></i>`;
                    }
                    if (pathDisplay) {
                        pathDisplay.classList.add('not-found');
                        pathDisplay.textContent = 'Path exists but image not found';
                    }
                } else {
                    // Empty - no image given
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
            
            if (fieldValue !== undefined && fieldValue !== null) {
                // Handle date fields - convert DD-MM-YYYY to YYYY-MM-DD for HTML date input
                if (fieldType === 'date' || input.type === 'date') {
                    const dateStr = String(fieldValue);
                    // Check if it's in DD-MM-YYYY format
                    const ddmmyyyy = dateStr.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
                    if (ddmmyyyy) {
                        const [, day, month, year] = ddmmyyyy;
                        input.value = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
                    } else {
                        input.value = fieldValue;
                    }
                } else {
                    input.value = fieldValue;
                }
            }
        });
    }
}

function getFormData() {
    const fieldData = {};
    const imageFiles = {};
    
    // Get all inputs from the entire cardForm (including modal-images-section AND formFieldsContainer)
    const cardForm = document.getElementById('cardForm');
    if (!cardForm) {
        console.error('cardForm not found!');
        return { fieldData, imageFiles };
    }
    
    const inputs = cardForm.querySelectorAll('.form-control, .image-input');
    
    
    inputs.forEach(input => {
        const fieldName = input.getAttribute('data-field-name');
        const fieldType = input.getAttribute('data-field-type');
        if (fieldName) {
            // Skip PHOTO - handled separately by getMainPhotoFile
            if (fieldName.toUpperCase() === 'PHOTO') {
                return;
            }
            
            if (isImageFieldType(fieldType) || input.type === 'file') {
                if (input.files && input.files[0]) {
                    imageFiles[fieldName] = input.files[0];
                }
            } else {
                // Convert text values to uppercase
                const value = input.value || '';
                fieldData[fieldName] = typeof value === 'string' ? value.toUpperCase() : value;
            }
        }
    });
    
    return { fieldData, imageFiles };
}

function getMainPhotoFile() {
    const formPhotoInput = document.getElementById('formPhotoInput');
    if (formPhotoInput && formPhotoInput.files && formPhotoInput.files[0]) {
            return formPhotoInput.files[0];
    }
    return null;
}

function fetchCardAndOpenModal(mode, cardId) {
    fetch(`/api/card/${cardId}/`)
        .then(response => response.json())
        .then(data => {
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
    
    fetch(`/api/card/${cardId}/update/`, {
        method: 'POST',
        headers: {
            'X-CSRFToken': typeof getCSRFToken === 'function' ? getCSRFToken() : ''
        },
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            if (typeof showToast === 'function') showToast('Card updated successfully!');
            closeSideModal();
            // Force reload without cache
            window.location.href = window.location.href.split('?')[0] + '?status=' + (typeof CURRENT_STATUS !== 'undefined' ? CURRENT_STATUS : 'pending') + '&t=' + Date.now();
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
        document.body.style.overflow = ''; // Restore body scroll
    }
    window.pendingDeleteCardIds = null;
}

function initDeleteModal() {
    const deleteModalOverlay = document.getElementById('deleteModalOverlay');
    const closeDeleteModal = document.getElementById('closeDeleteModal');
    const cancelDeleteModal = document.getElementById('cancelDeleteModal');
    const confirmDeleteModal = document.getElementById('confirmDeleteModal');
    
    if (closeDeleteModal) {
        closeDeleteModal.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            closeDeleteModalFn();
        });
    }
    if (cancelDeleteModal) {
        cancelDeleteModal.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            closeDeleteModalFn();
        });
    }
    
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
        confirmDeleteModal.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
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
    try {
        const sideModalOverlay = document.getElementById('sideModalOverlay');
        const formPhotoInput = document.getElementById('formPhotoInput');
        const formPhotoPreview = document.getElementById('formPhotoPreview');
        const saveSideModalBtn = document.getElementById('saveSideModal');
        
        // Close side modal handlers
        const closeSideModalBtn = document.getElementById('closeSideModal');
        const cancelSideModalBtn = document.getElementById('cancelSideModal');
        
        if (closeSideModalBtn) {
            closeSideModalBtn.addEventListener('click', function() {
                closeSideModal();
            });
        }
        if (cancelSideModalBtn) {
            cancelSideModalBtn.addEventListener('click', function() {
                closeSideModal();
            });
        }
    
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
    const addBtn = document.getElementById('addBtn');
    if (addBtn) {
        addBtn.addEventListener('click', function() {
            openSideModal('add');
        });
    }
    
    // Edit buttons
    const editBtnIds = ['editBtn', 'editBtnV', 'editBtnA', 'editBtnD'];
    editBtnIds.forEach(btnId => {
        const btn = document.getElementById(btnId);
        if (btn) {
            btn.addEventListener('click', function() {
                const selectedIds = typeof getSelectedCardIds === 'function' ? getSelectedCardIds() : [];
                if (selectedIds.length === 1) {
                    fetchCardAndOpenModal('edit', selectedIds[0]);
                }
            });
        }
    });
    
    // View buttons
    const viewBtnIds = ['viewBtn', 'viewBtnV', 'viewBtnP', 'viewBtnA', 'viewBtnD'];
    viewBtnIds.forEach(btnId => {
        const btn = document.getElementById(btnId);
        if (btn) {
            btn.addEventListener('click', function() {
                const selectedIds = typeof getSelectedCardIds === 'function' ? getSelectedCardIds() : [];
                if (selectedIds.length === 1) {
                    fetchCardAndOpenModal('view', selectedIds[0]);
                }
            });
        }
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
    
    } catch (error) {
        console.error('initModalModule: Error during initialization:', error);
    }
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
