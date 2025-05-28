/**
 * Main entry point for the HTMLCity game
 */

// Game objects
let city;
let renderer;
let socket;

// Game timing
let lastUpdate = Date.now();
const TIME_STEP = 1000; // Simulate city every second

// Game state
let gameState = {
  currentCity: null,
  cities: [],
  players: {},
  pendingTrades: [],
  simulationSpeed: 1.0,
  isPaused: false,
  serverTimeOffset: 0
};

// Initialize game
async function init() {
  // Set up UI event listeners
  setupUIListeners();
}

// Show dashboard screen
async function showDashboard() {
  // Get user's cities
  const cities = JSON.parse(localStorage.getItem('cities')) || [];
  gameState.cities = cities;
  
  const gameContainer = document.querySelector('.game-container');
  gameContainer.innerHTML = `
    <div class="dashboard-container">
      <div class="dashboard-header">
        <h1>HTMLCity</h1>
      </div>
      
      <div class="dashboard-content">
        <div class="dashboard-section">
          <h2>My Cities</h2>
          <div class="city-list" id="city-list">
            ${cities.length === 0 ? '<p>You have no cities yet. Create one to get started!</p>' : ''}
            ${cities.map(city => `
              <div class="city-card" data-id="${city._id}">
                <h3>${city.name}</h3>
                <div class="city-stats">
                  <div class="city-stat">
                    <span class="label">Population:</span>
                    <span class="value">${city.resources.population.toLocaleString()}</span>
                  </div>
                  <div class="city-stat">
                    <span class="label">Money:</span>
                    <span class="value">$${city.resources.money.toLocaleString()}</span>
                  </div>
                  <div class="city-stat">
                    <span class="label">Happiness:</span>
                    <span class="value">${city.resources.happiness}%</span>
                  </div>
                </div>
                <button class="btn-primary play-btn">Play</button>
              </div>
            `).join('')}
          </div>
          <button id="new-city-btn" class="btn-primary">Create New City</button>
        </div>
        
        <div class="dashboard-section">
          <h2>Leaderboard</h2>
          <div class="leaderboard-tabs">
            <button class="leaderboard-tab active" data-sort="population">Population</button>
            <button class="leaderboard-tab" data-sort="happiness">Happiness</button>
            <button class="leaderboard-tab" data-sort="wealth">Wealth</button>
          </div>
          <div class="leaderboard-list" id="leaderboard-list">
            <div class="loading">Loading leaderboard...</div>
          </div>
        </div>
      </div>
    </div>
  `;
  
  // Setup dashboard event listeners
  // City list click handlers
  document.querySelectorAll('.city-card .play-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const cityId = e.target.closest('.city-card').dataset.id;
      const selectedCity = gameState.cities.find(c => c._id === cityId);
      startGame(selectedCity);
    });
  });
  
  // New city button
  document.getElementById('new-city-btn').addEventListener('click', () => {
    showNewCityModal();
  });
  
  // Load leaderboard
  loadLeaderboard('population');
  
  // Leaderboard tab handlers
  document.querySelectorAll('.leaderboard-tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
      document.querySelectorAll('.leaderboard-tab').forEach(t => t.classList.remove('active'));
      e.target.classList.add('active');
      loadLeaderboard(e.target.dataset.sort);
    });
  });
}

