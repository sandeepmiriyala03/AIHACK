"use client"

import React from "react"

type VoiceType =
"male" |
"female" |
"boy" |
"girl" |
"grandpa" |
"grandma" |
"teacher" |
"teacher_female" |
"story" |
"news" |
"devotional" |
"robot"

interface Props{
value: VoiceType
onChange:(voice:VoiceType)=>void
disabled?:boolean
}

export default function VoiceSelector({
value,
onChange,
disabled=false
}:Props){

const voices=[
{ id:"male", label:"Male", icon:"👨" },
{ id:"female", label:"Female", icon:"👩" },

{ id:"boy", label:"Boy", icon:"👦" },
{ id:"girl", label:"Girl", icon:"👧" },

{ id:"grandpa", label:"Grandpa", icon:"👴" },
{ id:"grandma", label:"Grandma", icon:"👵" },

{ id:"teacher", label:"Teacher", icon:"👨‍🏫" },
{ id:"teacher_female", label:"Teacher Female", icon:"👩‍🏫" },

{ id:"story", label:"Story Narrator", icon:"📖" },
{ id:"news", label:"News Anchor", icon:"📰" },

{ id:"devotional", label:"Devotional", icon:"🙏" },
{ id:"robot", label:"Robot", icon:"🤖" }

]

return(

<div className="card">

<span className="lbl">Step 2 — Voice Type</span>

<div style={{
display:"flex",
gap:10,
flexWrap:"wrap"
}}>

{voices.map(v=>{

const active=value===v.id

return(

<button
key={v.id}
disabled={disabled}
onClick={()=>onChange(v.id as VoiceType)}

style={{

display:"flex",
alignItems:"center",
gap:6,

padding:"10px 18px",
borderRadius:10,

border:active
? "2px solid #4f46e5"
: "1.5px solid #e5e7eb",

background:active
? "#eef2ff"
: "#fff",

color:active
? "#4f46e5"
: "#374151",

fontWeight:600,
fontSize:14,

cursor:disabled
? "not-allowed"
: "pointer",

minHeight:44
}}

>

<span style={{fontSize:18}}>
{v.icon}
</span>

{v.label}

</button>

)

})}

</div>

</div>

)

}