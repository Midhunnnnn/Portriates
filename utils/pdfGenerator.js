const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');

/**
 * Generates an itemized PDF invoice/receipt buffer for an order
 * @param {Object} order
 * @returns {Promise<Buffer>}
 */
function generateOrderReceiptPDF(order) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        margin: 40,
        size: 'A4'
      });

      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      const primaryColor = '#1e293b';
      const accentColor = '#b45309';
      const charcoal = '#334155';
      const lightBg = '#f8fafc';
      const tableBorder = '#cbd5e1';

      // --- HEADER ---
      doc.rect(40, 40, 515, 75).fill('#0f172a');

      doc.fillColor('#fbbf24')
        .fontSize(20)
        .font('Helvetica-Bold')
        .text('MIDHUN PENCIL PORTRAITS', 55, 55, { characterSpacing: 1.5 });

      doc.fillColor('#94a3b8')
        .fontSize(10)
        .font('Helvetica')
        .text('Fine Handcrafted Graphite & Charcoal Artwork Studio', 55, 80);

      doc.fillColor('#ffffff')
        .fontSize(9)
        .font('Helvetica')
        .text('Email: midhunrs727@gmail.com | Web: www.midhunportraits.art', 55, 95);

      // Invoice Badge
      doc.rect(420, 52, 120, 50).fill('#1e293b');
      doc.fillColor('#fbbf24').fontSize(11).font('Helvetica-Bold').text('OFFICIAL INVOICE', 430, 60, { width: 100, align: 'center' });
      doc.fillColor('#ffffff').fontSize(9).font('Helvetica').text(`#${order.order_number}`, 430, 78, { width: 100, align: 'center' });

      doc.moveDown(4);

      // --- METADATA ROW ---
      const metaY = 135;
      doc.fillColor('#64748b').fontSize(8).font('Helvetica-Bold').text('INVOICE DATE', 45, metaY);
      doc.fillColor('#0f172a').fontSize(10).font('Helvetica')
        .text(new Date(order.created_at || Date.now()).toLocaleDateString('en-IN', {
          year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        }), 45, metaY + 12);

      doc.fillColor('#64748b').fontSize(8).font('Helvetica-Bold').text('PAYMENT STATUS', 200, metaY);
      const isPaid = (order.payment_status || '').toLowerCase() === 'paid';
      doc.fillColor(isPaid ? '#15803d' : '#b91c1c').fontSize(10).font('Helvetica-Bold')
        .text((order.payment_status || 'PENDING').toUpperCase(), 200, metaY + 12);

      doc.fillColor('#64748b').fontSize(8).font('Helvetica-Bold').text('PAYMENT METHOD', 330, metaY);
      doc.fillColor('#0f172a').fontSize(10).font('Helvetica').text(order.payment_method || 'Online', 330, metaY + 12);

      doc.fillColor('#64748b').fontSize(8).font('Helvetica-Bold').text('TRANSACTION REF', 440, metaY);
      doc.fillColor('#0f172a').fontSize(9).font('Helvetica').text(order.transaction_id || 'PENDING-AUTH', 440, metaY + 12);

      // Divider line
      doc.strokeColor(tableBorder).lineWidth(0.8).moveTo(45, metaY + 32).lineTo(550, metaY + 32).stroke();

      // --- CLIENT & SHIPPING INFORMATION ---
      const clientY = 180;
      doc.rect(45, clientY, 245, 95).fillAndStroke(lightBg, tableBorder);
      doc.rect(305, clientY, 245, 95).fillAndStroke(lightBg, tableBorder);

      // Billed To
      doc.fillColor('#b45309').fontSize(9).font('Helvetica-Bold').text('COMMISSIONED BY (CLIENT)', 55, clientY + 10);
      doc.fillColor('#0f172a').fontSize(10).font('Helvetica-Bold').text(order.customer_name, 55, clientY + 25);
      doc.fillColor('#475569').fontSize(9).font('Helvetica')
        .text(`Email: ${order.customer_email}`, 55, clientY + 40)
        .text(`Phone: ${order.customer_phone}`, 55, clientY + 54);

      // Shipped To
      doc.fillColor('#b45309').fontSize(9).font('Helvetica-Bold').text('DELIVERY ADDRESS', 315, clientY + 10);
      doc.fillColor('#0f172a').fontSize(9).font('Helvetica-Bold').text(order.customer_name, 315, clientY + 25);
      doc.fillColor('#475569').fontSize(9).font('Helvetica')
        .text(order.shipping_address, 315, clientY + 38, { width: 225 })
        .text(`${order.city}, ${order.state} - ${order.pincode}`, 315, clientY + 65);

      // --- ITEMIZATION TABLE ---
      const tableY = 295;

      // Table Header
      doc.rect(45, tableY, 505, 24).fill('#1e293b');
      doc.fillColor('#ffffff').fontSize(9).font('Helvetica-Bold');
      doc.text('DESCRIPTION / SPECIFICATIONS', 55, tableY + 7);
      doc.text('MEDIUM & SIZE', 260, tableY + 7);
      doc.text('FACES', 380, tableY + 7);
      doc.text('AMOUNT (INR)', 460, tableY + 7, { align: 'right', width: 80 });

      let currentY = tableY + 24;

      // Row 1: Portrait Sketch
      doc.rect(45, currentY, 505, 36).fillAndStroke('#ffffff', tableBorder);
      doc.fillColor('#0f172a').fontSize(9).font('Helvetica-Bold')
        .text(`Hand-Drawn Custom Portrait`, 55, currentY + 8);
      doc.fillColor('#64748b').fontSize(8).font('Helvetica')
        .text(`Authentic high-detail pencil commission`, 55, currentY + 20);

      doc.fillColor('#334155').fontSize(9).font('Helvetica')
        .text(`${order.portrait_medium} (${order.portrait_size})`, 260, currentY + 12);

      doc.text(`${order.num_faces} Face(s)`, 380, currentY + 12);

      doc.fillColor('#0f172a').fontSize(9).font('Helvetica-Bold')
        .text(`₹${Number(order.base_price).toLocaleString('en-IN')}`, 460, currentY + 12, { align: 'right', width: 80 });

      currentY += 36;

      // Row 2: Framing
      doc.rect(45, currentY, 505, 30).fillAndStroke(lightBg, tableBorder);
      doc.fillColor('#0f172a').fontSize(9).font('Helvetica')
        .text(`Framing Option: ${order.frame_type}`, 55, currentY + 9);
      doc.fillColor('#64748b').fontSize(8).font('Helvetica')
        .text(order.frame_price > 0 ? 'Glass protected mounting' : 'Tubed safe packaging', 260, currentY + 9);
      doc.text('-', 380, currentY + 9);
      doc.fillColor('#0f172a').fontSize(9).font('Helvetica')
        .text(`₹${Number(order.frame_price || 0).toLocaleString('en-IN')}`, 460, currentY + 9, { align: 'right', width: 80 });

      currentY += 30;

      // Row 3: Additional faces (if any)
      if (order.faces_extra && order.faces_extra > 0) {
        doc.rect(45, currentY, 505, 26).fillAndStroke('#ffffff', tableBorder);
        doc.fillColor('#0f172a').fontSize(9).font('Helvetica')
          .text(`Additional Subject Faces (${order.num_faces - 1} extra)`, 55, currentY + 8);
        doc.fillColor('#64748b').fontSize(8).font('Helvetica').text('Extra detailing & layering', 260, currentY + 8);
        doc.text(`${order.num_faces - 1}`, 380, currentY + 8);
        doc.fillColor('#0f172a').fontSize(9).font('Helvetica')
          .text(`₹${Number(order.faces_extra).toLocaleString('en-IN')}`, 460, currentY + 8, { align: 'right', width: 80 });
        currentY += 26;
      }

      // Row 4: Shipping
      doc.rect(45, currentY, 505, 26).fillAndStroke(lightBg, tableBorder);
      doc.fillColor('#0f172a').fontSize(9).font('Helvetica')
        .text('Express Insured Art Courier Delivery', 55, currentY + 8);
      doc.fillColor('#64748b').fontSize(8).font('Helvetica').text('Bubble & wooden core protection', 260, currentY + 8);
      doc.text('1 Ship', 380, currentY + 8);
      doc.fillColor('#0f172a').fontSize(9).font('Helvetica')
        .text(order.shipping_charge > 0 ? `₹${Number(order.shipping_charge).toLocaleString('en-IN')}` : 'FREE', 460, currentY + 8, { align: 'right', width: 80 });

      currentY += 26;

      // --- TOTALS SUMMARY BOX ---
      const totalBoxY = currentY + 15;
      const subtotal = Number(order.base_price) + Number(order.frame_price || 0) + Number(order.faces_extra || 0);

      doc.fillColor('#475569').fontSize(9).font('Helvetica').text('Subtotal:', 340, totalBoxY);
      doc.fillColor('#0f172a').text(`₹${subtotal.toLocaleString('en-IN')}`, 460, totalBoxY, { align: 'right', width: 80 });

      doc.fillColor('#475569').text('GST (5% Arts & Crafts):', 340, totalBoxY + 16);
      doc.fillColor('#0f172a').text(`₹${Number(order.tax_amount || 0).toLocaleString('en-IN')}`, 460, totalBoxY + 16, { align: 'right', width: 80 });

      doc.fillColor('#475569').text('Shipping & Handling:', 340, totalBoxY + 32);
      doc.fillColor('#0f172a').text(order.shipping_charge > 0 ? `₹${Number(order.shipping_charge).toLocaleString('en-IN')}` : '₹0 (Free)', 460, totalBoxY + 32, { align: 'right', width: 80 });

      // Grand Total Highlight
      doc.rect(330, totalBoxY + 50, 220, 32).fill('#0f172a');
      doc.fillColor('#ffffff').fontSize(11).font('Helvetica-Bold').text('TOTAL BILLED:', 340, totalBoxY + 60);
      doc.fillColor('#fbbf24').fontSize(13).font('Helvetica-Bold')
        .text(`₹${Number(order.total_amount).toLocaleString('en-IN')}`, 440, totalBoxY + 59, { align: 'right', width: 100 });

      // Special Notes / Instructions from Client
      doc.rect(45, totalBoxY, 270, 82).fillAndStroke(lightBg, tableBorder);
      doc.fillColor('#b45309').fontSize(8).font('Helvetica-Bold').text('ARTIST INSTRUCTIONS & NOTES', 55, totalBoxY + 8);
      doc.fillColor('#334155').fontSize(8).font('Helvetica')
        .text(order.special_instructions || 'Standard studio finishing with fixative spray and archival backing.', 55, totalBoxY + 22, { width: 250 });

      // --- ARTWORK CARE & AUTHENTICITY STAMP ---
      const bottomY = totalBoxY + 115;
      doc.strokeColor(tableBorder).lineWidth(0.6).moveTo(45, bottomY).lineTo(550, bottomY).stroke();

      doc.fillColor('#64748b').fontSize(8).font('Helvetica-Bold').text('HANDCRAFTED ARTWORK CERTIFICATION', 45, bottomY + 10);
      doc.fillColor('#475569').fontSize(8).font('Helvetica')
        .text('Every portrait is 100% drawn by hand using Staedtler/Faber-Castell graphite & charcoal pencils on 250 GSM acid-free Brustro paper. Coated with professional non-yellowing fixative spray.', 45, bottomY + 22, { width: 340 });

      // Artist Signature block
      doc.rect(410, bottomY + 8, 140, 55).stroke(tableBorder);
      doc.fillColor('#b45309').fontSize(13).font('Times-Italic').text('Midhun R.S.', 420, bottomY + 22, { align: 'center', width: 120 });
      doc.fillColor('#64748b').fontSize(7).font('Helvetica').text('LEAD ARTIST & FOUNDER', 420, bottomY + 44, { align: 'center', width: 120 });

      // Footer
      doc.fillColor('#94a3b8').fontSize(7).font('Helvetica')
        .text('Thank you for supporting traditional fine art. For commission queries, reach out at midhunrs727@gmail.com', 45, 780, { align: 'center', width: 510 });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = { generateOrderReceiptPDF };
