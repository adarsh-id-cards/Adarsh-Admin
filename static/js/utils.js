// Shared Utilities Module
// Contains: CSRF token helper, Toast notifications
// Used across all pages to avoid code duplication

// ==========================================
// CSRF TOKEN HELPER
// ==========================================

/**
 * Get CSRF token from cookies for Django form submissions
 * @returns {string} CSRF token value
 */
function getCSRFToken() {
    const cookie = document.cookie.split(';').find(c => c.trim().startsWith('csrftoken='));
    return cookie ? cookie.split('=')[1] : '';
}

// Expose globally
window.getCSRFToken = getCSRFToken;

// ==========================================
// TOAST NOTIFICATION SYSTEM
// ==========================================

/**
 * Show a toast notification
 * @param {string} message - Message to display
 * @param {string|boolean} type - 'success', 'error', 'info' or boolean (true=success, false=error)
 */
function showToast(message, type = 'success') {
    // Normalize type parameter (support both string and boolean)
    if (typeof type === 'boolean') {
        type = type ? 'success' : 'error';
    }
    
    // Get or create toast element
    let toast = document.getElementById('toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        toast.className = 'toast';
        toast.innerHTML = `
            <i id="toastIcon" class="fa-solid fa-check-circle"></i>
            <span id="toastMessage">Success!</span>
        `;
        document.body.appendChild(toast);
    }
    
    // Get toast elements
    const toastMessage = document.getElementById('toastMessage') || toast.querySelector('span');
    const toastIcon = document.getElementById('toastIcon') || toast.querySelector('i');
    const toastProgress = document.getElementById('toastProgress');
    const toastProgressBar = document.getElementById('toastProgressBar');
    
    // Set message
    if (toastMessage) {
        toastMessage.textContent = message;
    }
    
    // Hide progress bar for regular toasts
    if (toastProgress) {
        toastProgress.style.display = 'none';
    }
    if (toastProgressBar) {
        toastProgressBar.classList.remove('indeterminate');
        toastProgressBar.style.width = '0%';
    }
    
    // Set icon based on type
    if (toastIcon) {
        switch (type) {
            case 'success':
                toastIcon.className = 'fa-solid fa-check-circle';
                break;
            case 'error':
                toastIcon.className = 'fa-solid fa-times-circle';
                break;
            case 'info':
                toastIcon.className = 'fa-solid fa-info-circle';
                break;
            default:
                toastIcon.className = 'fa-solid fa-check-circle';
        }
    }
    
    // Show toast with appropriate class
    toast.className = 'toast show ' + type;
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Expose globally
window.showToast = showToast;

// ==========================================
// PROGRESS TOAST (for downloads)
// ==========================================

let progressToastTimeout = null;

/**
 * Show a progress toast with indeterminate or determinate progress
 * @param {string} message - Message to display
 * @param {number} progress - Progress percentage (0-100), or -1 for indeterminate
 */
function showProgressToast(message, progress = -1) {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    const toastIcon = document.getElementById('toastIcon');
    const toastProgress = document.getElementById('toastProgress');
    const toastProgressBar = document.getElementById('toastProgressBar');
    const toastPercent = document.getElementById('toastPercent');
    
    // Clear any existing timeout
    if (progressToastTimeout) {
        clearTimeout(progressToastTimeout);
        progressToastTimeout = null;
    }
    
    if (toast && toastMessage) {
        toastMessage.textContent = message;
        
        // Set downloading icon (spinner)
        if (toastIcon) {
            toastIcon.className = 'fa-solid fa-spinner fa-spin';
        }
        
        // Show progress bar
        if (toastProgress) {
            toastProgress.style.display = 'block';
        }
        
        // Show/update percentage
        if (toastPercent) {
            if (progress >= 0) {
                toastPercent.style.display = 'inline';
                toastPercent.textContent = Math.round(progress) + '%';
            } else {
                toastPercent.style.display = 'none';
            }
        }
        
        if (toastProgressBar) {
            if (progress < 0) {
                // Indeterminate progress
                toastProgressBar.classList.add('indeterminate');
                toastProgressBar.style.width = '30%';
            } else {
                // Determinate progress
                toastProgressBar.classList.remove('indeterminate');
                toastProgressBar.style.width = Math.min(progress, 100) + '%';
            }
        }
        
        toast.className = 'toast show downloading';
    }
}

/**
 * Show download complete toast
 * @param {string} message - Success message
 */
function showDownloadComplete(message = 'Successfully downloaded!') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    const toastIcon = document.getElementById('toastIcon');
    const toastProgress = document.getElementById('toastProgress');
    const toastProgressBar = document.getElementById('toastProgressBar');
    const toastPercent = document.getElementById('toastPercent');
    
    // Clear any existing timeout
    if (progressToastTimeout) {
        clearTimeout(progressToastTimeout);
        progressToastTimeout = null;
    }
    
    if (toast && toastMessage) {
        toastMessage.textContent = message;
        
        // Set success icon
        if (toastIcon) {
            toastIcon.className = 'fa-solid fa-check-circle';
        }
        
        // Show progress bar at 100%
        if (toastProgress) {
            toastProgress.style.display = 'block';
        }
        
        if (toastProgressBar) {
            toastProgressBar.classList.remove('indeterminate');
            toastProgressBar.style.width = '100%';
        }
        
        if (toastPercent) {
            toastPercent.style.display = 'inline';
            toastPercent.textContent = '100%';
        }
        
        toast.className = 'toast show success';
        
        // Hide after 3 seconds
        progressToastTimeout = setTimeout(() => {
            toast.classList.remove('show');
            // Reset progress bar
            if (toastProgress) {
                toastProgress.style.display = 'none';
            }
            if (toastProgressBar) {
                toastProgressBar.style.width = '0%';
            }
        }, 3000);
    }
}

/**
 * Hide the toast immediately
 */
function hideToast() {
    const toast = document.getElementById('toast');
    if (toast) {
        toast.classList.remove('show');
    }
    if (progressToastTimeout) {
        clearTimeout(progressToastTimeout);
        progressToastTimeout = null;
    }
}

// Expose globally
window.showProgressToast = showProgressToast;
window.showDownloadComplete = showDownloadComplete;
window.hideToast = hideToast;

// Module loaded indicator
console.log('Utils module loaded');
