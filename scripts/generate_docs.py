#!/usr/bin/env python3
"""
Membuat dokumen simulasi intranet (PDF) per departemen ke folder docs/.
Perusahaan fiktif; isi konsisten dengan data seed (cuti 12 hari, WFO 3 hari, dst).
Jalankan: .venv/bin/python scripts/generate_docs.py   (butuh: pip install reportlab)
Format sengaja mengikuti test-documents/: header "KLASIFIKASI: X" dan judul "Bab I - ..." agar
ter-chunk per bagian oleh ingestion_service.
"""
from pathlib import Path

from reportlab.lib.enums import TA_JUSTIFY
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import cm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer

FONT_DIR = Path("/usr/share/fonts/truetype/dejavu")
pdfmetrics.registerFont(TTFont("DV", str(FONT_DIR / "DejaVuSans.ttf")))
pdfmetrics.registerFont(TTFont("DV-B", str(FONT_DIR / "DejaVuSans-Bold.ttf")))

ROOT = Path(__file__).resolve().parent.parent / "docs"
COMPANY = "PT Perusahaan Contoh (fiktif)"
ROMAN = ["I", "II", "III", "IV", "V", "VI"]

S_TITLE = ParagraphStyle("t", fontName="DV-B", fontSize=16, leading=21, spaceAfter=4)
S_META = ParagraphStyle("m", fontName="DV", fontSize=8.5, leading=12, textColor="#555555")
S_H = ParagraphStyle("h", fontName="DV-B", fontSize=11.5, leading=15, spaceBefore=12, spaceAfter=4)
S_P = ParagraphStyle("p", fontName="DV", fontSize=9.5, leading=14, alignment=TA_JUSTIFY, spaceAfter=5)

