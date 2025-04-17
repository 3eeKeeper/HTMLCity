/**
 * City class for the city builder game
 */
class City {
    constructor(width, height, multiplayer = false) {
        this.width = width || 20;
        this.height = height || 20;
        this.grid = [];
        this.money = 10000;
        this.population = 0;
        this.happiness = 50; // 0-100 scale
        this.jobs = 0;
        this.power = 0;
        this.water = 0;
        
        // Game state
        this.selectedBuilding = null;
        this.bulldozerMode = false;
        
        // Multiplayer properties
        this.multiplayer = multiplayer;
        this.playerId = null;
        this.pendingActions = {};
        
        // Stats
        this.stats = {
            income: 0,
            expenses: 0,
            netIncome: 0,
            unemployed: 0,
            homelessness: 0,
            powerDeficit: 0,
            waterDeficit: 0
        };
        
        // Initialize grid with empty cells
        this.initializeGrid();
    }
    
    /**
     * Initialize the city grid with empty cells
     */
    initializeGrid() {
        this.grid = [];
        
        for (let y = 0; y < this.height; y++) {
            const row = [];
            for (let x = 0; x < this.width; x++) {
                // Start with mostly grass, some water
                let tileType = 'grass';
                if (Math.random() < 0.05) {
                    tileType = 'water';
                }
                
                row.push({
                    x: x,
                    y: y,
                    type: tileType, // Terrain type
                    building: null, // Building type
                    occupied: tileType === 'water' ? true : false
                });
            }
            this.grid.push(row);
        }
    }
    
    /**
     * Load city data from server
     */
    loadFromServer(cityData) {
        // Copy grid data
        if (cityData.grid) {
            this.grid = [];
            
            for (let y = 0; y < this.height; y++) {
                const row = [];
                for (let x = 0; x < this.width; x++) {
                    // Use server data if available, or create empty cell
                    if (cityData.grid[y] && cityData.grid[y][x]) {
                        row.push({
                            x: x,
                            y: y,
                            type: cityData.grid[y][x].type,
                            occupied: cityData.grid[y][x].occupied
                        });
                    } else {
                        // Default to grass
                        row.push({
                            x: x,
                            y: y,
                            type: 'grass',
                            occupied: false
                        });
                    }
                }
                this.grid.push(row);
            }
        }
        
        // Copy resources
        this.money = cityData.money || 10000;
        this.population = cityData.population || 0;
        this.happiness = cityData.happiness || 50;
        this.power = cityData.power || 0;
        this.water = cityData.water || 0;
        this.jobs = cityData.jobs || 0;
    }
    
    /**
     * Sync city with server update
     */
    syncWithServerUpdate(update) {
        // Apply server-authoritative data
        if (update.cities && update.cities[this._id]) {
            const cityUpdate = update.cities[this._id];
            
            // Update resources
            this.money = cityUpdate.money;
            this.population = cityUpdate.population;
            this.happiness = cityUpdate.happiness;
            this.power = cityUpdate.power;
            this.water = cityUpdate.water;
            this.jobs = cityUpdate.jobs;
            
            // Update simulation speed if provided
            if (update.simulationSpeed) {
                this.simulationSpeed = update.simulationSpeed;
            }
            
            // Update UI
            this.updateUI();
        }
    }
    
