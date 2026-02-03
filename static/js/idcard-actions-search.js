// ID Card Actions - Search Module
// Contains: Search input, filter dropdown, sort dropdown, rows per page, search all modal

// ==========================================
// SEARCH INPUT HANDLERS
// ==========================================

function initSearchHandlers() {
    const searchInput = document.getElementById('searchInput');
    const searchClearBtn = document.getElementById('searchClearBtn');
    
    if (searchInput) {
        let searchTimeout;
        
        function updateClearButton() {
            if (searchClearBtn) {
                searchClearBtn.style.display = searchInput.value.trim() ? 'block' : 'none';
            }
        }
        
        searchInput.addEventListener('input', function() {
            updateClearButton();
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                if (typeof searchRows === 'function') {
                    searchRows(this.value);
                }
            }, 300);
        });
        
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                clearTimeout(searchTimeout);
                if (typeof searchRows === 'function') {
                    searchRows(this.value);
                }
            }
        });
        
        if (searchClearBtn) {
            searchClearBtn.addEventListener('click', function() {
                searchInput.value = '';
                updateClearButton();
                if (typeof searchRows === 'function') {
                    searchRows('');
                }
                searchInput.focus();
            });
        }
    }
}

// ==========================================
// FILTER DROPDOWN HANDLERS
// ==========================================

function initFilterHandlers() {
    const filterOptions = document.querySelectorAll('#filterOptions .dropdown-option');
    
    filterOptions.forEach(option => {
        option.addEventListener('click', function() {
            const fieldName = this.getAttribute('data-field');
            if (typeof filterByField === 'function') {
                filterByField(fieldName);
            }
            
            const filterToggle = document.getElementById('filterToggle');
            if (filterToggle) {
                const icon = '<i class="fa-solid fa-filter"></i> ';
                const chevron = ' <i class="fa-solid fa-chevron-down"></i>';
                filterToggle.innerHTML = icon + this.textContent.trim() + chevron;
            }
            
            const searchInput = document.getElementById('searchInput');
            if (searchInput) {
                if (fieldName === 'all') {
                    searchInput.placeholder = 'Search in all fields...';
                } else {
                    searchInput.placeholder = 'Search in ' + fieldName + '...';
                }
            }
            
            filterOptions.forEach(o => o.classList.remove('selected'));
            this.classList.add('selected');
            
            if (searchInput && searchInput.value.trim()) {
                if (typeof searchRows === 'function') {
                    searchRows(searchInput.value.trim());
                }
            }
        });
    });
}

// ==========================================
// SORT DROPDOWN HANDLERS
// ==========================================

function initSortHandlers() {
    const sortOptions = document.querySelectorAll('#sortOptions .dropdown-option');
    
    sortOptions.forEach(option => {
        option.addEventListener('click', function() {
            const value = this.getAttribute('data-value');
            if (typeof sortRows === 'function') {
                sortRows(value);
            }
            
            const sortToggle = document.getElementById('sortToggle');
            if (sortToggle) {
                const icon = '<i class="fa-solid fa-sort"></i> ';
                const chevron = ' <i class="fa-solid fa-chevron-down"></i>';
                sortToggle.innerHTML = icon + this.textContent.trim() + chevron;
            }
            
            sortOptions.forEach(o => o.classList.remove('selected'));
            this.classList.add('selected');
        });
    });
}

// ==========================================
// ROWS PER PAGE HANDLERS
// ==========================================

function initRowsPerPageHandlers() {
    const rowsOptions = document.querySelectorAll('#rowsOptions .dropdown-option');
    
    rowsOptions.forEach(option => {
        option.addEventListener('click', function() {
            const value = this.getAttribute('data-value');
            if (typeof setRowsPerPage === 'function') {
                setRowsPerPage(value);
            }
            
            const rowsSelectedText = document.getElementById('rowsSelectedText');
            if (rowsSelectedText) {
                rowsSelectedText.textContent = value;
            }
            
            rowsOptions.forEach(o => o.classList.remove('selected'));
            this.classList.add('selected');
        });
    });
}

// ==========================================
// SEARCH ALL MODAL
// ==========================================

let searchAllTimeout = null;

