# CTMS – Corporate Training Management System

Website pelatihan untuk **perusahaan, sekolah, dan kampus** (Vite + React + TypeScript + Tailwind + Recharts + Lucide).
Static website tanpa backend: semua data disimpan di **database lokal browser (IndexedDB)**. Tidak ada akun demo.

## Jalankan
```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # hasil di dist/
```

## Pertama kali dipakai
1. Buka **Register** → akun pertama otomatis menjadi **Administrator** (hanya sekali; setelah itu role Admin tidak bisa dipilih lagi).
2. **Organization** mendaftar dengan nama organisasi, lalu membuat **kode undangan**.
3. **User** mendaftar lalu bergabung dengan memasukkan kode dari organisasinya.

Role: `admin`, `organization` (perusahaan/sekolah/kampus), `user` (karyawan/siswa/mahasiswa).

## Kode undangan
- Satu organisasi hanya punya **satu kode aktif**.
- Untuk membuat kode baru, kode lama harus **dicabut (revoke)** dulu. Pemberitahuan tampil saat dibuat/dicabut/ditolak.
- Anggota yang sudah bergabung tidak terpengaruh saat kode dicabut.

## Paket Free / Premium / Pro (DEMO)
Halaman **Billing & Plans** (role Organization) menampilkan 3 paket dengan **simulasi pembayaran** (Virtual Account, QRIS, E-Wallet → konfirmasi → faktur). **Tidak ada uang sungguhan dan tidak ada data kartu/rekening yang diminta.**

| | Free | Premium | Pro |
|---|---|---|---|
| User / Training / Storage | 25 / 3 / 100 MB | 250 / 25 / 5 GB | tanpa batas / tanpa batas / 50 GB |
| Sertifikat (cetak/PDF) | – | ✓ | ✓ + penandatangan & logo kustom |
| Ekspor CSV laporan | – | ✓ | ✓ |
| Analitik + Audit log | – | – | ✓ |

Batas dijalankan di UI: tambah user/training, join dengan kode, kuota upload. Masa berlaku paket diperiksa otomatis (kembali ke Free bila habis).
**Catatan:** karena tidak ada server, status paket tersimpan di database lokal dan bisa diubah lewat DevTools. Untuk produksi, pengecekan paket dan pembayaran (mis. Midtrans/Xendit) harus di server.

## Keamanan (yang diterapkan)
- Kata sandi di-hash **PBKDF2-SHA256, 600.000 iterasi + salt acak**; tidak pernah disimpan sebagai teks biasa.
- Kebijakan kata sandi: min. 8 karakter, ada huruf dan angka. Akun yang dibuat organisasi memakai kata sandi sementara dan **wajib diganti** saat login pertama.
- **Rate limiting**: 5 percobaan gagal (login atau kode undangan) → terkunci 5 menit. Pesan error generik (tidak membocorkan apakah email terdaftar).
- Sesi berakhir setelah **30 menit tidak aktif** atau 12 jam; logout tersinkron antar tab.
- Kode undangan dibuat dengan `crypto.getRandomValues` (8 karakter acak); ID memakai CSPRNG.
- **Content-Security-Policy** (meta, build produksi), proteksi clickjacking (app menolak di-embed), `rel=noopener`, `referrerPolicy`, iframe YouTube di-sandbox.
- Link materi hanya `http/https` (menolak `javascript:`), unggahan dibatasi jenis file aman (SVG/HTML ditolak), gambar logo di-resize lewat canvas.
- React meng-escape semua output; tidak ada `dangerouslySetInnerHTML`.

### Batasan yang jujur
Tanpa server, keamanan **sepenuhnya di sisi browser**. Orang yang menguasai browser/perangkat (DevTools) tetap dapat membaca atau mengubah database lokal. Data tidak dibagikan antar perangkat dan hilang jika data browser dihapus. Untuk penggunaan nyata multi-perangkat (autentikasi server, penyimpanan file bersama, backup), tahap berikutnya perlu backend (mis. Supabase / Firebase / API sendiri).
Admin bisa menghapus semua data lewat **Settings → Erase all local data**.

## Deploy ke GitHub Pages
1. Push ke repository GitHub, branch `main`.
2. **Settings → Pages → Source: GitHub Actions**.
3. Workflow `.github/workflows/deploy.yml` akan build & deploy otomatis (base path diisi dari nama repo).
4. Build lokal dengan base path: salin `.env.example` ke `.env`.

Routing memakai `HashRouter` (`/#/user/trainings`) agar refresh tidak 404 di GitHub Pages.
