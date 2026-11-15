/* Dugout Diary - Learn section: trivia, quizzes, knowledge base, glossary and the trainers / coaches / travel teams directory.
   All content comes from content/content.js (edited in the Content Studio). Registers itself with the app through window.DDApp. */
(function () {
  'use strict';
  var A = window.DDApp, C = window.Content, Sim = window.Sim;
  if (!A || !C) return;
  var esc = A.esc, content = A.content();
  function list(k) { return C.visible(content[k] || []); }

  var st = { run: null, kbq: '', kbcat: '', gq: '', dtype: '', dstate: '', dq: '', req: null };

  function back(label, to) { return '<a class="link small" href="#' + to + '">&larr; ' + esc(label) + '</a>'; }
  function head(eyebrow, title, text) { return '<section class="card hero"><p class="eyebrow">' + esc(eyebrow) + '</p><h2>' + esc(title) + '</h2>' + (text ? '<p class="muted">' + esc(text) + '</p>' : '') + '</section>'; }
  function none(icon, title, text, to) { return A.emptyState(icon, title, text, '<a class="btn" href="#' + (to || 'learn') + '">Back to Learn</a>'); }
  function catsOf(items) { var o = {}; items.forEach(function (x) { o[x.cat || 'General'] = 1; }); return Object.keys(o).sort(); }

  /* ---------- trivia and quiz runs ---------- */
  function startRun(kind, id, title, items) {
    if (!items.length) return null;
    st.run = { kind: kind, id: id, title: title, items: items, i: 0, order: Sim.shuffle(items[0].opts.length), picked: -1, results: [], done: false, saved: false };
    return st.run;
  }
  function triviaItems(n) {
    var all = list('trivia'), order = Sim.shuffle(all.length);
    return order.slice(0, n).map(function (k) { var t = all[k]; return { q: t.q, opts: t.opts, ans: t.ans, expl: t.fact, cat: t.cat }; });
  }
  function dayIndex(n) { return n ? Math.floor(Date.now() / 864e5) % n : 0; }

  function viewRun(run, p) {
    var it = run.items[run.i], answered = run.picked >= 0, last = run.i + 1 >= run.items.length;
    var dots = run.items.map(function (x, k) { return '<i class="dot' + (k < run.results.length ? (run.results[k] ? ' ok' : ' no') : (k === run.i ? ' cur' : '')) + '"></i>'; }).join('');
    var opts = run.order.map(function (oi, k) {
      var cls = 'opt';
      if (answered) { if (oi === it.ans) cls += ' right'; else if (k === run.picked) cls += ' wrong'; }
      return '<button class="' + cls + '" data-action="l-pick" data-i="' + k + '"' + (answered ? ' disabled' : '') + '><b>' + 'ABCD'[k] + '</b><span>' + esc(it.opts[oi]) + '</span></button>';
    }).join('');
    var fb = '';
    if (answered) {
      var ok = run.results[run.results.length - 1];
      fb = '<div class="feedback ' + (ok ? 'good' : 'bad') + '" role="status"><b>' + (ok ? 'Nice one!' : 'Not quite.') + '</b>' + (ok ? '' : '<p class="best">' + esc(it.opts[it.ans]) + '</p>') +
        (it.expl ? '<p>' + esc(it.expl) + '</p>' : '') + '<button class="btn block" data-action="l-next">' + (last ? 'See my score' : 'Next question &rarr;') + '</button></div>';
    }
    return '<div class="row between" style="margin-bottom:8px"><button class="link small" data-action="l-end">&larr; Quit</button><span class="muted small">Question ' + (run.i + 1) + ' of ' + run.items.length + '</span></div>' +
      '<div class="dots" aria-hidden="true">' + dots + '</div>' +
      '<section class="card">' + (it.cat ? '<div class="chips"><span class="chip">' + esc(it.cat) + '</span></div>' : '') + '<h3 class="sim-q">' + esc(it.q) + '</h3>' +
      '<div class="opts" role="group" aria-label="Answer choices">' + opts + '</div>' + fb + '</section>';
  }
  function viewSummary(run, p) {
    var score = run.results.filter(Boolean).length, total = run.items.length;
    var msg = score === total ? 'Perfect game!' : score >= total * 0.7 ? 'Great job!' : score >= total * 0.4 ? 'Solid effort. Try again to beat it.' : 'Every pro started somewhere. Read up and try again.';
    if (!run.saved && run.kind === 'quiz') { run.saved = true; A.recordQuiz(p, run.id, score, total); }
    return head(run.title, score + ' of ' + total, msg) +
      '<section class="card"><ul class="recap">' + run.items.map(function (it, k) { var ok = run.results[k]; return '<li class="' + (ok ? 'ok' : 'no') + '"><span class="mark" aria-hidden="true">' + (ok ? '&#10003;' : '&#10007;') + '</span><div><b>' + esc(it.q) + '</b><br><span class="muted small">' + esc(it.opts[it.ans]) + '</span></div></li>'; }).join('') + '</ul></section>' +
      (run.kind === 'quiz' && !p ? '<section class="card"><p class="muted">Create a free player card to keep your best quiz scores.</p><a class="btn ghost block" href="#home">Create my card</a></section>' : '') +
      '<section class="card"><div class="row wrap"><button class="btn grow" data-action="l-again">Play again</button><button class="btn ghost grow" data-action="l-end">Done</button></div></section>';
  }

  /* ---------- views ---------- */
  function hub(p) {
    var n = { trivia: list('trivia').length, quizzes: list('quizzes').length, kb: list('kb').length, glossary: list('glossary').length, dir: list('directory').length };
    function tile(to, icon, title, sub) { return '<a class="cat" href="#' + to + '"><span class="cat-ic" aria-hidden="true">' + icon + '</span><span class="grow"><b>' + esc(title) + '</b><span class="muted small">' + esc(sub) + '</span></span><span class="cat-go" aria-hidden="true">&rsaquo;</span></a>'; }
    return head('Learn', 'Get smarter at the game.', 'Train your baseball brain, learn the rules, and find people who can help you improve.') +
      '<section class="card"><div class="cats">' +
      tile('iq', '🧢', 'Game IQ Simulator', Sim.SCENARIOS.length + ' real game situations') +
      (n.trivia ? tile('learn/trivia', '🎲', 'Trivia', n.trivia + ' questions, five at a time') : '') +
      (n.quizzes ? tile('learn/quizzes', '📝', 'Quizzes', n.quizzes + (n.quizzes === 1 ? ' quiz' : ' quizzes') + ' with a score to beat') : '') +
      (n.kb ? tile('learn/kb', '📚', 'Knowledge base', n.kb + ' how-to articles') : '') +
      (n.glossary ? tile('learn/glossary', '🔤', 'Glossary', n.glossary + ' baseball terms') : '') +
      '</div></section>' +
      '<section class="card"><h3>Trainers, coaches &amp; travel teams</h3><p class="muted">' + (n.dir ? 'Browse ' + n.dir + (n.dir === 1 ? ' listing' : ' listings') + ' from local trainers, clinics and teams.' : 'The directory is just getting started. Be one of the first to list your services or team.') + '</p>' +
      '<div class="row wrap"><a class="btn grow" href="#learn/directory">Browse the directory</a><a class="btn ghost grow" href="#find-list">Get listed</a></div></section>' + A.footer();
  }

  function viewTrivia(p) {
    if (st.run && st.run.kind === 'trivia') return st.run.done ? viewSummary(st.run, p) : viewRun(st.run, p);
    var all = list('trivia');
    if (!all.length) return none('🎲', 'No trivia yet', 'New questions are on the way.');
    return back('Learn', 'learn') + head('Trivia', 'Baseball trivia', all.length + ' questions in the bank. Each round is five random ones.') +
      '<section class="card"><button class="btn block" data-action="l-trivia">Play a 5-question round &rarr;</button></section>' + A.footer();
  }
  function viewQuizzes(p) {
    if (st.run && st.run.kind === 'quiz') return st.run.done ? viewSummary(st.run, p) : viewRun(st.run, p);
    var qs = list('quizzes'), d = A.iqData(p);
    if (!qs.length) return none('📝', 'No quizzes yet', 'New quizzes are on the way.');
    return back('Learn', 'learn') + head('Quizzes', 'Pick a quiz', 'Beat your best score.') +
      '<section class="card"><div class="cats">' + qs.map(function (q) {
        var best = d.qz && d.qz[q.id];
        return '<button class="cat" data-action="l-quiz" data-id="' + esc(q.id) + '"><span class="cat-ic" aria-hidden="true">📝</span><span class="grow"><b>' + esc(q.title) + '</b><span class="muted small">' + esc(q.desc || (q.questions.length + ' questions')) + (best ? ' &middot; best ' + best[0] + '/' + best[1] : '') + '</span></span><span class="cat-go" aria-hidden="true">&rsaquo;</span></button>';
      }).join('') + '</div></section>' + A.footer();
  }

  function kbList() {
    var q = st.kbq.trim().toLowerCase(), items = list('kb').filter(function (a) {
      if (st.kbcat && a.cat !== st.kbcat) return false;
      return !q || (a.title + ' ' + a.summary + ' ' + a.body + ' ' + a.cat).toLowerCase().indexOf(q) >= 0;
    });
    if (!items.length) return '<p class="muted">Nothing matches. Try another word.</p>';
    return '<div class="cats">' + items.map(function (a) {
      return '<a class="cat" href="#learn/kb/' + encodeURIComponent(a.id) + '"><span class="grow"><b>' + esc(a.title) + '</b><span class="muted small">' + esc(a.cat) + (a.summary ? ' &middot; ' + esc(a.summary) : '') + '</span></span><span class="cat-go" aria-hidden="true">&rsaquo;</span></a>';
    }).join('') + '</div>';
  }
  function viewKb(p, sub) {
    var all = list('kb');
    if (sub[0]) {
      var a = all.filter(function (x) { return x.id === sub[0]; })[0];
      if (!a) return back('Knowledge base', 'learn/kb') + none('📚', 'Article not found', 'It may have been renamed or removed.', 'learn/kb');
      return back('Knowledge base', 'learn/kb') + '<section class="card article"><p class="eyebrow">' + esc(a.cat) + '</p><h2>' + esc(a.title) + '</h2>' + C.md(a.body) + '</section>' + A.footer();
    }
    if (!all.length) return none('📚', 'No articles yet', 'New articles are on the way.');
    var chips = '<div class="chips" style="margin:0 0 12px"><button class="chip' + (st.kbcat ? '' : ' on') + '" data-action="l-kbcat" data-cat="">All</button>' +
      catsOf(all).map(function (c) { return '<button class="chip' + (st.kbcat === c ? ' on' : '') + '" data-action="l-kbcat" data-cat="' + esc(c) + '">' + esc(c) + '</button>'; }).join('') + '</div>';
    return back('Learn', 'learn') + head('Knowledge base', 'Learn how it works') +
      '<section class="card"><div class="field"><label for="l-kbq">Search</label><input id="l-kbq" type="search" data-lin="kb" autocomplete="off" placeholder="Try ERA, bunt, arm care" value="' + esc(st.kbq) + '"></div>' + chips + '<div id="l-list">' + kbList() + '</div></section>' + A.footer();
  }

  function glossList() {
    var q = st.gq.trim().toLowerCase(), items = list('glossary').filter(function (g) { return !q || (g.term + ' ' + g.def).toLowerCase().indexOf(q) >= 0; })
      .sort(function (a, b) { return a.term.toLowerCase() < b.term.toLowerCase() ? -1 : 1; });
    if (!items.length) return '<p class="muted">Nothing matches. Try another word.</p>';
    return '<dl class="gloss">' + items.map(function (g) { return '<dt>' + esc(g.term) + '</dt><dd>' + esc(g.def) + '</dd>'; }).join('') + '</dl>';
  }
  function viewGlossary() {
    if (!list('glossary').length) return none('🔤', 'No terms yet', 'New terms are on the way.');
    return back('Learn', 'learn') + head('Glossary', 'Baseball words, explained') +
      '<section class="card"><div class="field"><label for="l-gq">Search</label><input id="l-gq" type="search" data-lin="gloss" autocomplete="off" placeholder="Try balk or RBI" value="' + esc(st.gq) + '"></div><div id="l-list">' + glossList() + '</div></section>' + A.footer();
  }

  /* ---------- directory ---------- */
  function telHref(ph) { return 'tel:' + String(ph).replace(/[^0-9+]/g, ''); }
  function listing(d) {
    var t = C.dirType(d.type), where = [d.city, d.state].filter(Boolean).join(', ');
    var links = [];
    if (d.website) links.push('<a class="btn small" href="' + esc(d.website) + '" target="_blank" rel="noopener noreferrer nofollow">Website</a>');
    if (d.email) links.push('<a class="btn ghost small" href="mailto:' + esc(d.email) + '">Email</a>');
    if (d.phone) links.push('<a class="btn ghost small" href="' + esc(telHref(d.phone)) + '">' + esc(d.phone) + '</a>');
    return '<article class="card listing"><div class="chips" style="margin:0 0 8px"><span class="chip">' + esc(t ? t.name : d.type) + '</span>' + (where ? '<span class="chip">' + esc(where) + '</span>' : '') + (d.ages ? '<span class="chip">Ages ' + esc(d.ages) + '</span>' : '') + '</div>' +
      '<h3>' + esc(d.name) + '</h3>' + (d.tagline ? '<p class="muted">' + esc(d.tagline) + '</p>' : '') +
      (d.services.length ? '<ul class="svc">' + d.services.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ul>' : '') +
      (d.notes ? '<p class="small">' + esc(d.notes) + '</p>' : '') + (links.length ? '<div class="row wrap" style="margin-top:10px">' + links.join('') + '</div>' : '') + '</article>';
  }
  function dirList() {
    var q = st.dq.trim().toLowerCase(), items = list('directory').filter(function (d) {
      if (st.dtype && d.type !== st.dtype) return false;
      if (st.dstate && d.state !== st.dstate) return false;
      return !q || [d.name, d.tagline, d.city, d.state, d.notes, d.services.join(' ')].join(' ').toLowerCase().indexOf(q) >= 0;
    }).sort(function (a, b) { return a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1; });
    if (!list('directory').length) return A.emptyState('🧢', 'No listings yet', 'Be one of the first: trainers, coaches, clinics and travel teams can ask to be listed for free.', '<a class="btn" href="#find-list">Get listed</a>');
    if (!items.length) return '<p class="muted">No listings match those filters.</p>';
    return items.map(listing).join('');
  }
  function viewDirectory() {
    var all = list('directory'), states = {};
    all.forEach(function (d) { if (d.state) states[d.state] = 1; });
    var chips = '<div class="chips" style="margin:0 0 12px"><button class="chip' + (st.dtype ? '' : ' on') + '" data-action="l-dtype" data-t="">All</button>' +
      C.DIR_TYPES.map(function (t) { return '<button class="chip' + (st.dtype === t.id ? ' on' : '') + '" data-action="l-dtype" data-t="' + t.id + '">' + esc(t.name) + '</button>'; }).join('') + '</div>';
    var stSel = Object.keys(states).length > 1 ? '<div class="field"><label for="l-dstate">State</label><select id="l-dstate" data-lsel="dstate"><option value="">All states</option>' + Object.keys(states).sort().map(function (s) { return '<option' + (st.dstate === s ? ' selected' : '') + '>' + esc(s) + '</option>'; }).join('') + '</select></div>' : '';
    return back('Learn', 'learn') + head('Directory', 'Trainers, coaches & travel teams', 'Find help to get better, or a team to join.') +
      '<div class="notice" role="note"><b>For parents and guardians.</b> Listings are provided by the businesses and teams themselves. Dugout Diary does not vet, endorse or guarantee anyone listed. Do your own research, and always make contact yourself on your child’s behalf. See the <a href="#terms">Terms</a>.</div>' +
      (all.length ? '<section class="card"><div class="field"><label for="l-dq">Search</label><input id="l-dq" type="search" data-lin="dir" autocomplete="off" placeholder="Name, city or skill" value="' + esc(st.dq) + '"></div>' + stSel + chips + '</section>' : '') +
      '<div id="l-list">' + dirList() + '</div>' +
      (all.length ? '<section class="card"><h3>Not listed?</h3><p class="muted">Trainers, coaches and teams can ask to be added for free.</p><a class="btn ghost block" href="#find-list">Get listed</a></section>' : '') + A.footer();
  }

  /* ---------- listing request ---------- */
  function viewFind() {
    var r = st.req;
    if (r) {
      var mail = A.contactEmail ? 'mailto:' + A.contactEmail + '?subject=' + encodeURIComponent('Dugout Diary listing request') + '&body=' + encodeURIComponent(r.text) : '';
      return back('Directory', 'learn/directory') + head('Your request is ready', 'One more step', A.contactEmail ? 'Send this to us and we will review it. Listings are added by hand, usually within a few days.' : 'Copy this and send it to the person who runs this site. Listings are added by hand.') +
        '<section class="card"><label for="l-reqtxt" class="small muted">Your request</label><textarea id="l-reqtxt" rows="12" readonly>' + esc(r.text) + '</textarea>' +
        '<div class="row wrap" style="margin-top:10px">' + (mail ? '<a class="btn grow" href="' + esc(mail) + '">Email it</a>' : '') + '<button class="btn ' + (mail ? 'ghost ' : '') + 'grow" data-action="l-copy">Copy text</button></div>' +
        '<p class="hint">Nothing has been sent or saved. Your request only goes out if you email it yourself.</p>' +
        '<button class="btn ghost block" style="margin-top:10px" data-action="l-reqnew">Start over</button></section>' + A.footer();
    }
    function inp(id, label, ph, extra) { return '<div class="field"><label for="lf-' + id + '">' + label + '</label><input id="lf-' + id + '" name="' + id + '" type="text" autocomplete="off" placeholder="' + esc(ph || '') + '"' + (extra || '') + '></div>'; }
    return back('Directory', 'learn/directory') + head('Get listed', 'Trainers, coaches & travel teams', 'Free. For adults who run a business, program or team. Business information only, please: no player names or kids’ details.') +
      '<section class="card"><form data-form="l-request" novalidate><div class="error" data-errbox hidden role="alert"></div>' +
      '<div class="field"><label for="lf-type">What are you listing?</label><select id="lf-type" name="type"><option value="">Choose one</option>' + C.DIR_TYPES.map(function (t) { return '<option value="' + t.id + '">' + esc(t.name) + '</option>'; }).join('') + '</select></div>' +
      inp('name', 'Name', 'Coach Sam Baseball Academy', ' maxlength="80"') + inp('tagline', 'One-line description', 'Hitting lessons for ages 8-14', ' maxlength="120"') +
      '<div class="field"><label for="lf-services">Services or details (one per line)</label><textarea id="lf-services" name="services" rows="4" placeholder="Private hitting lessons&#10;Pitching clinics&#10;Summer camps"></textarea></div>' +
      inp('ages', 'Ages or levels', '8-14', ' maxlength="30"') + '<div class="grid2">' + inp('city', 'City', '', ' maxlength="40"') + inp('state', 'State', 'CA', ' maxlength="30"') + '</div>' +
      inp('website', 'Website', 'https://example.com', ' maxlength="200" inputmode="url"') + inp('email', 'Business email', '', ' maxlength="100" inputmode="email"') + inp('phone', 'Business phone', '', ' maxlength="25" inputmode="tel"') +
      '<div class="field"><label for="lf-notes">Anything else (optional)</label><textarea id="lf-notes" name="notes" rows="3" maxlength="300"></textarea></div>' +
      '<label class="check agree"><input type="checkbox" name="confirm"> <span>I am 18 or older, this is my own business, program or team, and this information may be published on Dugout Diary. I understand Dugout Diary does not endorse listings.</span></label>' +
      '<button class="btn block" type="submit">Prepare my request</button><p class="hint">Nothing is sent until you email it yourself.</p></form></section>' + A.footer();
  }

  /* ---------- home card ---------- */
  A.ext.homeCard = function () {
    var all = list('trivia');
    if (!all.length) return '<section class="card"><div class="row between"><div><b>📚 Learn</b><br><span class="muted small">Trivia, quizzes, articles and a coach directory</span></div><a class="btn small" href="#learn">Open</a></div></section>';
    var t = all[dayIndex(all.length)];
    return '<section class="card"><p class="eyebrow">Trivia of the day</p><p><b>' + esc(t.q) + '</b></p><div class="row wrap"><button class="btn small grow" data-action="l-daily">Answer it</button><a class="btn ghost small grow" href="#learn">More to learn</a></div></section>';
  };

  /* ---------- routing and actions ---------- */
  A.ext.views.learn = function (p, sub) {
    var s = sub[0] || '';
    if (s !== 'trivia' && s !== 'quizzes' && st.run) st.run = null;
    if (s === 'trivia') return viewTrivia(p);
    if (s === 'quizzes') return viewQuizzes(p);
    if (s === 'kb') return viewKb(p, sub.slice(1));
    if (s === 'glossary') return viewGlossary();
    if (s === 'directory') return viewDirectory();
    return hub(p);
  };
  A.ext.views['find-list'] = function () { return viewFind(); };

  var X = A.ext.actions;
  X['l-trivia'] = function () { startRun('trivia', 'trivia', 'Trivia', triviaItems(5)); A.render(); };
  X['l-daily'] = function () { var all = list('trivia'); if (!all.length) return; var t = all[dayIndex(all.length)]; startRun('trivia', 'daily', 'Trivia of the day', [{ q: t.q, opts: t.opts, ans: t.ans, expl: t.fact, cat: t.cat }]); A.go('learn/trivia'); };
  X['l-quiz'] = function (el) {
    var q = list('quizzes').filter(function (x) { return x.id === el.dataset.id; })[0];
    if (!q) return;
    startRun('quiz', q.id, q.title, q.questions.map(function (x) { return { q: x.q, opts: x.opts, ans: x.ans, expl: x.why }; })); A.render();
  };
  X['l-pick'] = function (el) {
    var r = st.run; if (!r || r.done || r.picked >= 0) return;
    var k = Number(el.dataset.i), it = r.items[r.i];
    if (!(k >= 0 && k < r.order.length)) return;
    r.picked = k; r.results.push(r.order[k] === it.ans); A.render();
    var fb = document.querySelector('.feedback'); if (fb && fb.scrollIntoView) fb.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  };
  X['l-next'] = function () {
    var r = st.run; if (!r || r.picked < 0) return;
    if (r.i + 1 >= r.items.length) r.done = true; else { r.i++; r.picked = -1; r.order = Sim.shuffle(r.items[r.i].opts.length); }
    A.render();
  };
  X['l-again'] = function () {
    var r = st.run; if (!r) return;
    if (r.kind === 'trivia') startRun('trivia', 'trivia', 'Trivia', triviaItems(5));
    else { var q = list('quizzes').filter(function (x) { return x.id === r.id; })[0]; if (q) startRun('quiz', q.id, q.title, q.questions.map(function (x) { return { q: x.q, opts: x.opts, ans: x.ans, expl: x.why }; })); }
    A.render();
  };
  X['l-end'] = function () { st.run = null; A.render(); };
  X['l-kbcat'] = function (el) { st.kbcat = el.dataset.cat || ''; A.render(); };
  X['l-dtype'] = function (el) { st.dtype = el.dataset.t || ''; A.render(); };
  X['l-reqnew'] = function () { st.req = null; A.render(); };
  X['l-copy'] = function (el) {
    var ta = document.getElementById('l-reqtxt'); if (!ta) return;
    function done() { el.textContent = 'Copied!'; }
    try { if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(ta.value).then(done, function () { ta.select(); }); return; } } catch (e) { /* fall through */ }
    ta.select(); try { document.execCommand('copy'); done(); } catch (e2) { /* user can copy by hand */ }
  };

  A.ext.forms['l-request'] = function (form) {
    var el = form.elements, box = form.querySelector('[data-errbox]');
    var raw = { type: el.type.value, name: el.name.value, tagline: el.tagline.value, services: el.services.value, ages: el.ages.value, city: el.city.value, state: el.state.value, website: el.website.value, email: el.email.value, phone: el.phone.value, notes: el.notes.value };
    var res = C.clean('directory', raw, {}), errs = res.errors.slice();
    if (!el.confirm.checked) errs.push('Please confirm that you are 18 or older and that this is your own business or team.');
    if (errs.length) { box.hidden = false; box.innerHTML = errs.length === 1 ? esc(errs[0]) : '<ul>' + errs.map(function (e) { return '<li>' + esc(e) + '</li>'; }).join('') + '</ul>'; box.scrollIntoView({ block: 'center', behavior: 'smooth' }); return; }
    st.req = { text: C.buildRequest(res.item) }; A.render();
  };

  // Live search and filter boxes update only the results list, so typing never loses focus.
  document.addEventListener('input', function (e) {
    var el = e.target.closest && e.target.closest('[data-lin]'); if (!el) return;
    var k = el.dataset.lin, box = document.getElementById('l-list'); if (!box) return;
    if (k === 'kb') { st.kbq = el.value; box.innerHTML = kbList(); } else if (k === 'gloss') { st.gq = el.value; box.innerHTML = glossList(); } else if (k === 'dir') { st.dq = el.value; box.innerHTML = dirList(); }
  });
  document.addEventListener('change', function (e) {
    var el = e.target.closest && e.target.closest('[data-lsel]'); if (!el) return;
    if (el.dataset.lsel === 'dstate') { st.dstate = el.value; var box = document.getElementById('l-list'); if (box) box.innerHTML = dirList(); }
  });
  // A finished or half-played round is forgotten as soon as the player leaves trivia / quizzes.
  window.addEventListener('hashchange', function () { if (!/^#learn\/(trivia|quizzes)/.test(location.hash)) st.run = null; });
  A.render();   // the app drew once before this file loaded, so draw again now that the Learn views exist
})();
