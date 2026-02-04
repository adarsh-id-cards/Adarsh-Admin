// ID Card Actions - Download Module
// Contains: Download images, DOCX, XLSX, reupload images

// ==========================================
// DOWNLOAD IMAGES
// ==========================================

function downloadImages(cardIds) {
    const tableId = typeof TABLE_ID !== 'undefined' ? TABLE_ID : null;
    if (!tableId) {
        if (typeof showToast === 'function') showToast('Error: Table ID not found', false);
        return;
    }
    
    if (cardIds.length === 0) {
        if (typeof showToast === 'function') showToast('No cards selected!', false);
        return;
    }
    
    if (typeof showProgressToast === 'function') showProgressToast('Preparing images...', -1);
    
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `/api/table/${tableId}/cards/download-images/`, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('X-CSRFToken', typeof getCSRFToken === 'function' ? getCSRFToken() : '');
    xhr.responseType = 'blob';
    
    xhr.onprogress = function(event) {
        if (event.lengthComputable) {
            const percentComplete = Math.round((event.loaded / event.total) * 100);
            if (typeof showProgressToast === 'function') showProgressToast(`Downloading... ${percentComplete}%`, percentComplete);
        } else {
            if (typeof showProgressToast === 'function') showProgressToast('Downloading...', -1);
        }
    };
    
    xhr.onload = function() {
        if (xhr.status === 200) {
            const blob = xhr.response;
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            
            const now = new Date();
            const timestamp = now.getFullYear().toString() + 
                             (now.getMonth() + 1).toString().padStart(2, '0') + 
                             now.getDate().toString().padStart(2, '0') + '_' +
                             now.getHours().toString().padStart(2, '0') + 
                             now.getMinutes().toString().padStart(2, '0') + 
                             now.getSeconds().toString().padStart(2, '0');
            a.download = `images_${timestamp}.zip`;
            
            document.body.appendChild(a);
            a.click();
            
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            if (typeof showDownloadComplete === 'function') showDownloadComplete('Images downloaded successfully!');
        } else {
            if (typeof hideProgressToast === 'function') hideProgressToast();
            const reader = new FileReader();
            reader.onload = function() {
                try {
                    const error = JSON.parse(reader.result);
                    if (typeof showToast === 'function') showToast(error.message || 'Failed to download images', false);
                } catch(e) {
                    if (typeof showToast === 'function') showToast('Failed to download images', false);
                }
            };
            reader.readAsText(xhr.response);
        }
    };
    
    xhr.onerror = function() {
        if (typeof hideProgressToast === 'function') hideProgressToast();
        if (typeof showToast === 'function') showToast('Failed to download images', false);
    };
    
    xhr.send(JSON.stringify({ card_ids: cardIds }));
}

function initDownloadImagesHandlers() {
    const downloadImgBtnIds = ['downloadImgBtn', 'downloadImgBtnV', 'downloadImgBtnP', 'downloadImgBtnA', 'downloadImgBtnD'];
    
    downloadImgBtnIds.forEach(btnId => {
        document.getElementById(btnId)?.addEventListener('click', function() {
            const cardIds = typeof getCardIdsForAction === 'function' ? getCardIdsForAction() : [];
            if (cardIds.length > 0) {
                downloadImages(cardIds);
            } else {
                if (typeof showToast === 'function') showToast('No cards available to download!', false);
            }
        });
    });
}

// ==========================================
// DOWNLOAD DOCX
// ==========================================

let pendingDocxDownloadIds = [];

function openDocFormatModal(cardIds) {
    pendingDocxDownloadIds = cardIds;
    const docFormatModalOverlay = document.getElementById('docFormatModalOverlay');
    if (docFormatModalOverlay) {
        docFormatModalOverlay.classList.add('active');
        document.body.style.overflow = 'hidden'; // Lock body scroll
    }
}

