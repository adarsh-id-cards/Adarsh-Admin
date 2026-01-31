// Filter dropdown logic
const filterDropdown = document.getElementById('filterDropdown');
const filterDropdownBtn = document.getElementById('filterDropdownBtn');
const filterOptions = document.getElementById('filterOptions');
const selectedFilter = document.getElementById('selectedFilter');

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

// Get client name from URL parameter
const urlParams = new URLSearchParams(window.location.search);
const clientName = urlParams.get('client');
if (clientName) {
    document.getElementById('clientName').textContent = clientName;
}

// Table row selection
const tableRows = document.querySelectorAll("tbody tr");
let selectedRow = null;

const toggleStatusBtn = document.getElementById("toggle-status-btn");
const actionBtns = document.querySelectorAll('.action-buttons-group .btn.action-btn');
const addBtnMain = actionBtns[0];
const editBtn = actionBtns[1];
const viewBtn = actionBtns[2];

function updateActionButtons() {
  if (!selectedRow) {
    addBtnMain.disabled = false;
    editBtn.disabled = true;
    viewBtn.disabled = true;
    toggleStatusBtn.disabled = true;
    toggleStatusBtn.innerHTML = '<i class="fa-solid fa-toggle-on"></i> Active';
  } else {
    addBtnMain.disabled = true;
    editBtn.disabled = false;
    viewBtn.disabled = false;
    const statusCell = selectedRow.querySelector("td:nth-child(2) .status-badge");
    if (statusCell && statusCell.textContent.trim() === "Active") {
      toggleStatusBtn.disabled = false;
      toggleStatusBtn.innerHTML = '<i class="fa-solid fa-toggle-off"></i> Inactive';
    } else {
      toggleStatusBtn.disabled = false;
      toggleStatusBtn.innerHTML = '<i class="fa-solid fa-toggle-on"></i> Active';
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

// Update toggleStatusBtn click logic to use modal
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
            updateToggleStatusBtn();
        }
    );
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
    modalMessage.textContent = message;
    statusModal.classList.add('show');
    pendingStatusChange = onConfirm;
}

function hideModal() {
    statusModal.classList.remove('show');
    pendingStatusChange = null;
}

function showToast(message) {
    toast.textContent = message;
    toast.style.display = 'block';
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
        toast.style.display = 'none';
    }, 2000);
}

modalClose.onclick = hideModal;
modalCancel.onclick = hideModal;
modalConfirm.onclick = function() {
    if (pendingStatusChange) pendingStatusChange();
    hideModal();
};

// Initialize button state
updateActionButtons();

// Drawer modal logic for Add button
const addDrawer = document.getElementById('add-drawer');
const closeDrawer = document.getElementById('closeDrawer');
const addBtn = document.querySelector('.action-buttons-group .btn.action-btn');
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
  fieldList.innerHTML = '';
  currentFields.forEach((field, idx) => {
    const li = document.createElement('li');
    li.className = 'field-list-item';
    li.setAttribute('draggable', !field.required);
    li.dataset.idx = idx;
    li.innerHTML = `
      <span class="field-drag" title="Drag to reorder"><i class="fa-solid fa-grip-vertical"></i></span>
      <span>${field.label}</span>
      <select class="field-type-select" data-idx="${idx}" ${field.required ? 'disabled' : ''}>
        ${fieldTypes.map(t => `<option value="${t.value}"${(field.type||'text')===t.value?' selected':''}>${t.label}</option>`).join('')}
      </select>
      ${field.required ? '<span class="field-required">Required</span>' : `<button class="remove-field-btn" data-idx="${idx}"><i class="fa-solid fa-xmark"></i></button>`}
    `;
    fieldList.appendChild(li);
  });
}

addBtn.addEventListener('click', function() {
  addDrawer.classList.add('open');
  document.body.classList.add('drawer-open');
  document.body.style.overflow = 'hidden';
  renderFieldList();
});

closeDrawer.addEventListener('click', function() {
  addDrawer.classList.remove('open');
  document.body.classList.remove('drawer-open');
  document.body.style.overflow = '';
});

// Close drawer when clicking overlay (not just close button)
addDrawer.addEventListener('click', function(e) {
  if (e.target === addDrawer) {
    addDrawer.classList.remove('open');
    document.body.classList.remove('drawer-open');
    document.body.style.overflow = '';
  }
});

fieldList.addEventListener('click', function(e) {
  if (e.target.closest('.remove-field-btn')) {
    const idx = parseInt(e.target.closest('.remove-field-btn').dataset.idx);
    currentFields.splice(idx, 1);
    renderFieldList();
  }
});

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
    alert('Field already added.');
    return;
  }
  currentFields.push({ key, label, required: false });
  renderFieldList();
});

// Drag and drop logic
let dragIdx = null;
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
