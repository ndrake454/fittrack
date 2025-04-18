/**
 * Admin JavaScript file for FitTrack Exercise App
 * Path: /exercise-app/assets/js/admin.js
 */

// Admin module for handling admin-specific functionality
const FitAdmin = {
    // Currently selected section
    currentSection: 'manage-workouts',
    
    // Initialize admin module
    init: function() {
        console.log('Admin module initialized');
        
        // Setup event listeners when on admin page
        if (FitTrack.state.currentPage === 'admin') {
            this.setupAdminEvents();
        }
    },
    
    // Setup admin event listeners
    setupAdminEvents: function() {
        // Section navigation
        const sectionLinks = document.querySelectorAll('[data-section]');
        sectionLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = e.target.getAttribute('data-section');
                this.switchSection(section);
            });
        });
        
        // Create/Edit buttons
        document.getElementById('create-new-workout-btn')?.addEventListener('click', this.showCreateWorkoutModal.bind(this));
        document.getElementById('add-new-exercise-btn')?.addEventListener('click', this.showAddExerciseModal.bind(this));
        document.getElementById('create-template-btn')?.addEventListener('click', this.showCreateTemplateModal.bind(this));
        
        // Exercise management
        this.loadExercises();
        
        // Workout management
        this.loadWorkouts();
        
        // Template management
        this.loadTemplates();
        
        // Settings forms
        const workoutSettingsForm = document.getElementById('workout-settings-form');
        if (workoutSettingsForm) {
            workoutSettingsForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveWorkoutSettings();
            });
        }
        
        const profileSettingsForm = document.getElementById('profile-settings-form');
        if (profileSettingsForm) {
            profileSettingsForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveProfileSettings();
            });
        }
        
        // Setup delete confirmation modal
        const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
        if (confirmDeleteBtn) {
            confirmDeleteBtn.addEventListener('click', () => {
                const itemType = document.getElementById('delete-item-type').value;
                const itemId = document.getElementById('delete-item-id').value;
                const itemName = document.getElementById('delete-item-name').textContent;
                
                this.deleteItem(itemType, itemId, itemName);
                
                // Hide modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('delete-confirmation-modal'));
                if (modal) {
                    modal.hide();
                }
            });
        }
        
        // Setup exercise form submission
        const exerciseForm = document.getElementById('exercise-form');
        if (exerciseForm) {
            exerciseForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveExercise();
            });
        }
    },
    
    // Switch between admin sections
    switchSection: function(section) {
        // Update active link
        document.querySelectorAll('[data-section]').forEach(link => {
            if (link.getAttribute('data-section') === section) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
        
        // Hide all sections
        document.querySelectorAll('.admin-section').forEach(section => {
            section.style.display = 'none';
        });
        
        // Show selected section
        const selectedSection = document.getElementById(`${section}-section`);
        if (selectedSection) {
            selectedSection.style.display = 'block';
        }
        
        // Update current section
        this.currentSection = section;
    },
    
    // Load exercises for management
    loadExercises: function() {
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
        const exercisesTable = document.getElementById('admin-exercises-table');
        if (exercisesTable) {
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
        }
    },
    
    // Load workouts for management
    loadWorkouts: function() {
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
        const workoutsTable = document.getElementById('user-workouts-table');
        if (workoutsTable) {
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
        }
    },
    
    // Load templates for management
    loadTemplates: function() {
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
        const templatesTable = document.getElementById('template-plans-table');
        if (templatesTable) {
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
        }
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
        const modal = new bootstrap.Modal(document.getElementById('add-exercise-modal'));
        modal.show();
    },
    
    // Show edit exercise modal
    showEditExerciseModal: function(exerciseId) {
        // In a real app, this would fetch the exercise details from the API
        // For demo, we'll use hardcoded values
        const exercises = {
            '1': {
                id: 1,
                name: 'Squat',
                category_id: 1,
                equipment: 'Barbell, Squat Rack',
                muscle_group: 'Quadriceps, Glutes, Hamstrings',
                is_compound: true,
                description: 'A compound lower body exercise',
                instructions: 'Stand with feet shoulder-width apart, barbell across upper back. Bend knees and hips to lower body, keeping back straight. Return to starting position.'
            },
            '2': {
                id: 2,
                name: 'Bench Press',
                category_id: 2,
                equipment: 'Barbell, Bench',
                muscle_group: 'Chest, Shoulders, Triceps',
                is_compound: true,
                description: 'A compound upper body pushing exercise',
                instructions: 'Lie on bench, grip barbell with hands slightly wider than shoulder-width. Lower bar to chest, then press back up to starting position.'
            },
            '3': {
                id: 3,
                name: 'Deadlift',
                category_id: 1,
                equipment: 'Barbell',
                muscle_group: 'Back, Glutes, Hamstrings',
                is_compound: true,
                description: 'A compound full body pulling exercise',
                instructions: 'Stand with feet hip-width apart, barbell over mid-foot. Bend at hips and knees to grip bar. Keeping back straight, stand up with the weight, extending hips and knees.'
            }
        };
        
        const exercise = exercises[exerciseId] || exercises['1'];
        
        // Set form values
        document.getElementById('exercise-id').value = exercise.id;
        document.getElementById('exercise-name').value = exercise.name;
        document.getElementById('exercise-category').value = exercise.category_id;
        document.getElementById('exercise-equipment').value = exercise.equipment;
        document.getElementById('exercise-muscle-group').value = exercise.muscle_group;
        document.getElementById('exercise-compound').checked = exercise.is_compound;
        document.getElementById('exercise-description').value = exercise.description || '';
        document.getElementById('exercise-instructions').value = exercise.instructions || '';
        
        // Set modal title
        document.getElementById('exercise-modal-title').textContent = 'Edit Exercise';
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('add-exercise-modal'));
        modal.show();
    },
    
    // Save exercise
    saveExercise: function() {
        const exerciseForm = document.getElementById('exercise-form');
        if (!exerciseForm) return;
        
        // Get form values
        const exerciseId = document.getElementById('exercise-id').value;
        const exerciseName = document.getElementById('exercise-name').value;
        const categoryId = document.getElementById('exercise-category').value;
        const equipment = document.getElementById('exercise-equipment').value;
        const muscleGroup = document.getElementById('exercise-muscle-group').value;
        const isCompound = document.getElementById('exercise-compound').checked;
        const description = document.getElementById('exercise-description').value;
        const instructions = document.getElementById('exercise-instructions').value;
        
        // In a real app, this would send the data to the API
        // For demo, we'll just show a toast and close the modal
        
        // Determine if this is a create or update operation
        const action = exerciseId ? 'updated' : 'added';
        FitTrack.showToast(`Exercise ${exerciseName} ${action} successfully!`, 'success');
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('add-exercise-modal'));
        if (modal) {
            modal.hide();
        }
        
        // Reload exercises
        this.loadExercises();
    },
    
    // Show create workout modal
    showCreateWorkoutModal: function() {
        // Implement create workout modal
        FitTrack.showToast('Create workout functionality would be implemented here', 'info');
    },
    
    // Show edit workout modal
