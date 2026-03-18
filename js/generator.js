/**
 * generator.js — Modul pembuat semua ukuran icon
 * Mendefinisikan semua preset ukuran dan mengelola proses generasi
 */

/* ── Definisi semua ukuran icon ── */
const DAFTAR_ICON = {
  web: [
    {
      nama: "favicon-16.png",
      ukuran: 16,
      label: "Favicon 16",
      platform: "web",
    },
    {
      nama: "favicon-32.png",
      ukuran: 32,
      label: "Favicon 32",
      platform: "web",
    },
    {
      nama: "favicon-48.png",
      ukuran: 48,
      label: "Favicon 48",
      platform: "web",
    },
    {
      nama: "apple-touch-icon.png",
      ukuran: 180,
      label: "Apple Touch Icon",
      platform: "web",
    },
    {
      nama: "favicon.ico",
      ukuran: -1,
      label: "Favicon ICO",
      platform: "web",
      tipe: "ico",
    },
  ],
  pwa: [
    { nama: "icon-72.png", ukuran: 72, label: "PWA 72", platform: "pwa" },
    { nama: "icon-96.png", ukuran: 96, label: "PWA 96", platform: "pwa" },
    { nama: "icon-128.png", ukuran: 128, label: "PWA 128", platform: "pwa" },
    { nama: "icon-144.png", ukuran: 144, label: "PWA 144", platform: "pwa" },
    { nama: "icon-152.png", ukuran: 152, label: "PWA 152", platform: "pwa" },
    { nama: "icon-192.png", ukuran: 192, label: "PWA 192", platform: "pwa" },
    { nama: "icon-384.png", ukuran: 384, label: "PWA 384", platform: "pwa" },
    { nama: "icon-512.png", ukuran: 512, label: "PWA 512", platform: "pwa" },
    {
      nama: "maskable-icon-192.png",
      ukuran: 192,
      label: "Maskable 192",
      platform: "pwa",
      maskable: true,
    },
    {
      nama: "maskable-icon-512.png",
      ukuran: 512,
      label: "Maskable 512",
      platform: "pwa",
      maskable: true,
    },
  ],
  android: [
    {
      nama: "android-icon-48.png",
      ukuran: 48,
      label: "Android MDPI",
      platform: "android",
    },
    {
      nama: "android-icon-72.png",
      ukuran: 72,
      label: "Android HDPI",
      platform: "android",
    },
    {
      nama: "android-icon-96.png",
      ukuran: 96,
      label: "Android XHDPI",
      platform: "android",
    },
    {
      nama: "android-icon-144.png",
      ukuran: 144,
      label: "Android XXHDPI",
      platform: "android",
    },
    {
      nama: "android-icon-192.png",
      ukuran: 192,
      label: "Android XXXHDPI",
      platform: "android",
    },
    {
      nama: "android-icon-512.png",
      ukuran: 512,
      label: "Android Store",
      platform: "android",
    },
  ],
};

/* ── Preset filter ── */
const PRESET = {
  all: [...DAFTAR_ICON.web, ...DAFTAR_ICON.pwa, ...DAFTAR_ICON.android],
  web: DAFTAR_ICON.web,
  pwa: DAFTAR_ICON.pwa,
  android: DAFTAR_ICON.android,
};

