const products = [
  { id: "r-101", name: "Кольцо Aurora", category: "Кольца", material: "Золото 585", price: 14900, rating: 4.9, sold: 32 },
  { id: "r-202", name: "Серьги Solar Drop", category: "Серьги", material: "Серебро 925", price: 9800, rating: 4.8, sold: 51 },
  { id: "n-303", name: "Колье Velvet Line", category: "Колье", material: "Золото 585", price: 21400, rating: 5.0, sold: 23 },
  { id: "b-404", name: "Браслет Tide", category: "Браслеты", material: "Серебро 925", price: 7600, rating: 4.7, sold: 47 },
  { id: "r-505", name: "Кольцо Opal Sign", category: "Кольца", material: "Белое золото", price: 18600, rating: 4.9, sold: 29 },
  { id: "e-606", name: "Кафф Cascade", category: "Серьги", material: "Титан + позолота", price: 6300, rating: 4.6, sold: 64 },
  { id: "n-707", name: "Подвеска Muse", category: "Колье", material: "Золото + эмаль", price: 12400, rating: 4.8, sold: 36 },
  { id: "b-808", name: "Браслет Script", category: "Браслеты", material: "Серебро + циркон", price: 8900, rating: 4.7, sold: 42 }
];

const STORAGE_KEY = "atelier-lumiere-market-state";
const SHOP_EMAIL = "atelier.lumiere.orders@gmail.com";
const categories = ["Все", ...new Set(products.map((p) => p.category))];

const state = {
  activeCategory: "Все",
  search: "",
  sort: "popular",
  cart: {},
  wishlist: [],
  checkout: {
    name: "",
    phone: "",
    email: "",
    city: "",
    comment: ""
  }
};

const els = {
  productsGrid: document.getElementById("productsGrid"),
  categoryFilters: document.getElementById("categoryFilters"),
  searchInput: document.getElementById("searchInput"),
  sortSelect: document.getElementById("sortSelect"),
  cartBtn: document.getElementById("cartBtn"),
  cartCount: document.getElementById("cartCount"),
  wishlistBtn: document.getElementById("wishlistBtn"),
  wishlistCount: document.getElementById("wishlistCount"),
  cartDrawer: document.getElementById("cartDrawer"),
  wishlistDrawer: document.getElementById("wishlistDrawer"),
  cartItems: document.getElementById("cartItems"),
  wishlistItems: document.getElementById("wishlistItems"),
  cartSummary: document.getElementById("cartSummary"),
  checkoutModal: document.getElementById("checkoutModal"),
  checkoutForm: document.getElementById("checkoutForm"),
  checkoutOrderLines: document.getElementById("checkoutOrderLines"),
  overlay: document.getElementById("overlay"),
  toast: document.getElementById("toast"),
  topSellersList: document.getElementById("topSellersList"),
  goToTopSellers: document.getElementById("goToTopSellers"),
  topSellersBlock: document.getElementById("topSellersBlock")
};

function formatPrice(value) {
  return new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 }).format(value);
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    cart: state.cart,
    wishlist: state.wishlist,
    checkout: state.checkout
  }));
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;
  try {
    const parsed = JSON.parse(raw);
    state.cart = parsed.cart || {};
    state.wishlist = Array.isArray(parsed.wishlist) ? parsed.wishlist : [];
    state.checkout = { ...state.checkout, ...(parsed.checkout || {}) };
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => els.toast.classList.remove("show"), 1800);
}

function getFilteredProducts() {
  let list = [...products];

  if (state.activeCategory !== "Все") {
    list = list.filter((p) => p.category === state.activeCategory);
  }

  if (state.search.trim()) {
    const term = state.search.toLowerCase();
    list = list.filter((p) => `${p.name} ${p.material} ${p.category}`.toLowerCase().includes(term));
  }

  switch (state.sort) {
    case "price-asc":
      list.sort((a, b) => a.price - b.price);
      break;
    case "price-desc":
      list.sort((a, b) => b.price - a.price);
      break;
    case "rating":
      list.sort((a, b) => b.rating - a.rating);
      break;
    default:
      list.sort((a, b) => b.sold - a.sold);
  }

  return list;
}

