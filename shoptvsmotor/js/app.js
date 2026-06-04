// ============ AUTH ============
const AUTH_KEY = "ag_users";
const SESSION_KEY = "ag_session";
const SITE_LOGO = "https://shop.tvsmotor.com/cdn/shop/files/TVSLogo-hr_76515cfd-c937-4057-9b77-709d55df759c.svg?v=1722314758&width=130";
const SITE_FAVICON = "https://cdn.shopify.com/s/files/1/0757/0722/0250/files/faveicon.png?v=1726735244&crop=center&width=32&height=32";
const SITE_LOGO_ALT = "TVS Motor Company";

function siteLogoImg(width = 130, height = 24, extraClass = ""){
  const cls = extraClass ? ` class="${extraClass}"` : "";
  return `<img src="${SITE_LOGO}"${cls} width="${width}" height="${height}" alt="${SITE_LOGO_ALT}" loading="eager" fetchpriority="high" style="max-width:${width}px;object-position:50% 50%">`;
}

function getUsers(){ return JSON.parse(localStorage.getItem(AUTH_KEY) || "[]"); }
function saveUsers(u){ localStorage.setItem(AUTH_KEY, JSON.stringify(u)); }
function currentUser(){
  const s = sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY);
  return s ? JSON.parse(s) : null;
}
function logout(){
  sessionStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(SESSION_KEY);
  toast("Logged out successfully");
  setTimeout(()=>location.href="index.html", 600);
}

function setSession(user, remember=false){
  const data = JSON.stringify(user);
  if(remember) localStorage.setItem(SESSION_KEY, data);
  else sessionStorage.setItem(SESSION_KEY, data);
}

function findUserByEmail(email){
  const key = String(email || "").trim().toLowerCase();
  if(!key) return null;
  return getUsers().find(u => u.email === key) || null;
}

function loginWithEmail(email, password, remember=false){
  const user = findUserByEmail(email);
  if(!user || user.password !== password) return null;
  setSession({ name: user.name, email: user.email }, remember);
  if(typeof pushMcpUserEvent === "function") pushMcpUserEvent(user.email, { firstName: user.name });
  return user;
}

function registerWithEmail(name, email, password, opts={}){
  const cleanEmail = String(email || "").trim().toLowerCase();
  const cleanName = String(name || "").trim();
  if(!cleanName) return { ok: false, error: "Please enter your name." };
  if(!cleanEmail) return { ok: false, error: "Please enter a valid email." };
  if(String(password || "").length < 6) return { ok: false, error: "Password must be at least 6 characters." };
  if(findUserByEmail(cleanEmail)) return { ok: false, error: "An account with this email already exists." };
  const user = { name: cleanName, email: cleanEmail, password, newsletter: !!opts.newsletter, createdAt: Date.now() };
  const users = getUsers();
  users.push(user);
  saveUsers(users);
  setSession({ name: user.name, email: user.email });
  if(typeof pushMcpUserEvent === "function") pushMcpUserEvent(user.email, { firstName: user.name, marketingOptIn: !!opts.newsletter });
  return { ok: true, user };
}

function continueWithShop(){
  const user = { name: "Shop Customer", email: "shop@tvsmotor.demo" };
  setSession(user);
  return user;
}

function loginWithPhone(phone){
  const digits = String(phone).replace(/\D/g, "").slice(-10);
  if(digits.length !== 10) return false;
  const users = getUsers();
  const match = users.find(u => u.phone === digits || (u.email && u.email.startsWith(digits + "@")));
  const user = match
    ? { name: match.name, email: match.email, phone: digits }
    : { name: "Customer", email: digits + "@guest.tvsmotor.local", phone: digits };
  setSession(user);
  return true;
}

// ============ CART / WISHLIST ============
const USD_TO_INR = 83;

