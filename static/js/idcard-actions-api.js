// ID Card Actions - API Module
// Contains: Card status operations, bulk operations, row action handlers

// ==========================================
// SINGLE CARD STATUS OPERATIONS
// ==========================================

function verifyCard(cardId) {
    if (typeof apiCall === 'function') {
        apiCall(`/api/card/${cardId}/status/`, 'POST', { status: 'verified' })
            .then(data => {
                if (typeof showToast === 'function') showToast('Card verified successfully');
                location.reload();
            });
    }
}

function approveCard(cardId) {
    if (typeof apiCall === 'function') {
        apiCall(`/api/card/${cardId}/status/`, 'POST', { status: 'approved' })
            .then(data => {
                if (typeof showToast === 'function') showToast('Card approved successfully');
                location.reload();
            });
    }
}

function unapproveCard(cardId) {
    if (typeof apiCall === 'function') {
        apiCall(`/api/card/${cardId}/status/`, 'POST', { status: 'verified' })
            .then(data => {
                if (typeof showToast === 'function') showToast('Card moved back to verified');
                location.reload();
            });
    }
}

function unverifyCard(cardId) {
    if (typeof apiCall === 'function') {
        apiCall(`/api/card/${cardId}/status/`, 'POST', { status: 'pending' })
            .then(data => {
                if (typeof showToast === 'function') showToast('Card moved back to pending');
                location.reload();
            });
    }
}

function downloadCard(cardId) {
    if (typeof apiCall === 'function') {
        apiCall(`/api/card/${cardId}/status/`, 'POST', { status: 'download' })
            .then(data => {
                if (typeof showToast === 'function') showToast('Card moved to download list');
                location.reload();
            });
    }
}

function retrieveCard(cardId) {
    if (typeof apiCall === 'function') {
        apiCall(`/api/card/${cardId}/status/`, 'POST', { status: 'pending' })
            .then(data => {
                if (typeof showToast === 'function') showToast('Card retrieved to pending list');
                location.reload();
            });
    }
}

