// Set active sidebar link based on current page
(function() {
    const allClientsLink = document.getElementById('allClientsLink');
    const activeClientsLink = document.getElementById('activeClientsLink');
    
    // On idcard-actions page, Active Clients should be active
    if (activeClientsLink) {
        activeClientsLink.classList.add('active');
    }
    if (allClientsLink) {
        allClientsLink.classList.remove('active');
    }
})();

function updateDateTime() {
  const now = new Date();

  document.getElementById("date").innerText =
    now.toLocaleDateString("en-US", {
      weekday: "long",
      day: "2-digit",
      month: "short",
      year: "numeric"
    });

  document.getElementById("time").innerText =
    now.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
}

setInterval(updateDateTime, 1000);
updateDateTime();

// Sidebar Toggle Functionality
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
        
        if (collapsed) {
            sidebarToggle.innerHTML = '<i class="fa-solid fa-bars"></i>';
        } else {
            sidebarToggle.innerHTML = '<i class="fa-solid fa-xmark"></i>';
        }
    });

    // Keyboard shortcuts: C to collapse, V to expand
    document.addEventListener("keydown", function(e) {
        // Don't trigger if user is typing in an input/textarea
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        
        if (e.key.toLowerCase() === 'c' && !sidebar.classList.contains('collapsed')) {
            sidebar.classList.add('collapsed');
            document.body.classList.add('sidebar-collapsed');
            localStorage.setItem('sidebarCollapsed', 'true');
            sidebarToggle.innerHTML = '<i class="fa-solid fa-bars"></i>';
        } else if (e.key.toLowerCase() === 'v' && sidebar.classList.contains('collapsed')) {
            sidebar.classList.remove('collapsed');
            document.body.classList.remove('sidebar-collapsed');
            localStorage.setItem('sidebarCollapsed', 'false');
            sidebarToggle.innerHTML = '<i class="fa-solid fa-xmark"></i>';
        }
    });
}

// Get parameters from URL
const urlParams = new URLSearchParams(window.location.search);
const clientName = urlParams.get('client');
const groupName = urlParams.get('group');
const actionType = urlParams.get('action');
const count = urlParams.get('count');

// Get all counts from URL
const pendingCount = urlParams.get('pendingCount') || '0';
const verifiedCount = urlParams.get('verifiedCount') || '0';
const poolCount = urlParams.get('poolCount') || '0';
const approvedCount = urlParams.get('approvedCount') || '0';
const downloadCount = urlParams.get('downloadCount') || '0';

// Populate all action tab counts
document.getElementById('pendingCount').textContent = pendingCount;
document.getElementById('verifiedCount').textContent = verifiedCount;
document.getElementById('poolCount').textContent = poolCount;
document.getElementById('approvedCount').textContent = approvedCount;
document.getElementById('downloadCount').textContent = downloadCount;

// Update breadcrumb with client name
if (clientName) {
    const clientNameEl = document.getElementById('clientName');
    clientNameEl.textContent = clientName;
    clientNameEl.href = `idcard-group.html?client=${encodeURIComponent(clientName)}`;
}

// Update breadcrumb with group name
if (groupName) {
    const groupNameEl = document.getElementById('groupName');
    groupNameEl.textContent = groupName;
    groupNameEl.href = `idcard-group.html?client=${encodeURIComponent(clientName || '')}`;
}

// Update breadcrumb with action type
const actionLabels = {
    'pending': 'Pending List',
    'verified': 'Verified List',
    'pool': 'Pool List',
    'approved': 'Approved List',
    'download': 'Download List'
};

if (actionType) {
    const actionTypeEl = document.getElementById('actionType');
    actionTypeEl.textContent = actionLabels[actionType] || 'Pending List';
}

// Highlight the active action tab
const actionTabs = document.querySelectorAll('.action-tab');
actionTabs.forEach(tab => {
    const tabAction = tab.getAttribute('data-action');
    if (tabAction === actionType) {
        tab.classList.add('active');
    }
    
    // Add click handler for tab navigation
    tab.addEventListener('click', function(e) {
        e.preventDefault();
        const newAction = this.getAttribute('data-action');
        const newCount = this.querySelector('.tab-count').textContent || '0';
        const params = new URLSearchParams({
            client: clientName || '',
            group: groupName || '',
            action: newAction,
            count: newCount,
            pendingCount: pendingCount,
            verifiedCount: verifiedCount,
            poolCount: poolCount,
            approvedCount: approvedCount,
            downloadCount: downloadCount
        });
        window.location.href = `idcard-actions.html?${params.toString()}`;
    });
});

