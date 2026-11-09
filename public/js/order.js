// Custom Commission Order Flow Scripts - Midhun Pencil Portraits

document.addEventListener('DOMContentLoaded', () => {
  // --- DRAG & DROP PHOTO UPLOAD ---
  const dropzoneArea = document.getElementById('dropzoneArea');
  const photoInput = document.getElementById('photoInput');
  const dropzonePrompt = document.getElementById('dropzonePrompt');
  const photoPreviewWrap = document.getElementById('photoPreviewWrap');
  const imagePreview = document.getElementById('imagePreview');
  const fileNameDisplay = document.getElementById('fileNameDisplay');
  const btnRemovePhoto = document.getElementById('btnRemovePhoto');

  if (dropzoneArea && photoInput) {
    ['dragenter', 'dragover'].forEach(eventName => {
      dropzoneArea.addEventListener(eventName, (e) => {
        e.preventDefault();
        dropzoneArea.classList.add('dragover');
      });
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dropzoneArea.addEventListener(eventName, (e) => {
        e.preventDefault();
        dropzoneArea.classList.remove('dragover');
      });
    });

    dropzoneArea.addEventListener('drop', (e) => {
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        photoInput.files = e.dataTransfer.files;
        handlePhotoSelect(e.dataTransfer.files[0]);
      }
    });

    photoInput.addEventListener('change', () => {
      if (photoInput.files && photoInput.files[0]) {
        handlePhotoSelect(photoInput.files[0]);
      }
    });

    if (btnRemovePhoto) {
      btnRemovePhoto.addEventListener('click', (e) => {
        e.stopPropagation();
        photoInput.value = '';
        photoPreviewWrap.style.display = 'none';
        dropzonePrompt.style.display = 'block';
      });
    }
  }

  function handlePhotoSelect(file) {
    if (!file.type.match(/image\/(jpeg|png|webp|jpg)/i)) {
      alert('Please upload an image file (JPG, PNG or WEBP).');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      alert('Photo size exceeds 15MB. Please upload a smaller image.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      imagePreview.src = e.target.result;
      fileNameDisplay.textContent = file.name + ' (' + Math.round(file.size / 1024) + ' KB)';
      dropzonePrompt.style.display = 'none';
      photoPreviewWrap.style.display = 'block';
    };
    reader.readAsDataURL(file);
  }

  // --- DYNAMIC LIVE PRICE CALCULATOR ---
  const orderForm = document.getElementById('orderCommissionForm');
  if (!orderForm) return;

  function updateOrderPricing() {
    const selectedMediumEl = orderForm.querySelector('input[name="portrait_medium"]:checked');
    const selectedSizeEl = orderForm.querySelector('input[name="portrait_size"]:checked');
    const selectedFacesEl = document.getElementById('num_faces');
    const selectedFrameEl = orderForm.querySelector('input[name="frame_type"]:checked');

    const medium = selectedMediumEl ? selectedMediumEl.value : 'Graphite Pencil (Classic Shading)';
    const size = selectedSizeEl ? selectedSizeEl.value : 'A3 (11.7 x 16.5 in)';
    const numFaces = selectedFacesEl ? parseInt(selectedFacesEl.value, 10) : 1;
    const frame = selectedFrameEl ? selectedFrameEl.value : 'Rolled in Sturdy Art Tube (Unframed)';

    // Update displays
    const mediumDisplay = document.getElementById('summaryMediumDisplay');
    const sizeDisplay = document.getElementById('summarySizeDisplay');
    const facesDisplay = document.getElementById('summaryFacesDisplay');
    const frameDisplay = document.getElementById('summaryFrameDisplay');

    if (mediumDisplay) mediumDisplay.textContent = medium;
    if (sizeDisplay) sizeDisplay.textContent = size;
    if (facesDisplay) facesDisplay.textContent = `${numFaces} Face Subject${numFaces > 1 ? 's' : ''}`;
    if (frameDisplay) frameDisplay.textContent = frame.split('(')[0].trim();

    // Calculate Prices
    let basePrice = 1800;
    if (size.includes('A3')) basePrice = 2800;
    if (size.includes('A2')) basePrice = 4200;

    if (medium.includes('Charcoal Blend')) basePrice += 300;
    if (medium.includes('Hyper-Realistic Carbon')) basePrice += 600;
    if (medium.includes('Colored Pencil')) basePrice += 800;

    const extraFaces = Math.max(0, numFaces - 1);
    const facesExtra = extraFaces * 700;

    let framePrice = 0;
    if (frame.includes('Matte Black')) framePrice = 650;
    if (frame.includes('Teak Wood')) framePrice = 950;
    if (frame.includes('Vintage Gold')) framePrice = 1200;

    const subtotal = basePrice + facesExtra + framePrice;
    const taxAmount = Math.round(subtotal * 0.05); // 5% GST
    const shippingCharge = subtotal > 3500 ? 0 : 150;
    const totalAmount = subtotal + taxAmount + shippingCharge;

    // Update numbers in summary
    const summaryBasePrice = document.getElementById('summaryBasePrice');
    const summaryExtraFacesRow = document.getElementById('summaryExtraFacesRow');
    const summaryFacesPrice = document.getElementById('summaryFacesPrice');
    const summaryFrameRow = document.getElementById('summaryFrameRow');
    const summaryFramePrice = document.getElementById('summaryFramePrice');
    const summaryShippingPrice = document.getElementById('summaryShippingPrice');
    const summaryTaxPrice = document.getElementById('summaryTaxPrice');
    const summaryTotalPrice = document.getElementById('summaryTotalPrice');

    if (summaryBasePrice) summaryBasePrice.textContent = `₹${basePrice.toLocaleString('en-IN')}`;

    if (summaryExtraFacesRow && summaryFacesPrice) {
      if (facesExtra > 0) {
        summaryExtraFacesRow.style.display = 'flex';
        summaryFacesPrice.textContent = `+₹${facesExtra.toLocaleString('en-IN')}`;
      } else {
        summaryExtraFacesRow.style.display = 'none';
      }
    }

    if (summaryFrameRow && summaryFramePrice) {
      if (framePrice > 0) {
        summaryFrameRow.style.display = 'flex';
        summaryFramePrice.textContent = `+₹${framePrice.toLocaleString('en-IN')}`;
      } else {
        summaryFrameRow.style.display = 'none';
      }
    }

    if (summaryShippingPrice) {
      summaryShippingPrice.textContent = shippingCharge > 0 ? `₹${shippingCharge}` : 'FREE';
      if (shippingCharge === 0) {
        summaryShippingPrice.classList.add('text-success');
      } else {
        summaryShippingPrice.classList.remove('text-success');
      }
    }

    if (summaryTaxPrice) summaryTaxPrice.textContent = `₹${taxAmount.toLocaleString('en-IN')}`;
    if (summaryTotalPrice) summaryTotalPrice.textContent = `₹${totalAmount.toLocaleString('en-IN')}`;
  }

  // Attach event listeners to all option inputs
  orderForm.querySelectorAll('input[type="radio"], select').forEach(input => {
    input.addEventListener('change', updateOrderPricing);
  });

  // Initial calculation run
  updateOrderPricing();
});
