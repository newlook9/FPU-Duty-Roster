'use strict';
/* ====== Report rendering (A4 @200dpi canvas), PDF writer, share/save ====== */
var PW = 1654, PH = 2339, PM = 70;
var INK = '#111', NAVYC = '#12304f';

function newPage() {
  var c = document.createElement('canvas');
  c.width = PW; c.height = PH;
  c.setAttribute('dir', 'rtl');
  var x = c.getContext('2d');
  x.fillStyle = '#fff'; x.fillRect(0, 0, PW, PH);
  try { x.direction = 'rtl'; } catch (e) { /* old webview */ }
  x.textBaseline = 'middle';
  return { c: c, x: x };
}
function setFont(x, size, bold) { x.font = (bold ? 'bold ' : '') + size + 'px ' + FF; }
function T(x, t, px, py, size, o) {
  o = o || {};
  setFont(x, size, o.bold);
  x.fillStyle = o.color || INK;
  x.textAlign = o.align || 'center';
  x.fillText(t, px, py + size * 0.10);
}
function fitSize(x, t, maxW, size, bold) {
  setFont(x, size, bold);
  var w = x.measureText(t).width;
  if (w <= maxW) return size;
  return Math.max(size * 0.55, Math.floor(size * maxW / w));
}
function wrapText(x, t, maxW, size) {
  setFont(x, size, false);
  var words = String(t).split(/\s+/), lines = [], cur = '';
  words.forEach(function (w) {
    var test = cur ? cur + ' ' + w : w;
    if (x.measureText(test).width <= maxW || !cur) cur = test;
    else { lines.push(cur); cur = w; }
  });
  if (cur) lines.push(cur);
  return lines;
}
function line(x, x1, y1, x2, y2, w, col) {
  x.strokeStyle = col || INK; x.lineWidth = w || 2;
  x.beginPath(); x.moveTo(x1, y1); x.lineTo(x2, y2); x.stroke();
}
function ltr(t) { return '\u202A' + t + '\u202C'; }
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

function drawHeader(x, logo, title, sub) {
  var lg = 180;
  if (logo) x.drawImage(logo, PW - PM - lg, 55, lg, lg);
  var right = PW - PM - lg - 35;
  var sz = fitSize(x, title, right - PM, 70, true);
  T(x, title, right, 120, sz, { align: 'right', bold: true, color: NAVYC });
  T(x, sub, right, 205, 46, { align: 'right', color: '#333' });
  line(x, PM, 262, PW - PM, 262, 4, NAVYC);
}

