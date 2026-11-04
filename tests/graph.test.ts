import test from 'node:test';
import assert from 'node:assert/strict';
import {displayFrame,nodeBounds} from '../src/graph.ts';
import {lessons} from '../src/content/lessons.ts';
test('delay comparison differentiates settled summary from selected instantaneous event',()=>{const l=lessons.find(l=>l.id==='delay')!;assert.equal(displayFrame(l,0,'transition').samples.q.value,'0');assert.equal(displayFrame(l,0,'transition').time,10);assert.equal(displayFrame(l,0,'cycle').samples.q.value,'1');assert.equal(displayFrame(l,0,'cycle').time,12);});
test('pin geometry respects mux and rectangular boundaries',()=>{assert.deepEqual(nodeBounds('mux','tfv'),{halfWidth:38,halfHeight:48});assert.deepEqual(nodeBounds('mux','compact'),{halfWidth:63,halfHeight:31});assert.deepEqual(nodeBounds('register','tfv'),{halfWidth:63,halfHeight:31});});
