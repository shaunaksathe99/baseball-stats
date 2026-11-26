/* Plate 450 Diary - tiny QR code generator (byte mode, error correction L, versions 1 to 14). No DOM access, so it can be unit tested in Node.
   Follows the QR Code Model 2 standard: data bits, Reed-Solomon error correction over GF(256), the eight mask patterns and the format and version bits. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.QR = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var ECC_PER_BLOCK = [0, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30];   // level L, index = version
  var NUM_BLOCKS = [0, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4];
  var MAX_VERSION = 14;

  function rawModules(v) {
    var r = (16 * v + 128) * v + 64;
    if (v >= 2) { var a = Math.floor(v / 7) + 2; r -= (25 * a - 10) * a - 55; if (v >= 7) r -= 36; }
    return r;
  }
  function dataCodewords(v) { return Math.floor(rawModules(v) / 8) - ECC_PER_BLOCK[v] * NUM_BLOCKS[v]; }

  // Arithmetic in GF(2^8) with the QR polynomial 0x11D.
  function gfMul(x, y) { var z = 0; for (var i = 7; i >= 0; i--) { z = (z << 1) ^ ((z >>> 7) * 0x11D); z ^= ((y >>> i) & 1) * x; } return z & 255; }
  function rsDivisor(deg) {
    var res = []; for (var i = 0; i < deg - 1; i++) res.push(0); res.push(1);
    var root = 1;
    for (var k = 0; k < deg; k++) {
      for (var j = 0; j < res.length; j++) { res[j] = gfMul(res[j], root); if (j + 1 < res.length) res[j] ^= res[j + 1]; }
      root = gfMul(root, 2);
    }
    return res;
  }
  function rsRemainder(data, div) {
    var res = div.map(function () { return 0; });
    data.forEach(function (b) {
      var f = b ^ res.shift(); res.push(0);
      div.forEach(function (c, i) { res[i] ^= gfMul(c, f); });
    });
    return res;
  }

  function utf8(text) {
    var out = [], s = unescape(encodeURIComponent(String(text)));
    for (var i = 0; i < s.length; i++) out.push(s.charCodeAt(i));
    return out;
  }

  function pickVersion(bytes) {
    for (var v = 1; v <= MAX_VERSION; v++) {
      var bits = 4 + (v < 10 ? 8 : 16) + bytes.length * 8;
      if (Math.ceil(bits / 8) <= dataCodewords(v)) return v;
    }
    return 0;
  }

  function buildCodewords(bytes, v) {
    var bits = [];
    function put(val, len) { for (var i = len - 1; i >= 0; i--) bits.push((val >>> i) & 1); }
    put(4, 4); put(bytes.length, v < 10 ? 8 : 16);
    bytes.forEach(function (b) { put(b, 8); });
    var cap = dataCodewords(v) * 8;
    put(0, Math.min(4, cap - bits.length));
    while (bits.length % 8) bits.push(0);
    for (var pad = 0xEC; bits.length < cap; pad ^= 0xEC ^ 0x11) put(pad, 8);
    var data = [];
    for (var i = 0; i < bits.length; i += 8) { var b = 0; for (var j = 0; j < 8; j++) b = (b << 1) | bits[i + j]; data.push(b); }
    // split into blocks, add error correction, interleave
    var nb = NUM_BLOCKS[v], eccLen = ECC_PER_BLOCK[v], raw = Math.floor(rawModules(v) / 8);
    var shortCount = nb - raw % nb, shortLen = Math.floor(raw / nb), blocks = [], div = rsDivisor(eccLen), k = 0;
    for (var n = 0; n < nb; n++) {
      var dat = data.slice(k, k + shortLen - eccLen + (n < shortCount ? 0 : 1)); k += dat.length;
      var ecc = rsRemainder(dat, div);
      if (n < shortCount) dat.push(0);
      blocks.push(dat.concat(ecc));
    }
    var out = [];
    for (var x = 0; x < blocks[0].length; x++) {
      for (var y = 0; y < nb; y++) if (x !== shortLen - eccLen || y >= shortCount) out.push(blocks[y][x]);
    }
    return out;
  }

  function build(codewords, v) {
    var size = v * 4 + 17, mod = [], fn = [];
    for (var i = 0; i < size; i++) { mod.push(new Array(size).fill(false)); fn.push(new Array(size).fill(false)); }
    function setFn(x, y, dark) { mod[y][x] = dark; fn[y][x] = true; }
    for (i = 0; i < size; i++) { setFn(6, i, i % 2 === 0); setFn(i, 6, i % 2 === 0); }
    function finder(cx, cy) {
      for (var dy = -4; dy <= 4; dy++) for (var dx = -4; dx <= 4; dx++) {
        var d = Math.max(Math.abs(dx), Math.abs(dy)), x = cx + dx, y = cy + dy;
        if (x >= 0 && x < size && y >= 0 && y < size) setFn(x, y, d !== 2 && d !== 4);
      }
    }
    finder(3, 3); finder(size - 4, 3); finder(3, size - 4);
    var pos = [];
    if (v > 1) {
      var na = Math.floor(v / 7) + 2, step = Math.ceil((v * 4 + 4) / (na * 2 - 2)) * 2;
      pos = [6]; for (var p = size - 7; pos.length < na; p -= step) pos.splice(1, 0, p);
      for (var a = 0; a < pos.length; a++) for (var b = 0; b < pos.length; b++) {
        if ((a === 0 && b === 0) || (a === 0 && b === pos.length - 1) || (a === pos.length - 1 && b === 0)) continue;
        for (var dy = -2; dy <= 2; dy++) for (var dx = -2; dx <= 2; dx++) setFn(pos[a] + dx, pos[b] + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
      }
    }
    function bit(x, n) { return ((x >>> n) & 1) !== 0; }
    function formatBits(mask) {
      var data = (1 << 3) | mask, rem = data;   // level L = 01
      for (var q = 0; q < 10; q++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
      var bits = ((data << 10) | rem) ^ 0x5412, j;
      for (j = 0; j <= 5; j++) setFn(8, j, bit(bits, j));
      setFn(8, 7, bit(bits, 6)); setFn(8, 8, bit(bits, 7)); setFn(7, 8, bit(bits, 8));
      for (j = 9; j < 15; j++) setFn(14 - j, 8, bit(bits, j));
      for (j = 0; j < 8; j++) setFn(size - 1 - j, 8, bit(bits, j));
      for (j = 8; j < 15; j++) setFn(8, size - 15 + j, bit(bits, j));
      setFn(8, size - 8, true);
    }
    formatBits(0);
    if (v >= 7) {
      var rem = v; for (var q = 0; q < 12; q++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1F25);
      var vb = (v << 12) | rem;
      for (var j = 0; j < 18; j++) { var c = bit(vb, j), aa = size - 11 + j % 3, bb = Math.floor(j / 3); setFn(aa, bb, c); setFn(bb, aa, c); }
    }
    // place the data bits in the zigzag order
    var idx = 0;
    for (var right = size - 1; right >= 1; right -= 2) {
      if (right === 6) right = 5;
      for (var vert = 0; vert < size; vert++) for (var jx = 0; jx < 2; jx++) {
        var x = right - jx, up = ((right + 1) & 2) === 0, y = up ? size - 1 - vert : vert;
        if (!fn[y][x] && idx < codewords.length * 8) { mod[y][x] = bit(codewords[idx >>> 3], 7 - (idx & 7)); idx++; }
      }
    }
    function applyMask(m) {
      for (var y = 0; y < size; y++) for (var x = 0; x < size; x++) {
        var inv;
        switch (m) {
          case 0: inv = (x + y) % 2 === 0; break;
          case 1: inv = y % 2 === 0; break;
          case 2: inv = x % 3 === 0; break;
          case 3: inv = (x + y) % 3 === 0; break;
          case 4: inv = (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0; break;
          case 5: inv = x * y % 2 + x * y % 3 === 0; break;
          case 6: inv = (x * y % 2 + x * y % 3) % 2 === 0; break;
          default: inv = ((x + y) % 2 + x * y % 3) % 2 === 0;
        }
        if (!fn[y][x] && inv) mod[y][x] = !mod[y][x];
      }
    }
    function penalty() {
      var r = 0, x, y, run, dark = 0;
      function line(get) {
        var res = 0, runLen = 1, i;
        for (i = 1; i < size; i++) { if (get(i) === get(i - 1)) { runLen++; if (runLen === 5) res += 3; else if (runLen > 5) res++; } else runLen = 1; }
        return res;
      }
      for (y = 0; y < size; y++) r += line(function (i) { return mod[y][i]; });
      for (x = 0; x < size; x++) r += line(function (i) { return mod[i][x]; });
      for (y = 0; y < size - 1; y++) for (x = 0; x < size - 1; x++) { var c = mod[y][x]; if (c === mod[y][x + 1] && c === mod[y + 1][x] && c === mod[y + 1][x + 1]) r += 3; }
      var pat = [true, false, true, true, true, false, true];
      function finderLike(get) {
        var res = 0;
        for (var i = 0; i + 7 <= size; i++) {
          var ok = true; for (var k = 0; k < 7; k++) if (get(i + k) !== pat[k]) { ok = false; break; }
          if (!ok) continue;
          var left = true, rightSide = true, k2;
          for (k2 = 1; k2 <= 4; k2++) { if (i - k2 >= 0 && get(i - k2)) left = false; if (i + 6 + k2 < size && get(i + 6 + k2)) rightSide = false; }
          if (left || rightSide) res += 40;
        }
        return res;
      }
      for (y = 0; y < size; y++) r += finderLike(function (i) { return mod[y][i]; });
      for (x = 0; x < size; x++) r += finderLike(function (i) { return mod[i][x]; });
      for (y = 0; y < size; y++) for (x = 0; x < size; x++) if (mod[y][x]) dark++;
      var total = size * size, k3 = Math.ceil(Math.abs(dark * 20 - total * 10) / total) - 1;
      return r + Math.max(0, k3) * 10;
    }
    var best = 0, bestPen = Infinity;
    for (var m = 0; m < 8; m++) {
      applyMask(m); formatBits(m);
      var pen = penalty();
      if (pen < bestPen) { best = m; bestPen = pen; }
      applyMask(m);
    }
    applyMask(best); formatBits(best);
    return mod;
  }

  // Returns a square array of rows (true = dark module), or null when the text is too long.
  function matrix(text) {
    var bytes = utf8(text), v = pickVersion(bytes);
    if (!v) return null;
    return build(buildCodewords(bytes, v), v);
  }
  // SVG markup with a four-module quiet zone, drawn as one path so it stays small.
  function svg(text, px) {
    var m = matrix(text); if (!m) return '';
    var n = m.length, q = 4, d = '';
    for (var y = 0; y < n; y++) {
      var x = 0;
      while (x < n) {
        if (!m[y][x]) { x++; continue; }
        var s = x; while (x < n && m[y][x]) x++;
        d += 'M' + (s + q) + ' ' + (y + q) + 'h' + (x - s) + 'v1h-' + (x - s) + 'z';
      }
    }
    var t = n + q * 2;
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + t + ' ' + t + '" width="' + (px || 240) + '" height="' + (px || 240) + '" shape-rendering="crispEdges" role="img" aria-label="QR code"><rect width="' + t + '" height="' + t + '" fill="#fff"/><path d="' + d + '" fill="#000"/></svg>';
  }
  return { matrix: matrix, svg: svg, MAX_BYTES: dataCodewords(MAX_VERSION) - 3 };
});
