(function () {
  "use strict";
  const config = window.SAMBAL_CONFIG;
  const order = window.SambalOrder;
  const $ = (selector) => document.querySelector(selector);
  const money = order.rupiah;
  const escape = (value) =>
    String(value).replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  const products = [...config.products, config.bundle];
  const byId = Object.fromEntries(products.map((p) => [p.id, p]));
  const draft = Object.fromEntries(products.map((p) => [p.id, 1]));
  const storageKey = "sambal-uti-upi-cart-v1";
  const dialog = $("#cart-dialog");
  let cart = {};
  let toastTimeout;
  let previousFocus;
  const addLocks = new Set();
  try {
    cart = order.sanitizeCart(
      JSON.parse(localStorage.getItem(storageKey)),
      config,
    );
  } catch {
    /* Storage is optional. */
  }

  function quantityControls(id, quantity, context) {
    return `<div class="quantity" role="group" aria-label="Jumlah ${escape(byId[id].name)}"><button type="button" data-quantity="${id}" data-context="${context}" data-delta="-1" aria-label="Kurangi ${escape(byId[id].name)}" ${quantity <= 1 ? "disabled" : ""}>−</button><output aria-label="Jumlah ${escape(byId[id].name)}">${quantity}</output><button type="button" data-quantity="${id}" data-context="${context}" data-delta="1" aria-label="Tambah jumlah ${escape(byId[id].name)}" ${quantity >= 99 ? "disabled" : ""}>+</button></div>`;
  }
  function renderProducts() {
    $("#products").innerHTML = config.products
      .map(
        (p) =>
          `<article class="product-card"><div class="product-photo-wrap"><img class="product-photo" src="${escape(p.image)}" alt="Sambal ${escape(p.name)} Uti Upi dengan sajian sambalnya" width="720" height="720" loading="lazy"></div><div class="product-topline"><h3>${escape(p.name)}</h3><span class="weight">Berat bersih ${config.weightGrams}g</span></div><p class="product-description">${escape(p.description)}</p><strong class="product-price">${money(p.price)}</strong><div class="product-actions"><div id="draft-${p.id}">${quantityControls(p.id, draft[p.id], "catalog")}</div><button class="add-button" data-add="${p.id}" aria-label="Tambah ${escape(p.name)} ke keranjang"><span class="add-label">Tambah ke keranjang</span><span aria-hidden="true">+</span></button></div></article>`,
      )
      .join("");
  }
  function setStatusHidden() {
    $("#form-status").hidden = true;
  }
  function persist() {
    try {
      localStorage.setItem(storageKey, JSON.stringify(cart));
    } catch {
      /* Cart still works without storage. */
    }
    setStatusHidden();
    renderCart();
  }
  function renderCart() {
    const result = order.calculate(cart, config);
    $("#cart-count").textContent = result.bottles;
    $(".cart-trigger").setAttribute(
      "aria-label",
      `Buka keranjang, ${result.bottles} botol`,
    );
    $(".mobile-cart").hidden = !result.count;
    document.body.classList.toggle("has-cart-items", Boolean(result.count));
    $("#mobile-count").textContent = `(${result.bottles} botol)`;
    $("#mobile-total").textContent = money(result.total);
    $("#cart-empty").hidden = Boolean(result.count);
    $("#cart-filled").hidden = !result.count;
    $("#cart-items").innerHTML = result.lines
      .map(
        (p) =>
          `<article class="cart-item" data-cart-item="${p.id}"><img src="${escape(p.image)}" alt="" width="67" height="78"><div><div class="cart-item-heading"><h3>${escape(p.name)}</h3><strong class="cart-item-total">${money(p.subtotal)}</strong></div><p class="cart-unit">${money(p.price)} / ${
            p.id === config.bundle.id
              ? "paket · " +
                Object.entries(config.bundle.items)
                  .map(([id, n]) => `${n} ${escape(byId[id].name)}`)
                  .join(" + ")
              : "botol · " + config.weightGrams + "g"
          }</p><div class="cart-item-controls">${quantityControls(p.id, p.quantity, "cart")}<button class="remove-button" type="button" data-remove="${p.id}" aria-label="Hapus ${escape(p.name)} dari keranjang">Hapus</button></div></div></article>`,
      )
      .join("");
    $("#total-label").textContent = result.bundleOnly
      ? "Total"
      : "Harga sambal";
    $("#shipping-exclusion").hidden = result.bundleOnly;
    $("#cart-total").textContent = money(result.total);
    $("#shipping-note").textContent = order.shippingText(result);
    $("#cart-bottles").textContent =
      `${result.bottles} botol dalam pesananmu. Ketersediaan dikonfirmasi admin.`;
    $("#bundle-suggestion").hidden = !order.canUseBundle(cart, config);
    $("#bundle-suggestion-text").textContent =
      `Kamu sudah memilih isi ${config.bundle.name}. Ubah satu set menjadi paket ${money(config.bundle.price)} untuk mendapat gratis ongkir paket.`;
  }
  function notify(message) {
    const toast = $("#toast");
    clearTimeout(toastTimeout);
    toast.textContent = message;
    toast.classList.add("visible");
    toastTimeout = setTimeout(() => toast.classList.remove("visible"), 2600);
  }
  function add(id, amount) {
    if (addLocks.has(id)) return;
    addLocks.add(id);
    const addButton =
      id === config.bundle.id ? $("#add-bundle") : $(`[data-add="${id}"]`);
    const previousLabel = addButton.innerHTML;
    addButton.disabled = true;
    addButton.textContent = "Sudah ditambahkan";
    setTimeout(() => {
      addLocks.delete(id);
      addButton.disabled = false;
      addButton.innerHTML = previousLabel;
    }, 1200);
    const current = cart[id] || 0;
    const next = Math.min(99, current + amount);
    cart[id] = next;
    persist();
    notify(
      next === current
        ? "Maksimal 99 per item. Hubungi kami untuk pesanan lebih besar."
        : `${byId[id].name} ditambahkan ke keranjang.`,
    );
  }
  function openCart() {
    previousFocus = document.activeElement;
    if (!dialog.open) dialog.showModal();
    document.body.classList.add("cart-open");
    $("#close-cart").focus();
  }
  function closeCart() {
    dialog.close();
  }
  dialog.addEventListener("close", () => {
    document.body.classList.remove("cart-open");
    previousFocus?.focus();
  });
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) {
      const bounds = dialog.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right)
        closeCart();
    }
  });
  document.addEventListener("click", (event) => {
    const target = event.target.closest("button");
    if (!target) return;
    if (target.hasAttribute("data-open-cart")) openCart();
    if (target.dataset.add) add(target.dataset.add, draft[target.dataset.add]);
    if (target.dataset.quantity) {
      const { quantity: id, context, delta } = target.dataset;
      const current = context === "cart" ? cart[id] : draft[id];
      const next = Math.max(1, Math.min(99, current + Number(delta)));
      if (context === "cart") {
        cart[id] = next;
        persist();
      } else {
        draft[id] = next;
        $(`#draft-${id}`).innerHTML = quantityControls(id, next, "catalog");
      }
      const scope =
        context === "cart" ? $(`[data-cart-item="${id}"]`) : $(`#draft-${id}`);
      const sameButton = scope.querySelector(`[data-delta="${delta}"]`);
      (sameButton.disabled
        ? scope.querySelector(`[data-delta="${Number(delta) * -1}"]`)
        : sameButton
      ).focus();
    }
    if (target.dataset.remove) {
      const id = target.dataset.remove;
      delete cart[id];
      persist();
      ($("#cart-items button") || $("#browse-products")).focus();
      notify(`${byId[id].name} dihapus dari keranjang.`);
    }
  });
  $("#close-cart").addEventListener("click", closeCart);
  $("#browse-products").addEventListener("click", () => {
    closeCart();
    $("#produk").scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
  });
  $("#add-bundle").addEventListener("click", () =>
    add(config.bundle.id, draft[config.bundle.id]),
  );
  $("#use-bundle").addEventListener("click", () => {
    cart = order.useBundle(cart, config);
    persist();
    $("#cart-title").focus();
    notify(`Satu set diubah menjadi ${config.bundle.name}.`);
  });
  $("#checkout-form").addEventListener(
    "invalid",
    (event) => {
      if (event.target.validity.valueMissing)
        event.target.setCustomValidity("Mohon isi bagian ini.");
    },
    true,
  );
  $("#checkout-form").addEventListener("input", (event) => {
    event.target.setCustomValidity?.("");
    setStatusHidden();
  });
  $("#checkout-form").addEventListener("submit", (event) => {
    event.preventDefault();
    if (!order.calculate(cart, config).count) return;
    for (const input of [$("#customer-name"), $("#customer-address")]) {
      input.setCustomValidity(
        input.value.trim() ? "" : "Mohon isi bagian ini.",
      );
    }
    if (!event.target.reportValidity()) return;
    const customer = {
      name: $("#customer-name").value,
      address: $("#customer-address").value,
      note: $("#customer-note").value,
    };
    const url = order.whatsappUrl(cart, customer, config);
    $("#whatsapp-fallback").href = url;
    $("#form-status").hidden = false;
    window.open(url, "_blank", "noopener,noreferrer");
    $("#form-status").scrollIntoView({ block: "nearest", behavior: "instant" });
  });
  window.addEventListener("storage", (event) => {
    if (event.key === storageKey || event.key === null) {
      try {
        cart = order.sanitizeCart(JSON.parse(event.newValue), config);
      } catch {
        cart = {};
      }
      setStatusHidden();
      renderCart();
    }
  });
  $("#hero-weight").textContent =
    `Berat bersih ${config.weightGrams}g per botol`;
  $("#bundle-title").textContent = config.bundle.name;
  $("#bundle-detail").textContent =
    Object.entries(config.bundle.items)
      .map(([id, n]) => `${n} ${byId[id].name}`)
      .join(" + ") + ".";
  $("#bundle-price").textContent = money(config.bundle.price);
  $("#draft-bundle").id = `draft-${config.bundle.id}`;
  $(`#draft-${config.bundle.id}`).innerHTML = quantityControls(
    config.bundle.id,
    draft[config.bundle.id],
    "catalog",
  );
  const separatePrice = Object.entries(config.bundle.items).reduce(
    (total, [id, quantity]) => total + byId[id].price * quantity,
    0,
  );
  $("#bundle-benefit").textContent = config.bundle.freeShipping
    ? (separatePrice === config.bundle.price
        ? "Harga tiga varian tetap sama. "
        : "") + "Pilih paket untuk mendapatkan gratis ongkir."
    : "Tiga varian dalam satu paket praktis.";
  $("#bundle-shipping").textContent = config.bundle.freeShipping
    ? "GRATIS ONGKIR"
    : "ONGKIR DIKONFIRMASI ADMIN";
  $("#permit-number").textContent = "P-IRT " + config.permit;
  $("#batch-total").textContent = config.batch.total;
  $("#batch-breakdown").innerHTML = config.products
    .map(
      (p) =>
        `<div><strong>${p.batch}</strong><span>${escape(p.name)}</span></div>`,
    )
    .join("");
  $("#batch-note").textContent = config.batch.note;
  $("#producer-info").textContent = `${config.producer} · ${config.location}`;
  $("#instagram-link").textContent = config.instagram.handle + " ↗";
  $("#instagram-link").href = config.instagram.url;
  $("#contact-link").href = `https://wa.me/${config.whatsapp}`;
  $("#footer-whatsapp").href = `https://wa.me/${config.whatsapp}`;
  $("#footer-whatsapp").textContent = config.whatsappDisplay + " ↗";
  renderProducts();
  renderCart();
})();