    /**
     * Get a cell at specified coordinates
     */
    getCell(x, y) {
        if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
            return this.grid[y][x];
        }
        return null;
    }
    
    /**
     * Place a building at the specified coordinates
     */
    placeBuilding(x, y, buildingType, cost) {
        const cell = this.getCell(x, y);
        
        // Check if cell exists and is buildable
        if (!cell) return false;
        if (cell.type === 'water') return false;
        if (cell.occupied) return false;
        
        // Check if we can afford it
        if (this.money < cost) {
            this.showMessage('Not enough money!');
            return false;
        }
        
        if (this.multiplayer) {
            // Generate action ID
            const actionId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            // Store original state for possible rollback
            this.pendingActions[actionId] = {
                type: 'placeBuilding',
                x, y, buildingType, cost,
                timestamp: Date.now(),
                cellStateBefore: { ...cell }
            };
            
            // Optimistically update locally
            cell.type = buildingType;
            cell.occupied = true;
            this.money -= cost;
            
            // Send to server
            if (window.socket) {
                window.socket.emit('placeBuilding', {
                    actionId,
                    x, y, buildingType, cost,
                    timestamp: Date.now()
                });
            }
            
            // Update city stats
            this.updateCityStats();
            
            // Trigger UI update
            this.updateUI();
            
            return true;
        } else {
            // Single-player mode - direct update
            
            // Place the building
            cell.type = buildingType;
            cell.occupied = true;
            
            // Deduct cost
            this.money -= cost;
            
            // Update city stats
            this.updateCityStats();
            
            // Trigger UI update
            this.updateUI();
            
            return true;
        }
    }
    
    /**
     * Remove a building at the specified coordinates
     */
    removeBuilding(x, y) {
        const cell = this.getCell(x, y);
        
        // Check if cell exists and has a building
        if (!cell || !cell.occupied) return false;
        
        if (this.multiplayer) {
            // Generate action ID
            const actionId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            // Store original state for possible rollback
            this.pendingActions[actionId] = {
                type: 'removeBuilding',
                x, y,
                timestamp: Date.now(),
                cellStateBefore: { ...cell }
            };
            
            // Optimistically update locally
            if (cell.type === 'water') {
                // Keep water as water
            } else {
                // Restore to grass
                cell.type = 'grass';
                cell.occupied = false;
            }
            
            // Send to server
            if (window.socket) {
                window.socket.emit('removeBuilding', {
                    actionId,
                    x, y,
                    timestamp: Date.now()
                });
            }
            
            // Update city stats
            this.updateCityStats();
            
            // Trigger UI update
            this.updateUI();
            
            return true;
        } else {
            // Single-player mode - direct update
            
            // If it's water, we can't build here again
            if (cell.type === 'water') {
                // Do nothing, we keep water as water
            } else {
                // Restore to grass
                cell.type = 'grass';
                cell.occupied = false;
            }
            
            // Update city stats
            this.updateCityStats();
            
            // Trigger UI update
            this.updateUI();
            
            return true;
        }
    }
    
    /**
     * Handle remote building placement
     */
    handleRemoteBuildingPlacement(data) {
        const cell = this.getCell(data.x, data.y);
        if (!cell) return false;
        
        // Update the cell
        cell.type = data.buildingType;
        cell.occupied = true;
        
        // Update city stats
        this.updateCityStats();
        
        return true;
    }
    
    /**
     * Handle remote building removal
     */
    handleRemoteBuildingRemoval(data) {
        const cell = this.getCell(data.x, data.y);
        if (!cell) return false;
        
        // If it's water, we can't build here again
        if (cell.type === 'water') {
            // Do nothing, we keep water as water
        } else {
            // Restore to grass
            cell.type = 'grass';
            cell.occupied = false;
        }
        
        // Update city stats
        this.updateCityStats();
        
        return true;
    }
    
    /**
     * Roll back a pending action
     */
    rollbackAction(actionId) {
        const action = this.pendingActions[actionId];
        if (!action) return;
        
        // Roll back based on action type
        switch (action.type) {
            case 'placeBuilding':
                const cell = this.getCell(action.x, action.y);
                if (cell) {
                    cell.type = action.cellStateBefore.type;
                    cell.occupied = action.cellStateBefore.occupied;
                }
                this.money += action.cost;
                break;
                
            case 'removeBuilding':
                const removeCell = this.getCell(action.x, action.y);
                if (removeCell) {
                    removeCell.type = action.cellStateBefore.type;
                    removeCell.occupied = action.cellStateBefore.occupied;
                }
                break;
        }
        
        // Remove the pending action
        delete this.pendingActions[actionId];
        
        // Update city stats
        this.updateCityStats();
        
        // Trigger UI update
        this.updateUI();
    }
    
    /**
     * Update all city statistics
     */
    updateCityStats() {
        // Reset stats
        this.population = 0;
        this.jobs = 0;
        this.power = 0;
        this.water = 0;
        this.happiness = 50; // Base happiness
        
        // Calculate raw resources and population
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const cell = this.getCell(x, y);
                
                if (cell.occupied && cell.type !== 'grass' && cell.type !== 'water') {
                    const buildingInfo = getBuildingInfo(cell.type);
                    
                    if (buildingInfo) {
                        // Add building's contribution to city stats
                        this.population += buildingInfo.residents;
                        this.jobs += buildingInfo.workers;
                        this.power += buildingInfo.power;
                        this.water += buildingInfo.water;
                        this.happiness += buildingInfo.happiness;
                    }
                }
            }
        }
        
        // Calculate employment rate
        const workingPopulation = Math.min(this.population, this.jobs);
        this.stats.unemployed = Math.max(0, this.population - this.jobs);
        this.stats.homelessness = 0; // For future use
        
        // Calculate power and water balance
        this.stats.powerDeficit = Math.max(0, -this.power);
        this.stats.waterDeficit = Math.max(0, -this.water);
        
        // Adjust happiness based on unemployment and resource deficits
        if (this.population > 0) {
            const unemploymentRate = this.stats.unemployed / this.population;
            this.happiness -= unemploymentRate * 30; // Up to -30 happiness for 100% unemployment
        }
        
        if (this.stats.powerDeficit > 0) this.happiness -= 20;
        if (this.stats.waterDeficit > 0) this.happiness -= 20;
        
        // Ensure happiness is within bounds
        this.happiness = Math.max(0, Math.min(100, this.happiness));
        
        // Calculate financial stats (simple model for now)
        this.stats.income = this.population * 10; // Each resident contributes $10
        this.stats.expenses = this.population * 5; // Each resident costs $5 in services
        this.stats.netIncome = this.stats.income - this.stats.expenses;
    }
    
    /**
     * Update the game UI
     */
    updateUI() {
        // Update money display
        const moneyElement = document.getElementById('money');
        if (moneyElement) {
            moneyElement.textContent = '$' + this.money.toLocaleString();
        }
        
        // Update population display
        const populationElement = document.getElementById('population');
        if (populationElement) {
            populationElement.textContent = this.population.toLocaleString();
        }
        
        // Update happiness display
        const happinessElement = document.getElementById('happiness');
        if (happinessElement) {
            happinessElement.textContent = Math.round(this.happiness) + '%';
        }
        
        // Update resources
        const powerElement = document.getElementById('power');
        if (powerElement) {
            powerElement.textContent = this.power;
        }
        
        const waterElement = document.getElementById('water');
        if (waterElement) {
            waterElement.textContent = this.water;
        }
        
        // Update jobs
        const jobsElement = document.getElementById('jobs');
        if (jobsElement) {
            jobsElement.textContent = this.jobs.toLocaleString();
        }
        
        const unemployedElement = document.getElementById('unemployed');
        if (unemployedElement) {
            unemployedElement.textContent = this.stats.unemployed.toLocaleString();
        }
    }
    
    /**
     * Simulate one time step
     */
    simulate(delta = 1000) {
        // Only run simulation in single-player mode
        if (this.multiplayer) return;
        
        // Convert delta to seconds
        const secondsDelta = delta / 1000;
        
        // Add income to city budget
        this.money += this.stats.netIncome * secondsDelta;
        
        // Update city stats
        this.updateCityStats();
        
        // Trigger UI update
        this.updateUI();
    }
    
    /**
     * Select a building to place
     */
    selectBuilding(buildingType) {
        const buildingInfo = getBuildingInfo(buildingType);
        
        if (buildingInfo) {
            this.selectedBuilding = {
                type: buildingType,
                cost: buildingInfo.cost
            };
            this.bulldozerMode = false;
        }
    }
    
    /**
     * Toggle bulldozer mode
     */
    toggleBulldozer() {
        this.bulldozerMode = !this.bulldozerMode;
        this.selectedBuilding = null;
    }
    
    /**
     * Show a message to the user
     */
    showMessage(message) {
        const messageContainer = document.getElementById('message-container') || createMessageContainer();
        const messageElement = document.createElement('div');
        messageElement.className = 'message';
        messageElement.textContent = message;
        
        messageContainer.appendChild(messageElement);
        
        // Remove the message after a delay
        setTimeout(() => {
            messageElement.style.opacity = '0';
            setTimeout(() => {
                if (messageContainer.contains(messageElement)) {
                    messageContainer.removeChild(messageElement);
                }
            }, 500);
        }, 3000);
    }
}

