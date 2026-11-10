import {n,e,frames,type Lesson,type Node} from './kit.ts';

/*
 Expert track. Each investigation is a bug where the obvious reading of the trace is wrong.
 Language behavior follows IEEE 1800 SystemVerilog semantics. Fixtures are hand-derived, not simulator-certified.
 Layout constraint: at most one internal node besides the target, because Compact view stacks internals in one slot.
*/

const pages='242–272';
const expert=(lesson:Omit<Lesson,'track'|'pages'>):Lesson=>({...lesson,track:'expert',pages});

const widthNodes:Node[]=[
 n('a','a[7:0]','pin',95,108,2,'First operand. Its value is correct in every frame.'),
 n('b','b[7:0]','pin',95,245,2,'Second operand. Its value is correct in every frame.'),
 n('f','(a+b) >> 1','function',365,175,2,'The sum is evaluated in 8 bits, the widest of a, b and avg. A ninth carry bit has nowhere to go and is dropped before the shift.','D',true),
 n('q','avg[7:0]','internal',665,175,2,'Eight-bit combinational result. It is the target width that keeps the whole expression at 8 bits.','D',true),
];

const latchNodes:Node[]=[
 n('a','a[7:0]','pin',115,110,3,'Passes straight to q whenever sel is high, with no clock involved.'),
 n('old','q (held)','register',115,245,3,'The value q must remember when sel is low. This is the storage nobody declared.'),
 n('sel','sel','control',365,310,3,'Acts as a latch enable: high is transparent, low holds.','C'),
 n('choose','sel ? a : hold','mux',365,175,3,'Conceptual expansion of an if with no else. The missing branch means "keep the old value".','D',true),
 n('q','q (latch)','register',665,175,3,'Assigned in a combinational block but not on every path, so it is a level-sensitive latch.'),
];

const xoptNodes:Node[]=[
 n('a','a[7:0]','pin',95,108,3,'Loaded when sel is 1.'),
 n('b','b[7:0]','pin',95,245,4,'Loaded when sel is anything other than 1, including X.'),
 n('sel','sel','control',340,310,3,'Never reset. It is X until something loads it.','C'),
 n('d','if (sel)','mux',355,175,3,'An if statement, not a conditional operator. An X condition is treated as false.','D',true),
 n('q','q[7:0]','register',665,175,3,'Receives a known value even though its control is unknown.'),
];

const multiNodes:Node[]=[
 n('a','a[7:0]','pin',100,80,2,'Data written by the first always block.'),
 n('ena','en_a','control',100,170,2,'Lets the first block assign q.','C'),
 n('b','b[7:0]','pin',100,260,3,'Data written by the second always block.'),
 n('enb','en_b','control',100,350,3,'Lets the second block assign q.','C'),
 n('w','last wins','function',390,215,2,'Not logic in the design. q is a variable: when two processes write it at one edge, the update applied last is the one that stays.','D',true),
 n('q','q[7:0]','register',670,215,2,'A variable assigned from two always blocks. No resolution, so no X on conflict.'),
];

const forceNodes:Node[]=[
 n('d','d[7:0]','pin',130,110,2,'The only RTL source of q.'),
 n('force','tb force','pin',130,270,4,'A force statement in the testbench. It is not in the design files and has no place in the RTL driver list.'),
 n('q','q[7:0]','register',660,190,2,'While forced, q ignores every procedural assignment.'),
];

const staleNodes:Node[]=[
 n('wd','cfg_wd[7:0]','pin',100,150,3,'Write data for the configuration register.'),
 n('we','cfg_we','control',100,300,3,'High for one edge during setup, low ever after.','C'),
 n('cfg','cfg[7:0]','register',300,190,3,'Loaded once. Its last waveform edge is thousands of nanoseconds before the symptom.'),
 n('din','din[7:0]','pin',300,60,5,'Live data. Correct in every frame.'),
 n('and','din & cfg','function',490,125,5,'Bitwise mask. It computes exactly what it is given.','D',true),
 n('q','q[7:0]','register',680,125,5,'Shows the symptom: the upper nibble is always zero.'),
];

const gateNodes:Node[]=[
 n('d','d[7:0]','pin',115,100,4,'Offered to q at every clk edge. Correct in every frame.'),
 n('en','en','control',90,310,2,'Clock enable. Sampled by the latch while clk is low.','C'),
 n('lat','en_lat','register',285,310,2,'A latch. It holds the enable steady while clk is high so gclk cannot glitch.','C'),
 n('gclk','gclk','function',480,310,3,'The gated clock, clk & en_lat. If en_lat is 0 there is no rising edge at all.','C',true),
 n('q','q[7:0]','register',670,150,4,'Clocked by gclk, not clk. Its always block contains no enable.'),
];

