// Auth module for handling authentication
const Auth = {
    // User data
    user: null,
    token: null,
    
    // Initialize authentication
    init: function() {
        this.token = localStorage.getItem('fittrack_token');
        const userData = localStorage.getItem('fittrack_user');
        
        if (this.token && userData) {
            try {
                this.user = JSON.parse(userData);
                return true;
            } catch (error) {
                console.error('Error parsing user data:', error);
                this.logout();
                return false;
            }
        }
        
        return false;
    },
    
    // Check if user is authenticated
    isAuthenticated: function() {
        return !!this.token && !!this.user;
    },
    
    // Check if user is admin
    isAdmin: function() {
        return this.isAuthenticated() && this.user.is_admin;
    },
    
    // Login user
    login: async function(username, password) {
        try {
            // Make API request to login endpoint
            const response = await fetch('/api/login.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username: username,
                    password: password
                })
            });
            
            const data = await response.json();
            
            if (!response.ok || data.error) {
                throw new Error(data.message || 'Login failed');
            }
            
            // Store token and user data in localStorage
            localStorage.setItem('fittrack_user', JSON.stringify(data.user));
            localStorage.setItem('fittrack_token', data.token);
            
            // Update module state
            this.user = data.user;
            this.token = data.token;
            
            return {
                success: true,
                user: data.user
            };
        } catch (error) {
            console.error('Login error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    },
    
    // Register new user
    register: async function(userData) {
        try {
            // Make API request to register endpoint
            const response = await fetch('/api/register.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });
            
            const data = await response.json();
            
            if (!response.ok || data.error) {
                throw new Error(data.message || 'Registration failed');
            }
            
            // Store token and user data in localStorage
            localStorage.setItem('fittrack_user', JSON.stringify(data.user));
            localStorage.setItem('fittrack_token', data.token);
            
            // Update module state
            this.user = data.user;
            this.token = data.token;
            
            return {
                success: true,
                user: data.user
            };
        } catch (error) {
            console.error('Registration error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    },
    
    // Logout user
    logout: function() {
        // Clear localStorage
        localStorage.removeItem('fittrack_token');
        localStorage.removeItem('fittrack_user');
        
        // Reset module state
        this.user = null;
        this.token = null;
        
        return true;
    },
    
    // Update user profile
    updateProfile: async function(profileData) {
        try {
            if (!this.isAuthenticated()) {
                throw new Error('User not authenticated');
            }
            
            // Make API request to update profile endpoint
            const response = await fetch('/api/user.php/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify(profileData)
            });
            
            const data = await response.json();
            
            if (!response.ok || data.error) {
                throw new Error(data.message || 'Failed to update profile');
            }
            
            // Update local user data
            const updatedUser = {
                ...this.user,
                ...data.user
            };
            
            // Store updated user in localStorage
            localStorage.setItem('fittrack_user', JSON.stringify(updatedUser));
            
            // Update module state
            this.user = updatedUser;
            
            return {
                success: true,
                user: updatedUser
            };
        } catch (error) {
            console.error('Update profile error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    },
    
    // Update password
    updatePassword: async function(currentPassword, newPassword) {
        try {
            if (!this.isAuthenticated()) {
                throw new Error('User not authenticated');
            }
            
            // Make API request to update password endpoint
            const response = await fetch('/api/user.php/password', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({
                    current_password: currentPassword,
                    new_password: newPassword
                })
            });
            
            const data = await response.json();
            
            if (!response.ok || data.error) {
                throw new Error(data.message || 'Failed to update password');
            }
            
            return {
                success: true,
                message: data.message || 'Password updated successfully'
            };
        } catch (error) {
            console.error('Update password error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    },
    
    // Get auth header
    getAuthHeader: function() {
        if (!this.token) return {};
        
        return {
            'Authorization': `Bearer ${this.token}`
        };
    },
    
    // Refresh token (for token-based authentication systems)
    refreshToken: async function() {
        try {
            if (!this.token) {
                throw new Error('No token to refresh');
            }
            
            // Make API request to refresh token endpoint
            const response = await fetch('/api/token-refresh.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                }
            });
            
            const data = await response.json();
            
            if (!response.ok || data.error) {
                throw new Error(data.message || 'Failed to refresh token');
            }
            
            // Store new token in localStorage
            localStorage.setItem('fittrack_token', data.token);
            
            // Update module state
            this.token = data.token;
            
            return {
                success: true,
                token: data.token
            };
        } catch (error) {
            console.error('Refresh token error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
};

// Initialize auth module when script loads
Auth.init();