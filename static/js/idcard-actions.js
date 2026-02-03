// ID Card Actions - Main Entry Point
// This file orchestrates all module initializations
// 
// Module load order in HTML should be:
// 1. idcard-actions-core.js    - Core utilities, CSRF, toast, sidebar
// 2. idcard-actions-table.js   - Table rendering, pagination, lazy loading
// 3. idcard-actions-search.js  - Search, filter, sort functionality
// 4. idcard-actions-upload.js  - XLSX/ZIP upload functionality
// 5. idcard-actions-download.js - Download images, DOCX, XLSX
// 6. idcard-actions-modal.js   - Side modal, delete modal
// 7. idcard-actions-api.js     - API calls, bulk operations
// 8. idcard-actions-edit.js    - Inline cell editing
// 9. idcard-actions.js         - This file (main initialization)

(function() {
    'use strict';
    
    // ==========================================
    // MODULE VERIFICATION
    // ==========================================
    
    function verifyModulesLoaded() {
        const requiredModules = [
            'initCoreModule',
            'initTableModule', 
            'initSearchModule',
            'initUploadModule',
            'initDownloadModule',
            'initModalModule',
            'initApiModule',
            'initEditModule'
        ];
        
        const missingModules = [];
        
        requiredModules.forEach(moduleName => {
            if (!window.IDCardApp || typeof window.IDCardApp[moduleName] !== 'function') {
                missingModules.push(moduleName);
            }
        });
        
        if (missingModules.length > 0) {
            console.warn('IDCard Actions: Missing modules:', missingModules);
            return false;
        }
        
        console.log('IDCard Actions: All modules verified');
        return true;
    }
    
    // ==========================================
    // MAIN INITIALIZATION
    // ==========================================
    
    function initializeApp() {
        console.log('IDCard Actions: Starting initialization...');
        
        // Set global table ID from template variable
        if (typeof TABLE_ID !== 'undefined') {
            window.IDCardApp.tableId = TABLE_ID;
        }
        if (typeof CURRENT_STATUS !== 'undefined') {
            window.IDCardApp.currentStatus = CURRENT_STATUS;
        }
        if (typeof CLIENT_ID !== 'undefined') {
            window.IDCardApp.clientId = CLIENT_ID;
        }
        
        // Verify all modules are loaded
        if (!verifyModulesLoaded()) {
            console.error('IDCard Actions: Some modules failed to load. Check script order in HTML.');
        }
        
        // Initialize modules in order
        try {
            // Core module - CSRF, toast, sidebar, checkboxes, dropdowns
            if (window.IDCardApp && window.IDCardApp.initCoreModule) {
                window.IDCardApp.initCoreModule();
                console.log('  ✓ Core module initialized');
            }
            
            // Table module - Table rendering, pagination, lazy loading
            if (window.IDCardApp && window.IDCardApp.initTableModule) {
                window.IDCardApp.initTableModule();
                console.log('  ✓ Table module initialized');
            }
            
            // Search module - Search, filter, sort
            if (window.IDCardApp && window.IDCardApp.initSearchModule) {
                window.IDCardApp.initSearchModule();
                console.log('  ✓ Search module initialized');
            }
            
            // Upload module - XLSX, ZIP uploads
            if (window.IDCardApp && window.IDCardApp.initUploadModule) {
                window.IDCardApp.initUploadModule();
                console.log('  ✓ Upload module initialized');
            }
            
            // Download module - Download images, DOCX, XLSX
            if (window.IDCardApp && window.IDCardApp.initDownloadModule) {
                window.IDCardApp.initDownloadModule();
                console.log('  ✓ Download module initialized');
            }
            
            // Modal module - Side modal, delete modal
            if (window.IDCardApp && window.IDCardApp.initModalModule) {
                window.IDCardApp.initModalModule();
                console.log('  ✓ Modal module initialized');
            }
            
            // API module - Card status operations, bulk actions
            if (window.IDCardApp && window.IDCardApp.initApiModule) {
                window.IDCardApp.initApiModule();
                console.log('  ✓ API module initialized');
            }
            
            // Edit module - Inline cell editing
            if (window.IDCardApp && window.IDCardApp.initEditModule) {
                window.IDCardApp.initEditModule();
                console.log('  ✓ Edit module initialized');
            }
            
            console.log('IDCard Actions: All modules initialized successfully!');
            
            // Dispatch custom event for other scripts that may depend on this
            document.dispatchEvent(new CustomEvent('idcard-actions-ready'));
            
        } catch (error) {
            console.error('IDCard Actions: Error during initialization:', error);
        }
    }
    
    // ==========================================
    // KEYBOARD SHORTCUTS
    // ==========================================
    
    function initKeyboardShortcuts() {
        document.addEventListener('keydown', function(e) {
            // Ctrl+F or Cmd+F - Focus search
            if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
                const searchInput = document.getElementById('searchInput');
                if (searchInput) {
                    e.preventDefault();
                    searchInput.focus();
                    searchInput.select();
                }
            }
            
            // Escape - Close any open modal
            if (e.key === 'Escape') {
                // Close side modal
                if (typeof closeSideModal === 'function') {
                    const sideModal = document.getElementById('sideModal');
                    if (sideModal && sideModal.classList.contains('active')) {
                        closeSideModal();
                        e.preventDefault();
                        return;
                    }
                }
                
                // Close delete modal
                const deleteModal = document.getElementById('deleteModalOverlay');
                if (deleteModal && deleteModal.classList.contains('active')) {
                    deleteModal.classList.remove('active');
                    e.preventDefault();
                    return;
                }
                
                // Close search all modal
                const searchAllModal = document.getElementById('searchAllModal');
                if (searchAllModal && searchAllModal.classList.contains('active')) {
                    searchAllModal.classList.remove('active');
                    e.preventDefault();
                    return;
                }
            }
            
            // Ctrl+A or Cmd+A - Select all in table
            if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
                const activeElement = document.activeElement;
                // Only if not in an input/textarea
                if (!activeElement.matches('input, textarea')) {
                    const selectAllCheckbox = document.getElementById('selectAll');
                    if (selectAllCheckbox) {
                        e.preventDefault();
                        selectAllCheckbox.checked = true;
                        selectAllCheckbox.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                }
            }
            
            // N key - Add new card (when not in input)
            if (e.key === 'n' && !e.ctrlKey && !e.metaKey && !e.altKey) {
                const activeElement = document.activeElement;
                if (!activeElement.matches('input, textarea')) {
                    const addBtn = document.getElementById('addNewBtn');
                    if (addBtn) {
                        e.preventDefault();
                        addBtn.click();
                    }
                }
            }
        });
    }
    
    // ==========================================
    // WINDOW RESIZE HANDLER
    // ==========================================
    
    let resizeTimeout;
    function initResizeHandler() {
        window.addEventListener('resize', function() {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(function() {
                // Re-adjust table alignment
                if (typeof setupDynamicTextAlignment === 'function') {
                    setupDynamicTextAlignment();
                }
                
                // Re-check lazy loading
                if (typeof checkLoadMore === 'function') {
                    checkLoadMore();
                }
            }, 250);
        });
    }
    
    // ==========================================
    // PERFORMANCE MONITORING
    // ==========================================
    
    function logPerformance() {
        if (window.performance && window.performance.timing) {
            window.addEventListener('load', function() {
                setTimeout(function() {
                    const timing = window.performance.timing;
                    const loadTime = timing.loadEventEnd - timing.navigationStart;
                    const domReady = timing.domContentLoadedEventEnd - timing.navigationStart;
                    
                    console.log(`IDCard Actions: Page load time: ${loadTime}ms`);
                    console.log(`IDCard Actions: DOM ready time: ${domReady}ms`);
                }, 0);
            });
        }
    }
    
    // ==========================================
    // DOM READY HANDLER
    // ==========================================
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            initializeApp();
            initKeyboardShortcuts();
            initResizeHandler();
            logPerformance();
        });
    } else {
        // DOM already loaded
        initializeApp();
        initKeyboardShortcuts();
        initResizeHandler();
        logPerformance();
    }
    
    // ==========================================
    // PUBLIC API
    // ==========================================
    
    // Expose a clean public API
    window.IDCardActions = {
        version: '2.0.0',
        modules: window.IDCardApp || {},
        
        // Utility functions
        showToast: function(message, type) {
            if (typeof showToast === 'function') {
                showToast(message, type);
            }
        },
        
        // Refresh table
        refreshTable: function() {
            location.reload();
        },
        
        // Get selected card IDs
        getSelected: function() {
            if (typeof getSelectedCardIds === 'function') {
                return getSelectedCardIds();
            }
            return [];
        },
        
        // Open add modal
        openAddModal: function() {
            if (typeof openSideModal === 'function') {
                openSideModal('add');
            }
        },
        
        // Reinitialize (useful after dynamic content changes)
        reinitialize: function() {
            initializeApp();
        }
    };
    
    console.log('IDCard Actions: Main module loaded (v2.0.0)');
    
})();
