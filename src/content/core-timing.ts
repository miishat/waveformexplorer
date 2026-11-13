import {n, e, frames, type Lesson} from './kit.ts';

/**
 * Core investigations on behavior that a clock-edge reading hides: glitches, combinational
 * loops and testbench forces. They introduce ideas the expert track builds on.
 */

const hazardNodes = [
  n('b', 'b', 'pin', 105, 150, 2, 'The only input. y is meant to be 0 for every value of b.'),
  n(
    'nb',
    '#1 ~b',
    'function',
    355,
    270,
    3,
    'An inverter with a 1 ns delay. Its output lags every change of b.',
    'D',
    true,
  ),
  n(
    'q',
    'y',
    'internal',
    665,
    150,
    4,
    'y = b & nb. On paper this is always 0, because nb is the inverse of b.',
    'D',
    true,
  ),
];

const loopNodes = [
  n(
    'a',
    'a',
    'control',
    105,
    110,
    2,
    'Enable input. While a is 0 the NAND output is held at 1, so the loop is quiet.',
    'C',
  ),
  n(
    'yfb',
    'y (fed back)',
    'wire',
    105,
    260,
    3,
    'The same signal y feeding back into the NAND input. The NAND reads it 1 ns before its new output appears on y.',
  ),
  n(
    'nand',
    '#1 NAND',
    'function',
    375,
    185,
    3,
    'Computes ~(a & y) and drives y 1 ns later.',
    'D',
    true,
  ),
  n(
    'q',
    'y',
    'internal',
    665,
    185,
    3,
    'The output of the NAND, which is also one of its inputs.',
    'D',
    true,
  ),
];

const forceNodes = [
  n('a', 'a[7:0]', 'pin', 105, 120, 1, 'The operand of the continuous assignment to y.'),
  n(
    'add',
    'a + 1',
    'function',
    375,
    120,
    2,
    'What the continuous assignment drives onto y. It keeps computing while y is forced.',
    'D',
    true,
  ),
  n(
    'frc',
    'force (tb)',
    'control',
    375,
    300,
    4,
    'A testbench force. While it is active it overrides every driver of y.',
    'C',
  ),
  n(
    'q',
    'y[7:0]',
    'internal',
    665,
    120,
    1,
    'A net. Its value comes from its driver, unless a force overrides it.',
    'D',
    true,
  ),
];

