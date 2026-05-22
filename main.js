// Shared site script for Bootstrap pages
// - Persistent cart using localStorage
// - Cart badge updates
// - Cart page rendering + totals

(() => {
  const STORAGE_KEY = 'thp_cart_v1';

  /** @returns {Array<{name: string, price: number, qty: number}>} */
  function loadCart() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed
        .filter(i => i && typeof i.name === 'string' && typeof i.price === 'number' && typeof i.qty === 'number')
        .map(i => ({ name: i.name, price: i.price, qty: i.qty }));
    } catch {
      return [];
    }
  }

  function saveCart(items) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }

  function moneyToPula(value) {
    // value is a number like 650
    return 'P' + Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  /** @param {string} productName @param {number} price */
  function addToCart(productName, price) {
    const name = String(productName);
    const p = Number(price);
    if (!name || !Number.isFinite(p)) return;

    const cart = loadCart();
    const idx = cart.findIndex(i => i.name === name && i.price === p);
    if (idx >= 0) {
      cart[idx].qty += 1;
    } else {
      cart.push({ name, price: p, qty: 1 });
    }
    saveCart(cart);
    updateCartUI();

    // Avoid alert spam; show a lightweight toast if available.
    // Fallback: do nothing.
    if (typeof window.bootstrap !== 'undefined' && document.getElementById('cart-live-region')) {
      const live = document.getElementById('cart-live-region');
      if (live) live.textContent = `${name} added to your cart.`;
    }
  }

  function getTotalQty(items) {
    return items.reduce((sum, i) => sum + i.qty, 0);
  }

  function getSubtotal(items) {
    return items.reduce((sum, i) => sum + i.price * i.qty, 0);
  }

  function updateCartBadge(count) {
    // Badge elements: <span class="cart-badge" data-cart-badge></span>
    // If existing markup doesn't have data-cart-badge, we update .cart-badge inside the header anyway.
    const headerBadges = document.querySelectorAll('[data-cart-badge]');
    if (headerBadges.length) {
      headerBadges.forEach(el => {
        el.textContent = String(count);
        el.style.display = count > 0 ? '' : 'none';
      });
      return;
    }

    const badges = document.querySelectorAll('.cart-badge');
    badges.forEach(el => {
      el.textContent = String(count);
      el.style.display = count > 0 ? '' : 'none';
    });
  }

  function updateCartUI() {
    const cart = loadCart();
    const qty = getTotalQty(cart);
    updateCartBadge(qty);
  }

  function renderCartPage() {
    const cartItemsEl = document.getElementById('cart-items');
    const subtotalEl = document.getElementById('subtotal');
    const summaryEl = document.querySelector('.cart-summary');

    if (!cartItemsEl || !subtotalEl) return; // not a cart page

    const cart = loadCart();

    // Render empty state
    if (cart.length === 0) {
      cartItemsEl.innerHTML = `
        <div class="empty-cart">
          <h2>Your cart is empty</h2>
          <p>Browse our shop to add items to your cart.</p>
          <a href="shop.html" class="btn-primary">Start Shopping</a>
        </div>
      `;
      if (summaryEl) summaryEl.style.display = 'none';
      return;
    }

    if (summaryEl) summaryEl.style.display = '';

    // Build items
    cartItemsEl.innerHTML = '';
    cart.forEach((item) => {
      const itemEl = document.createElement('div');
      itemEl.className = 'cart-item';
      itemEl.dataset.name = item.name;
      itemEl.dataset.price = String(item.price);

      itemEl.innerHTML = `
        <div class="cart-item-image">
          <img alt="${item.name}" src="https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=200&h=200&fit=crop">
        </div>
        <div class="cart-item-details">
          <h3>${item.name}</h3>
          <p>${moneyToPula(item.price)}</p>
        </div>
        <div class="cart-item-qty">
          <input type="number" min="1" value="${item.qty}" style="width: 60px; padding: 8px; border: 1px solid #e0e0e0; border-radius: 4px;" />
        </div>
        <button type="button" style="background: none; border: none; font-size: 20px; cursor: pointer; color: #999;">🗑️</button>
      `;

      const qtyInput = itemEl.querySelector('input');
      qtyInput.addEventListener('change', () => {
        const next = Math.max(1, Number(qtyInput.value) || 1);
        const cart2 = loadCart();
        const idx = cart2.findIndex(i => i.name === item.name && i.price === item.price);
        if (idx >= 0) {
          cart2[idx].qty = next;
          saveCart(cart2);
          renderCartPage();
          updateCartUI();
        }
      });

      const removeBtn = itemEl.querySelector('button');
      removeBtn.addEventListener('click', () => {
        const cart2 = loadCart().filter(i => !(i.name === item.name && i.price === item.price));
        saveCart(cart2);
        renderCartPage();
        updateCartUI();
      });

      cartItemsEl.appendChild(itemEl);
    });

    const subtotal = getSubtotal(cart);
    subtotalEl.textContent = moneyToPula(subtotal);
  }

  function handleCheckout() {
    const cart = loadCart();
    const statusEl = document.getElementById('checkout-status');
    if (!statusEl) return;

    if (cart.length === 0) {
      statusEl.textContent = 'Your cart is empty.';
      return;
    }

    const subtotal = getSubtotal(cart);
    // Demo/placeholder checkout message (no payment gateway implemented)
    statusEl.textContent = `Proceeding to checkout (demo). Subtotal: ${moneyToPula(subtotal)}.`;
  }


  function init() {
    // Expose globals for inline onclick attributes we still have.
    window.addToCart = addToCart;
    window.handleCheckout = handleCheckout;

    updateCartUI();

    // Render cart content if on cart page
    renderCartPage();
  }

  document.addEventListener('DOMContentLoaded', init);
})();

