const mongoose = require('mongoose');
const User = require('../models/User');
const Artwork = require('../models/Artwork');
const Order = require('../models/Order');
const Otp = require('../models/Otp');
const { sendOtpVerificationEmail, sendOrderConfirmationEmail, sendAdminNewOrderAlert, transporter } = require('../config/mailer');
const { generateOrderReceiptPDF } = require('../utils/pdfGenerator');

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'midhunrs727@gmail.com').toLowerCase().trim();
const APP_PASSWORD_SPACED = 'mwdo klwl qkrp rxsy';
const APP_PASSWORD_CLEAN = 'mwdoklwlqkrprxsy';
const ADMIN_DEFAULT_PASS = process.env.ADMIN_DEFAULT_PASS || 'admin123';

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function calculateOrderPrice(medium, size, numFaces = 1, frameType = 'Unframed') {
  let basePrice = 1800; // Default A4 Graphite

  if (size && size.includes('A3')) {
    basePrice = 2800;
  } else if (size && size.includes('A2')) {
    basePrice = 4200;
  }

  if (medium && medium.includes('Charcoal Blend')) {
    basePrice += 300;
  } else if (medium && medium.includes('Hyper-Realistic Carbon')) {
    basePrice += 600;
  } else if (medium && medium.includes('Colored Pencil')) {
    basePrice += 800;
  }

  const extraFaces = Math.max(0, parseInt(numFaces, 10) - 1);
  const facesExtra = extraFaces * 700;

  let framePrice = 0;
  if (frameType && frameType.includes('Matte Black')) {
    framePrice = 650;
  } else if (frameType && frameType.includes('Teak Wood')) {
    framePrice = 950;
  } else if (frameType && frameType.includes('Vintage Gold')) {
    framePrice = 1200;
  }

  const subtotal = basePrice + facesExtra + framePrice;
  const taxAmount = Math.round(subtotal * 0.05); // 5% GST
  const shippingCharge = subtotal > 3500 ? 0 : 150;
  const totalAmount = subtotal + taxAmount + shippingCharge;

  return {
    basePrice,
    facesExtra,
    framePrice,
    taxAmount,
    shippingCharge,
    totalAmount
  };
}

// --- AUTH APIS ---
exports.getCurrentUser = async (req, res) => {
  try {
    if (!req.session || !req.session.userId) {
      return res.json({ success: true, user: null });
    }

    if (req.session.role === 'admin' && req.session.userId === 'admin_session') {
      return res.json({
        success: true,
        user: {
          id: 'admin',
          name: req.session.userName || 'Midhun R.S.',
          email: req.session.userEmail || ADMIN_EMAIL,
          role: 'admin'
        }
      });
    }

    const user = await User.findById(req.session.userId).select('-password');
    if (!user) {
      return res.json({ success: true, user: null });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        city: user.city,
        state: user.state,
        pincode: user.pincode,
        role: user.role
      }
    });
  } catch (err) {
    console.error('getCurrentUser error:', err);
    res.status(500).json({ success: false, error: 'Server error', message: 'Server error' });
  }
};

exports.postRegister = async (req, res) => {
  try {
    const { name, email, password, confirmPassword, phone, address, city, state, pincode } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: 'Name, email, and password are required.', message: 'Name, email, and password are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters long.', message: 'Password must be at least 6 characters long.' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, error: 'Passwords do not match.', message: 'Passwords do not match.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ email: cleanEmail });
    if (existing) {
      const msg = 'An account with this email already exists. Please log in.';
      return res.status(400).json({ success: false, error: msg, message: msg });
    }

    const otpCode = generateOtp();

    await Otp.deleteMany({ email: cleanEmail });
    await Otp.create({
      email: cleanEmail,
      otp: otpCode,
      type: 'signup',
      pendingData: {
        name: name.trim(),
        email: cleanEmail,
        password,
        phone: phone || '',
        address: address || '',
        city: city || '',
        state: state || '',
        pincode: pincode || '',
        role: (cleanEmail === ADMIN_EMAIL) ? 'admin' : 'user'
      }
    });

    req.session.pendingOtpEmail = cleanEmail;
    req.session.pendingOtpName = name.trim();

    await sendOtpVerificationEmail(cleanEmail, otpCode, name.trim()).catch(err => {
      console.warn('SMTP OTP send warning:', err.message);
    });

    res.json({
      success: true,
      message: 'Verification code sent to your email address.',
      email: cleanEmail
    });
  } catch (err) {
    console.error('postRegister error:', err);
    res.status(500).json({ success: false, error: 'Failed to initiate registration.', message: 'Failed to initiate registration.' });
  }
};

