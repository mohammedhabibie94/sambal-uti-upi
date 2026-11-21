/* Perhitungan murni, dipakai oleh tampilan dan tes tanpa dependensi. */
(function (root) {
  "use strict";
  const rupiah = (value) => "Rp" + new Intl.NumberFormat("id-ID").format(value);
  const entries = (config) => [...config.products, config.bundle];
  function sanitizeCart(raw, config) {
    const cart = {};
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return cart;
    const allowed = new Set(entries(config).map((product) => product.id));
    for (const [id, quantity] of Object.entries(raw)) {
      if (!allowed.has(id)) continue;
      if (Number.isSafeInteger(quantity) && quantity > 0)
        cart[id] = Math.min(99, quantity);
    }
    return cart;
  }
  function calculate(raw, config) {
    const cart = sanitizeCart(raw, config);
    const byId = Object.fromEntries(entries(config).map((p) => [p.id, p]));
    const lines = Object.entries(cart).map(([id, quantity]) => ({
      ...byId[id],
      quantity,
      subtotal: byId[id].price * quantity,
    }));
    const bundleBottles = Object.values(config.bundle.items).reduce(
      (sum, n) => sum + n,
      0,
    );
    return {
      lines,
      total: lines.reduce((sum, line) => sum + line.subtotal, 0),
      count: lines.reduce((sum, line) => sum + line.quantity, 0),
      bottles: lines.reduce(
        (sum, line) =>
          sum +
          line.quantity * (line.id === config.bundle.id ? bundleBottles : 1),
        0,
      ),
      bundleOnly:
        lines.length === 1 &&
        lines[0].id === config.bundle.id &&
        config.bundle.freeShipping,
      hasBundle: Boolean(cart[config.bundle.id]) && config.bundle.freeShipping,
    };
  }
  function canUseBundle(raw, config) {
    const cart = sanitizeCart(raw, config);
    return (
      config.bundle.freeShipping &&
      (cart[config.bundle.id] || 0) < 99 &&
      Object.entries(config.bundle.items).every(
        ([id, quantity]) => (cart[id] || 0) >= quantity,
      )
    );
  }
  function useBundle(raw, config) {
    const cart = sanitizeCart(raw, config);
    if (!canUseBundle(cart, config)) return cart;
    for (const [id, quantity] of Object.entries(config.bundle.items)) {
      cart[id] -= quantity;
      if (!cart[id]) delete cart[id];
    }
    cart[config.bundle.id] = (cart[config.bundle.id] || 0) + 1;
    return cart;
  }
  function shippingText(order) {
    if (order.bundleOnly) return "Gratis ongkir";
    if (order.hasBundle)
      return "Gratis ongkir hanya untuk paket. Ongkir botol tambahan di luar paket, termasuk dalam satu kiriman, dikonfirmasi admin sebelum pesanan disetujui.";
    return "Ongkir dikonfirmasi admin melalui WhatsApp.";
  }
  function orderMessage(raw, customer, config) {
    const order = calculate(raw, config);
    if (!order.lines.length) throw new Error("Keranjang masih kosong.");
    const products = Object.fromEntries(config.products.map((p) => [p.id, p]));
    const lines = order.lines.map((line) => {
      const detail =
        line.id === config.bundle.id
          ? " (" +
            Object.entries(config.bundle.items)
              .map(([id, n]) => `${n} ${products[id].name}`)
              .join(", ") +
            ")"
          : ` (${config.weightGrams}g)`;
      return `• ${line.name}${detail}\n  ${line.quantity} × ${rupiah(line.price)} = ${rupiah(line.subtotal)}`;
    });
    const label = order.bundleOnly ? "Total" : "Subtotal produk";
    return [
      `Halo ${config.brand}, saya ingin pesan:`,
      "",
      ...lines,
      "",
      `Jumlah: ${order.bottles} botol`,
      `${label}: ${rupiah(order.total)}`,
      `Pengiriman: ${shippingText(order)}`,
      "",
      `Nama: ${customer.name.trim()}`,
      `Alamat lengkap: ${customer.address.trim()}`,
      ...(customer.note.trim() ? [`Catatan: ${customer.note.trim()}`] : []),
      "",
      "Mohon konfirmasi ketersediaan dan detail pembayaran. Terima kasih!",
    ].join("\n");
  }
  function whatsappUrl(raw, customer, config) {
    return `https://wa.me/${config.whatsapp}?text=${encodeURIComponent(orderMessage(raw, customer, config))}`;
  }
  const api = {
    rupiah,
    sanitizeCart,
    calculate,
    canUseBundle,
    useBundle,
    shippingText,
    orderMessage,
    whatsappUrl,
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.SambalOrder = api;
})(typeof window !== "undefined" ? window : globalThis);
