const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  otp: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['signup', 'login', 'password_reset'],
    default: 'signup'
  },
  pendingData: {
    type: Object,
    default: null
  },
  created_at: {
    type: Date,
    default: Date.now,
    expires: 600 // Automatically delete document after 10 minutes (TTL)
  }
});

const Otp = mongoose.model('Otp', otpSchema);
module.exports = Otp;