showEditWorkoutModal: function(workoutId) {
    // In a real app, this would fetch the workout details from the API
    // For demo, we'll use hardcoded values
    const workouts = {
        '1': {
            id: 1,
            name: 'Workout A',
            description: 'Starting Strength main workout with squat, bench, and deadlift',
            type: 'Strength',
            exercises: [
                { id: 1, exercise_id: 1, name: 'Squat', sets: 3, reps: '5', rest_period: 180, order: 1 },
                { id: 2, exercise_id: 2, name: 'Bench Press', sets: 3, reps: '5', rest_period: 180, order: 2 },
                { id: 3, exercise_id: 3, name: 'Deadlift', sets: 1, reps: '5', rest_period: 180, order: 3 }
            ]
        },
        '2': {
            id: 2,
            name: 'Workout B',
            description: 'Starting Strength alternate workout with squat, press, and rows',
            type: 'Strength',
            exercises: [
                { id: 4, exercise_id: 1, name: 'Squat', sets: 3, reps: '5', rest_period: 180, order: 1 },
                { id: 5, exercise_id: 4, name: 'Overhead Press', sets: 3, reps: '5', rest_period: 180, order: 2 },
                { id: 6, exercise_id: 6, name: 'Barbell Row', sets: 3, reps: '5', rest_period: 180, order: 3 }
            ]
        },
        '3': {
            id: 3,
            name: 'Upper Body Focus',
            description: 'Upper body workout focusing on chest, shoulders, and back',
            type: 'Hypertrophy',
            exercises: [
                { id: 7, exercise_id: 2, name: 'Bench Press', sets: 4, reps: '8-10', rest_period: 90, order: 1 },
                { id: 8, exercise_id: 4, name: 'Overhead Press', sets: 3, reps: '8-10', rest_period: 90, order: 2 },
                { id: 9, exercise_id: 5, name: 'Pull-up', sets: 3, reps: 'AMRAP', rest_period: 90, order: 3 },
                { id: 10, exercise_id: 7, name: 'Dips', sets: 3, reps: '8-12', rest_period: 90, order: 4 },
                { id: 11, exercise_id: 6, name: 'Barbell Row', sets: 3, reps: '8-10', rest_period: 90, order: 5 }
            ]
        }
    };
    
    const workout = workouts[workoutId];
    
    if (!workout) {
        FitTrack.showToast('Workout not found', 'error');
        return;
    }
    
    // Set form values
    document.getElementById('edit-workout-id').value = workout.id;
    document.getElementById('edit-workout-name').value = workout.name;
    document.getElementById('edit-workout-description').value = workout.description || '';
    
    // Reset exercises container
    const exercisesContainer = document.getElementById('edit-workout-exercises');
    if (exercisesContainer) {
        exercisesContainer.innerHTML = '';
        
        // Add exercises to form
        workout.exercises.forEach((exercise, index) => {
            this.addExerciseToEditForm(exercisesContainer, exercise);
        });
    }
    
    // Set modal title
    document.getElementById('workout-modal-title').textContent = 'Edit Workout';
    
    // Setup add exercise button
    const addExerciseBtn = document.getElementById('add-workout-exercise-btn');
    if (addExerciseBtn) {
        // Remove any existing event listeners
        const newBtn = addExerciseBtn.cloneNode(true);
        addExerciseBtn.parentNode.replaceChild(newBtn, addExerciseBtn);
        
        // Add new event listener
        newBtn.addEventListener('click', () => {
            this.addExerciseToEditForm(exercisesContainer);
        });
    }
    
    // Setup form submission
    const editWorkoutForm = document.getElementById('edit-workout-form');
    if (editWorkoutForm) {
        // Remove any existing event listeners
        const newForm = editWorkoutForm.cloneNode(true);
        editWorkoutForm.parentNode.replaceChild(newForm, editWorkoutForm);
        
        // Add new event listener
        newForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveWorkout();
        });
    }
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('edit-workout-modal'));
    modal.show();
},

