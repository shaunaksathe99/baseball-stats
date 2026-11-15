const assert = require('assert');
const S = require('../js/stats.js');
let n = 0;
function t(name, fn) { fn(); n++; console.log('ok -', name); }
const near = (a, b, e = 1e-9) => assert.ok(Math.abs(a - b) < e, a + ' vs ' + b);
const g = (date, bat, pit, fld, extra) => Object.assign({ id: date + Math.random(), date, season: 'S1', team: 'T', level: '', created: 1,
  bat: S.cleanSection(bat, S.BAT_KEYS), pit: S.cleanSection(pit, S.PIT_KEYS), fld: S.cleanSection(fld, S.FLD_KEYS) }, extra);

t('batting rates', () => {
  const b = S.batting([g('2026-04-01', { ab: 10, h: 4, d: 1, t: 1, hr: 1, bb: 2, hbp: 1, sf: 1 })]);
  assert.strictEqual(b.singles, 1);
  assert.strictEqual(b.tb, 4 + 1 + 2 + 3);            // 10
  near(b.avg, 0.4);
  near(b.obp, (4 + 2 + 1) / (10 + 2 + 1 + 1));         // 7/14
  near(b.slg, 1.0);
  near(b.ops, 0.5 + 1.0);
});
t('empty denominators give null, not NaN', () => {
  const b = S.batting([]);
  assert.strictEqual(b.avg, null); assert.strictEqual(b.obp, null); assert.strictEqual(b.ops, null);
  assert.strictEqual(S.pitching([]).era, null);
  assert.strictEqual(S.fielding([]).fpct, null);
  assert.strictEqual(S.fmtRate(null), '—');
});
t('walk-only game: OBP defined, AVG not', () => {
  const b = S.batting([g('2026-04-01', { bb: 3 })]);
  assert.strictEqual(b.avg, null); near(b.obp, 1);
});
t('formatting', () => {
  assert.strictEqual(S.fmtRate(0.3333), '.333');
  assert.strictEqual(S.fmtRate(1), '1.000');
  assert.strictEqual(S.fmtRate(0.9996), '1.000');
  assert.strictEqual(S.fmtRate(0), '.000');
  assert.strictEqual(S.fmtEra(2.5), '2.50');
  assert.strictEqual(S.fmtIP(10), '3.1');
  assert.strictEqual(S.fmtIP(0), '0.0');
});
t('pitching ERA/WHIP with 6- and 7-inning games', () => {
  const gs = [g('2026-04-01', {}, { outs: 12, h: 3, r: 2, er: 1, bb: 1, k: 5 }), g('2026-04-08', {}, { outs: 7, h: 2, r: 3, er: 2, bb: 2, k: 2 })];
  const p6 = S.pitching(gs, 6), p7 = S.pitching(gs, 7);
  assert.strictEqual(p6.outs, 19); assert.strictEqual(p6.ipText, '6 1/3');
  near(p6.era, 3 * 6 / (19 / 3)); near(p7.era, 3 * 7 / (19 / 3));
  near(p6.whip, (3 + 5) / (19 / 3));
  assert.strictEqual(p6.k, 7);
});
t('fielding pct', () => {
  const f = S.fielding([g('2026-04-01', {}, {}, { po: 6, a: 3, e: 1 })]);
  assert.strictEqual(f.tc, 10); near(f.fpct, 0.9);
});
t('cleanSection clamps junk', () => {
  const s = S.cleanSection({ ab: '5', h: -3, d: 'x', hr: 1e9, rbi: 2.9 }, S.BAT_KEYS);
  assert.deepStrictEqual([s.ab, s.h, s.d, s.hr, s.rbi, s.bb], [5, 0, 0, 999, 2, 0]);
});
t('series is cumulative and skips games without the stat', () => {
  const gs = [g('2026-04-01', { ab: 4, h: 2 }), g('2026-04-08', {}, { outs: 3 }), g('2026-04-15', { ab: 4, h: 0 })];
  const s = S.series(gs, 'avg');
  assert.strictEqual(s.length, 2); near(s[0].value, 0.5); near(s[1].value, 0.25);
  assert.strictEqual(S.series(gs, 'era', 6).length, 1);
});
t('sorting by date then created', () => {
  const out = S.sortGames([g('2026-05-01', {}), g('2026-04-01', {})]);
  assert.strictEqual(out[0].date, '2026-04-01');
});
t('groups split by season+team and seasonNames order', () => {
  const gs = [g('2026-06-01', { ab: 1 }, {}, {}, { season: 'Summer 2026', team: 'All-Stars' }), g('2026-04-01', { ab: 1 }), g('2026-04-08', { ab: 1 })];
  const gr = S.groups(gs);
  assert.strictEqual(gr.length, 2); assert.strictEqual(gr[0].games.length, 2);
  assert.deepStrictEqual(S.seasonNames(gs), ['S1', 'Summer 2026']);
});
t('goals: high-is-better and low-is-better', () => {
  const gs = [g('2026-04-01', { ab: 10, h: 3 }, { outs: 18, er: 2 })];
  const a = S.goalStatus({ metric: 'h', target: 6, scope: 'career' }, gs, 6);
  assert.strictEqual(a.met, false); near(a.pct, 0.5);
  const b = S.goalStatus({ metric: 'avg', target: 0.3, scope: 'career' }, gs, 6);
  assert.strictEqual(b.met, true);
  const c = S.goalStatus({ metric: 'era', target: 3, scope: 'career' }, gs, 6); // era = 2*6/6 = 2.0
  assert.strictEqual(c.met, true);
  const d = S.goalStatus({ metric: 'era', target: 1, scope: 'career' }, gs, 6);
  assert.strictEqual(d.met, false); near(d.pct, 0.5);
  const e = S.goalStatus({ metric: 'era', target: 3, scope: 'career' }, [g('2026-04-01', { ab: 1 })], 6); // no pitching yet
  assert.strictEqual(e.met, false); assert.strictEqual(e.value, null);
  const f = S.goalStatus({ metric: 'h', target: 1, scope: 'Nope' }, gs, 6);
  assert.strictEqual(f.count, 0); assert.strictEqual(f.met, false);
});
t('badges', () => {
  const gs = [
    g('2026-04-01', { ab: 3, h: 2, hr: 1, rbi: 2, sb: 1, bb: 2 }, { outs: 9, er: 1, k: 3 }, { po: 2, a: 1 }),
  ];
  const b = Object.fromEntries(S.badges(gs).map((x) => [x.id, x.earned]));
  ['rookie', 'hit', 'xbh', 'hr', 'rbi', 'sb', 'multi', 'eye', 'k', 'ace', 'glove'].forEach((id) => assert.ok(b[id], id));
  assert.ok(!b.g10 && !b.h25 && !b.s300);
  const ten = Array.from({ length: 10 }, (_, i) => g('2026-04-' + String(i + 1).padStart(2, '0'), { ab: 3, h: 1 }));
  const b2 = Object.fromEntries(S.badges(ten).map((x) => [x.id, x.earned]));
  assert.ok(b2.g10); assert.ok(!b2.h25);
  const many = Array.from({ length: 10 }, (_, i) => g('2026-04-' + String(i + 1).padStart(2, '0'), { ab: 3, h: 3 }));
  const b3 = Object.fromEntries(S.badges(many).map((x) => [x.id, x.earned]));
  assert.ok(b3.h25 && b3.s300);
  const few = [g('2026-04-01', { ab: 5, h: 5 })]; // under 20 AB: no .300 season
  assert.ok(!S.badges(few).find((x) => x.id === 's300').earned);
});
t('hit streak ignores walk-only games, breaks on hitless games', () => {
  const gs = [g('2026-04-01', { ab: 3, h: 1 }), g('2026-04-02', { bb: 2 }), g('2026-04-03', { ab: 4, h: 2 }), g('2026-04-04', { ab: 3, h: 0 }), g('2026-04-05', { ab: 3, h: 1 }), g('2026-04-06', { ab: 3, h: 1 })];
  const s = S.hitStreak(gs);
  assert.strictEqual(s.best, 2); assert.strictEqual(s.current, 2);
  assert.deepStrictEqual(S.hitStreak([]), { current: 0, best: 0 });
  assert.ok(S.badgeIds().indexOf('rookie') >= 0);
});
t('walks, HBP and sac flies are not at-bats (AVG vs OBP)', () => {
  // 3 AB, 1 H, plus 2 BB, 1 HBP, 1 SF  => AVG = 1/3 (no walks/HBP/SF in the denominator)
  const b = S.batting([g('2026-04-01', { ab: 3, h: 1, bb: 2, hbp: 1, sf: 1, rbi: 1 })]);
  near(b.avg, 1 / 3);
  near(b.obp, (1 + 2 + 1) / (3 + 2 + 1 + 1));   // 4/7: SF is in the OBP denominator, not the numerator
  assert.strictEqual(b.pa, 7);
});
t('unearned runs never count toward ERA', () => {
  const p = S.pitching([g('2026-04-01', {}, { outs: 18, r: 5, er: 2 })], 6); // 6 IP, 5 runs but only 2 earned
  near(p.era, 2 * 6 / 6);
  assert.strictEqual(p.r - p.er, 3);
});
t('validateGame: impossible entries are errors', () => {
  const v = (b, p) => S.validateGame(S.cleanSection(b, S.BAT_KEYS), S.cleanSection(p || {}, S.PIT_KEYS), {}, { inn: 6 });
  assert.ok(v({ ab: 3, h: 4 }).errors.length >= 1, 'H > AB');
  assert.ok(v({ ab: 4, h: 2, d: 2, hr: 1 }).errors.length >= 1, '2B+3B+HR > H');
  assert.ok(v({ ab: 4, h: 3, k: 2 }).errors.length >= 1, 'H + K > AB');
  assert.ok(v({ rbi: 1 }).errors.length === 1, 'RBI with no plate appearance');
  assert.ok(v({ ab: 1, rbi: 5 }).errors.length >= 1, 'RBI > 4 per PA');
  assert.ok(v({}, { r: 2, er: 3 }).errors.length === 1, 'ER > R');
  assert.deepStrictEqual(v({ ab: 4, h: 2, d: 1, hr: 1, rbi: 3, r: 2, k: 1, bb: 1 }, { outs: 9, r: 3, er: 2, k: 3, pitches: 40 }), { errors: [], warnings: [] });
});
t('validateGame: walks/SF/HBP never trigger the at-bat error', () => {
  const r = S.validateGame(S.cleanSection({ ab: 0, bb: 3, hbp: 1, sf: 1, rbi: 1 }, S.BAT_KEYS), {}, {}, {});
  assert.deepStrictEqual(r.errors, []);          // bases-loaded walk / sac fly RBI is legal
});
t('validateGame: soft warnings', () => {
  const w = (b, p, inn) => S.validateGame(S.cleanSection(b, S.BAT_KEYS), S.cleanSection(p || {}, S.PIT_KEYS), {}, { inn: inn || 6 }).warnings;
  assert.strictEqual(w({ ab: 3, sf: 2, rbi: 1 }).length, 1, 'SF > RBI');
  assert.ok(w({ ab: 3, h: 2, hr: 2, rbi: 1, r: 2 }).length >= 1, 'HR > RBI');
  assert.ok(w({ ab: 3, h: 1, hr: 1, rbi: 1, r: 0 }).length === 1, 'HR > R');
  assert.ok(w({ ab: 9 }).length === 1, 'PA > 8');
  assert.ok(w({}, { outs: 6, k: 4, pitches: 8 }).length === 1, 'K needs 3 pitches each');
  assert.deepStrictEqual(w({}, { outs: 6, k: 4 }), [], 'no pitch count entered => no pitch warning');
  assert.ok(w({}, { outs: 40 }, 6).length === 1 && w({}, { outs: 21 }, 7).length === 0, 'too many innings');
});
t('innings parsing: baseball fractions and decimals', () => {
  const P = S.parseInnings;
  assert.strictEqual(P('3 1/3'), 10); assert.strictEqual(P('3 2/3'), 11); assert.strictEqual(P('4'), 12);
  assert.strictEqual(P('1/3'), 1); assert.strictEqual(P('2/3'), 2); assert.strictEqual(P('0'), 0); assert.strictEqual(P(''), 0);
  assert.strictEqual(P('3.1'), 10); assert.strictEqual(P('3.2'), 11); assert.strictEqual(P('.1'), 1);
  assert.strictEqual(P('  3   1/3 '), 10); assert.strictEqual(P('3-1/3'), 10); assert.strictEqual(P('3\u2153'), 10); assert.strictEqual(P('\u2154'), 2);
  ['3.3', '3.5', '3 3/3', '3 0/3', 'abc', '-1', '1/2', '3 1/4', '100'].forEach((bad) => assert.strictEqual(P(bad), null, bad));
  assert.strictEqual(S.fmtInnings(10), '3 1/3'); assert.strictEqual(S.fmtInnings(11), '3 2/3'); assert.strictEqual(S.fmtInnings(12), '4');
  assert.strictEqual(S.fmtInnings(1), '1/3'); assert.strictEqual(S.fmtInnings(0), '0');
  for (let o = 0; o < 40; o++) assert.strictEqual(S.parseInnings(S.fmtInnings(o)), o, 'roundtrip ' + o);
});
t('fielding by position: by-inning rows and whole-game entries combine', () => {
  const gs = [
    g('2026-04-01', {}, {}, {}, { id: 'a', fi: [{ i: 1, pos: 'SS', po: 1, a: 2, e: 0 }, { i: 2, pos: 'SS', po: 0, a: 1, e: 1 }, { i: 3, pos: '1B', po: 4 > 3 ? 3 : 4, a: 0, e: 0 }] }),
    g('2026-04-08', {}, {}, { po: 2, a: 3, e: 0 }, { id: 'b', pos: 'SS' }),
    g('2026-04-15', {}, {}, {}, { id: 'c', fi: [{ i: 1, pos: 'P', po: 0, a: 0, e: 0 }] })
  ];
  const by = S.fieldingByPosition(gs);
  assert.deepStrictEqual(by.map((r) => r.pos), ['P', '1B', 'SS']);
  const ss = by.find((r) => r.pos === 'SS');
  assert.strictEqual(ss.g, 2); assert.strictEqual(ss.inn, 2); assert.strictEqual(ss.po, 3); assert.strictEqual(ss.a, 6); assert.strictEqual(ss.e, 1);
  near(ss.fpct, 9 / 10);
  assert.strictEqual(by.find((r) => r.pos === 'P').inn, 1);   // an inning at P with zero chances still counts
  assert.ok(S.hasFld(gs[2]), 'inning-only game with no chances counts as fielding data');
  assert.strictEqual(S.fielding(gs).g, 3);
});
t('validateFi: position required, no more than 3 putouts per inning, duplicates warned', () => {
  assert.deepStrictEqual(S.validateFi([{ i: 1, pos: '', po: 0, a: 0, e: 0 }]), { errors: [], warnings: [] });   // empty row ignored
  assert.strictEqual(S.validateFi([{ i: 2, pos: '', po: 1, a: 0, e: 0 }]).errors.length, 1);
  assert.strictEqual(S.validateFi([{ i: 3, pos: 'C', po: 4, a: 0, e: 0 }]).errors.length, 1);
  assert.strictEqual(S.validateFi([{ i: 1, pos: 'SS', po: 1, a: 0, e: 0 }, { i: 1, pos: 'SS', po: 1, a: 0, e: 0 }]).warnings.length, 1);
  assert.deepStrictEqual(S.validateFi([{ i: 1, pos: 'SS', po: 1, a: 0, e: 0 }, { i: 1, pos: '2B', po: 1, a: 0, e: 0 }]), { errors: [], warnings: [] });  // position change mid-inning is legal
});
t('innings goal formats as fractions', () => {
  assert.strictEqual(S.fmtMetric('ip', 10 / 3), '3 1/3');
  const gs = [g('2026-04-01', {}, { outs: 10 })];
  const st = S.goalStatus({ metric: 'ip', target: 6, scope: 'career' }, gs, 6);
  assert.strictEqual(st.met, false); near(st.pct, (10 / 3) / 6);
});
t('catcher stats: CS and CI are tracked and rolled up by position', () => {
  assert.ok(S.FLD_KEYS.indexOf('cs') >= 0 && S.FLD_KEYS.indexOf('ci') >= 0);
  const gs = [
    g('2026-04-01', {}, {}, {}, { id: 'a', fi: [{ i: 1, pos: 'C', po: 1, a: 2, e: 0, cs: 2, ci: 0 }, { i: 2, pos: 'C', po: 0, a: 0, e: 1, cs: 0, ci: 1 }, { i: 3, pos: 'SS', po: 0, a: 1, e: 0, cs: 0, ci: 0 }],
      fld: { po: 1, a: 3, e: 1, cs: 2, ci: 1 } }),
    g('2026-04-08', {}, {}, { po: 5, a: 1, e: 0, cs: 1, ci: 0 }, { id: 'b', pos: 'C' })
  ];
  const c = S.fieldingByPosition(gs).find((r) => r.pos === 'C');
  assert.strictEqual(c.cs, 3); assert.strictEqual(c.ci, 1); assert.strictEqual(c.g, 2); assert.strictEqual(c.inn, 2);
  assert.strictEqual(S.fieldingByPosition(gs).find((r) => r.pos === 'SS').cs, 0);
  const f = S.fielding(gs);
  assert.strictEqual(f.cs, 3); assert.strictEqual(f.ci, 1);
  assert.strictEqual(f.tc, (1 + 3 + 1) + (5 + 1 + 0));   // CS and CI are not extra chances
});
t('catcher validation is soft and catcher-only', () => {
  assert.deepStrictEqual(S.validateCatcher({ po: 2, a: 2, e: 1, cs: 2, ci: 1 }, 'C'), []);
  assert.strictEqual(S.validateCatcher({ po: 0, a: 0, e: 1, cs: 2, ci: 0 }, 'C').length, 1, 'CS > A');
  assert.strictEqual(S.validateCatcher({ po: 0, a: 3, e: 0, cs: 1, ci: 1 }, 'C').length, 1, 'CI > E');
  assert.deepStrictEqual(S.validateCatcher({ cs: 5, ci: 5 }, 'SS'), [], 'ignored for non-catchers');
  const r = S.validateFi([{ i: 1, pos: 'C', po: 0, a: 0, e: 0, cs: 1, ci: 1 }]);
  assert.deepStrictEqual(r.errors, []); assert.strictEqual(r.warnings.length, 2);
  assert.deepStrictEqual(S.validateFi([{ i: 1, pos: '', po: 0, a: 0, e: 0, cs: 1, ci: 0 }]).errors.length, 1, 'stats without a position');
});
console.log('\n' + n + ' tests passed');