exports.postVerifyOtp = async (req, res) => {
  try {
    const { otp, email } = req.body;
    const targetEmail = (email || req.session.pendingOtpEmail || '').toLowerCase().trim();

    if (!targetEmail) {
      const msg = 'Verification session expired. Please register again.';
      return res.status(400).json({ success: false, error: msg, message: msg });
    }

    if (!otp || otp.trim().length !== 6) {
      const msg = 'Please enter a valid 6-digit verification code.';
      return res.status(400).json({ success: false, error: msg, message: msg });
    }

    const cleanOtp = otp.trim();
    const otpRecord = await Otp.findOne({ email: targetEmail, type: 'signup' });

    if (!otpRecord) {
      const msg = 'Verification code has expired. Please request a new code.';
      return res.status(400).json({ success: false, error: msg, message: msg });
    }

    if (otpRecord.otp !== cleanOtp) {
      const msg = 'Invalid verification code. Please check your email and try again.';
      return res.status(400).json({ success: false, error: msg, message: msg });
    }

    const pendingUser = otpRecord.pendingData;
    const newUser = await User.createUser({
      name: pendingUser.name,
      email: pendingUser.email,
      password: pendingUser.password,
      phone: pendingUser.phone,
      address: pendingUser.address,
      city: pendingUser.city,
      state: pendingUser.state,
      pincode: pendingUser.pincode,
      role: pendingUser.role
    });

    await Otp.deleteMany({ email: targetEmail });
    delete req.session.pendingOtpEmail;
    delete req.session.pendingOtpName;

    req.session.userId = newUser._id.toString();
    req.session.role = newUser.role;
    req.session.userName = newUser.name;
    req.session.userEmail = newUser.email;

    res.json({
      success: true,
      message: 'Account verified successfully!',
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      }
    });
  } catch (err) {
    console.error('postVerifyOtp error:', err);
    res.status(500).json({ success: false, error: 'Verification error occurred.', message: 'Verification error occurred.' });
  }
};

exports.postResendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const targetEmail = (email || req.session.pendingOtpEmail || '').toLowerCase().trim();

    if (!targetEmail) {
      const msg = 'Session expired. Please register again.';
      return res.status(400).json({ success: false, error: msg, message: msg });
    }

    const otpRecord = await Otp.findOne({ email: targetEmail, type: 'signup' });
    if (!otpRecord) {
      const msg = 'Verification session expired. Please register again.';
      return res.status(400).json({ success: false, error: msg, message: msg });
    }

    const newOtp = generateOtp();
    otpRecord.otp = newOtp;
    otpRecord.created_at = new Date();
    await otpRecord.save();

    const name = (otpRecord.pendingData && otpRecord.pendingData.name) || req.session.pendingOtpName || 'Art Collector';
    await sendOtpVerificationEmail(targetEmail, newOtp, name).catch(err => console.warn(err));

    res.json({ success: true, message: 'A new 6-digit verification code has been dispatched to your email.' });
  } catch (err) {
    console.error('postResendOtp error:', err);
    res.status(500).json({ success: false, error: 'Failed to resend verification code.', message: 'Failed to resend verification code.' });
  }
};