const pulseNodes:Node[]=[
 n('pulse','pulse','register',100,175,2,'Launched by clk_a and one clk_a cycle wide: high from 10 ns to 20 ns.'),
 n('clkb','clk_b ↑','control',520,310,3,'Three times slower than clk_a. Rising edges at 5 ns and 35 ns.','C'),
 n('sync1','sync1','register',330,175,4,'First synchronizer flop. It only sees pulse at clk_b edges.'),
 n('q','q','register',670,175,5,'Second synchronizer flop.'),
];

const glitchNodes:Node[]=[
 n('old','q (previous)','register',105,90,4,'The count before this event.'),
 n('sum','+ 1','function',365,110,4,'Increment taken at each clock edge while rst_n is high.','D',true),
 n('a','a','pin',90,235,2,'Falls at 14 ns.','C'),
 n('b','b','pin',90,340,2,'Rises at 15 ns, one nanosecond after a falls.','C'),
 n('rst','rst_n','control',350,290,2,'Decoded as a | b and wired straight to an asynchronous pin. Any low pulse clears q, however short.','C'),
 n('q','q[7:0]','register',665,130,4,'A counter with an asynchronous active-low reset.'),
];

const raceNodes:Node[]=[
 n('din','din[7:0]','pin',90,150,3,'Sampled by d1 at each clk edge.'),
 n('d1','d1[7:0]','register',300,150,3,'Clocked by clk. Its update lands in the NBA region.'),
 n('clkdiv','clk_div ↑','control',480,310,2,'A divided clock produced by a nonblocking assignment, so it also changes in the NBA region.','C'),
 n('q','q[7:0]','register',670,150,4,'Clocked by clk_div. Its block runs only after clk_div has changed.'),
];

