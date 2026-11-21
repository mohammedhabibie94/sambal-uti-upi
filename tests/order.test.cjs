const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");
const order = require("../order.js");
const context = { window: {} };
vm.runInNewContext(
  fs.readFileSync(path.join(__dirname, "../config.js"), "utf8"),
  context,
);
const config = JSON.parse(JSON.stringify(context.window.SAMBAL_CONFIG));
const customer = {
  name: "  Pelanggan Uji  ",
  address: "Jl. Contoh No. 1\nKlaten & sekitarnya",
  note: "Tanpa sendok & titip di depan",
};

test("data produk sesuai permintaan pemilik dan jumlah batch konsisten", () => {
  assert.deepEqual(
    config.products.map((p) => [p.name, p.price, p.batch]),
    [
      ["Baby Cumi", 28000, 12],
      ["Teri Medan", 28000, 6],
      ["Rebon", 23000, 7],
    ],
  );
  assert.equal(config.weightGrams, 80);
  assert.equal(config.permit, "6093310011187-30");
  assert.equal(
    config.batch.total,
    config.products.reduce((n, p) => n + p.batch, 0),
  );
});
test("keranjang kosong tidak dapat dibuat menjadi pesanan", () => {
  assert.deepEqual(order.calculate({}, config).lines, []);
  assert.equal(order.calculate({}, config).total, 0);
  assert.throws(() => order.whatsappUrl({}, customer, config), /kosong/);
});
test("kuantitas dan subtotal campuran dihitung benar tanpa ongkir fiktif", () => {
  const result = order.calculate({ cumi: 2, teri: 1, rebon: 3 }, config);
  assert.equal(result.total, 153000);
  assert.equal(result.count, 6);
  assert.equal(result.bottles, 6);
  assert.equal(result.bundleOnly, false);
  assert.match(order.shippingText(result), /dikonfirmasi admin/);
  assert.doesNotMatch(order.shippingText(result), /Gratis/);
});
test("paket berisi tiga botol dan mendapat gratis ongkir", () => {
  const result = order.calculate({ paket: 2 }, config);
  assert.equal(result.total, 158000);
  assert.equal(result.count, 2);
  assert.equal(result.bottles, 6);
  assert.equal(result.bundleOnly, true);
  assert.equal(order.shippingText(result), "Gratis ongkir");
  const message = order.orderMessage({ paket: 1 }, customer, config);
  assert.match(message, /Paket 3 Botol \(1 Baby Cumi, 1 Teri Medan, 1 Rebon\)/);
  assert.match(message, /Total: Rp79.000/);
});
test("tiga botol satuan tidak otomatis dianggap paket promo", () => {
  const result = order.calculate({ cumi: 1, teri: 1, rebon: 1 }, config);
  assert.equal(result.total, 79000);
  assert.equal(result.hasBundle, false);
  assert.doesNotMatch(order.shippingText(result), /Gratis/);
});
test("pesanan paket ditambah satuan tidak menjanjikan ongkir seluruh pesanan", () => {
  const result = order.calculate({ paket: 1, cumi: 1 }, config);
  assert.equal(result.total, 107000);
  assert.equal(result.bottles, 4);
  assert.equal(result.bundleOnly, false);
  assert.equal(result.hasBundle, true);
  assert.match(order.shippingText(result), /produk satuan dikonfirmasi/);
});
test("data tersimpan yang rusak atau dimanipulasi disaring", () => {
  for (const input of [null, false, 12, "cumi", []])
    assert.deepEqual(order.sanitizeCart(input, config), {});
  assert.deepEqual(
    order.sanitizeCart(
      { cumi: -1, teri: 1.5, rebon: "4", paket: 999, unknown: 2 },
      config,
    ),
    { paket: 99 },
  );
  assert.deepEqual(
    order.sanitizeCart({ cumi: Infinity, rebon: NaN }, config),
    {},
  );
});
test("tautan WhatsApp membawa rincian, penerima, alamat multiline, dan karakter khusus", () => {
  const url = new URL(
    order.whatsappUrl({ cumi: 2, rebon: 1 }, customer, config),
  );
  assert.equal(url.origin, "https://wa.me");
  assert.equal(url.pathname, "/6285727045057");
  const message = url.searchParams.get("text");
  assert.match(message, /Baby Cumi \(80g\)\n  2 × Rp28.000 = Rp56.000/);
  assert.match(message, /Subtotal produk: Rp79.000/);
  assert.match(message, /Nama: Pelanggan Uji\n/);
  assert.ok(message.includes(customer.address));
  assert.ok(message.includes(customer.note));
  assert.match(message, /ketersediaan dan detail pembayaran/);
  assert.equal(url.searchParams.size, 1);
});
test("harga tampilan mengikuti konfigurasi, bukan nilai hardcode pada logika", () => {
  const edited = structuredClone(config);
  edited.products[0].price = 31000;
  assert.equal(order.calculate({ cumi: 2 }, edited).total, 62000);
  assert.match(order.orderMessage({ cumi: 2 }, customer, edited), /Rp62.000/);
});
