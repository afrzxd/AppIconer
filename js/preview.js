/**
 * preview.js — Modul tampilan hasil icon
 * Grid preview, simulasi browser/iOS/Android
 */

const Preview = {
  /* Set nama file yang dipilih untuk download selektif */
  dipilih: new Set(),

  /* Tab aktif saat ini */
  tabAktif: "all",

  /**
   * Render grid semua hasil ikon
   * @param {object[]} hasilIkon - Dari Generator.hasilIkon
   */
  renderGrid(hasilIkon) {
    this.dipilih.clear();
    this.tabAktif = "all";

    const grid = document.getElementById("iconGrid");
    const hitung = document.getElementById("resultCount");

    hitung.textContent = `${hasilIkon.length} icon berhasil dibuat`;
    grid.innerHTML = "";

    hasilIkon.forEach((ikon, i) => {
      const kartu = this._buatKartuIkon(ikon, i);
      grid.appendChild(kartu);
    });

    // Perbarui tombol download terpilih
    this._perbaruiDownloadTerpilih();
  },

  /**
   * Buat elemen kartu ikon
   * @private
   */
  _buatKartuIkon(ikon, indeks) {
    const div = document.createElement("div");
    div.className = "icon-card fade-up";
    div.style.animationDelay = `${indeks * 0.03}s`;
    div.dataset.nama = ikon.nama;
    div.dataset.platform = ikon.platform;

    // Ukuran tampilan kartu berdasarkan ukuran ikon
    const ukuranTampilan = Math.min(ikon.ukuran || 64, 80);
    const ukuranKotak = Math.max(ukuranTampilan, 48);

    const badgeClass =
      {
        web: "badge-web",
        pwa: "badge-pwa",
        android: "badge-android",
        custom: "badge-custom",
      }[ikon.platform] || "badge-custom";

    div.innerHTML = `
      <div class="check-badge">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      </div>
      
      <div class="icon-preview-wrap bg-checkerboard" style="height:${
        ukuranKotak + 16
      }px;">
        <img 
          src="${ikon.dataUrl}" 
          width="${ukuranTampilan}" 
          height="${ikon.tipe === "ico" ? ukuranTampilan : ukuranTampilan}"
          alt="${ikon.label}"
          style="image-rendering: ${
            ikon.ukuran <= 32 ? "pixelated" : "auto"
          }; max-width: 80px; max-height: 80px;"
          loading="lazy"
        />
      </div>
      
      <div class="mt-2">
        <p class="text-xs font-mono font-bold truncate" title="${ikon.nama}">${
      ikon.nama
    }</p>
        <div class="flex items-center justify-between mt-1">
          <span class="text-xs opacity-40">
            ${ikon.tipe === "ico" ? "16/32/48" : `${ikon.ukuran}px`}
          </span>
          <span class="platform-badge ${badgeClass}">${ikon.platform}</span>
        </div>
        <p class="text-xs opacity-30 mt-0.5">${Format.ukuranFile(
          ikon.ukuranFile
        )}</p>
      </div>
      
      <button class="icon-card-download-btn" data-nama="${ikon.nama}">
        ⬇ Download
      </button>
    `;

    // Klik kartu → toggle pilih
    div.addEventListener("click", (e) => {
      if (e.target.classList.contains("icon-card-download-btn")) return;
      this._togglePilih(div, ikon.nama);
    });

    // Tombol download per-ikon
    div
      .querySelector(".icon-card-download-btn")
      .addEventListener("click", (e) => {
        e.stopPropagation();
        Download.satFile(ikon);
      });

    return div;
  },

  /**
   * Toggle seleksi kartu
   * @private
   */
  _togglePilih(el, nama) {
    if (this.dipilih.has(nama)) {
      this.dipilih.delete(nama);
      el.classList.remove("selected");
    } else {
      this.dipilih.add(nama);
      el.classList.add("selected");
    }
    this._perbaruiDownloadTerpilih();
  },

  /**
   * Perbarui visibilitas tombol download terpilih
   * @private
   */
  _perbaruiDownloadTerpilih() {
    const btn = document.getElementById("downloadSelectedBtn");
    if (!btn) return;

    if (this.dipilih.size > 0) {
      btn.classList.remove("hidden");
      btn.textContent = `⬇ Download Terpilih (${this.dipilih.size})`;
    } else {
      btn.classList.add("hidden");
    }
  },

  /**
   * Filter grid berdasarkan platform tab
   * @param {string} platform
   */
  filterTab(platform) {
    this.tabAktif = platform;
    const kartuArr = document.querySelectorAll(".icon-card");

    kartuArr.forEach((kartu) => {
      if (platform === "all" || kartu.dataset.platform === platform) {
        kartu.style.display = "";
      } else {
        kartu.style.display = "none";
      }
    });

    // Perbarui tab aktif
    document.querySelectorAll(".tab-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.tab === platform);
    });
  },

  /**
   * Perbarui simulasi tampilan (favicon, iOS, Android)
   * @param {object[]} hasilIkon
   */
  perbaruiSimulasi(hasilIkon) {
    // Favicon simulation → gunakan 32px
    const favicon32 = hasilIkon.find((h) => h.nama === "favicon-32.png");
    const icon192 = hasilIkon.find((h) => h.nama === "icon-192.png");
    const appleTouchIcon = hasilIkon.find(
      (h) => h.nama === "apple-touch-icon.png"
    );

    const simFavicon = document.getElementById("simFavicon");
    const simIOS = document.getElementById("simIOS");
    const simAndroid = document.getElementById("simAndroid");

    if (simFavicon && favicon32) simFavicon.src = favicon32.dataUrl;
    if (simIOS && appleTouchIcon) simIOS.src = appleTouchIcon.dataUrl;
    if (simAndroid && icon192) simAndroid.src = icon192.dataUrl;
  },

  /**
   * Tampilkan skeleton loading di grid
   * @param {number} jumlah - Jumlah skeleton yang ditampilkan
   */
  tampilkanSkeleton(jumlah = 12) {
    const grid = document.getElementById("iconGrid");
    grid.innerHTML = "";

    for (let i = 0; i < jumlah; i++) {
      const sk = document.createElement("div");
      sk.className = "glass-card rounded-2xl p-3";
      sk.innerHTML = `
        <div class="skeleton w-full aspect-square rounded-xl mb-3"></div>
        <div class="skeleton h-3 w-3/4 mb-2"></div>
        <div class="skeleton h-3 w-1/2"></div>
      `;
      grid.appendChild(sk);
    }
  },

  /**
   * Ambil nama file yang dipilih
   */
  getDipilih() {
    return [...this.dipilih];
  },

  /**
   * Reset state preview
   */
  reset() {
    this.dipilih.clear();
    this.tabAktif = "all";
    const grid = document.getElementById("iconGrid");
    if (grid) grid.innerHTML = "";
  },
};

window.Preview = Preview;
