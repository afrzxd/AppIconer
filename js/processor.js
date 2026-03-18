/**
 * processor.js — Mesin resize gambar berbasis Canvas
 * Menangani semua transformasi gambar: resize, padding, background, dll.
 */

const Processor = {
  /**
   * Render gambar ke canvas dengan ukuran tertentu
   *
   * @param {HTMLImageElement} gambar - Gambar sumber
   * @param {number} ukuran - Ukuran target (px)
   * @param {object} opsi - Konfigurasi rendering
   * @param {number} opsi.padding - Padding dalam persen (-30 s/d +30). Negatif = zoom in.
   * @param {boolean} opsi.transparan - Gunakan background transparan
   * @param {string} opsi.warnaBg - Warna background (hex)
   * @param {boolean} opsi.maskable - Mode maskable (safe area)
   * @returns {HTMLCanvasElement}
   */
  renderKeCanvas(gambar, ukuran, opsi = {}) {
    const {
      padding = 0,
      transparan = false,
      warnaBg = "#ffffff",
      maskable = false,
    } = opsi;

    const canvas = document.createElement("canvas");
    canvas.width = ukuran;
    canvas.height = ukuran;
    const ctx = canvas.getContext("2d");

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    // Isi background
    if (!transparan) {
      ctx.fillStyle = warnaBg;
      ctx.fillRect(0, 0, ukuran, ukuran);
    }

    // Hitung padding efektif
    // Nilai negatif = zoom in (gambar lebih besar dari canvas, di-crop center)
    // Nilai positif = padding biasa (gambar lebih kecil dari canvas)
    let paddingPersen = padding / 100;

    // Maskable icon: minimum padding 10% per spec
    if (maskable) {
      paddingPersen = Math.max(paddingPersen, 0.1);
    }

    const paddingPx = ukuran * paddingPersen; // bisa negatif!
    const areaBersih = ukuran - paddingPx * 2; // bisa lebih besar dari ukuran!

    const rasioGambar = gambar.naturalWidth / gambar.naturalHeight;
    let gambarW, gambarH;

    if (rasioGambar >= 1) {
      gambarW = areaBersih;
      gambarH = areaBersih / rasioGambar;
    } else {
      gambarH = areaBersih;
      gambarW = areaBersih * rasioGambar;
    }

    // Tengahkan (paddingPx bisa negatif → gambar overflow = zoom in effect)
    const gambarX = paddingPx + (areaBersih - gambarW) / 2;
    const gambarY = paddingPx + (areaBersih - gambarH) / 2;

    ctx.drawImage(gambar, gambarX, gambarY, gambarW, gambarH);

    return canvas;
  },

  /**
   * Bersihkan memori canvas setelah selesai
   * @param {HTMLCanvasElement} canvas
   */
  bersihkanCanvas(canvas) {
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    canvas.width = 0;
    canvas.height = 0;
  },

  /**
   * Validasi file gambar yang diupload
   * @param {File} file
   * @param {HTMLImageElement} gambar
   * @returns {{ valid: boolean, peringatan: string[], error: string|null }}
   */
  validasiFile(file, gambar) {
    const peringatan = [];
    let error = null;

    // Cek format file
    const formatDiizinkan = ["image/png", "image/jpeg", "image/svg+xml"];
    if (!formatDiizinkan.includes(file.type)) {
      error = `Format tidak didukung: ${file.type}. Gunakan PNG, JPG, atau SVG.`;
      return { valid: false, peringatan, error };
    }

    // Cek resolusi minimum
    const minRes = 512;
    if (gambar.naturalWidth < minRes || gambar.naturalHeight < minRes) {
      error = `Resolusi terlalu kecil (${gambar.naturalWidth}×${gambar.naturalHeight}px). Minimum ${minRes}×${minRes}px diperlukan.`;
      return { valid: false, peringatan, error };
    }

    // Peringatan aspek rasio non-square
    const rasio = gambar.naturalWidth / gambar.naturalHeight;
    if (Math.abs(rasio - 1) > 0.05) {
      peringatan.push(
        `Gambar tidak persegi (${gambar.naturalWidth}×${gambar.naturalHeight}px). Disarankan 1:1 untuk hasil terbaik.`
      );
    }

    // Peringatan untuk JPG (kehilangan transparansi)
    if (file.type === "image/jpeg") {
      peringatan.push(
        "JPG tidak mendukung transparansi. Gunakan PNG untuk icon dengan background transparan."
      );
    }

    return { valid: true, peringatan, error };
  },

  /**
   * Konversi SVG ke PNG menggunakan canvas
   * @param {string} svgUrl - Data URL atau URL SVG
   * @param {number} ukuran - Ukuran output
   * @returns {Promise<HTMLImageElement>}
   */
  async svgKePng(svgUrl, ukuran = 512) {
    const gambar = await Format.muatGambar(svgUrl);
    const canvas = this.renderKeCanvas(gambar, ukuran, { transparan: true });
    const dataUrl = canvas.toDataURL("image/png");
    this.bersihkanCanvas(canvas);
    return Format.muatGambar(dataUrl);
  },
};

window.Processor = Processor;
