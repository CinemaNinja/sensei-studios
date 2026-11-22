(function () {
  const shop = window.COVET_SHOP || { domain: "", storefrontToken: "" };
  const key = "covet-bag";
  const drawer = document.getElementById("bag-drawer");
  const lines = document.getElementById("bag-lines");
  const count = document.getElementById("bag-count");
  const total = document.getElementById("bag-total");
  const note = document.getElementById("bag-note");
  const checkout = document.getElementById("bag-checkout");
  if (!drawer || !lines) return;

  function money(value) {
    const amount = Number(value);
    if (!amount) return "";
    return amount.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
  }

  function load() {
    try {
      return JSON.parse(localStorage.getItem(key)) || [];
    } catch (err) {
      return [];
    }
  }

  function save(items) {
    localStorage.setItem(key, JSON.stringify(items));
  }

  function live() {
    return Boolean(shop.domain && shop.storefrontToken);
  }

  function render() {
    const items = load();
    const pieces = items.reduce((sum, item) => sum + item.qty, 0);
    count.textContent = String(pieces);
    count.hidden = pieces === 0;
    lines.replaceChildren();
    items.forEach((item) => {
      const row = document.createElement("li");
      const photo = document.createElement("img");
      photo.src = item.image;
      photo.alt = "";
      const copy = document.createElement("div");
      const name = document.createElement("p");
      name.className = "bag-name";
      name.textContent = item.name;
      const meta = document.createElement("p");
      meta.className = "bag-meta";
      meta.textContent = (item.made ? "Made to order · " : "") + money(item.price) + " · " + item.qty;
      copy.append(name, meta);
      const remove = document.createElement("button");
      remove.type = "button";
      remove.textContent = "Remove";
      remove.addEventListener("click", () => {
        save(load().filter((line) => line.id !== item.id));
        render();
      });
      row.append(photo, copy, remove);
      lines.appendChild(row);
    });
    const sum = items.reduce((all, item) => all + Number(item.price || 0) * item.qty, 0);
    total.textContent = items.length ? money(sum) : "The bag is empty.";
    if (live()) {
      note.textContent = "Checkout will open Shopify’s secure payment page.";
    } else {
      note.textContent = "Add the Storefront token and shop domain in shop-config.js to turn on checkout.";
    }
  }

  function open() {
    drawer.hidden = false;
    render();
  }

  function add(item) {
    const items = load();
    const found = items.find((line) => line.id === item.id);
    if (found) found.qty += 1;
    else items.push({
      id: item.id,
      name: item.name,
      price: item.price,
      image: item.image,
      made: item.made,
      qty: 1
    });
    save(items);
    open();
  }

  document.getElementById("bag").addEventListener("click", open);
  document.getElementById("bag-close").addEventListener("click", () => { drawer.hidden = true; });

  const buy = document.getElementById("shop-buy");
  if (buy) {
    buy.addEventListener("click", () => {
      if (!buy.dataset.name) return;
      add({
        id: buy.dataset.handle || buy.dataset.name,
        name: buy.dataset.name,
        price: buy.dataset.price,
        image: buy.dataset.image,
        made: buy.dataset.made === "true"
      });
      const popup = document.getElementById("shop");
      if (popup && popup.open) popup.close();
    });
  }

  checkout.addEventListener("click", () => {
    if (!load().length) return;
    if (!live()) {
      note.textContent = "Checkout is waiting on shop-config.js: set domain and storefrontToken.";
      return;
    }
    note.textContent = "Storefront cart checkout is ready to connect for " + shop.domain + ".";
  });

  render();
  window.covetCart = { add: add, open: open };
})();
