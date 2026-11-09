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
      return res.json({ user: null });
    }

    if (req.session.role === 'admin' && req.session.userId === 'admin_session') {
      return res.json({
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
      return res.json({ user: null });
    }

    res.json({
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
    res.status(500).json({ error: 'Server error' });
  }
};

exports.postRegister = async (req, res) => {
  try {
    const { name, email, password, confirmPassword, phone, address, city, state, pincode } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ email: cleanEmail });
    if (existing) {
      return res.status(400).json({ error: 'An account with this email already exists. Please log in.' });
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

    sendOtpVerificationEmail(cleanEmail, otpCode, name.trim()).catch(err => {
      console.warn('SMTP OTP send warning:', err.message);
    });

    res.json({
      success: true,
      message: 'Verification code sent to your email address.',
      email: cleanEmail
    });
  } catch (err) {
    console.error('postRegister error:', err);
    res.status(500).json({ error: 'Failed to initiate registration.' });
  }
};

exports.postVerifyOtp = async (req, res) => {
  try {
    const { otp, email } = req.body;
    const targetEmail = (email || req.session.pendingOtpEmail || '').toLowerCase().trim();

    if (!targetEmail) {
      return res.status(400).json({ error: 'Verification session expired. Please register again.' });
    }

    if (!otp || otp.trim().length !== 6) {
      return res.status(400).json({ error: 'Please enter a valid 6-digit verification code.' });
    }

    const cleanOtp = otp.trim();
    const otpRecord = await Otp.findOne({ email: targetEmail, type: 'signup' });

    if (!otpRecord) {
      return res.status(400).json({ error: 'Verification code has expired. Please request a new code.' });
    }

    if (otpRecord.otp !== cleanOtp) {
      return res.status(400).json({ error: 'Invalid verification code. Please check your email and try again.' });
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
    res.status(500).json({ error: 'Verification error occurred.' });
  }
};

exports.postResendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const targetEmail = (email || req.session.pendingOtpEmail || '').toLowerCase().trim();

    if (!targetEmail) {
      return res.status(400).json({ error: 'Session expired. Please register again.' });
    }

    const otpRecord = await Otp.findOne({ email: targetEmail, type: 'signup' });
    if (!otpRecord) {
      return res.status(400).json({ error: 'Verification session expired. Please register again.' });
    }

    const newOtp = generateOtp();
    otpRecord.otp = newOtp;
    otpRecord.created_at = new Date();
    await otpRecord.save();

    const name = (otpRecord.pendingData && otpRecord.pendingData.name) || req.session.pendingOtpName || 'Art Collector';
    sendOtpVerificationEmail(targetEmail, newOtp, name).catch(err => console.warn(err));

    res.json({ success: true, message: 'A new 6-digit verification code has been dispatched to your email.' });
  } catch (err) {
    console.error('postResendOtp error:', err);
    res.status(500).json({ error: 'Failed to resend verification code.' });
  }
};

exports.postLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Please enter both email and password.' });
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
      return res.status(400).json({ error: 'No account found with this email address. Please register.' });
    }

    const isMatch = await user.comparePassword(cleanInputPass);
    if (!isMatch) {
      return res.status(400).json({ error: 'Incorrect password. Please try again.' });
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
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
};

exports.postAdminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const cleanEmail = (email || '').toLowerCase().trim();
    const cleanPass = (password || '').trim();

    if (cleanEmail !== ADMIN_EMAIL) {
      return res.status(403).json({ error: 'Invalid credentials. Access restricted.' });
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

    return res.status(401).json({ error: 'Invalid credentials. Access restricted.' });
  } catch (err) {
    console.error('postAdminLogin error:', err);
    res.status(500).json({ error: 'Server error during admin authentication.' });
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

    res.json({ artworks, featuredArtworks, categories });
  } catch (err) {
    console.error('getArtworks error:', err);
    res.status(500).json({ error: 'Failed to fetch artworks.' });
  }
};

exports.getArtworkById = async (req, res) => {
  try {
    const artwork = await Artwork.findById(req.params.id);
    if (!artwork) {
      return res.status(404).json({ error: 'Artwork not found.' });
    }
    res.json({ artwork });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --- ORDERS APIS ---
exports.getCalculatePrice = (req, res) => {
  const { medium, size, num_faces, frame_type } = req.query;
  const pricing = calculateOrderPrice(medium, size, num_faces, frame_type);
  res.json({ pricing });
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
      return res.status(400).json({ error: 'Please upload a reference photograph for the artist to draw from.' });
    }

    if (!customer_name || !customer_email || !customer_phone || !shipping_address || !city || !pincode) {
      return res.status(400).json({ error: 'Please complete all required recipient and delivery address details.' });
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
    res.status(500).json({ error: 'Failed to create commission order.' });
  }
};

exports.getMyOrders = async (req, res) => {
  try {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ error: 'Please log in to view your commissions.' });
    }

    const orders = await Order.find({ user_id: req.session.userId }).sort({ created_at: -1 });
    res.json({ orders });
  } catch (err) {
    console.error('getMyOrders error:', err);
    res.status(500).json({ error: 'Failed to retrieve orders.' });
  }
};

