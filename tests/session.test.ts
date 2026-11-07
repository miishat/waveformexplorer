import test from 'node:test';
import assert from 'node:assert/strict';
import {parseSession,sanitizeProgress,hasStarted,defaultProgress} from '../src/session.ts';

const seq={id:'sampling',target:'q',frames:[1,2,3],nodes:[{id:'q'}]};
const comb={id:'delay',target:'q',frames:[1,2],nodes:[{id:'q',internal:true}]};
const lessons=[seq,comb];

test('missing or corrupt storage falls back to the first investigation',()=>{
 for(const raw of [null,'','not json','42','null']){
  assert.deepEqual(parseSession(raw,lessons),{lessonId:'sampling',appearance:'reference',sidebar:null,progress:{}});
 }
});

test('a saved session round-trips',()=>{
 const saved={lessonId:'delay',appearance:'teaching',sidebar:false,progress:{delay:{step:2,index:1,view:'compact',method:'transition',activeOnly:true}}};
 assert.deepEqual(parseSession(JSON.stringify(saved),lessons),saved);
});

test('unknown lessons are dropped and an unknown current lesson falls back',()=>{
 const s=parseSession(JSON.stringify({lessonId:'gone',progress:{gone:{step:1},sampling:{step:1}}}),lessons);
 assert.equal(s.lessonId,'sampling');
 assert.deepEqual(Object.keys(s.progress),['sampling']);
});

test('out-of-range step and frame are clamped to the start',()=>{
 const p=sanitizeProgress({step:9,index:7,view:'tfv',method:'cycle'},seq);
 assert.equal(p.step,0);assert.equal(p.index,0);
 assert.equal(sanitizeProgress({step:-1,index:1.5},seq).index,0);
});

test('register view is refused where the lesson has no register and forces cycle tracing',()=>{
 assert.equal(sanitizeProgress({view:'register'},comb).view,'tfv');
 assert.deepEqual([sanitizeProgress({view:'register',method:'transition'},seq).view,sanitizeProgress({view:'register',method:'transition'},seq).method],['register','cycle']);
});

test('an investigation counts as started once the step or observation moves',()=>{
 assert.equal(hasStarted(undefined),false);
 assert.equal(hasStarted(defaultProgress(seq)),false);
 assert.equal(hasStarted({...defaultProgress(seq),index:1}),true);
 assert.equal(hasStarted({...defaultProgress(seq),step:3}),true);
});
