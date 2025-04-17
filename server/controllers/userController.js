const User = require('../models/User');
const { generateToken } = require('../utils/auth');

/**
 * Register a new user
 * @route POST /api/users/register
 * @access Public
 */
exports.registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });
    
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'User with that email or username already exists' 
      });
    }
    
    // Create new user
    const user = new User({
      username,
      email,
      password
    });
    
    await user.save();
    
    // Generate JWT token
    const token = generateToken(user._id);
    
    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        profile: user.profile,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Error registering user:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

/**
 * Login user
 * @route POST /api/users/login
 * @access Public
 */
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user by email
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }
    
    // Check password
    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }
    
    // Update last active timestamp
    user.lastActive = Date.now();
    await user.save();
    
    // Generate token
    const token = generateToken(user._id);
    
    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        profile: user.profile,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Error logging in user:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

/**
 * Get current user
 * @route GET /api/users/me
 * @access Private
 */
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    res.status(200).json({
      success: true,
      user
    });
  } catch (err) {
    console.error('Error fetching current user:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

/**
 * Update user profile
 * @route PUT /api/users/profile
 * @access Private
 */
exports.updateProfile = async (req, res) => {
  try {
    const { username, email, bio, avatar } = req.body;
    
    // Find user
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    // Check if username is taken (if being changed)
    if (username && username !== user.username) {
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(400).json({ 
          success: false, 
          message: 'Username is already taken' 
        });
      }
      user.username = username;
    }
    
    // Check if email is taken (if being changed)
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ 
          success: false, 
          message: 'Email is already taken' 
        });
      }
      user.email = email;
    }
    
    // Update profile fields
    if (bio !== undefined) user.profile.bio = bio;
    if (avatar) user.profile.avatar = avatar;
    
    // Save changes
    await user.save();
    
    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        profile: user.profile,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Error updating user profile:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

/**
 * Change password
 * @route PUT /api/users/password
 * @access Private
 */
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    // Find user
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    
    if (!isMatch) {
      return res.status(400).json({ 
        success: false, 
        message: 'Current password is incorrect' 
      });
    }
    
    // Update password
    user.password = newPassword;
    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (err) {
    console.error('Error changing password:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

/**
 * Get user stats
 * @route GET /api/users/stats
 * @access Private
 */
exports.getUserStats = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('stats cities')
      .populate('cities', 'name resources.population buildings.total');
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    // Calculate combined stats
    const combinedStats = {
      ...user.stats.toObject(),
      cityCount: user.cities.length,
      cities: user.cities.map(city => ({
        id: city._id,
        name: city.name,
        population: city.resources.population,
        buildings: city.buildings.total
      }))
    };
    
    res.status(200).json({
      success: true,
      stats: combinedStats
    });
  } catch (err) {
    console.error('Error fetching user stats:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

/**
 * Get user friends
 * @route GET /api/users/friends
 * @access Private
 */
exports.getUserFriends = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('friends')
      .populate('friends', 'username profile.avatar lastActive');
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    res.status(200).json({
      success: true,
      friends: user.friends
    });
  } catch (err) {
    console.error('Error fetching user friends:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

/**
 * Add friend
 * @route POST /api/users/friends/:username
 * @access Private
 */
exports.addFriend = async (req, res) => {
  try {
    const { username } = req.params;
    
    // Find friend
    const friend = await User.findOne({ username });
    
    if (!friend) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    // Check if trying to add self
    if (friend._id.toString() === req.user.id) {
      return res.status(400).json({ 
        success: false, 
        message: 'You cannot add yourself as a friend' 
      });
    }
    
    // Add friend
    const user = await User.findById(req.user.id);
    
    // Check if already friends
    if (user.friends.includes(friend._id)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Already friends with this user' 
      });
    }
    
    user.friends.push(friend._id);
    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'Friend added successfully',
      friend: {
        id: friend._id,
        username: friend.username,
        avatar: friend.profile.avatar
      }
    });
  } catch (err) {
    console.error('Error adding friend:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

/**
 * Remove friend
 * @route DELETE /api/users/friends/:id
 * @access Private
 */
exports.removeFriend = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if friend exists
    const friend = await User.findById(id);
    
    if (!friend) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    // Remove friend
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $pull: { friends: id } },
      { new: true }
    );
    
    res.status(200).json({
      success: true,
      message: 'Friend removed successfully'
    });
  } catch (err) {
    console.error('Error removing friend:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};