function toINR(amount){ return amount * USD_TO_INR; }
function formatINR(amount){
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}
function formatTVSPrice(amount){
  return "₹ " + Number(amount).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function getCart(){ return JSON.parse(localStorage.getItem("ag_cart") || "[]"); }
function saveCart(c){
  localStorage.setItem("ag_cart", JSON.stringify(c));
  updateBadges();
  renderCartDrawer();
  if(typeof pushMcpCartPage === "function") pushMcpCartPage();
}
function getWish(){ return JSON.parse(localStorage.getItem("ag_wish") || "[]"); }
function saveWish(w){ localStorage.setItem("ag_wish", JSON.stringify(w)); updateBadges(); }

function getProduct(id){
  return PRODUCTS.find(x => x.id === id) || null;
}

function getCartProducts(){
  return getCart().map(ci => {
    const p = getProduct(ci.id);
    return p ? { ...p, qty: ci.qty } : null;
  }).filter(Boolean);
}

function addToCart(id, qty=1, openDrawer=true){
  const cart = getCart();
  const ex = cart.find(i=>i.id===id);
  if(ex) ex.qty += qty; else cart.push({id, qty});
  saveCart(cart);
  if(openDrawer !== false) openCartDrawer();
}

function removeFromCart(id){
  saveCart(getCart().filter(i=>i.id!==id));
}

function updateCartQty(id, qty){
  const cart = getCart();
  const it = cart.find(i=>i.id===id);
  if(it){ it.qty = Math.max(1, qty); saveCart(cart); }
}

function initCartDrawer(){
  if(document.getElementById("cartDrawer")) return;

  const wrap = document.createElement("div");
  wrap.innerHTML = `
    <div class="ag-cart-backdrop" id="cartBackdrop" aria-hidden="true"></div>
    <aside class="ag-cart-drawer" id="cartDrawer" aria-hidden="true" aria-label="Shopping cart">
      <div class="ag-cart-drawer-head">
        <h2>Your cart</h2>
        <button type="button" class="ag-cart-close" id="cartCloseBtn" aria-label="Close cart">×</button>
      </div>
      <div class="ag-cart-drawer-scroll">
        <div class="ag-cart-drawer-body" id="cartDrawerBody"></div>
        <div class="ag-cart-upsell-wrap" id="cartDrawerUpsell"></div>
      </div>
      <div class="ag-cart-drawer-foot" id="cartDrawerFoot"></div>
      <button type="button" class="ag-cart-rewards" onclick="toast('Rewards program — demo')">🎁 Rewards</button>
    </aside>`;
  document.body.appendChild(wrap);

  document.getElementById("cartBackdrop").addEventListener("click", closeCartDrawer);
  document.getElementById("cartCloseBtn").addEventListener("click", closeCartDrawer);
  document.addEventListener("keydown", e => {
    if(e.key === "Escape") closeCartDrawer();
  });

  renderCartDrawer();

  if(new URLSearchParams(location.search).get("cart") === "open"){
    openCartDrawer();
    history.replaceState({}, "", location.pathname + location.hash);
  }
}

function openCartDrawer(){
  initCartDrawer();
  renderCartDrawer();
  document.getElementById("cartBackdrop").classList.add("open");
  document.getElementById("cartDrawer").classList.add("open");
  document.getElementById("cartBackdrop").setAttribute("aria-hidden", "false");
  document.getElementById("cartDrawer").setAttribute("aria-hidden", "false");
  document.body.classList.add("ag-cart-open");
  if(typeof pushMcpCartPage === "function") pushMcpCartPage();
}

function closeCartDrawer(){
  const backdrop = document.getElementById("cartBackdrop");
  const drawer = document.getElementById("cartDrawer");
  if(!backdrop || !drawer) return;
  backdrop.classList.remove("open");
  drawer.classList.remove("open");
  backdrop.setAttribute("aria-hidden", "true");
  drawer.setAttribute("aria-hidden", "true");
  document.body.classList.remove("ag-cart-open");
}

function toggleCartNote(){
  const wrap = document.getElementById("cartNoteWrap");
  if(wrap) wrap.hidden = !wrap.hidden;
}

function saveCartNote(val){
  localStorage.setItem("ag_cart_note", val || "");
}

function cartUpsellScroll(dir){
  const track = document.getElementById("cartUpsellTrack");
  if(track) track.scrollBy({ left: dir * 160, behavior: "smooth" });
}

function renderCartDrawer(){
  const body = document.getElementById("cartDrawerBody");
  const foot = document.getElementById("cartDrawerFoot");
  const upsell = document.getElementById("cartDrawerUpsell");
  if(!body || !foot) return;

  const items = getCartProducts();
  const cartIds = items.map(i => i.id);

  if(!items.length){
    body.innerHTML = `
      <div class="ag-cart-empty">
        <p>Your cart is empty</p>
        <button type="button" class="ag-cart-shop-btn" onclick="closeCartDrawer()">Continue shopping</button>
      </div>`;
    if(upsell) upsell.innerHTML = "";
    foot.innerHTML = "";
    return;
  }

  body.innerHTML = items.map(item => {
    const old = item.old ? `<span class="ag-cart-item-old">${formatTVSPrice(toINR(item.old))}</span>` : "";
    return `
      <div class="ag-cart-item">
        <a href="pdp.html?id=${item.id}" class="ag-cart-item-img" onclick="closeCartDrawer()">
          <img src="${item.img}" alt="${item.name}">
        </a>
        <div class="ag-cart-item-info">
          <span class="ag-cart-item-brand">TVS Motors</span>
          <a href="pdp.html?id=${item.id}" class="ag-cart-item-name" onclick="closeCartDrawer()">${item.name}</a>
          <div class="ag-cart-item-prices">
            <span class="ag-cart-item-price">${formatTVSPrice(toINR(item.price))}</span>${old}
          </div>
          <div class="ag-cart-qty">
            <button type="button" onclick="updateCartQty(${item.id}, ${item.qty - 1})" aria-label="Decrease quantity">−</button>
            <span>${item.qty}</span>
            <button type="button" onclick="updateCartQty(${item.id}, ${item.qty + 1})" aria-label="Increase quantity">+</button>
          </div>
        </div>
        <button type="button" class="ag-cart-item-rm" onclick="removeFromCart(${item.id})" aria-label="Remove item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
        </button>
      </div>`;
  }).join("");

  const recs = PRODUCTS.filter(p => !cartIds.includes(p.id)).slice(0, 8);
  if(upsell){
    upsell.innerHTML = recs.length ? `
      <div class="ag-cart-upsell">
        <div class="ag-cart-upsell-head">
          <h3>You may also like...</h3>
          <div class="ag-cart-upsell-nav">
            <button type="button" aria-label="Scroll left" onclick="cartUpsellScroll(-1)">‹</button>
            <button type="button" aria-label="Scroll right" onclick="cartUpsellScroll(1)">›</button>
          </div>
        </div>
        <div class="ag-cart-upsell-track" id="cartUpsellTrack">
          ${recs.map(p => `
            <article class="ag-cart-upsell-card">
              <a href="pdp.html?id=${p.id}" onclick="closeCartDrawer()"><img src="${p.img}" alt="${p.name}"></a>
              <a href="pdp.html?id=${p.id}" class="ag-cart-upsell-name" onclick="closeCartDrawer()">${p.name}</a>
              <div class="ag-cart-upsell-price">${formatTVSPrice(toINR(p.price))}</div>
            </article>`).join("")}
        </div>
      </div>` : "";
  }

  const total = items.reduce((s, i) => s + i.price * i.qty, 0);
  const note = localStorage.getItem("ag_cart_note") || "";
  foot.innerHTML = `
    <div class="ag-cart-total-row">
      <span>Total Amount</span>
      <strong>${formatTVSPrice(toINR(total))}</strong>
    </div>
    <button type="button" class="ag-cart-note-link" onclick="toggleCartNote()">Add order note</button>
    <div class="ag-cart-note-wrap" id="cartNoteWrap" ${note ? "" : "hidden"}>
      <textarea id="cartOrderNote" placeholder="How can we help you?" oninput="saveCartNote(this.value)">${note}</textarea>
    </div>
    <p class="ag-cart-disclaimer">Tax included, shipping and discounts calculated at checkout.</p>
    <button type="button" class="ag-cart-place-order" onclick="placeOrderFromCart()">Place Order</button>`;
}

function placeOrderFromCart(){
  if(!getCart().length){
    toast("Your cart is empty");
    return;
  }
  closeCartDrawer();
  openCheckoutModal();
}

// ============ CHECKOUT MODAL — TVS / GoKwik style ============
let checkoutStep = "login";
let checkoutSummaryOpen = false;

function getCheckoutTotals(){
  const items = getCartProducts();
  const sub = items.reduce((s, i) => s + i.price * i.qty, 0);
  const ship = sub > 99 ? 0 : 9.99;
  const tax = sub * 0.08;
  return {
    items,
    sub,
    ship,
    tax,
    total: sub + ship + tax,
    itemCount: items.reduce((s, i) => s + i.qty, 0)
  };
}

function initCheckoutModal(){
  if(document.getElementById("checkoutModal")) return;

  const wrap = document.createElement("div");
  wrap.innerHTML = `
    <div class="ag-co-backdrop" id="checkoutBackdrop" aria-hidden="true"></div>
    <div class="ag-co-modal" id="checkoutModal" role="dialog" aria-modal="true" aria-label="Checkout" aria-hidden="true">
      <div class="ag-co-head">
        <button type="button" class="ag-co-back" id="checkoutBackBtn" aria-label="Back">‹</button>
        <div class="ag-co-brand">
          ${siteLogoImg(110, 20)}
        </div>
        <div class="ag-co-secure"><span>🔒</span> 100% Secured Payment</div>
      </div>
      <div class="ag-co-scroll" id="checkoutModalBody"></div>
      <div class="ag-co-foot" id="checkoutModalFoot"></div>
    </div>`;
  document.body.appendChild(wrap);

  document.getElementById("checkoutBackdrop").addEventListener("click", closeCheckoutModal);
  document.getElementById("checkoutBackBtn").addEventListener("click", checkoutGoBack);
  document.addEventListener("keydown", e => {
    if(e.key === "Escape" && document.getElementById("checkoutModal")?.classList.contains("open")){
      closeCheckoutModal();
    }
  });

  if(new URLSearchParams(location.search).get("checkout") === "open"){
    openCheckoutModal();
    history.replaceState({}, "", location.pathname + location.hash);
  }
}

function openCheckoutModal(step){
  if(!getCart().length){
    toast("Your cart is empty");
    return;
  }
  initCheckoutModal();
  if(step){
    checkoutStep = step;
  } else if(currentUser() && localStorage.getItem("ag_checkout_draft")){
    checkoutStep = "payment";
  } else if(currentUser()){
    checkoutStep = "address";
  } else {
    checkoutStep = "login";
  }
  checkoutSummaryOpen = false;
  renderCheckoutModal();
  document.getElementById("checkoutBackdrop").classList.add("open");
  document.getElementById("checkoutModal").classList.add("open");
  document.getElementById("checkoutBackdrop").setAttribute("aria-hidden", "false");
  document.getElementById("checkoutModal").setAttribute("aria-hidden", "false");
  document.body.classList.add("ag-checkout-open");
  if(typeof pushMcpCheckoutPage === "function") pushMcpCheckoutPage();
}

function closeCheckoutModal(){
  const backdrop = document.getElementById("checkoutBackdrop");
  const modal = document.getElementById("checkoutModal");
  if(!backdrop || !modal) return;
  backdrop.classList.remove("open");
  modal.classList.remove("open");
  backdrop.setAttribute("aria-hidden", "true");
  modal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("ag-checkout-open");
}

function checkoutGoBack(){
  if(checkoutStep === "payment"){ checkoutStep = "address"; renderCheckoutModal(); return; }
  if(checkoutStep === "address" && !currentUser()){ checkoutStep = "login"; renderCheckoutModal(); return; }
  if(checkoutStep === "address" && currentUser()){ closeCheckoutModal(); openCartDrawer(); return; }
  closeCheckoutModal();
  openCartDrawer();
}

function toggleCheckoutSummary(){
  checkoutSummaryOpen = !checkoutSummaryOpen;
  const detail = document.getElementById("checkoutSummaryDetail");
  const chev = document.querySelector(".ag-co-summary-toggle .ag-co-chev");
  if(detail) detail.hidden = !checkoutSummaryOpen;
  if(chev) chev.textContent = checkoutSummaryOpen ? "▲" : "▼";
}

function checkoutSummaryHtml(state){
  const label = state.itemCount === 1 ? "1 item" : state.itemCount + " items";
  return `
    <button type="button" class="ag-co-summary-toggle" onclick="toggleCheckoutSummary()">
      <span class="ag-co-summary-left">
        <strong>Order Summary</strong>
        <span>${label}</span>
      </span>
      <span class="ag-co-summary-right">
        <strong>${formatTVSPrice(toINR(state.total)).replace(".00", "")}</strong>
        <span class="ag-co-chev">${checkoutSummaryOpen ? "▲" : "▼"}</span>
      </span>
    </button>
    <div class="ag-co-summary-detail" id="checkoutSummaryDetail" ${checkoutSummaryOpen ? "" : "hidden"}>
      ${state.items.map(i => `
        <div class="ag-co-summary-item">
          <img src="${i.img}" alt="">
          <div><span>${i.name}</span><small>${i.qty} × ${formatTVSPrice(toINR(i.price))}</small></div>
          <strong>${formatTVSPrice(toINR(i.price * i.qty))}</strong>
        </div>`).join("")}
      <div class="ag-co-summary-lines">
        <div><span>Subtotal</span><span>${formatTVSPrice(toINR(state.sub))}</span></div>
        <div><span>Shipping</span><span>${state.ship === 0 ? "FREE" : formatTVSPrice(toINR(state.ship))}</span></div>
        <div><span>Tax</span><span>${formatTVSPrice(toINR(state.tax))}</span></div>
      </div>
    </div>`;
}

function checkoutCouponHtml(){
  return `
    <div class="ag-co-coupon">
      <input type="text" id="checkoutCoupon" placeholder="Enter coupon code">
      <div class="ag-co-coupon-meta">
        <span>5 coupons available</span>
        <button type="button" onclick="toast('Coupons — demo')">View All</button>
      </div>
    </div>`;
}

function renderCheckoutLogin(state){
  return `
    ${checkoutSummaryHtml(state)}
    ${checkoutCouponHtml()}
    <div class="ag-co-gift-banner">Login to Redeem Gift Card</div>
    <h3 class="ag-co-step-title">Login to continue</h3>
    <label class="ag-co-phone-label" for="checkoutPhone">Enter Mobile Number</label>
    <div class="ag-co-phone-row">
      <span class="ag-co-cc">+91</span>
      <input type="tel" id="checkoutPhone" inputmode="numeric" maxlength="10" placeholder="Mobile number" autocomplete="tel">
    </div>
    <div class="ag-co-trust">
      <span class="ag-co-trust-brand">Powered by TVS Motors</span>
      <div class="ag-co-trust-badges">
        <span>PCI DSS</span>
        <span>Secured Payments</span>
        <span>Verified Merchant</span>
      </div>
    </div>
    <p class="ag-co-login-alt">Have an email account? <a href="login.html?return=${encodeURIComponent((location.pathname.split("/").pop() || "index.html") + location.search)}">Sign in here</a></p>`;
}

function renderCheckoutAddress(state, draft){
  const user = currentUser() || {};
  const d = draft || {};
  return `
    ${checkoutSummaryHtml(state)}
    ${checkoutCouponHtml()}
    <h3 class="ag-co-step-title">Delivery details</h3>
    <p class="ag-co-step-sub">Logged in as <strong>${user.name || "Customer"}</strong>${user.phone ? " · +91 " + user.phone : ""}</p>
    <div class="ag-co-fields">
      <div class="ag-co-field"><label>Full name</label><input id="coName" value="${d.fullName || user.name || ""}" placeholder="Rahul Sharma"></div>
      <div class="ag-co-field-row">
        <div class="ag-co-field"><label>Phone</label><input id="coPhone" value="${d.phone || user.phone || ""}" inputmode="tel" placeholder="9876543210"></div>
        <div class="ag-co-field"><label>Email</label><input id="coEmail" type="email" value="${d.email || (user.email && !user.email.includes("@guest.") ? user.email : "")}" placeholder="rahul@example.com"></div>
      </div>
      <div class="ag-co-field"><label>Address line 1</label><input id="coAddress1" value="${d.address1 || ""}" placeholder="House / Flat / Street"></div>
      <div class="ag-co-field"><label>Address line 2</label><input id="coAddress2" value="${d.address2 || ""}" placeholder="Area / Landmark (optional)"></div>
      <div class="ag-co-field-row three">
        <div class="ag-co-field"><label>City</label><input id="coCity" value="${d.city || ""}" placeholder="Mumbai"></div>
        <div class="ag-co-field"><label>State</label><input id="coState" value="${d.state || ""}" placeholder="Maharashtra"></div>
        <div class="ag-co-field"><label>PIN code</label><input id="coPincode" value="${d.pincode || ""}" inputmode="numeric" placeholder="400001"></div>
      </div>
    </div>`;
}

function renderCheckoutPayment(state, draft){
  return `
    ${checkoutSummaryHtml(state)}
    <h3 class="ag-co-step-title">Choose payment method</h3>
    <div class="ag-co-pay-methods">
      <label class="ag-co-pay-opt active"><input type="radio" name="coPay" value="upi" checked><div><strong>UPI</strong><span>GPay, PhonePe, Paytm</span></div></label>
      <label class="ag-co-pay-opt"><input type="radio" name="coPay" value="card"><div><strong>Credit / Debit Card</strong><span>Visa, Mastercard, RuPay</span></div></label>
      <label class="ag-co-pay-opt"><input type="radio" name="coPay" value="cod"><div><strong>Cash on Delivery</strong><span>Pay when delivered</span></div></label>
    </div>
    <div class="ag-co-fields" id="coPayFields">
      <div class="ag-co-field" id="coUpiField"><label>UPI ID</label><input id="coUpi" placeholder="name@upi"></div>
    </div>
    <div class="ag-co-address-preview">
      <strong>Deliver to</strong>
      <p>${draft.fullName}, ${draft.address1}${draft.address2 ? ", " + draft.address2 : ""}<br>${draft.city}, ${draft.state} - ${draft.pincode}</p>
    </div>`;
}

function renderCheckoutModal(){
  const body = document.getElementById("checkoutModalBody");
  const foot = document.getElementById("checkoutModalFoot");
  if(!body || !foot) return;

  const state = getCheckoutTotals();
  if(!state.items.length){
    closeCheckoutModal();
    return;
  }

  const draft = JSON.parse(localStorage.getItem("ag_checkout_draft") || "null") || {};

  if(checkoutStep === "login") body.innerHTML = renderCheckoutLogin(state);
  else if(checkoutStep === "address") body.innerHTML = renderCheckoutAddress(state, draft);
  else body.innerHTML = renderCheckoutPayment(state, draft);

  const btnLabel = checkoutStep === "payment" ? "Place Order" : "Continue";
  foot.innerHTML = `
    <label class="ag-co-offers"><input type="checkbox" id="coOffers" checked> Send me order updates &amp; offers — (no spam)</label>
    <button type="button" class="ag-co-continue" id="checkoutContinueBtn">${btnLabel}</button>
    <p class="ag-co-legal">By proceeding, I agree to TVS Motors' <a href="#">Privacy Policy</a> and <a href="#">T&amp;C</a></p>`;

  document.getElementById("checkoutContinueBtn").addEventListener("click", checkoutContinue);

  if(checkoutStep === "payment"){
    document.querySelectorAll('input[name="coPay"]').forEach(r => {
      r.addEventListener("change", () => {
        document.querySelectorAll(".ag-co-pay-opt").forEach(l => {
          l.classList.toggle("active", l.querySelector("input").checked);
        });
        const method = document.querySelector('input[name="coPay"]:checked').value;
        const upi = document.getElementById("coUpiField");
        if(upi) upi.style.display = method === "upi" ? "block" : "none";
      });
    });
  }
}

function checkoutContinue(){
  const state = getCheckoutTotals();
  if(!state.items.length) return;

  if(checkoutStep === "login"){
    const phone = document.getElementById("checkoutPhone")?.value.trim();
    if(!loginWithPhone(phone)){
      toast("Enter a valid 10-digit mobile number");
      return;
    }
    toast("Logged in successfully");
    checkoutStep = "address";
    renderCheckoutModal();
    return;
  }

  if(checkoutStep === "address"){
    const draft = {
      fullName: document.getElementById("coName").value.trim(),
      phone: document.getElementById("coPhone").value.trim(),
      email: document.getElementById("coEmail").value.trim(),
      address1: document.getElementById("coAddress1").value.trim(),
      address2: document.getElementById("coAddress2").value.trim(),
      city: document.getElementById("coCity").value.trim(),
      state: document.getElementById("coState").value.trim(),
      pincode: document.getElementById("coPincode").value.trim(),
      note: localStorage.getItem("ag_cart_note") || "",
      delivery: "Standard Delivery (3-5 days)",
      items: state.items,
      subtotal: state.sub,
      shipping: state.ship,
      tax: state.tax,
      total: state.total,
      currency: "INR"
    };
    if(!draft.fullName || !draft.phone || !draft.email || !draft.address1 || !draft.city || !draft.state || !draft.pincode){
      toast("Please fill all required delivery fields");
      return;
    }
    localStorage.setItem("ag_checkout_draft", JSON.stringify(draft));
    checkoutStep = "payment";
    renderCheckoutModal();
    return;
  }

  if(checkoutStep === "payment"){
    const draft = JSON.parse(localStorage.getItem("ag_checkout_draft") || "null");
    if(!draft) return;
    const method = document.querySelector('input[name="coPay"]:checked')?.value || "upi";
    if(method === "upi"){
      const upiId = document.getElementById("coUpi")?.value.trim();
      if(!upiId){ toast("Enter your UPI ID"); return; }
    }
    completeCheckoutOrder(draft, method);
  }
}

function completeCheckoutOrder(draft, method){
  const order = {
    id: "AG" + Date.now().toString().slice(-8),
    placedAt: new Date().toISOString(),
    method,
    customer: { fullName: draft.fullName, phone: draft.phone, email: draft.email },
    address: {
      address1: draft.address1, address2: draft.address2,
      city: draft.city, state: draft.state, pincode: draft.pincode,
      delivery: draft.delivery, note: draft.note || ""
    },
    payment: {
      type: method,
      label: method === "upi" ? "UPI" : method === "card" ? "Card" : "Cash on Delivery"
    },
    items: draft.items,
    subtotal: draft.subtotal,
    shipping: draft.shipping,
    tax: draft.tax,
    total: draft.total,
    currency: "INR"
  };
  if(method === "upi"){
    order.payment.details = { upiId: document.getElementById("coUpi")?.value.trim() };
  }
  localStorage.setItem("ag_last_order", JSON.stringify(order));
  localStorage.removeItem("ag_checkout_draft");
  localStorage.removeItem("ag_cart_note");
  saveCart([]);
  if(typeof pushMcpThankYouPage === "function") pushMcpThankYouPage(order);
  closeCheckoutModal();
  location.href = "thankyou.html";
}
function toggleWish(id){
  let w = getWish();
  if(w.includes(id)){ w = w.filter(x=>x!==id); toast("Removed from wishlist"); }
  else { w.push(id); toast("Added to wishlist"); }
  saveWish(w);
}

// ============ HEADER INJECTION ============
function megaCol(title, links){
  return `<div class="ag-mega-col"><h4>${title}</h4><ul>${links.map(l=>`<li><a href="${l.h}">${l.t}</a></li>`).join("")}</ul></div>`;
}

function buildHeader(active){
  const user = currentUser();
  const navItems = [
    { key:"merchandise", label:"Merchandise", href:"merchandise.html", mega:true, cols:[
      ["Helmets", [{h:"merchandise.html?cat=helmets#catalog",t:"Full Face Helmet"},{h:"merchandise.html?cat=helmets#catalog",t:"Half Face Helmet"},{h:"merchandise.html?cat=helmets#catalog",t:"Modular Helmets"},{h:"kids-wear.html",t:"Kids Helmets"}]],
      ["Riding Gear", [{h:"merchandise.html?cat=riding#catalog",t:"Riding Jacket"},{h:"merchandise.html?cat=riding#catalog",t:"Riding Shoes"},{h:"merchandise.html?cat=riding#catalog",t:"Riding Gloves"},{h:"merchandise.html?cat=riding#catalog",t:"Body Armor"}]],
      ["Urban Wear", [{h:"merchandise.html?cat=urban#catalog",t:"T-Shirts"},{h:"merchandise.html?cat=urban#catalog",t:"Caps"},{h:"merchandise.html?cat=urban#catalog",t:"Bags"},{h:"merchandise.html?cat=urban#catalog",t:"Sweatshirts"}]]
    ]},
    { key:"accessories", label:"Accessories", href:"shop.html", mega:true, cols:[
      ["Protection", [{h:"shop.html?cat=Exterior#catalog",t:"Crash Guard"},{h:"shop.html?cat=Exterior#catalog",t:"Helmet Lock"},{h:"shop.html?cat=Exterior#catalog",t:"Disc Brake Lock"},{h:"shop.html?cat=Exterior#catalog",t:"Pro Shield"}]],
      ["Style", [{h:"shop.html?cat=Interior#catalog",t:"Seat Cover"},{h:"shop.html?cat=Interior#catalog",t:"Tank Pad"},{h:"shop.html?cat=Interior#catalog",t:"Visor"},{h:"shop.html?cat=Interior#catalog",t:"Mirror"}]],
      ["Utility", [{h:"shop.html?cat=Electronics#catalog",t:"Mobile Charger"},{h:"shop.html?cat=Electronics#catalog",t:"Dashcam"},{h:"shop.html?cat=Lighting#catalog",t:"LED Bulbs"},{h:"shop.html?cat=Exterior#catalog",t:"Top Box"}]],
      ["Maintenance", [{h:"shop.html?cat=Interior#catalog",t:"Floor Mats"},{h:"shop.html?cat=Wheels#catalog",t:"Alloy Wheels"},{h:"shop.html?cat=Exterior#catalog",t:"Roof Carrier"},{h:"offer-zone.html#catalog",t:"On Sale"}]]
    ]},
    { key:"offer", label:"Offer Zone", href:"offer-zone.html", mega:true, cols:[
      ["Deals", [{h:"offer-zone.html#catalog",t:"On Sale"},{h:"offer-zone.html?cat=Interior#catalog",t:"Interior Deals"},{h:"offer-zone.html?cat=Lighting#catalog",t:"Lighting Offers"},{h:"offer-zone.html?cat=Electronics#catalog",t:"Electronics Deals"}]]
    ]},
    { key:"kids", label:"Kids Wear", href:"kids-wear.html", mega:true, cols:[
      ["Kids", [{h:"kids-wear.html?type=cap",t:"Kids Caps"},{h:"kids-wear.html?type=gaiter",t:"Neck Gaiters"},{h:"kids-wear.html?type=sleeve",t:"Arm Sleeves"},{h:"kids-wear.html?type=helmet",t:"Kids Helmets"}]]
    ]},
    { key:"model", label:"Shop By Model", href:"shop-by-model.html" },
    { key:"new", label:"New Launches", href:"shop.html?sort=new#catalog", gradient:true }
  ];

  const userLink = user
    ? `<button type="button" class="ag-util-btn" title="${user.name}" onclick="if(confirm('Log out?'))logout()" aria-label="Account">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
      </button>`
    : `<a href="login.html" class="ag-util-btn" title="Account" aria-label="Account">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
      </a>`;

  function navLink(item){
    const cls = ["ag-nav-link"];
    if(active === item.key || (active === "shop" && item.key === "accessories")) cls.push("active");
    if(item.gradient) cls.push("ag-gradient-text");
    const chev = item.mega ? `<span class="ag-chev">›</span>` : "";
    const mega = item.mega ? `
      <div class="ag-mega">
        <div class="container ag-mega-grid">
          ${item.cols.map(([title, links]) => megaCol(title, links)).join("")}
        </div>
      </div>` : "";
    return `<div class="ag-nav-item${item.mega ? " has-mega" : ""}">
      <a href="${item.href}" class="${cls.join(" ")}">${item.label}${chev}</a>${mega}
    </div>`;
  }

  return `
  <div class="ag-header">
    <div class="ag-top-bar">Get Upto 20% OFF Site-Wide</div>

    <div class="ag-main-row">
      <div class="container ag-main-inner">
        <a href="index.html" class="ag-logo" aria-label="TVS Motor Company Home">
          ${siteLogoImg()}
        </a>
        <form class="ag-search" role="search">
          <span class="ag-search-ico" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3-3"/></svg>
          </span>
          <input type="search" id="headerSearch" placeholder="Search for articles" aria-label="Search for articles">
          <button type="button" class="ag-mic-btn" aria-label="Voice search" title="Voice search">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v1a7 7 0 0 1-14 0v-1"/><path d="M12 18v4"/></svg>
          </button>
        </form>
      </div>
    </div>

    <div class="ag-nav-row">
      <div class="container ag-nav-inner">
        <nav class="ag-nav" aria-label="Main">${navItems.map(navLink).join("")}</nav>
        <div class="ag-nav-brand">
          <span class="ag-racing">TVS Motors</span>
          <span class="ag-racing-x">×</span>
          <span class="ag-racing-partner">Racing</span>
        </div>
        <div class="ag-util">
          <a href="contact.html" class="ag-util-btn" title="Track Order" aria-label="Track Order">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M1 3h15v13H1z"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
          </a>
          <button type="button" class="ag-util-btn" title="Cart" aria-label="Cart" onclick="openCartDrawer()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
            <span class="ag-badge" id="cartCount" data-cart-count>0</span>
          </button>
          <a href="wishlist.html" class="ag-util-btn" title="Wishlist" aria-label="Wishlist">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            <span class="ag-badge" data-wish-count>0</span>
          </a>
          ${userLink}
          <button type="button" class="ag-hamburger" id="hamburger" aria-label="Menu"><span></span><span></span><span></span></button>
        </div>
      </div>
    </div>

    <div class="ag-mobile-menu" id="mobileMenu">
      <div class="container">
        <a href="merchandise.html">Merchandise</a>
        <a href="shop.html">Accessories</a>
        <a href="offer-zone.html">Offer Zone</a>
        <a href="kids-wear.html">Kids Wear</a>
        <a href="shop-by-model.html">Shop By Model</a>
        <a href="shop.html?sort=new#catalog" class="ag-gradient-text">New Launches</a>
        <a href="index.html">Home</a>
        <a href="contact.html">Contact</a>
      </div>
    </div>
  </div>`;
}

function buildFooter(){
  return `
  <footer class="site site-footer">
    <div class="container">
      <!-- Brand Section -->
      <div class="f-brand-section">
        <a href="index.html" class="brand f-brand-logo" aria-label="TVS Motor Company Home">
          ${siteLogoImg(130, 24)}
        </a>
        <p style="color:var(--muted);font-size:13.5px;max-width:380px;line-height:1.6">Premium vehicle accessories trusted by 50,000+ drivers worldwide. Quality, performance and style for every ride.</p>
        <div class="f-social" style="display:flex;gap:12px;margin-top:16px">
          <a href="#" title="Facebook" style="width:36px;height:36px;border-radius:50%;background:var(--border);display:flex;align-items:center;justify-content:center;color:#666;text-decoration:none">f</a>
          <a href="#" title="Instagram" style="width:36px;height:36px;border-radius:50%;background:var(--border);display:flex;align-items:center;justify-content:center;color:#666;text-decoration:none">📷</a>
          <a href="#" title="Twitter" style="width:36px;height:36px;border-radius:50%;background:var(--border);display:flex;align-items:center;justify-content:center;color:#666;text-decoration:none">𝕏</a>
        </div>
      </div>

      <!-- Multi-Column Menu Section -->
      <div class="multi-menu-wrapper">
        <!-- Helmets Column -->
        <div class="menu-column">
          <h3 class="menu-heading">Helmets</h3>
          <ul class="menu-links">
            <li><a href="shop.html?cat=Helmets&type=Under1000" class="menu-link">Helmets under ₹1,000</a></li>
            <li><a href="shop.html?cat=Helmets&type=Under2000" class="menu-link">Helmets under ₹2,000</a></li>
            <li><a href="shop.html?cat=Helmets&type=Under3000" class="menu-link">Helmets under ₹3,000</a></li>
            <li><a href="shop.html?cat=Helmets&type=Under5000" class="menu-link">Helmets under ₹5,000</a></li>
            <li><a href="shop.html?cat=Helmets&type=FullFace" class="menu-link">Full Face Helmets</a></li>
            <li><a href="shop.html?cat=Helmets&type=HalfFace" class="menu-link">Half Face Helmets</a></li>
            <li><a href="shop.html?cat=Helmets&type=Modular" class="menu-link">Modular Helmets</a></li>
            <li><a href="kids-wear.html" class="menu-link">Kids Helmets</a></li>
          </ul>
        </div>

        <!-- Riding Gear Column -->
        <div class="menu-column">
          <h3 class="menu-heading">Riding Gear</h3>
          <ul class="menu-links">
            <li><a href="shop.html?cat=Gear&type=Jacket" class="menu-link">Riding Jackets</a></li>
            <li><a href="shop.html?cat=Gear&type=Shoes" class="menu-link">Riding Shoes</a></li>
            <li><a href="shop.html?cat=Gear&type=Gloves" class="menu-link">Riding Gloves</a></li>
            <li><a href="shop.html?cat=Gear&type=Armor" class="menu-link">Body Armor & Protection</a></li>
            <li><a href="shop.html?cat=Gear&type=Pants" class="menu-link">Riding Pants</a></li>
            <li><a href="shop.html?cat=Gear&type=Rainwear" class="menu-link">Rainwear & Covers</a></li>
            <li><a href="shop.html?cat=Gear&type=Backpack" class="menu-link">Riding Backpacks</a></li>
          </ul>
        </div>

        <!-- Accessories Column -->
        <div class="menu-column">
          <h3 class="menu-heading">Accessories</h3>
          <ul class="menu-links">
            <li><a href="shop.html?cat=Security&type=Lock" class="menu-link">Helmet Locks</a></li>
            <li><a href="shop.html?cat=Security&type=Guard" class="menu-link">Crash Guards</a></li>
            <li><a href="shop.html?cat=Style&type=Tank" class="menu-link">Tank Pads</a></li>
            <li><a href="shop.html?cat=Utility&type=Stand" class="menu-link">Side Stands</a></li>
            <li><a href="shop.html?cat=Utility&type=Charger" class="menu-link">Mobile Chargers</a></li>
            <li><a href="shop.html?cat=Care&type=Cleaner" class="menu-link">Chain Cleaners</a></li>
            <li><a href="shop.html?cat=Care&type=Oil" class="menu-link">Engine Oil & Fluids</a></li>
            <li><a href="shop.html?cat=Care&type=Polish" class="menu-link">Polish & Wax</a></li>
          </ul>
        </div>

        <!-- Urban Wear Column -->
        <div class="menu-column">
          <h3 class="menu-heading">Urban Wear</h3>
          <ul class="menu-links">
            <li><a href="shop.html?cat=Urban&type=Shirts" class="menu-link">T-Shirts & Shirts</a></li>
            <li><a href="shop.html?cat=Urban&type=Caps" class="menu-link">Caps & Hats</a></li>
            <li><a href="shop.html?cat=Urban&type=Bags" class="menu-link">Bags & Backpacks</a></li>
            <li><a href="shop.html?cat=Urban&type=Sweatshirt" class="menu-link">Sweatshirts & Hoodies</a></li>
            <li><a href="shop.html?cat=Urban&type=Shoes" class="menu-link">Casual Shoes</a></li>
            <li><a href="shop.html?cat=Urban&type=Jacket" class="menu-link">Casual Jackets</a></li>
          </ul>
        </div>

        <!-- Kids Wear Column -->
        <div class="menu-column">
          <h3 class="menu-heading">Kids Wear</h3>
          <ul class="menu-links">
            <li><a href="kids-wear.html?type=helmet" class="menu-link">Kids Helmets</a></li>
            <li><a href="kids-wear.html?type=cap" class="menu-link">Kids T-Shirts</a></li>
            <li><a href="kids-wear.html?type=cap" class="menu-link">Kids Jackets</a></li>
            <li><a href="kids-wear.html?type=sleeve" class="menu-link">Kids Gloves</a></li>
            <li><a href="kids-wear.html?type=cap" class="menu-link">Kids Shoes</a></li>
            <li><a href="kids-wear.html" class="menu-link">Safety Belts</a></li>
            <li><a href="kids-wear.html?type=cap" class="menu-link">Kids Caps</a></li>
          </ul>
        </div>

        <!-- Support Column -->
        <div class="menu-column">
          <h3 class="menu-heading">Support</h3>
          <ul class="menu-links">
            <li><a href="contact.html" class="menu-link">Contact Us</a></li>
            <li><a href="#" class="menu-link">Shipping Info</a></li>
            <li><a href="#" class="menu-link">Returns & Exchange</a></li>
            <li><a href="#" class="menu-link">Warranty</a></li>
            <li><a href="#" class="menu-link">Size Guide</a></li>
            <li><a href="#" class="menu-link">FAQ</a></li>
            <li><a href="index.html" class="menu-link">About TVS Motors</a></li>
            <li><a href="#" class="menu-link">Blog</a></li>
          </ul>
        </div>
      </div>

      <!-- Footer Bottom -->
      <div class="f-bottom">
        <span style="color:var(--muted);font-size:13px">© ${new Date().getFullYear()} TVS Motor Company. All rights reserved.</span>
        <div style="display:flex;gap:20px;color:var(--muted);font-size:13px">
          <a href="#" style="color:var(--muted);text-decoration:none">Privacy Policy</a>
          <a href="#" style="color:var(--muted);text-decoration:none">Terms & Conditions</a>
          <a href="#" style="color:var(--muted);text-decoration:none">Cookie Policy</a>
        </div>
      </div>
    </div>
  </footer>`;
}

function mountChrome(active){
  const headerEl = document.getElementById("header");
  if(headerEl) headerEl.innerHTML = buildHeader(active);
  const footerEl = document.getElementById("footer");
  if(footerEl) footerEl.innerHTML = buildFooter();
  updateBadges();
  initSiteHeader();
  initCartDrawer();
  initCheckoutModal();
  if(typeof pushMcpPageFromPath === "function") pushMcpPageFromPath(active);
}

function initSiteHeader(){
  const form = document.querySelector(".ag-search");
  if(form){
    form.addEventListener("submit", e=>{
      e.preventDefault();
      const q = form.querySelector("input").value.trim();
      location.href = q ? `shop.html?q=${encodeURIComponent(q)}#catalog` : "shop.html";
    });
    const mic = form.querySelector(".ag-mic-btn");
    if(mic) mic.addEventListener("click", ()=> toast("Voice search is not available in this demo"));
    const q = new URLSearchParams(location.search).get("q");
    const input = form.querySelector("input");
    if(q && input) input.value = q;
  }
  initMobileMenu();
}

// ============ UI HELPERS ============
let toastTimer;
function toast(msg){
  let el = document.getElementById("ag-toast");
  if(!el){
    el = document.createElement("div");
    el.id = "ag-toast";
    el.className = "toast";
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=>el.classList.remove("show"), 2800);
}

function productCard(p){
  return accessoryCard(p);
}

function merchandiseCard(p){
  const wish = getWish().includes(p.id);
  const stars = "★".repeat(Math.round(p.rating)) + "☆".repeat(5 - Math.round(p.rating));
  const priceInr = toINR(p.price);
  const mrpInr = p.old ? toINR(p.old) : Math.round(priceInr * 1.22);
  const off = p.old ? Math.round((1 - p.price / p.old) * 100) : Math.round((1 - priceInr / mrpInr) * 100);
  const mrpLine = p.old || off > 0
    ? `<div class="merch-mrp">MRP ${formatTVSPrice(mrpInr)} <span class="merch-off">(${off}% off)</span></div>`
    : "";
  const soldBadge = p.soldOut ? `<span class="merch-sold">Sold out</span>` : "";
  let btn;
  if(p.selectSize && !p.soldOut){
    btn = `<button type="button" class="merch-btn" onclick="toast('Select your size — demo')"><span class="merch-btn-ico">🛒</span> Select Size</button>`;
  } else if(p.soldOut){
    btn = `<button type="button" class="merch-btn merch-btn-outline" onclick="toast('We will notify you when back in stock')"><span class="merch-btn-ico">🔔</span> Notify me</button>`;
  } else {
    btn = `<button type="button" class="merch-btn" onclick="addToCart(${p.id})"><span class="merch-btn-ico">🛒</span> Add to cart</button>`;
  }
  return `
  <article class="merch-card">
    <div class="merch-card-media">
      ${soldBadge}
      <button class="merch-wish ${wish ? "active" : ""}" type="button" onclick="toggleWish(${p.id});this.classList.toggle('active')" aria-label="Wishlist">♥</button>
      <a href="pdp.html?id=${p.id}"><img src="${p.img}" alt="${p.name}" loading="lazy"></a>
    </div>
    <div class="merch-card-body">
      <h3><a href="pdp.html?id=${p.id}">${p.name}</a></h3>
      <div class="merch-price">${formatTVSPrice(priceInr)}</div>
      ${mrpLine}
      <div class="merch-rating">${stars} <span>${p.rating.toFixed(1)} (${p.reviews} Reviews &amp; Ratings)</span></div>
      <div class="merch-tax">(Inclusive of All Taxes)</div>
      ${btn}
    </div>
  </article>`;
}

function getCategoryProducts(slug){
  const meta = CATEGORY_REGISTRY[slug];
  if(!meta) return [];
  if(meta.source === "merch") return MERCH_PRODUCTS.filter(p => p.merchCat === slug);
  const rules = {
    "seat-covers": p => p.shopSlug === "seat-covers" || p.id === 1 || p.id === 304,
    "crash-guards": p => p.shopSlug === "crash-guards" || p.id === 2 || p.id === 7 || (p.id >= 301 && p.id <= 303),
    "top-boxes": p => p.id === 7,
    "lighting": p => p.category === "Lighting",
    "electronics": p => p.category === "Electronics",
    "wheels-alloys": p => p.category === "Wheels",
    "floor-mats": p => p.id === 8,
    "riding-gear": p => p.id === 6
  };
  const base = PRODUCTS.filter(p => p.id <= 100 || p.shopSlug === slug || (p.id >= 301 && p.id <= 304));
  const rule = rules[slug];
  if(rule) return base.filter(rule);
  return base.filter(p => p.category === meta.filterCat);
}

function getVehicleModel(modelId){
  if(typeof VEHICLE_MODELS === "undefined") return null;
  return VEHICLE_MODELS.find(m => m.id === modelId) || VEHICLE_MODELS[0];
}

function getSelectedModelId(fallback){
  const fromUrl = new URLSearchParams(location.search).get("model");
  if(fromUrl) return fromUrl;
  const stored = sessionStorage.getItem("ag_selected_model");
  if(stored) return stored;
  return fallback || (typeof VEHICLE_MODELS !== "undefined" ? VEHICLE_MODELS[0].id : "");
}

function setSelectedModelId(modelId){
  sessionStorage.setItem("ag_selected_model", modelId);
}

function goToShopByModel(modelId){
  setSelectedModelId(modelId);
  location.href = `shop-by-model.html?model=${encodeURIComponent(modelId)}`;
}

function getModelProducts(modelId){
  if(typeof MODEL_ACCESSORIES === "undefined") return [];
  const list = MODEL_ACCESSORIES.filter(p => p.modelId === modelId);
  const model = getVehicleModel(modelId);
  if(!model) return list;
  const key = model.name.split(" ").pop().toLowerCase();
  const extras = PRODUCTS.filter(p =>
    p.id >= 301 && p.id <= 304 &&
    p.name.toLowerCase().includes(key)
  );
  const seen = new Set();
  return [...list, ...extras].filter(p => {
    if(seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  });
}

function collectionCard(p){
  const wish = getWish().includes(p.id);
  const stars = "★".repeat(Math.round(p.rating)) + "☆".repeat(5 - Math.round(p.rating));
  const priceInr = toINR(p.price);
  const mrpInr = p.old ? toINR(p.old) : Math.round(priceInr * 1.15);
  const off = p.old ? Math.round((1 - p.price / p.old) * 100) : 0;
  const tag = p.tag ? `<span class="col-tag">${p.tag}</span>` : "";
  const mrpLine = p.old ? `<div class="col-mrp">MRP ${formatTVSPrice(mrpInr)} <span class="col-off">${off}% off</span></div>` : "";
  return `
  <article class="col-card">
    <div class="col-card-media">
      ${tag}
      <button class="col-wish ${wish ? "active" : ""}" type="button" onclick="toggleWish(${p.id});this.classList.toggle('active')" aria-label="Wishlist">♥</button>
      <a href="pdp.html?id=${p.id}"><img src="${p.img}" alt="${p.name}" loading="lazy"></a>
    </div>
    <div class="col-card-body">
      <h3><a href="pdp.html?id=${p.id}">${p.name}</a></h3>
      <div class="col-price">${formatTVSPrice(priceInr)}</div>
      ${mrpLine}
      <div class="col-rating">${stars} <span>(${p.reviews} Reviews &amp; Ratings)</span></div>
      <button type="button" class="col-add-btn" onclick="addToCart(${p.id})">Add to cart</button>
    </div>
  </article>`;
}

function kidsWearCard(p){
  const wish = getWish().includes(p.id);
  const priceInr = toINR(p.price);
  const mrpInr = p.old ? toINR(p.old) : Math.round(priceInr * 1.11);
  const off = p.old ? Math.round((1 - p.price / p.old) * 100) : 10;
  const stars = "★".repeat(Math.round(p.rating)) + "☆".repeat(5 - Math.round(p.rating));
  const ratingHtml = p.reviews
    ? `<div class="kids-rating">${stars} <span>${p.rating.toFixed(1)} (${p.reviews} Review${p.reviews !== 1 ? "s" : ""} &amp; Ratings)</span></div>`
    : "";
  const title = p.variant ? `${p.name} — ${p.variant}` : p.name;
  return `
  <article class="kids-card">
    <div class="kids-card-media">
      <button class="kids-wish ${wish ? "active" : ""}" type="button" onclick="toggleWish(${p.id});this.classList.toggle('active')" aria-label="Wishlist">♥</button>
      <a href="pdp.html?id=${p.id}"><img src="${p.img}" alt="${title}" loading="lazy"></a>
    </div>
    <div class="kids-card-body">
      <h3><a href="pdp.html?id=${p.id}">${p.name}</a></h3>
      <div class="kids-price-row">
        <span class="kids-price">${formatTVSPrice(priceInr)}</span>
        <span class="kids-mrp">MRP ${formatTVSPrice(mrpInr)}</span>
        <span class="kids-off">${off}% off</span>
      </div>
      ${ratingHtml}
      <div class="kids-size-row">
        <span class="kids-size-label">Size Available</span>
        <span class="kids-size-pill">${p.size || "One size"}</span>
      </div>
      <button type="button" class="kids-select-btn" onclick="toast('Select size — ${p.size || "One size"} (demo)');addToCart(${p.id})">
        <span class="kids-btn-ico">🛒</span> Select Size
      </button>
    </div>
  </article>`;
}

function accessoryCard(p){
  const wish = getWish().includes(p.id);
  const stars = "★".repeat(Math.round(p.rating)) + "☆".repeat(5 - Math.round(p.rating));
  const tag = p.tag ? `<span class="acc-tag">${p.tag}</span>` : "";
  const oldPrice = p.old ? `<span class="acc-old">${formatINR(toINR(p.old))}</span>` : "";
  return `
  <article class="acc-card">
    <div class="acc-card-media">
      ${tag}
      <button class="acc-wish ${wish ? "active" : ""}" type="button" onclick="toggleWish(${p.id});this.classList.toggle('active')" aria-label="Wishlist">♥</button>
      <a href="pdp.html?id=${p.id}"><img src="${p.img}" alt="${p.name}" loading="lazy"></a>
    </div>
    <div class="acc-card-body">
      <h3><a href="pdp.html?id=${p.id}">${p.name}</a></h3>
      <div class="acc-price">${formatINR(toINR(p.price))}${oldPrice}</div>
      <div class="acc-rating">${stars}<span>(${p.reviews})</span></div>
      <button class="acc-add-btn" type="button" onclick="addToCart(${p.id})">Add to Cart</button>
    </div>
  </article>`;
}

function accScroll(btn, dir){
  const track = btn.closest(".acc-row").querySelector(".acc-track");
  if(track) track.scrollBy({ left: dir * 280, behavior: "smooth" });
}

// ============ MOBILE MENU & MEGA MENU INIT ============
function initMobileMenu(){
  const hamburger = document.getElementById("hamburger");
  const mobileMenu = document.getElementById("mobileMenu");
  if(!hamburger || !mobileMenu) return;

  hamburger.addEventListener("click", function(e){
    e.stopPropagation();
    hamburger.classList.toggle("active");
    mobileMenu.classList.toggle("open");
  });

  mobileMenu.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", function(){
      hamburger.classList.remove("active");
      mobileMenu.classList.remove("open");
    });
  });

  document.addEventListener("click", function(e){
    if(!e.target.closest(".ag-hamburger") && !e.target.closest(".ag-mobile-menu")){
      hamburger.classList.remove("active");
      mobileMenu.classList.remove("open");
    }
  });
}

