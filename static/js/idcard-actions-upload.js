// ID Card Actions - Upload Module
// Contains: XLSX upload, ZIP upload functionality

// ==========================================
// CONSTANTS
// ==========================================

// Image field types that should be excluded from Excel upload validation
// This is the primary declaration - use var for global scope
var IMAGE_FIELD_TYPES = ['photo', 'mother_photo', 'father_photo', 'barcode', 'qr_code', 'signature', 'image'];

// Image field name patterns (for detecting by name when type might not be set correctly)
var IMAGE_FIELD_NAME_PATTERNS = ['photo', 'f photo', 'father photo', 'm photo', 'mother photo', 'sign', 'signature', 'barcode', 'qr', 'qr_code', 'image'];

// Helper function to check if a field type is an image type
function isImageFieldType(fieldType) {
    if (!fieldType) return false;
    return IMAGE_FIELD_TYPES.includes(fieldType.toLowerCase());
}

// Helper function to check if a field name suggests it's an image field
function isImageFieldByName(fieldName) {
    if (!fieldName) return false;
    const normalizedName = fieldName.toLowerCase().trim();
    return IMAGE_FIELD_NAME_PATTERNS.some(pattern => 
        normalizedName === pattern || 
        normalizedName.includes('photo') || 
        normalizedName.includes('sign') ||
        normalizedName.includes('barcode') ||
        normalizedName.includes('qr')
    );
}

// Combined check - by type OR by name
function isImageField(field) {
    if (!field) return false;
    return isImageFieldType(field.type) || isImageFieldByName(field.name);
}

// ==========================================
// UPLOAD STATE
// ==========================================

let pendingUploadFile = null;
// Changed from single pendingZipFile to multiple
let pendingZipFiles = {}; // { fieldName: File }
let zipFileNamesMap = {}; // { fieldName: [{ nameWithoutExt, originalName }] }

// ==========================================
// HELPER FUNCTIONS
// ==========================================

// Levenshtein distance function for fuzzy matching
function levenshteinDistance(str1, str2) {
    const m = str1.length;
    const n = str2.length;
    const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
    
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            if (str1[i - 1] === str2[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1];
            } else {
                dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
            }
        }
    }
    return dp[m][n];
}

// Normalize string for comparison
function normalizeFieldName(name) {
    return name.toLowerCase()
        .replace(/[\s_\-\.]/g, '')
        .replace(/[^a-z0-9]/g, '');
}

// Find best matching field with fuzzy logic
function findBestMatch(uploadedHeader, tableFields) {
    const normalizedUploaded = normalizeFieldName(uploadedHeader);
    
    for (const field of tableFields) {
        if (normalizeFieldName(field) === normalizedUploaded) {
            return { field, type: 'exact' };
        }
    }
    
    let bestMatch = null;
    let bestDistance = Infinity;
    
    for (const field of tableFields) {
        const normalizedField = normalizeFieldName(field);
        const distance = levenshteinDistance(normalizedUploaded, normalizedField);
        
        const maxDistance = normalizedField.length < 5 ? 1 : 2;
        
        if (distance <= maxDistance && distance < bestDistance) {
            bestDistance = distance;
            bestMatch = field;
        }
    }
    
    if (bestMatch) {
        return { field: bestMatch, type: 'fuzzy' };
    }
    
    return null;
}

// ==========================================
// UPLOAD MODAL FUNCTIONS
// ==========================================

