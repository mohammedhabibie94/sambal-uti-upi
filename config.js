/* Semua data produk, harga, dan informasi usaha diedit di sini. Harga dalam rupiah. */
window.SAMBAL_CONFIG = {
  brand: "Sambal Uti Upi",
  tagline: "Sambelnya sedep, pedesnya mantep.",
  whatsapp: "6285727045057",
  whatsappDisplay: "+62 857-2704-5057",
  instagram: {
    handle: "@sambalutiupi.id",
    url: "https://www.instagram.com/sambalutiupi.id/",
  },
  weightGrams: 80,
  permit: "6093310011187-30",
  producer: "Selmafood",
  location: "Manisrenggo, Klaten",
  batch: {
    total: 25,
    note: "Jumlah produksi per sekali masak, bukan stok langsung.",
  },
  products: [
    {
      id: "cumi",
      name: "Baby Cumi",
      price: 28000,
      image: "assets/baby-cumi.webp",
      batch: 12,
      description:
        "Sambal dan baby cumi. Teman nasi hangat yang bikin suapan berikutnya ditunggu.",
    },
    {
      id: "teri",
      name: "Teri Medan",
      price: 28000,
      image: "assets/teri-medan.webp",
      batch: 6,
      description:
        "Perpaduan sambal dan teri Medan untuk melengkapi menu makan sehari-hari.",
    },
    {
      id: "rebon",
      name: "Rebon",
      price: 23000,
      image: "assets/rebon.webp",
      batch: 7,
      description:
        "Sambal dengan udang rebon. Pas jadi teman lauk dan nasi favoritmu.",
    },
  ],
  bundle: {
    id: "paket",
    name: "Paket 3 Botol",
    price: 79000,
    freeShipping: true,
    items: { cumi: 1, teri: 1, rebon: 1 },
    image: "assets/hero.webp",
  },
};
