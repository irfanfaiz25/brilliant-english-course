# Alur Pendaftaran Mitra BEC

Panduan ini menjelaskan perjalanan seorang calon mitra, mulai dari mengisi formulir di website
sampai unitnya buka. Bahasanya sengaja dibuat sederhana untuk tim BEC yang tidak berlatar teknis.

> Berlaku untuk sistem saat ini. Notifikasi otomatis (email/WhatsApp) dan portal khusus mitra
> belum tersedia; keduanya dijadwalkan di tahap berikutnya.

## Istilah yang dipakai

| Istilah             | Artinya                                                                                              |
| ------------------- | ---------------------------------------------------------------------------------------------------- |
| **Calon mitra**     | Orang yang mendaftar lewat formulir di halaman Kemitraan.                                            |
| **Mitra**           | Calon mitra yang sudah resmi dan punya unit.                                                         |
| **Unit**            | Tempat kursus milik mitra yang nantinya tampil di website.                                           |
| **Kuota desa**      | Jumlah maksimal unit dalam satu desa/kelurahan (saat ini 2 unit, bisa diubah di menu Kuota Wilayah). |
| **Slot**            | Satu "kursi" dari kuota desa. Desa dengan kuota 2 punya 2 slot.                                      |
| **Pesan slot**      | Menahan satu slot untuk seseorang supaya tidak diambil pendaftar lain.                               |
| **Petugas**         | Staf BEC yang ditugaskan mengurus satu calon mitra.                                                  |
| **Nomor referensi** | Kode unik setiap pendaftaran, misalnya `MTR-261116-7K2Q`, untuk memudahkan pencarian.                |

## Siapa melakukan apa

| Peran                   | Yang bisa dilakukan                                                                                    |
| ----------------------- | ------------------------------------------------------------------------------------------------------ |
| **Calon mitra**         | Mengecek kuota desa dan mengisi formulir. Setelah itu menunggu dihubungi tim BEC.                      |
| **Super admin & Admin** | Melihat dan mengurus calon mitra, mengubah status, menunjuk petugas, membuat unit, dan mengatur kuota. |
| **Editor**              | Tidak bisa melihat data calon mitra (khusus mengurus konten website).                                  |
| **Mitra**               | Belum punya akses. Portal mitra menyusul di tahap berikutnya.                                          |

## Bagian 1 — Dari sisi calon mitra

1. Calon mitra membuka halaman **Kemitraan** di website dan memilih desanya untuk melihat sisa kuota.
2. Ia mengisi formulir: nama, nomor WhatsApp, email (boleh kosong), latar belakang, kesiapan tempat,
   motivasi, dan desa.
3. Sistem memeriksa formulir sebelum menyimpannya:
   - Kalau ada isian yang salah, calon mitra diminta memperbaikinya.
   - Kalau **kuota desanya sudah penuh**, pendaftaran tidak bisa dikirim.
   - Pengiriman berulang-ulang dalam waktu singkat ditahan, untuk mencegah spam.
4. Kalau berhasil, calon mitra mendapat **nomor referensi** dan tombol untuk langsung chat WhatsApp
   ke kantor pusat. Pesannya sudah terisi otomatis.
5. Pendaftarannya muncul di menu **Calon Mitra** di dashboard dengan status **Baru**.

## Bagian 2 — Dari sisi admin: status pendaftaran

Setiap pendaftaran punya satu status yang menunjukkan sudah sampai mana prosesnya.

| Status         | Artinya                                             | Pengaruh ke kuota desa                       |
| -------------- | --------------------------------------------------- | -------------------------------------------- |
| **Baru**       | Baru masuk, belum ada yang menghubungi.             | Belum memakai slot.                          |
| **Dihubungi**  | Staf sudah menghubungi lewat WhatsApp atau telepon. | Belum memakai slot.                          |
| **Survei**     | Lolos tahap awal, sedang disurvei atau dinilai.     | Belum memakai slot.                          |
| **Persiapan**  | Disetujui dan sedang menyiapkan unit.               | **Satu slot dipesan** untuk calon mitra ini. |
| **Jadi mitra** | Unit sudah dibuat dari pendaftaran ini.             | Slot berpindah ke unitnya.                   |
| **Ditolak**    | BEC memutuskan tidak melanjutkan.                   | Slot dilepas, kalau sebelumnya dipesan.      |
| **Batal**      | Calon mitra mundur atau tidak bisa dihubungi lagi.  | Slot dilepas, kalau sebelumnya dipesan.      |

### Kapan status berubah, dan siapa yang mengubah

- **Baru** dipasang **otomatis oleh sistem** saat formulir dikirim.
- **Dihubungi, Survei, Persiapan, Ditolak, dan Batal** dipilih **oleh Admin atau Super admin** di kotak
  **Kelola**, pada halaman detail calon mitra.
- **Jadi mitra** tidak dipilih manual. Status ini terpasang **otomatis** saat admin menekan
  **"Buat unit dari calon mitra ini"** lalu menyimpan unitnya.
- Urutan status **tidak dikunci**. Admin boleh melompati atau mundur satu tahap, misalnya untuk
  membetulkan salah pilih.
- Status **Persiapan** tidak bisa dipilih kalau kuota desanya sudah penuh.
- Setiap perubahan tercatat di bagian **Catatan & riwayat**: siapa yang mengubah, kapan, dari status
  apa ke status apa, dan catatannya.

