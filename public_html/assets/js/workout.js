/**
 * Workout JavaScript file for FitTrack Exercise App
 * Path: /exercise-app/assets/js/workout.js
 */

// Workout module for handling workout-specific functionality
const FitWorkout = {
    // Active workout session
    activeWorkout: null,
    
    // Timer for rest periods
    restTimer: null,
    
    // Timer for workout duration
    workoutTimer: null,
    
    // Timer display element
    timerElement: null,
    
    // Initialize workout module
    init: function() {
        console.log('Workout module initialized');
        
        // Setup event listeners when on workout page
        if (FitTrack.state.currentPage === 'workout') {
            this.setupWorkoutEvents();
        }
    },
    
    // Setup workout event listeners
    setupWorkoutEvents: function() {
        // Start workout button
        const startWorkoutBtn = document.getElementById('start-new-workout-btn');
        if (startWorkoutBtn) {
            startWorkoutBtn.addEventListener('click', this.showStartWorkoutModal.bind(this));
        }
        
        // Complete workout button
        const completeWorkoutBtn = document.getElementById('complete-workout-btn');
        if (completeWorkoutBtn) {
            completeWorkoutBtn.addEventListener('click', this.completeWorkout.bind(this));
        }
        
        // Add exercise button in custom workout form
        const addExerciseBtn = document.getElementById('add-exercise-btn');
        if (addExerciseBtn) {
            addExerciseBtn.addEventListener('click', this.addExerciseToForm.bind(this));
        }
        
        // Custom workout form submission
        const customWorkoutForm = document.getElementById('custom-workout-form');
        if (customWorkoutForm) {
            customWorkoutForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.startCustomWorkout();
            });
        }
        
        // Log exercise event delegation
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('log-exercise-btn')) {
                const exerciseId = e.target.getAttribute('data-exercise-id');
                const exerciseName = e.target.getAttribute('data-exercise-name');
                this.showLogExerciseModal(exerciseId, exerciseName);
            }
        });
        
        // Add set button
        const addSetBtn = document.getElementById('add-set-btn');
        if (addSetBtn) {
            addSetBtn.addEventListener('click', this.addSetToForm.bind(this));
        }
        
        // Log exercise form submission
        const logExerciseForm = document.getElementById('log-exercise-form');
        if (logExerciseForm) {
            logExerciseForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.logExerciseSets();
            });
        }
        
        // Load workout template tabs
        const templateTabs = document.getElementById('workout-select-tabs');
        if (templateTabs) {
            this.loadWorkoutTemplates();
        }
        
        // Timer element for active workout
        this.timerElement = document.getElementById('workout-timer');
        
        // Check for existing active workout in local storage
        this.checkForActiveWorkout();
    },
    
    // Show start workout modal
    showStartWorkoutModal: function() {
        // Populate workout templates
        this.loadWorkoutTemplates();
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('start-workout-modal'));
        modal.show();
    },
    
    // Load workout templates
    loadWorkoutTemplates: function() {
        // In a real app, this would fetch from the API
        // For demo, we'll use hardcoded values
        
        // Template workouts
        const templateWorkouts = [
            { id: 1, name: 'Workout A (Starting Strength)', description: 'Squat, Bench Press, Deadlift', exercises: 3 },
            { id: 2, name: 'Workout B (Starting Strength)', description: 'Squat, Overhead Press, Barbell Row', exercises: 3 },
            { id: 3, name: 'Upper Body Focus', description: 'Bench Press, Overhead Press, Pull-ups, Dips', exercises: 4 },
            { id: 4, name: 'Lower Body Focus', description: 'Squat, Deadlift, Lunges', exercises: 3 }
        ];
        
        // User's saved workouts
        const userWorkouts = [
            { id: 5, name: 'My Custom Workout', description: 'Bench Press, Pull-ups, Dips', exercises: 3 },
            { id: 6, name: 'Quick Workout', description: 'Squat, Bench Press, Pull-ups', exercises: 3 }
        ];
        
        // Populate template workouts list
        const templateList = document.getElementById('template-workouts-list');
        if (templateList) {
            templateList.innerHTML = '';
            
            templateWorkouts.forEach(workout => {
                const item = `
                    <a href="#" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center" data-workout-id="${workout.id}">
                        <div>
                            <h6 class="mb-1">${workout.name}</h6>
                            <p class="mb-1 small text-muted">${workout.description}</p>
                        </div>
                        <span class="badge bg-primary rounded-pill">${workout.exercises}</span>
                    </a>
                `;
                
                templateList.insertAdjacentHTML('beforeend', item);
            });
            
            // Add event listeners
            templateList.querySelectorAll('.list-group-item').forEach(item => {
                item.addEventListener('click', (e) => {
                    e.preventDefault();
                    const workoutId = item.getAttribute('data-workout-id');
                    this.startWorkoutFromTemplate(workoutId);
                });
            });
        }
        
        // Populate user workouts list
        const userWorkoutsList = document.getElementById('my-workouts-list');
        if (userWorkoutsList) {
            userWorkoutsList.innerHTML = '';
            
            if (userWorkouts.length === 0) {
                userWorkoutsList.innerHTML = '<p class="text-center p-3 text-muted">No saved workouts yet</p>';
            } else {
                userWorkouts.forEach(workout => {
                    const item = `
                        <a href="#" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center" data-workout-id="${workout.id}">
                            <div>
                                <h6 class="mb-1">${workout.name}</h6>
                                <p class="mb-1 small text-muted">${workout.description}</p>
                            </div>
                            <span class="badge bg-primary rounded-pill">${workout.exercises}</span>
                        </a>
                    `;
                    
                    userWorkoutsList.insertAdjacentHTML('beforeend', item);
                });
                
                // Add event listeners
                userWorkoutsList.querySelectorAll('.list-group-item').forEach(item => {
                    item.addEventListener('click', (e) => {
                        e.preventDefault();
                        const workoutId = item.getAttribute('data-workout-id');
                        this.startWorkoutFromSaved(workoutId);
                    });
                });
            }
        }
        
        // Populate exercise select
        const exerciseSelects = document.querySelectorAll('.exercise-select');
        if (exerciseSelects.length > 0) {
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
        }
    },
    
    // Start workout from template
    startWorkoutFromTemplate: function(templateId) {
        // In a real app, this would fetch the template from the API
        // For demo, we'll use hardcoded values
        const templates = {
            '1': {
                id: 1,
                name: 'Workout A (Starting Strength)',
                exercises: [
                    {
                        id: 1,
                        name: 'Squat',
                        sets: 3,
                        reps: '5',
                        weight: '185'
                    },
                    {
                        id: 2,
                        name: 'Bench Press',
                        sets: 3,
                        reps: '5',
                        weight: '205'
                    },
                    {
                        id: 3,
                        name: 'Deadlift',
                        sets: 1,
                        reps: '5',
                        weight: '250'
                    }
                ]
            },
            '2': {
                id: 2,
                name: 'Workout B (Starting Strength)',
                exercises: [
                    {
                        id: 1,
                        name: 'Squat',
                        sets: 3,
                        reps: '5',
                        weight: '185'
                    },
                    {
                        id: 4,
                        name: 'Overhead Press',
                        sets: 3,
                        reps: '5',
                        weight: '135'
                    },
                    {
                        id: 6,
                        name: 'Barbell Row',
                        sets: 3,
                        reps: '5',
                        weight: '155'
                    }
                ]
            },
            '3': {
                id: 3,
                name: 'Upper Body Focus',
                exercises: [
                    {
                        id: 2,
                        name: 'Bench Press',
                        sets: 3,
                        reps: '8',
                        weight: '185'
                    },
                    {
                        id: 4,
                        name: 'Overhead Press',
                        sets: 3,
                        reps: '8',
                        weight: '115'
                    },
                    {
                        id: 5,
                        name: 'Pull-up',
                        sets: 3,
                        reps: '8',
                        weight: 'BW'
                    },
                    {
                        id: 7,
                        name: 'Dips',
                        sets: 3,
                        reps: '10',
                        weight: 'BW'
                    }
                ]
            },
            '4': {
                id: 4,
                name: 'Lower Body Focus',
                exercises: [
                    {
                        id: 1,
                        name: 'Squat',
                        sets: 4,
                        reps: '8',
                        weight: '165'
                    },
                    {
                        id: 3,
                        name: 'Deadlift',
                        sets: 3,
                        reps: '8',
                        weight: '225'
                    },
                    {
                        id: 8,
                        name: 'Lunges',
                        sets: 3,
                        reps: '10',
                        weight: '30'
                    }
                ]
            }
        };
        
        const workout = templates[templateId];
        
        if (!workout) {
            FitTrack.showToast('Workout template not found', 'error');
            return;
        }
        
        // Start the workout
        this.startWorkout(workout);
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('start-workout-modal'));
        if (modal) {
            modal.hide();
        }
    },
    
    // Start workout from saved
    startWorkoutFromSaved: function(workoutId) {
        // In a real app, this would fetch the saved workout from the API
        // For demo, we'll use hardcoded values
        const savedWorkouts = {
            '5': {
                id: 5,
                name: 'My Custom Workout',
                exercises: [
                    {
                        id: 2,
                        name: 'Bench Press',
                        sets: 4,
                        reps: '8',
                        weight: '185'
                    },
                    {
                        id: 5,
                        name: 'Pull-up',
                        sets: 3,
                        reps: '8',
                        weight: 'BW'
                    },
                    {
                        id: 7,
                        name: 'Dips',
                        sets: 3,
                        reps: '12',
                        weight: 'BW'
                    }
                ]
            },
            '6': {
                id: 6,
                name: 'Quick Workout',
                exercises: [
                    {
                        id: 1,
                        name: 'Squat',
                        sets: 3,
                        reps: '5',
                        weight: '185'
                    },
                    {
                        id: 2,
                        name: 'Bench Press',
                        sets: 3,
                        reps: '5',
                        weight: '205'
                    },
                    {
                        id: 5,
                        name: 'Pull-up',
                        sets: 3,
                        reps: '8',
                        weight: 'BW'
                    }
                ]
            }
        };
        
        const workout = savedWorkouts[workoutId];
        
        if (!workout) {
            FitTrack.showToast('Saved workout not found', 'error');
            return;
        }
        
        // Start the workout
        this.startWorkout(workout);
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('start-workout-modal'));
        if (modal) {
            modal.hide();
        }
    },
    
    // Add exercise to custom workout form
    addExerciseToForm: function() {
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
        
        // Initialize remove buttons
        const removeButtons = customExercises.querySelectorAll('.remove-exercise');
        removeButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const exerciseCard = e.target.closest('.card');
                if (exerciseCard && exerciseCard.parentNode) {
                    exerciseCard.parentNode.removeChild(exerciseCard);
                }
            });
        });
        
        // Populate exercise select
        const exerciseSelects = customExercises.querySelectorAll('.exercise-select');
        if (exerciseSelects.length > 0) {
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
            
            const lastSelect = exerciseSelects[exerciseSelects.length - 1];
            
            // Clear existing options except the first placeholder
            while (lastSelect.options.length > 1) {
                lastSelect.remove(1);
            }
            
            // Add exercise options
            exercises.forEach(exercise => {
                const option = document.createElement('option');
                option.value = exercise.id;
                option.textContent = exercise.name;
                lastSelect.appendChild(option);
            });
        }
    },
    
    // Start a custom workout
    startCustomWorkout: function() {
        const workoutName = document.getElementById('custom-workout-name').value;
        if (!workoutName) {
            FitTrack.showToast('Please enter a workout name', 'warning');
            return;
        }
        
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
            FitTrack.showToast('Please add at least one exercise to your workout', 'warning');
            return;
        }
        
        // Create workout
        const workout = {
            id: 'custom-' + Date.now(), // Generate temporary ID
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
        this.activeWorkout = {
            ...workout,
            startTime: new Date(),
            completed: false,
            exerciseLogs: workout.exercises.map(exercise => ({
                ...exercise,
                setsCompleted: 0,
                sets: Array(exercise.sets).fill({
                    completed: false,
                    weight: exercise.weight,
                    reps: exercise.reps
                })
            }))
        };
        
        // Save to local storage
        localStorage.setItem('fittrack_active_workout', JSON.stringify(this.activeWorkout));
        
        // Update UI
        this.updateWorkoutUI();
        
        // Start workout timer
        this.startWorkoutTimer();
        
        // Show toast
        FitTrack.showToast(`Started workout: ${workout.name}`, 'success');
    },
    
    // Update workout UI
    updateWorkoutUI: function() {
        const noActiveWorkout = document.getElementById('no-active-workout');
        const activeWorkout = document.getElementById('active-workout');
        const activeWorkoutName = document.getElementById('active-workout-name');
        
        if (!noActiveWorkout || !activeWorkout || !activeWorkoutName) return;
        
        if (this.activeWorkout) {
            // Show active workout
            noActiveWorkout.style.display = 'none';
            activeWorkout.style.display = 'block';
            activeWorkoutName.textContent = this.activeWorkout.name;
            
            // Build exercise list
            const exerciseList = document.getElementById('exercise-list');
            if (exerciseList) {
                exerciseList.innerHTML = '';
                
                this.activeWorkout.exerciseLogs.forEach(exercise => {
                    const progressPercent = Math.min(100, (exercise.setsCompleted / exercise.sets.length) * 100);
                    
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
                                    <strong>${exercise.sets.length} sets × ${exercise.reps}</strong>
                                    ${exercise.weight ? `<span class="ms-2">@ ${exercise.weight}</span>` : ''}
                                </div>
                                <div class="progress">
                                    <div class="progress-bar" role="progressbar" style="width: ${progressPercent}%;" aria-valuenow="${progressPercent}" aria-valuemin="0" aria-valuemax="100">${exercise.setsCompleted}/${exercise.sets.length}</div>
                                </div>
                            </div>
                        </div>
                    `;
                    
                    exerciseList.insertAdjacentHTML('beforeend', exerciseHtml);
                });
            }
        } else {
            // Show no active workout
            noActiveWorkout.style.display = 'block';
            activeWorkout.style.display = 'none';
        }
    },
    
    // Start workout timer
    startWorkoutTimer: function() {
        if (!this.activeWorkout || !this.timerElement) return;
        
        // Clear existing timer
        if (this.workoutTimer) {
            clearInterval(this.workoutTimer);
        }
        
        // Update timer every second
        this.workoutTimer = setInterval(() => {
            const now = new Date();
            const startTime = this.activeWorkout.startTime;
            const elapsedMs = now - (typeof startTime === 'string' ? new Date(startTime) : startTime);
            
            // Format time as HH:MM:SS
            const hours = Math.floor(elapsedMs / 3600000).toString().padStart(2, '0');
            const minutes = Math.floor((elapsedMs % 3600000) / 60000).toString().padStart(2, '0');
            const seconds = Math.floor((elapsedMs % 60000) / 1000).toString().padStart(2, '0');
            
            this.timerElement.textContent = `${hours}:${minutes}:${seconds}`;
        }, 1000);
    },
    
    // Show log exercise modal
    showLogExerciseModal: function(exerciseId, exerciseName) {
        if (!exerciseId || !exerciseName || !this.activeWorkout) return;
        
        // Find exercise in active workout
        const exercise = this.activeWorkout.exerciseLogs.find(ex => ex.id == exerciseId);
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
            
            for (let i = 0; i < exercise.sets.length; i++) {
                const setData = exercise.sets[i];
                const setHtml = `
                    <div class="card mb-2 ${setData.completed ? 'set-complete' : ''}">
                        <div class="card-body">
                            <div class="d-flex align-items-center">
                                <div class="set-number">Set ${i + 1}</div>
                                <div class="row flex-grow-1">
                                    <div class="col-md-6 mb-2 mb-md-0">
                                        <input type="number" class="form-control" placeholder="Weight (lbs)" value="${setData.weight || ''}" ${setData.completed ? 'disabled' : ''}>
                                    </div>
                                    <div class="col-md-6">
                                        <input type="number" class="form-control" placeholder="Reps" value="${typeof setData.reps === 'string' && setData.reps.includes('-') ? '' : setData.reps || ''}" ${setData.completed ? 'disabled' : ''}>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                setsContainer.insertAdjacentHTML('beforeend', setHtml);
            }
            
            // Show modal
            const logExerciseModal = new bootstrap.Modal(document.getElementById('log-exercise-modal'));
            logExerciseModal.show();
        }
    },
    
    // Add set to form
    addSetToForm: function() {
        const setsContainer = document.getElementById('log-sets');
        if (!setsContainer) return;
        
        const setNumber = setsContainer.children.length + 1;
        const setHtml = `
            <div class="card mb-2">
                <div class="card-body">
                    <div class="d-flex align-items-center">
                        <div class="set-number">Set ${setNumber}</div>
                        <div class="row flex-grow-1">
                            <div class="col-md-6 mb-2 mb-md-0">
                                <input type="number" class="form-control" placeholder="Weight (lbs)">
                            </div>
                            <div class="col-md-6">
                                <input type="number" class="form-control" placeholder="Reps">
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        setsContainer.insertAdjacentHTML('beforeend', setHtml);
    },
    
    // Log exercise sets
    logExerciseSets: function() {
        const exerciseId = document.getElementById('log-exercise-id').value;
        if (!exerciseId || !this.activeWorkout) return;
        
        // Find exercise in active workout
        const exerciseIndex = this.activeWorkout.exerciseLogs.findIndex(ex => ex.id == exerciseId);
        if (exerciseIndex === -1) return;
        
        // Get sets data
        const setCards = document.querySelectorAll('#log-sets .card');
        const completedSets = [];
        
        setCards.forEach((card, index) => {
            // Skip already completed sets
            if (card.classList.contains('set-complete')) {
                const existingSet = this.activeWorkout.exerciseLogs[exerciseIndex].sets[index];
                if (existingSet && existingSet.completed) {
                    completedSets.push(existingSet);
                }
                return;
            }
            
            const weightInput = card.querySelectorAll('input')[0];
            const repsInput = card.querySelectorAll('input')[1];
            
            if (weightInput && repsInput && repsInput.value) {
                completedSets.push({
                    completed: true,
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
        
        // Update exercise in active workout
        this.activeWorkout.exerciseLogs[exerciseIndex].setsCompleted = completedSets.length;
        
        // Replace only the logged sets, keeping the rest as they were
        const originalSets = [...this.activeWorkout.exerciseLogs[exerciseIndex].sets];
        completedSets.forEach((set, idx) => {
            if (idx < originalSets.length) {
                originalSets[idx] = set;
            }
        });
        
        this.activeWorkout.exerciseLogs[exerciseIndex].sets = originalSets;
        
        if (notes) {
            this.activeWorkout.exerciseLogs[exerciseIndex].notes = notes;
        }
        
        // If marked as PR, handle PR logic (in a real app)
        if (isPR) {
            // For demo purposes, we'll just show a toast
            FitTrack.showToast(`New personal record for ${this.activeWorkout.exerciseLogs[exerciseIndex].name}!`, 'success');
        }
        
        // Save to local storage
        localStorage.setItem('fittrack_active_workout', JSON.stringify(this.activeWorkout));
        
        // Update UI
        this.updateWorkoutUI();
        
        // Hide modal
        const logExerciseModal = bootstrap.Modal.getInstance(document.getElementById('log-exercise-modal'));
        if (logExerciseModal) {
            logExerciseModal.hide();
        }
        
        // Show success message
        FitTrack.showToast('Sets logged successfully!', 'success');
    },
    
    // Complete workout
    completeWorkout: function() {
        if (!this.activeWorkout) return;
        
        // Stop timer
        if (this.workoutTimer) {
            clearInterval(this.workoutTimer);
            this.workoutTimer = null;
        }
        
        // Calculate workout duration
        const now = new Date();
        const startTime = typeof this.activeWorkout.startTime === 'string' 
            ? new Date(this.activeWorkout.startTime) 
            : this.activeWorkout.startTime;
        const durationMs = now - startTime;
        const durationMinutes = Math.floor(durationMs / 60000);
        
        // In a real app, this would call the API to save the workout log
        // For demo, we'll just update the UI and clear the active workout
        
        // Clear active workout
        this.activeWorkout = null;
        localStorage.removeItem('fittrack_active_workout');
        
        // Update UI
        this.updateWorkoutUI();
        
        // Show success message
        FitTrack.showToast(`Workout completed in ${durationMinutes} minutes!`, 'success');
        
        // Redirect to dashboard (optional)
        setTimeout(() => {
            FitTrack.loadPage('dashboard');
        }, 1500);
    },
    
    // Check for active workout in local storage
    checkForActiveWorkout: function() {
        const storedWorkout = localStorage.getItem('fittrack_active_workout');
        
        if (storedWorkout) {
            try {
                this.activeWorkout = JSON.parse(storedWorkout);
                this.updateWorkoutUI();
                this.startWorkoutTimer();
            } catch (error) {
                console.error('Error parsing stored workout:', error);
                localStorage.removeItem('fittrack_active_workout');
            }
        }
    }
};

// Initialize workout module when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    FitWorkout.init();
});