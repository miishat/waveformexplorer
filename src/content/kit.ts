import type {Shape} from './reference';
import type {Method,Locate} from '../model';

export type Node={id:string;label:string;shape:Shape;role:'D'|'C'|'CD';line:number;detail:string;x:number;y:number;internal?:boolean};
export type Edge={from:string;to:string;role:'D'|'C';detail:string};
export type Sample={value:string;at:string;active:boolean;changed:boolean};
/** `label` names the frame in the UI. Frames may share a `time` when they are ordered steps inside one timestamp. */
export type Frame={time:number;label:string;title:string;why:string;event:string;assigned:boolean;changed:boolean;values:Record<string,string>;samples:Record<string,Sample>};
export type Lesson={
 id:string;title:string;tag:string;question:string;summary:string;rtl:string[];nodes:Node[];edges:Edge[];target:string;frames:Frame[];
 exercise:{q:string;options:string[];answer:number;explanation:string};pitfall:string;pages:string;methodNote:string;
 /** Expert investigations assume the core track and are listed separately. */
 track?:'expert';
 /** For each frame index, the frame a cycle-based reading shows instead. Absent: both methods show the selected frame. */
 cycleFrames?:number[];
 defaultMethod?:Method;
 /** What each tracing method reveals or hides in this particular investigation. */
 methodText?:{cycle:string;transition:string};
 /** When present, the Check step first asks the learner to point at the cause in the diagram. */
 locate?:Locate;
};
export type FrameInput={time:number;label?:string;title:string;why:string;values:Record<string,string>;event?:string;assigned?:boolean;changed?:boolean;inactive?:string[];transitions?:string[];at?:Record<string,string>;sampleValues?:Record<string,string>};

export const n=(id:string,label:string,shape:Shape,x:number,y:number,line:number,detail:string,role:'D'|'C'|'CD'='D',internal=false):Node=>({id,label,shape,x,y,line,detail,role,internal});
export const e=(from:string,to:string,role:'D'|'C'='D',detail='Follow this dependency to the value and time shown at its source.'):Edge=>({from,to,role,detail});

/** Expands terse frame inputs into full frames. The investigated node is always `q`. */
export function frames(nodes:Node[],items:FrameInput[]):Frame[]{
 return items.map(f=>{
  const changed=f.changed??!!f.transitions?.includes('q');
  return {
   ...f,
   label:f.label??`${f.time} ns`,
   event:f.event??'Rising edge; target shown after NBA updates',
   assigned:f.assigned??true,
   changed,
   samples:Object.fromEntries(nodes.map(node=>[node.id,{
    value:f.sampleValues?.[node.id]??f.values[node.id]??'—',
    at:f.at?.[node.id]??`${f.time} ns`,
    active:!f.inactive?.includes(node.id),
    changed:node.id==='q'?changed:!!f.transitions?.includes(node.id),
   }])),
  };
 });
}