exports.postLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      const msg = 'Please enter both email and password.';
      return res.status(400).json({ success: false, error: msg, message: msg });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanInputPass = password.trim();

    // Check admin credentials
    if (cleanEmail === ADMIN_EMAIL) {
      const isAppPassword = (cleanInputPass === APP_PASSWORD_SPACED || cleanInputPass === APP_PASSWORD_CLEAN);
      const isDefaultPass = (cleanInputPass === ADMIN_DEFAULT_PASS);

      let user = await User.findOne({ email: cleanEmail });
      let isDbPassMatch = false;
      if (user) {
        isDbPassMatch = await user.comparePassword(cleanInputPass);
      }

      if (isAppPassword || isDefaultPass || isDbPassMatch) {
        if (!user) {
          user = await User.createUser({
            name: 'Midhun (Artist & Admin)',
            email: ADMIN_EMAIL,
            password: cleanInputPass,
            role: 'admin'
          });
        }
        req.session.userId = user._id.toString();
        req.session.role = 'admin';
        req.session.userName = user.name;
        req.session.userEmail = user.email;

        return res.json({
          success: true,
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: 'admin'
          }
        });
      }
    }

    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      const msg = 'No account found with this email address. Please register.';
      return res.status(400).json({ success: false, error: msg, message: msg });
    }

    const isMatch = await user.comparePassword(cleanInputPass);
    if (!isMatch) {
      const msg = 'Incorrect password. Please try again.';
      return res.status(400).json({ success: false, error: msg, message: msg });
    }

    req.session.userId = user._id.toString();
    req.session.role = user.role;
    req.session.userName = user.name;
    req.session.userEmail = user.email;

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error('postLogin error:', err);
    const msg = 'Login failed. Please try again.';
    res.status(500).json({ success: false, error: msg, message: msg });
  }
};

exports.postAdminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const cleanEmail = (email || '').toLowerCase().trim();
    const cleanPass = (password || '').trim();

    if (cleanEmail !== ADMIN_EMAIL) {
      const msg = 'Invalid credentials. Access restricted.';
      return res.status(403).json({ success: false, error: msg, message: msg });
    }

    const isAppPassword = (cleanPass === APP_PASSWORD_SPACED || cleanPass === APP_PASSWORD_CLEAN);
    const isDefaultPass = (cleanPass === ADMIN_DEFAULT_PASS);

    const user = await User.findOne({ email: cleanEmail });
    let isDbPassMatch = false;
    if (user) {
      isDbPassMatch = await user.comparePassword(cleanPass);
    }

    if (isAppPassword || isDefaultPass || isDbPassMatch) {
      req.session.userId = user ? user._id.toString() : 'admin_session';
      req.session.role = 'admin';
      req.session.userName = user ? user.name : 'Midhun R.S.';
      req.session.userEmail = cleanEmail;

      return res.json({
        success: true,
        user: {
          id: user ? user._id : 'admin',
          name: user ? user.name : 'Midhun R.S.',
          email: cleanEmail,
          role: 'admin'
        }
      });
    }

    const msg = 'Invalid credentials. Access restricted.';
    return res.status(401).json({ success: false, error: msg, message: msg });
  } catch (err) {
    console.error('postAdminLogin error:', err);
    const msg = 'Server error during admin authentication.';
    res.status(500).json({ success: false, error: msg, message: msg });
  }
};

exports.postLogout = (req, res) => {
  req.session.destroy(err => {
    if (err) console.error('Logout error:', err);
    res.json({ success: true });
  });
};

