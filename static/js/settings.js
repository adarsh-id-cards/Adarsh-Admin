// Settings Page JavaScript

document.addEventListener('DOMContentLoaded', function() {
    
    // ===== Avatar Upload =====
    const avatarUpload = document.getElementById('avatarUpload');
    const profileAvatar = document.getElementById('profileAvatar');
    const sidebarAvatar = document.querySelector('.sidebar-avatar');
    const topbarAvatar = document.querySelector('.topbar-avatar');

    if (avatarUpload) {
        avatarUpload.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    const imageUrl = e.target.result;
                    profileAvatar.src = imageUrl;
                    if (sidebarAvatar) sidebarAvatar.src = imageUrl;
                    if (topbarAvatar) topbarAvatar.src = imageUrl;
                    showToast('Profile picture updated!', 'success');
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // ===== Password Toggle =====
    const passwordToggles = document.querySelectorAll('.password-toggle');
    
    passwordToggles.forEach(toggle => {
        toggle.addEventListener('click', function() {
            const targetId = this.getAttribute('data-target');
            const input = document.getElementById(targetId);
            const icon = this.querySelector('i');
            
            if (input.type === 'password') {
                input.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                input.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        });
    });

    // ===== Password Validation =====
    const newPasswordInput = document.getElementById('newPassword');
    
    if (newPasswordInput) {
        newPasswordInput.addEventListener('input', function() {
            const password = this.value;
            
            // Check requirements
            updateRequirement('reqLength', password.length >= 8);
            updateRequirement('reqUpper', /[A-Z]/.test(password));
            updateRequirement('reqLower', /[a-z]/.test(password));
            updateRequirement('reqNumber', /[0-9]/.test(password));
            updateRequirement('reqSpecial', /[!@#$%^&*(),.?":{}|<>]/.test(password));
        });
    }

    function updateRequirement(id, isValid) {
        const element = document.getElementById(id);
        if (element) {
            if (isValid) {
                element.classList.add('valid');
                element.querySelector('i').classList.remove('fa-circle');
                element.querySelector('i').classList.add('fa-check-circle');
            } else {
                element.classList.remove('valid');
                element.querySelector('i').classList.remove('fa-check-circle');
                element.querySelector('i').classList.add('fa-circle');
            }
        }
    }

    // ===== Profile Form Submit =====
    const profileForm = document.getElementById('profileForm');
    
    if (profileForm) {
        profileForm.addEventListener('submit', function(e) {
            e.preventDefault();
            showToast('Profile information updated successfully!', 'success');
        });
    }

    // ===== Password Form Submit =====
    const passwordForm = document.getElementById('passwordForm');
    
    if (passwordForm) {
        passwordForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const currentPassword = document.getElementById('currentPassword').value;
            const newPassword = document.getElementById('newPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            
            if (!currentPassword || !newPassword || !confirmPassword) {
                showToast('Please fill in all password fields', 'error');
                return;
            }
            
            if (newPassword !== confirmPassword) {
                showToast('New passwords do not match', 'error');
                return;
            }
            
            if (newPassword.length < 8) {
                showToast('Password must be at least 8 characters', 'error');
                return;
            }
            
            // Simulate password change
            showToast('Password updated successfully!', 'success');
            passwordForm.reset();
            
            // Reset requirement indicators
            document.querySelectorAll('.password-requirements li').forEach(li => {
                li.classList.remove('valid');
                li.querySelector('i').classList.remove('fa-check-circle');
                li.querySelector('i').classList.add('fa-circle');
            });
        });
    }

    // ===== Modal Functions =====
    const modal = document.getElementById('confirmModal');
    const modalIcon = document.getElementById('modalIcon');
    const modalTitle = document.getElementById('modalTitle');
    const modalMessage = document.getElementById('modalMessage');
    const modalConfirm = document.getElementById('modalConfirm');
    const modalCancel = document.getElementById('modalCancel');
    
    let currentAction = null;

    function showModal(title, message, action, isDanger = true) {
        modalTitle.textContent = title;
        modalMessage.textContent = message;
        currentAction = action;
        
        if (isDanger) {
            modalIcon.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i>';
            modalIcon.classList.remove('success');
            modalConfirm.style.background = '#dc3545';
        } else {
            modalIcon.innerHTML = '<i class="fa-solid fa-question-circle"></i>';
            modalIcon.classList.add('success');
            modalConfirm.style.background = '#16a34a';
        }
        
        modal.classList.add('active');
    }

    function hideModal() {
        modal.classList.remove('active');
        currentAction = null;
    }

    if (modalCancel) {
        modalCancel.addEventListener('click', hideModal);
    }

    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                hideModal();
            }
        });
    }

    if (modalConfirm) {
        modalConfirm.addEventListener('click', function() {
            if (currentAction) {
                currentAction();
            }
            hideModal();
        });
    }

    // ===== Logout Button =====
    const logoutBtn = document.getElementById('logoutBtn');
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            showModal(
                'Logout',
                'Are you sure you want to logout from your account?',
                function() {
                    showToast('Logging out...', 'success');
                    setTimeout(() => {
                        // Redirect to login page
                        // window.location.href = 'login.html';
                    }, 1500);
                }
            );
        });
    }

    // ===== Revoke Session =====
    const revokeButtons = document.querySelectorAll('.btn-revoke');
    
    revokeButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const sessionItem = this.closest('.session-item');
            const deviceName = sessionItem.querySelector('h4').textContent.split(' -')[0];
            
            showModal(
                'Revoke Session',
                `Are you sure you want to logout from "${deviceName}"?`,
                function() {
                    sessionItem.style.animation = 'fadeOut 0.3s ease forwards';
                    setTimeout(() => {
                        sessionItem.remove();
                        showToast('Session revoked successfully!', 'success');
                    }, 300);
                }
            );
        });
    });

    // ===== Revoke All Sessions =====
    const revokeAllBtn = document.getElementById('revokeAllBtn');
    
    if (revokeAllBtn) {
        revokeAllBtn.addEventListener('click', function() {
            showModal(
                'Logout from All Devices',
                'This will logout all sessions except your current one. Continue?',
                function() {
                    const sessionItems = document.querySelectorAll('.session-item:not(.current)');
                    sessionItems.forEach((item, index) => {
                        setTimeout(() => {
                            item.style.animation = 'fadeOut 0.3s ease forwards';
                            setTimeout(() => item.remove(), 300);
                        }, index * 100);
                    });
                    showToast('All other sessions have been revoked!', 'success');
                }
            );
        });
    }

    // ===== Reset Settings =====
    const resetSettingsBtn = document.getElementById('resetSettingsBtn');
    
    if (resetSettingsBtn) {
        resetSettingsBtn.addEventListener('click', function() {
            showModal(
                'Reset All Settings',
                'This will reset all your preferences to default values. This action cannot be undone.',
                function() {
                    // Reset toggles
                    document.getElementById('twoFactorToggle').checked = false;
                    document.getElementById('loginNotifyToggle').checked = true;
                    document.getElementById('sessionTimeout').value = '30';
                    
                    showToast('All settings have been reset to default!', 'success');
                }
            );
        });
    }

    // ===== Delete Account =====
    const deleteAccountBtn = document.getElementById('deleteAccountBtn');
    
    if (deleteAccountBtn) {
        deleteAccountBtn.addEventListener('click', function() {
            showModal(
                'Delete Account',
                'This action is permanent and cannot be undone. All your data will be lost.',
                function() {
                    showToast('Account deletion initiated...', 'error');
                    // In real app, redirect to confirmation page or make API call
                }
            );
        });
    }

    // ===== Toast Notification =====
    // Using shared showToast from utils.js

    // ===== Add CSS Animation =====
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeOut {
            from {
                opacity: 1;
                transform: translateX(0);
            }
            to {
                opacity: 0;
                transform: translateX(20px);
            }
        }
    `;
    document.head.appendChild(style);

    // ===== Security Toggle Changes =====
    const twoFactorToggle = document.getElementById('twoFactorToggle');
    const loginNotifyToggle = document.getElementById('loginNotifyToggle');
    const sessionTimeout = document.getElementById('sessionTimeout');

    if (twoFactorToggle) {
        twoFactorToggle.addEventListener('change', function() {
            if (this.checked) {
                showToast('Two-Factor Authentication enabled!', 'success');
            } else {
                showToast('Two-Factor Authentication disabled', 'success');
            }
        });
    }

    if (loginNotifyToggle) {
        loginNotifyToggle.addEventListener('change', function() {
            if (this.checked) {
                showToast('Login notifications enabled!', 'success');
            } else {
                showToast('Login notifications disabled', 'success');
            }
        });
    }

    if (sessionTimeout) {
        sessionTimeout.addEventListener('change', function() {
            const value = this.value;
            let message = '';
            
            if (value === '0') {
                message = 'Session timeout disabled';
            } else if (value === '60') {
                message = 'Session timeout set to 1 hour';
            } else if (value === '120') {
                message = 'Session timeout set to 2 hours';
            } else {
                message = `Session timeout set to ${value} minutes`;
            }
            
            showToast(message, 'success');
        });
    }

});
