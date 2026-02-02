// ID Card Actions Page JavaScript
// Works with Django templates

document.addEventListener('DOMContentLoaded', function() {
    
    // ==========================================
    // HORIZONTAL SCROLL WITH ALT + MOUSE WHEEL
    // ==========================================
    
    const tableContainer = document.querySelector('.idcard-table');
    if (tableContainer) {
        tableContainer.addEventListener('wheel', function(e) {
            // If Alt key is held, scroll horizontally
            if (e.altKey) {
                e.preventDefault();
                // Slow scroll speed - 25% for smoother scrolling
                this.scrollLeft += e.deltaY * 0.25;
            }
        }, { passive: false });
    }
    
    // ==========================================
    // DYNAMIC TEXT ALIGNMENT (COLUMN-BASED)
    // ==========================================
    
    function applyDynamicAlignment() {
        const table = document.querySelector('.idcard-table table');
        if (!table) return;
        
        const rows = table.querySelectorAll('tbody tr[data-card-id]');
        if (rows.length === 0) return;
        
        // Get all dynamic field columns (skip checkbox, sr no, image fields, action, fixed cols)
        const headerCells = table.querySelectorAll('thead th');
        const columnAlignments = [];
        
        // First pass: determine if any cell in each column has long text (> 15 chars)
        headerCells.forEach((th, colIndex) => {
            // Skip non-dynamic columns
            if (th.classList.contains('checkbox-col') || 
                th.classList.contains('sr-col') || 
                th.classList.contains('image-col') ||
                th.classList.contains('action-col') ||
                th.classList.contains('fixed-col')) {
                columnAlignments[colIndex] = null; // Don't change these
                return;
            }
            
            // Check all cells in this column
            let hasLongText = false;
            rows.forEach(row => {
                const cell = row.cells[colIndex];
                if (cell && cell.classList.contains('dynamic-field')) {
                    const text = cell.textContent.trim();
                    if (text.length > 15) {
                        hasLongText = true;
                    }
                }
            });
            
            // If any cell has long text, all cells in column should be left aligned
            columnAlignments[colIndex] = hasLongText ? 'left' : 'left'; // Always left for consistency
        });
        
        // Second pass: apply alignment to all cells in each column
        rows.forEach(row => {
            row.querySelectorAll('td.dynamic-field').forEach(cell => {
                cell.style.textAlign = 'left';
            });
        });
        
        // Sr No column - center
        document.querySelectorAll('.idcard-table td:nth-child(2)').forEach(cell => {
            cell.style.textAlign = 'center';
        });
    }
    
    // Apply on page load
    applyDynamicAlignment();
    
    // Re-apply after any cell edit
    window.applyDynamicAlignment = applyDynamicAlignment;
    
    // Set active sidebar link
    const activeClientsLink = document.getElementById('activeClientsLink');
    const allClientsLink = document.getElementById('allClientsLink');
    if (activeClientsLink) activeClientsLink.classList.add('active');
    if (allClientsLink) allClientsLink.classList.remove('active');
    
    // Sidebar Toggle
    const sidebar = document.getElementById("sidebar");
    const sidebarToggle = document.getElementById("sidebarToggle");
    
    if (sidebarToggle && sidebar) {
        const isCollapsed = localStorage.getItem("sidebarCollapsed") === "true";
        if (isCollapsed) {
            sidebar.classList.add("collapsed");
            document.body.classList.add("sidebar-collapsed");
            sidebarToggle.innerHTML = '<i class="fa-solid fa-bars"></i>';
        } else {
            sidebarToggle.innerHTML = '<i class="fa-solid fa-xmark"></i>';
        }
        
        sidebarToggle.addEventListener("click", function() {
            sidebar.classList.toggle("collapsed");
            document.body.classList.toggle("sidebar-collapsed");
            
            const collapsed = sidebar.classList.contains("collapsed");
            localStorage.setItem("sidebarCollapsed", collapsed);
            sidebarToggle.innerHTML = collapsed ? '<i class="fa-solid fa-bars"></i>' : '<i class="fa-solid fa-xmark"></i>';
        });
    }
    
    // Add body class based on current status
    if (typeof CURRENT_STATUS !== 'undefined') {
        document.body.classList.add('action-' + (CURRENT_STATUS || 'pending'));
    }
    
    // ==========================================
    // CHECKBOX FUNCTIONALITY
    // ==========================================
    
    const selectAll = document.getElementById("selectAll");
    
    // Function to get current row checkboxes (live query)
    function getRowCheckboxes() {
        return document.querySelectorAll(".rowCheckbox");
    }
    
    // Update button states when checkboxes change
    function updateButtonStates() {
        const rowCheckboxes = getRowCheckboxes();
        const checkedBoxes = [...rowCheckboxes].filter(cb => cb.checked);
        const singleSelected = checkedBoxes.length === 1;
        const anySelected = checkedBoxes.length >= 1;
        const noneSelected = checkedBoxes.length === 0;
        
        // Get all action buttons from current action bar
        const currentStatus = typeof CURRENT_STATUS !== 'undefined' ? CURRENT_STATUS : 'pending';
        
        // No-selection buttons (Add, Upload XLSX) - disabled when any row is selected
        const addBtn = document.getElementById('addBtn');
        const uploadXlsxBtn = document.getElementById('uploadXlsxBtn');
        if (addBtn) addBtn.disabled = anySelected;
        if (uploadXlsxBtn) uploadXlsxBtn.disabled = anySelected;
        
        // Enable/disable buttons based on selection
        // Single select buttons (Edit, View)
        document.querySelectorAll('[id^="editBtn"], [id^="viewBtn"]').forEach(btn => {
            if (btn) btn.disabled = !singleSelected;
        });
        
        // Multi select buttons (Delete, Verify, Approve, Unapproved, Retrieve, Unverify)
        document.querySelectorAll('[id^="deleteBtn"], [id^="verifyBtn"], [id^="approveBtn"], [id^="unapprovedBtn"], [id^="retrieveBtn"], [id^="unverifyBtn"]').forEach(btn => {
            if (btn) btn.disabled = !anySelected;
        });
        
        // Download buttons - always enabled (work on selected or all)
        // No disabling needed - buttons work on all cards if none selected
        
        // Reupload buttons - always enabled (work on selected or all)
        // No disabling needed - buttons work on all cards if none selected
        
        // Delete Permanent button (Pool list only)
        const deletePermanentBtn = document.getElementById('deletePermanentBtnP');
        if (deletePermanentBtn) deletePermanentBtn.disabled = !anySelected;
    }
    
    // Select All checkbox
    if (selectAll) {
        selectAll.addEventListener("change", function() {
            const rowCheckboxes = getRowCheckboxes();
            rowCheckboxes.forEach(cb => {
                cb.checked = this.checked;
            });
            updateButtonStates();
        });
    }
    
    // Individual row checkboxes - use event delegation
    const tableBody = document.getElementById('cardsTableBody');
    if (tableBody) {
        // Checkbox change event
        tableBody.addEventListener('change', function(e) {
            if (e.target.classList.contains('rowCheckbox')) {
                const rowCheckboxes = getRowCheckboxes();
                if (!e.target.checked) {
                    selectAll.checked = false;
                } else if ([...rowCheckboxes].every(c => c.checked)) {
                    selectAll.checked = true;
                }
                updateButtonStates();
            }
        });
    }
    
    // ==========================================
    // DROPDOWN FUNCTIONALITY
    // ==========================================
    
    function setupDropdown(dropdownId) {
        const dropdown = document.getElementById(dropdownId);
        if (!dropdown) return;
        
        const toggle = dropdown.querySelector('.dropdown-toggle');
        const options = dropdown.querySelectorAll('.dropdown-option');
        
        toggle.addEventListener('click', function(e) {
            e.stopPropagation();
            // Close other dropdowns
            document.querySelectorAll('.custom-dropdown.open').forEach(d => {
                if (d !== dropdown) d.classList.remove('open');
            });
            dropdown.classList.toggle('open');
        });
        
        options.forEach(option => {
            option.addEventListener('click', function() {
                options.forEach(o => o.classList.remove('selected'));
                this.classList.add('selected');
                
                // Update toggle text if needed
                const selectedText = toggle.querySelector('span');
                if (selectedText) {
                    selectedText.textContent = this.textContent;
                }
                
                dropdown.classList.remove('open');
            });
        });
    }
    
    setupDropdown('filterDropdown');
    setupDropdown('sortDropdown');
    setupDropdown('rowsDropdown');
    
    // Close dropdowns when clicking outside
    document.addEventListener('click', function() {
        document.querySelectorAll('.custom-dropdown.open').forEach(d => {
            d.classList.remove('open');
        });
    });
    
    // ==========================================
    // SEARCH, FILTER, SORT & PAGINATION
    // ==========================================
    
    // State variables
    let allRows = [];
    let filteredRows = [];
    let currentPage = 1;
    let rowsPerPage = 50;
    let currentFilter = 'all';
    let currentSort = 'sr-asc';
    let searchQuery = '';
    
    // Initialize rows array from table
    function initializeRows() {
        const tableBody = document.getElementById('cardsTableBody');
        if (!tableBody) return;
        allRows = Array.from(tableBody.querySelectorAll('tr[data-card-id]'));
        filteredRows = [...allRows];
    }
    
    // Search function
    function searchRows(query) {
        searchQuery = query.toLowerCase().trim();
        applyFiltersAndSort();
    }
    
    // Filter by field function (column-based filtering)
    let currentFilterField = 'all';
    
    function filterByField(fieldName) {
        currentFilterField = fieldName;
        applyFiltersAndSort();
    }
    
    // Get column index for a field name
    function getFieldColumnIndex(fieldName) {
        const headerRow = document.querySelector('.idcard-table thead tr');
        if (!headerRow) return -1;
        
        const headers = headerRow.querySelectorAll('th');
        for (let i = 0; i < headers.length; i++) {
            const headerText = headers[i].textContent.trim().toUpperCase();
            if (headerText === fieldName.toUpperCase()) {
                return i;
            }
        }
        return -1;
    }
    
    // Sort function
    function sortRows(sortValue) {
        currentSort = sortValue;
        applyFiltersAndSort();
    }
    
    // Get date from row's "Last Updated" column
    function getRowDate(row) {
        const cells = row.querySelectorAll('td');
        // Last Updated is second-to-last column
        const dateCell = cells[cells.length - 2];
        if (!dateCell) return new Date(0);
        
        const dateText = dateCell.textContent.trim();
        // Parse date format: "02-Feb-2026 10:30 AM"
        const parsed = Date.parse(dateText.replace(/-/g, ' '));
        return isNaN(parsed) ? new Date(0) : new Date(parsed);
    }
    
    // Get name from row (usually first dynamic field after Sr No.)
    function getRowName(row) {
        const cells = row.querySelectorAll('td');
        // Name is typically in the 3rd column (after checkbox and Sr No.)
        if (cells.length > 2) {
            return cells[2].textContent.trim().toLowerCase();
        }
        return '';
    }
    
    // Get Sr No from row
    function getRowSrNo(row) {
        const cells = row.querySelectorAll('td');
        if (cells.length > 1) {
            return parseInt(cells[1].textContent.trim()) || 0;
        }
        return 0;
    }
    
    // Apply all filters and sort
    function applyFiltersAndSort() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        
        // Get column index for the filter field
        const filterColumnIndex = currentFilterField !== 'all' ? getFieldColumnIndex(currentFilterField) : -1;
        
        // Start with all rows
        filteredRows = allRows.filter(row => {
            // Search filter
            if (searchQuery) {
                if (currentFilterField === 'all') {
                    // Search in all columns
                    const rowText = row.textContent.toLowerCase();
                    if (!rowText.includes(searchQuery)) {
                        return false;
                    }
                } else if (filterColumnIndex >= 0) {
                    // Search only in the specific column
                    const cells = row.querySelectorAll('td');
                    if (filterColumnIndex < cells.length) {
                        const cellText = cells[filterColumnIndex].textContent.toLowerCase();
                        if (!cellText.includes(searchQuery)) {
                            return false;
                        }
                    } else {
                        return false;
                    }
                }
            }
            
            // Date filter (if currentFilter is date-based)
            if (currentFilter !== 'all' && (currentFilter === 'today' || currentFilter === 'week' || currentFilter === 'month')) {
                const rowDate = getRowDate(row);
                rowDate.setHours(0, 0, 0, 0);
                
                if (currentFilter === 'today') {
                    if (rowDate.getTime() !== today.getTime()) return false;
                } else if (currentFilter === 'week') {
                    if (rowDate < weekAgo) return false;
                } else if (currentFilter === 'month') {
                    if (rowDate < monthAgo) return false;
                }
            }
            
            return true;
        });
        
        // Sort
        filteredRows.sort((a, b) => {
            switch (currentSort) {
                case 'name-asc':
                    return getRowName(a).localeCompare(getRowName(b));
                case 'name-desc':
                    return getRowName(b).localeCompare(getRowName(a));
                case 'date-new':
                    return getRowDate(b) - getRowDate(a);
                case 'date-old':
                    return getRowDate(a) - getRowDate(b);
                case 'sr-asc':
                    return getRowSrNo(a) - getRowSrNo(b);
                case 'sr-desc':
                    return getRowSrNo(b) - getRowSrNo(a);
                default:
                    return 0;
            }
        });
        
        // Reset to first page when filter/sort changes
        currentPage = 1;
        renderTable();
    }
    
    // Render table with pagination
    function renderTable() {
        const tableBody = document.getElementById('cardsTableBody');
        if (!tableBody) return;
        
        // Hide all rows first
        allRows.forEach(row => row.style.display = 'none');
        
        // Remove any existing "no results" row
        const existingNoResults = tableBody.querySelector('.no-results-row');
        if (existingNoResults) existingNoResults.remove();
        
        // Calculate pagination
        const totalRows = filteredRows.length;
        const totalPages = Math.ceil(totalRows / rowsPerPage) || 1;
        
        // Ensure current page is valid
        if (currentPage > totalPages) currentPage = totalPages;
        if (currentPage < 1) currentPage = 1;
        
        // Get rows for current page
        const startIndex = (currentPage - 1) * rowsPerPage;
        const endIndex = Math.min(startIndex + rowsPerPage, totalRows);
        
        // Show rows for current page
        for (let i = startIndex; i < endIndex; i++) {
            if (filteredRows[i]) {
                filteredRows[i].style.display = '';
            }
        }
        
        // Show "no results" message if filtered to nothing but there are cards
        if (totalRows === 0 && allRows.length > 0) {
            const colCount = tableBody.closest('table').querySelectorAll('thead th').length;
            const noResultsRow = document.createElement('tr');
            noResultsRow.className = 'no-results-row';
            noResultsRow.innerHTML = `
                <td colspan="${colCount}" class="no-cards">
                    <div class="empty-state">
                        <i class="fa-solid fa-search"></i>
                        <h3>No Results Found</h3>
                        <p>Try adjusting your search or filter criteria</p>
                    </div>
                </td>
            `;
            tableBody.appendChild(noResultsRow);
        }
        
        // Update pagination info
        updatePaginationInfo(totalRows > 0 ? startIndex + 1 : 0, endIndex, totalRows, totalPages);
    }
    
    // Update pagination UI
    function updatePaginationInfo(start, end, total, totalPages) {
        // Update info text
        const paginationInfo = document.querySelector('.pagination-info');
        if (paginationInfo) {
            if (total === 0) {
                paginationInfo.innerHTML = 'Showing <strong>0</strong> results';
            } else {
                paginationInfo.innerHTML = `Showing <strong>${start}-${end}</strong> of <strong>${total}</strong> results`;
            }
        }
        
        // Update page buttons
        const pageNumbersContainer = document.querySelector('.page-numbers');
        if (pageNumbersContainer) {
            pageNumbersContainer.innerHTML = '';
            
            // Determine which page numbers to show
            let startPage = Math.max(1, currentPage - 2);
            let endPage = Math.min(totalPages, currentPage + 2);
            
            // Adjust to always show 5 pages if possible
            if (endPage - startPage < 4) {
                if (startPage === 1) {
                    endPage = Math.min(totalPages, 5);
                } else if (endPage === totalPages) {
                    startPage = Math.max(1, totalPages - 4);
                }
            }
            
            for (let i = startPage; i <= endPage; i++) {
                const btn = document.createElement('button');
                btn.className = 'page-num' + (i === currentPage ? ' active' : '');
                btn.textContent = i;
                btn.addEventListener('click', () => goToPage(i));
                pageNumbersContainer.appendChild(btn);
            }
        }
        
        // Update prev/next button states
        const firstBtn = document.getElementById('firstPage');
        const prevBtn = document.getElementById('prevPage');
        const nextBtn = document.getElementById('nextPage');
        const lastBtn = document.getElementById('lastPage');
        
        if (firstBtn) firstBtn.disabled = currentPage === 1;
        if (prevBtn) prevBtn.disabled = currentPage === 1;
        if (nextBtn) nextBtn.disabled = currentPage === totalPages || totalPages === 0;
        if (lastBtn) lastBtn.disabled = currentPage === totalPages || totalPages === 0;
    }
    
    // Pagination navigation functions
    function goToPage(page) {
        const totalPages = Math.ceil(filteredRows.length / rowsPerPage) || 1;
        if (page >= 1 && page <= totalPages) {
            currentPage = page;
            renderTable();
        }
    }
    
    function goToFirstPage() {
        goToPage(1);
    }
    
    function goToPrevPage() {
        goToPage(currentPage - 1);
    }
    
    function goToNextPage() {
        goToPage(currentPage + 1);
    }
    
    function goToLastPage() {
        const totalPages = Math.ceil(filteredRows.length / rowsPerPage) || 1;
        goToPage(totalPages);
    }
    
    function setRowsPerPage(count) {
        rowsPerPage = parseInt(count) || 10;
        currentPage = 1;
        renderTable();
    }
    
    // Initialize pagination and search
    initializeRows();
    renderTable();
    
    // Search input handler
    const searchInput = document.getElementById('searchInput');
    const searchClearBtn = document.getElementById('searchClearBtn');
    
    if (searchInput) {
        let searchTimeout;
        
        // Show/hide clear button based on input
        function updateClearButton() {
            if (searchClearBtn) {
                searchClearBtn.style.display = searchInput.value.trim() ? 'block' : 'none';
            }
        }
        
        searchInput.addEventListener('input', function() {
            updateClearButton();
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                searchRows(this.value);
            }, 300); // Debounce 300ms
        });
        
        // Enter key to search
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                clearTimeout(searchTimeout);
                searchRows(this.value);
            }
        });
        
        // Clear button handler
        if (searchClearBtn) {
            searchClearBtn.addEventListener('click', function() {
                searchInput.value = '';
                updateClearButton();
                searchRows('');
                searchInput.focus();
            });
        }
    }
    
    // Filter dropdown handler
    const filterOptions = document.querySelectorAll('#filterOptions .dropdown-option');
    filterOptions.forEach(option => {
        option.addEventListener('click', function() {
            const fieldName = this.getAttribute('data-field');
            filterByField(fieldName);
            
            // Update toggle text
            const filterToggle = document.getElementById('filterToggle');
            if (filterToggle) {
                const icon = '<i class="fa-solid fa-filter"></i> ';
                const chevron = ' <i class="fa-solid fa-chevron-down"></i>';
                filterToggle.innerHTML = icon + this.textContent.trim() + chevron;
            }
            
            // Update search placeholder based on selected filter
            const searchInput = document.getElementById('searchInput');
            if (searchInput) {
                if (fieldName === 'all') {
                    searchInput.placeholder = 'Search in all fields...';
                } else {
                    searchInput.placeholder = 'Search in ' + fieldName + '...';
                }
            }
            
            // Update selected state
            filterOptions.forEach(o => o.classList.remove('selected'));
            this.classList.add('selected');
            
            // Re-apply search if there was a search query
            if (searchInput && searchInput.value.trim()) {
                searchRows(searchInput.value.trim());
            }
        });
    });
    
    // Sort dropdown handler
    const sortOptions = document.querySelectorAll('#sortOptions .dropdown-option');
    sortOptions.forEach(option => {
        option.addEventListener('click', function() {
            const value = this.getAttribute('data-value');
            sortRows(value);
            
            // Update toggle text
            const sortToggle = document.getElementById('sortToggle');
            if (sortToggle) {
                const icon = '<i class="fa-solid fa-sort"></i> ';
                const chevron = ' <i class="fa-solid fa-chevron-down"></i>';
                sortToggle.innerHTML = icon + this.textContent.trim() + chevron;
            }
            
            // Update selected state
            sortOptions.forEach(o => o.classList.remove('selected'));
            this.classList.add('selected');
        });
    });
    
    // Rows per page dropdown handler
    const rowsOptions = document.querySelectorAll('#rowsOptions .dropdown-option');
    rowsOptions.forEach(option => {
        option.addEventListener('click', function() {
            const value = this.getAttribute('data-value');
            setRowsPerPage(value);
            
            // Update toggle text
            const rowsSelectedText = document.getElementById('rowsSelectedText');
            if (rowsSelectedText) {
                rowsSelectedText.textContent = value;
            }
            
            // Update selected state
            rowsOptions.forEach(o => o.classList.remove('selected'));
            this.classList.add('selected');
        });
    });
    
    // Pagination button handlers
    document.getElementById('firstPage')?.addEventListener('click', goToFirstPage);
    document.getElementById('prevPage')?.addEventListener('click', goToPrevPage);
    document.getElementById('nextPage')?.addEventListener('click', goToNextPage);
    document.getElementById('lastPage')?.addEventListener('click', goToLastPage);
    
    // Search All button - expands search to all statuses (redirects)
    document.getElementById('searchAllBtn')?.addEventListener('click', function() {
        const query = searchInput?.value || '';
        if (query.trim()) {
            // Open modal to search across all statuses
            showToast('Searching across all lists...');
            // For now, just search current list
            // Future: Could implement AJAX search across all statuses
        } else {
            showToast('Please enter a search term', false);
        }
    });
    
    // ==========================================
    // ROW ACTION BUTTONS
    // ==========================================
    
    // Verify row button
    document.querySelectorAll('.verify-row-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const cardId = this.getAttribute('data-card-id');
            verifyCard(cardId);
        });
    });
    
    // Approve row button
    document.querySelectorAll('.approve-row-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const cardId = this.getAttribute('data-card-id');
            approveCard(cardId);
        });
    });
    
    // Unapprove row button
    document.querySelectorAll('.unapprove-row-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const cardId = this.getAttribute('data-card-id');
            unapproveCard(cardId);
        });
    });
    
    // Unverify row button - moves card back to pending
    document.querySelectorAll('.unverify-row-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const cardId = this.getAttribute('data-card-id');
            unverifyCard(cardId);
        });
    });
    
    // Download row button - moves card from approved to download
    document.querySelectorAll('.download-row-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const cardId = this.getAttribute('data-card-id');
            downloadCard(cardId);
        });
    });
    
    // Retrieve row button - moves card from pool back to pending
    document.querySelectorAll('.retrieve-row-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const cardId = this.getAttribute('data-card-id');
            retrieveCard(cardId);
        });
    });
    
    // ==========================================
    // UPLOAD XLSX FUNCTIONALITY
    // ==========================================
    
    const uploadXlsxBtn = document.getElementById('uploadXlsxBtn');
    const xlsxFileInput = document.getElementById('xlsxFileInput');
    
    // Modal elements
    const uploadModalOverlay = document.getElementById('uploadModalOverlay');
    const closeUploadModal = document.getElementById('closeUploadModal');
    const cancelUploadModal = document.getElementById('cancelUploadModal');
    const confirmUploadModal = document.getElementById('confirmUploadModal');
    
    // ZIP upload elements
    const photoZipInput = document.getElementById('photoZipInput');
    const selectZipBtn = document.getElementById('selectZipBtn');
    const zipFileName = document.getElementById('zipFileName');
    const zipFileStatus = document.getElementById('zipFileStatus');
    const zipFileCount = document.getElementById('zipFileCount');
    
    let pendingUploadFile = null;
    let pendingZipFile = null;
    let zipFileNames = [];
    
    // ZIP file selection handlers
    if (selectZipBtn && photoZipInput) {
        selectZipBtn.addEventListener('click', function() {
            photoZipInput.click();
        });
        
        photoZipInput.addEventListener('change', async function() {
            const file = this.files[0];
            if (!file) {
                zipFileName.textContent = 'No file selected';
                zipFileName.classList.remove('selected');
                zipFileStatus.style.display = 'none';
                pendingZipFile = null;
                zipFileNames = [];
                return;
            }
            
            // Validate it's a ZIP file
            if (!file.name.toLowerCase().endsWith('.zip')) {
                showToast('Please select a ZIP file', 'error');
                this.value = '';
                return;
            }
            
            pendingZipFile = file;
            zipFileName.textContent = file.name;
            zipFileName.classList.add('selected');
            
            // Try to read ZIP contents to count images
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
                            // Store filename without extension for matching
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
                    zipFileStatus.style.display = 'flex';
                    zipFileCount.textContent = `${imageCount} image${imageCount > 1 ? 's' : ''} found in ZIP`;
                } else {
                    zipFileStatus.style.display = 'none';
                    showToast('No images found in the ZIP file', 'error');
                }
            } catch (error) {
                console.error('Error reading ZIP:', error);
                zipFileStatus.style.display = 'none';
                showToast('Error reading ZIP file', 'error');
            }
        });
    }
    
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
    
    // Normalize string for comparison (remove spaces, special chars, lowercase)
    function normalizeFieldName(name) {
        return name.toLowerCase()
            .replace(/[\s_\-\.]/g, '')  // Remove spaces, underscores, hyphens, dots
            .replace(/[^a-z0-9]/g, ''); // Remove special characters
    }
    
    // Find best matching field with fuzzy logic
    function findBestMatch(uploadedHeader, tableFields) {
        const normalizedUploaded = normalizeFieldName(uploadedHeader);
        
        // First try exact match (after normalization)
        for (const field of tableFields) {
            if (normalizeFieldName(field) === normalizedUploaded) {
                return { field, type: 'exact' };
            }
        }
        
        // Then try fuzzy match with Levenshtein distance
        let bestMatch = null;
        let bestDistance = Infinity;
        
        for (const field of tableFields) {
            const normalizedField = normalizeFieldName(field);
            const distance = levenshteinDistance(normalizedUploaded, normalizedField);
            
            // Allow up to 2 character differences, but also consider string length
            // For short strings (< 5 chars), allow max 1 difference
            // For longer strings, allow up to 2 differences
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
    
    // Open upload modal with data
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
        
        // Update status
        if (isError) {
            uploadStatus.className = 'upload-status error';
            uploadStatus.innerHTML = '<i class="fa-solid fa-times-circle error-icon"></i><span id="uploadStatusText">No matching fields found!</span>';
            modalHeader.classList.add('error');
            confirmUploadModal.style.display = 'none';
        } else {
            uploadStatus.className = 'upload-status';
            uploadStatus.innerHTML = '<i class="fa-solid fa-check-circle success-icon"></i><span id="uploadStatusText">Fields matched successfully!</span>';
            modalHeader.classList.remove('error');
            confirmUploadModal.style.display = '';
        }
        
        // Matched fields
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
        
        // Missing fields
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
        
        // Ignored fields
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
        
        // Data rows
        dataRowsCount.textContent = `${dataRowCount} data row${dataRowCount !== 1 ? 's' : ''} found`;
        
        // Show modal
        uploadModalOverlay.classList.add('active');
    }
    
    // Close upload modal
    function closeUploadModalFn() {
        uploadModalOverlay.classList.remove('active');
        pendingUploadFile = null;
        pendingZipFile = null;
        zipFileNames = [];
        
        // Reset ZIP section UI
        if (zipFileName) zipFileName.textContent = 'No file selected';
        if (zipFileStatus) {
            zipFileStatus.textContent = '';
            zipFileStatus.style.display = 'none';
        }
        if (photoZipInput) photoZipInput.value = '';
    }
    
    // Modal close handlers
    if (closeUploadModal) closeUploadModal.addEventListener('click', closeUploadModalFn);
    if (cancelUploadModal) cancelUploadModal.addEventListener('click', closeUploadModalFn);
    if (uploadModalOverlay) {
        uploadModalOverlay.addEventListener('click', function(e) {
            if (e.target === uploadModalOverlay) closeUploadModalFn();
        });
    }
    
    if (uploadXlsxBtn && xlsxFileInput) {
        // Click button triggers file input
        uploadXlsxBtn.addEventListener('click', function() {
            xlsxFileInput.click();
        });
        
        // Handle file selection
        xlsxFileInput.addEventListener('change', async function() {
            const file = this.files[0];
            if (!file) return;
            
            // Validate file type
            const validTypes = ['.xlsx', '.xls', '.csv'];
            const fileName = file.name.toLowerCase();
            const isValid = validTypes.some(ext => fileName.endsWith(ext));
            
            if (!isValid) {
                showToast('Please upload an Excel (.xlsx, .xls) or CSV file', false);
                this.value = '';
                return;
            }
            
            // Show loading state
            const originalText = uploadXlsxBtn.innerHTML;
            uploadXlsxBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Validating...';
            uploadXlsxBtn.disabled = true;
            
            try {
                // Get table field names (excluding image type fields)
                const tableFieldNames = (typeof TABLE_FIELDS !== 'undefined' ? TABLE_FIELDS : [])
                    .filter(f => f.type !== 'image')
                    .map(f => f.name);
                
                if (tableFieldNames.length === 0) {
                    showToast('No fields defined in table!', false);
                    this.value = '';
                    uploadXlsxBtn.innerHTML = originalText;
                    uploadXlsxBtn.disabled = false;
                    return;
                }
                
                // Read the file using SheetJS for client-side validation
                const fileData = await file.arrayBuffer();
                const workbook = XLSX.read(fileData, { type: 'array' });
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
                
                if (jsonData.length === 0) {
                    showToast('The uploaded file is empty!', false);
                    this.value = '';
                    uploadXlsxBtn.innerHTML = originalText;
                    uploadXlsxBtn.disabled = false;
                    return;
                }
                
                // Get headers from first row
                const uploadedHeaders = (jsonData[0] || []).map(h => String(h || '').trim()).filter(h => h);
                
                if (uploadedHeaders.length === 0) {
                    showToast('No headers found in the uploaded file!', false);
                    this.value = '';
                    uploadXlsxBtn.innerHTML = originalText;
                    uploadXlsxBtn.disabled = false;
                    return;
                }
                
                // Check which fields match using fuzzy matching
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
                
                // Reset button
                uploadXlsxBtn.innerHTML = originalText;
                uploadXlsxBtn.disabled = false;
                
                // Validate: at least one field should match
                if (matchedFields.length === 0) {
                    openUploadModal(matchedFields, tableFieldNames, unmatchedUploadedFields, dataRowCount, true);
                    this.value = '';
                    return;
                }
                
                // Store file for upload
                pendingUploadFile = file;
                
                // Open modal with matching info
                openUploadModal(matchedFields, missingTableFields, unmatchedUploadedFields, dataRowCount, false);
                
            } catch (error) {
                console.error('Validation error:', error);
                showToast('Failed to read file: ' + error.message, false);
                uploadXlsxBtn.innerHTML = originalText;
                uploadXlsxBtn.disabled = false;
            }
            
            // Reset input
            this.value = '';
        });
    }
    
    // Confirm upload button
    if (confirmUploadModal) {
        confirmUploadModal.addEventListener('click', async function() {
            if (!pendingUploadFile) {
                showToast('No file to upload', false);
                closeUploadModalFn();
                return;
            }
            
            // Get progress elements
            const progressSection = document.getElementById('uploadProgressSection');
            const progressBar = document.getElementById('uploadProgressBar');
            const percentageText = document.getElementById('uploadPercentage');
            const sizeText = document.getElementById('uploadProgressSize');
            const timeText = document.getElementById('uploadTimeRemaining');
            const cancelBtn = document.getElementById('cancelUploadModal');
            
            // Update button state
            const originalText = this.innerHTML;
            this.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Uploading...';
            this.disabled = true;
            if (cancelBtn) cancelBtn.disabled = true;
            
            // Show progress section
            if (progressSection) progressSection.style.display = 'block';
            
            // Create FormData
            const formData = new FormData();
            formData.append('file', pendingUploadFile);
            
            // Add ZIP file if selected
            if (pendingZipFile) {
                formData.append('photos_zip', pendingZipFile);
            }
            
            // Use XMLHttpRequest for progress tracking
            const xhr = new XMLHttpRequest();
            const startTime = Date.now();
            const fileSize = pendingUploadFile.size;
            
            // Progress event handler
            xhr.upload.addEventListener('progress', function(e) {
                if (e.lengthComputable) {
                    const percentComplete = Math.round((e.loaded / e.total) * 100);
                    const elapsedTime = (Date.now() - startTime) / 1000; // seconds
                    const uploadSpeed = e.loaded / elapsedTime; // bytes per second
                    const remainingBytes = e.total - e.loaded;
                    const remainingTime = remainingBytes / uploadSpeed;
                    
                    // Update progress bar
                    if (progressBar) progressBar.style.width = percentComplete + '%';
                    if (percentageText) percentageText.textContent = percentComplete + '%';
                    
                    // Update size text
                    const loadedKB = (e.loaded / 1024).toFixed(1);
                    const totalKB = (e.total / 1024).toFixed(1);
                    if (sizeText) sizeText.textContent = `${loadedKB} KB / ${totalKB} KB`;
                    
                    // Update time remaining
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
            
            // Load complete handler
            xhr.addEventListener('load', function() {
                try {
                    const result = JSON.parse(xhr.responseText);
                    
                    if (xhr.status === 200 && result.success) {
                        // Update progress to 100%
                        if (progressBar) progressBar.style.width = '100%';
                        if (percentageText) percentageText.textContent = '100%';
                        if (timeText) timeText.textContent = 'Complete!';
                        
                        setTimeout(() => {
                            closeUploadModalFn();
                            showToast(result.message, true);
                            
                            // Reload page to show new cards
                            setTimeout(() => {
                                window.location.reload();
                            }, 1500);
                        }, 500);
                    } else {
                        showToast(result.message || 'Upload failed', false);
                        resetUploadState();
                    }
                } catch (error) {
                    console.error('Parse error:', error);
                    showToast('Failed to process server response', false);
                    resetUploadState();
                }
            });
            
            // Error handler
            xhr.addEventListener('error', function() {
                console.error('Upload error');
                showToast('Failed to upload file', false);
                resetUploadState();
            });
            
            // Reset function
            function resetUploadState() {
                if (progressSection) progressSection.style.display = 'none';
                if (progressBar) progressBar.style.width = '0%';
                confirmUploadModal.innerHTML = originalText;
                confirmUploadModal.disabled = false;
                if (cancelBtn) cancelBtn.disabled = false;
            }
            
            // Send request
            xhr.open('POST', `/api/table/${TABLE_ID}/cards/bulk-upload/`);
            xhr.setRequestHeader('X-CSRFToken', getCSRFToken());
            xhr.send(formData);
        });
    }
    
    // ==========================================
    // BULK ACTION BUTTONS
    // ==========================================
    
    // Verify Selected button
    document.getElementById('verifyBtn')?.addEventListener('click', function() {
        const selectedIds = getSelectedCardIds();
        if (selectedIds.length > 0) {
            bulkVerify(selectedIds);
        }
    });
    
    // Delete button - moves to Pool (soft delete), only in Pending and Verified lists
    document.getElementById('deleteBtn')?.addEventListener('click', function() {
        const selectedIds = getSelectedCardIds();
        if (selectedIds.length > 0) {
            bulkDelete(selectedIds);
        }
    });
    
    // Delete button in Verified list
    document.getElementById('deleteBtnV')?.addEventListener('click', function() {
        const selectedIds = getSelectedCardIds();
        if (selectedIds.length > 0) {
            bulkDelete(selectedIds);
        }
    });
    
    // Approve Selected button
    document.getElementById('approveBtn')?.addEventListener('click', function() {
        const selectedIds = getSelectedCardIds();
        if (selectedIds.length > 0) {
            bulkApprove(selectedIds);
        }
    });
    
    // Unapproved Selected button
    document.getElementById('unapprovedBtn')?.addEventListener('click', function() {
        const selectedIds = getSelectedCardIds();
        if (selectedIds.length > 0) {
            bulkUnapprove(selectedIds);
        }
    });
    
    // Unverified Selected button
    document.getElementById('unverifyBtn')?.addEventListener('click', function() {
        const selectedIds = getSelectedCardIds();
        if (selectedIds.length > 0) {
            bulkUnverify(selectedIds);
        }
    });
    
    // Retrieve buttons - moves cards back to pending (from Pool or other lists)
    document.getElementById('retrieveBtn')?.addEventListener('click', function() {
        const selectedIds = getSelectedCardIds();
        if (selectedIds.length > 0) {
            bulkRetrieve(selectedIds);
        }
    });
    document.getElementById('retrieveBtnP')?.addEventListener('click', function() {
        const selectedIds = getSelectedCardIds();
        if (selectedIds.length > 0) {
            bulkRetrieve(selectedIds);
        }
    });
    document.getElementById('retrieveBtnA')?.addEventListener('click', function() {
        const selectedIds = getSelectedCardIds();
        if (selectedIds.length > 0) {
            bulkRetrieve(selectedIds);
        }
    });
    document.getElementById('retrieveBtnD')?.addEventListener('click', function() {
        const selectedIds = getSelectedCardIds();
        if (selectedIds.length > 0) {
            bulkRetrieve(selectedIds);
        }
    });
    
    // Delete Permanent button - permanently deletes cards from database
    document.getElementById('deletePermanentBtnP')?.addEventListener('click', function() {
        const selectedIds = getSelectedCardIds();
        if (selectedIds.length > 0) {
            bulkDeletePermanent(selectedIds);
        }
    });
    
    // ==========================================
    // DOWNLOAD IMAGES BUTTON HANDLERS
    // ==========================================
    
    // Download Images function - downloads all images from selected cards as ZIP with progress
    function downloadImages(cardIds) {
        const tableId = typeof TABLE_ID !== 'undefined' ? TABLE_ID : null;
        if (!tableId) {
            showToast('Error: Table ID not found', false);
            return;
        }
        
        if (cardIds.length === 0) {
            showToast('No cards selected!', false);
            return;
        }
        
        // Show progress toast
        showProgressToast('Preparing images...', -1);
        
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `/api/table/${tableId}/cards/download-images/`, true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.setRequestHeader('X-CSRFToken', getCSRFToken());
        xhr.responseType = 'blob';
        
        // Track download progress
        xhr.onprogress = function(event) {
            if (event.lengthComputable) {
                const percentComplete = Math.round((event.loaded / event.total) * 100);
                showProgressToast(`Downloading... ${percentComplete}%`, percentComplete);
            } else {
                showProgressToast('Downloading...', -1);
            }
        };
        
        xhr.onload = function() {
            if (xhr.status === 200) {
                const blob = xhr.response;
                
                // Create download link
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                
                // Get filename from timestamp
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
                
                // Cleanup
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                
                showDownloadComplete('Images downloaded successfully!');
            } else {
                // Try to parse error message
                hideProgressToast();
                const reader = new FileReader();
                reader.onload = function() {
                    try {
                        const error = JSON.parse(reader.result);
                        showToast(error.message || 'Failed to download images', false);
                    } catch(e) {
                        showToast('Failed to download images', false);
                    }
                };
                reader.readAsText(xhr.response);
            }
        };
        
        xhr.onerror = function() {
            hideProgressToast();
            showToast('Failed to download images', false);
        };
        
        xhr.send(JSON.stringify({ card_ids: cardIds }));
    }
    
    // Download Img buttons for all lists - works on selected or all cards
    document.getElementById('downloadImgBtn')?.addEventListener('click', function() {
        const cardIds = getCardIdsForAction();
        if (cardIds.length > 0) {
            downloadImages(cardIds);
        } else {
            showToast('No cards available to download!', false);
        }
    });
    
    document.getElementById('downloadImgBtnV')?.addEventListener('click', function() {
        const cardIds = getCardIdsForAction();
        if (cardIds.length > 0) {
            downloadImages(cardIds);
        } else {
            showToast('No cards available to download!', false);
        }
    });
    
    document.getElementById('downloadImgBtnP')?.addEventListener('click', function() {
        const cardIds = getCardIdsForAction();
        if (cardIds.length > 0) {
            downloadImages(cardIds);
        } else {
            showToast('No cards available to download!', false);
        }
    });
    
    document.getElementById('downloadImgBtnA')?.addEventListener('click', function() {
        const cardIds = getCardIdsForAction();
        if (cardIds.length > 0) {
            downloadImages(cardIds);
        } else {
            showToast('No cards available to download!', false);
        }
    });
    
    document.getElementById('downloadImgBtnD')?.addEventListener('click', function() {
        const cardIds = getCardIdsForAction();
        if (cardIds.length > 0) {
            downloadImages(cardIds);
        } else {
            showToast('No cards available to download!', false);
        }
    });

    // ==========================================
    // DOWNLOAD DOCX BUTTON HANDLERS
    // ==========================================
    
    let pendingDocxDownloadIds = [];
    const docFormatModalOverlay = document.getElementById('docFormatModalOverlay');
    
    // Open format selection modal
    function openDocFormatModal(cardIds) {
        pendingDocxDownloadIds = cardIds;
        if (docFormatModalOverlay) {
            docFormatModalOverlay.classList.add('active');
        }
    }
    
    // Close format selection modal
    function closeDocFormatModal() {
        if (docFormatModalOverlay) {
            docFormatModalOverlay.classList.remove('active');
        }
        pendingDocxDownloadIds = [];
    }
    
    // Download DOCX function with progress
    function downloadDocx(cardIds, format) {
        const tableId = typeof TABLE_ID !== 'undefined' ? TABLE_ID : null;
        if (!tableId) {
            showToast('Error: Table ID not found', false);
            return;
        }
        
        if (cardIds.length === 0) {
            showToast('No cards selected!', false);
            return;
        }
        
        closeDocFormatModal();
        
        // Show progress toast
        showProgressToast(`Preparing ${format.toUpperCase()} document...`, -1);
        
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `/api/table/${tableId}/cards/download-docx/`, true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.setRequestHeader('X-CSRFToken', getCSRFToken());
        xhr.responseType = 'blob';
        
        // Track download progress
        xhr.onprogress = function(event) {
            if (event.lengthComputable) {
                const percentComplete = Math.round((event.loaded / event.total) * 100);
                showProgressToast(`Downloading... ${percentComplete}%`, percentComplete);
            } else {
                showProgressToast('Downloading...', -1);
            }
        };
        
        xhr.onload = function() {
            if (xhr.status === 200) {
                const blob = xhr.response;
                
                // Create download link
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                
                // Get filename from timestamp
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
                
                // Cleanup
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                
                showDownloadComplete('Document downloaded successfully!');
            } else {
                // Try to parse error message
                hideProgressToast();
                const reader = new FileReader();
                reader.onload = function() {
                    try {
                        const error = JSON.parse(reader.result);
                        showToast(error.message || 'Failed to download document', false);
                    } catch(e) {
                        showToast('Failed to download document', false);
                    }
                };
                reader.readAsText(xhr.response);
            }
        };
        
        xhr.onerror = function() {
            hideProgressToast();
            showToast('Failed to download document', false);
        };
        
        xhr.send(JSON.stringify({ card_ids: cardIds, format: format }));
    }
    
    // Close modal handlers
    document.getElementById('closeDocFormatModal')?.addEventListener('click', closeDocFormatModal);
    document.getElementById('cancelDocFormatModal')?.addEventListener('click', closeDocFormatModal);
    
    // Close on overlay click
    if (docFormatModalOverlay) {
        docFormatModalOverlay.addEventListener('click', function(e) {
            if (e.target === this) closeDocFormatModal();
        });
    }
    
    // Format card click handlers
    document.querySelectorAll('.format-card').forEach(card => {
        card.addEventListener('click', function() {
            const format = this.getAttribute('data-format');
            if (format && pendingDocxDownloadIds.length > 0) {
                downloadDocx(pendingDocxDownloadIds, format);
            }
        });
    });
    
    // Download Docx buttons for all lists - works on selected or all cards
    document.getElementById('downloadDocxBtn')?.addEventListener('click', function() {
        const cardIds = getCardIdsForAction();
        if (cardIds.length > 0) {
            openDocFormatModal(cardIds);
        } else {
            showToast('No cards available to download!', false);
        }
    });
    
    document.getElementById('downloadDocxBtnV')?.addEventListener('click', function() {
        const cardIds = getCardIdsForAction();
        if (cardIds.length > 0) {
            openDocFormatModal(cardIds);
        } else {
            showToast('No cards available to download!', false);
        }
    });
    
    document.getElementById('downloadDocxBtnP')?.addEventListener('click', function() {
        const cardIds = getCardIdsForAction();
        if (cardIds.length > 0) {
            openDocFormatModal(cardIds);
        } else {
            showToast('No cards available to download!', false);
        }
    });
    
    document.getElementById('downloadDocxBtnA')?.addEventListener('click', function() {
        const cardIds = getCardIdsForAction();
        if (cardIds.length > 0) {
            openDocFormatModal(cardIds);
        } else {
            showToast('No cards available to download!', false);
        }
    });
    
    document.getElementById('downloadDocxBtnD')?.addEventListener('click', function() {
        const cardIds = getCardIdsForAction();
        if (cardIds.length > 0) {
            openDocFormatModal(cardIds);
        } else {
            showToast('No cards available to download!', false);
        }
    });

    // ==========================================
    // DOWNLOAD XLSX BUTTON HANDLERS
    // ==========================================
    
    // Download XLSX function - downloads Excel file with auto-sized columns and progress
    function downloadXlsx(cardIds) {
        const tableId = typeof TABLE_ID !== 'undefined' ? TABLE_ID : null;
        if (!tableId) {
            showToast('Error: Table ID not found', false);
            return;
        }
        
        if (cardIds.length === 0) {
            showToast('No cards to download!', false);
            return;
        }
        
        // Show progress toast
        showProgressToast('Preparing Excel file...', -1);
        
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `/api/table/${tableId}/cards/download-xlsx/`, true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.setRequestHeader('X-CSRFToken', getCSRFToken());
        xhr.responseType = 'blob';
        
        // Track download progress
        xhr.onprogress = function(event) {
            if (event.lengthComputable) {
                const percentComplete = Math.round((event.loaded / event.total) * 100);
                showProgressToast(`Downloading... ${percentComplete}%`, percentComplete);
            } else {
                showProgressToast('Downloading...', -1);
            }
        };
        
        xhr.onload = function() {
            if (xhr.status === 200) {
                const blob = xhr.response;
                
                // Create download link
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                
                // Get filename from timestamp
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
                
                // Cleanup
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                
                showDownloadComplete('Excel file downloaded successfully!');
            } else {
                // Try to parse error message
                hideProgressToast();
                const reader = new FileReader();
                reader.onload = function() {
                    try {
                        const error = JSON.parse(reader.result);
                        showToast(error.message || 'Failed to download Excel file', false);
                    } catch(e) {
                        showToast('Failed to download Excel file', false);
                    }
                };
                reader.readAsText(xhr.response);
            }
        };
        
        xhr.onerror = function() {
            hideProgressToast();
            showToast('Failed to download Excel file', false);
        };
        
        xhr.send(JSON.stringify({ card_ids: cardIds }));
    }
    
    // Download XLSX buttons for all lists - works on selected or all cards
    document.getElementById('downloadXlsxBtn')?.addEventListener('click', function() {
        const cardIds = getCardIdsForAction();
        if (cardIds.length > 0) {
            downloadXlsx(cardIds);
        } else {
            showToast('No cards available to download!', false);
        }
    });
    
    document.getElementById('downloadXlsxBtnV')?.addEventListener('click', function() {
        const cardIds = getCardIdsForAction();
        if (cardIds.length > 0) {
            downloadXlsx(cardIds);
        } else {
            showToast('No cards available to download!', false);
        }
    });
    
    document.getElementById('downloadXlsxBtnP')?.addEventListener('click', function() {
        const cardIds = getCardIdsForAction();
        if (cardIds.length > 0) {
            downloadXlsx(cardIds);
        } else {
            showToast('No cards available to download!', false);
        }
    });
    
    document.getElementById('downloadXlsxBtnA')?.addEventListener('click', function() {
        const cardIds = getCardIdsForAction();
        if (cardIds.length > 0) {
            downloadXlsx(cardIds);
        } else {
            showToast('No cards available to download!', false);
        }
    });
    
    document.getElementById('downloadXlsxBtnD')?.addEventListener('click', function() {
        const cardIds = getCardIdsForAction();
        if (cardIds.length > 0) {
            downloadXlsx(cardIds);
        } else {
            showToast('No cards available to download!', false);
        }
    });

    // ==========================================
    // REUPLOAD IMAGE BUTTON HANDLERS
    // ==========================================
    
    // Create hidden file input for ZIP reupload
    let reuploadZipInput = document.getElementById('reuploadZipInput');
    if (!reuploadZipInput) {
        reuploadZipInput = document.createElement('input');
        reuploadZipInput.type = 'file';
        reuploadZipInput.id = 'reuploadZipInput';
        reuploadZipInput.accept = '.zip';
        reuploadZipInput.style.display = 'none';
        document.body.appendChild(reuploadZipInput);
    }
    
    let pendingReuploadCardIds = [];
    
    // Reupload function - uploads ZIP file to reupload images
    function reuploadImages(cardIds) {
        pendingReuploadCardIds = cardIds;
        reuploadZipInput.value = ''; // Reset input
        reuploadZipInput.click();
    }
    
    // Handle ZIP file selection for reupload
    reuploadZipInput.addEventListener('change', async function() {
        const file = this.files[0];
        if (!file) return;
        
        // Validate it's a ZIP file
        if (!file.name.toLowerCase().endsWith('.zip')) {
            showToast('Please select a ZIP file', false);
            this.value = '';
            return;
        }
        
        const tableId = typeof TABLE_ID !== 'undefined' ? TABLE_ID : null;
        if (!tableId) {
            showToast('Error: Table ID not found', false);
            return;
        }
        
        // Show progress toast
        showProgressToast('Reuploading images...', -1);
        
        // Create FormData
        const formData = new FormData();
        formData.append('zip_file', file);
        formData.append('card_ids', JSON.stringify(pendingReuploadCardIds));
        
        // Upload via XHR for progress tracking
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `/api/table/${tableId}/cards/reupload-images/`, true);
        xhr.setRequestHeader('X-CSRFToken', getCSRFToken());
        
        xhr.upload.onprogress = function(event) {
            if (event.lengthComputable) {
                const percentComplete = Math.round((event.loaded / event.total) * 100);
                showProgressToast(`Uploading... ${percentComplete}%`, percentComplete);
            }
        };
        
        xhr.onload = function() {
            try {
                const result = JSON.parse(xhr.responseText);
                if (xhr.status === 200 && result.success) {
                    showDownloadComplete(result.message || 'Images reuploaded successfully!');
                    // Reload the page to show updated images
                    setTimeout(() => {
                        window.location.reload();
                    }, 2000);
                } else {
                    hideProgressToast();
                    showToast(result.message || 'Reupload failed', false);
                }
            } catch (e) {
                hideProgressToast();
                showToast('Error processing response', false);
            }
        };
        
        xhr.onerror = function() {
            hideProgressToast();
            showToast('Failed to reupload images', false);
        };
        
        xhr.send(formData);
    });
    
    // Reupload button handlers for all lists
    document.getElementById('reuploadImageBtn')?.addEventListener('click', function() {
        const cardIds = getCardIdsForAction();
        if (cardIds.length > 0) {
            reuploadImages(cardIds);
        } else {
            showToast('No cards available for reupload!', false);
        }
    });
    
    document.getElementById('reuploadImageBtnV')?.addEventListener('click', function() {
        const cardIds = getCardIdsForAction();
        if (cardIds.length > 0) {
            reuploadImages(cardIds);
        } else {
            showToast('No cards available for reupload!', false);
        }
    });
    
    document.getElementById('reuploadImageBtnP')?.addEventListener('click', function() {
        const cardIds = getCardIdsForAction();
        if (cardIds.length > 0) {
            reuploadImages(cardIds);
        } else {
            showToast('No cards available for reupload!', false);
        }
    });
    
    document.getElementById('reuploadImageBtnA')?.addEventListener('click', function() {
        const cardIds = getCardIdsForAction();
        if (cardIds.length > 0) {
            reuploadImages(cardIds);
        } else {
            showToast('No cards available for reupload!', false);
        }
    });
    
    document.getElementById('reuploadImageBtnD')?.addEventListener('click', function() {
        const cardIds = getCardIdsForAction();
        if (cardIds.length > 0) {
            reuploadImages(cardIds);
        } else {
            showToast('No cards available for reupload!', false);
        }
    });

    // ==========================================
    // SIDE MODAL FUNCTIONALITY
    // ==========================================
    
    const sideModalOverlay = document.getElementById('sideModalOverlay');
    const sideModal = document.getElementById('sideModal');
    const sideModalTitle = document.getElementById('sideModalTitle');
    const saveSideModalBtn = document.getElementById('saveSideModal');
    const formPhotoPreview = document.getElementById('formPhotoPreview');
    const formPhotoInput = document.getElementById('formPhotoInput');
    const photoUploadLabel = document.getElementById('photoUploadLabel');
    
    let currentModalMode = 'add'; // 'add', 'edit', 'view'
    let currentEditCardId = null;
    
    // Close side modal
    document.getElementById('closeSideModal')?.addEventListener('click', closeSideModal);
    document.getElementById('cancelSideModal')?.addEventListener('click', closeSideModal);
    
    // Close on overlay click
    if (sideModalOverlay) {
        sideModalOverlay.addEventListener('click', function(e) {
            if (e.target === this) closeSideModal();
        });
    }
    
    // Close on Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && sideModalOverlay?.classList.contains('active')) {
            closeSideModal();
        }
    });
    
    // Delete key handler - delete selected cards
    document.addEventListener('keydown', function(e) {
        // Only handle Delete key
        if (e.key !== 'Delete') return;
        
        // Don't trigger if we're in an input/textarea or modal is open
        const activeElement = document.activeElement;
        if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) return;
        if (sideModalOverlay?.classList.contains('active')) return;
        if (document.getElementById('uploadModalOverlay')?.classList.contains('active')) return;
        if (document.getElementById('deleteModalOverlay')?.classList.contains('active')) return;
        
        const selectedIds = getSelectedCardIds();
        if (selectedIds.length === 0) return;
        
        e.preventDefault();
        
        // Check current status
        const currentStatus = typeof CURRENT_STATUS !== 'undefined' ? CURRENT_STATUS : 'pending';
        
        if (currentStatus === 'pool') {
            // Pool list - directly delete permanently (no modal)
            directPermanentDelete(selectedIds);
        } else {
            // Other lists - directly move to pool (soft delete)
            bulkDelete(selectedIds);
        }
    });
    
    // Direct permanent delete without modal (for Pool list Delete key)
    function directPermanentDelete(cardIds) {
        const tableId = typeof TABLE_ID !== 'undefined' ? TABLE_ID : null;
        if (!tableId) { showToast('Error: Table ID not found', 'error'); return; }
        
        fetch(`/api/table/${tableId}/cards/bulk-delete/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCSRFToken()
            },
            body: JSON.stringify({ card_ids: cardIds })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showToast(`${data.deleted_count} card(s) permanently deleted`);
                location.reload();
            } else {
                showToast(data.message || 'Failed to delete cards', 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showToast('Failed to delete cards', 'error');
        });
    }
    
    function openSideModal(mode, cardData = null) {
        currentModalMode = mode;
        currentEditCardId = cardData?.id || null;
        
        // Reset form
        const form = document.getElementById('cardForm');
        if (form) form.reset();
        
        // Reset photo preview
        if (formPhotoPreview) {
            formPhotoPreview.innerHTML = '<i class="fa-solid fa-user"></i>';
        }
        
        // Update modal title and button based on mode
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
        
        // Populate form fields if editing or viewing
        if ((mode === 'edit' || mode === 'view') && cardData) {
            populateFormFields(cardData);
        }
        
        // Show modal
        if (sideModalOverlay) {
            sideModalOverlay.classList.add('active');
        }
    }
    
    function closeSideModal() {
        if (sideModalOverlay) {
            sideModalOverlay.classList.remove('active');
        }
        currentModalMode = 'add';
        currentEditCardId = null;
    }
    
    function populateFormFields(cardData) {
        // Populate photo if available
        if (cardData.photo && formPhotoPreview) {
            formPhotoPreview.innerHTML = `<img src="${cardData.photo}" alt="Photo">`;
        }
        
        // Populate form fields from field_data
        if (cardData.field_data) {
            const inputs = document.querySelectorAll('#formFieldsContainer .form-control');
            inputs.forEach(input => {
                const fieldName = input.getAttribute('data-field-name');
                const fieldType = input.getAttribute('data-field-type');
                
                // Skip file inputs - they cannot have value set programmatically
                if (input.type === 'file' || fieldType === 'image') {
                    // For image fields, show preview if path exists
                    if (fieldName && cardData.field_data[fieldName]) {
                        const imgPath = cardData.field_data[fieldName];
                        // Find the preview container for this image field
                        const previewContainer = input.closest('.image-upload-wrapper')?.querySelector('.image-preview');
                        if (previewContainer && imgPath && imgPath !== 'NOT_FOUND') {
                            previewContainer.innerHTML = `<img src="/media/${imgPath}" alt="${fieldName}" style="max-width: 100px; max-height: 100px;">`;
                        }
                    }
                    return; // Skip setting value on file input
                }
                
                if (fieldName && cardData.field_data[fieldName] !== undefined) {
                    input.value = cardData.field_data[fieldName];
                }
            });
        }
    }
    
    function getFormData() {
        const fieldData = {};
        const imageFiles = {};
        const inputs = document.querySelectorAll('#formFieldsContainer .form-control, #formFieldsContainer .image-input');
        inputs.forEach(input => {
            const fieldName = input.getAttribute('data-field-name');
            const fieldType = input.getAttribute('data-field-type');
            if (fieldName) {
                if (fieldType === 'image') {
                    // Store file reference for image fields
                    if (input.files && input.files[0]) {
                        imageFiles[fieldName] = input.files[0];
                    }
                } else {
                    fieldData[fieldName] = input.value;
                }
            }
        });
        return { fieldData, imageFiles };
    }
    
    // Get main photo file
    function getMainPhotoFile() {
        const formPhotoInput = document.getElementById('formPhotoInput');
        if (formPhotoInput && formPhotoInput.files && formPhotoInput.files[0]) {
            return formPhotoInput.files[0];
        }
        return null;
    }
    
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
    
    // Image field upload previews (for dynamic image fields)
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
    
    // Add button - opens modal in add mode
    document.getElementById('addBtn')?.addEventListener('click', function() {
        openSideModal('add');
    });
    
    // Edit buttons - opens modal in edit mode with selected card data
    const editBtnIds = ['editBtn', 'editBtnV', 'editBtnA', 'editBtnD'];
    editBtnIds.forEach(btnId => {
        document.getElementById(btnId)?.addEventListener('click', function() {
            const selectedIds = getSelectedCardIds();
            if (selectedIds.length === 1) {
                fetchCardAndOpenModal('edit', selectedIds[0]);
            }
        });
    });
    
    // View buttons - opens modal in view mode with selected card data
    const viewBtnIds = ['viewBtn', 'viewBtnV', 'viewBtnP', 'viewBtnA', 'viewBtnD'];
    viewBtnIds.forEach(btnId => {
        document.getElementById(btnId)?.addEventListener('click', function() {
            const selectedIds = getSelectedCardIds();
            if (selectedIds.length === 1) {
                fetchCardAndOpenModal('view', selectedIds[0]);
            }
        });
    });
    
    // Edit photo buttons in table rows - opens modal in edit mode
    // Only works when no rows selected (edit clicked row) or exactly one row selected
    document.querySelectorAll('.edit-photo-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const selectedIds = getSelectedCardIds();
            
            // Only allow edit when 0 or 1 row is selected
            if (selectedIds.length > 1) {
                showToast('Please select only one row to edit', 'error');
                return;
            }
            
            const cardId = this.getAttribute('data-card-id');
            if (cardId) {
                fetchCardAndOpenModal('edit', cardId);
            }
        });
    });
    
    // Fetch card data and open modal
    function fetchCardAndOpenModal(mode, cardId) {
        fetch(`/api/card/${cardId}/`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    openSideModal(mode, data.card);
                } else {
                    showToast('Error loading card data', false);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showToast('Error loading card data', false);
            });
    }
    
    // Save button - creates new card or updates existing
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
    
    // Create new card API call with file upload support
    function createNewCard(fieldData, imageFiles, mainPhoto) {
        const tableId = typeof TABLE_ID !== 'undefined' ? TABLE_ID : null;
        if (!tableId) {
            showToast('Error: Table ID not found', false);
            return;
        }
        
        // Convert all text values to uppercase
        const uppercaseFieldData = {};
        for (const [key, value] of Object.entries(fieldData)) {
            uppercaseFieldData[key] = typeof value === 'string' ? value.toUpperCase() : value;
        }
        
        const formData = new FormData();
        formData.append('field_data', JSON.stringify(uppercaseFieldData));
        
        // Add main photo if exists
        if (mainPhoto) {
            formData.append('photo', mainPhoto);
        }
        
        // Add image field files
        for (const [fieldName, file] of Object.entries(imageFiles)) {
            formData.append(`image_${fieldName}`, file);
        }
        
        fetch(`/api/table/${tableId}/card/create/`, {
            method: 'POST',
            headers: {
                'X-CSRFToken': getCSRFToken()
            },
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showToast('Card added successfully!');
                closeSideModal();
                window.location.href = `?status=pending`;
            } else {
                showToast(data.message || 'Error adding card', false);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showToast('Error adding card', false);
        });
    }
    
    // Update existing card API call with file upload support
    function updateExistingCard(cardId, fieldData, imageFiles, mainPhoto) {
        // Convert all text values to uppercase
        const uppercaseFieldData = {};
        for (const [key, value] of Object.entries(fieldData)) {
            uppercaseFieldData[key] = typeof value === 'string' ? value.toUpperCase() : value;
        }
        
        const formData = new FormData();
        formData.append('field_data', JSON.stringify(uppercaseFieldData));
        
        // Add main photo if exists
        if (mainPhoto) {
            formData.append('photo', mainPhoto);
        }
        
        // Add image field files
        for (const [fieldName, file] of Object.entries(imageFiles)) {
            formData.append(`image_${fieldName}`, file);
        }
        
        fetch(`/api/card/${cardId}/update/`, {
            method: 'POST',
            headers: {
                'X-CSRFToken': getCSRFToken()
            },
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showToast('Card updated successfully!');
                closeSideModal();
                location.reload();
            } else {
                showToast(data.message || 'Error updating card', false);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showToast('Error updating card', false);
        });
    }
    
    // ==========================================
    // API FUNCTIONS
    // ==========================================
    
    function getSelectedCardIds() {
        const checked = document.querySelectorAll('.rowCheckbox:checked');
        return [...checked].map(cb => cb.closest('tr').getAttribute('data-card-id'));
    }
    
    // Get all visible card IDs from current list
    function getAllVisibleCardIds() {
        const allRows = document.querySelectorAll('#cardsTableBody tr[data-card-id]');
        return [...allRows].map(row => row.getAttribute('data-card-id')).filter(id => id);
    }
    
    // Get card IDs - selected if any, otherwise all visible
    function getCardIdsForAction() {
        const selectedIds = getSelectedCardIds();
        return selectedIds.length > 0 ? selectedIds : getAllVisibleCardIds();
    }
    
    function showToast(message, isSuccess = true) {
        const toast = document.getElementById('toast');
        const toastMessage = document.getElementById('toastMessage');
        const toastIcon = document.getElementById('toastIcon');
        const toastProgress = document.getElementById('toastProgress');
        const toastProgressBar = document.getElementById('toastProgressBar');
        
        if (toast && toastMessage) {
            toastMessage.textContent = message;
            
            // Hide progress bar for regular toasts
            if (toastProgress) {
                toastProgress.style.display = 'none';
            }
            if (toastProgressBar) {
                toastProgressBar.classList.remove('indeterminate');
                toastProgressBar.style.width = '0%';
            }
            
            // Set icon based on success/error
            if (toastIcon) {
                toastIcon.className = isSuccess ? 'fa-solid fa-check-circle' : 'fa-solid fa-times-circle';
            }
            
            toast.className = 'toast show ' + (isSuccess ? 'success' : 'error');
            setTimeout(() => {
                toast.className = 'toast';
            }, 3000);
        }
    }
    
    // Progress toast for downloads
    let downloadToastTimeout = null;
    
    function showProgressToast(message, progress = -1) {
        const toast = document.getElementById('toast');
        const toastMessage = document.getElementById('toastMessage');
        const toastIcon = document.getElementById('toastIcon');
        const toastProgress = document.getElementById('toastProgress');
        const toastProgressBar = document.getElementById('toastProgressBar');
        const toastPercent = document.getElementById('toastPercent');
        
        // Clear any existing timeout
        if (downloadToastTimeout) {
            clearTimeout(downloadToastTimeout);
            downloadToastTimeout = null;
        }
        
        if (toast && toastMessage) {
            toastMessage.textContent = message;
            
            // Set downloading icon (spinner)
            if (toastIcon) {
                toastIcon.className = 'fa-solid fa-spinner';
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
    
    function showDownloadComplete(message = 'Successfully downloaded!') {
        const toast = document.getElementById('toast');
        const toastMessage = document.getElementById('toastMessage');
        const toastIcon = document.getElementById('toastIcon');
        const toastProgress = document.getElementById('toastProgress');
        const toastProgressBar = document.getElementById('toastProgressBar');
        const toastPercent = document.getElementById('toastPercent');
        
        // Clear any existing timeout
        if (downloadToastTimeout) {
            clearTimeout(downloadToastTimeout);
            downloadToastTimeout = null;
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
            
            // Show 100% text
            if (toastPercent) {
                toastPercent.style.display = 'inline';
                toastPercent.textContent = '100%';
            }
            
            toast.className = 'toast show download-complete';
            
            // Auto-hide after 3 seconds
            downloadToastTimeout = setTimeout(() => {
                hideProgressToast();
            }, 3000);
        }
    }
    
    function hideProgressToast() {
        const toast = document.getElementById('toast');
        const toastProgress = document.getElementById('toastProgress');
        const toastPercent = document.getElementById('toastPercent');
        const toastProgressBar = document.getElementById('toastProgressBar');
        
        if (toast) {
            toast.className = 'toast';
        }
        if (toastProgress) {
            toastProgress.style.display = 'none';
        }
        if (toastPercent) {
            toastPercent.style.display = 'none';
        }
        if (toastProgressBar) {
            toastProgressBar.style.width = '0%';
            toastProgressBar.classList.remove('indeterminate');
        }
    }
    
    function getCSRFToken() {
        const cookie = document.cookie.split(';').find(c => c.trim().startsWith('csrftoken='));
        return cookie ? cookie.split('=')[1] : '';
    }
    
    function apiCall(url, method, data = null) {
        const options = {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCSRFToken()
            }
        };
        if (data) options.body = JSON.stringify(data);
        
        return fetch(url, options)
            .then(response => response.json())
            .catch(error => {
                console.error('API Error:', error);
                showToast('Error: ' + error.message, false);
                throw error;
            });
    }
    
    function verifyCard(cardId) {
        apiCall(`/api/card/${cardId}/status/`, 'POST', { status: 'verified' })
            .then(data => {
                showToast('Card verified successfully');
                location.reload();
            });
    }
    
    function approveCard(cardId) {
        apiCall(`/api/card/${cardId}/status/`, 'POST', { status: 'approved' })
            .then(data => {
                showToast('Card approved successfully');
                location.reload();
            });
    }
    
    function unapproveCard(cardId) {
        apiCall(`/api/card/${cardId}/status/`, 'POST', { status: 'verified' })
            .then(data => {
                showToast('Card moved back to verified');
                location.reload();
            });
    }
    
    function unverifyCard(cardId) {
        apiCall(`/api/card/${cardId}/status/`, 'POST', { status: 'pending' })
            .then(data => {
                showToast('Card moved back to pending');
                location.reload();
            });
    }
    
    function downloadCard(cardId) {
        apiCall(`/api/card/${cardId}/status/`, 'POST', { status: 'download' })
            .then(data => {
                showToast('Card moved to download list');
                location.reload();
            });
    }
    
    function retrieveCard(cardId) {
        apiCall(`/api/card/${cardId}/status/`, 'POST', { status: 'pending' })
            .then(data => {
                showToast('Card retrieved to pending list');
                location.reload();
            });
    }
    
    function bulkVerify(cardIds) {
        const tableId = typeof TABLE_ID !== 'undefined' ? TABLE_ID : null;
        if (!tableId) { showToast('Error: Table ID not found', 'error'); return; }
        apiCall(`/api/table/${tableId}/cards/bulk-status/`, 'POST', { card_ids: cardIds, status: 'verified' })
            .then(data => {
                showToast(`${data.updated_count} card(s) verified`);
                location.reload();
            });
    }
    
    function bulkApprove(cardIds) {
        const tableId = typeof TABLE_ID !== 'undefined' ? TABLE_ID : null;
        if (!tableId) { showToast('Error: Table ID not found', 'error'); return; }
        apiCall(`/api/table/${tableId}/cards/bulk-status/`, 'POST', { card_ids: cardIds, status: 'approved' })
            .then(data => {
                showToast(`${data.updated_count} card(s) approved`);
                location.reload();
            });
    }
    
    function bulkUnapprove(cardIds) {
        const tableId = typeof TABLE_ID !== 'undefined' ? TABLE_ID : null;
        if (!tableId) { showToast('Error: Table ID not found', 'error'); return; }
        apiCall(`/api/table/${tableId}/cards/bulk-status/`, 'POST', { card_ids: cardIds, status: 'verified' })
            .then(data => {
                showToast(`${data.updated_count} card(s) moved to verified`);
                location.reload();
            });
    }
    
    function bulkUnverify(cardIds) {
        const tableId = typeof TABLE_ID !== 'undefined' ? TABLE_ID : null;
        if (!tableId) { showToast('Error: Table ID not found', 'error'); return; }
        apiCall(`/api/table/${tableId}/cards/bulk-status/`, 'POST', { card_ids: cardIds, status: 'pending' })
            .then(data => {
                showToast(`${data.updated_count} card(s) moved to pending`);
                location.reload();
            });
    }
    
    // Delete moves to Pool (soft delete), only from Pending and Verified
    function bulkDelete(cardIds) {
        const tableId = typeof TABLE_ID !== 'undefined' ? TABLE_ID : null;
        if (!tableId) { showToast('Error: Table ID not found', 'error'); return; }
        // Move to pool instead of permanent delete
        apiCall(`/api/table/${tableId}/cards/bulk-status/`, 'POST', { card_ids: cardIds, status: 'pool' })
            .then(data => {
                showToast(`${data.updated_count} card(s) moved to pool`);
                location.reload();
            });
    }
    
    // Retrieve moves cards back to pending (from Pool or other lists)
    function bulkRetrieve(cardIds) {
        const tableId = typeof TABLE_ID !== 'undefined' ? TABLE_ID : null;
        if (!tableId) { showToast('Error: Table ID not found', 'error'); return; }
        apiCall(`/api/table/${tableId}/cards/bulk-status/`, 'POST', { card_ids: cardIds, status: 'pending' })
            .then(data => {
                showToast(`${data.updated_count} card(s) retrieved to pending`);
                location.reload();
            });
    }
    
    function bulkDeletePermanent(cardIds) {
        const tableId = typeof TABLE_ID !== 'undefined' ? TABLE_ID : null;
        if (!tableId) { showToast('Error: Table ID not found', 'error'); return; }
        
        // Store the card IDs for later use
        window.pendingDeleteCardIds = cardIds;
        
        // Update the modal with count
        const deleteCountText = document.getElementById('deleteCountText');
        if (deleteCountText) {
            deleteCountText.textContent = `${cardIds.length} card(s)`;
        }
        
        // Show the delete confirmation modal
        const deleteModalOverlay = document.getElementById('deleteModalOverlay');
        if (deleteModalOverlay) {
            deleteModalOverlay.classList.add('active');
        }
    }
    
    // Delete Modal Event Handlers
    const deleteModalOverlay = document.getElementById('deleteModalOverlay');
    const closeDeleteModal = document.getElementById('closeDeleteModal');
    const cancelDeleteModal = document.getElementById('cancelDeleteModal');
    const confirmDeleteModal = document.getElementById('confirmDeleteModal');
    
    function closeDeleteModalFn() {
        if (deleteModalOverlay) {
            deleteModalOverlay.classList.remove('active');
        }
        window.pendingDeleteCardIds = null;
    }
    
    if (closeDeleteModal) closeDeleteModal.addEventListener('click', closeDeleteModalFn);
    if (cancelDeleteModal) cancelDeleteModal.addEventListener('click', closeDeleteModalFn);
    
    // Close on overlay click
    if (deleteModalOverlay) {
        deleteModalOverlay.addEventListener('click', function(e) {
            if (e.target === this) closeDeleteModalFn();
        });
    }
    
    // Close on Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && deleteModalOverlay?.classList.contains('active')) {
            closeDeleteModalFn();
        }
    });
    
    // Confirm delete button
    if (confirmDeleteModal) {
        confirmDeleteModal.addEventListener('click', function() {
            const cardIds = window.pendingDeleteCardIds;
            const tableId = typeof TABLE_ID !== 'undefined' ? TABLE_ID : null;
            
            if (!cardIds || cardIds.length === 0 || !tableId) {
                closeDeleteModalFn();
                return;
            }
            
            // Disable button and show loading state
            this.disabled = true;
            this.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Deleting...';
            
            fetch(`/api/table/${tableId}/cards/bulk-delete/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCSRFToken()
                },
                body: JSON.stringify({ card_ids: cardIds })
            })
            .then(response => response.json())
            .then(data => {
                closeDeleteModalFn();
                if (data.success) {
                    showToast(`${data.deleted_count} card(s) permanently deleted`);
                    location.reload();
                } else {
                    showToast(data.message || 'Error deleting cards', 'error');
                    // Reset button
                    confirmDeleteModal.disabled = false;
                    confirmDeleteModal.innerHTML = '<i class="fa-solid fa-trash"></i> Delete Permanently';
                }
            })
            .catch(error => {
                console.error('Error:', error);
                closeDeleteModalFn();
                showToast('Error deleting cards', 'error');
                // Reset button
                confirmDeleteModal.disabled = false;
                confirmDeleteModal.innerHTML = '<i class="fa-solid fa-trash"></i> Delete Permanently';
            });
        });
    }

    // ==========================================
    // IMAGE SORT MODAL FUNCTIONALITY
    // ==========================================
    
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
    
    // Open modal on button click
    if (imageSortBtn) {
        imageSortBtn.addEventListener('click', openImageSortModal);
    }
    
    // Close modal handlers
    if (closeImageSortModal) closeImageSortModal.addEventListener('click', closeImageSortModalFn);
    
    if (imageSortModalOverlay) {
        imageSortModalOverlay.addEventListener('click', function(e) {
            if (e.target === this) closeImageSortModalFn();
        });
    }
    
    // Clear filter
    if (clearImageSort) {
        clearImageSort.addEventListener('click', function() {
            // Reset dropdowns
            if (imageSortColumn) imageSortColumn.value = '';
            if (imageSortCondition) imageSortCondition.value = '';
            
            // Show all rows
            const rows = document.querySelectorAll('#cardsTableBody tr[data-card-id]');
            rows.forEach(row => {
                row.style.display = '';
            });
            
            closeImageSortModalFn();
            showToast('Image filter cleared');
        });
    }
    
    // Apply sort/filter
    if (applyImageSort) {
        applyImageSort.addEventListener('click', function() {
            const columnName = imageSortColumn?.value;
            const condition = imageSortCondition?.value;
            
            if (!columnName) {
                showToast('Please select an image column', 'error');
                return;
            }
            
            if (!condition) {
                showToast('Please select a condition', 'error');
                return;
            }
            
            const rows = document.querySelectorAll('#cardsTableBody tr[data-card-id]');
            let visibleCount = 0;
            
            rows.forEach(row => {
                // Find the image cell for the selected column
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
                        // Image is uploaded and in DB
                        showRow = hasImage && originalValue && originalValue.trim() !== '';
                        break;
                    case 'pending':
                        // Placeholder created but no image uploaded yet
                        showRow = hasPlaceholder && (!originalValue || originalValue.trim() === '');
                        break;
                    case 'incomplete':
                        // No placeholder at all (this might be rare, but checking)
                        showRow = !hasImage && !hasPlaceholder;
                        break;
                }
                
                row.style.display = showRow ? '' : 'none';
                if (showRow) visibleCount++;
            });
            
            closeImageSortModalFn();
            
            const conditionText = condition === 'complete' ? 'Complete' : 
                                  condition === 'pending' ? 'Pending' : 'Incomplete';
            showToast(`Showing ${visibleCount} cards with ${conditionText} images in "${columnName.toUpperCase()}"`);
        });
    }

    // ==========================================
    // SEARCH ALL MODAL FUNCTIONALITY
    // ==========================================
    
    const searchAllBtn = document.getElementById('searchAllBtn');
    const searchAllModalOverlay = document.getElementById('searchAllModalOverlay');
    const closeSearchAllModal = document.getElementById('closeSearchAllModal');
    const searchAllInput = document.getElementById('searchAllInput');
    const clearSearchInput = document.getElementById('clearSearchInput');
    const searchResultsContainer = document.getElementById('searchResultsContainer');
    
    let searchTimeout = null;
    
    function openSearchAllModal() {
        if (searchAllModalOverlay) {
            searchAllModalOverlay.classList.add('active');
            // Focus input after animation
            setTimeout(() => {
                if (searchAllInput) searchAllInput.focus();
            }, 100);
        }
    }
    
    function closeSearchAllModalFn() {
        if (searchAllModalOverlay) {
            searchAllModalOverlay.classList.remove('active');
        }
        // Clear search
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
    
    // Open modal on button click
    if (searchAllBtn) {
        searchAllBtn.addEventListener('click', openSearchAllModal);
    }
    
    // Close modal handlers
    if (closeSearchAllModal) closeSearchAllModal.addEventListener('click', closeSearchAllModalFn);
    
    if (searchAllModalOverlay) {
        searchAllModalOverlay.addEventListener('click', function(e) {
            if (e.target === this) closeSearchAllModalFn();
        });
    }
    
    // Clear search input
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
            searchAllInput.focus();
        });
    }
    
    // Search input handler with debounce
    if (searchAllInput) {
        searchAllInput.addEventListener('input', function() {
            const query = this.value.trim();
            
            // Show/hide clear button
            if (clearSearchInput) {
                clearSearchInput.style.display = query.length > 0 ? 'flex' : 'none';
            }
            
            // Clear previous timeout
            if (searchTimeout) clearTimeout(searchTimeout);
            
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
            
            // Show loading
            if (searchResultsContainer) {
                searchResultsContainer.innerHTML = `
                    <div class="search-loading">
                        <i class="fa-solid fa-spinner fa-spin"></i>
                        <p>Searching...</p>
                    </div>
                `;
            }
            
            // Debounce search
            searchTimeout = setTimeout(() => {
                performSearch(query);
            }, 300);
        });
    }
    
    function performSearch(query) {
        const tableId = typeof TABLE_ID !== 'undefined' ? TABLE_ID : null;
        if (!tableId) {
            showToast('Error: Table ID not found', 'error');
            return;
        }
        
        fetch(`/api/table/${tableId}/cards/search/?q=${encodeURIComponent(query)}`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    displaySearchResults(data.results, query);
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
    
    function displaySearchResults(results, query) {
        if (!searchResultsContainer) return;
        
        if (results.length === 0) {
            searchResultsContainer.innerHTML = `
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
        searchResultsContainer.innerHTML = html;
        
        // Add click handlers to results
        searchResultsContainer.querySelectorAll('.search-result-item').forEach(item => {
            item.addEventListener('click', function() {
                const cardId = this.getAttribute('data-card-id');
                const status = this.getAttribute('data-status');
                
                // Close modal and navigate to the card
                closeSearchAllModalFn();
                
                // Navigate to the appropriate status list with the card
                const currentUrl = new URL(window.location.href);
                currentUrl.searchParams.set('status', status);
                currentUrl.searchParams.set('highlight', cardId);
                window.location.href = currentUrl.toString();
            });
        });
    }

    function createCard(fieldData) {
        const tableId = typeof TABLE_ID !== 'undefined' ? TABLE_ID : null;
        if (!tableId) {
            showToast('Error: Table ID not found', false);
            return;
        }
        
        apiCall(`/api/tables/${tableId}/cards/`, 'POST', { field_data: fieldData })
            .then(data => {
                showToast('Card created successfully');
                location.reload();
            });
    }
    
    // Initial button state
    updateButtonStates();
});

// Toast styles (inline if not in CSS)
const style = document.createElement('style');
style.textContent = `
    .toast {
        position: fixed;
        bottom: 80px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 8px;
        background: #333;
        color: #fff;
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 14px;
        z-index: 9999;
        transform: translateY(100px);
        opacity: 0;
        transition: all 0.3s ease;
    }
    .toast.show {
        transform: translateY(0);
        opacity: 1;
    }
    .toast.success {
        background: #22c55e;
    }
    .toast.error {
        background: #ef4444;
    }
`;
document.head.appendChild(style);

// ==========================================
// INLINE CELL EDITING
// ==========================================

// Helper function to get CSRF token
function getCSRFTokenForEdit() {
    const cookie = document.cookie.split(';').find(c => c.trim().startsWith('csrftoken='));
    return cookie ? cookie.split('=')[1] : '';
}

// Helper function to check if row is visible
function isRowVisible(row) {
    if (!row) return false;
    // Check if the row has display:none or is hidden
    const style = window.getComputedStyle(row);
    return style.display !== 'none' && row.dataset.cardId;
}

// Helper function to get next/previous editable cell (moves right/left within row, then to next/prev row)
function getAdjacentCell(currentCell, direction) {
    const currentRow = currentCell.closest('tr');
    if (!currentRow) return null;
    
    // Get all editable cells in the current row (in DOM order - left to right)
    const cellsInRow = Array.from(currentRow.querySelectorAll('.editable-cell:not(.image-field)'));
    const currentIndex = cellsInRow.indexOf(currentCell);
    
    console.log('Current cell index:', currentIndex, 'Total cells in row:', cellsInRow.length, 'Direction:', direction);
    
    if (direction === 'next') {
        // Try to get next cell in same row (to the right)
        if (currentIndex >= 0 && currentIndex < cellsInRow.length - 1) {
            console.log('Moving to next cell in same row');
            return cellsInRow[currentIndex + 1];
        }
        // If at end of row, go to first cell of next visible row
        let nextRow = currentRow.nextElementSibling;
        while (nextRow) {
            if (isRowVisible(nextRow)) {
                const nextRowCells = Array.from(nextRow.querySelectorAll('.editable-cell:not(.image-field)'));
                if (nextRowCells.length > 0) {
                    console.log('Moving to first cell of next row');
                    return nextRowCells[0];
                }
            }
            nextRow = nextRow.nextElementSibling;
        }
        console.log('No next cell found');
        return null;
    } else {
        // Try to get previous cell in same row (to the left)
        if (currentIndex > 0) {
            console.log('Moving to previous cell in same row');
            return cellsInRow[currentIndex - 1];
        }
        // If at start of row, go to last cell of previous visible row
        let prevRow = currentRow.previousElementSibling;
        while (prevRow) {
            if (isRowVisible(prevRow)) {
                const prevRowCells = Array.from(prevRow.querySelectorAll('.editable-cell:not(.image-field)'));
                if (prevRowCells.length > 0) {
                    console.log('Moving to last cell of previous row');
                    return prevRowCells[prevRowCells.length - 1];
                }
            }
            prevRow = prevRow.previousElementSibling;
        }
        console.log('No previous cell found');
        return null;
    }
}

// Function to trigger edit on a cell directly
function startCellEdit(cell) {
    if (!cell) return;
    
    // Check if multiple rows are selected - don't allow edit
    const selectedCheckboxes = document.querySelectorAll('.rowCheckbox:checked');
    if (selectedCheckboxes.length > 1) {
        // Multiple rows selected - don't allow inline edit
        return;
    }
    
    // Wait a tiny bit for any cleanup to finish
    requestAnimationFrame(() => {
        if (cell.classList.contains('editing')) return;
        
        const fieldName = cell.dataset.fieldName;
        const fieldType = cell.dataset.fieldType;
        const originalValue = cell.dataset.originalValue || '';
        const cellValue = cell.querySelector('.cell-value');
        const currentValue = cellValue ? cellValue.textContent.trim() : originalValue;
        
        // Get current cell dimensions before editing
        const cellHeight = cell.offsetHeight;
        const cellWidth = cell.offsetWidth;
        
        // Mark as editing
        cell.classList.add('editing');
        
        // Create input - match exact cell size
        let input;
        const isLongContent = currentValue.length > 30;
        
        if (fieldType === 'textarea' || isLongContent) {
            input = document.createElement('textarea');
            input.style.height = (cellHeight - 2) + 'px';
            input.style.width = (cellWidth - 2) + 'px';
        } else if (fieldType === 'date') {
            input = document.createElement('input');
            input.type = 'date';
        } else if (fieldType === 'number') {
            input = document.createElement('input');
            input.type = 'text';
        } else if (fieldType === 'email') {
            input = document.createElement('input');
            input.type = 'email';
        } else {
            input = document.createElement('input');
            input.type = 'text';
        }
        
        input.className = 'cell-input';
        input.value = currentValue;
        input.placeholder = fieldName || 'Enter value...';
        
        // Store original content
        const originalContent = cell.innerHTML;
        const currentCell = cell;
        
        // Replace content with input
        cell.innerHTML = '';
        cell.appendChild(input);
        input.focus();
        input.select();
        
        // Variable to track if we should cancel instead of save
        let shouldCancel = false;
        // Variable to track next cell for Tab navigation
        let nextCellToEdit = null;
        
        // Save function
        const saveCell = async () => {
            // If cancel was triggered, don't save
            if (shouldCancel) {
                currentCell.classList.remove('editing');
                currentCell.innerHTML = originalContent;
                return;
            }
            
            const newValue = input.value.trim();
            const cardId = currentCell.closest('tr').dataset.cardId;
            
            // Remove editing state
            currentCell.classList.remove('editing');
            
            // If value hasn't changed, just restore
            if (newValue === currentValue) {
                currentCell.innerHTML = originalContent;
                // Navigate to next cell if Tab was pressed
                if (nextCellToEdit) {
                    startCellEdit(nextCellToEdit);
                    nextCellToEdit = null;
                }
                return;
            }
            
            // Show saving state
            currentCell.innerHTML = '<span class="cell-saving"><i class="fa-solid fa-spinner fa-spin"></i></span>';
            
            try {
                // Get all field data for this card
                const row = currentCell.closest('tr');
                const fieldData = {};
                
                row.querySelectorAll('.editable-cell:not(.image-field)').forEach(c => {
                    const name = c.dataset.fieldName;
                    const valueSpan = c.querySelector('.cell-value');
                    if (c === currentCell) {
                        fieldData[name] = newValue;
                    } else if (valueSpan) {
                        fieldData[name] = valueSpan.textContent.trim();
                    } else {
                        fieldData[name] = c.dataset.originalValue || '';
                    }
                });
                
                // Save to database with CSRF token
                const response = await fetch(`/api/card/${cardId}/update/`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': getCSRFTokenForEdit()
                    },
                    body: JSON.stringify({ field_data: fieldData })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    // Update cell with new value
                    currentCell.innerHTML = `<span class="cell-value">${newValue}</span>`;
                    currentCell.dataset.originalValue = newValue;
                    
                    // Show success indicator briefly
                    currentCell.classList.add('cell-saved');
                    setTimeout(() => currentCell.classList.remove('cell-saved'), 1500);
                    
                    // Navigate to next cell if Tab was pressed
                    if (nextCellToEdit) {
                        startCellEdit(nextCellToEdit);
                        nextCellToEdit = null;
                    }
                } else {
                    // Restore original value on error
                    currentCell.innerHTML = originalContent;
                    showToast(result.message || 'Failed to save', false);
                }
            } catch (error) {
                console.error('Save error:', error);
                currentCell.innerHTML = originalContent;
                showToast('Failed to save changes', false);
            }
        };
        
        // Handle blur - auto save
        input.addEventListener('blur', saveCell);
        
        // Handle keyboard
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                // Enter saves (for all field types now)
                e.preventDefault();
                this.blur();
            } else if (e.key === 'Tab') {
                e.preventDefault();
                // Get next or previous cell based on Shift key
                if (e.shiftKey) {
                    nextCellToEdit = getAdjacentCell(currentCell, 'prev');
                } else {
                    nextCellToEdit = getAdjacentCell(currentCell, 'next');
                }
                console.log('Tab pressed, next cell:', nextCellToEdit);
                this.blur();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                shouldCancel = true;
                this.blur();
            }
        });
    });
}

// Make cells editable on double-click
document.querySelectorAll('.editable-cell:not(.image-field)').forEach(cell => {
    cell.addEventListener('dblclick', function(e) {
        startCellEdit(this);
    });
});

// Add editable cell styles
const editableCellStyle = document.createElement('style');
editableCellStyle.textContent = `
    .editable-cell:not(.image-field) {
        cursor: pointer;
        transition: background 0.2s ease;
    }
    .editable-cell:not(.image-field):hover {
        background: rgba(52, 152, 219, 0.08);
    }
    .editable-cell.editing {
        padding: 0 !important;
        background: #fff !important;
        position: relative;
    }
    .cell-input {
        position: absolute;
        top: 0;
        left: 0;
        width: 100% !important;
        height: 100% !important;
        padding: 4px 6px;
        font-size: 12px;
        font-family: 'Roboto Condensed', sans-serif;
        border: 2px solid #3498db;
        border-radius: 0;
        outline: none;
        box-sizing: border-box;
        line-height: 1.4;
        text-transform: uppercase;
    }
    .cell-input::placeholder {
        color: #aaa;
        text-transform: none;
        font-style: italic;
    }
    .cell-input:focus {
        border-color: #2980b9;
        box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.2);
    }
    textarea.cell-input {
        resize: none;
        overflow: auto;
        white-space: pre-wrap;
        word-wrap: break-word;
        padding: 4px 6px;
    }
    .cell-saving {
        color: #3498db;
    }
    .cell-saved {
        animation: cellSavedFlash 1.5s ease;
    }
    @keyframes cellSavedFlash {
        0% { background: rgba(34, 197, 94, 0.3); }
        100% { background: transparent; }
    }
`;
document.head.appendChild(editableCellStyle);

