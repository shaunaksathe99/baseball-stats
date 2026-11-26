/* Plate 450 Diary - Match Up logic (Level Up, Invite a Friend). Pure functions, no DOM, so it can be unit tested in Node. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./stats.js'));
  else root.MatchCore = factory(root.Stats);
})(typeof self !== 'undefined' ? self : this, function (S) {
  'use strict';

  var MAX_FRIENDS = 10, MAX_STATS = 5;
  var ANON = 'A Plate 450 player';

  /* kind: rate (.842), era (2 decimals), pct (18%), one (1 decimal). low = lower is better. min = sample needed. */
  var STATS = [
    { id: 'avg', label: 'AVG', name: 'Batting average', kind: 'rate', low: false, min: 20, unit: 'at-bats',
      get: function (g) { var b = S.batting(g); return { v: b.avg, n: b.ab }; } },
    { id: 'obp', label: 'OBP', name: 'On-base percentage', kind: 'rate', low: false, min: 20, unit: 'plate appearances',
      get: function (g) { var b = S.batting(g); return { v: b.obp, n: b.pa }; } },
    { id: 'slg', label: 'SLG', name: 'Slugging', kind: 'rate', low: false, min: 20, unit: 'at-bats',
      get: function (g) { var b = S.batting(g); return { v: b.slg, n: b.ab }; } },
    { id: 'ops', label: 'OPS', name: 'On-base plus slugging', kind: 'rate', low: false, min: 20, unit: 'plate appearances',
      get: function (g) { var b = S.batting(g); return { v: b.ops, n: b.pa }; } },
    { id: 'kpct', label: 'K%', name: 'Strikeout rate (lower is better)', kind: 'pct', low: true, min: 20, unit: 'plate appearances',
      get: function (g) { var b = S.batting(g); return { v: b.pa ? b.k / b.pa : null, n: b.pa }; } },
    { id: 'bbpct', label: 'BB%', name: 'Walk rate', kind: 'pct', low: false, min: 20, unit: 'plate appearances',
      get: function (g) { var b = S.batting(g); return { v: b.pa ? b.bb / b.pa : null, n: b.pa }; } },
    { id: 'era', label: 'ERA', name: 'Earned run average (lower is better)', kind: 'era', low: true, min: 15, unit: 'outs (5 innings)',
      get: function (g, inn) { var p = S.pitching(g, inn); return { v: p.era, n: p.outs }; } },
    { id: 'whip', label: 'WHIP', name: 'Walks + hits per inning (lower is better)', kind: 'era', low: true, min: 15, unit: 'outs (5 innings)',
      get: function (g, inn) { var p = S.pitching(g, inn); return { v: p.whip, n: p.outs }; } },
    { id: 'k9', label: 'K/9', name: 'Strikeouts per 9 innings', kind: 'one', low: false, min: 15, unit: 'outs (5 innings)',
      get: function (g, inn) { var p = S.pitching(g, inn); return { v: p.outs ? p.k * 27 / p.outs : null, n: p.outs }; } },
    { id: 'fpct', label: 'FPCT', name: 'Fielding percentage', kind: 'rate', low: false, min: 10, unit: 'chances',
      get: function (g) { var f = S.fielding(g); return { v: f.fpct, n: f.tc }; } }
  ];
  function stat(id) { for (var i = 0; i < STATS.length; i++) if (STATS[i].id === id) return STATS[i]; return null; }

  function dec(st) { return st.kind === 'rate' ? 3 : st.kind === 'pct' ? 2 : st.kind === 'one' ? 1 : 2; }
  function round(st, v) { var d = dec(st); return Math.round(v * Math.pow(10, d)) / Math.pow(10, d); }
  function fmt(st, v) {
    if (v === null || v === undefined || !isFinite(v)) return '—';
    if (st.kind === 'rate') return S.fmtRate(v);
    if (st.kind === 'pct') return Math.round(v * 100) + '%';
    if (st.kind === 'one') return v.toFixed(1);
    return S.fmtEra(v);
  }
  // The size of a gap, written the way the stat is written.
  function fmtGap(st, d) {
    d = Math.abs(d);
    if (st.kind === 'pct') { var n = Math.round(d * 100); return n + (n === 1 ? ' point' : ' points'); }
    if (st.kind === 'rate') return S.fmtRate(d);
    return d.toFixed(st.kind === 'one' ? 1 : 2);
  }

  // value of one stat over a list of games; ok = enough games to be fair
  function compute(id, games, inn) {
    var st = stat(id);
    if (!st || !games || !games.length) return { ok: false, v: null, n: 0 };
    var r = st.get(games, inn || 6), ok = r.v !== null && isFinite(r.v) && r.n >= st.min;
    return { ok: ok, v: ok ? round(st, r.v) : null, n: r.n };
  }

  /* ---------- periods ---------- */
  function periods(p) {
    var g = S.sortGames(p.games || []), out = [{ id: 'all', label: 'All time' }];
    if (!g.length) return out;
    S.seasonNames(g).forEach(function (s) { out.push({ id: 's:' + s, label: s }); });
    var lv = []; g.forEach(function (x) { if (x.level && lv.indexOf(x.level) < 0) lv.push(x.level); });
    if (lv.length > 1) lv.forEach(function (l) { out.push({ id: 'l:' + l, label: l + ' division' }); });
    [5, 10].forEach(function (n) {
      if (g.length >= n) out.push({ id: 'last:' + n, label: 'Last ' + n + ' games' });
      if (g.length >= n * 2) out.push({ id: 'prev:' + n, label: 'Previous ' + n + ' games' });
    });
    out.push({ id: 'first', label: 'First month' });
    return out;
  }
  function pool(p, id) {
    var g = S.sortGames(p.games || []), m;
    if (id === 'all') return g;
    if (id === 'first') {
      if (!g.length) return [];
      var t0 = new Date(g[0].date + 'T00:00:00').getTime() + 30 * 864e5;
      return g.filter(function (x) { return new Date(x.date + 'T00:00:00').getTime() <= t0; });
    }
    if ((m = /^s:(.*)$/.exec(id))) return g.filter(function (x) { return x.season === m[1]; });
    if ((m = /^l:(.*)$/.exec(id))) return g.filter(function (x) { return x.level === m[1]; });
    if ((m = /^last:(\d+)$/.exec(id))) return g.slice(-Number(m[1]));
    if ((m = /^prev:(\d+)$/.exec(id))) { var n = Number(m[1]); return g.slice(Math.max(0, g.length - 2 * n), Math.max(0, g.length - n)); }
    return [];
  }
  function label(p, id) { var l = periods(p).filter(function (x) { return x.id === id; })[0]; return l ? l.label : ''; }
  // Sensible starting pair: older period first, newer second.
  function defaultPair(p) {
    var ids = periods(p).map(function (x) { return x.id; }), seasons = ids.filter(function (i) { return i.indexOf('s:') === 0; });
    if (seasons.length > 1) return [seasons[seasons.length - 2], seasons[seasons.length - 1]];
    if (ids.indexOf('prev:5') >= 0) return ['prev:5', 'last:5'];
    return ['first', 'all'];
  }

  /* ---------- Level Up (me vs. me) ---------- */
  function levelUp(p, aId, bId) {
    var A = pool(p, aId), B = pool(p, bId), rows = [], hidden = [];
    STATS.forEach(function (st) {
      var a = compute(st.id, A, p.innings), b = compute(st.id, B, p.innings);
      if (!a.ok || !b.ok) {
        // hide a stat unless the player has any data for it at all, so the "needs more games" note only shows for stats in use
        if ((a.n > 0 || b.n > 0)) hidden.push({ id: st.id, label: st.label, need: st.min, unit: st.unit });
        return;
      }
      var d = b.v - a.v, same = fmt(st, a.v) === fmt(st, b.v);
      var up = !same && (st.low ? d < 0 : d > 0);
      var row = { id: st.id, label: st.label, name: st.name, a: a.v, b: b.v, fa: fmt(st, a.v), fb: fmt(st, b.v), same: same, improved: up, arrow: same ? 'same' : (d > 0 ? 'up' : 'down'), gap: fmtGap(st, d), rel: Math.abs(a.v) > 0 ? Math.abs(d) / Math.abs(a.v) : 0 };
      row.line = up ? 'Your ' + st.label + ' is ' + (d > 0 ? 'up ' : 'down ') + row.gap : '';
      rows.push(row);
    });
    var best = rows.filter(function (r) { return r.improved; }).sort(function (x, y) { return y.rel - x.rel; }).slice(0, 2);
    return { rows: rows, hidden: hidden, best: best, a: A.length, b: B.length };
  }

  /* ---------- Invite a Friend ---------- */
  var FRAMES = ['Can you beat my numbers?', 'Think you can match my stats?', 'Ready for a friendly challenge?', "Let's see how we stack up!", 'Try to top my card!', 'Challenge accepted! Here are my numbers.'];
  function b64e(o) {
    var s = JSON.stringify(o), bin = '';
    if (typeof Buffer !== 'undefined') bin = Buffer.from(s, 'utf8').toString('base64');
    else { new TextEncoder().encode(s).forEach(function (b) { bin += String.fromCharCode(b); }); bin = btoa(bin); }
    return bin.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function b64d(s) {
    s = String(s).replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '=';
    if (typeof Buffer !== 'undefined') return JSON.parse(Buffer.from(s, 'base64').toString('utf8'));
    var bin = atob(s); return JSON.parse(new TextDecoder().decode(Uint8Array.from(bin, function (c) { return c.charCodeAt(0); })));
  }
  function clean(v, max) { return String(v == null ? '' : v).replace(/[\u0000-\u001f\u007f<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, max); }
  function newRid() {
    var a = 'abcdefghijkmnpqrstuvwxyz23456789', s = '';
    for (var i = 0; i < 8; i++) s += a.charAt(Math.floor(Math.random() * a.length));
    return s;
  }
  // The invite is a short array so the QR code stays small: [version, name, period, frame, id, [[stat, value], ...]]
  function makeInvite(o) {
    var seen = {}, s = [];
    (o.stats || []).forEach(function (x) {
      var st = stat(x[0]); if (!st || seen[st.id] || s.length >= MAX_STATS) return;
      if (x[1] === null || !isFinite(x[1])) return;
      seen[st.id] = 1; s.push([st.id, round(st, x[1])]);
    });
    return [1, o.show === false ? '' : clean(o.name, 30), clean(o.period, 24), Math.max(0, Math.min(FRAMES.length - 1, o.frame | 0)), /^[a-z0-9]{6,12}$/.test(o.rid || '') ? o.rid : newRid(), s];
  }
  function encodeInvite(inv) { return b64e(inv); }
  function parseInvite(text) {
    var a; try { a = typeof text === 'string' ? b64d(text) : text; } catch (e) { return null; }
    if (!Array.isArray(a) || a[0] !== 1 || !Array.isArray(a[5])) return null;
    var seen = {}, s = [];
    a[5].slice(0, MAX_STATS).forEach(function (x) {
      if (!Array.isArray(x)) return;
      var st = stat(x[0]), v = Number(x[1]);
      if (!st || seen[st.id] || !isFinite(v) || v < 0 || v > 99) return;
      seen[st.id] = 1; s.push({ id: st.id, v: round(st, v) });
    });
    if (!s.length) return null;
    var rid = /^[a-z0-9]{6,12}$/.test(String(a[4])) ? String(a[4]) : '';
    if (!rid) return null;
    return { n: clean(a[1], 30), p: clean(a[2], 24), f: Math.max(0, Math.min(FRAMES.length - 1, Number(a[3]) | 0)), id: rid, s: s };
  }
  function displayName(inv) { return inv.n || ANON; }
  function toArray(inv) { return [1, inv.n, inv.p, inv.f, inv.id, inv.s.map(function (x) { return [x.id, x.v]; })]; }
  function inviteMessage(inv, url) {
    var parts = inv.s.map(function (x) { var st = stat(x.id); return fmt(st, x.v) + ' ' + st.label; });
    return FRAMES[inv.f] + ' My ' + parts.join(', ') + (inv.p ? ' (' + inv.p + ')' : '') + '. ' + url;
  }

  // Side-by-side rows. mine(id) returns a compute() result for the friend's own stats.
  // The better number gets lead = 'me' or 'them'. There is no verdict, only the gap.
  function compare(inv, mine) {
    return inv.s.map(function (x) {
      var st = stat(x.id), m = mine(x.id), row = { id: x.id, label: st.label, name: st.name, theirs: fmt(st, x.v), mine: m && m.ok ? fmt(st, m.v) : '—', lead: '', gap: '', behind: false };
      if (m && m.ok) {
        var d = m.v - x.v;
        if (fmt(st, m.v) === fmt(st, x.v)) { row.lead = 'tie'; row.gap = 'Dead even on ' + st.label; }
        else {
          var meAhead = st.low ? d < 0 : d > 0;
          row.lead = meAhead ? 'me' : 'them'; row.behind = !meAhead;
          row.gap = 'Gap: ' + fmtGap(st, d) + ' ' + st.label;
        }
      }
      return row;
    });
  }

  /* ---------- My friends (kept on this device only) ---------- */
  function addFriend(list, inv) {
    list = (list || []).slice();
    for (var i = 0; i < list.length; i++) if (list[i].id === inv.id) { list[i] = inv; return { list: list, status: 'replaced' }; }
    if (list.length >= MAX_FRIENDS) return { list: list, status: 'full' };
    list.push(inv); return { list: list, status: 'added' };
  }
  function removeFriend(list, id) { return (list || []).filter(function (f) { return f.id !== id; }); }
  function cleanFriends(raw) {
    var out = [];
    (Array.isArray(raw) ? raw : []).forEach(function (f) {
      var inv = parseInvite(toArray({ n: f && f.n, p: f && f.p, f: f && f.f, id: f && f.id, s: Array.isArray(f && f.s) ? f.s : [] }));
      if (inv && out.length < MAX_FRIENDS && !out.some(function (x) { return x.id === inv.id; })) { inv.t = clean(f.t, 10); out.push(inv); }
    });
    return out;
  }

  return {
    STATS: STATS, FRAMES: FRAMES, MAX_FRIENDS: MAX_FRIENDS, MAX_STATS: MAX_STATS, ANON: ANON,
    stat: stat, fmt: fmt, fmtGap: fmtGap, compute: compute, periods: periods, pool: pool, label: label, defaultPair: defaultPair,
    levelUp: levelUp, makeInvite: makeInvite, encodeInvite: encodeInvite, parseInvite: parseInvite, displayName: displayName,
    inviteMessage: inviteMessage, compare: compare, addFriend: addFriend, removeFriend: removeFriend, cleanFriends: cleanFriends, b64e: b64e, b64d: b64d
  };
});