function updateBadges(){
  const cartCount = getCart().reduce((sum, item) => sum + item.qty, 0);
  const wishCount = getWish().length;
  const cartBadge = document.getElementById("cartCount");
  if(cartBadge) cartBadge.textContent = cartCount;
  document.querySelectorAll("[data-cart-count]").forEach(el => { el.textContent = cartCount; });
  document.querySelectorAll("[data-wish-count]").forEach(el => { el.textContent = wishCount; });
}

// ============ HERO CAROUSEL ============
(function(){
  function initHeroCarousel(){
    const slides = document.querySelectorAll('.hero .slide');
    const dotsContainer = document.getElementById('dots');
    const hero = document.querySelector('.hero');
    if(!slides || slides.length === 0) return;

    let current = 0;
    let timer = null;
    const interval = 6000;

    // build dots
    dotsContainer.innerHTML = '';
    slides.forEach((s, i) => {
      const d = document.createElement('button');
      d.className = 'dot' + (i===0? ' active' : '');
      d.setAttribute('aria-label', `Go to slide ${i+1}`);
      d.dataset.index = i;
      d.addEventListener('click', function(){ goTo(parseInt(this.dataset.index,10)); });
      dotsContainer.appendChild(d);
    });

    function update(){
      slides.forEach((s, i) => s.classList.toggle('active', i === current));
      const dots = dotsContainer.querySelectorAll('.dot');
      dots.forEach((d,i) => d.classList.toggle('active', i === current));
    }

    function goTo(i){
      current = (i + slides.length) % slides.length;
      update();
      restart();
    }

    function next(){ goTo(current + 1); }
    function prev(){ goTo(current - 1); }

    function start(){ if(timer) clearInterval(timer); timer = setInterval(next, interval); }
    function stop(){ if(timer) clearInterval(timer); timer = null; }
    function restart(){ stop(); start(); }

    // expose controls for inline onclick handlers
    window.slideNext = next;
    window.slidePrev = prev;

    // pause on hover
    if(hero){
      hero.addEventListener('mouseenter', stop);
      hero.addEventListener('mouseleave', start);
    }

    // keyboard support
    document.addEventListener('keydown', function(e){
      if(e.key === 'ArrowRight') next();
      if(e.key === 'ArrowLeft') prev();
    });

    // start autoplay
    start();
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initHeroCarousel);
  else initHeroCarousel();
})();

if(document.readyState === "loading"){
  document.addEventListener("DOMContentLoaded", () => { initCartDrawer(); initCheckoutModal(); });
} else {
  initCartDrawer();
  initCheckoutModal();
}
