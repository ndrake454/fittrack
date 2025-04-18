/**
 * Authentication JavaScript file for FitTrack Exercise App
 * Path: /exercise-app/assets/js/auth.js
 */

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
            // In a real app, this would call the API to authenticate
            // For demo purposes, we'll simulate a successful login
            
            // Simulate API request
            await new Promise(resolve => setTimeout(resolve, 500));
            
            if (!username || !password) {
                throw new Error('Username and password are required');
            }
            
            // Simulate successful login
            const user = {
                user_id: 1,
                username: username,
                email: username + '@example.com',
                weight: 202,
                is_admin: true
            };
            
            const token = 'demo_token_' + Date.now();
            
            // Store in localStorage
            localStorage.setItem('fittrack_user', JSON.stringify(user));
            localStorage.setItem('fittrack_token', token);
            
            // Update module state
            this.user = user;
            this.token = token;
            
            return {
                success: true,
                user: user
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
            // In a real app, this would call the API to register
            // For demo purposes, we'll simulate a successful registration
            
            // Simulate API request
            await new Promise(resolve => setTimeout(resolve, 800));
            
            if (!userData.username || !userData.email || !userData.password) {
                throw new Error('Username, email, and password are required');
            }
            
            // Simulate successful registration
            const user = {
                user_id: 1,
                username: userData.username,
                email: userData.email,
                weight: userData.weight || 0,
                height: userData.height || 0,
                goal: userData.goal || 'strength',
                is_admin: true // For demo, all users are admins
            };
            
            const token = 'demo_token_' + Date.now();
            
            // Store in localStorage
            localStorage.setItem('fittrack_user', JSON.stringify(user));
            localStorage.setItem('fittrack_token', token);
            
            // Update module state
            this.user = user;
            this.token = token;
            
            return {
                success: true,
                user: user
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
            
            // In a real app, this would call the API to update the profile
            // For demo purposes, we'll simulate a successful update
            
            // Simulate API request
            await new Promise(resolve => setTimeout(resolve, 600));
            
            // Update user object with new data
            const updatedUser = {
                ...this.user,
                ...profileData
            };
            
            // Store in localStorage
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
            
            // In a real app, this would call the API to update the password
            // For demo purposes, we'll simulate a successful update
            
            // Simulate API request
            await new Promise(resolve => setTimeout(resolve, 600));
            
            // Simulate password validation
            if (currentPassword === 'wrong') {
                throw new Error('Current password is incorrect');
            }
            
            return {
                success: true,
                message: 'Password updated successfully'
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
            
            // In a real app, this would call the API to refresh the token
            // For demo purposes, we'll simulate a successful refresh
            
            // Simulate API request
            await new Promise(resolve => setTimeout(resolve, 400));
            
            // Generate new token
            const newToken = 'demo_token_' + Date.now();
            
            // Store in localStorage
            localStorage.setItem('fittrack_token', newToken);
            
            // Update module state
            this.token = newToken;
            
            return {
                success: true,
                token: newToken
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