// Single card download (download the actual image/card)
function downloadSingleCard(cardId) {
    // Get the row to find image data
    const row = document.querySelector(`tr[data-card-id="${cardId}"]`);
    if (!row) {
        if (typeof showToast === 'function') showToast('Card not found', false);
        return;
    }
    
    // Find the image in the row
    const img = row.querySelector('.table-image');
    if (img && img.src) {
        // Create download link
        const link = document.createElement('a');
        link.href = img.src;
        link.download = `card_${cardId}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        if (typeof showToast === 'function') showToast('Card image downloaded');
    } else {
        if (typeof showToast === 'function') showToast('No image found for this card', false);
    }
}

// Move single card back to approved
function backToApprovedCard(cardId) {
    if (typeof apiCall === 'function') {
        apiCall(`/api/card/${cardId}/status/`, 'POST', { status: 'approved' })
            .then(data => {
                if (typeof showToast === 'function') showToast('Card moved back to approved');
                location.reload();
            });
    }
}

// ==========================================
// BULK STATUS OPERATIONS
// ==========================================

function bulkVerify(cardIds) {
    const tableId = typeof TABLE_ID !== 'undefined' ? TABLE_ID : (window.IDCardApp?.tableId || null);
    if (!tableId) {
        if (typeof showToast === 'function') showToast('Error: Table ID not found', false);
        return;
    }
    if (typeof apiCall === 'function') {
        apiCall(`/api/table/${tableId}/cards/bulk-status/`, 'POST', { card_ids: cardIds, status: 'verified' })
            .then(data => {
                if (typeof showToast === 'function') showToast(`${data.updated_count} card(s) verified`);
                location.reload();
            });
    }
}

function bulkApprove(cardIds) {
    const tableId = typeof TABLE_ID !== 'undefined' ? TABLE_ID : (window.IDCardApp?.tableId || null);
    if (!tableId) {
        if (typeof showToast === 'function') showToast('Error: Table ID not found', false);
        return;
    }
    if (typeof apiCall === 'function') {
        apiCall(`/api/table/${tableId}/cards/bulk-status/`, 'POST', { card_ids: cardIds, status: 'approved' })
            .then(data => {
                if (typeof showToast === 'function') showToast(`${data.updated_count} card(s) approved`);
                location.reload();
            });
    }
}

function bulkUnapprove(cardIds) {
    const tableId = typeof TABLE_ID !== 'undefined' ? TABLE_ID : (window.IDCardApp?.tableId || null);
    if (!tableId) {
        if (typeof showToast === 'function') showToast('Error: Table ID not found', false);
        return;
    }
    if (typeof apiCall === 'function') {
        apiCall(`/api/table/${tableId}/cards/bulk-status/`, 'POST', { card_ids: cardIds, status: 'verified' })
            .then(data => {
                if (typeof showToast === 'function') showToast(`${data.updated_count} card(s) moved to verified`);
                location.reload();
            });
    }
}

function bulkUnverify(cardIds) {
    const tableId = typeof TABLE_ID !== 'undefined' ? TABLE_ID : (window.IDCardApp?.tableId || null);
    if (!tableId) {
        if (typeof showToast === 'function') showToast('Error: Table ID not found', false);
        return;
    }
    if (typeof apiCall === 'function') {
        apiCall(`/api/table/${tableId}/cards/bulk-status/`, 'POST', { card_ids: cardIds, status: 'pending' })
            .then(data => {
                if (typeof showToast === 'function') showToast(`${data.updated_count} card(s) moved to pending`);
                location.reload();
            });
    }
}

function bulkDelete(cardIds) {
    const tableId = typeof TABLE_ID !== 'undefined' ? TABLE_ID : (window.IDCardApp?.tableId || null);
    if (!tableId) {
        if (typeof showToast === 'function') showToast('Error: Table ID not found', false);
        return;
    }
    // Move to pool instead of permanent delete
    if (typeof apiCall === 'function') {
        apiCall(`/api/table/${tableId}/cards/bulk-status/`, 'POST', { card_ids: cardIds, status: 'pool' })
            .then(data => {
                if (typeof showToast === 'function') showToast(`${data.updated_count} card(s) moved to pool`);
                location.reload();
            });
    }
}

function bulkRetrieve(cardIds) {
    const tableId = typeof TABLE_ID !== 'undefined' ? TABLE_ID : (window.IDCardApp?.tableId || null);
    if (!tableId) {
        if (typeof showToast === 'function') showToast('Error: Table ID not found', false);
        return;
    }
    if (typeof apiCall === 'function') {
        apiCall(`/api/table/${tableId}/cards/bulk-status/`, 'POST', { card_ids: cardIds, status: 'pending' })
            .then(data => {
                if (typeof showToast === 'function') showToast(`${data.updated_count} card(s) retrieved to pending`);
                location.reload();
            });
    }
}

function bulkDeletePermanent(cardIds) {
    const tableId = typeof TABLE_ID !== 'undefined' ? TABLE_ID : (window.IDCardApp?.tableId || null);
    if (!tableId) {
        if (typeof showToast === 'function') showToast('Error: Table ID not found', false);
        return;
    }
    
    window.pendingDeleteCardIds = cardIds;
    
    const deleteCountText = document.getElementById('deleteCountText');
    if (deleteCountText) {
        deleteCountText.textContent = `${cardIds.length} card(s)`;
    }
    
    const deleteModalOverlay = document.getElementById('deleteModalOverlay');
    if (deleteModalOverlay) {
        deleteModalOverlay.classList.add('active');
        document.body.style.overflow = 'hidden'; // Lock body scroll
    }
}

function createCard(fieldData) {
    const tableId = typeof TABLE_ID !== 'undefined' ? TABLE_ID : (window.IDCardApp?.tableId || null);
    if (!tableId) {
        if (typeof showToast === 'function') showToast('Error: Table ID not found', false);
        return;
    }
    
    if (typeof apiCall === 'function') {
        apiCall(`/api/tables/${tableId}/cards/`, 'POST', { field_data: fieldData })
            .then(data => {
                if (typeof showToast === 'function') showToast('Card created successfully');
                location.reload();
            });
    }
}

// ==========================================
// ROW ACTION BUTTON HANDLERS
// ==========================================

function initRowActionHandlers() {
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
    
    // Unverify row button
    document.querySelectorAll('.unverify-row-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const cardId = this.getAttribute('data-card-id');
            unverifyCard(cardId);
        });
    });
    
    // Download row button
    document.querySelectorAll('.download-row-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const cardId = this.getAttribute('data-card-id');
            downloadCard(cardId);
        });
    });
    
    // Retrieve row button
    document.querySelectorAll('.retrieve-row-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const cardId = this.getAttribute('data-card-id');
            retrieveCard(cardId);
        });
    });
    
    // Download single row button (for Download list - downloads single card image)
    document.querySelectorAll('.download-single-row-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const cardId = this.getAttribute('data-card-id');
            downloadSingleCard(cardId);
        });
    });
}

// ==========================================
// BULK DOWNLOAD (Move to download status)
// ==========================================

function bulkDownload(cardIds) {
    const tableId = typeof TABLE_ID !== 'undefined' ? TABLE_ID : (window.IDCardApp?.tableId || null);
    if (!tableId) {
        if (typeof showToast === 'function') showToast('Error: Table ID not found', false);
        return;
    }
    
    const csrfToken = typeof getCSRFToken === 'function' ? getCSRFToken() : '';
    
    fetch(`/api/table/${tableId}/cards/bulk-status/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken,
        },
        body: JSON.stringify({
            card_ids: cardIds,
            status: 'download'
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            if (typeof showToast === 'function') showToast(`${data.updated_count} card(s) moved to download list`);
            window.location.href = `?status=download`;
        } else {
            if (typeof showToast === 'function') showToast(data.message || 'Error updating cards', false);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        if (typeof showToast === 'function') showToast('Error moving to download', false);
    });
}