function cartQty(productId) {
  return state.cart[productId] || 0;
}

function isWishlisted(productId) {
  return state.wishlist.includes(productId);
}

function renderFilters() {
  els.categoryFilters.innerHTML = categories
    .map((category) => {
      const active = state.activeCategory === category ? "active" : "";
      return `<button class="filter-chip ${active}" data-category="${category}">${category}</button>`;
    })
    .join("");
}

function renderProducts() {
  const list = getFilteredProducts();

  if (!list.length) {
    els.productsGrid.innerHTML = "<article class='product-card'><h3>Ничего не найдено</h3><p class='muted'>Попробуйте изменить фильтр или поиск.</p></article>";
    return;
  }

  els.productsGrid.innerHTML = list
    .map((product) => {
      const qty = cartQty(product.id);
      const wished = isWishlisted(product.id);

      return `
      <article class="product-card">
        <div class="product-thumb">${product.material}</div>
        <div class="product-meta">
          <div>
            <h3 class="product-name">${product.name}</h3>
            <p class="muted">${product.category} • Рейтинг ${product.rating}</p>
          </div>
          <span class="price">${formatPrice(product.price)}</span>
        </div>
        <div class="actions">
          <button class="primary-btn" data-add-cart="${product.id}">В корзину${qty ? ` (${qty})` : ""}</button>
          <button class="secondary-btn" data-toggle-wishlist="${product.id}">${wished ? "Убрать" : "В вишлист"}</button>
        </div>
      </article>`;
    })
    .join("");
}

function renderTopSellers() {
  const top = [...products].sort((a, b) => b.sold - a.sold).slice(0, 4);
  els.topSellersList.innerHTML = top
    .map((item) => `<li><span>${item.name}</span> <strong>${item.sold} продаж</strong></li>`)
    .join("");
}

function cartEntries() {
  return Object.entries(state.cart)
    .map(([id, qty]) => {
      const product = products.find((p) => p.id === id);
      if (!product || qty < 1) return null;
      return { product, qty };
    })
    .filter(Boolean);
}

function renderCart() {
  const entries = cartEntries();

  if (!entries.length) {
    els.cartItems.innerHTML = "<p class='muted'>Корзина пока пустая.</p>";
    els.cartSummary.innerHTML = "";
    return;
  }

  els.cartItems.innerHTML = entries
    .map(({ product, qty }) => `
      <article class="line-item">
        <h4>${product.name}</h4>
        <p class="muted">${product.material}</p>
        <div class="line-item-row">
          <strong>${formatPrice(product.price * qty)}</strong>
          <div class="actions">
            <button class="secondary-btn" data-cart-minus="${product.id}">-</button>
            <span>${qty}</span>
            <button class="secondary-btn" data-cart-plus="${product.id}">+</button>
          </div>
        </div>
      </article>
    `)
    .join("");

  const subtotal = entries.reduce((sum, item) => sum + item.product.price * item.qty, 0);
  const shipping = subtotal > 0 ? 490 : 0;
  const total = subtotal + shipping;

  els.cartSummary.innerHTML = `
    <p>Товары: <strong>${formatPrice(subtotal)}</strong></p>
    <p>Доставка: <strong>${formatPrice(shipping)}</strong></p>
    <p>Итого: <strong>${formatPrice(total)}</strong></p>
    <button class="primary-btn" id="checkoutBtn">Оформить заказ</button>
  `;
}

