const mongoose = require('mongoose');

const CitySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'City name is required'],
    trim: true,
    minlength: [3, 'City name must be at least 3 characters'],
    maxlength: [30, 'City name cannot exceed 30 characters']
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  grid: {
    type: mongoose.Schema.Types.Mixed,
    default: []
  },
  resources: {
    money: {
      type: Number,
      default: 10000
    },
    population: {
      type: Number,
      default: 0
    },
    happiness: {
      type: Number,
      default: 50
    },
    power: {
      type: Number,
      default: 0
    },
    water: {
      type: Number,
      default: 0
    },
    jobs: {
      type: Number,
      default: 0
    }
  },
  buildings: {
    residential: {
      type: Number,
      default: 0
    },
    commercial: {
      type: Number,
      default: 0
    },
    industrial: {
      type: Number,
      default: 0
    },
    special: {
      type: Number,
      default: 0
    },
    total: {
      type: Number,
      default: 0
    }
  },
  stats: {
    income: {
      type: Number,
      default: 0
    },
    expenses: {
      type: Number,
      default: 0
    },
    powerProduction: {
      type: Number,
      default: 0
    },
    powerConsumption: {
      type: Number,
      default: 0
    },
    waterProduction: {
      type: Number,
      default: 0
    },
    waterConsumption: {
      type: Number,
      default: 0
    },
    unemployed: {
      type: Number,
      default: 0
    }
  },
  history: [{
    timestamp: Date,
    population: Number,
    money: Number,
    happiness: Number
  }],
  tradingEnabled: {
    type: Boolean,
    default: true
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  isPublic: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Middleware to update User's cities array
CitySchema.post('save', async function(doc) {
  try {
    const User = mongoose.model('User');
    await User.findByIdAndUpdate(
      this.owner,
      { $addToSet: { cities: this._id } }
    );
  } catch (err) {
    console.error('Error updating user cities:', err);
  }
});

// Method to calculate stats
CitySchema.methods.calculateStats = function() {
  // Reset counters
  const stats = {
    income: 0,
    expenses: 0,
    powerProduction: 0,
    powerConsumption: 0,
    waterProduction: 0,
    waterConsumption: 0,
    unemployed: 0
  };
  
  // Count building types
  const buildings = {
    residential: 0,
    commercial: 0,
    industrial: 0,
    special: 0,
    total: 0
  };
  
  // Process grid to recalculate everything
  for (let y = 0; y < this.grid.length; y++) {
    for (let x = 0; x < this.grid[y].length; x++) {
      const cell = this.grid[y][x];
      
      if (cell && cell.occupied && cell.type !== 'grass' && cell.type !== 'water') {
        // Increment building count
        buildings.total++;
        
        // Categorize building
        if (cell.type.includes('residential')) {
          buildings.residential++;
        } else if (cell.type.includes('commercial')) {
          buildings.commercial++;
        } else if (cell.type.includes('industrial')) {
          buildings.industrial++;
        } else {
          buildings.special++;
        }
        
        // Get building properties based on type
        const buildingProps = this.getBuildingProperties(cell.type);
        if (buildingProps) {
          // Power
          if (buildingProps.power > 0) {
            stats.powerProduction += buildingProps.power;
          } else {
            stats.powerConsumption += Math.abs(buildingProps.power);
          }
          
          // Water
          if (buildingProps.water > 0) {
            stats.waterProduction += buildingProps.water;
          } else {
            stats.waterConsumption += Math.abs(buildingProps.water);
          }
        }
      }
    }
  }
  
  // Calculate financials
  stats.income = this.resources.population * 10; // $10 per resident
  stats.expenses = this.resources.population * 5; // $5 per resident
  
  // Calculate unemployment
  stats.unemployed = Math.max(0, this.resources.population - this.resources.jobs);
  
  // Update the stats and buildings counts
  this.stats = stats;
  this.buildings = buildings;
  
  return stats;
};

// Helper method to get building properties
CitySchema.methods.getBuildingProperties = function(buildingType) {
  // This should mirror the building properties defined elsewhere
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
};

module.exports = mongoose.model('City', CitySchema);