// Reset upload modal to file selection stage
function resetUploadModal() {
    const fileSelectStage = document.getElementById('fileSelectStage');
    const validationStage = document.getElementById('validationStage');
    const confirmUploadModal = document.getElementById('confirmUploadModal');
    const xlsxFileInput = document.getElementById('xlsxFileInput');
    const selectedFileName = document.getElementById('selectedFileName');
    const selectXlsxFileBtn = document.getElementById('selectXlsxFileBtn');
    const uploadProgressSection = document.getElementById('uploadProgressSection');
    
    // Reset stages
    if (fileSelectStage) fileSelectStage.style.display = '';
    if (validationStage) validationStage.style.display = 'none';
    if (confirmUploadModal) confirmUploadModal.style.display = 'none';
    if (uploadProgressSection) uploadProgressSection.style.display = 'none';
    
    // Reset file selection
    if (xlsxFileInput) xlsxFileInput.value = '';
    if (selectedFileName) selectedFileName.style.display = 'none';
    if (selectXlsxFileBtn) {
        selectXlsxFileBtn.innerHTML = '<i class="fa-solid fa-folder-open"></i> Browse Files';
        selectXlsxFileBtn.style.display = '';
    }
    
    // Reset state
    pendingUploadFile = null;
    pendingZipFiles = {};
    zipFileNamesMap = {};
    
    // Reset ZIP inputs
    document.querySelectorAll('.zip-file-name').forEach(el => {
        el.textContent = 'No file selected';
        el.classList.remove('selected');
    });
    document.querySelectorAll('.zip-file-status').forEach(el => {
        el.style.display = 'none';
    });
    document.querySelectorAll('.photo-zip-input').forEach(el => {
        el.value = '';
    });
}

// Reset file selection UI
function resetFileSelection() {
    const selectXlsxFileBtn = document.getElementById('selectXlsxFileBtn');
    const selectedFileName = document.getElementById('selectedFileName');
    
    if (selectXlsxFileBtn) {
        selectXlsxFileBtn.innerHTML = '<i class="fa-solid fa-folder-open"></i> Browse Files';
        selectXlsxFileBtn.style.display = '';
    }
    if (selectedFileName) selectedFileName.style.display = 'none';
}

// Show validation results (Stage 2)
function showValidationResults(matchedFields, missingFields, ignoredFields, dataRowCount, isError = false) {
    const fileSelectStage = document.getElementById('fileSelectStage');
    const validationStage = document.getElementById('validationStage');
    const confirmUploadModal = document.getElementById('confirmUploadModal');
    const selectXlsxFileBtn = document.getElementById('selectXlsxFileBtn');
    
    // Update button back to normal
    if (selectXlsxFileBtn) {
        selectXlsxFileBtn.innerHTML = '<i class="fa-solid fa-folder-open"></i> Browse Files';
    }
    
    // Switch to validation stage
    if (fileSelectStage) fileSelectStage.style.display = 'none';
    if (validationStage) validationStage.style.display = '';
    
    // Populate validation results
    populateValidationResults(matchedFields, missingFields, ignoredFields, dataRowCount, isError);
    
    // Show/hide confirm button
    if (confirmUploadModal) {
        confirmUploadModal.style.display = isError ? 'none' : '';
    }
}

