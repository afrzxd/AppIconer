/**
 * download.js — Modul download file
 * Download satu file, download terpilih, download semua (ZIP)
 */

const Download = {
  /**
   * Download satu ikon
   * @param {object} ikon - Objek ikon dari Generator.hasilIkon
   */
  satFile(ikon) {
    try {
      saveAs(ikon.blob, ikon.nama);
      Toast.success(`${ikon.nama} diunduh!`);
    } catch (err) {
      Logger.error('Gagal download file', err);
      Toast.error('Gagal mengunduh file.');
    }
  },

  /**
   * Download ikon-ikon yang dipilih sebagai ZIP
   * @param {string[]} namaFileTerpilih - Array nama file yang dipilih
   */
  async terpilih(namaFileTerpilih) {
    if (namaFileTerpilih.length === 0) {
      Toast.warning('Pilih icon terlebih dahulu.');
      return;
    }

    const hasilIkon = Generator.hasilIkon;
    const terpilih = hasilIkon.filter(h => namaFileTerpilih.includes(h.nama));

    if (terpilih.length === 1) {
      this.satFile(terpilih[0]);
      return;
    }

    await this._buatZip(terpilih, 'icons-terpilih.zip');
  },

  /**
   * Download semua ikon sebagai ZIP lengkap
   */
  async semuaFile() {
    const hasilIkon = Generator.hasilIkon;

    if (hasilIkon.length === 0) {
      Toast.warning('Belum ada icon yang dibuat.');
      return;
    }

    const btn = document.getElementById('downloadAllBtn');
    if (btn) {
      btn.disabled = true;
      btn.textContent = '⏳ Menyiapkan ZIP...';
    }

    try {
      await this._buatZip(hasilIkon, 'icon-AppIconer-output.zip', true);
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = '📦 Download Semua (ZIP)';
      }
    }
  },

  /**
   * Buat file ZIP dari array ikon
   * @private
   * @param {object[]} daftarIkon
   * @param {string} namaZip
   * @param {boolean} includeReadme - Sertakan README.txt dan file-list.txt
   */
  async _buatZip(daftarIkon, namaZip = 'icons.zip', includeReadme = false) {
    try {
      const zip = new JSZip();

      // Tambahkan semua ikon ke ZIP berdasarkan folder platform
      for (const ikon of daftarIkon) {
        const folderNama = this._folderDarPlatform(ikon.platform);
        zip.folder(folderNama).file(ikon.nama, ikon.blob);
      }

      if (includeReadme) {
        zip.file('README.txt', this._buatReadme(daftarIkon));
        zip.file('file-list.txt', this._buatDaftarFile(daftarIkon));

        // Tambah manifest jika ada
        const manifest = ManifestGen.generate();
        if (manifest) {
          zip.folder('pwa').file('site.webmanifest', manifest);
        }
      }

      const blob = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 },
      });

      saveAs(blob, namaZip);
      Toast.success(`ZIP berhasil dibuat! (${daftarIkon.length} icon)`);

    } catch (err) {
      Logger.error('Gagal membuat ZIP', err);
      Toast.error('Gagal membuat file ZIP. Coba lagi.');
    }
  },

  /**
   * Tentukan folder berdasarkan platform
   * @private
   */
  _folderDarPlatform(platform) {
    const map = {
      web: 'web',
      pwa: 'pwa',
      android: 'android',
      custom: 'custom',
    };
    return map[platform] || 'icons';
  },

  /**
   * Generate konten README.txt
   * @private
   */
  _buatReadme(daftarIkon) {
    const waktu = new Date().toLocaleString('id-ID', {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });

    const grupPlatform = {};
    daftarIkon.forEach(ikon => {
      if (!grupPlatform[ikon.platform]) grupPlatform[ikon.platform] = [];
      grupPlatform[ikon.platform].push(ikon);
    });

    let konten = `
╔══════════════════════════════════════════════════╗
║           AppIconer — HASIL KONVERSI            ║
╚══════════════════════════════════════════════════╝

Dibuat: ${waktu}
Total Icon: ${daftarIkon.length} file
Generator: AppIconer (https://github.com/afrzxd/AppIconer.git)

══════════════════════════════════════════════════
STRUKTUR FOLDER
══════════════════════════════════════════════════

`;

    for (const [platform, ikonArr] of Object.entries(grupPlatform)) {
      konten += `📁 ${platform}/\n`;
      ikonArr.forEach(ikon => {
        konten += `   ├── ${ikon.nama} (${ikon.tipe === 'ico' ? '16/32/48px' : `${ikon.ukuran}px`}) — ${Format.ukuranFile(ikon.ukuranFile)}\n`;
      });
      konten += '\n';
    }

    konten += `
══════════════════════════════════════════════════
CARA PENGGUNAAN
══════════════════════════════════════════════════

1. WEB (folder web/)
   Letakkan file favicon.ico dan favicon-*.png di root website.
   Tambahkan di <head> HTML:

   <link rel="icon" type="image/x-icon" href="/favicon.ico">
   <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png">
   <link rel="apple-touch-icon" href="/apple-touch-icon.png">

2. PWA (folder pwa/)
   Letakkan icon-*.png dan site.webmanifest di root website.
   Tambahkan di <head> HTML:

   <link rel="manifest" href="/site.webmanifest">

3. ANDROID (folder android/)
   Salin icon ke folder res/mipmap-* sesuai DPI:
   - 48px → mipmap-mdpi
   - 72px → mipmap-hdpi
   - 96px → mipmap-xhdpi
   - 144px → mipmap-xxhdpi
   - 192px → mipmap-xxxhdpi

══════════════════════════════════════════════════
Dibuat dengan AppIconer — Privacy-First Icon Converter
100% Client-Side · Tanpa Upload · Open Source
══════════════════════════════════════════════════
`;

    return konten.trim();
  },

  /**
   * Generate daftar file ringkas
   * @private
   */
  _buatDaftarFile(daftarIkon) {
    const baris = daftarIkon.map(ikon =>
      `${ikon.platform.padEnd(10)} | ${String(ikon.tipe === 'ico' ? 'ico' : `${ikon.ukuran}px`).padEnd(8)} | ${Format.ukuranFile(ikon.ukuranFile).padEnd(10)} | ${ikon.nama}`
    );

    return [
      'Platform   | Ukuran   | Size       | Nama File',
      '-'.repeat(60),
      ...baris,
    ].join('\n');
  },
};

window.Download = Download;
