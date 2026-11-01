'use strict';
/* ====== FPU Duty Roster - UI ====== */
var tab = 'dash', openSec = '', stFilter = 'M', stQ = '';
var dlgOpen = false, dlgDone = null;

/* WhatsApp number is kept out of the visible UI and out of plain text */
var WA_NUM = [57, 50, 51, 48, 56, 51, 50, 56, 54, 54, 52, 53].map(function (c) { return String.fromCharCode(c); }).join('');
var WA_MSG = 'السلام علیکم، مجھے ایپ ڈیولپمنٹ کے بارے میں بات کرنی ہے';
var WA_SVG = '<svg viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>';
var ICONS = {
  dash: '<svg viewBox="0 0 24 24"><path d="M3 3h8v10H3zM13 3h8v6h-8zM13 11h8v10h-8zM3 15h8v6H3z"/></svg>',
  roster: '<svg viewBox="0 0 24 24"><path d="M4 5h2v2H4zM8 5h12v2H8zM4 11h2v2H4zM8 11h12v2H8zM4 17h2v2H4zM8 17h12v2H8z"/></svg>',
  status: '<svg viewBox="0 0 24 24"><path d="M12 3a9 9 0 1 0 9 9 7 7 0 0 1-9-9z"/></svg>',
  set: '<svg viewBox="0 0 24 24"><path fill-rule="evenodd" d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm9 5v-2l-2.1-.6a7 7 0 0 0-.7-1.7l1-1.9-1.4-1.4-1.9 1a7 7 0 0 0-1.7-.7L13 3h-2l-.6 2.1a7 7 0 0 0-1.7.7l-1.9-1L5.4 6.2l1 1.9a7 7 0 0 0-.7 1.7L3.6 11v2l2.1.6c.2.6.4 1.2.7 1.7l-1 1.9 1.4 1.4 1.9-1c.5.3 1.1.5 1.7.7L11 21h2l.6-2.1c.6-.2 1.2-.4 1.7-.7l1.9 1 1.4-1.4-1-1.9c.3-.5.5-1.1.7-1.7z"/></svg>'
};
var TABS = [['dash', 'ڈیش بورڈ'], ['roster', 'روسٹر'], ['status', 'ریسٹ وغیرہ'], ['set', 'سیٹنگز']];

/* ---------- small UI helpers ---------- */
var toastT = null;
function toast(m) {
  var t = $('#toast'); t.textContent = m; t.className = 'on';
  clearTimeout(toastT); toastT = setTimeout(function () { t.className = ''; }, 2600);
}
function openSheet(title, html, mount) {
  var r = $('#sheetRoot');
  r.innerHTML = '<div class="bk"></div><div class="sh"><div class="sh-h"><b style="font-weight:normal">' + esc(title) +
    '</b><button class="x" data-close>✕</button></div><div class="sh-b">' + html + '</div></div>';
  r.className = 'on';
  r.onclick = function (e) {
    if (e.target.classList.contains('bk') || e.target.closest('[data-close]')) closeSheet();
  };
  if (mount) mount($('.sh-b', r));
}
function closeSheet() { var r = $('#sheetRoot'); r.className = ''; r.innerHTML = ''; }
function sheetOpen() { return $('#sheetRoot').className === 'on'; }
function confirmBox(msg, ok, cancel) {
  return new Promise(function (res) {
    var r = $('#dlgRoot');
    r.className = 'on';
    r.innerHTML = '<div class="bk"></div><div class="dlg"><p>' + esc(msg) + '</p><div class="row"><button class="btn pri" data-y>' +
      esc(ok || 'ٹھیک ہے') + '</button><button class="btn" data-n>' + esc(cancel || 'منسوخ') + '</button></div></div>';
    function done(v) { r.className = ''; r.innerHTML = ''; dlgOpen = false; dlgDone = null; res(v); }
    r.onclick = function (e) {
      if (e.target.hasAttribute('data-y')) done(true);
      else if (e.target.hasAttribute('data-n') || e.target.classList.contains('bk')) done(false);
    };
    dlgOpen = true; dlgDone = done;
  });
}
function textSheet(title, label, value, onOk, ltr) {
  openSheet(title, '<label class="fld"><span>' + esc(label) + '</span><input id="tsIn" class="' + (ltr ? 'ltr' : '') + '" value="' + esc(value) + '"></label>' +
    '<button class="btn pri wide" id="tsOk">محفوظ کریں</button>', function (b) {
      var inp = $('#tsIn', b);
      $('#tsOk', b).onclick = function () {
        var v = inp.value.trim();
        if (!v) { toast('نام خالی نہیں ہو سکتا'); return; }
        onOk(v); closeSheet();
      };
      setTimeout(function () { inp.focus(); }, 150);
    });
}
function pickFile(accept, cb) {
  var f = $('#filePick');
  f.value = '';
  if (accept) f.setAttribute('accept', accept); else f.removeAttribute('accept');
  f.onchange = function () { if (f.files && f.files[0]) cb(f.files[0]); };
  f.click();
}
function commit() { save(); render(); }

