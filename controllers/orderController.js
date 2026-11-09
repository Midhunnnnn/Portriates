const Order = require('../models/Order');
const User = require('../models/User');

function calculateOrderPrice(medium, size, numFaces = 1, frameType = 'Unframed') {
  let basePrice = 1800; // Default A4 Graphite

  if (size === 'A3 (11.7 x 16.5 in)') {
    basePrice = 2800;
  } else if (size === 'A2 (16.5 x 23.4 in)') {
    basePrice = 4200;
  }

  if (medium.includes('Charcoal Blend')) {
    basePrice += 300;
  } else if (medium.includes('Hyper-Realistic Carbon')) {
    basePrice += 600;
  } else if (medium.includes('Colored Pencil')) {
    basePrice += 800;
  }

  const extraFaces = Math.max(0, parseInt(numFaces, 10) - 1);
  const facesExtra = extraFaces * 700;

  let framePrice = 0;
  if (frameType.includes('Matte Black')) {
    framePrice = 650;
  } else if (frameType.includes('Teak Wood')) {
    framePrice = 950;
  } else if (frameType.includes('Vintage Gold')) {
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

exports.getGiveOrder = async (req, res) => {
  try {
    let userDetails = {
      name: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      pincode: ''
    };

    if (req.session && req.session.userId) {
      const user = await User.findById(req.session.userId);
      if (user) {
        userDetails = {
          name: user.name || '',
          email: user.email || '',
          phone: user.phone || '',
          address: user.address || '',
          city: user.city || '',
          state: user.state || '',
          pincode: user.pincode || ''
        };
      }
    }

    res.render('orders/give-order', {
      pageTitle: 'Commission a Custom Pencil Portrait | Midhun Art Studio',
      userDetails,
      error: req.query.error || null,
      preselectedSize: req.query.size || 'A4 (8.3 x 11.7 in)',
      preselectedMedium: req.query.medium || 'Graphite Pencil (Classic Shading)'
    });
  } catch (err) {
    console.error('Error in getGiveOrder:', err);
    res.status(500).send('Server Error');
  }
};

exports.postGiveOrder = async (req, res) => {
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
      return res.render('orders/give-order', {
        pageTitle: 'Commission a Custom Pencil Portrait',
        userDetails: req.body,
        error: 'Please upload a reference photograph for the artist to draw from.',
        preselectedSize: portrait_size,
        preselectedMedium: portrait_medium
      });
    }

    if (!customer_name || !customer_email || !customer_phone || !shipping_address || !city || !pincode) {
      return res.render('orders/give-order', {
        pageTitle: 'Commission a Custom Pencil Portrait',
        userDetails: req.body,
        error: 'Please complete all recipient and delivery address details.',
        preselectedSize: portrait_size,
        preselectedMedium: portrait_medium
      });
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
        console.error('Non-critical user sync warning:', e.message);
      }
    }

    res.redirect(`/payment/checkout/${newOrder.order_number}`);
  } catch (err) {
    console.error('Error creating order in MongoDB:', err);
    res.render('orders/give-order', {
      pageTitle: 'Commission a Custom Pencil Portrait',
      userDetails: req.body || {},
      error: 'An error occurred while placing your commission order. Please try again.',
      preselectedSize: req.body.portrait_size || 'A4 (8.3 x 11.7 in)',
      preselectedMedium: req.body.portrait_medium || 'Graphite Pencil (Classic Shading)'
    });
  }
};

exports.getMyOrders = async (req, res) => {
  try {
    if (!req.session || !req.session.userId) {
      return res.redirect('/auth/login?returnTo=/orders/my-orders');
    }

    const orders = await Order.find({ user_id: req.session.userId }).sort({ created_at: -1 });
    res.render('orders/my-orders', {
      pageTitle: 'My Portrait Commissions | Midhun Art Studio',
      orders
    });
  } catch (err) {
    console.error('Error in getMyOrders:', err);
    res.status(500).send('Server Error');
  }
};

exports.apiCalculatePrice = (req, res) => {
  const { medium, size, num_faces, frame_type } = req.query;
  const pricing = calculateOrderPrice(
    medium || 'Graphite Pencil',
    size || 'A4 (8.3 x 11.7 in)',
    num_faces || 1,
    frame_type || 'Unframed'
  );
  res.json({ success: true, pricing });
};