const Generator = {
  /* Hasil ikon yang sudah dibuat: { nama, blob, dataUrl, ukuran, platform, ... } */
  hasilIkon: [],

  /* Flag untuk cek apakah sedang proses */
  sedangProses: false,

  /**
   * Generate semua ikon dari gambar yang diberikan
   * @param {HTMLImageElement} gambar - Gambar sumber
   * @param {object} pengaturan - Pengaturan dari UI
   * @param {number} pengaturan.padding
   * @param {boolean} pengaturan.transparan
   * @param {string} pengaturan.warnaBg
   * @param {boolean} pengaturan.maskable
   * @param {string} pengaturan.preset
   * @param {number[]} pengaturan.ukuranCustom
   * @param {Function} onProgress - Callback progres (0-100)
   * @returns {Promise<object[]>}
   */
  async generate(gambar, pengaturan, onProgress) {
    if (this.sedangProses) {
      Toast.warning("Sedang memproses, harap tunggu...");
      return;
    }

    this.sedangProses = true;
    this.hasilIkon = [];

    try {
      // Tentukan daftar ikon yang akan dibuat berdasarkan preset
      let daftarTugas = PRESET[pengaturan.preset] || PRESET.all;

      // Tambahkan ukuran custom jika ada
      if (pengaturan.ukuranCustom && pengaturan.ukuranCustom.length > 0) {
        const tugasCustom = pengaturan.ukuranCustom.map((ukuran) => ({
          nama: `icon-custom-${ukuran}.png`,
          ukuran,
          label: `Custom ${ukuran}px`,
          platform: "custom",
        }));
        daftarTugas = [...daftarTugas, ...tugasCustom];
      }

      // Hapus duplikat nama
      const namaUnik = new Set();
      daftarTugas = daftarTugas.filter((t) => {
        if (namaUnik.has(t.nama)) return false;
        namaUnik.add(t.nama);
        return true;
      });

      const total = daftarTugas.length;
      let selesai = 0;

      // Proses tiap ikon
      for (const tugas of daftarTugas) {
        try {
          const hasil = await this._prosesTugas(gambar, tugas, pengaturan);
          this.hasilIkon.push(hasil);
        } catch (err) {
          Logger.error(`Gagal membuat ${tugas.nama}`, err);
          // Lanjut ke tugas berikutnya meski ada error
        }

        selesai++;
        if (onProgress) {
          onProgress(Math.round((selesai / total) * 100));
        }

        // Yield ke event loop agar UI tetap responsif
        await new Promise((r) => setTimeout(r, 0));
      }

      Logger.info(`Generate selesai: ${this.hasilIkon.length} ikon dibuat`);
      return this.hasilIkon;
    } finally {
      this.sedangProses = false;
    }
  },

  /**
   * Proses satu tugas pembuatan ikon
   * @private
   */
  async _prosesTugas(gambar, tugas, pengaturan) {
    const opsiRender = {
      padding: pengaturan.padding,
      transparan: pengaturan.transparan,
      warnaBg: pengaturan.warnaBg,
      maskable: tugas.maskable || pengaturan.maskable,
    };

    // Khusus favicon.ico: buat dari ukuran 16, 32, 48
    if (tugas.tipe === "ico") {
      const ukuranIco = [16, 32, 48];
      const canvasArr = ukuranIco.map((u) =>
        Processor.renderKeCanvas(gambar, u, opsiRender)
      );

      const blob = await IcoEncoder.encode(canvasArr);
      const dataUrl = await Format.blobKeDataUrl(blob);

      // Bersihkan canvas sementara
      canvasArr.forEach((c) => Processor.bersihkanCanvas(c));

      return {
        ...tugas,
        blob,
        dataUrl,
        ukuranFile: blob.size,
        tipe: "ico",
      };
    }

    // Untuk SVG (apple-touch-icon kadang perlu ini — opsional)
    // Render normal sebagai PNG
    const canvas = Processor.renderKeCanvas(gambar, tugas.ukuran, opsiRender);
    const blob = await Format.canvasKeBlob(canvas, "image/png");
    const dataUrl = canvas.toDataURL("image/png");

    // Bersihkan canvas untuk hemat memori
    Processor.bersihkanCanvas(canvas);

    return {
      ...tugas,
      blob,
      dataUrl,
      ukuranFile: blob.size,
      tipe: "png",
    };
  },

  /**
   * Ambil hasil ikon berdasarkan platform
   * @param {string} platform - 'all' | 'web' | 'pwa' | 'android' | 'custom'
   */
  filterPlatform(platform) {
    if (platform === "all") return this.hasilIkon;
    return this.hasilIkon.filter((h) => h.platform === platform);
  },

  /**
   * Reset semua hasil (bersihkan memori)
   */
  reset() {
    this.hasilIkon = [];
    this.sedangProses = false;
  },
};

window.DAFTAR_ICON = DAFTAR_ICON;
window.Generator = Generator;