# (departemen, klasifikasi, judul, nomor, berlaku, pemilik, [(judul bab, [paragraf])])
DOCS = [
    # ---------------- UMUM / GA ----------------
    ("Umum", "Public", "Kebijakan Penggunaan Aset dan Fasilitas Kantor", "GA-POL-001", "1 Januari 2026", "General Affairs", [
        ("Ketentuan Umum", [
            "Aset perusahaan meliputi laptop, ponsel dinas, kendaraan operasional, ruang rapat, dan peralatan kantor. Seluruh aset tercatat di register aset yang dikelola General Affairs dan diberi label nomor inventaris.",
            "Karyawan bertanggung jawab atas aset yang diserahkan kepadanya. Aset hanya digunakan untuk kepentingan pekerjaan; penggunaan pribadi yang wajar diperbolehkan sepanjang tidak mengganggu pekerjaan dan tidak melanggar kebijakan keamanan informasi.",
        ]),
        ("Peminjaman dan Pemesanan Fasilitas", [
            "Ruang rapat dipesan melalui kalender perusahaan paling lambat satu hari kerja sebelumnya. Pemesanan yang tidak dipakai lebih dari 15 menit sejak jadwal dimulai dibatalkan otomatis.",
            "Kendaraan operasional dipinjam melalui formulir permintaan yang disetujui atasan langsung. Pengemudi wajib memiliki SIM yang berlaku dan mengisi log perjalanan serta kilometer awal dan akhir.",
        ]),
        ("Kehilangan dan Kerusakan", [
            "Kehilangan atau kerusakan aset dilaporkan kepada General Affairs paling lambat 1 x 24 jam. Kehilangan karena pencurian wajib disertai laporan polisi.",
            "Kerusakan akibat kelalaian dapat dibebankan sebagian kepada karyawan sesuai hasil penilaian General Affairs dan HR. Kerusakan wajar karena pemakaian normal ditanggung perusahaan.",
        ]),
        ("Pengembalian Aset", [
            "Saat karyawan berhenti atau dimutasi, seluruh aset dikembalikan paling lambat pada hari kerja terakhir. Surat keterangan bebas tanggungan hanya diterbitkan setelah seluruh aset dinyatakan lengkap.",
        ]),
    ]),
    ("Umum", "Public", "Panduan Keselamatan dan Kesehatan Kerja (K3)", "GA-SOP-002", "1 Januari 2026", "General Affairs & HSE", [
        ("Komitmen dan Tanggung Jawab", [
            "Perusahaan berkomitmen menyediakan lingkungan kerja yang aman dan sehat. Setiap karyawan wajib mematuhi rambu keselamatan, menggunakan alat pelindung diri bila dipersyaratkan, dan melaporkan kondisi berbahaya.",
            "Tim K3 beranggotakan perwakilan setiap divisi dan bertemu setiap tiga bulan untuk meninjau laporan insiden, hasil inspeksi, dan tindak lanjutnya.",
        ]),
        ("Tanggap Darurat", [
            "Saat alarm kebakaran berbunyi, karyawan meninggalkan gedung melalui tangga darurat terdekat dan berkumpul di titik kumpul area parkir timur. Lift tidak boleh digunakan.",
            "Setiap lantai memiliki minimal dua petugas pemadam kebakaran (fire warden) yang memastikan lantai kosong dan menghitung jumlah karyawan di titik kumpul. Simulasi evakuasi dilakukan dua kali setahun.",
        ]),
        ("Pertolongan Pertama dan Pelaporan Insiden", [
            "Kotak P3K tersedia di setiap lantai dan diperiksa bulanan. Karyawan yang cedera atau sakit di kantor menghubungi petugas P3K melalui ekstensi 119.",
            "Setiap insiden, termasuk nyaris celaka, dilaporkan melalui formulir insiden K3 paling lambat 24 jam. Insiden yang menyebabkan hilangnya hari kerja dilaporkan ke BPJS Ketenagakerjaan dalam waktu 2 x 24 jam.",
        ]),
        ("Ergonomi dan Kerja dari Rumah", [
            "Karyawan yang bekerja dari rumah dianjurkan menyiapkan kursi dan meja yang ergonomis. Istirahat singkat minimal lima menit setiap satu jam bekerja di depan layar disarankan.",
        ]),
    ]),
    ("Umum", "Public", "Kode Etik dan Perilaku Karyawan", "HR-COC-003", "1 Januari 2026", "Compliance Office", [
        ("Nilai Dasar", [
            "Perusahaan menjunjung integritas, kejujuran, saling menghormati, dan profesionalisme. Kode etik berlaku bagi seluruh karyawan, direksi, komisaris, dan pihak ketiga yang bekerja atas nama perusahaan.",
        ]),
        ("Benturan Kepentingan dan Hadiah", [
            "Karyawan wajib menghindari situasi yang mengaburkan penilaian profesional, termasuk memiliki kepentingan finansial pada pemasok atau pesaing tanpa pengungkapan tertulis kepada atasan dan Compliance Office.",
            "Hadiah, jamuan, atau hiburan dari pihak eksternal dengan nilai wajar hingga Rp500.000 dapat diterima dan dicatat. Pemberian di atas nilai tersebut atau berupa uang tunai wajib ditolak atau diserahkan kepada Compliance Office.",
        ]),
        ("Perilaku di Tempat Kerja", [
            "Perusahaan tidak menoleransi pelecehan, diskriminasi, intimidasi, maupun perundungan dalam bentuk apa pun. Karyawan diperlakukan setara tanpa memandang suku, agama, gender, usia, atau disabilitas.",
            "Informasi rahasia perusahaan tidak boleh dibagikan kepada pihak yang tidak berwenang, termasuk melalui media sosial dan aplikasi pesan pribadi.",
        ]),
        ("Pelaporan Pelanggaran (Whistleblowing)", [
            "Dugaan pelanggaran dilaporkan melalui saluran etika (etika@perusahaan-contoh.example) atau hotline anonim. Identitas pelapor dilindungi dan pelapor beritikad baik tidak boleh dikenai tindakan balasan.",
            "Compliance Office menindaklanjuti laporan dalam 14 hari kerja dan melaporkan hasilnya kepada Komite Audit.",
        ]),
    ]),
    # ---------------- IT ----------------
    ("IT", "Public", "Kebijakan Keamanan Informasi dan Penggunaan Perangkat", "IT-POL-001", "1 Januari 2026", "Divisi Teknologi Informasi", [
        ("Kata Sandi dan Autentikasi", [
            "Seluruh akun perusahaan menggunakan Single Sign-On (SSO) Keycloak. Kata sandi minimal 12 karakter, tidak boleh digunakan ulang dari lima kata sandi terakhir, dan diganti bila dicurigai bocor.",
            "Autentikasi dua faktor (2FA) wajib bagi akun dengan akses ke data HR, keuangan, dan sistem produksi. Kata sandi tidak boleh dibagikan, termasuk kepada tim IT.",
        ]),
        ("Perangkat Kerja dan BYOD", [
            "Laptop dinas dienkripsi penuh (FileVault/BitLocker) dan terpasang agen manajemen perangkat. Perangkat pribadi (BYOD) hanya boleh mengakses email dan chat perusahaan melalui aplikasi yang terkelola.",
            "Kehilangan perangkat dilaporkan kepada IT Helpdesk dalam 2 jam agar akses dapat dicabut dan perangkat dihapus jarak jauh.",
        ]),
        ("Penanganan Data", [
            "Data diklasifikasikan menjadi Public, HR, Finance, Legal, dan Confidential. Data selain Public tidak boleh disimpan di layanan penyimpanan pribadi atau dikirim ke alamat email di luar domain perusahaan.",
            "Penggunaan layanan AI generatif eksternal dengan data selain Public dilarang. Gunakan chatbot internal yang menerapkan kontrol akses berbasis peran.",
        ]),
        ("Insiden Keamanan", [
            "Email mencurigakan (phishing), malware, atau akses tidak sah dilaporkan ke security@perusahaan-contoh.example. Jangan mengklik tautan atau membuka lampiran yang mencurigakan.",
        ]),
    ]),
    ("IT", "Public", "SOP Permintaan Layanan IT Helpdesk", "IT-SOP-002", "1 Februari 2026", "Divisi Teknologi Informasi", [
        ("Saluran Layanan", [
            "Permintaan layanan diajukan melalui portal helpdesk, email helpdesk@perusahaan-contoh.example, atau ekstensi 100. Layanan tersedia Senin sampai Jumat pukul 08.00 sampai 17.00 WIB.",
            "Insiden kritis di luar jam kerja, misalnya sistem produksi tidak dapat diakses, dilaporkan kepada petugas jaga melalui nomor on-call yang tertera di portal.",
        ]),
        ("Prioritas dan Target Waktu", [
            "Prioritas P1 (layanan kritis terhenti) ditanggapi dalam 30 menit dan ditargetkan selesai dalam 4 jam. Prioritas P2 (layanan terganggu sebagian) ditanggapi dalam 2 jam dan selesai dalam 1 hari kerja.",
            "Prioritas P3 (permintaan biasa seperti instalasi aplikasi) ditanggapi dalam 1 hari kerja dan diselesaikan dalam 3 hari kerja. Prioritas P4 (permintaan perbaikan non-mendesak) diselesaikan dalam 10 hari kerja.",
        ]),
        ("Permintaan Akun dan Akses", [
            "Pembuatan akun karyawan baru diajukan HR minimal 3 hari kerja sebelum tanggal masuk. Permintaan akses tambahan memerlukan persetujuan atasan langsung dan pemilik sistem.",
            "Pencabutan akses karyawan yang berhenti dilakukan pada hari kerja terakhir sesuai pemberitahuan HR.",
        ]),
    ]),
    ("IT", "Public", "Panduan Penggunaan Chatbot Internal", "IT-GUIDE-003", "1 Maret 2026", "Divisi Teknologi Informasi", [
        ("Tentang Chatbot Internal", [
            "Chatbot internal menjawab pertanyaan berdasarkan dokumen resmi perusahaan. Setiap jawaban disertai sitasi nomor dokumen, bagian, dan halaman sumber sehingga dapat diverifikasi.",
            "Chatbot hanya menampilkan informasi dari dokumen yang boleh diakses sesuai peran Anda. Bila informasi tidak ditemukan dalam dokumen yang dapat diakses, chatbot menyatakannya apa adanya dan tidak menebak.",
        ]),
        ("Cara Bertanya yang Efektif", [
            "Gunakan kalimat yang spesifik, misalnya: Berapa hari cuti tahunan karyawan tetap? Hindari pertanyaan terlalu umum seperti: Ceritakan semua kebijakan. Sebutkan nama kebijakan atau departemen bila ada.",
            "Chatbot tidak memiliki akses ke informasi di luar dokumen, seperti tanggal hari ini atau kabar eksternal. Pertanyaan di luar cakupan dokumen akan dijawab bahwa informasi tidak ditemukan.",
        ]),
        ("Keamanan dan Batasan", [
            "Jangan memasukkan data pribadi sensitif, kata sandi, atau nomor kartu. Pertanyaan yang tampak berupa upaya prompt injection diblokir dan dicatat dalam log audit.",
            "Seluruh pertanyaan dicatat dalam log audit yang tidak dapat diubah, dengan data pribadi disamarkan. Log ditinjau oleh tim Audit untuk kepatuhan.",
        ]),
        ("Umpan Balik", [
            "Gunakan tombol jempol pada setiap jawaban untuk menilai kegunaannya. Penilaian membantu tim IT dan pemilik dokumen memperbaiki isi dokumen dan pengaturan pencarian.",
        ]),
    ]),
    # ---------------- HR ----------------
    ("HR", "HR", "Kebijakan Rekrutmen dan Seleksi Karyawan", "HR-POL-010", "1 Januari 2026", "Divisi Human Resources", [
        ("Perencanaan Kebutuhan Tenaga Kerja", [
            "Kebutuhan karyawan baru diajukan kepala divisi melalui formulir permintaan tenaga kerja (MPR) yang memuat alasan, jabatan, kualifikasi, dan anggaran. MPR disetujui HR Business Partner dan Direktur terkait.",
            "Posisi pengganti diutamakan diisi dari talenta internal. Lowongan dipublikasikan di portal karier internal selama 7 hari kerja sebelum dibuka untuk umum.",
        ]),
        ("Tahapan Seleksi", [
            "Seleksi terdiri dari penyaringan administrasi, tes kemampuan, wawancara HR, wawancara pengguna, dan pengecekan referensi. Untuk jabatan manajerial ditambahkan asesmen psikologi dan wawancara dengan direktur.",
            "Penilaian dilakukan dengan rubrik yang sama bagi seluruh kandidat. Pewawancara wajib mencatat alasan keputusan dan tidak boleh menanyakan status pernikahan, agama, atau rencana kehamilan.",
        ]),
        ("Penawaran dan Masa Percobaan", [
            "Penawaran kerja diterbitkan HR dengan persetujuan Direktur dan berlaku 7 hari kalender. Besaran gaji mengikuti struktur gaji dan tidak boleh melampaui band jabatan tanpa persetujuan Direktur Keuangan.",
            "Karyawan baru menjalani masa percobaan tiga bulan dan dievaluasi pada akhir bulan kedua. Pengangkatan menjadi karyawan tetap ditetapkan melalui surat keputusan.",
        ]),
        ("Referensi dan Latar Belakang", [
            "Pengecekan referensi dan latar belakang pendidikan dilakukan dengan persetujuan tertulis kandidat. Data kandidat yang tidak diterima disimpan maksimal 12 bulan lalu dihapus.",
        ]),
    ]),
    ("HR", "HR", "SOP Penilaian Kinerja Tahunan", "HR-SOP-011", "1 Januari 2026", "Divisi Human Resources", [
        ("Siklus Penilaian", [
            "Penilaian kinerja berlangsung setahun sekali dengan peninjauan tengah tahun. Penetapan sasaran (OKR/KPI) dilakukan pada Januari, peninjauan tengah tahun pada Juli, dan penilaian akhir pada Desember.",
            "Setiap karyawan memiliki 3 sampai 5 sasaran dengan bobot yang total seratus persen. Sasaran disepakati bersama atasan langsung dan dicatat di sistem HRIS.",
        ]),
        ("Skala Penilaian", [
            "Skala penilaian lima tingkat: 5 Luar Biasa, 4 Melampaui Harapan, 3 Memenuhi Harapan, 2 Perlu Perbaikan, dan 1 Tidak Memenuhi. Nilai akhir gabungan terdiri dari 70 persen pencapaian sasaran dan 30 persen penerapan nilai perusahaan.",
            "Hasil penilaian dikalibrasi dalam rapat kalibrasi divisi agar distribusi nilai adil antar tim. Distribusi nilai 5 dibatasi maksimal 10 persen dari populasi divisi.",
        ]),
        ("Dampak Penilaian", [
            "Hasil penilaian menjadi dasar kenaikan gaji, bonus kinerja, promosi, dan rencana pengembangan. Karyawan bernilai 2 atau lebih rendah dimasukkan ke program perbaikan kinerja selama tiga bulan.",
        ]),
        ("Keberatan", [
            "Karyawan dapat mengajukan keberatan atas hasil penilaian secara tertulis kepada HR dalam 10 hari kerja sejak hasil diumumkan. HR menyelesaikan peninjauan ulang dalam 14 hari kerja.",
        ]),
    ]),
    ("HR", "HR", "Kebijakan Pelatihan dan Pengembangan Karyawan", "HR-POL-012", "1 Januari 2026", "Divisi Human Resources", [
        ("Anggaran dan Hak Pelatihan", [
            "Setiap karyawan tetap memperoleh anggaran pengembangan Rp5.000.000 per tahun untuk pelatihan, sertifikasi, atau konferensi yang relevan dengan jabatan. Anggaran tidak dapat diakumulasikan ke tahun berikutnya.",
            "Pelatihan wajib seperti K3, keamanan informasi, dan kode etik diselenggarakan perusahaan tanpa memotong anggaran pengembangan individu.",
        ]),
        ("Pengajuan dan Persetujuan", [
            "Pengajuan pelatihan diajukan melalui portal HR minimal 14 hari sebelum kegiatan dengan persetujuan atasan langsung. Pelatihan di atas Rp10.000.000 memerlukan persetujuan Kepala HR.",
        ]),
        ("Ikatan Dinas", [
            "Pelatihan atau sertifikasi bernilai di atas Rp15.000.000 mewajibkan ikatan dinas selama 12 bulan sejak selesai. Karyawan yang berhenti sebelum masa ikatan berakhir mengembalikan biaya secara proporsional.",
            "Karyawan yang telah mengikuti pelatihan berbagi pengetahuan dalam sesi internal paling lambat 30 hari setelah pelatihan selesai.",
        ]),
        ("Pelaporan", [
            "Peserta menyerahkan sertifikat dan laporan singkat paling lambat 7 hari setelah pelatihan. Realisasi anggaran pelatihan dilaporkan HR kepada manajemen setiap kuartal.",
        ]),
    ]),
    ("HR", "HR", "SOP Penanganan Pelanggaran Disiplin dan Sanksi", "HR-SOP-013", "1 Januari 2026", "Divisi Human Resources", [
        ("Jenis Pelanggaran", [
            "Pelanggaran dikelompokkan menjadi ringan (misalnya keterlambatan berulang), sedang (misalnya mangkir tanpa keterangan hingga tiga hari), dan berat (misalnya penipuan, pencurian, pelecehan, atau membocorkan informasi rahasia).",
        ]),
        ("Tahapan Sanksi", [
            "Sanksi dijatuhkan bertahap: teguran lisan, Surat Peringatan 1 (SP1), SP2, dan SP3, masing-masing berlaku enam bulan. Pelanggaran berat dapat langsung dikenai SP3 atau pemutusan hubungan kerja setelah pemeriksaan.",
            "Setiap sanksi didahului pemanggilan karyawan untuk memberikan klarifikasi. Karyawan berhak didampingi perwakilan karyawan selama pemeriksaan.",
        ]),
        ("Pemeriksaan", [
            "HR membentuk tim pemeriksa independen yang tidak memiliki hubungan kerja langsung dengan karyawan terperiksa. Pemeriksaan diselesaikan dalam 14 hari kerja dan hasilnya didokumentasikan secara rahasia.",
            "Selama pemeriksaan pelanggaran berat, karyawan dapat dibebastugaskan sementara dengan tetap menerima gaji pokok.",
        ]),
        ("Pembinaan dan Pemulihan", [
            "Sanksi disertai rencana pembinaan. SP yang telah berakhir masa berlakunya tidak diperhitungkan dalam tahapan sanksi berikutnya, kecuali untuk pelanggaran yang sejenis.",
        ]),
    ]),
    ("HR", "HR", "Kebijakan Cuti Melahirkan dan Cuti Khusus", "HR-POL-014", "1 Januari 2026", "Divisi Human Resources", [
        ("Cuti Melahirkan dan Keguguran", [
            "Karyawan perempuan berhak atas cuti melahirkan selama tiga bulan (90 hari kalender) dengan upah penuh, dengan pengambilan yang dapat dimulai hingga satu bulan sebelum perkiraan persalinan. Pada kasus keguguran diberikan cuti 1,5 bulan atau sesuai surat dokter.",
            "Pengajuan disertai surat keterangan dokter melalui portal HR minimal 30 hari sebelum perkiraan persalinan.",
        ]),
        ("Cuti Ayah dan Cuti Khusus", [
            "Karyawan laki-laki berhak atas cuti istri melahirkan selama 3 hari kerja. Cuti khusus lain dengan upah penuh: menikah 3 hari, menikahkan anak 2 hari, khitanan atau pembaptisan anak 2 hari, serta anggota keluarga inti meninggal 2 hari.",
            "Cuti khusus diajukan melalui portal HR dengan bukti pendukung dan tidak mengurangi jatah cuti tahunan.",
        ]),
        ("Cuti Sakit dan Cuti di Luar Tanggungan", [
            "Cuti sakit dengan surat dokter dibayar penuh hingga empat bulan pertama sesuai ketentuan peraturan perundang-undangan. Sakit tanpa surat dokter lebih dari dua hari berturut-turut dihitung sebagai cuti tahunan.",
            "Cuti di luar tanggungan maksimal tiga bulan dapat diberikan atas persetujuan Direktur setelah karyawan bekerja minimal tiga tahun. Selama masa tersebut upah dan tunjangan tidak dibayarkan.",
        ]),
        ("Hak Setelah Cuti", [
            "Setelah cuti, karyawan kembali ke jabatan semula atau jabatan setara. Fasilitas ruang laktasi tersedia di kantor dan waktu memerah ASI dihitung sebagai jam kerja.",
        ]),
    ]),
    # ---------------- FINANCE ----------------
    ("Finance", "Finance", "SOP Pengajuan dan Reimbursement Biaya", "FIN-SOP-020", "1 Januari 2026", "Divisi Keuangan", [
        ("Biaya yang Dapat Diklaim", [
            "Biaya yang dapat diklaim meliputi transportasi dinas, akomodasi, konsumsi rapat dengan pihak eksternal, dan perlengkapan kerja yang disetujui. Biaya pribadi, denda lalu lintas, dan minuman beralkohol tidak dapat diklaim.",
        ]),
        ("Batas Persetujuan", [
            "Klaim sampai Rp1.000.000 disetujui atasan langsung. Klaim Rp1.000.001 sampai Rp5.000.000 disetujui Kepala Divisi, dan di atas Rp5.000.000 disetujui Direktur Keuangan.",
            "Klaim tanpa bukti sah (kuitansi atau faktur) tidak diproses, kecuali transportasi daring yang dibuktikan dengan tangkapan layar aplikasi.",
        ]),
        ("Tenggat dan Pembayaran", [
            "Klaim diajukan melalui aplikasi keuangan paling lambat 14 hari kalender setelah transaksi. Klaim terlambat memerlukan persetujuan Kepala Keuangan.",
            "Klaim lengkap dibayarkan melalui transfer bank paling lambat 5 hari kerja setelah disetujui. Pencairan batch dilakukan setiap Selasa dan Jumat.",
        ]),
        ("Pelanggaran dan Audit", [
            "Klaim fiktif atau ganda dikategorikan pelanggaran berat sesuai SOP disiplin. Divisi Keuangan melakukan pemeriksaan acak minimal lima persen dari klaim setiap bulan.",
        ]),
    ]),
    ("Finance", "Finance", "Kebijakan Pengadaan Barang dan Jasa", "FIN-POL-021", "1 Januari 2026", "Divisi Keuangan & Procurement", [
        ("Prinsip Pengadaan", [
            "Pengadaan dilakukan secara transparan, kompetitif, dan akuntabel dengan memperhatikan kualitas, harga, dan keberlanjutan pemasok. Pemisahan tugas diterapkan antara pemohon, penyetuju, penerima barang, dan pembayar.",
        ]),
        ("Ambang Nilai dan Metode", [
            "Pengadaan sampai Rp10.000.000 dilakukan dengan penunjukan langsung. Rp10.000.001 sampai Rp100.000.000 memerlukan minimal tiga penawaran. Di atas Rp100.000.000 dilakukan tender terbuka melalui Panitia Pengadaan.",
            "Pengadaan di atas Rp500.000.000 memerlukan persetujuan Direktur Utama dan ditinjau oleh Legal sebelum kontrak ditandatangani.",
        ]),
        ("Manajemen Pemasok", [
            "Pemasok baru wajib lolos uji tuntas yang mencakup legalitas usaha, NPWP, rekening bank atas nama badan usaha, dan pernyataan antikorupsi. Evaluasi kinerja pemasok dilakukan tahunan.",
            "Pemasok yang melanggar kontrak atau kode etik dimasukkan ke daftar hitam selama minimal dua tahun.",
        ]),
        ("Penerimaan dan Pembayaran", [
            "Pembayaran dilakukan setelah barang atau jasa diterima dan dicocokkan dengan pesanan dan faktur (three-way matching). Jangka waktu pembayaran standar adalah 30 hari sejak faktur lengkap diterima.",
        ]),
    ]),
    ("Finance", "Finance", "SOP Penutupan Buku Bulanan", "FIN-SOP-022", "1 Januari 2026", "Divisi Keuangan - Akuntansi", [
        ("Jadwal Penutupan", [
            "Penutupan buku dilakukan pada hari kerja kelima setiap bulan (H+5). Seluruh divisi menyerahkan transaksi, akrual, dan dokumen pendukung paling lambat hari kerja ketiga (H+3).",
        ]),
        ("Langkah Penutupan", [
            "Akuntansi memeriksa kelengkapan jurnal, melakukan rekonsiliasi bank, piutang, dan utang, menghitung penyusutan aset tetap, serta mencatat akrual beban dan pendapatan. Selisih rekonsiliasi di atas Rp1.000.000 wajib dijelaskan.",
            "Setelah neraca saldo disetujui Kepala Akuntansi, periode dikunci di sistem sehingga jurnal susulan hanya dapat dilakukan melalui jurnal penyesuaian yang disetujui Direktur Keuangan.",
        ]),
        ("Pelaporan", [
            "Laporan keuangan bulanan terdiri dari laba rugi, neraca, dan arus kas, disampaikan kepada Direktur Keuangan pada H+7 dan kepada Dewan Direksi pada H+10. Analisis varians terhadap anggaran dijelaskan bila selisih melebihi lima persen.",
        ]),
        ("Penutupan Kuartal dan Tahun", [
            "Penutupan kuartal dan tahunan ditambah penelaahan oleh auditor internal serta pemeriksaan saldo akhir oleh auditor eksternal sesuai jadwal audit.",
        ]),
    ]),
    ("Finance", "Finance", "Kebijakan Pajak dan Pemotongan PPh 21", "FIN-POL-023", "1 Januari 2026", "Divisi Keuangan - Perpajakan", [
        ("Ruang Lingkup", [
            "Perusahaan memotong, menyetor, dan melaporkan PPh Pasal 21 atas penghasilan karyawan sesuai peraturan perpajakan yang berlaku. Perhitungan menggunakan skema tarif efektif rata-rata (TER) pada masa pajak Januari sampai November dan perhitungan tarif progresif pada masa pajak Desember.",
        ]),
        ("Kewajiban Karyawan", [
            "Karyawan wajib menyerahkan NPWP dan memperbarui status PTKP (menikah, tanggungan) melalui portal HR paling lambat 31 Januari setiap tahun. Karyawan tanpa NPWP dikenai tarif lebih tinggi sesuai ketentuan.",
        ]),
        ("Setor dan Lapor", [
            "PPh 21 disetor paling lambat tanggal 10 bulan berikutnya dan dilaporkan melalui SPT Masa paling lambat tanggal 20 bulan berikutnya. Bukti potong 1721-A1 diterbitkan paling lambat akhir Februari tahun berikutnya.",
            "Keterlambatan setor dan lapor yang menimbulkan sanksi administrasi dibebankan kepada perusahaan, kecuali disebabkan data yang tidak benar dari karyawan.",
        ]),
        ("Tunjangan dan Natura", [
            "Tunjangan tetap, bonus, dan THR digabungkan dalam perhitungan penghasilan bruto. Fasilitas natura tertentu dikecualikan sesuai ketentuan perpajakan.",
        ]),
    ]),
    # ---------------- LEGAL ----------------
    ("Legal", "Legal", "Kebijakan Persetujuan dan Review Kontrak", "LGL-POL-030", "1 Januari 2026", "Divisi Legal", [
        ("Kewajiban Review", [
            "Seluruh kontrak dengan pihak eksternal wajib ditinjau Divisi Legal sebelum ditandatangani, kecuali kontrak yang memakai templat baku tanpa perubahan. Tidak ada karyawan yang berwenang menandatangani kontrak sebelum review selesai.",
        ]),
        ("Kewenangan Tanda Tangan", [
            "Kontrak sampai Rp100.000.000 ditandatangani Kepala Divisi. Rp100.000.001 sampai Rp1.000.000.000 ditandatangani Direktur terkait. Di atas Rp1.000.000.000 atau berjangka lebih dari tiga tahun ditandatangani Direktur Utama.",
            "Kontrak yang melibatkan kekayaan intelektual, pembebanan aset, atau jaminan perusahaan memerlukan persetujuan Direktur Utama berapa pun nilainya.",
        ]),
        ("Waktu dan Klausul Wajib", [
            "Legal menyelesaikan review dalam 5 hari kerja untuk kontrak standar dan 10 hari kerja untuk kontrak kompleks. Setiap kontrak memuat klausul kerahasiaan, pelindungan data pribadi, antikorupsi, penyelesaian sengketa, dan hak mengakhiri kontrak.",
        ]),
        ("Penyimpanan", [
            "Kontrak asli yang telah ditandatangani diserahkan ke Legal paling lambat 5 hari kerja dan disimpan di repositori kontrak. Tanggal berakhir kontrak dipantau dan pemilik kontrak diingatkan 90 hari sebelumnya.",
        ]),
    ]),
    ("Legal", "Legal", "Kebijakan Pelindungan Data Pribadi", "LGL-POL-031", "1 Januari 2026", "Divisi Legal & DPO", [
        ("Prinsip", [
            "Perusahaan memproses data pribadi sesuai Undang-Undang Pelindungan Data Pribadi dengan prinsip pembatasan tujuan, minimisasi data, akurasi, keamanan, dan pembatasan penyimpanan. Data hanya dikumpulkan untuk tujuan yang sah dan diberitahukan kepada pemilik data.",
        ]),
        ("Hak Subjek Data", [
            "Subjek data berhak mengakses, memperbaiki, menghapus, dan membatasi pemrosesan data pribadinya, serta menarik persetujuan. Permintaan diajukan kepada Pejabat Pelindungan Data (DPO) dan dijawab dalam 3 x 24 jam untuk konfirmasi serta paling lambat 14 hari untuk pemenuhan.",
        ]),
        ("Retensi dan Penghapusan", [
            "Data karyawan disimpan selama masa kerja dan sampai 5 tahun setelahnya sesuai kewajiban hukum. Data kandidat yang tidak diterima disimpan 12 bulan. Setelah masa retensi data dihapus atau dianonimkan dan penghapusan dicatat.",
            "Log audit chatbot menyamarkan data pribadi dalam pertanyaan dan disimpan sesuai kebijakan retensi audit perusahaan.",
        ]),
        ("Insiden Kebocoran Data", [
            "Kegagalan pelindungan data dilaporkan ke DPO dalam 1 jam setelah diketahui. Perusahaan memberitahukan subjek data dan lembaga berwenang paling lambat 3 x 24 jam sesuai ketentuan peraturan perundang-undangan.",
        ]),
    ]),
    ("Legal", "Legal", "SOP Legal Hold dan Penanganan Sengketa", "LGL-SOP-032", "1 Januari 2026", "Divisi Legal", [
        ("Penerbitan Legal Hold", [
            "Legal hold diterbitkan Divisi Legal ketika perusahaan mengetahui atau patut menduga akan ada litigasi, penyelidikan, atau audit regulator. Pemberitahuan tertulis dikirim kepada seluruh pemilik dokumen terkait dan Divisi IT.",
            "Selama legal hold berlaku, dokumen, email, dan pesan terkait tidak boleh dihapus, diubah, atau dimusnahkan, termasuk penghapusan otomatis berdasarkan kebijakan retensi.",
        ]),
        ("Pengumpulan dan Penyimpanan Bukti", [
            "IT membekukan penghapusan otomatis untuk akun terkait dan membuat salinan forensik bila diminta Legal. Rantai penguasaan bukti dicatat sejak pengumpulan sampai penyerahan.",
        ]),
        ("Penanganan Sengketa", [
            "Somasi, gugatan, atau panggilan pengadilan yang diterima karyawan segera diteruskan ke Legal dalam 1 hari kerja tanpa ditanggapi sendiri. Legal menentukan strategi bersama pihak terkait dan penasihat hukum eksternal.",
            "Komunikasi dengan pihak lawan, pers, atau regulator terkait sengketa hanya dilakukan oleh juru bicara yang ditunjuk Direktur Utama.",
        ]),
        ("Pencabutan Legal Hold", [
            "Legal hold dicabut secara tertulis oleh Legal setelah sengketa selesai dan seluruh upaya hukum berakhir. Dokumen kemudian mengikuti kebijakan retensi normal.",
        ]),
    ]),
    # ---------------- MANAJEMEN / CONFIDENTIAL ----------------
    ("Manajemen", "Confidential", "Rencana Strategis Perusahaan 2026-2028", "MGT-STR-040", "1 Januari 2026", "Direksi", [
        ("Visi dan Prioritas", [
            "Perusahaan menargetkan pertumbuhan pendapatan majemuk 18 persen per tahun pada periode 2026 sampai 2028 dengan margin operasional minimal 15 persen. Tiga prioritas strategis: perluasan layanan digital, efisiensi operasional, dan penguatan talenta.",
        ]),
        ("Inisiatif Utama", [
            "Inisiatif 1: peluncuran platform layanan digital baru pada kuartal kedua 2027 dengan investasi Rp45 miliar. Inisiatif 2: otomasi proses keuangan dan HR untuk menurunkan biaya operasional 12 persen. Inisiatif 3: pembukaan dua kantor cabang regional pada 2027.",
            "Kajian akuisisi selektif dilakukan untuk mempercepat masuk ke segmen enterprise; rincian target disimpan dalam dokumen terpisah dengan klasifikasi Confidential.",
        ]),
        ("Anggaran dan Risiko", [
            "Total belanja modal tiga tahun diproyeksikan Rp120 miliar yang dibiayai arus kas operasi dan fasilitas pinjaman Rp40 miliar. Risiko utama: keterlambatan pengembangan platform, kenaikan biaya talenta, dan perubahan regulasi pelindungan data.",
        ]),
        ("Tata Kelola Pelaksanaan", [
            "Kemajuan dipantau dalam rapat strategi kuartalan yang dipimpin Direktur Utama. Dokumen ini hanya boleh diakses direksi dan manajemen; penyebaran di luar kelompok tersebut memerlukan persetujuan tertulis Direktur Utama.",
        ]),
    ]),
    ("Manajemen", "Confidential", "Kebijakan Suksesi dan Kompensasi Eksekutif", "MGT-POL-041", "1 Januari 2026", "Dewan Komisaris - Komite Nominasi dan Remunerasi", [
        ("Perencanaan Suksesi", [
            "Komite Nominasi dan Remunerasi menyusun peta talenta untuk seluruh posisi direksi dan kepala divisi. Setiap posisi kunci memiliki minimal satu calon pengganti siap dalam 12 bulan dan satu calon siap dalam 36 bulan.",
        ]),
        ("Struktur Kompensasi Eksekutif", [
            "Kompensasi eksekutif terdiri dari gaji tetap, bonus kinerja tahunan maksimal 6 kali gaji bulanan, dan insentif jangka panjang berbasis saham kinerja yang vesting dalam tiga tahun. Bonus dibayarkan setelah laporan keuangan diaudit.",
            "Penetapan target bonus menggabungkan pencapaian keuangan perusahaan (60 persen), pencapaian divisi (25 persen), dan kepemimpinan (15 persen).",
        ]),
        ("Clawback dan Pengungkapan", [
            "Bonus dan insentif dapat ditarik kembali (clawback) bila terdapat penyajian kembali laporan keuangan akibat kesalahan material atau pelanggaran kode etik berat. Hak penarikan berlaku tiga tahun setelah pembayaran.",
            "Rincian kompensasi individu bersifat rahasia dan hanya diakses anggota Komite, Direktur Utama, dan Direktur Keuangan.",
        ]),
    ]),
]


