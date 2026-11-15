/* Dugout Diary - pure stat math. No DOM access, so it can be unit tested in Node. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Stats = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var BAT_KEYS = ['ab', 'h', 'd', 't', 'hr', 'rbi', 'r', 'bb', 'k', 'hbp', 'sf', 'sb'];
  var PIT_KEYS = ['outs', 'h', 'r', 'er', 'bb', 'k', 'pitches'];
  var FLD_KEYS = ['po', 'a', 'e', 'cs', 'ci'];   // cs = caught stealing, ci = catcher's interference (catchers only)

  function int(v, max) {
    v = Math.floor(Number(v));
    if (!isFinite(v) || v < 0) return 0;
    return Math.min(v, max || 999);
  }

  function cleanSection(obj, keys) {
    var out = {};
    keys.forEach(function (k) { out[k] = int(obj && obj[k]); });
    return out;
  }

  function anyPositive(o) {
    if (!o) return false;
    for (var k in o) if (Number(o[k]) > 0) return true;
    return false;
  }
  function hasBat(g) { return anyPositive(g.bat); }
  function hasPit(g) { return anyPositive(g.pit); }
  function hasFld(g) { return anyPositive(g.fld) || !!(g.fi && g.fi.length); }

  function total(games, sec, keys) {
    var t = {};
    keys.forEach(function (k) { t[k] = 0; });
    games.forEach(function (g) {
      var s = g[sec];
      if (!s) return;
      keys.forEach(function (k) { t[k] += Number(s[k]) || 0; });
    });
    return t;
  }

  function batting(games) {
    var t = total(games, 'bat', BAT_KEYS);
    t.g = games.filter(hasBat).length;
    t.singles = t.h - t.d - t.t - t.hr;
    t.tb = t.h + t.d + 2 * t.t + 3 * t.hr;
    t.pa = t.ab + t.bb + t.hbp + t.sf;
    t.avg = t.ab ? t.h / t.ab : null;
    t.obp = t.pa ? (t.h + t.bb + t.hbp) / t.pa : null;
    t.slg = t.ab ? t.tb / t.ab : null;
    t.ops = t.obp !== null && t.slg !== null ? t.obp + t.slg : null;
    return t;
  }

  // inningsPerGame is 6 for most Little League-age play, 7 for others.
  function pitching(games, inningsPerGame) {
    var inn = inningsPerGame || 6;
    var t = total(games, 'pit', PIT_KEYS);
    t.g = games.filter(hasPit).length;
    t.ip = t.outs / 3;
    t.ipText = fmtInnings(t.outs);
    t.era = t.outs ? (t.er * inn * 3) / t.outs : null;
    t.whip = t.outs ? ((t.bb + t.h) * 3) / t.outs : null;
    return t;
  }

  function fielding(games) {
    var t = total(games, 'fld', FLD_KEYS);
    t.g = games.filter(hasFld).length;
    t.tc = t.po + t.a + t.e;
    t.fpct = t.tc ? (t.po + t.a) / t.tc : null;
    return t;
  }

  function fmtRate(v) {
    if (v === null || v === undefined || !isFinite(v)) return '—';
    var s = v.toFixed(3);
    return s.charAt(0) === '0' ? s.slice(1) : s;
  }
  function fmtEra(v) {
    if (v === null || v === undefined || !isFinite(v)) return '—';
    return v.toFixed(2);
  }
  function fmtIP(outs) {
    outs = int(outs, 1e6);
    return Math.floor(outs / 3) + '.' + (outs % 3);
  }

  // Baseball innings are written as fractions: 3 1/3 means 3 innings and 1 out.
  // Accepts "3 1/3", "3 2/3", "1/3", "4", and baseball decimals "3.1" / "3.2" (.1 = one out, .2 = two outs).
  // Returns total outs, or null if it is not a valid innings amount. Empty = 0.
  function parseInnings(str) {
    var s = String(str == null ? '' : str).replace(/⅓/g, ' 1/3').replace(/⅔/g, ' 2/3').replace(/(\d)\s*[-+]\s*(?=\d)/g, '$1 ').replace(/\s+/g, ' ').trim();
    if (!s) return 0;
    var m;
    if ((m = /^(\d{1,2})$/.exec(s))) return Number(m[1]) * 3;
    if ((m = /^(?:(\d{1,2}) )?([12])\/3$/.exec(s))) return (m[1] ? Number(m[1]) : 0) * 3 + Number(m[2]);
    if ((m = /^(\d{1,2})\.([012])$/.exec(s))) return Number(m[1]) * 3 + Number(m[2]);
    if ((m = /^\.([12])$/.exec(s))) return Number(m[1]);
    return null;
  }
  function fmtInnings(outs) {
    outs = int(outs, 1e6);
    var whole = Math.floor(outs / 3), r = outs % 3;
    if (!r) return String(whole);
    return whole ? whole + ' ' + r + '/3' : r + '/3';
  }
  function fmtCount(v) {
    if (v === null || v === undefined) return '—';
    return String(Math.round(v * 10) / 10);
  }

  function byDate(a, b) {
    if (a.date !== b.date) return a.date < b.date ? -1 : 1;
    return (a.created || 0) - (b.created || 0);
  }
  function sortGames(games) { return games.slice().sort(byDate); }

  function seasonNames(games) {
    var first = {};
    games.forEach(function (g) {
      if (!(g.season in first) || g.date < first[g.season]) first[g.season] = g.date;
    });
    return Object.keys(first).sort(function (a, b) { return first[a] < first[b] ? -1 : first[a] > first[b] ? 1 : 0; });
  }

  // Groups by season + team so a mid-season team change shows as two rows.
  function groups(games) {
    var map = {};
    sortGames(games).forEach(function (g) {
      var key = g.season + '|' + g.team;
      if (!map[key]) map[key] = { key: key, season: g.season, team: g.team, level: g.level, first: g.date, games: [] };
      map[key].games.push(g);
      if (g.level) map[key].level = g.level;
    });
    return Object.keys(map).map(function (k) { return map[k]; })
      .sort(function (a, b) { return a.first < b.first ? -1 : a.first > b.first ? 1 : 0; });
  }

  var SERIES = {
    avg: { has: hasBat, val: function (gs) { return batting(gs).avg; } },
    obp: { has: hasBat, val: function (gs) { return batting(gs).obp; } },
    slg: { has: hasBat, val: function (gs) { return batting(gs).slg; } },
    era: { has: hasPit, val: function (gs, inn) { return pitching(gs, inn).era; } },
    whip: { has: hasPit, val: function (gs, inn) { return pitching(gs, inn).whip; } },
    fpct: { has: hasFld, val: function (gs) { return fielding(gs).fpct; } }
  };

  // Running career value after each game that has the relevant stats.
  function series(games, metric, inn) {
    var def = SERIES[metric];
    if (!def) return [];
    var run = [], out = [];
    sortGames(games).forEach(function (g) {
      run.push(g);
      if (!def.has(g)) return;
      var v = def.val(run, inn);
      if (v !== null && isFinite(v)) out.push({ date: g.date, value: v });
    });
    return out;
  }


  /* ---------- Baseball rule checks for the entry form ----------
     errors   = impossible under the rules of baseball (block saving)
     warnings = unusual but possible (ask the player to double-check, then allow) */
  function validateGame(b, p, f, opts) {
    var inn = (opts && opts.inn) || 6, errors = [], warnings = [];
    b = b || {}; p = p || {}; f = f || {};
    var ab = b.ab | 0, h = b.h | 0, d = b.d | 0, t = b.t | 0, hr = b.hr | 0, rbi = b.rbi | 0, r = b.r | 0;
    var bb = b.bb | 0, k = b.k | 0, hbp = b.hbp | 0, sf = b.sf | 0;
    var pa = ab + bb + hbp + sf;

    if (h > ab) errors.push('Hits cannot be more than at-bats. Walks, hit-by-pitch and sacrifices are not at-bats, so leave them out of AB.');
    if (d + t + hr > h) errors.push('Doubles + triples + home runs cannot be more than hits.');
    if (h + k > ab) errors.push('Hits plus strikeouts cannot be more than at-bats. Each one is a different at-bat.');
    if (rbi > 0 && pa === 0) errors.push('RBI needs a plate appearance. Add the at-bat, walk, or sacrifice that drove the run in.');
    if (pa > 0 && rbi > 4 * pa) errors.push('A batter can drive in at most 4 runs in one plate appearance. Check the RBI total.');
    if ((p.er | 0) > (p.r | 0)) errors.push('Earned runs cannot be more than runs allowed. Runs caused by errors are unearned, so they count in Runs but not in ER.');

    if (sf > rbi) warnings.push('A sacrifice fly scores a run, so the batter normally gets an RBI. Check sac flies and RBI.');
    if (hr > rbi) warnings.push('A home run normally drives in at least one run (the batter). Check home runs and RBI.');
    if (hr > r) warnings.push('A batter who homers scores a run, so Runs should be at least your home runs.');
    if (pa > 8) warnings.push('That is ' + pa + ' plate appearances in one game. Double-check, and log doubleheaders as separate games.');
    if ((p.pitches | 0) > 0 && (p.k | 0) * 3 > (p.pitches | 0)) warnings.push('Each strikeout takes at least 3 pitches, but the pitch count is lower than that.');
    if ((p.outs | 0) > inn * 3 + 6) warnings.push('That is more innings pitched than a ' + inn + '-inning game plus extra innings. Double-check.');
    return { errors: errors, warnings: warnings };
  }

  /* ---------- Fielding by position (supports whole-game and by-inning entries) ---------- */
  var POS_ORDER = ['P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF'];
  function fieldingByPosition(games) {
    var map = {};
    function row(pos) {
      if (!map[pos]) map[pos] = { pos: pos, games: {}, innKeys: {}, inn: 0, po: 0, a: 0, e: 0, cs: 0, ci: 0 };
      return map[pos];
    }
    games.forEach(function (g) {
      var gid = g.id || String(g.date);
      if (g.fi && g.fi.length) {
        g.fi.forEach(function (r) {
          if (!r.pos) return;
          var x = row(r.pos), k = gid + '|' + r.i;
          x.games[gid] = 1;
          if (!x.innKeys[k]) { x.innKeys[k] = 1; x.inn++; }
          x.po += Number(r.po) || 0; x.a += Number(r.a) || 0; x.e += Number(r.e) || 0; x.cs += Number(r.cs) || 0; x.ci += Number(r.ci) || 0;
        });
      } else if (g.pos && anyPositive(g.fld)) {
        var y = row(g.pos);
        y.games[gid] = 1;
        y.po += Number(g.fld.po) || 0; y.a += Number(g.fld.a) || 0; y.e += Number(g.fld.e) || 0; y.cs += Number(g.fld.cs) || 0; y.ci += Number(g.fld.ci) || 0;
      }
    });
    return Object.keys(map).map(function (k) {
      var x = map[k], tc = x.po + x.a + x.e;
      return { pos: x.pos, g: Object.keys(x.games).length, inn: x.inn, po: x.po, a: x.a, e: x.e, cs: x.cs, ci: x.ci, tc: tc, fpct: tc ? (x.po + x.a) / tc : null };
    }).sort(function (a, b) {
      var ia = POS_ORDER.indexOf(a.pos), ib = POS_ORDER.indexOf(b.pos);
      return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
    });
  }

  // Whole-game fielding for a catcher: soft warnings about how CS and CI are scored.
  function validateCatcher(f, pos) {
    var w = [];
    if (pos !== 'C') return w;
    if ((f.cs | 0) > (f.a | 0)) w.push('A catcher who throws out a runner is normally credited with an assist, so A is usually at least CS.');
    if ((f.ci | 0) > (f.e | 0)) w.push('Catcher\u2019s interference is scored as an error on the catcher, so add it to E too.');
    return w;
  }

  // rows: draft inning rows [{i, pos, po, a, e}]. Rows with no position and no numbers are ignored.
  function validateFi(rows) {
    var errors = [], warnings = [], seen = {};
    (rows || []).forEach(function (r) {
      var has = (r.po | 0) + (r.a | 0) + (r.e | 0) + (r.cs | 0) + (r.ci | 0) > 0;
      if (!r.pos && !has) return;
      if (!r.pos) { errors.push('Pick a position for inning ' + r.i + '.'); return; }
      if ((r.po | 0) > 3) errors.push('Inning ' + r.i + ': one fielder cannot have more than 3 putouts in an inning (only 3 outs).');
      if (r.pos === 'C') {
        if ((r.cs | 0) > (r.a | 0)) warnings.push('Inning ' + r.i + ': a catcher who throws out a runner is normally credited with an assist, so A is usually at least CS.');
        if ((r.ci | 0) > (r.e | 0)) warnings.push('Inning ' + r.i + ': catcher\u2019s interference is scored as an error on the catcher, so add it to E too.');
      }
      var k = r.i + '|' + r.pos;
      if (seen[k]) warnings.push('Inning ' + r.i + ' lists ' + r.pos + ' twice. Combine them into one row.');
      seen[k] = 1;
    });
    return { errors: errors, warnings: warnings };
  }

  /* ---------- Goals ---------- */
  var METRICS = [
    { id: 'h', label: 'Hits', group: 'Batting', better: 'high', kind: 'count' },
    { id: 'd', label: 'Doubles', group: 'Batting', better: 'high', kind: 'count' },
    { id: 'hr', label: 'Home runs', group: 'Batting', better: 'high', kind: 'count' },
    { id: 'rbi', label: 'RBI', group: 'Batting', better: 'high', kind: 'count' },
    { id: 'r', label: 'Runs scored', group: 'Batting', better: 'high', kind: 'count' },
    { id: 'bb', label: 'Walks', group: 'Batting', better: 'high', kind: 'count' },
    { id: 'sb', label: 'Stolen bases', group: 'Batting', better: 'high', kind: 'count' },
    { id: 'avg', label: 'Batting average', group: 'Batting', better: 'high', kind: 'rate' },
    { id: 'obp', label: 'On-base %', group: 'Batting', better: 'high', kind: 'rate' },
    { id: 'pk', label: 'Strikeouts (pitching)', group: 'Pitching', better: 'high', kind: 'count' },
    { id: 'ip', label: 'Innings pitched', group: 'Pitching', better: 'high', kind: 'count' },
    { id: 'era', label: 'ERA', group: 'Pitching', better: 'low', kind: 'era' },
    { id: 'whip', label: 'WHIP', group: 'Pitching', better: 'low', kind: 'era' },
    { id: 'fpct', label: 'Fielding %', group: 'Fielding', better: 'high', kind: 'rate' },
    { id: 'g', label: 'Games played', group: 'General', better: 'high', kind: 'count' }
  ];

  function metricById(id) {
    for (var i = 0; i < METRICS.length; i++) if (METRICS[i].id === id) return METRICS[i];
    return null;
  }

  function metricValue(games, id, inn) {
    var b, p;
    switch (id) {
      case 'h': case 'd': case 'hr': case 'rbi': case 'r': case 'bb': case 'sb':
        return batting(games)[id];
      case 'avg': case 'obp': return batting(games)[id];
      case 'pk': return pitching(games, inn).k;
      case 'ip': p = pitching(games, inn); return p.ip;
      case 'era': return pitching(games, inn).era;
      case 'whip': return pitching(games, inn).whip;
      case 'fpct': return fielding(games).fpct;
      case 'g': return games.length;
    }
    return null;
  }

  function fmtMetric(id, v) {
    var m = metricById(id);
    if (!m) return String(v);
    if (id === 'ip') return v === null ? '\u2014' : fmtInnings(Math.round(v * 3));
    if (m.kind === 'rate') return fmtRate(v);
    if (m.kind === 'era') return fmtEra(v);
    return fmtCount(v);
  }

  // goal: {metric, target, scope: 'career' | season name}
  function goalStatus(goal, games, inn) {
    var m = metricById(goal.metric);
    var pool = goal.scope && goal.scope !== 'career'
      ? games.filter(function (g) { return g.season === goal.scope; })
      : games;
    var value = m ? metricValue(pool, goal.metric, inn) : null;
    var target = Number(goal.target);
    var met = false, pct = 0;
    if (value !== null && isFinite(target) && target > 0) {
      if (m.better === 'low') {
        met = value <= target;
        pct = value <= 0 ? 1 : Math.min(1, target / value);
      } else {
        met = value >= target;
        pct = Math.min(1, value / target);
      }
    }
    return { value: value, met: met, pct: pct, count: pool.length };
  }

  /* ---------- Badges ---------- */
  function firstWhere(sorted, pred) {
    for (var i = 0; i < sorted.length; i++) if (pred(sorted[i])) return sorted[i].date;
    return null;
  }
  function reach(sorted, per, n) {
    var sum = 0;
    for (var i = 0; i < sorted.length; i++) {
      sum += per(sorted[i]);
      if (sum >= n) return sorted[i].date;
    }
    return null;
  }
  function bat(g, k) { return g.bat ? Number(g.bat[k]) || 0 : 0; }
  function pit(g, k) { return g.pit ? Number(g.pit[k]) || 0 : 0; }
  function fld(g, k) { return g.fld ? Number(g.fld[k]) || 0 : 0; }

  var BADGES = [
    { id: 'rookie', icon: '🎴', name: 'Rookie Card', desc: 'Log your first game', check: function (s) { return s.length ? s[0].date : null; } },
    { id: 'hit', icon: '⚾', name: 'First Hit', desc: 'Get a hit', check: function (s) { return firstWhere(s, function (g) { return bat(g, 'h') > 0; }); } },
    { id: 'xbh', icon: '🚀', name: 'Gap Shot', desc: 'Hit a double, triple, or homer', check: function (s) { return firstWhere(s, function (g) { return bat(g, 'd') + bat(g, 't') + bat(g, 'hr') > 0; }); } },
    { id: 'hr', icon: '💥', name: 'Long Ball', desc: 'Hit a home run', check: function (s) { return firstWhere(s, function (g) { return bat(g, 'hr') > 0; }); } },
    { id: 'rbi', icon: '🎯', name: 'Clutch', desc: 'Drive in a run', check: function (s) { return firstWhere(s, function (g) { return bat(g, 'rbi') > 0; }); } },
    { id: 'sb', icon: '💨', name: 'Swiped a Bag', desc: 'Steal a base', check: function (s) { return firstWhere(s, function (g) { return bat(g, 'sb') > 0; }); } },
    { id: 'multi', icon: '✌️', name: 'Multi-Hit Game', desc: 'Get 2+ hits in one game', check: function (s) { return firstWhere(s, function (g) { return bat(g, 'h') >= 2; }); } },
    { id: 'eye', icon: '👀', name: 'Good Eye', desc: 'Draw 2+ walks in one game', check: function (s) { return firstWhere(s, function (g) { return bat(g, 'bb') >= 2; }); } },
    { id: 'k', icon: '🔥', name: 'Punch-Out', desc: 'Strike out a batter', check: function (s) { return firstWhere(s, function (g) { return pit(g, 'k') > 0; }); } },
    { id: 'ace', icon: '👑', name: 'Ace Outing', desc: 'Pitch 3+ innings, 1 earned run or fewer', check: function (s) { return firstWhere(s, function (g) { return pit(g, 'outs') >= 9 && pit(g, 'er') <= 1; }); } },
    { id: 'glove', icon: '🧤', name: 'Spotless Glove', desc: 'Handle 3+ chances with no errors', check: function (s) { return firstWhere(s, function (g) { return fld(g, 'po') + fld(g, 'a') + fld(g, 'e') >= 3 && fld(g, 'e') === 0; }); } },
    { id: 'g10', icon: '📅', name: 'Ten Games Deep', desc: 'Log 10 games', check: function (s) { return s.length >= 10 ? s[9].date : null; } },
    { id: 'h25', icon: '🏆', name: '25 Career Hits', desc: 'Reach 25 hits', check: function (s) { return reach(s, function (g) { return bat(g, 'h'); }, 25); } },
    {
      id: 's300', icon: '💯', name: '.300 Season', desc: 'Bat .300+ in a season (20+ at-bats)',
      check: function (s) {
        var best = null;
        seasonNames(s).forEach(function (name) {
          var pool = s.filter(function (g) { return g.season === name; });
          var b = batting(pool);
          if (b.ab >= 20 && b.avg >= 0.3) {
            var d = pool[pool.length - 1].date;
            if (best === null || d < best) best = d;
          }
        });
        return best;
      }
    }
  ];

  // Consecutive games with a hit. Games with no at-bats (walk-only) neither extend nor break it.
  function hitStreak(games) {
    var run = 0, best = 0;
    sortGames(games).forEach(function (g) {
      if (bat(g, 'ab') <= 0) return;
      if (bat(g, 'h') > 0) { run++; if (run > best) best = run; } else run = 0;
    });
    return { current: run, best: best };
  }

  function badgeIds() { return BADGES.map(function (b) { return b.id; }); }

  function badges(games) {
    var sorted = sortGames(games);
    return BADGES.map(function (b) {
      var date = b.check(sorted);
      return { id: b.id, icon: b.icon, name: b.name, desc: b.desc, earned: !!date, date: date };
    });
  }

  return {
    BAT_KEYS: BAT_KEYS, PIT_KEYS: PIT_KEYS, FLD_KEYS: FLD_KEYS, METRICS: METRICS,
    int: int, cleanSection: cleanSection, anyPositive: anyPositive,
    hasBat: hasBat, hasPit: hasPit, hasFld: hasFld,
    batting: batting, pitching: pitching, fielding: fielding,
    fmtRate: fmtRate, fmtEra: fmtEra, fmtIP: fmtIP, fmtCount: fmtCount, fmtMetric: fmtMetric,
    sortGames: sortGames, seasonNames: seasonNames, groups: groups, series: series,
    metricById: metricById, metricValue: metricValue, goalStatus: goalStatus, badges: badges,
    hitStreak: hitStreak, badgeIds: badgeIds, validateGame: validateGame,
    parseInnings: parseInnings, fmtInnings: fmtInnings, fieldingByPosition: fieldingByPosition, validateFi: validateFi, validateCatcher: validateCatcher, POS_ORDER: POS_ORDER
  };
});
