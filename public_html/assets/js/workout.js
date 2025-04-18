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
    
    // Load workout templates using data service
    loadWorkoutTemplates: async function() {
        try {
            // Get workout plans from API
            const plansData = await DataService.getWorkoutPlans();
            
            // Populate template workouts list
            const templateList = document.getElementById('template-workouts-list');
            if (templateList) {
                templateList.innerHTML = '';
                
                if (!plansData.templatePlans || plansData.templatePlans.length === 0) {
                    templateList.innerHTML = '<p class="text-center p-3 text-muted">No template workouts available</p>';
                } else {
                    plansData.templatePlans.forEach(plan => {
                        // For each template plan, we need to get its workouts
                        const workouts = plan.workout_count || 0;
                        const description = plan.description || 'No description available';
                        
                        const item = `
                            <a href="#" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center" data-plan-id="${plan.plan_id}">
                                <div>
                                    <h6 class="mb-1">${plan.name}</h6>
                                    <p class="mb-1 small text-muted">${description}</p>
                                </div>
                                <span class="badge bg-primary rounded-pill">${workouts}</span>
                            </a>
                        `;
                        
                        templateList.insertAdjacentHTML('beforeend', item);
                    });
                    
                    // Add event listeners
                    templateList.querySelectorAll('.list-group-item').forEach(item => {
                        item.addEventListener('click', (e) => {
                            e.preventDefault();
                            const planId = item.getAttribute('data-plan-id');
                            this.startWorkoutFromTemplate(planId);
                        });
                    });
                }
            }
            
            // Populate user workouts list
            const userWorkoutsList = document.getElementById('my-workouts-list');
            if (userWorkoutsList) {
                userWorkoutsList.innerHTML = '';
                
                if (!plansData.userPlans || plansData.userPlans.length === 0) {
                    userWorkoutsList.innerHTML = '<p class="text-center p-3 text-muted">No saved workouts yet</p>';
                } else {
                    plansData.userPlans.forEach(plan => {
                        const workouts = plan.workout_count || 0;
                        const description = plan.description || 'No description available';
                        
                        const item = `
                            <a href="#" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center" data-plan-id="${plan.plan_id}">
                                <div>
                                    <h6 class="mb-1">${plan.name}</h6>
                                    <p class="mb-1 small text-muted">${description}</p>
                                </div>
                                <span class="badge bg-primary rounded-pill">${workouts}</span>
                            </a>
                        `;
                        
                        userWorkoutsList.insertAdjacentHTML('beforeend', item);
                    });
                    
                    // Add event listeners
                    userWorkoutsList.querySelectorAll('.list-group-item').forEach(item => {
                        item.addEventListener('click', (e) => {
                            e.preventDefault();
                            const planId = item.getAttribute('data-plan-id');
                            this.startWorkoutFromSaved(planId);
                        });
                    });
                }
            }
            
            // Populate exercise select with real data
            const exerciseSelects = document.querySelectorAll('.exercise-select');
            if (exerciseSelects.length > 0) {
                // Get exercises from API
                const exercisesData = await DataService.getExercises();
                const exercises = exercisesData.exercises || [];
                
                exerciseSelects.forEach(select => {
                    // Clear existing options except the first placeholder
                    while (select.options.length > 1) {
                        select.remove(1);
                    }
                    
                    // Add exercise options
                    exercises.forEach(exercise => {
                        const option = document.createElement('option');
                        option.value = exercise.exercise_id;
                        option.textContent = exercise.name;
                        select.appendChild(option);
                    });
                });
            }
        } catch (error) {
            console.error('Error loading workout templates:', error);
            FitTrack.showToast('Error loading workout templates', 'error');
        }
    },
    
    // Start workout from template using data service
    startWorkoutFromTemplate: async function(templateId) {
        try {
            // Show loading indicator
            const modal = document.getElementById('start-workout-modal');
            if (modal) {
                modal.querySelector('.modal-body').innerHTML = `
                    <div class="text-center py-5">
                        <div class="loading-spinner"></div>
                        <p class="mt-3">Loading workout...</p>
                    </div>
                `;
            }
            
            // Copy template plan to user's plans
            const response = await DataService.copyTemplatePlan(templateId);
            
            if (response.error) {
                throw new Error(response.message || 'Failed to load template');
            }
            
            // Get plan details
            const plan = response.plan;
            
            // Get today's workout from the plan
            const dayOfWeek = new Date().getDay() || 7; // 1-7 for Monday-Sunday
            const todaysWorkout = response.workouts.find(w => w.day_of_week === dayOfWeek);
            
            if (!todaysWorkout) {
                // If no workout for today, use the first one
                this.startWorkout(response.workouts[0]);
            } else {
                this.startWorkout(todaysWorkout);
            }
            
            // Close modal
            const modalInstance = bootstrap.Modal.getInstance(document.getElementById('start-workout-modal'));
            if (modalInstance) {
                modalInstance.hide();
            }
        } catch (error) {
            console.error('Error starting workout from template:', error);
            FitTrack.showToast('Error starting workout: ' + error.message, 'error');
            
            // Reset modal
            this.loadWorkoutTemplates();
        }
    },
    
    // Start workout from saved plan using data service
    startWorkoutFromSaved: async function(planId) {
        try {
            // Show loading indicator
            const modal = document.getElementById('start-workout-modal');
            if (modal) {
                modal.querySelector('.modal-body').innerHTML = `
                    <div class="text-center py-5">
                        <div class="loading-spinner"></div>
                        <p class="mt-3">Loading workout...</p>
                    </div>
                `;
            }
            
            // Get plan details
            const response = await DataService.getWorkoutPlanDetails(planId);
            
            if (response.error) {
                throw new Error(response.message || 'Failed to load workout plan');
            }
            
            // Get today's workout from the plan
            const dayOfWeek = new Date().getDay() || 7; // 1-7 for Monday-Sunday
            const todaysWorkout = response.workouts.find(w => w.day_of_week === dayOfWeek);
            
            if (!todaysWorkout) {
                // If no workout for today, use the first one
                this.startWorkout(response.workouts[0]);
            } else {
                this.startWorkout(todaysWorkout);
            }
            
            // Close modal
            const modalInstance = bootstrap.Modal.getInstance(document.getElementById('start-workout-modal'));
            if (modalInstance) {
                modalInstance.hide();
            }
        } catch (error) {
            console.error('Error starting workout from saved plan:', error);
            FitTrack.showToast('Error starting workout: ' + error.message, 'error');
            
            // Reset modal
            this.loadWorkoutTemplates();
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
            // Get newest select
            const lastSelect = exerciseSelects[exerciseSelects.length - 1];
            
            // Load exercises using DataService
            DataService.getExercises()
                .then(response => {
                    const exercises = response.exercises || [];
                    
                    // Clear existing options except the first placeholder
                    while (lastSelect.options.length > 1) {
                        lastSelect.remove(1);
                    }
                    
                    // Add exercise options
                    exercises.forEach(exercise => {
                        const option = document.createElement('option');
                        option.value = exercise.exercise_id;
                        option.textContent = exercise.name;
                        lastSelect.appendChild(option);
                    });
                })
                .catch(error => {
                    console.error('Error loading exercises:', error);
                    FitTrack.showToast('Error loading exercises', 'error');
                });
        }
    },
    
    // Start a custom workout using data service
    startCustomWorkout: async function() {
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
                    exercise_id: select.value,
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
        
        try {
            // Create a new plan with a single workout
            const planData = {
                name: workoutName,
                frequency: 1,
                goal: 'strength',
                workouts: [
                    {
                        name: workoutName,
                        day_of_week: new Date().getDay() || 7, // Today
                        exercises: exercises.map(exercise => ({
                            exercise_id: exercise.exercise_id,
                            sets: exercise.sets,
                            reps: exercise.reps,
                            rest_period: 90, // Default
                            notes: exercise.weight ? `Target weight: ${exercise.weight}` : ''
                        }))
                    }
                ]
            };
            
            // Create the plan
            const response = await DataService.createWorkoutPlan(planData);
            
            if (response.error) {
                throw new Error(response.message || 'Failed to create workout');
            }
            
            // Start the workout
            this.startWorkout(response.workouts[0]);
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('start-workout-modal'));
            if (modal) {
                modal.hide();
            }
        } catch (error) {
            console.error('Error creating custom workout:', error);
            FitTrack.showToast('Error creating workout: ' + error.message, 'error');
        }
    },
    
    // Start a workout
    startWorkout: function(workout) {
        // Convert workout format to active workout format
        const exercises = workout.exercises || [];
        const exerciseLogs = exercises.map(exercise => {
            // Create sets array based on exercise.sets
            const sets = [];
            for (let i = 0; i < exercise.sets; i++) {
                sets.push({
                    completed: false,
                    weight: exercise.notes?.includes('Target weight:') ? 
                        exercise.notes.split('Target weight:')[1].trim() : '',
                    reps: exercise.reps
                });
            }
            
            return {
                id: exercise.exercise_id,
                name: exercise.name,
                setsCompleted: 0,
                sets: sets
            };
        });
        
        // Set as active workout
        this.activeWorkout = {
            id: workout.workout_id,
            name: workout.name,
            startTime: new Date(),
            completed: false,
            exerciseLogs: exerciseLogs
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
                                    <strong>${exercise.sets.length} sets × ${exercise.sets[0]?.reps || ''}</strong>
                                    ${exercise.sets[0]?.weight ? `<span class="ms-2">@ ${exercise.sets[0].weight}</span>` : ''}
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
    
    // Log exercise sets using data service
    logExerciseSets: async function() {
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
        
        // If marked as PR, add it using the data service
        if (isPR) {
            try {
                // Find the heaviest set with the most reps
                let bestSet = null;
                let bestVolume = 0;
                
                completedSets.forEach(set => {
                    const weight = parseFloat(set.weight) || 0;
                    const reps = parseInt(set.reps) || 0;
                    const volume = weight * reps;
                    
                    if (volume > bestVolume) {
                        bestVolume = volume;
                        bestSet = set;
                    }
                });
                
                if (bestSet) {
                    // Add personal record
                    await DataService.addPersonalRecord(exerciseId, {
                        weight: parseFloat(bestSet.weight),
                        reps: parseInt(bestSet.reps),
                        notes: notes
                    });
                    
                    FitTrack.showToast(`New personal record for ${this.activeWorkout.exerciseLogs[exerciseIndex].name}!`, 'success');
                }
            } catch (error) {
                console.error('Error saving personal record:', error);
                FitTrack.showToast('Error saving personal record: ' + error.message, 'warning');
            }
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
    
    // Complete workout using data service
    completeWorkout: async function() {
        if (!this.activeWorkout) return;
        
        try {
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
            
            // Prepare log data
            const logData = {
                workout_id: this.activeWorkout.id,
                completed_at: now.toISOString(),
                duration: durationMinutes,
                notes: this.activeWorkout.notes || '',
                rating: this.activeWorkout.rating || 5,
                exercises: this.activeWorkout.exerciseLogs.map(exercise => {
                    // Convert sets to the format expected by the API
                    const sets = exercise.sets.map((set, index) => ({
                        reps: parseInt(set.reps) || 0,
                        weight: parseFloat(set.weight) || 0,
                        notes: set.notes || '',
                        is_pr: false // We already handled PRs during logging
                    }));
                    
                    return {
                        exercise_id: exercise.id,
                        sets: sets
                    };
                })
            };
            
            // Log the completed workout
            await DataService.logWorkout(logData);
            
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
        } catch (error) {
            console.error('Error completing workout:', error);
            FitTrack.showToast('Error completing workout: ' + error.message, 'error');
        }
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