/* Plate 450 Diary - Learn section: trivia, quizzes, knowledge base, glossary and the trainers / coaches / travel teams directory.
   All content comes from content/content.js (edited in the Content Studio). Registers itself with the app through window.DDApp. */
(function () {
  'use strict';
  var A = window.DDApp, C = window.Content, Sim = window.Sim;
  if (!A || !C) return;
  var esc = A.esc, content = A.content();
  function list(k) { return C.visible(content[k] || []); }

  var st = { run: null, tlvl: 0, kbq: '', kbcat: '', gq: '', dtype: '', dstate: '', dq: '', dloc: '', dage: '', dskill: '', dsaved: false, dmore: 20, req: null };
  var SAVE_KEY = 'plate450.savedlistings', AGE_KEY = 'plate450.dirage';
  function savedIds() { try { var v = JSON.parse(localStorage.getItem(SAVE_KEY)); return Array.isArray(v) ? v.filter(function (x) { return typeof x === 'string'; }).slice(0, 200) : []; } catch (e) { return []; } }
  function setSaved(ids) { try { localStorage.setItem(SAVE_KEY, JSON.stringify(ids)); } catch (e) { /* private mode */ } }
  try { st.dage = localStorage.getItem(AGE_KEY) || ''; } catch (e0) { st.dage = ''; }

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
  function triviaPool() { var all = list('trivia'), f = all.filter(function (t) { return !st.tlvl || t.lvl === st.tlvl; }); return f.length ? f : all; }
  function triviaItems(n) {
    var all = triviaPool(), order = Sim.shuffle(all.length);
    return order.slice(0, n).map(function (k) { var t = all[k]; return { q: t.q, opts: t.opts, ans: t.ans, expl: t.fact, cat: t.cat, lvl: t.lvl }; });
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
      '<section class="card">' + (it.cat ? '<div class="chips"><span class="chip">' + esc(it.cat) + '</span>' + (it.lvl ? '<span class="chip">' + esc(C.LEVELS[it.lvl]) + '</span>' : '') + '</div>' : '') + '<h3 class="sim-q">' + esc(it.q) + '</h3>' +
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
      '<section class="card"><h3>Trainers, coaches &amp; travel teams</h3><p class="muted">' + (n.dir ? 'Browse ' + n.dir + (n.dir === 1 ? ' listing' : ' listings') + ' from local trainers, clinics and teams.' : 'The directory is just getting started. Trainers, coaches and teams can submit their details for review and approval.') + '</p>' +
      '<div class="row wrap"><a class="btn grow" href="#learn/directory">Browse the directory</a><a class="btn ghost grow" href="#find-list">Request a listing</a></div></section>' + A.footer();
  }

  function viewTrivia(p) {
    if (st.run && st.run.kind === 'trivia') return st.run.done ? viewSummary(st.run, p) : viewRun(st.run, p);
    var all = list('trivia');
    if (!all.length) return none('🎲', 'No trivia yet', 'New questions are on the way.');
    var chips = '<div class="chips lvl" role="group" aria-label="League level" style="margin:0 0 6px"><button class="chip' + (st.tlvl ? '' : ' on') + '" data-action="l-tlvl" data-v="0" aria-pressed="' + !st.tlvl + '">All</button>' +
      [1, 2, 3].map(function (n) { var c = all.filter(function (t) { return t.lvl === n; }).length; return c ? '<button class="chip' + (st.tlvl === n ? ' on' : '') + '" data-action="l-tlvl" data-v="' + n + '" aria-pressed="' + (st.tlvl === n) + '">' + C.LEVELS[n] + ' <span class="small">' + c + '</span></button>' : ''; }).join('') + '</div>';
    return back('Learn', 'learn') + head('Trivia', 'Baseball trivia', all.length + ' questions in the bank. Each round is five random ones.') +
      '<section class="card"><h3>League level</h3>' + chips + '<p class="hint">' + (st.tlvl ? '<b>' + C.LEVELS[st.tlvl] + '</b>: ' + esc(Sim.LEVEL_INFO[st.tlvl]) + '. ' : '') + 'A is the basics, AA is tougher, AAA is big-league smarts.</p><button class="btn block" data-action="l-trivia" style="margin-top:8px">Play a 5-question round &rarr;</button></section>' + A.footer();
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
  var ART_LINK = {
    'arm-care': ['Find a pitching coach', 'trainer', 'pitching'], 'types-of-pitches': ['Find a pitching coach', 'trainer', 'pitching'],
    'why-umpire': ['Find a league', 'team', ''], 'how-to-start-umpiring': ['Find a league', 'team', ''], 'umpire-basics': ['Find a league', 'team', '']
  };
  function articleLink(a) {
    var l = ART_LINK[a.id];
    return l ? '<p style="margin-top:14px"><button class="btn ghost block" data-action="l-find" data-t="' + l[1] + '" data-q="' + l[2] + '">' + esc(l[0]) + ' →</button></p>' : '';
  }
  function viewKb(p, sub) {
    var all = list('kb');
    if (sub[0]) {
      var a = all.filter(function (x) { return x.id === sub[0]; })[0];
      if (!a) return back('Knowledge base', 'learn/kb') + none('📚', 'Article not found', 'It may have been renamed or removed.', 'learn/kb');
      return back('Knowledge base', 'learn/kb') + '<section class="card article"><p class="eyebrow">' + esc(a.cat) + '</p><h2>' + esc(a.title) + '</h2>' + C.md(a.body) + articleLink(a) + '</section>' + A.footer();
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
  function listing(d, tier, isSaved) {
    var t = C.dirType(d.type), where = [d.city, d.state].filter(Boolean).join(', ') + (d.zip ? ' ' + d.zip : '');
    var links = [];
    if (d.website) links.push('<a class="btn small" href="' + esc(d.website) + '" target="_blank" rel="noopener noreferrer nofollow">Website</a>');
    if (d.email) links.push('<a class="btn ghost small" href="mailto:' + esc(d.email) + '">Email</a>');
    if (d.phone) links.push('<a class="btn ghost small" href="' + esc(telHref(d.phone)) + '">' + esc(d.phone) + '</a>');
    return '<article class="card listing' + (d.featured ? ' featured' : '') + '"><div class="row between" style="align-items:flex-start"><div class="chips" style="margin:0 0 8px">' + (d.featured ? '<span class="chip feat">★ Featured</span>' : '') + '<span class="chip">' + esc(t ? t.name : d.type) + '</span>' + (where.trim() ? '<span class="chip">' + esc(where.trim()) + '</span>' : '') + (tier === 1 ? '<span class="chip">Nearby area</span>' : '') + (d.ages ? '<span class="chip">Ages ' + esc(d.ages) + '</span>' : '') + '</div>' +
      '<button class="heart' + (isSaved ? ' on' : '') + '" data-action="l-save" data-id="' + esc(d.id) + '" aria-pressed="' + (isSaved ? 'true' : 'false') + '" aria-label="' + (isSaved ? 'Remove ' : 'Save ') + esc(d.name) + (isSaved ? ' from saved' : ' to saved') + '">' + (isSaved ? '♥' : '♡') + '</button></div>' +
      '<h3>' + esc(d.name) + '</h3>' + (d.tagline ? '<p class="muted">' + esc(d.tagline) + '</p>' : '') +
      (d.services.length ? '<ul class="svc">' + d.services.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ul>' : '') +
      (d.notes ? '<p class="small">' + esc(d.notes) + '</p>' : '') + (links.length ? '<div class="row wrap" style="margin-top:10px">' + links.join('') + '</div>' : '') + '</article>';
  }
  /* Does a listing's age text ("7-14", "12U", "6+", "All ages") fit this age? Unreadable text is never filtered out. */
  function ageMatch(txt, age) {
    var s = String(txt || '').toLowerCase().trim(), m;
    if (!s || /all|any|every/.test(s)) return true;
    if ((m = /(\d{1,2})\s*(?:-|–|to)\s*(\d{1,2})/.exec(s))) return age >= Number(m[1]) && age <= Number(m[2]);
    if ((m = /(\d{1,2})\s*u\b/.exec(s))) return age <= Number(m[1]);
    if ((m = /(\d{1,2})\s*\+/.exec(s))) return age >= Number(m[1]);
    if ((m = /(\d{1,2})/.exec(s))) return age === Number(m[1]);
    return true;
  }
  /* 0 = this ZIP or city, 1 = same first three digits (nearby), -1 = not a match */
  function locTier(d, loc) {
    if (!loc) return 0;
    var l = loc.toLowerCase();
    if (/^\d{3,5}$/.test(l)) {
      var zips = [d.zip].concat(d.areas || []).filter(Boolean);
      if (l.length < 5) return zips.some(function (z) { return z.indexOf(l) === 0; }) ? 0 : -1;
      if (zips.indexOf(l) >= 0) return 0;
      return zips.some(function (z) { return z.slice(0, 3) === l.slice(0, 3); }) ? 1 : -1;
    }
    if (d.city && d.city.toLowerCase().indexOf(l) >= 0) return 0;
    if (/^[a-z]{2}$/.test(l) && d.state && d.state.toLowerCase() === l) return 0;
    return -1;
  }
  var STOP = { and: 1, the: 1, for: 1, with: 1, ages: 1, your: 1, our: 1, from: 1, all: 1, more: 1, year: 1, round: 1, private: 1, small: 1, group: 1, based: 1 };
  function skillChips(all) {
    var n = {};
    all.forEach(function (d) { var seen = {}; d.services.join(' ').toLowerCase().replace(/[^a-z ]/g, ' ').split(/\s+/).forEach(function (w) { if (w.length < 4 || STOP[w] || seen[w]) return; seen[w] = 1; n[w] = (n[w] || 0) + 1; }); });
    return Object.keys(n).sort(function (a, b) { return n[b] - n[a] || (a < b ? -1 : 1); }).slice(0, 8);
  }
  function dirMatches() {
    var q = st.dq.trim().toLowerCase(), loc = st.dloc.trim(), age = parseInt(st.dage, 10), saved = savedIds();
    return list('directory').map(function (d) { return { d: d, tier: locTier(d, loc) }; }).filter(function (x) {
      var d = x.d;
      if (x.tier < 0) return false;
      if (st.dsaved && saved.indexOf(d.id) < 0) return false;
      if (st.dtype && d.type !== st.dtype) return false;
      if (st.dstate && d.state !== st.dstate) return false;
      if (st.dskill && d.services.join(' ').toLowerCase().indexOf(st.dskill) < 0) return false;
      if (age > 0 && !ageMatch(d.ages, age)) return false;
      return !q || [d.name, d.tagline, d.city, d.state, d.zip, d.notes, d.services.join(' ')].join(' ').toLowerCase().indexOf(q) >= 0;
    }).sort(function (a, b) {
      if (!!b.d.featured !== !!a.d.featured) return b.d.featured ? 1 : -1;
      if (a.tier !== b.tier) return a.tier - b.tier;
      return a.d.name.toLowerCase() < b.d.name.toLowerCase() ? -1 : 1;
    });
  }
  function filtersOn() { return !!(st.dq.trim() || st.dloc.trim() || parseInt(st.dage, 10) > 0 || st.dtype || st.dstate || st.dskill || st.dsaved); }
  function dirList() {
    if (!list('directory').length) return A.emptyState('🧢', 'No listings yet', 'Trainers, coaches, clinics and travel teams can submit their details for review. Approved listings appear here.', '<a class="btn" href="#find-list">Request a listing</a>');
    var items = dirMatches(), saved = savedIds(), shown = items.slice(0, st.dmore);
    var bar = '<div class="row between dir-count"><b>' + items.length + (items.length === 1 ? ' listing' : ' listings') + '</b>' + (filtersOn() ? '<button class="link" data-action="l-clear">Clear filters</button>' : '') + '</div>';
    if (!items.length) return bar + '<section class="card"><p class="muted">No listings match those filters. Try a nearby ZIP, a different city, or clear the filters.</p></section>';
    return bar + shown.map(function (x) { return listing(x.d, x.tier, saved.indexOf(x.d.id) >= 0); }).join('') +
      (items.length > shown.length ? '<button class="btn ghost block" data-action="l-more">Show more (' + (items.length - shown.length) + ' left)</button>' : '');
  }
  function viewDirectory() {
    var all = list('directory'), states = {}, p = A.player();
    all.forEach(function (d) { if (d.state) states[d.state] = 1; });
    var chips = '<div class="chips" style="margin:0 0 12px"><button class="chip' + (st.dtype ? '' : ' on') + '" data-action="l-dtype" data-t="">All</button>' +
      C.DIR_TYPES.map(function (t) { return '<button class="chip' + (st.dtype === t.id ? ' on' : '') + '" data-action="l-dtype" data-t="' + t.id + '">' + esc(t.name) + '</button>'; }).join('') +
      '<button class="chip' + (st.dsaved ? ' on' : '') + '" data-action="l-saved">♥ Saved (' + savedIds().length + ')</button></div>';
    var sk = skillChips(all), skills = sk.length ? '<div class="chips" style="margin:0 0 12px" aria-label="Skills">' + sk.map(function (w) { return '<button class="chip' + (st.dskill === w ? ' on' : '') + '" data-action="l-skill" data-k="' + esc(w) + '">' + esc(w) + '</button>'; }).join('') + '</div>' : '';
    var stSel = Object.keys(states).length > 1 ? '<div class="field"><label for="l-dstate">State (optional)</label><select id="l-dstate" data-lsel="dstate"><option value="">All states</option>' + Object.keys(states).sort().map(function (s) { return '<option' + (st.dstate === s ? ' selected' : '') + '>' + esc(s) + '</option>'; }).join('') + '</select></div>' : '';
    var myZip = p && /^\d{5}$/.test(p.zip || '') ? '<button class="link" data-action="l-myzip">Use my ZIP (' + esc(p.zip) + ')</button>' : '';
    return back('Learn', 'learn') + head('Directory', 'Trainers, coaches & travel teams', 'Find help to get better, or a team to join.') +
      '<div class="notice" role="note"><b>For parents and guardians.</b> Listings are provided by the businesses and teams themselves. Plate 450 Diary does not vet, endorse or guarantee anyone listed. Do your own research, and always make contact yourself on your child’s behalf. See the <a href="#terms">Terms</a>.</div>' +
      (all.length ? '<section class="card"><div class="grid2"><div class="field"><label for="l-dloc">ZIP code or city</label><input id="l-dloc" type="search" data-lin="dloc" autocomplete="off" inputmode="text" placeholder="78701 or Austin" value="' + esc(st.dloc) + '"></div>' +
        '<div class="field"><label for="l-dage">Player age</label><input id="l-dage" type="number" data-lin="dage" min="3" max="19" inputmode="numeric" placeholder="e.g. 10" value="' + esc(st.dage) + '"></div></div>' + (myZip ? '<p class="small" style="margin:-6px 0 12px">' + myZip + '</p>' : '') +
        '<div class="field"><label for="l-dq">Name or skill</label><input id="l-dq" type="search" data-lin="dir" autocomplete="off" placeholder="Name, pitching, camps…" value="' + esc(st.dq) + '"></div>' + skills + stSel + chips + '</section>' : '') +
      '<div id="l-list">' + dirList() + '</div>' +
      (all.length ? '<section class="card"><h3>Not listed?</h3><p class="muted">Listings are not automatic. Submit your details and we review each one before it is published.</p><a class="btn ghost block" href="#find-list">Request a listing</a></section>' : '') + A.footer();
  }

  /* ---------- listing request ---------- */
  function viewFind() {
    var r = st.req;
    if (r) {
      var mail = A.contactEmail ? 'mailto:' + A.contactEmail + '?subject=' + encodeURIComponent('Plate 450 Diary listing request') + '&body=' + encodeURIComponent(r.text) : '';
      return back('Directory', 'learn/directory') + head('Your request is ready', 'One more step', A.contactEmail ? 'Send this to us and we will review it. Listings are added by hand, usually within a few days.' : 'Copy this and send it to the person who runs this site. Listings are added by hand.') +
        '<section class="card"><label for="l-reqtxt" class="small muted">Your request</label><textarea id="l-reqtxt" rows="12" readonly>' + esc(r.text) + '</textarea>' +
        '<div class="row wrap" style="margin-top:10px">' + (mail ? '<a class="btn grow" href="' + esc(mail) + '">Email it</a>' : '') + '<button class="btn ' + (mail ? 'ghost ' : '') + 'grow" data-action="l-copy">Copy text</button></div>' +
        '<p class="hint">Nothing has been sent or saved. Your request only goes out if you email it yourself.</p>' +
        '<button class="btn ghost block" style="margin-top:10px" data-action="l-reqnew">Start over</button></section>' + A.footer();
    }
    function inp(id, label, ph, extra) { return '<div class="field"><label for="lf-' + id + '">' + label + '</label><input id="lf-' + id + '" name="' + id + '" type="text" autocomplete="off" placeholder="' + esc(ph || '') + '"' + (extra || '') + '></div>'; }
    return back('Directory', 'learn/directory') + head('Request a listing', 'Trainers, coaches & travel teams', 'Submitting this form does not publish anything. Every request is reviewed and must be approved before it appears. For adults who run a business, program or team. Business information only, please: no player names or kids’ details.') +
      '<section class="card"><form data-form="l-request" novalidate><div class="error" data-errbox hidden role="alert"></div>' +
      '<div class="field"><label for="lf-type">What are you listing?</label><select id="lf-type" name="type"><option value="">Choose one</option>' + C.DIR_TYPES.map(function (t) { return '<option value="' + t.id + '">' + esc(t.name) + '</option>'; }).join('') + '</select></div>' +
      inp('name', 'Name', 'Coach Sam Baseball Academy', ' maxlength="80"') + inp('tagline', 'One-line description', 'Hitting lessons for ages 8-14', ' maxlength="120"') +
      '<div class="field"><label for="lf-services">Services or details (one per line)</label><textarea id="lf-services" name="services" rows="4" placeholder="Private hitting lessons&#10;Pitching clinics&#10;Summer camps"></textarea></div>' +
      inp('ages', 'Ages or levels', '8-14', ' maxlength="30"') + '<div class="grid2">' + inp('city', 'City', '', ' maxlength="40"') + inp('state', 'State', 'CA', ' maxlength="30"') + '</div>' + inp('zip', 'ZIP code', '78701', ' maxlength="5" inputmode="numeric" autocomplete="postal-code"') + inp('areas', 'Other ZIP codes you serve (optional)', '78702, 78703', ' maxlength="60" inputmode="numeric"') +
      inp('website', 'Website', 'https://example.com', ' maxlength="200" inputmode="url"') + inp('email', 'Business email', '', ' maxlength="100" inputmode="email"') + inp('phone', 'Business phone', '', ' maxlength="25" inputmode="tel"') +
      '<div class="field"><label for="lf-notes">Anything else (optional)</label><textarea id="lf-notes" name="notes" rows="3" maxlength="300"></textarea></div>' +
      '<label class="check agree"><input type="checkbox" name="confirm"> <span>I am 18 or older, this is my own business, program or team, and this information may be published on Plate 450 Diary. I understand this site does not endorse listings.</span></label>' +
      '<button class="btn block" type="submit">Prepare my listing request</button><p class="hint">Nothing is sent until you email it yourself.</p></form></section>' + A.footer();
  }

  /* ---------- home card ---------- */
  function findCard() { return '<section class="card"><div class="row between"><div><b>Find a coach or trainer</b><br><span class="muted small">Search by ZIP code or city</span></div><a class="btn small" href="#learn/directory">Search</a></div></section>'; }
  A.ext.homeCard = function () {
    var all = list('trivia');
    if (!all.length) return '<section class="card"><div class="row between"><div><b>📚 Learn</b><br><span class="muted small">Trivia, quizzes, articles and a coach directory</span></div><a class="btn small" href="#learn">Open</a></div></section>' + findCard();
    var t = all[dayIndex(all.length)];
    return '<section class="card"><p class="eyebrow">Trivia of the day</p><p><b>' + esc(t.q) + '</b></p><div class="row wrap"><button class="btn small grow" data-action="l-daily">Answer it</button><a class="btn ghost small grow" href="#learn">More to learn</a></div></section>' + findCard();
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
  X['l-tlvl'] = function (el) { var v = Number(el.dataset.v); st.tlvl = v === 1 || v === 2 || v === 3 ? v : 0; A.render(); };
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
  function refreshList() { var box = document.getElementById('l-list'); if (box) box.innerHTML = dirList(); }
  X['l-skill'] = function (el) { st.dskill = st.dskill === el.dataset.k ? '' : el.dataset.k; st.dmore = 20; A.render(); };
  X['l-saved'] = function () { st.dsaved = !st.dsaved; st.dmore = 20; A.render(); };
  X['l-more'] = function () { st.dmore += 20; refreshList(); };
  X['l-clear'] = function () { st.dq = ''; st.dloc = ''; st.dage = ''; st.dtype = ''; st.dstate = ''; st.dskill = ''; st.dsaved = false; st.dmore = 20; try { localStorage.removeItem(AGE_KEY); } catch (e) { /* ignore */ } A.render(); };
  X['l-myzip'] = function () { var p = A.player(); if (p && /^\d{5}$/.test(p.zip || '')) { st.dloc = p.zip; st.dmore = 20; A.render(); } };
  X['l-save'] = function (el) {
    var ids = savedIds(), i = ids.indexOf(el.dataset.id);
    if (i >= 0) ids.splice(i, 1); else ids.push(el.dataset.id);
    setSaved(ids);
    if (st.dsaved) refreshList(); else { var on = i < 0; el.classList.toggle('on', on); el.textContent = on ? '♥' : '♡'; el.setAttribute('aria-pressed', on ? 'true' : 'false'); }
    var chip = document.querySelector('[data-action="l-saved"]'); if (chip) chip.textContent = '♥ Saved (' + ids.length + ')';
  };
  X['l-find'] = function (el) { st.dtype = el.dataset.t || ''; st.dq = el.dataset.q || ''; st.dloc = ''; st.dskill = ''; st.dsaved = false; st.dmore = 20; A.go('learn/directory'); };
  X['l-reqnew'] = function () { st.req = null; A.render(); };
  X['l-copy'] = function (el) {
    var ta = document.getElementById('l-reqtxt'); if (!ta) return;
    function done() { el.textContent = 'Copied!'; }
    try { if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(ta.value).then(done, function () { ta.select(); }); return; } } catch (e) { /* fall through */ }
    ta.select(); try { document.execCommand('copy'); done(); } catch (e2) { /* user can copy by hand */ }
  };

  A.ext.forms['l-request'] = function (form) {
    var el = form.elements, box = form.querySelector('[data-errbox]');
    var raw = { type: el.type.value, name: el.name.value, tagline: el.tagline.value, services: el.services.value, ages: el.ages.value, city: el.city.value, state: el.state.value, zip: el.zip.value, areas: el.areas.value, website: el.website.value, email: el.email.value, phone: el.phone.value, notes: el.notes.value };
    var res = C.clean('directory', raw, {}), errs = res.errors.slice();
    if (!/^\d{5}$/.test(String(el.zip.value).replace(/\s+/g, '')) && errs.indexOf('The ZIP code must be 5 digits.') < 0) errs.push('Add your 5-digit ZIP code so families nearby can find you.');
    if (!el.confirm.checked) errs.push('Please confirm that you are 18 or older and that this is your own business or team.');
    if (errs.length) { box.hidden = false; box.innerHTML = errs.length === 1 ? esc(errs[0]) : '<ul>' + errs.map(function (e) { return '<li>' + esc(e) + '</li>'; }).join('') + '</ul>'; box.scrollIntoView({ block: 'center', behavior: 'smooth' }); return; }
    st.req = { text: C.buildRequest(res.item) }; A.render();
  };

  // Live search and filter boxes update only the results list, so typing never loses focus.
  document.addEventListener('input', function (e) {
    var el = e.target.closest && e.target.closest('[data-lin]'); if (!el) return;
    var k = el.dataset.lin, box = document.getElementById('l-list'); if (!box) return;
    if (k === 'kb') { st.kbq = el.value; box.innerHTML = kbList(); } else if (k === 'gloss') { st.gq = el.value; box.innerHTML = glossList(); } else if (k === 'dir' || k === 'dloc' || k === 'dage') {
      if (k === 'dir') st.dq = el.value; else if (k === 'dloc') st.dloc = el.value; else { st.dage = el.value.replace(/[^0-9]/g, '').slice(0, 2); try { localStorage.setItem(AGE_KEY, st.dage); } catch (e) { /* ignore */ } }
      st.dmore = 20; box.innerHTML = dirList();
    }
  });
  document.addEventListener('change', function (e) {
    var el = e.target.closest && e.target.closest('[data-lsel]'); if (!el) return;
    if (el.dataset.lsel === 'dstate') { st.dstate = el.value; st.dmore = 20; var box = document.getElementById('l-list'); if (box) box.innerHTML = dirList(); }
  });
  // A finished or half-played round is forgotten as soon as the player leaves trivia / quizzes.
  window.addEventListener('hashchange', function () { if (!/^#learn\/(trivia|quizzes)/.test(location.hash)) st.run = null; });
  A.render();   // the app drew once before this file loaded, so draw again now that the Learn views exist
})();