// Create message container if it doesn't exist
function createMessageContainer() {
    const container = document.createElement('div');
    container.id = 'message-container';
    container.className = 'message-container';
    document.body.appendChild(container);
    return container;
}

/**
 * Save the city to local storage (single-player only)
 */
City.prototype.save = function() {
    // Only for single-player mode
    if (this.multiplayer) return false;
    
    // Create a serializable version of the city
    const cityData = {
        width: this.width,
        height: this.height,
        money: this.money,
        grid: []
    };
    
    // Save each cell's data
    for (let y = 0; y < this.height; y++) {
        const row = [];
        for (let x = 0; x < this.width; x++) {
            const cell = this.getCell(x, y);
            row.push({
                type: cell.type,
                occupied: cell.occupied
            });
        }
        cityData.grid.push(row);
    }
    
    // Save to local storage
    try {
        localStorage.setItem('htmlCity', JSON.stringify(cityData));
        this.showMessage('City saved successfully!');
        return true;
    } catch (e) {
        this.showMessage('Error saving city: ' + e.message);
        return false;
    }
};

/**
 * Load the city from local storage (single-player only)
 */
City.prototype.load = function() {
    // Only for single-player mode
    if (this.multiplayer) return false;
    
    try {
        const savedCity = localStorage.getItem('htmlCity');
        if (!savedCity) {
            this.showMessage('No saved city found!');
            return false;
        }
        
        const cityData = JSON.parse(savedCity);
        
        // Validate the data
        if (!cityData.grid || !cityData.width || !cityData.height) {
            this.showMessage('Invalid save data!');
            return false;
        }
        
        // Apply the data to the current city
        this.width = cityData.width;
        this.height = cityData.height;
        this.money = cityData.money || 10000;
        
        // Load the grid
        this.grid = [];
        for (let y = 0; y < this.height; y++) {
            const row = [];
            for (let x = 0; x < this.width; x++) {
                const savedCell = cityData.grid[y][x];
                row.push({
                    x: x,
                    y: y,
                    type: savedCell.type,
                    occupied: savedCell.occupied
                });
            }
            this.grid.push(row);
        }
        
        // Update city stats
        this.updateCityStats();
        
        // Update UI
        this.updateUI();
        
        this.showMessage('City loaded successfully!');
        return true;
    } catch (e) {
        this.showMessage('Error loading city: ' + e.message);
        return false;
    }
};