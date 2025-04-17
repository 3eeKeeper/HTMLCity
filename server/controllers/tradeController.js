const Trade = require('../models/Trade');
const City = require('../models/City');
const User = require('../models/User');

/**
 * Get all trades for current user
 * @route GET /api/trades
 * @access Private
 */
exports.getUserTrades = async (req, res) => {
  try {
    const { status = 'all' } = req.query;
    
    let query = {
      $or: [
        { offeredBy: req.user.id },
        { offeredTo: req.user.id }
      ]
    };
    
    // Filter by status if provided
    if (status !== 'all') {
      query.status = status;
    }
    
    const trades = await Trade.find(query)
      .populate('offeredBy', 'username profile.avatar')
      .populate('offeredTo', 'username profile.avatar')
      .sort('-createdAt');
    
    res.status(200).json({
      success: true,
      count: trades.length,
      trades
    });
  } catch (err) {
    console.error('Error fetching user trades:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

/**
 * Get a single trade by ID
 * @route GET /api/trades/:id
 * @access Private
 */
exports.getTradeById = async (req, res) => {
  try {
    const trade = await Trade.findById(req.params.id)
      .populate('offeredBy', 'username profile.avatar')
      .populate('offeredTo', 'username profile.avatar');
    
    if (!trade) {
      return res.status(404).json({ 
        success: false, 
        message: 'Trade not found' 
      });
    }
    
    // Check if user is part of the trade
    if (trade.offeredBy.toString() !== req.user.id && 
        trade.offeredTo.toString() !== req.user.id) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied' 
      });
    }
    
    res.status(200).json({
      success: true,
      trade
    });
  } catch (err) {
    console.error('Error fetching trade:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

/**
 * Create a new trade offer
 * @route POST /api/trades
 * @access Private
 */
exports.createTrade = async (req, res) => {
  try {
    const { offeredTo, offer, request, message } = req.body;
    
    // Check if recipient exists
    const recipient = await User.findById(offeredTo);
    
    if (!recipient) {
      return res.status(404).json({ 
        success: false, 
        message: 'Recipient not found' 
      });
    }
    
    // Check if sending to self
    if (offeredTo === req.user.id) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot send trade offer to yourself' 
      });
    }
    
    // Validate offers (ensure sender has the resources)
    const senderCity = await City.findOne({ owner: req.user.id });
    
    if (!senderCity) {
      return res.status(400).json({ 
        success: false, 
        message: 'You must have a city to trade' 
      });
    }
    
    // Check if trading is enabled for sender's city
    if (!senderCity.tradingEnabled) {
      return res.status(400).json({ 
        success: false, 
        message: 'Trading is disabled for your city' 
      });
    }
    
    // Check if recipient has a city
    const recipientCity = await City.findOne({ owner: offeredTo });
    
    if (!recipientCity) {
      return res.status(400).json({ 
        success: false, 
        message: 'Recipient does not have a city to trade with' 
      });
    }
    
    // Check if trading is enabled for recipient's city
    if (!recipientCity.tradingEnabled) {
      return res.status(400).json({ 
        success: false, 
        message: 'Trading is disabled for recipient\'s city' 
      });
    }
    
    // Check if sender has enough money
    if (offer.money && senderCity.resources.money < offer.money) {
      return res.status(400).json({ 
        success: false, 
        message: 'You do not have enough money for this trade' 
      });
    }
    
    // Check if recipient has enough money for request
    if (request.money && recipientCity.resources.money < request.money) {
      return res.status(400).json({ 
        success: false, 
        message: 'Recipient does not have enough money for this trade' 
      });
    }
    
    // Create trade with 24 hour expiration
    const expires = new Date();
    expires.setHours(expires.getHours() + 24);
    
    const trade = new Trade({
      offeredBy: req.user.id,
      offeredTo,
      offer,
      request,
      message,
      expires
    });
    
    await trade.save();
    
    res.status(201).json({
      success: true,
      trade
    });
  } catch (err) {
    console.error('Error creating trade:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

/**
 * Accept a trade offer
 * @route PUT /api/trades/:id/accept
 * @access Private
 */
exports.acceptTrade = async (req, res) => {
  try {
    const trade = await Trade.findById(req.params.id);
    
    if (!trade) {
      return res.status(404).json({ 
        success: false, 
        message: 'Trade not found' 
      });
    }
    
    // Check if user is the recipient
    if (trade.offeredTo.toString() !== req.user.id) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied' 
      });
    }
    
    // Check if trade is still pending
    if (trade.status !== 'pending') {
      return res.status(400).json({ 
        success: false, 
        message: `Trade is already ${trade.status}` 
      });
    }
    
    // Check if trade has expired
    if (trade.expires < new Date()) {
      trade.status = 'expired';
      await trade.save();
      
      return res.status(400).json({ 
        success: false, 
        message: 'Trade offer has expired' 
      });
    }
    
    // Get both cities
    const senderCity = await City.findOne({ owner: trade.offeredBy });
    const recipientCity = await City.findOne({ owner: trade.offeredTo });
    
    if (!senderCity || !recipientCity) {
      return res.status(400).json({ 
        success: false, 
        message: 'One or both cities no longer exist' 
      });
    }
    
    // Verify sender still has resources
    if (trade.offer.money && senderCity.resources.money < trade.offer.money) {
      return res.status(400).json({ 
        success: false, 
        message: 'Sender no longer has enough money for this trade' 
      });
    }
    
    // Verify recipient has resources
    if (trade.request.money && recipientCity.resources.money < trade.request.money) {
      return res.status(400).json({ 
        success: false, 
        message: 'You do not have enough money for this trade' 
      });
    }
    
    // Execute trade
    
    // Transfer money
    if (trade.offer.money) {
      senderCity.resources.money -= trade.offer.money;
      recipientCity.resources.money += trade.offer.money;
    }
    
    if (trade.request.money) {
      recipientCity.resources.money -= trade.request.money;
      senderCity.resources.money += trade.request.money;
    }
    
    // Handle other resources in future versions
    // ...
    
    // Save changes to cities
    await senderCity.save();
    await recipientCity.save();
    
    // Update trade status
    trade.status = 'completed';
    trade.completedAt = new Date();
    await trade.save();
    
    // Update user stats
    await User.findByIdAndUpdate(
      trade.offeredBy,
      { $inc: { 'stats.tradesCompleted': 1 } }
    );
    
    await User.findByIdAndUpdate(
      trade.offeredTo,
      { $inc: { 'stats.tradesCompleted': 1 } }
    );
    
    res.status(200).json({
      success: true,
      message: 'Trade completed successfully',
      trade
    });
  } catch (err) {
    console.error('Error accepting trade:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

/**
 * Reject a trade offer
 * @route PUT /api/trades/:id/reject
 * @access Private
 */
exports.rejectTrade = async (req, res) => {
  try {
    const trade = await Trade.findById(req.params.id);
    
    if (!trade) {
      return res.status(404).json({ 
        success: false, 
        message: 'Trade not found' 
      });
    }
    
    // Check if user is the recipient
    if (trade.offeredTo.toString() !== req.user.id) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied' 
      });
    }
    
    // Check if trade is still pending
    if (trade.status !== 'pending') {
      return res.status(400).json({ 
        success: false, 
        message: `Trade is already ${trade.status}` 
      });
    }
    
    // Update trade status
    trade.status = 'rejected';
    await trade.save();
    
    res.status(200).json({
      success: true,
      message: 'Trade rejected',
      trade
    });
  } catch (err) {
    console.error('Error rejecting trade:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

/**
 * Cancel a trade offer (by creator)
 * @route PUT /api/trades/:id/cancel
 * @access Private
 */
exports.cancelTrade = async (req, res) => {
  try {
    const trade = await Trade.findById(req.params.id);
    
    if (!trade) {
      return res.status(404).json({ 
        success: false, 
        message: 'Trade not found' 
      });
    }
    
    // Check if user is the creator
    if (trade.offeredBy.toString() !== req.user.id) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied' 
      });
    }
    
    // Check if trade is still pending
    if (trade.status !== 'pending') {
      return res.status(400).json({ 
        success: false, 
        message: `Trade is already ${trade.status}` 
      });
    }
    
    // Update trade status
    trade.status = 'canceled';
    await trade.save();
    
    res.status(200).json({
      success: true,
      message: 'Trade canceled',
      trade
    });
  } catch (err) {
    console.error('Error canceling trade:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};