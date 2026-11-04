import {useState} from 'react';
import {nodeBounds} from '../graph';
import {Minus,Plus,Maximize,ChevronLeft,ChevronRight,ArrowUp,ArrowDown} from 'lucide-react';
import type {Lesson,Node,Frame} from '../content/lessons';
import type {View,Method} from '../model';
export type Selection={type:'node'|'edge'|'pin'|'time'|'group';id:string};
export function Diagram({lesson,frame,view,method,selection,onSelect,depth,onDepth,activeOnly,appearance}:{lesson:Lesson;frame:Frame;view:View;method:Method;selection:Selection;onSelect:(s:Selection)=>void;depth:number;onDepth:(n:number)=>void;activeOnly:boolean;appearance:string}){
 const [zoom,setZoom]=useState(1);const [pan,setPan]=useState({x:0,y:0});
 const abstract=view==='register';
 const ancestors=new Set<string>([lesson.target]);for(let i=0;i<lesson.nodes.length;i++)for(const edge of lesson.edges)if(ancestors.has(edge.to))ancestors.add(edge.from);
 let all=lesson.nodes.filter(n=>!abstract||(!n.internal&&ancestors.has(n.id)));
 // A register view stops each cone at the nearest storage/primary-input boundary.
 const connections=abstract?all.flatMap(to=>{const upstream=new Set<string>();const walk=(id:string,control:boolean)=>{for(const edge of lesson.edges.filter(e=>e.to===id)){const source=lesson.nodes.find(n=>n.id===edge.from)!;if(source.internal)walk(source.id,control||edge.role==='C');else upstream.add(`${source.id}|${control||edge.role==='C'?'C':'D'}`);}};walk(to.id,false);return [...upstream].map(key=>{const [from,role]=key.split('|');return {from,to:to.id,role:role as 'C'|'D',detail:'Intermediate combinational statements are abstracted; storage boundaries and sampled history are retained.'};});}):lesson.edges;
 const visible=new Set<string>([lesson.target]);for(let i=0;i<depth;i++){const previous=new Set(visible);for(const edge of connections)if(previous.has(edge.to))visible.add(edge.from);}
 all=all.filter(n=>visible.has(n.id)&&(!activeOnly||frame.samples[n.id].active||n.id===lesson.target));
 const groupInputs=lesson.nodes.filter(n=>lesson.edges.some(e=>e.from===n.id&&lesson.nodes.find(x=>x.id===e.to)?.internal));
 const positions=Object.fromEntries(all.map((n,i)=>[n.id,abstract?(n.id===lesson.target?{x:650,y:140}:{x:115+(i%2)*190,y:120+Math.floor(i/2)*140}):view==='compact'&&groupInputs.length>0?(n.id===lesson.target?{x:665,y:115}:n.internal?{x:415,y:115}:groupInputs.includes(n)?{x:130,y:110+groupInputs.indexOf(n)*108}:{x:n.x,y:n.y}):{x:n.x,y:n.y}]));
 const picked=(type:Selection['type'],id:string)=>selection.type===type&&selection.id===id;
 const keyboard=(type:Selection['type'],id:string)=>(e:React.KeyboardEvent)=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onSelect({type,id});}};
 const activate=(type:Selection['type'],id:string)=>({role:'button' as const,tabIndex:0,onClick:()=>onSelect({type,id}),onKeyDown:keyboard(type,id)});
 function block(n:Node){const p=positions[n.id],s=frame.samples[n.id],isTarget=n.id===lesson.target;const internal=(view==='compact'&&n.internal)||n.shape==='internal';const isMux=view==='tfv'&&n.shape==='mux';const w=isMux?76:126,h=isMux?96:62;
 return <g key={n.id} transform={`translate(${p.x},${p.y})`} className={`diagram-node ${s.active?'active':'inactive'} ${picked('node',n.id)?'selected':''} ${isTarget?'target':''}`}>
 <g {...activate('node',n.id)} aria-label={`${n.label}, ${s.value}, ${s.at}, ${s.active?'active':'inactive'}`}><title>{n.detail}</title>
 {isTarget&&<><rect className="target-ring" x={-w/2-8} y={-h/2-8} width={w+16} height={h+16} rx="8"/><text className="target-label" textAnchor="middle" y={-h/2-23}>INVESTIGATION TARGET</text></>}
 {isMux?<path className="node-body" d="M-38 -48L38 -30V30L-38 48Z"/>:internal?<path className="node-body" d="M-51 -31H51L63 -19V19L51 31H-51L-63 19V-19Z"/>:<rect className="node-body" x={-63} y={-31} width={126} height={62} rx={n.shape==='memory'?8:2}/>}
 {n.shape==='register'&&view==='tfv'&&<path d="M-63 17L-54 23L-63 29" fill="none" stroke="#d3c37d" strokeWidth="1.2"/>}
 {n.shape==='pin'&&<text x="-56" y="-20" className="node-time">{n.id==='one'?'CONST':'INPUT'}</text>}
 {s.changed&&<circle className="transition-dot" cx={-w/2-3} cy={-h/2-6} r="4.5"/>}
 {n.role==='C'&&s.changed&&<text className="control-marker" x={w/2+5} y={-h/2}>!</text>}
 <text className="node-name" y={isMux?-6:-5} textAnchor="middle">{isMux?'MUX':view==='tfv'&&n.shape==='function'?'f  '+n.label:n.label}</text>
 <text className="node-value" y="17" textAnchor="middle">{s.value==='X'?'X':s.value} <tspan className="role-text">{n.role}</tspan></text>
 <text className="node-time" textAnchor="middle" y={h/2+22}>{s.at}</text>
 {appearance==='teaching'&&<text className="node-state" textAnchor="middle" y={h/2+39}>{s.active?'ACTIVE':'INACTIVE'}{s.changed?' · Δ':''}</text>}
 </g>
 <circle {...activate('pin',`${n.id}:out`)} aria-label={`${n.label} output pin`} className={`diagram-pin ${picked('pin',`${n.id}:out`)?'picked':''}`} cx={w/2} cy={0} r="5"/>
 {connections.some(e=>e.to===n.id&&e.role==='D')&&<circle {...activate('pin',`${n.id}:in`)} aria-label={`${n.label} data input pin`} className={`diagram-pin ${picked('pin',`${n.id}:in`)?'picked':''}`} cx={-w/2} cy={0} r="5"/>}
 {connections.some(e=>e.to===n.id&&e.role==='C')&&<circle {...activate('pin',`${n.id}:control`)} aria-label={`${n.label} control input pin`} className={`diagram-pin ${picked('pin',`${n.id}:control`)?'picked':''}`} cx={0} cy={h/2} r="5"/>}
 </g>}
 return <div className={`diagram-wrap ${appearance}`}><div className="diagram-topline"><span className="live-dot"/><span>{view==='tfv'?'Statement-level dependencies':view==='compact'?'Compact statement groups':'Register / primary-input dependencies'}</span><span className="diagram-mode">{method==='cycle'?'CYCLE-BASED':'TRANSITION-BASED'}</span></div>
 <svg className="flow-svg" viewBox="0 0 800 430" aria-label={`${lesson.title}, ${view} educational diagram`}>
 <defs><pattern id="grid" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="0.8" fill="#ffffff" opacity=".08"/></pattern><marker id="arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0 0L7 3.5L0 7" fill="#97a9a3"/></marker></defs>
 <rect width="800" height="430" fill="url(#grid)"/>
 <g transform={`translate(${pan.x} ${pan.y}) translate(400 215) scale(${zoom}) translate(-400 -215)`}>
 <g {...activate('time','event')} aria-label={`Investigation event at ${frame.time} nanoseconds`} className={`time-boundary ${picked('time','event')?'selected':''}`}><path d="M745 58V370"/><text x="745" y="40" textAnchor="middle">{frame.time} ns</text><rect x="725" y="20" width="40" height="355" fill="transparent" stroke="none"/></g>
 {view!=='tfv'&&all.length>1&&((abstract&&connections.every(e=>e.to===lesson.target))||(!abstract&&groupInputs.length>0))&&<g {...activate('group','inputs')} aria-label="Input dependency grouping" className={`input-group ${picked('group','inputs')?'selected':''}`}><rect x="25" y="55" width={abstract?420:220} height="330" rx="9"/><text x="40" y="72">{abstract?'FAN-IN GROUP':'STATEMENT INPUTS'}</text></g>}
 {connections.filter(e=>positions[e.from]&&positions[e.to]).map((edge,i)=>{const a=positions[edge.from],b=positions[edge.to],control=edge.role==='C';const sourceBounds=nodeBounds(lesson.nodes.find(n=>n.id===edge.from)!.shape,view);const startX=a.x+sourceBounds.halfWidth,endX=b.x-((view==='tfv'&&lesson.nodes.find(n=>n.id===edge.to)?.shape==='mux')?38:63);const targetHalfHeight=view==='tfv'&&lesson.nodes.find(n=>n.id===edge.to)?.shape==='mux'?48:31;const d=control?`M${startX} ${a.y} H${startX+22} V${b.y+targetHalfHeight+30} H${b.x} V${b.y+targetHalfHeight}`:`M${startX} ${a.y} H${(startX+endX)/2} V${b.y} H${endX}`;const id=`${edge.from}:${edge.to}`;return <g key={id} {...activate('edge',id)} aria-label={`${edge.from} to ${edge.to}, ${edge.role==='C'?'control':'data'} dependency`} className={`diagram-edge ${frame.samples[edge.from].active?'':'inactive'} ${control?'control':''} ${picked('edge',id)?'selected':''}`}><path d={d} className="hit-path"/><path d={d} className="visible-path" markerEnd="url(#arrow)"/>{!control&&i===0&&<text x={(startX+endX)/2+8} y={a.y-10}>data</text>}</g>})}
 {all.map(block)}
 </g></svg>
 <div className="canvas-toolbar"><div className="canvas-key"><span><i className="key-active"/> Active</span><span><i className="key-inactive"/> Inactive</span><span><i className="key-transition"/> Transition</span><span><i className="key-target"/> Target</span></div><div className="zoom-tools"><button title="Zoom out" aria-label="Zoom out" onClick={()=>setZoom(z=>Math.max(.65,z-.15))}><Minus size={14}/></button><span>{Math.round(zoom*100)}%</span><button title="Zoom in" aria-label="Zoom in" onClick={()=>setZoom(z=>Math.min(2,z+.15))}><Plus size={14}/></button><button title="Reset diagram view" aria-label="Reset diagram view" onClick={()=>{setZoom(1);setPan({x:0,y:0});}}><Maximize size={14}/></button></div></div>
 <div className="canvas-bottom"><span>Educational recreation · spacing is not elapsed time</span><div className="pan-tools"><button aria-label="Pan left" onClick={()=>setPan(p=>({...p,x:p.x-50}))}><ChevronLeft size={14}/></button><button aria-label="Pan right" onClick={()=>setPan(p=>({...p,x:p.x+50}))}><ChevronRight size={14}/></button><button aria-label="Pan up" onClick={()=>setPan(p=>({...p,y:p.y-40}))}><ArrowUp size={14}/></button><button aria-label="Pan down" onClick={()=>setPan(p=>({...p,y:p.y+40}))}><ArrowDown size={14}/></button></div><button className="expand-button" onClick={()=>onDepth(depth>=4?0:depth+1)}>{depth>=4?'Collapse to target':'Expand dependencies'} <Plus size={13}/></button></div>
 </div>
}
