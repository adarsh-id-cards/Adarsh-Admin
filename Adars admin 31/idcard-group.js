// Set active sidebar link based on current page
(function() {
    const allClientsLink = document.getElementById('allClientsLink');
    const activeClientsLink = document.getElementById('activeClientsLink');
    
    // On idcard-group page, Active Clients should be active
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

// Get client name and ID card title from URL parameters
const urlParams = new URLSearchParams(window.location.search);
const clientName = urlParams.get('client');
const idCardTitle = urlParams.get('idcard');

if (clientName) {
    document.getElementById('clientName').textContent = clientName;
    // Update the href for the client breadcrumb link
    document.getElementById('clientName').href = `group-setting.html?client=${encodeURIComponent(clientName)}`;
}

if (idCardTitle) {
    document.getElementById('idCardTitle').textContent = idCardTitle;
}

// Table row selection
const tableRows = document.querySelectorAll("tbody tr");
let selectedRow = null;

tableRows.forEach(row => {
    row.addEventListener("click", function(e) {
        // Don't select row if clicking on a button
        if (e.target.closest('.list-btn') || e.target.closest('.bulk-btn')) {
            return;
        }
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
    });

    // Make cells editable on double click (except action/bulk columns)
    row.querySelectorAll('td:not(.action-cell):not(.bulk-action-cell)').forEach(cell => {
        cell.addEventListener('dblclick', function(e) {
            if (cell.querySelector('input')) return;
            const oldValue = cell.textContent.trim();
            const input = document.createElement('input');
            input.type = 'text';
            input.value = oldValue;
            input.style.fontSize = '12px';
            input.style.border = '1px solid #bbb';
            input.style.padding = '2px 4px';
            input.style.width = '90%';
            input.style.boxSizing = 'border-box';
            input.style.background = '#fff';
            input.style.borderRadius = '3px';
            input.style.outline = 'none';
            input.addEventListener('blur', finishEdit);
            input.addEventListener('keydown', function(ev) {
                if (ev.key === 'Enter') {
                    input.blur();
                } else if (ev.key === 'Escape') {
                    input.value = oldValue;
                    input.blur();
                }
            });
            cell.textContent = '';
            cell.appendChild(input);
            input.focus();
            input.select();

            function finishEdit() {
                cell.textContent = input.value.trim();
            }
        });
    });
});

// List button click handlers - Navigate to ID Card Actions page
document.querySelectorAll('.list-btn').forEach(btn => {
    btn.addEventListener('click', function(e) {
        e.stopPropagation();
        const row = this.closest('tr');
        const groupName = row.querySelector('td:first-child').textContent;
        const count = this.querySelector('.count-badge').textContent;
        
        // Get all counts from the same row
        const pendingCount = row.querySelector('.pending-btn .count-badge')?.textContent || '0';
        const verifiedCount = row.querySelector('.verified-btn .count-badge')?.textContent || '0';
        const poolCount = row.querySelector('.pool-btn .count-badge')?.textContent || '0';
        const approvedCount = row.querySelector('.approved-btn .count-badge')?.textContent || '0';
        const downloadCount = row.querySelector('.download-btn .count-badge')?.textContent || '0';
        
        // Determine action type from button class
        let actionType = 'pending';
        if (this.classList.contains('pending-btn')) actionType = 'pending';
        else if (this.classList.contains('verified-btn')) actionType = 'verified';
        else if (this.classList.contains('pool-btn')) actionType = 'pool';
        else if (this.classList.contains('approved-btn')) actionType = 'approved';
        else if (this.classList.contains('download-btn')) actionType = 'download';
        
        // Navigate to ID Card Actions page with parameters including all counts
        const params = new URLSearchParams({
            client: clientName || '',
            group: groupName,
            action: actionType,
            count: count,
            pendingCount: pendingCount,
            verifiedCount: verifiedCount,
            poolCount: poolCount,
            approvedCount: approvedCount,
            downloadCount: downloadCount
        });
        window.location.href = `idcard-actions.html?${params.toString()}`;
    });
});

// Bulk action button click handlers
document.querySelectorAll('.bulk-btn').forEach(btn => {
    btn.addEventListener('click', function(e) {
        e.stopPropagation();
        const row = this.closest('tr');
        const name = row.querySelector('td:first-child').textContent;
        const action = this.textContent.trim();
        
        console.log(`Bulk action "${action}" clicked for ${name}`);
        // Add your bulk action logic here
    });
});

// Function to update count badges dynamically
function updateCountBadge(row, buttonClass, newCount) {
    const badge = row.querySelector(`.${buttonClass} .count-badge`);
    if (badge) {
        badge.textContent = newCount;
    }
}

// Example: Simulate real-time updates (for demonstration)
// Uncomment below to see dynamic updates
/*
setInterval(() => {
    const rows = document.querySelectorAll('tbody tr');
    rows.forEach(row => {
        const pendingBadge = row.querySelector('.pending-btn .count-badge');
        if (pendingBadge) {
            const currentCount = parseInt(pendingBadge.textContent);
            pendingBadge.textContent = Math.max(0, currentCount + (Math.random() > 0.5 ? 1 : -1));
        }
    });
}, 5000);
*/

// Switch to Group Setting page with same client
const switchToGroupSettingBtn = document.getElementById('switchToGroupSetting');
if (switchToGroupSettingBtn) {
    switchToGroupSettingBtn.addEventListener('click', function(e) {
        e.preventDefault();
        const urlParams = new URLSearchParams(window.location.search);
        const client = urlParams.get('client');
        if (client) {
            window.location.href = `group-setting.html?client=${encodeURIComponent(client)}`;
        } else {
            window.location.href = 'group-setting.html';
        }
    });
}