/* ---------- people picker (only free staff are listed) ---------- */
function pickStaff(o) {
  openSheet(o.title, '<input class="srch" placeholder="تلاش: نمبر یا نام"><div class="plist"></div>' +
    '<button class="btn pri wide" data-close>مکمل</button>', function (b) {
      var inp = $('.srch', b), list = $('.plist', b);
      function draw() {
        var q = inp.value.trim().toLowerCase(), used = usedMap();
        var items = S.staff.filter(function (s) {
          return (!o.g || s.g === o.g) && !used[s.id] && (!q || (s.no + ' ' + s.name).toLowerCase().indexOf(q) >= 0);
        });
        list.innerHTML = items.length ? items.map(function (s) {
          return '<button class="pi" data-pick="' + esc(s.id) + '"><span class="badge ' + s.g + '"></span><span class="t"><span class="no">' + esc(s.no) +
            '</span> ' + esc(s.name || '') + '<small>' + esc(s.wl) + '</small></span><span class="btn sm">+ شامل</span></button>';
        }).join('') : '<p class="empty">کوئی فری اہلکار نہیں</p>';
      }
      inp.oninput = draw;
      list.onclick = function (e) {
        var t = e.target.closest('[data-pick]'); if (!t) return;
        o.onPick(t.getAttribute('data-pick')); save(); render(); draw();
      };
      draw();
    });
}
function pickCycles(pid) {
  var pt = S.points.filter(function (p) { return p.id === pid; })[0];
  openSheet((pt ? pt.name : '') + ' - سائیکل', '<p class="mut" style="margin:0">نمبر پر ٹیپ کریں۔ جو نمبر دوسرے پوائنٹ پر لگ چکا ہو وہ کٹا ہوا نظر آئے گا۔</p><div class="cycgrid"></div>' +
    '<button class="btn pri wide" data-close>مکمل</button>', function (b) {
      var g = $('.cycgrid', b);
      function draw() {
        var a = pa(pid);
        g.innerHTML = S.cycles.slice().sort(numSort).map(function (n) {
          var own = cycleOwner(n, pid), on = a.cycles.indexOf(n) >= 0;
          return '<button class="chip' + (on ? ' on' : '') + (own ? ' dis' : '') + '" data-n="' + esc(n) + '">' + esc(n) + '</button>';
        }).join('');
        if (!S.cycles.length) g.innerHTML = '<p class="empty" style="grid-column:1/-1">سیٹنگز میں سائیکل نمبر درج کریں</p>';
      }
      g.onclick = function (e) {
        var t = e.target.closest('[data-n]'); if (!t) return;
        var n = t.getAttribute('data-n'), a = pa(pid), i = a.cycles.indexOf(n);
        if (i >= 0) a.cycles.splice(i, 1);
        else {
          var own = cycleOwner(n, pid);
          if (own) { toast('سائیکل ' + n + ' پہلے سے «' + own.name + '» پر ہے'); return; }
          a.cycles.push(n);
        }
        save(); render(); draw();
      };
      draw();
    });
}