// Show/hide action bars based on action type
const pendingActionBar = document.getElementById('pendingActionBar');
const verifiedActionBar = document.getElementById('verifiedActionBar');
const poolActionBar = document.getElementById('poolActionBar');
const approvedActionBar = document.getElementById('approvedActionBar');
const downloadActionBar = document.getElementById('downloadActionBar');

// Add body class for CSS-based show/hide of buttons
if (actionType === 'verified') {
    document.body.classList.add('action-verified');
    pendingActionBar.style.display = 'none';
    verifiedActionBar.style.display = 'flex';
    poolActionBar.style.display = 'none';
    approvedActionBar.style.display = 'none';
    downloadActionBar.style.display = 'none';
} else if (actionType === 'pool') {
    document.body.classList.add('action-pool');
    pendingActionBar.style.display = 'none';
    verifiedActionBar.style.display = 'none';
    poolActionBar.style.display = 'flex';
    approvedActionBar.style.display = 'none';
    downloadActionBar.style.display = 'none';
} else if (actionType === 'approved') {
    document.body.classList.add('action-approved');
    pendingActionBar.style.display = 'none';
    verifiedActionBar.style.display = 'none';
    poolActionBar.style.display = 'none';
    approvedActionBar.style.display = 'flex';
    downloadActionBar.style.display = 'none';
} else if (actionType === 'download') {
    document.body.classList.add('action-download');
    pendingActionBar.style.display = 'none';
    verifiedActionBar.style.display = 'none';
    poolActionBar.style.display = 'none';
    approvedActionBar.style.display = 'none';
    downloadActionBar.style.display = 'flex';
} else {
    document.body.classList.add('action-pending');
    pendingActionBar.style.display = 'flex';
    verifiedActionBar.style.display = 'none';
    poolActionBar.style.display = 'none';
    approvedActionBar.style.display = 'none';
    downloadActionBar.style.display = 'none';
}

// Checkbox functionality
const selectAll = document.getElementById("selectAll");
const rowCheckboxes = document.querySelectorAll(".rowCheckbox");

// Pending action bar buttons
const editBtn = document.getElementById("editBtn");
const viewBtn = document.getElementById("viewBtn");
const deleteBtn = document.getElementById("deleteBtn");
const verifyBtn = document.getElementById("verifyBtn");
const uploadXlsxBtn = document.getElementById("uploadXlsxBtn");
const addBtn = document.getElementById("addBtn");
const downloadImgBtn = document.getElementById("downloadImgBtn");
const downloadDocxBtn = document.getElementById("downloadDocxBtn");
const downloadXlsxBtn = document.getElementById("downloadXlsxBtn");
const downloadPdfBtn = document.getElementById("downloadPdfBtn");
const reuploadImageBtn = document.getElementById("reuploadImageBtn");

// Verified action bar buttons
const editBtnV = document.getElementById("editBtnV");
const viewBtnV = document.getElementById("viewBtnV");
const retrieveBtn = document.getElementById("retrieveBtn");
const unverifyBtn = document.getElementById("unverifyBtn");
const approveBtn = document.getElementById("approveBtn");
const downloadImgBtnV = document.getElementById("downloadImgBtnV");
const downloadDocxBtnV = document.getElementById("downloadDocxBtnV");
const downloadXlsxBtnV = document.getElementById("downloadXlsxBtnV");
const downloadPdfBtnV = document.getElementById("downloadPdfBtnV");
const reuploadImageBtnV = document.getElementById("reuploadImageBtnV");

// Pool action bar buttons
const viewBtnP = document.getElementById("viewBtnP");
const retrieveBtnP = document.getElementById("retrieveBtnP");
const downloadImgBtnP = document.getElementById("downloadImgBtnP");
const downloadDocxBtnP = document.getElementById("downloadDocxBtnP");
const downloadXlsxBtnP = document.getElementById("downloadXlsxBtnP");
const downloadPdfBtnP = document.getElementById("downloadPdfBtnP");
const reuploadImageBtnP = document.getElementById("reuploadImageBtnP");

