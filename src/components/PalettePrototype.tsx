// THROWAWAY: compare five soft light palettes on the implemented B1 workspace.
import {useEffect} from 'react';
import {ArrowLeft,ArrowRight} from 'lucide-react';
const palettes=['Sage paper','Warm linen','Mist blue','Lavender grey','Rose clay'];
export function PalettePrototype({value,onChange}:{value:string;onChange:(value:string)=>void}){
 const index='ABCDE'.indexOf(value);
 function select(i:number){const key='ABCDE'[(i+5)%5];onChange(key);const url=new URL(location.href);url.searchParams.set('palette',key);history.replaceState(null,'',url);}
 useEffect(()=>{function key(e:KeyboardEvent){if((e.target as HTMLElement).closest('input,textarea,select,button,[role=button],[contenteditable],svg'))return;if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();select(index+(e.key==='ArrowRight'?1:-1));}}window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);},[value]);
 return <nav className="palette-prototype" aria-label="Light palette alternatives"><button aria-label="Previous palette" onClick={()=>select(index-1)}><ArrowLeft size={16}/></button>{palettes.map((name,i)=><button key={name} aria-label={`${'ABCDE'[i]}: ${name}`} aria-pressed={i===index} onClick={()=>select(i)}><i className={`palette-swatch swatch-${i}`}/><span>{'ABCDE'[i]}</span></button>)}<strong>{palettes[index]}</strong><button aria-label="Next palette" onClick={()=>select(index+1)}><ArrowRight size={16}/></button><a href="/">Current theme</a></nav>;
}