/* ---------- views ---------- */
function devFoot() {
  var url = 'https://wa.me/' + WA_NUM + '?text=' + encodeURIComponent(WA_MSG);
  return '<div class="devfoot"><img src="img/devnora.png" alt="Devnora"><div class="dt"><small>Developed by</small><b>Devnora</b></div>' +
    '<a class="wa" href="' + url + '" aria-label="WhatsApp">' + WA_SVG + '</a></div>';
}
function backupAge() {
  var t = S.settings.lastBackup;
  if (!t) return null;
  var d = Math.floor((Date.now() - new Date(t).getTime()) / 86400000);
  return isNaN(d) ? null : d;
}
function viewDash() {
  var st = stats(), h = '', bd = backupAge();
  if (bd === null || bd >= 7) {
    h += '<div class="banner"><span>' + (bd === null ? 'ابھی تک بیک اپ نہیں لیا۔' : 'آخری بیک اپ کو ' + bd + ' دن ہو گئے۔') +
      '</span><button class="btn gold sm" data-act="bk-share">بیک اپ لیں</button></div>';
  }
  h += '<div class="card"><div class="datebar"><button class="btn" data-act="today">آج</button><input type="date" id="dateIn" value="' + S.date + '"></div></div>';
  function rowv(label, a, b) { return '<tr><td>' + esc(label) + '</td><td class="v">' + a + '</td><td class="v">' + b + '</td></tr>'; }
  h += '<div class="card"><table class="stats"><tr><th></th><th class="m">میل</th><th class="f">فیمیل</th></tr>' +
    rowv('کل اسٹاف', st.M.total, st.F.total) + rowv('ڈیوٹی پر', st.M.duty, st.F.duty);
  S.cats.forEach(function (c) { h += rowv(c.name, st.M.cats[c.id], st.F.cats[c.id]); });
  h += rowv('فری (بقیہ)', st.M.left, st.F.left) + '</table></div>';
  h += '<button class="big" data-act="preview">رپورٹ دیکھیں اور شیئر کریں</button>';
  h += '<div class="grid2"><button class="btn" data-act="go-roster">روسٹر بنائیں</button><button class="btn" data-act="go-status">ریسٹ / آؤٹ ڈور</button>' +
    '<button class="btn" data-act="copyprev">پچھلے روسٹر کی نقل</button><button class="btn bad" data-act="clear">روسٹر صاف کریں</button></div>';
  return h + devFoot();
}
function personLi(s, act, v) {
  return '<li><span class="badge ' + s.g + '"></span><span class="nm"><span class="no">' + esc(s.no) + '</span> ' + esc(s.name || '') +
    '</span><button class="xbtn" data-act="' + act + '" data-v="' + esc(v) + '">✕</button></li>';
}
function viewRoster() {
  if (!S.points.length) return '<p class="empty">سیٹنگز میں پوائنٹ شامل کریں</p>';
  return S.points.map(function (p) {
    var ppl = pointPeople(p.id), cyc = pointCycles(p.id);
    var m = ppl.filter(function (s) { return s.g === 'M'; }).length, f = ppl.length - m;
    return '<section class="card"><div class="pt-h"><b>' + esc(p.name) + '</b><span class="cnt">' + m + ' میل · ' + f + ' فیمیل</span></div>' +
      '<ul class="people">' + (ppl.length ? ppl.map(function (s) { return personLi(s, 'rm', p.id + '|' + s.id); }).join('') : '<li class="mut">کوئی اہلکار نہیں</li>') + '</ul>' +
      '<div class="row"><button class="btn sm" data-act="addp" data-v="M|' + p.id + '">+ میل</button><button class="btn sm" data-act="addp" data-v="F|' + p.id + '">+ فیمیل</button></div>' +
      '<div class="mut" style="margin-top:6px">سائیکل</div><div class="chips">' +
      (cyc.length ? cyc.map(function (n) { return '<span class="chip on">' + esc(n) + '</span>'; }).join('') : '<span class="mut">—</span>') +
      '<button class="btn sm" data-act="cyc" data-v="' + p.id + '">' + (cyc.length ? 'تبدیل کریں' : '+ سائیکل') + '</button></div></section>';
  }).join('');
}
function viewStatus() {
  if (!S.cats.length) return '<p class="empty">سیٹنگز میں ڈیوٹی کی اقسام (ریسٹ، آؤٹ ڈور وغیرہ) شامل کریں</p>';
  return S.cats.map(function (c) {
    var ppl = catPeople(c.id);
    return '<section class="card"><div class="pt-h"><b>' + esc(c.name) + '</b><span class="cnt">' + ppl.length + ' افراد</span></div>' +
      '<ul class="people">' + (ppl.length ? ppl.map(function (s) { return personLi(s, 'rmc', c.id + '|' + s.id); }).join('') : '<li class="mut">کوئی نہیں</li>') + '</ul>' +
      '<div class="row"><button class="btn sm" data-act="addc" data-v="M|' + c.id + '">+ میل</button><button class="btn sm" data-act="addc" data-v="F|' + c.id + '">+ فیمیل</button></div></section>';
  }).join('');
}