// Approved action bar buttons
const editBtnA = document.getElementById("editBtnA");
const viewBtnA = document.getElementById("viewBtnA");
const retrieveBtnA = document.getElementById("retrieveBtnA");
const unapprovedBtn = document.getElementById("unapprovedBtn");
const downloadImgBtnA = document.getElementById("downloadImgBtnA");
const downloadDocxBtnA = document.getElementById("downloadDocxBtnA");
const downloadXlsxBtnA = document.getElementById("downloadXlsxBtnA");
const downloadPdfBtnA = document.getElementById("downloadPdfBtnA");
const reuploadImageBtnA = document.getElementById("reuploadImageBtnA");

// Download action bar buttons
const editBtnD = document.getElementById("editBtnD");
const viewBtnD = document.getElementById("viewBtnD");
const retrieveBtnD = document.getElementById("retrieveBtnD");
const downloadImgBtnD = document.getElementById("downloadImgBtnD");
const downloadDocxBtnD = document.getElementById("downloadDocxBtnD");
const downloadXlsxBtnD = document.getElementById("downloadXlsxBtnD");
const downloadPdfBtnD = document.getElementById("downloadPdfBtnD");
const reuploadImageBtnD = document.getElementById("reuploadImageBtnD");

// Modal elements
const editModal = document.getElementById("editModal");
const closeModal = document.getElementById("closeModal");
const cancelEdit = document.getElementById("cancelEdit");
const saveEdit = document.getElementById("saveEdit");

let currentEditRow = null;

// Function to update button states based on selection
function updateButtonStates() {
    const checkedBoxes = [...rowCheckboxes].filter(cb => cb.checked);
    const singleSelected = checkedBoxes.length === 1;
    const anySelected = checkedBoxes.length >= 1;
    
    if (actionType === 'download') {
        // Download list button states
        // Edit and View are ONLY enabled when single row is selected
        editBtnD.disabled = !singleSelected;
        viewBtnD.disabled = !singleSelected;
        
        // Retrieve is enabled when one or more rows are selected
        retrieveBtnD.disabled = !anySelected;
        
        // Download buttons are disabled when any row is selected
        downloadImgBtnD.disabled = anySelected;
        downloadDocxBtnD.disabled = anySelected;
        downloadXlsxBtnD.disabled = anySelected;
        downloadPdfBtnD.disabled = anySelected;
        reuploadImageBtnD.disabled = anySelected;
    } else if (actionType === 'approved') {
        // Approved list button states
        // Edit and View are ONLY enabled when single row is selected
        editBtnA.disabled = !singleSelected;
        viewBtnA.disabled = !singleSelected;
        
        // Retrieve and Unapproved Selected are enabled when one or more rows are selected
        retrieveBtnA.disabled = !anySelected;
        unapprovedBtn.disabled = !anySelected;
        
        // Download buttons are disabled when any row is selected
        downloadImgBtnA.disabled = anySelected;
        downloadDocxBtnA.disabled = anySelected;
        downloadXlsxBtnA.disabled = anySelected;
        downloadPdfBtnA.disabled = anySelected;
        reuploadImageBtnA.disabled = anySelected;
    } else if (actionType === 'pool') {
        // Pool list button states
        // View is enabled only when single row is selected
        viewBtnP.disabled = !singleSelected;
        // Retrieve is enabled when single or multiple rows are selected
        retrieveBtnP.disabled = !anySelected;
        
        // Download buttons are disabled when any row is selected
        downloadImgBtnP.disabled = anySelected;
        downloadDocxBtnP.disabled = anySelected;
        downloadXlsxBtnP.disabled = anySelected;
        downloadPdfBtnP.disabled = anySelected;
        reuploadImageBtnP.disabled = anySelected;
    } else if (actionType === 'verified') {
        // Verified list button states
        // Edit and View are ONLY enabled when single row is selected
        editBtnV.disabled = !singleSelected;
        viewBtnV.disabled = !singleSelected;
        
        // Retrieve is enabled when single row is selected
        retrieveBtn.disabled = !singleSelected;
        
        // Unverified Selected and Approve Selected are enabled when one or more rows are selected
        unverifyBtn.disabled = !anySelected;
        approveBtn.disabled = !anySelected;
        
        // Download buttons are disabled when any row is selected
        downloadImgBtnV.disabled = anySelected;
        downloadDocxBtnV.disabled = anySelected;
        downloadXlsxBtnV.disabled = anySelected;
        downloadPdfBtnV.disabled = anySelected;
        reuploadImageBtnV.disabled = anySelected;
    } else {
        // Pending list button states
        // Edit and View are ONLY enabled when single row is selected
        editBtn.disabled = !singleSelected;
        viewBtn.disabled = !singleSelected;
        
        // Delete and Verify Selected are enabled when one or more rows are selected
        deleteBtn.disabled = !anySelected;
        verifyBtn.disabled = !anySelected;
        
        // All other buttons are disabled when any row is selected
        uploadXlsxBtn.disabled = anySelected;
        addBtn.disabled = anySelected;
        downloadImgBtn.disabled = anySelected;
        downloadDocxBtn.disabled = anySelected;
        downloadXlsxBtn.disabled = anySelected;
        downloadPdfBtn.disabled = anySelected;
        reuploadImageBtn.disabled = anySelected;
    }
}