// Load leaderboard
async function loadLeaderboard(sort) {
  const leaderboardList = document.getElementById('leaderboard-list');
  leaderboardList.innerHTML = '<div class="loading">Loading leaderboard...</div>';
  
  try {
    // Simulate fetching leaderboard data
    const response = await new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          cities: JSON.parse(localStorage.getItem('cities')) || []
        });
      }, 1000);
    });
    
    const data = response;
    
    if (!data.success) {
      leaderboardList.innerHTML = '<div class="error">Failed to load leaderboard</div>';
      return;
    }
    
    if (data.cities.length === 0) {
      leaderboardList.innerHTML = '<div class="empty">No cities found</div>';
      return;
    }
    
    let sortLabel;
    switch (sort) {
      case 'population':
        sortLabel = 'Population';
        break;
      case 'happiness':
        sortLabel = 'Happiness';
        break;
      case 'wealth':
        sortLabel = 'Money';
        break;
      case 'buildings':
        sortLabel = 'Buildings';
        break;
      default:
        sortLabel = 'Population';
    }
    
    leaderboardList.innerHTML = `
      <div class="leaderboard-header">
        <span class="leaderboard-rank">#</span>
        <span class="leaderboard-name">City</span>
        <span class="leaderboard-owner">Owner</span>
        <span class="leaderboard-value">${sortLabel}</span>
      </div>
      ${data.cities.sort((a, b) => b.resources[sort] - a.resources[sort]).map((city, index) => `
        <div class="leaderboard-item">
          <span class="leaderboard-rank">${index + 1}</span>
          <span class="leaderboard-name">${city.name}</span>
          <span class="leaderboard-owner">${city.owner.username}</span>
          <span class="leaderboard-value">
            ${sort === 'population' ? city.resources.population.toLocaleString() : 
              sort === 'happiness' ? `${city.resources.happiness}%` :
              sort === 'wealth' ? `$${city.resources.money.toLocaleString()}` :
              city.buildings.total.toLocaleString()}
          </span>
        </div>
      `).join('')}
    `;
  } catch (err) {
    console.error('Error loading leaderboard:', err);
    leaderboardList.innerHTML = '<div class="error">Failed to load leaderboard</div>';
  }
}

// Show new city modal
function showNewCityModal() {
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-content">
      <span class="close">&times;</span>
      <h2>Create New City</h2>
      <form id="new-city-form">
        <div class="form-group">
          <label for="city-name">City Name</label>
          <input type="text" id="city-name" required minlength="3" maxlength="30">
        </div>
        <div class="form-group">
          <label for="city-description">Description (Optional)</label>
          <textarea id="city-description" maxlength="500"></textarea>
        </div>
        <div class="form-group">
          <label>
            <input type="checkbox" id="city-public" checked>
            Make city visible on leaderboard
          </label>
        </div>
        <button type="submit" class="btn-primary">Create City</button>
        <div id="city-error" class="error-message"></div>
      </form>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Close button
  modal.querySelector('.close').addEventListener('click', () => {
    document.body.removeChild(modal);
  });
  
  // Close when clicking outside
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      document.body.removeChild(modal);
    }
  });
  
  // Form submission
  document.getElementById('new-city-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('city-name').value;
    const description = document.getElementById('city-description').value;
    const isPublic = document.getElementById('city-public').checked;
    
    // Create new city object
    const newCity = {
      _id: `${Date.now()}-${Math.random()}`,
      name,
      description,
      isPublic,
      resources: {
        money: 1000,
        population: 0,
        happiness: 100,
        power: 0,
        water: 0,
        jobs: 0
      },
      buildings: {
        total: 0,
        residential: 0,
        commercial: 0,
        industrial: 0,
        utilities: 0,
        special: 0,
        transportation: 0,
        decorative: 0
      },
      owner: {
        username: 'You',
        userId: 'your-user-id'
      }
    };
    
    // Save to localStorage
    const cities = JSON.parse(localStorage.getItem('cities')) || [];
    cities.push(newCity);
    localStorage.setItem('cities', JSON.stringify(cities));
    
    // Add city to state
    gameState.cities.push(newCity);
    
    // Close modal
    document.body.removeChild(modal);
    
    // Refresh dashboard
    showDashboard();
  });
}

// Start the game with selected city
async function startGame(selectedCity) {
  gameState.currentCity = selectedCity;
  
  // Create city (20x20 grid)
  city = new City(20, 20, true);
  city.playerId = 'your-user-id';
  
  // Create renderer
  renderer = new Renderer('game-canvas', city);
  
  // Update the UI to game view
  showGameUI();
  
  // Connect to WebSocket
  connectSocket();
  
  // Set up game UI event listeners
  setupGameUIListeners();
  
  // Start game loop
  requestAnimationFrame(gameLoop);
  
  // Start simulation loop (will be disabled in multiplayer mode)
  // setInterval(simulationLoop, TIME_STEP);
}

