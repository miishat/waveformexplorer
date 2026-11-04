import type {Frame,Lesson} from './content/lessons';
import type {Method,View} from './model';
import type {Shape} from './content/reference';
export function nodeBounds(shape:Shape,view:View){return shape==='mux'&&view==='tfv'?{halfWidth:38,halfHeight:48}:{halfWidth:63,halfHeight:31};}
export function displayFrame(lesson:Lesson,index:number,method:Method):Frame{return lesson.id==='delay'&&method==='cycle'?lesson.frames[lesson.frames.length-1]:lesson.frames[index];}
export function pinSourceId(id:string){const parts=id.split(':');return parts.length>2?parts[2]:parts[0];}
