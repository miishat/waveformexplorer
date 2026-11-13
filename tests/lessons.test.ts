import test from 'node:test';
import assert from 'node:assert/strict';
import {lessons} from '../src/content/lessons.ts';
import {symbols, sources} from '../src/content/reference.ts';
const get = (id: string) => lessons.find(l => l.id === id)!;
test('all 31 investigations have complete graph, source and event references', () => {
  assert.equal(lessons.length, 31);
  assert.equal(new Set(lessons.map(l => l.id)).size, 31);
  for (const l of lessons) {
    assert.ok(l.nodes.some(n => n.id === l.target));
    for (const e of l.edges) {
      assert.ok(l.nodes.some(n => n.id === e.from));
      assert.ok(l.nodes.some(n => n.id === e.to));
    }
    for (const n of l.nodes) {
      assert.ok(n.line > 0 && n.line <= l.rtl.length);
      for (const f of l.frames) {
        assert.ok(f.samples[n.id]);
        assert.notEqual(f.values[n.id], undefined);
      }
    }
    for (let i = 1; i < l.frames.length; i++) assert.ok(l.frames[i].time >= l.frames[i - 1].time);
    assert.equal(new Set(l.frames.map(f => f.label)).size, l.frames.length);
    if (l.cycleFrames) {
      assert.equal(l.cycleFrames.length, l.frames.length);
      for (const c of l.cycleFrames) assert.ok(c >= 0 && c < l.frames.length);
    }
    assert.ok(
      l.nodes.filter(n => n.internal && n.id !== l.target).length <= 1,
      `${l.id}: Compact view places only one internal node`,
    );
    assert.ok(l.exercise.answer >= 0 && l.exercise.answer < l.exercise.options.length);
  }
});
test('atlas entries resolve to a source and state view applicability', () => {
  for (const s of symbols) {
    assert.ok(sources.some(r => r.id === s.source));
    assert.ok(s.views && s.page && s.confusion && s.status);
  }
});
test('stable active input differs from toggling inactive input', () => {
  const f = get('selection').frames[1];
  assert.equal(f.samples.a.active, true);
  assert.equal(f.samples.a.changed, false);
  assert.equal(f.samples.b.active, false);
  assert.equal(f.samples.b.changed, true);
  assert.equal(f.values.q, '2A');
});
test('sampling lesson distinguishes post-event data from sampled RHS', () => {
  const f = get('sampling').frames[0];
  assert.equal(f.values.d, '22');
  assert.equal(f.samples.d.value, '11');
  assert.equal(f.values.q, '11');
});
test('enable lesson separates hold and equal-value write', () => {
  const [, hold, write] = get('enable').frames;
  assert.equal(hold.assigned, false);
  assert.equal(write.assigned, true);
  assert.equal(hold.changed, false);
  assert.equal(write.changed, false);
  assert.equal(hold.values.q, write.values.q);
});
test('asynchronous reset responds between edges', () => {
  const f = get('reset').frames[1];
  assert.equal(f.time, 15);
  assert.equal(f.values.sync, '2A');
  assert.equal(f.values.q, '00');
  assert.match(f.event, /no clock edge/);
});
test('pipeline trace connects q to historical rather than current upstream values', () => {
  const f = get('pipeline').frames[2];
  assert.equal(f.values.r0, '99');
  assert.equal(f.samples.r0.value, '2A');
  assert.equal(f.samples.r0.at, '10 ns+');
  assert.equal(f.samples.r1.at, '20 ns+');
  assert.equal(f.samples.q.value, '2A');
});
test('four-bit counter wraps and the bus slice ignores low-bit changes', () => {
  assert.equal(get('counter').frames[2].values.q, '0');
  const f = get('slice').frames;
  assert.equal(f[0].values.q, f[1].values.q);
  assert.notEqual(f[0].values.bus, f[1].values.bus);
});
test('read-during-write fixture reads old content before NBA update', () => {
  const f = get('memory').frames[2];
  assert.equal(f.values.mem, '66');
  assert.equal(f.samples.mem.value, '55');
  assert.equal(f.values.q, '55');
});
test('unknown is masked by zero and visible with one', () => {
  assert.deepEqual(
    get('unknown').frames.map(f => f.values.q),
    ['0', 'X', 'X'],
  );
});
test('delayed output changes at 12ns, not at input transition', () => {
  const f = get('delay').frames;
  assert.deepEqual(
    f.map(x => x.values.q),
    ['0', '0', '1'],
  );
  assert.equal(f[2].samples.a.at, '10 ns transition');
});
test('target transition marker agrees with event fact', () => {
  for (const l of lessons)
    for (const f of l.frames)
      assert.equal(f.samples[l.target].changed, f.changed, `${l.id} at ${f.time}`);
});
test('a port renames a value without adding a register stage', () => {
  const f = get('hierarchy').frames;
  assert.deepEqual(
    f.map(x => x.values.q),
    ['00', '2A', '55'],
  );
  assert.equal(f[1].samples.core.at, '10 ns+');
  assert.equal(f[1].samples.port.value, f[1].samples.core.value);
});
test('the synchronizer output changes only at clk_b edges, two edges after req', () => {
  const f = get('cdc').frames;
  assert.deepEqual(
    f.map(x => x.time),
    [10, 21, 35],
  );
  assert.equal(f[0].assigned, false);
  assert.deepEqual(
    f.map(x => x.values.q),
    ['0', '0', '1'],
  );
  assert.equal(f[1].values.sync1, '1');
});
test('a disabled driver yields Z and two enabled drivers conflict', () => {
  const f = get('drivers').frames;
  assert.equal(f[0].values.bus, f[0].values.a);
  assert.equal(f[1].values.bus, 'ZZ');
  assert.equal(f[2].values.ena, '1');
  assert.equal(f[2].values.enb, '1');
  assert.equal(f[2].values.q, 'XX');
});
test('the dropped value never appears on q', () => {
  const f = get('dropped').frames;
  assert.ok(!f.some(x => x.values.q === '2A'));
  assert.equal(f[1].samples.r0.value, '2A');
  assert.equal(f[1].assigned, false);
});
test('the X appears at reset release and persists for the edge where state loads', () => {
  const f = get('resetx').frames;
  assert.deepEqual(
    f.map(x => x.values.q),
    ['00', 'XX', 'XX'],
  );
  assert.equal(f[2].values.state, '2A');
  assert.equal(f[2].samples.state.value, 'XX');
});
test('instance data stays clean while the shared net goes X', () => {
  const f = get('shared').frames[2];
  assert.notEqual(f.values.ua, 'XX');
  assert.notEqual(f.values.ub, 'XX');
  assert.equal(f.values.bus, 'XX');
});
const hex = (v: string) => parseInt(v, 16);
test('expert track follows the core track and every exercise has four options', () => {
  const first = lessons.findIndex(l => l.track === 'expert');
  assert.equal(first, 21);
  for (const l of lessons.slice(first)) {
    assert.equal(l.track, 'expert');
    assert.equal(l.exercise.options.length, 4);
  }
});
test('8-bit sizing drops the carry before the shift', () => {
  for (const f of get('width').frames)
    assert.equal(hex(f.values.q), ((hex(f.values.a) + hex(f.values.b)) & 0xff) >> 1);
  assert.notEqual(hex(get('width').frames[1].values.q), (0xf0 + 0x30) >> 1);
});
test('the inferred latch follows a while open and holds when closed', () => {
  const f = get('latch').frames;
  assert.equal(f[1].values.q, f[1].values.a);
  assert.equal(f[2].values.q, f[1].values.q);
  assert.notEqual(f[2].values.q, f[2].values.a);
  assert.equal(f[2].assigned, false);
});
test('an X condition takes the else branch and leaves q known', () => {
  for (const f of get('xopt').frames)
    assert.equal(f.values.q, f.values.sel === '1' ? f.values.a : f.values.b);
  assert.equal(get('xopt').frames[0].values.sel, 'X');
});
test('two writers of one variable never produce X', () => {
  const f = get('multidrv').frames[2];
  assert.equal(f.values.ena, '1');
  assert.equal(f.values.enb, '1');
  assert.ok([f.values.a, f.values.b].includes(f.values.q));
});
test('a forced register ignores its clocked assignment until after release', () => {
  const f = get('forced').frames;
  assert.match(f[1].event, /no clock edge/);
  assert.equal(f[2].assigned, true);
  assert.equal(f[2].values.q, 'FF');
  assert.notEqual(f[2].values.d, 'FF');
  assert.equal(f[3].values.q, f[3].values.d);
});
test('the stale mask explains every bad output', () => {
  const f = get('stale').frames;
  assert.equal(f[1].samples.cfg.at, '40 ns+ (last load)');
  for (const x of f.slice(1)) assert.equal(hex(x.values.q), hex(x.values.din) & hex(x.values.cfg));
});
test('no gated clock edge means no assignment', () => {
  const f = get('gated').frames;
  assert.equal(f[1].values.gclk, '0');
  assert.equal(f[1].assigned, false);
  assert.ok(!f.some(x => x.values.q === '77'));
});
test('the short pulse is never high at a clk_b edge', () => {
  const f = get('pulse').frames;
  assert.deepEqual(
    f.map(x => x.values.q),
    ['0', '0', '0'],
  );
  assert.equal(f[2].samples.pulse.value, '0');
  assert.equal(f[0].values.pulse, '1');
});
test('the reset glitch exists only in the transition reading', () => {
  const l = get('glitch');
  assert.deepEqual(
    l.frames.map(f => f.values.rst),
    ['1', '0', '1', '1'],
  );
  assert.equal(l.frames[1].values.q, '00');
  assert.ok(l.cycleFrames!.every(i => l.frames[i].values.rst === '1'));
});
test('same-timestamp steps order the NBA update before the derived clock block', () => {
  const l = get('race');
  assert.deepEqual(
    l.frames.map(f => f.time),
    [10, 10, 10],
  );
  assert.deepEqual(
    l.frames.map(f => f.values.d1),
    ['11', '2A', '2A'],
  );
  assert.deepEqual(
    l.frames.map(f => f.values.q),
    ['00', '00', '2A'],
  );
  assert.equal(l.frames[2].samples.d1.value, '2A');
});
test('every investigation has a locate task that points at real nodes and frames', () => {
  for (const l of lessons) {
    const t = l.locate!;
    assert.ok(t && t.prompt && t.explanation, l.id);
    assert.ok(t.nodes.length && t.frames.length);
    for (const id of t.nodes) {
      assert.ok(
        l.nodes.some(n => n.id === id),
        `${l.id}: ${id}`,
      );
      assert.notEqual(id, l.target);
    }
    for (const f of t.frames) assert.ok(f >= 0 && f < l.frames.length);
    for (const id of t.nodes)
      for (const f of t.frames)
        assert.notEqual(
          l.frames[f].samples[id].value,
          '—',
          `${l.id}: ${id} has no value at frame ${f}`,
        );
    assert.ok(
      t.nodes.some(id => !l.nodes.find(n => n.id === id)!.internal) ||
        l.nodes.find(n => n.id === l.target)!.internal,
      `${l.id}: an accepted node must stay visible in Register view`,
    );
  }
});
test('the first read of a newly written address is a transition on q', () => {
  const f = get('memory').frames[0];
  assert.equal(f.values.q, '55');
  assert.equal(f.changed, true);
});
test('the latch closes before a moves, so q holding is not an ordering race', () => {
  const f = get('latch').frames[2];
  assert.ok(f.time > 20);
  assert.equal(f.samples.sel.at, '20 ns');
});
test('the glitch on y = b & ~b exists only in the transition reading', () => {
  const l = get('hazard');
  assert.deepEqual(
    l.frames.map(f => f.values.q),
    ['0', '1', '0'],
  );
  for (const f of l.frames) {
    const and = f.values.b === '1' && f.values.nb === '1' ? '1' : '0';
    assert.equal(f.values.q, and);
  }
  assert.ok(l.cycleFrames!.every(i => l.frames[i].values.q === '0'));
});
test('each loop output is the NAND of a and the previous y', () => {
  const f = get('loop').frames;
  for (const x of f.slice(1)) {
    const nand = x.values.a === '1' && x.values.yfb === '1' ? '0' : '1';
    assert.equal(x.values.q, nand);
  }
  assert.equal(f[2].values.yfb, f[1].values.q);
});
test('a forced net ignores its driver and follows it again at release', () => {
  const f = get('netforce').frames;
  for (const x of f) assert.equal(hex(x.values.add), (hex(x.values.a) + 1) & 0xff);
  assert.equal(f[1].values.q, 'FF');
  assert.notEqual(f[1].values.q, f[1].values.add);
  assert.equal(f[2].values.q, f[2].values.add);
  assert.equal(f[2].values.a, f[1].values.a);
});