function renderWishlist() {
  const items = products.filter((p) => state.wishlist.includes(p.id));
  if (!items.length) {
    els.wishlistItems.innerHTML = "<p class='muted'>В вишлисте пока ничего нет.</p>";
    return;
  }

  els.wishlistItems.innerHTML = items
    .map((item) => `
      <article class="line-item">
        <h4>${item.name}</h4>
        <p class="muted">${item.material}</p>
        <div class="line-item-row">
          <strong>${formatPrice(item.price)}</strong>
          <div class="actions">
            <button class="secondary-btn" data-move-to-cart="${item.id}">В корзину</button>
            <button class="secondary-btn" data-toggle-wishlist="${item.id}">Убрать</button>
          </div>
        </div>
      </article>
    `)
    .join("");
}

function renderCheckoutForm() {
  if (!els.checkoutForm) return;

  const { name, phone, email, city, comment } = state.checkout;
  els.checkoutForm.elements.name.value = name || "";
  els.checkoutForm.elements.phone.value = phone || "";
  els.checkoutForm.elements.email.value = email || "";
  els.checkoutForm.elements.city.value = city || "";
  els.checkoutForm.elements.comment.value = comment || "";

  const entries = cartEntries();
  if (!entries.length) {
    els.checkoutOrderLines.innerHTML = "<li>Корзина пуста. Добавьте товары для отправки заявки.</li>";
    return;
  }

  const subtotal = entries.reduce((sum, item) => sum + item.product.price * item.qty, 0);
  const shipping = 490;
  const total = subtotal + shipping;

  const lines = entries
    .map((item) => `<li>${item.product.name} x ${item.qty} = ${formatPrice(item.product.price * item.qty)}</li>`)
    .join("");
  els.checkoutOrderLines.innerHTML = `${lines}<li>Доставка: ${formatPrice(shipping)}</li><li><strong>Итого: ${formatPrice(total)}</strong></li>`;
}

function renderCounters() {
  const cartCount = Object.values(state.cart).reduce((sum, value) => sum + value, 0);
  els.cartCount.textContent = String(cartCount);
  els.wishlistCount.textContent = String(state.wishlist.length);
}

function openPanel(name) {
  els.overlay.classList.add("show");
  if (name === "cart") els.cartDrawer.classList.add("open");
  if (name === "wishlist") els.wishlistDrawer.classList.add("open");
  if (name === "checkout") {
    renderCheckoutForm();
    els.checkoutModal.classList.add("open");
  }
}

function closePanels() {
  els.overlay.classList.remove("show");
  els.cartDrawer.classList.remove("open");
  els.wishlistDrawer.classList.remove("open");
  els.checkoutModal.classList.remove("open");
}

function addToCart(productId, amount = 1) {
  state.cart[productId] = cartQty(productId) + amount;
  saveState();
  refreshUI();
}

function decreaseFromCart(productId) {
  const next = cartQty(productId) - 1;
  if (next <= 0) {
    delete state.cart[productId];
  } else {
    state.cart[productId] = next;
  }
  saveState();
  refreshUI();
}

function toggleWishlist(productId) {
  if (isWishlisted(productId)) {
    state.wishlist = state.wishlist.filter((id) => id !== productId);
    showToast("Удалено из вишлиста");
  } else {
    state.wishlist.push(productId);
    showToast("Добавлено в вишлист");
  }
  saveState();
  refreshUI();
}

function checkout() {
  const entries = cartEntries();
  if (!entries.length) {
    showToast("Корзина пустая");
    return;
  }

  closePanels();
  openPanel("checkout");
}

