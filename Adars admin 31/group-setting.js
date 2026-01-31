// Set active sidebar link based on current page
(function() {
    const allClientsLink = document.getElementById('allClientsLink');
    const activeClientsLink = document.getElementById('activeClientsLink');
    
    // On group-setting page, Active Clients should be active
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

// Get client name from URL parameter
const urlParams = new URLSearchParams(window.location.search);
const clientName = urlParams.get('client');
if (clientName) {
    document.getElementById('clientName').textContent = clientName;
}

// Filter dropdown logic
const filterDropdown = document.getElementById('filterDropdown');
const filterDropdownBtn = document.getElementById('filterDropdownBtn');
const filterOptions = document.getElementById('filterOptions');
const selectedFilter = document.getElementById('selectedFilter');

if (filterDropdownBtn && filterDropdown) {
    filterDropdownBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        filterDropdown.classList.toggle('open');
    });

    filterOptions.querySelectorAll('.dropdown-option').forEach(option => {
        option.addEventListener('click', function(e) {
            selectedFilter.textContent = this.textContent;
            filterDropdown.classList.remove('open');
        });
    });

    document.addEventListener('click', function(e) {
        if (!filterDropdown.contains(e.target)) {
            filterDropdown.classList.remove('open');
        }
    });
}

// Table row selection
const tableRows = document.querySelectorAll("tbody tr");
let selectedRow = null;

const toggleStatusBtn = document.getElementById("toggle-status-btn");
const addBtn = document.getElementById('addBtn');
const editBtn = document.getElementById('editBtn');
const viewBtn = document.getElementById('viewBtn');

function updateActionButtons() {
    if (!selectedRow) {
        if (addBtn) addBtn.disabled = false;
        if (editBtn) editBtn.disabled = true;
        if (viewBtn) viewBtn.disabled = true;
        if (toggleStatusBtn) {
            toggleStatusBtn.disabled = true;
            toggleStatusBtn.innerHTML = '<i class="fa-solid fa-toggle-on"></i> Active';
        }
    } else {
        if (addBtn) addBtn.disabled = true;
        if (editBtn) editBtn.disabled = false;
        if (viewBtn) viewBtn.disabled = false;
        const statusCell = selectedRow.querySelector("td:nth-child(2) .status-badge");
        if (statusCell && statusCell.textContent.trim() === "Active") {
            if (toggleStatusBtn) {
                toggleStatusBtn.disabled = false;
                toggleStatusBtn.innerHTML = '<i class="fa-solid fa-toggle-off"></i> Inactive';
            }
        } else {
            if (toggleStatusBtn) {
                toggleStatusBtn.disabled = false;
                toggleStatusBtn.innerHTML = '<i class="fa-solid fa-toggle-on"></i> Active';
            }
        }
    }
}

tableRows.forEach(row => {
    row.addEventListener("click", function(e) {
        if (this.classList.contains("selected")) {
            this.classList.remove("selected");
            selectedRow = null;
        } else {
            if (selectedRow) {
                selectedRow.classList.remove("selected");
            }
            this.classList.add("selected");
            selectedRow = this;
        }
        updateActionButtons();
    });
});

// Modal and Toast logic
const statusModal = document.getElementById('status-modal');
const modalClose = document.getElementById('modal-close');
const modalConfirm = document.getElementById('modal-confirm');
const modalCancel = document.getElementById('modal-cancel');
const modalMessage = document.getElementById('modal-message');
const toast = document.getElementById('toast');

let pendingStatusChange = null;

function showModal(message, onConfirm) {
    if (modalMessage) modalMessage.textContent = message;
    if (statusModal) statusModal.classList.add('show');
    pendingStatusChange = onConfirm;
}

function hideModal() {
    if (statusModal) statusModal.classList.remove('show');
    pendingStatusChange = null;
}

function showToast(message) {
    if (toast) {
        toast.textContent = message;
        toast.style.display = 'block';
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
            toast.style.display = 'none';
        }, 2000);
    }
}

if (modalClose) modalClose.onclick = hideModal;
if (modalCancel) modalCancel.onclick = hideModal;
if (modalConfirm) {
    modalConfirm.onclick = function() {
        if (pendingStatusChange) pendingStatusChange();
        hideModal();
    };
}

// Toggle status button click logic
if (toggleStatusBtn) {
    toggleStatusBtn.addEventListener("click", function() {
        if (!selectedRow) return;
        const statusCell = selectedRow.querySelector("td:nth-child(2) .status-badge");
        if (!statusCell) return;
        const isActive = statusCell.textContent.trim() === "Active";
        showModal(
            `Are you sure you want to set this as ${isActive ? 'Inactive' : 'Active'}?`,
            function() {
                if (isActive) {
                    statusCell.textContent = "Inactive";
                    statusCell.classList.remove("verified");
                    statusCell.classList.add("pending");
                    showToast("Status changed to Inactive");
                } else {
                    statusCell.textContent = "Active";
                    statusCell.classList.remove("pending");
                    statusCell.classList.add("verified");
                    showToast("Status changed to Active");
                }
                updateActionButtons();
            }
        );
    });
}

// Initialize button state
updateActionButtons();

// Drawer modal logic for Add button
const addDrawer = document.getElementById('add-drawer');
const closeDrawer = document.getElementById('closeDrawer');
const fieldList = document.getElementById('field-list');