function closeDocFormatModal() {
    const docFormatModalOverlay = document.getElementById('docFormatModalOverlay');
    if (docFormatModalOverlay) {
        docFormatModalOverlay.classList.remove('active');
        document.body.style.overflow = ''; // Restore body scroll
    }
    pendingDocxDownloadIds = [];
}

function downloadDocx(cardIds, format) {
    const tableId = typeof TABLE_ID !== 'undefined' ? TABLE_ID : null;
    if (!tableId) {
        if (typeof showToast === 'function') showToast('Error: Table ID not found', false);
        return;
    }
    
    if (cardIds.length === 0) {
        if (typeof showToast === 'function') showToast('No cards selected!', false);
        return;
    }
    
    closeDocFormatModal();
    
    if (typeof showProgressToast === 'function') showProgressToast(`Preparing ${format.toUpperCase()} document...`, -1);
    
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `/api/table/${tableId}/cards/download-docx/`, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('X-CSRFToken', typeof getCSRFToken === 'function' ? getCSRFToken() : '');
    xhr.responseType = 'blob';
    
    xhr.onprogress = function(event) {
        if (event.lengthComputable) {
            const percentComplete = Math.round((event.loaded / event.total) * 100);
            if (typeof showProgressToast === 'function') showProgressToast(`Downloading... ${percentComplete}%`, percentComplete);
        } else {
            if (typeof showProgressToast === 'function') showProgressToast('Downloading...', -1);
        }
    };
    
    xhr.onload = function() {
        if (xhr.status === 200) {
            const blob = xhr.response;
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            
            const now = new Date();
            const timestamp = now.getFullYear().toString() + 
                             (now.getMonth() + 1).toString().padStart(2, '0') + 
                             now.getDate().toString().padStart(2, '0') + '_' +
                             now.getHours().toString().padStart(2, '0') + 
                             now.getMinutes().toString().padStart(2, '0') + 
                             now.getSeconds().toString().padStart(2, '0');
            a.download = `idcards_${timestamp}.${format}`;
            
            document.body.appendChild(a);
            a.click();
            
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            if (typeof showDownloadComplete === 'function') showDownloadComplete('Document downloaded successfully!');
        } else {
            if (typeof hideProgressToast === 'function') hideProgressToast();
            const reader = new FileReader();
            reader.onload = function() {
                try {
                    const error = JSON.parse(reader.result);
                    if (typeof showToast === 'function') showToast(error.message || 'Failed to download document', false);
                } catch(e) {
                    if (typeof showToast === 'function') showToast('Failed to download document', false);
                }
            };
            reader.readAsText(xhr.response);
        }
    };
    
    xhr.onerror = function() {
        if (typeof hideProgressToast === 'function') hideProgressToast();
        if (typeof showToast === 'function') showToast('Failed to download document', false);
    };
    
    xhr.send(JSON.stringify({ card_ids: cardIds, format: format }));
}

function initDownloadDocxHandlers() {
    const docFormatModalOverlay = document.getElementById('docFormatModalOverlay');
    
    document.getElementById('closeDocFormatModal')?.addEventListener('click', closeDocFormatModal);
    document.getElementById('cancelDocFormatModal')?.addEventListener('click', closeDocFormatModal);
    
    if (docFormatModalOverlay) {
        docFormatModalOverlay.addEventListener('click', function(e) {
            if (e.target === this) closeDocFormatModal();
        });
    }
    
    document.querySelectorAll('.format-card').forEach(card => {
        card.addEventListener('click', function() {
            const format = this.getAttribute('data-format');
            if (format && pendingDocxDownloadIds.length > 0) {
                downloadDocx(pendingDocxDownloadIds, format);
            }
        });
    });
    
    const downloadDocxBtnIds = ['downloadDocxBtn', 'downloadDocxBtnV', 'downloadDocxBtnP', 'downloadDocxBtnA', 'downloadDocxBtnD'];
    
    downloadDocxBtnIds.forEach(btnId => {
        document.getElementById(btnId)?.addEventListener('click', function() {
            const cardIds = typeof getCardIdsForAction === 'function' ? getCardIdsForAction() : [];
            if (cardIds.length > 0) {
                openDocFormatModal(cardIds);
            } else {
                if (typeof showToast === 'function') showToast('No cards available to download!', false);
            }
        });
    });
}