exports.getOrderByNumber = async (req, res) => {
  try {
    const { orderNumber } = req.params;
    const order = await Order.findOne({ order_number: orderNumber });
    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }
    res.json({ order });
  } catch (err) {
    res.status(500).json({ error: err.message });
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
      return res.status(404).json({ error: 'Order not found.' });
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

    const paymentStatus = (payment_method && payment_method.includes('Cash on Delivery')) ? 'Pending (COD)' : 'Paid';
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

    sendOrderConfirmationEmail(order, pdfBuffer).catch(err => console.error('Customer email failed:', err));
    sendAdminNewOrderAlert(order).catch(err => console.error('Admin email failed:', err));

    res.json({
      success: true,
      order,
      orderNumber: order.order_number
    });
  } catch (err) {
    console.error('postProcessPayment error:', err);
    res.status(500).json({ error: 'Payment processing failed.' });
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
      return res.status(404).json({ error: 'Order not found' });
    }

    const pdfBuffer = await generateOrderReceiptPDF(order);
    const result = await sendOrderConfirmationEmail(order, pdfBuffer);

    if (result.success) {
      res.json({ success: true, message: `Receipt sent to ${order.customer_email}!` });
    } else {
      res.status(500).json({ error: result.error || 'Could not dispatch email.' });
    }
  } catch (err) {
    console.error('postResendReceiptEmail error:', err);
    res.status(500).json({ error: 'Error resending email.' });
  }
};

// --- ADMIN APIS ---
const checkIsAdmin = (req) => {
  return req.session && req.session.userId && req.session.role === 'admin';
};

exports.getAdminDashboard = async (req, res) => {
  try {
    if (!checkIsAdmin(req)) {
      return res.status(403).json({ error: 'Access restricted to administrator.' });
    }

    const stats = await Order.getDashboardStats();
    const recentOrders = await Order.find().sort({ created_at: -1 }).limit(8);
    const artworksCount = await Artwork.countDocuments();
    const usersCount = await User.countDocuments();

    res.json({
      stats,
      recentOrders,
      artworksCount,
      usersCount,
      adminEmail: ADMIN_EMAIL
    });
  } catch (err) {
    console.error('getAdminDashboard error:', err);
    res.status(500).json({ error: 'Failed to load admin dashboard.' });
  }
};

exports.getAdminOrders = async (req, res) => {
  try {
    if (!checkIsAdmin(req)) {
      return res.status(403).json({ error: 'Access restricted.' });
    }

    const orders = await Order.find().sort({ created_at: -1 });
    res.json({ orders });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.postAdminUpdateOrderStatus = async (req, res) => {
  try {
    if (!checkIsAdmin(req)) {
      return res.status(403).json({ error: 'Access restricted.' });
    }

    const { orderId, order_status } = req.body;
    await Order.findByIdAndUpdate(orderId, { order_status });
    res.json({ success: true, message: 'Order status updated successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAdminArtworks = async (req, res) => {
  try {
    if (!checkIsAdmin(req)) {
      return res.status(403).json({ error: 'Access restricted.' });
    }

    const artworks = await Artwork.find().sort({ _id: -1 });
    res.json({ artworks });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.postAdminAddArtwork = async (req, res) => {
  try {
    if (!checkIsAdmin(req)) {
      return res.status(403).json({ error: 'Access restricted.' });
    }

    const { title, category, medium, size, price, description, featured } = req.body;
    if (!title || !category || !price) {
      return res.status(400).json({ error: 'Title, category, and price are required.' });
    }

    let imageUrl = '/images/samples/portrait_1_hyperrealistic.svg';
    if (req.file) {
      imageUrl = `/uploads/artworks/${req.file.filename}`;
    }

    const newArt = await Artwork.create({
      title: title.trim(),
      category: category.trim(),
      medium: medium || 'Graphite & Charcoal',
      size: size || 'A3 (11.7 x 16.5 in)',
      price: parseFloat(price) || 2500,
      description: description || '',
      image_url: imageUrl,
      featured: (featured === 'true' || featured === true || featured === 'on' || featured === '1') ? 1 : 0
    });

    res.json({ success: true, artwork: newArt });
  } catch (err) {
    console.error('postAdminAddArtwork error:', err);
    res.status(500).json({ error: 'Failed to add artwork.' });
  }
};

exports.postAdminEditArtwork = async (req, res) => {
  try {
    if (!checkIsAdmin(req)) {
      return res.status(403).json({ error: 'Access restricted.' });
    }

    const { id } = req.params;
    const { title, category, medium, size, price, description, featured } = req.body;

    const artwork = await Artwork.findById(id);
    if (!artwork) {
      return res.status(404).json({ error: 'Artwork not found.' });
    }

    if (!title || !category || !price) {
      return res.status(400).json({ error: 'Title, category, and price are required.' });
    }

    artwork.title = title.trim();
    artwork.category = category.trim();
    artwork.medium = medium ? medium.trim() : artwork.medium;
    artwork.size = size || artwork.size;
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
    res.status(500).json({ error: 'Failed to update artwork.' });
  }
};

exports.postAdminDeleteArtwork = async (req, res) => {
  try {
    if (!checkIsAdmin(req)) {
      return res.status(403).json({ error: 'Access restricted.' });
    }

    const { id } = req.body;
    await Artwork.findByIdAndDelete(id);
    res.json({ success: true, message: 'Artwork removed from portfolio.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAdminTestEmail = async (req, res) => {
  try {
    if (!checkIsAdmin(req)) {
      return res.status(403).json({ error: 'Access restricted.' });
    }

    await transporter.verify();
    res.json({ success: true, message: `SMTP verified successfully with ${ADMIN_EMAIL}!` });
  } catch (err) {
    res.json({ success: false, message: `SMTP verification failed: ${err.message}` });
  }
};