// Add exercise to edit workout form
addExerciseToEditForm: function(container, exerciseData = null) {
    if (!container) return;
    
    // Get all exercises for select options
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
    
    // Create exercise options HTML
    let exerciseOptions = '<option value="">Select Exercise</option>';
    
    exercises.forEach(exercise => {
        const selected = exerciseData && exercise.id == exerciseData.exercise_id ? 'selected' : '';
        exerciseOptions += `<option value="${exercise.id}" ${selected}>${exercise.name}</option>`;
    });
    
    // Create exercise item HTML
    const exerciseId = exerciseData ? exerciseData.id : '';
    const sets = exerciseData ? exerciseData.sets : '';
    const reps = exerciseData ? exerciseData.reps : '';
    const restPeriod = exerciseData ? exerciseData.rest_period : '';
    
    const exerciseHtml = `
        <div class="workout-exercise-item mb-3 p-3 border rounded">
            <input type="hidden" name="exercise_ids[]" value="${exerciseId}">
            <div class="row align-items-center">
                <div class="col-md-4 mb-2 mb-md-0">
                    <label class="form-label small">Exercise</label>
                    <select class="form-select" name="exercise_exercise_ids[]" required>
                        ${exerciseOptions}
                    </select>
                </div>
                <div class="col-md-2 mb-2 mb-md-0">
                    <label class="form-label small">Sets</label>
                    <input type="number" class="form-control" name="exercise_sets[]" value="${sets}" min="1" required>
                </div>
                <div class="col-md-2 mb-2 mb-md-0">
                    <label class="form-label small">Reps</label>
                    <input type="text" class="form-control" name="exercise_reps[]" value="${reps}" required>
                </div>
                <div class="col-md-2 mb-2 mb-md-0">
                    <label class="form-label small">Rest (sec)</label>
                    <input type="number" class="form-control" name="exercise_rest[]" value="${restPeriod}" min="0">
                </div>
                <div class="col-md-2 text-end">
                    <button type="button" class="btn btn-sm btn-outline-danger remove-exercise-btn">Remove</button>
                </div>
            </div>
        </div>
    `;
    
    container.insertAdjacentHTML('beforeend', exerciseHtml);
    
    // Add event listener to remove button
    const removeButtons = container.querySelectorAll('.remove-exercise-btn');
    const lastRemoveButton = removeButtons[removeButtons.length - 1];
    
    if (lastRemoveButton) {
        lastRemoveButton.addEventListener('click', (e) => {
            const exerciseItem = e.target.closest('.workout-exercise-item');
            if (exerciseItem && exerciseItem.parentNode) {
                exerciseItem.parentNode.removeChild(exerciseItem);
            }
        });
    }
},