// ==========================================
// DOWNLOAD XLSX
// ==========================================

function downloadXlsx(cardIds) {
    const tableId = typeof TABLE_ID !== 'undefined' ? TABLE_ID : null;
    if (!tableId) {
        if (typeof showToast === 'function') showToast('Error: Table ID not found', false);
        return;
    }
    
    if (cardIds.length === 0) {
        if (typeof showToast === 'function') showToast('No cards to download!', false);
        return;
    }
    
    if (typeof showProgressToast === 'function') showProgressToast('Preparing Excel file...', -1);
    
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `/api/table/${tableId}/cards/download-xlsx/`, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('X-CSRFToken', typeof getCSRFToken === 'function' ? getCSRFToken() : '');
    xhr.responseType = 'blob';
    
    xhr.onprogress = function(event) {
        if (event.lengthComputable) {
            const percentComplete = Math.round((event.loaded / event.total) * 100);
            if (typeof showProgressToast === 'function') showProgressToast(`Downloading... ${percentComplete}%`, percentComplete);
        } else {
            if (typeof showProgressToast === 'function') showProgressToast('Downloading...', -1);
        }
    };
    
    xhr.onload = function() {
        if (xhr.status === 200) {
            const blob = xhr.response;
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            
            const now = new Date();
            const timestamp = now.getFullYear().toString() + 
                             (now.getMonth() + 1).toString().padStart(2, '0') + 
                             now.getDate().toString().padStart(2, '0') + '_' +
                             now.getHours().toString().padStart(2, '0') + 
                             now.getMinutes().toString().padStart(2, '0') + 
                             now.getSeconds().toString().padStart(2, '0');
            a.download = `idcards_${timestamp}.xlsx`;
            
            document.body.appendChild(a);
            a.click();
            
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            if (typeof showDownloadComplete === 'function') showDownloadComplete('Excel file downloaded successfully!');
        } else {
            if (typeof hideProgressToast === 'function') hideProgressToast();
            const reader = new FileReader();
            reader.onload = function() {
                try {
                    const error = JSON.parse(reader.result);
                    if (typeof showToast === 'function') showToast(error.message || 'Failed to download Excel file', false);
                } catch(e) {
                    if (typeof showToast === 'function') showToast('Failed to download Excel file', false);
                }
            };
            reader.readAsText(xhr.response);
        }
    };
    
    xhr.onerror = function() {
        if (typeof hideProgressToast === 'function') hideProgressToast();
        if (typeof showToast === 'function') showToast('Failed to download Excel file', false);
    };
    
    xhr.send(JSON.stringify({ card_ids: cardIds }));
}

function initDownloadXlsxHandlers() {
    const downloadXlsxBtnIds = ['downloadXlsxBtn', 'downloadXlsxBtnV', 'downloadXlsxBtnP', 'downloadXlsxBtnA', 'downloadXlsxBtnD'];
    
    downloadXlsxBtnIds.forEach(btnId => {
        document.getElementById(btnId)?.addEventListener('click', function() {
            const cardIds = typeof getCardIdsForAction === 'function' ? getCardIdsForAction() : [];
            if (cardIds.length > 0) {
                downloadXlsx(cardIds);
            } else {
                if (typeof showToast === 'function') showToast('No cards available to download!', false);
            }
        });
    });
}

// ==========================================
// REUPLOAD IMAGES
// ==========================================

let reuploadZipInput = null;
let pendingReuploadCardIds = [];

function reuploadImages(cardIds) {
    pendingReuploadCardIds = cardIds;
    if (reuploadZipInput) {
        reuploadZipInput.value = '';
        reuploadZipInput.click();
    }
}