/* settings */
function sec(id, title, body) {
  return '<div class="sec' + (openSec === id ? ' open' : '') + '"><button class="sech" data-act="sec" data-v="' + id + '">' + esc(title) + '</button><div class="secb">' + body + '</div></div>';
}
function itemRow(title, sub, btns) {
  return '<div class="item"><div class="t">' + title + (sub ? '<small>' + sub + '</small>' : '') + '</div>' + btns + '</div>';
}
function ib(act, v, label, cls) { return '<button class="ib ' + (cls || '') + '" data-act="' + act + '" data-v="' + esc(v) + '">' + label + '</button>'; }
function listEditor(kind, arr, addLabel) {
  var h = arr.map(function (o, i) {
    return itemRow(esc(o.name), '', (i > 0 ? ib(kind + '-up', o.id, '↑') : '') + (i < arr.length - 1 ? ib(kind + '-dn', o.id, '↓') : '') +
      ib(kind + '-ren', o.id, '✎') + ib(kind + '-del', o.id, '✕', 'bad'));
  }).join('');
  return h + '<button class="btn wide" data-act="' + kind + '-add">' + addLabel + '</button>';
}
function viewSet() {
  var st = S.settings, h = '';
  /* report titles */
  var lab = Object.keys(LAB_NAMES).map(function (k) {
    return '<label class="fld"><span>' + esc(LAB_NAMES[k]) + '</span><input data-lab="' + k + '" value="' + esc(st.labels[k]) + '"></label>';
  }).join('') + '<button class="btn wide" data-act="lab-reset">اصل عنوان بحال کریں</button>';
  /* staff */
  var list = S.staff.filter(function (s) { return s.g === stFilter; });
  var staffH = '<div class="seg"><button data-act="stf" data-v="M" class="' + (stFilter === 'M' ? 'on' : '') + '">میل (' + S.staff.filter(function (s) { return s.g === 'M'; }).length +
    ')</button><button data-act="stf" data-v="F" class="' + (stFilter === 'F' ? 'on' : '') + '">فیمیل (' + S.staff.filter(function (s) { return s.g === 'F'; }).length + ')</button></div>' +
    '<input class="srch" id="stQ" placeholder="تلاش: نمبر یا نام" value="' + esc(stQ) + '" style="margin-top:8px">' +
    list.map(function (s) {
      var q = (s.no + ' ' + s.name + ' ' + s.wl).toLowerCase();
      return '<div class="stitem" data-q="' + esc(q) + '"' + (stQ && q.indexOf(stQ.toLowerCase()) < 0 ? ' style="display:none"' : '') + '>' +
        itemRow('<span class="no">' + esc(s.no) + '</span> ' + (s.name ? esc(s.name) : '<span class="mut">(نام درج کریں)</span>'),
          esc(s.wl) + (s.mobile ? ' · ' + esc(s.mobile) : ''), ib('st-edit', s.id, '✎') + ib('st-del', s.id, '✕', 'bad')) + '</div>';
    }).join('') + '<button class="btn wide" data-act="st-bulk">تمام نام ایک ساتھ لکھیں</button>' +
    '<button class="btn pri wide" data-act="st-add">+ نیا اہلکار</button>';
  /* cycles */
  var cycH = '<label class="fld"><span>سائیکل نمبر (کاما سے الگ کریں، یا رینج جیسے 1-24)</span><textarea id="cycIn" class="ltr" rows="3" style="direction:ltr;text-align:left">' +
    esc(S.cycles.slice().sort(numSort).join(', ')) + '</textarea></label><button class="btn pri wide" data-act="cy-save">محفوظ کریں</button>';
  /* signature */
  var sigH = '<div class="row"><span class="sp">رپورٹ میں سگنیچر سیکشن</span><label class="sw"><input type="checkbox" id="sigOn"' + (st.sigOn ? ' checked' : '') + '><i></i></label></div>' +
    '<p class="mut" style="margin:2px 0 6px">آف ہو تو رپورٹ میں عنوان، نام، سگنیچر یا لائن، کچھ بھی نہیں آئے گا۔</p>' +
    '<label class="fld"><span>نام</span><input id="sigName" value="' + esc(st.sigName) + '"></label>' +
    '<label class="fld"><span>عہدہ</span><input id="sigDesig" value="' + esc(st.sigDesig) + '"></label>' +
    '<div class="sigprev">' + (st.sigImg ? '<img src="' + st.sigImg + '" alt="">' : '<span class="mut">سگنیچر محفوظ نہیں</span>') + '</div>' +
    '<div class="grid2" style="margin-top:8px"><button class="btn" data-act="sig-draw">ہاتھ سے دستخط</button><button class="btn" data-act="sig-pick">گیلری سے تصویر</button></div>' +
    (st.sigImg ? '<button class="btn bad wide" data-act="sig-del">سگنیچر حذف کریں</button>' : '');
  /* backup */
  var bd = backupAge();
  var bkH = '<p class="mut" style="margin:2px 0">' + (bd === null ? 'ابھی تک بیک اپ نہیں لیا۔' : 'آخری بیک اپ: ' + (bd === 0 ? 'آج' : bd + ' دن پہلے')) + '</p>' +
    '<div class="grid2"><button class="btn pri" data-act="bk-share">بیک اپ شیئر کریں</button><button class="btn" data-act="bk-save">فون میں محفوظ کریں</button></div>' +
    '<button class="btn wide" data-act="bk-restore">بیک اپ بحال کریں (JSON فائل)</button>' +
    '<p class="mut" style="margin:8px 0 0">نئے فون میں ایپ انسٹال کر کے یہی بٹن دبائیں اور محفوظ کی ہوئی JSON فائل چنیں۔ سارا ریکارڈ، سیٹنگز اور سگنیچر واپس آ جائیں گے۔</p>';
  var aboutH = '<p style="margin:4px 0"><b style="font-weight:normal;font-size:19px">FPU Duty Roster</b><br><span class="mut">ورژن 2.0 · مکمل آف لائن</span></p>' + devFoot();

  h += sec('lab', 'رپورٹ کے عنوان', lab);
  h += sec('staff', 'اسٹاف (میل / فیمیل)', staffH);
  h += sec('pts', 'پوائنٹس', listEditor('pt', S.points, '+ نیا پوائنٹ'));
  h += sec('cats', 'ڈیوٹی کی اقسام (ریسٹ، آؤٹ ڈور وغیرہ)', listEditor('ct', S.cats, '+ نئی قسم'));
  h += sec('cyc', 'سائیکل نمبر', cycH);
  h += sec('sig', 'سگنیچر', sigH);
  h += sec('bk', 'بیک اپ اور بحالی', bkH);
  h += sec('about', 'ایپ کے بارے میں', aboutH);
  return h;
}