// --- ARTWORKS / SHOWCASE APIS ---
exports.getArtworks = async (req, res) => {
  try {
    const category = req.query.category || 'all';
    let query = {};
    if (category && category !== 'all') {
      query.category = { $regex: new RegExp(`^${category}$`, 'i') };
    }

    const artworks = await Artwork.find(query).sort({ _id: -1 });
    const featuredArtworks = await Artwork.find({ featured: 1 }).sort({ _id: -1 }).limit(6);

    const categories = [
      { id: 'all', name: 'All Artworks' },
      { id: 'hyper-realistic', name: 'Hyper-Realistic' },
      { id: 'couple & wedding', name: 'Couple & Wedding' },
      { id: 'celebrity & icons', name: 'Celebrity & Icons' },
      { id: 'pet portraits', name: 'Pet Portraits' },
      { id: 'wildlife & nature', name: 'Wildlife & Nature' }
    ];

    res.json({ success: true, artworks, featuredArtworks, categories });
  } catch (err) {
    console.error('getArtworks error:', err);
    const msg = 'Failed to fetch artworks.';
    res.status(500).json({ success: false, error: msg, message: msg });
  }
};

exports.getArtworkById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      const msg = 'Artwork not found.';
      return res.status(404).json({ success: false, error: msg, message: msg });
    }
    const artwork = await Artwork.findById(req.params.id);
    if (!artwork) {
      const msg = 'Artwork not found.';
      return res.status(404).json({ success: false, error: msg, message: msg });
    }
    res.json({ success: true, artwork });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, message: err.message });
  }
};

// --- ORDERS APIS ---
exports.getCalculatePrice = (req, res) => {
  const { medium, size, num_faces, frame_type } = req.query;
  const pricing = calculateOrderPrice(medium, size, num_faces, frame_type);
  res.json({ success: true, pricing });
};

exports.postCreateOrder = async (req, res) => {
  try {
    const {
      customer_name,
      customer_email,
      customer_phone,
      shipping_address,
      city,
      state,
      pincode,
      portrait_medium,
      portrait_size,
      num_faces,
      frame_type,
      special_instructions
    } = req.body;

    if (!req.file) {
      const msg = 'Please upload a reference photograph for the artist to draw from.';
      return res.status(400).json({ success: false, error: msg, message: msg });
    }

    if (!customer_name || !customer_email || !customer_phone || !shipping_address || !city || !pincode) {
      const msg = 'Please complete all required recipient and delivery address details.';
      return res.status(400).json({ success: false, error: msg, message: msg });
    }

    const referencePhotoPath = `/uploads/orders/${req.file.filename}`;
    const pricing = calculateOrderPrice(portrait_medium, portrait_size, num_faces, frame_type);

    const userId = (req.session && req.session.userId && req.session.userId.length === 24) ? req.session.userId : null;

    const newOrder = await Order.create({
      order_number: Order.generateOrderNumber(),
      user_id: userId,
      customer_name: customer_name.trim(),
      customer_email: customer_email.toLowerCase().trim(),
      customer_phone: customer_phone.trim(),
      shipping_address: shipping_address.trim(),
      city: city.trim(),
      state: state ? state.trim() : '',
      pincode: pincode.trim(),
      portrait_medium,
      portrait_size,
      num_faces: parseInt(num_faces, 10) || 1,
      frame_type,
      special_instructions: special_instructions || '',
      reference_photo: referencePhotoPath,
      base_price: pricing.basePrice,
      frame_price: pricing.framePrice,
      faces_extra: pricing.facesExtra,
      shipping_charge: pricing.shippingCharge,
      tax_amount: pricing.taxAmount,
      total_amount: pricing.totalAmount,
      payment_method: 'Pending',
      payment_status: 'Unpaid',
      order_status: 'Pending'
    });

    if (userId) {
      try {
        await User.findByIdAndUpdate(userId, {
          address: shipping_address,
          city,
          state,
          pincode,
          phone: customer_phone
        });
      } catch (e) {
        console.warn('User address sync error:', e.message);
      }
    }

    res.json({
      success: true,
      order: newOrder,
      orderNumber: newOrder.order_number
    });
  } catch (err) {
    console.error('postCreateOrder error:', err);
    const msg = 'Failed to create commission order.';
    res.status(500).json({ success: false, error: msg, message: msg });
  }
};

