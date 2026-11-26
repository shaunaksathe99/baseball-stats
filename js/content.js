/* Plate 450 Diary - editable content: schema, cleaning, spreadsheet import/export, safe text formatting.
   No DOM access, so it is unit tested in Node. The Content Studio (#studio) is the friendly editor for all of this. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./sim.js'));
  else root.Content = factory(root.Sim);
})(typeof self !== 'undefined' ? self : this, function (Sim) {
  'use strict';

  var TYPES = [
    { id: 'scenarios', name: 'Game IQ situations', one: 'situation', prefix: '' },
    { id: 'trivia', name: 'Trivia', one: 'trivia question', prefix: 'tv' },
    { id: 'quizzes', name: 'Quizzes', one: 'quiz', prefix: 'qz' },
    { id: 'kb', name: 'Knowledge base', one: 'article', prefix: 'kb' },
    { id: 'glossary', name: 'Glossary', one: 'term', prefix: 'gl' },
    { id: 'directory', name: 'Directory', one: 'listing', prefix: 'dr' }
  ];
  var DIR_TYPES = [
    { id: 'trainer', name: 'Trainers & instructors' },
    { id: 'coach', name: 'Coaches & clinics' },
    { id: 'team', name: 'Travel ball teams' },
    { id: 'facility', name: 'Training facilities' }
  ];
  var LIMITS = { scenarios: 400, trivia: 600, quizzes: 100, kb: 300, glossary: 600, directory: 1000 };

  /* ---------- small helpers ---------- */
  function str(v, max) {
    return String(v == null ? '' : v).replace(/\r\n?/g, '\n').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f<>]/g, '').replace(/\u2028|\u2029/g, '\n').trim().slice(0, max);
  }
  function line(v, max) { return str(v, max * 2).replace(/\s*\n\s*/g, ' ').trim().slice(0, max); }
  function int(v, lo, hi) { var n = Math.floor(Number(v)); if (!isFinite(n)) n = lo; return Math.max(lo, Math.min(hi, n)); }
  function truthy(v) { return v === true || /^(true|yes|y|1|x)$/i.test(String(v == null ? '' : v).trim()); }
  function slug(s) { return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40); }
  function validId(id) { return typeof id === 'string' && /^[a-z0-9_-]{2,40}$/.test(id); }
  function newId(prefix, taken, mode) {
    var n = 1, id;
    do { id = (mode === 'num' ? prefix + n : prefix + '-' + n); n++; } while (taken[id]);
    return id;
  }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); }
  function dirType(id) { for (var i = 0; i < DIR_TYPES.length; i++) if (DIR_TYPES[i].id === id) return DIR_TYPES[i]; return null; }

  /* ---------- answers shared by scenarios, trivia and quizzes ---------- */
  function cleanAnswers(raw, errs, min) {
    var list = Array.isArray(raw.opts) ? raw.opts : [];
    var all = list.slice(0, 6).map(function (o) { return line(o, 140); });
    var ansIdx = int(raw.ans, 0, 9), right = all[ansIdx] || '';
    var opts = all.filter(Boolean);
    if (opts.length < min) errs.push('Add at least ' + min + ' answers.');
    if (opts.length > 4) { errs.push('Use no more than 4 answers.'); opts = opts.slice(0, 4); }
    if (opts.length >= min && !right) errs.push('Choose which answer is correct.');
    if (opts.length && new Set(opts).size !== opts.length) errs.push('Each answer must be different.');
    return { opts: opts, ans: Math.max(0, opts.indexOf(right)) };
  }

  /* ---------- per-type cleaners: return { item, errors } ---------- */
  function cleanScenario(raw, taken) {
    var errs = [], r = raw || {}, sit = r.sit || {};
    var cat = Sim.catOf(r.cat) ? r.cat : '';
    if (!cat) errs.push('Pick a skill area.');
    var b = [0, 1, 2].map(function (i) { return Array.isArray(sit.b) ? (truthy(sit.b[i]) ? 1 : 0) : 0; });
    var cnt = '';
    if (sit.cnt && /^[0-3]-[0-2]$/.test(String(sit.cnt))) cnt = String(sit.cnt);
    else if (sit.cnt) errs.push('The count must look like 2-1 (balls-strikes), with at most 3 balls and 2 strikes.');
    var you = Sim.POSITIONS.indexOf(sit.you) >= 0 ? sit.you : '';
    if (!you) errs.push('Choose where the player is.');
    else if (['1', '2', '3'].indexOf(you) >= 0 && !b[Number(you) - 1]) errs.push('The player is a base runner, so put a runner on that base.');
    var q = line(r.q, 260);
    if (!q) errs.push('Type the question.');
    var a = cleanAnswers(r, errs, 3);
    var why = str(r.why, 420);
    if (why.length < 40) errs.push('Explain why it is the best play (at least a sentence, 40 or more characters).');
    var tip = line(r.tip, 60);
    if (!tip) errs.push('Add a short "Remember" tip (60 characters or less).');
    var id = typeof r.id === 'string' && /^[a-z]{2,4}\d{1,3}$/.test(r.id) && !taken[r.id] ? r.id : '';
    if (!id && cat) { var n = 1; while (taken[cat + n]) n++; id = cat + n; }
    var item = { id: id, cat: cat, lvl: levelOf(r.lvl), sit: { inn: int(sit.inn, 1, 7), outs: int(sit.outs, 0, 2), b: b, us: int(sit.us, 0, 30), them: int(sit.them, 0, 30), cnt: cnt, you: you }, q: q, opts: a.opts, ans: a.ans, why: why, tip: tip };
    if (truthy(r.hidden)) item.hidden = true;
    if (!errs.length && Sim) { var probs = Sim.validate([item]); if (probs.length) errs.push('Something is off with this situation: ' + probs[0].replace(/^[a-z0-9]+: /, '') + '.'); }
    return { item: item, errors: errs };
  }

  // League level: A = 1, AA = 2, AAA = 3. Accepts 'A', 'aa', 'AAA', 1, 2, 3. Anything else becomes A.
  function levelOf(v) {
    var s = String(v == null ? '' : v).trim().toUpperCase();
    if (s === 'AAA' || s === '3') return 3;
    if (s === 'AA' || s === '2') return 2;
    return 1;
  }
  var LEVELS = { 1: 'A', 2: 'AA', 3: 'AAA' };

  function cleanTrivia(raw, taken) {
    var errs = [], r = raw || {};
    var q = line(r.q, 200);
    if (!q) errs.push('Type the question.');
    var a = cleanAnswers(r, errs, 2);
    var id = validId(r.id) && !taken[r.id] ? r.id : newId('tv', taken, 'num');
    var item = { id: id, cat: line(r.cat, 30) || 'General', lvl: levelOf(r.lvl), q: q, opts: a.opts, ans: a.ans, fact: str(r.fact, 300) };
    if (truthy(r.hidden)) item.hidden = true;
    return { item: item, errors: errs };
  }

  function cleanQuiz(raw, taken) {
    var errs = [], r = raw || {};
    var title = line(r.title, 80);
    if (!title) errs.push('Give the quiz a title.');
    var qs = [];
    (Array.isArray(r.questions) ? r.questions : []).slice(0, 15).forEach(function (x, i) {
      var qe = [], q = line(x && x.q, 200);
      if (!q) qe.push('type the question');
      var a = cleanAnswers(x || {}, qe, 2);
      if (qe.length) errs.push('Question ' + (i + 1) + ': ' + qe.join(', ').replace(/\.,/g, ',').replace(/\.$/, '').toLowerCase() + '.');
      else qs.push({ q: q, opts: a.opts, ans: a.ans, why: str(x.why, 300) });
    });
    if (qs.length < 3 && !errs.length) errs.push('A quiz needs at least 3 questions.');
    var id = validId(r.id) && !taken[r.id] ? r.id : newId('qz', taken, 'num');
    var item = { id: id, title: title, desc: line(r.desc, 160), questions: qs };
    if (truthy(r.hidden)) item.hidden = true;
    return { item: item, errors: errs };
  }

  function cleanArticle(raw, taken) {
    var errs = [], r = raw || {};
    var title = line(r.title, 80), body = str(r.body, 6000);
    if (!title) errs.push('Give the article a title.');
    if (body.length < 20) errs.push('The article text is too short.');
    var id = validId(r.id) && !taken[r.id] ? r.id : '';
    if (!id) { var base = slug(title) || 'article'; id = base; var n = 2; while (taken[id]) id = base + '-' + n++; }
    var item = { id: id, cat: line(r.cat, 30) || 'General', title: title, summary: line(r.summary, 160), body: body };
    if (truthy(r.hidden)) item.hidden = true;
    return { item: item, errors: errs };
  }

  function cleanTerm(raw, taken) {
    var errs = [], r = raw || {};
    var term = line(r.term, 40), def = str(r.def, 400);
    if (!term) errs.push('Type the word or phrase.');
    if (!def) errs.push('Type the definition.');
    var id = validId(r.id) && !taken[r.id] ? r.id : '';
    if (!id) { var base = slug(term) || 'term'; id = base; var n = 2; while (taken[id]) id = base + '-' + n++; }
    var item = { id: id, term: term, def: def };
    if (truthy(r.hidden)) item.hidden = true;
    return { item: item, errors: errs };
  }

  function cleanListing(raw, taken) {
    var errs = [], r = raw || {};
    var type = dirType(String(r.type || '').toLowerCase()) ? String(r.type).toLowerCase() : '';
    if (!type) errs.push('Choose what kind of listing this is.');
    var name = line(r.name, 80);
    if (!name) errs.push('Type the name of the business, coach or team.');
    var svc = Array.isArray(r.services) ? r.services : String(r.services || '').split(/\n|;/);
    var services = svc.map(function (s) { return line(String(s).replace(/^[-*\u2022]\s*/, ''), 80); }).filter(Boolean).slice(0, 8);
    var site = line(r.website, 200);
    if (site && !/^https?:\/\//i.test(site) && /^[a-z0-9][a-z0-9.-]+\.[a-z]{2,}(\/\S*)?$/i.test(site)) site = 'https://' + site;
    if (site && !/^https?:\/\/[^\s/$.?#][^\s]*$/i.test(site)) { errs.push('The website must be a full address like https://example.com.'); site = ''; }
    var email = line(r.email, 100).toLowerCase();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { errs.push('That email address does not look right.'); email = ''; }
    var phone = line(r.phone, 25);
    if (phone && !/^[0-9()+\-. xXtT]{7,25}$/.test(phone)) { errs.push('The phone number should only use digits, spaces, dashes and parentheses.'); phone = ''; }
    if (!site && !email && !phone && !errs.length) errs.push('Add at least one way to reach you: website, email or phone.');
    var st = line(r.state, 30); if (/^[a-z]{2}$/i.test(st)) st = st.toUpperCase();
    var zip = line(r.zip, 12).replace(/\s+/g, '');
    if (zip && !/^\d{5}$/.test(zip)) { errs.push('The ZIP code must be 5 digits.'); zip = ''; }
    var areaRaw = Array.isArray(r.areas) ? r.areas : String(r.areas || '').split(/[;,\n ]+/), areas = [];
    areaRaw.forEach(function (z) { z = String(z).trim(); if (/^\d{5}$/.test(z) && z !== zip && areas.indexOf(z) < 0 && areas.length < 8) areas.push(z); });
    var id = validId(r.id) && !taken[r.id] ? r.id : newId('dr', taken, 'num');
    var added = /^\d{4}-\d{2}-\d{2}$/.test(String(r.added || '')) ? String(r.added) : '';
    var item = { id: id, type: type, name: name, tagline: line(r.tagline, 120), services: services, ages: line(r.ages, 30), city: line(r.city, 40), state: st, zip: zip, areas: areas, website: site, email: email, phone: phone, notes: str(r.notes, 300), added: added };
    if (truthy(r.hidden)) item.hidden = true;
    if (truthy(r.featured)) item.featured = true;
    return { item: item, errors: errs };
  }

  var CLEANERS = { scenarios: cleanScenario, trivia: cleanTrivia, quizzes: cleanQuiz, kb: cleanArticle, glossary: cleanTerm, directory: cleanListing };
  function clean(type, raw, taken) { return CLEANERS[type](raw, taken || {}); }

  function label(type, item, i) {
    var t = item && (item.title || item.name || item.term || item.q);
    return TYPES.filter(function (x) { return x.id === type; })[0].one.replace(/^./, function (c) { return c.toUpperCase(); }) + ' ' + (i + 1) + (t ? ' (' + String(t).slice(0, 40) + ')' : '');
  }

  function emptyContent() { return { version: 1, updated: '', scenarios: [], trivia: [], quizzes: [], kb: [], glossary: [], directory: [] }; }

  // Cleans a whole content object. Bad items are skipped and reported, so one mistake never breaks the site.
  function normalize(raw) {
    var out = emptyContent(), warnings = [];
    raw = raw && typeof raw === 'object' ? raw : {};
    out.updated = /^\d{4}-\d{2}-\d{2}$/.test(String(raw.updated || '')) ? String(raw.updated) : '';
    TYPES.forEach(function (T) {
      var list = Array.isArray(raw[T.id]) ? raw[T.id] : [], taken = {};
      if (list.length > LIMITS[T.id]) warnings.push(T.name + ': only the first ' + LIMITS[T.id] + ' items are used.');
      list.slice(0, LIMITS[T.id]).forEach(function (x, i) {
        var dupe = x && typeof x === 'object' && typeof x.id === 'string' && taken[x.id];
        var r = clean(T.id, x, taken);
        if (dupe) { warnings.push(label(T.id, r.item, i) + ' skipped: its id is used twice.'); return; }
        if (r.errors.length) { warnings.push(label(T.id, r.item, i) + ' skipped: ' + r.errors[0]); return; }
        taken[r.item.id] = 1; out[T.id].push(r.item);
      });
    });
    return { content: out, warnings: warnings };
  }
  function visible(list) { return (list || []).filter(function (x) { return !x.hidden; }); }

  /* ---------- the file that gets uploaded to GitHub ---------- */
  function toFile(content) {
    var c = normalize(content).content;
    return '/* Plate 450 Diary content. Do not edit by hand: use the Content Studio (#studio on the site), download this file, and upload it to the content folder on GitHub. */\n' +
      '(function (r) { r.DD_CONTENT = ' + JSON.stringify(c, null, 1).replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029') + '; })(typeof window !== "undefined" ? window : (typeof module === "object" && module.exports ? module.exports : this));\n';
  }

  /* ---------- spreadsheet (CSV) import and export ---------- */
  function parseCsv(text) {
    text = String(text == null ? '' : text).replace(/^\uFEFF/, '');
    var firstLine = text.split(/\r?\n/)[0] || '';
    var delim = (firstLine.split(';').length > firstLine.split(',').length) ? ';' : ',';
    var rows = [], row = [], cur = '', q = false, i, c;
    for (i = 0; i < text.length; i++) {
      c = text[i];
      if (q) {
        if (c === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += c;
      } else if (c === '"') q = true;
      else if (c === delim) { row.push(cur); cur = ''; }
      else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(cur); cur = ''; rows.push(row); row = []; }
      else cur += c;
    }
    if (cur !== '' || row.length) { row.push(cur); rows.push(row); }
    return rows.filter(function (r) { return r.some(function (x) { return String(x).trim() !== ''; }); });
  }
  function stringifyCsv(rows) {
    return '\uFEFF' + rows.map(function (r) { return r.map(function (x) { x = x == null ? '' : String(x); return /[",\n\r]/.test(x) ? '"' + x.replace(/"/g, '""') + '"' : x; }).join(','); }).join('\r\n') + '\r\n';
  }
  function norm(h) { return String(h || '').toLowerCase().replace(/[^a-z0-9]/g, ''); }

  var COLS = {
    trivia: ['ID', 'Category', 'Level (A/AA/AAA)', 'Question', 'Answer A', 'Answer B', 'Answer C', 'Answer D', 'Correct answer (A-D)', 'Fun fact', 'Hide (yes/no)'],
    glossary: ['Term', 'Definition', 'Hide (yes/no)'],
    kb: ['ID', 'Category', 'Title', 'Summary', 'Article text', 'Hide (yes/no)'],
    directory: ['ID', 'Type (trainer/coach/team/facility)', 'Name', 'Tagline', 'Services (separate with ;)', 'Ages', 'City', 'State', 'ZIP', 'Also serves ZIPs (separate with ;)', 'Website', 'Email', 'Phone', 'Notes', 'Featured (yes/no)', 'Hide (yes/no)'],
    quizzes: ['Quiz title', 'Quiz description', 'Question', 'Answer A', 'Answer B', 'Answer C', 'Answer D', 'Correct answer (A-D)', 'Explanation', 'Hide quiz (yes/no)']
  };
  function csvTypes() { return Object.keys(COLS); }
  function letter(i) { return 'ABCD'.charAt(i); }

  function toCsv(type, items) {
    var rows = [COLS[type]];
    (items || []).forEach(function (x) {
      var h = x.hidden ? 'yes' : '';
      if (type === 'trivia') rows.push([x.id, x.cat, LEVELS[x.lvl] || 'A', x.q, x.opts[0] || '', x.opts[1] || '', x.opts[2] || '', x.opts[3] || '', letter(x.ans), x.fact, h]);
      else if (type === 'glossary') rows.push([x.term, x.def, h]);
      else if (type === 'kb') rows.push([x.id, x.cat, x.title, x.summary, x.body, h]);
      else if (type === 'directory') rows.push([x.id, x.type, x.name, x.tagline, x.services.join('; '), x.ages, x.city, x.state, x.zip || '', (x.areas || []).join('; '), x.website, x.email, x.phone, x.notes, x.featured ? 'yes' : '', h]);
      else if (type === 'quizzes') x.questions.forEach(function (q, i) { rows.push([x.title, i ? '' : x.desc, q.q, q.opts[0] || '', q.opts[1] || '', q.opts[2] || '', q.opts[3] || '', letter(q.ans), q.why, i ? '' : h]); });
    });
    return stringifyCsv(rows);
  }
  function templateCsv(type) {
    var sample = {
      trivia: [['', 'History', 'AA', 'Who was nicknamed the Iron Horse?', 'Lou Gehrig', 'Babe Ruth', 'Ty Cobb', '', 'A', 'He played 2,130 straight games.', '']],
      glossary: [['Walk-off', 'A hit or run that ends the game in the home team\'s last turn at bat.', '']],
      kb: [['', 'Rules', 'What is a balk?', 'An illegal move by the pitcher.', 'A balk happens when the pitcher makes an illegal motion with runners on base.\n\nEvery runner moves up one base.', '']],
      directory: [['', 'trainer', 'Pro Swing Academy', 'Hitting lessons for ages 7 to 14', 'Private hitting lessons; Small group clinics', '7-14', 'Austin', 'TX', '78701', '78702; 78703', 'https://example.com', 'info@example.com', '', '', '', '']],
      quizzes: [['Baseball Basics', 'Five easy questions', 'How many strikes make an out?', '2', '3', '4', '', 'B', 'Three strikes and you are out.', '']]
    };
    var rows = [COLS[type]].concat(sample[type] || []);
    return stringifyCsv(rows);
  }

  var KEYMAP = {
    trivia: { id: 'id', category: 'cat', levelaaaaaa: 'lvl', level: 'lvl', question: 'q', answera: 'a0', answerb: 'a1', answerc: 'a2', answerd: 'a3', correctanswerad: 'correct', correct: 'correct', funfact: 'fact', hideyesno: 'hidden', hide: 'hidden' },
    glossary: { term: 'term', definition: 'def', hideyesno: 'hidden', hide: 'hidden' },
    kb: { id: 'id', category: 'cat', title: 'title', summary: 'summary', articletext: 'body', text: 'body', body: 'body', hideyesno: 'hidden', hide: 'hidden' },
    directory: { id: 'id', typetrainercoachteamfacility: 'type', type: 'type', name: 'name', tagline: 'tagline', servicesseparatewith: 'services', services: 'services', ages: 'ages', city: 'city', state: 'state', zip: 'zip', zipcode: 'zip', alsoservszipsseparatewith: 'areas', alsoserveszipsseparatewith: 'areas', website: 'website', email: 'email', phone: 'phone', notes: 'notes', featuredyesno: 'featured', featured: 'featured', hideyesno: 'hidden', hide: 'hidden' },
    quizzes: { quiztitle: 'title', title: 'title', quizdescription: 'desc', description: 'desc', question: 'q', answera: 'a0', answerb: 'a1', answerc: 'a2', answerd: 'a3', correctanswerad: 'correct', correct: 'correct', explanation: 'why', hidequizyesno: 'hidden', hide: 'hidden' }
  };

  function fromCsv(type, text, existing) {
    var rows = parseCsv(text), errors = [], items = [];
    if (rows.length < 2) return { items: [], errors: [{ row: 1, msg: 'The file has no rows. Use the blank template and keep the first row of headings.' }] };
    var map = KEYMAP[type], head = rows[0].map(function (h) { return map[norm(h)] || ''; });
    var need = type === 'glossary' ? ['term', 'def'] : type === 'quizzes' ? ['title', 'q'] : type === 'trivia' ? ['q'] : type === 'kb' ? ['title', 'body'] : ['name'];
    var missing = need.filter(function (k) { return head.indexOf(k) < 0; });
    if (missing.length) return { items: [], errors: [{ row: 1, msg: 'The first row must contain the column headings from the template. Missing: ' + missing.join(', ') + '.' }] };
    var taken = {}; (existing || []).forEach(function (x) { taken[x.id] = 1; });
    var objs = rows.slice(1).map(function (r, i) {
      var o = { _row: i + 2 };
      head.forEach(function (k, j) { if (k) o[k] = r[j] == null ? '' : r[j]; });
      return o;
    });
    function ansFrom(o) {
      var opts = [o.a0, o.a1, o.a2, o.a3].map(function (x) { return x || ''; });
      var L = String(o.correct || '').trim().toUpperCase().charAt(0), idx = 'ABCD'.indexOf(L);
      return { opts: opts, ans: idx < 0 ? 9 : idx };
    }
    if (type === 'quizzes') {
      var groups = [], byTitle = {};
      objs.forEach(function (o) {
        var t = String(o.title || '').trim() || (groups.length ? groups[groups.length - 1].title : '');
        if (!t) { errors.push({ row: o._row, msg: 'Missing the quiz title.' }); return; }
        if (!byTitle[t]) { byTitle[t] = { title: t, desc: o.desc || '', hidden: truthy(o.hidden), questions: [], row: o._row }; groups.push(byTitle[t]); }
        var a = ansFrom(o);
        byTitle[t].questions.push({ q: o.q, opts: a.opts, ans: a.ans, why: o.why, _row: o._row });
      });
      groups.forEach(function (g) {
        var r = cleanQuiz(g, taken);
        if (r.errors.length) { errors.push({ row: g.row, msg: 'Quiz "' + g.title + '": ' + r.errors[0] }); return; }
        taken[r.item.id] = 1; items.push(r.item);
      });
      return { items: items, errors: errors };
    }
    objs.forEach(function (o) {
      var raw = Object.assign({}, o);
      if (type === 'trivia') { var a = ansFrom(o); raw.opts = a.opts; raw.ans = a.ans; }
      var upd = raw.id && existing && existing.some(function (x) { return x.id === raw.id; });
      var tk = Object.assign({}, taken); if (upd) delete tk[raw.id];
      var r = clean(type, raw, tk);
      if (r.errors.length) { errors.push({ row: o._row, msg: r.errors[0] }); return; }
      taken[r.item.id] = 1; items.push(r.item);
    });
    return { items: items, errors: errors };
  }

  /* ---------- listing request (what a trainer emails us) ---------- */
  function buildRequest(l) {
    var t = dirType(l.type);
    return ['PLATE 450 DIARY LISTING REQUEST',
      'Type: ' + (t ? t.id : l.type || ''), 'Name: ' + (l.name || ''), 'Tagline: ' + (l.tagline || ''),
      'Services:'].concat((l.services || []).map(function (s) { return '- ' + s; })).concat([
      'Ages: ' + (l.ages || ''), 'City: ' + (l.city || ''), 'State: ' + (l.state || ''), 'ZIP: ' + (l.zip || ''), 'Also serves ZIPs: ' + (Array.isArray(l.areas) ? l.areas.join(', ') : (l.areas || '')), 'Website: ' + (l.website || ''),
      'Email: ' + (l.email || ''), 'Phone: ' + (l.phone || ''), 'Notes: ' + (l.notes || ''), '',
      'I confirm that I am 18 or older, that this is my own business, team or program, and that this information may be published on Plate 450 Diary.']).join('\n');
  }
  function parseRequest(text) {
    var o = { services: [] }, inSvc = false;
    String(text || '').split(/\r?\n/).forEach(function (ln) {
      var m = /^\s*([A-Za-z ]{2,20}):\s*(.*)$/.exec(ln), b = /^\s*[-*\u2022]\s+(.*)$/.exec(ln);
      if (b && inSvc) { o.services.push(b[1]); return; }
      if (!m) return;
      var k = m[1].toLowerCase().trim(), v = m[2].trim();
      inSvc = k === 'services';
      if (k === 'services' && v) o.services.push(v);
      else if (['type', 'name', 'tagline', 'ages', 'city', 'state', 'zip', 'website', 'email', 'phone', 'notes'].indexOf(k) >= 0) o[k] = v;
      else if (k === 'also serves zips') o.areas = v;
    });
    var t = String(o.type || '').toLowerCase();
    if (!dirType(t)) { var hit = DIR_TYPES.filter(function (d) { return t && (d.name.toLowerCase().indexOf(t) >= 0 || t.indexOf(d.id) >= 0); })[0]; o.type = hit ? hit.id : ''; } else o.type = t;
    return o;
  }

  /* ---------- safe article formatting: paragraphs, bullets, ## headings, **bold**, [links](https://...) ---------- */
  function inline(s) {
    s = esc(s);
    s = s.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/\[([^\]\n]+)\]\((https?:\/\/[^\s)]+)\)/g, function (m, t, u) { return '<a href="' + u + '" target="_blank" rel="noopener noreferrer nofollow">' + t + '</a>'; });
    return s;
  }
  function md(text) {
    return String(text || '').replace(/\r\n?/g, '\n').split(/\n{2,}/).map(function (blk) {
      var lines = blk.split('\n').filter(function (l) { return l.trim() !== ''; });
      if (!lines.length) return '';
      if (lines.every(function (l) { return /^\s*[-*]\s+/.test(l); })) return '<ul>' + lines.map(function (l) { return '<li>' + inline(l.replace(/^\s*[-*]\s+/, '')) + '</li>'; }).join('') + '</ul>';
      if (/^##\s+/.test(lines[0]) && lines.length === 1) return '<h4>' + inline(lines[0].replace(/^##\s+/, '')) + '</h4>';
      return '<p>' + lines.map(inline).join('<br>') + '</p>';
    }).join('');
  }

  /* ---------- which content is active (published file, or the owner's preview draft) ---------- */
  var DRAFT_KEY = 'dugoutDiary.studio.v1', PREVIEW_KEY = 'dugoutDiary.preview';
  function readDraft(storage) {
    try { var raw = storage.getItem(DRAFT_KEY); return raw ? normalize(JSON.parse(raw)).content : null; } catch (e) { return null; }
  }
  function previewOn(storage) { try { return storage.getItem(PREVIEW_KEY) === '1' && !!storage.getItem(DRAFT_KEY); } catch (e) { return false; } }
  function active(published, storage) {
    var base = normalize(published).content;
    if (storage && previewOn(storage)) { var d = readDraft(storage); if (d) return { content: d, preview: true }; }
    return { content: base, preview: false };
  }

  return {
    TYPES: TYPES, LEVELS: LEVELS, levelOf: levelOf, DIR_TYPES: DIR_TYPES, LIMITS: LIMITS, DRAFT_KEY: DRAFT_KEY, PREVIEW_KEY: PREVIEW_KEY,
    clean: clean, normalize: normalize, visible: visible, emptyContent: emptyContent, toFile: toFile, dirType: dirType,
    parseCsv: parseCsv, stringifyCsv: stringifyCsv, csvTypes: csvTypes, toCsv: toCsv, fromCsv: fromCsv, templateCsv: templateCsv,
    buildRequest: buildRequest, parseRequest: parseRequest, md: md, esc: esc, slug: slug, readDraft: readDraft, previewOn: previewOn, active: active
  };
});
