import {useEffect,useId,useRef,useState,type KeyboardEvent} from 'react';
import {Check,ChevronDown} from 'lucide-react';
import './Select.css';
type Option={value:string;label:string;disabled?:boolean};
export function Select({label,value,options,onChange}:{label:string;value:string;options:Option[];onChange:(value:string)=>void}){
 const id=useId(),root=useRef<HTMLSpanElement>(null),trigger=useRef<HTMLButtonElement>(null);
 const [open,setOpen]=useState(false),[active,setActive]=useState(0);
 const typed=useRef({text:'',at:0});
 const selected=options.findIndex(o=>o.value===value);
 function show(){setActive(Math.max(0,selected));setOpen(true);}
 function choose(index:number){if(!options[index]||options[index].disabled)return;onChange(options[index].value);setOpen(false);trigger.current?.focus();}
 useEffect(()=>{if(!open)return;function outside(e:PointerEvent){if(!root.current?.contains(e.target as Node))setOpen(false);}document.addEventListener('pointerdown',outside);return()=>document.removeEventListener('pointerdown',outside);},[open]);
 useEffect(()=>{if(open)document.getElementById(`${id}-${active}`)?.scrollIntoView({block:'nearest'});},[active,open,id]);
 function keyboard(e:KeyboardEvent<HTMLButtonElement>){
  if(e.key==='Tab'){setOpen(false);return;}
  if(e.key==='Escape'){if(open){e.preventDefault();e.stopPropagation();setOpen(false);}return;}
  if(e.key==='Enter'||e.key===' '){e.preventDefault();if(open)choose(active);else show();return;}
  if(['ArrowDown','ArrowUp','Home','End'].includes(e.key)){
   e.preventDefault();const enabled=options.map((o,i)=>o.disabled?-1:i).filter(i=>i>=0);if(!enabled.length)return;
   let next=e.key==='Home'?enabled[0]:e.key==='End'?enabled[enabled.length-1]:undefined;
   if(next===undefined){const pos=enabled.indexOf(open?active:selected);next=enabled[(pos+(e.key==='ArrowDown'?1:enabled.length-1)+enabled.length)%enabled.length];}
   setActive(next);setOpen(true);return;
  }
  if(e.key.length===1&&!e.ctrlKey&&!e.metaKey&&!e.altKey){
   e.preventDefault();const now=Date.now();typed.current={text:(now-typed.current.at<700?typed.current.text:'')+e.key.toLowerCase(),at:now};
   const next=options.findIndex(o=>!o.disabled&&o.label.toLowerCase().startsWith(typed.current.text));if(next>=0){setActive(next);setOpen(true);}
  }
 }
 return <span className="app-select" ref={root} onBlur={e=>{if(!e.currentTarget.contains(e.relatedTarget as Node))setOpen(false);}}>
  <button ref={trigger} type="button" role="combobox" aria-label={label} aria-expanded={open} aria-haspopup="listbox" aria-controls={open?id:undefined} aria-activedescendant={open?`${id}-${active}`:undefined} className="select-trigger" onKeyDown={keyboard} onClick={()=>open?setOpen(false):show()}><span>{options[selected]?.label??'Select an Option'}</span><ChevronDown size={16}/></button>
  {open&&<span id={id} role="listbox" aria-label={label} className="select-menu">{options.map((option,i)=><span key={option.value} id={`${id}-${i}`} role="option" aria-selected={option.value===value} aria-disabled={option.disabled||undefined} className={`select-option ${active===i?'focused':''}`} onPointerDown={e=>e.preventDefault()} onMouseMove={()=>{if(!option.disabled)setActive(i);}} onClick={()=>choose(i)}><span>{option.label}</span>{option.value===value&&<Check size={15}/>}</span>)}</span>}
 </span>;
}
