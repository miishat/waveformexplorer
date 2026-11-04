import test from 'node:test';
import assert from 'node:assert/strict';
import {sampleRegister, pipelineTick, bitAnd, compatibleMethod, clampStep} from '../src/model.ts';
test('register hold and same-value assignment have distinct update flags',()=>{assert.deepEqual(sampleRegister(42,7,false),{value:42,assigned:false,changed:false});assert.deepEqual(sampleRegister(42,42,true),{value:42,assigned:true,changed:false});});
test('nonblocking pipeline samples all old states',()=>{assert.deepEqual(pipelineTick([42,17,0],99),[99,42,17]);});
test('four-state AND masks an unknown only with zero',()=>{assert.equal(bitAnd('X','0'),'0');assert.equal(bitAnd('X','1'),'X');});
test('register view requires cycle tracing',()=>{assert.equal(compatibleMethod('register','transition'),'cycle');assert.equal(compatibleMethod('compact','transition'),'transition');});
test('event stepping cannot leave lesson bounds',()=>{assert.equal(clampStep(99,3),2);assert.equal(clampStep(-1,3),0);});