// Show game UI
function showGameUI() {
  const gameContainer = document.querySelector('.game-container');
  gameContainer.innerHTML = `
    <div class="sidebar">
      <div class="sidebar-header">
        <h1>HTMLCity</h1>
        <h3>${gameState.currentCity.name}</h3>
      </div>
      <div class="resources">
        <div class="resource">
          <span class="label">Money:</span>
          <span id="money">$${gameState.currentCity.resources.money.toLocaleString()}</span>
        </div>
        <div class="resource">
          <span class="label">Population:</span>
          <span id="population">${gameState.currentCity.resources.population.toLocaleString()}</span>
        </div>
        <div class="resource">
          <span class="label">Happiness:</span>
          <span id="happiness">${gameState.currentCity.resources.happiness}%</span>
        </div>
        <div class="resource">
          <span class="label">Power:</span>
          <span id="power">${gameState.currentCity.resources.power}</span>
        </div>
        <div class="resource">
          <span class="label">Water:</span>
          <span id="water">${gameState.currentCity.resources.water}</span>
        </div>
        <div class="resource">
          <span class="label">Jobs:</span>
          <span id="jobs">${gameState.currentCity.resources.jobs.toLocaleString()}</span>
        </div>
        <div class="resource">
          <span class="label">Unemployed:</span>
          <span id="unemployed">0</span>
        </div>
      </div>
      <div class="building-menu">
        <h3>Buildings</h3>
        <div class="building-group">
          <h4>Residential</h4>
          <div class="building-buttons">
            <button class="building-btn" data-building="residential_small" data-cost="100">
              Small House ($100)
            </button>
            <button class="building-btn" data-building="residential_medium" data-cost="1000">
              Apartment ($1000)
            </button>
            <button class="building-btn" data-building="residential_large" data-cost="5000">
              Condo ($5000)
            </button>
          </div>
        </div>
        <div class="building-group">
          <h4>Commercial</h4>
          <div class="building-buttons">
            <button class="building-btn" data-building="commercial_small" data-cost="150">
              Small Shop ($150)
            </button>
            <button class="building-btn" data-building="commercial_medium" data-cost="1500">
              Mall ($1500)
            </button>
            <button class="building-btn" data-building="commercial_large" data-cost="7500">
              Office ($7500)
            </button>
          </div>
        </div>
        <div class="building-group">
          <h4>Industrial</h4>
          <div class="building-buttons">
            <button class="building-btn" data-building="industrial_small" data-cost="300">
              Small Factory ($300)
            </button>
            <button class="building-btn" data-building="industrial_medium" data-cost="3000">
              Factory ($3000)
            </button>
            <button class="building-btn" data-building="industrial_large" data-cost="15000">
              Industrial Park ($15000)
            </button>
          </div>
        </div>
        <div class="building-group">
          <h4>Utilities</h4>
          <div class="building-buttons">
            <button class="building-btn" data-building="power_plant" data-cost="5000">
              Power Plant ($5000)
            </button>
            <button class="building-btn" data-building="water_plant" data-cost="3000">
              Water Plant ($3000)
            </button>
            <button class="building-btn" data-building="solar_plant" data-cost="10000">
              Solar Plant ($10000)
            </button>
          </div>
        </div>
        <div class="building-group">
          <h4>Special</h4>
          <div class="building-buttons">
            <button class="building-btn" data-building="park" data-cost="500">
              Park ($500)
            </button>
            <button class="building-btn" data-building="police_station" data-cost="1000">
              Police Station ($1000)
            </button>
            <button class="building-btn" data-building="fire_station" data-cost="1000">
              Fire Station ($1000)
            </button>
            <button class="building-btn" data-building="hospital" data-cost="3000">
              Hospital ($3000)
            </button>
            <button class="building-btn" data-building="school" data-cost="2000">
              School ($2000)
            </button>
          </div>
        </div>
        <div class="building-group">
          <h4>Transportation</h4>
          <div class="building-buttons">
            <button class="building-btn" data-building="road" data-cost="10">
              Road ($10)
            </button>
            <button class="building-btn" data-building="bridge" data-cost="1000">
              Bridge ($1000)
            </button>
          </div>
        </div>
        <div class="building-group">
          <h4>Decorative</h4>
          <div class="building-buttons">
            <button class="building-btn" data-building="tree" data-cost="20">
              Tree ($20)
            </button>
            <button class="building-btn" data-building="fountain" data-cost="200">
              Fountain ($200)
            </button>
          </div>
        </div>
      </div>
      <div class="controls">
        <button id="bulldozer-btn">Bulldozer</button>
        <button id="trade-btn">Trade</button>
        <button id="exit-btn">Exit to Menu</button>
      </div>
    </div>
    <div class="game-area">
      <canvas id="game-canvas"></canvas>
    </div>
    <div class="player-list" id="player-list">
      <h3>Online Players</h3>
      <div class="players"></div>
    </div>
  `;
  
  // Render the game
  setTimeout(() => {
    renderer.resizeCanvas();
    renderer.centerView();
  }, 100);
}

