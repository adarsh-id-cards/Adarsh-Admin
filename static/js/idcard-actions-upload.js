// ID Card Actions - Upload Module
// Contains: XLSX upload, ZIP upload functionality

// ==========================================
// UPLOAD STATE
// ==========================================

let pendingUploadFile = null;
let pendingZipFile = null;
let zipFileNames = [];

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

function openUploadModal(matchedFields, missingFields, ignoredFields, dataRowCount, isError = false) {
    const uploadStatus = document.getElementById('uploadStatus');
    const uploadStatusText = document.getElementById('uploadStatusText');
    const matchedFieldsGroup = document.getElementById('matchedFieldsGroup');
    const matchedFieldsList = document.getElementById('matchedFieldsList');
    const missingFieldsGroup = document.getElementById('missingFieldsGroup');
    const missingFieldsList = document.getElementById('missingFieldsList');
    const ignoredFieldsGroup = document.getElementById('ignoredFieldsGroup');
    const ignoredFieldsList = document.getElementById('ignoredFieldsList');
    const dataRowsCount = document.getElementById('dataRowsCount');
    const modalHeader = document.querySelector('.upload-modal-header');
    const confirmUploadModal = document.getElementById('confirmUploadModal');
    const uploadModalOverlay = document.getElementById('uploadModalOverlay');
    
    if (isError) {
        uploadStatus.className = 'upload-status error';
        uploadStatus.innerHTML = '<i class="fa-solid fa-times-circle error-icon"></i><span id="uploadStatusText">No matching fields found!</span>';
        if (modalHeader) modalHeader.classList.add('error');
        if (confirmUploadModal) confirmUploadModal.style.display = 'none';
    } else {
        uploadStatus.className = 'upload-status';
        uploadStatus.innerHTML = '<i class="fa-solid fa-check-circle success-icon"></i><span id="uploadStatusText">Fields matched successfully!</span>';
        if (modalHeader) modalHeader.classList.remove('error');
        if (confirmUploadModal) confirmUploadModal.style.display = '';
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
    
    if (uploadModalOverlay) uploadModalOverlay.classList.add('active');
}

function closeUploadModalFn() {
    const uploadModalOverlay = document.getElementById('uploadModalOverlay');
    const zipFileName = document.getElementById('zipFileName');
    const zipFileStatus = document.getElementById('zipFileStatus');
    const photoZipInput = document.getElementById('photoZipInput');
    
    if (uploadModalOverlay) uploadModalOverlay.classList.remove('active');
    pendingUploadFile = null;
    pendingZipFile = null;
    zipFileNames = [];
    
    if (zipFileName) zipFileName.textContent = 'No file selected';
    if (zipFileStatus) {
        zipFileStatus.textContent = '';
        zipFileStatus.style.display = 'none';
    }
    if (photoZipInput) photoZipInput.value = '';
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
    
    // Modal close handlers
    if (closeUploadModal) closeUploadModal.addEventListener('click', closeUploadModalFn);
    if (cancelUploadModal) cancelUploadModal.addEventListener('click', closeUploadModalFn);
    if (uploadModalOverlay) {
        uploadModalOverlay.addEventListener('click', function(e) {
            if (e.target === uploadModalOverlay) closeUploadModalFn();
        });
    }
    
    if (uploadXlsxBtn && xlsxFileInput) {
        uploadXlsxBtn.addEventListener('click', function() {
            xlsxFileInput.click();
        });
        
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
            
            const originalText = uploadXlsxBtn.innerHTML;
            uploadXlsxBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Validating...';
            uploadXlsxBtn.disabled = true;
            
            try {
                const tableFieldNames = (typeof TABLE_FIELDS !== 'undefined' ? TABLE_FIELDS : [])
                    .filter(f => f.type !== 'image')
                    .map(f => f.name);
                
                if (tableFieldNames.length === 0) {
                    if (typeof showToast === 'function') showToast('No fields defined in table!', false);
                    this.value = '';
                    uploadXlsxBtn.innerHTML = originalText;
                    uploadXlsxBtn.disabled = false;
                    return;
                }
                
                const fileData = await file.arrayBuffer();
                const workbook = XLSX.read(fileData, { type: 'array' });
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
                
                if (jsonData.length === 0) {
                    if (typeof showToast === 'function') showToast('The uploaded file is empty!', false);
                    this.value = '';
                    uploadXlsxBtn.innerHTML = originalText;
                    uploadXlsxBtn.disabled = false;
                    return;
                }
                
                const uploadedHeaders = (jsonData[0] || []).map(h => String(h || '').trim()).filter(h => h);
                
                if (uploadedHeaders.length === 0) {
                    if (typeof showToast === 'function') showToast('No headers found in the uploaded file!', false);
                    this.value = '';
                    uploadXlsxBtn.innerHTML = originalText;
                    uploadXlsxBtn.disabled = false;
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
                
                uploadXlsxBtn.innerHTML = originalText;
                uploadXlsxBtn.disabled = false;
                
                if (matchedFields.length === 0) {
                    openUploadModal(matchedFields, tableFieldNames, unmatchedUploadedFields, dataRowCount, true);
                    this.value = '';
                    return;
                }
                
                pendingUploadFile = file;
                openUploadModal(matchedFields, missingTableFields, unmatchedUploadedFields, dataRowCount, false);
                
            } catch (error) {
                console.error('Validation error:', error);
                if (typeof showToast === 'function') showToast('Failed to read file: ' + error.message, false);
                uploadXlsxBtn.innerHTML = originalText;
                uploadXlsxBtn.disabled = false;
            }
            
            this.value = '';
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
            
            if (pendingZipFile) {
                formData.append('photos_zip', pendingZipFile);
            }
            
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
    const photoZipInput = document.getElementById('photoZipInput');
    const selectZipBtn = document.getElementById('selectZipBtn');
    const zipFileName = document.getElementById('zipFileName');
    const zipFileStatus = document.getElementById('zipFileStatus');
    const zipFileCount = document.getElementById('zipFileCount');
    
    if (selectZipBtn && photoZipInput) {
        selectZipBtn.addEventListener('click', function() {
            photoZipInput.click();
        });
        
        photoZipInput.addEventListener('change', async function() {
            const file = this.files[0];
            if (!file) {
                if (zipFileName) zipFileName.textContent = 'No file selected';
                if (zipFileName) zipFileName.classList.remove('selected');
                if (zipFileStatus) zipFileStatus.style.display = 'none';
                pendingZipFile = null;
                zipFileNames = [];
                return;
            }
            
            if (!file.name.toLowerCase().endsWith('.zip')) {
                if (typeof showToast === 'function') showToast('Please select a ZIP file', 'error');
                this.value = '';
                return;
            }
            
            pendingZipFile = file;
            if (zipFileName) {
                zipFileName.textContent = file.name;
                zipFileName.classList.add('selected');
            }
            
            try {
                const zip = await JSZip.loadAsync(file);
                const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
                let imageCount = 0;
                zipFileNames = [];
                
                zip.forEach((relativePath, zipEntry) => {
                    if (!zipEntry.dir) {
                        const ext = relativePath.toLowerCase().substring(relativePath.lastIndexOf('.'));
                        if (imageExtensions.includes(ext)) {
                            imageCount++;
                            const baseName = relativePath.split('/').pop();
                            const nameWithoutExt = baseName.substring(0, baseName.lastIndexOf('.'));
                            zipFileNames.push({
                                fullPath: relativePath,
                                nameWithoutExt: nameWithoutExt.toUpperCase(),
                                originalName: baseName
                            });
                        }
                    }
                });
                
                if (imageCount > 0) {
                    if (zipFileStatus) zipFileStatus.style.display = 'flex';
                    if (zipFileCount) zipFileCount.textContent = `${imageCount} image${imageCount > 1 ? 's' : ''} found in ZIP`;
                } else {
                    if (zipFileStatus) zipFileStatus.style.display = 'none';
                    if (typeof showToast === 'function') showToast('No images found in the ZIP file', 'error');
                }
            } catch (error) {
                console.error('Error reading ZIP:', error);
                if (zipFileStatus) zipFileStatus.style.display = 'none';
                if (typeof showToast === 'function') showToast('Error reading ZIP file', 'error');
            }
        });
    }
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
