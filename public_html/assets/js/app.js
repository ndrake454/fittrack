/**
 * Main JavaScript file for FitTrack Exercise App
 * Path: /exercise-app/assets/js/app.js
 */

// Global app object
const FitTrack = {
    // App state
    state: {
        user: null,
        isLoggedIn: false,
        currentPage: 'dashboard',
        activeWorkout: null,
        workoutTimer: null,
        lastSync: null
    },
    
    // Cache DOM elements
    elements: {
        content: document.getElementById('content'),
        navLinks: document.querySelectorAll('.nav-link'),
        username: document.getElementById('username'),
        loginContainer: document.getElementById('login-container'),
        registerContainer: document.getElementById('register-container'),
        showRegister: document.getElementById('show-register'),
        showLogin: document.getElementById('show-login'),
        loginForm: document.getElementById('login-form'),
        registerForm: document.getElementById('register-form'),
        logoutBtn: document.getElementById('logout-btn')
    },
    
    // Initialize app
    init: function() {
        this.bindEvents();
        this.checkAuth();
        this.setupToastContainer();
    },
    
    // Bind event listeners
    bindEvents: function() {
        // Navigation
        this.elements.navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = link.getAttribute('data-page');
                this.loadPage(page);
            });
        });
        
        // Auth events
        this.elements.showRegister.addEventListener('click', (e) => {
            e.preventDefault();
            this.elements.loginContainer.style.display = 'none';
            this.elements.registerContainer.style.display = 'block';
        });
        
        this.elements.showLogin.addEventListener('click', (e) => {
            e.preventDefault();
            this.elements.registerContainer.style.display = 'none';
            this.elements.loginContainer.style.display = 'block';
        });
        
        this.elements.loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.login();
        });
        
        this.elements.registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.register();
        });
        
        this.elements.logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.logout();
        });
    },
    
    // Check if user is authenticated
    checkAuth: function() {
        const token = localStorage.getItem('fittrack_token');
        const userData = localStorage.getItem('fittrack_user');
        
        if (token && userData) {
            try {
                this.state.user = JSON.parse(userData);
                this.state.isLoggedIn = true;
                this.elements.username.textContent = this.state.user.username;
                
                // Show admin link if user is admin
                if (this.state.user.is_admin) {
                    document.querySelector('.admin-only').style.display = 'block';
                }
                
                this.loadPage('dashboard');
            } catch (error) {
                console.error('Error parsing user data:', error);
                this.logout();
            }
        }
    },
    
    // Login function
login: async function() {
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    
    if (!username || !password) {
        this.showToast('Username and password are required', 'warning');
        return;
    }
    
    // Show loading indicator
    const loginBtn = document.querySelector('#login-form button[type="submit"]');
    const originalText = loginBtn.textContent;
    loginBtn.disabled = true;
    loginBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Logging in...';
    
    // Attempt login
    const result = await Auth.login(username, password);
    
    // Reset button
    loginBtn.disabled = false;
    loginBtn.textContent = originalText;
    
    if (result.success) {
        // Update app state
        this.state.user = result.user;
        this.state.isLoggedIn = true;
        this.elements.username.textContent = result.user.username;
        
        // Show admin link if user is admin
        if (result.user.is_admin) {
            document.querySelector('.admin-only').style.display = 'block';
        }
        
        // Show success message
        this.showToast('Login successful!', 'success');
        
        // Load dashboard
        this.loadPage('dashboard');
    } else {
        // Show error message
        this.showToast(result.error || 'Login failed. Please check your credentials.', 'error');
    }
},

// Register function
register: async function() {
    const username = document.getElementById('register-username').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const weight = document.getElementById('register-weight').value;
    const height = document.getElementById('register-height').value;
    const goal = document.getElementById('register-goal').value;
    
    if (!username || !email || !password) {
        this.showToast('Username, email, and password are required', 'warning');
        return;
    }
    
    // Show loading indicator
    const registerBtn = document.querySelector('#register-form button[type="submit"]');
    const originalText = registerBtn.textContent;
    registerBtn.disabled = true;
    registerBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Registering...';
    
    // Attempt registration
    const result = await Auth.register({
        username,
        email,
        password,
        weight,
        height,
        goal
    });
    
    // Reset button
    registerBtn.disabled = false;
    registerBtn.textContent = originalText;
    
    if (result.success) {
        // Update app state
        this.state.user = result.user;
        this.state.isLoggedIn = true;
        this.elements.username.textContent = result.user.username;
        
        // Show admin link if user is admin
        if (result.user.is_admin) {
            document.querySelector('.admin-only').style.display = 'block';
        }
        
        // Show success message
        this.showToast('Registration successful!', 'success');
        
        // Load dashboard
        this.loadPage('dashboard');
    } else {
        // Show error message
        this.showToast(result.error || 'Registration failed. Please try again.', 'error');
    }
},

// Logout function
logout: function() {
    // Call Auth module logout
    Auth.logout();
    
    // Reset app state
    this.state.user = null;
    this.state.isLoggedIn = false;
    this.elements.username.textContent = 'Guest';
    
    // Hide admin link
    document.querySelector('.admin-only').style.display = 'none';
    
    // Show login page
    this.elements.registerContainer.style.display = 'none';
    this.elements.loginContainer.style.display = 'block';
    this.elements.content.innerHTML = '';
    this.elements.content.appendChild(this.elements.loginContainer);
    
    // Show logout message
    this.showToast('You have been logged out.', 'info');
},
    
    // Load page content
    loadPage: function(page) {
        // Update active nav link
        this.elements.navLinks.forEach(link => {
            if (link.getAttribute('data-page') === page) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
        
        // Update current page
        this.state.currentPage = page;
        
        // If not logged in, show login
        if (!this.state.isLoggedIn) {
            this.elements.content.innerHTML = '';
            this.elements.content.appendChild(this.elements.loginContainer);
            return;
        }
        
        // Show loading spinner
        this.elements.content.innerHTML = `
            <div class="text-center py-5">
                <div class="loading-spinner"></div>
                <p class="mt-3">Loading...</p>
            </div>
        `;
        
        // Fetch page content
        fetch(`pages/${page}.html`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.text();
            })
            .then(html => {
                this.elements.content.innerHTML = html;
                this.initPageScripts(page);
            })
            .catch(error => {
                console.error('Error loading page:', error);
                this.elements.content.innerHTML = `
                    <div class="alert alert-danger m-5" role="alert">
                        Error loading page. Please try again.
                    </div>
                `;
            });
    },
    
    // Initialize page-specific scripts
    initPageScripts: function(page) {
        switch (page) {
            case 'dashboard':
                this.initDashboard();
                break;
            case 'workout':
                this.initWorkoutPage();
                break;
            case 'progress':
                this.initProgressPage();
                break;
            case 'profile':
                this.initProfilePage();
                break;
            case 'admin':
                this.initAdminPage();
                break;
        }
    },
    
    // Initialize dashboard page
initDashboard: async function() {
    console.log('Dashboard initialized');
    
    try {
        // Show loading indicators
        document.querySelectorAll('.chart-container').forEach(container => {
            container.innerHTML = '<div class="text-center py-5"><div class="loading-spinner"></div></div>';
        });
        
        // Fetch dashboard data
        const userProfile = await DataService.getUserProfile();
        const todaysWorkout = await DataService.getTodaysWorkout();
        const recentWorkouts = await DataService.getWorkoutLogs(3, 0);
        const bjjHistory = await DataService.getBjjHistory(3, 0);
        const weightProgress = await DataService.getWeightProgress(30);
        const overallStats = await DataService.getOverallStats(30);
        
        // Update current weight
        const currentWeightElement = document.getElementById('current-weight');
        if (currentWeightElement && userProfile.user) {
            currentWeightElement.textContent = `${userProfile.user.weight} lbs`;
            
            // Set last updated date if available
            if (weightProgress.logs && weightProgress.logs.length > 0) {
                const lastLog = weightProgress.logs[weightProgress.logs.length - 1];
                const lastDate = new Date(lastLog.logged_at);
                document.getElementById('weight-last-updated').textContent = lastDate.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                });
            }
        }
        
        // Initialize charts
        this.initWeightChart(weightProgress.dates, weightProgress.weights);
        this.initWeeklyProgressChart(overallStats.consistency.weeks, overallStats.consistency.counts);
        
        // Setup dashboard event listeners
        const startWorkoutBtn = document.getElementById('start-workout-btn');
        const updateWeightBtn = document.getElementById('update-weight-btn');
        const logBjjBtn = document.getElementById('log-bjj-btn');
        
        if (startWorkoutBtn) {
            startWorkoutBtn.addEventListener('click', () => {
                // Redirect to workout page
                this.loadPage('workout');
            });
        }
        
        if (updateWeightBtn) {
            updateWeightBtn.addEventListener('click', () => {
                // Show update weight modal
                const weightModal = new bootstrap.Modal(document.getElementById('update-weight-modal'));
                weightModal.show();
            });
        }
        
        if (logBjjBtn) {
            logBjjBtn.addEventListener('click', () => {
                // Set today's date as default
                const today = new Date().toISOString().split('T')[0];
                document.getElementById('bjj-date').value = today;
                
                // Show BJJ log modal
                const bjjModal = new bootstrap.Modal(document.getElementById('log-bjj-modal'));
                bjjModal.show();
            });
        }
        
        // Setup form submissions
        const updateWeightForm = document.getElementById('update-weight-form');
        const logBjjForm = document.getElementById('log-bjj-form');
        
        if (updateWeightForm) {
            updateWeightForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.updateWeight();
            });
        }
        
        if (logBjjForm) {
            logBjjForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.logBjjSession();
            });
        }
        
        // Load workout preview
        this.loadWorkoutPreview(todaysWorkout);
        
        // Load recent workouts
        this.loadRecentWorkouts(recentWorkouts.logs);
        
        // Load recent BJJ sessions
        this.loadRecentBjj(bjjHistory.sessions);
        
    } catch (error) {
        console.error('Error initializing dashboard:', error);
        this.showToast('Error loading dashboard data. Please try again.', 'error');
    }
},