// Verify single row - move to verified list
function verifyRow(button) {
    const row = button.closest('tr');
    const studentName = row.cells[2].textContent;
    
    // Show confirmation
    if (confirm(`Are you sure you want to verify "${studentName}"?`)) {
        // Add fade out animation
        row.style.transition = 'opacity 0.3s, background-color 0.3s';
        row.style.backgroundColor = '#d4edda';
        
        setTimeout(() => {
            row.style.opacity = '0';
            setTimeout(() => {
                row.remove();
                // Update row numbers
                updateRowNumbers();
            }, 300);
        }, 500);
    }
}

// Unapprove single row - move back to pending list (in Approved list)
function unapproveRow(button) {
    const row = button.closest('tr');
    const studentName = row.cells[2].textContent;
    
    // Show confirmation
    if (confirm(`Are you sure you want to unapprove "${studentName}"?`)) {
        // Add fade out animation with red highlight
        row.style.transition = 'opacity 0.3s, background-color 0.3s';
        row.style.backgroundColor = '#f8d7da';
        
        setTimeout(() => {
            row.style.opacity = '0';
            setTimeout(() => {
                row.remove();
                // Update row numbers
                updateRowNumbers();
            }, 300);
        }, 500);
    }
}

// Approve single row - move to approved list
function approveRow(button) {
    const row = button.closest('tr');
    const studentName = row.cells[2].textContent;
    
    // Show confirmation
    if (confirm(`Are you sure you want to approve "${studentName}"?`)) {
        // Add fade out animation with green highlight
        row.style.transition = 'opacity 0.3s, background-color 0.3s';
        row.style.backgroundColor = '#d4edda';
        
        setTimeout(() => {
            row.style.opacity = '0';
            setTimeout(() => {
                row.remove();
                // Update row numbers
                updateRowNumbers();
            }, 300);
        }, 500);
    }
}

// Disapprove single row - move back from approved list
function disapproveRow(button) {
    const row = button.closest('tr');
    const studentName = row.cells[2].textContent;
    
    // Show confirmation
    if (confirm(`Are you sure you want to disapprove "${studentName}"?`)) {
        // Add fade out animation with red highlight
        row.style.transition = 'opacity 0.3s, background-color 0.3s';
        row.style.backgroundColor = '#f8d7da';
        
        setTimeout(() => {
            row.style.opacity = '0';
            setTimeout(() => {
                row.remove();
                // Update row numbers
                updateRowNumbers();
            }, 300);
        }, 500);
    }
}

// Update Sr No. after row removal
function updateRowNumbers() {
    const rows = document.querySelectorAll('.idcard-table tbody tr');
    rows.forEach((row, index) => {
        row.cells[1].textContent = index + 1;
    });
}