function initSearchAllModal() {
    const searchAllBtn = document.getElementById('searchAllBtn');
    const searchAllModalOverlay = document.getElementById('searchAllModalOverlay');
    const closeSearchAllModal = document.getElementById('closeSearchAllModal');
    const searchAllInput = document.getElementById('searchAllInput');
    const clearSearchInput = document.getElementById('clearSearchInput');
    const searchResultsContainer = document.getElementById('searchResultsContainer');
    
    function openSearchAllModal() {
        if (searchAllModalOverlay) {
            searchAllModalOverlay.classList.add('active');
            setTimeout(() => {
                if (searchAllInput) searchAllInput.focus();
            }, 100);
        }
    }
    
    function closeSearchAllModalFn() {
        if (searchAllModalOverlay) {
            searchAllModalOverlay.classList.remove('active');
        }
        if (searchAllInput) searchAllInput.value = '';
        if (clearSearchInput) clearSearchInput.style.display = 'none';
        if (searchResultsContainer) {
            searchResultsContainer.innerHTML = `
                <div class="search-placeholder">
                    <i class="fa-solid fa-search"></i>
                    <p>Type to search across all lists</p>
                </div>
            `;
        }
    }
    
    function performSearch(query) {
        const tableId = typeof TABLE_ID !== 'undefined' ? TABLE_ID : null;
        if (!tableId) {
            if (typeof showToast === 'function') showToast('Error: Table ID not found', 'error');
            return;
        }
        
        fetch(`/api/table/${tableId}/cards/search/?q=${encodeURIComponent(query)}`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    displaySearchResults(data.results, query, searchResultsContainer, closeSearchAllModalFn);
                } else {
                    if (searchResultsContainer) {
                        searchResultsContainer.innerHTML = `
                            <div class="search-no-results">
                                <i class="fa-solid fa-exclamation-circle"></i>
                                <p>Error: ${data.message}</p>
                            </div>
                        `;
                    }
                }
            })
            .catch(error => {
                console.error('Search error:', error);
                if (searchResultsContainer) {
                    searchResultsContainer.innerHTML = `
                        <div class="search-no-results">
                            <i class="fa-solid fa-exclamation-circle"></i>
                            <p>Error searching. Please try again.</p>
                        </div>
                    `;
                }
            });
    }
    
    if (searchAllBtn) {
        searchAllBtn.addEventListener('click', openSearchAllModal);
    }
    
    if (closeSearchAllModal) {
        closeSearchAllModal.addEventListener('click', closeSearchAllModalFn);
    }
    
    if (searchAllModalOverlay) {
        searchAllModalOverlay.addEventListener('click', function(e) {
            if (e.target === this) closeSearchAllModalFn();
        });
    }
    
    if (clearSearchInput) {
        clearSearchInput.addEventListener('click', function() {
            if (searchAllInput) searchAllInput.value = '';
            this.style.display = 'none';
            if (searchResultsContainer) {
                searchResultsContainer.innerHTML = `
                    <div class="search-placeholder">
                        <i class="fa-solid fa-search"></i>
                        <p>Type to search across all lists</p>
                    </div>
                `;
            }
            if (searchAllInput) searchAllInput.focus();
        });
    }
    
    if (searchAllInput) {
        searchAllInput.addEventListener('input', function() {
            const query = this.value.trim();
            
            if (clearSearchInput) {
                clearSearchInput.style.display = query.length > 0 ? 'flex' : 'none';
            }
            
            if (searchAllTimeout) clearTimeout(searchAllTimeout);
            
            if (query.length < 2) {
                if (searchResultsContainer) {
                    searchResultsContainer.innerHTML = `
                        <div class="search-placeholder">
                            <i class="fa-solid fa-search"></i>
                            <p>${query.length === 0 ? 'Type to search across all lists' : 'Enter at least 2 characters'}</p>
                        </div>
                    `;
                }
                return;
            }
            
            if (searchResultsContainer) {
                searchResultsContainer.innerHTML = `
                    <div class="search-loading">
                        <i class="fa-solid fa-spinner fa-spin"></i>
                        <p>Searching...</p>
                    </div>
                `;
            }
            
            searchAllTimeout = setTimeout(() => {
                performSearch(query);
            }, 300);
        });
    }
    
    // Expose close function
    window.closeSearchAllModal = closeSearchAllModalFn;
}

