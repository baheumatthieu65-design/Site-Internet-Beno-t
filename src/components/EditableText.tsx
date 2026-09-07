import React, { useState } from 'react';
import { Pencil, Check, X } from 'lucide-react';

interface Props { value: string; isAdmin?: boolean; multiline?: boolean; className?: string; onSave: (value: string) => Promise<void>|void; }

export const EditableText: React.FC<Props> = ({value,isAdmin=false,multiline=false,className='',onSave}) => {
  const [editing,setEditing]=useState(false), [draft,setDraft]=useState(value);
  if(!isAdmin) return <span className={className}>{value}</span>;
  if(!editing) return <button type="button" onClick={()=>{setDraft(value);setEditing(true)}} className={`group text-left ${className}`}>{value}<Pencil className="inline ml-2 w-3.5 h-3.5 text-[#d4af37] opacity-60"/></button>;
  const save=async()=>{await onSave(draft);setEditing(false)};
  return <span className="inline-flex items-start gap-2 w-full">
    {multiline?<textarea autoFocus value={draft} onChange={e=>setDraft(e.target.value)} className="min-h-28 w-full rounded-lg bg-black/60 border border-[#d4af37] p-2 text-inherit"/>:<input autoFocus value={draft} onChange={e=>setDraft(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')void save()}} className="min-w-0 flex-1 rounded-lg bg-black/60 border border-[#d4af37] px-2 py-1 text-inherit"/>}
    <button type="button" onClick={()=>void save()} className="p-1.5 rounded bg-[#d4af37] text-black"><Check className="w-4 h-4"/></button>
    <button type="button" onClick={()=>setEditing(false)} className="p-1.5 rounded bg-black/50 border border-white/20"><X className="w-4 h-4"/></button>
  </span>;
};