// Initialize weight chart on dashboard with real data
initWeightChart: function(dates, weights) {
    const weightChart = document.getElementById('weight-chart');
    if (!weightChart) return;
    
    const data = {
        labels: dates,
        datasets: [{
            label: 'Weight (lbs)',
            data: weights,
            fill: false,
            borderColor: 'rgb(0, 123, 255)',
            tension: 0.1
        }]
    };
    
    const config = {
        type: 'line',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    min: Math.floor(Math.min(...weights) - 2),
                    max: Math.ceil(Math.max(...weights) + 2)
                }
            }
        }
    };
    
    new Chart(weightChart, config);
},

// Initialize weekly progress chart with real data
initWeeklyProgressChart: function(weeks, counts) {
    const progressChart = document.getElementById('weekly-progress-chart');
    if (!progressChart) return;
    
    // Split workout counts into workouts and BJJ sessions
    const workoutCounts = [];
    const bjjCounts = [];
    
    // For demo purpose, we'll split the counts evenly
    // In a real implementation, these would come from separate API data
    for (let i = 0; i < counts.length; i++) {
        if (i % 2 === 0) {
            workoutCounts.push(counts[i]);
            bjjCounts.push(0);
        } else {
            workoutCounts.push(0);
            bjjCounts.push(counts[i]);
        }
    }
    
    const data = {
        labels: weeks,
        datasets: [{
            label: 'Workouts',
            data: workoutCounts,
            backgroundColor: 'rgba(0, 123, 255, 0.5)',
            borderColor: 'rgb(0, 123, 255)',
            borderWidth: 1
        }, {
            label: 'BJJ',
            data: bjjCounts,
            backgroundColor: 'rgba(40, 167, 69, 0.5)',
            borderColor: 'rgb(40, 167, 69)',
            borderWidth: 1
        }]
    };
    
    const config = {
        type: 'bar',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: Math.max(...counts) + 1,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    };
    
    new Chart(progressChart, config);
},

// Load today's workout preview
loadWorkoutPreview: function(todaysWorkout) {
    const workoutPreview = document.getElementById('workout-preview');
    const noWorkoutContainer = document.getElementById('no-workout-container');
    
    if (!workoutPreview || !noWorkoutContainer) return;
    
    if (todaysWorkout.workout) {
        // Show workout preview
        workoutPreview.style.display = 'block';
        noWorkoutContainer.style.display = 'none';
        
        // Set workout name
        const workoutName = document.getElementById('workout-name');
        if (workoutName) {
            workoutName.textContent = `${todaysWorkout.workout.name} - Today`;
        }
        
        // Add exercises
        const workoutExercises = document.getElementById('workout-exercises');
        if (workoutExercises && todaysWorkout.exercises) {
            workoutExercises.innerHTML = '';
            
            todaysWorkout.exercises.forEach(exercise => {
                const previousPerformance = exercise.previous_performance || 'N/A';
                
                const row = `
                    <tr>
                        <td>${exercise.name}</td>
                        <td>${exercise.sets}</td>
                        <td>${exercise.reps}</td>
                        <td>${previousPerformance}</td>
                    </tr>
                `;
                
                workoutExercises.insertAdjacentHTML('beforeend', row);
            });
        }
    } else {
        // Show no workout message
        workoutPreview.style.display = 'none';
        noWorkoutContainer.style.display = 'block';
    }
},

// Load recent workouts
loadRecentWorkouts: function(workouts) {
    const recentWorkouts = document.getElementById('recent-workouts');
    if (!recentWorkouts) return;
    
    if (!workouts || workouts.length === 0) {
        recentWorkouts.innerHTML = '<li class="list-group-item text-center py-4 text-muted">No recent workouts</li>';
        return;
    }
    
    recentWorkouts.innerHTML = '';
    
    workouts.forEach(workout => {
        const date = new Date(workout.completed_at);
        const dateStr = date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
        
        const item = `
            <li class="list-group-item d-flex justify-content-between align-items-center">
                <div>
                    <strong>${workout.workout_name}</strong>
                    <small class="d-block text-muted">${dateStr}</small>
                </div>
                <span class="badge bg-primary rounded-pill">${workout.duration} min</span>
            </li>
        `;
        
        recentWorkouts.insertAdjacentHTML('beforeend', item);
    });
},

// Load recent BJJ sessions
loadRecentBjj: function(sessions) {
    const recentBjj = document.getElementById('recent-bjj');
    if (!recentBjj) return;
    
    if (!sessions || sessions.length === 0) {
        recentBjj.innerHTML = '<li class="list-group-item text-center py-4 text-muted">No recent BJJ sessions</li>';
        return;
    }
    
    recentBjj.innerHTML = '';
    
    sessions.forEach(session => {
        const date = new Date(session.session_date);
        const dateStr = date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        });
        
        const item = `
            <li class="list-group-item d-flex justify-content-between align-items-center">
                <div>
                    <strong>${dateStr}</strong>
                    <small class="d-block text-muted">${session.duration} min</small>
                </div>
                <div>${'★'.repeat(session.rating)}${'☆'.repeat(5 - session.rating)}</div>
            </li>
        `;
        
        recentBjj.insertAdjacentHTML('beforeend', item);
    });
},

