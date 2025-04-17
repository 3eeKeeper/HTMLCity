const express = require('express');
const router = express.Router();
const tradeController = require('../controllers/tradeController');
const { protect } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Trade routes
router.route('/')
  .get(tradeController.getUserTrades)
  .post(tradeController.createTrade);

router.route('/:id')
  .get(tradeController.getTradeById);

router.put('/:id/accept', tradeController.acceptTrade);
router.put('/:id/reject', tradeController.rejectTrade);
router.put('/:id/cancel', tradeController.cancelTrade);

module.exports = router;