function render() {
  $('#hdrDate').textContent = fmtDate(S.date);
  $('#nav').innerHTML = TABS.map(function (t) {
    return '<button data-tab="' + t[0] + '" class="' + (tab === t[0] ? 'on' : '') + '">' + ICONS[t[0] === 'dash' ? 'dash' : t[0]] + '<span>' + t[1] + '</span></button>';
  }).join('');
  var v = $('#view'), sc = v.scrollTop;
  v.innerHTML = { dash: viewDash, roster: viewRoster, status: viewStatus, set: viewSet }[tab]();
  v.scrollTop = sc;
}
function go(t) { tab = t; render(); $('#view').scrollTop = 0; }

/* ---------- roster actions ---------- */
function isEmptyRoster(r) {
  if (!r) return true;
  var n = 0;
  Object.keys(r.assign || {}).forEach(function (k) { n += r.assign[k].staff.length + r.assign[k].cycles.length; });
  Object.keys(r.status || {}).forEach(function (k) { n += r.status[k].length; });
  return n === 0;
}
function lastRosterBefore(d) {
  var keys = Object.keys(S.rosters).filter(function (k) { return k !== d && !isEmptyRoster(S.rosters[k]); }).sort();
  var before = keys.filter(function (k) { return k < d; });
  return before.length ? before[before.length - 1] : (keys.length ? keys[keys.length - 1] : null);
}
function copyRoster(from, to) {
  var src = S.rosters[from], out = { assign: {}, status: {} };
  S.points.forEach(function (p) {
    var a = src.assign[p.id];
    if (a) out.assign[p.id] = { staff: a.staff.filter(function (id) { return !!staffById(id); }), cycles: a.cycles.slice() };
  });
  S.rosters[to] = out;
}
function setDate(d) {
  if (!d) return;
  S.date = d;
  var prev = isEmptyRoster(S.rosters[d]) ? lastRosterBefore(d) : null;
  save(); render();
  if (prev) {
    confirmBox('اس تاریخ (' + fmtDate(d) + ') کا روسٹر خالی ہے۔ کیا ' + fmtDate(prev) + ' کے روسٹر کی نقل بنائیں؟ (ریسٹ / آؤٹ ڈور کی فہرست خالی رہے گی)', 'نقل بنائیں', 'خالی رکھیں')
      .then(function (y) { if (y) { copyRoster(prev, d); commit(); toast('نقل بن گئی'); } });
  }
}
function showReport() {
  toast('رپورٹ بن رہی ہے…');
  buildReport().then(function (cvs) {
    var imgs = cvs.map(function (c) { return '<img src="' + c.toDataURL('image/jpeg', 0.8) + '" alt="">'; }).join('');
    $('#toast').className = '';
    openSheet('رپورٹ  \u202A' + fmtDate(S.date) + '\u202C',
      '<div class="grid2"><button class="btn pri" data-r="share-pdf">PDF شیئر</button><button class="btn pri" data-r="share-jpg">JPG شیئر</button>' +
      '<button class="btn" data-r="save-pdf">PDF محفوظ</button><button class="btn" data-r="save-jpg">JPG محفوظ</button></div>' +
      '<p class="mut" style="margin:8px 0">سگنیچر: ' + (S.settings.sigOn ? 'آن' : 'آف') + ' (سیٹنگز میں بدلیں)</p><div class="prev">' + imgs + '</div>',
      function (b) {
        b.onclick = function (e) {
          var t = e.target.closest('[data-r]'); if (!t) return;
          var a = t.getAttribute('data-r').split('-');
          reportFiles(cvs, a[1]).then(function (files) {
            var m = a[0] === 'share' ? shareFiles(files) : saveFiles(files);
            if (m) toast(m);
          });
        };
      });
  }).catch(function () { toast('رپورٹ نہیں بن سکی'); });
}

/* ---------- staff form ---------- */
function staffForm(id) {
  var s = id ? staffById(id) : { g: stFilter, no: '', name: '', wl: '', mobile: '' };
  var g = s.g;
  openSheet(id ? 'اہلکار میں ترمیم' : 'نیا اہلکار',
    '<div class="seg" id="sg"><button data-g="M">میل</button><button data-g="F">فیمیل</button></div>' +
    '<label class="fld"><span>پرسنل نمبر</span><input id="fNo" class="ltr" inputmode="numeric" value="' + esc(s.no) + '"></label>' +
    '<label class="fld"><span>نام</span><input id="fName" value="' + esc(s.name) + '"></label>' +
    '<label class="fld"><span>فون + وائرلیس نمبر (فیمیل کے لیے LT نمبر)</span><input id="fWl" class="ltr" value="' + esc(s.wl) + '"></label>' +
    '<label class="fld"><span>موبائل نمبر</span><input id="fMob" class="ltr" inputmode="tel" value="' + esc(s.mobile) + '"></label>' +
    '<button class="btn pri wide" id="fOk">محفوظ کریں</button>',
    function (b) {
      function paint() { $$('#sg button', b).forEach(function (x) { x.className = x.getAttribute('data-g') === g ? 'on' : ''; }); }
      paint();
      $('#sg', b).onclick = function (e) { var t = e.target.closest('[data-g]'); if (t) { g = t.getAttribute('data-g'); paint(); } };
      $('#fOk', b).onclick = function () {
        var no = $('#fNo', b).value.trim();
        if (!no) { toast('پرسنل نمبر ضروری ہے'); return; }
        var dup = S.staff.filter(function (x) { return x.no === no && x.id !== id; })[0];
        if (dup) { toast('یہ پرسنل نمبر پہلے سے موجود ہے'); return; }
        var rec = { g: g, no: no, name: $('#fName', b).value.trim(), wl: $('#fWl', b).value.trim(), mobile: $('#fMob', b).value.trim() };
        if (id) { var cur = staffById(id); for (var k in rec) cur[k] = rec[k]; }
        else { rec.id = nid('S'); S.staff.push(rec); }
        stFilter = g; closeSheet(); commit(); toast('محفوظ ہو گیا');
      };
    });
}

