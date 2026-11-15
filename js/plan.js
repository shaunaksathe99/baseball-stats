/* Dugout Diary - Improvement Plan: shows which habits and errors keep coming up in game reviews and which are fixed.
   Registers the #plan view with the app through window.DDApp. The logic lives in review.js. */
(function () {
  'use strict';
  var A = window.DDApp, Rv = window.Review;
  if (!A || !Rv) return;
  var esc = A.esc;
  var MARK = { k: ['✗', 'work on'], w: ['✓', 'went well'], m: ['±', 'both'], '': ['·', 'not mentioned'] };

  function shortDate(iso) { var m = /^\d{4}-(\d{2})-(\d{2})$/.exec(iso || ''); return m ? Number(m[1]) + '/' + Number(m[2]) : ''; }
  function cell(v, what, date) { var m = MARK[v] || MARK['']; return '<td class="hc ' + (v ? 'h-' + v : 'h-n') + '"><span aria-hidden="true">' + m[0] + '</span><span class="sr">' + esc(what + ', ' + shortDate(date) + ': ' + m[1]) + '</span></td>'; }
  function stateChip(s) { return s ? '<span class="stchip st-' + s + '">' + esc(Rv.STATES[s].label) + '</span>' : ''; }

  function grid(a) {
    var head = '<tr><th scope="col" class="hl">Habit</th>' + a.games.map(function (g) { return '<th scope="col" class="hd">' + esc(shortDate(g.date)) + '</th>'; }).join('') + '</tr>';
    var rows = '';
    if (a.errors.tracked) rows += '<tr><th scope="row" class="hl">Fielding errors <span class="muted small">(from your stats)</span><br>' + stateChip(a.errors.state) + '</th>' + a.errors.cells.map(function (v, k) { return cell(v, 'Fielding errors', a.games[k].date); }).join('') + '</tr>';
    a.rows.forEach(function (r) {
      rows += '<tr><th scope="row" class="hl">' + esc(r.label) + '<br>' + stateChip(r.state) + '</th>' + r.cells.map(function (v, k) { return cell(v, r.label, a.games[k].date); }).join('') + '</tr>';
    });
    return '<div class="hwrap"><table class="hab"><caption class="sr">Habit tracker: latest ' + a.games.length + ' games. ✗ means work on, ✓ means went well.</caption><thead>' + head + '</thead><tbody>' + rows + '</tbody></table></div>' +
      '<p class="hint"><b>✗</b> work on &nbsp; <b>✓</b> went well &nbsp; <b>±</b> both in one game &nbsp; <b>·</b> not mentioned. A habit shows as <b>Fixed</b> after it went well in your last two reviews.</p>';
  }

  // Per game: how many different topics were flagged "work on" and how many "went well".
  function counts(g) {
    var w = {}, k = {};
    (g.rv || []).forEach(function (e) { e.well.forEach(function (id) { w[id] = 1; }); e.work.forEach(function (id) { k[id] = 1; }); });
    return { well: Object.keys(w).length, work: Object.keys(k).length };
  }
  function chart(a) {
    var gs = a.games.filter(Rv.has);
    if (gs.length < 2) return '<p class="muted">Review 2 or more games to see your trend.</p>';
    var W = 320, H = 150, pl = 30, pr = 10, pt = 12, pb = 24, pts = gs.map(counts);
    var max = Math.max(3, Math.max.apply(null, pts.map(function (c) { return Math.max(c.well, c.work); })));
    var x = function (i) { return pl + (W - pl - pr) * (i / (gs.length - 1)); };
    var y = function (v) { return pt + (H - pt - pb) * (1 - v / max); };
    function line(key, cls) { return '<path class="line ' + cls + '" d="' + pts.map(function (c, i) { return (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(c[key]).toFixed(1); }).join(' ') + '"/>' + pts.map(function (c, i) { return '<circle class="dot ' + cls + '" cx="' + x(i).toFixed(1) + '" cy="' + y(c[key]).toFixed(1) + '" r="3"/>'; }).join(''); }
    var last = pts[pts.length - 1], first = pts[0];
    var label = 'Topics flagged per reviewed game. To work on: ' + first.work + ' then ' + last.work + '. Went well: ' + first.well + ' then ' + last.well + '.';
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(label) + '">' +
      '<line class="grid" x1="' + pl + '" x2="' + (W - pr) + '" y1="' + y(0).toFixed(1) + '" y2="' + y(0).toFixed(1) + '"/><line class="grid" x1="' + pl + '" x2="' + (W - pr) + '" y1="' + y(max).toFixed(1) + '" y2="' + y(max).toFixed(1) + '"/>' +
      '<text x="' + (pl - 5) + '" y="' + (y(max) + 3).toFixed(1) + '" text-anchor="end">' + max + '</text><text x="' + (pl - 5) + '" y="' + (y(0) + 3).toFixed(1) + '" text-anchor="end">0</text>' +
      line('work', 'rv-work') + line('well', 'rv-well') +
      '<text x="' + pl + '" y="' + (H - 6) + '">' + esc(shortDate(gs[0].date)) + '</text><text x="' + (W - pr) + '" y="' + (H - 6) + '" text-anchor="end">' + esc(shortDate(gs[gs.length - 1].date)) + '</text></svg>' +
      '<p class="hint"><span class="key rv-work"></span> topics to work on &nbsp; <span class="key rv-well"></span> topics that went well. Fewer red dots over time means you are fixing habits.</p>';
  }

  function view(p) {
    if (!p) return A.emptyState('📝', 'Pick a player first', 'Your improvement plan is built from your game reviews.', '<a class="btn" href="#home">Go to Home</a>');
    var a = Rv.analyze(p.games, 10);
    var back = '<a class="link small noprint" href="#career">&larr; Career</a>';
    var head = '<section class="card hero"><p class="eyebrow">' + esc(p.name) + '</p><h2>My improvement plan</h2><p class="muted">Habits from your game reviews. Share it with your coach or trainer so you can work on the right things together.</p></section>';
    if (!a.reviewed && !a.errors.tracked) {
      return back + head + A.emptyState('📝', 'No reviews yet', 'When you log a game, open the Review tab and note what went well and what to work on. Your plan builds itself from those notes.', '<a class="btn" href="#log">Log a game</a>') + A.footer();
    }
    var txt = Rv.planText(p.name, p.games, p.plan);
    var summary = '<p class="muted small">Based on <b>' + a.reviewed + '</b> game ' + (a.reviewed === 1 ? 'review' : 'reviews') + ' out of ' + a.total + (a.total === 1 ? ' game' : ' games') + '.</p>';
    var focus = '<section class="card"><h3>My focus for the next game</h3><label class="sr" for="plan-focus">Focus for the next game</label><textarea id="plan-focus" rows="3" maxlength="' + Rv.NOTE_MAX + '" data-plan="1" placeholder="Pick one or two things, like: keep my front shoulder in, and take a breath before every throw.">' + esc(p.plan || '') + '</textarea></section>';
    var tracker = '<section class="card"><h3>Habit tracker</h3>' + summary + (a.rows.length || a.errors.tracked ? grid(a) : '<p class="muted">Tap topics in your reviews to start tracking habits.</p>') + '</section>';
    var trend = '<section class="card"><h3>Trend</h3><div class="chart-wrap">' + chart(a) + '</div></section>';
    var share = '<section class="card noprint"><h3>Share with my coach</h3><div class="row wrap"><button class="btn grow" data-action="plan-copy">Copy plan</button><button class="btn ghost" data-action="plan-share">Share</button><button class="btn ghost" data-action="plan-print">Print</button></div>' +
      '<details style="margin-top:10px"><summary>Preview the text</summary><textarea id="plan-text" class="copybox" readonly rows="10">' + esc(txt) + '</textarea></details><p class="hint">Only what you choose to copy or share leaves this device.</p></section>';
    return back + head + focus + tracker + trend + share + A.footer();
  }

  A.ext.views.plan = function (p) { return view(p); };
  A.ext.actions['plan-copy'] = function (el) {
    var ta = document.getElementById('plan-text'); if (!ta) return;
    function done() { el.textContent = 'Copied!'; setTimeout(function () { el.textContent = 'Copy plan'; }, 1800); }
    function fallback() { var d = ta.closest('details'); if (d) d.open = true; ta.focus(); ta.select(); try { if (document.execCommand('copy')) { done(); return; } } catch (e) {} el.textContent = 'Select and copy it'; }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(ta.value).then(done, fallback); else fallback();
  };
  A.ext.actions['plan-share'] = function (el) {
    var ta = document.getElementById('plan-text'); if (!ta) return;
    if (navigator.share) navigator.share({ title: 'Improvement plan', text: ta.value }).catch(function () {});
    else A.ext.actions['plan-copy'](el.parentNode.querySelector('[data-action=plan-copy]'));
  };
  A.ext.actions['plan-print'] = function () { window.print(); };
  document.addEventListener('input', function (e) {
    var t = e.target; if (!t || !t.dataset || !t.dataset.plan) return;
    var p = A.player(); if (!p) return;
    p.plan = Rv.note(t.value); A.save();
    var ta = document.getElementById('plan-text'); if (ta) ta.value = Rv.planText(p.name, p.games, p.plan);
  });
})();
