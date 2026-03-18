/**
 * ico-encoder.js — Encoder ICO murni JavaScript
 * Mengonversi array canvas menjadi file .ico binary
 *
 * Format ICO:
 * - ICONDIR header (6 bytes)
 * - Array ICONDIRENTRY (16 bytes x n)
 * - Array Image data (PNG per entry)
 */

const IcoEncoder = {
  /**
   * Buat file ICO dari canvas dengan berbagai ukuran
   * @param {HTMLCanvasElement[]} canvasArr - Array canvas berukuran 16, 32, 48
   * @returns {Promise<Blob>} - Blob tipe image/x-icon
   */
  async encode(canvasArr) {
    try {
      // Konversi setiap canvas ke PNG blob
      const pngBlobs = await Promise.all(
        canvasArr.map(canvas => Format.canvasKeBlob(canvas, 'image/png'))
      );

      // Baca setiap blob sebagai ArrayBuffer
      const pngBuffers = await Promise.all(
        pngBlobs.map(blob => blob.arrayBuffer())
      );

      // Ukuran setiap gambar
      const ukuranArr = canvasArr.map(c => c.width);

      // Hitung total ukuran
      const headerSize = 6; // ICONDIR
      const entrySize = 16; // ICONDIRENTRY per entry
      const headerTotal = headerSize + entrySize * pngBuffers.length;

      const totalSize = headerTotal + pngBuffers.reduce((acc, buf) => acc + buf.byteLength, 0);
      const icoBuffer = new ArrayBuffer(totalSize);
      const view = new DataView(icoBuffer);

      let offset = 0;

      // ── ICONDIR (6 bytes) ──
      view.setUint16(offset, 0, true);           // idReserved = 0
      offset += 2;
      view.setUint16(offset, 1, true);           // idType = 1 (icon)
      offset += 2;
      view.setUint16(offset, pngBuffers.length, true); // idCount
      offset += 2;

      // ── ICONDIRENTRY (16 bytes x n) ──
      let imageOffset = headerTotal;

      for (let i = 0; i < pngBuffers.length; i++) {
        const ukuran = ukuranArr[i];
        const buf = pngBuffers[i];

        // Ukuran 256 disimpan sebagai 0
        view.setUint8(offset, ukuran >= 256 ? 0 : ukuran);   // bWidth
        offset++;
        view.setUint8(offset, ukuran >= 256 ? 0 : ukuran);   // bHeight
        offset++;
        view.setUint8(offset, 0);              // bColorCount (0 untuk PNG)
        offset++;
        view.setUint8(offset, 0);              // bReserved
        offset++;
        view.setUint16(offset, 1, true);       // wPlanes
        offset += 2;
        view.setUint16(offset, 32, true);      // wBitCount (32bpp)
        offset += 2;
        view.setUint32(offset, buf.byteLength, true); // dwBytesInRes
        offset += 4;
        view.setUint32(offset, imageOffset, true); // dwImageOffset
        offset += 4;

        imageOffset += buf.byteLength;
      }

      // ── Image Data ──
      for (const buf of pngBuffers) {
        const src = new Uint8Array(buf);
        const dst = new Uint8Array(icoBuffer, offset, buf.byteLength);
        dst.set(src);
        offset += buf.byteLength;
      }

      return new Blob([icoBuffer], { type: 'image/x-icon' });

    } catch (err) {
      Logger.error('IcoEncoder: Gagal encode ICO', err);
      throw err;
    }
  }
};

window.IcoEncoder = IcoEncoder;
