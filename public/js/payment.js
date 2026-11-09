// Payment & Checkout Scripts - Midhun Pencil Portraits

document.addEventListener('DOMContentLoaded', () => {
  const paymentOptions = document.querySelectorAll('.payment-method-option');
  const upiBody = document.getElementById('upiBody');
  const cardBody = document.getElementById('cardBody');
  const netbankingBody = document.getElementById('netbankingBody');
  const codBody = document.getElementById('codBody');

  paymentOptions.forEach(opt => {
    const radio = opt.querySelector('input[type="radio"]');
    radio.addEventListener('change', () => {
      // Clear active class from all
      paymentOptions.forEach(p => p.classList.remove('active'));
      opt.classList.add('active');

      // Hide all bodies
      if (upiBody) upiBody.style.display = 'none';
      if (cardBody) cardBody.style.display = 'none';
      if (netbankingBody) netbankingBody.style.display = 'none';
      if (codBody) codBody.style.display = 'none';

      // Show relevant body
      const method = opt.getAttribute('data-method');
      if (method === 'UPI' && upiBody) upiBody.style.display = 'block';
      if (method === 'Card' && cardBody) cardBody.style.display = 'block';
      if (method === 'NetBanking' && netbankingBody) netbankingBody.style.display = 'block';
      if (method === 'COD' && codBody) codBody.style.display = 'block';
    });
  });

  // Credit Card Auto-Formatter
  const cardInput = document.querySelector('input[name="card_number"]');
  if (cardInput) {
    cardInput.addEventListener('input', (e) => {
      let val = e.target.value.replace(/\D/g, '');
      let formatted = '';
      for (let i = 0; i < val.length; i++) {
        if (i > 0 && i % 4 === 0) formatted += ' ';
        formatted += val[i];
      }
      e.target.value = formatted.substring(0, 19);
    });
  }

  // Handle Form Submission with Simulated Verification
  const checkoutForm = document.getElementById('checkoutPaymentForm');
  const payBtn = document.getElementById('btnPayNow');

  if (checkoutForm && payBtn) {
    checkoutForm.addEventListener('submit', (e) => {
      // Validate recipient name and phone
      const name = document.getElementById('customer_name').value.trim();
      const phone = document.getElementById('customer_phone').value.trim();
      const address = document.getElementById('shipping_address').value.trim();
      const city = document.getElementById('city').value.trim();
      const pincode = document.getElementById('pincode').value.trim();

      if (!name || !phone || !address || !city || !pincode) {
        alert('Please complete all required delivery address fields.');
        e.preventDefault();
        return;
      }

      // Visual progress feedback
      payBtn.disabled = true;
      payBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing & Generating Official Receipt...';
    });
  }
});