// Select / Deselect all
selectAll.addEventListener("change", function () {
    rowCheckboxes.forEach(checkbox => {
        checkbox.checked = this.checked;
    });
    updateButtonStates();
});

// Auto update "Select All" when rows are clicked
rowCheckboxes.forEach(checkbox => {
    checkbox.addEventListener("change", function () {
        selectAll.checked = [...rowCheckboxes].every(cb => cb.checked);
        updateButtonStates();
    });
});

// Rows per page dropdown
const rowsDropdown = document.getElementById("rowsDropdown");
const rowsToggle = document.getElementById("rowsToggle");
const rowsOptions = document.querySelectorAll("#rowsOptions .dropdown-option");
const rowsSelectedText = document.getElementById("rowsSelectedText");

let currentRowsPerPage = 10;

// Toggle dropdown open/close
rowsToggle.addEventListener("click", function(e) {
    e.stopPropagation();
    rowsDropdown.classList.toggle("open");
});

// Close dropdown when clicking outside
document.addEventListener("click", function() {
    rowsDropdown.classList.remove("open");
});

// Handle option selection
rowsOptions.forEach(option => {
    option.addEventListener("click", function(e) {
        e.stopPropagation();
        
        // Update selected state
        rowsOptions.forEach(opt => opt.classList.remove("selected"));
        this.classList.add("selected");
        
        // Update toggle text and value
        const value = this.dataset.value;
        rowsSelectedText.textContent = value;
        currentRowsPerPage = parseInt(value);
        
        // Close dropdown
        rowsDropdown.classList.remove("open");
        
        // Here you would trigger pagination update
        console.log("Rows per page changed to:", currentRowsPerPage);
    });
});

// Edit button click - open modal
editBtn.addEventListener("click", function() {
    const checkedBox = [...rowCheckboxes].find(cb => cb.checked);
    if (checkedBox) {
        currentEditRow = checkedBox.closest("tr");
        const cells = currentEditRow.querySelectorAll("td");
        
        // Populate form with current values (based on new column order)
        document.getElementById("editStudentName").value = cells[2].textContent;
        document.getElementById("editFatherName").value = cells[3].textContent;
        document.getElementById("editMotherName").value = cells[4].textContent;
        document.getElementById("editEmail").value = cells[5].textContent;
        document.getElementById("editAddress").value = cells[6].textContent;
        document.getElementById("editSchoolName").value = cells[7].textContent;
        document.getElementById("editDOB").value = cells[8].textContent;
        document.getElementById("editBloodGroup").value = cells[9].textContent;
        document.getElementById("editMobile").value = cells[10].textContent;
        
        // Set photo preview
        const photoImg = cells[11].querySelector("img");
        if (photoImg) {
            document.getElementById("editPhotoPreview").src = photoImg.src;
        }
        
        // Show modal
        editModal.classList.add("active");
    }
});

// Photo upload preview
const editPhotoInput = document.getElementById("editPhotoInput");
const editPhotoPreview = document.getElementById("editPhotoPreview");

editPhotoInput.addEventListener("change", function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            editPhotoPreview.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }
});

// Close modal functions
function closeEditModal() {
    editModal.classList.remove("active");
    currentEditRow = null;
    editPhotoInput.value = ""; // Reset file input
}

closeModal.addEventListener("click", closeEditModal);
cancelEdit.addEventListener("click", closeEditModal);

// Close modal when clicking overlay
editModal.addEventListener("click", function(e) {
    if (e.target === editModal) {
        closeEditModal();
    }
});

// Save changes
saveEdit.addEventListener("click", function() {
    if (currentEditRow) {
        const cells = currentEditRow.querySelectorAll("td");
        
        // Update table cells with form values
        cells[2].textContent = document.getElementById("editStudentName").value;
        cells[3].textContent = document.getElementById("editFatherName").value;
        cells[4].textContent = document.getElementById("editMotherName").value;
        cells[5].textContent = document.getElementById("editEmail").value;
        cells[6].textContent = document.getElementById("editAddress").value;
        cells[7].textContent = document.getElementById("editSchoolName").value;
        cells[8].textContent = document.getElementById("editDOB").value;
        cells[9].textContent = document.getElementById("editBloodGroup").value;
        cells[10].textContent = document.getElementById("editMobile").value;
        
        // Update photo if changed
        const photoImg = cells[11].querySelector("img");
        if (photoImg) {
            photoImg.src = editPhotoPreview.src;
        }
        
        // Update last updated timestamp
        const now = new Date();
        cells[12].textContent = now.toLocaleDateString("en-US", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }) + " " + now.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true
        });
        
        closeEditModal();
    }
});

