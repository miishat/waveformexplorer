export type View='tfv'|'compact'|'register';
export type Method='cycle'|'transition';
export function sampleRegister(old:number,data:number,enable:boolean){const value=enable?data:old;return {value,assigned:enable,changed:value!==old};}
export function pipelineTick(old:number[],input:number){return [input,...old.slice(0,-1)];}
export function bitAnd(a:string,b:string){return a==='0'||b==='0'?'0':a==='1'&&b==='1'?'1':'X';}
export function compatibleMethod(view:string,method:string):Method{return view==='register'?'cycle':method==='transition'?'transition':'cycle';}
export function clampStep(step:number,count:number){return Math.max(0,Math.min(count-1,step));}
