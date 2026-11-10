import {compatibleMethod,type View,type Method} from './model.ts';

/** Where a learner stands inside one investigation. Selection and answers are deliberately transient. */
export type LessonProgress={step:number;index:number;view:View;method:Method;activeOnly:boolean};
export type Appearance='reference'|'teaching';
export type Session={lessonId:string;appearance:Appearance;sidebar:boolean|null;progress:Record<string,LessonProgress>};
type LessonShape={id:string;defaultMethod?:Method;target:string;frames:unknown[];nodes:{id:string;internal?:boolean}[]};

export const SESSION_KEY='tfv-session';
export const STEP_LABELS=['Observe','Inspect','Explain','Check'] as const;
export const STEP_COUNT=STEP_LABELS.length;
const views:View[]=['tfv','compact','register'];

export function defaultProgress(lesson:LessonShape):LessonProgress{
 return {step:0,index:0,view:'tfv',method:lesson.defaultMethod??'cycle',activeOnly:false};
}

const int=(v:unknown,max:number)=>typeof v==='number'&&Number.isInteger(v)&&v>=0&&v<max?v:0;

/** Coerces untrusted stored progress into something valid for this lesson's current content. */
export function sanitizeProgress(raw:unknown,lesson:LessonShape):LessonProgress{
 const base=defaultProgress(lesson);
 if(!raw||typeof raw!=='object')return base;
 const r=raw as Record<string,unknown>;
 const noRegister=!!lesson.nodes.find(n=>n.id===lesson.target)?.internal;
 let view=views.includes(r.view as View)?r.view as View:base.view;
 if(view==='register'&&noRegister)view=base.view;
 const method=r.method==='cycle'||r.method==='transition'?compatibleMethod(view,r.method):base.method;
 return {step:int(r.step,STEP_COUNT),index:int(r.index,lesson.frames.length),view,method,activeOnly:r.activeOnly===true};
}

export function parseSession(raw:string|null,lessons:LessonShape[]):Session{
 const fallback:Session={lessonId:lessons[0].id,appearance:'reference',sidebar:null,progress:{}};
 if(!raw)return fallback;
 let data:unknown;
 try{data=JSON.parse(raw);}catch{return fallback;}
 if(!data||typeof data!=='object')return fallback;
 const d=data as Record<string,unknown>;
 const progress:Record<string,LessonProgress>={};
 if(d.progress&&typeof d.progress==='object'){
  for(const [id,value] of Object.entries(d.progress as Record<string,unknown>)){
   const lesson=lessons.find(l=>l.id===id);
   if(lesson)progress[id]=sanitizeProgress(value,lesson);
  }
 }
 return {
  lessonId:lessons.some(l=>l.id===d.lessonId)?d.lessonId as string:fallback.lessonId,
  appearance:d.appearance==='teaching'?'teaching':'reference',
  sidebar:typeof d.sidebar==='boolean'?d.sidebar:null,
  progress,
 };
}

/** True once the learner has moved past the opening state of an investigation. */
export function hasStarted(p:LessonProgress|undefined){return !!p&&(p.step>0||p.index>0);}
