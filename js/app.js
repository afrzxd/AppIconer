/**
 * app.js — Controller utama aplikasi IconForge
 * Menghubungkan semua modul: upload, proses, preview, download
 */

/* ── State Aplikasi ── */
const State = {
  /* Gambar sumber yang sudah dimuat */
  gambar: null,
  /* File asli */
  file: null,
  /* Pengaturan saat ini */
  pengaturan: {
    padding: 0,
    transparan: false,
    warnaBg: "#ffffff",
    maskable: false,
    preset: "all",
    ukuranCustom: [],
  },
  /* Apakah hasil sudah digenerate */
  sudahGenerate: false,
};

/* ── Inisialisasi Aplikasi ── */
function initApp() {
  initUpload();
  initKontrol();
  initTab();
  initSimulasi();
  initTheme();
  Logger.info("IconForge siap digunakan ✓");
}

/* ═══════════════════════════════════════
   UPLOAD & VALIDASI
═══════════════════════════════════════ */

function initUpload() {
  const dropZone = document.getElementById("dropZone");
  const fileInput = document.getElementById("fileInput");
  const uploadBtn = document.getElementById("uploadBtn");
  const pasteBtn = document.getElementById("pasteBtn");

  // Klik upload button
  uploadBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    fileInput.click();
  });

  // Klik drop zone
  dropZone.addEventListener("click", () => fileInput.click());
  dropZone.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") fileInput.click();
  });

  // File dipilih dari dialog
  fileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) prosesFileUpload(file);
    e.target.value = ""; // Reset agar bisa upload file sama lagi
  });

  // Paste dari clipboard
  pasteBtn.addEventListener("click", async (e) => {
    e.stopPropagation();
    await handlePaste();
  });

  // Paste keyboard Ctrl+V
  document.addEventListener("paste", async (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) await prosesFileUpload(file);
        return;
      }
    }
  });

  // Drag & Drop events
  ["dragenter", "dragover"].forEach((evt) => {
    dropZone.addEventListener(evt, (e) => {
      e.preventDefault();
      dropZone.classList.add("drag-over");
      document.getElementById("dragOverlay").classList.remove("hidden");
    });
  });

  ["dragleave", "dragend"].forEach((evt) => {
    dropZone.addEventListener(evt, () => {
      dropZone.classList.remove("drag-over");
      document.getElementById("dragOverlay").classList.add("hidden");
    });
  });

  dropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropZone.classList.remove("drag-over");
    document.getElementById("dragOverlay").classList.add("hidden");

    const files = e.dataTransfer.files;
    if (files.length > 0) prosesFileUpload(files[0]);
  });
}

/**
 * Paste gambar dari clipboard
 */
async function handlePaste() {
  try {
    const file = await Clipboard.bacaGambar();
    if (file) {
      await prosesFileUpload(file);
    } else {
      Toast.warning(
        "Tidak ada gambar di clipboard. Salin gambar terlebih dahulu."
      );
    }
  } catch (err) {
    Toast.error(
      "Gagal membaca clipboard. Pastikan permission browser diizinkan."
    );
  }
}

/**
 * Proses file yang diupload: validasi → muat → tampilkan workspace
 * @param {File} file
 */
async function prosesFileUpload(file) {
  try {
    // Muat gambar dari file
    const dataUrl = await Format.fileKeDataUrl(file);
    const gambar = await Format.muatGambar(dataUrl);

    // Validasi file
    const { valid, peringatan, error } = Processor.validasiFile(file, gambar);

    if (!error) {
      // Tampilkan peringatan (jika ada) tapi tetap lanjut
      peringatan.forEach((p) => Toast.warning(p));
    } else {
      Toast.error(error);
      return;
    }

    // Simpan ke state
    State.gambar = gambar;
    State.file = file;
    State.sudahGenerate = false;

    // Tampilkan preview
    tampilkanPreviewGambar(gambar, file);

    // Tampilkan workspace
    tampilkanWorkspace();

    Toast.success(`Gambar siap: ${file.name}`);
  } catch (err) {
    Logger.error("Gagal memproses file", err);
    Toast.error("Gagal memuat gambar. Pastikan file valid.");
  }
}

/**
 * Render live preview canvas berdasarkan pengaturan aktif
 */