// Connect to WebSocket server
function connectSocket() {
  socket = io('http://localhost:3000');
  
  // Setup socket event handlers
  socket.on('connect', () => {
    console.log('Connected to server');
    
    // Load or create city
    socket.emit('loadCity', gameState.currentCity._id);
    
    // Request time sync
    syncWithServerTime();
  });
  
  socket.on('disconnect', () => {
    console.log('Disconnected from server');
    showMessage('Connection lost. Trying to reconnect...');
  });
  
  socket.on('error', (data) => {
    console.error('Socket error:', data);
    showMessage(data.message || 'An error occurred');
  });
  
  socket.on('cityLoaded', (cityData) => {
    console.log('City loaded:', cityData);
    
    // Apply city data to local city
    city.loadFromServer(cityData);
    
    // Update UI
    city.updateUI();
    
    // Center view
    renderer.centerView();
    
    showMessage('City loaded successfully!');
  });
  
  socket.on('playerJoined', (data) => {
    console.log('Player joined:', data);
    
    // Add player to game state
    gameState.players[data.playerId] = {
      id: data.playerId,
      username: data.username,
      cityId: data.cityId,
      cityName: data.cityName
    };
    
    // Update player list
    updatePlayerList();
    
    showMessage(`${data.username} has joined with city "${data.cityName}"`);
  });
  
  socket.on('playerLeft', (data) => {
    console.log('Player left:', data);
    
    // Remove player from game state
    delete gameState.players[data.playerId];
    
    // Update player list
    updatePlayerList();
    
    showMessage(`${data.username} has left`);
  });
  
  socket.on('buildingPlaced', (data) => {
    console.log('Building placed by another player:', data);
    
    // Update local city with remote building placement
    city.handleRemoteBuildingPlacement(data);
    
    // Trigger UI update
    city.updateUI();
  });
  
  socket.on('buildingRemoved', (data) => {
    console.log('Building removed by another player:', data);
    
    // Update local city with remote building removal
    city.handleRemoteBuildingRemoval(data);
    
    // Trigger UI update
    city.updateUI();
  });
  
  socket.on('buildingConfirmed', (data) => {
    console.log('Building placement confirmed:', data);
    
    // Remove from pending actions if tracking
    if (city.pendingActions && city.pendingActions[data.actionId]) {
      delete city.pendingActions[data.actionId];
    }
  });
  
  socket.on('buildingRejected', (data) => {
    console.log('Building placement rejected:', data);
    
    // Rollback if tracking
    if (city.pendingActions && city.pendingActions[data.actionId]) {
      city.rollbackAction(data.actionId);
      showMessage(`Building placement rejected: ${data.reason}`);
    }
  });
  
  socket.on('removalConfirmed', (data) => {
    console.log('Building removal confirmed:', data);
    
    // Remove from pending actions if tracking
    if (city.pendingActions && city.pendingActions[data.actionId]) {
      delete city.pendingActions[data.actionId];
    }
  });
  
  socket.on('removalRejected', (data) => {
    console.log('Building removal rejected:', data);
    
    // Rollback if tracking
    if (city.pendingActions && city.pendingActions[data.actionId]) {
      city.rollbackAction(data.actionId);
      showMessage(`Building removal rejected: ${data.reason}`);
    }
  });
  
  socket.on('simulationUpdate', (data) => {
    // Update with server-authoritative data
    city.syncWithServerUpdate(data);
  });
  
  socket.on('timeSync', (data) => {
    // Calculate server time offset
    const serverTime = data.serverTime;
    const clientTime = Date.now();
    gameState.serverTimeOffset = serverTime - clientTime;
    
    console.log(`Time synchronized. Offset: ${gameState.serverTimeOffset}ms`);
  });
  
  // Trade-related events
  socket.on('tradeOfferReceived', (data) => {
    console.log('Trade offer received:', data);
    
    // Add to pending trades
    gameState.pendingTrades.push(data);
    
    // Show notification
    showMessage(`Trade offer received from ${data.fromUsername}`);
    
    // Update trade UI if open
    updateTradeUI();
  });
  
  socket.on('tradeOfferSent', (data) => {
    console.log('Trade offer sent:', data);
    showMessage('Trade offer sent successfully!');
  });
  
  socket.on('tradeAccepted', (data) => {
    console.log('Trade accepted:', data);
    showMessage(`Your trade offer was accepted by ${data.by}!`);
  });
  
  socket.on('tradeCompleted', (data) => {
    console.log('Trade completed:', data);
    showMessage(`Trade completed with ${data.with}!`);
  });
  
  socket.on('tradeRejected', (data) => {
    console.log('Trade rejected:', data);
    showMessage(`Your trade offer was rejected by ${data.by}: ${data.reason}`);
  });
}

