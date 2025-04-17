const express = require('express');
const router = express.Router();
const cityController = require('../controllers/cityController');
const { protect } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// City routes
router.route('/')
  .get(cityController.getUserCities)
  .post(cityController.createCity);

router.route('/:id')
  .get(cityController.getCityById)
  .put(cityController.updateCity)
  .delete(cityController.deleteCity);

// Special routes
router.get('/public', cityController.getPublicCities);
router.get('/leaderboard', cityController.getCityLeaderboard);

module.exports = router;