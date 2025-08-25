// Authentication UI Component
// Handles login/register modal and user authentication flow

class AuthUI {
    constructor() {
        this.apiClient = window.apiClient;
        this.isVisible = false;
        this.mode = 'login'; // 'login' or 'register'
        
        this.createModal();
        this.attachEventListeners();
        this.checkAuthStatus();
    }
    
    createModal() {
        // Create modal HTML
        const modal = document.createElement('div');
        modal.id = 'authModal';
        modal.className = 'modal-overlay';
        modal.style.display = 'none';
        modal.innerHTML = `
            <div class="modal-content auth-modal">
                <div class="modal-header">
                    <h3 id="authTitle">Login to Snake Game</h3>
                    <button id="closeAuth" class="close-btn">×</button>
                </div>
                
                <div class="auth-form">
                    <div class="form-tabs">
                        <button class="tab-btn active" data-mode="login">Login</button>
                        <button class="tab-btn" data-mode="register">Register</button>
                    </div>
                    
                    <form id="authForm">
                        <div class="form-group">
                            <input type="text" id="authUsername" placeholder="Username" required>
                        </div>
                        
                        <div class="form-group" id="emailGroup" style="display: none;">
                            <input type="email" id="authEmail" placeholder="Email">
                        </div>
                        
                        <div class="form-group" id="displayNameGroup" style="display: none;">
                            <input type="text" id="authDisplayName" placeholder="Display Name (optional)">
                        </div>
                        
                        <div class="form-group">
                            <input type="password" id="authPassword" placeholder="Password" required>
                        </div>
                        
                        <div class="form-group" id="confirmPasswordGroup" style="display: none;">
                            <input type="password" id="authConfirmPassword" placeholder="Confirm Password">
                        </div>
                        
                        <div class="form-error" id="authError" style="display: none;"></div>
                        
                        <button type="submit" class="btn-primary" id="authSubmit">Login</button>
                    </form>
                    
                    <div class="auth-footer">
                        <p id="authFooterText">Don't have an account? <a href="#" id="authSwitch">Register</a></p>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add styles
        const styles = document.createElement('style');
        styles.textContent = `
            .auth-modal {
                max-width: 400px;
                width: 90%;
            }
            
            .auth-form {
                padding: 20px;
            }
            
            .form-tabs {
                display: flex;
                gap: 10px;
                margin-bottom: 20px;
            }
            
            .tab-btn {
                flex: 1;
                padding: 10px;
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(139, 92, 246, 0.3);
                color: #fff;
                cursor: pointer;
                transition: all 0.3s;
                border-radius: 8px;
            }
            
            .tab-btn:hover {
                background: rgba(139, 92, 246, 0.2);
            }
            
            .tab-btn.active {
                background: #8B5CF6;
                border-color: #8B5CF6;
            }
            
            .form-group {
                margin-bottom: 15px;
            }
            
            .form-group input {
                width: 100%;
                padding: 12px;
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.2);
                color: #fff;
                border-radius: 8px;
                font-size: 14px;
            }
            
            .form-group input::placeholder {
                color: rgba(255, 255, 255, 0.5);
            }
            
            .form-group input:focus {
                outline: none;
                border-color: #8B5CF6;
                background: rgba(255, 255, 255, 0.15);
            }
            
            .form-error {
                color: #ef4444;
                font-size: 14px;
                margin-bottom: 15px;
                padding: 10px;
                background: rgba(239, 68, 68, 0.1);
                border-radius: 8px;
                border: 1px solid rgba(239, 68, 68, 0.3);
            }
            
            .auth-footer {
                margin-top: 20px;
                text-align: center;
                font-size: 14px;
                color: rgba(255, 255, 255, 0.7);
            }
            
            .auth-footer a {
                color: #8B5CF6;
                text-decoration: none;
            }
            
            .auth-footer a:hover {
                text-decoration: underline;
            }
            
