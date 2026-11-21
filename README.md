# Sambal Uti Upi

Situs pemesanan **statis**, berbahasa Indonesia, tanpa backend, database, akun pelanggan, atau payment gateway. Berjalan langsung di shared hosting; tidak perlu Node.js di cPanel.

## Mengubah harga atau produk

**Edit hanya `config.js`.** Semua harga, produk, foto, berat, isi paket, nomor WhatsApp, Instagram, izin P-IRT, dan informasi produksi ada di sana.

Contoh: untuk mengubah harga Baby Cumi, cari produk dengan `id: 'cumi'`, lalu ubah angka `price` (rupiah bulat, tanpa titik atau `Rp`). Harga katalog, keranjang, dan pesan WhatsApp otomatis mengikuti. Harga paket terpisah di `bundle.price`; tidak otomatis mengikuti jumlah harga satuan. Jangan mengubah harga, berat, atau izin tanpa persetujuan pemilik.

- `products`: tiga varian, masing-masing memiliki `id`, `name`, `price`, `image`, `batch`, dan `description`.
- `weightGrams`: berat bersih setiap botol.
- `bundle.items`: jumlah masing-masing varian dalam satu paket. ID mengacu pada `products`.
- `bundle.freeShipping`: gratis ongkir khusus paket; produk satuan tidak otomatis mendapat promo.
- `batch`: informasi produksi, **bukan** stok real-time atau batas pemesanan.

Pertahankan ID yang ada agar keranjang tersimpan tetap cocok. Setelah menyimpan perubahan, muat ulang halaman dan periksa katalog, total keranjang, serta isi pesan WhatsApp.

## Menjalankan lokal

Dari folder proyek:

```sh
python3 -m http.server 8000
```

Buka `http://localhost:8000`. Tidak ada proses build atau dependensi runtime. Font dan gambar WebP dilayani dari folder `assets`, tanpa Google Fonts atau CDN.

## Deploy ke cPanel / public_html

1. Cadangkan situs lama dan catat document root domain di menu **Domains**. Untuk domain utama biasanya `public_html`; addon domain mungkin memakai folder berbeda.
2. Buat ZIP berisi **`index.html`, `styles.css`, `config.js`, `order.js`, `app.js`, dan folder `assets/`**. File-file itu harus di akar ZIP, bukan di dalam satu folder proyek tambahan. Jangan sertakan `.git`, `tests`, atau `node_modules`.
3. Di **cPanel → File Manager**, buka document root domain. Upload ZIP, lalu pilih **Extract**. Pastikan `index.html` langsung berada di `public_html` (atau document root domain), dan `assets/` ada di sebelahnya.
4. Hapus atau pindahkan file indeks lama yang berbenturan, seperti `index.php`, **setelah membuat cadangan**. Jangan menghapus file hosting lain, folder `.well-known`, atau konfigurasi domain secara sembarang.
5. Pastikan SSL aktif. Buka domain menggunakan HTTPS, lalu lakukan hard refresh atau hapus cache hosting/CDN jika tampilan masih lama. Hapus ZIP setelah ekstraksi.
6. Cek di ponsel: pilih produk, ubah jumlah, tambahkan paket, buka keranjang, isi penerima, dan tekan **Lanjut ke WhatsApp**. Periksa nomor tujuan dan pesan sebelum mengirim; tidak ada pesanan yang dikirim otomatis.

Tidak memerlukan PHP, database, konfigurasi routing SPA, atau environment variable. Path relatif juga mendukung pemasangan di subfolder.

## Cara kerja pemesanan

- Pelanggan bisa mengatur jumlah sebelum menambah dan di dalam keranjang, serta menghapus item.
- Angka keranjang menghitung **botol**, termasuk tiga botol di setiap paket. Urutan item mengikuti saat pertama ditambahkan.
- Jika isi tiga varian lengkap sudah ada sebagai satuan, keranjang menawarkan tombol mengubah **satu set** menjadi paket agar pelanggan dapat memilih promo gratis ongkir. Tidak ada konversi otomatis.
- Harga dihitung di browser. Keranjang tersimpan di `localStorage` perangkat; jika penyimpanan tidak tersedia, keranjang tetap bekerja selama halaman terbuka.
- Jumlah maksimal per item 99 untuk menjaga pesan tetap praktis; bukan klaim stok. Pesanan lebih besar dapat ditanyakan langsung ke admin.
- Paket memiliki isi dan harga sendiri. Gratis ongkir hanya untuk paket; ongkir botol tambahan, meski dalam satu kiriman, dikonfirmasi admin di WhatsApp sebelum pembayaran. Tidak ada ongkir rekaan atau diskon otomatis.
- Nama dan alamat wajib; catatan opsional. Data penerima tidak disimpan di browser oleh situs dan hanya masuk ke pesan WhatsApp saat pelanggan melanjutkan.
- Tombol checkout membuka `wa.me` dengan pesan terformat. Pelanggan tetap harus menekan **Kirim** di WhatsApp. Ketersediaan dan pembayaran dikonfirmasi admin.
- Jika tab WhatsApp diblokir browser, gunakan tautan **Buka WhatsApp lagi** yang muncul di keranjang.
- Situs tidak mencatat, menerima, atau memproses pembayaran dan tidak melacak stok.

## Pemeriksaan pengembang

Dengan Node.js 22 atau lebih baru (hanya untuk pengembangan):

```sh
npm run check
npm test
```

Tes mencakup data resmi, total campuran, isi paket, aturan ongkir, keranjang rusak, perubahan harga konfigurasi, dan encoding pesan WhatsApp. Pemeriksaan antarmuka tetap diperlukan sebelum menerbitkan perubahan besar.

## Aset

Foto produk, hero, logo, dan font Roca diambil dari situs Sambal Uti Upi yang sudah ada (`https://sambalutiupi.web.id/assets/`). Foto dan logo dioptimalkan menjadi WebP untuk mengurangi ukuran transfer. Foto tidak diganti dengan gambar stok. Teks placeholder situs lama dihapus; angka pada teks situs mengikuti data pemilik, bukan informasi lama yang tidak konsisten.
