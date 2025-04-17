const City = require('./models/City');
const User = require('./models/User');
const Trade = require('./models/Trade');
const { verifyJWT } = require('./utils/auth');

// Game state
const gameState = {
  cities: {},
  players: {},
  lastUpdate: Date.now(),
  simulationRate: 1000, // 1 second
  pendingTrades: {},
  simulationSpeed: 1.0,
  isPaused: false
};

/**
 * Set up all Socket.IO event handlers
 * @param {Object} io - Socket.IO instance
 */
function setupSockets(io) {
  // Authenticate socket connections with JWT
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }
      
      const decoded = verifyJWT(token);
      if (!decoded) {
        return next(new Error('Authentication error: Invalid token'));
      }
      
      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }
      
      socket.user = user;
      next();
    } catch (err) {
      console.error('Socket authentication error:', err);
      next(new Error('Authentication error'));
    }
  });

  // Handle socket connections
  io.on('connection', (socket) => {
    console.log(`Player connected: ${socket.id} (User: ${socket.user.username})`);
    
    // Add player to game state
    gameState.players[socket.id] = {
      id: socket.id,
      userId: socket.user._id,
      username: socket.user.username,
      city: null
    };
    
    // Load player's city
    socket.on('loadCity', async (cityId) => {
      try {
        // Check if city belongs to user
        const city = await City.findOne({ 
          _id: cityId, 
          owner: socket.user._id 
        });
        
        if (!city) {
          socket.emit('error', { message: 'City not found or access denied' });
          return;
        }
        
        // Add city to game state
        gameState.cities[cityId] = {
          id: cityId,
          owner: socket.user._id,
          name: city.name,
          grid: city.grid,
          money: city.resources.money,
          population: city.resources.population,
          happiness: city.resources.happiness,
          power: city.resources.power,
          water: city.resources.water,
          jobs: city.resources.jobs,
          lastUpdated: Date.now()
        };
        
        // Link player to city
        gameState.players[socket.id].city = cityId;
        
        // Join city room
        socket.join(`city:${cityId}`);
        
        // Send city data to player
        socket.emit('cityLoaded', gameState.cities[cityId]);
        
        // Notify other players
        socket.broadcast.emit('playerJoined', {
          playerId: socket.id,
          username: socket.user.username,
          cityId: cityId,
          cityName: city.name
        });
      } catch (err) {
        console.error('Error loading city:', err);
        socket.emit('error', { message: 'Error loading city' });
      }
    });
    
    // Create new city
    socket.on('createCity', async (cityData) => {
      try {
        // Create new city in database
        const newCity = new City({
          name: cityData.name,
          owner: socket.user._id,
          grid: cityData.grid,
          resources: {
            money: 10000,
            population: 0,
            happiness: 50,
            power: 0,
            water: 0,
            jobs: 0
          }
        });
        
        await newCity.save();
        
        // Add to game state
        const cityId = newCity._id.toString();
        gameState.cities[cityId] = {
          id: cityId,
          owner: socket.user._id,
          name: newCity.name,
          grid: newCity.grid,
          money: newCity.resources.money,
          population: newCity.resources.population,
          happiness: newCity.resources.happiness,
          power: newCity.resources.power,
          water: newCity.resources.water,
          jobs: newCity.resources.jobs,
          lastUpdated: Date.now()
        };
        
        // Link player to city
        gameState.players[socket.id].city = cityId;
        
        // Join city room
        socket.join(`city:${cityId}`);
        
        // Send city data to player
        socket.emit('cityCreated', {
          id: cityId,
          ...gameState.cities[cityId]
        });
        
        // Notify other players
        socket.broadcast.emit('playerJoined', {
          playerId: socket.id,
          username: socket.user.username,
          cityId: cityId,
          cityName: newCity.name
        });
      } catch (err) {
        console.error('Error creating city:', err);
        socket.emit('error', { message: 'Error creating city' });
      }
    });
    
    // Building placement
    socket.on('placeBuilding', async (data) => {
      const cityId = gameState.players[socket.id].city;
      if (!cityId || !gameState.cities[cityId]) {
        socket.emit('error', { message: 'No active city' });
        return;
      }
      
      // Validate action
      if (!validateBuildingPlacement(cityId, data)) {
        socket.emit('buildingRejected', {
          actionId: data.actionId,
          x: data.x,
          y: data.y,
          reason: 'Invalid placement'
        });
        return;
      }
      
      // Update game state
      const city = gameState.cities[cityId];
      if (!city.grid[data.y]) city.grid[data.y] = [];
      if (!city.grid[data.y][data.x]) city.grid[data.y][data.x] = {};
      
      city.grid[data.y][data.x] = {
        type: data.buildingType,
        occupied: true
      };
      
      city.money -= data.cost;
      city.lastUpdated = Date.now();
      
      // Confirm to the player
      socket.emit('buildingConfirmed', {
        actionId: data.actionId,
        x: data.x,
        y: data.y,
        buildingType: data.buildingType,
        cost: data.cost
      });
      
      // Broadcast to other players in the city
      socket.to(`city:${cityId}`).emit('buildingPlaced', {
        playerId: socket.id,
        username: socket.user.username,
        x: data.x,
        y: data.y,
        buildingType: data.buildingType
      });
      
      // Queue database update
      queueCityUpdate(cityId);
    });
    
    // Building removal
    socket.on('removeBuilding', async (data) => {
      const cityId = gameState.players[socket.id].city;
      if (!cityId || !gameState.cities[cityId]) {
        socket.emit('error', { message: 'No active city' });
        return;
      }
      
      // Validate action
      if (!validateBuildingRemoval(cityId, data)) {
        socket.emit('removalRejected', {
          actionId: data.actionId,
          x: data.x,
          y: data.y,
          reason: 'Invalid removal'
        });
        return;
      }
      
      // Update game state
      const city = gameState.cities[cityId];
      const cell = city.grid[data.y][data.x];
      
      // If water, keep it water
      if (cell.type === 'water') {
        // Do nothing
      } else {
        cell.type = 'grass';
        cell.occupied = false;
      }
      
      city.lastUpdated = Date.now();
      
      // Confirm to the player
      socket.emit('removalConfirmed', {
        actionId: data.actionId,
        x: data.x,
        y: data.y
      });
      
      // Broadcast to other players in the city
      socket.to(`city:${cityId}`).emit('buildingRemoved', {
        playerId: socket.id,
        username: socket.user.username,
        x: data.x,
        y: data.y
      });
      
      // Queue database update
      queueCityUpdate(cityId);
    });
    
    // Trade offers
    socket.on('tradeOffer', async (tradeOffer) => {
      try {
        // Validate the offer
        if (!validateTradeOffer(tradeOffer, socket.user._id)) {
          socket.emit('tradeRejected', {
            tradeId: tradeOffer.id,
            reason: 'Invalid trade offer'
          });
          return;
        }
        
        // Store in database
        const newTrade = new Trade({
          offeredBy: socket.user._id,
          offeredTo: tradeOffer.to,
          offer: tradeOffer.offer,
          request: tradeOffer.request,
          status: 'pending',
          expires: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
        });
        
        await newTrade.save();
        
        // Store in game state
        const tradeId = newTrade._id.toString();
        gameState.pendingTrades[tradeId] = {
          id: tradeId,
          from: socket.user._id,
          to: tradeOffer.to,
          fromUsername: socket.user.username,
          offer: tradeOffer.offer,
          request: tradeOffer.request,
          status: 'pending',
          timestamp: Date.now()
        };
        
        // Find recipient's socket
        const recipientSocket = Object.keys(gameState.players).find(
          sid => gameState.players[sid].userId.toString() === tradeOffer.to
        );
        
        if (recipientSocket) {
          // Send to specific user
          io.to(recipientSocket).emit('tradeOfferReceived', {
            tradeId,
            from: socket.user._id,
            fromUsername: socket.user.username,
            offer: tradeOffer.offer,
            request: tradeOffer.request,
            timestamp: Date.now()
          });
        }
        
        // Confirm to sender
        socket.emit('tradeOfferSent', {
          tradeId,
          to: tradeOffer.to,
          offer: tradeOffer.offer,
          request: tradeOffer.request
        });
      } catch (err) {
        console.error('Error creating trade offer:', err);
        socket.emit('error', { message: 'Error creating trade offer' });
      }
    });
    
    // Trade responses
    socket.on('tradeResponse', async (response) => {
      try {
        const tradeId = response.tradeId;
        const trade = gameState.pendingTrades[tradeId];
        
        if (!trade) {
          socket.emit('error', { message: 'Trade not found' });
          return;
        }
        
        // Verify this user is the recipient
        if (trade.to.toString() !== socket.user._id.toString()) {
          socket.emit('error', { message: 'Not authorized to respond to this trade' });
          return;
        }
        
        // Update in database
        await Trade.findByIdAndUpdate(tradeId, {
          status: response.accept ? 'accepted' : 'rejected'
        });
        
        if (response.accept) {
          // Execute the trade
          const success = executeTrade(trade);
          
          if (!success) {
            socket.emit('error', { message: 'Could not complete trade' });
            return;
          }
          
          // Update trade status
          gameState.pendingTrades[tradeId].status = 'completed';
          
          // Find sender's socket
          const senderSocket = Object.keys(gameState.players).find(
            sid => gameState.players[sid].userId.toString() === trade.from.toString()
          );
          
          if (senderSocket) {
            // Notify sender
            io.to(senderSocket).emit('tradeAccepted', {
              tradeId,
              by: socket.user.username
            });
          }
          
          // Notify recipient
          socket.emit('tradeCompleted', {
            tradeId,
            with: trade.fromUsername
          });
        } else {
          // Update trade status
          gameState.pendingTrades[tradeId].status = 'rejected';
          
          // Find sender's socket
          const senderSocket = Object.keys(gameState.players).find(
            sid => gameState.players[sid].userId.toString() === trade.from.toString()
          );
          
          if (senderSocket) {
            // Notify sender
            io.to(senderSocket).emit('tradeRejected', {
              tradeId,
              by: socket.user.username,
              reason: response.reason || 'Offer rejected'
            });
          }
          
          // Notify recipient
          socket.emit('tradeRejectionSent', {
            tradeId
          });
        }
        
        // Clean up
        setTimeout(() => {
          delete gameState.pendingTrades[tradeId];
        }, 60000); // Remove after 1 minute
      } catch (err) {
        console.error('Error processing trade response:', err);
        socket.emit('error', { message: 'Error processing trade response' });
      }
    });
    
    // Handle time sync requests
    socket.on('timeSyncRequest', () => {
      socket.emit('timeSync', {
        serverTime: Date.now()
      });
    });
    
    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`Player disconnected: ${socket.id}`);
      
      const player = gameState.players[socket.id];
      if (player) {
        // Notify other players
        socket.broadcast.emit('playerLeft', {
          playerId: socket.id,
          username: player.username
        });
        
        // Remove from game state
        delete gameState.players[socket.id];
      }
    });
  });

  // Start the simulation loop
  setInterval(() => {
    if (gameState.isPaused) return;
    
    const now = Date.now();
    const delta = (now - gameState.lastUpdate) * gameState.simulationSpeed;
    gameState.lastUpdate = now;
    
    // Process pending city updates
    processCityUpdates();
    
    // Update all cities
    for (const cityId in gameState.cities) {
      simulateCity(gameState.cities[cityId], delta);
    }
    
    // Broadcast updates to all players
    io.emit('simulationUpdate', {
      timestamp: now,
      simulationSpeed: gameState.simulationSpeed,
      cities: prepareSimulationUpdate()
    });
  }, gameState.simulationRate);
}