def build(doc):
    dept, cls, title, no, effective, owner, sections = doc
    out = ROOT / dept
    out.mkdir(parents=True, exist_ok=True)
    path = out / f"{title}.pdf"

    def page(canvas, d):
        canvas.setFont("DV", 7.5)
        canvas.drawString(2 * cm, A4[1] - 1.2 * cm, f"KLASIFIKASI: {cls.upper()}")
        canvas.drawString(2 * cm, 1.2 * cm, f"{COMPANY} - {no}")
        canvas.drawRightString(A4[0] - 2 * cm, 1.2 * cm, f"Halaman {d.page}")

    story = [
        Paragraph(title, S_TITLE),
        Paragraph(f"Nomor: {no} &nbsp;|&nbsp; Departemen: {dept} &nbsp;|&nbsp; Pemilik: {owner}", S_META),
        Paragraph(f"Berlaku: {effective} &nbsp;|&nbsp; Klasifikasi: {cls} &nbsp;|&nbsp; Versi 1.0", S_META),
        Spacer(1, 6),
    ]
    for i, (h, paras) in enumerate(sections):
        story.append(Paragraph(f"Bab {ROMAN[i]} - {h}", S_H))
        story += [Paragraph(p, S_P) for p in paras]
    SimpleDocTemplate(
        str(path), pagesize=A4, leftMargin=2 * cm, rightMargin=2 * cm, topMargin=2 * cm, bottomMargin=2 * cm,
        title=title, author=COMPANY,
    ).build(story, onFirstPage=page, onLaterPages=page)
    return path


def write_index():
    lines = [
        "# Intranet - Perpustakaan Dokumen Kebijakan & SOP",
        "",
        f"{COMPANY}. Seluruh dokumen fiktif untuk simulasi/uji chatbot RAG.",
        "Unggah lewat Konsol Admin > Dokumen; klasifikasi dokumen menentukan peran yang boleh mengaksesnya.",
        "",
        "| Departemen | Nomor | Dokumen | Klasifikasi |",
        "|---|---|---|---|",
    ]
    lines += [f"| {d[0]} | {d[3]} | [{d[2]}]({d[0]}/{d[2].replace(' ', '%20')}.pdf) | {d[1]} |" for d in DOCS]
    (ROOT / "INDEX.md").write_text("\n".join(lines) + "\n", encoding="utf-8")


if __name__ == "__main__":
    for d in DOCS:
        print(build(d).relative_to(ROOT.parent))
    write_index()
    assert len(DOCS) == 20