/* ---------- bulk names ---------- */
function bulkNames() {
  var list = S.staff.filter(function (x) { return x.g === stFilter; });
  openSheet(stFilter === 'M' ? 'میل اسٹاف کے نام' : 'فیمیل اسٹاف کے نام',
    list.map(function (x) {
      return '<label class="fld"><span class="no">' + esc(x.no) + ' · ' + esc(x.wl) + '</span><input data-bn="' + esc(x.id) + '" value="' + esc(x.name) + '"></label>';
    }).join('') + '<button class="btn pri wide" id="bnOk">محفوظ کریں</button>',
    function (b) {
      $('#bnOk', b).onclick = function () {
        $$('[data-bn]', b).forEach(function (inp) { var st = staffById(inp.getAttribute('data-bn')); if (st) st.name = inp.value.trim(); });
        closeSheet(); commit(); toast('نام محفوظ ہو گئے');
      };
    });
}

/* ---------- signature ---------- */
function cropAlpha(cv) {
  var w = cv.width, h = cv.height, d = cv.getContext('2d').getImageData(0, 0, w, h).data;
  var x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) {
    if (d[(y * w + x) * 4 + 3] > 20) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  }
  if (x1 < 0) return null;
  var p = 8; x0 = Math.max(0, x0 - p); y0 = Math.max(0, y0 - p); x1 = Math.min(w - 1, x1 + p); y1 = Math.min(h - 1, y1 + p);
  var o = document.createElement('canvas'); o.width = x1 - x0 + 1; o.height = y1 - y0 + 1;
  o.getContext('2d').drawImage(cv, x0, y0, o.width, o.height, 0, 0, o.width, o.height);
  return o;
}
function saveSig(cv) {
  var c = cropAlpha(cv);
  if (!c) { toast('دستخط نظر نہیں آیا'); return false; }
  S.settings.sigImg = c.toDataURL('image/png'); commit(); toast('سگنیچر محفوظ ہو گیا'); return true;
}
function sigFromFile(file) {
  var fr = new FileReader();
  fr.onload = function () {
    var im = new Image();
    im.onload = function () {
      var sc = Math.min(1, 900 / im.width), w = Math.round(im.width * sc), h = Math.round(im.height * sc);
      var cv = document.createElement('canvas'); cv.width = w; cv.height = h;
      var x = cv.getContext('2d'); x.drawImage(im, 0, 0, w, h);
      var id = x.getImageData(0, 0, w, h), d = id.data;
      for (var i = 0; i < d.length; i += 4) {
        var lum = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
        d[i + 3] = lum > 200 ? 0 : Math.min(255, Math.round((200 - lum) * 255 / 90));
      }
      x.putImageData(id, 0, 0);
      saveSig(cv);
    };
    im.onerror = function () { toast('تصویر کھل نہیں سکی'); };
    im.src = fr.result;
  };
  fr.readAsDataURL(file);
}
function sigPad() {
  openSheet('ہاتھ سے دستخط', '<canvas id="sigpad" width="800" height="330"></canvas>' +
    '<div class="row" style="margin-top:8px"><button class="btn" data-s="clear">صاف کریں</button><span class="sp"></span><button class="btn pri" data-s="ok">محفوظ کریں</button></div>',
    function (b) {
      var cv = $('#sigpad', b), x = cv.getContext('2d'), down = false;
      x.lineWidth = 5; x.lineCap = 'round'; x.lineJoin = 'round'; x.strokeStyle = '#0a1f5c';
      function pos(e) { var r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * cv.width / r.width, (e.clientY - r.top) * cv.height / r.height]; }
      cv.onpointerdown = function (e) {
        down = true; var p = pos(e); x.beginPath(); x.moveTo(p[0], p[1]); x.lineTo(p[0] + 0.1, p[1] + 0.1); x.stroke();
        try { cv.setPointerCapture(e.pointerId); } catch (err) { }
        e.preventDefault();
      };
      cv.onpointermove = function (e) {
        if (!down) return; var p = pos(e); x.lineTo(p[0], p[1]); x.stroke(); x.beginPath(); x.moveTo(p[0], p[1]); e.preventDefault();
      };
      cv.onpointerup = cv.onpointercancel = function () { down = false; };
      b.onclick = function (e) {
        var t = e.target.closest('[data-s]'); if (!t) return;
        if (t.getAttribute('data-s') === 'clear') x.clearRect(0, 0, cv.width, cv.height);
        else if (saveSig(cv)) closeSheet();
      };
    });
}