// ==========================================
// BULK BACK TO APPROVED (Move from download back to approved)
// ==========================================

function bulkBackToApproved(cardIds) {
    const tableId = typeof TABLE_ID !== 'undefined' ? TABLE_ID : (window.IDCardApp?.tableId || null);
    if (!tableId) {
        if (typeof showToast === 'function') showToast('Error: Table ID not found', false);
        return;
    }
    
    const csrfToken = typeof getCSRFToken === 'function' ? getCSRFToken() : '';
    
    fetch(`/api/table/${tableId}/cards/bulk-status/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken,
        },
        body: JSON.stringify({
            card_ids: cardIds,
            status: 'approved'
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            if (typeof showToast === 'function') showToast(`${data.updated_count} card(s) moved back to approved`);
            window.location.href = `?status=approved`;
        } else {
            if (typeof showToast === 'function') showToast(data.message || 'Error updating cards', false);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        if (typeof showToast === 'function') showToast('Error moving to approved', false);
    });
}

// ==========================================
// BULK ACTION BUTTON HANDLERS
// ==========================================

function initBulkActionHandlers() {
    // Verify Selected button
    document.getElementById('verifyBtn')?.addEventListener('click', function() {
        const selectedIds = typeof getSelectedCardIds === 'function' ? getSelectedCardIds() : [];
        if (selectedIds.length > 0) {
            bulkVerify(selectedIds);
        }
    });
    
    // Delete button (moves to Pool)
    document.getElementById('deleteBtn')?.addEventListener('click', function() {
        const selectedIds = typeof getSelectedCardIds === 'function' ? getSelectedCardIds() : [];
        if (selectedIds.length > 0) {
            bulkDelete(selectedIds);
        }
    });
    
    // Delete button in Verified list
    document.getElementById('deleteBtnV')?.addEventListener('click', function() {
        const selectedIds = typeof getSelectedCardIds === 'function' ? getSelectedCardIds() : [];
        if (selectedIds.length > 0) {
            bulkDelete(selectedIds);
        }
    });
    
    // Approve Selected button
    document.getElementById('approveBtn')?.addEventListener('click', function() {
        const selectedIds = typeof getSelectedCardIds === 'function' ? getSelectedCardIds() : [];
        if (selectedIds.length > 0) {
            bulkApprove(selectedIds);
        }
    });
    
    // Unapproved Selected button
    document.getElementById('unapprovedBtn')?.addEventListener('click', function() {
        const selectedIds = typeof getSelectedCardIds === 'function' ? getSelectedCardIds() : [];
        if (selectedIds.length > 0) {
            bulkUnapprove(selectedIds);
        }
    });
    
    // Unverified Selected button
    document.getElementById('unverifyBtn')?.addEventListener('click', function() {
        const selectedIds = typeof getSelectedCardIds === 'function' ? getSelectedCardIds() : [];
        if (selectedIds.length > 0) {
            bulkUnverify(selectedIds);
        }
    });
    
    // Retrieve buttons
    const retrieveBtnIds = ['retrieveBtn', 'retrieveBtnP', 'retrieveBtnA', 'retrieveBtnD'];
    retrieveBtnIds.forEach(btnId => {
        document.getElementById(btnId)?.addEventListener('click', function() {
            const selectedIds = typeof getSelectedCardIds === 'function' ? getSelectedCardIds() : [];
            if (selectedIds.length > 0) {
                bulkRetrieve(selectedIds);
            }
        });
    });
    
    // Delete Permanent button (Pool list only)
    document.getElementById('deletePermanentBtnP')?.addEventListener('click', function() {
        const selectedIds = typeof getSelectedCardIds === 'function' ? getSelectedCardIds() : [];
        if (selectedIds.length > 0) {
            bulkDeletePermanent(selectedIds);
        }
    });
    
    // Download Card button (move to download status from Approved)
    document.getElementById('downloadCardBtn')?.addEventListener('click', function() {
        const selectedIds = typeof getSelectedCardIds === 'function' ? getSelectedCardIds() : [];
        if (selectedIds.length > 0) {
            bulkDownload(selectedIds);
        }
    });
    
    // Back to Approved button (move from download back to approved)
    document.getElementById('unapprovedBtnD')?.addEventListener('click', function() {
        const selectedIds = typeof getSelectedCardIds === 'function' ? getSelectedCardIds() : [];
        if (selectedIds.length > 0) {
            bulkBackToApproved(selectedIds);
        }
    });
}

// ==========================================
// INITIALIZATION
// ==========================================

function initApiModule() {
    initRowActionHandlers();
    initBulkActionHandlers();
}

// Expose globally
window.verifyCard = verifyCard;
window.approveCard = approveCard;
window.unapproveCard = unapproveCard;
window.unverifyCard = unverifyCard;
window.downloadCard = downloadCard;
window.retrieveCard = retrieveCard;
window.downloadSingleCard = downloadSingleCard;
window.backToApprovedCard = backToApprovedCard;
window.bulkVerify = bulkVerify;
window.bulkApprove = bulkApprove;
window.bulkUnapprove = bulkUnapprove;
window.bulkUnverify = bulkUnverify;
window.bulkDelete = bulkDelete;
window.bulkRetrieve = bulkRetrieve;
window.bulkDeletePermanent = bulkDeletePermanent;
window.bulkDownload = bulkDownload;
window.bulkBackToApproved = bulkBackToApproved;
window.createCard = createCard;

window.IDCardApp = window.IDCardApp || {};
window.IDCardApp.initApiModule = initApiModule;
window.IDCardApp.verifyCard = verifyCard;
window.IDCardApp.approveCard = approveCard;
window.IDCardApp.bulkVerify = bulkVerify;
window.IDCardApp.bulkDelete = bulkDelete;

console.log('IDCard Actions API module loaded');
