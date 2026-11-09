const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  order_number: {
    type: String,
    required: true,
    unique: true
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  customer_name: {
    type: String,
    required: true,
    trim: true
  },
  customer_email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  customer_phone: {
    type: String,
    required: true,
    trim: true
  },
  shipping_address: {
    type: String,
    required: true,
    trim: true
  },
  city: {
    type: String,
    required: true,
    trim: true
  },
  state: {
    type: String,
    default: ''
  },
  pincode: {
    type: String,
    required: true,
    trim: true
  },
  portrait_medium: {
    type: String,
    required: true
  },
  portrait_size: {
    type: String,
    required: true
  },
  num_faces: {
    type: Number,
    default: 1
  },
  frame_type: {
    type: String,
    default: 'Rolled in Sturdy Art Tube (Unframed)'
  },
  special_instructions: {
    type: String,
    default: ''
  },
  reference_photo: {
    type: String,
    required: true
  },
  base_price: {
    type: Number,
    required: true
  },
  frame_price: {
    type: Number,
    default: 0
  },
  faces_extra: {
    type: Number,
    default: 0
  },
  shipping_charge: {
    type: Number,
    default: 0
  },
  tax_amount: {
    type: Number,
    default: 0
  },
  total_amount: {
    type: Number,
    required: true
  },
  payment_method: {
    type: String,
    default: 'Pending'
  },
  payment_status: {
    type: String,
    default: 'Unpaid'
  },
  order_status: {
    type: String,
    default: 'Pending'
  },
  transaction_id: {
    type: String,
    default: null
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

// Virtual id string
orderSchema.virtual('id').get(function () {
  return this._id.toHexString();
});
orderSchema.set('toJSON', { virtuals: true });
orderSchema.set('toObject', { virtuals: true });

// Static to generate order number
orderSchema.statics.generateOrderNumber = function () {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(1000 + Math.random() * 9000);
  return `MPP-${timestamp}-${random}`;
};

// Static for dashboard stats
orderSchema.statics.getDashboardStats = async function () {
  const totalOrders = await this.countDocuments();
  
  const revenueAgg = await this.aggregate([
    { $match: { payment_status: 'Paid' } },
    { $group: { _id: null, total: { $sum: '$total_amount' } } }
  ]);
  const totalRevenue = revenueAgg.length > 0 ? revenueAgg[0].total : 0;

  const pendingOrders = await this.countDocuments({ order_status: 'Pending' });
  const inProgressOrders = await this.countDocuments({
    order_status: { $regex: /(Progress|Sketching)/i }
  });
  const completedOrders = await this.countDocuments({
    order_status: { $regex: /(Delivered|Completed)/i }
  });

  return {
    totalOrders,
    totalRevenue,
    pendingOrders,
    inProgressOrders,
    completedOrders
  };
};

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;
