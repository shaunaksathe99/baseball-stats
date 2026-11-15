const assert = require('assert');
const vm = require('vm');
const Sim = require('../js/sim.js');
const C = require('../js/content.js');
const shipped = require('../content/content.js').DD_CONTENT;
let n = 0;
function t(name, fn) { fn(); n++; console.log('ok -', name); }
const store = (o) => ({ getItem: (k) => (k in o ? o[k] : null), setItem: (k, v) => { o[k] = String(v); } });

t('shipped content loads with no warnings and the expected sizes', () => {
  const r = C.normalize(shipped);
  assert.deepStrictEqual(r.warnings, []);
  assert.strictEqual(r.content.scenarios.length, 30);
  assert.ok(r.content.trivia.length >= 20 && r.content.quizzes.length >= 2 && r.content.kb.length >= 8 && r.content.glossary.length >= 20);
  assert.deepStrictEqual(r.content.directory, []);
});
t('every shipped trivia and quiz answer points at a real option', () => {
  shipped.trivia.forEach((x) => { assert.ok(x.opts[x.ans], x.id); assert.ok(x.opts.length >= 2 && x.opts.length <= 4); });
  shipped.quizzes.forEach((q) => { assert.ok(q.questions.length >= 3); q.questions.forEach((x) => assert.ok(x.opts[x.ans])); });
});
t('toFile writes a file that loads back to identical content', () => {
  const text = C.toFile(shipped), box = {};
  vm.runInNewContext(text, { window: box });
  assert.deepStrictEqual(JSON.parse(JSON.stringify(box.DD_CONTENT)), C.normalize(shipped).content);
});
t('trivia: friendly errors and a clean item', () => {
  const bad = C.clean('trivia', { q: '', opts: ['a', 'a', ''], ans: 5 }, {});
  assert.ok(bad.errors.length >= 2 && bad.errors.every((e) => /[a-z]/.test(e)));
  const ok = C.clean('trivia', { q: 'Q?', opts: ['yes', 'no', '', ''], ans: 1, cat: '' }, {});
  assert.deepStrictEqual(ok.errors, []);
  assert.strictEqual(ok.item.cat, 'General'); assert.strictEqual(ok.item.opts[ok.item.ans], 'no'); assert.ok(/^tv\d+$/.test(ok.item.id));
});
t('ids stay unique and an existing id is kept when editing', () => {
  const a = C.clean('trivia', { q: 'Q?', opts: ['a', 'b'], ans: 0 }, { tv1: 1 }).item;
  assert.notStrictEqual(a.id, 'tv1');
  const b = C.clean('trivia', { id: 'tv7', q: 'Q?', opts: ['a', 'b'], ans: 0 }, { tv1: 1 }).item;
  assert.strictEqual(b.id, 'tv7');
});
t('hidden items are kept in the data but excluded by visible()', () => {
  const it = C.clean('glossary', { term: 'X', def: 'Y', hidden: true }, {}).item;
  assert.strictEqual(it.hidden, true);
  assert.deepStrictEqual(C.visible([it, { term: 'Z', def: 'Z' }]).map((x) => x.term), ['Z']);
});
t('quiz needs at least 3 good questions', () => {
  const q = (x) => ({ q: x, opts: ['a', 'b'], ans: 0 });
  assert.ok(C.clean('quizzes', { title: 'T', questions: [q('1'), q('2')] }, {}).errors.length);
  assert.deepStrictEqual(C.clean('quizzes', { title: 'T', questions: [q('1'), q('2'), q('3')] }, {}).errors, []);
});
t('scenario: runner marker needs a runner, and a valid scenario passes the Sim validator', () => {
  const ok = shipped.scenarios[0];
  const bad = C.clean('scenarios', Object.assign({}, ok, { sit: Object.assign({}, ok.sit, { b: [0, 0, 0], you: '2' }) }), {});
  assert.ok(bad.errors.length);
  const good = C.clean('scenarios', ok, {});
  assert.deepStrictEqual(good.errors, []); assert.deepStrictEqual(Sim.validate([good.item]), []);
});
t('directory: needs type, name and a way to reach them; fixes bare web addresses; rejects bad links', () => {
  assert.ok(C.clean('directory', { name: 'X' }, {}).errors.length >= 1);
  assert.ok(/reach/.test(C.clean('directory', { type: 'coach', name: 'X' }, {}).errors[0]));
  const ok = C.clean('directory', { type: 'trainer', name: 'Pro Swing', website: 'proswing.com', state: 'tx', services: 'Hitting\n- Pitching' }, {});
  assert.deepStrictEqual(ok.errors, []);
  assert.strictEqual(ok.item.website, 'https://proswing.com'); assert.strictEqual(ok.item.state, 'TX'); assert.deepStrictEqual(ok.item.services, ['Hitting', 'Pitching']);
  assert.ok(C.clean('directory', { type: 'coach', name: 'A', website: 'javascript:alert(1)' }, {}).errors.length);
  assert.ok(C.clean('directory', { type: 'coach', name: 'A', email: 'nope' }, {}).errors.length);
  assert.ok(C.clean('directory', { type: 'cat', name: 'A', email: 'a@b.co' }, {}).errors.length);
});
t('hostile text is stripped of angle brackets', () => {
  const it = C.clean('kb', { title: '<img src=x onerror=1>Hello', body: 'a<script>alert(1)</script> and more text here' }, {}).item;
  assert.ok(!/[<>]/.test(it.title + it.body));
});
t('md: only paragraphs, bullets, headings, bold and https links; everything escaped', () => {
  const h = C.md('## Head\n\nHello **bold** & <b>x</b> [ok](https://a.com/x) [bad](javascript:alert(1))\n\n- one\n- two');
  assert.ok(h.includes('<h4>Head</h4>') && h.includes('<strong>bold</strong>') && h.includes('<ul><li>one</li><li>two</li></ul>'));
  assert.ok(h.includes('href="https://a.com/x"') && h.includes('rel="noopener noreferrer nofollow"'));
  assert.ok(!h.includes('<b>') && !/href="javascript/i.test(h) && h.includes('&amp;'));
});
t('csv: round trip for trivia, quizzes, kb, glossary and directory, including commas, quotes and line breaks', () => {
  const src = C.normalize(shipped).content;
  src.kb[0].body = 'Line one, "quoted"\n\nLine two';
  src.directory = [C.clean('directory', { type: 'team', name: 'Tigers, 12U', tagline: 'Say "hi"', services: ['Travel', 'Camps'], email: 'a@b.co', city: 'Austin', state: 'TX' }, {}).item];
  ['trivia', 'quizzes', 'kb', 'glossary', 'directory'].forEach((type) => {
    const res = C.fromCsv(type, C.toCsv(type, src[type]), []);
    assert.deepStrictEqual(res.errors, [], type);
    assert.strictEqual(res.items.length, src[type].length, type);
    res.items.forEach((x, i) => { const a = Object.assign({}, x), b = Object.assign({}, src[type][i]); delete a.added; delete b.added; assert.deepStrictEqual(a, b, type + ' #' + i); });
  });
});
t('csv: bad rows are reported with their row number and the good rows still import', () => {
  const csv = C.templateCsv('trivia') + '\n,Fun,No answers here,,,,,,,\n';
  const res = C.fromCsv('trivia', csv, []);
  assert.strictEqual(res.items.length, 1); assert.strictEqual(res.errors.length, 1); assert.strictEqual(res.errors[0].row, 3);
  assert.ok(C.fromCsv('trivia', 'foo,bar\n1,2', []).errors[0].msg.includes('heading'));
  assert.ok(C.fromCsv('glossary', 'Term,Definition', []).errors.length);
});
t('csv: an excel-style file with a byte order mark and windows line endings works', () => {
  const res = C.fromCsv('glossary', '﻿Term,Definition,Hide (yes/no)\r\nBunt,Tap it softly.,\r\nBalk,Illegal move.,yes\r\n', []);
  assert.deepStrictEqual(res.errors, []); assert.strictEqual(res.items.length, 2); assert.strictEqual(res.items[1].hidden, true);
});
t('listing request: build then parse comes back the same, and mentions the 18+ confirmation', () => {
  const l = C.clean('directory', { type: 'trainer', name: 'Pro Swing', tagline: 'Hitting', services: ['A', 'B'], ages: '8-14', city: 'Austin', state: 'TX', website: 'https://x.com', email: 'a@b.co', phone: '555-123-4567', notes: 'hi' }, {}).item;
  const text = C.buildRequest(l);
  assert.ok(/18 or older/.test(text));
  const back = C.clean('directory', C.parseRequest(text), {}).item;
  ['type', 'name', 'tagline', 'services', 'ages', 'city', 'state', 'website', 'email', 'phone', 'notes'].forEach((k) => assert.deepStrictEqual(back[k], l[k], k));
  assert.strictEqual(C.parseRequest('Type: Travel ball teams\nName: X').type, 'team');
});
t('active(): published content unless preview is on and a draft exists', () => {
  const draft = Object.assign(C.emptyContent(), { glossary: [{ id: 'x', term: 'Mine', def: 'Draft word' }] });
  const s = store({}); assert.strictEqual(C.active(shipped, s).preview, false);
  const s2 = store({ [C.DRAFT_KEY]: JSON.stringify(draft) }); assert.strictEqual(C.active(shipped, s2).preview, false, 'draft alone is not preview');
  const s3 = store({ [C.DRAFT_KEY]: JSON.stringify(draft), [C.PREVIEW_KEY]: '1' });
  const a = C.active(shipped, s3); assert.strictEqual(a.preview, true); assert.strictEqual(a.content.glossary[0].term, 'Mine');
  assert.strictEqual(C.active(shipped, store({ [C.PREVIEW_KEY]: '1' })).preview, false, 'preview with no draft falls back');
  assert.strictEqual(C.active(shipped, store({ [C.DRAFT_KEY]: '{bad', [C.PREVIEW_KEY]: '1' })).preview, false, 'corrupt draft falls back');
  assert.strictEqual(C.active(shipped, null).preview, false);
});
t('normalize survives garbage and enforces list limits', () => {
  assert.deepStrictEqual(C.normalize(null).content, C.emptyContent());
  const r = C.normalize({ trivia: 'nope', glossary: Array.from({ length: 800 }, (_, i) => ({ term: 't' + i, def: 'd' })) });
  assert.ok(r.content.glossary.length <= C.LIMITS.glossary);
  const r2 = C.normalize({ trivia: [{ q: 'ok?', opts: ['a', 'b'], ans: 0 }, { q: '' }] });
  assert.strictEqual(r2.content.trivia.length, 1); assert.strictEqual(r2.warnings.length, 1);
});
console.log('\n' + n + ' content tests passed');