const renderLivePreview = debounce(() => {
  if (!State.gambar) return;

  const wrap = document.getElementById("livePreviewWrap");
  const canvas = document.getElementById("livePreviewCanvas");
  if (!canvas || !wrap) return;

  // Sesuaikan ukuran canvas dengan wrap
  const wrapSize = wrap.clientWidth || 256;
  canvas.width = wrapSize;
  canvas.height = wrapSize;

  const hasil = Processor.renderKeCanvas(State.gambar, wrapSize, {
    padding: State.pengaturan.padding,
    transparan: State.pengaturan.transparan,
    warnaBg: State.pengaturan.warnaBg,
    maskable: State.pengaturan.maskable,
  });

  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, wrapSize, wrapSize);
  ctx.drawImage(hasil, 0, 0);
  Processor.bersihkanCanvas(hasil);
}, 80); // 80ms debounce agar responsif tapi tidak terlalu sering

/**
 * Tampilkan gambar di panel preview
 */
function tampilkanPreviewGambar(gambar, file) {
  // Tidak lagi menggunakan <img>, pakai canvas live preview
  const infoEl = document.getElementById("imageInfo");

  infoEl.innerHTML = `
    <div class="info-row">
      <span class="opacity-60">Nama</span>
      <span class="font-medium truncate max-w-[140px]" title="${file.name}">${
    file.name
  }</span>
    </div>
    <div class="info-row">
      <span class="opacity-60">Resolusi</span>
      <span class="font-medium">${gambar.naturalWidth}×${
    gambar.naturalHeight
  }px</span>
    </div>
    <div class="info-row">
      <span class="opacity-60">Ukuran</span>
      <span class="font-medium">${Format.ukuranFile(file.size)}</span>
    </div>
    <div class="info-row">
      <span class="opacity-60">Format</span>
      <span class="font-medium">${file.type.split("/")[1].toUpperCase()}</span>
    </div>
  `;

  // Render live preview
  setTimeout(renderLivePreview, 50);
}

/**
 * Tampilkan workspace dan sembunyikan bagian upload/hero
 */
function tampilkanWorkspace() {
  const workspace = document.getElementById("workspace");
  const heroSection = document.getElementById("heroSection");
  const featureCards = document.getElementById("featureCards");
  const resetBtn = document.getElementById("resetBtn");

  heroSection.classList.add("hidden");
  featureCards.classList.add("hidden");
  workspace.classList.remove("hidden");
  resetBtn.classList.remove("hidden");

  // Sembunyikan results jika ada dari generate sebelumnya
  document.getElementById("resultsSection").classList.add("hidden");
  document.getElementById("progressSection").classList.add("hidden");

  // Scroll ke workspace lalu render live preview (perlu delay untuk layout)
  workspace.scrollIntoView({ behavior: "smooth", block: "start" });
  setTimeout(renderLivePreview, 150);
}

/* ═══════════════════════════════════════
   KONTROL UI
═══════════════════════════════════════ */

function initKontrol() {
  // Padding slider
  const slider = document.getElementById("paddingSlider");
  const sliderLabel = document.getElementById("paddingValue");

  slider.addEventListener("input", () => {
    const val = parseInt(slider.value);
    State.pengaturan.padding = val;
    sliderLabel.textContent = `${val > 0 ? "+" : ""}${val}%`;
    renderLivePreview();
  });

  // Background color picker
  const bgPicker = document.getElementById("bgColorPicker");
  const bgHex = document.getElementById("bgColorHex");

  bgPicker.addEventListener("input", () => {
    State.pengaturan.warnaBg = bgPicker.value;
    bgHex.value = bgPicker.value;
    renderLivePreview();
  });

  bgHex.addEventListener(
    "input",
    debounce(() => {
      if (/^#[0-9A-Fa-f]{6}$/.test(bgHex.value)) {
        State.pengaturan.warnaBg = bgHex.value;
        bgPicker.value = bgHex.value;
        renderLivePreview();
      }
    }, 400)
  );

  // Toggle transparent
  const toggleTransp = document.getElementById("transparentToggle");
  toggleTransp.addEventListener("click", () => {
    const aktif = toggleTransp.getAttribute("aria-checked") === "true";
    toggleTransp.setAttribute("aria-checked", String(!aktif));
    State.pengaturan.transparan = !aktif;

    bgPicker.disabled = !aktif;
    bgHex.disabled = !aktif;
    bgPicker.style.opacity = !aktif ? "0.4" : "1";
    bgHex.style.opacity = !aktif ? "0.4" : "1";

    renderLivePreview();
  });

  // Toggle maskable
  const toggleMaskable = document.getElementById("maskableToggle");
  toggleMaskable.addEventListener("click", () => {
    const aktif = toggleMaskable.getAttribute("aria-checked") === "true";
    toggleMaskable.setAttribute("aria-checked", String(!aktif));
    State.pengaturan.maskable = !aktif;
    renderLivePreview();
  });

  // Preset selector
  const presetSel = document.getElementById("presetSelector");
  presetSel.addEventListener("change", () => {
    State.pengaturan.preset = presetSel.value;
  });

  // Custom size input
  const customInput = document.getElementById("customSizeInput");
  const addCustomBtn = document.getElementById("addCustomSizeBtn");

  addCustomBtn.addEventListener("click", () => tambahUkuranCustom(customInput));
  customInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") tambahUkuranCustom(customInput);
  });

  // Generate button
  const generateBtn = document.getElementById("generateBtn");
  generateBtn.addEventListener("click", handleGenerate);

  // Download buttons
  document
    .getElementById("downloadAllBtn")
    .addEventListener("click", () => Download.semuaFile());
  document
    .getElementById("downloadSelectedBtn")
    .addEventListener("click", () => {
      const dipilih = Preview.getDipilih();
      Download.terpilih(dipilih);
    });
  document
    .getElementById("generateManifestBtn")
    .addEventListener("click", () => ManifestGen.bukaModalManifest());
  document
    .getElementById("generateHTMLBtn")
    .addEventListener("click", () => ManifestGen.bukaModalHTML());

  // Reset button
  document.getElementById("resetBtn").addEventListener("click", resetAplikasi);
}

