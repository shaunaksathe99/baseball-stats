/* Dugout Diary - game reviews and the improvement plan.
   Pure logic (no page code) so it can be tested in Node. A review is a list of notes for one game, each for the whole game
   (i = 0) or one inning, with topics the player did well and topics to work on, plus a short note for each. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Review = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var GROUPS = [['hit', 'Hitting'], ['run', 'Baserunning'], ['fld', 'Fielding'], ['pit', 'Pitching'], ['cat', 'Catching'], ['mind', 'Mindset']];
  var TOPICS = [
    ['hit-eye', 'Pitch selection (swinging at strikes)'], ['hit-two', 'Hitting with two strikes'], ['hit-time', 'Swing timing'], ['hit-contact', 'Making solid contact'], ['hit-bunt', 'Bunting'],
    ['run-lead', 'Leads and jumps'], ['run-read', 'Reading the ball on the bases'], ['run-hard', 'Running hard and sliding'],
    ['fld-ready', 'Ready position and glove work'], ['fld-foot', 'Footwork'], ['fld-throw', 'Throwing accuracy'], ['fld-call', 'Calling the ball'], ['fld-back', 'Backing up plays'],
    ['pit-strike', 'Throwing strikes'], ['pit-first', 'First-pitch strikes'], ['pit-hold', 'Holding runners'], ['pit-field', 'Fielding my position'],
    ['cat-block', 'Blocking balls in the dirt'], ['cat-throw', 'Throwing out runners'],
    ['mind-focus', 'Staying focused'], ['mind-bounce', 'Bouncing back from mistakes'], ['mind-team', 'Teamwork and encouragement'], ['mind-know', 'Knowing the situation before the pitch']
  ].map(function (t) { return { id: t[0], group: t[0].split('-')[0], label: t[1] }; });
  var BY_ID = {};
  TOPICS.forEach(function (t) { BY_ID[t.id] = t; });

  var STATES = {
    persistent: { label: 'Still needs work', order: 0 },
    watch: { label: 'Keep an eye on it', order: 1 },
    improving: { label: 'Getting better', order: 2 },
    fixed: { label: 'Fixed!', order: 3 },
    strength: { label: 'A strength', order: 4 },
    seen: { label: 'Noted', order: 5 }
  };
  var MAX_ENTRIES = 13, MAX_TAGS = 8, NOTE_MAX = 400;

  function topic(id) { return Object.prototype.hasOwnProperty.call(BY_ID, id) ? BY_ID[id] : null; }
  function text(v, n) { return String(v == null ? '' : v).replace(/[<>\u0000-\u0008\u000B\u000C\u000E-\u001F\u2028\u2029]/g, '').replace(/\s+/g, ' ').trim().slice(0, n); }
  function note(v) { return String(v == null ? '' : v).replace(/[<>\u0000-\u0008\u000B\u000C\u000E-\u001F\u2028\u2029]/g, '').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim().slice(0, NOTE_MAX); }
  function tags(list) {
    var out = [];
    (Array.isArray(list) ? list : []).forEach(function (id) { if (topic(id) && out.indexOf(id) < 0 && out.length < MAX_TAGS) out.push(id); });
    return out;
  }
  function inning(v) { var n = Math.floor(Number(v)); return n >= 1 && n <= 12 ? n : 0; }

  // Cleans a list of notes. Empty ones are dropped, innings are unique, and the whole-game note (i = 0) comes first.
  function clean(raw) {
    var seen = {}, out = [];
    (Array.isArray(raw) ? raw : []).slice(0, 40).forEach(function (r) {
      if (!r || typeof r !== 'object') return;
      var i = inning(r.i);
      if (seen[i]) return;
      var e = { i: i, well: tags(r.well), work: tags(r.work), wn: note(r.wn), kn: note(r.kn) };
      if (!e.well.length && !e.work.length && !e.wn && !e.kn) return;
      seen[i] = 1; out.push(e);
    });
    out.sort(function (a, b) { return a.i - b.i; });
    return out.slice(0, MAX_ENTRIES);
  }
  function has(game) { return !!(game && Array.isArray(game.rv) && game.rv.length); }

  function cleanScore(v) {
    if (v === '' || v == null) return null;
    var n = Math.floor(Number(v));
    return isFinite(n) && n >= 0 && n <= 99 ? n : null;
  }
  function resultOf(us, them) {
    if (us == null || them == null) return '';
    return us > them ? 'W' : us < them ? 'L' : 'T';
  }
  // 'W 5-3' style text, or '' if no score
  function scoreText(g) {
    if (!g || g.us == null || g.them == null) return '';
    return (g.result || resultOf(g.us, g.them)) + ' ' + g.us + '-' + g.them;
  }

  function sortGames(games) {
    return games.slice().sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : (a.created || 0) - (b.created || 0); });
  }
  // What a game's review says about one topic: 'w' went well, 'k' work on, 'm' both (different innings), '' not mentioned.
  function mark(game, id) {
    var w = false, k = false;
    ((game && game.rv) || []).forEach(function (e) { if (e.well.indexOf(id) >= 0) w = true; if (e.work.indexOf(id) >= 0) k = true; });
    return w && k ? 'm' : k ? 'k' : w ? 'w' : '';
  }
  function isWork(v) { return v === 'k' || v === 'm'; }

  // State of one topic from its mentions in date order (not-mentioned games are ignored: silence is not proof of improvement).
  function stateOf(mentions) {
    var n = mentions.length;
    if (!n) return '';
    var work = mentions.filter(isWork).length, well = mentions.filter(function (v) { return v === 'w'; }).length;
    var last = mentions[n - 1], recentWork = mentions.slice(-3).filter(isWork).length;
    if (recentWork >= 2) return 'persistent';
    if (work >= 2 && mentions.slice(-2).length === 2 && mentions.slice(-2).every(function (v) { return v === 'w'; })) return 'fixed';
    if (isWork(last)) return 'watch';
    if (work >= 1 && last === 'w') return 'improving';
    if (work === 0 && well >= 2) return 'strength';
    return 'seen';
  }

  // Everything the plan screen needs. cols = how many of the latest games to show in the grid.
  function analyze(games, cols) {
    var all = sortGames(games || []), shown = all.slice(-(cols || 10));
    var rows = [];
    TOPICS.forEach(function (t) {
      var seq = all.map(function (g) { return mark(g, t.id); });
      var mentions = seq.filter(Boolean);
      if (!mentions.length) return;
      rows.push({
        id: t.id, label: t.label, group: t.group, state: stateOf(mentions),
        work: mentions.filter(isWork).length, well: mentions.filter(function (v) { return v === 'w'; }).length,
        cells: shown.map(function (g) { return mark(g, t.id); })
      });
    });
    rows.sort(function (a, b) { return STATES[a.state].order - STATES[b.state].order || b.work - a.work || b.well - a.well || (a.label < b.label ? -1 : 1); });
    // Errors come from the fielding numbers, so players do not have to remember to tag them.
    var errCells = shown.map(function (g) {
      var f = g.fld || {};
      var chances = (f.po || 0) + (f.a || 0) + (f.e || 0);
      return !chances ? '' : (f.e || 0) > 0 ? 'k' : 'w';
    });
    var errMentions = all.map(function (g) { var f = g.fld || {}; var c = (f.po || 0) + (f.a || 0) + (f.e || 0); return !c ? '' : (f.e || 0) > 0 ? 'k' : 'w'; }).filter(Boolean);
    return {
      games: shown, reviewed: all.filter(has).length, total: all.length, rows: rows,
      errors: { cells: errCells, state: stateOf(errMentions), work: errMentions.filter(isWork).length, well: errMentions.filter(function (v) { return v === 'w'; }).length, tracked: errMentions.length },
      labels: shown.map(function (g) { return g.date; })
    };
  }

  // Latest notes for a topic kind ('kn' work-on notes or 'wn' did-well notes), newest first.
  function recentNotes(games, kind, limit) {
    var out = [];
    sortGames(games || []).reverse().forEach(function (g) {
      (g.rv || []).forEach(function (e) {
        if (e[kind] && out.length < (limit || 3)) out.push({ date: g.date, opp: g.opp || '', i: e.i, text: e[kind] });
      });
    });
    return out;
  }

  function label(id) { var t = topic(id); return t ? t.label : id; }

  // Plain-text plan to paste into a message or email to a coach or trainer.
  function planText(name, games, focus) {
    var a = analyze(games, 10), L = [];
    L.push('IMPROVEMENT PLAN: ' + (name || 'Player'));
    L.push('From Dugout Diary by Plate 450 · based on ' + a.reviewed + (a.reviewed === 1 ? ' game review' : ' game reviews') + ' out of ' + a.total + (a.total === 1 ? ' game' : ' games'));
    L.push('');
    function section(title, state, fmt) {
      var rows = a.rows.filter(function (r) { return r.state === state; });
      if (!rows.length) return;
      L.push(title); rows.forEach(function (r) { L.push('- ' + fmt(r)); }); L.push('');
    }
    if (focus && focus.trim()) { L.push('NEXT-GAME FOCUS'); L.push(focus.trim()); L.push(''); }
    section('STILL NEEDS WORK', 'persistent', function (r) { return r.label + ' (flagged ' + r.work + (r.work === 1 ? ' time' : ' times') + ')'; });
    section('KEEP AN EYE ON', 'watch', function (r) { return r.label + ' (flagged in the latest review)'; });
    section('GETTING BETTER', 'improving', function (r) { return r.label + ' (was a focus, went well last time)'; });
    section('FIXED', 'fixed', function (r) { return r.label + ' (went well in the last two reviews)'; });
    section('STRENGTHS', 'strength', function (r) { return r.label + ' (went well ' + r.well + ' times)'; });
    if (a.errors.tracked) L.push('FIELDING ERRORS: errors in ' + a.errors.work + ' of ' + a.errors.tracked + ' games with fielding chances', '');
    var notes = recentNotes(games, 'kn', 3);
    if (notes.length) { L.push('RECENT NOTES: WHAT TO WORK ON'); notes.forEach(function (n) { L.push('- ' + n.date + (n.i ? ' (inning ' + n.i + ')' : '') + ': ' + n.text.replace(/\n+/g, ' ')); }); L.push(''); }
    var good = recentNotes(games, 'wn', 2);
    if (good.length) { L.push('RECENT NOTES: WHAT WENT WELL'); good.forEach(function (n) { L.push('- ' + n.date + (n.i ? ' (inning ' + n.i + ')' : '') + ': ' + n.text.replace(/\n+/g, ' ')); }); L.push(''); }
    if (!a.rows.length && !focus) L.push('No reviews yet.');
    return L.join('\n').replace(/\n+$/, '') + '\n';
  }

  return {
    GROUPS: GROUPS, TOPICS: TOPICS, STATES: STATES, MAX_ENTRIES: MAX_ENTRIES, NOTE_MAX: NOTE_MAX,
    topic: topic, label: label, clean: clean, has: has, cleanScore: cleanScore, resultOf: resultOf, scoreText: scoreText,
    mark: mark, stateOf: stateOf, analyze: analyze, recentNotes: recentNotes, planText: planText, text: text, note: note
  };
});