// Inline Cell Editing (columns 3-11: Student Name to Mobile)
const editableColumns = [2, 3, 4, 5, 6, 7, 8, 9, 10]; // 0-based index

function startEditingCell(cell, row) {
    // Don't edit if already editing
    if (cell.querySelector("input")) return;
    
    const originalValue = cell.textContent;
    const input = document.createElement("input");
    input.type = "text";
    input.value = originalValue;
    input.className = "inline-edit-input";
    
    cell.textContent = "";
    cell.appendChild(input);
    input.focus();
    input.select();
    
    // Save on blur (with slight delay to allow tab navigation)
    input.addEventListener("blur", function() {
        setTimeout(() => {
            if (!cell.querySelector("input")) return;
            saveInlineEdit(cell, input, row);
        }, 100);
    });
    
    // Save on Enter, cancel on Escape, Tab navigation
    input.addEventListener("keydown", function(e) {
        if (e.key === "Enter") {
            e.preventDefault();
            saveInlineEdit(cell, input, row);
        } else if (e.key === "Escape") {
            cell.textContent = originalValue;
        } else if (e.key === "Tab") {
            e.preventDefault();
            saveInlineEdit(cell, input, row);
            
            const cells = Array.from(row.querySelectorAll("td"));
            const currentIndex = cells.indexOf(cell);
            
            if (e.shiftKey) {
                // Move to previous editable cell
                for (let i = currentIndex - 1; i >= 0; i--) {
                    if (editableColumns.includes(i)) {
                        startEditingCell(cells[i], row);
                        break;
                    }
                }
            } else {
                // Move to next editable cell
                for (let i = currentIndex + 1; i < cells.length; i++) {
                    if (editableColumns.includes(i)) {
                        startEditingCell(cells[i], row);
                        break;
                    }
                }
            }
        }
    });
}

document.querySelectorAll(".idcard-table tbody tr").forEach(row => {
    row.querySelectorAll("td").forEach((cell, index) => {
        if (editableColumns.includes(index)) {
            cell.classList.add("editable-cell");
            
            cell.addEventListener("dblclick", function() {
                startEditingCell(cell, row);
            });
        }
    });
});

function saveInlineEdit(cell, input, row) {
    const newValue = input.value.trim();
    cell.textContent = newValue || input.defaultValue;
    
    // Update last updated timestamp
    const cells = row.querySelectorAll("td");
    const now = new Date();
    cells[12].textContent = now.toLocaleDateString("en-US", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    }) + " " + now.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
    });
}

// Photo Cell Inline Edit
document.querySelectorAll(".idcard-table tbody tr").forEach(row => {
    const photoCell = row.querySelectorAll("td")[11]; // Photo column (index 11)
    const photoImg = photoCell.querySelector("img");
    
    if (photoImg) {
        // Add photo-cell class and create overlay
        photoCell.classList.add("photo-cell");
        
        // Create wrapper for positioning
        const wrapper = document.createElement("div");
        wrapper.style.position = "relative";
        wrapper.style.display = "inline-block";
        
        // Create edit overlay
        const overlay = document.createElement("div");
        overlay.className = "photo-edit-overlay";
        overlay.innerHTML = '<i class="fa-solid fa-camera"></i>';
        
        // Create hidden file input
        const fileInput = document.createElement("input");
        fileInput.type = "file";
        fileInput.accept = "image/*";
        
        // Wrap image and add overlay
        photoImg.parentNode.insertBefore(wrapper, photoImg);
        wrapper.appendChild(photoImg);
        wrapper.appendChild(overlay);
        wrapper.appendChild(fileInput);
        
        // Click overlay to trigger file input
        overlay.addEventListener("click", function(e) {
            e.stopPropagation();
            fileInput.click();
        });
        
        // Handle file selection
        fileInput.addEventListener("change", function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    photoImg.src = event.target.result;
                    
                    // Update last updated timestamp
                    const cells = row.querySelectorAll("td");
                    const now = new Date();
                    cells[12].textContent = now.toLocaleDateString("en-US", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric"
                    }) + " " + now.toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true
                    });
                };
                reader.readAsDataURL(file);
            }
        });
    }
});