/* ---------- Page 1: point wise duty table ---------- */
function drawPage1(logo) {
  var pg = newPage(), x = pg.x, L = S.settings.labels;
  drawHeader(x, logo, L.title, L.dateLabel + ': ' + ltr(fmtDate(S.date)));

  var widths = [100, 300, 360, 280, 270, 204];
  var xr = PW - PM, tableTop = 300, hdrH = 96, bottom = 120, rowPad = 22;
  var cols = [], cr = xr;
  widths.forEach(function (w) { cols.push({ r: cr, l: cr - w, w: w, c: cr - w / 2 }); cr -= w; });
  var tableL = cols[cols.length - 1].l;

  var rows = S.points.map(function (p) {
    var ppl = pointPeople(p.id), cyc = pointCycles(p.id);
    return { p: p, ppl: ppl, cyc: cyc, n: Math.max(ppl.length, cyc.length, 2) };
  });
  var totalLines = rows.reduce(function (a, r) { return a + r.n; }, 0);
  var avail = PH - tableTop - hdrH - bottom - rows.length * rowPad;
  var lh = clamp(Math.floor(avail / Math.max(1, totalLines)), 30, 84);
  var fs = Math.min(42, Math.floor(lh * 0.55));

  /* header row */
  x.fillStyle = '#dfe6ee'; x.fillRect(tableL, tableTop, xr - tableL, hdrH);
  var hl = [L.colSr, L.colPoint, L.colName, L.colMobile, L.colWl, L.colCycle];
  hl.forEach(function (t, i) {
    var sz = fitSize(x, t, cols[i].w - 16, 40, true);
    T(x, t, cols[i].c, tableTop + hdrH / 2, sz, { bold: true, color: NAVYC });
  });

  var y = tableTop + hdrH;
  rows.forEach(function (r, idx) {
    var rh = r.n * lh + rowPad;
    if (idx % 2 === 1) { x.fillStyle = '#f6f8fb'; x.fillRect(tableL, y, xr - tableL, rh); }
    var top = y + rowPad / 2;
    /* serial + point name (vertically centered) */
    T(x, String(idx + 1), cols[0].c, y + rh / 2, fs + 4, { bold: true });
    var pl = wrapText(x, r.p.name, cols[1].w - 24, fs + 2);
    var ps = fs + 2, ph = pl.length * ps * 1.5;
    pl.forEach(function (t, k) {
      T(x, t, cols[1].c, y + rh / 2 - ph / 2 + (k + 0.5) * ps * 1.5, ps, { bold: true });
    });
    for (var i = 0; i < r.n; i++) {
      var cy = top + i * lh + lh / 2;
      var s = r.ppl[i];
      if (s) {
        var nm = nameNo(s);
        var sz = fitSize(x, nm, cols[2].w - 28, s.name ? Math.round(fs * 1.2) : fs, false);
        T(x, nm, cols[2].r - 14, cy, sz, { align: 'right' });
        if (s.mobile) T(x, s.mobile, cols[3].c, cy, fs, {});
        if (s.wl) T(x, s.wl, cols[4].c, cy, fitSize(x, s.wl, cols[4].w - 16, fs, false), {});
      }
      if (r.cyc[i]) T(x, r.cyc[i], cols[5].c, cy, fs, {});
    }
    y += rh;
    line(x, tableL, y, xr, y, 2.5);
  });
  /* borders */
  var tableB = y;
  x.strokeStyle = INK; x.lineWidth = 3;
  x.strokeRect(tableL, tableTop, xr - tableL, tableB - tableTop);
  line(x, tableL, tableTop + hdrH, xr, tableTop + hdrH, 3);
  cols.forEach(function (c, i) { if (i < cols.length - 1) line(x, c.l, tableTop, c.l, tableB, 2.5); });
  return pg.c;
}

