/* Dugout Diary - Game IQ simulator: scenario bank and round logic. No DOM access, so it can be unit tested in Node. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Sim = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var CATS = [
    { id: 'run', name: 'Baserunning', icon: '🏃' },
    { id: 'hit', name: 'Hitting', icon: '⚾' },
    { id: 'fld', name: 'Fielding', icon: '🧤' },
    { id: 'pit', name: 'Pitching & Catching', icon: '🔥' },
    { id: 'rul', name: 'Rules', icon: '📋' },
    { id: 'iq', name: 'Smart Play', icon: '🧠' },
    { id: 'sco', name: 'Scoring the Play', icon: '📝' }
  ];
  // League levels, like the minors: A is the basics, AA is tougher, AAA is big-league smarts.
  var LEVELS = { 1: 'A', 2: 'AA', 3: 'AAA' };
  var LEVEL_INFO = { 1: 'The basics', 2: 'Getting tougher', 3: 'Big-league smarts' };
  var POSITIONS = ['bat', '1', '2', '3', 'P', 'C', '1B', '2B', 'SS', '3B', 'LF', 'CF', 'RF'];

  // sit: inn (1-7), outs (0-2), b = [first, second, third] runners, us/them = runs, cnt = "balls-strikes" or '', you = where the player is.
  // ans is the index (in opts) of the single best answer. Options are shuffled when shown.
  // The scenario bank lives in content/content.js (edited through the Content Studio). setScenarios() loads it.
  var SCENARIOS = [];
  var BY_ID = {};

  // Replaces the bank in place (so Sim.SCENARIOS stays valid). Hidden or structurally invalid scenarios are skipped.
  function setScenarios(list) {
    SCENARIOS.length = 0; BY_ID = {};
    (Array.isArray(list) ? list : []).forEach(function (s) {
      if (!s || s.hidden || validate([s]).length) return;
      if (Object.prototype.hasOwnProperty.call(BY_ID, s.id)) return;
      SCENARIOS.push(s); BY_ID[s.id] = s;
    });
    return SCENARIOS.length;
  }

  function byId(id) { return Object.prototype.hasOwnProperty.call(BY_ID, id) ? BY_ID[id] : null; }
  function ids() { return SCENARIOS.map(function (s) { return s.id; }); }
  function catOf(id) { for (var i = 0; i < CATS.length; i++) if (CATS[i].id === id) return CATS[i]; return null; }
  function inCat(cat, lvl) {
    var l = Number(lvl) || 0;
    return SCENARIOS.filter(function (s) { return (!catOf(cat) || s.cat === cat) && (!l || s.lvl === l); });
  }

  // Structural checks, used by tests and by anyone adding scenarios later. Returns a list of problems.
  function validate(list) {
    var out = [], seen = {};
    (list || SCENARIOS).forEach(function (s) {
      var w = s.id + ': ';
      if (!/^[a-z]{2,4}\d{1,3}$/.test(s.id)) out.push(w + 'bad id');
      if (seen[s.id]) out.push(w + 'duplicate id'); seen[s.id] = 1;
      if (!catOf(s.cat)) out.push(w + 'unknown category');
      if (!LEVELS[s.lvl]) out.push(w + 'bad level');
      var t = s.sit || {};
      if (!(t.inn >= 1 && t.inn <= 7)) out.push(w + 'bad inning');
      if (!(t.outs >= 0 && t.outs <= 2)) out.push(w + 'bad outs');
      if (!Array.isArray(t.b) || t.b.length !== 3 || t.b.some(function (x) { return x !== 0 && x !== 1; })) out.push(w + 'bad runners');
      if (!(t.us >= 0 && t.them >= 0)) out.push(w + 'bad score');
      if (t.cnt && !/^[0-3]-[0-2]$/.test(t.cnt)) out.push(w + 'bad count');
      if (POSITIONS.indexOf(t.you) < 0) out.push(w + 'bad position');
      if (['1', '2', '3'].indexOf(t.you) >= 0 && !t.b[Number(t.you) - 1]) out.push(w + 'runner marker without a runner');
      if (!Array.isArray(s.opts) || s.opts.length < 3 || s.opts.length > 4) out.push(w + 'needs 3 or 4 options');
      else {
        if (new Set(s.opts).size !== s.opts.length) out.push(w + 'duplicate options');
        if (!(s.ans >= 0 && s.ans < s.opts.length)) out.push(w + 'answer out of range');
      }
      if (!s.q || s.q.length > 260) out.push(w + 'question missing or too long');
      if (!s.why || s.why.length < 40 || s.why.length > 420) out.push(w + 'explanation length');
      if (!s.tip || s.tip.length > 60) out.push(w + 'tip missing or too long');
    });
    return out;
  }

  // prog: { id: [attempts, correct, lastWasCorrect] }. Missed ones come first, then new ones, then mastered ones.
  function pickRound(prog, cat, n, rng, lvl) {
    rng = rng || Math.random;
    prog = prog || {};
    var pool = (inCat(cat, lvl).length ? inCat(cat, lvl) : inCat(cat)).map(function (s) {
      var r = Object.prototype.hasOwnProperty.call(prog, s.id) ? prog[s.id] : null;
      var base = !r ? 0.5 : (r[2] ? 2 : 0);
      return { id: s.id, k: base + rng() * 0.9 };
    });
    pool.sort(function (a, b) { return a.k - b.k; });
    return pool.slice(0, Math.max(1, Math.min(n || 5, pool.length))).map(function (x) { return x.id; });
  }

  function shuffle(n, rng) {
    rng = rng || Math.random;
    var a = [], i, j, t;
    for (i = 0; i < n; i++) a.push(i);
    for (i = n - 1; i > 0; i--) { j = Math.floor(rng() * (i + 1)); t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }

  var RANKS = [
    { name: 'Rookie', at: 0, icon: '🌱' },
    { name: 'Utility Player', at: 0.1, icon: '🧢' },
    { name: 'Starter', at: 0.3, icon: '⚾' },
    { name: 'All-Star', at: 0.55, icon: '⭐' },
    { name: 'Hall of Famer', at: 0.8, icon: '🏆' }
  ];
  // mastered = scenarios whose most recent answer was correct
  function rank(mastered, total) {
    total = total || SCENARIOS.length;
    var f = total ? mastered / total : 0, i = 0, k;
    for (k = 0; k < RANKS.length; k++) if (f >= RANKS[k].at) i = k;
    var next = RANKS[i + 1] || null, need = next ? Math.max(1, Math.ceil(next.at * total - 1e-9)) - mastered : 0;
    var floor = Math.ceil(RANKS[i].at * total - 1e-9), span = next ? Math.max(1, Math.ceil(next.at * total - 1e-9) - floor) : 1;
    return { name: RANKS[i].name, icon: RANKS[i].icon, next: next ? next.name : null, need: Math.max(0, need), pct: next ? Math.max(0, Math.min(1, (mastered - floor) / span)) : 1 };
  }
  function masteredCount(prog) {
    var n = 0;
    SCENARIOS.forEach(function (s) { var r = prog && Object.prototype.hasOwnProperty.call(prog, s.id) ? prog[s.id] : null; if (r && r[2]) n++; });
    return n;
  }

  return { CATS: CATS, LEVELS: LEVELS, LEVEL_INFO: LEVEL_INFO, POSITIONS: POSITIONS, SCENARIOS: SCENARIOS, setScenarios: setScenarios, byId: byId, ids: ids, catOf: catOf, inCat: inCat, validate: validate, pickRound: pickRound, shuffle: shuffle, rank: rank, masteredCount: masteredCount, RANKS: RANKS };
});
