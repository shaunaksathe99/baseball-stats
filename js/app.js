/* Dugout Diary - single-page app. All data lives in this browser's localStorage. */
(function () {
  'use strict';

  const S = window.Stats;
  const KEY = 'dugoutDiary.v1';
  const VERSION = '0.1.0';
  const LEVELS = ['Tee Ball', 'Coach Pitch', 'Minors', 'Majors', 'Intermediate (50/70)', 'Juniors', 'Seniors', 'Travel / Club', 'Middle School', 'High School', 'College', 'Other'];
  const POSITIONS = ['', 'P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF'];
  const STATES = 'AL AK AZ AR CA CO CT DE DC FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY'.split(' ');
  const TABS = ['home', 'log', 'career', 'goals', 'about'];

  const BAT_FIELDS = [['ab', 'At bats'], ['h', 'Hits'], ['d', 'Doubles'], ['t', 'Triples'], ['hr', 'Home runs'], ['rbi', 'RBI'], ['r', 'Runs'], ['bb', 'Walks'], ['k', 'Strikeouts'], ['hbp', 'Hit by pitch'], ['sf', 'Sac flies'], ['sb', 'Stolen bases']];
  const PIT_FIELDS = [['h', 'Hits allowed'], ['r', 'Runs allowed'], ['er', 'Earned runs'], ['bb', 'Walks'], ['k', 'Strikeouts']];
  const FLD_FIELDS = [['po', 'Putouts'], ['a', 'Assists'], ['e', 'Errors']];
  const CATCHER_FIELDS = [['cs', 'Caught stealing'], ['ci', 'Catcher\u2019s interference']];

  const $ = (sel) => document.querySelector(sel);
  const main = $('#main');

  /* ---------- helpers ---------- */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  function uid(p) { return p + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  function str(v, max) { return String(v == null ? '' : v).replace(/[\u0000-\u001f\u007f<>]/g, '').trim().slice(0, max); }
  function cleanId(v) { v = String(v || '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 32); return v || uid('x'); }
  const B32 = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  const TERMS_V = 1;
  const CONTACT_EMAIL = '';   // set this before launch; shown on the Terms & Privacy page
  const hasCrypto = !!(window.crypto && window.crypto.subtle && window.crypto.getRandomValues);
  function randBytes(n) { const a = new Uint8Array(n); if (window.crypto && window.crypto.getRandomValues) window.crypto.getRandomValues(a); else for (let i = 0; i < n; i++) a[i] = Math.floor(Math.random() * 256); return a; }
  function randChars(n) { let o = ''; randBytes(n).forEach((b) => { o += B32[b % 32]; }); return o; }
  function normCode(v) { return String(v || '').toUpperCase().replace(/[^0-9A-Z]/g, '').replace(/O/g, '0').replace(/[IL]/g, '1').replace(/U/g, 'V'); }
  function cleanPid(v) { v = normCode(v); return /^[0-9A-HJKMNP-TV-Z]{8}$/.test(v) ? v : ''; }
  function fmtPid(pid) { return pid ? pid.slice(0, 4) + '-' + pid.slice(4) : ''; }
  function hexOnly(v, n) { v = String(v || '').toLowerCase(); return v.length === n && /^[0-9a-f]+$/.test(v) ? v : ''; }
  function toHex(buf) { return Array.from(new Uint8Array(buf)).map((b) => (b < 16 ? '0' : '') + b.toString(16)).join(''); }
  function fromHex(h) { const a = new Uint8Array(h.length / 2); for (let i = 0; i < a.length; i++) a[i] = parseInt(h.substr(i * 2, 2), 16); return a; }
  function derive(secret, saltHex, it) {
    return window.crypto.subtle.importKey('raw', new TextEncoder().encode(secret), 'PBKDF2', false, ['deriveBits'])
      .then((k) => window.crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: fromHex(saltHex), iterations: it }, k, 256)).then(toHex);
  }
  function cleanLock(l) {
    if (!l || typeof l !== 'object') return null;
    const s = hexOnly(l.s, 32), h = hexOnly(l.h, 64), rs = hexOnly(l.rs, 32), rh = hexOnly(l.rh, 64);
    if (!s || !h || !rs || !rh) return null;
    return { s: s, h: h, rs: rs, rh: rh, it: Math.max(10000, Math.min(500000, Math.floor(Number(l.it)) || 120000)), fails: Math.max(0, Math.min(99, Math.floor(Number(l.fails)) || 0)), until: Math.max(0, Math.min(Date.now() + 900000, Number(l.until) || 0)) };
  }
  function makeLock(pin) {
    const it = 120000, salt = toHex(randBytes(16)), rsalt = toHex(randBytes(16)), rec = randChars(12);
    return Promise.all([derive(pin, salt, it), derive(rec, rsalt, it)]).then((r) => ({ lock: { s: salt, h: r[0], rs: rsalt, rh: r[1], it: it, fails: 0, until: 0 }, recovery: rec }));
  }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function today() { const d = new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function fmtDate(iso) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
    if (!m) return iso || '';
    return new Date(+m[1], +m[2] - 1, +m[3]).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  }
  function defaultSeason() {
    const d = new Date(), m = d.getMonth();
    const name = m <= 1 || m === 11 ? 'Winter' : m <= 5 ? 'Spring' : m <= 7 ? 'Summer' : 'Fall';
    return name + ' ' + d.getFullYear();
  }
  function blank(keys) { const o = {}; keys.forEach((k) => { o[k] = 0; }); return o; }
  function plural(n, w) { return n + ' ' + w + (n === 1 ? '' : 's'); }

  /* ---------- storage ---------- */
  let memoryOnly = false;

  function emptyDb() { return { v: 1, active: null, players: [], terms: null, bk: '', bkN: 0, snooze: '' }; }

  // CS and CI only exist for a catcher; clear them for any other position.
  function catcherOnly(f, pos) { if (pos !== 'C') { f.cs = 0; f.ci = 0; } return f; }
  function cleanFi(arr) {
    if (!Array.isArray(arr)) return [];
    return arr.slice(0, 12).map((r) => {
      if (!r || typeof r !== 'object') return null;
      const pos = POSITIONS.indexOf(r.pos) > 0 ? r.pos : '';
      if (!pos) return null;
      return { i: Math.max(1, S.int(r.i, 12)), pos: pos, po: S.int(r.po), a: S.int(r.a), e: S.int(r.e), cs: pos === 'C' ? S.int(r.cs) : 0, ci: pos === 'C' ? S.int(r.ci) : 0 };
    }).filter(Boolean);
  }
  function cleanGame(g) {
    if (!g || typeof g !== 'object') return null;
    const date = String(g.date || '');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
    const fi = cleanFi(g.fi);
    const fld = fi.length
      ? S.cleanSection({ po: fi.reduce((n, r) => n + r.po, 0), a: fi.reduce((n, r) => n + r.a, 0), e: fi.reduce((n, r) => n + r.e, 0), cs: fi.reduce((n, r) => n + r.cs, 0), ci: fi.reduce((n, r) => n + r.ci, 0) }, S.FLD_KEYS)
      : catcherOnly(S.cleanSection(g.fld, S.FLD_KEYS), g.pos);
    return {
      id: cleanId(g.id),
      created: Number(g.created) || 0,
      date: date,
      season: str(g.season, 30) || 'Season',
      team: str(g.team, 40),
      level: LEVELS.indexOf(g.level) >= 0 ? g.level : '',
      opp: str(g.opp, 40),
      result: ['W', 'L', 'T'].indexOf(g.result) >= 0 ? g.result : '',
      pos: fi.length ? '' : (POSITIONS.indexOf(g.pos) >= 0 ? g.pos : ''),
      fi: fi,
      bat: S.cleanSection(g.bat, S.BAT_KEYS),
      pit: S.cleanSection(g.pit, S.PIT_KEYS),
      fld: fld
    };
  }
  function cleanGoal(x) {
    if (!x || typeof x !== 'object') return null;
    const m = S.metricById(x.metric), t = Number(x.target);
    if (!m || !isFinite(t) || t <= 0) return null;
    return { id: cleanId(x.id), metric: m.id, target: Math.min(t, 9999), scope: str(x.scope, 30) || 'career', created: Number(x.created) || Date.now() };
  }
  function cleanPlayer(p) {
    if (!p || typeof p !== 'object') return null;
    const name = str(p.name, 40);
    if (!name) return null;
    let zip = String(p.zip || '').replace(/\D/g, '').slice(0, 5);
    if (zip.length !== 5) zip = '';
    const seen = {};
    const games = (Array.isArray(p.games) ? p.games : []).slice(0, 3000).map(cleanGame).filter(Boolean).map((g) => {
      if (seen[g.id]) g.id = uid('g');
      seen[g.id] = 1;
      return g;
    });
    const goals = (Array.isArray(p.goals) ? p.goals : []).slice(0, 60).map(cleanGoal).filter(Boolean);
    const last = p.last && typeof p.last === 'object' ? p.last : {};
    return {
      id: cleanId(p.id), pid: cleanPid(p.pid) || randChars(8), lock: cleanLock(p.lock), name: name, city: str(p.city, 40),
      state: STATES.indexOf(p.state) >= 0 ? p.state : '', zip: zip,
      innings: Number(p.innings) === 7 ? 7 : 6,
      created: Number(p.created) || Date.now(),
      last: { season: str(last.season, 30), team: str(last.team, 40), level: LEVELS.indexOf(last.level) >= 0 ? last.level : '' },
      games: games, goals: goals
    };
  }
  function sanitizeDb(o) {
    const out = emptyDb();
    if (!o || typeof o !== 'object') return out;
    const ids = {}, pids = {};
    (Array.isArray(o.players) ? o.players : []).slice(0, 12).forEach((p) => {
      const c = cleanPlayer(p);
      if (!c) return;
      if (ids[c.id]) c.id = uid('p');
      ids[c.id] = 1;
      while (pids[c.pid]) c.pid = randChars(8);
      pids[c.pid] = 1;
      out.players.push(c);
    });
    const isDay = (v) => /^\d{4}-\d{2}-\d{2}$/.test(String(v));
    out.bk = isDay(o.bk) ? String(o.bk) : ''; out.bkN = S.int(o.bkN, 100000); out.snooze = isDay(o.snooze) ? String(o.snooze) : '';
    const t = o.terms && typeof o.terms === 'object' ? o.terms : null;
    if (t && Number(t.v) >= 1 && /^\d{4}-\d{2}-\d{2}$/.test(String(t.at))) out.terms = { v: Math.min(99, Number(t.v)), at: String(t.at) };
    out.active = ids[o.active] ? o.active : (out.players[0] ? out.players[0].id : null);
    return out;
  }
  function load() {
    try {
      localStorage.setItem(KEY + '.t', '1');
      localStorage.removeItem(KEY + '.t');
    } catch (e) { memoryOnly = true; return emptyDb(); }
    let raw = null;
    try { raw = localStorage.getItem(KEY); } catch (e) { memoryOnly = true; }
    if (!raw) return emptyDb();
    try {
      const o = JSON.parse(raw), d = sanitizeDb(o);
      if ((Array.isArray(o.players) ? o.players : []).some((x) => x && typeof x === 'object' && !cleanPid(x.pid))) { try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e3) { /* ignore */ } }
      return d;
    } catch (e) {
      try { localStorage.setItem(KEY + '.corrupt', raw); } catch (e2) { /* ignore */ }
      return emptyDb();
    }
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) { memoryOnly = true; renderBanner(); }
  }

  let db = load();
  const ui = { unlocked: loadUnlocked(), careerTab: 'bat', careerSeason: '', chart: { bat: 'avg', pit: 'era', fld: 'fpct' }, logTab: 'bat', draft: null, flash: '', lastTab: null, restore: null, ackKey: '', print: { fmt: 'game', copies: 2, prefill: true } };

  function loadUnlocked() {
    const o = {};
    try { (JSON.parse(sessionStorage.getItem(KEY + '.u') || '[]') || []).forEach((id) => { o[String(id)] = 1; }); } catch (e) { /* ignore */ }
    return o;
  }
  function setUnlocked(id, on) {
    if (on) ui.unlocked[id] = 1; else delete ui.unlocked[id];
    try { sessionStorage.setItem(KEY + '.u', JSON.stringify(Object.keys(ui.unlocked))); } catch (e) { /* ignore */ }
  }
  function isUnlocked(p) { return !p.lock || !!ui.unlocked[p.id]; }
  function termsOk() { return !!(db.terms && db.terms.v >= TERMS_V); }
  function tryPin(p, pin) {
    const l = p.lock, now = Date.now();
    if (l.until > now) return Promise.resolve({ ok: false, wait: Math.ceil((l.until - now) / 1000), left: 0 });
    return derive(pin, l.s, l.it).then((h) => {
      if (h === l.h) { l.fails = 0; l.until = 0; save(); return { ok: true }; }
      l.fails++;
      if (l.fails >= 5) l.until = Date.now() + Math.min(900, 30 * Math.pow(2, l.fails - 5)) * 1000;
      save();
      return { ok: false, wait: l.until > Date.now() ? Math.ceil((l.until - Date.now()) / 1000) : 0, left: Math.max(0, 5 - l.fails) };
    });
  }
  function totalGames() { return db.players.reduce((n, p) => n + p.games.length, 0); }
  function addDays(n) { const d = new Date(); d.setDate(d.getDate() + n); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function backupDue() {
    const n = totalGames();
    if (!n) return false;
    if (!db.bk) return n >= 3;
    return (Date.now() - new Date(db.bk + 'T12:00:00').getTime()) / 86400000 >= 30 || n - db.bkN >= 10;
  }
  function backupAgo() {
    if (!db.bk) return 'never';
    const d = Math.max(0, Math.round((Date.now() - new Date(db.bk + 'T12:00:00').getTime()) / 86400000));
    return d === 0 ? 'today' : d === 1 ? 'yesterday' : d + ' days ago';
  }
  function isInstalled() { try { return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true; } catch (e) { return false; } }
  function isMobile() { return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || ''); }
  function askPersist() {
    try {
      if (!(navigator.storage && navigator.storage.persist) || !db.players.length || ui.persistAsked) return;
      ui.persistAsked = true;
      navigator.storage.persisted().then((was) => (was ? true : navigator.storage.persist())).then((ok) => { ui.persist = !!ok; }, () => {});
    } catch (e) { /* ignore */ }
  }
  function safeCard() {
    if (!db.players.length || !totalGames() || (db.snooze && db.snooze >= today())) return '';
    const due = backupDue(), tip = isMobile() && !isInstalled();
    if (!due && !tip) return '';
    const why = due ? (db.bk ? 'Your last backup was ' + backupAgo() + (totalGames() - db.bkN >= 1 ? ', and you have logged ' + plural(totalGames() - db.bkN, 'game') + ' since.' : '.') : 'You have not saved a backup yet.') : 'Your diary lives in this browser.';
    return '<section class="card safe"><h3>Keep your stats safe</h3><p class="muted">' + why + ' Clearing browser data or switching phones would erase it, so save a copy now. It takes two taps.</p>' +
      '<div class="row wrap"><button class="btn grow" data-action="export">Export backup</button><button class="btn ghost grow" data-action="snooze-safe">Not now</button></div>' +
      (tip ? '<details class="pin-opt"><summary>Add Dugout Diary to your Home Screen</summary><p class="hint">iPhone: tap Share, then Add to Home Screen. Android: open the browser menu, then Install app or Add to Home screen. It opens like an app, works offline, and your browser is far less likely to clear it.</p></details>' : '') + '</section>';
  }
  function player() { return db.players.find((p) => p.id === db.active) || null; }

  /* ---------- drafts (the log form) ---------- */
  function newDraft(p) {
    const last = (p && p.last) || {};
    return {
      id: null, created: 0, date: today(), season: last.season || defaultSeason(), team: last.team || '', level: last.level || '',
      opp: '', result: '', pos: '',
      bat: blank(S.BAT_KEYS),
      pit: { ip: '', h: 0, r: 0, er: 0, bb: 0, k: 0, pitches: 0 },
      fld: blank(S.FLD_KEYS), fldMode: 'game', fi: []
    };
  }
  function draftFromGame(g) {
    return {
      id: g.id, created: g.created, date: g.date, season: g.season, team: g.team, level: g.level, opp: g.opp, result: g.result, pos: g.pos,
      bat: Object.assign({}, g.bat),
      pit: { ip: g.pit.outs ? S.fmtInnings(g.pit.outs) : '', h: g.pit.h, r: g.pit.r, er: g.pit.er, bb: g.pit.bb, k: g.pit.k, pitches: g.pit.pitches },
      fld: Object.assign({}, g.fld), fldMode: g.fi && g.fi.length ? 'inning' : 'game', fi: (g.fi || []).map((r) => Object.assign({}, r))
    };
  }
  function draftToSections(d) {
    const outs = S.parseInnings(d.pit.ip);
    const inning = d.fldMode === 'inning';
    const fi = inning ? d.fi.filter((r) => r.pos).map((r) => ({ i: S.int(r.i, 12) || 1, pos: r.pos, po: S.int(r.po), a: S.int(r.a), e: S.int(r.e), cs: r.pos === 'C' ? S.int(r.cs) : 0, ci: r.pos === 'C' ? S.int(r.ci) : 0 })) : [];
    return {
      bat: S.cleanSection(d.bat, S.BAT_KEYS),
      pit: S.cleanSection({ outs: outs || 0, h: d.pit.h, r: d.pit.r, er: d.pit.er, bb: d.pit.bb, k: d.pit.k, pitches: d.pit.pitches }, S.PIT_KEYS),
      fld: inning
        ? S.cleanSection({ po: fi.reduce((n, r) => n + r.po, 0), a: fi.reduce((n, r) => n + r.a, 0), e: fi.reduce((n, r) => n + r.e, 0), cs: fi.reduce((n, r) => n + r.cs, 0), ci: fi.reduce((n, r) => n + r.ci, 0) }, S.FLD_KEYS)
        : catcherOnly(S.cleanSection(d.fld, S.FLD_KEYS), d.pos),
      fi: fi,
      ipBad: outs === null
    };
  }

  /* ---------- text builders ---------- */
  function batText(b) {
    const parts = [b.h + '-for-' + b.ab];
    if (b.d) parts.push(b.d + ' 2B');
    if (b.t) parts.push(b.t + ' 3B');
    if (b.hr) parts.push(b.hr + ' HR');
    if (b.rbi) parts.push(b.rbi + ' RBI');
    if (b.r) parts.push(b.r + ' R');
    if (b.bb) parts.push(b.bb + ' BB');
    if (b.k) parts.push(b.k + ' K');
    if (b.sb) parts.push(b.sb + ' SB');
    return parts.join(', ');
  }
  function pitText(p) {
    let t = S.fmtInnings(p.outs) + ' IP, ' + p.h + ' H, ' + p.er + ' ER, ' + p.bb + ' BB, ' + p.k + ' K';
    if (p.pitches) t += ', ' + p.pitches + ' pitches';
    return t;
  }
  function rangeText(nums) {
    const u = Array.from(new Set(nums)).sort((a, b) => a - b), out = [];
    let st = u[0], prev = u[0];
    for (let k = 1; k <= u.length; k++) {
      const n = u[k];
      if (n === prev + 1) { prev = n; continue; }
      out.push(st === prev ? String(st) : st + '–' + prev);
      st = n; prev = n;
    }
    return out.join(', ');
  }
  function fiText(g) {
    const order = [], by = {};
    g.fi.forEach((r) => { if (!by[r.pos]) { by[r.pos] = { inn: [], po: 0, a: 0, e: 0, cs: 0, ci: 0 }; order.push(r.pos); } const x = by[r.pos]; x.inn.push(r.i); x.po += r.po; x.a += r.a; x.e += r.e; x.cs += r.cs || 0; x.ci += r.ci || 0; });
    return order.map((pos) => pos + ' inn ' + rangeText(by[pos].inn) + ': ' + by[pos].po + ' PO, ' + by[pos].a + ' A, ' + by[pos].e + ' E' + (by[pos].cs ? ', ' + by[pos].cs + ' CS' : '') + (by[pos].ci ? ', ' + by[pos].ci + ' CI' : '')).join(' \u00B7 ');
  }
  function fldLine(g) { return g.fi && g.fi.length ? fiText(g) : fldText(g.fld, g.pos); }
  function fldText(f, pos) { return (pos ? pos + ': ' : '') + f.po + ' PO, ' + f.a + ' A, ' + f.e + ' E' + (f.cs ? ', ' + f.cs + ' CS' : '') + (f.ci ? ', ' + f.ci + ' CI' : ''); }
  function placeText(p) {
    if (p.city && p.state) return p.city + ', ' + p.state;
    if (p.zip) return 'ZIP ' + p.zip;
    return p.city || p.state || '';
  }

  /* ---------- share cards (image + link; nothing is uploaded) ---------- */
  function b64e(o) {
    const bytes = new TextEncoder().encode(JSON.stringify(o));
    let bin = '';
    bytes.forEach((b) => { bin += String.fromCharCode(b); });
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function b64d(s) {
    s = String(s).replace(/-/g, '+').replace(/_/g, '/');
    while (s.length % 4) s += '=';
    const bin = atob(s);
    return JSON.parse(new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0))));
  }
  function buildCard(p, scope, withCity) {
    let pool, label, one = false;
    if (scope.indexOf('game:') === 0) {
      const g = p.games.find((x) => x.id === scope.slice(5));
      pool = g ? [g] : []; label = g ? fmtDate(g.date) : ''; one = !!g;
    } else if (scope === 'all') { pool = p.games; label = 'Career'; }
    else { pool = p.games.filter((g) => g.season === scope); label = scope; }
    const last = S.sortGames(pool).slice(-1)[0] || {};
    const b = S.batting(pool), pi = S.pitching(pool, p.innings), f = S.fielding(pool);
    const pick = (o, keys) => { const r = {}; keys.forEach((k) => { r[k] = o[k]; }); return r; };
    return {
      v: 1, id: p.pid, n: p.name, l: withCity ? placeText(p) : '', k: label, t: last.team || '', lv: last.level || '', g: pool.length, one: one ? 1 : 0, i: p.innings,
      bat: pick(b, S.BAT_KEYS), pit: pick(pi, S.PIT_KEYS), fld: pick(f, S.FLD_KEYS),
      b: S.badges(p.games).filter((x) => x.earned).map((x) => x.id)
    };
  }
  // Cards arrive from links anyone can craft, so every field is re-validated.
  function sanitizeCard(o) {
    if (!o || typeof o !== 'object' || o.v !== 1) return null;
    const name = str(o.n, 40);
    if (!name) return null;
    const ids = S.badgeIds();
    return {
      v: 1, id: cleanPid(o.id), n: name, l: str(o.l, 60), k: str(o.k, 30), t: str(o.t, 40), lv: LEVELS.indexOf(o.lv) >= 0 ? o.lv : '',
      g: S.int(o.g, 3000), one: o.one ? 1 : 0, i: Number(o.i) === 7 ? 7 : 6,
      bat: S.cleanSection(o.bat, S.BAT_KEYS), pit: S.cleanSection(o.pit, S.PIT_KEYS), fld: S.cleanSection(o.fld, S.FLD_KEYS),
      b: (Array.isArray(o.b) ? o.b : []).filter((x, i, a) => ids.indexOf(x) >= 0 && a.indexOf(x) === i).slice(0, 20)
    };
  }
  function cardFacts(c) {
    const pg = [{ date: '2000-01-01', bat: c.bat, pit: c.pit, fld: c.fld }];
    const b = S.batting(pg), pi = S.pitching(pg, c.i), f = S.fielding(pg);
    const hitter = b.ab > 0, pitcher = pi.outs > 0;
    let heads, rows;
    if (pitcher && !hitter) {
      heads = [['ERA', S.fmtEra(pi.era)], ['K', pi.k], ['IP', pi.ipText]];
      rows = [['WHIP', S.fmtEra(pi.whip)], ['BB', pi.bb], ['H', pi.h], ['ER', pi.er]];
    } else if (hitter) {
      heads = c.one ? [['H-AB', b.h + '-' + b.ab], ['HR', b.hr], ['RBI', b.rbi]] : [['AVG', S.fmtRate(b.avg)], ['HR', b.hr], ['RBI', b.rbi]];
      rows = c.one ? [['R', b.r], ['BB', b.bb], ['K', b.k], ['SB', b.sb]] : [['OBP', S.fmtRate(b.obp)], ['SLG', S.fmtRate(b.slg)], ['H', b.h], ['SB', b.sb]];
      if (pitcher) rows = c.one ? [['R', b.r], ['BB', b.bb], ['IP', pi.ipText], ['K (P)', pi.k]] : [['OBP', S.fmtRate(b.obp)], ['H', b.h], ['ERA', S.fmtEra(pi.era)], ['K (P)', pi.k]];
    } else {
      heads = [['GAMES', c.g], ['PO', f.po], ['E', f.e]];
      rows = [['A', f.a], ['FPCT', S.fmtRate(f.fpct)], ['BB', b.bb], ['SB', b.sb]];
    }
    return { heads: heads, rows: rows };
  }
  function rrect(x, a, b, w, h, r) {
    x.beginPath(); x.moveTo(a + r, b); x.arcTo(a + w, b, a + w, b + h, r); x.arcTo(a + w, b + h, a, b + h, r); x.arcTo(a, b + h, a, b, r); x.arcTo(a, b, a + w, b, r); x.closePath();
  }
  function drawCard(cv, c) {
    const W = 1080, H = 1350, slab = 'Rockwell, "Roboto Slab", Georgia, "Times New Roman", serif', sans = 'system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif';
    const paint = () => {
      cv.width = W; cv.height = H;
      const x = cv.getContext('2d');
      const bg = x.createLinearGradient(0, 0, W, H); bg.addColorStop(0, '#22421f'); bg.addColorStop(1, '#0a160a');
      x.fillStyle = bg; x.fillRect(0, 0, W, H);
      x.globalAlpha = 0.07; x.fillStyle = '#f4f1e8'; x.beginPath(); x.arc(W - 120, 260, 340, 0, Math.PI * 2); x.fill(); x.globalAlpha = 1;
      x.lineWidth = 14; x.strokeStyle = '#e07b45'; rrect(x, 36, 36, W - 72, H - 72, 52); x.stroke();
      x.textAlign = 'center'; x.textBaseline = 'alphabetic';
      x.fillStyle = '#f2c14e'; x.font = '700 40px ' + sans;
      x.fillText([c.k, c.lv].filter(Boolean).join('  ·  ').toUpperCase().slice(0, 44), W / 2, 130);
      let size = 108; x.fillStyle = '#f4f1e8';
      do { x.font = size + 'px ' + slab; size -= 4; } while (x.measureText(c.n).width > W - 160 && size > 40);
      x.fillText(c.n, W / 2, 275);
      x.fillStyle = '#a9b9a5'; x.font = '600 40px ' + sans;
      x.fillText([c.t, c.l].filter(Boolean).join('  ·  ').slice(0, 50) || (c.g + (c.g === 1 ? ' game' : ' games')), W / 2, 345);
      if (c.id) { x.fillStyle = '#f2c14e'; x.font = '700 28px ui-monospace, Menlo, Consolas, monospace'; x.fillText('PLAYER ID  ' + fmtPid(c.id), W / 2, 392); }
      const f = cardFacts(c);
      const bw = 290, gap = 30, left = (W - (bw * 3 + gap * 2)) / 2;
      f.heads.forEach((h, i) => {
        const bx = left + i * (bw + gap);
        x.fillStyle = 'rgba(0,0,0,0.3)'; rrect(x, bx, 410, bw, 310, 28); x.fill();
        x.strokeStyle = 'rgba(244,241,232,0.15)'; x.lineWidth = 3; x.stroke();
        x.fillStyle = '#f2c14e'; x.font = '112px ' + slab; x.fillText(String(h[1]), bx + bw / 2, 590);
        x.fillStyle = '#a9b9a5'; x.font = '700 38px ' + sans; x.fillText(h[0], bx + bw / 2, 670);
      });
      const sw = 215, sg = 20, sl = (W - (sw * 4 + sg * 3)) / 2;
      f.rows.forEach((r, i) => {
        const bx = sl + i * (sw + sg);
        x.fillStyle = 'rgba(0,0,0,0.22)'; rrect(x, bx, 765, sw, 150, 22); x.fill();
        x.fillStyle = '#f4f1e8'; x.font = '54px ' + slab; x.fillText(String(r[1]), bx + sw / 2, 845);
        x.fillStyle = '#a9b9a5'; x.font = '700 28px ' + sans; x.fillText(r[0], bx + sw / 2, 890);
      });
      const icons = {}; S.badges([]).forEach((b) => { icons[b.id] = b.icon; });
      x.fillStyle = '#a9b9a5'; x.font = '700 30px ' + sans;
      x.fillText(c.b.length ? c.b.length + (c.b.length === 1 ? ' BADGE EARNED' : ' BADGES EARNED') : 'BADGES: JUST GETTING STARTED', W / 2, 990);
      x.font = '70px ' + sans; x.fillStyle = '#f4f1e8';
      x.fillText(c.b.slice(0, 8).map((id) => icons[id]).join(' '), W / 2, 1085);
      x.fillStyle = '#e07b45'; rrect(x, 190, 1150, W - 380, 96, 48); x.fill();
      x.fillStyle = '#1d0f07'; x.font = '800 42px ' + sans; x.fillText('Build your own card — free', W / 2, 1214);
      x.fillStyle = '#a9b9a5'; x.font = '600 32px ' + sans;
      x.fillText((location.host + location.pathname).replace(/index\.html$/, '').replace(/\/$/, '') || 'Dugout Diary', W / 2, 1296);
    };
    paint();
  }

  /* ---------- modal ---------- */
  function openModal(html) {
    const root = $('#modal-root');
    if (!root.firstChild) ui.restore = document.activeElement;
    root.innerHTML = '<div class="modal-bg" data-action="modal-bg"><div class="modal" role="dialog" aria-modal="true" tabindex="-1">' + html + '</div></div>';
    const m = root.querySelector('.modal');
    m.focus();
    return m;
  }
  function closeModal() {
    $('#modal-root').innerHTML = '';
    if (ui.restore && ui.restore.focus && document.contains(ui.restore)) { try { ui.restore.focus({ preventScroll: true }); } catch (e) { /* ignore */ } }
    ui.restore = null;
  }
  function confirmModal(title, text, label, action, id) {
    openModal('<h3>' + esc(title) + '</h3><p>' + esc(text) + '</p><div class="actions"><button class="btn ghost" data-action="modal-close">Cancel</button><button class="btn" data-action="' + action + '" data-id="' + esc(id || '') + '">' + esc(label) + '</button></div>');
  }

  /* ---------- chrome (header, tabs, banner) ---------- */
  function renderBanner() {
    $('#banner').innerHTML = memoryOnly
      ? '<div class="notice" role="alert"><b>Heads up:</b> your browser is not letting this page save data (private mode?). Stats will disappear when you close the tab, so use <b>About &rarr; Export backup</b> before leaving.</div>'
      : '';
  }
  function renderChrome(tab, p) {
    const who = $('#who');
    who.hidden = !p;
    if (p) { who.textContent = (p.lock ? '🔒 ' : '') + p.name + (db.players.length > 1 ? ' ▾' : ''); who.setAttribute('aria-label', 'Player: ' + p.name + '. Switch or add player'); }
    const prog = $('#progress');
    prog.hidden = !p || !isUnlocked(p);
    if (p && isUnlocked(p)) {
      const bs = S.badges(p.games), n = bs.filter((b) => b.earned).length, pct = Math.round((n / bs.length) * 100);
      $('#bar-fill').style.width = pct + '%';
      $('.bar').setAttribute('aria-valuenow', pct);
      $('#bar-text').textContent = n + ' of ' + bs.length + ' badges';
    }
    document.querySelectorAll('.tabs a').forEach((a) => {
      if (a.dataset.tab === (tab === 'print' ? 'log' : tab === 'terms' ? 'about' : tab)) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    renderBanner();
  }

  /* ---------- views: shared pieces ---------- */
  function stateOptions(sel) {
    return '<option value="">State</option>' + STATES.map((s) => '<option' + (s === sel ? ' selected' : '') + '>' + s + '</option>').join('');
  }
  function playerForm(p) {
    const v = p || { name: '', city: '', state: '', zip: '' };
    return '<form data-form="player" data-id="' + esc(p ? p.id : '') + '" novalidate>' +
      '<div class="error" data-errbox hidden role="alert"></div>' +
      '<div class="field"><label for="pf-name">Player name</label><input id="pf-name" name="name" type="text" maxlength="40" autocomplete="off" placeholder="First name or nickname" value="' + esc(v.name) + '"><p class="hint">A first name or nickname is perfectly fine.</p></div>' +
      '<div class="grid2"><div class="field"><label for="pf-city">City</label><input id="pf-city" name="city" type="text" maxlength="40" autocomplete="off" value="' + esc(v.city) + '"></div>' +
      '<div class="field"><label for="pf-state">State</label><select id="pf-state" name="state">' + stateOptions(v.state) + '</select></div></div>' +
      '<div class="field"><label for="pf-zip">&hellip;or just a ZIP code</label><input id="pf-zip" name="zip" type="text" inputmode="numeric" maxlength="5" autocomplete="off" placeholder="5-digit ZIP" value="' + esc(v.zip) + '"></div>' +
      (p ? '' : (hasCrypto ? '<details class="pin-opt"><summary>Protect with a PIN (optional)</summary><p class="hint">Keeps teammates and siblings out of this diary on a shared device.</p>' +
        '<div class="grid2"><div class="field"><label for="pf-pin">PIN (4 to 8 digits)</label><input id="pf-pin" name="pin" type="password" inputmode="numeric" autocomplete="off" maxlength="8"></div>' +
        '<div class="field"><label for="pf-pin2">Repeat PIN</label><input id="pf-pin2" name="pin2" type="password" inputmode="numeric" autocomplete="off" maxlength="8"></div></div></details>' : '') +
        (termsOk() ? '' : '<label class="check agree"><input type="checkbox" name="agree" id="pf-agree"> <span>I agree to the <a href="#terms">Terms &amp; Privacy Notice</a>. Younger players: please read them with a parent or guardian.</span></label>')) +
      '<button class="btn block" type="submit">' + (p ? 'Save player card' : 'Create player card') + '</button>' +
      '<p class="hint">We never ask for birthdays, emails, phone numbers, or photos.</p></form>';
  }
  function footer() { return '<p class="footer">&copy; 2026 Dugout Diary &middot; v' + VERSION + ' &middot; Free for every ballplayer &middot; <a href="#terms">Terms &amp; Privacy</a></p>'; }
  function emptyState(icon, title, text, btn) {
    return '<div class="card empty"><div class="big" aria-hidden="true">' + icon + '</div><h3>' + esc(title) + '</h3><p>' + esc(text) + '</p>' + (btn || '') + '</div>';
  }
  function gameItem(g, withActions) {
    const lines = [];
    if (S.hasBat(g)) lines.push('<div class="line">⚾ ' + esc(batText(g.bat)) + '</div>');
    if (S.hasPit(g)) lines.push('<div class="line">🔥 ' + esc(pitText(g.pit)) + '</div>');
    if (S.hasFld(g)) lines.push('<div class="line">🧤 ' + esc(fldLine(g)) + '</div>');
    const head = (g.result ? '<span class="pill ' + g.result + '">' + g.result + '</span>' : '') +
      esc(fmtDate(g.date)) + (g.opp ? ' &middot; vs ' + esc(g.opp) : '');
    const sub = [g.season, g.team, g.level].filter(Boolean).map(esc).join(' &middot; ');
    return '<li><div class="meta">' + head + '</div>' + lines.join('') + '<div class="meta">' + sub + '</div>' +
      (withActions ? '<div class="row" style="margin-top:8px"><button class="btn ghost small" data-action="edit-game" data-id="' + esc(g.id) + '">Edit</button><button class="btn ghost small" data-action="delete-game" data-id="' + esc(g.id) + '">Delete</button></div>' : '') + '</li>';
  }

  /* ---------- views ---------- */
  function viewHome(p) {
    if (!p) {
      return '<section class="card hero"><p class="eyebrow">Free &middot; Private &middot; No sign-up</p>' +
        '<h2>Build your baseball career, one game at a time.</h2>' +
        '<p class="muted">Log games in under a minute, watch your batting, pitching and fielding numbers grow, and earn badges along the way.</p>' +
        '<div class="stats"><div class="stat"><b>3</b><span>Stat types</span></div><div class="stat"><b>0</b><span>Emails asked</span></div><div class="stat"><b>Free</b><span>No paywall</span></div></div></section>' +
        '<section class="card"><h3>Start your player card</h3>' + playerForm(null) + '</section>' +
        '<section class="card"><h3>How it works</h3><ol class="steps">' +
        '<li><div><b>Create a player card.</b><br><span class="muted">Just a name and where you play. No birthday, no email.</span></div></li>' +
        '<li><div><b>Log a game.</b><br><span class="muted">Big buttons built for the bleachers, or <a href="#print">print a sheet</a> to fill in by hand at the game.</span></div></li>' +
        '<li><div><b>Watch your career grow.</b><br><span class="muted">AVG, OBP, ERA and more are calculated for you, with trend charts.</span></div></li>' +
        '<li><div><b>Set goals, earn badges.</b><br><span class="muted">Your numbers stay private on your own device.</span></div></li></ol></section>' + footer();
    }
    const bat = S.batting(p.games), pit = S.pitching(p.games, p.innings);
    const earned = S.badges(p.games).filter((b) => b.earned).length;
    const recent = S.sortGames(p.games).reverse().slice(0, 3);
    const streak = S.hitStreak(p.games);
    return '<section class="card hero"><p class="eyebrow">' + esc(placeText(p)) + '</p><h2>Welcome back, ' + esc(p.name) + '!</h2>' +
      '<p class="muted">' + (p.games.length ? 'You have logged ' + plural(p.games.length, 'game') + '. Keep the story going.' : 'Log your first game to start your career card.') + '</p>' +
      '<div class="stats four"><div class="stat"><b>' + p.games.length + '</b><span>Games</span></div><div class="stat"><b>' + S.fmtRate(bat.avg) + '</b><span>AVG</span></div><div class="stat"><b>' + S.fmtEra(pit.era) + '</b><span>ERA</span></div><div class="stat"><b>' + earned + '</b><span>Badges</span></div></div>' +
      '<div class="row wrap" style="margin-top:16px"><button class="btn grow" data-action="go" data-to="log">Log a game &rarr;</button><button class="btn ghost grow" data-action="go" data-to="career">My career</button></div>' +
      (p.games.length ? '<button class="btn ghost block" style="margin-top:10px" data-action="share-open">📣 Share my player card</button>' : '') + '</section>' +
      safeCard() +
      (streak.current >= 2 ? '<section class="card"><b>🔥 ' + streak.current + '-game hit streak!</b><span class="muted small"> Best: ' + streak.best + '</span></section>' : '') +
      '<section class="card"><h3>Recent games</h3>' + (recent.length ? '<ul class="games">' + recent.map((g) => gameItem(g, false)).join('') + '</ul>' : '<p class="muted">Nothing yet. Your first game is a big one!</p>') + '</section>' +
      '<section class="card"><div class="row between"><div><b>No phone in the dugout?</b><br><span class="muted small">Print a game sheet, fill it in by hand, then enter it here later.</span></div><a class="btn small" href="#print">Print</a></div></section>' +
      '<p style="text-align:center"><button class="link" data-action="new-player">+ Add another player</button></p>' + footer();
  }

  function stepper(sec, key, label, val, opts) {
    opts = opts || {};
    const id = 'f-' + sec + '-' + (opts.idx !== undefined ? opts.idx + '-' : '') + key;
    const idx = opts.idx !== undefined ? ' data-idx="' + opts.idx + '"' : '';
    return '<div class="stepper' + (opts.wide ? ' wide' : '') + '"><label for="' + id + '">' + esc(label) + '</label><div class="ctl">' +
      '<button type="button" data-action="step" data-d="-1" aria-label="Decrease ' + esc(label) + '">−</button>' +
      '<input id="' + id + '" type="number" inputmode="numeric" min="0" max="' + (opts.max || 999) + '" value="' + val + '" data-sec="' + sec + '" data-key="' + key + '"' + idx + '>' +
      '<button type="button" data-action="step" data-d="1" aria-label="Increase ' + esc(label) + '">+</button></div></div>';
  }

  function viewLog(p) {
    if (!ui.draft) ui.draft = newDraft(p);
    const d = ui.draft, editing = !!d.id, tab = ui.logTab;
    let fields = '';
    if (tab === 'bat') {
      fields = '<div class="steppers">' + BAT_FIELDS.map((f) => stepper('bat', f[0], f[1], d.bat[f[0]])).join('') + '</div>' +
        '<p class="hint">At-bats (AB) do <b>not</b> include walks, hit-by-pitch, or sacrifice flies and bunts. Those have their own boxes and count toward on-base percentage instead.</p>';
    } else if (tab === 'pit') {
      fields = '<div class="steppers">' +
        '<div class="stepper wide"><label for="f-pit-ip">Innings pitched <span class="muted">(like 3 1/3)</span></label><div class="ctl">' +
        '<button type="button" data-action="ipstep" data-d="-1" aria-label="Subtract one out (one third of an inning)">−</button>' +
        '<input id="f-pit-ip" type="text" inputmode="text" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="e.g. 3 1/3" value="' + esc(d.pit.ip) + '" data-ip="1">' +
        '<button type="button" data-action="ipstep" data-d="1" aria-label="Add one out (one third of an inning)">+</button></div></div>' +
        PIT_FIELDS.map((f) => stepper('pit', f[0], f[1], d.pit[f[0]])).join('') + stepper('pit', 'pitches', 'Pitches thrown', d.pit.pitches, { wide: true }) + '</div>' +
        '<p class="hint">Write innings the baseball way: <b>3 1/3</b> means 3 innings and 1 out, and <b>3.1</b> works too. The − and + buttons move one out (⅓ inning) at a time.</p>' +
        '<p class="hint"><b>ER</b> is earned runs only. Runs that score because of a fielding error are unearned: they count in Runs allowed but not in ERA.</p><p class="hint">Tracking pitches helps you and your coach follow your league’s pitch-count and rest rules.</p>';
    } else {
      const catcherHint = '<p class="hint"><b>CS</b> is a runner you threw out trying to steal (you normally get an assist too). <b>CI</b> is catcher\u2019s interference. It is scored as an error on the catcher, so add it to Errors as well.</p>';
      const fm = d.fldMode;
      const posOpts = (sel, blankLabel) => POSITIONS.map((x) => '<option value="' + x + '"' + (x === sel ? ' selected' : '') + '>' + (x || blankLabel) + '</option>').join('');
      const modeBtn = (k, label) => '<button type="button" data-action="fldmode" data-val="' + k + '" aria-pressed="' + (fm === k) + '">' + label + '</button>';
      fields = '<div class="seg" role="group" aria-label="Fielding style">' + modeBtn('game', 'Whole game') + modeBtn('inning', 'By inning') + '</div>';
      if (fm === 'game') {
        fields += '<div class="field"><label for="f-pos">Position played</label><select id="f-pos" data-field="pos">' + posOpts(d.pos, 'Not sure / skip') + '</select></div>' +
          '<div class="steppers">' + FLD_FIELDS.map((f) => stepper('fld', f[0], f[1], d.fld[f[0]])).join('') + '</div>' +
          (d.pos === 'C' ? '<h3 class="sub-h">Catcher</h3><div class="steppers">' + CATCHER_FIELDS.map((f) => stepper('fld', f[0], f[1], d.fld[f[0]])).join('') + '</div>' + catcherHint : '') +
          '<p class="hint">Played more than one position? Switch to <b>By inning</b> to record each inning separately.</p>';
      } else {
        const innOpts = (sel) => Array.from({ length: 12 }, (_, k) => '<option value="' + (k + 1) + '"' + (k + 1 === sel ? ' selected' : '') + '>' + (k + 1) + '</option>').join('');
        fields += d.fi.map((r, idx) => '<div class="fi-row"><div class="fi-top">' +
          '<div class="field"><label for="fi-i-' + idx + '">Inning</label><select id="fi-i-' + idx + '" data-fi="i" data-idx="' + idx + '">' + innOpts(r.i) + '</select></div>' +
          '<div class="field"><label for="fi-pos-' + idx + '">Position</label><select id="fi-pos-' + idx + '" data-fi="pos" data-idx="' + idx + '">' + posOpts(r.pos, 'Choose') + '</select></div>' +
          '<button type="button" class="btn ghost small fi-x" data-action="fi-remove" data-idx="' + idx + '" aria-label="Remove inning ' + r.i + ' row">✕</button></div>' +
          '<div class="steppers three">' + FLD_FIELDS.map((f) => stepper('fi', f[0], f[1], r[f[0]], { idx: idx })).join('') + '</div>' +
          (r.pos === 'C' ? '<div class="steppers" style="margin-top:8px">' + CATCHER_FIELDS.map((f) => stepper('fi', f[0], f[1], r[f[0]] || 0, { idx: idx })).join('') + '</div>' : '') + '</div>').join('') +
          (d.fi.some((r) => r.pos === 'C') ? catcherHint : '') +
          '<button type="button" class="btn ghost block" data-action="fi-add">+ Add inning</button>' +
          '<p class="hint">Add a row for each inning you played in the field. Pick the position even if you had no chances; it still counts as an inning at that spot. Innings you sat out can be skipped.</p>';
      }
    }
    const segBtn = (k, label) => '<button type="button" data-action="seg" data-grp="logTab" data-val="' + k + '" aria-pressed="' + (tab === k) + '">' + label + '</button>';
    return '<section class="card"><h2>' + (editing ? 'Edit game' : 'Log a game') + '</h2><p class="muted">For ' + esc(p.name) + '. Fill in only what applies. Logging from paper? <a href="#print">Print a game sheet</a> for next time.</p>' +
      '<div class="field"><label for="f-date">Game date</label><input id="f-date" type="date" data-field="date" value="' + esc(d.date) + '"></div>' +
      '<div class="grid2"><div class="field"><label for="f-season">Season</label><input id="f-season" type="text" maxlength="30" data-field="season" value="' + esc(d.season) + '" placeholder="Spring 2026"></div>' +
      '<div class="field"><label for="f-team">Team <span class="muted">(optional)</span></label><input id="f-team" type="text" maxlength="40" data-field="team" value="' + esc(d.team) + '" placeholder="Cubs"></div></div>' +
      '<div class="grid2"><div class="field"><label for="f-level">Level</label><select id="f-level" data-field="level"><option value="">Choose level</option>' +
      LEVELS.map((l) => '<option' + (l === d.level ? ' selected' : '') + '>' + esc(l) + '</option>').join('') + '</select></div>' +
      '<div class="field"><label for="f-result">Result</label><select id="f-result" data-field="result">' +
      [['', 'Skip'], ['W', 'Win'], ['L', 'Loss'], ['T', 'Tie']].map((x) => '<option value="' + x[0] + '"' + (x[0] === d.result ? ' selected' : '') + '>' + x[1] + '</option>').join('') + '</select></div></div>' +
      '<div class="field"><label for="f-opp">Opponent <span class="muted">(optional)</span></label><input id="f-opp" type="text" maxlength="40" data-field="opp" value="' + esc(d.opp) + '" placeholder="Team name"></div></section>' +
      '<section class="card"><div class="seg" role="group" aria-label="Stat type">' + segBtn('bat', 'Batting') + segBtn('pit', 'Pitching') + segBtn('fld', 'Fielding') + '</div>' + fields + '<p class="live" id="live-sum" aria-live="polite">' + esc(liveText(d)) + '</p></section>' +
      '<div class="error" id="log-errors" hidden role="alert"></div>' +
      '<div class="row wrap"><button class="btn grow" data-action="save-game">' + (editing ? 'Save changes' : 'Save game') + '</button>' +
      (editing ? '<button class="btn ghost" data-action="cancel-edit">Cancel</button>' : '') + '</div>';
  }

  function chartSvg(points, metric) {
    if (points.length < 2) return '<p class="muted">Log 2 or more games with these stats to see your trend line.</p>';
    const W = 320, H = 150, pl = 38, pr = 10, pt = 12, pb = 24;
    const fmt = (v) => (metric === 'era' || metric === 'whip' ? S.fmtEra(v) : S.fmtRate(v));
    const vals = points.map((q) => q.value);
    let min = Math.min.apply(null, vals), max = Math.max.apply(null, vals);
    if (min === max) { min -= 0.05; max += 0.05; }
    const padv = (max - min) * 0.15;
    min = Math.max(0, min - padv); max += padv;
    const x = (i) => pl + (W - pl - pr) * (i / (points.length - 1));
    const y = (v) => pt + (H - pt - pb) * (1 - (v - min) / (max - min));
    const line = points.map((q, i) => (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(q.value).toFixed(1)).join(' ');
    const dots = points.length <= 40 ? points.map((q, i) => '<circle class="dot" cx="' + x(i).toFixed(1) + '" cy="' + y(q.value).toFixed(1) + '" r="3"/>').join('') : '';
    const label = 'Running ' + metric.toUpperCase() + ' over ' + points.length + ' games, from ' + fmt(vals[0]) + ' to ' + fmt(vals[vals.length - 1]) + '.';
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(label) + '">' +
      '<line class="grid" x1="' + pl + '" x2="' + (W - pr) + '" y1="' + y(max).toFixed(1) + '" y2="' + y(max).toFixed(1) + '"/>' +
      '<line class="grid" x1="' + pl + '" x2="' + (W - pr) + '" y1="' + y(min).toFixed(1) + '" y2="' + y(min).toFixed(1) + '"/>' +
      '<text x="' + (pl - 5) + '" y="' + (y(max) + 3).toFixed(1) + '" text-anchor="end">' + fmt(max) + '</text>' +
      '<text x="' + (pl - 5) + '" y="' + (y(min) + 3).toFixed(1) + '" text-anchor="end">' + fmt(min) + '</text>' +
      '<path class="line" d="' + line + '"/>' + dots +
      '<text x="' + pl + '" y="' + (H - 6) + '">' + esc(fmtDate(points[0].date)) + '</text>' +
      '<text x="' + (W - pr) + '" y="' + (H - 6) + '" text-anchor="end">' + esc(fmtDate(points[points.length - 1].date)) + '</text></svg>';
  }

  const TILES = {
    bat: (t) => [['G', t.g], ['AB', t.ab], ['H', t.h], ['2B', t.d], ['3B', t.t], ['HR', t.hr], ['RBI', t.rbi], ['R', t.r], ['BB', t.bb], ['K', t.k], ['SB', t.sb], ['AVG', S.fmtRate(t.avg), 1], ['OBP', S.fmtRate(t.obp), 1], ['SLG', S.fmtRate(t.slg)], ['OPS', S.fmtRate(t.ops), 1]],
    pit: (t) => [['G', t.g], ['IP', t.ipText], ['H', t.h], ['R', t.r], ['ER', t.er], ['BB', t.bb], ['K', t.k], ['Pitches', t.pitches], ['ERA', S.fmtEra(t.era), 1], ['WHIP', S.fmtEra(t.whip), 1]],
    fld: (t) => [['G', t.g], ['PO', t.po], ['A', t.a], ['E', t.e], ['TC', t.tc], ['FPCT', S.fmtRate(t.fpct), 1]].concat(t.cs || t.ci ? [['CS', t.cs], ['CI', t.ci]] : [])
  };
  const COLS = {
    bat: [['G', 'g'], ['AB', 'ab'], ['H', 'h'], ['HR', 'hr'], ['RBI', 'rbi'], ['AVG', 'avg', 'rate'], ['OBP', 'obp', 'rate'], ['OPS', 'ops', 'rate']],
    pit: [['G', 'g'], ['IP', 'ipText'], ['K', 'k'], ['BB', 'bb'], ['ER', 'er'], ['ERA', 'era', 'era'], ['WHIP', 'whip', 'era']],
    fld: [['G', 'g'], ['PO', 'po'], ['A', 'a'], ['E', 'e'], ['FPCT', 'fpct', 'rate']]
  };
  const CHARTS = { bat: [['avg', 'AVG'], ['obp', 'OBP'], ['slg', 'SLG']], pit: [['era', 'ERA'], ['whip', 'WHIP']], fld: [['fpct', 'FPCT']] };
  const HAS = { bat: S.hasBat, pit: S.hasPit, fld: S.hasFld };
  function compute(sec, games, inn) { return sec === 'bat' ? S.batting(games) : sec === 'pit' ? S.pitching(games, inn) : S.fielding(games); }
  function cell(t, col) { const v = t[col[1]]; return col[2] === 'rate' ? S.fmtRate(v) : col[2] === 'era' ? S.fmtEra(v) : v; }

  function viewCareer(p) {
    if (!p.games.length) {
      return emptyState('📊', 'Your career card is waiting', 'Log a game and your totals, season table and trend charts will appear here.', '<button class="btn" data-action="go" data-to="log">Log your first game</button>');
    }
    const seasons = S.seasonNames(p.games);
    if (ui.careerSeason && seasons.indexOf(ui.careerSeason) < 0) ui.careerSeason = '';
    const pool = ui.careerSeason ? p.games.filter((g) => g.season === ui.careerSeason) : p.games;
    const sec = ui.careerTab, inn = p.innings;
    const t = compute(sec, pool, inn);
    const label = ui.careerSeason || 'All time';
    const grp = S.groups(p.games);

    const shareCta = '<section class="card"><div class="row between"><div><b>Show off your card</b><br><span class="muted small">A shareable image and link for friends and family</span></div><button class="btn small" data-action="share-open">Share</button></div></section>';
    const path = shareCta + '<section class="card"><h3>My path</h3><ul class="path">' + grp.map((g) =>
      '<li><b>' + esc(g.season) + (g.level ? '<span class="level">' + esc(g.level) + '</span>' : '') + '</b><span class="muted small">' + (g.team ? esc(g.team) + ' &middot; ' : '') + plural(g.games.length, 'game') + '</span></li>').join('') + '</ul></section>';

    const segBtn = (k, l) => '<button type="button" data-action="seg" data-grp="careerTab" data-val="' + k + '" aria-pressed="' + (sec === k) + '">' + l + '</button>';
    let body = '';
    if (!t.g) {
      body = '<p class="muted">No ' + { bat: 'batting', pit: 'pitching', fld: 'fielding' }[sec] + ' stats logged for ' + esc(label.toLowerCase()) + ' yet.</p>';
    } else {
      body = '<div class="tiles">' + TILES[sec](t).map((x) => '<div class="tile' + (x[2] ? ' hl' : '') + '"><b>' + esc(x[1]) + '</b><span>' + x[0] + '</span></div>').join('') + '</div>';
      if (sec === 'fld') {
        const bp = S.fieldingByPosition(pool);
        if (bp.length) {
          const hasC = bp.some((r) => r.pos === 'C');
          body += '<h3 style="margin:16px 0 8px">By position</h3><div class="scroll"><table><thead><tr><th>Pos</th><th>G</th><th>Inn</th><th>PO</th><th>A</th><th>E</th><th>FPCT</th>' + (hasC ? '<th>CS</th><th>CI</th>' : '') + '</tr></thead><tbody>' +
            bp.map((r) => '<tr><td><b>' + esc(r.pos) + '</b></td><td>' + r.g + '</td><td>' + (r.inn || '\u2014') + '</td><td>' + r.po + '</td><td>' + r.a + '</td><td>' + r.e + '</td><td>' + S.fmtRate(r.fpct) + '</td>' +
              (hasC ? '<td>' + (r.pos === 'C' ? r.cs : '\u2014') + '</td><td>' + (r.pos === 'C' ? r.ci : '\u2014') + '</td>' : '') + '</tr>').join('') +
            '</tbody></table></div><p class="hint">Inn counts only the innings you logged by inning.' + (hasC ? ' CS = caught stealing, CI = catcher\u2019s interference.' : '') + '</p>';
        }
      }
    }

    const chartList = CHARTS[sec];
    if (ui.chart[sec] === undefined || !chartList.some((c) => c[0] === ui.chart[sec])) ui.chart[sec] = chartList[0][0];
    const metric = ui.chart[sec];
    const chartSeg = chartList.length > 1 ? '<div class="seg" role="group" aria-label="Chart stat">' + chartList.map((c) => '<button type="button" data-action="chart" data-val="' + c[0] + '" aria-pressed="' + (metric === c[0]) + '">' + c[1] + '</button>').join('') + '</div>' : '';
    const trend = '<section class="card"><h3>Trend: running ' + chartList.filter((c) => c[0] === metric)[0][1] + '</h3>' + chartSeg + '<div class="chart-wrap">' + chartSvg(S.series(pool, metric, inn), metric) + '</div></section>';

    const rows = grp.filter((g) => g.games.some(HAS[sec])).map((g) => {
      const gt = compute(sec, g.games, inn);
      return '<tr><td>' + esc(g.season) + (g.team ? ' &middot; ' + esc(g.team) : '') + '</td>' + COLS[sec].map((c) => '<td>' + cell(gt, c) + '</td>').join('') + '</tr>';
    });
    const all = compute(sec, p.games, inn);
    const table = rows.length ? '<section class="card"><h3>Season by season</h3><div class="scroll"><table><thead><tr><th>Season</th>' + COLS[sec].map((c) => '<th>' + c[0] + '</th>').join('') + '</tr></thead><tbody>' + rows.join('') +
      '<tr><td><b>Career</b></td>' + COLS[sec].map((c) => '<td><b>' + cell(all, c) + '</b></td>').join('') + '</tr></tbody></table></div></section>' : '';

    const log = S.sortGames(pool).reverse();
    return path +
      '<section class="card"><div class="row between wrap" style="margin-bottom:12px"><h3 style="margin:0">Stats</h3><select aria-label="Season filter" data-setting="careerSeason" style="width:auto;min-height:40px"><option value="">All time</option>' +
      seasons.map((s) => '<option' + (s === ui.careerSeason ? ' selected' : '') + '>' + esc(s) + '</option>').join('') + '</select></div>' +
      '<div class="seg" role="group" aria-label="Stat type">' + segBtn('bat', 'Batting') + segBtn('pit', 'Pitching') + segBtn('fld', 'Fielding') + '</div>' + body + '</section>' +
      trend + table +
      '<section class="card"><h3>Game log <span class="muted small">(' + esc(label) + ')</span></h3><ul class="games">' + log.map((g) => gameItem(g, true)).join('') + '</ul></section>' +
      '<button class="btn ghost block" data-action="summary">Copy career summary</button><div style="height:16px"></div>';
  }

  function viewGoals(p) {
    const bs = S.badges(p.games), n = bs.filter((b) => b.earned).length;
    const badges = '<section class="card"><h3>Badges <span class="muted small">' + n + ' of ' + bs.length + '</span></h3><div class="badges">' + bs.map((b) =>
      '<div class="badge' + (b.earned ? ' on' : '') + '"><div class="ic" aria-hidden="true">' + b.icon + '</div><div><b>' + esc(b.name) + '</b><span>' + esc(b.desc) + '</span>' + (b.earned ? '<span style="color:var(--gold)">Earned ' + esc(fmtDate(b.date)) + '</span>' : '<span>Locked</span>') + '</div></div>').join('') + '</div></section>';

    const goals = p.goals.map((g) => {
      const m = S.metricById(g.metric), st = S.goalStatus(g, p.games, p.innings);
      const scope = g.scope === 'career' ? 'Career' : g.scope;
      const cur = st.value === null ? '—' : S.fmtMetric(g.metric, st.value);
      const tgt = S.fmtMetric(g.metric, g.target);
      const cmp = m.better === 'low' ? 'at or below ' + tgt : 'reach ' + tgt;
      return '<div class="goal' + (st.met ? ' met' : '') + '"><div class="row between"><div><b>' + esc(m.label) + '</b> <span class="muted small">&middot; ' + esc(scope) + '</span></div>' +
        '<button class="link small" data-action="delete-goal" data-id="' + esc(g.id) + '" aria-label="Delete goal ' + esc(m.label) + '">Delete</button></div>' +
        '<div class="meter" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + Math.round(st.pct * 100) + '"><span style="width:' + Math.round(st.pct * 100) + '%"></span></div>' +
        '<div class="small muted">' + (st.met ? '<span style="color:var(--good)">✓ Goal met!</span> ' : '') + 'Now ' + esc(cur) + ' &middot; goal: ' + esc(cmp) + '</div></div>';
    }).join('');
    return badges + '<section class="card"><div class="row between" style="margin-bottom:8px"><h3 style="margin:0">My goals</h3><button class="btn small" data-action="add-goal">+ Add goal</button></div>' +
      (goals || '<p class="muted">Set a target like 20 hits this season or a .300 average, and watch the bar fill up.</p>') + '</section>';
  }

  function viewAbout(p) {
    const edit = p ? '<section class="card"><h3>Player card</h3>' + playerForm(p) +
      '<div class="field" style="margin-top:14px"><label for="s-inn">Innings in a regulation game</label><select id="s-inn" data-setting="innings"><option value="6"' + (p.innings === 6 ? ' selected' : '') + '>6 innings</option><option value="7"' + (p.innings === 7 ? ' selected' : '') + '>7 innings</option></select><p class="hint">Used to calculate ERA. Check your league’s rules.</p></div></section>' : '';
    const sec = p ? '<section class="card"><h3>Player ID &amp; PIN</h3>' +
      '<p>Player ID <b class="pid">' + esc(fmtPid(p.pid)) + '</b></p>' +
      '<p class="muted small">Two players can share a name, so every card gets a random ID that tells them apart. It is not tied to a real person, and it appears on share cards.</p>' +
      (p.lock ? '<p><b>PIN is on.</b></p><div class="row wrap"><button class="btn ghost grow" data-action="lock-now">Lock now</button><button class="btn ghost grow" data-action="pin-change">Change PIN</button><button class="btn ghost grow" data-action="pin-remove">Remove PIN</button></div>'
        : (hasCrypto ? '<p><b>No PIN set.</b></p><button class="btn block" data-action="pin-set">Set a PIN</button>' : '<p class="muted">PINs need a secure (https) connection, so they are not available here.</p>')) +
      '<p class="hint">A PIN keeps teammates, siblings, and curious friends out of this diary on a shared device. It does not encrypt the data stored in this browser, and it travels with your backup file.</p></section>' : '';
    const backup = '<section class="card"><h3>Backup &amp; restore</h3><p class="muted">Your stats live only in this browser. Export a backup file now and then, especially before clearing browser data or switching phones.</p>' +
      (db.players.length ? '<p><b>Last backup:</b> ' + esc(backupAgo()) + (backupDue() ? ' <span style="color:var(--gold)">&middot; time for a new one</span>' : '') + '</p>' : '') +
      (ui.persist ? '<p class="hint">Browser storage protection is on, so your browser is less likely to clear this data on its own.</p>' : '') +
      '<div class="row wrap"><button class="btn grow" data-action="export">Export backup</button><button class="btn ghost grow" data-action="import">Import backup</button></div>' +
      '<input type="file" id="import-file" accept="application/json,.json" hidden></section>';
    const danger = (p ? '<button class="btn danger block" data-action="reset-player" style="margin-bottom:10px">Delete ' + esc(p.name) + '’s data</button>' : '') +
      (db.players.length ? '<button class="btn danger block" data-action="reset-all">Erase everything on this device</button>' : '');
    return '<section class="card hero"><p class="eyebrow">About</p><h2>A free diary for young ballplayers</h2>' +
      '<p class="muted">Dugout Diary helps players and parents keep a lasting record of batting, pitching and fielding across every season, from the first tee ball swing and beyond. It is free, with no paywall and no ads.</p></section>' +
      '<section class="card"><h3>Your privacy</h3><p><b>What is stored:</b> a name or nickname, a city and state or ZIP code, the stats you enter, a random Player ID, and (if you choose) a PIN. All of it stays on your device. We have no server and no accounts.</p>' +
      '<p><b>What we never ask for:</b> birthdates, emails, phone numbers, photos, passwords, or payment info.</p>' +
      '<p class="muted small">Clearing your browser data erases it, so keep a backup. Read the full <a href="#terms">Terms &amp; Privacy Notice</a>.</p></section>' +
      '<section class="card"><h3>Print sheets</h3><p class="muted">Take a paper game sheet or season grid to the field, then enter the numbers later.</p><a class="btn block" href="#print">Open printable sheets</a></section>' +
      edit + sec + backup + (danger ? '<section class="card"><h3>Reset</h3>' + danger + '</section>' : '') +
      '<section class="card"><h3>The fine print</h3><p class="muted small">Dugout Diary is an independent project. It is not affiliated with or endorsed by Little League International, GameChanger, Sports Connect, or any league. Stats are self-reported by families and are not official records. Accessibility: large tap targets, keyboard navigation, and screen reader labels are built in; tell us if something is hard to use.</p></section>' + footer();
  }

  function viewCard(c) {
    const f = cardFacts(c), info = {};
    S.badges([]).forEach((b) => { info[b.id] = b; });
    const mine = player();
    return '<section class="card hero"><p class="eyebrow">' + esc([c.k, c.lv].filter(Boolean).join(' · ') || 'Player card') + '</p><h2>' + esc(c.n) + '</h2>' +
      '<p class="muted">' + esc([c.t, c.l, plural(c.g, 'game')].filter(Boolean).join(' · ')) + '</p>' + (c.id ? '<p class="small">Player ID <b class="pid">' + esc(fmtPid(c.id)) + '</b></p>' : '') +
      '<div class="stats">' + f.heads.map((h) => '<div class="stat"><b>' + esc(h[1]) + '</b><span>' + esc(h[0]) + '</span></div>').join('') + '</div>' +
      '<div class="stats four">' + f.rows.map((r) => '<div class="stat"><b>' + esc(r[1]) + '</b><span>' + esc(r[0]) + '</span></div>').join('') + '</div>' +
      (c.b.length ? '<div class="chips">' + c.b.map((id) => '<span class="chip">' + info[id].icon + ' ' + esc(info[id].name) + '</span>').join('') + '</div>' : '') + '</section>' +
      '<section class="card"><h3>' + (mine ? 'Welcome back' : 'Think you can top that?') + '</h3>' +
      '<p class="muted">' + (mine ? 'This card was shared with you.' : 'Build your own player card in under a minute. Free, no sign-up, and no email or birthday needed.') + '</p>' +
      '<button class="btn block" data-action="go" data-to="' + (mine ? 'career' : 'home') + '">' + (mine ? 'Back to my diary' : 'Create my card →') + '</button></section>' + footer();
  }

  function viewLock(p) {
    return '<section class="card hero"><p class="eyebrow">&#128274; Locked</p><h2>Hi, ' + esc(p.name) + '!</h2>' +
      '<p class="muted">Enter your PIN to open this diary. <span class="pid">' + esc(fmtPid(p.pid)) + '</span></p>' +
      '<form data-form="unlock" novalidate><div class="error" data-errbox hidden role="alert"></div>' +
      '<div class="field"><label for="ul-pin">PIN</label><input id="ul-pin" name="pin" type="password" inputmode="numeric" autocomplete="off" maxlength="8"></div>' +
      '<button class="btn block" type="submit">Unlock</button></form>' +
      '<div class="row wrap" style="margin-top:10px">' + (db.players.length > 1 ? '<button class="btn ghost grow" data-action="open-players">Switch player</button>' : '') +
      '<button class="btn ghost grow" data-action="forgot-pin">Forgot PIN?</button></div></section>' + footer();
  }

  function viewTerms() {
    const contact = CONTACT_EMAIL ? 'Email us at <a href="mailto:' + esc(CONTACT_EMAIL) + '">' + esc(CONTACT_EMAIL) + '</a>.' : 'Contact details are listed on the site where you found this app.';
    return '<section class="card hero"><p class="eyebrow">Version ' + TERMS_V + ' &middot; In plain English</p><h2>Terms &amp; Privacy</h2>' +
      '<p class="muted">Dugout Diary is a free stat diary for baseball and softball players of all ages, with their families and coaches. There are no ads, no purchases, no chat, no public profiles, and no tracking. It is built to be suitable for everyone, including our youngest ballplayers.</p></section>' +
      '<section class="card terms"><h3>Privacy notice</h3>' +
      '<p><b>The short version:</b> everything you enter stays in your own browser. We do not run a server that receives it, and we cannot see it.</p>' +
      '<h4>Stored only on your device</h4><ul><li>A name or nickname, and a city and state or ZIP code</li><li>The games and stats you enter, and your goals</li><li>A random Player ID made on your device</li><li>If you choose one, a scrambled (hashed) PIN and recovery code</li></ul>' +
      '<h4>Never collected</h4><ul><li>Birthdates or ages</li><li>Emails, phone numbers, or home addresses</li><li>Photos, videos, or microphone and camera access</li><li>Precise location (GPS)</li><li>Payment information</li><li>Advertising, analytics, cookies, or third-party trackers, fonts, or scripts</li></ul>' +
      '<h4>Children</h4><p>Because personal information stays on the device and nothing is sent to us, we do not collect personal information from anyone, including children. There are no accounts, no messaging, and no way for strangers to contact a player. A parent or guardian can erase everything at any time from About &rarr; Erase everything on this device. We encourage younger players to use a first name or nickname and to set the app up with a parent or guardian.</p>' +
      '<h4>Hosting</h4><p>The pages are delivered by a web host (currently GitHub Pages). Like any website, the host may record technical details such as an IP address when a page is requested. We do not receive or use those logs, and the app does not send your stats to the host.</p>' +
      '<h4>Sharing</h4><p>Sharing is your choice. A share card (image or link) contains only what is shown on the card: the name or nickname, optional city and state, the stats you picked, and the random Player ID. A card link holds its data inside the link itself, so anyone who has the link can see the card. Share with people you trust, and think twice before posting publicly.</p>' +
      '<h4>Player ID and PIN</h4><p>The Player ID keeps players with the same name apart. A PIN keeps teammates and siblings out of a diary on a shared device. It is a privacy lock, not encryption: someone with technical skill and access to your device can still reach the data stored in the browser. Write down your recovery code, because we cannot reset a PIN for you.</p>' +
      '<h4>Backups</h4><p>Backup files are saved wherever you choose. They contain everything in the diary, so store them somewhere private.</p>' +
      '<h4>Changes and questions</h4><p>If this notice changes in a meaningful way, the version number above changes and you will be asked to agree again when you add a player. ' + contact + '</p></section>' +
      '<section class="card terms"><h3>Terms of use</h3>' +
      '<ol><li><b>What this is.</b> Dugout Diary is a free tool for keeping your own baseball or softball stats. By using it you agree to these terms.</li>' +
      '<li><b>Families first.</b> Younger players should set up and use the app with a parent or guardian, who is responsible for what is entered and shared.</li>' +
      '<li><b>Your data, your job.</b> Your stats live in your browser. Clearing browser data, switching phones, or private browsing can erase them. Please export backups. We cannot recover lost data.</li>' +
      '<li><b>Be kind and be careful.</b> Enter only information about yourself or your own child. Do not enter other people’s private details. Use a first name or nickname. Do not use the app to harass anyone, break the law, or try to disrupt or copy the site.</li>' +
      '<li><b>Not official.</b> Stats are self-reported and not official league records. Check with your league for official numbers.</li>' +
      '<li><b>Independent project.</b> Dugout Diary is not affiliated with or endorsed by Little League International, GameChanger, Sports Connect, or any league or team. Their names belong to their owners.</li>' +
      '<li><b>As is.</b> The app is provided as is, without promises that it will always work or be error free. To the extent the law allows, we are not liable for lost data or for decisions made using the stats.</li>' +
      '<li><b>Changes.</b> We may update the app or these terms. Continuing to use the app after a change means you accept it.</li></ol></section>' +
      '<button class="btn ghost block" data-action="go" data-to="' + (player() ? 'about' : 'home') + '">Back</button>' + footer();
  }

  /* ---------- printable sheets (paper game log for the dugout) ---------- */
  const PS_BAT = [['AB', 'At bats'], ['H', 'Hits'], ['2B', 'Doubles'], ['3B', 'Triples'], ['HR', 'Homers'], ['RBI', 'Runs in'], ['R', 'Runs'], ['BB', 'Walks'], ['K', 'Strikeouts'], ['HBP', 'Hit by p.'], ['SF', 'Sac fly'], ['SB', 'Steals']];
  const PS_PIT = [['IP', 'Innings, like 3 1/3'], ['H', 'Hits'], ['R', 'Runs'], ['ER', 'Earned'], ['BB', 'Walks'], ['K', 'Strikeouts'], ['PITCHES', 'Pitches']];
  const PS_FLD = [['PO', 'Putouts'], ['A', 'Assists'], ['E', 'Errors']];
  const PS_CATCH = [['CS', 'Caught stealing'], ['CI', 'Catcher interf.']];
  const PS_FORMATS = [['game', 'Game sheet: fielding for the whole game'], ['gameinn', 'Game sheet: fielding by inning (several positions)'], ['gridbat', 'Season grid: batting (landscape)'], ['gridpf', 'Season grid: pitching & fielding (landscape)']];

  function psField(label, value, cls) {
    return '<div class="ps-f ' + (cls || '') + '"><span>' + label + '</span><div class="ps-line">' + (value ? esc(value) : '') + '</div></div>';
  }
  function psOpts(list) { return '<div class="ps-opts">' + list.map((o) => '<i>' + o + '</i>').join('') + '</div>'; }
  function psBoxes(list, cls) {
    return '<div class="ps-boxes ' + (cls || '') + '">' + list.map((c) => '<div class="ps-bw"><div class="ps-box"></div><div class="ps-lab"><b>' + c[0] + '</b><span>' + c[1] + '</span></div></div>').join('') + '</div>';
  }
  function psSite() { return (location.host + location.pathname).replace(/index\.html$/, '').replace(/\/$/, '') || 'Dugout Diary'; }
  function psHead(title, v) {
    return '<header class="ps-head"><div class="ps-title">DUGOUT DIARY<small>' + title + '</small></div>' + psField('Player', v.name, 'ps-grow') + '</header>';
  }

  function psFieldByInning() {
    let rows = '';
    for (let i = 1; i <= 7; i++) rows += '<tr><th>' + i + '</th><td></td><td></td><td></td><td></td><td></td><td></td></tr>';
    return '<table class="ps-grid ps-inn"><thead><tr><th>INN</th><th class="wd">POSITION</th><th>PO</th><th>A</th><th>E</th><th>CS</th><th>CI</th></tr></thead><tbody>' + rows + '</tbody></table>' +
      '<p class="ps-note">Write the position you played each inning (P, C, 1B, 2B, 3B, SS, LF, CF, RF). Leave innings you sat out blank. CS and CI are for catchers only (CI also counts as an error). Extra innings? Use the notes lines.</p>';
  }

  function psGameSheet(v, byInning) {
    let tally = '';
    for (let i = 1; i <= (byInning ? 5 : 6); i++) {
      tally += '<div class="ps-ab"><span class="ps-n">' + i + '</span><span class="ps-in"><em>Inn</em></span>' +
        psOpts(['1B', '2B', '3B', 'HR', 'BB', 'K', 'HBP', 'Out', 'Other']) + '<span class="ps-in"><em>RBI</em></span></div>';
    }
    return '<section class="paper">' + psHead('GAME SHEET', v) +
      '<div class="ps-info">' + psField('Date', '') + psField('Season', v.season) + psField('Team', v.team) + psField('Opponent', '') + psField('Level', v.level) +
      '<div class="ps-f"><span>Result (circle)</span><div class="ps-line">' + psOpts(['W', 'L', 'T']) + '</div></div></div>' +
      '<h3 class="ps-h">BATTING <small>Tally each at-bat during the game, then add up the totals.</small></h3>' + tally +
      '<div class="ps-sub">Totals after the game</div>' + psBoxes(PS_BAT) +
      '<p class="ps-note">AB = every turn at bat except a walk, hit-by-pitch, or sacrifice. H = 1B + 2B + 3B + HR.</p>' +
      '<h3 class="ps-h">PITCHING <small>Skip if you did not pitch. Write innings like 3 1/3 (3 innings and 1 out).</small></h3>' + psBoxes(PS_PIT) +
      '<h3 class="ps-h">FIELDING <small>' + (byInning ? 'One row per inning you played in the field.' : 'Skip if you did not play the field. Played more than one position? Use the by-inning sheet.') + '</small></h3>' +
      (byInning ? psFieldByInning() :
        '<div class="ps-row"><div class="ps-f ps-grow"><span>Position (circle)</span><div class="ps-line">' + psOpts(['P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF']) + '</div></div>' + psBoxes(PS_FLD.concat(PS_CATCH), 'ps-narrow') + '</div><p class="ps-note">CS and CI are for catchers only. Catcher\u2019s interference also counts as an error (E).</p>') +
      '<h3 class="ps-h">NOTES <small>Best moment? One thing to work on?</small></h3><div class="ps-lines">' + (byInning ? '<div></div><div></div>' : '<div></div><div></div><div></div>') + '</div>' +
      '<footer class="ps-foot">Enter these later at ' + esc(psSite()) + ' &rarr; Log tab. The boxes are in the same order as the Log screen.</footer></section>';
  }

  function psGrid(kind, v) {
    const bat = kind === 'gridbat';
    const cols = bat ? PS_BAT.map((c) => c[0]) : ['IP', 'H', 'R', 'ER', 'BB', 'K', 'PITCHES', 'POS', 'PO', 'A', 'E', 'CS', 'CI'];
    const legend = bat
      ? 'AB at bats &middot; H hits &middot; 2B doubles &middot; 3B triples &middot; HR home runs &middot; RBI runs batted in &middot; R runs scored &middot; BB walks &middot; K strikeouts &middot; HBP hit by pitch &middot; SF sacrifice fly &middot; SB stolen bases'
      : 'IP innings pitched, like 3 1/3 &middot; H hits allowed &middot; R runs &middot; ER earned runs &middot; BB walks &middot; K strikeouts &middot; PITCHES pitch count &middot; POS position &middot; PO putouts &middot; A assists &middot; E errors &middot; CS caught stealing and CI catcher\u2019s interference (catchers only). Played several positions in a game? Use the game sheet with fielding by inning.';
    let rows = '';
    for (let i = 1; i <= 12; i++) rows += '<tr><th>' + i + '</th><td></td><td></td>' + cols.map(() => '<td></td>').join('') + '</tr>';
    rows += '<tr class="ps-tot"><th>Σ</th><td colspan="2">Totals</td>' + cols.map(() => '<td></td>').join('') + '</tr>';
    return '<section class="paper land">' + psHead(bat ? 'SEASON GRID · BATTING' : 'SEASON GRID · PITCHING &amp; FIELDING', v) +
      '<div class="ps-info four">' + psField('Season', v.season) + psField('Team', v.team) + psField('Level', v.level) + psField('League / notes', '') + '</div>' +
      '<table class="ps-grid"><thead><tr><th>#</th><th class="wd">Date</th><th class="wd">Opponent</th>' + cols.map((c) => '<th>' + c + '</th>').join('') + '</tr></thead><tbody>' + rows + '</tbody></table>' +
      '<p class="ps-note">' + legend + '</p>' +
      '<footer class="ps-foot">Enter each row later at ' + esc(psSite()) + ' &rarr; Log tab, in the same order as the columns.</footer></section>';
  }

  function viewPrint(p) {
    const st = ui.print;
    const pre = !!p && st.prefill;
    const v = pre
      ? { name: p.name, season: (p.last && p.last.season) || defaultSeason(), team: (p.last && p.last.team) || '', level: (p.last && p.last.level) || '' }
      : { name: '', season: '', team: '', level: '' };
    const copies = Math.max(1, Math.min(10, st.copies));
    let sheets = '';
    for (let i = 0; i < copies; i++) sheets += st.fmt === 'game' ? psGameSheet(v, false) : st.fmt === 'gameinn' ? psGameSheet(v, true) : psGrid(st.fmt, v);
    return '<section class="card noprint"><h2>Print a game sheet</h2>' +
      '<p class="muted">No phone in the dugout? Print before the game, fill it in by hand, then enter the numbers in the <a href="#log">Log tab</a>. The boxes follow the same order as the Log screen.</p>' +
      '<div class="field"><label for="pr-fmt">Sheet type</label><select id="pr-fmt" data-print="fmt">' + PS_FORMATS.map((f) => '<option value="' + f[0] + '"' + (f[0] === st.fmt ? ' selected' : '') + '>' + f[1] + '</option>').join('') + '</select></div>' +
      '<div class="field"><label for="pr-copies">How many sheets?</label><input id="pr-copies" type="number" inputmode="numeric" min="1" max="10" value="' + copies + '" data-print="copies"></div>' +
      (p ? '<label class="check"><input type="checkbox" data-print="prefill"' + (st.prefill ? ' checked' : '') + '> Put ' + esc(p.name) + '’s name, team and season on the sheet</label>' : '') +
      '<button class="btn block" data-action="print-now">🖨️ Print or save as PDF</button>' +
      '<ul class="hint tips"><li>In the print dialog, pick <b>Save as PDF</b> to email it to a coach or print it later.</li><li>Season grids print best in <b>landscape</b>. If yours comes out portrait, switch the orientation in the dialog.</li><li>Turn off “Headers and footers” and use default margins for the cleanest page.</li></ul>' +
      '<p class="hint">Below is a preview' + (copies > 1 ? ' of all ' + copies + ' sheets' : '') + '.</p></section>' +
      '<div class="sheets" id="sheets">' + sheets + '</div><div class="noprint" style="height:12px"></div>';
  }

  function fitSheets() {
    const wrap = $('#sheets');
    if (!wrap) return;
    wrap.style.zoom = '1';
    const first = wrap.querySelector('.paper');
    if (!first) return;
    const need = first.offsetWidth, have = main.clientWidth;
    if (need > have) wrap.style.zoom = String(Math.max(0.3, have / need));
  }
  window.addEventListener('resize', () => { if (currentTab() === 'print') fitSheets(); });

  /* ---------- router ---------- */
  function currentTab() {
    let h = (location.hash || '#home').slice(1);
    if (h.indexOf('card=') === 0) return 'card';
    if (h === 'print') return 'print';
    if (h === 'terms') return 'terms';
    if (TABS.indexOf(h) < 0) h = 'home';
    if (!player() && h !== 'home' && h !== 'about') h = 'home';
    return h;
  }
  function go(name) { if (location.hash === '#' + name) render(); else location.hash = name; }

  function render() {
    const tab = currentTab(), p = player();
    let html = '';
    if (ui.flash) { html += '<div class="notice" role="status">' + esc(ui.flash) + '</div>'; ui.flash = ''; }
    if (tab === 'card') {
      let c = null;
      try { c = sanitizeCard(b64d(location.hash.slice(6))); } catch (e) { c = null; }
      html += c ? viewCard(c) : emptyState('🤔', 'That card link looks broken', 'Ask your friend to share it again, or make your own card.', '<button class="btn" data-action="go" data-to="home">Make my own card</button>');
    }
    else if (tab === 'terms') html += viewTerms();
    else if (p && !isUnlocked(p)) html += viewLock(p);
    else if (tab === 'print') html += viewPrint(p);
    else if (tab === 'home') html += viewHome(p);
    else if (tab === 'log') html += viewLog(p);
    else if (tab === 'career') html += viewCareer(p);
    else if (tab === 'goals') html += viewGoals(p);
    else html += viewAbout(p);
    main.innerHTML = html;
    renderChrome(tab, p);
    if (tab === 'print') fitSheets();
    if (ui.lastTab !== tab) { window.scrollTo(0, 0); ui.lastTab = tab; }
  }

  /* ---------- actions ---------- */
  function showErrors(box, errs, kind) {
    if (!box) return;
    if (!errs.length) { box.hidden = true; box.innerHTML = ''; return; }
    box.hidden = false;
    box.classList.toggle('warn', kind === 'warn');
    box.innerHTML = errs.length === 1 ? esc(errs[0]) : '<ul>' + errs.map((e) => '<li>' + esc(e) + '</li>').join('') + '</ul>';
    box.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }

  function setDraftStat(sec, key, raw, max, idx) {
    const v = S.int(raw, max || 999);
    if (!ui.draft) return;
    if (sec === 'fi') { if (ui.draft.fi[idx]) ui.draft.fi[idx][key] = v; } else ui.draft[sec][key] = v;
    updateLive();
  }
  function liveText(d) {
    const p = player(), sec = draftToSections(d);
    if (ui.logTab === 'bat') {
      const b = S.batting([{ bat: sec.bat }]);
      return b.pa + (b.pa === 1 ? ' plate appearance' : ' plate appearances') + ' (at-bats + walks + hit-by-pitch + sacrifices)' +
        (b.ab ? ' \u00B7 AVG ' + S.fmtRate(b.avg) : '') + (b.pa ? ' \u00B7 OBP ' + S.fmtRate(b.obp) : '');
    }
    if (ui.logTab === 'pit') {
      if (sec.ipBad) return 'Innings: write it like 3 1/3, 3 2/3, or 4 (3.1 and 3.2 work too).';
      const pi = S.pitching([{ pit: sec.pit }], p ? p.innings : 6), un = sec.pit.r - sec.pit.er;
      return S.fmtInnings(sec.pit.outs) + ' IP \u00B7 ' + plural(sec.pit.er, 'earned run') + (un > 0 ? ' + ' + un + ' unearned (unearned runs do not count toward ERA)' : '') +
        (sec.pit.outs ? ' \u00B7 ERA this game ' + S.fmtEra(pi.era) : '');
    }
    const f = S.fielding([{ fld: sec.fld }]);
    if (d.fldMode === 'inning') {
      const inn = new Set(sec.fi.map((r) => r.i + '|' + r.pos)).size;
      return plural(inn, 'inning') + ' in the field \u00B7 ' + plural(f.tc, 'chance') + (f.tc ? ' \u00B7 FPCT ' + S.fmtRate(f.fpct) : '') + (f.cs ? ' \u00B7 ' + f.cs + ' CS' : '') + (f.ci ? ' \u00B7 ' + f.ci + ' CI' : '');
    }
    return plural(f.tc, 'chance') + (f.tc ? ' \u00B7 FPCT ' + S.fmtRate(f.fpct) : '') + (f.cs ? ' \u00B7 ' + f.cs + ' CS' : '') + (f.ci ? ' \u00B7 ' + f.ci + ' CI' : '');
  }
  function updateLive() {
    const el = $('#live-sum');
    if (el && ui.draft) el.textContent = liveText(ui.draft);
  }

  function earnedIds(games) { return S.badges(games).filter((b) => b.earned).map((b) => b.id); }

  function saveGame() {
    const p = player(), d = ui.draft;
    if (!p || !d) return;
    const sec = draftToSections(d), errs = [];
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d.date)) errs.push('Pick the game date.');
    if (!str(d.season, 30)) errs.push('Add a season name, like "Spring 2026".');
    const check = S.validateGame(sec.bat, sec.pit, sec.fld, { inn: p.innings });
    check.errors.forEach((m) => errs.push(m));
    if (sec.ipBad) errs.push('Innings pitched should look like 3 1/3, 3 2/3, or 4 (3.1 and 3.2 work too).');
    const vf = d.fldMode === 'inning' ? S.validateFi(d.fi) : { errors: [], warnings: [] };
    vf.errors.forEach((m) => errs.push(m));
    if (!S.anyPositive(sec.bat) && !S.anyPositive(sec.pit) && !S.anyPositive(sec.fld) && !sec.fi.length) errs.push('Enter at least one stat before saving.');
    showErrors($('#log-errors'), errs);
    if (errs.length) return;
    const vc = d.fldMode === 'inning' ? [] : S.validateCatcher(sec.fld, d.pos);
    const warns = check.warnings.concat(vf.warnings, vc);
    if (d.date > today()) warns.push('That game date is in the future. Double-check the date.');
    const wkey = warns.join('|');
    if (warns.length && ui.ackKey !== wkey) {
      ui.ackKey = wkey;
      showErrors($('#log-errors'), warns.concat(['Fix the numbers, or tap Save again if they are right.']), 'warn');
      return;
    }
    ui.ackKey = '';

    const before = earnedIds(p.games);
    const game = cleanGame(Object.assign({ id: d.id || uid('g'), created: d.created || Date.now(), date: d.date, season: d.season, team: d.team, level: d.level, opp: d.opp, result: d.result, pos: d.fldMode === 'inning' ? '' : d.pos }, sec));
    const idx = p.games.findIndex((g) => g.id === game.id);
    if (idx >= 0) p.games[idx] = game; else p.games.push(game);
    p.last = { season: game.season, team: game.team, level: game.level };
    save();
    const after = S.badges(p.games).filter((b) => b.earned && before.indexOf(b.id) < 0);
    const wasEdit = !!d.id;
    ui.draft = null;
    ui.logTab = 'bat';
    renderChrome(currentTab(), p);

    const bits = [];
    if (S.hasBat(game)) bits.push(batText(game.bat));
    if (S.hasPit(game)) bits.push(pitText(game.pit));
    if (S.hasFld(game)) bits.push(fldLine(game));
    openModal('<div class="celebrate" aria-hidden="true">' + (after.length ? '🎉' : '⚾') + '</div><h3 style="text-align:center">' + (wasEdit ? 'Game updated!' : 'Game logged!') + '</h3>' +
      '<p style="text-align:center">' + bits.map(esc).join('<br>') + '</p>' +
      (after.length ? '<div class="earned">' + after.map((b) => b.icon + ' New badge: ' + esc(b.name)).join('<br>') + '</div>' : '') +
      '<button class="btn block" style="margin-top:16px" data-action="share-game" data-id="' + esc(game.id) + '">📣 Share this game</button>' +
      '<div class="actions"><button class="btn ghost" data-action="after-save" data-id="log">Log another</button><button class="btn" data-action="after-save" data-id="career">See my career</button></div>');
  }

  function openGoalModal(p) {
    const seasons = S.seasonNames(p.games);
    const groups = {};
    S.METRICS.forEach((m) => { (groups[m.group] = groups[m.group] || []).push(m); });
    const opts = Object.keys(groups).map((g) => '<optgroup label="' + g + '">' + groups[g].map((m) => '<option value="' + m.id + '">' + esc(m.label) + '</option>').join('') + '</optgroup>').join('');
    openModal('<h3>Add a goal</h3><form data-form="goal" novalidate><div class="error" data-errbox hidden role="alert"></div>' +
      '<div class="field"><label for="g-metric">What do you want to improve?</label><select id="g-metric" name="metric">' + opts + '</select></div>' +
      '<div class="field"><label for="g-target">Target</label><input id="g-target" name="target" type="text" inputmode="decimal" placeholder="e.g. 20, or .300"><p class="hint">For averages type a decimal like .300. For ERA and WHIP the goal is to finish at or below the target.</p></div>' +
      '<div class="field"><label for="g-scope">Over</label><select id="g-scope" name="scope"><option value="career">Whole career</option>' + seasons.map((s) => '<option>' + esc(s) + '</option>').join('') + '</select></div>' +
      '<div class="actions"><button type="button" class="btn ghost" data-action="modal-close">Cancel</button><button type="submit" class="btn">Add goal</button></div></form>');
  }

  function summaryText(p) {
    const lines = [p.name + (placeText(p) ? ' – ' + placeText(p) : ''), 'Career summary (' + plural(p.games.length, 'game') + ')'];
    const b = S.batting(p.games), pi = S.pitching(p.games, p.innings), f = S.fielding(p.games);
    if (b.g) lines.push('Batting: ' + S.fmtRate(b.avg) + ' AVG, ' + S.fmtRate(b.obp) + ' OBP, ' + S.fmtRate(b.slg) + ' SLG | ' + b.h + ' H, ' + b.hr + ' HR, ' + b.rbi + ' RBI, ' + b.bb + ' BB, ' + b.sb + ' SB');
    if (pi.g) lines.push('Pitching: ' + S.fmtEra(pi.era) + ' ERA, ' + S.fmtEra(pi.whip) + ' WHIP | ' + pi.ipText + ' IP, ' + pi.k + ' K, ' + pi.bb + ' BB');
    if (f.g) lines.push('Fielding: ' + S.fmtRate(f.fpct) + ' FPCT | ' + f.po + ' PO, ' + f.a + ' A, ' + f.e + ' E');
    const bs = S.badges(p.games).filter((x) => x.earned);
    if (bs.length) lines.push('Badges: ' + bs.map((x) => x.name).join(', '));
    lines.push('Tracked with Dugout Diary');
    return lines.join('\n');
  }

  function exportBackup() {
    const json = JSON.stringify(Object.assign({ app: 'dugout-diary', exported: new Date().toISOString() }, db), null, 2);
    try {
      const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
      const a = document.createElement('a');
      a.href = url; a.download = 'dugout-diary-backup-' + today() + '.json';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      db.bk = today(); db.bkN = totalGames(); db.snooze = ''; save();
      ui.flash = 'Backup file created. Keep it somewhere safe, like email or cloud storage.';
      render();
    } catch (e) {
      openModal('<h3>Copy your backup</h3><p class="muted">Your browser blocked the download. Copy this text into a file ending in .json.</p><textarea class="copybox" readonly>' + esc(json) + '</textarea><div class="actions"><button class="btn" data-action="modal-close">Done</button></div>');
    }
  }

  function importBackup(file) {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { openModal('<h3>File too large</h3><p>That does not look like a Dugout Diary backup.</p><div class="actions"><button class="btn" data-action="modal-close">OK</button></div>'); return; }
    const reader = new FileReader();
    reader.onload = () => {
      let incoming;
      try { incoming = sanitizeDb(JSON.parse(String(reader.result))); } catch (e) { incoming = null; }
      if (!incoming || !incoming.players.length) {
        openModal('<h3>Could not import</h3><p>That file does not contain any Dugout Diary players.</p><div class="actions"><button class="btn" data-action="modal-close">OK</button></div>');
        return;
      }
      let added = 0, skipped = 0;
      incoming.players.forEach((pl) => {
        if (db.players.some((x) => x.id === pl.id || x.pid === pl.pid)) { skipped++; return; }
        if (db.players.length >= 12) { skipped++; return; }
        db.players.push(pl); added++;
      });
      if (!db.active && db.players[0]) db.active = db.players[0].id;
      save();
      ui.flash = added ? 'Imported ' + plural(added, 'player') + (skipped ? ' (' + skipped + ' already here, skipped).' : '.') : 'Nothing new to import. Those players are already here.';
      render();
    };
    reader.onerror = () => openModal('<h3>Could not read file</h3><div class="actions"><button class="btn" data-action="modal-close">OK</button></div>');
    reader.readAsText(file);
  }

  function shareOptions(p) {
    const opts = [['all', 'Career so far']];
    const last = S.sortGames(p.games).slice(-1)[0];
    if (last) opts.push(['game:' + last.id, 'Latest game (' + fmtDate(last.date) + ')']);
    S.seasonNames(p.games).forEach((s) => opts.push([s, s]));
    return opts;
  }
  function shareBase() { return location.href.split('#')[0]; }
  function refreshShare() {
    const p = player();
    if (!p || !ui.share || !$('#share-canvas')) return;
    const c = buildCard(p, ui.share.scope, ui.share.city);
    ui.share.card = c;
    drawCard($('#share-canvas'), c);
    $('#share-url').value = shareBase() + '#card=' + b64e(c);
  }
  function openShare(scope) {
    const p = player();
    if (!p || !p.games.length) return;
    const opts = shareOptions(p);
    const sc = opts.some((o) => o[0] === scope) ? scope : 'all';
    ui.share = { scope: sc, city: false, card: null };
    openModal('<h3>Share your card</h3>' +
      '<div class="field"><label for="sh-scope">What to show</label><select id="sh-scope" data-share="scope">' + opts.map((o) => '<option value="' + esc(o[0]) + '"' + (o[0] === sc ? ' selected' : '') + '>' + esc(o[1]) + '</option>').join('') + '</select></div>' +
      '<label class="check"><input type="checkbox" data-share="city"> Show my city &amp; state on the card</label>' +
      '<canvas id="share-canvas" class="share-canvas" aria-label="Preview of your player card"></canvas>' +
      '<div class="field"><label for="share-url">Link that opens your card</label><input id="share-url" type="text" readonly></div>' +
      '<p class="hint">Nothing is uploaded. The image and link contain only what you see on the card.</p>' +
      '<div class="actions"><button class="btn" data-action="share-image">Share image</button><button class="btn ghost" data-action="share-link">Share link</button></div>' +
      '<div class="actions"><button class="btn ghost" data-action="modal-close">Close</button></div>');
    refreshShare();
  }
  function copyFromInput(el, label) {
    const inp = $('#share-url');
    const done = () => { el.textContent = label; };
    const fallback = () => { inp.focus(); inp.select(); try { document.execCommand('copy'); done(); } catch (e) { el.textContent = 'Press Ctrl/Cmd+C'; } };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(inp.value).then(done, fallback); else fallback();
  }
  function shareImage(el) {
    const cv = $('#share-canvas'), c = ui.share && ui.share.card;
    if (!cv || !c) return;
    cv.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], 'dugout-diary-' + (c.n.replace(/[^a-z0-9]+/gi, '-').toLowerCase() || 'card') + '.png', { type: 'image/png' });
      const text = c.n + ' on Dugout Diary – build your own card free: ' + shareBase();
      if (navigator.canShare && navigator.canShare({ files: [file] })) { navigator.share({ files: [file], text: text }).catch(() => {}); return; }
      try {
        const url = URL.createObjectURL(blob), a = document.createElement('a');
        a.href = url; a.download = file.name; document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 2000);
        el.textContent = 'Saved ✓';
      } catch (e) { el.textContent = 'Press and hold the image to save'; }
    }, 'image/png');
  }

  function waitText(sec) { return sec >= 90 ? Math.ceil(sec / 60) + ' minutes' : sec + ' seconds'; }
  function pinField(id, name, label) {
    return '<div class="field"><label for="' + id + '">' + label + '</label><input id="' + id + '" name="' + name + '" type="password" inputmode="numeric" autocomplete="off" maxlength="8"></div>';
  }
  function openPinModal(mode) {
    const title = { set: 'Set a PIN', change: 'Change PIN', remove: 'Remove PIN' }[mode];
    openModal('<h3>' + title + '</h3><form data-form="pin" data-mode="' + mode + '" novalidate><div class="error" data-errbox hidden role="alert"></div>' +
      (mode !== 'set' ? pinField('pm-cur', 'cur', 'Current PIN') : '') +
      (mode !== 'remove' ? pinField('pm-pin', 'pin', mode === 'set' ? 'New PIN (4 to 8 digits)' : 'New PIN') + pinField('pm-pin2', 'pin2', 'Repeat PIN') : '') +
      '<div class="actions"><button type="button" class="btn ghost" data-action="modal-close">Cancel</button><button class="btn" type="submit">' + (mode === 'remove' ? 'Remove PIN' : 'Save PIN') + '</button></div></form>');
  }
  function showRecovery(rec) {
    const shown = rec.slice(0, 4) + '-' + rec.slice(4, 8) + '-' + rec.slice(8);
    openModal('<h3>Save your recovery code</h3><p class="recovery" id="rec-code">' + esc(shown) + '</p>' +
      '<p class="muted">If you ever forget your PIN, this code lets you remove it. We cannot recover it for you, so write it down or save it somewhere private. It will not be shown again.</p>' +
      '<div class="actions"><button class="btn ghost" data-action="copy-recovery">Copy</button><button class="btn" data-action="modal-close">I saved it</button></div>');
  }

  const actions = {
    'snooze-safe': () => { db.snooze = addDays(7); save(); render(); },
    'lock-now': () => { const p = player(); if (p && p.lock) { setUnlocked(p.id, false); go('home'); } },
    'pin-set': () => openPinModal('set'),
    'pin-change': () => openPinModal('change'),
    'pin-remove': () => openPinModal('remove'),
    'forgot-pin': () => {
      openModal('<h3>Forgot your PIN?</h3><p class="muted">Enter the recovery code you saved when you set the PIN. It will remove the PIN so you can set a new one.</p>' +
        '<form data-form="recover" novalidate><div class="error" data-errbox hidden role="alert"></div>' +
        '<div class="field"><label for="rc-code">Recovery code</label><input id="rc-code" name="code" type="text" autocomplete="off" autocapitalize="characters" maxlength="14" placeholder="XXXX-XXXX-XXXX"></div>' +
        '<div class="actions"><button type="button" class="btn ghost" data-action="modal-close">Cancel</button><button class="btn" type="submit">Remove PIN</button></div></form>' +
        '<p class="hint">No code? The only way in is to delete this player from this device and start a new card. Backup files keep the same PIN.</p>' +
        '<button class="btn danger block" data-action="reset-player">Delete this player</button>');
    },
    'copy-recovery': (el) => {
      const t = ($('#rec-code') || {}).textContent || '';
      const done = () => { el.textContent = 'Copied ✓'; };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(done, () => { el.textContent = 'Select and copy it'; }); else el.textContent = 'Select and copy it';
    },
    go: (el) => go(el.dataset.to),
    'print-now': () => { try { window.print(); } catch (e) { /* ignore */ } },
    'share-open': () => openShare('all'),
    'share-game': (el) => { closeModal(); openShare('game:' + el.dataset.id); },
    'share-image': (el) => shareImage(el),
    'share-link': (el) => {
      const c = ui.share && ui.share.card;
      if (!c) return;
      if (navigator.share) navigator.share({ title: 'Dugout Diary', text: c.n + '’s player card', url: $('#share-url').value }).catch(() => {});
      else copyFromInput(el, 'Link copied ✓');
    },
    'modal-close': () => closeModal(),
    'modal-bg': (el, e) => { if (e.target === el) closeModal(); },
    seg: (el) => { ui[el.dataset.grp] = el.dataset.val; render(); },
    chart: (el) => { ui.chart[ui.careerTab] = el.dataset.val; render(); },
    step: (el) => {
      const input = el.parentNode.querySelector('input'), max = Number(input.max) || 999;
      const v = Math.max(0, Math.min(max, S.int(input.value, max) + Number(el.dataset.d)));
      input.value = v;
      setDraftStat(input.dataset.sec, input.dataset.key, v, max, input.dataset.idx === undefined ? undefined : Number(input.dataset.idx));
    },
    ipstep: (el) => {
      const input = $('#f-pit-ip');
      const cur = S.parseInnings(input.value);
      const outs = Math.max(0, Math.min(60, (cur === null ? 0 : cur) + Number(el.dataset.d)));
      input.value = outs ? S.fmtInnings(outs) : '';
      ui.draft.pit.ip = input.value;
      updateLive();
    },
    fldmode: (el) => {
      const d = ui.draft;
      d.fldMode = el.dataset.val;
      if (d.fldMode === 'inning' && !d.fi.length) d.fi.push({ i: 1, pos: d.pos || '', po: d.fld.po, a: d.fld.a, e: d.fld.e, cs: d.fld.cs, ci: d.fld.ci });
      render();
    },
    'fi-add': () => {
      const d = ui.draft, last = d.fi[d.fi.length - 1];
      if (d.fi.length >= 12) return;
      d.fi.push({ i: Math.min(12, last ? last.i + 1 : 1), pos: last ? last.pos : '', po: 0, a: 0, e: 0, cs: 0, ci: 0 });
      render();
    },
    'fi-remove': (el) => { ui.draft.fi.splice(Number(el.dataset.idx), 1); render(); },
    'save-game': () => saveGame(),
    'after-save': (el) => { closeModal(); go(el.dataset.id); },
    'cancel-edit': () => { ui.draft = null; go('career'); },
    'edit-game': (el) => {
      const g = player().games.find((x) => x.id === el.dataset.id);
      if (!g) return;
      ui.draft = draftFromGame(g); ui.logTab = 'bat'; go('log');
    },
    'delete-game': (el) => confirmModal('Delete this game?', 'This removes it from your career totals. It cannot be undone.', 'Delete game', 'confirm-delete-game', el.dataset.id),
    'confirm-delete-game': (el) => {
      const p = player();
      p.games = p.games.filter((g) => g.id !== el.dataset.id);
      save(); closeModal(); render();
    },
    'new-player': () => { closeModal(); openModal('<h3>Add a player</h3>' + playerForm(null)); },
    'open-players': () => {
      openModal('<h3>Players</h3><div class="stack">' + db.players.map((p) =>
        '<button class="btn ' + (p.id === db.active ? '' : 'ghost') + ' block player-pick" data-action="switch-player" data-id="' + esc(p.id) + '"><span>' + (p.lock ? '🔒 ' : '') + esc(p.name) + (p.id === db.active ? ' ✓' : '') + '</span><small>' + esc([placeText(p), fmtPid(p.pid)].filter(Boolean).join(' · ')) + '</small></button>').join('') + '</div>' +
        '<div class="actions"><button class="btn ghost" data-action="modal-close">Close</button><button class="btn" data-action="new-player">+ Add player</button></div>');
    },
    'switch-player': (el) => { db.active = el.dataset.id; ui.draft = null; ui.careerSeason = ''; save(); closeModal(); render(); },
    'add-goal': () => openGoalModal(player()),
    'delete-goal': (el) => { const p = player(); p.goals = p.goals.filter((g) => g.id !== el.dataset.id); save(); render(); },
    summary: () => {
      const p = player();
      openModal('<h3>Career summary</h3><p class="muted">Copy and paste into a text, email, or social post.</p><textarea class="copybox" id="sum-text" readonly>' + esc(summaryText(p)) + '</textarea><div class="actions"><button class="btn ghost" data-action="modal-close">Close</button><button class="btn" data-action="copy-summary">Copy</button></div>');
    },
    'copy-summary': (el) => {
      const ta = $('#sum-text');
      const done = () => { el.textContent = 'Copied ✓'; };
      const fallback = () => { ta.focus(); ta.select(); try { document.execCommand('copy'); done(); } catch (e) { el.textContent = 'Press Ctrl/Cmd+C'; } };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(ta.value).then(done, fallback); else fallback();
    },
    export: () => exportBackup(),
    import: () => { const f = $('#import-file'); if (f) f.click(); },
    'reset-player': () => confirmModal('Delete ' + player().name + '’s data?', 'All of this player’s games and goals will be removed from this device. Export a backup first if you might want them back.', 'Delete player', 'confirm-reset-player'),
    'confirm-reset-player': () => {
      db.players = db.players.filter((p) => p.id !== db.active);
      db.active = db.players[0] ? db.players[0].id : null;
      ui.draft = null; save(); closeModal(); go('home'); render();
    },
    'reset-all': () => confirmModal('Erase everything?', 'Every player, game, and goal on this device will be deleted. This cannot be undone.', 'Yes, erase everything', 'confirm-reset-all'),
    'confirm-reset-all': () => { db = emptyDb(); ui.draft = null; save(); closeModal(); go('home'); render(); }
  };

  const forms = {
    player: (f) => {
      const id = f.dataset.id, el = f.elements;
      const data = { name: str(el.name.value, 40), city: str(el.city.value, 40), state: el.state.value, zip: String(el.zip.value).replace(/\s/g, '') };
      const errs = [];
      if (!data.name) errs.push('Add a first name or nickname.');
      if (data.zip && !/^\d{5}$/.test(data.zip)) errs.push('A ZIP code should be 5 digits.');
      if (!data.zip && !(data.city && data.state)) errs.push('Add a city and state, or just a ZIP code.');
      const pin = !id && el.pin ? String(el.pin.value) : '', pin2 = !id && el.pin2 ? String(el.pin2.value) : '';
      if (!id) {
        if (!termsOk() && !(el.agree && el.agree.checked)) errs.push('Please agree to the Terms & Privacy Notice to continue.');
        if (pin || pin2) { if (!/^\d{4,8}$/.test(pin)) errs.push('A PIN is 4 to 8 digits.'); else if (pin !== pin2) errs.push('The two PINs do not match.'); }
      }
      showErrors(f.querySelector('[data-errbox]'), errs);
      if (errs.length) return;
      if (id) {
        const p = db.players.find((x) => x.id === id);
        Object.assign(p, data);
        ui.flash = 'Player card saved.';
      } else {
        if (db.players.length >= 12) { showErrors(f.querySelector('[data-errbox]'), ['This device can hold up to 12 players.']); return; }
        const np = cleanPlayer(Object.assign({ id: uid('p'), created: Date.now(), innings: 6, games: [], goals: [] }, data));
        const commit = (rec) => {
          if (!termsOk()) db.terms = { v: TERMS_V, at: today() };
          db.players.push(np); db.active = np.id; ui.draft = null; ui.careerSeason = '';
          ui.flash = 'Player card created. Log your first game when you are ready!';
          save(); askPersist(); closeModal(); go('log');
          if (rec) showRecovery(rec);
        };
        if (pin) {
          const btn = f.querySelector('button[type=submit]'); if (btn) btn.disabled = true;
          makeLock(pin).then((r) => { np.lock = r.lock; setUnlocked(np.id, true); commit(r.recovery); }, () => { if (btn) btn.disabled = false; showErrors(f.querySelector('[data-errbox]'), ['Could not set the PIN on this browser.']); });
        } else commit(null);
        return;
      }
      save(); closeModal(); render();
    },
    unlock: (f) => {
      const p = player();
      if (!p || !p.lock) { render(); return; }
      const pin = String(f.elements.pin.value), box = f.querySelector('[data-errbox]');
      if (!/^\d{4,8}$/.test(pin)) { showErrors(box, ['Enter your 4 to 8 digit PIN.']); return; }
      tryPin(p, pin).then((r) => {
        if (r.ok) { setUnlocked(p.id, true); render(); return; }
        const b2 = document.querySelector('form[data-form=unlock] [data-errbox]'), inp = document.querySelector('form[data-form=unlock] input');
        showErrors(b2, [r.wait ? 'Too many tries. Wait ' + waitText(r.wait) + ', or use Forgot PIN.' : 'That PIN is not right. ' + r.left + ' ' + (r.left === 1 ? 'try' : 'tries') + ' left before a short pause.']);
        if (inp) { inp.value = ''; inp.focus(); }
      });
    },
    pin: (f) => {
      const p = player(), mode = f.dataset.mode, el = f.elements, box = f.querySelector('[data-errbox]');
      if (!p) return;
      const cur = el.cur ? String(el.cur.value) : '', pin = el.pin ? String(el.pin.value) : '', pin2 = el.pin2 ? String(el.pin2.value) : '';
      const errs = [];
      if (mode !== 'set' && !/^\d{4,8}$/.test(cur)) errs.push('Enter your current PIN.');
      if (mode !== 'remove') { if (!/^\d{4,8}$/.test(pin)) errs.push('A PIN is 4 to 8 digits.'); else if (pin !== pin2) errs.push('The two PINs do not match.'); }
      showErrors(box, errs);
      if (errs.length) return;
      const apply = () => {
        if (mode === 'remove') { p.lock = null; save(); closeModal(); ui.flash = 'PIN removed.'; render(); return; }
        makeLock(pin).then((r) => { p.lock = r.lock; setUnlocked(p.id, true); save(); closeModal(); ui.flash = 'PIN saved.'; render(); showRecovery(r.recovery); });
      };
      if (mode === 'set') { apply(); return; }
      tryPin(p, cur).then((r) => {
        if (r.ok) apply();
        else showErrors(box, [r.wait ? 'Too many tries. Wait ' + waitText(r.wait) + '.' : 'That is not your current PIN.']);
      });
    },
    recover: (f) => {
      const p = player(), box = f.querySelector('[data-errbox]');
      if (!p || !p.lock) return;
      const code = normCode(f.elements.code.value);
      if (code.length !== 12) { showErrors(box, ['The recovery code has 12 letters and numbers.']); return; }
      derive(code, p.lock.rs, p.lock.it).then((h) => {
        if (h !== p.lock.rh) { showErrors(box, ['That recovery code does not match.']); return; }
        p.lock = null; setUnlocked(p.id, true); save(); closeModal(); ui.flash = 'PIN removed. You can set a new one in About.'; render();
      });
    },
    goal: (f) => {
      const p = player(), el = f.elements;
      const m = S.metricById(el.metric.value);
      let t = parseFloat(String(el.target.value).trim().replace(/^\./, '0.'));
      if (m && m.id === 'ip') { const o = S.parseInnings(el.target.value); t = o === null || o <= 0 ? NaN : o / 3; }
      const errs = [];
      if (!m) errs.push('Pick a stat.');
      if (!isFinite(t) || t <= 0) errs.push('Enter a target greater than zero.');
      else if (m && m.kind === 'rate' && t > 1) errs.push('Averages are between .000 and 1.000, like .300.');
      showErrors(f.querySelector('[data-errbox]'), errs);
      if (errs.length) return;
      if (m.kind === 'count' && m.id !== 'ip') t = Math.round(t);
      if (p.goals.length >= 60) return;
      p.goals.push({ id: uid('o'), metric: m.id, target: t, scope: el.scope.value, created: Date.now() });
      save(); closeModal(); render();
    }
  };

  /* ---------- events ---------- */
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-action]');
    if (!el) return;
    const fn = actions[el.dataset.action];
    if (fn) fn(el, e);
  });
  document.addEventListener('submit', (e) => {
    const kind = e.target.dataset && e.target.dataset.form;
    if (!kind || !forms[kind]) return;
    e.preventDefault();
    forms[kind](e.target);
  });
  function onField(e) {
    const t = e.target;
    if (t.dataset && t.dataset.sec) setDraftStat(t.dataset.sec, t.dataset.key, t.value, Number(t.max) || 999, t.dataset.idx === undefined ? undefined : Number(t.dataset.idx));
    else if (t.dataset && t.dataset.ip && ui.draft) { ui.draft.pit.ip = t.value; updateLive(); }
    else if (t.dataset && t.dataset.fi !== undefined && ui.draft) {
      const row = ui.draft.fi[Number(t.dataset.idx)];
      if (row) {
        const was = row[t.dataset.fi];
        row[t.dataset.fi] = t.dataset.fi === 'i' ? (S.int(t.value, 12) || 1) : t.value;
        if (t.dataset.fi === 'pos' && (was === 'C') !== (t.value === 'C')) render(); else updateLive();
      }
    } else if (t.id === 'f-pos' && ui.draft) {
      const was = ui.draft.pos;
      ui.draft.pos = t.value;
      if ((was === 'C') !== (t.value === 'C')) render();
    }
    else if (t.dataset && t.dataset.field && ui.draft) ui.draft[t.dataset.field] = t.value;
  }
  document.addEventListener('input', onField);
  document.addEventListener('change', (e) => {
    onField(e);
    const t = e.target;
    if (t.dataset && t.dataset.ip && ui.draft) {
      const o = S.parseInnings(t.value);
      if (o !== null) { t.value = o ? S.fmtInnings(o) : ''; ui.draft.pit.ip = t.value; updateLive(); }
      return;
    }
    if (t.dataset && t.dataset.print) {
      if (t.dataset.print === 'copies') ui.print.copies = Math.max(1, Math.min(10, S.int(t.value, 10) || 1));
      else if (t.dataset.print === 'prefill') ui.print.prefill = t.checked;
      else ui.print.fmt = t.value;
      render();
      return;
    }
    if (t.dataset && t.dataset.share && ui.share) {
      if (t.dataset.share === 'scope') ui.share.scope = t.value; else ui.share.city = t.checked;
      refreshShare();
      return;
    }
    if (t.id === 'import-file') { importBackup(t.files && t.files[0]); t.value = ''; return; }
    if (t.dataset && t.dataset.setting === 'careerSeason') { ui.careerSeason = t.value; render(); }
    if (t.dataset && t.dataset.setting === 'innings') { const p = player(); if (p) { p.innings = Number(t.value) === 7 ? 7 : 6; save(); ui.flash = 'Saved. ERA now uses ' + p.innings + '-inning games.'; render(); } }
  });
  document.addEventListener('focusin', (e) => { if (e.target.matches && e.target.matches('.stepper input')) setTimeout(() => { try { e.target.select(); } catch (err) { /* ignore */ } }, 0); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && $('#modal-root').firstChild) closeModal(); });
  window.addEventListener('hashchange', render);

  askPersist();
  render();

  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    window.addEventListener('load', () => { navigator.serviceWorker.register('sw.js').catch(() => {}); });
  }
})();