// Filter dropdown functionality
const filterDropdown = document.getElementById("filterDropdown");
const filterToggle = document.getElementById("filterToggle");
const filterOptions = document.querySelectorAll("#filterOptions .dropdown-option");

if (filterToggle) {
    filterToggle.addEventListener("click", function(e) {
        e.stopPropagation();
        filterDropdown.classList.toggle("open");
        // Close sort dropdown if open
        if (sortDropdown) sortDropdown.classList.remove("open");
    });
}

filterOptions.forEach(option => {
    option.addEventListener("click", function() {
        filterOptions.forEach(opt => opt.classList.remove("selected"));
        this.classList.add("selected");
        filterDropdown.classList.remove("open");
        // Add filter logic here
        console.log("Filter by:", this.dataset.value);
    });
});

// Sort dropdown functionality
const sortDropdown = document.getElementById("sortDropdown");
const sortToggle = document.getElementById("sortToggle");
const sortOptions = document.querySelectorAll("#sortOptions .dropdown-option");

if (sortToggle) {
    sortToggle.addEventListener("click", function(e) {
        e.stopPropagation();
        sortDropdown.classList.toggle("open");
        // Close filter dropdown if open
        if (filterDropdown) filterDropdown.classList.remove("open");
    });
}

sortOptions.forEach(option => {
    option.addEventListener("click", function() {
        sortOptions.forEach(opt => opt.classList.remove("selected"));
        this.classList.add("selected");
        sortDropdown.classList.remove("open");
        // Add sort logic here
        console.log("Sort by:", this.dataset.value);
    });
});

// Close dropdowns when clicking outside
document.addEventListener("click", function(e) {
    if (filterDropdown && !filterDropdown.contains(e.target)) {
        filterDropdown.classList.remove("open");
    }
    if (sortDropdown && !sortDropdown.contains(e.target)) {
        sortDropdown.classList.remove("open");
    }
});

// Search functionality
const searchInput = document.querySelector(".search-filter-left .search-input");
const searchAllBtn = document.getElementById("searchAllBtn");

if (searchInput) {
    searchInput.addEventListener("input", function() {
        const searchTerm = this.value.toLowerCase();
        const rows = document.querySelectorAll(".idcard-table tbody tr");
        
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(searchTerm) ? "" : "none";
        });
    });
}

if (searchAllBtn) {
    searchAllBtn.addEventListener("click", function() {
        if (searchInput) {
            const searchTerm = searchInput.value.toLowerCase();
            const rows = document.querySelectorAll(".idcard-table tbody tr");
            
            rows.forEach(row => {
                const text = row.textContent.toLowerCase();
                row.style.display = text.includes(searchTerm) ? "" : "none";
            });
        }
    });
}

// Edit photo function - now opens the edit modal with row data
function editPhoto(button) {
    const row = button.closest('tr');
    if (!row) return;
    
    // Set the current edit row
    currentEditRow = row;
    const cells = row.querySelectorAll('td');
    
    // Populate form with current values
    document.getElementById("editStudentName").value = cells[2].textContent;
    document.getElementById("editFatherName").value = cells[3].textContent;
    document.getElementById("editMotherName").value = cells[4].textContent;
    document.getElementById("editEmail").value = cells[5].textContent;
    document.getElementById("editAddress").value = cells[6].textContent;
    document.getElementById("editSchoolName").value = cells[7].textContent;
    document.getElementById("editDOB").value = cells[8].textContent;
    document.getElementById("editBloodGroup").value = cells[9].textContent;
    document.getElementById("editMobile").value = cells[10].textContent;
    
    // Set photo preview
    const photoImg = cells[11].querySelector("img");
    if (photoImg) {
        document.getElementById("editPhotoPreview").src = photoImg.src;
    }
    
    // Show modal
    editModal.classList.add("active");
}