/**
 * Validate building placement
 */
function validateBuildingPlacement(cityId, data) {
  const city = gameState.cities[cityId];
  if (!city) return false;
  
  // Check valid coordinates
  if (data.x < 0 || data.y < 0 || data.x >= 20 || data.y >= 20) return false;
  
  // Ensure grid exists at coordinates
  if (!city.grid[data.y]) city.grid[data.y] = [];
  if (!city.grid[data.y][data.x]) city.grid[data.y][data.x] = { type: 'grass', occupied: false };
  
  const cell = city.grid[data.y][data.x];
  
  // Check if cell is buildable
  if (cell.type === 'water' || cell.occupied) return false;
  
  // Check if player can afford it
  if (city.money < data.cost) return false;
  
  return true;
}

/**
 * Validate building removal
 */
function validateBuildingRemoval(cityId, data) {
  const city = gameState.cities[cityId];
  if (!city) return false;
  
  // Check valid coordinates
  if (data.x < 0 || data.y < 0 || data.x >= 20 || data.y >= 20) return false;
  
  // Check if grid exists at coordinates
  if (!city.grid[data.y] || !city.grid[data.y][data.x]) return false;
  
  // Check if cell has a building
  const cell = city.grid[data.y][data.x];
  if (!cell.occupied) return false;
  
  return true;
}

