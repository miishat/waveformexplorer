import test from 'node:test';
import assert from 'node:assert/strict';
import {displayFrame, nodeBounds, pinSourceId} from '../src/graph.ts';
import {lessons} from '../src/content/lessons.ts';
import {expandNode, fitBounds, retainSelection} from '../src/graph.ts';
test('fit uses the actual narrow or wide canvas viewport', () => {
  for (const viewport of [
    {width: 320, height: 350},
    {width: 1200, height: 400},
  ]) {
    const bounds = {x: 25, y: 20, width: 740, height: 365};
    const {zoom, pan} = fitBounds(bounds, viewport);
    const x = (bounds.x - viewport.width / 2) * zoom + viewport.width / 2 + pan.x;
    const y = (bounds.y - viewport.height / 2) * zoom + viewport.height / 2 + pan.y;
    assert.ok(x >= 23.99 && y >= 23.99);
    assert.ok(x + bounds.width * zoom <= viewport.width - 23.99);
    assert.ok(y + bounds.height * zoom <= viewport.height - 23.99);
  }
});
test('expansion reveals only the selected nodes immediate dependencies', () => {
  const edges = [
    {from: 'a', to: 'q'},
    {from: 'b', to: 'q'},
    {from: 'c', to: 'a'},
  ];
  assert.deepEqual(expandNode(['q'], 'q', edges), ['q', 'a', 'b']);
  assert.deepEqual(expandNode(['q', 'a', 'b'], 'a', edges), ['q', 'a', 'b', 'c']);
});
test('selection survives compatible views and falls back when absent', () => {
  const selection = {type: 'pin' as const, id: 'q:out'};
  assert.deepEqual(retainSelection(selection, new Set(['pin:q:out']), 'q'), selection);
  assert.deepEqual(retainSelection({type: 'node', id: 'd'}, new Set(['node:q']), 'q'), {
    type: 'node',
    id: 'q',
  });
});
test('fit centers large and small content inside the viewport with padding', () => {
  for (const bounds of [
    {x: -200, y: 20, width: 1400, height: 800},
    {x: 600, y: 100, width: 150, height: 100},
  ]) {
    const {zoom, pan} = fitBounds(bounds);
    const x = (bounds.x - 400) * zoom + 400 + pan.x,
      y = (bounds.y - 215) * zoom + 215 + pan.y;
    assert.ok(x >= 23.99 && y >= 23.99);
    assert.ok(x + bounds.width * zoom <= 776.01 && y + bounds.height * zoom <= 406.01);
    assert.ok(Math.abs(x + (bounds.width * zoom) / 2 - 400) < 0.001);
  }
});
test('delay comparison differentiates settled summary from selected instantaneous event', () => {
  const l = lessons.find(l => l.id === 'delay')!;
  assert.equal(displayFrame(l, 0, 'transition').samples.q.value, '0');
  assert.equal(displayFrame(l, 0, 'transition').time, 10);
  assert.equal(displayFrame(l, 0, 'cycle').samples.q.value, '1');
  assert.equal(displayFrame(l, 0, 'cycle').time, 12);
});
test('pin geometry respects mux and rectangular boundaries', () => {
  assert.deepEqual(nodeBounds('mux', 'tfv'), {halfWidth: 38, halfHeight: 48});
  assert.deepEqual(nodeBounds('mux', 'compact'), {halfWidth: 63, halfHeight: 31});
  assert.deepEqual(nodeBounds('register', 'tfv'), {halfWidth: 63, halfHeight: 31});
});
test('input pin resolves to its actual operand rather than operation result', () => {
  assert.equal(pinSourceId('d:control:sel'), 'sel');
  assert.equal(pinSourceId('d:in:a'), 'a');
  assert.equal(pinSourceId('q:out'), 'q');
});