export const timingLessons: Lesson[] = [
  {
    id: 'hazard',
    title: 'A Pulse From Logic That Is Always Zero',
    tag: 'Glitches',
    question: 'Why does y pulse high at 10 ns when y = b & ~b?',
    summary: 'See a glitch in transition history that a settled reading hides.',
    rtl: [
      'timeunit 1ns;',
      'logic b;  wire nb, y;',
      'assign #1 nb = ~b;',
      'assign y = b & nb;      // "always 0"',
    ],
    nodes: hazardNodes,
    edges: [e('b', 'nb'), e('b', 'q'), e('nb', 'q')],
    target: 'q',
    frames: frames(hazardNodes, [
      {
        time: 5,
        title: 'Steady state',
        event: 'No change; settled values',
        why: 'b=0 and nb=1, so y = 0 & 1 = 0. On paper y = b & ~b can never be 1.',
        values: {b: '0', nb: '1', q: '0'},
        inactive: ['nb'],
        assigned: false,
        changed: false,
      },
      {
        time: 10,
        title: 'b rises before nb can fall',
        event: 'b: 0 → 1; nb update due at 11 ns',
        why: 'b rises at 10 ns and y reacts at once, but nb only falls after its 1 ns delay. For that nanosecond both inputs are 1, so y = 1: a glitch.',
        values: {b: '1', nb: '1', q: '1'},
        at: {nb: 'before 10 ns (update due 11 ns)'},
        transitions: ['b', 'q'],
      },
      {
        time: 11,
        title: 'nb catches up',
        event: 'nb: 1 → 0; y: 1 → 0',
        why: 'nb falls at 11 ns and y returns to 0. The pulse lasted exactly the inverter delay. A settled reading of this interval would show y=0 throughout.',
        values: {b: '1', nb: '0', q: '0'},
        at: {b: '10 ns'},
        inactive: ['b'],
        transitions: ['nb', 'q'],
      },
    ]),
    locate: {
      prompt: 'Select the input that was late, at the moment y glitched high.',
      nodes: ['nb'],
      frames: [1],
      explanation:
        'At 10 ns nb still held 1, because its update was 1 ns behind b. That lag between two paths from the same input is the cause of the glitch.',
    },
    exercise: {
      q: 'When does a glitch like this one cause a real failure?',
      options: [
        'Always: any pulse on y is a bug',
        'When something that reacts between clock edges sees it, such as an asynchronous reset, a clock or a latch enable',
        'Never: glitches cannot happen in RTL simulation',
        'Only in gate-level simulation',
      ],
      answer: 1,
      explanation:
        'A flop that samples y at a clock edge sees the settled 0, provided the pulse is over before the edge, so in a synchronous path this glitch is harmless. It matters when y drives something that reacts between edges. The expert track has an investigation where exactly this happens to a reset.',
    },
    pitfall:
      'Logic that is constant on paper can still pulse in simulation when one path from an input is slower than another.',
    pages: '249–250',
    defaultMethod: 'transition',
    cycleFrames: [0, 2, 2],
    methodText: {
      cycle:
        'Settled reading: y is 0 before and after b rises. The 10 to 11 ns pulse falls between settled states, so it disappears.',
      transition:
        'Event history: b rises at 10 ns and y rises with it, then nb catches up at 11 ns and y falls. The glitch exists only in this reading.',
    },
    methodNote:
      'The #1 inverter delay is pedagogical. With zero delays, an event-driven simulator can still produce a zero-width glitch here, depending on whether it evaluates y or nb first within the timestamp; the delay makes the pulse visible.',
  },
  {
    id: 'loop',
    title: 'A Signal That Drives Itself',
    tag: 'Feedback',
    question: 'Why does y toggle every nanosecond with no clock?',
    summary: 'Recognize a combinational loop when every step back returns to the same signal.',
    rtl: [
      'timeunit 1ns;',
      'logic a;  wire y;',
      'assign #1 y = ~(a & y);   // y feeds its own input',
    ],
    nodes: loopNodes,
    edges: [e('a', 'nand', 'C'), e('yfb', 'nand'), e('nand', 'q')],
    target: 'q',
    frames: frames(loopNodes, [
      {
        time: 10,
        title: 'a opens the loop',
        event: 'a: 0 → 1; y update due at 11 ns',
        why: 'a rises at 10 ns. The NAND now sees a=1 and y=1, so its output must become 0, but the #1 delay schedules that for 11 ns. y is still 1.',
        values: {a: '1', yfb: '1', nand: '1', q: '1'},
        at: {yfb: 'before 10 ns', nand: 'before 10 ns', q: 'before 10 ns'},
        transitions: ['a'],
        assigned: false,
        changed: false,
      },
      {
        time: 11,
        title: 'y falls: a opened the loop',
        event: 'y: 1 → 0',
        why: 'y falls at 11 ns. The NAND re-evaluated when a rose at 10 ns, with y=1 on its other input, and its #1 delay put the result on y now. a=1 is what holds the loop open; from here on each toggle of y is caused by the previous toggle of y.',
        values: {a: '1', yfb: '1', nand: '0', q: '0'},
        at: {a: '10 ns', yfb: '10 ns (used by NAND)', nand: '11 ns', q: '11 ns'},
        transitions: ['nand', 'q'],
      },
      {
        time: 12,
        title: 'y rises because of y',
        event: 'y: 0 → 1',
        why: 'y rises again at 12 ns because y was 0 at 11 ns, and a 0 on a NAND input forces its output to 1 regardless of a. From now on every step back lands on y one nanosecond earlier. With no register in the path, y toggles every 1 ns for as long as a stays 1: a ring oscillator.',
        values: {a: '1', yfb: '0', nand: '1', q: '1'},
        at: {a: '10 ns', yfb: '11 ns (used by NAND)', nand: '12 ns', q: '12 ns'},
        inactive: ['a'],
        transitions: ['yfb', 'nand', 'q'],
      },
    ]),
    locate: {
      prompt: 'Select the input that started the oscillation, at the moment it changed.',
      nodes: ['a'],
      frames: [0],
      explanation:
        'a rose at 10 ns. While a was 0 the NAND output was held at 1; once a is 1, the output is just the inverse of y, so y keeps flipping itself.',
    },
    exercise: {
      q: 'After the first fall, each toggle of y traces back to the previous toggle of y, one delay earlier. What does that tell you?',
      options: [
        'The trace is unreliable and the tool is stuck',
        'y depends on itself through combinational logic: a combinational loop',
        'y is a register clocked by a',
        'a toggles every nanosecond',
      ],
      answer: 1,
      explanation:
        'A path from y back to y with no register in it is a combinational loop. Here the #1 delay makes it oscillate. The fix is in the design: remove the feedback or put a flop in it.',
    },
    pitfall:
      'A trace that keeps returning to the same signal is not a tool error. It is the design telling you there is a loop.',
    pages: '249–250',
    defaultMethod: 'transition',
    methodText: {
      cycle:
        'There is no clock in this path, so a cycle-based reading has no edges to sample. Use transitions here.',
      transition:
        'The first fall of y traces to a rising at 10 ns. Every transition after that traces to the previous transition of y, one delay earlier.',
    },
    methodNote:
      'The #1 delay is what lets this fixture advance in time. With zero delay the same loop would toggle forever inside one timestamp; a simulator may report an iteration-limit error or simply hang at that timestamp instead of producing a waveform. Lint and synthesis tools report combinational loops directly; check those reports first.',
  },
  {
    id: 'netforce',
    title: 'A Value the RTL Did Not Drive',
    tag: 'Force and Release',
    question: 'Why does y stay at 0xFF while a changes?',
    summary: 'Recognize a testbench force on a net, and what release does to it.',
    rtl: [
      'logic [7:0] a;  wire [7:0] y;',
      'assign y = a + 1;',
      '// testbench',
      "initial begin #12 force dut.y = 8'hFF;  #10 release dut.y;  end",
    ],
    nodes: forceNodes,
    edges: [
      e('a', 'add'),
      e('add', 'q'),
      e('frc', 'q', 'C', 'While the force is active, it decides the value of y.'),
    ],
    target: 'q',
    frames: frames(forceNodes, [
      {
        time: 10,
        title: 'y follows its assignment',
        event: 'a: 0F → 10',
        why: 'With no force active, y follows its continuous assignment: a=0x10, so y=0x11.',
        values: {a: '10', add: '11', frc: 'off', q: '11'},
        inactive: ['frc'],
        transitions: ['a', 'add', 'q'],
      },
      {
        time: 15,
        title: 'a changes, y does not',
        event: 'a: 10 → 20; y forced since 12 ns',
        why: 'The testbench forced y to 0xFF at 12 ns. a changes to 0x20 and the assignment now computes 0x21, but the force overrides the driver, so y stays 0xFF. Tracing y back through its assign statement leads to a value that is not on y.',
        values: {a: '20', add: '21', frc: 'FF', q: 'FF'},
        at: {frc: '12 ns', q: '12 ns (forced)'},
        inactive: ['a', 'add'],
        transitions: ['a', 'add'],
        assigned: false,
        changed: false,
      },
      {
        time: 22,
        title: 'Release hands y back',
        event: 'release dut.y',
        why: 'At 22 ns the testbench releases y. y is a net, so its continuous assignment drives it again at once: y becomes 0x21 without waiting for a to change.',
        values: {a: '20', add: '21', frc: 'off', q: '21'},
        at: {a: '15 ns', add: '15 ns', frc: '22 ns (released)', q: '22 ns'},
        inactive: ['frc'],
        transitions: ['frc', 'q'],
      },
    ]),
    locate: {
      prompt: 'Select what held y at 0xFF while a changed, at that moment.',
      nodes: ['frc'],
      frames: [1],
      explanation:
        'At 15 ns the testbench force was active. It overrode the continuous assignment, so the change on a never reached y.',
    },
    exercise: {
      q: 'At 22 ns the testbench releases y. What does y do?',
      options: [
        'Keeps 0xFF until a changes again',
        'Becomes 0x21 at once, because the continuous assignment drives the net again',
        'Goes X until the next clock edge',
        'Returns to 0x11, its value before the force',
      ],
      answer: 1,
      explanation:
        'Releasing a net hands it straight back to its drivers. Releasing a variable that is only assigned procedurally is different: it keeps the forced value until something next assigns it. The expert track covers that case.',
    },
    pitfall:
      'A forced signal can disagree with every line of RTL that drives it. When the trace and the code disagree, look for forces in the testbench.',
    pages: '242–249',
    methodNote:
      'Force and release follow IEEE 1800. Whether forces are recorded in the dump, and how a tool marks them, depends on dump options and release. Check what your setup records.',
  },
];
