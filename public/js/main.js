// Main Client-Side Scripts - Midhun Pencil Portraits

document.addEventListener('DOMContentLoaded', () => {
  // Mobile Navigation Toggle
  const mobileBtn = document.getElementById('mobileMenuBtn');
  const navMenu = document.getElementById('navMenu');

  if (mobileBtn && navMenu) {
    mobileBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      navMenu.classList.toggle('show');
    });

    // Close mobile menu on link click
    navMenu.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('show');
      });
    });

    // Close when clicking outside
    document.addEventListener('click', (e) => {
      if (!navMenu.contains(e.target) && !mobileBtn.contains(e.target)) {
        navMenu.classList.remove('show');
      }
    });
  }

  // User Dropdown Toggle
  const userToggle = document.getElementById('userMenuToggle');
  const userDropdown = document.getElementById('userDropdownMenu');

  if (userToggle && userDropdown) {
    userToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      userDropdown.classList.toggle('show');
    });

    document.addEventListener('click', (e) => {
      if (!userDropdown.contains(e.target) && !userToggle.contains(e.target)) {
        userDropdown.classList.remove('show');
      }
    });
  }

  // Close modal when clicking backdrop or close button
  const modal = document.getElementById('artworkModal');
  const modalClose = document.getElementById('modalCloseBtn');

  if (modal) {
    if (modalClose) {
      modalClose.addEventListener('click', () => {
        modal.classList.remove('show');
      });
    }

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('show');
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('show')) {
        modal.classList.remove('show');
      }
    });
  }
});

// Open Artwork Quick View Modal
async function openArtworkModal(artworkId) {
  const modal = document.getElementById('artworkModal');
  const content = document.getElementById('modalContent');
  if (!modal || !content) return;

  content.innerHTML = '<div style="padding: 40px; text-align: center;"><i class="fa-solid fa-spinner fa-spin" style="font-size: 28px; color: #d4af37;"></i><p style="margin-top: 10px;">Loading artwork details...</p></div>';
  modal.classList.add('show');

  try {
    const res = await fetch(`/api/artwork/${artworkId}`);
    const data = await res.json();

    if (data.success && data.artwork) {
      const art = data.artwork;
      content.innerHTML = `
        <div class="modal-artwork-layout">
          <img src="${art.image_url}" alt="${art.title}" class="modal-art-image">
          <div class="modal-art-details">
            <span class="section-tag">${art.category}</span>
            <h2 style="font-size: 24px; margin-bottom: 8px; color: #ffffff;">${art.title}</h2>
            <div style="font-size: 13px; color: #94a3b8; margin-bottom: 16px;">
              <p style="margin-bottom: 4px;"><i class="fa-solid fa-pencil" style="color: #d4af37;"></i> Medium: <strong>${art.medium}</strong></p>
              <p><i class="fa-solid fa-ruler-combined" style="color: #d4af37;"></i> Dimension: <strong>${art.size}</strong></p>
            </div>
            <p style="font-size: 14px; color: #cbd5e1; line-height: 1.6; margin-bottom: 24px;">${art.description || 'Authentic handcrafted pencil sketch drawn with professional graphite and charcoal on heavy archival board.'}</p>
            <div style="margin-top: auto; padding-top: 16px; border-top: 1px solid #272f3d; display: flex; align-items: center; justify-content: space-between;">
              <div>
                <small style="display: block; font-size: 11px; color: #64748b;">Commission starting at</small>
                <span style="font-size: 24px; font-weight: 800; color: #d4af37;">₹${Number(art.price).toLocaleString('en-IN')}</span>
              </div>
              <a href="/orders/give-order?medium=${encodeURIComponent(art.medium)}&size=${encodeURIComponent(art.size)}" class="btn btn-gold btn-sm">
                <i class="fa-solid fa-paintbrush"></i> Commission This
              </a>
            </div>
          </div>
        </div>
      `;
    } else {
      content.innerHTML = '<div style="padding: 30px; text-align: center;"><p>Could not load artwork details.</p></div>';
    }
  } catch (err) {
    content.innerHTML = `<div style="padding: 30px; text-align: center;"><p>Error: ${err.message}</p></div>`;
  }
}