/**
 * Tambah ukuran custom ke daftar
 * @param {HTMLInputElement} input
 */
function tambahUkuranCustom(input) {
  const nilai = parseInt(input.value);

  if (isNaN(nilai) || nilai < 16 || nilai > 2048) {
    Toast.warning("Ukuran harus antara 16px dan 2048px.");
    return;
  }

  if (State.pengaturan.ukuranCustom.includes(nilai)) {
    Toast.info(`Ukuran ${nilai}px sudah ada.`);
    return;
  }

  State.pengaturan.ukuranCustom.push(nilai);
  input.value = "";
  renderDaftarUkuranCustom();
  Toast.info(`Ukuran ${nilai}px ditambahkan.`);
}

/**
 * Render tag ukuran custom di UI
 */
function renderDaftarUkuranCustom() {
  const container = document.getElementById("customSizesList");
  container.innerHTML = "";

  State.pengaturan.ukuranCustom.forEach((ukuran) => {
    const tag = document.createElement("span");
    tag.className = "size-tag";
    tag.innerHTML = `
      ${ukuran}px
      <span class="remove-size">✕</span>
    `;
    tag.addEventListener("click", () => {
      State.pengaturan.ukuranCustom = State.pengaturan.ukuranCustom.filter(
        (u) => u !== ukuran
      );
      renderDaftarUkuranCustom();
    });
    container.appendChild(tag);
  });
}

/* ═══════════════════════════════════════
   GENERATE
═══════════════════════════════════════ */

/**
 * Handler utama tombol Generate
 */
async function handleGenerate() {
  if (!State.gambar) {
    Toast.warning("Upload gambar terlebih dahulu!");
    return;
  }

  if (Generator.sedangProses) return;

  // Tampilkan progress
  const progressSection = document.getElementById("progressSection");
  const progressBar = document.getElementById("progressBar");
  const progressPercent = document.getElementById("progressPercent");
  const progressLabel = document.getElementById("progressLabel");
  const resultsSection = document.getElementById("resultsSection");
  const generateBtn = document.getElementById("generateBtn");

  progressSection.classList.remove("hidden");
  resultsSection.classList.add("hidden");
  generateBtn.disabled = true;
  generateBtn.textContent = "⏳ Memproses...";

  // Tampilkan skeleton di grid
  Preview.tampilkanSkeleton(8);
  resultsSection.classList.remove("hidden");

  try {
    await Generator.generate(State.gambar, State.pengaturan, (persen) => {
      progressBar.style.width = `${persen}%`;
      progressPercent.textContent = `${persen}%`;
      progressLabel.textContent = `Memproses icon... ${persen}%`;
    });

    // Render hasil
    Preview.renderGrid(Generator.hasilIkon);
    Preview.perbaruiSimulasi(Generator.hasilIkon);

    State.sudahGenerate = true;

    Toast.success(`${Generator.hasilIkon.length} icon berhasil dibuat! 🎉`);
  } catch (err) {
    Logger.error("Generate gagal", err);
    Toast.error("Terjadi kesalahan saat memproses. Coba lagi.");
  } finally {
    progressSection.classList.add("hidden");
    generateBtn.disabled = false;
    generateBtn.textContent = "⚡ Generate Semua Icon";
  }
}

/* ═══════════════════════════════════════
   TABS
═══════════════════════════════════════ */

function initTab() {
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      Preview.filterTab(btn.dataset.tab);
    });
  });
}

/* ═══════════════════════════════════════
   SIMULASI BACKGROUND
═══════════════════════════════════════ */

