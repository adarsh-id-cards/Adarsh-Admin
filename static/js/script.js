// Set active sidebar link based on current page
(function() {
    const pathname = window.location.pathname;
    const allClientsLink = document.getElementById('allClientsLink');
    const activeClientsLink = document.getElementById('activeClientsLink');
    
    // Remove any existing active classes first
    if (allClientsLink) allClientsLink.classList.remove('active');
    if (activeClientsLink) activeClientsLink.classList.remove('active');
    
    // Set active based on current page (using Django URL patterns)
    if (pathname.includes('active-clients') || pathname.includes('/client/') || pathname.includes('/group/')) {
        if (activeClientsLink) activeClientsLink.classList.add('active');
    } else if (pathname.includes('manage-clients')) {
        if (allClientsLink) allClientsLink.classList.add('active');
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
    // Check localStorage for saved state
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


const groupSettingBtn = document.getElementById("groupSettingBtn");
const idCardBtn = document.getElementById("idCardBtn");
const tableRows = document.querySelectorAll("tbody tr");

let selectedRow = null;

// Function to update button states for group/idcard page (renamed to avoid conflict)
function updateGroupButtonStates() {
    const hasSelection = selectedRow !== null;
    if (groupSettingBtn) groupSettingBtn.disabled = !hasSelection;
    if (idCardBtn) idCardBtn.disabled = !hasSelection;
}

// Click to select/deselect row (only if tableRows exist)
if (tableRows && tableRows.length > 0) {
  tableRows.forEach(row => {
    row.addEventListener("click", function(e) {
        if (this.classList.contains("selected")) {
            // Deselect if already selected
            this.classList.remove("selected");
            selectedRow = null;
        } else {
            // Deselect previous row
            if (selectedRow) {
                selectedRow.classList.remove("selected");
            }
            // Select this row
            this.classList.add("selected");
            selectedRow = this;
        }
        updateGroupButtonStates();
    });
  });
}

// Navigate to Group Setting page - This is legacy code, navigation now handled in template inline scripts
// Using Django URL pattern

// Navigate to ID Card Group page - This is legacy code
// Using Django URL pattern

// Filter and Search functionality
const customDropdown = document.getElementById("filterDropdown");
const dropdownToggle = document.getElementById("dropdownToggle");
const dropdownOptions = document.querySelectorAll(".dropdown-option");
const selectedText = document.getElementById("selectedText");
const searchInput = document.getElementById("searchInput");

let currentFilterValue = "all";

// Toggle dropdown open/close - only if elements exist and not on group-setting page
if (dropdownToggle && customDropdown && !document.querySelector('.group-setting-page')) {
    dropdownToggle.addEventListener("click", function(e) {
        e.stopPropagation();
        customDropdown.classList.toggle("open");
    });

    // Close dropdown when clicking outside
    document.addEventListener("click", function() {
        if (customDropdown) customDropdown.classList.remove("open");
    });

    // Handle option selection
    dropdownOptions.forEach(option => {
        option.addEventListener("click", function() {
            // Update selected state
            dropdownOptions.forEach(opt => opt.classList.remove("selected"));
            this.classList.add("selected");
            
            // Update toggle text and value
            const value = this.dataset.value;
            const text = this.textContent;
            if (selectedText) selectedText.textContent = text;
            currentFilterValue = value;
            
            // Update placeholder
            const placeholders = {
                "all": "Search All...",
                "name": "Search in Names...",
                "email": "Search in Emails...",
                "phone": "Search in Phone Numbers...",
                "status": "Search by Status..."
            };
            if (searchInput) searchInput.placeholder = placeholders[value] || "Search...";
            
            // Close dropdown and re-run search
            if (customDropdown) customDropdown.classList.remove("open");
            performSearch();
        });
    });

    // Search functionality
    if (searchInput) searchInput.addEventListener("input", performSearch);
}

function performSearch() {
    if (!searchInput || !tableRows || tableRows.length === 0) return;
    
    const searchTerm = searchInput.value.toLowerCase();
    const filterValue = currentFilterValue;

    tableRows.forEach(row => {
        if (!row.cells || row.cells.length < 3) return;
        
        const name = row.cells[0].textContent.toLowerCase();
        const email = row.cells[1] ? row.cells[1].textContent.toLowerCase() : '';
        const phone = row.cells[2] ? row.cells[2].textContent.toLowerCase() : '';

        let matches = false;

        if (filterValue === "all") {
            matches = name.includes(searchTerm) || email.includes(searchTerm) || phone.includes(searchTerm);
        } else if (filterValue === "name") {
            matches = name.includes(searchTerm);
        } else if (filterValue === "email") {
            matches = email.includes(searchTerm);
        } else if (filterValue === "phone") {
            matches = phone.includes(searchTerm);
        } else {
            matches = name.includes(searchTerm);
        }

        row.style.display = matches ? "" : "none";
    });
}

// ==========================================
// GLOBAL KEYBOARD SHORTCUT: X TO CLOSE MODALS
// ==========================================
document.addEventListener('keydown', function(e) {
    // Only respond to 'X' key (not Ctrl+X, Alt+X etc.)
    if (!e.key || typeof e.key !== 'string' || e.key.toLowerCase() !== 'x' || e.ctrlKey || e.altKey || e.metaKey) return;
    
    // Don't trigger if typing in input/textarea
    const activeElement = document.activeElement;
    if (activeElement && (
        activeElement.tagName === 'INPUT' || 
        activeElement.tagName === 'TEXTAREA' || 
        activeElement.isContentEditable
    )) return;
    
    let closed = false;
    
    // Try to close side modal (ID Card Actions page)
    const sideModalOverlay = document.getElementById('sideModalOverlay');
    if (sideModalOverlay && sideModalOverlay.classList.contains('active')) {
        sideModalOverlay.classList.remove('active');
        closed = true;
    }
    
    // Try to close staff drawer
    const staffDrawer = document.getElementById('staff-drawer');
    const staffDrawerOverlay = document.getElementById('staff-drawer-overlay');
    if (staffDrawer && staffDrawer.classList.contains('open')) {
        staffDrawer.classList.remove('open');
        if (staffDrawerOverlay) staffDrawerOverlay.classList.remove('active');
        closed = true;
    }
    
    // Try to close client drawer
    const clientDrawer = document.getElementById('client-drawer');
    const clientDrawerOverlay = document.getElementById('client-drawer-overlay');
    if (clientDrawer && clientDrawer.classList.contains('open')) {
        clientDrawer.classList.remove('open');
        if (clientDrawerOverlay) clientDrawerOverlay.classList.remove('active');
        closed = true;
    }
    
    // Try to close upload modal
    const uploadModalOverlay = document.getElementById('uploadModalOverlay');
    if (uploadModalOverlay && uploadModalOverlay.classList.contains('active')) {
        uploadModalOverlay.classList.remove('active');
        closed = true;
    }
    
    // Try to close delete modal
    const deleteModalOverlay = document.getElementById('deleteModalOverlay');
    if (deleteModalOverlay && deleteModalOverlay.classList.contains('active')) {
        deleteModalOverlay.classList.remove('active');
        closed = true;
    }
    
    // Try to close image sort modal
    const imageSortModalOverlay = document.getElementById('imageSortModalOverlay');
    if (imageSortModalOverlay && imageSortModalOverlay.classList.contains('active')) {
        imageSortModalOverlay.classList.remove('active');
        closed = true;
    }
    
    // Prevent default if we closed something
    if (closed) {
        e.preventDefault();
    }
});
