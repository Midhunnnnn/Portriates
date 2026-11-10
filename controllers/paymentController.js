const Order = require('../models/Order');
const { generateOrderReceiptPDF } = require('../utils/pdfGenerator');
const { sendOrderConfirmationEmail, sendAdminNewOrderAlert } = require('../config/mailer');

exports.getCheckout = async (req, res) => {
  try {
    const { orderNumber } = req.params;
    const order = await Order.findOne({ order_number: orderNumber });

    if (!order) {
      return res.status(404).render('partials/alerts', {
        pageTitle: 'Order Not Found',
        errorMessage: 'The requested order could not be located.'
      });
    }

    res.render('payment/checkout', {
      pageTitle: `Payment & Checkout | Order #${order.order_number}`,
      order,
      error: req.query.error || null
    });
  } catch (err) {
    console.error('Error in getCheckout:', err);
    res.status(500).send('Server Error');
  }
};

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
      payment_method,
      card_number,
      upi_id
    } = req.body;

    const order = await Order.findOne({ order_number: orderNumber });
    if (!order) {
      return res.status(404).send('Order not found');
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

    const paymentStatus = payment_method === 'Cash on Delivery (Pay on Confirmation)' ? 'Pending (COD)' : 'Paid';
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
      console.error('Failed to generate PDF invoice buffer:', pdfErr);
    }

    // Async Nodemailer notifications (awaited for serverless compatibility)
    await Promise.allSettled([
      sendOrderConfirmationEmail(order, pdfBuffer).catch(err => {
        console.error('Email to customer failed:', err);
      }),
      sendAdminNewOrderAlert(order).catch(err => {
        console.error('Email alert to admin failed:', err);
      })
    ]);

    res.redirect(`/billing/receipt/${order.order_number}?success=Payment verified! Your commission is in artist queue.`);
  } catch (err) {
    console.error('Error processing payment in MongoDB:', err);
    res.redirect(`/payment/checkout/${req.params.orderNumber}?error=Payment processing failed. Please try again.`);
  }
};