// Update weight function using data service
updateWeight: async function() {
    const weightInput = document.getElementById('new-weight');
    const notesInput = document.getElementById('weight-notes');
    
    if (!weightInput) return;
    
    const weight = parseFloat(weightInput.value);
    const notes = notesInput ? notesInput.value : '';
    
    try {
        // Show loading
        const submitBtn = document.querySelector('#update-weight-form button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Updating...';
        
        // Call API to update weight
        await DataService.addWeightLog(weight, notes);
        
        // Update UI
        document.getElementById('current-weight').textContent = `${weight} lbs`;
        
        // Set last updated date
        const now = new Date();
        const dateStr = now.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
        document.getElementById('weight-last-updated').textContent = dateStr;
        
        // Hide modal
        const weightModal = bootstrap.Modal.getInstance(document.getElementById('update-weight-modal'));
        if (weightModal) {
            weightModal.hide();
        }
        
        // Show success message
        this.showToast('Weight updated successfully!', 'success');
        
        // Reset form
        document.getElementById('update-weight-form').reset();
        
    } catch (error) {
        console.error('Error updating weight:', error);
        this.showToast('Error updating weight: ' + error.message, 'error');
    } finally {
        // Reset button
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    }
},

// Log BJJ session function using data service
logBjjSession: async function() {
    const dateInput = document.getElementById('bjj-date');
    const durationInput = document.getElementById('bjj-duration');
    const techniquesInput = document.getElementById('bjj-techniques');
    const notesInput = document.getElementById('bjj-notes');
    const ratingInput = document.getElementById('bjj-rating');
    
    if (!dateInput || !durationInput || !ratingInput) return;
    
    const session = {
        session_date: dateInput.value,
        duration: parseInt(durationInput.value),
        techniques_practiced: techniquesInput ? techniquesInput.value : '',
        notes: notesInput ? notesInput.value : '',
        rating: parseInt(ratingInput.value)
    };
    
    try {
        // Show loading
        const submitBtn = document.querySelector('#log-bjj-form button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Saving...';
        
        // Call API to log session
        await DataService.addBjjSession(session);
        
        // Format date for display
        const sessionDate = new Date(session.session_date);
        const dateStr = sessionDate.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        });
        
        // Add to recent BJJ list
        const recentBjj = document.getElementById('recent-bjj');
        if (recentBjj) {
            // Clear "no sessions" message if present
            if (recentBjj.querySelector('.text-muted')) {
                recentBjj.innerHTML = '';
            }
            
            // Add new session to list
            const sessionHtml = `
                <li class="list-group-item d-flex justify-content-between align-items-center">
                    <div>
                        <strong>${dateStr}</strong>
                        <small class="d-block text-muted">${session.duration} min</small>
                    </div>
                    <div>
                        ${'★'.repeat(session.rating)}${'☆'.repeat(5 - session.rating)}
                    </div>
                </li>
            `;
            recentBjj.insertAdjacentHTML('afterbegin', sessionHtml);
        }
        
        // Hide modal
        const bjjModal = bootstrap.Modal.getInstance(document.getElementById('log-bjj-modal'));
        if (bjjModal) {
            bjjModal.hide();
        }
        
        // Reset form
        document.getElementById('log-bjj-form').reset();
        
        // Show success message
        this.showToast('BJJ session logged successfully!', 'success');
        
    } catch (error) {
        console.error('Error logging BJJ session:', error);
        this.showToast('Error logging BJJ session: ' + error.message, 'error');
    } finally {
        // Reset button
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    }
},
    
    // Load demo data for dashboard
    loadDashboardDemoData: function() {
        // Set current weight
        const currentWeightElement = document.getElementById('current-weight');
        if (currentWeightElement && this.state.user) {
            currentWeightElement.textContent = `${this.state.user.weight} lbs`;
        }
        
        // Add recent workouts
        const recentWorkouts = document.getElementById('recent-workouts');
        if (recentWorkouts) {
            recentWorkouts.innerHTML = `
                <li class="list-group-item d-flex justify-content-between align-items-center">
                    <div>
                        <strong>Workout A</strong>
                        <small class="d-block text-muted">Apr 15, 2025</small>
                    </div>
                    <span class="badge bg-primary rounded-pill">45 min</span>
                </li>
                <li class="list-group-item d-flex justify-content-between align-items-center">
                    <div>
                        <strong>Workout B</strong>
                        <small class="d-block text-muted">Apr 13, 2025</small>
                    </div>
                    <span class="badge bg-primary rounded-pill">52 min</span>
                </li>
                <li class="list-group-item d-flex justify-content-between align-items-center">
                    <div>
                        <strong>Workout A</strong>
                        <small class="d-block text-muted">Apr 10, 2025</small>
                    </div>
                    <span class="badge bg-primary rounded-pill">48 min</span>
                </li>
            `;
        }
        
        // Add recent BJJ sessions
        const recentBjj = document.getElementById('recent-bjj');
        if (recentBjj) {
            recentBjj.innerHTML = `
                <li class="list-group-item d-flex justify-content-between align-items-center">
                    <div>
                        <strong>Apr 14</strong>
                        <small class="d-block text-muted">90 min</small>
                    </div>
                    <div>★★★★☆</div>
                </li>
                <li class="list-group-item d-flex justify-content-between align-items-center">
                    <div>
                        <strong>Apr 12</strong>
                        <small class="d-block text-muted">60 min</small>
                    </div>
                    <div>★★★★★</div>
                </li>
                <li class="list-group-item d-flex justify-content-between align-items-center">
                    <div>
                        <strong>Apr 9</strong>
                        <small class="d-block text-muted">90 min</small>
                    </div>
                    <div>★★★☆☆</div>
                </li>
            `;
        }
        
        // Add today's workout
        const workoutPreview = document.getElementById('workout-preview');
        const noWorkoutContainer = document.getElementById('no-workout-container');
        
        if (workoutPreview && noWorkoutContainer) {
            // Show workout preview (for demo)
            workoutPreview.style.display = 'block';
            noWorkoutContainer.style.display = 'none';
            
            // Set workout name
            const workoutName = document.getElementById('workout-name');
            if (workoutName) {
                workoutName.textContent = 'Workout A - Today';
            }
            
            // Add exercises
            const workoutExercises = document.getElementById('workout-exercises');
            if (workoutExercises) {
                workoutExercises.innerHTML = `
                    <tr>
                        <td>Squat</td>
                        <td>3</td>
                        <td>5</td>
                        <td>185 lbs</td>
                    </tr>
                    <tr>
                        <td>Bench Press</td>
                        <td>3</td>
                        <td>5</td>
                        <td>205 lbs</td>
                    </tr>
                    <tr>
                        <td>Deadlift</td>
                        <td>1</td>
                        <td>5</td>
                        <td>250 lbs</td>
                    </tr>
                `;
            }
        }
    },
    
    // Initialize workout page
    initWorkoutPage: function() {
        console.log('Workout page initialized');
        
        // Setup workout tabs
        const workoutTabs = document.getElementById('workout-tabs');
        if (workoutTabs) {
            workoutTabs.addEventListener('click', (e) => {
                if (e.target.classList.contains('nav-link')) {
                    e.preventDefault();
                    
                    // Update active tab
                    document.querySelectorAll('#workout-tabs .nav-link').forEach(link => {
                        link.classList.remove('active');
                        link.setAttribute('aria-selected', 'false');
                    });
                    
                    e.target.classList.add('active');
                    e.target.setAttribute('aria-selected', 'true');
                    
                    // Show active tab content
                    const targetId = e.target.getAttribute('data-bs-target').substring(1);
                    document.querySelectorAll('.tab-pane').forEach(pane => {
                        pane.classList.remove('show');
                        pane.classList.remove('active');
                    });
                    
                    const targetPane = document.getElementById(targetId);
                    if (targetPane) {
                        targetPane.classList.add('show');
                        targetPane.classList.add('active');
                    }
                }
            });
        }
        
        // Setup start workout button
        const startWorkoutBtn = document.getElementById('start-new-workout-btn');
        if (startWorkoutBtn) {
            startWorkoutBtn.addEventListener('click', () => {
                const startWorkoutModal = new bootstrap.Modal(document.getElementById('start-workout-modal'));
                startWorkoutModal.show();
                this.loadExerciseOptions();
            });
        }
        
        // Load exercise library
        this.loadExerciseLibrary();
        
        // Load workout plans
        this.loadWorkoutPlans();
        
        // Add event listeners for other workout page interactions
        const completeWorkoutBtn = document.getElementById('complete-workout-btn');
        if (completeWorkoutBtn) {
            completeWorkoutBtn.addEventListener('click', this.completeWorkout.bind(this));
        }
        
        // Setup add exercise button in custom workout form
        const addExerciseBtn = document.getElementById('add-exercise-btn');
        if (addExerciseBtn) {
            addExerciseBtn.addEventListener('click', this.addExerciseToCustomWorkout.bind(this));
        }
        
        // Setup custom workout form submission
        const customWorkoutForm = document.getElementById('custom-workout-form');
        if (customWorkoutForm) {
            customWorkoutForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.startCustomWorkout();
            });
        }
        
        // Initialize remove exercise buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('remove-exercise')) {
                const exerciseCard = e.target.closest('.card');
                if (exerciseCard && exerciseCard.parentNode) {
                    exerciseCard.parentNode.removeChild(exerciseCard);
                }
            }
        });
    },
    
    // Load exercise options for custom workout
    loadExerciseOptions: function() {
        const exerciseSelects = document.querySelectorAll('.exercise-select');
        
        // In a real app, this would fetch from the API
        // For demo, we'll use hardcoded values
        const exercises = [
            { id: 1, name: 'Squat' },
            { id: 2, name: 'Bench Press' },
            { id: 3, name: 'Deadlift' },
            { id: 4, name: 'Overhead Press' },
            { id: 5, name: 'Pull-up' },
            { id: 6, name: 'Barbell Row' },
            { id: 7, name: 'Dips' },
            { id: 8, name: 'Lunges' },
            { id: 9, name: 'Plank' },
            { id: 10, name: 'Landmine Press' },
            { id: 11, name: 'Lat Pulldown' }
        ];
        
        exerciseSelects.forEach(select => {
            // Clear existing options except the first placeholder
            while (select.options.length > 1) {
                select.remove(1);
            }
            
            // Add exercise options
            exercises.forEach(exercise => {
                const option = document.createElement('option');
                option.value = exercise.id;
                option.textContent = exercise.name;
                select.appendChild(option);
            });
        });
    },
    
    // Add exercise to custom workout form
    addExerciseToCustomWorkout: function() {
        const customExercises = document.getElementById('custom-exercises');
        if (!customExercises) return;
        
        const exerciseHtml = `
            <div class="card mb-2">
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-4 mb-2">
                            <select class="form-select exercise-select" required>
                                <option value="">Select Exercise</option>
                                <!-- Options will be loaded dynamically -->
                            </select>
                        </div>
                        <div class="col-md-2 mb-2">
                            <input type="number" class="form-control" placeholder="Sets" min="1" required>
                        </div>
                        <div class="col-md-2 mb-2">
                            <input type="text" class="form-control" placeholder="Reps" required>
                        </div>
                        <div class="col-md-3 mb-2">
                            <input type="text" class="form-control" placeholder="Weight (optional)">
                        </div>
                        <div class="col-md-1 mb-2">
                            <button type="button" class="btn btn-outline-danger remove-exercise">×</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        customExercises.insertAdjacentHTML('beforeend', exerciseHtml);
        this.loadExerciseOptions();
    },
    
    // Start a custom workout
    startCustomWorkout: function() {
        const workoutName = document.getElementById('custom-workout-name').value;
        if (!workoutName) return;
        
        // Get exercises from form
        const exercises = [];
        const exerciseCards = document.querySelectorAll('#custom-exercises .card');
        
        exerciseCards.forEach(card => {
            const select = card.querySelector('select');
            const setsInput = card.querySelectorAll('input')[0];
            const repsInput = card.querySelectorAll('input')[1];
            const weightInput = card.querySelectorAll('input')[2];
            
            if (select.value && setsInput.value && repsInput.value) {
                exercises.push({
                    id: select.value,
                    name: select.options[select.selectedIndex].text,
                    sets: parseInt(setsInput.value),
                    reps: repsInput.value,
                    weight: weightInput.value || ''
                });
            }
        });
        
        if (exercises.length === 0) {
            this.showToast('Please add at least one exercise to your workout.', 'warning');
            return;
        }
        
        // Create workout
        const workout = {
            id: Date.now(), // Generate temporary ID
            name: workoutName,
            exercises: exercises
        };
        
        // Start the workout
        this.startWorkout(workout);
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('start-workout-modal'));
        if (modal) {
            modal.hide();
        }
    },
    
    // Start a workout
    startWorkout: function(workout) {
        // Set as active workout
        this.state.activeWorkout = {
            ...workout,
            startTime: new Date(),
            completed: false
        };
        
        // Update UI
        const noActiveWorkout = document.getElementById('no-active-workout');
        const activeWorkout = document.getElementById('active-workout');
        const activeWorkoutName = document.getElementById('active-workout-name');
        
        if (noActiveWorkout && activeWorkout && activeWorkoutName) {
            noActiveWorkout.style.display = 'none';
            activeWorkout.style.display = 'block';
            activeWorkoutName.textContent = workout.name;
        }
        
        // Build exercise list
        const exerciseList = document.getElementById('exercise-list');
        if (exerciseList) {
            exerciseList.innerHTML = '';
            
            workout.exercises.forEach(exercise => {
                const exerciseHtml = `
                    <div class="exercise-card" data-exercise-id="${exercise.id}">
                        <div class="exercise-header">
                            <h5 class="mb-0">${exercise.name}</h5>
                            <button class="btn btn-sm btn-outline-primary log-exercise-btn" data-exercise-id="${exercise.id}" data-exercise-name="${exercise.name}">
                                Log Sets
                            </button>
                        </div>
                        <div class="exercise-body">
                            <div class="mb-2">
                                <strong>${exercise.sets} sets × ${exercise.reps}</strong>
                                ${exercise.weight ? `<span class="ms-2">@ ${exercise.weight}</span>` : ''}
                            </div>
                            <div class="progress">
                                <div class="progress-bar" role="progressbar" style="width: 0%;" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100">0/${exercise.sets}</div>
                            </div>
                        </div>
                    </div>
                `;
                
                exerciseList.insertAdjacentHTML('beforeend', exerciseHtml);
            });
            
            // Add event listeners to log buttons
            document.querySelectorAll('.log-exercise-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const exerciseId = e.target.getAttribute('data-exercise-id');
                    const exerciseName = e.target.getAttribute('data-exercise-name');
                    this.showLogExerciseModal(exerciseId, exerciseName);
                });
            });
        }
        
        // Start workout timer
        this.startWorkoutTimer();
        
        // Show toast
        this.showToast(`Started workout: ${workout.name}`, 'success');
    },
    
    // Start workout timer
    startWorkoutTimer: function() {
        const timerElement = document.getElementById('workout-timer');
        if (!timerElement || !this.state.activeWorkout) return;
        
        // Clear existing timer
        if (this.state.workoutTimer) {
            clearInterval(this.state.workoutTimer);
        }
        
        // Update timer every second
        this.state.workoutTimer = setInterval(() => {
            const now = new Date();
            const startTime = this.state.activeWorkout.startTime;
            const elapsedMs = now - startTime;
            
            // Format time as HH:MM:SS
            const hours = Math.floor(elapsedMs / 3600000).toString().padStart(2, '0');
            const minutes = Math.floor((elapsedMs % 3600000) / 60000).toString().padStart(2, '0');
            const seconds = Math.floor((elapsedMs % 60000) / 1000).toString().padStart(2, '0');
            
            timerElement.textContent = `${hours}:${minutes}:${seconds}`;
        }, 1000);
    },
    
    // Show log exercise modal
    showLogExerciseModal: function(exerciseId, exerciseName) {
        if (!exerciseId || !exerciseName) return;
        
        // Find exercise in active workout
        const exercise = this.state.activeWorkout.exercises.find(ex => ex.id == exerciseId);
        if (!exercise) return;
        
        // Set exercise info in modal
        const nameElement = document.getElementById('log-exercise-name');
        const idElement = document.getElementById('log-exercise-id');
        const setsContainer = document.getElementById('log-sets');
        
        if (nameElement && idElement && setsContainer) {
            nameElement.textContent = exerciseName;
            idElement.value = exerciseId;
            
            // Generate set inputs
            setsContainer.innerHTML = '';
            for (let i = 1; i <= exercise.sets; i++) {
                const setHtml = `
                    <div class="card mb-2">
                        <div class="card-body">
                            <div class="d-flex align-items-center">
                                <div class="set-number">Set ${i}</div>
                                <div class="row flex-grow-1">
                                    <div class="col-md-6 mb-2 mb-md-0">
                                        <input type="number" class="form-control" placeholder="Weight (lbs)" value="${exercise.weight || ''}">
                                    </div>
                                    <div class="col-md-6">
                                        <input type="number" class="form-control" placeholder="Reps" value="${exercise.reps || ''}">
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                setsContainer.insertAdjacentHTML('beforeend', setHtml);
            }
            
            // Setup add set button
            const addSetBtn = document.getElementById('add-set-btn');
            if (addSetBtn) {
                addSetBtn.addEventListener('click', () => {
                    const setNumber = setsContainer.children.length + 1;
                    const setHtml = `
                        <div class="card mb-2">
                            <div class="card-body">
                                <div class="d-flex align-items-center">
                                    <div class="set-number">Set ${setNumber}</div>
                                    <div class="row flex-grow-1">
                                        <div class="col-md-6 mb-2 mb-md-0">
                                            <input type="number" class="form-control" placeholder="Weight (lbs)" value="${exercise.weight || ''}">
                                        </div>
                                        <div class="col-md-6">
                                            <input type="number" class="form-control" placeholder="Reps" value="${exercise.reps || ''}">
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                    setsContainer.insertAdjacentHTML('beforeend', setHtml);
                });
            }
            
            // Setup form submission
            const logExerciseForm = document.getElementById('log-exercise-form');
            if (logExerciseForm) {
                logExerciseForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.logExerciseSets(exerciseId);
                });
            }
            
            // Show modal
            const logExerciseModal = new bootstrap.Modal(document.getElementById('log-exercise-modal'));
            logExerciseModal.show();
        }
    },
    
    // Log exercise sets
    logExerciseSets: function(exerciseId) {
        if (!exerciseId || !this.state.activeWorkout) return;
        
        const exercise = this.state.activeWorkout.exercises.find(ex => ex.id == exerciseId);
        if (!exercise) return;
        
        // Get sets data
        const setCards = document.querySelectorAll('#log-sets .card');
        const sets = [];
        
        setCards.forEach((card, index) => {
            const weightInput = card.querySelectorAll('input')[0];
            const repsInput = card.querySelectorAll('input')[1];
            
            if (weightInput && repsInput) {
                sets.push({
                    setNumber: index + 1,
                    weight: weightInput.value,
                    reps: repsInput.value
                });
            }
        });
        
        // Get notes
        const notesInput = document.getElementById('log-exercise-notes');
        const notes = notesInput ? notesInput.value : '';
        
        // Check if PR checkbox is checked
        const markPrCheckbox = document.getElementById('mark-pr');
        const isPR = markPrCheckbox && markPrCheckbox.checked;
        
        // In a real app, this would call the API to save the exercise log
        // For demo, we'll update the UI
        
        // Update progress bar
        const exerciseCard = document.querySelector(`.exercise-card[data-exercise-id="${exerciseId}"]`);
        if (exerciseCard) {
            const progressBar = exerciseCard.querySelector('.progress-bar');
            if (progressBar) {
                const setsCompleted = sets.length;
                const progress = Math.min(100, (setsCompleted / exercise.sets) * 100);
                
                progressBar.style.width = `${progress}%`;
                progressBar.setAttribute('aria-valuenow', progress);
                progressBar.textContent = `${setsCompleted}/${exercise.sets}`;
            }
        }
        
        // If marked as PR, update PR table
        if (isPR) {
            this.addPersonalRecord(exerciseId, sets);
        }
        
        // Hide modal
        const logExerciseModal = bootstrap.Modal.getInstance(document.getElementById('log-exercise-modal'));
        if (logExerciseModal) {
            logExerciseModal.hide();
        }
        
        // Show success message
        this.showToast('Exercise sets logged successfully!', 'success');
    },
    
    // Add personal record
    addPersonalRecord: function(exerciseId, sets) {
        // Find best set (highest weight × reps)
        let bestSet = null;
        let bestVolume = 0;
        
        sets.forEach(set => {
            const weight = parseFloat(set.weight) || 0;
            const reps = parseInt(set.reps) || 0;
            const volume = weight * reps;
            
            if (volume > bestVolume) {
                bestVolume = volume;
                bestSet = set;
            }
        });
        
        if (!bestSet) return;
        
        // Get exercise name
        const exerciseName = document.querySelector(`[data-exercise-id="${exerciseId}"]`)?.querySelector('h5')?.textContent;
        if (!exerciseName) return;
        
        // Update PR table on dashboard (when we return to it)
        const prData = {
            exerciseId,
            exerciseName,
            weight: bestSet.weight,
            reps: bestSet.reps,
            date: new Date()
        };
        
        // In a real app, this would be saved to the database
        // For demo, we'll keep it in memory
        
        // Show success message
        this.showToast(`New personal record for ${exerciseName}!`, 'success');
    },
    
    // Complete workout
    completeWorkout: function() {
        if (!this.state.activeWorkout) return;
        
        // Stop timer
        if (this.state.workoutTimer) {
            clearInterval(this.state.workoutTimer);
            this.state.workoutTimer = null;
        }
        
        // Calculate workout duration
        const now = new Date();
        const startTime = this.state.activeWorkout.startTime;
        const durationMs = now - startTime;
        const durationMinutes = Math.floor(durationMs / 60000);
        
        // In a real app, this would call the API to save the workout log
        // For demo, we'll just update the UI
        
        // Reset UI
        const noActiveWorkout = document.getElementById('no-active-workout');
        const activeWorkout = document.getElementById('active-workout');
        
        if (noActiveWorkout && activeWorkout) {
            activeWorkout.style.display = 'none';
            noActiveWorkout.style.display = 'block';
        }
        
        // Clear active workout
        this.state.activeWorkout = null;
        
        // Show success message
        this.showToast(`Workout completed in ${durationMinutes} minutes!`, 'success');
        
        // Return to dashboard
        this.loadPage('dashboard');
    },
    
    // Load exercise library
    loadExerciseLibrary: function() {
        const exerciseLibrary = document.getElementById('exercise-library');
        if (!exerciseLibrary) return;
        
        // In a real app, this would fetch from the API
        // For demo, we'll use hardcoded values
        const exercises = [
            { id: 1, name: 'Squat', category: 'Compound Movements', equipment: 'Barbell, Squat Rack', muscleGroup: 'Quadriceps, Glutes, Hamstrings', isCompound: true },
            { id: 2, name: 'Bench Press', category: 'Upper Body Push', equipment: 'Barbell, Bench', muscleGroup: 'Chest, Shoulders, Triceps', isCompound: true },
            { id: 3, name: 'Deadlift', category: 'Compound Movements', equipment: 'Barbell', muscleGroup: 'Back, Glutes, Hamstrings', isCompound: true },
            { id: 4, name: 'Overhead Press', category: 'Upper Body Push', equipment: 'Barbell', muscleGroup: 'Shoulders, Triceps', isCompound: true },
            { id: 5, name: 'Pull-up', category: 'Upper Body Pull', equipment: 'Pull-up Bar', muscleGroup: 'Back, Biceps', isCompound: true },
            { id: 6, name: 'Barbell Row', category: 'Upper Body Pull', equipment: 'Barbell', muscleGroup: 'Back, Biceps', isCompound: true },
            { id: 7, name: 'Dips', category: 'Upper Body Push', equipment: 'Dip Bars', muscleGroup: 'Chest, Triceps, Shoulders', isCompound: true },
            { id: 8, name: 'Lunges', category: 'Lower Body', equipment: 'Bodyweight, Dumbbells', muscleGroup: 'Quadriceps, Glutes, Hamstrings', isCompound: false },
            { id: 9, name: 'Plank', category: 'Core', equipment: 'None', muscleGroup: 'Core', isCompound: false },
            { id: 10, name: 'Landmine Press', category: 'Upper Body Push', equipment: 'Barbell, Landmine', muscleGroup: 'Shoulders, Chest, Triceps', isCompound: false },
            { id: 11, name: 'Lat Pulldown', category: 'Upper Body Pull', equipment: 'Cable Machine', muscleGroup: 'Back, Biceps', isCompound: false }
        ];
        
        // Generate exercise cards
        let html = '';
        exercises.forEach(exercise => {
            html += `
                <div class="col-md-4 col-lg-3 mb-4">
                    <div class="card h-100 exercise-item" data-exercise-id="${exercise.id}">
                        <div class="card-body text-center">
                            <div class="exercise-icon">
                                <i class="fas fa-dumbbell"></i>
                            </div>
                            <h5 class="card-title">${exercise.name}</h5>
                            <p class="card-text text-muted small">${exercise.category}</p>
                            <button class="btn btn-sm btn-outline-primary view-exercise-btn" data-exercise-id="${exercise.id}">View Details</button>
                        </div>
                    </div>
                </div>
            `;
        });
        
        exerciseLibrary.innerHTML = html;
        
        // Add event listeners to view buttons
        document.querySelectorAll('.view-exercise-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const exerciseId = e.target.getAttribute('data-exercise-id');
                this.showExerciseDetails(exerciseId, exercises);
            });
        });
    },
    
    // Show exercise details
    showExerciseDetails: function(exerciseId, exercises) {
        if (!exerciseId) return;
        
        // Find exercise
        const exercise = exercises.find(ex => ex.id == exerciseId);
        if (!exercise) return;
        
        // Set exercise details in modal
        document.getElementById('exercise-detail-name').textContent = exercise.name;
        document.getElementById('exercise-detail-description').textContent = exercise.description || 'No description available.';
        document.getElementById('exercise-detail-instructions').textContent = exercise.instructions || 'No instructions available.';
        document.getElementById('exercise-detail-muscles').textContent = exercise.muscleGroup;
        document.getElementById('exercise-detail-equipment').textContent = exercise.equipment;
        
        // Show modal
        const exerciseDetailsModal = new bootstrap.Modal(document.getElementById('exercise-details-modal'));
        exerciseDetailsModal.show();
        
        // Add event listener to Add to Workout button
        const addToWorkoutBtn = document.getElementById('add-to-workout-btn');
        if (addToWorkoutBtn) {
            addToWorkoutBtn.setAttribute('data-exercise-id', exerciseId);
            addToWorkoutBtn.addEventListener('click', () => {
                // This would add the exercise to the current workout
                // For demo purposes, we'll just show a toast
                this.showToast(`Added ${exercise.name} to workout!`, 'success');
                exerciseDetailsModal.hide();
            });
        }
    },
    
    // Load workout plans
    loadWorkoutPlans: function() {
        const workoutPlansContainer = document.getElementById('workout-plans-container');
        if (!workoutPlansContainer) return;
        
        // In a real app, this would fetch from the API
        // For demo, we'll use hardcoded values
        const plans = [
            {
                id: 1,
                name: 'Starting Strength',
                description: 'A beginner-friendly strength program focusing on compound movements',
                frequency: 3,
                goal: 'Strength',
                isTemplate: true,
                workouts: [
                    { id: 1, name: 'Workout A', day: 1 },
                    { id: 2, name: 'Workout B', day: 3 },
                    { id: 3, name: 'Workout A (repeat)', day: 5 }
                ]
            },
            {
                id: 2,
                name: 'Advanced Strength',
                description: 'A more varied strength program with additional exercises',
                frequency: 4,
                goal: 'Strength & Hypertrophy',
                isTemplate: true,
                workouts: [
                    { id: 4, name: 'Lower Body Focus', day: 1 },
                    { id: 5, name: 'Upper Body Push', day: 3 },
                    { id: 6, name: 'Lower Body & Back', day: 5 },
                    { id: 7, name: 'Upper Body Pull', day: 7 }
                ]
            }
        ];
        
        // Generate plan cards
        let html = '';
        plans.forEach(plan => {
            html += `
                <div class="col-md-6 mb-4">
                    <div class="card h-100">
                        <div class="card-header d-flex justify-content-between align-items-center">
                            <h5 class="mb-0">${plan.name}</h5>
                            <span class="badge bg-primary">${plan.frequency}x/week</span>
                        </div>
                        <div class="card-body">
                            <p>${plan.description}</p>
                            <h6>Workouts:</h6>
                            <ul class="list-group list-group-flush mb-3">
                                ${plan.workouts.map(workout => `
                                    <li class="list-group-item d-flex justify-content-between align-items-center">
                                        ${workout.name}
                                        <span class="badge bg-light text-dark">Day ${workout.day}</span>
                                    </li>
                                `).join('')}
                            </ul>
                            <div class="d-grid">
                                <button class="btn btn-primary select-plan-btn" data-plan-id="${plan.id}">Select Plan</button>
                            </div>
                        </div>
                        <div class="card-footer text-muted">
                            Goal: ${plan.goal}
                        </div>
                    </div>
                </div>
            `;
        });
        
        workoutPlansContainer.innerHTML = html;
        
        // Add event listeners to select buttons
        document.querySelectorAll('.select-plan-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const planId = e.target.getAttribute('data-plan-id');
                this.selectWorkoutPlan(planId, plans);
            });
        });
    },
    
    // Select workout plan
    selectWorkoutPlan: function(planId, plans) {
        if (!planId) return;
        
        // Find plan
        const plan = plans.find(p => p.id == planId);
        if (!plan) return;
        
        // In a real app, this would call the API to assign the plan to the user
        // For demo, we'll just show a toast
        
        this.showToast(`Selected workout plan: ${plan.name}`, 'success');
        
        // Redirect to dashboard
        this.loadPage('dashboard');
    },
    
    // Initialize progress page
    initProgressPage: function() {
        console.log('Progress page initialized');
        
        // Initialize charts
        this.initWorkoutsChart();
        this.initWeightProgressChart();
        this.initKeyLiftsChart();
        this.initBjjSessionsChart();
        
        // Load workout history with demo data
        this.loadWorkoutHistory();
        
        // Setup time range buttons
        document.querySelectorAll('[data-time-range]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Update active button
                document.querySelectorAll('[data-time-range]').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                
                // Get time range
                const days = parseInt(e.target.getAttribute('data-time-range'));
                
                // Update charts with new time range (in a real app)
                // For demo, we'll just show a toast
                this.showToast(`Updated to show past ${days} days`, 'info');
            });
        });
        
        // Setup workout history modals
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('view-workout-btn')) {
                const workoutId = e.target.getAttribute('data-workout-id');
                this.showWorkoutDetails(workoutId);
            }
        });
        
        // Setup view all weights button
        const viewAllWeightsBtn = document.getElementById('view-all-weights-btn');
        if (viewAllWeightsBtn) {
            viewAllWeightsBtn.addEventListener('click', () => {
                const weightsModal = new bootstrap.Modal(document.getElementById('all-weights-modal'));
                weightsModal.show();
                this.initWeightHistoryChart();
            });
        }
        
        // Setup view all BJJ button
        const viewAllBjjBtn = document.getElementById('view-all-bjj-btn');
        if (viewAllBjjBtn) {
            viewAllBjjBtn.addEventListener('click', () => {
                const bjjModal = new bootstrap.Modal(document.getElementById('all-bjj-modal'));
                bjjModal.show();
            });
        }
    },
    
    // Initialize workouts chart
    initWorkoutsChart: function() {
        const workoutsChart = document.getElementById('workouts-chart');
        if (!workoutsChart) return;
        
        // Sample data for past 30 days
        const dates = [];
        const today = new Date();
        for (let i = 29; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            dates.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        }
        
        // Generate random workout data (1 for workout day, 0 for rest day)
        const workoutData = Array(30).fill().map(() => Math.random() > 0.6 ? 1 : 0);
        
        const data = {
            labels: dates,
            datasets: [{
                label: 'Workouts',
                data: workoutData,
                backgroundColor: 'rgba(0, 123, 255, 0.5)',
                borderColor: 'rgb(0, 123, 255)',
                borderWidth: 1
            }]
        };
        
        const config = {
            type: 'bar',
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 1,
                        ticks: {
                            stepSize: 1,
                            callback: function(value) {
                                return value === 0 ? 'Rest' : 'Workout';
                            }
                        }
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: 'Workout Frequency'
                    },
                    legend: {
                        display: false
                    }
                }
            }
        };
        
        new Chart(workoutsChart, config);
    },
    
    // Initialize weight progress chart
    initWeightProgressChart: function() {
        const weightChart = document.getElementById('weight-progress-chart');
        if (!weightChart) return;
        
        // Sample data for past 30 days
        const dates = [];
        const today = new Date();
        for (let i = 29; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            dates.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        }
        
        // Generate weight data starting from 210 lbs with slight variations
        // gradually decreasing to current weight of 202 lbs
        const weightData = [];
        let currentWeight = 210;
        const targetWeight = 202;
        
        dates.forEach((date, index) => {
            // Gradually decrease weight with some random fluctuation
            const decrease = (210 - targetWeight) / 30;
            const randomFactor = (Math.random() - 0.5) * 1; // Random fluctuation between -0.5 and 0.5 lbs
            
            currentWeight = Math.max(currentWeight - decrease + randomFactor, targetWeight);
            weightData.push(currentWeight.toFixed(1));
        });
        
        const data = {
            labels: dates,
            datasets: [{
                label: 'Weight (lbs)',
                data: weightData,
                fill: false,
                borderColor: 'rgb(40, 167, 69)',
                tension: 0.1
            }]
        };
        
        const config = {
            type: 'line',
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        min: Math.floor(Math.min(...weightData.map(w => parseFloat(w))) - 2),
                        max: Math.ceil(Math.max(...weightData.map(w => parseFloat(w))) + 2)
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: 'Weight Progress'
                    },
                    legend: {
                        display: false
                    }
                }
            }
        };
        
        new Chart(weightChart, config);
    },
    
    // Initialize key lifts chart
    initKeyLiftsChart: function() {
        const liftsChart = document.getElementById('key-lifts-chart');
        if (!liftsChart) return;
        
        // Sample data for past 10 workouts for each lift
        const labels = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
        
        // Generate progress data for bench press, deadlift, and squat
        const benchData = [195, 200, 200, 205, 205, 210, 210, 215, 215, 225];
        const deadliftData = [225, 230, 235, 240, 240, 245, 250, 250, 255, 260];
        const squatData = [185, 190, 195, 195, 200, 205, 210, 210, 215, 220];
        
        const data = {
            labels: labels,
            datasets: [
                {
                    label: 'Bench Press',
                    data: benchData,
                    borderColor: 'rgb(0, 123, 255)',
                    tension: 0.1
                },
                {
                    label: 'Deadlift',
                    data: deadliftData,
                    borderColor: 'rgb(220, 53, 69)',
                    tension: 0.1
                },
                {
                    label: 'Squat',
                    data: squatData,
                    borderColor: 'rgb(40, 167, 69)',
                    tension: 0.1
                }
            ]
        };
        
        const config = {
            type: 'line',
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Key Lifts Progress (lbs)'
                    }
                }
            }
        };
        
        new Chart(liftsChart, config);
    },
    
    // Initialize BJJ sessions chart
    initBjjSessionsChart: function() {
        const bjjChart = document.getElementById('bjj-sessions-chart');
        if (!bjjChart) return;
        
        // Sample data for past 10 weeks
        const labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Week 7', 'Week 8', 'Week 9', 'Week 10'];
        
        // Generate session counts for each week (1-3 sessions per week)
        const sessionCounts = [1, 2, 2, 3, 1, 2, 3, 2, 2, 2];
        
        const data = {
            labels: labels,
            datasets: [{
                label: 'BJJ Sessions',
                data: sessionCounts,
                backgroundColor: 'rgba(23, 162, 184, 0.5)',
                borderColor: 'rgb(23, 162, 184)',
                borderWidth: 1
            }]
        };
        
        const config = {
            type: 'bar',
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 5,
                        ticks: {
                            stepSize: 1
                        }
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: 'BJJ Sessions Per Week'
                    },
                    legend: {
                        display: false
                    }
                }
            }
        };
        
        new Chart(bjjChart, config);
    },
    
    // Initialize weight history chart
    initWeightHistoryChart: function() {
        const weightHistoryChart = document.getElementById('weight-history-chart');
        if (!weightHistoryChart) return;
        
        // Sample data for past 90 days
        const dates = [];
        const today = new Date();
        for (let i = 89; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            dates.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        }
        
        // Generate weight data starting from 210 lbs with slight variations
        // gradually decreasing to current weight of 202 lbs
        const weightData = [];
        let currentWeight = 210;
        const targetWeight = 202;
        
        dates.forEach((date, index) => {
            // Gradually decrease weight with some random fluctuation
            const decrease = (210 - targetWeight) / 90;
            const randomFactor = (Math.random() - 0.5) * 1; // Random fluctuation between -0.5 and 0.5 lbs
            
            currentWeight = Math.max(currentWeight - decrease + randomFactor, targetWeight);
            weightData.push(currentWeight.toFixed(1));
        });
        
        const data = {
            labels: dates,
            datasets: [{
                label: 'Weight (lbs)',
                data: weightData,
                fill: false,
                borderColor: 'rgb(40, 167, 69)',
                tension: 0.1
            }]
        };
        
        const config = {
            type: 'line',
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        ticks: {
                            maxTicksLimit: 10
                        }
                    },
                    y: {
                        min: Math.floor(Math.min(...weightData.map(w => parseFloat(w))) - 2),
                        max: Math.ceil(Math.max(...weightData.map(w => parseFloat(w))) + 2)
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: 'Weight History (90 Days)'
                    },
                    legend: {
                        display: false
                    }
                }
            }
        };
        
        new Chart(weightHistoryChart, config);
        
        // Generate weight history table
        const weightHistoryTable = document.getElementById('all-weight-history');
        if (weightHistoryTable) {
            weightHistoryTable.innerHTML = '';
            
            // Show every 10th day for simplicity
            for (let i = 0; i < weightData.length; i += 10) {
                const weight = parseFloat(weightData[i]);
                const prevWeight = i > 0 ? parseFloat(weightData[i - 10]) : weight;
                const change = weight - prevWeight;
                
                const changeClass = change < 0 ? 'text-success' : change > 0 ? 'text-danger' : 'text-muted';
                const changeStr = change !== 0 ? (change > 0 ? '+' : '') + change.toFixed(1) : '0';
                
                const row = `
                    <tr>
                        <td>${dates[i]}</td>
                        <td>${weightData[i]} lbs</td>
                        <td class="${changeClass}">${changeStr} lbs</td>
                        <td><small class="text-muted">Sample note</small></td>
                    </tr>
                `;
                
                weightHistoryTable.insertAdjacentHTML('beforeend', row);
            }
        }
    },
    
    // Load workout history
    loadWorkoutHistory: function() {
        const workoutHistory = document.getElementById('workout-history');
        if (!workoutHistory) return;
        
        // In a real app, this would fetch from the API
        // For demo, we'll use hardcoded values
        const workouts = [
            { id: 1, date: 'Apr 15, 2025', name: 'Workout A', duration: 45, volume: 10250, rating: 4 },
            { id: 2, date: 'Apr 13, 2025', name: 'Workout B', duration: 52, volume: 9800, rating: 5 },
            { id: 3, date: 'Apr 10, 2025', name: 'Workout A', duration: 48, volume: 9750, rating: 3 },
            { id: 4, date: 'Apr 8, 2025', name: 'Workout B', duration: 50, volume: 9700, rating: 4 },
            { id: 5, date: 'Apr 6, 2025', name: 'Workout A', duration: 42, volume: 9650, rating: 4 },
            { id: 6, date: 'Apr 3, 2025', name: 'Workout B', duration: 55, volume: 9600, rating: 3 },
            { id: 7, date: 'Apr 1, 2025', name: 'Workout A', duration: 47, volume: 9550, rating: 5 },
            { id: 8, date: 'Mar 29, 2025', name: 'Workout B', duration: 53, volume: 9500, rating: 4 },
            { id: 9, date: 'Mar 27, 2025', name: 'Workout A', duration: 49, volume: 9450, rating: 4 },
            { id: 10, date: 'Mar 24, 2025', name: 'Workout B', duration: 51, volume: 9400, rating: 3 }
        ];
        
        // Generate workout history table
        workoutHistory.innerHTML = '';
        
        workouts.forEach(workout => {
            const row = `
                <tr>
                    <td>${workout.date}</td>
                    <td>${workout.name}</td>
                    <td>${workout.duration} min</td>
                    <td>${workout.volume.toLocaleString()} lbs</td>
                    <td>${'★'.repeat(workout.rating)}${'☆'.repeat(5 - workout.rating)}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary view-workout-btn" data-workout-id="${workout.id}">View</button>
                    </td>
                </tr>
            `;
            
            workoutHistory.insertAdjacentHTML('beforeend', row);
        });
        
        // Also load weight history and BJJ history
        this.loadWeightHistory();
        this.loadBjjHistory();
        
        // Update statistics
        document.getElementById('stats-workouts').textContent = '24';
        document.getElementById('stats-weight').textContent = '-8 lbs';
        document.getElementById('stats-bjj').textContent = '12';
        document.getElementById('stats-prs').textContent = '6';
        document.getElementById('stats-volume').textContent = '96,500';
    },
    
    // Load weight history
    loadWeightHistory: function() {
        const weightHistory = document.getElementById('weight-history');
        if (!weightHistory) return;
        
        // Sample weight data
        const weights = [
            { date: 'Apr 15, 2025', weight: 202.0, change: -0.5 },
            { date: 'Apr 8, 2025', weight: 202.5, change: -1.0 },
            { date: 'Apr 1, 2025', weight: 203.5, change: -1.5 },
            { date: 'Mar 25, 2025', weight: 205.0, change: -2.0 },
            { date: 'Mar 18, 2025', weight: 207.0, change: -1.0 }
        ];
        
        // Generate weight history list
        weightHistory.innerHTML = '';
        
        weights.forEach(entry => {
            const changeClass = entry.change < 0 ? 'text-success' : entry.change > 0 ? 'text-danger' : 'text-muted';
            const changeStr = entry.change !== 0 ? (entry.change > 0 ? '+' : '') + entry.change.toFixed(1) : '0';
            
            const item = `
                <div class="list-group-item d-flex justify-content-between align-items-center">
                    <div>
                        <strong>${entry.weight.toFixed(1)} lbs</strong>
                        <small class="d-block text-muted">${entry.date}</small>
                    </div>
                    <span class="badge ${changeClass}">${changeStr} lbs</span>
                </div>
            `;
            
            weightHistory.insertAdjacentHTML('beforeend', item);
        });
    },
    
    // Load BJJ history
    loadBjjHistory: function() {
        const bjjHistory = document.getElementById('bjj-history');
        if (!bjjHistory) return;
        
        // Sample BJJ session data
        const sessions = [
            { id: 1, date: 'Apr 14, 2025', duration: 90, rating: 4 },
            { id: 2, date: 'Apr 12, 2025', duration: 60, rating: 5 },
            { id: 3, date: 'Apr 9, 2025', duration: 90, rating: 3 },
            { id: 4, date: 'Apr 7, 2025', duration: 60, rating: 4 },
            { id: 5, date: 'Apr 4, 2025', duration: 90, rating: 5 }
        ];
        
        // Generate BJJ history list
        bjjHistory.innerHTML = '';
        
        sessions.forEach(session => {
            const item = `
                <div class="list-group-item d-flex justify-content-between align-items-center">
                    <div>
                        <strong>${session.date}</strong>
                        <small class="d-block text-muted">${session.duration} min</small>
                    </div>
                    <div>${'★'.repeat(session.rating)}${'☆'.repeat(5 - session.rating)}</div>
                </div>
            `;
            
            bjjHistory.insertAdjacentHTML('beforeend', item);
        });
        
        // Also load all BJJ history modal table
        const allBjjHistory = document.getElementById('all-bjj-history');
        if (allBjjHistory) {
            allBjjHistory.innerHTML = '';
            
            // Add more sessions for the all history view
            const allSessions = [
                ...sessions,
                { id: 6, date: 'Apr 2, 2025', duration: 90, rating: 4 },
                { id: 7, date: 'Mar 30, 2025', duration: 60, rating: 3 },
                { id: 8, date: 'Mar 28, 2025', duration: 90, rating: 5 },
                { id: 9, date: 'Mar 25, 2025', duration: 60, rating: 4 },
                { id: 10, date: 'Mar 23, 2025', duration: 90, rating: 3 }
            ];
            
            allSessions.forEach(session => {
                const row = `
                    <tr>
                        <td>${session.date}</td>
                        <td>${session.duration} min</td>
                        <td>${'★'.repeat(session.rating)}${'☆'.repeat(5 - session.rating)}</td>
                        <td>
                            <button class="btn btn-sm btn-outline-primary view-bjj-btn" data-session-id="${session.id}">View</button>
                        </td>
                    </tr>
                `;
                
                allBjjHistory.insertAdjacentHTML('beforeend', row);
            });
            
            // Add event listeners to view buttons
            document.querySelectorAll('.view-bjj-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const sessionId = e.target.getAttribute('data-session-id');
                    this.showBjjSessionDetails(sessionId);
                });
            });
        }
    },
    
    // Show workout details
    showWorkoutDetails: function(workoutId) {
        if (!workoutId) return;
        
        // In a real app, this would fetch the workout details from the API
        // For demo, we'll use hardcoded values
        const workout = {
            id: workoutId,
            name: `Workout ${workoutId % 2 === 1 ? 'A' : 'B'}`,
            date: 'April 15, 2025',
            duration: 45,
            rating: 4,
            volume: 10250,
            notes: 'Felt strong today. Increased weight on bench press and deadlift.',
            exercises: [
                { name: 'Squat', sets: 3, reps: '5, 5, 5', weight: '185, 185, 185', volume: 2775 },
                { name: 'Bench Press', sets: 3, reps: '5, 5, 5', weight: '205, 205, 205', volume: 3075 },
                { name: 'Deadlift', sets: 1, reps: '5', weight: '250', volume: 1250 },
                { name: 'Pull-ups', sets: 3, reps: '8, 7, 6', weight: 'BW', volume: 0 },
                { name: 'Dips', sets: 3, reps: '10, 10, 8', weight: 'BW', volume: 0 }
            ]
        };
        
        // Set workout details in modal
        document.getElementById('workout-detail-title').textContent = `${workout.name} Details`;
        document.getElementById('workout-detail-date').textContent = workout.date;
        document.getElementById('workout-detail-duration').textContent = `${workout.duration} minutes`;
        document.getElementById('workout-detail-rating').textContent = '★'.repeat(workout.rating) + '☆'.repeat(5 - workout.rating);
        document.getElementById('workout-detail-volume').textContent = `${workout.volume.toLocaleString()} lbs`;
        document.getElementById('workout-detail-notes').textContent = workout.notes || 'No notes';
        
        // Generate exercise details
        const exercisesTable = document.getElementById('workout-detail-exercises');
        if (exercisesTable) {
            exercisesTable.innerHTML = '';
            
            workout.exercises.forEach(exercise => {
                const row = `
                    <tr>
                        <td>${exercise.name}</td>
                        <td>${exercise.sets}</td>
                        <td>${exercise.reps}</td>
                        <td>${exercise.weight}</td>
                        <td>${exercise.volume ? exercise.volume.toLocaleString() + ' lbs' : 'N/A'}</td>
                    </tr>
                `;
                
                exercisesTable.insertAdjacentHTML('beforeend', row);
            });
        }
        
        // Show modal
        const workoutDetailModal = new bootstrap.Modal(document.getElementById('workout-detail-modal'));
        workoutDetailModal.show();
    },
    
    // Show BJJ session details
    showBjjSessionDetails: function(sessionId) {
        if (!sessionId) return;
        
        // In a real app, this would fetch the session details from the API
        // For demo, we'll use hardcoded values
        const session = {
            id: sessionId,
            date: 'April 14, 2025',
            duration: 90,
            rating: 4,
            techniques: 'Triangle from guard, Armbar transitions, Collar chokes',
            notes: 'Good session today. Worked on transitions from guard to submission. Partner was helpful with feedback.'
        };
        
        // Set session details in modal
        document.getElementById('bjj-detail-date').textContent = session.date;
        document.getElementById('bjj-detail-duration').textContent = `${session.duration} minutes`;
        document.getElementById('bjj-detail-rating').textContent = '★'.repeat(session.rating) + '☆'.repeat(5 - session.rating);
        document.getElementById('bjj-detail-techniques').textContent = session.techniques || 'No techniques recorded';
        document.getElementById('bjj-detail-notes').textContent = session.notes || 'No notes';
        
        // Show modal
        const bjjDetailModal = new bootstrap.Modal(document.getElementById('bjj-detail-modal'));
        bjjDetailModal.show();
    },
    
    // Initialize profile page
    initProfilePage: function() {
        console.log('Profile page initialized');
        
        // TODO: Implement profile page functionality
    },
    
    // Initialize admin page
    initAdminPage: function() {
        console.log('Admin page initialized');
        
        // Setup admin navigation
        document.querySelectorAll('.list-group-item-action').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Update active item
                document.querySelectorAll('.list-group-item-action').forEach(i => {
                    i.classList.remove('active');
                });
                e.target.classList.add('active');
                
                // Show corresponding section
                const sectionId = e.target.getAttribute('data-section');
                document.querySelectorAll('.admin-section').forEach(section => {
                    section.style.display = 'none';
                });
                document.getElementById(`${sectionId}-section`).style.display = 'block';
            });
        });
        
        // Load admin data
        this.loadAdminWorkouts();
        this.loadAdminExercises();
        this.loadTemplateWorkouts();
        
        // Setup form submissions
        const workoutSettingsForm = document.getElementById('workout-settings-form');
        const profileSettingsForm = document.getElementById('profile-settings-form');
        
        if (workoutSettingsForm) {
            workoutSettingsForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveWorkoutSettings();
            });
        }
        
        if (profileSettingsForm) {
            profileSettingsForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveProfileSettings();
            });
        }
        
        // Setup add/edit buttons
        document.getElementById('add-new-exercise-btn')?.addEventListener('click', this.showAddExerciseModal.bind(this));
        document.getElementById('create-new-workout-btn')?.addEventListener('click', this.showCreateWorkoutModal.bind(this));
        document.getElementById('create-template-btn')?.addEventListener('click', this.showCreateTemplateModal.bind(this));
    },
    
    // Load admin workouts
    loadAdminWorkouts: function() {
        const workoutsTable = document.getElementById('user-workouts-table');
        if (!workoutsTable) return;
        
        // In a real app, this would fetch from the API
        // For demo, we'll use hardcoded values
        const workouts = [
            { id: 1, name: 'Workout A', type: 'Strength', exercises: 3, lastUsed: 'Apr 15, 2025' },
            { id: 2, name: 'Workout B', type: 'Strength', exercises: 3, lastUsed: 'Apr 13, 2025' },
            { id: 3, name: 'Upper Body Focus', type: 'Hypertrophy', exercises: 5, lastUsed: 'Apr 5, 2025' },
            { id: 4, name: 'Lower Body Focus', type: 'Strength', exercises: 4, lastUsed: 'Apr 3, 2025' },
            { id: 5, name: 'Full Body Workout', type: 'Endurance', exercises: 8, lastUsed: 'Mar 28, 2025' }
        ];
        
        // Generate workout table
        workoutsTable.innerHTML = '';
        
        workouts.forEach(workout => {
            const row = `
                <tr>
                    <td>${workout.name}</td>
                    <td>${workout.type}</td>
                    <td>${workout.exercises}</td>
                    <td>${workout.lastUsed}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary edit-workout-btn" data-workout-id="${workout.id}">Edit</button>
                        <button class="btn btn-sm btn-outline-danger delete-workout-btn" data-workout-id="${workout.id}" data-workout-name="${workout.name}">Delete</button>
                    </td>
                </tr>
            `;
            
            workoutsTable.insertAdjacentHTML('beforeend', row);
        });
        
        // Add event listeners
        document.querySelectorAll('.edit-workout-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const workoutId = e.target.getAttribute('data-workout-id');
                this.showEditWorkoutModal(workoutId);
            });
        });
        
        document.querySelectorAll('.delete-workout-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const workoutId = e.target.getAttribute('data-workout-id');
                const workoutName = e.target.getAttribute('data-workout-name');
                this.showDeleteConfirmation('workout', workoutId, workoutName);
            });
        });
    },
    
    // Load admin exercises
    loadAdminExercises: function() {
        const exercisesTable = document.getElementById('admin-exercises-table');
        if (!exercisesTable) return;
        
        // In a real app, this would fetch from the API
        // For demo, we'll use hardcoded values
        const exercises = [
            { id: 1, name: 'Squat', category: 'Compound Movements', equipment: 'Barbell, Squat Rack', muscleGroup: 'Quadriceps, Glutes, Hamstrings' },
            { id: 2, name: 'Bench Press', category: 'Upper Body Push', equipment: 'Barbell, Bench', muscleGroup: 'Chest, Shoulders, Triceps' },
            { id: 3, name: 'Deadlift', category: 'Compound Movements', equipment: 'Barbell', muscleGroup: 'Back, Glutes, Hamstrings' },
            { id: 4, name: 'Overhead Press', category: 'Upper Body Push', equipment: 'Barbell', muscleGroup: 'Shoulders, Triceps' },
            { id: 5, name: 'Pull-up', category: 'Upper Body Pull', equipment: 'Pull-up Bar', muscleGroup: 'Back, Biceps' },
            { id: 6, name: 'Barbell Row', category: 'Upper Body Pull', equipment: 'Barbell', muscleGroup: 'Back, Biceps' },
            { id: 7, name: 'Dips', category: 'Upper Body Push', equipment: 'Dip Bars', muscleGroup: 'Chest, Triceps, Shoulders' },
            { id: 8, name: 'Lunges', category: 'Lower Body', equipment: 'Bodyweight, Dumbbells', muscleGroup: 'Quadriceps, Glutes, Hamstrings' },
            { id: 9, name: 'Plank', category: 'Core', equipment: 'None', muscleGroup: 'Core' },
            { id: 10, name: 'Landmine Press', category: 'Upper Body Push', equipment: 'Barbell, Landmine', muscleGroup: 'Shoulders, Chest, Triceps' },
            { id: 11, name: 'Lat Pulldown', category: 'Upper Body Pull', equipment: 'Cable Machine', muscleGroup: 'Back, Biceps' }
        ];
        
        // Generate exercise table
        exercisesTable.innerHTML = '';
        
        exercises.forEach(exercise => {
            const row = `
                <tr>
                    <td>${exercise.name}</td>
                    <td>${exercise.category}</td>
                    <td>${exercise.equipment}</td>
                    <td>${exercise.muscleGroup}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary edit-exercise-btn" data-exercise-id="${exercise.id}">Edit</button>
                        <button class="btn btn-sm btn-outline-danger delete-exercise-btn" data-exercise-id="${exercise.id}" data-exercise-name="${exercise.name}">Delete</button>
                    </td>
                </tr>
            `;
            
            exercisesTable.insertAdjacentHTML('beforeend', row);
        });
        
        // Add event listeners
        document.querySelectorAll('.edit-exercise-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const exerciseId = e.target.getAttribute('data-exercise-id');
                this.showEditExerciseModal(exerciseId);
            });
        });
        
        document.querySelectorAll('.delete-exercise-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const exerciseId = e.target.getAttribute('data-exercise-id');
                const exerciseName = e.target.getAttribute('data-exercise-name');
                this.showDeleteConfirmation('exercise', exerciseId, exerciseName);
            });
        });
    },
    
    // Load template workouts
    loadTemplateWorkouts: function() {
        const templatesTable = document.getElementById('template-plans-table');
        if (!templatesTable) return;
        
        // In a real app, this would fetch from the API
        // For demo, we'll use hardcoded values
        const templates = [
            { id: 1, name: 'Starting Strength', description: 'A beginner-friendly strength program', workouts: 3, frequency: '3x/week' },
            { id: 2, name: 'Advanced Strength', description: 'A more varied strength program', workouts: 4, frequency: '4x/week' },
            { id: 3, name: 'Push/Pull/Legs', description: 'Classic bodybuilding split', workouts: 3, frequency: '3-6x/week' },
            { id: 4, name: 'Upper/Lower Split', description: 'Balanced split for strength and size', workouts: 4, frequency: '4x/week' },
            { id: 5, name: 'Full Body Routine', description: 'Great for beginners', workouts: 3, frequency: '3x/week' }
        ];
        
        // Generate template table
        templatesTable.innerHTML = '';
        
        templates.forEach(template => {
            const row = `
                <tr>
                    <td>${template.name}</td>
                    <td>${template.description}</td>
                    <td>${template.workouts}</td>
                    <td>${template.frequency}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary edit-template-btn" data-template-id="${template.id}">Edit</button>
                        <button class="btn btn-sm btn-outline-danger delete-template-btn" data-template-id="${template.id}" data-template-name="${template.name}">Delete</button>
                    </td>
                </tr>
            `;
            
            templatesTable.insertAdjacentHTML('beforeend', row);
        });
        
        // Add event listeners
        document.querySelectorAll('.edit-template-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const templateId = e.target.getAttribute('data-template-id');
                this.showEditTemplateModal(templateId);
            });
        });
        
        document.querySelectorAll('.delete-template-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const templateId = e.target.getAttribute('data-template-id');
                const templateName = e.target.getAttribute('data-template-name');
                this.showDeleteConfirmation('template', templateId, templateName);
            });
        });
    },
    
    // Show add exercise modal
    showAddExerciseModal: function() {
        // Reset form
        const exerciseForm = document.getElementById('exercise-form');
        if (exerciseForm) {
            exerciseForm.reset();
        }
        
        // Set modal title
        document.getElementById('exercise-modal-title').textContent = 'Add New Exercise';
        
        // Clear exercise ID
        document.getElementById('exercise-id').value = '';
        
        // Show modal
        const addExerciseModal = new bootstrap.Modal(document.getElementById('add-exercise-modal'));
        addExerciseModal.show();
        
        // Setup form submission
        exerciseForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveExercise();
        });
    },
    
    // Show edit exercise modal
    showEditExerciseModal: function(exerciseId) {
        if (!exerciseId) return;
        
        // In a real app, this would fetch the exercise details from the API
        // For demo, we'll use hardcoded values based on ID
        const exercises = [
            { id: 1, name: 'Squat', category: 1, equipment: 'Barbell, Squat Rack', muscleGroup: 'Quadriceps, Glutes, Hamstrings', isCompound: true, description: 'A compound lower body exercise', instructions: 'Stand with feet shoulder-width apart, barbell across upper back. Bend knees and hips to lower body, keeping back straight. Return to starting position.' },
            { id: 2, name: 'Bench Press', category: 2, equipment: 'Barbell, Bench', muscleGroup: 'Chest, Shoulders, Triceps', isCompound: true, description: 'A compound upper body pushing exercise', instructions: 'Lie on bench, grip barbell with hands slightly wider than shoulder-width. Lower bar to chest, then press back up to starting position.' },
            { id: 3, name: 'Deadlift', category: 1, equipment: 'Barbell', muscleGroup: 'Back, Glutes, Hamstrings', isCompound: true, description: 'A compound full body pulling exercise', instructions: 'Stand with feet hip-width apart, barbell over mid-foot. Bend at hips and knees to grip bar. Keeping back straight, stand up with the weight, extending hips and knees.' },
            // More exercises would be defined here
        ];
        
        const exercise = exercises.find(ex => ex.id == exerciseId) || exercises[0];
        
        // Set form values
        document.getElementById('exercise-id').value = exercise.id;
        document.getElementById('exercise-name').value = exercise.name;
        document.getElementById('exercise-category').value = exercise.category;
        document.getElementById('exercise-equipment').value = exercise.equipment;
        document.getElementById('exercise-muscle-group').value = exercise.muscleGroup;
        document.getElementById('exercise-compound').checked = exercise.isCompound;
        document.getElementById('exercise-description').value = exercise.description || '';
        document.getElementById('exercise-instructions').value = exercise.instructions || '';
        
        // Set modal title
        document.getElementById('exercise-modal-title').textContent = 'Edit Exercise';
        
        // Show modal
        const addExerciseModal = new bootstrap.Modal(document.getElementById('add-exercise-modal'));
        addExerciseModal.show();
        
        // Setup form submission
        const exerciseForm = document.getElementById('exercise-form');
        if (exerciseForm) {
            exerciseForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveExercise();
            });
        }
    },
    
    // Save exercise (create or update)
    saveExercise: function() {
        const exerciseId = document.getElementById('exercise-id').value;
        const exerciseName = document.getElementById('exercise-name').value;
        const exerciseCategory = document.getElementById('exercise-category').value;
        const exerciseEquipment = document.getElementById('exercise-equipment').value;
        const exerciseMuscleGroup = document.getElementById('exercise-muscle-group').value;
        const exerciseCompound = document.getElementById('exercise-compound').checked;
        const exerciseDescription = document.getElementById('exercise-description').value;
        const exerciseInstructions = document.getElementById('exercise-instructions').value;
        
        // In a real app, this would call the API to create/update the exercise
        // For demo, we'll just show a toast and close the modal
        
        const action = exerciseId ? 'updated' : 'created';
        this.showToast(`Exercise ${exerciseName} ${action} successfully!`, 'success');
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('add-exercise-modal'));
        if (modal) {
            modal.hide();
        }
        
        // Reload exercises
        this.loadAdminExercises();
    },
    
    // Show create/edit workout modal
    showCreateWorkoutModal: function() {
        // Implementation would be similar to showAddExerciseModal
        // For brevity, we'll just show a toast
        this.showToast('Create workout functionality would be implemented here', 'info');
    },
    
    showEditWorkoutModal: function(workoutId) {
        // Implementation would be similar to showEditExerciseModal
        // For brevity, we'll just show a toast
        this.showToast(`Edit workout ${workoutId} functionality would be implemented here`, 'info');
    },
    
    // Show create/edit template modal
    showCreateTemplateModal: function() {
        // Implementation would be similar to showAddExerciseModal
        // For brevity, we'll just show a toast
        this.showToast('Create template functionality would be implemented here', 'info');
    },
    
    showEditTemplateModal: function(templateId) {
        // Implementation would be similar to showEditExerciseModal
        // For brevity, we'll just show a toast
        this.showToast(`Edit template ${templateId} functionality would be implemented here`, 'info');
    },
    
    // Show delete confirmation modal
    showDeleteConfirmation: function(itemType, itemId, itemName) {
        if (!itemType || !itemId || !itemName) return;
        
        // Set confirmation message
        document.getElementById('delete-item-name').textContent = itemName;
        document.getElementById('delete-item-id').value = itemId;
        document.getElementById('delete-item-type').value = itemType;
        
        // Show modal
        const deleteModal = new bootstrap.Modal(document.getElementById('delete-confirmation-modal'));
        deleteModal.show();
        
        // Setup confirm button
        const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
        if (confirmDeleteBtn) {
            confirmDeleteBtn.onclick = () => {
                this.deleteItem(itemType, itemId, itemName);
                deleteModal.hide();
            };
        }
    },
    
    // Delete item (exercise, workout, template)
    deleteItem: function(itemType, itemId, itemName) {
        // In a real app, this would call the API to delete the item
        // For demo, we'll just show a toast
        
        this.showToast(`${itemType.charAt(0).toUpperCase() + itemType.slice(1)} "${itemName}" deleted successfully!`, 'success');
        
        // Reload appropriate data
        switch (itemType) {
            case 'exercise':
                this.loadAdminExercises();
                break;
            case 'workout':
                this.loadAdminWorkouts();
                break;
            case 'template':
                this.loadTemplateWorkouts();
                break;
        }
    },
    
    // Save workout settings
    saveWorkoutSettings: function() {
        // In a real app, this would call the API to save the settings
        // For demo, we'll just show a toast
        
        this.showToast('Workout settings saved successfully!', 'success');
    },
    
    // Save profile settings
    saveProfileSettings: function() {
        // In a real app, this would call the API to save the settings
        // For demo, we'll just show a toast
        
        this.showToast('Profile settings saved successfully!', 'success');
    },
    
    // Setup toast container
    setupToastContainer: function() {
        // Create toast container if it doesn't exist
        if (!document.querySelector('.toast-container')) {
            const toastContainer = document.createElement('div');
            toastContainer.className = 'toast-container';
            document.body.appendChild(toastContainer);
        }
    },
    
    // Show toast notification
    showToast: function(message, type = 'info') {
        const toastContainer = document.querySelector('.toast-container');
        if (!toastContainer) return;
        
        // Create toast element
        const toastId = 'toast-' + Date.now();
        const toastHtml = `
            <div class="app-toast toast-${type}" id="${toastId}">
                <div class="toast-message">
                    ${message}
                    <button type="button" class="close-toast">&times;</button>
                </div>
            </div>
        `;
        
        toastContainer.insertAdjacentHTML('beforeend', toastHtml);
        
        // Get new toast element
        const toast = document.getElementById(toastId);
        
        // Add event listener to close button
        const closeBtn = toast.querySelector('.close-toast');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                toast.style.opacity = '0';
                setTimeout(() => {
                    toast.remove();
                }, 300);
            });
        }
        
        // Auto-close after 5 seconds
        setTimeout(() => {
            if (toast && toast.parentNode) {
                toast.style.opacity = '0';
                setTimeout(() => {
                    toast.remove();
                }, 300);
            }
        }, 5000);
    }
};

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    FitTrack.init();
});