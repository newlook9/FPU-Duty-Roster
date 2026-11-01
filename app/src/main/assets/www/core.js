'use strict';
/* ====== FPU Duty Roster - core: state, storage, helpers ====== */
var KEY = 'fpu_duty_roster_v1';
var FF = 'Jameel, Roboto, "Noto Sans", Arial, sans-serif';

function $(s, r) { return (r || document).querySelector(s); }
function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}
var _uid = 0;
function nid(p) { return p + Date.now().toString(36) + (_uid++).toString(36); }
function pad2(n) { return (n < 10 ? '0' : '') + n; }
function fmtDate(iso) { var a = String(iso).split('-'); return a[2] + '-' + a[1] + '-' + a[0]; }
function todayISO() { var d = new Date(); return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); }
function numSort(a, b) { var x = parseInt(a, 10), y = parseInt(b, 10); if (isNaN(x) || isNaN(y)) return String(a).localeCompare(String(b)); return x - y; }

var DEF_LABELS = {
  title: 'FPU ڈیوٹی روسٹر',
  dateLabel: 'بتاریخ',
  colSr: 'نمبر شمار',
  colPoint: 'پوائنٹ',
  colName: 'نام مع نمبر',
  colMobile: 'موبائل',
  colWl: 'فون + وائرلیس',
  colCycle: 'سائیکل نمبر',
  title2: 'اسٹاف کی تفصیل',
  male: 'میل اسٹاف',
  female: 'فیمیل اسٹاف',
  total: 'کل',
  onDuty: 'ڈیوٹی پر',
  left: 'بقیہ',
  sigTitle: 'تیار کردہ بذریعہ'
};
var LAB_NAMES = {
  title: 'رپورٹ کا عنوان (صفحہ 1)', dateLabel: 'تاریخ سے پہلے لفظ',
  colSr: 'کالم: نمبر شمار', colPoint: 'کالم: پوائنٹ', colName: 'کالم: نام مع نمبر',
  colMobile: 'کالم: موبائل', colWl: 'کالم: فون + وائرلیس', colCycle: 'کالم: سائیکل نمبر',
  title2: 'صفحہ 2 کا عنوان', male: 'میل کا عنوان', female: 'فیمیل کا عنوان',
  total: 'لفظ: کل', onDuty: 'لفظ: ڈیوٹی پر', left: 'لفظ: بقیہ', sigTitle: 'سگنیچر کا عنوان'
};

function defaultState() {
  var M = [
    ['99710', '03075631224', '25071'], ['11301', '03044603382', '26271'], ['99800', '03234775333', '25241'],
    ['99811', '03234870371', '25034'], ['99332', '03214127011', '25078'], ['92673', '03024224228', '26169'],
    ['15958', '03044586772', '26131'], ['99764', '03024183590', '27094'], ['38295', '03244075231', '25219'],
    ['99333', '03158125992', '26187'], ['99799', '03218416251', '26971'], ['99700', '03214899698', '25209'],
    ['99323', '03244092246', '26342'], ['13022', '03024030553', '25273'], ['99756', '03225850051', '25988']
  ];
  var F = [
    ['LT2020338', '29041'], ['LT2021478', '22369'], ['LT2020194', '30972'], ['LT2020300', '32528'],
    ['LT2020056', '30947'], ['LT2020428', '29008'], ['LT2020061', '30918'], ['LT2020064', '29042'],
    ['LT2021481', '29026'], ['LT2020172', '30998'], ['LT2020043', '29009'], ['LT2020187', '30951'],
    ['LT2020301', '32640'], ['LT114', '32676']
  ];
  var staff = [];
  M.forEach(function (r, i) { staff.push({ id: 'M' + (i + 1), g: 'M', no: r[2], name: '', wl: r[0], mobile: r[1] }); });
  F.forEach(function (r, i) { staff.push({ id: 'F' + (i + 1), g: 'F', no: r[1], name: '', wl: r[0], mobile: '' }); });
  var pts = ['گریٹر اقبال پارک', 'ریس کورس پارک', 'گلشن اقبال پارک', 'لبرٹی مارکیٹ', 'ایم ایم عالم روڈ', 'پوائنٹ 6']
    .map(function (n, i) { return { id: 'P' + (i + 1), name: n }; });
  var byNo = {};
  staff.forEach(function (s) { byNo[s.no] = s.id; });
  function ids(a) { return a.map(function (n) { return byNo[n]; }); }
  var assign = {
    P1: { staff: ids(['25071', '26271', '32640', '30951']), cycles: ['4', '7', '14', '22'] },
    P2: { staff: ids(['25241', '25273', '30918', '32528']), cycles: ['8', '10', '15', '20'] },
    P3: { staff: ids(['25988', '25219', '22369', '30972']), cycles: ['6', '11', '16', '21'] },
    P4: { staff: ids(['25078', '26169', '30947', '29009']), cycles: ['5', '12', '13', '23'] },
    P5: { staff: ids(['27094']), cycles: ['3', '17', '19', '24'] },
    P6: { staff: [], cycles: ['1', '2', '18'] }
  };
  var cycles = [];
  for (var i = 1; i <= 24; i++) cycles.push(String(i));
  var rosters = {};
  rosters['2026-10-30'] = { assign: assign, status: {} };
  return {
    v: 1, staff: staff, points: pts,
    cats: [{ id: 'C1', name: 'ریسٹ' }, { id: 'C2', name: 'آؤٹ ڈور' }],
    cycles: cycles, date: '2026-10-30', rosters: rosters,
    settings: { sigOn: false, sigName: '', sigDesig: '', sigImg: '', lastBackup: '', labels: JSON.parse(JSON.stringify(DEF_LABELS)) }
  };
}