/**
 * Validate trade offer
 */
function validateTradeOffer(tradeOffer, userId) {
  // Basic validation
  if (!tradeOffer.to || !tradeOffer.offer || !tradeOffer.request) return false;
  
  // Check if sender has the resources
  const senderCityId = Object.values(gameState.players).find(
    player => player.userId.toString() === userId.toString()
  )?.city;
  
  if (!senderCityId || !gameState.cities[senderCityId]) return false;
  
  const senderCity = gameState.cities[senderCityId];
  
  // Validate money offer
  if (tradeOffer.offer.money && senderCity.money < tradeOffer.offer.money) return false;
  
  // Validate resource offers (implement based on your resource system)
  // ...
  
  return true;
}

/**
 * Execute a trade between players
 */
function executeTrade(trade) {
  try {
    // Find sender's city
    const senderCityId = Object.values(gameState.players).find(
      player => player.userId.toString() === trade.from.toString()
    )?.city;
    
    // Find recipient's city
    const recipientCityId = Object.values(gameState.players).find(
      player => player.userId.toString() === trade.to.toString()
    )?.city;
    
    if (!senderCityId || !recipientCityId) return false;
    
    const senderCity = gameState.cities[senderCityId];
    const recipientCity = gameState.cities[recipientCityId];
    
    if (!senderCity || !recipientCity) return false;
    
    // Transfer money
    senderCity.money -= trade.offer.money || 0;
    senderCity.money += trade.request.money || 0;
    
    recipientCity.money -= trade.request.money || 0;
    recipientCity.money += trade.offer.money || 0;
    
    // Transfer resources (implement based on your resource system)
    // ...
    
    // Queue database updates
    queueCityUpdate(senderCityId);
    queueCityUpdate(recipientCityId);
    
    return true;
  } catch (err) {
    console.error('Error executing trade:', err);
    return false;
  }
}

