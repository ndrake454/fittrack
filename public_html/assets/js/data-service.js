/**
 * Data Service for FitTrack Exercise App
 * Path: /exercise-app/assets/js/data-service.js
 */

// Data Service module for handling all API calls
const DataService = {
    // Base API URL
    baseUrl: '/api',
    
    /**
     * Make API request
     * @param {string} endpoint - API endpoint
     * @param {string} method - HTTP method (GET, POST, PUT, DELETE)
     * @param {Object} data - Request data
     * @param {boolean} requiresAuth - Whether the endpoint requires authentication
     * @returns {Promise} - Response data
     */
    request: async function(endpoint, method = 'GET', data = null, requiresAuth = true) {
        try {
            const url = this.baseUrl + endpoint;
            
            // Prepare request options
            const options = {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                }
            };
            
            // Add auth header if required and available
            if (requiresAuth && Auth.isAuthenticated()) {
                options.headers = {
                    ...options.headers,
                    ...Auth.getAuthHeader()
                };
            }
            
            // Add request body for POST/PUT requests
            if (data && (method === 'POST' || method === 'PUT')) {
                options.body = JSON.stringify(data);
            }
            
            // Make the request
            const response = await fetch(url, options);
            
            // Handle 401 Unauthorized (token expired)
            if (response.status === 401 && requiresAuth && Auth.isAuthenticated()) {
                // Try to refresh token
                const refreshResult = await Auth.refreshToken();
                
                if (refreshResult.success) {
                    // Retry the request with new token
                    options.headers = {
                        ...options.headers,
                        'Authorization': `Bearer ${refreshResult.token}`
                    };
                    
                    const retryResponse = await fetch(url, options);
                    return await this.handleResponse(retryResponse);
                } else {
                    // Token refresh failed, logout
                    Auth.logout();
                    throw new Error('Session expired. Please login again.');
                }
            }
            
            // Handle the response
            return await this.handleResponse(response);
            
        } catch (error) {
            console.error('API request error:', error);
            throw error;
        }
    },
    
    /**
     * Handle API response
     * @param {Response} response - Fetch response
     * @returns {Promise} - Parsed response data
     */
    handleResponse: async function(response) {
        const data = await response.json();
        
        // Check for error
        if (!response.ok) {
            const error = data.message || response.statusText;
            throw new Error(error);
        }
        
        return data;
    },
    
    //==============================================
    // Workout endpoints
    //==============================================
    
    /**
     * Get all workout plans
     * @returns {Promise} - Workout plans
     */
    getWorkoutPlans: function() {
        return this.request('/workout.php/plans');
    },
    
    /**
     * Get workout plan details
     * @param {number} planId - Plan ID
     * @returns {Promise} - Workout plan details
     */
    getWorkoutPlanDetails: function(planId) {
        return this.request(`/workout.php/plans/${planId}`);
    },
    
    /**
     * Create workout plan
     * @param {Object} planData - Plan data
     * @returns {Promise} - Created plan
     */
    createWorkoutPlan: function(planData) {
        return this.request('/workout.php/plans', 'POST', planData);
    },
    
    /**
     * Update workout plan
     * @param {number} planId - Plan ID
     * @param {Object} planData - Plan data
     * @returns {Promise} - Updated plan
     */
    updateWorkoutPlan: function(planId, planData) {
        return this.request(`/workout.php/plans/${planId}`, 'PUT', planData);
    },
    
    /**
     * Delete workout plan
     * @param {number} planId - Plan ID
     * @returns {Promise} - Response
     */
    deleteWorkoutPlan: function(planId) {
        return this.request(`/workout.php/plans/${planId}`, 'DELETE');
    },
    
    /**
     * Copy template plan
     * @param {number} templateId - Template ID
     * @returns {Promise} - Copied plan
     */
    copyTemplatePlan: function(templateId) {
        return this.request('/workout.php/copy', 'POST', { template_id: templateId });
    },
    
    /**
     * Get workout logs
     * @param {number} limit - Limit
     * @param {number} offset - Offset
     * @returns {Promise} - Workout logs
     */
    getWorkoutLogs: function(limit = 30, offset = 0) {
        return this.request(`/workout.php/logs?limit=${limit}&offset=${offset}`);
    },
    
    /**
     * Get workout log details
     * @param {number} logId - Log ID
     * @returns {Promise} - Workout log details
     */
    getWorkoutLogDetails: function(logId) {
        return this.request(`/workout.php/logs/${logId}`);
    },
    
    /**
     * Log workout
     * @param {Object} logData - Log data
     * @returns {Promise} - Created log
     */
    logWorkout: function(logData) {
        return this.request('/workout.php/logs', 'POST', logData);
    },
    
    /**
     * Delete workout log
     * @param {number} logId - Log ID
     * @returns {Promise} - Response
     */
    deleteWorkoutLog: function(logId) {
        return this.request(`/workout.php/logs/${logId}`, 'DELETE');
    },
    
    /**
     * Get today's workout
     * @returns {Promise} - Today's workout
     */
    getTodaysWorkout: function() {
        return this.request('/workout.php/today');
    },
    
    //==============================================
    // Exercise endpoints
    //==============================================
    
    /**
     * Get all exercises
     * @param {number} categoryId - Category ID (optional)
     * @returns {Promise} - Exercises
     */
    getExercises: function(categoryId = null) {
        let url = '/exercise.php/exercises';
        if (categoryId) {
            url += `?category_id=${categoryId}`;
        }
        return this.request(url);
    },
    
    /**
     * Search exercises
     * @param {string} query - Search query
     * @param {number} categoryId - Category ID (optional)
     * @returns {Promise} - Matching exercises
     */
    searchExercises: function(query, categoryId = null) {
        let url = `/exercise.php/exercises?q=${encodeURIComponent(query)}`;
        if (categoryId) {
            url += `&category_id=${categoryId}`;
        }
        return this.request(url);
    },
    
    /**
     * Get exercise details
     * @param {number} exerciseId - Exercise ID
     * @returns {Promise} - Exercise details
     */
    getExerciseDetails: function(exerciseId) {
        return this.request(`/exercise.php/${exerciseId}`);
    },
    
    /**
     * Get exercise categories
     * @returns {Promise} - Exercise categories
     */
    getExerciseCategories: function() {
        return this.request('/exercise.php/categories');
    },
    
    /**
     * Create exercise (admin only)
     * @param {Object} exerciseData - Exercise data
     * @returns {Promise} - Created exercise
     */
    createExercise: function(exerciseData) {
        return this.request('/exercise.php/exercises', 'POST', exerciseData);
    },
    
    /**
     * Update exercise (admin only)
     * @param {number} exerciseId - Exercise ID
     * @param {Object} exerciseData - Exercise data
     * @returns {Promise} - Updated exercise
     */
    updateExercise: function(exerciseId, exerciseData) {
        return this.request(`/exercise.php/exercises/${exerciseId}`, 'PUT', exerciseData);
    },
    
    /**
     * Delete exercise (admin only)
     * @param {number} exerciseId - Exercise ID
     * @returns {Promise} - Response
     */
    deleteExercise: function(exerciseId) {
        return this.request(`/exercise.php/exercises/${exerciseId}`, 'DELETE');
    },
    
    /**
     * Add personal record
     * @param {number} exerciseId - Exercise ID
     * @param {Object} recordData - Record data
     * @returns {Promise} - Created record
     */
    addPersonalRecord: function(exerciseId, recordData) {
        return this.request('/exercise.php/records', 'POST', {
            exercise_id: exerciseId,
            ...recordData
        });
    },
    
    /**
     * Delete personal record
     * @param {number} recordId - Record ID
     * @returns {Promise} - Response
     */
    deletePersonalRecord: function(recordId) {
        return this.request(`/exercise.php/records/${recordId}`, 'DELETE');
    },
    
    //==============================================
    // User endpoints
    //==============================================
    
    /**
     * Get user profile
     * @returns {Promise} - User profile
     */
    getUserProfile: function() {
        return this.request('/user.php/profile');
    },
    
    /**
     * Update user profile
     * @param {Object} profileData - Profile data
     * @returns {Promise} - Updated profile
     */
    updateUserProfile: function(profileData) {
        return this.request('/user.php/profile', 'PUT', profileData);
    },
    
    /**
     * Update password
     * @param {string} currentPassword - Current password
     * @param {string} newPassword - New password
     * @returns {Promise} - Response
     */
    updatePassword: function(currentPassword, newPassword) {
        return this.request('/user.php/password', 'PUT', {
            current_password: currentPassword,
            new_password: newPassword
        });
    },
    
    /**
     * Get weight history
     * @param {number} limit - Limit
     * @param {number} offset - Offset
     * @returns {Promise} - Weight history
     */
    getWeightHistory: function(limit = 30, offset = 0) {
        return this.request(`/user.php/weight?limit=${limit}&offset=${offset}`);
    },
    
    /**
     * Add weight log
     * @param {number} weight - Weight
     * @param {string} notes - Notes (optional)
     * @returns {Promise} - Created log
     */
    addWeightLog: function(weight, notes = '') {
        return this.request('/user.php/weight', 'POST', { weight, notes });
    },
    
    /**
     * Get BJJ session history
     * @param {number} limit - Limit
     * @param {number} offset - Offset
     * @returns {Promise} - BJJ session history
     */
    getBjjHistory: function(limit = 30, offset = 0) {
        return this.request(`/user.php/bjj?limit=${limit}&offset=${offset}`);
    },
    
    /**
     * Add BJJ session
     * @param {Object} sessionData - Session data
     * @returns {Promise} - Created session
     */
    addBjjSession: function(sessionData) {
        return this.request('/user.php/bjj', 'POST', sessionData);
    },
    
    /**
     * Get BJJ session details
     * @param {number} sessionId - Session ID
     * @returns {Promise} - BJJ session details
     */
    getBjjSessionDetails: function(sessionId) {
        return this.request(`/user.php/bjj/${sessionId}`);
    },
    
    /**
     * Update BJJ session
     * @param {number} sessionId - Session ID
     * @param {Object} sessionData - Session data
     * @returns {Promise} - Updated session
     */
    updateBjjSession: function(sessionId, sessionData) {
        return this.request(`/user.php/bjj/${sessionId}`, 'PUT', sessionData);
    },
    
    /**
     * Delete BJJ session
     * @param {number} sessionId - Session ID
     * @returns {Promise} - Response
     */
    deleteBjjSession: function(sessionId) {
        return this.request(`/user.php/bjj/${sessionId}`, 'DELETE');
    },
    
    //==============================================
    // Progress endpoints
    //==============================================
    
    /**
     * Get workout progress
     * @param {number} days - Number of days to look back
     * @returns {Promise} - Workout progress
     */
    getWorkoutProgress: function(days = 30) {
        return this.request(`/progress.php/workouts?days=${days}`);
    },
    
    /**
     * Get BJJ progress
     * @param {number} days - Number of days to look back
     * @returns {Promise} - BJJ progress
     */
    getBjjProgress: function(days = 30) {
        return this.request(`/progress.php/bjj?days=${days}`);
    },
    
    /**
     * Get weight progress
     * @param {number} days - Number of days to look back
     * @returns {Promise} - Weight progress
     */
    getWeightProgress: function(days = 30) {
        return this.request(`/progress.php/weight?days=${days}`);
    },
    
    /**
     * Get lift progress
     * @param {Array} exerciseIds - Exercise IDs
     * @param {number} limit - Limit
     * @returns {Promise} - Lift progress
     */
    getLiftProgress: function(exerciseIds = [], limit = 10) {
        const exerciseParam = exerciseIds.length > 0 ? `exercises=${exerciseIds.join(',')}` : '';
        return this.request(`/progress.php/lifts?${exerciseParam}&limit=${limit}`);
    },
    
    /**
     * Get overall stats
     * @param {number} days - Number of days to look back
     * @returns {Promise} - Overall stats
     */
    getOverallStats: function(days = 30) {
        return this.request(`/progress.php/stats?days=${days}`);
    },
    
    /**
     * Generate progress report
     * @param {number} days - Number of days to look back
     * @returns {Promise} - Progress report
     */
    generateProgressReport: function(days = 90) {
        return this.request(`/progress.php/report?days=${days}`);
    }
};