/* ---------- backup ---------- */
function backupFile() {
  var json = JSON.stringify({ app: 'FPU Duty Roster', version: 1, exported: new Date().toISOString(), data: S });
  return { name: 'FPU_Backup_' + fmtDate(todayISO()) + '.json', mime: 'application/json', b64: btoa(unescape(encodeURIComponent(json))) };
}
function doBackup(mode) {
  var f = backupFile();
  var m = mode === 'share' ? shareFiles([f]) : saveFiles([f]);
  S.settings.lastBackup = new Date().toISOString(); commit();
  if (m) toast(m);
}
function doRestore() {
  pickFile('', function (file) {
    var fr = new FileReader();
    fr.onload = function () {
      var d = null;
      try { var o = JSON.parse(fr.result); d = o && o.data ? o.data : o; } catch (e) { d = null; }
      if (!validState(d)) { toast('یہ بیک اپ فائل درست نہیں ہے'); return; }
      confirmBox('موجودہ سارا ڈیٹا اس بیک اپ سے بدل دیا جائے گا۔ جاری رکھیں؟', 'بحال کریں').then(function (y) {
        if (!y) return;
        try { localStorage.setItem(KEY + '_prev', JSON.stringify(S)); } catch (e) { }
        S = normalize(d); commit(); toast('بیک اپ بحال ہو گیا');
      });
    };
    fr.readAsText(file);
  });
}

/* ---------- settings: lists ---------- */
function moveIn(arr, id, dir) {
  var i = arr.map(function (o) { return o.id; }).indexOf(id), j = i + dir;
  if (i < 0 || j < 0 || j >= arr.length) return;
  var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
}
function byId(arr, id) { return arr.filter(function (o) { return o.id === id; })[0]; }

