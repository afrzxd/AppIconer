/**
 * manifest.js — Generator manifest PWA dan HTML snippet
 */

const ManifestGen = {
  /* Data manifest yang bisa diedit user */
  data: {
    name: "My App",
    short_name: "App",
    theme_color: "#22c55e",
    background_color: "#ffffff",
    display: "standalone",
    start_url: "/",
  },

  /**
   * Generate konten site.webmanifest sebagai string JSON
   * @returns {string}
   */
  generate() {
    const hasilIkon = Generator.hasilIkon;

    // Buat daftar icon untuk manifest (ukuran PWA)
    const ikonPwa = hasilIkon
      .filter((h) => h.platform === "pwa")
      .map((h) => {
        const entry = {
          src: h.nama,
          sizes: `${h.ukuran}x${h.ukuran}`,
          type: "image/png",
        };
        if (h.maskable) entry.purpose = "maskable";
        return entry;
      });

    // Tambahkan favicon web juga
    const ikonWeb = hasilIkon
      .filter((h) => h.platform === "web" && h.tipe === "png")
      .map((h) => ({
        src: h.nama,
        sizes: `${h.ukuran}x${h.ukuran}`,
        type: "image/png",
      }));

    const manifest = {
      name: this.data.name,
      short_name: this.data.short_name,
      theme_color: this.data.theme_color,
      background_color: this.data.background_color,
      display: this.data.display,
      start_url: this.data.start_url,
      icons: [...ikonPwa, ...ikonWeb],
    };

    return JSON.stringify(manifest, null, 2);
  },

  /**
   * Generate HTML snippet untuk tag <head>
   * @returns {string}
   */
  generateHTML() {
    const hasilIkon = Generator.hasilIkon;
    const baris = [];

    baris.push(`<!-- Favicon Dasar -->`);
    baris.push(`<link rel="icon" type="image/x-icon" href="/favicon.ico">`);

    const favicon16 = hasilIkon.find((h) => h.nama === "favicon-16.png");
    if (favicon16)
      baris.push(
        `<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16.png">`
      );

    const favicon32 = hasilIkon.find((h) => h.nama === "favicon-32.png");
    if (favicon32)
      baris.push(
        `<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png">`
      );

    const appleTouch = hasilIkon.find((h) => h.nama === "apple-touch-icon.png");
    if (appleTouch)
      baris.push(
        `\n<!-- Apple Touch Icon -->\n<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">`
      );

    baris.push(`\n<!-- PWA Manifest -->`);
    baris.push(`<link rel="manifest" href="/site.webmanifest">`);
    baris.push(`<meta name="theme-color" content="${this.data.theme_color}">`);
    baris.push(`<meta name="apple-mobile-web-app-capable" content="yes">`);
    baris.push(
      `<meta name="apple-mobile-web-app-status-bar-style" content="default">`
    );

    return baris.join("\n");
  },

  /**
   * Buka modal manifest editor + preview
   */
  bukaModalManifest() {
    const manifestStr = this.generate();

    const html = `
      <div class="flex items-center justify-between mb-5">
        <h2 class="font-display font-bold text-xl">Generator Manifest PWA</h2>
        <button onclick="Modal.close()" class="glass-btn p-2 rounded-lg text-lg leading-none">✕</button>
      </div>
      
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
        <div class="manifest-field">
          <label>App Name</label>
          <input type="text" id="mfName" value="${this.data.name}" 
            class="glass-input px-3 py-2 rounded-lg text-sm" />
        </div>
        <div class="manifest-field">
          <label>Short Name</label>
          <input type="text" id="mfShortName" value="${this.data.short_name}" 
            class="glass-input px-3 py-2 rounded-lg text-sm" />
        </div>
        <div class="manifest-field">
          <label>Theme Color</label>
          <div class="flex gap-2">
            <input type="color" id="mfThemeColor" value="${
              this.data.theme_color
            }" 
              class="color-picker h-10 w-14 rounded-lg" />
            <input type="text" id="mfThemeColorHex" value="${
              this.data.theme_color
            }" 
              class="glass-input flex-1 px-3 py-2 rounded-lg text-sm font-mono" />
          </div>
        </div>
        <div class="manifest-field">
          <label>Background Color</label>
          <div class="flex gap-2">
            <input type="color" id="mfBgColor" value="${
              this.data.background_color
            }" 
              class="color-picker h-10 w-14 rounded-lg" />
            <input type="text" id="mfBgColorHex" value="${
              this.data.background_color
            }" 
              class="glass-input flex-1 px-3 py-2 rounded-lg text-sm font-mono" />
          </div>
        </div>
        <div class="manifest-field">
          <label>Display Mode</label>
          <select id="mfDisplay" class="glass-select px-3 py-2 rounded-lg text-sm w-full">
            <option value="standalone" ${
              this.data.display === "standalone" ? "selected" : ""
            }>standalone</option>
            <option value="fullscreen" ${
              this.data.display === "fullscreen" ? "selected" : ""
            }>fullscreen</option>
            <option value="minimal-ui" ${
              this.data.display === "minimal-ui" ? "selected" : ""
            }>minimal-ui</option>
            <option value="browser" ${
              this.data.display === "browser" ? "selected" : ""
            }>browser</option>
          </select>
        </div>
        <div class="manifest-field">
          <label>Start URL</label>
          <input type="text" id="mfStartUrl" value="${this.data.start_url}" 
            class="glass-input px-3 py-2 rounded-lg text-sm font-mono" />
        </div>
      </div>
      
      <div class="flex gap-2 mb-3">
        <button onclick="ManifestGen._updatePreview()" 
          class="primary-btn px-4 py-2 rounded-lg text-sm font-medium">
          🔄 Update Preview
        </button>
        <button onclick="ManifestGen._salinManifest()" 
          class="glass-btn px-4 py-2 rounded-lg text-sm font-medium">
          📋 Salin JSON
        </button>
        <button onclick="ManifestGen._downloadManifest()" 
          class="glass-btn px-4 py-2 rounded-lg text-sm font-medium">
          ⬇ Download
        </button>
      </div>
      
      <pre id="manifestPreview" class="code-block text-xs overflow-x-auto">${this._escapeHtml(
        manifestStr
      )}</pre>
    `;

    Modal.open(html);

    // Sync color pickers
    setTimeout(() => {
      const syncWarna = (pickerId, hexId) => {
        const picker = document.getElementById(pickerId);
        const hex = document.getElementById(hexId);
        if (!picker || !hex) return;
        picker.addEventListener("input", () => {
          hex.value = picker.value;
        });
        hex.addEventListener("input", () => {
          if (/^#[0-9A-Fa-f]{6}$/.test(hex.value)) picker.value = hex.value;
        });
      };
      syncWarna("mfThemeColor", "mfThemeColorHex");
      syncWarna("mfBgColor", "mfBgColorHex");
    }, 50);
  },

  /**
   * Update preview manifest dari form
   * @private
   */
  _updatePreview() {
    this.data.name = document.getElementById("mfName")?.value || this.data.name;
    this.data.short_name =
      document.getElementById("mfShortName")?.value || this.data.short_name;
    this.data.theme_color =
      document.getElementById("mfThemeColorHex")?.value ||
      this.data.theme_color;
    this.data.background_color =
      document.getElementById("mfBgColorHex")?.value ||
      this.data.background_color;
    this.data.display =
      document.getElementById("mfDisplay")?.value || this.data.display;
    this.data.start_url =
      document.getElementById("mfStartUrl")?.value || this.data.start_url;

    const preview = document.getElementById("manifestPreview");
    if (preview) {
      preview.textContent = this.generate();
    }
  },

  /**
   * Salin manifest ke clipboard
   * @private
   */
  async _salinManifest() {
    this._updatePreview();
    const berhasil = await Clipboard.salin(this.generate());
    if (berhasil) Toast.success("Manifest disalin ke clipboard!");
    else Toast.error("Gagal menyalin.");
  },

  /**
   * Download manifest sebagai file
   * @private
   */
  _downloadManifest() {
    this._updatePreview();
    const blob = new Blob([this.generate()], { type: "application/json" });
    saveAs(blob, "site.webmanifest");
    Toast.success("site.webmanifest diunduh!");
  },

  /**
   * Buka modal HTML Snippet
   */
  bukaModalHTML() {
    const snippet = this.generateHTML();

    const html = `
      <div class="flex items-center justify-between mb-5">
        <h2 class="font-display font-bold text-xl">HTML Snippet</h2>
        <button onclick="Modal.close()" class="glass-btn p-2 rounded-lg text-lg leading-none">✕</button>
      </div>
      
      <p class="text-sm opacity-60 mb-4">
        Salin snippet berikut dan tempelkan di dalam tag <code class="font-mono text-forge-400">&lt;head&gt;</code> halaman HTML kamu.
      </p>
      
      <div class="flex gap-2 mb-3">
        <button onclick="ManifestGen._salinSnippet()" 
          class="primary-btn px-4 py-2 rounded-lg text-sm font-semibold">
          📋 Salin ke Clipboard
        </button>
      </div>
      
      <pre id="htmlSnippetPreview" class="code-block text-xs overflow-x-auto">${this._escapeHtml(
        snippet
      )}</pre>
    `;

    Modal.open(html);
  },

  /**
   * Salin HTML snippet
   * @private
   */
  async _salinSnippet() {
    const berhasil = await Clipboard.salin(this.generateHTML());
    if (berhasil) Toast.success("HTML snippet disalin!");
    else Toast.error("Gagal menyalin.");
  },

  /**
   * Escape HTML untuk tampilan di pre tag
   * @private
   */
  _escapeHtml(str) {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  },
};

window.ManifestGen = ManifestGen;