/* ---------- Page 2: rest / outdoor etc. + counts + signature ---------- */
function drawPage2(logo, sig) {
  var pg = newPage(), x = pg.x, L = S.settings.labels;
  drawHeader(x, logo, L.title2, L.dateLabel + ': ' + ltr(fmtDate(S.date)));
  var st = stats(), used = usedMap();
  var gap = 40, colW = (PW - 2 * PM - gap) / 2;
  var sections = [
    { g: 'M', label: L.male, r: PW - PM },
    { g: 'F', label: L.female, r: PW - PM - colW - gap }
  ];
  var top = 295, sigH = S.settings.sigOn ? 340 : 0, bottomM = 110;
  var availH = PH - top - bottomM - sigH - 150;
  /* lines needed per column */
  var need = 0;
  sections.forEach(function (sc) {
    var n = 0;
    S.cats.forEach(function (c) {
      var cnt = catPeople(c.id).filter(function (s) { return s.g === sc.g; }).length;
      n += 1 + Math.max(1, cnt) + 0.35;
    });
    need = Math.max(need, n);
  });
  var lh = clamp(Math.floor(availH / Math.max(1, need)), 34, 64);
  var fs = Math.min(40, Math.floor(lh * 0.62));

  sections.forEach(function (sc) {
    var xr = sc.r, xl = sc.r - colW, y = top;
    var s = st[sc.g];
    /* title band */
    x.fillStyle = NAVYC; x.fillRect(xl, y, colW, 84);
    T(x, sc.label, xl + colW / 2, y + 42, 46, { bold: true, color: '#fff' });
    y += 84;
    /* stats line */
    x.fillStyle = '#eef2f7'; x.fillRect(xl, y, colW, 74);
    var parts = [L.total + ': ' + s.total, L.onDuty + ': ' + s.duty, L.left + ': ' + s.left];
    var cw = colW / 3;
    parts.forEach(function (t, i) {
      T(x, t, xr - cw * i - cw / 2, y + 37, fitSize(x, t, cw - 12, 34, true), { bold: true });
    });
    y += 74;
    S.cats.forEach(function (c) {
      var ppl = catPeople(c.id).filter(function (q) { return q.g === sc.g; });
      x.fillStyle = '#dfe6ee'; x.fillRect(xl, y, colW, lh + 6);
      T(x, c.name + '  (' + ppl.length + ')', xr - 18, y + (lh + 6) / 2, fs + 4, { align: 'right', bold: true, color: NAVYC });
      y += lh + 6;
      var n = Math.max(1, ppl.length);
      for (var i = 0; i < n; i++) {
        var t = ppl[i] ? nameNo(ppl[i]) : '—';
        T(x, t, xr - 18, y + lh / 2, fitSize(x, t, colW - 40, ppl[i] && ppl[i].name ? Math.round(fs * 1.2) : fs, false), { align: 'right', color: ppl[i] ? INK : '#999' });
        y += lh;
        line(x, xl, y, xr, y, 1.5, '#9aa7b5');
      }
      y += lh * 0.35;
    });
    x.strokeStyle = INK; x.lineWidth = 3;
    x.strokeRect(xl, top, colW, y - top - lh * 0.35);
  });

  /* signature block (only when enabled in settings) */
  if (S.settings.sigOn) {
    var bw = 640, bx = PW - PM - bw, by = PH - bottomM - 300;
    T(x, L.sigTitle, bx + bw, by + 24, 38, { align: 'right', bold: true, color: NAVYC });
    if (sig) {
      var mw = 520, mh = 130, k = Math.min(mw / sig.width, mh / sig.height);
      var dw = sig.width * k, dh = sig.height * k;
      x.drawImage(sig, bx + bw - 10 - dw, by + 55 + (mh - dh), dw, dh);
    }
    line(x, bx, by + 195, bx + bw, by + 195, 2.5);
    if (S.settings.sigName) T(x, S.settings.sigName, bx + bw, by + 232, 40, { align: 'right', bold: true });
    if (S.settings.sigDesig) T(x, S.settings.sigDesig, bx + bw, by + 280, 36, { align: 'right', color: '#333' });
  }
  return pg.c;
}

function loadImg(src) {
  return new Promise(function (res) {
    var i = new Image();
    i.onload = function () { res(i); };
    i.onerror = function () { res(null); };
    i.src = src;
  });
}
function ensureFonts() {
  if (!document.fonts || !document.fonts.load) return Promise.resolve();
  return Promise.all([
    document.fonts.load('40px Jameel', 'ابپتٹ'),
    document.fonts.load('bold 40px Jameel', 'ابپتٹ')
  ]).then(function () { return document.fonts.ready; }).catch(function () { });
}
function buildReport() {
  return ensureFonts().then(function () {
    return Promise.all([loadImg('img/fpu_logo.png'), S.settings.sigOn && S.settings.sigImg ? loadImg(S.settings.sigImg) : Promise.resolve(null)]);
  }).then(function (r) {
    return [drawPage1(r[0]), drawPage2(r[0], r[1])];
  });
}

