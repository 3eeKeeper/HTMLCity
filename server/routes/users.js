const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect } = require('../middleware/auth');

// Public routes
router.post('/register', userController.registerUser);
router.post('/login', userController.loginUser);

// Protected routes (require authentication)
router.get('/me', protect, userController.getCurrentUser);
router.put('/profile', protect, userController.updateProfile);
router.put('/password', protect, userController.changePassword);
router.get('/stats', protect, userController.getUserStats);
router.get('/friends', protect, userController.getUserFriends);
router.post('/friends/:username', protect, userController.addFriend);
router.delete('/friends/:id', protect, userController.removeFriend);

module.exports = router;