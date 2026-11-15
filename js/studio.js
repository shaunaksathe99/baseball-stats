/* Dugout Diary - Content Studio (#studio).
   A point-and-click editor for the site's trivia, quizzes, knowledge base, glossary, directory and Game IQ situations.
   It edits a draft kept in this browser, lets the owner preview it, and downloads the content file to upload to GitHub.
   There is no server and no database: the published site only changes when the downloaded file is uploaded. */
(function () {
  'use strict';
  var A = window.DDApp, C = window.Content, Sim = window.Sim;
  if (!A || !C) return;
  var esc = A.esc, ls;
  try { ls = window.localStorage; } catch (e) { ls = null; }

  var TYPES = C.TYPES;
  var ICON = { scenarios: '🧢', trivia: '🎲', quizzes: '📝', kb: '📚', glossary: '🔤', directory: '📍' };
  var POS_LABEL = { bat: 'Batter', '1': 'Runner on 1st', '2': 'Runner on 2nd', '3': 'Runner on 3rd', P: 'Pitcher', C: 'Catcher', '1B': 'First baseman', '2B': 'Second baseman', SS: 'Shortstop', '3B': 'Third baseman', LF: 'Left fielder', CF: 'Center fielder', RF: 'Right fielder' };
  var HELP = {
    scenarios: 'Game situations for the Game IQ Simulator. Each has a diagram, a question, and the best play.',
    trivia: 'Quick multiple-choice questions, shown five at a time.',
    quizzes: 'A set of questions with a score players can try to beat.',
    kb: 'How-to articles and explainers.',
    glossary: 'Short definitions of baseball words.',
    directory: 'Trainers, coaches, clinics, facilities and travel teams.'
  };

  var st = { W: null, edit: null, msg: '', q: '', confirm: '', csv: null, paste: '' };

  /* ---------- the working copy (draft) ---------- */
  function published() { return C.normalize(window.DD_CONTENT).content; }
  function load() {
    if (st.W) return st.W;
    st.W = (ls && C.readDraft(ls)) || published();
    return st.W;
  }
  function today() { var d = new Date(); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  function saveDraft() {
    var W = load(); W.updated = today();
    try { ls.setItem(C.DRAFT_KEY, JSON.stringify(W)); return true; } catch (e) { st.msg = 'Your browser would not save the draft (private mode?). Download the file before you leave this page.'; return false; }
  }
  function list(type) { return load()[type]; }
  function label(type, x) {
    if (type === 'scenarios') return x.q;
    if (type === 'trivia') return x.q;
    if (type === 'quizzes') return x.title + ' (' + x.questions.length + ' questions)';
    if (type === 'kb') return x.title;
    if (type === 'glossary') return x.term;
    return x.name + ' (' + ((C.dirType(x.type) || {}).name || x.type) + ')';
  }
  function diff(type) {
    var base = {}, n = 0, cur = list(type);
    published()[type].forEach(function (x) { base[x.id] = JSON.stringify(x); });
    cur.forEach(function (x) { if (base[x.id] !== JSON.stringify(x)) n++; delete base[x.id]; });
    return n + Object.keys(base).length;
  }
  function totalChanges() { return TYPES.reduce(function (s, T) { return s + diff(T.id); }, 0); }
  function T(type) { return TYPES.filter(function (x) { return x.id === type; })[0]; }
  function takenIds(type, exceptId) { var o = {}; list(type).forEach(function (x) { if (x.id !== exceptId) o[x.id] = 1; }); return o; }

  /* ---------- small view helpers ---------- */
  function back(text, to) { return '<a class="link small" href="#' + to + '">&larr; ' + esc(text) + '</a>'; }
  function msgBox() { var m = st.msg; st.msg = ''; return m ? '<div class="notice" role="status">' + esc(m) + '</div>' : ''; }
  function fld(name, lab, val, o) {
    o = o || {};
    var id = 'sf-' + name;
    var ctl = o.rows ? '<textarea id="' + id + '" name="' + name + '" rows="' + o.rows + '"' + (o.max ? ' maxlength="' + o.max + '"' : '') + (o.ph ? ' placeholder="' + esc(o.ph) + '"' : '') + '>' + esc(val) + '</textarea>'
      : '<input id="' + id + '" name="' + name + '" type="text" autocomplete="off"' + (o.max ? ' maxlength="' + o.max + '"' : '') + (o.ph ? ' placeholder="' + esc(o.ph) + '"' : '') + (o.list ? ' list="' + o.list + '"' : '') + ' value="' + esc(val) + '">';
    return '<div class="field"><label for="' + id + '">' + lab + '</label>' + ctl + (o.hint ? '<p class="hint">' + o.hint + '</p>' : '') + '</div>';
  }
  function sel(name, lab, opts, val) {
    return '<div class="field"><label for="sf-' + name + '">' + lab + '</label><select id="sf-' + name + '" name="' + name + '">' + opts.map(function (o) { return '<option value="' + esc(o[0]) + '"' + (String(o[0]) === String(val) ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('') + '</select></div>';
  }
  function answers(prefix, opts, ans, n) {
    var out = '<fieldset class="ansset"><legend>Answers <span class="muted small">(tap the circle next to the right one)</span></legend>';
    for (var i = 0; i < (n || 4); i++) {
      out += '<div class="ansrow"><input type="radio" name="' + (prefix ? 'a' + prefix : 'ans') + '" value="' + i + '" aria-label="Correct answer ' + 'ABCD'[i] + '"' + (Number(ans) === i && (opts[i] || '') ? ' checked' : '') + '>' +
        '<input type="text" name="' + prefix + 'o' + i + '" maxlength="140" autocomplete="off" aria-label="Answer ' + 'ABCD'[i] + '" placeholder="Answer ' + 'ABCD'[i] + (i > 1 ? ' (optional)' : '') + '" value="' + esc(opts[i] || '') + '"></div>';
    }
    return out + '</fieldset>';
  }
  function datalist(id, items) {
    var seen = {}; items.forEach(function (x) { if (x.cat) seen[x.cat] = 1; });
    return '<datalist id="' + id + '">' + Object.keys(seen).sort().map(function (c) { return '<option value="' + esc(c) + '">'; }).join('') + '</datalist>';
  }

  /* ---------- item forms ---------- */
  function blankRaw(type) {
    if (type === 'scenarios') return { cat: 'run', lvl: 1, sit: { inn: 3, outs: 1, b: [0, 0, 0], us: 0, them: 0, cnt: '', you: 'bat' }, q: '', opts: ['', '', '', ''], ans: 0, why: '', tip: '' };
    if (type === 'trivia') return { cat: '', q: '', opts: ['', '', '', ''], ans: 0, fact: '' };
    if (type === 'quizzes') return { title: '', desc: '', questions: [blankQ(), blankQ(), blankQ()] };
    if (type === 'kb') return { cat: '', title: '', summary: '', body: '' };
    if (type === 'glossary') return { term: '', def: '' };
    return { type: '', name: '', tagline: '', services: [], ages: '', city: '', state: '', website: '', email: '', phone: '', notes: '' };
  }
  function blankQ() { return { q: '', opts: ['', '', '', ''], ans: 0, why: '' }; }
  function hiddenBox(r) { return '<label class="check"><input type="checkbox" name="hidden"' + (r.hidden ? ' checked' : '') + '> <span>Hide this from the site (keep it here, but do not show it)</span></label>'; }

  function formHtml(type, r) {
    var h = '';
    if (type === 'trivia') {
      h = fld('q', 'Question', r.q, { max: 200 }) + answers('', r.opts, r.ans) + fld('cat', 'Category', r.cat, { max: 30, list: 'sd-cats', ph: 'Rules, History, Fun...' }) +
        fld('fact', 'Fun fact shown after answering (optional)', r.fact, { rows: 3, max: 300 }) + datalist('sd-cats', list('trivia'));
    } else if (type === 'glossary') {
      h = fld('term', 'Word or phrase', r.term, { max: 40 }) + fld('def', 'Definition', r.def, { rows: 4, max: 400, hint: 'One or two plain sentences that a 9-year-old could follow.' });
    } else if (type === 'kb') {
      h = fld('title', 'Title', r.title, { max: 80 }) + fld('cat', 'Category', r.cat, { max: 30, list: 'sd-cats', ph: 'Stats, Rules, Fielding...' }) + fld('summary', 'One-line summary (shown in the list)', r.summary, { max: 160 }) +
        fld('body', 'Article', r.body, { rows: 14, max: 6000, hint: 'Leave a blank line between paragraphs. Start a line with <b>-</b> for a bullet list, with <b>##</b> for a heading, and put <b>**double stars**</b> around bold text. Links: [words](https://example.com).' }) + datalist('sd-cats', list('kb'));
    } else if (type === 'directory') {
      var svc = Array.isArray(r.services) ? r.services.join('\n') : r.services || '';
      h = sel('type', 'What is it?', [['', 'Choose one']].concat(C.DIR_TYPES.map(function (t) { return [t.id, t.name]; })), r.type) + fld('name', 'Name', r.name, { max: 80 }) + fld('tagline', 'One-line description', r.tagline, { max: 120 }) +
        fld('services', 'Services (one per line, up to 8)', svc, { rows: 4 }) + fld('ages', 'Ages or levels', r.ages, { max: 30, ph: '8-14' }) +
        '<div class="grid2">' + fld('city', 'City', r.city, { max: 40 }) + fld('state', 'State', r.state, { max: 30, ph: 'TX' }) + '</div>' +
        fld('website', 'Website', r.website, { max: 200, ph: 'https://example.com' }) + fld('email', 'Business email', r.email, { max: 100 }) + fld('phone', 'Business phone', r.phone, { max: 25 }) +
        fld('notes', 'Notes (optional)', r.notes, { rows: 3, max: 300 }) + '<input type="hidden" name="added" value="' + esc(r.added || '') + '">';
    } else if (type === 'quizzes') {
      h = fld('title', 'Quiz title', r.title, { max: 80 }) + fld('desc', 'Short description (optional)', r.desc, { max: 160 });
      (r.questions || []).forEach(function (q, i) {
        h += '<div class="qblock"><div class="row between"><b>Question ' + (i + 1) + '</b>' + ((r.questions.length > 3) ? '<button type="button" class="link small" data-action="s-qdel" data-i="' + i + '">Remove</button>' : '') + '</div>' +
          fld('q' + i, 'Question', q.q, { max: 200 }) + answers(String(i) + '_', q.opts || [], q.ans, 4).replace(/name="a(\d+)_"/g, 'name="a$1"') + fld('w' + i, 'Why that is right (optional)', q.why, { max: 300 }) + '</div>';
      });
      h += '<button type="button" class="btn ghost block" data-action="s-qadd"' + ((r.questions || []).length >= 15 ? ' disabled' : '') + '>+ Add another question</button>';
    } else {
      var cats = Sim.CATS.map(function (c) { return [c.id, c.icon + ' ' + c.name]; });
      var s = r.sit || {}, b = s.b || [0, 0, 0];
      h = sel('cat', 'Skill area', cats, r.cat) + sel('lvl', 'Difficulty', [[1, 'Rookie'], [2, 'All-Star']], r.lvl) +
        '<fieldset class="ansset"><legend>The situation</legend>' +
        '<div class="grid2">' + sel('inn', 'Inning', [1, 2, 3, 4, 5, 6, 7].map(function (n) { return [n, String(n)]; }), s.inn) + sel('outs', 'Outs', [[0, '0'], [1, '1'], [2, '2']], s.outs) + '</div>' +
        '<div class="row wrap" style="margin:6px 0 10px"><span class="small muted">Runners on:</span>' + ['1st', '2nd', '3rd'].map(function (n, i) { return '<label class="check inline"><input type="checkbox" name="b' + i + '"' + (b[i] ? ' checked' : '') + '> <span>' + n + '</span></label>'; }).join('') + '</div>' +
        '<div class="grid2">' + fld('us', 'Our runs', s.us == null ? 0 : s.us, { max: 2 }) + fld('them', 'Their runs', s.them == null ? 0 : s.them, { max: 2 }) + '</div>' +
        fld('cnt', 'Count (balls-strikes, optional)', s.cnt || '', { max: 3, ph: '2-1' }) +
        sel('you', 'Where is the player?', Sim.POSITIONS.map(function (p) { return [p, POS_LABEL[p] || p]; }), s.you) + '</fieldset>' +
        fld('q', 'Question', r.q, { rows: 3, max: 260, ph: 'What do you do?' }) + answers('', r.opts, r.ans) +
        fld('why', 'Why that is the best play', r.why, { rows: 4, max: 420, hint: 'At least a full sentence.' }) + fld('tip', 'Short "Remember" tip', r.tip, { max: 60, ph: 'Two outs, run on contact.' });
    }
    return h;
  }

  function readForm(type, form) {
    var el = form.elements, v = function (n) { return el[n] ? el[n].value : ''; }, chk = function (n) { return !!(el[n] && el[n].checked); };
    function opts(prefix) { var o = []; for (var i = 0; i < 4; i++) o.push(v(prefix + 'o' + i)); return o; }
    var raw = { id: v('_id'), hidden: chk('hidden') };
    if (type === 'trivia') { raw.q = v('q'); raw.opts = opts(''); raw.ans = Number(v('ans') || 0); raw.cat = v('cat'); raw.fact = v('fact'); }
    else if (type === 'glossary') { raw.term = v('term'); raw.def = v('def'); }
    else if (type === 'kb') { raw.title = v('title'); raw.cat = v('cat'); raw.summary = v('summary'); raw.body = v('body'); }
    else if (type === 'directory') { ['type', 'name', 'tagline', 'services', 'ages', 'city', 'state', 'website', 'email', 'phone', 'notes', 'added'].forEach(function (k) { raw[k] = v(k); }); }
    else if (type === 'quizzes') {
      raw.title = v('title'); raw.desc = v('desc'); raw.questions = [];
      for (var i = 0; el['q' + i]; i++) raw.questions.push({ q: v('q' + i), opts: opts(String(i) + '_').length ? [0, 1, 2, 3].map(function (j) { return v(i + '_o' + j); }) : [], ans: Number(v('a' + i) || 0), why: v('w' + i) });
    } else {
      raw.cat = v('cat'); raw.lvl = Number(v('lvl')); raw.q = v('q'); raw.opts = opts(''); raw.ans = Number(v('ans') || 0); raw.why = v('why'); raw.tip = v('tip');
      raw.sit = { inn: v('inn'), outs: v('outs'), b: [chk('b0'), chk('b1'), chk('b2')], us: v('us'), them: v('them'), cnt: v('cnt').trim(), you: v('you') };
    }
    return raw;
  }

  /* ---------- views ---------- */
  function dashboard() {
    var n = totalChanges(), pv = A.preview();
    var tiles = TYPES.map(function (t) {
      var c = list(t.id).length, d = diff(t.id);
      return '<a class="cat" href="#studio/' + t.id + '"><span class="cat-ic" aria-hidden="true">' + ICON[t.id] + '</span><span class="grow"><b>' + esc(t.name) + '</b><span class="muted small">' + c + ' ' + (c === 1 ? 'item' : 'items') + (d ? ' &middot; ' + d + ' unpublished' : '') + '</span></span><span class="cat-go" aria-hidden="true">&rsaquo;</span></a>';
    }).join('');
    return msgBox() + '<section class="card hero"><p class="eyebrow">Content Studio</p><h2>Edit the site, no coding needed.</h2>' +
      '<p class="muted">Add and change trivia, quizzes, articles, glossary words, Game IQ situations and directory listings. Your edits are saved as a draft in this browser. The live site only changes when you upload the finished file (steps below).</p></section>' +
      (pv ? '<div class="notice"><b>Preview is on.</b> This device is showing your draft as if it were live. <button class="link" data-action="s-preview-off">Turn off preview</button></div>' : '') +
      '<section class="card"><h3>1. Edit</h3><div class="cats">' + tiles + '</div></section>' +
      '<section class="card"><h3>Add a listing request</h3><p class="muted">A trainer or team emailed you a request? Paste it here and it becomes a listing.</p><a class="btn ghost block" href="#studio/paste">Paste a request</a></section>' +
      '<section class="card"><h3>2. Preview</h3><p class="muted">See your draft on this device exactly as visitors will, before anyone else sees it.</p>' +
      '<button class="btn ghost block" data-action="s-preview-on">' + (pv ? 'Reload preview' : 'Preview my changes') + '</button></section>' +
      '<section class="card"><h3>3. Publish</h3>' + (n ? '<p><b>' + n + ' ' + (n === 1 ? 'change' : 'changes') + '</b> not published yet.</p>' : '<p class="muted">No unpublished changes.</p>') +
      '<button class="btn block" data-action="s-download">Download content file</button>' +
      '<ol class="steps small" style="margin-top:14px"><li><div>Open your Dugout Diary project on <b>github.com</b> and click into the <b>content</b> folder.</div></li><li><div>Click <b>Add file</b>, then <b>Upload files</b>, and drop in the file you just downloaded. Its name must stay <b>content.js</b> so it replaces the old one.</div></li><li><div>Click <b>Commit changes</b>. The live site updates within a minute or two.</div></li></ol></section>' +
      '<section class="card"><h3>Start over</h3><p class="muted">Throw away your draft and go back to what is published.</p><button class="btn danger block" data-action="s-reset">' + (st.confirm === 'reset' ? 'Tap again to discard my draft' : 'Discard my draft') + '</button></section>' + A.footer();
  }

  function itemRows(type) {
    var q = st.q.trim().toLowerCase();
    var items = list(type).filter(function (x) { return !q || label(type, x).toLowerCase().indexOf(q) >= 0; });
    if (!items.length) return '<p class="muted">' + (list(type).length ? 'Nothing matches that search.' : 'Nothing here yet. Tap Add new to start.') + '</p>';
    return '<ul class="srows">' + items.map(function (x) {
      var del = st.confirm === type + ':' + x.id;
      return '<li class="' + (x.hidden ? 'dim' : '') + '"><div class="grow"><b>' + esc(label(type, x)) + '</b>' + (x.hidden ? ' <span class="pill">hidden</span>' : '') + '</div>' +
        '<div class="row wrap"><a class="btn ghost small" href="#studio/' + type + '/edit/' + encodeURIComponent(x.id) + '">Edit</a>' +
        '<button class="btn ghost small" data-action="s-hide" data-type="' + type + '" data-id="' + esc(x.id) + '">' + (x.hidden ? 'Show' : 'Hide') + '</button>' +
        '<button class="btn danger small" data-action="s-del" data-type="' + type + '" data-id="' + esc(x.id) + '">' + (del ? 'Tap again' : 'Delete') + '</button></div></li>';
    }).join('') + '</ul>';
  }
  function listView(type) {
    var t = T(type), can = C.csvTypes().indexOf(type) >= 0;
    var csv = '';
    if (can) {
      csv = '<section class="card"><h3>Spreadsheet</h3><p class="muted">Prefer Excel or Google Sheets? Download the list as a spreadsheet, edit it there, and bring it back.</p>' +
        '<div class="row wrap"><button class="btn ghost grow" data-action="s-csv-down" data-type="' + type + '">Download list</button><button class="btn ghost grow" data-action="s-csv-tpl" data-type="' + type + '">Blank template</button></div>' +
        '<div class="field" style="margin-top:12px"><label for="s-file">Upload a spreadsheet (.csv)</label><input id="s-file" type="file" accept=".csv,text/csv,text/plain" data-sfile="' + type + '"></div>' + csvPreview(type) +
        '<p class="hint">In Excel or Sheets choose Save as / Download as <b>CSV</b>. Keep the heading row.</p></section>';
    }
    return msgBox() + back('Studio', 'studio') + '<section class="card hero"><p class="eyebrow">' + esc(t.name) + '</p><h2>' + list(type).length + ' ' + esc(list(type).length === 1 ? t.one : t.one + 's') + '</h2><p class="muted">' + esc(HELP[type]) + '</p>' +
      '<a class="btn block" href="#studio/' + type + '/edit/new">+ Add new ' + esc(t.one) + '</a></section>' +
      (list(type).length > 6 ? '<section class="card"><div class="field" style="margin:0"><label for="s-q">Search this list</label><input id="s-q" type="search" data-sin="1" autocomplete="off" value="' + esc(st.q) + '"></div></section>' : '') +
      '<section class="card"><div id="s-list">' + itemRows(type) + '</div></section>' + csv + A.footer();
  }
  function csvPreview(type) {
    var c = st.csv;
    if (!c || c.type !== type) return '';
    var bad = c.res.errors.length, ok = c.res.items.length;
    return '<div class="notice" role="status" style="margin-top:10px"><b>' + ok + ' ' + (ok === 1 ? 'row' : 'rows') + ' ready' + (bad ? ', ' + bad + ' with problems' : '') + '.</b>' +
      (bad ? '<ul class="small">' + c.res.errors.slice(0, 8).map(function (e) { return '<li>Row ' + e.row + ': ' + esc(e.msg) + '</li>'; }).join('') + (bad > 8 ? '<li>and ' + (bad - 8) + ' more</li>' : '') + '</ul>' : '') +
      (ok ? '<div class="row wrap"><button class="btn small grow" data-action="s-csv-replace">Replace the list</button><button class="btn ghost small grow" data-action="s-csv-add">Add to the list</button><button class="btn ghost small" data-action="s-csv-cancel">Cancel</button></div><p class="hint">Rows with problems are skipped. Fix them in your spreadsheet and upload again if you want them in.</p>' : '<button class="btn ghost small" data-action="s-csv-cancel">Cancel</button>') + '</div>';
  }

  function editView(type, id) {
    var isNew = id === 'new', cur = isNew ? null : list(type).filter(function (x) { return x.id === id; })[0];
    if (!isNew && !cur) return back('List', 'studio/' + type) + A.emptyState('🤔', 'Item not found', 'It may have been deleted.', '<a class="btn" href="#studio/' + type + '">Back to the list</a>');
    if (!st.edit || st.edit.type !== type || st.edit.id !== id) st.edit = { type: type, id: id, raw: JSON.parse(JSON.stringify(cur || blankRaw(type))) };
    var r = st.edit.raw, t = T(type);
    var prev = type === 'scenarios' ? '<section class="card"><p class="eyebrow">Live preview</p><div id="s-prev">' + scenarioPreview(r) + '</div></section>' : '';
    return back('List', 'studio/' + type) + '<section class="card hero"><p class="eyebrow">' + (isNew ? 'New ' : 'Edit ') + esc(t.one) + '</p><h2>' + esc((isNew ? 'Add a ' : 'Change this ') + t.one) + '</h2></section>' + prev +
      '<section class="card"><form data-form="s-item" data-type="' + type + '" novalidate><input type="hidden" name="_id" value="' + esc(isNew ? '' : id) + '">' +
      '<div class="error" data-errbox hidden role="alert"></div>' + formHtml(type, r) + hiddenBox(r) +
      '<div class="row wrap" style="margin-top:14px"><button class="btn grow" type="submit">Save</button><a class="btn ghost grow" href="#studio/' + type + '">Cancel</a></div></form></section>';
  }

  function scenarioPreview(raw) {
    try {
      var res = C.clean('scenarios', raw, {}), it = res.item;
      var opts = (it.opts || []).map(function (o, k) { return '<div class="opt' + (k === it.ans ? ' right' : '') + '" style="cursor:default"><b>' + 'ABCD'[k] + '</b><span>' + esc(o) + '</span></div>'; }).join('');
      return A.scoreboard(it.sit) + A.diamondSvg(it.sit) + '<h3 class="sim-q">' + esc(it.q || 'Your question appears here') + '</h3><div class="opts">' + opts + '</div>' +
        (res.errors.length ? '<p class="hint" style="color:var(--gold)">Still to do: ' + esc(res.errors[0]) + '</p>' : '<p class="hint">Looks good. The green answer is the best play.</p>');
    } catch (e) { return '<p class="muted">Preview unavailable.</p>'; }
  }

  function pasteView() {
    return msgBox() + back('Studio', 'studio') + '<section class="card hero"><p class="eyebrow">Listing request</p><h2>Paste a request</h2><p class="muted">Paste the whole email a trainer or team sent. We will turn it into a listing you can check before it goes live.</p></section>' +
      '<section class="card"><form data-form="s-paste" novalidate><div class="error" data-errbox hidden role="alert"></div><div class="field"><label for="s-paste">Request text</label><textarea id="s-paste" name="text" rows="12" placeholder="DUGOUT DIARY LISTING REQUEST&#10;Type: trainer&#10;Name: ...">' + esc(st.paste) + '</textarea></div>' +
      '<button class="btn block" type="submit">Create the listing</button></form></section>';
  }

  A.ext.views.studio = function (p, sub) {
    var s = sub[0] || '';
    if (sub[1] !== 'edit') st.edit = null;
    load();
    if (s === 'paste') return pasteView();
    if (T(s)) { if (sub[1] === 'edit' && sub[2]) return editView(s, sub[2]); return listView(s); }
    return dashboard();
  };

  /* ---------- actions ---------- */
  var X = A.ext.actions;
  function download(name, text, mime) {
    var blob = new Blob([text], { type: mime || 'text/plain' }), url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = url; a.download = name; document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 500);
  }
  X['s-download'] = function () {
    var W = load(); W.updated = today(); saveDraft();
    download('content.js', C.toFile(W), 'text/javascript');
    st.msg = 'Downloaded content.js. Now upload it to the content folder on GitHub (steps 3 below).'; A.render();
  };
  X['s-csv-down'] = function (el) { var t = el.dataset.type; if (C.csvTypes().indexOf(t) < 0) return; download(t + '.csv', C.toCsv(t, list(t)), 'text/csv'); };
  X['s-csv-tpl'] = function (el) { var t = el.dataset.type; if (C.csvTypes().indexOf(t) < 0) return; download(t + '-template.csv', C.templateCsv(t), 'text/csv'); };
  X['s-csv-cancel'] = function () { st.csv = null; A.render(); };
  function applyCsv(replace) {
    var c = st.csv; if (!c || !c.res.items.length) return;
    var W = load(), type = c.type, items = c.res.items;
    if (replace) W[type] = items.slice(0, C.LIMITS[type]);
    else {
      var byId = {}; W[type].forEach(function (x, i) { byId[x.id] = i; });
      items.forEach(function (x) { if (byId[x.id] != null) W[type][byId[x.id]] = x; else W[type].push(x); });
      W[type] = W[type].slice(0, C.LIMITS[type]);
    }
    var re = C.normalize(W); st.W = re.content; saveDraft();
    st.msg = 'Imported ' + items.length + (items.length === 1 ? ' row.' : ' rows.') + ' Not live until you publish.'; st.csv = null; A.render();
  }
  X['s-csv-replace'] = function () { applyCsv(true); };
  X['s-csv-add'] = function () { applyCsv(false); };
  X['s-hide'] = function (el) {
    var it = list(el.dataset.type).filter(function (x) { return x.id === el.dataset.id; })[0]; if (!it) return;
    if (it.hidden) delete it.hidden; else it.hidden = true; saveDraft(); A.render();
  };
  X['s-del'] = function (el) {
    var key = el.dataset.type + ':' + el.dataset.id;
    if (st.confirm !== key) { st.confirm = key; A.render(); return; }
    var W = load(); W[el.dataset.type] = W[el.dataset.type].filter(function (x) { return x.id !== el.dataset.id; });
    st.confirm = ''; saveDraft(); st.msg = 'Deleted. You can discard your draft from the Studio home to undo everything since the last publish.'; A.render();
  };
  X['s-preview-on'] = function () {
    if (!ls) return; saveDraft();
    try { ls.setItem(C.PREVIEW_KEY, '1'); } catch (e) { return; }
    location.hash = 'studio'; location.reload();
  };
  X['s-preview-off'] = function () { try { ls.removeItem(C.PREVIEW_KEY); } catch (e) { /* ignore */ } location.reload(); };
  X['s-reset'] = function () {
    if (st.confirm !== 'reset') { st.confirm = 'reset'; A.render(); return; }
    try { ls.removeItem(C.DRAFT_KEY); ls.removeItem(C.PREVIEW_KEY); } catch (e) { /* ignore */ }
    st.confirm = ''; location.hash = 'studio'; location.reload();
  };
  function reread() { var f = document.querySelector('form[data-form="s-item"]'); if (f && st.edit) st.edit.raw = readForm(st.edit.type, f); }
  X['s-qadd'] = function () { reread(); if (st.edit.raw.questions.length < 15) st.edit.raw.questions.push(blankQ()); A.render(); };
  X['s-qdel'] = function (el) { reread(); st.edit.raw.questions.splice(Number(el.dataset.i), 1); A.render(); };

  var F = A.ext.forms;
  F['s-item'] = function (form) {
    var type = form.dataset.type, box = form.querySelector('[data-errbox]');
    if (!T(type)) return;
    var raw = readForm(type, form), W = load(), id = raw.id;
    if (type === 'directory' && !raw.added) raw.added = today();
    var res = C.clean(type, raw, takenIds(type, id));
    if (res.errors.length) {
      box.hidden = false; box.innerHTML = res.errors.length === 1 ? esc(res.errors[0]) : '<ul>' + res.errors.map(function (e) { return '<li>' + esc(e) + '</li>'; }).join('') + '</ul>';
      box.scrollIntoView({ block: 'center', behavior: 'smooth' }); return;
    }
    var i = -1; W[type].forEach(function (x, k) { if (x.id === id) i = k; });
    if (i >= 0) W[type][i] = res.item; else { if (W[type].length >= C.LIMITS[type]) { box.hidden = false; box.textContent = 'This list is full (' + C.LIMITS[type] + ' items).'; return; } W[type].push(res.item); }
    st.edit = null; saveDraft(); st.msg = 'Saved. Not live until you publish.'; location.hash = 'studio/' + type;
  };
  F['s-paste'] = function (form) {
    var box = form.querySelector('[data-errbox]'), text = form.elements.text.value; st.paste = text;
    function fail(m) { box.hidden = false; box.textContent = m; }
    if (!/\S/.test(text)) return fail('Paste the request first.');
    var raw = C.parseRequest(text), W = load(), res = C.clean('directory', raw, takenIds('directory', ''));
    if (res.errors.length) return fail(res.errors[0] + ' (Check the text you pasted has the Type and Name lines.)');
    res.item.added = today(); res.item.hidden = true; W.directory.push(res.item); st.paste = ''; saveDraft();
    st.msg = 'Added "' + res.item.name + '" as a hidden listing. Check it, then tap Show to make it visible.'; location.hash = 'studio/directory';
  };

  document.addEventListener('input', function (e) {
    var t = e.target; if (!t || !t.closest) return;
    if (t.closest('[data-sin]')) { st.q = t.value; var m = /^studio\/([a-z]+)/.exec((location.hash || '').slice(1)), box = document.getElementById('s-list'); if (m && box) box.innerHTML = itemRows(m[1]); return; }
    var f = t.closest('form[data-form="s-item"]');
    if (f && f.dataset.type === 'scenarios') { var pv = document.getElementById('s-prev'); if (pv) pv.innerHTML = scenarioPreview(readForm('scenarios', f)); }
  });
  document.addEventListener('change', function (e) {
    var t = e.target; if (!t || !t.closest) return;
    var f = t.closest('form[data-form="s-item"]');
    if (f && f.dataset.type === 'scenarios') { var pv = document.getElementById('s-prev'); if (pv) pv.innerHTML = scenarioPreview(readForm('scenarios', f)); }
    var inp = t.closest('[data-sfile]');
    if (inp && inp.files && inp.files[0]) {
      var type = inp.dataset.sfile, file = inp.files[0], rd = new FileReader();
      if (file.size > 2000000) { st.msg = 'That file is too big.'; A.render(); return; }
      rd.onload = function () { st.csv = { type: type, res: C.fromCsv(type, String(rd.result), list(type)) }; A.render(); };
      rd.onerror = function () { st.msg = 'Could not read that file.'; A.render(); };
      rd.readAsText(file);
    }
  });
  window.addEventListener('hashchange', function () { st.confirm = ''; if (!/^#studio/.test(location.hash)) st.q = ''; });

  A.render();
})();
