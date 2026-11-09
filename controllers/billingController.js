const Order = require('../models/Order');
const { generateOrderReceiptPDF } = require('../utils/pdfGenerator');
const { sendOrderConfirmationEmail } = require('../config/mailer');

exports.getReceipt = async (req, res) => {
  try {
    const { orderNumber } = req.params;
    const order = await Order.findOne({ order_number: orderNumber });

    if (!order) {
      return res.status(404).render('partials/alerts', {
        pageTitle: 'Invoice Not Found',
        errorMessage: 'We could not locate this billing receipt.'
      });
    }

    res.render('billing/receipt', {
      pageTitle: `Tax Invoice & Receipt #${order.order_number} | Midhun Portraits`,
      order,
      success: req.query.success || null,
      error: req.query.error || null
    });
  } catch (err) {
    console.error('Error fetching receipt:', err);
    res.status(500).send('Server Error');
  }
};

exports.downloadReceiptPDF = async (req, res) => {
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
    console.error('Error generating receipt PDF:', err);
    res.status(500).send('Failed to generate PDF receipt');
  }
};

exports.resendReceiptEmail = async (req, res) => {
  try {
    const { orderNumber } = req.params;
    const order = await Order.findOne({ order_number: orderNumber });

    if (!order) {
      return res.redirect(`/billing/receipt/${orderNumber}?error=Order not found`);
    }

    const pdfBuffer = await generateOrderReceiptPDF(order);
    const result = await sendOrderConfirmationEmail(order, pdfBuffer);

    if (result.success) {
      return res.redirect(`/billing/receipt/${orderNumber}?success=Receipt & invoice sent to ${order.customer_email}!`);
    } else {
      return res.redirect(`/billing/receipt/${orderNumber}?error=Could not send email: ${encodeURIComponent(result.error || 'Check SMTP configuration')}`);
    }
  } catch (err) {
    console.error('Error resending receipt email:', err);
    res.redirect(`/billing/receipt/${req.params.orderNumber}?error=Error sending email`);
  }
};