// Save workout changes
saveWorkout: function() {
    // Get form values
    const workoutId = document.getElementById('edit-workout-id').value;
    const workoutName = document.getElementById('edit-workout-name').value;
    const workoutDescription = document.getElementById('edit-workout-description').value;
    
    // Get exercises
    const exerciseItems = document.querySelectorAll('#edit-workout-exercises .workout-exercise-item');
    const exercises = [];
    
    exerciseItems.forEach((item, index) => {
        const exerciseId = item.querySelector('input[name="exercise_ids[]"]').value;
        const exerciseExerciseId = item.querySelector('select[name="exercise_exercise_ids[]"]').value;
        const sets = item.querySelector('input[name="exercise_sets[]"]').value;
        const reps = item.querySelector('input[name="exercise_reps[]"]').value;
        const restPeriod = item.querySelector('input[name="exercise_rest[]"]').value;
        
        // Get exercise name
        const exerciseSelect = item.querySelector('select[name="exercise_exercise_ids[]"]');
        const exerciseName = exerciseSelect.options[exerciseSelect.selectedIndex].text;
        
        exercises.push({
            id: exerciseId,
            exercise_id: exerciseExerciseId,
            name: exerciseName,
            sets: sets,
            reps: reps,
            rest_period: restPeriod,
            order: index + 1
        });
    });
    
    // In a real app, this would save the data to the API
    // For demo purposes, we'll just show a success message
    
    // Validation
    if (!workoutName) {
        FitTrack.showToast('Please enter a workout name', 'warning');
        return;
    }
    
    if (exercises.length === 0) {
        FitTrack.showToast('Please add at least one exercise to the workout', 'warning');
        return;
    }
    
    // Show success message
    FitTrack.showToast(`Workout "${workoutName}" updated successfully`, 'success');
    
    // Close modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('edit-workout-modal'));
    if (modal) {
        modal.hide();
    }
    
    // Reload workouts (in a real app, this would reflect the changes)
    this.loadWorkouts();
},
    
    // Show create template modal
    showCreateTemplateModal: function() {
        // Implement create template modal
        FitTrack.showToast('Create template functionality would be implemented here', 'info');
    },
    
    // Show edit template modal
    showEditTemplateModal: function(templateId) {
        // Implement edit template modal
        FitTrack.showToast(`Edit template ${templateId} functionality would be implemented here`, 'info');
    },
    
    // Show delete confirmation modal
    showDeleteConfirmation: function(itemType, itemId, itemName) {
        // Set confirmation message
        document.getElementById('delete-item-name').textContent = itemName;
        document.getElementById('delete-item-id').value = itemId;
        document.getElementById('delete-item-type').value = itemType;
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('delete-confirmation-modal'));
        modal.show();
    },
    
    // Delete item
    deleteItem: function(itemType, itemId, itemName) {
        // In a real app, this would call the API to delete the item
        // For demo, we'll just show a toast and reload the data
        
        FitTrack.showToast(`${itemType.charAt(0).toUpperCase() + itemType.slice(1)} "${itemName}" deleted successfully!`, 'success');
        
        // Reload appropriate data
        switch (itemType) {
            case 'exercise':
                this.loadExercises();
                break;
            case 'workout':
                this.loadWorkouts();
                break;
            case 'template':
                this.loadTemplates();
                break;
        }
    },
    
    // Save workout settings
    saveWorkoutSettings: function() {
        // In a real app, this would call the API to save the settings
        // For demo, we'll just show a toast
        
        FitTrack.showToast('Workout settings saved successfully!', 'success');
    },
    
    // Save profile settings
    saveProfileSettings: function() {
        // In a real app, this would call the API to save the settings
        // For demo, we'll just show a toast
        
        FitTrack.showToast('Profile settings saved successfully!', 'success');
    }
};

// Initialize admin module when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    FitAdmin.init();
});