// Populate validation results in the modal
function populateValidationResults(matchedFields, missingFields, ignoredFields, dataRowCount, isError = false) {
    const uploadStatus = document.getElementById('uploadStatus');
    const matchedFieldsGroup = document.getElementById('matchedFieldsGroup');
    const matchedFieldsList = document.getElementById('matchedFieldsList');
    const missingFieldsGroup = document.getElementById('missingFieldsGroup');
    const missingFieldsList = document.getElementById('missingFieldsList');
    const ignoredFieldsGroup = document.getElementById('ignoredFieldsGroup');
    const ignoredFieldsList = document.getElementById('ignoredFieldsList');
    const dataRowsCount = document.getElementById('dataRowsCount');
    const modalHeader = document.querySelector('.upload-modal-header');
    const zipInputsContainer = document.getElementById('zipInputsContainer');
    const photoZipSection = document.getElementById('photoZipSection');
    
    if (isError) {
        uploadStatus.className = 'upload-status error';
        uploadStatus.innerHTML = '<i class="fa-solid fa-times-circle error-icon"></i><span id="uploadStatusText">No matching fields found!</span>';
        if (modalHeader) modalHeader.classList.add('error');
    } else {
        uploadStatus.className = 'upload-status';
        uploadStatus.innerHTML = '<i class="fa-solid fa-check-circle success-icon"></i><span id="uploadStatusText">Fields matched successfully!</span>';
        if (modalHeader) modalHeader.classList.remove('error');
    }
    
    matchedFieldsList.innerHTML = '';
    if (matchedFields.length > 0) {
        matchedFieldsGroup.style.display = '';
        matchedFields.forEach(match => {
            const tag = document.createElement('span');
            tag.className = `match-tag ${match.type}`;
            if (match.type === 'fuzzy') {
                tag.innerHTML = `${match.uploaded} <i class="fa-solid fa-arrow-right match-arrow"></i> ${match.tableField}`;
            } else {
                tag.textContent = match.tableField;
            }
            matchedFieldsList.appendChild(tag);
        });
    } else {
        matchedFieldsGroup.style.display = 'none';
    }
    
    missingFieldsList.innerHTML = '';
    if (missingFields.length > 0) {
        missingFieldsGroup.style.display = '';
        missingFields.forEach(field => {
            const tag = document.createElement('span');
            tag.className = 'match-tag missing';
            tag.textContent = field;
            missingFieldsList.appendChild(tag);
        });
    } else {
        missingFieldsGroup.style.display = 'none';
    }
    
    ignoredFieldsList.innerHTML = '';
    if (ignoredFields.length > 0) {
        ignoredFieldsGroup.style.display = '';
        ignoredFields.forEach(field => {
            const tag = document.createElement('span');
            tag.className = 'match-tag ignored';
            tag.textContent = field;
            ignoredFieldsList.appendChild(tag);
        });
    } else {
        ignoredFieldsGroup.style.display = 'none';
    }
    
    dataRowsCount.textContent = `${dataRowCount} data row${dataRowCount !== 1 ? 's' : ''} found`;
    
    // Dynamically generate ZIP upload inputs for image fields
    if (zipInputsContainer) {
        zipInputsContainer.innerHTML = '';
        
        // Get image fields from TABLE_FIELDS (check by type OR name)
        const tableFields = typeof TABLE_FIELDS !== 'undefined' ? TABLE_FIELDS : [];
        const imageFields = tableFields.filter(f => isImageField(f));
        
        if (imageFields.length > 0) {
            if (photoZipSection) photoZipSection.style.display = '';
            
            imageFields.forEach(field => {
                const fieldName = field.name;
                const row = document.createElement('div');
                row.className = 'zip-upload-row';
                row.setAttribute('data-field-name', fieldName);
                
                row.innerHTML = `
                    <label class="zip-field-label">${fieldName.toUpperCase()}</label>
                    <div class="zip-upload-input">
                        <input type="file" class="photo-zip-input" data-field="${fieldName}" accept=".zip" style="display: none;">
                        <button type="button" class="btn btn-outline select-zip-btn" data-field="${fieldName}">
                            <i class="fa-solid fa-file-zipper"></i> Select ZIP
                        </button>
                        <span class="zip-file-name" data-field="${fieldName}">No file selected</span>
                    </div>
                    <div class="zip-file-status" data-field="${fieldName}" style="display: none;">
                        <i class="fa-solid fa-check-circle"></i>
                        <span class="zip-file-count">0 images</span>
                    </div>
                `;
                
                zipInputsContainer.appendChild(row);
            });
            
            // Re-attach event listeners for dynamically created ZIP buttons
            initZipButtonListeners();
        } else {
            if (photoZipSection) photoZipSection.style.display = 'none';
        }
    }
}