export const expertLessons:Lesson[]=[
 expert({
  id:'width',title:'The Carry With Nowhere to Go',tag:'Expression Width',
  question:'Why is avg 0x10 when a=0xF0 and b=0x30?',
  summary:'Every operand is right and the result is wrong. Read the expression, not the path.',
  rtl:['logic [7:0] a, b, avg;','assign avg = (a + b) >> 1;'],
  nodes:widthNodes,edges:[e('a','f'),e('b','f'),e('f','q')],target:'q',
  frames:frames(widthNodes,[
   {time:10,title:'Small operands hide the bug',event:'Combinational settled sample',why:'a=0x20 and b=0x40 sum to 0x60, which fits in 8 bits. The shift gives 0x30, the correct average. Tests with small values pass.',values:{a:'20',b:'40',f:'30',q:'30'},transitions:['q']},
   {time:20,title:'The carry is dropped before the shift',event:'Combinational settled sample',why:'0xF0 + 0x30 is 0x120. Every operand and the target are 8 bits wide, so the sum is computed in 8 bits and becomes 0x20. Shifting gives 0x10. The intended average is 0x90.',values:{a:'F0',b:'30',f:'10',q:'10'},transitions:['a','b','f','q']},
   {time:30,title:'Tracing further back finds nothing',event:'Combinational settled sample',why:'0x80 + 0x80 is 0x100, truncated to 0x00, so avg is 0x00 instead of 0x80. a and b are both correct. Following them upstream leads away from the fault, which is the width of this one expression.',values:{a:'80',b:'80',f:'00',q:'00'},transitions:['a','b','f','q']},
  ]),
  locate:{prompt:'Select the place where the wrong value is first created, at a time when it is wrong.',nodes:['f'],frames:[1,2],explanation:'The inputs are correct and the result is not, so the fault is the expression itself. It is wrong at 20 ns and again at 30 ns.'},
  exercise:{q:'a and b are correct at 20 ns. Why is avg 0x10 and not 0x90?',options:['The shift is arithmetic and copied the sign bit','a + b is evaluated in 8 bits, so the carry is lost before the shift','b was sampled one event late','avg is treated as signed'],answer:1,explanation:'The operands of + take the widest width among a, b and the assignment target. That is 8 bits, so bit 8 of the sum never exists.'},
  pitfall:'When every input on the path is correct and the output is not, stop tracing and read the widths in the expression.',
  methodNote:'Expression sizing follows IEEE 1800: the operands of + and the left operand of >> are sized to the widest of the operands and the target. No storage is present, so Register view is unavailable.',
 }),
 expert({
  id:'latch',title:'The Latch You Did Not Write',tag:'Inferred Latch',
  question:'Why does q hold 0x77 when a is 0x55?',
  summary:'Find storage in a block that was meant to be combinational.',
  rtl:['logic [7:0] a, q;  logic sel;','always @*','  if (sel) q = a;        // no else branch'],
  nodes:latchNodes,edges:[e('a','choose'),e('old','choose'),e('sel','choose','C'),e('choose','q')],target:'q',
  frames:frames(latchNodes,[
   {time:10,title:'sel opens the path',event:'sel: 0 → 1; no clock',why:'sel rises and q takes a=0x2A at once. So far this looks like ordinary combinational logic.',values:{a:'2A',old:'00',sel:'1',choose:'2A',q:'2A'},inactive:['old'],transitions:['sel','choose','q'],at:{old:'before 10 ns'}},
   {time:13,title:'q follows a between clock edges',event:'a changes while sel is high; no clock',why:'a changes to 0x77 at 13 ns and q follows immediately. No clock edge is involved. A register would have waited; a transparent latch passes changes for as long as it is open.',values:{a:'77',old:'2A',sel:'1',choose:'77',q:'77'},inactive:['old'],transitions:['a','choose','q'],at:{old:'10 ns'}},
   {time:20,title:'sel closes and q remembers',event:'sel: 1 → 0; no clock',why:'sel falls. The if has no else, so q is not assigned and must keep 0x77. a moves on to 0x55 and q ignores it. Something is storing a value, and the source has no flip-flop.',values:{a:'55',old:'77',sel:'0',choose:'77',q:'77'},inactive:['a'],assigned:false,changed:false,transitions:['a','sel'],at:{old:'13 ns'}},
  ]),
  locate:{prompt:'Select the input q followed, at the moment q changed with no clock edge.',nodes:['a'],frames:[1],explanation:'At 13 ns q followed a through the open latch. A change between clock edges is what gives the latch away.'},
  exercise:{q:'Where is the storage element holding 0x77 at 20 ns?',options:['A flip-flop clocked by sel','A latch inferred because the if has no else','Nowhere: q is combinational and will settle to 0x55','Inside a'],answer:1,explanation:'A variable that is not assigned on every path through a combinational block has to remember its value. That is a level-sensitive latch.'},
  pitfall:'A latch changes whenever its open input changes, not at a clock edge. Looking only at clock edges will miss when q actually moved.',
  methodNote:'The hold mux is a conceptual expansion. Written with always_comb, most tools would warn about this code; always @* accepts it silently.',
  methodText:{cycle:'A cycle-based reading samples at clock edges. The 13 ns change, where q followed a through the open latch, falls between them.',transition:'Each change of q lines up with a change of a or sel, not with a clock. That pattern is the signature of a latch.'},
 }),
 expert({
  id:'xopt',title:'The X That Looked Like a Zero',tag:'X-Optimism',
  question:'Why is q clean while sel is X?',
  summary:'See how an if statement swallows an unknown control.',
  rtl:['logic sel;  logic [7:0] a, b, q;   // sel has no reset','always_ff @(posedge clk)','  if (sel) q <= a;','  else     q <= b;'],
  nodes:xoptNodes,edges:[e('a','d'),e('b','d'),e('sel','d','C'),e('d','q')],target:'q',
  frames:frames(xoptNodes,[
   {time:10,title:'An unknown control, a known result',why:'sel is X. An if condition that is X counts as false, so the else branch runs and q loads b=0x77. Nothing downstream of q is X.',values:{a:'2A',b:'77',sel:'X',d:'77',q:'77'},inactive:['a'],transitions:['q'],at:{a:'10 ns−',b:'10 ns−',sel:'never loaded',d:'10 ns−',q:'10 ns+'}},
   {time:20,title:'It keeps looking like sel=0',why:'sel is still X and q follows b to 0x55. The waveform is indistinguishable from a working design with sel low. A conditional operator, sel ? a : b, would instead have merged the operands and shown X on every bit where they differ.',values:{a:'2A',b:'55',sel:'X',d:'55',q:'55'},inactive:['a'],transitions:['b','d','q'],at:{a:'20 ns−',b:'20 ns−',sel:'never loaded',d:'20 ns−',q:'20 ns+'}},
   {time:30,title:'The control becomes known',why:'sel is finally loaded with 1 and q switches to a. Every value q held before this edge depended on a control that was never known. Gate-level simulation of the same logic, or the real circuit, could have chosen either input.',values:{a:'2A',b:'55',sel:'1',d:'2A',q:'2A'},inactive:['b'],transitions:['sel','d','q'],at:{a:'30 ns−',b:'30 ns−',sel:'30 ns−',d:'30 ns−',q:'30 ns+'}},
  ]),
  locate:{prompt:'Select the signal that is the real problem, at the first edge where it decided q.',nodes:['sel'],frames:[0],explanation:'sel was X at the very first edge. q looked fine, which is exactly why this is easy to miss.'},
  exercise:{q:'sel is X at 10 ns, yet q is a clean 0x77. What does that tell you?',options:['sel was really 0 and the X is a display artifact','The if treated X as false, so simulation silently took the else branch','b has priority over a in a multiplexer','q was not assigned at 10 ns'],answer:1,explanation:'RTL simulation is optimistic here: the X disappears at the if. A clean q is not evidence that sel was known.'},
  pitfall:'An X trace started from a downstream symptom may never reach this register, because the X stopped existing here. Check the controls of clean values too.',
  methodNote:'IEEE 1800 if semantics: a condition that is X or Z is treated as false. The mux symbol is a conceptual expansion of the if/else.',
 }),
 expert({
  id:'multidrv',title:'Two Blocks, One Variable',tag:'Process Races',
  question:'Which block wrote q at 30 ns?',
  summary:'Contrast a doubly-assigned variable with a doubly-driven wire.',
  rtl:['logic [7:0] q, a, b;  logic en_a, en_b;','always @(posedge clk) if (en_a) q <= a;','always @(posedge clk) if (en_b) q <= b;'],
  nodes:multiNodes,edges:[e('a','w'),e('ena','w','C'),e('b','w'),e('enb','w','C'),e('w','q')],target:'q',
  frames:frames(multiNodes,[
   {time:10,title:'Only the first block writes',why:'en_a=1 and en_b=0. One assignment executes and q loads 0x2A.',values:{a:'2A',ena:'1',b:'77',enb:'0',w:'2A',q:'2A'},inactive:['b'],transitions:['q'],at:{a:'10 ns−',ena:'10 ns−',b:'10 ns−',enb:'10 ns−',w:'10 ns−',q:'10 ns+'}},
   {time:20,title:'Only the second block writes',why:'The enables swap and q loads 0x77. Each block is correct on its own, and a review of either one finds nothing.',values:{a:'2A',ena:'0',b:'77',enb:'1',w:'77',q:'77'},inactive:['a'],transitions:['ena','enb','w','q'],at:{a:'20 ns−',ena:'20 ns−',b:'20 ns−',enb:'20 ns−',w:'20 ns−',q:'20 ns+'}},
   {time:30,title:'Both write, and nothing complains',why:'Both enables are high and both assignments execute. Each schedules its own update of q, and the one applied last stays. Here that is b, so q remains 0x77 with no X and no transition. The standard does not fix which block runs first: another simulator may give 0x2A. a is drawn inactive because its write was overwritten, not because it was skipped.',values:{a:'2A',ena:'1',b:'77',enb:'1',w:'77',q:'77'},inactive:['a'],changed:false,transitions:['ena'],at:{a:'30 ns−',ena:'30 ns−',b:'30 ns−',enb:'30 ns−',w:'30 ns−',q:'30 ns+'}},
  ]),
  locate:{prompt:'Select the write that was silently overwritten, at the edge where it happened.',nodes:['a','ena'],frames:[2],explanation:'At 30 ns the first block wrote 0x2A and lost. Either its data or its enable identifies that write.'},
  exercise:{q:'At 30 ns both assignments execute. What decides the value of q?',options:['Resolution: bits that disagree become X','The order in which the simulator happens to run the two blocks','The assignment on the earlier source line','en_a has priority over en_b'],answer:1,explanation:'q is a variable, not a net, so there is no resolution. The last update applied wins, and the order of the two processes is not defined.'},
  pitfall:'A conflict on a variable produces a plausible value, not an X. A regression can pass on one simulator and fail on another with no change to the design.',
  methodNote:'The 0x77 at 30 ns is a fixture assumption about process order. always_ff would reject this code at compile time; plain always does not. Compare with Find Which Driver Won, where a wire resolves to X.',
 }),
 expert({
  id:'forced',title:'A Value With No Driver',tag:'Force and Release',
  question:'Why is q 0xFF when d is 0x55?',
  summary:'Recognize a value that did not come from the design at all.',
  rtl:['logic [7:0] d, q;','always_ff @(posedge clk) q <= d;','// testbench, in another file:','//   #15 force top.q = 8\'hFF;   #10 release top.q;'],
  nodes:forceNodes,edges:[e('d','q'),e('force','q',undefined,'A force is applied from outside the design. It overrides the RTL driver for as long as it is in effect.')],target:'q',
  frames:frames(forceNodes,[
   {time:10,title:'Normal operation',why:'q loads d=0x2A at the clock edge. The only driver in the RTL is line 2.',values:{d:'2A',force:'—',q:'2A'},inactive:['force'],transitions:['q'],at:{d:'10 ns−',force:'not active',q:'10 ns+'}},
   {time:15,title:'q changes with no clock edge',event:'force in the testbench; no clock edge',why:'q becomes 0xFF at 15 ns, between clock edges, and d never held 0xFF. No statement in the design can explain this transition. The cause is a force in the testbench.',values:{d:'2A',force:'FF',q:'FF'},inactive:['d'],transitions:['force','q'],at:{d:'10 ns−',force:'15 ns',q:'15 ns'}},
   {time:20,title:'The assignment runs and loses',why:'The clock edge arrives and q <= d executes with d=0x55. q stays 0xFF. A forced variable ignores procedural assignments until it is released.',values:{d:'55',force:'FF',q:'FF'},inactive:['d'],changed:false,transitions:['d'],at:{d:'20 ns−',force:'15 ns',q:'15 ns'}},
   {time:30,title:'Released, then reloaded',why:'The release at 25 ns did not change q: a released variable keeps the forced value until its next procedural assignment. That assignment happens now, and q loads d=0x66.',values:{d:'66',force:'—',q:'66'},inactive:['force'],transitions:['d','force','q'],at:{d:'30 ns−',force:'released 25 ns',q:'30 ns+'}},
  ]),
  locate:{prompt:'Select what changed q at the moment no statement in the design could have.',nodes:['force'],frames:[1],explanation:'At 15 ns q changed with no clock edge and no matching value on d. Only the testbench force explains it.'},
  exercise:{q:'At 20 ns q <= d executes with d = 0x55, yet q stays 0xFF. Why?',options:['d was sampled as 0xFF','A force overrides every procedural assignment until it is released','q has two drivers in the RTL','The clock edge at 20 ns was missing'],answer:1,explanation:'The force is outside the design. The assignment did execute; its result was overridden.'},
  pitfall:'If no RTL driver explains a value or the time it changed, look outside the RTL: a force, a deposit, or a backdoor write from the testbench.',
  methodNote:'Force and release follow IEEE 1800. Whether forces are recorded in the dump, and how a tool marks them, depends on dump options and release. Check what your setup records.',
  methodText:{cycle:'At clock edges q reads 2A, FF, 66. The step to 0xFF looks like a load of bad data, and the natural next move is to trace d, which is innocent.',transition:'q changed at 15 ns with no clock edge and no change on d. A register transition with no triggering event in the design is the clue.'},
 }),
 expert({
  id:'stale',title:'The Cause Was Long Ago',tag:'Long History',
  question:'Why is the upper nibble of q always zero?',
  summary:'Follow a quiet register back to a write far outside the visible window.',
  rtl:['logic [7:0] cfg, din, q;','always_ff @(posedge clk)','  if (cfg_we) cfg <= cfg_wd;     // written once, during setup','always_ff @(posedge clk)','  q <= din & cfg;                // cfg masks the data'],
  nodes:staleNodes,edges:[e('wd','cfg'),e('we','cfg','C'),e('din','and'),e('cfg','and'),e('and','q')],target:'q',
  frames:frames(staleNodes,[
   {time:40,title:'A setup write, long before the symptom',why:'cfg_we=1 and cfg_wd=0x0F, so cfg loads 0x0F. The intended mask was 0xFF. Nothing looks wrong: din is 0x00, so q is 0x00 with either mask.',values:{wd:'0F',we:'1',cfg:'0F',din:'00',and:'00',q:'00'},sampleValues:{cfg:'00'},changed:false,transitions:['cfg'],at:{wd:'40 ns−',we:'40 ns−',cfg:'40 ns−',din:'40 ns−',and:'40 ns−',q:'40 ns+'}},
   {time:9000,title:'The symptom appears',why:'din=0x2A but q loads 0x0A. din is correct and the AND is correct. The other operand, cfg, has not changed for 8960 ns, so no edge on it is anywhere near the cursor.',values:{wd:'00',we:'0',cfg:'0F',din:'2A',and:'0A',q:'0A'},inactive:['wd'],transitions:['din','and','q'],at:{wd:'not written',we:'9000 ns−',cfg:'40 ns+ (last load)',din:'9000 ns−',and:'9000 ns−',q:'9000 ns+'}},
   {time:9010,title:'Every later value is damaged the same way',why:'din=0x77 gives q=0x07. The pattern, not any one value, points at cfg. Trace cfg to its last load at 40 ns and from there to cfg_wd: the cause is the setup write, 8960 ns before the first bad output.',values:{wd:'00',we:'0',cfg:'0F',din:'77',and:'07',q:'07'},inactive:['wd'],transitions:['din','and','q'],at:{wd:'not written',we:'9010 ns−',cfg:'40 ns+ (last load)',din:'9010 ns−',and:'9010 ns−',q:'9010 ns+'}},
  ]),
  locate:{prompt:'Select where the bad value entered the design, at the event that brought it in.',nodes:['cfg','wd'],frames:[0],explanation:'The bad mask was written at 40 ns. Everything after that computed correctly from a wrong configuration.'},
  exercise:{q:'q is wrong at 9000 ns. Where does the trace need to go?',options:['din at 9000 ns','The cfg write at 40 ns, the last event that loaded cfg','The AND operator','cfg_we at 9000 ns'],answer:1,explanation:'cfg is an active operand whose value was set at its last load. That load is the event to inspect, however far back it is.'},
  pitfall:'A stable operand is still a cause. Its relevant event is its last load, and that time has to be inside the dumped window for the trace to reach it.',
  methodNote:'Combines the Enable and Pipeline ideas over a long span. Line length in the diagram is not time: the cfg edge spans 8960 ns, the others one cycle.',
 }),
 expert({
  id:'gated',title:'The Clock That Never Arrived',tag:'Clock Gating',
  question:'Why did q never hold 0x77?',
  summary:'Treat the clock pin as a dependency and find the edge that did not happen.',
  rtl:['logic [7:0] d, q;  logic en, en_lat, gclk;','always_latch if (!clk) en_lat <= en;   // transparent while clk is low','assign gclk = clk & en_lat;','always_ff @(posedge gclk) q <= d;'],
  nodes:gateNodes,edges:[e('d','q'),e('en','lat'),e('lat','gclk'),e('gclk','q','C','The clock of q. No rising edge here means the assignment to q is never triggered.')],target:'q',
  frames:frames(gateNodes,[
   {time:10,title:'Enabled: the gated clock rises',event:'posedge clk; gclk rises',why:'en was high while clk was low, so the latch passed it and gclk rises with clk. q loads d=0x2A.',values:{d:'2A',en:'1',lat:'1',gclk:'1',q:'2A'},transitions:['gclk','q'],at:{d:'10 ns−',en:'10 ns−',lat:'10 ns−',gclk:'10 ns',q:'10 ns+'}},
   {time:20,title:'clk rises, gclk does not',event:'posedge clk; no gclk edge',why:'en fell at 13 ns and the latch captured 0 during the low phase, so gclk stays low through this clk edge. The block that assigns q is never triggered. d=0x77 is offered and ignored, and q\'s own always block contains no enable that would explain it.',values:{d:'77',en:'0',lat:'0',gclk:'0',q:'2A'},inactive:['d'],assigned:false,changed:false,transitions:['d','en','lat'],at:{d:'20 ns−',en:'20 ns−',lat:'20 ns−',gclk:'10 ns (last edge)',q:'10 ns+'}},
   {time:30,title:'The next edge loads a different value',event:'posedge clk; gclk rises',why:'en returned at 23 ns, so gclk rises again and q loads d, now 0x55. q went from 0x2A to 0x55. 0x77 was never captured, and every signal on the data path was correct the whole time.',values:{d:'55',en:'1',lat:'1',gclk:'1',q:'55'},transitions:['d','en','lat','gclk','q'],at:{d:'30 ns−',en:'30 ns−',lat:'30 ns−',gclk:'30 ns',q:'30 ns+'}},
  ]),
  locate:{prompt:'Select a signal on the path that stopped q from loading, at the edge where 0x77 was offered.',nodes:['gclk','lat','en'],frames:[1],explanation:'At 20 ns the gated clock had no rising edge because the enable was low. The data input was never the problem.'},
  exercise:{q:'q skipped 0x77. What should you trace first?',options:['The data input d, which must have been late','The clock pin: gclk had no rising edge at 20 ns','A reset on q','The latch output, which must be X'],answer:1,explanation:'d was correct at 20 ns. q did not update because its clock never rose, and the reason for that is on the enable path.'},
  pitfall:'A register that fails to update may have had no clock edge. Tracing data alone will never reach the enable of a gated clock.',
  methodNote:'A latch-based clock gate written out in RTL for teaching. In a real design this is usually a library cell, and how the clock path is drawn depends on the tool and settings.',
  methodText:{cycle:'A cycle-based reading counts clk edges and expects q to load at each one. For q the 20 ns cycle does not exist, because its clock is gclk.',transition:'Match each transition of q to an edge of gclk rather than clk. The missing transition at 20 ns lines up with a missing gclk edge.'},
 }),
 expert({
  id:'pulse',title:'A Pulse Too Short to Cross',tag:'Clock Domains',
  question:'Why did q never rise?',
  summary:'Find an event that the destination clock never sampled.',
  rtl:['logic pulse, sync1, q;','always_ff @(posedge clk_a) pulse <= start;   // one clk_a cycle wide','always_ff @(posedge clk_b) begin             // clk_b is 3x slower','  sync1 <= pulse;','  q     <= sync1;','end'],
  nodes:pulseNodes,edges:[e('pulse','sync1'),e('clkb','sync1','C'),e('sync1','q'),e('clkb','q','C')],target:'q',
  frames:frames(pulseNodes,[
   {time:10,title:'pulse rises in domain A',event:'posedge clk_a; no clk_b edge',why:'pulse goes high at a clk_a edge. The last clk_b edge was at 5 ns and the next is at 35 ns, so nothing in domain B runs now.',values:{pulse:'1',clkb:'1',sync1:'0',q:'0'},inactive:['pulse','clkb'],assigned:false,changed:false,transitions:['pulse'],at:{pulse:'10 ns+',clkb:'5 ns (last edge)',sync1:'5 ns+',q:'5 ns+'}},
   {time:20,title:'pulse falls, still unseen',event:'posedge clk_a; no clk_b edge',why:'One clk_a cycle later pulse returns to 0. Domain B has not had an edge since 5 ns. The whole pulse fit between two clk_b edges.',values:{pulse:'0',clkb:'1',sync1:'0',q:'0'},inactive:['pulse','clkb'],assigned:false,changed:false,transitions:['pulse'],at:{pulse:'20 ns+',clkb:'5 ns (last edge)',sync1:'5 ns+',q:'5 ns+'}},
   {time:35,title:'The synchronizer samples a zero',event:'posedge clk_b',why:'sync1 samples pulse=0 and q samples sync1=0. Both flops did exactly what they should. Tracing backward from q finds a zero at every clk_b edge, because the event that matters is one that domain B never observed.',values:{pulse:'0',clkb:'1',sync1:'0',q:'0'},changed:false,at:{pulse:'35 ns−',clkb:'35 ns',sync1:'35 ns−',q:'35 ns+'}},
  ]),
  locate:{prompt:'Select the signal and the moment that hold the evidence domain B never saw.',nodes:['pulse'],frames:[0],explanation:'pulse is 1 only around 10 ns, between the clk_b edges at 5 ns and 35 ns. No destination flop ever shows it.'},
  exercise:{q:'Both flops work and pulse really was 1. Why did q never rise?',options:['Metastability destroyed the pulse','pulse was high only between two clk_b edges, so it was never sampled','sync1 has no reset','q needs a third synchronizer flop'],answer:1,explanation:'A two-flop synchronizer passes levels, not events. A pulse shorter than the destination clock period can be missed entirely.'},
  pitfall:'When the evidence is an event that is missing, tracing back from the destination shows only correct zeros. Inspect the source domain between destination edges.',
  methodNote:'RTL simulation shows clean samples; metastability is not modeled. The usual fix is to stretch the pulse or convert it to a toggle or handshake. Compare with Sample a Signal From Another Clock, where a level crosses safely.',
  methodText:{cycle:'In domain B a cycle-based reading looks only at clk_b edges, 5 ns and 35 ns. pulse is 0 at both, so the pulse does not exist at this resolution.',transition:'Follow the transitions on pulse itself: up at 10 ns, down at 20 ns, both between clk_b edges.'},
 }),
 expert({
  id:'glitch',title:'A Reset Nobody Asserted',tag:'Glitches',
  question:'Why did the counter restart at 14 ns?',
  summary:'Catch a pulse that is invisible at every clock edge.',
  rtl:['logic a, b, rst_n;  logic [7:0] q;','assign rst_n = a | b;                 // decoded, not registered','always_ff @(posedge clk or negedge rst_n)','  if (!rst_n) q <= \'0; else q <= q + 8\'d1;'],
  nodes:glitchNodes,edges:[e('old','sum'),e('sum','q'),e('a','rst'),e('b','rst'),e('rst','q','C','An asynchronous reset. It acts on any falling edge, with or without a clock.')],target:'q',
  defaultMethod:'transition',cycleFrames:[0,3,3,3],
  frames:frames(glitchNodes,[
   {time:10,title:'Counting normally',why:'rst_n is high because a=1. The counter increments from 0x29 to 0x2A.',values:{old:'29',sum:'2A',a:'1',b:'0',rst:'1',q:'2A'},transitions:['sum','q'],at:{old:'0 ns+',sum:'10 ns−',a:'10 ns−',b:'10 ns−',rst:'10 ns−',q:'10 ns+'}},
   {time:14,title:'a falls before b rises',event:'a: 1 → 0; negedge rst_n; no clock edge',why:'a and b were meant to swap together, but a falls 1 ns early. For that nanosecond a | b is 0. The falling edge of rst_n triggers the reset branch and q clears to 0x00.',values:{old:'2A',sum:'2B',a:'0',b:'0',rst:'0',q:'00'},inactive:['old','sum'],transitions:['a','rst','q'],at:{old:'10 ns+',sum:'not used',a:'14 ns',b:'14 ns',rst:'14 ns',q:'14 ns'}},
   {time:15,title:'rst_n recovers; the damage stays',event:'b: 0 → 1; rst_n returns high; no clock edge',why:'b rises and rst_n is high again. Nothing reloads q, so the count is lost. The low pulse was 1 ns wide and is already over.',values:{old:'00',sum:'01',a:'0',b:'1',rst:'1',q:'00'},inactive:['old','sum'],assigned:false,changed:false,transitions:['b','rst'],at:{old:'14 ns',sum:'not used',a:'14 ns',b:'15 ns',rst:'15 ns',q:'14 ns'}},
   {time:20,title:'The next edge counts from zero',why:'rst_n is high at this clock edge, as it was at 10 ns. The counter increments from 0x00 to 0x01. Sampled at clock edges, rst_n was never low.',values:{old:'00',sum:'01',a:'0',b:'1',rst:'1',q:'01'},transitions:['q'],at:{old:'14 ns (cleared)',sum:'20 ns−',a:'20 ns−',b:'20 ns−',rst:'20 ns−',q:'20 ns+'}},
  ]),
  locate:{prompt:'Select the first event in the chain that cleared q.',nodes:['a'],frames:[1],explanation:'a fell at 14 ns, 1 ns before b rose. That made rst_n pulse low, and the pulse cleared q.'},
  exercise:{q:'rst_n is 1 at every clock edge. What cleared q?',options:['A synchronous clear inside the counter','A 1 ns low pulse on rst_n while a and b changed 1 ns apart','The 8-bit counter overflowed','An X on a'],answer:1,explanation:'An asynchronous pin responds to edges at any time. The pulse sat entirely between 10 ns and 20 ns.'},
  pitfall:'A signal that is correct at every clock edge can still act between edges on an asynchronous pin. Decoded logic on a reset or clock pin is the usual source.',
  methodNote:'The 1 ns skew between a and b is a fixture assumption standing in for unequal delays. In zero-delay RTL the two changes could land in one timestep, and whether a glitch appears then depends on evaluation order.',
  methodText:{cycle:'Cycle-based: the diagram shows values at the surrounding clock edges only. rst_n is 1 at 10 ns and at 20 ns, and q drops from 0x2A to 0x01 with no visible cause.',transition:'Transition-based: q changed at 14 ns, caused by negedge rst_n, caused by a falling. Each hop is a real event with its own time.'},
 }),
 expert({
  id:'race',title:'Three Steps Inside One Timestamp',tag:'Scheduling',
  question:'Why does din reach q in a single clk edge?',
  summary:'Order the events that a waveform draws on top of each other.',
  rtl:['logic clk_div;  logic [7:0] din, d1, q;','always_ff @(posedge clk)     clk_div <= ~clk_div;   // divided clock','always_ff @(posedge clk)     d1 <= din;','always_ff @(posedge clk_div) q  <= d1;'],
  nodes:raceNodes,edges:[e('din','d1'),e('d1','q'),e('clkdiv','q','C','The clock of q. It is produced by a nonblocking assignment, so it changes after right-hand sides were sampled.')],target:'q',
  defaultMethod:'transition',cycleFrames:[2,2,2],
  frames:frames(raceNodes,[
   {time:10,label:'10 ns (1)',title:'The clk edge samples right-hand sides',event:'posedge clk; Active region',why:'Two blocks run on posedge clk. One reads din=0x2A for d1, the other reads ~clk_div=1. Both results are scheduled as nonblocking updates, so nothing has changed yet: d1 is still 0x11 and clk_div is still 0.',values:{din:'2A',d1:'11',clkdiv:'0',q:'00'},inactive:['clkdiv'],assigned:false,changed:false,at:{din:'10 ns−',d1:'0 ns+',clkdiv:'no edge yet',q:'0 ns+'}},
   {time:10,label:'10 ns (2)',title:'Both updates land together',event:'Same timestamp; NBA region',why:'d1 becomes 0x2A and clk_div rises, in the same region. The rising clk_div is a new event, and the block waiting for it has not run yet.',values:{din:'2A',d1:'2A',clkdiv:'1',q:'00'},assigned:false,changed:false,transitions:['d1','clkdiv'],at:{din:'10 ns−',d1:'10 ns (NBA)',clkdiv:'10 ns (NBA)',q:'0 ns+'}},
   {time:10,label:'10 ns (3)',title:'q samples data that is already new',event:'Same timestamp; posedge clk_div',why:'Now the clk_div block runs. It reads d1 after the update, so q takes 0x2A in the same 10 ns edge that launched it. In the waveform din reaches q with one register of delay instead of two. On silicon this is a hold-time race between clk_div and d1.',values:{din:'2A',d1:'2A',clkdiv:'1',q:'2A'},transitions:['q'],at:{din:'10 ns−',d1:'10 ns (after NBA)',clkdiv:'10 ns (NBA)',q:'10 ns+'}},
  ]),
  locate:{prompt:'Select the signal whose late update lets q see new data, at the step where it changes.',nodes:['clkdiv'],frames:[1],explanation:'clk_div rises in step 2, together with d1. The block it triggers therefore runs after d1 already holds the new value.'},
  exercise:{q:'q loads 0x2A at the same 10 ns edge where d1 loads it. Why?',options:['q is driven directly by din','clk_div rises in the NBA region, so q\'s block runs after d1 has already updated','The simulator evaluated the always blocks in the wrong order','d1 uses a blocking assignment'],answer:1,explanation:'Nonblocking updates complete before the blocks they trigger run. A clock generated by a nonblocking assignment therefore arrives after the data launched by the same edge.'},
  pitfall:'Events at one timestamp still have an order. A waveform cursor cannot show it, and counting pipeline stages from the picture gives the wrong latency.',
  methodNote:'Ordering follows the IEEE 1800 scheduling regions. All three steps share the timestamp 10 ns; whether a dump records the order within a timestep depends on dump options.',
  methodText:{cycle:'Cycle-based: the three steps collapse into one 10 ns edge. d1 and q both show 0x2A, with nothing to say which updated first.',transition:'Transition-based: each step is its own event. Follow q to the clk_div edge, then notice that edge was itself produced by a nonblocking assignment.'},
 }),
];