/* ---------- PDF writer (one JPEG per A4 page) ---------- */
function dataUrlToBytes(u) {
  var b = atob(u.split(',')[1]), n = b.length, a = new Uint8Array(n);
  for (var i = 0; i < n; i++) a[i] = b.charCodeAt(i);
  return a;
}
function makePdf(canvases) {
  var enc = new TextEncoder(), parts = [], offs = [], len = 0;
  function push(u8) { parts.push(u8); len += u8.length; }
  function str(s) { push(enc.encode(s)); }
  function obj(n, fn) { offs[n] = len; str(n + ' 0 obj\n'); fn(); str('\nendobj\n'); }
  var N = canvases.length, total = 3 + 3 * N;
  str('%PDF-1.4\n');
  obj(1, function () { str('<< /Type /Catalog /Pages 2 0 R >>'); });
  var kids = [];
  for (var i = 0; i < N; i++) kids.push((3 + 3 * i) + ' 0 R');
  obj(2, function () { str('<< /Type /Pages /Kids [' + kids.join(' ') + '] /Count ' + N + ' >>'); });
  canvases.forEach(function (cv, i) {
    var pn = 3 + 3 * i, cn = pn + 1, im = pn + 2;
    var jpg = dataUrlToBytes(cv.toDataURL('image/jpeg', 0.93));
    obj(pn, function () {
      str('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /XObject << /Im0 ' + im + ' 0 R >> >> /Contents ' + cn + ' 0 R >>');
    });
    var content = 'q 595.28 0 0 841.89 0 0 cm /Im0 Do Q';
    obj(cn, function () { str('<< /Length ' + content.length + ' >>\nstream\n' + content + '\nendstream'); });
    obj(im, function () {
      str('<< /Type /XObject /Subtype /Image /Width ' + cv.width + ' /Height ' + cv.height +
        ' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ' + jpg.length + ' >>\nstream\n');
      push(jpg); str('\nendstream');
    });
  });
  var xref = len;
  var s = 'xref\n0 ' + (total + 0) + '\n0000000000 65535 f \n';
  for (var n = 1; n < total; n++) s += ('0000000000' + offs[n]).slice(-10) + ' 00000 n \n';
  s += 'trailer\n<< /Size ' + total + ' /Root 1 0 R >>\nstartxref\n' + xref + '\n%%EOF';
  str(s);
  return new Blob(parts, { type: 'application/pdf' });
}
function blobToB64(blob) {
  return new Promise(function (res, rej) {
    var fr = new FileReader();
    fr.onload = function () { res(String(fr.result).split(',')[1]); };
    fr.onerror = rej;
    fr.readAsDataURL(blob);
  });
}
function canvasToJpgB64(cv) { return cv.toDataURL('image/jpeg', 0.92).split(',')[1]; }

/* ---------- file delivery: Android bridge, or browser download ---------- */
var HAS_BRIDGE = (typeof window.AndroidBridge !== 'undefined');
function downloadB64(b64, name, mime) {
  var a = document.createElement('a');
  a.href = 'data:' + mime + ';base64,' + b64; a.download = name;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
}
/* files: [{name,mime,b64}] -> resolves to message */
function shareFiles(files) {
  if (HAS_BRIDGE) {
    try {
      AndroidBridge.clearStaged();
      files.forEach(function (f) { AndroidBridge.stageFile(f.name, f.mime, f.b64); });
      var r = AndroidBridge.shareStaged();
      return r === 'ok' ? '' : 'شیئر نہیں ہو سکا';
    } catch (e) { return 'شیئر نہیں ہو سکا'; }
  }
  files.forEach(function (f) { downloadB64(f.b64, f.name, f.mime); });
  return 'براؤزر میں ڈاؤن لوڈ ہو گیا';
}
function saveFiles(files) {
  if (HAS_BRIDGE) {
    var msg = '';
    files.forEach(function (f) {
      var r = AndroidBridge.saveFile(f.b64, f.name, f.mime);
      if (r === 'perm') msg = 'اجازت دیں اور دوبارہ دبائیں';
      else if (r.indexOf('ok') === 0) msg = 'محفوظ ہو گیا: ' + r.slice(3);
      else msg = 'محفوظ نہیں ہو سکا';
    });
    return msg;
  }
  files.forEach(function (f) { downloadB64(f.b64, f.name, f.mime); });
  return 'ڈاؤن لوڈ ہو گیا';
}
function reportFiles(cvs, kind) {
  var d = fmtDate(S.date), base = 'FPU_Roster_' + d;
  if (kind === 'pdf') {
    return blobToB64(makePdf(cvs)).then(function (b64) {
      return [{ name: base + '.pdf', mime: 'application/pdf', b64: b64 }];
    });
  }
  return Promise.resolve(cvs.map(function (c, i) {
    return { name: base + '_page' + (i + 1) + '.jpg', mime: 'image/jpeg', b64: canvasToJpgB64(c) };
  }));
}