// Queue of cities to update in the database
const cityUpdateQueue = new Set();

/**
 * Queue a city for database update
 */
function queueCityUpdate(cityId) {
  cityUpdateQueue.add(cityId);
}

/**
 * Process pending city updates
 */
async function processCityUpdates() {
  if (cityUpdateQueue.size === 0) return;
  
  const cityIds = Array.from(cityUpdateQueue);
  cityUpdateQueue.clear();
  
  try {
    for (const cityId of cityIds) {
      const city = gameState.cities[cityId];
      if (!city) continue;
      
      // Update in database
      await City.findByIdAndUpdate(cityId, {
        grid: city.grid,
        'resources.money': city.money,
        'resources.population': city.population,
        'resources.happiness': city.happiness,
        'resources.power': city.power,
        'resources.water': city.water,
        'resources.jobs': city.jobs,
        lastUpdated: new Date()
      });
    }
  } catch (err) {
    console.error('Error updating cities in database:', err);
    // Re-queue failed updates
    for (const cityId of cityIds) {
      cityUpdateQueue.add(cityId);
    }
  }
}

/**
 * Simulate city for a time step
 */
function simulateCity(city, deltaTime) {
  // Convert delta to seconds
  const delta = deltaTime / 1000;
  
  // Reset counters
  let powerProduction = 0;
  let powerConsumption = 0;
  let waterProduction = 0;
  let waterConsumption = 0;
  let jobsAvailable = 0;
  let residentialCapacity = 0;
  let happiness = 50; // Base happiness
  
  // Process all buildings
  for (let y = 0; y < city.grid.length; y++) {
    if (!city.grid[y]) continue;
    
    for (let x = 0; x < city.grid[y].length; x++) {
      if (!city.grid[y][x]) continue;
      
      const cell = city.grid[y][x];
      if (cell.occupied && cell.type !== 'grass' && cell.type !== 'water') {
        // Get building info
        const buildingInfo = getBuildingInfo(cell.type);
        if (!buildingInfo) continue;
        
        // Add to counters
        residentialCapacity += buildingInfo.residents || 0;
        jobsAvailable += buildingInfo.workers || 0;
        
        if (buildingInfo.power > 0) {
          powerProduction += buildingInfo.power;
        } else {
          powerConsumption -= buildingInfo.power;
        }
        
        if (buildingInfo.water > 0) {
          waterProduction += buildingInfo.water;
        } else {
          waterConsumption -= buildingInfo.water;
        }
        
        happiness += buildingInfo.happiness || 0;
      }
    }
  }
  
  // Calculate population growth based on residential capacity
  const targetPopulation = Math.min(residentialCapacity, residentialCapacity * (city.happiness / 100));
  const populationDelta = (targetPopulation - city.population) * 0.1 * delta;
  city.population = Math.max(0, city.population + populationDelta);
  
  // Calculate power and water balance
  city.power = powerProduction - powerConsumption;
  city.water = waterProduction - waterConsumption;
  
  // Adjust happiness based on conditions
  const unemploymentRate = city.population > 0 ? Math.max(0, city.population - jobsAvailable) / city.population : 0;
  happiness -= unemploymentRate * 30; // Up to -30 for 100% unemployment
  
  if (city.power < 0) happiness -= 20;
  if (city.water < 0) happiness -= 20;
  
  city.happiness = Math.max(0, Math.min(100, happiness));
  
  // Update jobs
  city.jobs = jobsAvailable;
  
  // Calculate income based on population and businesses
  const income = city.population * 10; // $10 per resident
  const expenses = city.population * 5; // $5 per resident for services
  const netIncome = income - expenses;
  
  // Update money
  city.money += netIncome * delta;
  
  // Update last updated timestamp
  city.lastUpdated = Date.now();
}

