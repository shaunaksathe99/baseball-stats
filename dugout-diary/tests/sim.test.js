const assert = require('assert');
const Sim = require('../js/sim.js');
Sim.setScenarios(require('../content/content.js').DD_CONTENT.scenarios);
let n = 0;
function t(name, fn) { fn(); n++; console.log('ok -', name); }
const seeded = (seed) => () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };

t('scenario bank is structurally valid', () => { assert.deepStrictEqual(Sim.validate(), []); });
t('shipped bank: 42 scenarios, 7 in each of 6 categories, with A, AA and AAA in every category', () => {
  assert.strictEqual(Sim.SCENARIOS.length, 42);
  Sim.CATS.forEach((c) => { assert.strictEqual(Sim.inCat(c.id).length, 7, c.id); [1, 2, 3].forEach((l) => assert.ok(Sim.inCat(c.id, l).length >= 1, c.id + ' level ' + l)); });
  assert.deepStrictEqual([1, 2, 3].map((l) => Sim.LEVELS[l]), ['A', 'AA', 'AAA']);
});
t('setScenarios skips hidden, invalid and duplicate scenarios, and replaces in place', () => {
  const ref = Sim.SCENARIOS, all = ref.slice();
  const bad = Object.assign({}, all[0], { id: 'zz1', ans: 9 });
  const hid = Object.assign({}, all[1], { hidden: true });
  assert.strictEqual(Sim.setScenarios([all[0], all[0], bad, hid, null]), 1);
  assert.strictEqual(Sim.SCENARIOS, ref); assert.strictEqual(Sim.byId(hid.id), null);
  assert.strictEqual(Sim.setScenarios(undefined), 0);
  Sim.setScenarios(all); assert.strictEqual(Sim.SCENARIOS.length, 42);
});
t('both difficulty levels are used in every category mix', () => {
  [1, 2, 3].forEach((l) => assert.ok(Sim.SCENARIOS.filter((s) => s.lvl === l).length >= 8, 'level ' + l));
});
t('validator catches bad scenarios', () => {
  const ok = Sim.SCENARIOS[0];
  const bad = (patch) => Sim.validate([Object.assign({}, ok, patch)]).length > 0;
  assert.ok(bad({ ans: 9 })); assert.ok(bad({ opts: ['a', 'a', 'b'] })); assert.ok(bad({ opts: ['a', 'b'] }));
  assert.ok(bad({ cat: 'zzz' })); assert.ok(bad({ sit: Object.assign({}, ok.sit, { outs: 3 }) }));
  assert.ok(bad({ sit: Object.assign({}, ok.sit, { you: '3' }) }), 'runner marker needs a runner');
  assert.ok(bad({ sit: Object.assign({}, ok.sit, { cnt: '4-0' }) }));
  assert.ok(Sim.validate([ok, ok]).some((p) => p.includes('duplicate id')));
});
t('every scenario has exactly one answer marked and the best answer is not always first once shuffled', () => {
  const rng = seeded(7), firsts = {};
  for (let i = 0; i < 200; i++) { const o = Sim.shuffle(4, rng); firsts[o[0]] = 1; assert.deepStrictEqual(o.slice().sort(), [0, 1, 2, 3]); }
  assert.strictEqual(Object.keys(firsts).length, 4);
});
t('byId only finds real scenarios', () => {
  assert.strictEqual(Sim.byId('run1').cat, 'run');
  assert.strictEqual(Sim.byId('__proto__'), null); assert.strictEqual(Sim.byId('constructor'), null); assert.strictEqual(Sim.byId('nope'), null);
});
t('pickRound: 5 unique ids, respects category', () => {
  const r = Sim.pickRound({}, 'mix', 5, seeded(1));
  assert.strictEqual(r.length, 5); assert.strictEqual(new Set(r).size, 5);
  const h = Sim.pickRound({}, 'hit', 5, seeded(2));
  assert.ok(h.every((id) => Sim.byId(id).cat === 'hit') && h.length === 5);
  assert.strictEqual(Sim.pickRound({}, 'hit', 99, seeded(3)).length, 7, 'capped at the category size');
});
t('pickRound: missed first, then new, then mastered last', () => {
  const prog = {};
  Sim.ids().forEach((id) => { prog[id] = [1, 1, 1]; });            // everything mastered...
  prog.run1 = [2, 1, 0]; prog.hit2 = [1, 0, 0];                    // ...except two missed
  delete prog.fld4; delete prog.pit3;                              // and two never seen
  for (let k = 0; k < 20; k++) {
    const r = Sim.pickRound(prog, 'mix', 5, seeded(k + 10));
    assert.ok(r.includes('run1') && r.includes('hit2'), 'missed ones always come back');
    assert.ok(r.includes('fld4') && r.includes('pit3'), 'new ones come next');
  }
});
t('pickRound can be limited to one league level (and falls back if that level is empty)', () => {
  [1, 2, 3].forEach((l) => Sim.pickRound({}, 'mix', 5, seeded(l), l).forEach((id) => assert.strictEqual(Sim.byId(id).lvl, l)));
  assert.strictEqual(Sim.pickRound({}, 'mix', 5, seeded(9), 9).length, 5);
  assert.ok(Sim.inCat('mix', 3).length >= 12);
});
t('pickRound tolerates junk progress', () => {
  assert.strictEqual(Sim.pickRound(null, 'mix', 5).length, 5);
  assert.strictEqual(Sim.pickRound({ run1: 'x', __proto__: 1 }, 'bogus', 5).length, 5);
});
t('rank thresholds and progress to next rank', () => {
  assert.strictEqual(Sim.rank(0, 30).name, 'Rookie');
  assert.strictEqual(Sim.rank(3, 30).name, 'Utility Player');
  assert.strictEqual(Sim.rank(9, 30).name, 'Starter');
  assert.strictEqual(Sim.rank(17, 30).name, 'All-Star');
  assert.strictEqual(Sim.rank(24, 30).name, 'Hall of Famer');
  assert.strictEqual(Sim.rank(30, 30).next, null);
  const r = Sim.rank(1, 30);
  assert.strictEqual(r.next, 'Utility Player'); assert.strictEqual(r.need, 2); assert.ok(r.pct >= 0 && r.pct <= 1);
  assert.strictEqual(Sim.rank(0, 30).need, 3);
});
t('masteredCount counts only most-recent-correct', () => {
  assert.strictEqual(Sim.masteredCount({ run1: [1, 1, 1], run2: [3, 1, 0], zzz: [1, 1, 1] }), 1);
  assert.strictEqual(Sim.masteredCount(null), 0);
});
console.log('\n' + n + ' sim tests passed');