// Synchronize with server time
function syncWithServerTime() {
  socket.emit('timeSyncRequest');
  
  // Re-sync periodically
  setTimeout(syncWithServerTime, 60000); // Every minute
}

// Get server time
function getServerTime() {
  return Date.now() + gameState.serverTimeOffset;
}

// Update player list
function updatePlayerList() {
  const playerList = document.querySelector('#player-list .players');
  if (!playerList) return;
  
  playerList.innerHTML = '';
  
  const players = Object.values(gameState.players);
  
  if (players.length === 0) {
    playerList.innerHTML = '<div class="no-players">No other players online</div>';
    return;
  }
  
  players.forEach(player => {
    if (player.id === socket.id) return; // Skip self
    
    const playerEl = document.createElement('div');
    playerEl.className = 'player-item';
    playerEl.innerHTML = `
      <div class="player-info">
        <span class="player-name">${player.username}</span>
        <span class="player-city">${player.cityName}</span>
      </div>
      <button class="trade-btn" data-player="${player.id}">Trade</button>
    `;
    
    playerList.appendChild(playerEl);
  });
  
  // Add trade button handlers
  document.querySelectorAll('#player-list .trade-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const playerId = e.target.dataset.player;
      const player = gameState.players[playerId];
      if (player) {
        showTradeModal(player);
      }
    });
  });
}

// Show trade modal
function showTradeModal(player) {
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-content">
      <span class="close">&times;</span>
      <h2>Trade with ${player.username}</h2>
      <form id="trade-form">
        <div class="trade-columns">
          <div class="trade-column">
            <h3>You Offer</h3>
            <div class="form-group">
              <label for="offer-money">Money</label>
              <input type="number" id="offer-money" min="0" max="${city.money}" value="0">
            </div>
            <!-- Additional resources in future versions -->
          </div>
          <div class="trade-column">
            <h3>You Request</h3>
            <div class="form-group">
              <label for="request-money">Money</label>
              <input type="number" id="request-money" min="0" value="0">
            </div>
            <!-- Additional resources in future versions -->
          </div>
        </div>
        <div class="form-group">
          <label for="trade-message">Message (Optional)</label>
          <textarea id="trade-message" maxlength="200"></textarea>
        </div>
        <button type="submit" class="btn-primary">Send Trade Offer</button>
        <div id="trade-error" class="error-message"></div>
      </form>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Close button
  modal.querySelector('.close').addEventListener('click', () => {
    document.body.removeChild(modal);
  });
  
  // Close when clicking outside
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      document.body.removeChild(modal);
    }
  });
  
  // Form submission
  document.getElementById('trade-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const offerMoney = parseInt(document.getElementById('offer-money').value) || 0;
    const requestMoney = parseInt(document.getElementById('request-money').value) || 0;
    const message = document.getElementById('trade-message').value.trim();
    
    // Basic validation
    if (offerMoney === 0 && requestMoney === 0) {
      document.getElementById('trade-error').textContent = 'Trade must include at least one offer or request';
      return;
    }
    
    if (offerMoney > city.money) {
      document.getElementById('trade-error').textContent = 'You do not have enough money for this offer';
      return;
    }
    
    // Create trade offer
    const tradeId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const tradeOffer = {
      id: tradeId,
      to: player.userId,
      offer: {
        money: offerMoney
      },
      request: {
        money: requestMoney
      },
      message
    };
    
    // Send to server
    socket.emit('tradeOffer', tradeOffer);
    
    // Close modal
    document.body.removeChild(modal);
  });
}

