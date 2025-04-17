const mongoose = require('mongoose');

const TradeSchema = new mongoose.Schema({
  offeredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  offeredTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  offer: {
    money: {
      type: Number,
      default: 0,
      min: 0
    },
    resources: {
      // Additional resources would go here
      // Example for future resource types:
      /*
      wood: {
        type: Number,
        default: 0,
        min: 0
      },
      steel: {
        type: Number,
        default: 0,
        min: 0
      }
      */
    }
  },
  request: {
    money: {
      type: Number,
      default: 0,
      min: 0
    },
    resources: {
      // Additional resources would go here
      // Same structure as offer.resources
    }
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'completed', 'expired'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date
  },
  expires: {
    type: Date,
    required: true
  },
  message: {
    type: String,
    maxlength: [200, 'Message cannot exceed 200 characters']
  }
}, {
  timestamps: true
});

// Update user stats when trade completes
TradeSchema.post('findOneAndUpdate', async function(doc) {
  if (doc && doc.status === 'completed' && !doc.completedAt) {
    try {
      // Update trade with completion time
      await mongoose.model('Trade').findByIdAndUpdate(
        doc._id,
        { completedAt: new Date() }
      );
      
      // Update user stats
      const User = mongoose.model('User');
      
      await User.findByIdAndUpdate(
        doc.offeredBy,
        { $inc: { 'stats.tradesCompleted': 1 } }
      );
      
      await User.findByIdAndUpdate(
        doc.offeredTo,
        { $inc: { 'stats.tradesCompleted': 1 } }
      );
    } catch (err) {
      console.error('Error updating trade completion stats:', err);
    }
  }
});

module.exports = mongoose.model('Trade', TradeSchema);