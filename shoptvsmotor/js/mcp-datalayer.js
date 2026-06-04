/**
 * TVS Motors — MCP dataLayer for Salesforce Interactions / Styler sitemap
 */
window.dataLayer = window.dataLayer || [];

function pushMcp(payload){
  const base = {
    currency: "INR",
    site: "TVS Motors",
    pageUrl: window.location.href,
    pagePath: window.location.pathname
  };
  window.dataLayer.push({ MCP: Object.assign({}, base, payload) });
}

function mcpLineItem(product, qty){
  qty = qty || 1;
  const priceInr = typeof toINR === "function" ? toINR(product.price) : product.price * 83;
  const path = (window.location.pathname || "").split("/").pop() || "index.html";
  const origin = window.location.origin || "";
  return {
    item_id: String(product.id),
    item_sku: String(product.id),
    item_name: product.name || "",
    price: priceInr,
    quantity: parseInt(qty, 10) || 1,
    imageUrl: product.img || "",
    url: origin + "/pdp.html?id=" + product.id,
    category: product.category || product.merchCat || "",
    index: "0"
  };
}

function mcpCartLineItems(){
  if(typeof getCartProducts !== "function") return [];
  return getCartProducts().map(p => mcpLineItem(p, p.qty));
}

function mcpProductObject(p){
  const priceInr = typeof toINR === "function" ? toINR(p.price) : p.price * 83;
  const origin = window.location.origin || "";
  return {
    id: String(p.id),
    name: p.name,
    description: p.desc || p.name,
    imageUrl: p.img || "",
    url: origin + "/pdp.html?id=" + p.id,
    price: priceInr,
    currency: "INR",
    availability: "InStock",
    category: p.category || p.merchCat || p.shopSlug || "",
    color: p.color || "",
    size: p.size || ""
  };
}

function pushMcpHome(){
  pushMcp({ pageName: "Home", pageType: "Home" });
}

function pushMcpCategoryPage(listId, listName, products){
  const items = (products || []).slice(0, 50).map((p, i) => {
    const li = mcpLineItem(p, 1);
    li.index = String(i);
    return li;
  });
  pushMcp({
    pageType: "Category",
    pageName: listName || listId,
    itemListId: listId || "category",
    itemListName: listName || "Category",
    items: items
  });
}

function pushMcpProductPage(p){
  pushMcp({
    pageType: "Product",
    pageName: p.name,
    Item: mcpProductObject(p),
    items: [mcpLineItem(p, 1)]
  });
}

function pushMcpCartPage(){
  pushMcp({
    pageType: "Cart",
    pageName: "Cart",
    items: mcpCartLineItems()
  });
}

function pushMcpCheckoutPage(){
  pushMcp({
    pageType: "view_checkout",
    pageName: "Checkout",
    items: mcpCartLineItems()
  });
}

function pushMcpLoginPage(){
  pushMcp({ pageType: "login", pageName: "Sign In" });
}

function pushMcpContactPage(){
  pushMcp({ pageType: "Contact", pageName: "Contact Us" });
}

function pushMcpThankYouPage(order){
  const items = (order && order.items) ? order.items.map((p, i) => {
    const li = mcpLineItem(p, p.qty || 1);
    li.index = String(i);
    return li;
  }) : [];
  pushMcp({
    pageType: "Purchase",
    pageName: "Thank You",
    orderId: order ? order.id : null,
    items: items
  });
}

function pushMcpDefault(pageName){
  pushMcp({ pageType: "default", pageName: pageName || "Page" });
}

function pushMcpPageFromPath(navKey){
  const file = (window.location.pathname || "").split("/").pop() || "index.html";

  if(["shop.html","category.html","pdp.html","merchandise.html","kids-wear.html","offer-zone.html","shop-by-model.html"].includes(file)){
    return;
  }
  if(file === "login.html" || file === "signup.html"){
    pushMcpLoginPage();
    return;
  }
  if(file === "contact.html"){
    pushMcpContactPage();
    return;
  }
  if(file === "thankyou.html"){
    try {
      const order = JSON.parse(localStorage.getItem("ag_last_order") || "null");
      pushMcpThankYouPage(order);
    } catch(e){
      pushMcpThankYouPage(null);
    }
    return;
  }
  if(file === "index.html"){
    pushMcpHome();
    return;
  }
  if(file === "wishlist.html"){
    pushMcp({ pageType: "Wishlist", pageName: "Wishlist" });
    return;
  }

  pushMcpDefault(document.title || file);
}

function pushMcpUserEvent(email, attrs){
  if(!email) return;
  window.dataLayer.push({
    MCP: {
      event: "user_identify",
      user: {
        identities: { emailAddress: email },
        attributes: attrs || {}
      }
    }
  });
}