function sendOrderByEmail() {
  const entries = cartEntries();
  if (!entries.length) {
    showToast("Корзина пустая");
    return;
  }

  const form = els.checkoutForm.elements;
  const orderData = {
    name: form.name.value.trim(),
    phone: form.phone.value.trim(),
    email: form.email.value.trim(),
    city: form.city.value.trim(),
    comment: form.comment.value.trim()
  };

  if (!orderData.name || !orderData.phone || !orderData.email) {
    showToast("Заполните имя, телефон и email");
    return;
  }

  state.checkout = orderData;
  saveState();

  const subtotal = entries.reduce((sum, item) => sum + item.product.price * item.qty, 0);
  const shipping = 490;
  const total = subtotal + shipping;
  const itemsList = entries
    .map((item, index) => `${index + 1}. ${item.product.name} (${item.product.material}) - ${item.qty} шт. x ${item.product.price} RUB = ${item.product.price * item.qty} RUB`)
    .join("\n");

  const body = [
    "Новая заявка с сайта Atelier Lumiere",
    "",
    `Клиент: ${orderData.name}`,
    `Телефон: ${orderData.phone}`,
    `Email: ${orderData.email}`,
    `Город: ${orderData.city || "не указан"}`,
    "",
    "Состав корзины:",
    itemsList,
    "",
    `Доставка: ${shipping} RUB`,
    `Итого: ${total} RUB`,
    "",
    `Комментарий: ${orderData.comment || "нет"}`,
    `Дата: ${new Date().toLocaleString("ru-RU")}`
  ].join("\n");

  const subject = `Заказ Atelier Lumiere: ${orderData.name}`;
  const mailto = `mailto:${SHOP_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  state.cart = {};
  saveState();
  refreshUI();
  closePanels();
  showToast("Открываю почтовый клиент");
  window.location.href = mailto;
}

function refreshUI() {
  renderFilters();
  renderProducts();
  renderCart();
  renderWishlist();
  renderCheckoutForm();
  renderCounters();
}

function bindEvents() {
  els.searchInput.addEventListener("input", (event) => {
    state.search = event.target.value;
    renderProducts();
  });

  els.sortSelect.addEventListener("change", (event) => {
    state.sort = event.target.value;
    renderProducts();
  });

  els.categoryFilters.addEventListener("click", (event) => {
    const btn = event.target.closest("[data-category]");
    if (!btn) return;
    state.activeCategory = btn.dataset.category;
    renderFilters();
    renderProducts();
  });

  document.body.addEventListener("click", (event) => {
    const addBtn = event.target.closest("[data-add-cart]");
    const wishBtn = event.target.closest("[data-toggle-wishlist]");
    const plusBtn = event.target.closest("[data-cart-plus]");
    const minusBtn = event.target.closest("[data-cart-minus]");
    const moveBtn = event.target.closest("[data-move-to-cart]");
    const closeBtn = event.target.closest("[data-close]");

    if (addBtn) {
      addToCart(addBtn.dataset.addCart, 1);
      showToast("Товар добавлен в корзину");
    }

    if (wishBtn) {
      toggleWishlist(wishBtn.dataset.toggleWishlist);
    }

    if (plusBtn) {
      addToCart(plusBtn.dataset.cartPlus, 1);
    }

    if (minusBtn) {
      decreaseFromCart(minusBtn.dataset.cartMinus);
    }

    if (moveBtn) {
      addToCart(moveBtn.dataset.moveToCart, 1);
      toggleWishlist(moveBtn.dataset.moveToCart);
      showToast("Перенесено в корзину");
    }

    if (closeBtn || event.target === els.overlay) {
      closePanels();
    }
  });

  els.cartBtn.addEventListener("click", () => openPanel("cart"));
  els.wishlistBtn.addEventListener("click", () => openPanel("wishlist"));

  els.checkoutForm.addEventListener("submit", (event) => {
    event.preventDefault();
    sendOrderByEmail();
  });

  els.cartSummary.addEventListener("click", (event) => {
    if (event.target.id === "checkoutBtn") {
      checkout();
    }
  });

  els.goToTopSellers.addEventListener("click", () => {
    els.topSellersBlock.scrollIntoView({ behavior: "smooth", block: "center" });
  });
}

function init() {
  loadState();
  renderTopSellers();
  refreshUI();
  bindEvents();
}

init();