// Default required fields
const defaultFields = [
    { key: 'photo', label: 'Photo (required)', required: true },
    { key: 'name', label: 'Name (required)', required: true }
];
let currentFields = [...defaultFields];

// Supported field types
const fieldTypes = [
    { value: 'text', label: 'Text' },
    { value: 'number', label: 'Number' },
    { value: 'date', label: 'Date' },
    { value: 'email', label: 'Email' },
    { value: 'photo', label: 'Photo' }
];

const addFieldDropdown = document.getElementById('add-field-dropdown');
const addFieldBtn = document.getElementById('add-field-btn');

function renderFieldList() {
    if (!fieldList) return;
    fieldList.innerHTML = '';
    currentFields.forEach((field, idx) => {
        const li = document.createElement('li');
        li.className = 'field-list-item';
        li.setAttribute('draggable', !field.required);
        li.dataset.idx = idx;
        li.innerHTML = `
            <span class="field-drag" title="Drag to reorder"><i class="fa-solid fa-grip-vertical"></i></span>
            <span class="field-name">${field.label}</span>
            <span class="field-type-cell">
                <select class="field-type-select" data-idx="${idx}" ${field.required ? 'disabled' : ''}>
                    ${fieldTypes.map(t => `<option value="${t.value}"${(field.type||'text')===t.value?' selected':''}>${t.label}</option>`).join('')}
                </select>
            </span>
            ${field.required ? '<span class="field-required">Required</span>' : `<span class="field-action"><button class="remove-field-btn" data-idx="${idx}"><i class="fa-solid fa-xmark"></i></button></span>`}
        `;
        fieldList.appendChild(li);
    });
}

if (addBtn && addDrawer) {
    addBtn.addEventListener('click', function() {
        addDrawer.classList.add('open');
        document.body.style.overflow = 'hidden';
        renderFieldList();
    });
}

if (closeDrawer && addDrawer) {
    closeDrawer.addEventListener('click', function() {
        addDrawer.classList.remove('open');
        document.body.style.overflow = '';
    });
}

// Close drawer when clicking overlay
if (addDrawer) {
    addDrawer.addEventListener('click', function(e) {
        if (e.target === addDrawer) {
            addDrawer.classList.remove('open');
            document.body.style.overflow = '';
        }
    });
}

if (fieldList) {
    fieldList.addEventListener('click', function(e) {
        if (e.target.closest('.remove-field-btn')) {
            const idx = parseInt(e.target.closest('.remove-field-btn').dataset.idx);
            currentFields.splice(idx, 1);
            renderFieldList();
        }
    });
}

if (addFieldBtn && addFieldDropdown) {
    addFieldBtn.addEventListener('click', function() {
        let key = addFieldDropdown.value;
        let label = addFieldDropdown.options[addFieldDropdown.selectedIndex].text;
        if (key === 'custom') {
            const custom = prompt('Enter custom field name:');
            if (!custom) return;
            key = 'custom_' + Date.now();
            label = custom;
        }
        // Prevent duplicate fields (except custom)
        if (currentFields.some(f => f.label === label)) {
            showToast('Field already added!');
            return;
        }
        currentFields.push({ key, label, required: false });
        renderFieldList();
    });
}

// Drag and drop logic
let dragIdx = null;

if (fieldList) {
    fieldList.addEventListener('dragstart', function(e) {
        dragIdx = +e.target.dataset.idx;
        e.dataTransfer.effectAllowed = 'move';
    });

    fieldList.addEventListener('dragover', function(e) {
        e.preventDefault();
        const over = e.target.closest('.field-list-item');
        if (!over || over.dataset.idx == dragIdx) return;
        over.style.borderTop = '2px solid #764ba2';
    });

    fieldList.addEventListener('dragleave', function(e) {
        const over = e.target.closest('.field-list-item');
        if (over) over.style.borderTop = '';
    });

    fieldList.addEventListener('drop', function(e) {
        e.preventDefault();
        const over = e.target.closest('.field-list-item');
        if (!over || over.dataset.idx == dragIdx) return;
        over.style.borderTop = '';
        const toIdx = +over.dataset.idx;
        const moved = currentFields.splice(dragIdx, 1)[0];
        currentFields.splice(toIdx, 0, moved);
        renderFieldList();
    });

    fieldList.addEventListener('dragend', function() {
        dragIdx = null;
        [...fieldList.children].forEach(li => li.style.borderTop = '');
    });

    // Type change logic
    fieldList.addEventListener('change', function(e) {
        if (e.target.classList.contains('field-type-select')) {
            const idx = +e.target.dataset.idx;
            currentFields[idx].type = e.target.value;
        }
    });
}

// Switch to ID Card Group page with same client
const switchToIdCardGroupBtn = document.getElementById('switchToIdCardGroup');
if (switchToIdCardGroupBtn) {
    switchToIdCardGroupBtn.addEventListener('click', function(e) {
        e.preventDefault();
        const urlParams = new URLSearchParams(window.location.search);
        const client = urlParams.get('client');
        if (client) {
            window.location.href = `idcard-group.html?client=${encodeURIComponent(client)}`;
        } else {
            window.location.href = 'idcard-group.html';
        }
    });
}
