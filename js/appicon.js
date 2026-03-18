/**
 * appicon.js — Custom App Icon Generator
 * Support: Adaptive Icon (fg+bg), shape masking, Android/iOS/Web output
 */


const ANDROID_DPI = [
  { folder: 'mipmap-mdpi',     ukuran: 48,  adaptive: 108 },
  { folder: 'mipmap-hdpi',     ukuran: 72,  adaptive: 162 },
  { folder: 'mipmap-xhdpi',    ukuran: 96,  adaptive: 216 },
  { folder: 'mipmap-xxhdpi',   ukuran: 144, adaptive: 324 },
  { folder: 'mipmap-xxxhdpi',  ukuran: 192, adaptive: 432 },
];


const IOS_SIZES = [
  { nama: 'AppIcon-20@2x.png',       ukuran: 40  },
  { nama: 'AppIcon-20@2x~ipad.png',  ukuran: 40  },
  { nama: 'AppIcon-20@3x.png',       ukuran: 60  },
  { nama: 'AppIcon-20~ipad.png',     ukuran: 20  },
  { nama: 'AppIcon-29.png',          ukuran: 29  },
  { nama: 'AppIcon-29@2x.png',       ukuran: 58  },
  { nama: 'AppIcon-29@2x~ipad.png',  ukuran: 58  },
  { nama: 'AppIcon-29@3x.png',       ukuran: 87  },
  { nama: 'AppIcon-29~ipad.png',     ukuran: 29  },
  { nama: 'AppIcon-40@2x.png',       ukuran: 80  },
  { nama: 'AppIcon-40@2x~ipad.png',  ukuran: 80  },
  { nama: 'AppIcon-40@3x.png',       ukuran: 120 },
  { nama: 'AppIcon-40~ipad.png',     ukuran: 40  },
  { nama: 'AppIcon-60@2x~car.png',   ukuran: 120 },
  { nama: 'AppIcon-60@3x~car.png',   ukuran: 180 },
  { nama: 'AppIcon-83.5@2x~ipad.png',ukuran: 167 },
  { nama: 'AppIcon@2x.png',          ukuran: 120 },
  { nama: 'AppIcon@2x~ipad.png',     ukuran: 76  },
  { nama: 'AppIcon@3x.png',          ukuran: 180 },
  { nama: 'AppIcon~ios-marketing.png',ukuran: 1024},
  { nama: 'AppIcon~ipad.png',        ukuran: 76  },
];


function buatContentsJson() {
  const images = IOS_SIZES.map(s => {
    const namaBase = s.nama.replace('.png', '');
    let size = '20x20', scale = '1x', idiom = 'iphone', role, subtype;

    // Parse ukuran dari nama file
    if (namaBase.includes('20')) size = '20x20';
    else if (namaBase.includes('29')) size = '29x29';
    else if (namaBase.includes('40')) size = '40x40';
    else if (namaBase.includes('60')) size = '60x60';
    else if (namaBase.includes('83.5')) size = '83.5x83.5';
    else if (namaBase.includes('76')) size = '76x76';
    else if (namaBase.includes('marketing')) size = '1024x1024';
    else size = '60x60';

    if (namaBase.includes('@2x')) scale = '2x';
    else if (namaBase.includes('@3x')) scale = '3x';
    else scale = '1x';

    if (namaBase.includes('ipad')) idiom = 'ipad';
    else if (namaBase.includes('car')) idiom = 'car';
    else if (namaBase.includes('marketing')) idiom = 'ios-marketing';
    else idiom = 'iphone';

    return { idiom, scale, size, filename: s.nama };
  });

  return JSON.stringify({ images, info: { author: 'xcode', version: 1 } }, null, 2);
}


function buatAdaptiveXml(namaFile) {
  return `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@mipmap/${namaFile}_background"/>
    <foreground android:drawable="@mipmap/${namaFile}_foreground"/>
    <monochrome android:drawable="@mipmap/${namaFile}_monochrome"/>
</adaptive-icon>`;
}