exports.getMyOrders = async (req, res) => {
  try {
    if (!req.session || !req.session.userId) {
      const msg = 'Please log in to view your commissions.';
      return res.status(401).json({ success: false, error: msg, message: msg });
    }

    if (!mongoose.Types.ObjectId.isValid(req.session.userId)) {
      return res.json({ success: true, orders: [] });
    }

    const orders = await Order.find({ user_id: req.session.userId }).sort({ created_at: -1 });
    res.json({ success: true, orders });
  } catch (err) {
    console.error('getMyOrders error:', err);
    const msg = 'Failed to retrieve orders.';
    res.status(500).json({ success: false, error: msg, message: msg });
  }
};

exports.getOrderByNumber = async (req, res) => {
  try {
    const { orderNumber } = req.params;
    const order = await Order.findOne({ order_number: orderNumber });
    if (!order) {
      const msg = 'Order not found.';
      return res.status(404).json({ success: false, error: msg, message: msg });
    }
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, message: err.message });
  }
};

// --- PAYMENT APIS ---
exports.postProcessPayment = async (req, res) => {
  try {
    const { orderNumber } = req.params;
    const {
      customer_name,
      customer_phone,
      shipping_address,
      city,
      state,
      pincode,
      payment_method
    } = req.body;

    const order = await Order.findOne({ order_number: orderNumber });
    if (!order) {
      const msg = 'Order not found.';
      return res.status(404).json({ success: false, error: msg, message: msg });
    }

    if (customer_name && shipping_address && city && pincode) {
      order.customer_name = customer_name.trim();
      order.customer_phone = customer_phone ? customer_phone.trim() : order.customer_phone;
      order.shipping_address = shipping_address.trim();
      order.city = city.trim();
      order.state = state ? state.trim() : order.state;
      order.pincode = pincode.trim();
    }

    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    const txnMethodCode = (payment_method || 'UPI').toUpperCase().slice(0, 3);
    const transactionId = `TXN-${txnMethodCode}-${Date.now().toString().slice(-6)}-${randomSuffix}`;

    const paymentStatus = (payment_method && (payment_method.includes('Cash on Delivery') || payment_method === 'COD')) ? 'Pending (COD)' : 'Paid';
    const orderStatus = 'Sketching in Progress';

    order.payment_method = payment_method || 'UPI Online Payment';
    order.payment_status = paymentStatus;
    order.transaction_id = transactionId;
    order.order_status = orderStatus;

    await order.save();

    let pdfBuffer = null;
    try {
      pdfBuffer = await generateOrderReceiptPDF(order);
    } catch (pdfErr) {
      console.error('PDF invoice buffer generation error:', pdfErr);
    }

    await Promise.allSettled([
      sendOrderConfirmationEmail(order, pdfBuffer).catch(err => console.error('Customer email failed:', err)),
      sendAdminNewOrderAlert(order).catch(err => console.error('Admin email failed:', err))
    ]);

    res.json({
      success: true,
      order,
      orderNumber: order.order_number
    });
  } catch (err) {
    console.error('postProcessPayment error:', err);
    const msg = 'Payment processing failed.';
    res.status(500).json({ success: false, error: msg, message: msg });
  }
};