function validState(o) {
  return o && Array.isArray(o.staff) && Array.isArray(o.points) && Array.isArray(o.cats) &&
    o.rosters && typeof o.rosters === 'object' && o.settings && typeof o.settings === 'object';
}
function normalize(o) {
  o.v = 1;
  if (!Array.isArray(o.cycles)) o.cycles = [];
  if (!o.date) o.date = todayISO();
  o.staff.forEach(function (s) {
    s.g = s.g === 'F' ? 'F' : 'M';
    s.no = String(s.no == null ? '' : s.no); s.name = s.name || ''; s.wl = s.wl || ''; s.mobile = s.mobile || '';
    if (!s.id) s.id = nid('S');
  });
  var st = o.settings;
  st.sigOn = !!st.sigOn; st.sigName = st.sigName || ''; st.sigDesig = st.sigDesig || '';
  st.sigImg = st.sigImg || ''; st.lastBackup = st.lastBackup || '';
  var lb = {}; for (var k in DEF_LABELS) lb[k] = (st.labels && st.labels[k]) ? st.labels[k] : DEF_LABELS[k];
  st.labels = lb;
  return o;
}
var S = null;
function loadState() {
  try {
    var raw = localStorage.getItem(KEY);
    if (raw) { var o = JSON.parse(raw); if (validState(o)) return normalize(o); }
  } catch (e) { /* ignore */ }
  return defaultState();
}
function pruneHistory() {
  var keys = Object.keys(S.rosters).sort();
  while (keys.length > 120) { var k = keys.shift(); if (k !== S.date) delete S.rosters[k]; }
}
function save() {
  pruneHistory();
  try { localStorage.setItem(KEY, JSON.stringify(S)); }
  catch (e) { if (typeof toast === 'function') toast('ڈیٹا محفوظ نہیں ہو سکا'); }
}

/* ---- roster helpers ---- */
function curRoster() {
  if (!S.rosters[S.date]) S.rosters[S.date] = { assign: {}, status: {} };
  var r = S.rosters[S.date];
  if (!r.assign) r.assign = {};
  if (!r.status) r.status = {};
  return r;
}
function pa(pid) {
  var r = curRoster();
  if (!r.assign[pid]) r.assign[pid] = { staff: [], cycles: [] };
  return r.assign[pid];
}
function stList(cid) {
  var r = curRoster();
  if (!r.status[cid]) r.status[cid] = [];
  return r.status[cid];
}
function staffById(id) {
  for (var i = 0; i < S.staff.length; i++) if (S.staff[i].id === id) return S.staff[i];
  return null;
}
function pointPeople(pid) {
  var a = pa(pid), list = [];
  a.staff.forEach(function (id) { var s = staffById(id); if (s) list.push(s); });
  var m = list.filter(function (s) { return s.g === 'M'; });
  var f = list.filter(function (s) { return s.g === 'F'; });
  return m.concat(f);
}
function pointCycles(pid) { return pa(pid).cycles.slice().sort(numSort); }
function catPeople(cid) {
  var out = [];
  stList(cid).forEach(function (id) { var s = staffById(id); if (s) out.push(s); });
  return out;
}
/* staffId -> {t:'p'|'c', id, label} for the current date */
function usedMap() {
  var m = {}, r = curRoster();
  S.points.forEach(function (p) {
    ((r.assign[p.id] && r.assign[p.id].staff) || []).forEach(function (id) { m[id] = { t: 'p', id: p.id, label: p.name }; });
  });
  S.cats.forEach(function (c) {
    (r.status[c.id] || []).forEach(function (id) { m[id] = { t: 'c', id: c.id, label: c.name }; });
  });
  return m;
}
function cycleOwner(num, exceptPid) {
  var r = curRoster();
  for (var i = 0; i < S.points.length; i++) {
    var p = S.points[i];
    if (p.id === exceptPid) continue;
    var a = r.assign[p.id];
    if (a && a.cycles.indexOf(num) >= 0) return p;
  }
  return null;
}
function nameNo(s) { return (s.name ? s.name + ' ' : '') + s.no; }

function stats() {
  var used = usedMap();
  var out = { M: null, F: null };
  ['M', 'F'].forEach(function (g) {
    var list = S.staff.filter(function (s) { return s.g === g; });
    var o = { total: list.length, duty: 0, cats: {}, left: 0 };
    S.cats.forEach(function (c) { o.cats[c.id] = 0; });
    list.forEach(function (s) {
      var u = used[s.id];
      if (!u) o.left++;
      else if (u.t === 'p') o.duty++;
      else o.cats[u.id]++;
    });
    out[g] = o;
  });
  return out;
}
function removeStaffEverywhere(id) {
  Object.keys(S.rosters).forEach(function (d) {
    var r = S.rosters[d];
    Object.keys(r.assign || {}).forEach(function (pid) {
      r.assign[pid].staff = r.assign[pid].staff.filter(function (x) { return x !== id; });
    });
    Object.keys(r.status || {}).forEach(function (cid) {
      r.status[cid] = r.status[cid].filter(function (x) { return x !== id; });
    });
  });
}
function staffInCurrentRoster(id) { return !!usedMap()[id]; }

S = loadState();