## Bagian 3 — Menugaskan ke petugas

Di kotak **Kelola** ada pilihan **Petugas**. Isinya akun staf aktif yang boleh mengurus calon mitra
(Admin dan Super admin).

**Petugas artinya penanggung jawab tindak lanjut**: staf yang harus menghubungi dan mengawal calon
mitra itu sampai selesai. Petugas **bukan** pemilik unit, dan penugasan **tidak** membatasi siapa
yang boleh melihat data.

Gunanya:

- Daftar **"Ditugaskan ke saya"** di menu Calon Mitra hanya menampilkan pendaftaran milik petugas itu.
- Kartu **"Perlu tindakan"** di Ringkasan menghitung pendaftaran yang masih berjalan dan ditugaskan
  ke kamu.
- Ringkasan juga menandai pendaftaran **Baru** yang belum dihubungi lebih dari 2 hari.
- Pergantian petugas ikut tercatat di riwayat.
- Nanti, saat notifikasi tersedia, petugas akan mendapat pemberitahuan.

Status, petugas, dan catatan disimpan bersamaan dengan satu tombol **Simpan**.

## Bagian 4 — Contoh alur lengkap

**Bu Rina, Desa Sukamaju (kuota 2 unit, satu sudah terisi)**

1. **Senin 09.00**: Bu Rina mengirim formulir dan mendapat nomor referensi `MTR-261116-7K2Q`. Statusnya
   **Baru**, belum ada petugas.
2. **Rabu**: Bu Rina belum juga dihubungi. Lewat dari 2 hari, Ringkasan menandainya sebagai
   "Baru, belum dihubungi".
3. **Rabu siang**: Admin Andi membuka pendaftarannya. Ia mengubah status ke **Dihubungi**, memilih
   petugas **Andi**, dan menulis catatan "Sudah telepon, minat tinggi". Riwayat mencatat:
   _Andi: Baru → Dihubungi, ditugaskan ke Andi_.
4. **Minggu depan**: Andi menyurvei lokasi lalu mengubah status ke **Survei**.
5. **Setelah lolos survei**, Andi memilih **Persiapan**. Sistem memesan **satu slot di Sukamaju**
   untuk Bu Rina. Kuota Sukamaju sekarang penuh (1 unit + 1 pesanan). Kalau Pak Budi mencoba
   mendaftar untuk Sukamaju, formulirnya menolak karena kuota penuh.
6. **Tempat Bu Rina siap**: Andi menekan **"Buat unit dari calon mitra ini"**. Formulir unit sudah
   terisi data Bu Rina; Andi melengkapi sisanya dan menyimpannya dengan status unit **Persiapan**.
   Dalam satu langkah:
   - unit Bu Rina dibuat;
   - pendaftarannya menjadi **Jadi mitra** dan terhubung ke unitnya;
   - **slot Sukamaju tetap dipegang**, sekarang atas nama unit Bu Rina. Di menu Kuota Wilayah
     tertulis "Unit … (persiapan)".
7. **Unit siap buka**: Andi mengubah status unit menjadi **Aktif**. Unit tampil di website, dan slot
   pesanan berubah menjadi slot milik unit itu sendiri. Kuota Sukamaju tetap penuh, tanpa celah.

**Contoh lain:**

- **Bu Rina mundur saat Persiapan.** Andi mengubah status ke **Batal**. Slot Sukamaju terbuka lagi
  untuk pendaftar lain.
- **Unit Bu Rina batal dibuka** (sudah dibuat, masih Persiapan). Andi mengubah status unit ke
  **Nonaktif** atau menghapus unitnya. Slotnya ikut dilepas.
- **Pendaftaran spam atau ganda.** Admin menghapusnya dari daftar. Slot yang dipesan ikut dilepas,
  dan penghapusan tetap tercatat.

## Bagian 5 — Status unit (setelah jadi mitra)

| Status unit   | Tampil di website | Memakai kuota desa                                              |
| ------------- | ----------------- | --------------------------------------------------------------- |
| **Persiapan** | Tidak             | Hanya unit yang dibuat dari calon mitra: slotnya tetap dipesan. |
| **Aktif**     | Ya                | Ya, satu slot.                                                  |
| **Nonaktif**  | Tidak             | Tidak. Slotnya kembali tersedia.                                |

- Status unit diubah oleh Admin atau Super admin di menu **Unit Mitra**.
- Unit yang ditambahkan langsung dari menu Unit Mitra (bukan dari calon mitra) dengan status
  Persiapan **tidak** memesan slot. Pesan slot manual di Kuota Wilayah kalau perlu.
- Akun login untuk mitra dibuat Super admin di menu **Pengguna** dengan peran Mitra yang terhubung
  ke unitnya. Akun ini baru berguna setelah portal mitra tersedia.

## Ringkasan singkat

```
Calon mitra isi formulir ──► Baru ──► Dihubungi ──► Survei ──► Persiapan ──► Jadi mitra
   (otomatis)                 (semua langkah ini dipilih admin)     │            (otomatis saat
                                                                    │             unit dibuat)
                                                     slot desa dipesan ──► tetap dipegang unit
                                                                            sampai unit Aktif
Keluar kapan saja: Ditolak / Batal  →  slot yang dipesan dilepas
```