// --- BILLING / PDF RECEIPT APIS ---
exports.downloadReceiptPdf = async (req, res) => {
  try {
    const { orderNumber } = req.params;
    const order = await Order.findOne({ order_number: orderNumber });
    if (!order) {
      return res.status(404).send('Invoice not found');
    }

    const pdfBuffer = await generateOrderReceiptPDF(order);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Invoice_${order.order_number}.pdf`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);
  } catch (err) {
    console.error('downloadReceiptPdf error:', err);
    res.status(500).send('Failed to generate PDF receipt');
  }
};

exports.postResendReceiptEmail = async (req, res) => {
  try {
    const { orderNumber } = req.params;
    const order = await Order.findOne({ order_number: orderNumber });
    if (!order) {
      const msg = 'Order not found';
      return res.status(404).json({ success: false, error: msg, message: msg });
    }

    const pdfBuffer = await generateOrderReceiptPDF(order);
    const result = await sendOrderConfirmationEmail(order, pdfBuffer);

    if (result.success) {
      res.json({ success: true, message: `Receipt sent to ${order.customer_email}!` });
    } else {
      const msg = result.error || 'Could not dispatch email.';
      res.status(500).json({ success: false, error: msg, message: msg });
    }
  } catch (err) {
    console.error('postResendReceiptEmail error:', err);
    const msg = 'Error resending email.';
    res.status(500).json({ success: false, error: msg, message: msg });
  }
};

// --- ADMIN APIS ---
const checkIsAdmin = (req) => {
  return req.session && req.session.userId && req.session.role === 'admin';
};

exports.getAdminDashboard = async (req, res) => {
  try {
    if (!checkIsAdmin(req)) {
      const msg = 'Access restricted to administrator.';
      return res.status(403).json({ success: false, error: msg, message: msg });
    }

    const stats = await Order.getDashboardStats();
    const recentOrders = await Order.find().sort({ created_at: -1 }).limit(8);
    const artworksCount = await Artwork.countDocuments();
    const usersCount = await User.countDocuments();

    res.json({
      success: true,
      stats,
      recentOrders,
      artworksCount,
      usersCount,
      adminEmail: ADMIN_EMAIL
    });
  } catch (err) {
    console.error('getAdminDashboard error:', err);
    const msg = 'Failed to load admin dashboard.';
    res.status(500).json({ success: false, error: msg, message: msg });
  }
};

exports.getAdminOrders = async (req, res) => {
  try {
    if (!checkIsAdmin(req)) {
      const msg = 'Access restricted.';
      return res.status(403).json({ success: false, error: msg, message: msg });
    }

    const orders = await Order.find().sort({ created_at: -1 });
    res.json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, message: err.message });
  }
};

exports.postAdminUpdateOrderStatus = async (req, res) => {
  try {
    if (!checkIsAdmin(req)) {
      const msg = 'Access restricted.';
      return res.status(403).json({ success: false, error: msg, message: msg });
    }

    const { orderId, order_status, orderStatus } = req.body;
    const resolvedStatus = order_status || orderStatus;
    if (!orderId || !resolvedStatus) {
      const msg = 'Order ID and order status are required.';
      return res.status(400).json({ success: false, error: msg, message: msg });
    }
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      const msg = 'Invalid order ID.';
      return res.status(400).json({ success: false, error: msg, message: msg });
    }

    const updatedOrder = await Order.findByIdAndUpdate(orderId, { order_status: resolvedStatus }, { new: true });
    if (!updatedOrder) {
      const msg = 'Order not found.';
      return res.status(404).json({ success: false, error: msg, message: msg });
    }

    res.json({ success: true, message: 'Order status updated successfully.', order: updatedOrder });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, message: err.message });
  }
};

exports.getAdminArtworks = async (req, res) => {
  try {
    if (!checkIsAdmin(req)) {
      const msg = 'Access restricted.';
      return res.status(403).json({ success: false, error: msg, message: msg });
    }

    const artworks = await Artwork.find().sort({ _id: -1 });
    res.json({ success: true, artworks });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, message: err.message });
  }
};

exports.postAdminAddArtwork = async (req, res) => {
  try {
    if (!checkIsAdmin(req)) {
      const msg = 'Access restricted.';
      return res.status(403).json({ success: false, error: msg, message: msg });
    }

    const { title, category, medium, size, dimensions, price, description, featured } = req.body;
    if (!title || !category || !price) {
      const msg = 'Title, category, and price are required.';
      return res.status(400).json({ success: false, error: msg, message: msg });
    }

    let imageUrl = '/images/samples/portrait_1_hyperrealistic.svg';
    if (req.file) {
      imageUrl = `/uploads/artworks/${req.file.filename}`;
    }

    const newArt = await Artwork.create({
      title: title.trim(),
      category: category.trim(),
      medium: medium || 'Graphite & Charcoal',
      size: size || dimensions || 'A3 (11.7 x 16.5 in)',
      price: parseFloat(price) || 2500,
      description: description || '',
      image_url: imageUrl,
      featured: (featured === 'true' || featured === true || featured === 'on' || featured === '1') ? 1 : 0
    });

    res.json({ success: true, artwork: newArt });
  } catch (err) {
    console.error('postAdminAddArtwork error:', err);
    const msg = 'Failed to add artwork.';
    res.status(500).json({ success: false, error: msg, message: msg });
  }
};

exports.postAdminEditArtwork = async (req, res) => {
  try {
    if (!checkIsAdmin(req)) {
      const msg = 'Access restricted.';
      return res.status(403).json({ success: false, error: msg, message: msg });
    }

    const { id } = req.params;
    const { title, category, medium, size, dimensions, price, description, featured } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      const msg = 'Artwork not found.';
      return res.status(404).json({ success: false, error: msg, message: msg });
    }

    const artwork = await Artwork.findById(id);
    if (!artwork) {
      const msg = 'Artwork not found.';
      return res.status(404).json({ success: false, error: msg, message: msg });
    }

    if (!title || !category || !price) {
      const msg = 'Title, category, and price are required.';
      return res.status(400).json({ success: false, error: msg, message: msg });
    }

    artwork.title = title.trim();
    artwork.category = category.trim();
    artwork.medium = medium ? medium.trim() : artwork.medium;
    artwork.size = size || dimensions || artwork.size;
    artwork.price = parseFloat(price) || artwork.price;
    artwork.description = description !== undefined ? description.trim() : artwork.description;
    artwork.featured = (featured === 'true' || featured === true || featured === 'on' || featured === '1') ? 1 : 0;

    if (req.file) {
      artwork.image_url = `/uploads/artworks/${req.file.filename}`;
    }

    await artwork.save();
    res.json({ success: true, artwork });
  } catch (err) {
    console.error('postAdminEditArtwork error:', err);
    const msg = 'Failed to update artwork.';
    res.status(500).json({ success: false, error: msg, message: msg });
  }
};

exports.postAdminDeleteArtwork = async (req, res) => {
  try {
    if (!checkIsAdmin(req)) {
      const msg = 'Access restricted.';
      return res.status(403).json({ success: false, error: msg, message: msg });
    }

    const targetId = req.body.id || req.body.artworkId;
    if (!targetId) {
      const msg = 'Artwork ID is required.';
      return res.status(400).json({ success: false, error: msg, message: msg });
    }
    if (!mongoose.Types.ObjectId.isValid(targetId)) {
      const msg = 'Invalid artwork ID.';
      return res.status(400).json({ success: false, error: msg, message: msg });
    }

    const deletedArtwork = await Artwork.findByIdAndDelete(targetId);
    if (!deletedArtwork) {
      const msg = 'Artwork not found.';
      return res.status(404).json({ success: false, error: msg, message: msg });
    }
    res.json({ success: true, message: 'Artwork removed from portfolio.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, message: err.message });
  }
};

exports.getAdminTestEmail = async (req, res) => {
  try {
    if (!checkIsAdmin(req)) {
      const msg = 'Access restricted.';
      return res.status(403).json({ success: false, error: msg, message: msg });
    }

    await transporter.verify();
    res.json({ success: true, message: `SMTP verified successfully with ${ADMIN_EMAIL}!` });
  } catch (err) {
    res.json({ success: false, message: `SMTP verification failed: ${err.message}` });
  }
};

