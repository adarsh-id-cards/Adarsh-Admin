// ID Card Actions - Inline Edit Module
// Contains: Inline cell editing functionality

// ==========================================
// HELPER FUNCTIONS
// ==========================================

function getCSRFTokenForEdit() {
    const csrfCookie = document.cookie.split('; ')
        .find(row => row.startsWith('csrftoken='));
    return csrfCookie ? csrfCookie.split('=')[1] : '';
}

function getAdjacentCell(currentCell, direction) {
    const row = currentCell.closest('tr');
    const allCells = Array.from(row.querySelectorAll('td[data-field]'));
    const currentIndex = allCells.indexOf(currentCell);
    
    if (direction === 'next') {
        return allCells[currentIndex + 1] || null;
    } else if (direction === 'prev') {
        return allCells[currentIndex - 1] || null;
    }
    return null;
}

function isRowVisible(row) {
    const rect = row.getBoundingClientRect();
    return rect.top >= 0 && rect.bottom <= window.innerHeight;
}

// ==========================================
// INLINE CELL EDITING
// ==========================================

function startCellEdit(cell) {
    if (cell.querySelector('input, textarea')) return; // Already editing
    
    const field = cell.getAttribute('data-field');
    const cardId = cell.closest('tr').getAttribute('data-card-id');
    const currentValue = cell.textContent.trim();
    const originalWidth = cell.offsetWidth;
    const originalHeight = cell.offsetHeight;
    
    // Create input
    const input = document.createElement('input');
    input.type = 'text';
    input.value = currentValue;
    input.className = 'inline-edit-input';
    input.style.cssText = `
        width: ${originalWidth - 10}px;
        min-width: 80px;
        padding: 4px 8px;
        border: 2px solid #007bff;
        border-radius: 4px;
        font-size: inherit;
        font-family: inherit;
        background: white;
        outline: none;
        box-shadow: 0 0 5px rgba(0, 123, 255, 0.3);
    `;
    
    // Store original value
    cell.setAttribute('data-original-value', currentValue);
    
    // Clear cell and add input
    cell.innerHTML = '';
    cell.appendChild(input);
    input.focus();
    input.select();
    
    // Handle blur - save on focus out
    input.addEventListener('blur', function() {
        saveCellEdit(cell, input.value, cardId, field);
    });
    
    // Handle keydown
    input.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            input.blur();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            cancelCellEdit(cell);
        } else if (e.key === 'Tab') {
            e.preventDefault();
            input.blur();
            const adjacentCell = getAdjacentCell(cell, e.shiftKey ? 'prev' : 'next');
            if (adjacentCell) {
                startCellEdit(adjacentCell);
            }
        }
    });
}

function cancelCellEdit(cell) {
    const originalValue = cell.getAttribute('data-original-value') || '';
    cell.textContent = originalValue;
    cell.removeAttribute('data-original-value');
}