            #authSubmit {
                width: 100%;
                padding: 12px;
                font-size: 16px;
            }
            
            .user-info {
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 10px;
                background: rgba(139, 92, 246, 0.1);
                border-radius: 8px;
                margin-bottom: 10px;
            }
            
            .user-avatar {
                width: 40px;
                height: 40px;
                border-radius: 50%;
                background: #8B5CF6;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 20px;
            }
            
            .user-details {
                flex: 1;
            }
            
            .user-name {
                font-weight: bold;
                color: #fff;
            }
            
            .user-level {
                font-size: 12px;
                color: rgba(255, 255, 255, 0.7);
            }
            
            .logout-btn {
                padding: 8px 16px;
                background: rgba(239, 68, 68, 0.2);
                border: 1px solid rgba(239, 68, 68, 0.3);
                color: #ef4444;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.3s;
            }
            
            .logout-btn:hover {
                background: rgba(239, 68, 68, 0.3);
            }
        `;
        document.head.appendChild(styles);
    }
    
    attachEventListeners() {
        const modal = document.getElementById('authModal');
        const closeBtn = document.getElementById('closeAuth');
        const form = document.getElementById('authForm');
        const tabs = document.querySelectorAll('.tab-btn');
        const switchLink = document.getElementById('authSwitch');
        
        // Close modal
        closeBtn.addEventListener('click', () => this.hide());
        modal.addEventListener('click', (e) => {
            if (e.target === modal) this.hide();
        });
        
        // Tab switching
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const mode = tab.dataset.mode;
                this.switchMode(mode);
            });
        });
        
        // Switch link
        switchLink.addEventListener('click', (e) => {
            e.preventDefault();
            this.switchMode(this.mode === 'login' ? 'register' : 'login');
        });
        
        // Form submission
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleSubmit();
        });
        
        // Listen for auth events
        if (window.GameEventBus) {
            window.GameEventBus.on('auth:required', () => this.show());
            window.GameEventBus.on('auth:login', (user) => this.onLogin(user));
            window.GameEventBus.on('auth:logout', () => this.onLogout());
        }
    }
    
    switchMode(mode) {
        this.mode = mode;
        
        // Update tabs
        document.querySelectorAll('.tab-btn').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.mode === mode);
        });
        
        // Update form
        const isRegister = mode === 'register';
        document.getElementById('authTitle').textContent = isRegister ? 'Register for Snake Game' : 'Login to Snake Game';
        document.getElementById('emailGroup').style.display = isRegister ? 'block' : 'none';
        document.getElementById('displayNameGroup').style.display = isRegister ? 'block' : 'none';
        document.getElementById('confirmPasswordGroup').style.display = isRegister ? 'block' : 'none';
        document.getElementById('authSubmit').textContent = isRegister ? 'Register' : 'Login';
        
        // Update footer
        const footerText = document.getElementById('authFooterText');
        if (isRegister) {
            footerText.innerHTML = 'Already have an account? <a href="#" id="authSwitch">Login</a>';
        } else {
            footerText.innerHTML = 'Don\'t have an account? <a href="#" id="authSwitch">Register</a>';
        }
        
        // Reattach switch listener
        document.getElementById('authSwitch').addEventListener('click', (e) => {
            e.preventDefault();
            this.switchMode(this.mode === 'login' ? 'register' : 'login');
        });
        
        // Clear error
        this.hideError();
    }
    
    async handleSubmit() {
        const username = document.getElementById('authUsername').value.trim();
        const password = document.getElementById('authPassword').value;
        const email = document.getElementById('authEmail')?.value.trim();
        const displayName = document.getElementById('authDisplayName')?.value.trim();
        const confirmPassword = document.getElementById('authConfirmPassword')?.value;
        
        // Validation
        if (!username || !password) {
            this.showError('Username and password are required');
            return;
        }
        
        if (this.mode === 'register') {
            if (!email) {
                this.showError('Email is required for registration');
                return;
            }
            
            if (password !== confirmPassword) {
                this.showError('Passwords do not match');
                return;
            }
            
            if (password.length < 6) {
                this.showError('Password must be at least 6 characters');
                return;
            }
        }
        
        // Show loading
        const submitBtn = document.getElementById('authSubmit');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Loading...';
        
        try {
            let result;
            
            if (this.mode === 'register') {
                result = await this.apiClient.register(username, email, password, displayName);
            } else {
                result = await this.apiClient.login(username, password);
            }
            
            if (result.success || result.token) {
                this.hide();
                this.onLogin(result.user);
                
                // Show success notification
                if (window.NotificationManager) {
                    window.NotificationManager.showNotification(
                        this.mode === 'register' ? 'Welcome!' : 'Welcome Back!',
                        `Logged in as ${result.user.displayName || result.user.username}`
                    );
                }
            } else {
                this.showError(result.error || 'Authentication failed');
            }
            
        } catch (error) {
            this.showError(this.apiClient.formatError(error));
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    }
    
    showError(message) {
        const errorDiv = document.getElementById('authError');
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
    }
    
    hideError() {
        const errorDiv = document.getElementById('authError');
        errorDiv.style.display = 'none';
    }
    
    show(mode = 'login') {
        this.switchMode(mode);
        document.getElementById('authModal').style.display = 'flex';
        this.isVisible = true;
        
        // Focus username field
        setTimeout(() => {
            document.getElementById('authUsername').focus();
        }, 100);
    }
    
    hide() {
        document.getElementById('authModal').style.display = 'none';
        this.isVisible = false;
        
        // Clear form
        document.getElementById('authForm').reset();
        this.hideError();
    }
    
    checkAuthStatus() {
        if (this.apiClient.isAuthenticated()) {
            const user = this.apiClient.getUser();
            this.updateUIForAuthenticatedUser(user);
        }
    }
    
    onLogin(user) {
        console.log('User logged in:', user);
        this.updateUIForAuthenticatedUser(user);
        
        // Refresh Battle Pass status if available
        if (window.battlePassManager) {
            window.battlePassManager.refreshStatus();
        }
    }
    
    onLogout() {
        console.log('User logged out');
        this.updateUIForGuestUser();
    }
    
    updateUIForAuthenticatedUser(user) {
        // Update profile button
        const profileButtons = document.querySelectorAll('[id*="profile"]');
        profileButtons.forEach(btn => {
            if (btn) {
                btn.innerHTML = `
                    <span class="button-icon">👤</span>
                    <span class="button-text">${user.displayName || user.username} Lvl ${user.level}</span>
                `;
            }
        });
        
        // Update any user display elements
        const userDisplay = document.querySelector('.user-display');
        if (userDisplay) {
            userDisplay.textContent = user.displayName || user.username;
        }
    }
    
    updateUIForGuestUser() {
        // Update profile button
        const profileButtons = document.querySelectorAll('[id*="profile"]');
        profileButtons.forEach(btn => {
            if (btn) {
                btn.innerHTML = `
                    <span class="button-icon">👤</span>
                    <span class="button-text">Guest</span>
                `;
                btn.addEventListener('click', () => this.show());
            }
        });
    }
    
    async showLoggedInUser() {
        if (!this.apiClient.isAuthenticated()) {
            this.show();
            return;
        }
        
        const user = this.apiClient.getUser();
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 400px;">
                <div class="modal-header">
                    <h3>Profile</h3>
                    <button class="close-btn" onclick="this.closest('.modal-overlay').remove()">×</button>
                </div>
                <div style="padding: 20px;">
                    <div class="user-info">
                        <div class="user-avatar">👤</div>
                        <div class="user-details">
                            <div class="user-name">${user.displayName || user.username}</div>
                            <div class="user-level">Level ${user.level} • ${user.coins} coins • ${user.gems} gems</div>
                        </div>
                    </div>
                    <button class="logout-btn" style="width: 100%;" onclick="window.authUI.logout()">Logout</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        modal.style.display = 'flex';
    }
    
    async logout() {
        if (confirm('Are you sure you want to logout?')) {
            await this.apiClient.logout();
            document.querySelector('.modal-overlay')?.remove();
        }
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.authUI = new AuthUI();
    });
} else {
    window.authUI = new AuthUI();
}

console.log('🔐 Authentication UI initialized');