/* ═══════════════════════════════════════════
   AppIconGen — Controller utama
═══════════════════════════════════════════ */
const AppIconGen = {

  
  state: {
    fgGambar: null,   // HTMLImageElement foreground
    bgGambar: null,   // HTMLImageElement background (jika type=image)
    bgType: 'color',  // 'color' | 'gradient' | 'image'
    bgColor: '#4ade80',
    gradColor1: '#22c55e',
    gradColor2: '#06b6d4',
    gradAngle: 135,
    shape: 'square',
    padding: 15,
    useMask: true,
    monoColor: '#ffffff',
    filename: 'ic_launcher',
    
    hasil: [],
  },

  
  init() {
    this._initLayerTabs();
    this._initFgUpload();
    this._initBgUpload();
    this._initBgTypeSwitch();
    this._initShapeSelector();
    this._initControls();
    this._initSimBgToggle();
    document.getElementById('aiGenerateBtn').addEventListener('click', () => this.generate());
    document.getElementById('aiDownloadAllBtn').addEventListener('click', () => this.downloadZip());
    // Render preview kosong saat awal
    this._renderPreviews();
 
  },

  
  _initLayerTabs() {
    document.querySelectorAll('.ai-layer-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.ai-layer-tab').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        document.querySelectorAll('.ai-layer-panel').forEach(p => p.classList.add('hidden'));
        const target = btn.dataset.layer === 'foreground' ? 'aiLayerFg' : 'aiLayerBg';
        document.getElementById(target).classList.remove('hidden');
      });
    });
  },

  
  _initFgUpload() {
    const dropZone = document.getElementById('aiFgDropZone');
    const fileInput = document.getElementById('aiFgInput');
    const uploadBtn = document.getElementById('aiFgUploadBtn');
    const pasteBtn = document.getElementById('aiFgPasteBtn');
    const clearBtn = document.getElementById('aiFgClearBtn');

    uploadBtn.addEventListener('click', () => fileInput.click());
    pasteBtn.addEventListener('click', async () => {
      const file = await Clipboard.bacaGambar();
      if (file) this._loadFg(file);
      else Toast.warning('Tidak ada gambar di clipboard.');
    });
    clearBtn.addEventListener('click', (e) => { e.stopPropagation(); this._clearFg(); });
    fileInput.addEventListener('change', e => { if (e.target.files[0]) this._loadFg(e.target.files[0]); e.target.value = ''; });

    dropZone.addEventListener('click', () => fileInput.click());
    this._initDropEvents(dropZone, 'aiFgDragOverlay', file => this._loadFg(file));
  },

  
  _initBgUpload() {
    const dropZone = document.getElementById('aiBgDropZone');
    const fileInput = document.getElementById('aiBgInput');
    const uploadBtn = document.getElementById('aiBgUploadBtn');
    const clearBtn = document.getElementById('aiBgClearBtn');

    uploadBtn.addEventListener('click', () => fileInput.click());
    clearBtn.addEventListener('click', (e) => { e.stopPropagation(); this._clearBg(); });
    fileInput.addEventListener('change', e => { if (e.target.files[0]) this._loadBg(e.target.files[0]); e.target.value = ''; });

    dropZone.addEventListener('click', () => fileInput.click());
    this._initDropEvents(dropZone, 'aiBgDragOverlay', file => this._loadBg(file));
  },

  
  _initDropEvents(zone, overlayId, onDrop) {
    const overlay = document.getElementById(overlayId);
    ['dragenter','dragover'].forEach(evt => zone.addEventListener(evt, e => {
      e.preventDefault();
      zone.classList.add('drag-over');
      if (overlay) { overlay.classList.remove('hidden'); overlay.style.display = 'flex'; }
    }));
    ['dragleave','dragend'].forEach(evt => zone.addEventListener(evt, () => {
      zone.classList.remove('drag-over');
      if (overlay) overlay.classList.add('hidden');
    }));
    zone.addEventListener('drop', e => {
      e.preventDefault();
      zone.classList.remove('drag-over');
      if (overlay) overlay.classList.add('hidden');
      const file = e.dataTransfer.files[0];
      if (file) onDrop(file);
    });
  },

  
  async _loadFg(file) {
    try {
      const dataUrl = await Format.fileKeDataUrl(file);
      const gambar = await Format.muatGambar(dataUrl);

      if (gambar.naturalWidth < 512 || gambar.naturalHeight < 512) {
        Toast.warning(`Resolusi ${gambar.naturalWidth}×${gambar.naturalHeight}px. Disarankan min 512px.`);
      }

      this.state.fgGambar = gambar;
      // Update thumb
      const thumb = document.getElementById('aiFgThumb');
      const dropContent = document.getElementById('aiFgDropContent');
      const previewWrap = document.getElementById('aiFgPreviewWrap');
      const infoEl = document.getElementById('aiFgInfo');

      thumb.src = dataUrl;
      infoEl.textContent = `${gambar.naturalWidth}×${gambar.naturalHeight}px · ${Format.ukuranFile(file.size)}`;
      dropContent.style.display = 'none';
      previewWrap.classList.remove('hidden');
      previewWrap.style.display = 'flex';

      this._renderPreviews();
      Toast.success('Foreground dimuat!');
    } catch (err) {
      Toast.error('Gagal memuat gambar foreground.');
    }
  },

  _clearFg() {
    this.state.fgGambar = null;
    document.getElementById('aiFgThumb').src = '';
    document.getElementById('aiFgDropContent').style.display = '';
    const pw = document.getElementById('aiFgPreviewWrap');
    pw.classList.add('hidden'); pw.style.display = '';
    this._renderPreviews();
  },

  
  async _loadBg(file) {
    try {
      const dataUrl = await Format.fileKeDataUrl(file);
      const gambar = await Format.muatGambar(dataUrl);
      this.state.bgGambar = gambar;

      const thumb = document.getElementById('aiBgThumb');
      const dropContent = document.getElementById('aiBgDropContent');
      const previewWrap = document.getElementById('aiBgPreviewWrap');

      thumb.src = dataUrl;
      dropContent.style.display = 'none';
      previewWrap.classList.remove('hidden');
      previewWrap.style.display = 'flex';

      this._renderPreviews();
      Toast.success('Background dimuat!');
    } catch (err) {
      Toast.error('Gagal memuat gambar background.');
    }
  },

  _clearBg() {
    this.state.bgGambar = null;
    document.getElementById('aiBgThumb').src = '';
    document.getElementById('aiBgDropContent').style.display = '';
    const pw = document.getElementById('aiBgPreviewWrap');
    pw.classList.add('hidden'); pw.style.display = '';
    this._renderPreviews();
  },

  
  _initBgTypeSwitch() {
    document.querySelectorAll('.ai-bg-type-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.ai-bg-type-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.state.bgType = btn.dataset.bgtype;
        document.querySelectorAll('.ai-bgtype-panel').forEach(p => p.classList.add('hidden'));
        const map = { color: 'aiBgTypeColor', gradient: 'aiBgTypeGradient', image: 'aiBgTypeImage' };
        document.getElementById(map[btn.dataset.bgtype])?.classList.remove('hidden');
        this._renderPreviews();
      });
    });

    // Color picker sync
    const bgColor = document.getElementById('aiBgColor');
    const bgHex = document.getElementById('aiBgColorHex');
    bgColor.addEventListener('input', () => { this.state.bgColor = bgColor.value; bgHex.value = bgColor.value; this._renderPreviews(); });
    bgHex.addEventListener('input', debounce(() => {
      if (/^#[0-9A-Fa-f]{6}$/.test(bgHex.value)) { this.state.bgColor = bgHex.value; bgColor.value = bgHex.value; this._renderPreviews(); }
    }, 300));

    // Gradient
    const g1 = document.getElementById('aiGradColor1'), g1h = document.getElementById('aiGradColor1Hex');
    const g2 = document.getElementById('aiGradColor2'), g2h = document.getElementById('aiGradColor2Hex');
    const gAngle = document.getElementById('aiGradAngle'), gAngleVal = document.getElementById('aiGradAngleVal');

    g1.addEventListener('input', () => { this.state.gradColor1 = g1.value; g1h.value = g1.value; this._renderPreviews(); });
    g1h.addEventListener('input', debounce(() => { if (/^#[0-9A-Fa-f]{6}$/.test(g1h.value)) { this.state.gradColor1 = g1h.value; g1.value = g1h.value; this._renderPreviews(); }}, 300));
    g2.addEventListener('input', () => { this.state.gradColor2 = g2.value; g2h.value = g2.value; this._renderPreviews(); });
    g2h.addEventListener('input', debounce(() => { if (/^#[0-9A-Fa-f]{6}$/.test(g2h.value)) { this.state.gradColor2 = g2h.value; g2.value = g2h.value; this._renderPreviews(); }}, 300));
    gAngle.addEventListener('input', () => { this.state.gradAngle = parseInt(gAngle.value); gAngleVal.textContent = `${gAngle.value}°`; this._renderPreviews(); });
  },

  
  _initShapeSelector() {
    document.querySelectorAll('.ai-shape-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.ai-shape-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.state.shape = btn.dataset.shape;
        this._renderPreviews();
      });
    });
  },

  
  _initControls() {
    const slider = document.getElementById('aiPaddingSlider');
    const sliderVal = document.getElementById('aiPaddingVal');
    slider.addEventListener('input', () => {
      const val = parseInt(slider.value);
      this.state.padding = val;
      sliderVal.textContent = `${val > 0 ? '+' : ''}${val}%`;
      this._renderPreviews();
    });

    const maskToggle = document.getElementById('aiMaskToggle');
    maskToggle.addEventListener('click', () => {
      const on = maskToggle.getAttribute('aria-checked') === 'true';
      maskToggle.setAttribute('aria-checked', String(!on));
      this.state.useMask = !on;
      this._renderPreviews();
    });

    const filename = document.getElementById('aiFilename');
    filename.addEventListener('input', () => { this.state.filename = filename.value || 'ic_launcher'; });

    const monoColor = document.getElementById('aiMonoColor');
    const monoHex = document.getElementById('aiMonoColorHex');
    monoColor.addEventListener('input', () => { this.state.monoColor = monoColor.value; monoHex.value = monoColor.value; });
    monoHex.addEventListener('input', debounce(() => {
      if (/^#[0-9A-Fa-f]{6}$/.test(monoHex.value)) { this.state.monoColor = monoHex.value; monoColor.value = monoHex.value; }
    }, 300));
  },

  
  _initSimBgToggle() {
    document.querySelectorAll('.ai-sim-bg-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.ai-sim-bg-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const simContainer = btn.closest('.glass-surface');
        if (btn.dataset.bg === 'light') {
          simContainer.style.background = 'rgba(255,255,255,0.9)';
        } else {
          simContainer.style.background = '';
        }
      });
    });
  },

  /* ════════════════════════════════════════
     CORE RENDER ENGINE
  ════════════════════════════════════════ */

  /**
   * Render satu canvas composite (bg + fg) dengan ukuran tertentu
   * @param {number} ukuran - Ukuran output canvas
   * @param {string} shapeOverride - Override shape (opsional)
   * @returns {HTMLCanvasElement}
   */
  _renderComposite(ukuran, shapeOverride) {
    const canvas = document.createElement('canvas');
    canvas.width = ukuran;
    canvas.height = ukuran;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    const shape = shapeOverride !== undefined ? shapeOverride : this.state.shape;
    const useMask = this.state.useMask && shape !== 'none';

    // Selalu save dulu
    ctx.save();

    // Terapkan clip path SEBELUM menggambar apapun
    if (useMask) {
      this._clipPath(ctx, ukuran, shape);
      ctx.clip();
    }

    // Render background (akan di-clip otomatis kalau clip aktif)
    this._renderBg(ctx, ukuran);

    // Render foreground
    if (this.state.fgGambar) {
      this._renderFgLayer(ctx, ukuran, this.state.fgGambar, this.state.padding);
    }

    // Restore setelah selesai
    ctx.restore();

    return canvas;
  },

  /**
   * Render background layer saja (tanpa fg)
   */
  _renderBgOnly(ukuran) {
    const canvas = document.createElement('canvas');
    canvas.width = ukuran;
    canvas.height = ukuran;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    this._renderBg(ctx, ukuran);
    return canvas;
  },

  /**
   * Render foreground layer saja (transparan bg)
   */
  _renderFgOnly(ukuran) {
    const canvas = document.createElement('canvas');
    canvas.width = ukuran;
    canvas.height = ukuran;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    if (this.state.fgGambar) {
      this._renderFgLayer(ctx, ukuran, this.state.fgGambar, this.state.padding);
    }
    return canvas;
  },

  /**
   * Render monochrome layer (fg di-recolor ke satu warna)
   */
  _renderMonochrome(ukuran) {
    const canvas = document.createElement('canvas');
    canvas.width = ukuran;
    canvas.height = ukuran;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    if (!this.state.fgGambar) return canvas;

    // Render fg dulu
    this._renderFgLayer(ctx, ukuran, this.state.fgGambar, this.state.padding);

    // Recolor: terapkan warna mono ke semua pixel non-transparan
    const imageData = ctx.getImageData(0, 0, ukuran, ukuran);
    const data = imageData.data;
    const r = parseInt(this.state.monoColor.slice(1,3), 16);
    const g = parseInt(this.state.monoColor.slice(3,5), 16);
    const b = parseInt(this.state.monoColor.slice(5,7), 16);

    for (let i = 0; i < data.length; i += 4) {
      if (data[i+3] > 0) { // hanya pixel yg ada alpha
        data[i] = r; data[i+1] = g; data[i+2] = b;
      }
    }
    ctx.putImageData(imageData, 0, 0);
    return canvas;
  },

  
  _renderBg(ctx, ukuran) {
    const { bgType, bgColor, gradColor1, gradColor2, gradAngle, bgGambar } = this.state;

    if (bgType === 'color') {
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, ukuran, ukuran);
    } else if (bgType === 'gradient') {
      // Convert angle to coordinates
      const rad = (gradAngle - 90) * Math.PI / 180;
      const cx = ukuran / 2, cy = ukuran / 2;
      const len = ukuran / 2;
      const x1 = cx - Math.cos(rad) * len, y1 = cy - Math.sin(rad) * len;
      const x2 = cx + Math.cos(rad) * len, y2 = cy + Math.sin(rad) * len;
      const grad = ctx.createLinearGradient(x1, y1, x2, y2);
      grad.addColorStop(0, gradColor1);
      grad.addColorStop(1, gradColor2);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, ukuran, ukuran);
    } else if (bgType === 'image' && bgGambar) {
      // Center crop cover
      const rasio = bgGambar.naturalWidth / bgGambar.naturalHeight;
      let sw, sh, sx, sy;
      if (rasio > 1) { sh = bgGambar.naturalHeight; sw = sh; sx = (bgGambar.naturalWidth - sw) / 2; sy = 0; }
      else { sw = bgGambar.naturalWidth; sh = sw; sx = 0; sy = (bgGambar.naturalHeight - sh) / 2; }
      ctx.drawImage(bgGambar, sx, sy, sw, sh, 0, 0, ukuran, ukuran);
    } else {
      // Default: warna abu-abu
      ctx.fillStyle = '#e5e7eb';
      ctx.fillRect(0, 0, ukuran, ukuran);
    }
  },

  
  _renderFgLayer(ctx, ukuran, gambar, paddingPersen) {
    // paddingPersen bisa negatif → gambar lebih besar dari canvas (zoom in)
    const p = (paddingPersen / 100) * ukuran;
    const area = ukuran - p * 2; // bisa lebih besar dari ukuran jika p negatif

    const rasio = gambar.naturalWidth / gambar.naturalHeight;
    let w, h;
    if (rasio >= 1) { w = area; h = area / rasio; }
    else { h = area; w = area * rasio; }

    // Tengahkan di dalam canvas (koordinat bisa negatif = crop/zoom)
    const x = p + (area - w) / 2;
    const y = p + (area - h) / 2;

    ctx.drawImage(gambar, x, y, w, h);
  },

  
  _clipPath(ctx, ukuran, shape) {
    const s = ukuran;
    ctx.beginPath();

    if (shape === 'circle') {
      // Lingkaran sempurna
      ctx.arc(s / 2, s / 2, s / 2, 0, Math.PI * 2);
      ctx.closePath();

    } else if (shape === 'squircle') {
      // Squircle Android: radius ~46% (lebih bulat dari square)
      const r = s * 0.46;
      ctx.moveTo(s / 2, 0);
      ctx.bezierCurveTo(s, 0, s, 0, s, s / 2);
      ctx.bezierCurveTo(s, s, s, s, s / 2, s);
      ctx.bezierCurveTo(0, s, 0, s, 0, s / 2);
      ctx.bezierCurveTo(0, 0, 0, 0, s / 2, 0);
      ctx.closePath();

    } else if (shape === 'square') {
      // Rounded square, radius ~18%
      const r = s * 0.18;
      ctx.moveTo(r, 0);
      ctx.lineTo(s - r, 0);
      ctx.quadraticCurveTo(s, 0, s, r);
      ctx.lineTo(s, s - r);
      ctx.quadraticCurveTo(s, s, s - r, s);
      ctx.lineTo(r, s);
      ctx.quadraticCurveTo(0, s, 0, s - r);
      ctx.lineTo(0, r);
      ctx.quadraticCurveTo(0, 0, r, 0);
      ctx.closePath();

    } else {
      // 'none' — tidak ada clip, full rect
      ctx.rect(0, 0, s, s);
      ctx.closePath();
    }
  },

  /* ════════════════════════════════════════
     LIVE PREVIEW
  ════════════════════════════════════════ */

  _renderPreviews() {
    // Render di resolusi 2× lalu canvas CSS-scale ke 96px → gambar tajam
    const PREVIEW_RES = 192;
    const SIM_RES = 112;

    const origMask = this.state.useMask;

    // ── 4 shape preview ──
    const shapes = ['square', 'squircle', 'circle'];
    const canvasIds = { square: 'aiPreviewSquare', squircle: 'aiPreviewSquircle', circle: 'aiPreviewCircle' };

    shapes.forEach(shape => {
      this.state.useMask = true;
      const canvas = this._renderComposite(PREVIEW_RES, shape);
      this.state.useMask = origMask;

      const target = document.getElementById(canvasIds[shape]);
      if (target) {
        const ctx = target.getContext('2d');
        ctx.clearRect(0, 0, PREVIEW_RES, PREVIEW_RES);
        ctx.drawImage(canvas, 0, 0);
        Processor.bersihkanCanvas(canvas);
      }
    });

    // ── Foreground only preview ──
    this.state.useMask = false;
    const fgCanvas = this._renderFgOnly(PREVIEW_RES);
    this.state.useMask = origMask;

    const fgTarget = document.getElementById('aiPreviewFg');
    if (fgTarget) {
      const ctx = fgTarget.getContext('2d');
      ctx.clearRect(0, 0, PREVIEW_RES, PREVIEW_RES);
      ctx.drawImage(fgCanvas, 0, 0);
      Processor.bersihkanCanvas(fgCanvas);
    }

    // ── Simulasi homescreen ──
    this.state.useMask = true;
    const simShapeMap = { aiSimAndroid: 'squircle', aiSimIOS: 'squircle', aiSimWeb: 'square' };
    ['aiSimAndroid', 'aiSimIOS', 'aiSimWeb'].forEach(id => {
      const sim = this._renderComposite(SIM_RES, simShapeMap[id]);
      const target = document.getElementById(id);
      if (target) {
        const ctx = target.getContext('2d');
        ctx.clearRect(0, 0, SIM_RES, SIM_RES);
        ctx.drawImage(sim, 0, 0);
        Processor.bersihkanCanvas(sim);
      }
    });
    this.state.useMask = origMask;
  },

  /* ════════════════════════════════════════
     GENERATE & ZIP
  ════════════════════════════════════════ */

  async generate() {
    if (!this.state.fgGambar) {
      Toast.warning('Upload foreground image terlebih dahulu!');
      return;
    }

    const progressSection = document.getElementById('aiProgressSection');
    const progressBar = document.getElementById('aiProgressBar');
    const progressPercent = document.getElementById('aiProgressPercent');
    const progressLabel = document.getElementById('aiProgressLabel');
    const generateBtn = document.getElementById('aiGenerateBtn');
    const resultsSection = document.getElementById('aiResultsSection');

    progressSection.classList.remove('hidden');
    generateBtn.disabled = true;
    generateBtn.textContent = '⏳ Memproses...';
    this.state.hasil = [];

    const filename = this.state.filename;

    try {
      // Hitung total tugas
      const totalAndroid = ANDROID_DPI.length * 4; // composite, fg, bg, mono per DPI
      const totalIos = IOS_SIZES.length;
      const totalWeb = 6;
      const totalMisc = 2; // play store + xml
      const total = totalAndroid + totalIos + totalWeb + totalMisc;
      let selesai = 0;

      const updateProgress = (label) => {
        selesai++;
        const persen = Math.round((selesai / total) * 100);
        progressBar.style.width = `${persen}%`;
        progressPercent.textContent = `${persen}%`;
        progressLabel.textContent = label;
      };

      
      for (const dpi of ANDROID_DPI) {
        await new Promise(r => setTimeout(r, 0)); // yield

        // Composite: gunakan shape yang dipilih user
        const cComposite = this._renderComposite(dpi.ukuran);
        const bComposite = await Format.canvasKeBlob(cComposite, 'image/png');
        this.state.hasil.push({ path: `android/res/${dpi.folder}/${filename}.png`, blob: bComposite, label: `${dpi.folder}/${filename}.png` });
        Processor.bersihkanCanvas(cComposite);
        updateProgress(`Android ${dpi.folder} - composite`);

        // Foreground layer (adaptive, ukuran lebih besar, TANPA mask/shape — layer mentah)
        const cFg = this._renderFgOnly(dpi.adaptive);
        const bFg = await Format.canvasKeBlob(cFg, 'image/png');
        this.state.hasil.push({ path: `android/res/${dpi.folder}/${filename}_foreground.png`, blob: bFg, label: `${dpi.folder}/${filename}_foreground.png` });
        Processor.bersihkanCanvas(cFg);
        updateProgress(`Android ${dpi.folder} - foreground`);

        // Background layer (adaptive, TANPA mask — layer mentah)
        const cBg = this._renderBgOnly(dpi.adaptive);
        const bBg = await Format.canvasKeBlob(cBg, 'image/png');
        this.state.hasil.push({ path: `android/res/${dpi.folder}/${filename}_background.png`, blob: bBg, label: `${dpi.folder}/${filename}_background.png` });
        Processor.bersihkanCanvas(cBg);
        updateProgress(`Android ${dpi.folder} - background`);

        // Monochrome layer
        const cMono = this._renderMonochrome(dpi.adaptive);
        const bMono = await Format.canvasKeBlob(cMono, 'image/png');
        this.state.hasil.push({ path: `android/res/${dpi.folder}/${filename}_monochrome.png`, blob: bMono, label: `${dpi.folder}/${filename}_monochrome.png` });
        Processor.bersihkanCanvas(cMono);
        updateProgress(`Android ${dpi.folder} - monochrome`);
      }

      // Adaptive icon XML
      const xmlBlob = new Blob([buatAdaptiveXml(filename)], { type: 'application/xml' });
      this.state.hasil.push({ path: `android/res/mipmap-anydpi-v26/${filename}.xml`, blob: xmlBlob, label: `mipmap-anydpi-v26/${filename}.xml` });
      updateProgress('Android XML adaptive');

      // Play Store icon (512px, dengan shape user)
      const cStore = this._renderComposite(512);
      const bStore = await Format.canvasKeBlob(cStore, 'image/png');
      this.state.hasil.push({ path: `android/play_store_512.png`, blob: bStore, label: 'play_store_512.png' });
      Processor.bersihkanCanvas(cStore);
      updateProgress('Play Store icon');

      
      for (const iosSize of IOS_SIZES) {
        await new Promise(r => setTimeout(r, 0));
        const cIos = this._renderComposite(iosSize.ukuran, 'none');
        const bIos = await Format.canvasKeBlob(cIos, 'image/png');
        this.state.hasil.push({ path: `ios/${iosSize.nama}`, blob: bIos, label: iosSize.nama });
        Processor.bersihkanCanvas(cIos);
        updateProgress(`iOS ${iosSize.nama}`);
      }

      // iOS Contents.json
      const jsonBlob = new Blob([buatContentsJson()], { type: 'application/json' });
      this.state.hasil.push({ path: 'ios/Contents.json', blob: jsonBlob, label: 'Contents.json' });

      
      await new Promise(r => setTimeout(r, 0));

      // apple-touch-icon 180px — dengan shape user
      const cAti = this._renderComposite(180);
      const bAti = await Format.canvasKeBlob(cAti, 'image/png');
      this.state.hasil.push({ path: 'web/apple-touch-icon.png', blob: bAti, label: 'apple-touch-icon.png' });
      Processor.bersihkanCanvas(cAti);
      updateProgress('Web apple-touch-icon');

      // icon-192 dengan shape user
      const c192 = this._renderComposite(192);
      const b192 = await Format.canvasKeBlob(c192, 'image/png');
      this.state.hasil.push({ path: 'web/icon-192.png', blob: b192, label: 'icon-192.png' });
      Processor.bersihkanCanvas(c192);
      updateProgress('Web icon-192');

      // icon-192-maskable (extra padding, tanpa clip agar safe area aman)
      const origPadding = this.state.padding;
      this.state.padding = Math.max(origPadding, 10);
      const c192m = this._renderComposite(192, 'none');
      const b192m = await Format.canvasKeBlob(c192m, 'image/png');
      this.state.hasil.push({ path: 'web/icon-192-maskable.png', blob: b192m, label: 'icon-192-maskable.png' });
      Processor.bersihkanCanvas(c192m);
      updateProgress('Web icon-192-maskable');

      // icon-512 dengan shape user
      const c512 = this._renderComposite(512);
      const b512 = await Format.canvasKeBlob(c512, 'image/png');
      this.state.hasil.push({ path: 'web/icon-512.png', blob: b512, label: 'icon-512.png' });
      Processor.bersihkanCanvas(c512);
      updateProgress('Web icon-512');

      // icon-512-maskable (tanpa clip, safe area)
      const c512m = this._renderComposite(512, 'none');
      const b512m = await Format.canvasKeBlob(c512m, 'image/png');
      this.state.hasil.push({ path: 'web/icon-512-maskable.png', blob: b512m, label: 'icon-512-maskable.png' });
      Processor.bersihkanCanvas(c512m);
      this.state.padding = origPadding; // restore padding
      updateProgress('Web icon-512-maskable');

      // favicon.ico (16, 32, 48 — shape user)
      const icoCanvases = [16, 32, 48].map(s => this._renderComposite(s));
      const faviconBlob = await IcoEncoder.encode(icoCanvases);
      this.state.hasil.push({ path: 'web/favicon.ico', blob: faviconBlob, label: 'favicon.ico' });
      icoCanvases.forEach(c => Processor.bersihkanCanvas(c));
      updateProgress('Web favicon.ico');

      // README.txt
      const readmeBlob = new Blob([this._buatReadme()], { type: 'text/plain' });
      this.state.hasil.push({ path: 'web/README.txt', blob: readmeBlob, label: 'README.txt' });

      // Tampilkan hasil
      this._tampilkanHasil();
      Toast.success(`${this.state.hasil.length} file berhasil dibuat! 🎉`);

    } catch (err) {
      Logger.error('AppIconGen generate gagal', err);
      Toast.error('Terjadi kesalahan. Coba lagi.');
    } finally {
      progressSection.classList.add('hidden');
      generateBtn.disabled = false;
      generateBtn.textContent = '⚡ Generate App Icon';
    }
  },

  
  _tampilkanHasil() {
    const grid = document.getElementById('aiResultGrid');
    const section = document.getElementById('aiResultsSection');
    const countEl = document.getElementById('aiResultCount');

    grid.innerHTML = '';
    countEl.textContent = `${this.state.hasil.length} file siap didownload`;

    // Tampilkan beberapa preview representatif
    const preview = this.state.hasil.filter(h =>
      h.path.includes('xxxhdpi') || h.path.includes('ios/AppIcon@3x') ||
      h.path.includes('web/icon-512') || h.path.includes('play_store') ||
      h.path.includes('apple-touch') || h.path.includes('favicon.ico')
    ).slice(0, 12);

    preview.forEach(async (item, i) => {
      const div = document.createElement('div');
      div.className = 'icon-card fade-up';
      div.style.animationDelay = `${i * 0.04}s`;

      // Buat preview image
      const url = URL.createObjectURL(item.blob);
      const platformBadge = item.path.startsWith('android') ? 'badge-android' :
                            item.path.startsWith('ios') ? 'badge-pwa' : 'badge-web';
      const platformLabel = item.path.startsWith('android') ? 'android' :
                            item.path.startsWith('ios') ? 'ios' : 'web';

      div.innerHTML = `
        <div class="icon-preview-wrap bg-checkerboard" style="height:80px">
          ${item.path.endsWith('.xml') || item.path.endsWith('.json') || item.path.endsWith('.txt')
            ? `<div class="flex items-center justify-center w-full h-full opacity-30 text-2xl">📄</div>`
            : `<img src="${url}" alt="${item.label}" style="max-width:72px;max-height:72px;object-fit:contain" />`
          }
        </div>
        <p class="text-xs font-mono font-bold truncate mt-2" title="${item.label}">${item.label}</p>
        <div class="flex items-center justify-between mt-1">
          <span class="text-xs opacity-40">${Format.ukuranFile(item.blob.size)}</span>
          <span class="platform-badge ${platformBadge}">${platformLabel}</span>
        </div>
        <button class="icon-card-download-btn" onclick="event.stopPropagation();AppIconGen._downloadSingle('${item.path}')">⬇ Download</button>
      `;
      grid.appendChild(div);
    });

    // Info card jumlah sisanya
    if (this.state.hasil.length > preview.length) {
      const more = document.createElement('div');
      more.className = 'glass-card rounded-2xl p-4 flex flex-col items-center justify-center text-center';
      more.innerHTML = `
        <p class="text-2xl mb-2">+${this.state.hasil.length - preview.length}</p>
        <p class="text-xs opacity-50">file lainnya</p>
        <p class="text-xs opacity-30 mt-1">(termasuk di ZIP)</p>
      `;
      grid.appendChild(more);
    }

    section.classList.remove('hidden');
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  },

  
  _downloadSingle(path) {
    const item = this.state.hasil.find(h => h.path === path);
    if (item) {
      saveAs(item.blob, item.label);
      Toast.success(`${item.label} diunduh!`);
    }
  },

  
  async downloadZip() {
    if (this.state.hasil.length === 0) {
      Toast.warning('Generate icon terlebih dahulu!');
      return;
    }

    const btn = document.getElementById('aiDownloadAllBtn');
    btn.disabled = true;
    btn.textContent = '⏳ Menyiapkan ZIP...';

    try {
      const zip = new JSZip();
      for (const item of this.state.hasil) {
        zip.file(item.path, item.blob);
      }

      const zipBlob = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 },
      });

      saveAs(zipBlob, `${this.state.filename}-icons.zip`);
      Toast.success(`ZIP berhasil dibuat! (${this.state.hasil.length} file)`);
    } catch (err) {
      Logger.error('ZIP gagal', err);
      Toast.error('Gagal membuat ZIP.');
    } finally {
      btn.disabled = false;
      btn.textContent = '📦 Download ZIP Lengkap';
    }
  },

  
  _buatReadme() {
    return `
Generated by AppIconer — https://github.com/afrzxd/AppIconer.git
`;
  },
};

window.AppIconGen = AppIconGen;