function initReuploadHandlers() {
    // Create hidden file input for ZIP reupload
    reuploadZipInput = document.getElementById('reuploadZipInput');
    if (!reuploadZipInput) {
        reuploadZipInput = document.createElement('input');
        reuploadZipInput.type = 'file';
        reuploadZipInput.id = 'reuploadZipInput';
        reuploadZipInput.accept = '.zip';
        reuploadZipInput.style.display = 'none';
        document.body.appendChild(reuploadZipInput);
    }
    
    reuploadZipInput.addEventListener('change', async function() {
        const file = this.files[0];
        if (!file) return;
        
        if (!file.name.toLowerCase().endsWith('.zip')) {
            if (typeof showToast === 'function') showToast('Please select a ZIP file', false);
            this.value = '';
            return;
        }
        
        const tableId = typeof TABLE_ID !== 'undefined' ? TABLE_ID : null;
        if (!tableId) {
            if (typeof showToast === 'function') showToast('Error: Table ID not found', false);
            return;
        }
        
        if (typeof showProgressToast === 'function') showProgressToast('Reuploading images...', -1);
        
        const formData = new FormData();
        formData.append('zip_file', file);
        formData.append('card_ids', JSON.stringify(pendingReuploadCardIds));
        
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `/api/table/${tableId}/cards/reupload-images/`, true);
        xhr.setRequestHeader('X-CSRFToken', typeof getCSRFToken === 'function' ? getCSRFToken() : '');
        
        xhr.upload.onprogress = function(event) {
            if (event.lengthComputable) {
                const percentComplete = Math.round((event.loaded / event.total) * 100);
                if (typeof showProgressToast === 'function') showProgressToast(`Uploading... ${percentComplete}%`, percentComplete);
            }
        };
        
        xhr.onload = function() {
            try {
                const result = JSON.parse(xhr.responseText);
                if (xhr.status === 200 && result.success) {
                    if (typeof showDownloadComplete === 'function') showDownloadComplete(result.message || 'Images reuploaded successfully!');
                    setTimeout(() => {
                        window.location.reload();
                    }, 2000);
                } else {
                    if (typeof hideProgressToast === 'function') hideProgressToast();
                    if (typeof showToast === 'function') showToast(result.message || 'Reupload failed', false);
                }
            } catch (e) {
                if (typeof hideProgressToast === 'function') hideProgressToast();
                if (typeof showToast === 'function') showToast('Error processing response', false);
            }
        };
        
        xhr.onerror = function() {
            if (typeof hideProgressToast === 'function') hideProgressToast();
            if (typeof showToast === 'function') showToast('Failed to reupload images', false);
        };
        
        xhr.send(formData);
    });
    
    const reuploadBtnIds = ['reuploadImageBtn', 'reuploadImageBtnV', 'reuploadImageBtnP', 'reuploadImageBtnA', 'reuploadImageBtnD'];
    
    reuploadBtnIds.forEach(btnId => {
        document.getElementById(btnId)?.addEventListener('click', function() {
            const cardIds = typeof getCardIdsForAction === 'function' ? getCardIdsForAction() : [];
            if (cardIds.length > 0) {
                reuploadImages(cardIds);
            } else {
                if (typeof showToast === 'function') showToast('No cards available for reupload!', false);
            }
        });
    });
}

// ==========================================
// INITIALIZATION
// ==========================================

function initDownloadModule() {
    initDownloadImagesHandlers();
    initDownloadDocxHandlers();
    initDownloadXlsxHandlers();
    initReuploadHandlers();
}

// Expose globally
window.IDCardApp = window.IDCardApp || {};
window.IDCardApp.initDownloadModule = initDownloadModule;
window.IDCardApp.downloadImages = downloadImages;
window.IDCardApp.downloadDocx = downloadDocx;
window.IDCardApp.downloadXlsx = downloadXlsx;
window.IDCardApp.reuploadImages = reuploadImages;

console.log('IDCard Actions Download module loaded');
