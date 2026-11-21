/* Perhitungan murni, dipakai oleh tampilan dan tes tanpa dependensi. */
(function (root) {
  "use strict";
  const rupiah = (value) => "Rp" + new Intl.NumberFormat("id-ID").format(value);
  const entries = (config) => [...config.products, config.bundle];
  function sanitizeCart(raw, config) {
    const cart = {};
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return cart;
    for (const product of entries(config)) {
      const quantity = raw[product.id];
      if (Number.isSafeInteger(quantity) && quantity > 0)
        cart[product.id] = Math.min(99, quantity);
    }
    return cart;
  }
  function calculate(raw, config) {
    const cart = sanitizeCart(raw, config);
    const lines = entries(config)
      .filter((p) => cart[p.id])
      .map((p) => ({
        ...p,
        quantity: cart[p.id],
        subtotal: p.price * cart[p.id],
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
  function shippingText(order) {
    if (order.bundleOnly) return "Gratis ongkir";
    if (order.hasBundle)
      return "Gratis ongkir untuk paket. Ongkir produk satuan dikonfirmasi admin.";
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
    shippingText,
    orderMessage,
    whatsappUrl,
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.SambalOrder = api;
})(typeof window !== "undefined" ? window : globalThis);
