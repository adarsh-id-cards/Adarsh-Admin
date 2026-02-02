// Dashboard Page JavaScript

document.addEventListener('DOMContentLoaded', function() {
    
    // ====================
    // Update Welcome Banner Date/Time
    // ====================
    const welcomeDate = document.getElementById('welcomeDate');
    const welcomeTime = document.getElementById('welcomeTime');
    
    function updateWelcomeDateTime() {
        const now = new Date();
        
        // Format date: Sunday, Feb 01, 2026
        const options = { weekday: 'long', year: 'numeric', month: 'short', day: '2-digit' };
        const dateStr = now.toLocaleDateString('en-US', options);
        
        // Format time: 00:00:00
        const timeStr = now.toLocaleTimeString('en-US', { 
            hour12: false, 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit' 
        });
        
        if (welcomeDate) welcomeDate.textContent = dateStr;
        if (welcomeTime) welcomeTime.textContent = timeStr;
    }
    
    // Update immediately and then every second
    updateWelcomeDateTime();
    setInterval(updateWelcomeDateTime, 1000);
    
    // ====================
    // Animate Stat Cards on Load
    // ====================
    const statCards = document.querySelectorAll('.stat-card');
    statCards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            card.style.transition = 'all 0.5s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 100);
    });
    
    // ====================
    // Animate Numbers
    // ====================
    function animateValue(element, start, end, duration) {
        const startTime = performance.now();
        const isFormatted = end.toString().includes(',');
        const endValue = parseInt(end.toString().replace(/,/g, ''));
        
        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            const current = Math.floor(start + (endValue - start) * easeOutQuart);
            
            if (isFormatted) {
                element.textContent = current.toLocaleString();
            } else {
                element.textContent = current;
            }
            
            if (progress < 1) {
                requestAnimationFrame(update);
            }
        }
        
        requestAnimationFrame(update);
    }
    
    // Animate stat values
    setTimeout(() => {
        const pendingCards = document.getElementById('pendingCards');
        const verifiedCards = document.getElementById('verifiedCards');
        const approvedCards = document.getElementById('approvedCards');
        const downloadedCards = document.getElementById('downloadedCards');
        
        if (pendingCards) animateValue(pendingCards, 0, 23, 1000);
        if (verifiedCards) animateValue(verifiedCards, 0, 156, 1000);
        if (approvedCards) animateValue(approvedCards, 0, 412, 1200);
        if (downloadedCards) animateValue(downloadedCards, 0, 656, 1500);
    }, 500);
    
    // ====================
    // Quick Action Hover Effects
    // ====================
    const quickActionBtns = document.querySelectorAll('.quick-action-btn');
    quickActionBtns.forEach(btn => {
        btn.addEventListener('mouseenter', function() {
            this.querySelector('i').style.transform = 'scale(1.1)';
        });
        btn.addEventListener('mouseleave', function() {
            this.querySelector('i').style.transform = 'scale(1)';
        });
    });
    
    // ====================
    // Card Overview Hover
    // ====================
    const cardOverviewItems = document.querySelectorAll('.card-overview-item');
    cardOverviewItems.forEach(item => {
        item.style.cursor = 'pointer';
        item.addEventListener('mouseenter', function() {
            this.style.background = 'linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.08) 100%)';
            this.style.borderColor = 'rgba(102, 126, 234, 0.2)';
        });
        item.addEventListener('mouseleave', function() {
            this.style.background = '#fafbfc';
            this.style.borderColor = 'rgba(0, 0, 0, 0.04)';
        });
    });
    
    // ====================
    // Activity Item Hover
    // ====================
    const activityItems = document.querySelectorAll('.activity-item');
    activityItems.forEach(item => {
        item.addEventListener('mouseenter', function() {
            this.style.background = 'rgba(102, 126, 234, 0.04)';
            this.style.marginLeft = '-10px';
            this.style.marginRight = '-10px';
            this.style.paddingLeft = '10px';
            this.style.paddingRight = '10px';
            this.style.borderRadius = '8px';
        });
        item.addEventListener('mouseleave', function() {
            this.style.background = 'transparent';
            this.style.marginLeft = '0';
            this.style.marginRight = '0';
            this.style.paddingLeft = '0';
            this.style.paddingRight = '0';
        });
    });
    
    // ====================
    // Recent Table Row Hover
    // ====================
    const tableRows = document.querySelectorAll('.recent-table tbody tr');
    tableRows.forEach(row => {
        row.style.cursor = 'pointer';
        row.addEventListener('click', function() {
            // Could navigate to client details
            console.log('Clicked on client row');
        });
    });
    
    // ====================
    // Dashboard Cards Animation on Scroll
    // ====================
    const dashboardCards = document.querySelectorAll('.dashboard-card');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, { threshold: 0.1 });
    
    dashboardCards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'all 0.5s ease';
        observer.observe(card);
    });
    
    // Trigger immediately for visible cards
    setTimeout(() => {
        dashboardCards.forEach(card => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        });
    }, 300);
    
    // ==========================================
    // GLOBAL SEARCH FUNCTIONALITY
    // ==========================================
    
    const globalSearchBtn = document.getElementById('globalSearchBtn');
    const globalSearchOverlay = document.getElementById('globalSearchOverlay');
    const globalSearchInput = document.getElementById('globalSearchInput');
    const globalSearchFilter = document.getElementById('globalSearchFilter');
    const globalSearchResults = document.getElementById('globalSearchResults');
    const clearGlobalSearch = document.getElementById('clearGlobalSearch');
    const closeGlobalSearch = document.getElementById('closeGlobalSearch');
    
    let searchTimeout = null;
    
    function openGlobalSearch() {
        if (globalSearchOverlay) {
            globalSearchOverlay.classList.add('active');
            setTimeout(() => {
                if (globalSearchInput) globalSearchInput.focus();
            }, 100);
        }
    }
    
    function closeGlobalSearchModal() {
        if (globalSearchOverlay) {
            globalSearchOverlay.classList.remove('active');
        }
        if (globalSearchInput) globalSearchInput.value = '';
        if (clearGlobalSearch) clearGlobalSearch.style.display = 'none';
        if (globalSearchResults) {
            globalSearchResults.innerHTML = `
                <div class="search-placeholder">
                    <i class="fa-solid fa-search"></i>
                    <p>Search across all clients and ID cards</p>
                    <span>Enter at least 2 characters to search</span>
                </div>
            `;
        }
    }
    
    // Open search on button click
    if (globalSearchBtn) {
        globalSearchBtn.addEventListener('click', openGlobalSearch);
    }
    
    // Open search with Ctrl+K
    document.addEventListener('keydown', function(e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            openGlobalSearch();
        }
        // Close on Escape
        if (e.key === 'Escape' && globalSearchOverlay?.classList.contains('active')) {
            closeGlobalSearchModal();
        }
    });
    
    // Close modal handlers
    if (closeGlobalSearch) {
        closeGlobalSearch.addEventListener('click', closeGlobalSearchModal);
    }
    
    if (globalSearchOverlay) {
        globalSearchOverlay.addEventListener('click', function(e) {
            if (e.target === this) closeGlobalSearchModal();
        });
    }
    
    // Clear search
    if (clearGlobalSearch) {
        clearGlobalSearch.addEventListener('click', function() {
            if (globalSearchInput) globalSearchInput.value = '';
            this.style.display = 'none';
            globalSearchInput.focus();
            if (globalSearchResults) {
                globalSearchResults.innerHTML = `
                    <div class="search-placeholder">
                        <i class="fa-solid fa-search"></i>
                        <p>Search across all clients and ID cards</p>
                        <span>Enter at least 2 characters to search</span>
                    </div>
                `;
            }
        });
    }
    
    // Search input handler
    if (globalSearchInput) {
        globalSearchInput.addEventListener('input', function() {
            const query = this.value.trim();
            
            // Show/hide clear button
            if (clearGlobalSearch) {
                clearGlobalSearch.style.display = query.length > 0 ? 'flex' : 'none';
            }
            
            // Clear previous timeout
            if (searchTimeout) clearTimeout(searchTimeout);
            
            if (query.length < 2) {
                if (globalSearchResults) {
                    globalSearchResults.innerHTML = `
                        <div class="search-placeholder">
                            <i class="fa-solid fa-search"></i>
                            <p>${query.length === 0 ? 'Search across all clients and ID cards' : 'Enter at least 2 characters'}</p>
                            <span>Enter at least 2 characters to search</span>
                        </div>
                    `;
                }
                return;
            }
            
            // Show loading
            if (globalSearchResults) {
                globalSearchResults.innerHTML = `
                    <div class="global-search-loading">
                        <i class="fa-solid fa-spinner fa-spin"></i>
                        <p>Searching...</p>
                    </div>
                `;
            }
            
            // Debounce search
            searchTimeout = setTimeout(() => {
                performGlobalSearch(query);
            }, 300);
        });
    }
    
    // Filter change handler
    if (globalSearchFilter) {
        globalSearchFilter.addEventListener('change', function() {
            const query = globalSearchInput?.value.trim();
            if (query && query.length >= 2) {
                performGlobalSearch(query);
            }
        });
    }
    
    function performGlobalSearch(query) {
        const filter = globalSearchFilter?.value || 'all';
        
        fetch(`/api/global-search/?q=${encodeURIComponent(query)}&filter=${filter}`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    displayGlobalSearchResults(data.results, query);
                } else {
                    if (globalSearchResults) {
                        globalSearchResults.innerHTML = `
                            <div class="global-search-no-results">
                                <i class="fa-solid fa-exclamation-circle"></i>
                                <p>Error: ${data.message}</p>
                            </div>
                        `;
                    }
                }
            })
            .catch(error => {
                console.error('Search error:', error);
                if (globalSearchResults) {
                    globalSearchResults.innerHTML = `
                        <div class="global-search-no-results">
                            <i class="fa-solid fa-exclamation-circle"></i>
                            <p>Error searching. Please try again.</p>
                        </div>
                    `;
                }
            });
    }
    
    function displayGlobalSearchResults(results, query) {
        if (!globalSearchResults) return;
        
        if (results.length === 0) {
            globalSearchResults.innerHTML = `
                <div class="global-search-no-results">
                    <i class="fa-solid fa-search"></i>
                    <p>No results found for "${query}"</p>
                </div>
            `;
            return;
        }
        
        let html = `<div class="global-search-results-header">${results.length} result${results.length > 1 ? 's' : ''} found</div>`;
        
        results.forEach(result => {
            let iconHtml;
            if (result.photo) {
                iconHtml = `<img src="${result.photo}" class="result-photo" alt="Photo">`;
            } else {
                iconHtml = `<div class="result-icon ${result.type}"><i class="fa-solid ${result.icon}"></i></div>`;
            }
            
            html += `
                <div class="global-search-result-item" data-url="${result.url}">
                    ${iconHtml}
                    <div class="result-info">
                        <div class="result-title">${result.title}</div>
                        <div class="result-subtitle">${result.subtitle}</div>
                        <div class="result-match">Match: <strong>${result.matched_field}</strong> = "${result.matched_value}"</div>
                    </div>
                    <i class="fa-solid fa-chevron-right result-arrow"></i>
                </div>
            `;
        });
        
        globalSearchResults.innerHTML = html;
        
        // Add click handlers
        globalSearchResults.querySelectorAll('.global-search-result-item').forEach(item => {
            item.addEventListener('click', function() {
                const url = this.getAttribute('data-url');
                if (url && url !== '#') {
                    window.location.href = url;
                }
            });
        });
    }
    
    console.log('Dashboard loaded successfully');
});