// Show trades UI
function showTradesUI() {
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-content trade-modal">
      <span class="close">&times;</span>
      <h2>Trades</h2>
      <div class="trade-tabs">
        <button class="trade-tab active" data-tab="pending">Pending</button>
        <button class="trade-tab" data-tab="completed">Completed</button>
      </div>
      <div class="trade-list" id="trade-list">
        ${gameState.pendingTrades.length === 0 ? 
          '<div class="no-trades">No pending trades</div>' :
          gameState.pendingTrades.map(trade => `
            <div class="trade-item">
              <div class="trade-header">
                <span class="trade-from">From: ${trade.fromUsername}</span>
                <span class="trade-timestamp">${new Date(trade.timestamp).toLocaleString()}</span>
              </div>
              <div class="trade-content">
                <div class="trade-column">
                  <h4>Offering</h4>
                  <div class="trade-resource">
                    <span class="label">Money:</span>
                    <span class="value">$${trade.offer.money.toLocaleString()}</span>
                  </div>
                </div>
                <div class="trade-column">
                  <h4>Requesting</h4>
                  <div class="trade-resource">
                    <span class="label">Money:</span>
                    <span class="value">$${trade.request.money.toLocaleString()}</span>
                  </div>
                </div>
              </div>
              ${trade.message ? `<div class="trade-message">"${trade.message}"</div>` : ''}
              <div class="trade-actions">
                <button class="btn-primary accept-btn" data-trade="${trade.tradeId}">Accept</button>
                <button class="btn-secondary reject-btn" data-trade="${trade.tradeId}">Reject</button>
              </div>
            </div>
          `).join('')
        }
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Close button
  modal.querySelector('.close').addEventListener('click', () => {
    document.body.removeChild(modal);
  });
  
  // Close when clicking outside
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      document.body.removeChild(modal);
    }
  });
  
  // Tab switching
  document.querySelectorAll('.trade-tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
      document.querySelectorAll('.trade-tab').forEach(t => t.classList.remove('active'));
      e.target.classList.add('active');
      
      // TODO: Update trade list based on selected tab
    });
  });
  
  // Accept button handlers
  document.querySelectorAll('.accept-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const tradeId = e.target.dataset.trade;
      socket.emit('tradeResponse', {
        tradeId,
        accept: true
      });
      
      // Remove from pending trades
      gameState.pendingTrades = gameState.pendingTrades.filter(t => t.tradeId !== tradeId);
      
      // Close modal
      document.body.removeChild(modal);
    });
  });
  
  // Reject button handlers
  document.querySelectorAll('.reject-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const tradeId = e.target.dataset.trade;
      socket.emit('tradeResponse', {
        tradeId,
        accept: false
      });
      
      // Remove from pending trades
      gameState.pendingTrades = gameState.pendingTrades.filter(t => t.tradeId !== tradeId);
      
      // Close modal
      document.body.removeChild(modal);
    });
  });
}

// Update trade UI if open
function updateTradeUI() {
  const tradeList = document.getElementById('trade-list');
  if (!tradeList) return;
  
  // Redraw the trade list
  // This is a simplified version; in a real implementation, 
  // you'd only update what needs to be updated
  showTradesUI();
}

// Main game loop (handles rendering)
function gameLoop() {
  // Render the city
  renderer.render();
  
  // Continue the game loop
  requestAnimationFrame(gameLoop);
}