// Legacy function for backward compatibility - now just calls showValidationResults
function openUploadModal(matchedFields, missingFields, ignoredFields, dataRowCount, isError = false) {
    const uploadModalOverlay = document.getElementById('uploadModalOverlay');
    const fileSelectStage = document.getElementById('fileSelectStage');
    const validationStage = document.getElementById('validationStage');
    
    // Hide file selection stage, show validation stage
    if (fileSelectStage) fileSelectStage.style.display = 'none';
    if (validationStage) validationStage.style.display = '';
    
    // Populate validation results
    populateValidationResults(matchedFields, missingFields, ignoredFields, dataRowCount, isError);
    
    // Show confirm button if not an error
    const confirmUploadModal = document.getElementById('confirmUploadModal');
    if (confirmUploadModal) {
        confirmUploadModal.style.display = isError ? 'none' : '';
    }
    
    // Open modal if not already open
    if (uploadModalOverlay && !uploadModalOverlay.classList.contains('active')) {
        uploadModalOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

// Initialize ZIP button listeners (called after dynamic creation)
// Note: This is a no-op since initZipUpload uses event delegation on the container
function initZipButtonListeners() {
    // Event delegation is already set up in initZipUpload()
    // No additional setup needed for dynamically created elements
}

function closeUploadModalFn() {
    const uploadModalOverlay = document.getElementById('uploadModalOverlay');
    
    if (uploadModalOverlay) {
        uploadModalOverlay.classList.remove('active');
        document.body.style.overflow = ''; // Restore body scroll
    }
    
    // Reset the modal to file selection stage
    resetUploadModal();
}

// Expose globally
window.closeUploadModal = closeUploadModalFn;

// ==========================================
// XLSX UPLOAD HANDLERS
// ==========================================

function initXlsxUpload() {
    const uploadXlsxBtn = document.getElementById('uploadXlsxBtn');
    const xlsxFileInput = document.getElementById('xlsxFileInput');
    const uploadModalOverlay = document.getElementById('uploadModalOverlay');
    const closeUploadModal = document.getElementById('closeUploadModal');
    const cancelUploadModal = document.getElementById('cancelUploadModal');
    const confirmUploadModal = document.getElementById('confirmUploadModal');
    const selectXlsxFileBtn = document.getElementById('selectXlsxFileBtn');
    const selectedFileName = document.getElementById('selectedFileName');
    const selectedFileNameText = document.getElementById('selectedFileNameText');
    const clearSelectedFile = document.getElementById('clearSelectedFile');
    const fileSelectStage = document.getElementById('fileSelectStage');
    const validationStage = document.getElementById('validationStage');
    
    // Modal close handlers
    if (closeUploadModal) closeUploadModal.addEventListener('click', closeUploadModalFn);
    if (cancelUploadModal) cancelUploadModal.addEventListener('click', closeUploadModalFn);
    if (uploadModalOverlay) {
        uploadModalOverlay.addEventListener('click', function(e) {
            if (e.target === uploadModalOverlay) closeUploadModalFn();
        });
    }
    
    // Upload XLSX button opens the modal first (Stage 1)
    if (uploadXlsxBtn) {
        uploadXlsxBtn.addEventListener('click', function() {
            // Reset to file selection stage
            resetUploadModal();
            // Open the modal
            if (uploadModalOverlay) {
                uploadModalOverlay.classList.add('active');
                document.body.style.overflow = 'hidden';
            }
        });
    }
    
    // Browse Files button inside modal
    if (selectXlsxFileBtn && xlsxFileInput) {
        selectXlsxFileBtn.addEventListener('click', function() {
            xlsxFileInput.click();
        });
    }
    
    // Clear selected file
    if (clearSelectedFile) {
        clearSelectedFile.addEventListener('click', function() {
            if (xlsxFileInput) xlsxFileInput.value = '';
            if (selectedFileName) selectedFileName.style.display = 'none';
            if (selectXlsxFileBtn) selectXlsxFileBtn.style.display = '';
            pendingUploadFile = null;
            // Go back to file selection stage
            if (fileSelectStage) fileSelectStage.style.display = '';
            if (validationStage) validationStage.style.display = 'none';
            if (confirmUploadModal) confirmUploadModal.style.display = 'none';
        });
    }
    
    // File input change handler - validates and shows Stage 2
    if (xlsxFileInput) {
        xlsxFileInput.addEventListener('change', async function() {
            const file = this.files[0];
            if (!file) return;
            
            const validTypes = ['.xlsx', '.xls', '.csv'];
            const fileName = file.name.toLowerCase();
            const isValid = validTypes.some(ext => fileName.endsWith(ext));
            
            if (!isValid) {
                if (typeof showToast === 'function') showToast('Please upload an Excel (.xlsx, .xls) or CSV file', false);
                this.value = '';
                return;
            }
            
            // Show selected file name
            if (selectedFileName && selectedFileNameText) {
                selectedFileNameText.textContent = file.name;
                selectedFileName.style.display = 'flex';
            }
            if (selectXlsxFileBtn) selectXlsxFileBtn.textContent = 'Validating...';
            
            try {
                const tableFieldNames = (typeof TABLE_FIELDS !== 'undefined' ? TABLE_FIELDS : [])
                    .filter(f => !isImageField(f))
                    .map(f => f.name);
                
                if (tableFieldNames.length === 0) {
                    if (typeof showToast === 'function') showToast('No fields defined in table!', false);
                    this.value = '';
                    resetFileSelection();
                    return;
                }
                
                const fileData = await file.arrayBuffer();
                const workbook = XLSX.read(fileData, { type: 'array' });
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
                
                if (jsonData.length === 0) {
                    if (typeof showToast === 'function') showToast('The uploaded file is empty!', false);
                    this.value = '';
                    resetFileSelection();
                    return;
                }
                
                const uploadedHeaders = (jsonData[0] || []).map(h => String(h || '').trim()).filter(h => h);
                
                if (uploadedHeaders.length === 0) {
                    if (typeof showToast === 'function') showToast('No headers found in the uploaded file!', false);
                    this.value = '';
                    resetFileSelection();
                    return;
                }
                
                const matchedFields = [];
                const unmatchedUploadedFields = [];
                const usedTableFields = new Set();
                
                uploadedHeaders.forEach(header => {
                    const match = findBestMatch(header, tableFieldNames.filter(f => !usedTableFields.has(f)));
                    if (match) {
                        matchedFields.push({
                            uploaded: header,
                            tableField: match.field,
                            type: match.type
                        });
                        usedTableFields.add(match.field);
                    } else {
                        unmatchedUploadedFields.push(header);
                    }
                });
                
                const missingTableFields = tableFieldNames.filter(f => !usedTableFields.has(f));
                const dataRowCount = jsonData.length - 1;
                
                if (matchedFields.length === 0) {
                    showValidationResults(matchedFields, tableFieldNames, unmatchedUploadedFields, dataRowCount, true);
                    this.value = '';
                    return;
                }
                
                pendingUploadFile = file;
                showValidationResults(matchedFields, missingTableFields, unmatchedUploadedFields, dataRowCount, false);
                
            } catch (error) {
                console.error('Validation error:', error);
                if (typeof showToast === 'function') showToast('Failed to read file: ' + error.message, false);
                resetFileSelection();
            }
        });
    }
    
    // Confirm upload button
    if (confirmUploadModal) {
        confirmUploadModal.addEventListener('click', async function() {
            if (!pendingUploadFile) {
                if (typeof showToast === 'function') showToast('No file to upload', false);
                closeUploadModalFn();
                return;
            }
            
            const progressSection = document.getElementById('uploadProgressSection');
            const progressBar = document.getElementById('uploadProgressBar');
            const percentageText = document.getElementById('uploadPercentage');
            const sizeText = document.getElementById('uploadProgressSize');
            const timeText = document.getElementById('uploadTimeRemaining');
            const cancelBtn = document.getElementById('cancelUploadModal');
            
            const originalText = this.innerHTML;
            this.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Uploading...';
            this.disabled = true;
            if (cancelBtn) cancelBtn.disabled = true;
            
            if (progressSection) progressSection.style.display = 'block';
            
            const formData = new FormData();
            formData.append('file', pendingUploadFile);
            
            // Append multiple ZIP files with their field names
            Object.keys(pendingZipFiles).forEach(fieldName => {
                if (pendingZipFiles[fieldName]) {
                    formData.append(`photos_zip_${fieldName}`, pendingZipFiles[fieldName]);
                }
            });
            
            // Also send the field names that have ZIP files
            formData.append('zip_field_names', JSON.stringify(Object.keys(pendingZipFiles)));
            
            const xhr = new XMLHttpRequest();
            const startTime = Date.now();
            
            xhr.upload.addEventListener('progress', function(e) {
                if (e.lengthComputable) {
                    const percentComplete = Math.round((e.loaded / e.total) * 100);
                    const elapsedTime = (Date.now() - startTime) / 1000;
                    const uploadSpeed = e.loaded / elapsedTime;
                    const remainingBytes = e.total - e.loaded;
                    const remainingTime = remainingBytes / uploadSpeed;
                    
                    if (progressBar) progressBar.style.width = percentComplete + '%';
                    if (percentageText) percentageText.textContent = percentComplete + '%';
                    
                    const loadedKB = (e.loaded / 1024).toFixed(1);
                    const totalKB = (e.total / 1024).toFixed(1);
                    if (sizeText) sizeText.textContent = `${loadedKB} KB / ${totalKB} KB`;
                    
                    if (timeText) {
                        if (remainingTime < 1) {
                            timeText.textContent = 'Almost done...';
                        } else if (remainingTime < 60) {
                            timeText.textContent = `${Math.ceil(remainingTime)} sec remaining`;
                        } else {
                            const mins = Math.floor(remainingTime / 60);
                            const secs = Math.ceil(remainingTime % 60);
                            timeText.textContent = `${mins}m ${secs}s remaining`;
                        }
                    }
                }
            });
            
            xhr.addEventListener('load', function() {
                try {
                    const result = JSON.parse(xhr.responseText);
                    
                    if (xhr.status === 200 && result.success) {
                        if (progressBar) progressBar.style.width = '100%';
                        if (percentageText) percentageText.textContent = '100%';
                        if (timeText) timeText.textContent = 'Complete!';
                        
                        setTimeout(() => {
                            closeUploadModalFn();
                            if (typeof showToast === 'function') showToast(result.message, true);
                            
                            setTimeout(() => {
                                window.location.reload();
                            }, 1500);
                        }, 500);
                    } else {
                        if (typeof showToast === 'function') showToast(result.message || 'Upload failed', false);
                        resetUploadState();
                    }
                } catch (error) {
                    console.error('Parse error:', error);
                    if (typeof showToast === 'function') showToast('Failed to process server response', false);
                    resetUploadState();
                }
            });
            
            xhr.addEventListener('error', function() {
                console.error('Upload error');
                if (typeof showToast === 'function') showToast('Failed to upload file', false);
                resetUploadState();
            });
            
            function resetUploadState() {
                if (progressSection) progressSection.style.display = 'none';
                if (progressBar) progressBar.style.width = '0%';
                confirmUploadModal.innerHTML = originalText;
                confirmUploadModal.disabled = false;
                if (cancelBtn) cancelBtn.disabled = false;
            }
            
            const tableId = typeof TABLE_ID !== 'undefined' ? TABLE_ID : null;
            xhr.open('POST', `/api/table/${tableId}/cards/bulk-upload/`);
            xhr.setRequestHeader('X-CSRFToken', typeof getCSRFToken === 'function' ? getCSRFToken() : '');
            xhr.send(formData);
        });
    }
}

// ==========================================
// ZIP UPLOAD HANDLERS
// ==========================================

function initZipUpload() {
    // Initialize multiple ZIP upload inputs
    const zipInputsContainer = document.getElementById('zipInputsContainer');
    if (!zipInputsContainer) return;
    
    // Event delegation for select buttons
    zipInputsContainer.addEventListener('click', function(e) {
        const btn = e.target.closest('.select-zip-btn');
        if (btn) {
            const fieldName = btn.dataset.field;
            const fileInput = zipInputsContainer.querySelector(`.photo-zip-input[data-field="${fieldName}"]`);
            if (fileInput) {
                fileInput.click();
            }
        }
    });
    
    // Event delegation for file inputs
    zipInputsContainer.addEventListener('change', async function(e) {
        if (!e.target.classList.contains('photo-zip-input')) return;
        
        const fileInput = e.target;
        const fieldName = fileInput.dataset.field;
        const file = fileInput.files[0];
        
        const row = zipInputsContainer.querySelector(`.zip-upload-row[data-field-name="${fieldName}"]`);
        const zipFileName = row.querySelector(`.zip-file-name[data-field="${fieldName}"]`);
        const zipFileStatus = row.querySelector(`.zip-file-status[data-field="${fieldName}"]`);
        const zipFileCount = zipFileStatus ? zipFileStatus.querySelector('.zip-file-count') : null;
        
        if (!file) {
            if (zipFileName) {
                zipFileName.textContent = 'No file selected';
                zipFileName.classList.remove('selected');
            }
            if (zipFileStatus) zipFileStatus.style.display = 'none';
            delete pendingZipFiles[fieldName];
            delete zipFileNamesMap[fieldName];
            return;
        }
        
        if (!file.name.toLowerCase().endsWith('.zip')) {
            if (typeof showToast === 'function') showToast('Please select a ZIP file', 'error');
            fileInput.value = '';
            return;
        }
        
        pendingZipFiles[fieldName] = file;
        if (zipFileName) {
            zipFileName.textContent = file.name;
            zipFileName.classList.add('selected');
        }
        
        try {
            const zip = await JSZip.loadAsync(file);
            const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
            let imageCount = 0;
            zipFileNamesMap[fieldName] = [];
            
            zip.forEach((relativePath, zipEntry) => {
                if (!zipEntry.dir) {
                    const ext = relativePath.toLowerCase().substring(relativePath.lastIndexOf('.'));
                    if (imageExtensions.includes(ext)) {
                        imageCount++;
                        const baseName = relativePath.split('/').pop();
                        const nameWithoutExt = baseName.substring(0, baseName.lastIndexOf('.'));
                        zipFileNamesMap[fieldName].push({
                            fullPath: relativePath,
                            nameWithoutExt: nameWithoutExt,
                            originalName: baseName
                        });
                    }
                }
            });
            
            if (imageCount > 0) {
                if (zipFileStatus) zipFileStatus.style.display = 'flex';
                if (zipFileCount) zipFileCount.textContent = `${imageCount} image${imageCount > 1 ? 's' : ''}`;
            } else {
                if (zipFileStatus) zipFileStatus.style.display = 'none';
                if (typeof showToast === 'function') showToast(`No images found in ZIP for ${fieldName}`, 'error');
            }
        } catch (error) {
            console.error('Error reading ZIP:', error);
            if (zipFileStatus) zipFileStatus.style.display = 'none';
            if (typeof showToast === 'function') showToast('Error reading ZIP file', 'error');
        }
    });
}

// ==========================================
// INITIALIZATION
// ==========================================

function initUploadModule() {
    initXlsxUpload();
    initZipUpload();
}

// Expose globally
window.IDCardApp = window.IDCardApp || {};
window.IDCardApp.initUploadModule = initUploadModule;
window.IDCardApp.closeUploadModal = closeUploadModalFn;

console.log('IDCard Actions Upload module loaded');
