/**
 * Charts JavaScript file for FitTrack Exercise App
 * Path: /exercise-app/assets/js/charts.js
 */

// Charts module for handling all chart-related functionality
const FitCharts = {
    // Default chart colors
    colors: {
        primary: 'rgb(0, 123, 255)',
        primaryLight: 'rgba(0, 123, 255, 0.5)',
        success: 'rgb(40, 167, 69)',
        successLight: 'rgba(40, 167, 69, 0.5)',
        danger: 'rgb(220, 53, 69)',
        dangerLight: 'rgba(220, 53, 69, 0.5)',
        warning: 'rgb(255, 193, 7)',
        warningLight: 'rgba(255, 193, 7, 0.5)',
        info: 'rgb(23, 162, 184)',
        infoLight: 'rgba(23, 162, 184, 0.5)',
        secondary: 'rgb(108, 117, 125)',
        secondaryLight: 'rgba(108, 117, 125, 0.5)'
    },
    
    // Active charts (for reference/destruction)
    activeCharts: {},
    
    // Initialize charts module
    init: function() {
        // Set default chart.js options
        Chart.defaults.font.family = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
        Chart.defaults.color = "#666";
        Chart.defaults.plugins.tooltip.backgroundColor = "rgba(0, 0, 0, 0.7)";
        Chart.defaults.plugins.legend.labels.boxWidth = 15;
    },
    
    // Create a weight tracking chart
    createWeightChart: function(elementId, data = null, options = {}) {
        const canvas = document.getElementById(elementId);
        if (!canvas) return null;
        
        // Destroy existing chart if it exists
        if (this.activeCharts[elementId]) {
            this.activeCharts[elementId].destroy();
        }
        
        // Sample data if not provided
        if (!data) {
            const labels = [];
            const weights = [];
            const today = new Date();
            
            // Generate sample data for past 30 days
            for (let i = 29; i >= 0; i--) {
                const date = new Date(today);
                date.setDate(date.getDate() - i);
                labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
                
                // Generate weight data starting from 210 lbs with slight variations
                // gradually decreasing to current weight of 202 lbs
                const progress = (30 - i) / 30; // 0 to 1
                const randomFactor = (Math.random() - 0.5) * 0.5; // Random fluctuation
                const weight = 210 - (progress * 8) + randomFactor;
                weights.push(parseFloat(weight.toFixed(1)));
            }
            
            data = {
                labels: labels,
                datasets: [{
                    label: 'Weight (lbs)',
                    data: weights,
                    fill: false,
                    borderColor: this.colors.success,
                    tension: 0.1
                }]
            };
        }
        
        // Default options
        const defaultOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `Weight: ${context.raw} lbs`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    title: {
                        display: true,
                        text: 'Weight (lbs)'
                    }
                }
            }
        };
        
        // Merge default options with provided options
        const chartOptions = {
            ...defaultOptions,
            ...options
        };
        
        // Create chart
        const chart = new Chart(canvas, {
            type: 'line',
            data: data,
            options: chartOptions
        });
        
        // Store reference to chart
        this.activeCharts[elementId] = chart;
        
        return chart;
    },
    
    // Create a workout frequency chart
    createWorkoutFrequencyChart: function(elementId, data = null, options = {}) {
        const canvas = document.getElementById(elementId);
        if (!canvas) return null;
        
        // Destroy existing chart if it exists
        if (this.activeCharts[elementId]) {
            this.activeCharts[elementId].destroy();
        }
        
        // Sample data if not provided
        if (!data) {
            const labels = [];
            const workoutData = [];
            const today = new Date();
            
            // Generate sample data for past 30 days
            for (let i = 29; i >= 0; i--) {
                const date = new Date(today);
                date.setDate(date.getDate() - i);
                labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
                
                // Simulate a workout schedule of 3-4 days per week
                const dayOfWeek = date.getDay();
                // Workouts on Monday (1), Wednesday (3), Friday (5), and sometimes Saturday (6)
                workoutData.push((dayOfWeek === 1 || dayOfWeek === 3 || dayOfWeek === 5 || (dayOfWeek === 6 && Math.random() > 0.5)) ? 1 : 0);
            }
            
            data = {
                labels: labels,
                datasets: [{
                    label: 'Workouts',
                    data: workoutData,
                    backgroundColor: this.colors.primaryLight,
                    borderColor: this.colors.primary,
                    borderWidth: 1
                }]
            };
        }
        
        // Default options
        const defaultOptions = {
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
        };
        
        // Merge default options with provided options
        const chartOptions = {
            ...defaultOptions,
            ...options
        };
        
        // Create chart
        const chart = new Chart(canvas, {
            type: 'bar',
            data: data,
            options: chartOptions
        });
        
        // Store reference to chart
        this.activeCharts[elementId] = chart;
        
        return chart;
    },
    
    // Create a lift progress chart
    createLiftProgressChart: function(elementId, data = null, options = {}) {
        const canvas = document.getElementById(elementId);
        if (!canvas) return null;
        
        // Destroy existing chart if it exists
        if (this.activeCharts[elementId]) {
            this.activeCharts[elementId].destroy();
        }
        
        // Sample data if not provided
        if (!data) {
            const labels = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
            
            // Generate progress data for key lifts
            const benchData = [195, 200, 200, 205, 205, 210, 210, 215, 215, 225];
            const deadliftData = [225, 230, 235, 240, 240, 245, 250, 250, 255, 260];
            const squatData = [185, 190, 195, 195, 200, 205, 210, 210, 215, 220];
            
            data = {
                labels: labels,
                datasets: [
                    {
                        label: 'Bench Press',
                        data: benchData,
                        borderColor: this.colors.primary,
                        backgroundColor: this.colors.primaryLight,
                        tension: 0.1
                    },
                    {
                        label: 'Deadlift',
                        data: deadliftData,
                        borderColor: this.colors.danger,
                        backgroundColor: this.colors.dangerLight,
                        tension: 0.1
                    },
                    {
                        label: 'Squat',
                        data: squatData,
                        borderColor: this.colors.success,
                        backgroundColor: this.colors.successLight,
                        tension: 0.1
                    }
                ]
            };
        }
        
        // Default options
        const defaultOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Key Lifts Progress (lbs)'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${context.raw} lbs`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Session Number'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Weight (lbs)'
                    }
                }
            }
        };
        
        // Merge default options with provided options
        const chartOptions = {
            ...defaultOptions,
            ...options
        };
        
        // Create chart
        const chart = new Chart(canvas, {
            type: 'line',
            data: data,
            options: chartOptions
        });
        
        // Store reference to chart
        this.activeCharts[elementId] = chart;
        
        return chart;
    },
    
    // Create a BJJ sessions chart
    createBjjSessionsChart: function(elementId, data = null, options = {}) {
        const canvas = document.getElementById(elementId);
        if (!canvas) return null;
        
        // Destroy existing chart if it exists
        if (this.activeCharts[elementId]) {
            this.activeCharts[elementId].destroy();
        }
        
        // Sample data if not provided
        if (!data) {
            const labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Week 7', 'Week 8', 'Week 9', 'Week 10'];
            
            // Generate session counts for each week (1-3 sessions per week)
            const sessionCounts = [1, 2, 2, 3, 1, 2, 3, 2, 2, 2];
            
            data = {
                labels: labels,
                datasets: [{
                    label: 'BJJ Sessions',
                    data: sessionCounts,
                    backgroundColor: this.colors.infoLight,
                    borderColor: this.colors.info,
                    borderWidth: 1
                }]
            };
        }
        
        // Default options
        const defaultOptions = {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 5,
                    ticks: {
                        stepSize: 1
                    },
                    title: {
                        display: true,
                        text: 'Sessions'
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
        };
        
        // Merge default options with provided options
        const chartOptions = {
            ...defaultOptions,
            ...options
        };
        
        // Create chart
        const chart = new Chart(canvas, {
            type: 'bar',
            data: data,
            options: chartOptions
        });
        
        // Store reference to chart
        this.activeCharts[elementId] = chart;
        
        return chart;
    },
    
    // Create a weekly progress chart
    createWeeklyProgressChart: function(elementId, data = null, options = {}) {
        const canvas = document.getElementById(elementId);
        if (!canvas) return null;
        
        // Destroy existing chart if it exists
        if (this.activeCharts[elementId]) {
            this.activeCharts[elementId].destroy();
        }
        
        // Sample data if not provided
        if (!data) {
            const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
            
            data = {
                labels: labels,
                datasets: [
                    {
                        label: 'Workouts',
                        data: [1, 0, 1, 0, 1, 0, 0],
                        backgroundColor: this.colors.primaryLight,
                        borderColor: this.colors.primary,
                        borderWidth: 1
                    },
                    {
                        label: 'BJJ',
                        data: [0, 1, 0, 1, 0, 0, 0],
                        backgroundColor: this.colors.infoLight,
                        borderColor: this.colors.info,
                        borderWidth: 1
                    }
                ]
            };
        }
        
        // Default options
        const defaultOptions = {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 1,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        };
        
        // Merge default options with provided options
        const chartOptions = {
            ...defaultOptions,
            ...options
        };
        
        // Create chart
        const chart = new Chart(canvas, {
            type: 'bar',
            data: data,
            options: chartOptions
        });
        
        // Store reference to chart
        this.activeCharts[elementId] = chart;
        
        return chart;
    },
    
    // Create a volume progress chart (total weight lifted over time)
    createVolumeChart: function(elementId, data = null, options = {}) {
        const canvas = document.getElementById(elementId);
        if (!canvas) return null;
        
        // Destroy existing chart if it exists
        if (this.activeCharts[elementId]) {
            this.activeCharts[elementId].destroy();
        }
        
        // Sample data if not provided
        if (!data) {
            const labels = [];
            const volumeData = [];
            const today = new Date();
            
            // Generate sample data for past 10 workouts
            for (let i = 9; i >= 0; i--) {
                const date = new Date(today);
                date.setDate(date.getDate() - i * 3); // Assuming workouts every 3 days
                labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
                
                // Generate increasing volume data with some fluctuation
                const baseVolume = 8000;
                const increase = (9 - i) * 200;
                const randomFactor = (Math.random() - 0.5) * 400;
                
                volumeData.push(Math.round(baseVolume + increase + randomFactor));
            }
            
            data = {
                labels: labels,
                datasets: [{
                    label: 'Volume (lbs)',
                    data: volumeData,
                    backgroundColor: this.colors.warningLight,
                    borderColor: this.colors.warning,
                    borderWidth: 1
                }]
            };
        }
        
        // Default options
        const defaultOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Workout Volume Progression'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `Volume: ${context.raw.toLocaleString()} lbs`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    title: {
                        display: true,
                        text: 'Volume (lbs)'
                    },
                    ticks: {
                        callback: function(value) {
                            return value.toLocaleString();
                        }
                    }
                }
            }
        };
        
        // Merge default options with provided options
        const chartOptions = {
            ...defaultOptions,
            ...options
        };
        
        // Create chart
        const chart = new Chart(canvas, {
            type: 'bar',
            data: data,
            options: chartOptions
        });
        
        // Store reference to chart
        this.activeCharts[elementId] = chart;
        
        return chart;
    },
    
    // Create a PR progression chart
    createPrChart: function(elementId, data = null, options = {}) {
        const canvas = document.getElementById(elementId);
        if (!canvas) return null;
        
        // Destroy existing chart if it exists
        if (this.activeCharts[elementId]) {
            this.activeCharts[elementId].destroy();
        }
        
        // Sample data if not provided
        if (!data) {
            const benchPrs = [
                { date: '2024-10-15', weight: 185 },
                { date: '2024-11-10', weight: 195 },
                { date: '2024-12-05', weight: 205 },
                { date: '2025-01-20', weight: 215 },
                { date: '2025-03-15', weight: 225 }
            ];
            
            const labels = benchPrs.map(pr => {
                const date = new Date(pr.date);
                return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            });
            
            const weights = benchPrs.map(pr => pr.weight);
            
            data = {
                labels: labels,
                datasets: [{
                    label: 'Bench Press PR (lbs)',
                    data: weights,
                    backgroundColor: this.colors.dangerLight,
                    borderColor: this.colors.danger,
                    borderWidth: 1,
                    pointRadius: 6,
                    pointHoverRadius: 8
                }]
            };
        }
        
        // Default options
        const defaultOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Personal Record Progression'
                }
            },
            scales: {
                y: {
                    title: {
                        display: true,
                        text: 'Weight (lbs)'
                    }
                }
            }
        };
        
        // Merge default options with provided options
        const chartOptions = {
            ...defaultOptions,
            ...options
        };
        
        // Create chart
        const chart = new Chart(canvas, {
            type: 'line',
            data: data,
            options: chartOptions
        });
        
        // Store reference to chart
        this.activeCharts[elementId] = chart;
        
        return chart;
    },
    
    // Destroy chart
    destroyChart: function(elementId) {
        if (this.activeCharts[elementId]) {
            this.activeCharts[elementId].destroy();
            delete this.activeCharts[elementId];
            return true;
        }
        return false;
    },
    
    // Destroy all charts
    destroyAllCharts: function() {
        for (const elementId in this.activeCharts) {
            this.destroyChart(elementId);
        }
    },
    
    // Update chart data
    updateChartData: function(elementId, newData) {
        const chart = this.activeCharts[elementId];
        if (!chart) return false;
        
        chart.data = newData;
        chart.update();
        return true;
    }
};

// Initialize charts module when script loads
FitCharts.init();