/* ---------- event wiring ---------- */
function onAct(a, v) {
  var p;
  switch (a) {
    case 'go-roster': go('roster'); break;
    case 'go-status': go('status'); break;
    case 'today': setDate(todayISO()); break;
    case 'preview': showReport(); break;
    case 'bk-share': doBackup('share'); break;
    case 'bk-save': doBackup('save'); break;
    case 'bk-restore': doRestore(); break;
    case 'copyprev':
      var pv = lastRosterBefore(S.date);
      if (!pv) { toast('کوئی پچھلا روسٹر موجود نہیں'); break; }
      confirmBox(fmtDate(pv) + ' کے روسٹر کی نقل اس تاریخ (' + fmtDate(S.date) + ') پر بنائی جائے؟ موجودہ پوائنٹ ڈیوٹی بدل جائے گی۔', 'نقل بنائیں')
        .then(function (y) { if (y) { copyRoster(pv, S.date); commit(); toast('نقل بن گئی'); } });
      break;
    case 'clear':
      confirmBox('اس تاریخ (' + fmtDate(S.date) + ') کا پورا روسٹر صاف کر دیا جائے؟', 'صاف کریں').then(function (y) {
        if (y) { S.rosters[S.date] = { assign: {}, status: {} }; commit(); toast('روسٹر صاف ہو گیا'); }
      });
      break;
    case 'addp': p = v.split('|'); pickStaff({ g: p[0], title: (p[0] === 'M' ? 'میل اہلکار چنیں' : 'فیمیل اہلکار چنیں'), onPick: function (id) { var a2 = pa(p[1]); if (a2.staff.indexOf(id) < 0) a2.staff.push(id); } }); break;
    case 'rm': p = v.split('|'); var ar = pa(p[0]); ar.staff = ar.staff.filter(function (x) { return x !== p[1]; }); commit(); break;
    case 'cyc': pickCycles(v); break;
    case 'addc': p = v.split('|'); pickStaff({ g: p[0], title: (p[0] === 'M' ? 'میل اہلکار چنیں' : 'فیمیل اہلکار چنیں'), onPick: function (id) { var l = stList(p[1]); if (l.indexOf(id) < 0) l.push(id); } }); break;
    case 'rmc': p = v.split('|'); var rl = curRoster(); rl.status[p[0]] = (rl.status[p[0]] || []).filter(function (x) { return x !== p[1]; }); commit(); break;
    case 'sec': openSec = (openSec === v ? '' : v); render(); break;
    case 'lab-reset': S.settings.labels = JSON.parse(JSON.stringify(DEF_LABELS)); commit(); toast('اصل عنوان بحال ہو گئے'); break;
    case 'stf': stFilter = v; render(); break;
    case 'st-add': staffForm(null); break;
    case 'st-bulk': bulkNames(); break;
    case 'st-edit': staffForm(v); break;
    case 'st-del':
      var s = staffById(v), inUse = staffInCurrentRoster(v);
      confirmBox((inUse ? 'خبردار: یہ اہلکار آج کے روسٹر میں لگا ہوا ہے۔ ' : '') + 'اہلکار ' + s.no + ' ' + s.name + ' حذف کر دیا جائے؟', 'حذف کریں').then(function (y) {
        if (!y) return;
        removeStaffEverywhere(v); S.staff = S.staff.filter(function (x) { return x.id !== v; }); commit(); toast('حذف ہو گیا');
      });
      break;
    case 'pt-add': textSheet('نیا پوائنٹ', 'پوائنٹ کا نام', '', function (n) { S.points.push({ id: nid('P'), name: n }); commit(); }); break;
    case 'pt-ren': textSheet('پوائنٹ کا نام', 'نام', byId(S.points, v).name, function (n) { byId(S.points, v).name = n; commit(); }); break;
    case 'pt-up': moveIn(S.points, v, -1); commit(); break;
    case 'pt-dn': moveIn(S.points, v, 1); commit(); break;
    case 'pt-del':
      confirmBox('پوائنٹ «' + byId(S.points, v).name + '» حذف کر دیا جائے؟ اس پر لگے اہلکار اور سائیکل فری ہو جائیں گے۔', 'حذف کریں').then(function (y) {
        if (!y) return;
        S.points = S.points.filter(function (x) { return x.id !== v; });
        Object.keys(S.rosters).forEach(function (d) { delete S.rosters[d].assign[v]; });
        commit();
      });
      break;
    case 'ct-add': textSheet('نئی قسم', 'نام (مثلاً ریسٹ، آؤٹ ڈور، لیو)', '', function (n) { S.cats.push({ id: nid('C'), name: n }); commit(); }); break;
    case 'ct-ren': textSheet('قسم کا نام', 'نام', byId(S.cats, v).name, function (n) { byId(S.cats, v).name = n; commit(); }); break;
    case 'ct-up': moveIn(S.cats, v, -1); commit(); break;
    case 'ct-dn': moveIn(S.cats, v, 1); commit(); break;
    case 'ct-del':
      confirmBox('قسم «' + byId(S.cats, v).name + '» حذف کر دی جائے؟ اس میں شامل اہلکار فری ہو جائیں گے۔', 'حذف کریں').then(function (y) {
        if (!y) return;
        S.cats = S.cats.filter(function (x) { return x.id !== v; });
        Object.keys(S.rosters).forEach(function (d) { delete S.rosters[d].status[v]; });
        commit();
      });
      break;
    case 'cy-save':
      var txt = $('#cycIn').value, seen = {}, out = [];
      txt.split(/[\s,،;]+/).forEach(function (tk) {
        if (!tk) return;
        var m = tk.match(/^(\d+)-(\d+)$/);
        if (m) { var a1 = parseInt(m[1], 10), b1 = parseInt(m[2], 10); for (var n = a1; n <= b1 && n - a1 < 500; n++) { if (!seen[n]) { seen[n] = 1; out.push(String(n)); } } }
        else if (!seen[tk]) { seen[tk] = 1; out.push(tk); }
      });
      S.cycles = out.sort(numSort); commit(); toast('سائیکل نمبر محفوظ ہو گئے'); break;
    case 'sig-draw': sigPad(); break;
    case 'sig-pick': pickFile('image/*', sigFromFile); break;
    case 'sig-del': confirmBox('محفوظ شدہ سگنیچر حذف کر دیا جائے؟', 'حذف کریں').then(function (y) { if (y) { S.settings.sigImg = ''; commit(); } }); break;
  }
}
function initUI() {
  var view = $('#view');
  view.addEventListener('click', function (e) {
    var t = e.target.closest('[data-act]');
    if (t) { onAct(t.getAttribute('data-act'), t.getAttribute('data-v')); }
  });
  view.addEventListener('input', function (e) {
    if (e.target.id !== 'stQ') return;
    stQ = e.target.value.trim();
    $$('.stitem').forEach(function (el) { el.style.display = (!stQ || el.getAttribute('data-q').indexOf(stQ.toLowerCase()) >= 0) ? '' : 'none'; });
  });
  view.addEventListener('change', function (e) {
    var t = e.target;
    if (t.id === 'dateIn') { setDate(t.value); return; }
    if (t.id === 'sigOn') { S.settings.sigOn = t.checked; save(); toast(t.checked ? 'سگنیچر سیکشن آن' : 'سگنیچر سیکشن آف'); return; }
    if (t.id === 'sigName') { S.settings.sigName = t.value.trim(); save(); return; }
    if (t.id === 'sigDesig') { S.settings.sigDesig = t.value.trim(); save(); return; }
    var k = t.getAttribute && t.getAttribute('data-lab');
    if (k) { S.settings.labels[k] = t.value.trim() || DEF_LABELS[k]; save(); }
  });
  $('#nav').addEventListener('click', function (e) {
    var t = e.target.closest('[data-tab]'); if (t) go(t.getAttribute('data-tab'));
  });
  window.__back = function () {
    if (dlgOpen && dlgDone) { dlgDone(false); return true; }
    if (sheetOpen()) { closeSheet(); return true; }
    if (tab !== 'dash') { go('dash'); return true; }
    return false;
  };
  render();
}
initUI();