function initSimulasi() {
  document.querySelectorAll(".sim-bg-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document
        .querySelectorAll(".sim-bg-btn")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      const simContainer = btn.closest(".glass-card");
      if (btn.dataset.bg === "light") {
        simContainer.style.background = "rgba(255,255,255,0.9)";
        simContainer.style.color = "#0f172a";
      } else {
        simContainer.style.background = "";
        simContainer.style.color = "";
      }
    });
  });
}

/* ═══════════════════════════════════════
   TEMA
═══════════════════════════════════════ */

function initTheme() {
  const toggle = document.getElementById("themeToggle");
  const sunIcon = document.getElementById("sunIcon");
  const moonIcon = document.getElementById("moonIcon");
  const html = document.documentElement;

  // Baca preferensi tersimpan
  const temaDisimpan = localStorage.getItem("iconforge-tema") || "dark";
  terapkanTema(temaDisimpan);

  toggle.addEventListener("click", () => {
    const temaSaatIni = html.getAttribute("data-theme");
    const temaBaru = temaSaatIni === "dark" ? "light" : "dark";
    terapkanTema(temaBaru);
    localStorage.setItem("iconforge-tema", temaBaru);
  });

  function terapkanTema(tema) {
    html.setAttribute("data-theme", tema);
    if (tema === "light") {
      sunIcon.classList.remove("hidden");
      moonIcon.classList.add("hidden");
    } else {
      sunIcon.classList.add("hidden");
      moonIcon.classList.remove("hidden");
    }
  }
}

/* ═══════════════════════════════════════
   RESET
═══════════════════════════════════════ */

function resetAplikasi() {
  State.gambar = null;
  State.file = null;
  State.sudahGenerate = false;
  State.pengaturan = {
    padding: 0,
    transparan: false,
    warnaBg: "#ffffff",
    maskable: false,
    preset: "all",
    ukuranCustom: [],
  };

  Generator.reset();
  Preview.reset();

  // Reset UI controls
  document.getElementById("paddingSlider").value = 0;
  document.getElementById("paddingValue").textContent = "0%";
  document.getElementById("bgColorPicker").value = "#ffffff";
  document.getElementById("bgColorHex").value = "#ffffff";
  document
    .getElementById("transparentToggle")
    .setAttribute("aria-checked", "false");
  document
    .getElementById("maskableToggle")
    .setAttribute("aria-checked", "false");
  document.getElementById("presetSelector").value = "all";
  document.getElementById("customSizesList").innerHTML = "";
  document.getElementById("customSizeInput").value = "";

  // Bersihkan live preview canvas
  const liveCanvas = document.getElementById("livePreviewCanvas");
  if (liveCanvas) {
    const ctx = liveCanvas.getContext("2d");
    ctx.clearRect(0, 0, liveCanvas.width, liveCanvas.height);
  }

  // Reset simulasi
  ["simFavicon", "simIOS", "simAndroid"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.src = "";
  });

  // Kembalikan tampilan awal
  document.getElementById("workspace").classList.add("hidden");
  document.getElementById("heroSection").classList.remove("hidden");
  document.getElementById("featureCards").classList.remove("hidden");
  document.getElementById("resetBtn").classList.add("hidden");
  document.getElementById("resultsSection").classList.add("hidden");
  document.getElementById("progressSection").classList.add("hidden");
  document.getElementById("imageInfo").innerHTML = "";

  // Scroll ke atas
  window.scrollTo({ top: 0, behavior: "smooth" });
  Toast.info("Aplikasi direset. Upload gambar baru untuk mulai lagi.");
}

/* ── Start ── */
document.addEventListener("DOMContentLoaded", () => {
  initApp();
  initNavTabs();
});

/* ── Nav Tab Routing ── */
function initNavTabs() {
  document.querySelectorAll(".nav-tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const page = btn.dataset.page;
      document
        .querySelectorAll(".nav-tab-btn")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      if (page === "converter") {
        document.getElementById("pageConverter").classList.remove("hidden");
        document.getElementById("pageAppIcon").classList.add("hidden");
        // Tampilkan elemen khusus converter
        document
          .querySelectorAll(".converter-only")
          .forEach((el) => el.classList.remove("hidden"));
      } else if (page === "appicon") {
        document.getElementById("pageConverter").classList.add("hidden");
        document.getElementById("pageAppIcon").classList.remove("hidden");
        // Sembunyikan elemen khusus converter
        document
          .querySelectorAll(".converter-only")
          .forEach((el) => el.classList.add("hidden"));
        // Init AppIconGen saat pertama kali dibuka
        if (!AppIconGen._initialized) {
          AppIconGen.init();
          AppIconGen._initialized = true;
        }
      }
    });
  });
}
