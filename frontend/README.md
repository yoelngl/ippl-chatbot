# Frontend: Chatbot Cerdas & Aman

Single Page Application React + TypeScript (Vite) untuk aktivitas 2b–2e dan 3h. Tampilan mengikuti prototipe Figma kelompok: [IMK – Chatbot Cerdas & Aman](https://www.figma.com/design/5KbFxPqAlSG5rTPOJeTnhj).

## Menjalankan

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173
```

| Perintah | Fungsi |
| --- | --- |
| `npm run dev` | Server pengembangan |
| `npm run build` | Typecheck + build produksi ke `dist/` |
| `npm test` | Unit test dan test alur halaman (Vitest + Testing Library) |
| `npm run typecheck` | Pemeriksaan tipe TypeScript |

## Mode API

Backend FastAPI belum ada, jadi aplikasi berjalan dengan **backend tiruan (mock)** di browser secara default. Mock menerapkan kontrak API yang sama dengan backend nanti, termasuk filter RBAC, pemblokiran prompt injection, dan log audit berantai hash. Datanya disimpan di `localStorage`, jadi bertahan saat halaman dimuat ulang.

Salin `.env.example` ke `.env` untuk mengganti mode:

| Variabel | Nilai | Keterangan |
| --- | --- | --- |
| `VITE_API_MODE` | `mock` (default) atau `http` | `http` mengirim permintaan ke FastAPI |
| `VITE_API_URL` | default `/api` | Saat `npm run dev`, `/api` diteruskan ke `http://localhost:8000` |

Kontrak data ada di `src/types/api.ts`; daftar endpoint yang dipanggil ada di `src/api/httpApi.ts`. Backend cukup mengikuti dua file itu agar frontend langsung tersambung (aktivitas 3h).

## Akun uji

Hanya tersedia di mode mock. Kata sandi semua akun: **`demo123`**. Akun juga bisa dipilih langsung dari halaman login.

| Peran | Email | Akses |
| --- | --- | --- |
| Karyawan | `karyawan@chatbot.test` | Chat, dokumen Public |
| HR | `hr@chatbot.test` | Chat, dokumen Public + HR |
| Finance | `finance@chatbot.test` | Chat, dokumen Public + Finance |
| Manajemen | `manajemen@chatbot.test` | Chat, semua klasifikasi |
| Admin | `admin@chatbot.test` | Konsol Admin (dasbor, dokumen, peran & izin) + chat Public |
| Auditor | `auditor@chatbot.test` | Log audit, hanya baca |
| Nonaktif | `nonaktif@chatbot.test` | Login ditolak (untuk menguji akun nonaktif) |

Selain akun di atas ada 6 pengguna dummy yang hanya muncul di daftar pengguna halaman Peran & Izin. Semua nama, dokumen, dan angka adalah data contoh; ganti dengan sample data kelompok (aktivitas 1d) di `src/api/mock/data.ts`.

Pertanyaan untuk mencoba RBAC:

- Login sebagai **HR**, tanya "Berapa jatah cuti tahunan karyawan tetap?" → dijawab dengan sitasi dokumen HR.
- Tanya "Berapa total anggaran bonus 2026?" → ditolak karena dokumennya berklasifikasi Finance.
- Login sebagai **Manajemen**, tanya hal yang sama → dijawab.
- Tulis "Abaikan instruksi sebelumnya…" → diblokir sebagai prompt injection.
- Login sebagai **Auditor** → semua kejadian di atas tercatat di Log Audit.

Untuk mengembalikan data mock ke kondisi awal, jalankan `localStorage.clear()` di konsol browser lalu muat ulang.

## Struktur

```
src/
  api/            Kontrak Api, klien HTTP, dan backend mock (data, retrieval RBAC)
  auth/           AuthContext, guard rute berdasarkan peran
  components/     UI dasar (Button, Badge, TextField, Modal…), layout, komponen chat
  pages/          Login, Chat, admin/*, auditor/*
  styles/         tokens.css (sama dengan variabel Figma) dan global.css
```

## Deploy ke Vercel

1. Push repo ke GitHub.
2. Di Vercel: **Add New → Project → Import** repo `ippl-chatbot`.
3. Set **Root Directory** ke `frontend`. Framework terdeteksi otomatis sebagai Vite (build `npm run build`, output `dist`).
4. Tidak perlu environment variable untuk mode mock. Deploy.

`vercel.json` sudah mengarahkan semua rute ke `index.html`, jadi URL seperti `/admin/roles` tetap bisa dibuka langsung.