function saveCellEdit(cell, newValue, cardId, field) {
    const originalValue = cell.getAttribute('data-original-value') || '';
    
    // If no change, just restore
    if (newValue === originalValue) {
        cell.textContent = originalValue;
        cell.removeAttribute('data-original-value');
        return;
    }
    
    // Show loading state
    cell.innerHTML = '<span class="saving-indicator">Saving...</span>';
    cell.querySelector('.saving-indicator').style.cssText = `
        color: #666;
        font-style: italic;
    `;
    
    // Save via API
    const csrfToken = getCSRFTokenForEdit();
    
    fetch(`/api/card/${cardId}/update-field/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken,
        },
        body: JSON.stringify({
            field: field,
            value: newValue
        })
    })
    .then(response => {
        if (!response.ok) throw new Error('Update failed');
        return response.json();
    })
    .then(data => {
        cell.textContent = newValue;
        cell.removeAttribute('data-original-value');
        
        // Show success feedback
        cell.style.backgroundColor = '#d4edda';
        setTimeout(() => {
            cell.style.backgroundColor = '';
        }, 1000);
        
        if (typeof showToast === 'function') {
            showToast('Field updated successfully', 'success');
        }
    })
    .catch(error => {
        console.error('Error updating field:', error);
        cell.textContent = originalValue;
        cell.removeAttribute('data-original-value');
        
        // Show error feedback
        cell.style.backgroundColor = '#f8d7da';
        setTimeout(() => {
            cell.style.backgroundColor = '';
        }, 2000);
        
        if (typeof showToast === 'function') {
            showToast('Failed to update field', 'error');
        }
    });
}

// ==========================================
// EDITABLE CELLS INITIALIZATION
// ==========================================

function makeTableCellsEditable() {
    const table = document.getElementById('data-table');
    if (!table) return;
    
    table.addEventListener('dblclick', function(e) {
        const cell = e.target.closest('td[data-field]');
        if (!cell) return;
        
        // Check if cell is editable
        const field = cell.getAttribute('data-field');
        if (!field) return;
        
        // Don't edit checkbox or action columns
        if (cell.classList.contains('checkbox-column') || 
            cell.classList.contains('action-column') ||
            cell.querySelector('input[type="checkbox"]')) {
            return;
        }
        
        // Don't edit image fields via inline edit
        if (field.toLowerCase().includes('photo') || 
            field.toLowerCase().includes('image') ||
            field.toLowerCase().includes('picture')) {
            return;
        }
        
        startCellEdit(cell);
    });
}

// Add tooltip hint for editable cells
function addEditableHints() {
    const style = document.createElement('style');
    style.textContent = `
        td[data-field]:not(.checkbox-column):not(.action-column):hover {
            cursor: text;
            background-color: rgba(0, 123, 255, 0.05);
        }
        
        td[data-field]:not(.checkbox-column):not(.action-column)::after {
            content: '';
            position: absolute;
            right: 2px;
            top: 2px;
            width: 0;
            height: 0;
            border-left: 6px solid transparent;
            border-top: 6px solid rgba(0, 123, 255, 0.3);
            opacity: 0;
            transition: opacity 0.2s;
        }
        
        td[data-field]:not(.checkbox-column):not(.action-column):hover::after {
            opacity: 1;
        }
        
        .inline-edit-input:focus {
            outline: none;
            border-color: #0056b3;
        }
        
        .saving-indicator {
            animation: pulse 1s infinite;
        }
        
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
    `;
    document.head.appendChild(style);
}

// ==========================================
// IMAGE CELLS - CLICK TO VIEW
// ==========================================

function initImageCellHandlers() {
    document.querySelectorAll('.photo-thumbnail, .id-photo-cell img').forEach(img => {
        img.style.cursor = 'pointer';
        img.addEventListener('click', function(e) {
            e.stopPropagation();
            const fullSrc = this.src.replace('/thumbnails/', '/');
            openImagePreview(fullSrc);
        });
    });
}

function openImagePreview(src) {
    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'image-preview-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.9);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        cursor: pointer;
    `;
    
    // Create image
    const img = document.createElement('img');
    img.src = src;
    img.style.cssText = `
        max-width: 90vw;
        max-height: 90vh;
        object-fit: contain;
        border-radius: 8px;
        box-shadow: 0 10px 50px rgba(0, 0, 0, 0.5);
    `;
    
    // Close hint
    const hint = document.createElement('div');
    hint.textContent = 'Click anywhere to close';
    hint.style.cssText = `
        position: absolute;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        color: white;
        font-size: 14px;
        opacity: 0.7;
    `;
    
    overlay.appendChild(img);
    overlay.appendChild(hint);
    document.body.appendChild(overlay);
    
    // Close on click
    overlay.addEventListener('click', function() {
        document.body.removeChild(overlay);
    });
    
    // Close on escape
    document.addEventListener('keydown', function closeOnEscape(e) {
        if (e.key === 'Escape') {
            if (document.body.contains(overlay)) {
                document.body.removeChild(overlay);
            }
            document.removeEventListener('keydown', closeOnEscape);
        }
    });
}

// ==========================================
// ROW CLICK HANDLERS
// ==========================================

function initRowClickHandlers() {
    const table = document.getElementById('data-table');
    if (!table) {
        console.log('initRowClickHandlers: table not found');
        return;
    }
    
    console.log('initRowClickHandlers: Setting up row click handlers');
    
    // Single click on row (not on specific elements) toggles checkbox
        table.addEventListener('click', function(e) {
            const row = e.target.closest('tr[data-card-id]');
            if (!row) return;
            // Don't trigger on buttons, links, inputs, or editable cells being edited
            if (e.target.closest('button, a, input, .inline-edit-input, .dropdown')) return;
            // Don't trigger on action column
            if (e.target.closest('.action-column')) return;
            // Don't trigger if clicking on checkbox column directly
            if (e.target.closest('.checkbox-column')) return;
            // Enforce single selection: uncheck all other checkboxes and remove .selected from all rows
            const allRows = table.querySelectorAll('tbody tr[data-card-id]');
            allRows.forEach(r => {
                if (r !== row) {
                    r.classList.remove('selected');
                    const cb = r.querySelector('input[type="checkbox"]');
                    if (cb) cb.checked = false;
                }
            });
            // Select and check the clicked row
            row.classList.add('selected');
            const checkbox = row.querySelector('input[type="checkbox"]');
            if (checkbox) {
                checkbox.checked = true;
                checkbox.dispatchEvent(new Event('change', { bubbles: true }));
                console.log('Row clicked, checkbox set to true');
            }
        });
}

// ==========================================
// INITIALIZATION
// ==========================================

function initEditModule() {
    makeTableCellsEditable();
    addEditableHints();
    initImageCellHandlers();
    initRowClickHandlers();
}

// Expose globally
window.startCellEdit = startCellEdit;
window.cancelCellEdit = cancelCellEdit;
window.saveCellEdit = saveCellEdit;
window.openImagePreview = openImagePreview;

window.IDCardApp = window.IDCardApp || {};
window.IDCardApp.initEditModule = initEditModule;
window.IDCardApp.startCellEdit = startCellEdit;

console.log('IDCard Actions Edit module loaded');
