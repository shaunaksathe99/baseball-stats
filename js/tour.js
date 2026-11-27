/* Plate 450 Diary - guided tour.
   Twelve short steps that spotlight the real screens. Starts once on a first visit, and any time from the "?" button,
   the Home card or About. Nothing is sent anywhere; the only thing remembered is a small flag on this device.
   The step list and timing are pure and tested in Node; the overlay needs a browser. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(null);
  else { var api = factory(root); root.Tour = api; if (root.DDApp) api.boot(root.DDApp); }
})(typeof self !== 'undefined' ? self : this, function (win) {
  'use strict';

  var TAB = function (t) { return '.tabs a[data-tab="' + t + '"]'; };
  /* need: what the screen needs before it is worth looking at: 'player' (a player card), 'games' (a logged game) or 'match' (a Match Up friend). Without it the tour shows the same real screen filled with sample data, labeled Example. */
  /* route: where the step lives. routeNo: where to go when no player exists yet. sel: first selector found is spotlighted. */
  var STEPS = [
    { title: 'Welcome to Plate 450 Diary', text: 'Your free baseball and softball stat diary. Track your games, see yourself grow, and have fun.', route: 'home', sel: ['.top .brand'] },
    { title: 'Create your player card', text: 'Make a card for each ballplayer in the family. Just a name or nickname. No birthday or sign-up needed.', route: 'home', sel: ['[data-tour="player"]'] },
    { title: 'Log stats from the dugout', text: 'Log hitting, pitching and fielding stats during the game, right from the dugout, or after it. Type a number or use the arrows.', route: 'log', need: 'games', sel: ['.steppers', TAB('log')] },
    { title: 'See your career', text: 'Every saved game adds up here. Watch your averages and totals grow.', route: 'career', need: 'games', sel: ['.tiles', TAB('career')] },
    { title: 'Share your card', text: 'Share a beautiful picture of your card with family and friends. You choose what gets shared, and when.', route: 'career', need: 'games', sel: ['[data-tour="share"]', TAB('career')] },
    { title: 'Set a goal', text: 'Pick a number to aim for. Check back to see how close you are.', route: 'goals', need: 'games', sel: ['.goal', '.badges', TAB('goals')] },
    { title: 'Match Up with a friend', text: 'Have fun with stats - share, compare, grow.', route: 'home', need: 'match', sel: ['.mu-vs', '.mu-friends', '.card.hero', '[data-tour="match"]'] },
    { title: 'Daily Fun', text: 'Test your Game IQ, answer the daily trivia and take quizzes.', route: 'home', sel: ['[data-tour="daily"]', '[data-tour="iq"]'] },
    { title: 'Learn it your way', text: 'Follow an improvement plan on your own, or find coaches and trainers near you.', route: 'home', sel: ['[data-tour="find"]'] },
    { title: 'Your stats stay with you', text: 'Stats are saved on this device only. A parent can approve an optional account to keep them on other devices.', route: 'about', sel: ['[data-tour="backup"]'] },
    { title: 'Make it yours', text: 'Add your jersey number, favorite position and team color to your card.', route: 'about', routeNo: 'home', need: 'player', sel: ['[data-tour="mine"]'] },
    { title: 'Pick your idol', text: 'Choose a favorite MLB or AUSL player for your wall, then jump to their stats.', route: 'home', need: 'player', sel: ['[data-tour="idol"]', '[data-tour="player"]'] }
  ];

  /* How long a step stays up: slow enough for young readers (about 2 words a second plus time to look). */
  function duration(i, pace) {
    var s = STEPS[i]; if (!s) return 0;
    var words = String(s.text).split(/\s+/).filter(Boolean).length;
    return Math.round(Math.max(7000, words * 450 + 2500) * (pace === 1.5 ? 1.5 : 1));
  }
  /* Match Up shows the real comparison screen: with a sample friend while it is an example, otherwise the visitor's own friends list. */
  var SAMPLE_FRIEND = 'demo1abcd';
  function routeFor(i, hasPlayer, flavor) {
    var s = STEPS[i];
    if (s.need === 'match') return flavor ? 'matchup/friend/' + SAMPLE_FRIEND : 'matchup/friends';
    return (!hasPlayer && s.routeNo) ? s.routeNo : s.route;
  }
  /* '' = show the visitor's own screen. 'full' = sample player, games and friends. 'friends' = the visitor's own diary with sample friends only. */
  function demoFlavor(need, ctx) {
    ctx = ctx || {};
    if (!need) return '';
    if (need === 'player') return ctx.hasPlayer ? '' : 'full';
    if (need === 'games') return ctx.hasPlayer && ctx.hasGames ? '' : 'full';
    if (need === 'match') return ctx.hasFriends ? '' : (ctx.hasPlayer && ctx.hasGames ? 'friends' : 'full');
    return '';
  }
  var SAMPLE_NAMES = ['Sam', 'Maya', 'Ben', 'Comets', 'Hawks', 'Sharks', 'Bears', 'Pythons', 'Spring'];
  function dayStr(d) { function z(n) { return (n < 10 ? '0' : '') + n; } return d.getFullYear() + '-' + z(d.getMonth() + 1) + '-' + z(d.getDate()); }
  /* A made-up player with a believable season. First names only: no real players, teams or leagues. */
  function sampleDb(now) {
    now = now || new Date();
    var AB = [4, 3, 4, 5, 4, 4, 3, 4, 4, 5, 4, 4], H = [2, 1, 1, 3, 2, 0, 2, 1, 3, 2, 1, 2], D = [1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1],
        T3 = [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0], HR = [0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0], RBI = [1, 0, 1, 3, 1, 0, 1, 0, 3, 1, 0, 2],
        R = [1, 0, 0, 2, 1, 0, 1, 0, 2, 1, 0, 1], BB = [0, 1, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0], K = [1, 1, 2, 1, 0, 2, 1, 1, 0, 1, 2, 1],
        SB = [0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0], OPP = ['Hawks', 'Sharks', 'Bears', 'Pythons'], games = [];
    for (var i = 0; i < 12; i++) {
      var dt = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (12 - i) * 5), us = 4 + (i % 5), them = 2 + ((i * 3) % 6), pitched = i % 3 === 1;
      games.push({
        id: 'gdemo' + (i + 1), created: dt.getTime(), date: dayStr(dt), season: 'Spring', team: 'Comets', level: 'Minors', jersey: '12', opp: OPP[i % 4], us: us, them: them, pos: 'SS',
        bat: { ab: AB[i], h: H[i], d: D[i], t: T3[i], hr: HR[i], rbi: RBI[i], r: R[i], bb: BB[i], k: K[i], hbp: 0, sf: 0, sb: SB[i] },
        pit: pitched ? { outs: 9, h: 3, r: 1, er: 1, bb: 1, k: 4, pitches: 58 } : { outs: 0, h: 0, r: 0, er: 0, bb: 0, k: 0, pitches: 0 },
        fld: { po: 2, a: 3, e: i % 5 === 4 ? 1 : 0, cs: 0, ci: 0 }
      });
    }
    return {
      v: 1, active: 'pdemo1',
      players: [{ id: 'pdemo1', name: 'Sam', jersey: '12', fav: 'SS', color: 'blue', innings: 6, last: { season: 'Spring', team: 'Comets', level: 'Minors', jersey: '12' }, games: games,
        goals: [{ id: 'gdemo-a', metric: 'h', target: 30, scope: 'career', created: now.getTime() }, { id: 'gdemo-b', metric: 'avg', target: 0.4, scope: 'career', created: now.getTime() }] }]
    };
  }
  /* Two made-up friends in the same stored shape the Match Up screen uses. */
  function sampleFriends(M, now) {
    var day = dayStr(now || new Date()), out = [];
    [['Maya', 1, [['avg', 0.333], ['obp', 0.412], ['slg', 0.5], ['ops', 0.912], ['bbpct', 0.11]]], ['Ben', 2, [['avg', 0.285], ['obp', 0.35], ['slg', 0.4], ['ops', 0.75], ['bbpct', 0.08]]]].forEach(function (d, k) {
      var inv = M && M.parseInvite(M.makeInvite({ name: d[0], period: 'Spring', frame: d[1], rid: 'demo' + (k + 1) + 'abcd', stats: d[2] }));
      if (inv) out.push({ id: inv.id, n: inv.n, p: inv.p, f: inv.f, t: day, s: inv.s });
    });
    return out;
  }
  function cleanState(v) { return v === 'started' || v === 'done' || v === 'skipped' ? v : ''; }
  function shouldAutoStart(state, hash) {
    if (cleanState(state)) return false;
    var h = String(hash || '').replace(/^#/, '');
    return h === '' || h === 'home';
  }
  function needsCard(state) { var s = cleanState(state); return s !== 'done' && s !== 'skipped'; }

  var K = 'plate450.tour', KP = 'plate450.tourpace';
  function getState() { try { return cleanState(localStorage.getItem(K)); } catch (e) { return ''; } }
  function setState(v) { try { localStorage.setItem(K, v); } catch (e) { /* ignore */ } }
  function getPace() { try { return localStorage.getItem(KP) === '1.5' ? 1.5 : 1; } catch (e) { return 1; } }
  function setPace(p) { try { localStorage.setItem(KP, p === 1.5 ? '1.5' : '1'); } catch (e) { /* ignore */ } }

  /* ---------- browser overlay ---------- */
  function boot(A) {
    var doc = document, run = { on: false, i: 0, el: 0, playing: true, done: false, pace: 1, origin: '', timer: null, last: 0, ov: null };

    function $(id) { return doc.getElementById(id); }
    function reduced() { try { return !!(win.matchMedia && win.matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (e) { return false; } }
    function hasPlayer() { return !!(A.player && A.player()); }
    function isFixed(el) {
      for (var n = el; n && n.nodeType === 1; n = n.parentElement) { var p = win.getComputedStyle(n).position; if (p === 'fixed' || p === 'sticky') return true; }
      return false;
    }
    function build() {
      var d = doc.createElement('div'); d.id = 'tour'; d.setAttribute('role', 'dialog'); d.setAttribute('aria-modal', 'true'); d.setAttribute('aria-label', 'Guided tour');
      d.className = reduced() ? 'tour-rm' : '';
      d.innerHTML = '<div class="tour-shield" id="t-shield"></div><div class="tour-hole" id="t-hole" hidden></div>' +
        '<div class="tour-card" id="t-card" data-pos="bottom">' +
        '<div class="tour-meta"><span id="t-step"></span><span id="t-next"></span></div>' +
        '<h2 id="t-title" tabindex="-1"></h2><p id="t-desc" aria-live="polite"></p>' +
        '<div class="tour-bar" aria-hidden="true"><span id="t-bar"></span></div><div class="tour-dots" id="t-dots" aria-hidden="true"></div>' +
        '<div class="tour-ctl" id="t-ctl"><button type="button" class="tour-b alt" data-t="back" aria-label="Back one step">&lsaquo; Back</button><button type="button" class="tour-b" id="t-pause" data-t="pause" aria-label="Pause tour">Pause</button><button type="button" class="tour-b" id="t-nextb" data-t="next" aria-label="Next step">Next &rsaquo;</button></div>' +
        '<div class="tour-ctl two" id="t-fin" hidden><button type="button" class="tour-b go" data-t="replay">Replay tour</button><button type="button" class="tour-b alt" data-t="close">Close</button></div>' +
        '<div class="tour-links"><button type="button" data-t="restart" id="t-restart">Restart tour</button><button type="button" data-t="skip" id="t-skip">Skip tour</button></div>' +
        '<div class="tour-pace"><span>Pace</span><button type="button" data-t="p1" id="t-p1">Normal</button><button type="button" data-t="p15" id="t-p15">Slower</button></div></div>';
      var dots = d.querySelector('#t-dots');
      STEPS.forEach(function () { dots.appendChild(doc.createElement('span')); });
      d.addEventListener('click', onClick);
      return d;
    }
    function onClick(e) {
      var b = e.target.closest && e.target.closest('[data-t]'); if (!b) return;
      var t = b.getAttribute('data-t');
      if (t === 'back') { if (!run.done) go(run.i - 1); }
      else if (t === 'next') go(run.i + 1);
      else if (t === 'pause') setPlay(!run.playing);
      else if (t === 'restart' || t === 'replay') start(true);
      else if (t === 'skip') end('skipped');
      else if (t === 'close') end('done');
      else if (t === 'p1') { run.pace = 1; setPace(1); paintPace(); paintProgress(); }
      else if (t === 'p15') { run.pace = 1.5; setPace(1.5); paintPace(); paintProgress(); }
    }
    function paintPace() { $('t-p1').className = run.pace === 1 ? 'on' : ''; $('t-p15').className = run.pace === 1.5 ? 'on' : ''; $('t-p1').setAttribute('aria-pressed', run.pace === 1); $('t-p15').setAttribute('aria-pressed', run.pace === 1.5); }
    function paintProgress() {
      if (run.done) return;
      var d = duration(run.i, run.pace);
      $('t-bar').style.width = Math.min(100, run.el / d * 100) + '%';
      $('t-next').textContent = run.playing ? 'Next step in ' + Math.max(0, Math.ceil((d - run.el) / 1000)) + ' seconds' : 'Paused';
    }
    function setPlay(on) {
      run.playing = on; var b = $('t-pause'); if (!b) return;
      b.textContent = on ? 'Pause' : 'Continue'; b.className = 'tour-b' + (on ? '' : ' go');
      b.setAttribute('aria-label', on ? 'Pause tour' : 'Continue tour'); run.last = Date.now(); paintProgress();
    }
    function pick(sels) {
      for (var k = 0; k < sels.length; k++) { var el = doc.querySelector(sels[k]); if (el && el.getBoundingClientRect().height > 0) return el; }
      return null;
    }
    function place() {
      if (!run.on || run.done) return;
      var hole = $('t-hole'), card = $('t-card'), shield = $('t-shield'); if (!hole) return;
      var el = pick(STEPS[run.i].sel), vh = win.innerHeight;
      if (!el) { hole.hidden = true; shield.className = 'tour-shield dim'; card.setAttribute('data-pos', 'bottom'); return; }
      shield.className = 'tour-shield';
      var fixed = isFixed(el), r = el.getBoundingClientRect();
      /* Fixed things (the tab bar) sit at the bottom, so the card goes on top for them; everything else gets the card at the bottom. */
      var below = fixed && (r.top + r.height / 2) > vh * 0.5;
      card.setAttribute('data-pos', below ? 'top' : 'bottom');
      if (!fixed) {
        /* Scroll so the target sits just under the sticky header and above the card, whatever the screen size or turn. */
        var hd = doc.getElementById('top'), hp = hd ? win.getComputedStyle(hd).position : '', topPad = (hp === 'sticky' || hp === 'fixed' ? hd.offsetHeight : 0) + 8;
        var cardH = card.getBoundingClientRect().height, room = vh - cardH - topPad - 14;
        var extra = r.height < room ? Math.round((room - r.height) / 3) : 0;
        win.scrollTo(0, Math.max(0, r.top + win.pageYOffset - topPad - extra)); r = el.getBoundingClientRect();
      }
      var pad = 6, top = Math.max(2, r.top - pad), left = Math.max(2, r.left - pad);
      hole.hidden = false;
      hole.style.top = top + 'px'; hole.style.left = left + 'px';
      hole.style.width = Math.max(0, Math.min(win.innerWidth - left - 2, r.width + pad * 2)) + 'px'; hole.style.height = Math.max(0, Math.min(vh - top - 2, r.height + pad * 2)) + 'px';
    }
    function show() {
      var s = STEPS[run.i];
      var st = $('t-step'); st.textContent = 'Step ' + (run.i + 1) + ' of ' + STEPS.length;
      if (run.fl) { var ex = doc.createElement('span'); ex.className = 'tour-ex'; ex.textContent = 'Example'; st.appendChild(doc.createTextNode(' ')); st.appendChild(ex); }
      $('t-title').textContent = s.title; $('t-desc').textContent = s.text;
      var dots = $('t-dots').children;
      for (var k = 0; k < dots.length; k++) dots[k].className = k < run.i ? 'seen' : k === run.i ? 'now' : '';
      $('t-nextb').innerHTML = run.i === STEPS.length - 1 ? 'Finish &rsaquo;' : 'Next &rsaquo;';
      $('t-nextb').setAttribute('aria-label', run.i === STEPS.length - 1 ? 'Finish the tour' : 'Next step');
      $('t-ctl').querySelector('[data-t="back"]').style.opacity = run.i === 0 ? '.5' : '1';
      run.el = 0; run.last = Date.now(); paintProgress();
    }
    /* Pick the real screen or the same screen with sample data. Sample data is never saved; see DDApp.demo in app.js. */
    function applyDemo(i) {
      var fl = '';
      try {
        A.demo.off();
        var p = A.player(), hf = false;
        try { var f = JSON.parse(localStorage.getItem('plate450.friends')); hf = Array.isArray(f) && f.length > 0; } catch (e0) { hf = false; }
        fl = demoFlavor(STEPS[i].need, { hasPlayer: !!p, hasGames: !!(p && p.games && p.games.length), hasFriends: hf });
        if (fl) { var seed = {}; seed['plate450.friends'] = JSON.stringify(sampleFriends(win.MatchCore)); A.demo.on(fl === 'full' ? sampleDb() : null, seed); }
      } catch (e) { try { A.demo.off(); } catch (e2) { /* ignore */ } fl = ''; }
      run.fl = fl; return fl;
    }
    function go(n) {
      if (n >= STEPS.length) { finishScreen(); return; }
      if (n < 0) n = 0;
      run.i = n; applyDemo(n); show();
      var want = routeFor(n, hasPlayer(), run.fl), cur = (location.hash || '#home').replace(/^#/, '') || 'home';
      if (cur !== want) location.hash = want; else A.render();
      /* Give the screen a moment to draw, then spotlight. Twice, because images and fonts can nudge the layout. */
      setTimeout(place, 80); setTimeout(place, 350);
    }
    function finishScreen() {
      run.done = true; setState('done');
      try { A.demo.off(); A.render(); } catch (e) { /* ignore */ }
      var hole = $('t-hole'); hole.hidden = true; $('t-shield').className = 'tour-shield dim';
      $('t-step').textContent = 'All ' + STEPS.length + ' steps seen'; $('t-next').textContent = '';
      $('t-title').textContent = 'Tour complete'; $('t-desc').textContent = 'Tap the ? at the top any time to see it again.';
      $('t-bar').style.width = '100%'; $('t-ctl').hidden = true; $('t-fin').hidden = false; $('t-skip').hidden = true; $('t-restart').hidden = true;
      $('t-card').setAttribute('data-pos', 'bottom');
      var b = $('t-fin').querySelector('button'); if (b) b.focus();
    }
    function tick() {
      if (!run.on || run.done || !run.playing) { run.last = Date.now(); return; }
      var now = Date.now(), dt = Math.min(250, Math.max(0, now - run.last)); run.last = now;
      run.el += dt;
      if (run.el >= duration(run.i, run.pace)) go(run.i + 1); else paintProgress();
    }
    function onKey(e) {
      if (!run.on) return;
      if (e.key === 'Escape') { e.preventDefault(); end('skipped'); }
      else if (e.key === 'ArrowRight' && !run.done) go(run.i + 1);
      else if (e.key === 'ArrowLeft' && !run.done) go(run.i - 1);
    }
    function onHide() { if (run.on && !run.done && doc.hidden && run.playing) setPlay(false); }
    function onResize() { if (run.on) { place(); setTimeout(place, 250); } }

    function start(again) {
      if (!again && run.on) return;
      var wasOn = run.on;
      if (!wasOn) {
        run.origin = (location.hash || '#home');
        if (A.closeShare) { try { A.closeModal(); } catch (e) { /* ignore */ } }
        run.ov = build(); doc.body.appendChild(run.ov);
        doc.documentElement.classList.add('tour-lock');
        doc.addEventListener('keydown', onKey); doc.addEventListener('visibilitychange', onHide); win.addEventListener('resize', onResize); win.addEventListener('orientationchange', onResize);
        run.timer = setInterval(tick, 100); run.on = true;
      }
      run.pace = getPace(); run.done = false; paintPace();
      $('t-ctl').hidden = false; $('t-fin').hidden = true; $('t-skip').hidden = false; $('t-restart').hidden = false;
      if (getState() !== 'done') setState('started');
      setPlay(true); go(0);
      var pb = $('t-pause'); if (pb) pb.focus();
    }
    function end(how) {
      if (!run.on) return;
      if (how === 'skipped' && getState() !== 'done') setState('skipped');
      try { A.demo.off(); } catch (e0) { /* ignore */ }
      clearInterval(run.timer); run.timer = null; run.on = false;
      doc.removeEventListener('keydown', onKey); doc.removeEventListener('visibilitychange', onHide); win.removeEventListener('resize', onResize); win.removeEventListener('orientationchange', onResize);
      doc.documentElement.classList.remove('tour-lock');
      if (run.ov && run.ov.parentNode) run.ov.parentNode.removeChild(run.ov); run.ov = null;
      var o = run.origin.replace(/^#/, '') || 'home';
      if ((location.hash || '#home').replace(/^#/, '') !== o) location.hash = o; else A.render();
      win.scrollTo(0, 0);
      var tb = $('tourbtn'); if (tb) tb.focus();
    }

    A.ext.actions['tour-start'] = function () { start(false); };
    if (needsCard(getState())) A.render();
    api.start = function () { start(false); };
    api.active = function () { return run.on; };

    /* First visit: start once. Not on shared card or invite links, and never again after it has been seen. */
    win.addEventListener('load', function () {
      setTimeout(function () { if (shouldAutoStart(getState(), location.hash)) start(false); }, 900);
    });
  }

  var api = { STEPS: STEPS, demoFlavor: demoFlavor, sampleDb: sampleDb, sampleFriends: sampleFriends, SAMPLE_NAMES: SAMPLE_NAMES, duration: duration, routeFor: routeFor, cleanState: cleanState, shouldAutoStart: shouldAutoStart, needsCard: needsCard, getState: getState, boot: boot, start: function () {}, active: function () { return false; } };
  return api;
});
