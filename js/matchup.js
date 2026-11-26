/* Plate 450 Diary - Match Up: Level Up (me vs. me) and Invite a Friend.
   Everything is computed on this device. Invites are links and images the player chooses to share; nothing is uploaded and nobody is tracked. */
(function () {
  'use strict';
  var A = window.DDApp, M = window.MatchCore, QR = window.QR, S = window.Stats;
  if (!A || !M) return;
  var esc = A.esc, X = A.ext.actions;
  var FKEY = 'plate450.friends', RKEY = 'plate450.matchid';
  var ms = { la: '', lb: '', b: null, note: '', msg: '' };

  /* ---------- device storage (friends and the player's own invite id) ---------- */
  function readJson(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function writeJson(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }
  function friends() { return M.cleanFriends(readJson(FKEY, [])); }
  function saveFriends(list) {
    writeJson(FKEY, list.map(function (f) { return { id: f.id, n: f.n, p: f.p, f: f.f, t: f.t || '', s: f.s }; }));
  }
  // One hidden id per player, so a newer invite from the same player replaces the older one in a friend's list.
  function myRid(pid) {
    var m = readJson(RKEY, {});
    if (!m || typeof m !== 'object') m = {};
    if (!/^[a-z0-9]{6,12}$/.test(m[pid] || '')) { m[pid] = M.makeInvite({ stats: [] })[4]; writeJson(RKEY, m); }
    return m[pid];
  }
  function today() { var d = new Date(); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }

  /* ---------- small view helpers ---------- */
  function back(to, label) { return '<a class="link back" href="#' + to + '">&larr; ' + esc(label) + '</a>'; }
  function opts(list, cur) { return list.map(function (o) { return '<option value="' + esc(o.id) + '"' + (o.id === cur ? ' selected' : '') + '>' + esc(o.label) + '</option>'; }).join(''); }
  function needPlayer() {
    return '<section class="card empty"><div class="big" aria-hidden="true">⚾</div><h3>Start your diary first</h3><p>Match Up compares your own numbers, so log a few games first.</p><a class="btn" href="#home">Go to my diary</a></section>';
  }
  function hasGames(p) { return !!(p && p.games && p.games.length); }

  /* ---------- hub ---------- */
  function hub(p) {
    var n = friends().length;
    return '<section class="card hero"><p class="eyebrow">Match Up</p><h2>Level up. Or invite a friend.</h2>' +
      '<p class="muted">See how much you have grown, or send a friend a few of your numbers and see how you stack up. Everything stays on your device.</p></section>' +
      door('level', '📈', 'Level Up', 'Me vs. me. Compare any two stretches of your own season or career.') +
      door('invite', '✉️', 'Invite a Friend', 'Pick 3 to 5 stats and send a link, image or QR code.') +
      door('friends', '👥', 'My friends', n ? n + ' of ' + M.MAX_FRIENDS + ' saved on this device' : 'Friends you save show up here for easy comparing.') +
      A.footer();
  }
  function door(to, icon, title, text) {
    return '<a class="card door" href="#matchup/' + to + '"><span class="door-ico" aria-hidden="true">' + icon + '</span><span class="door-txt"><b>' + esc(title) + '</b><span class="muted small">' + esc(text) + '</span></span><span class="door-go" aria-hidden="true">&rsaquo;</span></a>';
  }

  /* ---------- Level Up ---------- */
  function arrow(r) {
    if (r.arrow === 'same') return '<span class="mu-arrow same" aria-label="No change">&ndash;</span>';
    return '<span class="mu-arrow ' + (r.improved ? 'good' : 'flat') + '" aria-label="' + (r.arrow === 'up' ? 'Up' : 'Down') + '">' + (r.arrow === 'up' ? '&#9650;' : '&#9660;') + '</span>';
  }
  function levelView(p) {
    if (!hasGames(p)) return back('matchup', 'Match Up') + needPlayer();
    var list = M.periods(p), ids = list.map(function (x) { return x.id; });
    if (ids.indexOf(ms.la) < 0 || ids.indexOf(ms.lb) < 0) { var d = M.defaultPair(p); ms.la = d[0]; ms.lb = d[1]; }
    var r = M.levelUp(p, ms.la, ms.lb), la = M.label(p, ms.la), lb = M.label(p, ms.lb);
    var html = back('matchup', 'Match Up') + '<section class="card"><h3>Level Up</h3><p class="muted small">Compare any two stretches of your own games. Pick a starting point and a later one.</p>' +
      '<div class="grid2"><div class="field"><label for="mu-la">From</label><select id="mu-la" data-m="la">' + opts(list, ms.la) + '</select></div>' +
      '<div class="field"><label for="mu-lb">To</label><select id="mu-lb" data-m="lb">' + opts(list, ms.lb) + '</select></div></div></section>';
    if (ms.la === ms.lb) return html + '<section class="card"><p class="muted">Pick two different stretches to see how you have grown.</p></section>';
    if (r.best.length) {
      html += '<section class="card lvl-best"><p class="eyebrow">Your growth</p>' + r.best.map(function (x) { return '<p class="lvl-line">' + esc(x.line) + '</p>'; }).join('') + '<p class="muted small">' + esc(la) + ' &rarr; ' + esc(lb) + '</p></section>';
    }
    if (r.rows.length) {
      html += '<section class="card"><table class="mu-table"><caption class="sr">Stats from ' + esc(la) + ' to ' + esc(lb) + '</caption><thead><tr><th></th><th>' + esc(la) + '</th><th>' + esc(lb) + '</th></tr></thead><tbody>' +
        r.rows.map(function (x) {
          return '<tr><th scope="row">' + esc(x.label) + '</th><td>' + esc(x.fa) + '</td><td class="mu-now">' + arrow(x) + ' <b>' + esc(x.fb) + '</b></td></tr>' +
            (x.line ? '<tr class="mu-note"><td colspan="3">' + esc(x.line) + '</td></tr>' : '');
        }).join('') + '</tbody></table></section>';
    } else {
      html += '<section class="card"><p class="muted">Not enough games in both stretches yet to compare fairly. Keep logging and check back.</p></section>';
    }
    if (r.hidden.length) {
      html += '<p class="muted small mu-hid">Hidden until both stretches have enough games: ' + esc(r.hidden.map(function (h) { return h.label + ' (' + h.need + ' ' + h.unit + ')'; }).join(', ')) + '.</p>';
    }
    return html + A.footer();
  }

  /* ---------- Invite a Friend (builder) ---------- */
  function builder(p) {
    if (!hasGames(p)) return back('matchup', 'Match Up') + needPlayer();
    var list = M.periods(p), b = ms.b;
    if (!b) b = ms.b = { period: 'all', picked: null, frame: 0, show: true };
    if (!list.some(function (x) { return x.id === b.period; })) b.period = 'all';
    var games = M.pool(p, b.period);
    var av = M.STATS.map(function (st) { return { st: st, r: M.compute(st.id, games, p.innings) }; });
    var okIds = av.filter(function (x) { return x.r.ok; }).map(function (x) { return x.st.id; });
    if (!b.picked) b.picked = okIds.slice(0, 3);
    b.picked = b.picked.filter(function (id) { return okIds.indexOf(id) >= 0; }).slice(0, M.MAX_STATS);
    var need = Math.min(3, okIds.length), ready = b.picked.length >= Math.max(1, need);
    var html = back('matchup', 'Match Up') + '<section class="card"><h3>Invite a Friend</h3><p class="muted small">Choose a stretch of games and 3 to 5 stats. You see exactly what gets shared before you send it.</p>' +
      '<div class="field"><label for="mu-period">Which games</label><select id="mu-period" data-m="period">' + opts(list, b.period) + '</select></div>' +
      '<fieldset class="mu-stats"><legend>Stats to share <span class="muted small">(' + b.picked.length + ' of ' + M.MAX_STATS + ')</span></legend>' +
      av.map(function (x) {
        var on = b.picked.indexOf(x.st.id) >= 0, dis = !x.r.ok || (!on && b.picked.length >= M.MAX_STATS);
        return '<label class="check mu-pick"><input type="checkbox" data-m="stat" value="' + x.st.id + '"' + (on ? ' checked' : '') + (dis ? ' disabled' : '') + '> <b>' + esc(x.st.label) + '</b> <span class="muted small">' + (x.r.ok ? esc(M.fmt(x.st, x.r.v)) : 'needs ' + x.st.min + ' ' + esc(x.st.unit)) + '</span></label>';
      }).join('') + '</fieldset>' +
      '<div class="field"><label for="mu-frame">Message</label><select id="mu-frame" data-m="frame">' + M.FRAMES.map(function (f, i) { return '<option value="' + i + '"' + (i === b.frame ? ' selected' : '') + '>' + esc(f) + '</option>'; }).join('') + '</select></div>' +
      '<label class="check"><input type="checkbox" data-m="show"' + (b.show ? ' checked' : '') + '> Show my name</label></section>';
    if (!ready) return html + '<section class="card"><p class="muted">Pick at least ' + Math.max(1, need) + ' stat' + (need === 1 ? '' : 's') + ' to build your invite.</p></section>' + A.footer();
    var o = buildInvite(p);
    html += '<section class="card"><h3>What your friend will see</h3><p class="mu-prev"><b>' + esc(M.displayName(o.inv)) + '</b><br><span class="muted">' + esc(M.FRAMES[o.inv.f]) + '</span><br><span class="muted small">' + esc(o.inv.p) + '</span></p>' +
      '<div class="stats mu-prevstats">' + o.inv.s.map(function (x) { var st = M.stat(x.id); return '<div class="stat"><b>' + esc(M.fmt(st, x.v)) + '</b><span>' + esc(st.label) + '</span></div>'; }).join('') + '</div>' +
      '<p class="hint">Only the name (if shown), the stretch of games and these numbers are shared. No Player ID, city or team.</p>' +
      '<canvas id="mu-canvas" class="share-canvas" aria-label="Preview of your invite image"></canvas>' +
      '<textarea id="mu-msg" class="mu-msg" readonly rows="3" aria-label="Message to send">' + esc(o.msg) + '</textarea>' +
      '<div class="share-actions mu-actions"><button class="btn" data-action="m-share-image">Share image</button><button class="btn ghost" data-action="m-copy">Copy message</button>' + (o.qr ? '<button class="btn ghost" data-action="m-qr">Show QR code</button>' : '') + '</div></section>' + A.footer();
    return html;
  }
  function buildInvite(p) {
    var b = ms.b, games = M.pool(p, b.period);
    var arr = M.makeInvite({ name: p.name, show: b.show, period: M.label(p, b.period), frame: b.frame, rid: myRid(p.id), stats: b.picked.map(function (id) { return [id, M.compute(id, games, p.innings).v]; }) });
    var url = A.shareBase() + '#invite=' + M.encodeInvite(arr), inv = M.parseInvite(arr);
    return { inv: inv, url: url, msg: M.inviteMessage(inv, url), qr: !!(QR && QR.matrix(url)) };
  }

  /* ---------- the invite image ---------- */
  function drawInvite(cv, inv, p) {
    var col = A.colors[p && p.color] || A.colors.gold, ACC = col.acc, W = 1080, H = 1080;
    var slab = 'Rockwell, "Roboto Slab", Georgia, "Times New Roman", serif', sans = 'system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif';
    function paint() {
      cv.width = W; cv.height = H;
      var x = cv.getContext('2d'), g = x.createLinearGradient(0, 0, W, H); g.addColorStop(0, col.b1); g.addColorStop(1, col.b2);
      x.fillStyle = g; x.fillRect(0, 0, W, H);
      x.lineWidth = 14; x.strokeStyle = ACC; rr(x, 36, 36, W - 72, H - 72, 52); x.stroke();
      x.textAlign = 'center'; x.textBaseline = 'alphabetic';
      function fit(txt, mk, maxW, size, min) { do { x.font = mk(size); size -= 2; } while (x.measureText(txt).width > maxW && size > min); }
      x.fillStyle = ACC; fit('MATCH UP', function (n) { return '800 ' + n + 'px ' + sans; }, W - 200, 44, 26); x.fillText('MATCH UP', W / 2, 128);
      x.fillStyle = '#F5EFE0'; var q = M.FRAMES[inv.f]; fit(q, function (n) { return n + 'px ' + slab; }, W - 160, 76, 36); x.fillText(q, W / 2, 232);
      var nm = M.displayName(inv); x.fillStyle = ACC; fit(nm, function (n) { return n + 'px ' + slab; }, W - 160, 96, 40); x.fillText(nm, W / 2, 352);
      x.fillStyle = '#ADA99E'; fit(inv.p, function (n) { return '600 ' + n + 'px ' + sans; }, W - 160, 42, 24); x.fillText(inv.p, W / 2, 412);
      var n = inv.s.length, cols = n <= 3 ? n : (n === 4 ? 2 : 3), rows = Math.ceil(n / cols), bw = cols === 1 ? 460 : cols === 2 ? 400 : 290, bh = 210, gap = 28, top = 470 + (rows === 1 ? 50 : 0);
      inv.s.forEach(function (s, i) {
        var r = Math.floor(i / cols), c = i % cols, inRow = Math.min(cols, n - r * cols), left = (W - (bw * inRow + gap * (inRow - 1))) / 2, bx = left + c * (bw + gap), by = top + r * (bh + gap), st = M.stat(s.id);
        x.fillStyle = 'rgba(0,0,0,0.3)'; rr(x, bx, by, bw, bh, 28); x.fill(); x.strokeStyle = 'rgba(245,239,224,0.16)'; x.lineWidth = 3; x.stroke();
        x.fillStyle = ACC; x.font = '104px ' + slab; x.fillText(M.fmt(st, s.v), bx + bw / 2, by + 124);
        x.fillStyle = '#C9C5B8'; x.font = '700 38px ' + sans; x.fillText(st.label, bx + bw / 2, by + 178);
      });
      var fy = H - 96; x.fillStyle = '#F5EFE0'; x.font = '700 40px ' + sans; x.fillText('Plate 450 Diary', W / 2 + 40, fy);
      x.fillStyle = '#ADA99E'; x.font = '600 26px ' + sans; x.fillText('diary.plate450.com  ·  Free player cards', W / 2 + 40, fy + 40);
      if (window.Brand) window.Brand.mark(x, W / 2 - 250, fy + 10, 78);
    }
    function rr(x, a, b, w, h, r) { x.beginPath(); x.moveTo(a + r, b); x.arcTo(a + w, b, a + w, b + h, r); x.arcTo(a + w, b + h, a, b + h, r); x.arcTo(a, b + h, a, b, r); x.arcTo(a, b, a + w, b, r); x.closePath(); }
    paint();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(paint);
  }

  /* ---------- opening an invite / comparing with a saved friend ---------- */
  function compareView(inv, p, saved) {
    var who = M.displayName(inv), mine = hasGames(p);
    var head = '<section class="card hero"><p class="eyebrow">Match Up</p><h2>' + esc(who) + (saved ? '' : ' sent you a challenge') + '</h2><p class="muted">' + esc(M.FRAMES[inv.f]) + '</p><p class="muted small">' + esc(inv.p) + '</p></section>';
    if (!mine) {
      return head + '<section class="card"><div class="stats mu-prevstats">' + inv.s.map(function (x) { var st = M.stat(x.id); return '<div class="stat"><b>' + esc(M.fmt(st, x.v)) + '</b><span>' + esc(st.label) + '</span></div>'; }).join('') + '</div>' +
        '<p class="muted">Start a free diary to see how your own numbers compare. No sign-up, email or birthday needed.</p><a class="btn block" href="#home">Start my diary &rarr;</a></section>' + saveBlock(inv, saved) + A.footer();
    }
    var list = M.periods(p);
    if (!ms.cp || !list.some(function (x) { return x.id === ms.cp; })) ms.cp = 'all';
    var games = M.pool(p, ms.cp), rows = M.compare(inv, function (id) { return M.compute(id, games, p.innings); });
    var html = head + '<section class="card"><div class="field"><label for="mu-cp">Compare against my</label><select id="mu-cp" data-m="cp">' + opts(list, ms.cp) + '</select></div>' +
      '<table class="mu-table mu-vs"><caption class="sr">' + esc(who) + ' compared with you</caption><thead><tr><th></th><th>' + esc(who) + '</th><th>You</th></tr></thead><tbody>' +
      rows.map(function (r) {
        return '<tr><th scope="row">' + esc(r.label) + '</th><td class="' + (r.lead === 'them' ? 'mu-lead' : '') + '"><b>' + esc(r.theirs) + '</b></td><td class="' + (r.lead === 'me' ? 'mu-lead' : '') + '"><b>' + esc(r.mine) + '</b></td></tr>' +
          (r.gap ? '<tr class="mu-note"><td colspan="3">' + esc(r.gap) + '</td></tr>' : '');
      }).join('') + '</tbody></table>' +
      (rows.some(function (r) { return r.mine === '—'; }) ? '<p class="muted small">A dash means you need a few more games for a fair number.</p>' : '') + '</section>';
    var bh = rows.filter(function (r) { return r.behind; })[0];
    if (bh) {
      var gl = M.levelUp(p, 'first', 'all').rows.filter(function (r) { return r.id === bh.id && r.improved; })[0];
      html += '<section class="card"><p class="mu-grow">' + (gl ? esc(gl.line + ' since your first month. ') : '') + 'Compare me with me to see your growth.</p><a class="btn ghost block" href="#matchup/level">Level Up</a></section>';
    }
    html += '<section class="card"><button class="btn block" data-action="m-reply">Send my numbers back</button><p class="muted small">You choose which stats to share.</p></section>';
    return html + saveBlock(inv, saved) + A.footer();
  }
  function saveBlock(inv, saved) {
    var note = ms.note ? '<p class="notice" role="status">' + esc(ms.note) + '</p>' : '';
    ms.note = '';
    if (saved) return '<section class="card"><button class="btn ghost block" data-action="m-remove" data-id="' + esc(inv.id) + '">Remove from my friends</button></section>';
    var has = friends().some(function (f) { return f.id === inv.id; });
    return note + '<section class="card"><button class="btn ghost block" data-action="m-save">' + (has ? 'Update my saved friend' : 'Save to my friends') + '</button><p class="muted small">Saved on this device only. You can keep ' + M.MAX_FRIENDS + '.</p></section>';
  }
  function openInvite(p) {
    var inv = M.parseInvite(decodeURIComponent((location.hash || '').slice(8)));
    if (!inv) return '<section class="card empty"><div class="big" aria-hidden="true">🤔</div><h3>That invite link looks broken</h3><p>Ask your friend to send it again.</p><a class="btn" href="#matchup">Open Match Up</a></section>';
    ms.open = inv;
    return compareView(inv, p, false);
  }

  /* ---------- my friends ---------- */
  function friendsView(p) {
    var list = friends();
    var html = back('matchup', 'Match Up') + '<section class="card"><h3>My friends</h3><p class="muted small">' + list.length + ' of ' + M.MAX_FRIENDS + ' saved. Kept on this device only.</p></section>';
    if (ms.note) { html += '<p class="notice" role="status">' + esc(ms.note) + '</p>'; ms.note = ''; }
    if (!list.length) return html + '<section class="card"><p class="muted">No friends saved yet. When a friend sends you an invite link, open it and choose Save to my friends.</p><a class="btn ghost" href="#matchup/invite">Send an invite</a></section>' + A.footer();
    html += '<section class="card"><ul class="mu-friends">' + list.map(function (f) {
      return '<li><div class="mu-fn"><b>' + esc(M.displayName(f)) + '</b><span class="muted small">' + esc(f.p) + '</span></div><a class="btn small" href="#matchup/friend/' + encodeURIComponent(f.id) + '">Compare</a></li>';
    }).join('') + '</ul></section>';
    return html + A.footer();
  }
  function friendView(p, id) {
    var f = friends().filter(function (x) { return x.id === id; })[0];
    if (!f) return back('matchup/friends', 'My friends') + '<section class="card"><p class="muted">That friend is not saved on this device.</p></section>';
    ms.open = f;
    return back('matchup/friends', 'My friends') + compareView(f, p, true);
  }

  /* ---------- routing ---------- */
  A.ext.views.matchup = function (p, sub) {
    ms.msg = '';
    if ((location.hash || '').indexOf('#invite=') === 0) return openInvite(p);
    var s = sub[0] || '';
    if (s === 'level') return levelView(p);
    if (s === 'invite') return builder(p);
    if (s === 'friends') return friendsView(p);
    if (s === 'friend') return friendView(p, sub[1] || '');
    return hub(p);
  };
  A.ext.onRender = function (tab) {
    if (tab !== 'matchup') return;
    var cv = document.getElementById('mu-canvas'), p = A.player();
    if (cv && p && ms.b && hasGames(p)) { try { var o = buildInvite(p); drawInvite(cv, o.inv, p); } catch (e) {} }
  };

  /* ---------- actions ---------- */
  document.addEventListener('change', function (e) {
    var t = e.target, k = t.dataset && t.dataset.m, p = A.player();
    if (!k) return;
    if (k === 'la') ms.la = t.value; else if (k === 'lb') ms.lb = t.value; else if (k === 'cp') ms.cp = t.value;
    else if (ms.b) {
      if (k === 'period') { ms.b.period = t.value; ms.b.picked = null; }
      else if (k === 'frame') ms.b.frame = Number(t.value) || 0;
      else if (k === 'show') ms.b.show = t.checked;
      else if (k === 'stat') {
        var i = ms.b.picked.indexOf(t.value);
        if (t.checked && i < 0 && ms.b.picked.length < M.MAX_STATS) ms.b.picked.push(t.value);
        if (!t.checked && i >= 0) ms.b.picked.splice(i, 1);
      }
    }
    A.render();
  });
  function flashBtn(el, text) { var old = el.textContent; el.textContent = text; setTimeout(function () { if (el.isConnected) el.textContent = old; }, 1800); }
  X['m-copy'] = function (el) {
    var inp = document.getElementById('mu-msg'); if (!inp) return;
    var done = function () { flashBtn(el, 'Copied ✓'); };
    var fb = function () { inp.focus(); inp.select(); try { document.execCommand('copy'); done(); } catch (e) { flashBtn(el, 'Press Ctrl/Cmd+C'); } };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(inp.value).then(done, fb); else fb();
  };
  X['m-share-image'] = function (el) {
    var cv = document.getElementById('mu-canvas'), p = A.player(); if (!cv || !p) return;
    var o = buildInvite(p);
    cv.toBlob(function (blob) {
      if (!blob) return;
      var file = new File([blob], 'plate450-match-up.png', { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) { navigator.share({ files: [file], text: o.msg }).catch(function () {}); return; }
      try { var u = URL.createObjectURL(blob), a = document.createElement('a'); a.href = u; a.download = file.name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(u); }, 2000); flashBtn(el, 'Saved ✓'); } catch (e) { flashBtn(el, 'Could not save'); }
    }, 'image/png');
  };
  X['m-qr'] = function () {
    var p = A.player(); if (!p || !ms.b) return;
    var o = buildInvite(p), svg = QR.svg(o.url, 280); if (!svg) return;
    A.openModal('<button type="button" class="modal-x" data-action="modal-close" aria-label="Close">×</button><h3 class="share-h">Scan to compare</h3><div class="qr-box">' + svg + '</div><p class="hint">Have your friend point their phone camera here. The code holds the same numbers as your link.</p>');
  };
  X['m-save'] = function () {
    var inv = ms.open; if (!inv) return;
    var r = M.addFriend(friends(), Object.assign({}, inv, { t: today() }));
    if (r.status === 'full') ms.note = 'You have ' + M.MAX_FRIENDS + ' friends saved. Remove one to add another.';
    else { saveFriends(r.list); ms.note = r.status === 'replaced' ? 'Updated. Their newest numbers replaced the old ones.' : 'Saved to my friends ✓'; }
    A.render();
  };
  X['m-remove'] = function (el) {
    saveFriends(M.removeFriend(friends(), el.dataset.id)); ms.note = 'Removed.'; A.go('matchup/friends');
  };
  X['m-reply'] = function () {
    var inv = ms.open, p = A.player(); if (!inv || !hasGames(p)) return;
    ms.b = { period: ms.cp || 'all', picked: inv.s.map(function (x) { return x.id; }), frame: M.FRAMES.length - 1, show: true };
    A.go('matchup/invite');
  };
  // Cleared when the player erases their diary data.
  window.addEventListener('plate450:erase', function () { try { localStorage.removeItem(FKEY); localStorage.removeItem(RKEY); } catch (e) {} });
})();