// Simulation loop (handled by server in multiplayer)
function simulationLoop() {
  // Only run in single-player mode
  if (!city.multiplayer) {
    // Calculate time delta
    const now = Date.now();
    const delta = now - lastUpdate;
    lastUpdate = now;
    
    // Update city simulation
    city.simulate(delta);
  }
}

// Set up UI event listeners for main screens
function setupUIListeners() {
  // Already handled in specific screen setup functions
}

// Set up UI event listeners for game
function setupGameUIListeners() {
  // Building buttons
  const buildingButtons = document.querySelectorAll('.building-btn');
  buildingButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Remove selected class from all buttons
      buildingButtons.forEach(btn => btn.classList.remove('selected'));
      
      // Add selected class to clicked button
      button.classList.add('selected');
      
      // Get building data
      const buildingType = button.getAttribute('data-building');
      const cost = parseInt(button.getAttribute('data-cost'), 10);
      
      // Select building
      city.selectedBuilding = { type: buildingType, cost: cost };
      city.bulldozerMode = false;
      
      // Remove active class from bulldozer button
      document.getElementById('bulldozer-btn').classList.remove('active');
    });
  });
  
  // Bulldozer button
  const bulldozerBtn = document.getElementById('bulldozer-btn');
  bulldozerBtn.addEventListener('click', () => {
    city.toggleBulldozer();
    
    if (city.bulldozerMode) {
      // Add active class to bulldozer button
      bulldozerBtn.classList.add('active');
      
      // Remove selected class from all building buttons
      buildingButtons.forEach(btn => btn.classList.remove('selected'));
    } else {
      // Remove active class from bulldozer button
      bulldozerBtn.classList.remove('active');
    }
  });
  
  // Trade button
  const tradeBtn = document.getElementById('trade-btn');
  tradeBtn.addEventListener('click', () => {
    showTradesUI();
  });
  
  // Exit button
  const exitBtn = document.getElementById('exit-btn');
  exitBtn.addEventListener('click', () => {
    // Disconnect socket
    if (socket) {
      socket.disconnect();
    }
    
    // Return to dashboard
    showDashboard();
  });
}

// Show a message to the user
function showMessage(message) {
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

// Create message container if it doesn't exist
function createMessageContainer() {
  const container = document.createElement('div');
  container.id = 'message-container';
  container.className = 'message-container';
  document.body.appendChild(container);
  return container;
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on the game page (canvas exists)
    const canvas = document.getElementById('game-canvas');
    if (!canvas) {
        // We're on the dashboard, initialize it
        init();
        return;
    }
    
    const ctx = canvas.getContext('2d');
    
    // Set canvas size to fill the game area
    function resizeCanvas() {
        const gameArea = document.querySelector('.game-area');
        if (gameArea) {
            canvas.width = gameArea.clientWidth;
            canvas.height = gameArea.clientHeight;
        }
    }
    
    // Initial resize and setup resize listener
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Initialize the city building system
    if (typeof City !== 'undefined' && typeof Renderer !== 'undefined') {
        // Create a basic city for testing if we're not in a game session
        if (!city) {
            city = new City(20, 20, false); // 20x20 grid, single player mode
            city.resources.money = 5000; // Starting money
        }
        
        // Create renderer if it doesn't exist
        if (!renderer) {
            renderer = new Renderer('game-canvas', city);
            renderer.resizeCanvas();
            renderer.centerView();
        }
        
        // Start the render loop
        function render() {
            renderer.render();
            requestAnimationFrame(render);
        }
        render();
        
        // Start simulation loop for single player
        if (!city.multiplayer) {
            setInterval(() => {
                city.simulate(1000); // Simulate 1 second
            }, 1000);
        }
    } else {
        // Fallback grid drawing if city system not loaded
        ctx.fillStyle = '#4a5568';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw a grid for testing
        ctx.strokeStyle = '#2d3748';
        ctx.lineWidth = 1;
        const gridSize = 32;
        
        for (let x = 0; x < canvas.width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
        }
        
        for (let y = 0; y < canvas.height; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }
    }
});

// Only initialize the dashboard on load if we're not already in a game
window.addEventListener('load', () => {
    // Check if we're on the main page (no canvas)
    if (!document.getElementById('game-canvas')) {
        init();
    }
});