/**
 * Prepare city data for simulation update broadcast
 * Only sends essential info to minimize bandwidth
 */
function prepareSimulationUpdate() {
  const update = {};
  
  for (const cityId in gameState.cities) {
    const city = gameState.cities[cityId];
    
    update[cityId] = {
      money: city.money,
      population: city.population,
      happiness: city.happiness,
      power: city.power,
      water: city.water,
      jobs: city.jobs
    };
  }
  
  return update;
}

/**
 * Get building info from building type
 */
function getBuildingInfo(buildingType) {
  // This should be imported from a central building definitions file
  const BUILDINGS = {
    'residential_small': {
      residents: 4,
      workers: 0,
      power: -1,
      water: -1,
      happiness: 1
    },
    'residential_medium': {
      residents: 40,
      workers: 0,
      power: -10,
      water: -10,
      happiness: 0
    },
    'commercial_small': {
      residents: 0,
      workers: 5,
      power: -2,
      water: -1,
      happiness: 1
    },
    'commercial_medium': {
      residents: 0,
      workers: 50,
      power: -20,
      water: -10,
      happiness: 2
    },
    'industrial_small': {
      residents: 0,
      workers: 10,
      power: -5,
      water: -5,
      happiness: -2
    },
    'industrial_medium': {
      residents: 0,
      workers: 100,
      power: -50,
      water: -25,
      happiness: -5
    },
    'power_plant': {
      residents: 0,
      workers: 20,
      power: 1000,
      water: -50,
      happiness: -5
    },
    'water_plant': {
      residents: 0,
      workers: 10,
      power: -20,
      water: 1000,
      happiness: 0
    },
    'park': {
      residents: 0,
      workers: 2,
      power: 0,
      water: -5,
      happiness: 10
    },
    'police_station': {
      residents: 0,
      workers: 20,
      power: -5,
      water: -5,
      happiness: 5
    }
  };
  
  return BUILDINGS[buildingType] || null;
}

module.exports = setupSockets;