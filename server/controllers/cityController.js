const City = require('../models/City');
const User = require('../models/User');

/**
 * Get all cities for current user
 * @route GET /api/cities
 * @access Private
 */
exports.getUserCities = async (req, res) => {
  try {
    const cities = await City.find({ owner: req.user.id })
      .select('name resources.population resources.money resources.happiness buildings createdAt lastUpdated')
      .sort('-lastUpdated');
    
    res.status(200).json({
      success: true,
      count: cities.length,
      cities
    });
  } catch (err) {
    console.error('Error fetching user cities:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

/**
 * Get a single city by ID
 * @route GET /api/cities/:id
 * @access Private
 */
exports.getCityById = async (req, res) => {
  try {
    const city = await City.findById(req.params.id);
    
    if (!city) {
      return res.status(404).json({ 
        success: false, 
        message: 'City not found' 
      });
    }
    
    // Check if user owns this city or if city is public
    if (city.owner.toString() !== req.user.id && !city.isPublic) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied' 
      });
    }
    
    res.status(200).json({
      success: true,
      city
    });
  } catch (err) {
    console.error('Error fetching city:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

/**
 * Create new city
 * @route POST /api/cities
 * @access Private
 */
exports.createCity = async (req, res) => {
  try {
    const { name, description, isPublic } = req.body;
    
    // Initialize empty grid
    const grid = [];
    for (let y = 0; y < 20; y++) {
      const row = [];
      for (let x = 0; x < 20; x++) {
        // Start with mostly grass, some water
        let tileType = 'grass';
        if (Math.random() < 0.05) {
          tileType = 'water';
        }
        
        row.push({
          type: tileType,
          occupied: tileType === 'water' ? true : false
        });
      }
      grid.push(row);
    }
    
    // Create new city
    const city = new City({
      name,
      owner: req.user.id,
      description,
      isPublic: isPublic !== undefined ? isPublic : true,
      grid
    });
    
    await city.save();
    
    res.status(201).json({
      success: true,
      city
    });
  } catch (err) {
    console.error('Error creating city:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

/**
 * Update city details
 * @route PUT /api/cities/:id
 * @access Private
 */
exports.updateCity = async (req, res) => {
  try {
    const { name, description, isPublic, tradingEnabled } = req.body;
    
    let city = await City.findById(req.params.id);
    
    if (!city) {
      return res.status(404).json({ 
        success: false, 
        message: 'City not found' 
      });
    }
    
    // Check ownership
    if (city.owner.toString() !== req.user.id) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied' 
      });
    }
    
    // Update fields
    if (name) city.name = name;
    if (description !== undefined) city.description = description;
    if (isPublic !== undefined) city.isPublic = isPublic;
    if (tradingEnabled !== undefined) city.tradingEnabled = tradingEnabled;
    
    // Save changes
    await city.save();
    
    res.status(200).json({
      success: true,
      city
    });
  } catch (err) {
    console.error('Error updating city:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

/**
 * Delete city
 * @route DELETE /api/cities/:id
 * @access Private
 */
exports.deleteCity = async (req, res) => {
  try {
    const city = await City.findById(req.params.id);
    
    if (!city) {
      return res.status(404).json({ 
        success: false, 
        message: 'City not found' 
      });
    }
    
    // Check ownership
    if (city.owner.toString() !== req.user.id) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied' 
      });
    }
    
    // Remove city reference from user
    await User.findByIdAndUpdate(
      req.user.id,
      { $pull: { cities: city._id } }
    );
    
    // Delete the city
    await city.remove();
    
    res.status(200).json({
      success: true,
      message: 'City deleted successfully'
    });
  } catch (err) {
    console.error('Error deleting city:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

/**
 * Get public cities
 * @route GET /api/cities/public
 * @access Private
 */
exports.getPublicCities = async (req, res) => {
  try {
    const cities = await City.find({ isPublic: true })
      .select('name owner resources.population resources.happiness buildings createdAt lastUpdated')
      .populate('owner', 'username profile.avatar')
      .sort('-resources.population')
      .limit(20);
    
    res.status(200).json({
      success: true,
      count: cities.length,
      cities
    });
  } catch (err) {
    console.error('Error fetching public cities:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

/**
 * Get city leaderboard
 * @route GET /api/cities/leaderboard
 * @access Private
 */
exports.getCityLeaderboard = async (req, res) => {
  try {
    const { sort = 'population' } = req.query;
    
    let sortField;
    
    // Determine sort field
    switch (sort) {
      case 'population':
        sortField = '-resources.population';
        break;
      case 'happiness':
        sortField = '-resources.happiness';
        break;
      case 'wealth':
        sortField = '-resources.money';
        break;
      case 'buildings':
        sortField = '-buildings.total';
        break;
      default:
        sortField = '-resources.population';
    }
    
    const cities = await City.find({ isPublic: true })
      .select('name owner resources.population resources.happiness resources.money buildings.total')
      .populate('owner', 'username profile.avatar')
      .sort(sortField)
      .limit(50);
    
    res.status(200).json({
      success: true,
      count: cities.length,
      cities
    });
  } catch (err) {
    console.error('Error fetching city leaderboard:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};