function displaySearchResults(results, query, container, closeModalFn) {
    if (!container) return;
    
    if (results.length === 0) {
        container.innerHTML = `
            <div class="search-no-results">
                <i class="fa-solid fa-search"></i>
                <p>No results found for "${query}"</p>
            </div>
        `;
        return;
    }
    
    let html = `<div class="search-results-count">${results.length} result${results.length > 1 ? 's' : ''} found</div>`;
    html += '<div class="search-results-list">';
    
    results.forEach(result => {
        const photoHtml = result.photo 
            ? `<img src="${result.photo}" class="search-result-photo" alt="Photo">`
            : `<div class="search-result-photo-placeholder"><i class="fa-solid fa-user"></i></div>`;
        
        html += `
            <div class="search-result-item" data-card-id="${result.id}" data-status="${result.status}">
                ${photoHtml}
                <div class="search-result-info">
                    <div class="search-result-name">${result.display_name}</div>
                    <div class="search-result-match">Match: <strong>${result.matched_field}</strong> = "${result.matched_value}"</div>
                    <span class="search-result-status ${result.status}">${result.status_display}</span>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
    
    container.querySelectorAll('.search-result-item').forEach(item => {
        item.addEventListener('click', function() {
            const cardId = this.getAttribute('data-card-id');
            const status = this.getAttribute('data-status');
            
            if (closeModalFn) closeModalFn();
            
            const currentUrl = new URL(window.location.href);
            currentUrl.searchParams.set('status', status);
            currentUrl.searchParams.set('highlight', cardId);
            window.location.href = currentUrl.toString();
        });
    });
}

// ==========================================
// IMAGE SORT MODAL
// ==========================================

function initImageSortModal() {
    const imageSortBtn = document.getElementById('imageSortBtn');
    const imageSortModalOverlay = document.getElementById('imageSortModalOverlay');
    const closeImageSortModal = document.getElementById('closeImageSortModal');
    const clearImageSort = document.getElementById('clearImageSort');
    const applyImageSort = document.getElementById('applyImageSort');
    const imageSortColumn = document.getElementById('imageSortColumn');
    const imageSortCondition = document.getElementById('imageSortCondition');
    
    function openImageSortModal() {
        if (imageSortModalOverlay) {
            imageSortModalOverlay.classList.add('active');
        }
    }
    
    function closeImageSortModalFn() {
        if (imageSortModalOverlay) {
            imageSortModalOverlay.classList.remove('active');
        }
    }
    
    if (imageSortBtn) {
        imageSortBtn.addEventListener('click', openImageSortModal);
    }
    
    if (closeImageSortModal) {
        closeImageSortModal.addEventListener('click', closeImageSortModalFn);
    }
    
    if (imageSortModalOverlay) {
        imageSortModalOverlay.addEventListener('click', function(e) {
            if (e.target === this) closeImageSortModalFn();
        });
    }
    
    if (clearImageSort) {
        clearImageSort.addEventListener('click', function() {
            if (imageSortColumn) imageSortColumn.value = '';
            if (imageSortCondition) imageSortCondition.value = '';
            
            const rows = document.querySelectorAll('#cardsTableBody tr[data-card-id]');
            rows.forEach(row => {
                row.style.display = '';
            });
            
            closeImageSortModalFn();
            if (typeof showToast === 'function') showToast('Image filter cleared');
        });
    }
    
    if (applyImageSort) {
        applyImageSort.addEventListener('click', function() {
            const columnName = imageSortColumn?.value;
            const condition = imageSortCondition?.value;
            
            if (!columnName) {
                if (typeof showToast === 'function') showToast('Please select an image column', 'error');
                return;
            }
            
            if (!condition) {
                if (typeof showToast === 'function') showToast('Please select a condition', 'error');
                return;
            }
            
            const rows = document.querySelectorAll('#cardsTableBody tr[data-card-id]');
            let visibleCount = 0;
            
            rows.forEach(row => {
                const imageCell = row.querySelector(`td.image-cell[data-field-name="${columnName}"]`);
                
                if (!imageCell) {
                    row.style.display = '';
                    return;
                }
                
                const hasImage = imageCell.querySelector('img.table-image') !== null;
                const hasPlaceholder = imageCell.querySelector('.no-image.passport-placeholder') !== null;
                const originalValue = imageCell.getAttribute('data-original-value');
                
                let showRow = false;
                
                switch (condition) {
                    case 'complete':
                        showRow = hasImage && originalValue && originalValue.trim() !== '';
                        break;
                    case 'pending':
                        showRow = hasPlaceholder && (!originalValue || originalValue.trim() === '');
                        break;
                    case 'incomplete':
                        showRow = !hasImage && !hasPlaceholder;
                        break;
                }
                
                row.style.display = showRow ? '' : 'none';
                if (showRow) visibleCount++;
            });
            
            closeImageSortModalFn();
            
            const conditionText = condition === 'complete' ? 'Complete' : 
                                  condition === 'pending' ? 'Pending' : 'Incomplete';
            if (typeof showToast === 'function') {
                showToast(`Showing ${visibleCount} cards with ${conditionText} images in "${columnName.toUpperCase()}"`);
            }
        });
    }
}

// ==========================================
// INITIALIZATION
// ==========================================

function initSearchModule() {
    initSearchHandlers();
    initFilterHandlers();
    initSortHandlers();
    initRowsPerPageHandlers();
    initSearchAllModal();
    initImageSortModal();
}

// Expose globally
window.IDCardApp = window.IDCardApp || {};
window.IDCardApp.initSearchModule = initSearchModule;
window.IDCardApp.initSearchAllModal = initSearchAllModal;
window.IDCardApp.initImageSortModal = initImageSortModal;

console.log('IDCard Actions Search module loaded');
