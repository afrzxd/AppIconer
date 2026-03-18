/**
 * utils.js — Fungsi utilitas global
 * Toast, Modal, Logger, Helper umum
 */

/* ── Logger ── */
const Logger = {
  info: (msg, data) => console.log(`[IconForge] ${msg}`, data || ""),
  warn: (msg, data) => console.warn(`[IconForge] ⚠ ${msg}`, data || ""),
  error: (msg, err) => console.error(`[IconForge] ✕ ${msg}`, err || ""),
};

/* ── Toast System ── */
const Toast = {
  container: null,

  init() {
    this.container = document.getElementById("toastContainer");
  },

  show(pesan, tipe = "info", durasi = 3500) {
    if (!this.container) this.init();

    const ikon = { success: "✓", error: "✕", warning: "⚠", info: "ℹ" };
    const el = document.createElement("div");
    el.className = `toast toast-${tipe}`;
    el.innerHTML = `
      <span style="font-weight:700;font-size:16px;flex-shrink:0">${
        ikon[tipe] || ikon.info
      }</span>
      <span>${pesan}</span>
    `;

    this.container.appendChild(el);

    // Auto remove
    setTimeout(() => {
      el.classList.add("hiding");
      setTimeout(() => el.remove(), 350);
    }, durasi);
  },

  success: (msg) => Toast.show(msg, "success"),
  error: (msg) => Toast.show(msg, "error", 5000),
  warning: (msg) => Toast.show(msg, "warning", 4000),
  info: (msg) => Toast.show(msg, "info"),
};

// Init toast saat DOM siap
document.addEventListener("DOMContentLoaded", () => Toast.init());

/* ── Modal System ── */
const Modal = {
  overlay: null,
  content: null,
  body: null,

  init() {
    this.overlay = document.getElementById("modalOverlay");
    this.content = document.getElementById("modalContent");
    this.body = document.getElementById("modalBody");

    // Tutup saat klik overlay
    this.overlay.addEventListener("click", (e) => {
      if (e.target === this.overlay) this.close();
    });

    // Tutup dengan Escape
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") this.close();
    });
  },

  /**
   * Buka modal dengan konten HTML
   * @param {string} htmlKonten - Konten HTML yang akan ditampilkan
   */
  open(htmlKonten) {
    if (!this.overlay) this.init();
    this.body.innerHTML = htmlKonten;
    this.overlay.classList.add("open");
    document.body.style.overflow = "hidden";
  },

  close() {
    if (!this.overlay) return;
    this.overlay.classList.remove("open");
    document.body.style.overflow = "";
    setTimeout(() => {
      if (this.body) this.body.innerHTML = "";
    }, 300);
  },
};

document.addEventListener("DOMContentLoaded", () => Modal.init());

/* ── Clipboard Helper ── */
const Clipboard = {
  /**
   * Salin teks ke clipboard
   * @param {string} teks
   * @returns {Promise<boolean>}
   */
  async salin(teks) {
    try {
      await navigator.clipboard.writeText(teks);
      return true;
    } catch (err) {
      // Fallback ke execCommand untuk browser lama
      const el = document.createElement("textarea");
      el.value = teks;
      el.style.position = "fixed";
      el.style.left = "-9999px";
      document.body.appendChild(el);
      el.select();
      const berhasil = document.execCommand("copy");
      document.body.removeChild(el);
      return berhasil;
    }
  },

  /**
   * Baca gambar dari clipboard
   * @returns {Promise<File|null>}
   */
  async bacaGambar() {
    try {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        for (const tipe of item.types) {
          if (tipe.startsWith("image/")) {
            const blob = await item.getType(tipe);
            return new File([blob], `paste.${tipe.split("/")[1]}`, {
              type: tipe,
            });
          }
        }
      }
      return null;
    } catch (err) {
      Logger.warn("Tidak bisa baca clipboard", err);
      return null;
    }
  },
};

/* ── Format Helper ── */
const Format = {
  /**
   * Format ukuran byte menjadi string mudah dibaca
   * @param {number} bytes
   */
  ukuranFile(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  },

  /**
   * Konversi canvas ke Blob
   * @param {HTMLCanvasElement} canvas
   * @param {string} tipe - MIME type
   * @param {number} kualitas - 0-1
   */
  canvasKeBlob(canvas, tipe = "image/png", kualitas = 1) {
    return new Promise((resolve) => {
      canvas.toBlob(resolve, tipe, kualitas);
    });
  },

  /**
   * Konversi Blob ke Data URL
   * @param {Blob} blob
   */
  blobKeDataUrl(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  },

  /**
   * Konversi File ke Data URL
   * @param {File} file
   */
  fileKeDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  },

  /**
   * Konversi File ke Image Element
   * @param {File|string} sumber - File atau Data URL
   */
  muatGambar(sumber) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Gagal memuat gambar"));

      if (typeof sumber === "string") {
        img.src = sumber;
      } else {
        const url = URL.createObjectURL(sumber);
        img.src = url;
        img.addEventListener("load", () => URL.revokeObjectURL(url), {
          once: true,
        });
      }
    });
  },
};

/* ── Throttle & Debounce ── */
function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

/* ── Ekspor global ── */
window.Logger = Logger;
window.Toast = Toast;
window.Modal = Modal;
window.Clipboard = Clipboard;
window.Format = Format;
window.debounce = debounce;
