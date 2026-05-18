import { useState, useEffect, useRef, useCallback } from "react";

/* ─── utils ─── */
const uid = () => Math.random().toString(36).slice(2,10);
const fmt = d => d ? new Date(d).toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"}) : "No date";
const MOODS = ["😊","🌊","🍲","❤️","🌙","⚡","🌿","🔥","🎶","✨","🏔️","🌺"];
const COLORS = ["#1a3a4a","#3a1a1a","#1a3a1a","#2a1a3a","#3a2a1a","#1a2a3a","#2a2a1a","#3a1a2a"];
const PLACE_COORDS = {
  "accra":[5.6037,-0.1870],"kumasi":[6.6885,-1.6244],"cape coast":[5.1053,-1.2466],
  "london":[51.5074,-0.1278],"new york":[40.7128,-74.0060],"paris":[48.8566,2.3522],
  "lagos":[6.5244,3.3792],"nairobi":[-1.2921,36.8219],"dubai":[25.2048,55.2708],
  "ghana":[7.9465,-1.0232],"takoradi":[4.8983,-1.7566],"tamale":[9.4008,-0.8393],
};
const getCoords = place => {
  if(!place) return null;
  const k = place.toLowerCase();
  for(const [name,coords] of Object.entries(PLACE_COORDS)){
    if(k.includes(name)) return coords;
  }
  return null;
};

const SAMPLE = [
  {id:"s1",title:"Cape Coast Trip",date:"2025-08-14",place:"Cape Coast, Ghana",people:["Mum","Kofi"],mood:"🌊",text:"Stood at the door of no return. Felt history in the walls. The ocean was loud, like it remembered too.",color:"#1a3a4a",photo:null},
  {id:"s2",title:"Grandma's Recipe",date:"2025-12-01",place:"Kumasi",people:["Grandma"],mood:"🍲",text:"She showed me how to make kontomire stew. Her hands moved without measuring — everything by feel and love.",color:"#3a1a1a",photo:null},
  {id:"s3",title:"First Marathon",date:"2026-01-10",place:"Accra",people:["Kofi","Ama"],mood:"⚡",text:"42km. My legs gave up at 35 but my mind refused. Crossed the finish line crying and laughing at the same time.",color:"#2a1a3a",photo:null},
  {id:"s4",title:"Night Market",date:"2026-03-05",place:"Kumasi",people:["Ama"],mood:"🌺",text:"Ate kelewele under yellow bulbs while a man played highlife on a speaker. Ama said this is what peace looks like.",color:"#1a3a1a",photo:null},
];

async function callClaude(prompt){
  const res=await fetch("https://api.anthropic.com/v1/messages",{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,messages:[{role:"user",content:prompt}]}),
  });
  const d=await res.json();
  return d.content?.map(b=>b.text||"").join("")||"";
}

function downloadCard(mem){
  const c=document.createElement("canvas");c.width=800;c.height=480;
  const x=c.getContext("2d");
  x.fillStyle=mem.color;x.fillRect(0,0,800,480);
  x.fillStyle="#ffffff10";x.fillRect(0,380,800,100);
  x.font="bold 32px Georgia";x.fillStyle="#f0ebe0";
  x.fillText(mem.mood+"  "+mem.title,48,72);
  x.font="17px Georgia";x.fillStyle="#ffffffaa";
  const words=mem.text.split(" ");let line="",y=120;
  for(let w of words){const t=line+w+" ";if(x.measureText(t).width>700&&line){x.fillText(line,48,y);line=w+" ";y+=28;}else line=t;}
  x.fillText(line,48,y);
  x.font="13px Georgia";x.fillStyle="#ffffff55";
  x.fillText("📍 "+(mem.place||"")+"   "+fmt(mem.date),48,448);
  x.font="bold 13px Georgia";x.fillStyle="#c9a96e";x.fillText("◎ EchoLink",670,448);
  const a=document.createElement("a");a.download=mem.title.replace(/\s+/g,"-")+".png";a.href=c.toDataURL();a.click();
}

/* ══ AUTH ══ */
function AuthScreen({mode,setMode,form,setForm,err,onSubmit}){
  return(
    <div style={{minHeight:"100vh",background:"#0d0d0d",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Lora','Georgia',serif",color:"#f0ebe0",padding:20}}>
      <style>{GCSS}</style>
      <div style={{maxWidth:400,width:"100%",animation:"fadeUp .5s ease",position:"relative",zIndex:1}}>
        <div style={{textAlign:"center",marginBottom:36}}>
          <div style={{fontSize:44,color:"#c9a96e",marginBottom:8}}>◎</div>
          <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:30,letterSpacing:3,marginBottom:6}}>EchoLink</h1>
          <p style={{color:"#444",fontSize:12,letterSpacing:2}}>YOUR PERSONAL MEMORY WEAVER</p>
        </div>
        <div style={{background:"#111",border:"1px solid #1e1e1e",borderRadius:20,padding:32}}>
          <div style={{display:"flex",border:"1px solid #1e1e1e",borderRadius:10,overflow:"hidden",marginBottom:24}}>
            {["login","register"].map(m=>(
              <button key={m} onClick={()=>setMode(m)} style={{flex:1,padding:10,border:"none",background:mode===m?"#c9a96e18":"transparent",color:mode===m?"#c9a96e":"#444",cursor:"pointer",fontFamily:"inherit",fontSize:12,letterSpacing:1.5,textTransform:"uppercase"}}>{m==="login"?"Sign In":"Register"}</button>
            ))}
          </div>
          {mode==="register"&&<input style={{...INP,marginBottom:12}} placeholder="Your full name" value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))}/>}
          <input style={{...INP,marginBottom:12}} placeholder="Username" value={form.username} onChange={e=>setForm(p=>({...p,username:e.target.value}))}/>
          <input style={{...INP,marginBottom:16}} type="password" placeholder="Password" value={form.password} onChange={e=>setForm(p=>({...p,password:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&onSubmit()}/>
          {err&&<p style={{color:"#ff6666",fontSize:13,marginBottom:12,textAlign:"center"}}>{err}</p>}
          <button onClick={onSubmit} style={SAVEBTN}>{mode==="login"?"Sign In ◎":"Create Account ✦"}</button>
          <p style={{textAlign:"center",color:"#2a2a2a",fontSize:11,marginTop:14}}>Memories stored privately to your account</p>
        </div>
      </div>
    </div>
  );
}

/* ══ MAIN ══ */
export default function EchoLink(){
  const [user,setUser]=useState(null);
  const [authMode,setAuthMode]=useState("login");
  const [authForm,setAuthForm]=useState({name:"",username:"",password:""});
  const [authErr,setAuthErr]=useState("");
  const [memories,setMemories]=useState([]);
  const [view,setView]=useState("timeline");
  const [selected,setSelected]=useState(null);
  const [story,setStory]=useState("");
  const [loadingStory,setLoadingStory]=useState(false);
  const [aiReply,setAiReply]=useState("");
  const [aiLoading,setAiLoading]=useState(false);
  const [aiQ,setAiQ]=useState("");
  const [search,setSearch]=useState("");
  const [filterMood,setFilterMood]=useState("");
  const [toast,setToast]=useState("");
  const [form,setForm]=useState({title:"",date:"",place:"",people:"",mood:"😊",text:"",color:COLORS[0],photo:null});
  const [familyCode,setFamilyCode]=useState("");
  const [joinCode,setJoinCode]=useState("");
  const [sharedMemories,setSharedMemories]=useState([]);
  const [reminderTime,setReminderTime]=useState("");
  const [reminderSet,setReminderSet]=useState(false);
  const [notifPerm,setNotifPerm]=useState("default");
  const photoRef=useRef();

  const showToast=msg=>{setToast(msg);setTimeout(()=>setToast(""),2800);};
  const skey=u=>`echolink-${u}-v2`;

  const loadMems=async u=>{
    try{const r=await window.storage.get(skey(u));setMemories(r?JSON.parse(r.value):SAMPLE);}catch{setMemories(SAMPLE);}
  };
  const saveMems=async(u,m)=>{try{await window.storage.set(skey(u),JSON.stringify(m));}catch{}};

  useEffect(()=>{
    if("Notification" in window) setNotifPerm(Notification.permission);
  },[]);

  /* ── Auth ── */
  const doAuth=async()=>{
    setAuthErr("");
    if(!authForm.username||!authForm.password){setAuthErr("Fill in all fields.");return;}
    const key=`echolink-user-${authForm.username}`;
    if(authMode==="register"){
      if(!authForm.name){setAuthErr("Enter your name.");return;}
      try{const ex=await window.storage.get(key);if(ex){setAuthErr("Username taken.");return;}}catch{}
      const u={name:authForm.name,username:authForm.username,password:authForm.password};
      try{await window.storage.set(key,JSON.stringify(u));}catch{}
      setUser(u);await loadMems(authForm.username);showToast(`Welcome, ${authForm.name}! ✦`);
    }else{
      try{
        const r=await window.storage.get(key);
        if(!r){setAuthErr("User not found.");return;}
        const u=JSON.parse(r.value);
        if(u.password!==authForm.password){setAuthErr("Wrong password.");return;}
        setUser(u);await loadMems(u.username);showToast(`Welcome back, ${u.name}! ◎`);
      }catch{setAuthErr("Login failed.");}
    }
  };

  /* ── Memory ops ── */
  const addMemory=async()=>{
    if(!form.title||!form.text){showToast("Title and memory text are required.");return;}
    const mem={id:uid(),...form,people:form.people.split(",").map(p=>p.trim()).filter(Boolean)};
    const next=[mem,...memories];
    setMemories(next);await saveMems(user.username,next);
    setForm({title:"",date:"",place:"",people:"",mood:"😊",text:"",color:COLORS[0],photo:null});
    setView("timeline");showToast("Memory woven! ✦");
  };
  const deleteMem=async id=>{
    const next=memories.filter(m=>m.id!==id);
    setMemories(next);await saveMems(user.username,next);
    setView("timeline");showToast("Memory removed.");
  };
  const handlePhoto=e=>{
    const f=e.target.files[0];if(!f)return;
    const r=new FileReader();r.onload=ev=>setForm(p=>({...p,photo:ev.target.result}));r.readAsDataURL(f);
  };

  /* ── AI Story ── */
  const generateStory=async()=>{
    if(!memories.length){showToast("Add some memories first!");return;}
    setLoadingStory(true);setStory("");setView("story");
    const sum=memories.map(m=>`"${m.title}" (${m.date||"no date"},${m.place||"unknown"}): ${m.text}`).join("\n\n");
    try{const t=await callClaude(`You are EchoLink, a poetic AI memory weaver. Based on these personal memories, write a beautiful narrative (180-220 words) weaving them into a living story with warmth and literary depth. End with a single-sentence reflection revealing what these memories say about this person.\n\n${sum}`);setStory(t);}
    catch{setStory("Could not generate story. Check connection.");}
    setLoadingStory(false);
  };

  /* ── Ask AI ── */
  const askAI=async()=>{
    if(!aiQ.trim())return;
    setAiLoading(true);setAiReply("");
    const sum=memories.map(m=>`"${m.title}" (${m.date||"?"},${m.place||"?"}): ${m.text}`).join("\n");
    try{const t=await callClaude(`You are EchoLink, a thoughtful AI companion. Answer based on these personal memories:\n\n${sum}\n\nUser's question: "${aiQ}"\n\nAnswer personally and insightfully in 2-4 sentences.`);setAiReply(t);}
    catch{setAiReply("Something went wrong. Try again.");}
    setAiLoading(false);
  };

  /* ── Family sharing ── */
  const generateFamilyCode=async()=>{
    const code=user.username.toUpperCase()+"-"+Math.random().toString(36).slice(2,6).toUpperCase();
    setFamilyCode(code);
    try{await window.storage.set(`echolink-family-${code}`,JSON.stringify({owner:user.username,memories}),true);}catch{}
    showToast("Family code created! Share it with family.");
  };
  const joinFamily=async()=>{
    if(!joinCode.trim()){showToast("Enter a family code.");return;}
    try{
      const r=await window.storage.get(`echolink-family-${joinCode.trim().toUpperCase()}`,true);
      if(!r){showToast("Code not found. Check and try again.");return;}
      const data=JSON.parse(r.value);
      setSharedMemories(data.memories||[]);
      showToast(`Connected to ${data.owner}'s memories! ✦`);
    }catch{showToast("Could not connect. Try again.");}
  };

  /* ── Reminders ── */
  const setReminder=async()=>{
    if(!reminderTime){showToast("Pick a time first.");return;}
    if("Notification" in window){
      const perm=await Notification.requestPermission();
      setNotifPerm(perm);
      if(perm==="granted"){
        setReminderSet(true);
        showToast(`Daily reminder set for ${reminderTime} ✦`);
        // Schedule via interval check (simple approach)
        const check=()=>{
          const now=new Date();
          const [h,m]=reminderTime.split(":").map(Number);
          if(now.getHours()===h&&now.getMinutes()===m){
            new Notification("EchoLink ◎",{body:"Time to weave a memory. What happened today?",icon:"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>◎</text></svg>"});
          }
        };
        setInterval(check,60000);
      }else{
        showToast("Please allow notifications in your browser settings.");
      }
    }else{
      showToast("Notifications not supported in this browser.");
    }
  };

  /* ── Insights ── */
  const insights=useCallback(()=>{
    const total=memories.length;
    const moodCount={};
    const peopleCount={};
    const placeCount={};
    const monthCount={};
    memories.forEach(m=>{
      if(m.mood) moodCount[m.mood]=(moodCount[m.mood]||0)+1;
      (m.people||[]).forEach(p=>{peopleCount[p]=(peopleCount[p]||0)+1;});
      if(m.place) placeCount[m.place]=(placeCount[m.place]||0)+1;
      if(m.date){const mo=m.date.slice(0,7);monthCount[mo]=(monthCount[mo]||0)+1;}
    });
    const topMood=Object.entries(moodCount).sort((a,b)=>b[1]-a[1])[0];
    const topPerson=Object.entries(peopleCount).sort((a,b)=>b[1]-a[1])[0];
    const topPlace=Object.entries(placeCount).sort((a,b)=>b[1]-a[1])[0];
    const months=Object.entries(monthCount).sort((a,b)=>a[0].localeCompare(b[0])).slice(-6);
    const words=memories.map(m=>m.text).join(" ").split(/\s+/).length;
    return{total,moodCount,peopleCount,placeCount,topMood,topPerson,topPlace,months,words};
  },[memories]);

  /* ── Filters ── */
  const filtered=memories.filter(m=>{
    const q=search.toLowerCase();
    return(!q||[m.title,m.text,m.place,...(m.people||[])].join(" ").toLowerCase().includes(q))
      &&(!filterMood||m.mood===filterMood);
  }).sort((a,b)=>new Date(b.date)-new Date(a.date));

  const ins=insights();

  if(!user) return <AuthScreen mode={authMode} setMode={setAuthMode} form={authForm} setForm={setAuthForm} err={authErr} onSubmit={doAuth}/>;

  const TABS=[
    ["timeline","🗂 Timeline"],["add","+ Memory"],["map","🗺 Map"],
    ["insights","📊 Insights"],["family","👨‍👩‍👧 Family"],["reminders","🔔 Reminders"],
    ["ask","🔮 Ask AI"],["story","✦ Story"],
  ];

  return(
    <div style={{minHeight:"100vh",background:"#0d0d0d",fontFamily:"'Lora','Georgia',serif",color:"#f0ebe0",position:"relative",overflowX:"hidden"}}>
      <style>{GCSS}</style>
      {toast&&<div style={TOAST}>{toast}</div>}

      {/* HEADER */}
      <header style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 20px",borderBottom:"1px solid #ffffff0e",position:"sticky",top:0,background:"#0d0d0dee",backdropFilter:"blur(16px)",zIndex:10,gap:8,flexWrap:"wrap"}}>
        <div style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",flexShrink:0}} onClick={()=>setView("timeline")}>
          <span style={{fontSize:18,color:"#c9a96e"}}>◎</span>
          <span style={{fontFamily:"'Playfair Display',serif",fontSize:16,fontWeight:"bold",letterSpacing:2}}>EchoLink</span>
        </div>
        <nav style={{display:"flex",gap:4,flexWrap:"wrap",justifyContent:"center"}}>
          {TABS.map(([v,l])=>(
            <button key={v} className="nbtn" style={{...NAVBTN,...(view===v?NAVACT:{})}} onClick={()=>{if(v==="story")generateStory();else setView(v);}}>{l}</button>
          ))}
        </nav>
        <div style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",flexShrink:0}} onClick={()=>{setUser(null);setMemories([]);}}>
          <div style={{width:26,height:26,borderRadius:"50%",background:"#c9a96e",color:"#0d0d0d",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:"bold"}}>{user.name[0].toUpperCase()}</div>
          <span style={{fontSize:11,color:"#555"}}>{user.name} · Exit</span>
        </div>
      </header>

      <main style={{maxWidth:820,margin:"0 auto",padding:"28px 16px 70px",position:"relative",zIndex:1}}>

        {/* ── TIMELINE ── */}
        {view==="timeline"&&(
          <div style={{animation:"fadeUp .4s ease"}}>
            <div style={{textAlign:"center",marginBottom:24}}>
              <h1 style={H1}>Your Memory Tapestry</h1>
              <p style={SUB}>{memories.length} memories woven across time</p>
            </div>
            <input style={{...INP,marginBottom:10}} placeholder="🔍  Search memories, places, people..." value={search} onChange={e=>setSearch(e.target.value)}/>
            <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:24}}>
              <button onClick={()=>setFilterMood("")} style={{...MPILL,background:!filterMood?"#c9a96e":"transparent",color:!filterMood?"#0d0d0d":"#555",border:!filterMood?"none":"1px solid #222"}}>All</button>
              {MOODS.map(m=><button key={m} onClick={()=>setFilterMood(filterMood===m?"":m)} style={{...MPILL,background:filterMood===m?"#c9a96e20":"transparent",border:filterMood===m?"1px solid #c9a96e":"1px solid #222"}}>{m}</button>)}
            </div>
            {!filtered.length&&<div style={{textAlign:"center",color:"#2a2a2a",padding:"50px 0"}}>No memories found ◎</div>}
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:14}}>
              {filtered.map((mem,i)=>(
                <div key={mem.id} className="mcard" style={{borderRadius:18,overflow:"hidden",cursor:"pointer",border:"1px solid #ffffff08",background:mem.color,animation:"fadeUp .4s ease both",animationDelay:`${i*.05}s`}}
                  onClick={()=>{setSelected(mem);setView("detail");}}>
                  {mem.photo&&<div style={{height:120,backgroundImage:`url(${mem.photo})`,backgroundSize:"cover",backgroundPosition:"center"}}/>}
                  <div style={{padding:"16px 18px 14px"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                      <span style={{fontSize:20}}>{mem.mood}</span>
                      <span style={{fontSize:10,color:"#ffffff50",letterSpacing:1}}>{fmt(mem.date)}</span>
                    </div>
                    <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:16,color:"#f0ebe0",marginBottom:7}}>{mem.title}</h3>
                    <p style={{fontSize:12,color:"#ffffff75",lineHeight:1.65,marginBottom:10}}>{mem.text.slice(0,100)}{mem.text.length>100?"…":""}</p>
                    <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                      {mem.place&&<span style={TAG}>📍 {mem.place}</span>}
                      {(mem.people||[]).map(p=><span key={p} style={TAG}>👤 {p}</span>)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── ADD ── */}
        {view==="add"&&(
          <div style={{maxWidth:520,margin:"0 auto",animation:"fadeUp .4s ease"}}>
            <h1 style={{...H1,marginBottom:6}}>Capture a Memory</h1>
            <p style={{...SUB,marginBottom:24}}>Every moment deserves to be woven in.</p>
            <div style={{display:"flex",flexDirection:"column",gap:16}}>
              <Fld label="Title *"><input style={INP} placeholder="e.g. Grandma's Recipe" value={form.title} onChange={e=>setForm(p=>({...p,title:e.target.value}))}/></Fld>
              <Fld label="Your Memory *"><textarea style={{...INP,height:120,resize:"vertical"}} placeholder="Write what happened, how it felt..." value={form.text} onChange={e=>setForm(p=>({...p,text:e.target.value}))}/></Fld>
              <div style={{display:"flex",gap:10}}>
                <Fld label="Date" s={{flex:1}}><input style={INP} type="date" value={form.date} onChange={e=>setForm(p=>({...p,date:e.target.value}))}/></Fld>
                <Fld label="Place" s={{flex:1}}><input style={INP} placeholder="e.g. Accra" value={form.place} onChange={e=>setForm(p=>({...p,place:e.target.value}))}/></Fld>
              </div>
              <Fld label="People (comma separated)"><input style={INP} placeholder="e.g. Mum, Kofi, Ama" value={form.people} onChange={e=>setForm(p=>({...p,people:e.target.value}))}/></Fld>
              <Fld label="📸 Photo">
                <div style={{height:120,border:"2px dashed #222",borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",overflow:"hidden"}} onClick={()=>photoRef.current.click()}>
                  {form.photo?<img src={form.photo} style={{width:"100%",height:"100%",objectFit:"cover"}} alt=""/>:<span style={{color:"#333",fontSize:13}}>Tap to upload a photo</span>}
                </div>
                <input ref={photoRef} type="file" accept="image/*" style={{display:"none"}} onChange={handlePhoto}/>
              </Fld>
              <Fld label="Mood">
                <div style={{display:"flex",flexWrap:"wrap",gap:7}}>
                  {MOODS.map(m=><button key={m} style={{fontSize:20,border:"1px solid #222",borderRadius:10,padding:"5px 9px",cursor:"pointer",background:form.mood===m?"#ffffff20":"transparent"}} onClick={()=>setForm(p=>({...p,mood:m}))}>{m}</button>)}
                </div>
              </Fld>
              <Fld label="Card Color">
                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                  {COLORS.map(c=><button key={c} onClick={()=>setForm(p=>({...p,color:c}))} style={{width:30,height:30,borderRadius:"50%",background:c,border:form.color===c?"3px solid #fff":"3px solid transparent",cursor:"pointer"}}/>)}
                </div>
              </Fld>
              <button className="btn" style={SAVEBTN} onClick={addMemory}>Weave this Memory ◎</button>
            </div>
          </div>
        )}

        {/* ── DETAIL ── */}
        {view==="detail"&&selected&&(
          <div style={{maxWidth:520,margin:"0 auto",animation:"fadeUp .4s ease"}}>
            <button style={{background:"transparent",border:"none",color:"#c9a96e",cursor:"pointer",fontSize:13,marginBottom:16,fontFamily:"inherit",padding:0}} onClick={()=>setView("timeline")}>← Back</button>
            <div style={{borderRadius:18,overflow:"hidden",border:"1px solid #ffffff0a",background:selected.color}}>
              {selected.photo&&<img src={selected.photo} alt="" style={{width:"100%",maxHeight:240,objectFit:"cover",display:"block"}}/>}
              <div style={{padding:"24px 26px 22px"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                  <span style={{fontSize:38}}>{selected.mood}</span>
                  <span style={{fontSize:11,color:"#ffffff55",letterSpacing:1}}>{fmt(selected.date)}</span>
                </div>
                <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:22,color:"#f0ebe0",marginBottom:12}}>{selected.title}</h2>
                <p style={{fontSize:14,lineHeight:1.85,color:"#ffffffcc",marginBottom:18}}>{selected.text}</p>
                <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                  {selected.place&&<span style={TAG}>📍 {selected.place}</span>}
                  {(selected.people||[]).map(p=><span key={p} style={TAG}>👤 {p}</span>)}
                </div>
              </div>
            </div>
            <div style={{display:"flex",gap:8,marginTop:12,flexWrap:"wrap"}}>
              <button className="btn" style={{...SAVEBTN,flex:1}} onClick={()=>downloadCard(selected)}>📤 Download</button>
              <button className="btn" style={{...SAVEBTN,flex:1,background:"#c9a96e20",color:"#c9a96e"}} onClick={()=>{navigator.clipboard?.writeText(`${selected.title}\n\n${selected.text}`);showToast("Copied!");}}>📋 Copy</button>
              <button className="btn" style={{...SAVEBTN,flex:1,background:"#ff222212",color:"#ff7777"}} onClick={()=>deleteMem(selected.id)}>🗑 Delete</button>
            </div>
          </div>
        )}

        {/* ── MAP ── */}
        {view==="map"&&(
          <div style={{animation:"fadeUp .4s ease"}}>
            <div style={{textAlign:"center",marginBottom:24}}>
              <h1 style={H1}>Memory Map</h1>
              <p style={SUB}>Places where your story unfolded</p>
            </div>
            <div style={{background:"#0a1520",border:"1px solid #1a2a3a",borderRadius:20,padding:24,marginBottom:20,position:"relative",minHeight:400,overflow:"hidden"}}>
              {/* Simple SVG world map placeholder with dots */}
              <div style={{position:"relative",width:"100%",paddingBottom:"56%"}}>
                <svg viewBox="0 0 800 450" style={{position:"absolute",inset:0,width:"100%",height:"100%"}} xmlns="http://www.w3.org/2000/svg">
                  {/* Background */}
                  <rect width="800" height="450" fill="#0a1520"/>
                  {/* Simple continent shapes */}
                  <g fill="#1a2a3a" stroke="#2a3a4a" strokeWidth="1">
                    {/* Africa */}
                    <ellipse cx="440" cy="260" rx="60" ry="90"/>
                    {/* Europe */}
                    <ellipse cx="420" cy="160" rx="50" ry="40"/>
                    {/* North America */}
                    <ellipse cx="170" cy="190" rx="90" ry="70"/>
                    {/* South America */}
                    <ellipse cx="230" cy="310" rx="55" ry="75"/>
                    {/* Asia */}
                    <ellipse cx="580" cy="190" rx="120" ry="70"/>
                    {/* Australia */}
                    <ellipse cx="650" cy="330" rx="55" ry="40"/>
                  </g>
                  {/* Grid lines */}
                  {[150,300,450,600].map(x=><line key={x} x1={x} y1="0" x2={x} y2="450" stroke="#1a2535" strokeWidth="1"/>)}
                  {[112,225,338].map(y=><line key={y} x1="0" y1={y} x2="800" y2={y} stroke="#1a2535" strokeWidth="1"/>)}
                  {/* Memory dots */}
                  {memories.filter(m=>getCoords(m.place)).map((mem,i)=>{
                    const [lat,lng]=getCoords(mem.place);
                    // Convert lat/lng to SVG coords (rough)
                    const x=((lng+180)/360)*800;
                    const y=((90-lat)/180)*450;
                    return(
                      <g key={mem.id}>
                        <circle cx={x} cy={y} r="14" fill={mem.color} stroke="#c9a96e" strokeWidth="2" opacity=".9"/>
                        <text x={x} y={y+5} textAnchor="middle" fontSize="12">{mem.mood}</text>
                        <title>{mem.title} — {mem.place}</title>
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>
            {/* Memory list with places */}
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {memories.filter(m=>m.place).map(mem=>(
                <div key={mem.id} style={{background:mem.color,borderRadius:14,padding:"14px 18px",display:"flex",alignItems:"center",gap:14,cursor:"pointer",border:"1px solid #ffffff08"}}
                  onClick={()=>{setSelected(mem);setView("detail");}}>
                  <span style={{fontSize:24}}>{mem.mood}</span>
                  <div style={{flex:1}}>
                    <div style={{fontFamily:"'Playfair Display',serif",fontSize:15,color:"#f0ebe0",marginBottom:3}}>{mem.title}</div>
                    <div style={{fontSize:12,color:"#ffffff60"}}>📍 {mem.place} · {fmt(mem.date)}</div>
                  </div>
                  <span style={{color:"#ffffff30",fontSize:18}}>›</span>
                </div>
              ))}
              {!memories.filter(m=>m.place).length&&<p style={{color:"#333",textAlign:"center",padding:40}}>Add places to your memories to see them on the map ◎</p>}
            </div>
          </div>
        )}

        {/* ── INSIGHTS ── */}
        {view==="insights"&&(
          <div style={{animation:"fadeUp .4s ease"}}>
            <div style={{textAlign:"center",marginBottom:28}}>
              <h1 style={H1}>Your Insights</h1>
              <p style={SUB}>Patterns woven through your story</p>
            </div>

            {/* Stats row */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:20}}>
              {[
                {icon:"📝",val:ins.total,label:"Total Memories"},
                {icon:"✍️",val:ins.words.toLocaleString(),label:"Words Written"},
                {icon:"📍",val:Object.keys(ins.placeCount).length,label:"Places Visited"},
              ].map(({icon,val,label})=>(
                <div key={label} style={{background:"#111",border:"1px solid #1a1a1a",borderRadius:16,padding:"20px 16px",textAlign:"center"}}>
                  <div style={{fontSize:28,marginBottom:8}}>{icon}</div>
                  <div style={{fontFamily:"'Playfair Display',serif",fontSize:26,color:"#c9a96e",marginBottom:4}}>{val}</div>
                  <div style={{fontSize:11,color:"#444",letterSpacing:1}}>{label}</div>
                </div>
              ))}
            </div>

            {/* Activity chart */}
            {ins.months.length>0&&(
              <div style={{background:"#111",border:"1px solid #1a1a1a",borderRadius:18,padding:24,marginBottom:16}}>
                <div style={{fontSize:12,color:"#c9a96e",letterSpacing:1.5,textTransform:"uppercase",marginBottom:20}}>Memory Activity</div>
                <div style={{display:"flex",alignItems:"flex-end",gap:10,height:100}}>
                  {ins.months.map(([mo,count])=>{
                    const max=Math.max(...ins.months.map(([,c])=>c));
                    const h=Math.max((count/max)*80,8);
                    return(
                      <div key={mo} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:8}}>
                        <div style={{fontSize:11,color:"#c9a96e",fontWeight:"bold"}}>{count}</div>
                        <div style={{width:"100%",height:h,background:"linear-gradient(to top,#c9a96e,#c9a96e80)",borderRadius:4}}/>
                        <div style={{fontSize:10,color:"#444",letterSpacing:.5}}>{mo.slice(5)}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              {/* Top mood */}
              <div style={{background:"#111",border:"1px solid #1a1a1a",borderRadius:18,padding:20}}>
                <div style={{fontSize:11,color:"#c9a96e",letterSpacing:1.5,textTransform:"uppercase",marginBottom:14}}>Most Common Mood</div>
                {ins.topMood?<>
                  <div style={{fontSize:40,marginBottom:8}}>{ins.topMood[0]}</div>
                  <div style={{fontSize:13,color:"#666"}}>{ins.topMood[1]} memories</div>
                </>:<div style={{color:"#333",fontSize:13}}>No moods yet</div>}
              </div>

              {/* Top person */}
              <div style={{background:"#111",border:"1px solid #1a1a1a",borderRadius:18,padding:20}}>
                <div style={{fontSize:11,color:"#c9a96e",letterSpacing:1.5,textTransform:"uppercase",marginBottom:14}}>Most Mentioned Person</div>
                {ins.topPerson?<>
                  <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,color:"#f0ebe0",marginBottom:8}}>👤 {ins.topPerson[0]}</div>
                  <div style={{fontSize:13,color:"#666"}}>{ins.topPerson[1]} memories together</div>
                </>:<div style={{color:"#333",fontSize:13}}>No people tagged yet</div>}
              </div>

              {/* Top place */}
              <div style={{background:"#111",border:"1px solid #1a1a1a",borderRadius:18,padding:20}}>
                <div style={{fontSize:11,color:"#c9a96e",letterSpacing:1.5,textTransform:"uppercase",marginBottom:14}}>Most Visited Place</div>
                {ins.topPlace?<>
                  <div style={{fontFamily:"'Playfair Display',serif",fontSize:18,color:"#f0ebe0",marginBottom:8}}>📍 {ins.topPlace[0]}</div>
                  <div style={{fontSize:13,color:"#666"}}>{ins.topPlace[1]} memories there</div>
                </>:<div style={{color:"#333",fontSize:13}}>No places tagged yet</div>}
              </div>

              {/* Mood breakdown */}
              <div style={{background:"#111",border:"1px solid #1a1a1a",borderRadius:18,padding:20}}>
                <div style={{fontSize:11,color:"#c9a96e",letterSpacing:1.5,textTransform:"uppercase",marginBottom:14}}>Mood Breakdown</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                  {Object.entries(ins.moodCount).sort((a,b)=>b[1]-a[1]).slice(0,6).map(([m,c])=>(
                    <div key={m} style={{display:"flex",alignItems:"center",gap:5,background:"#1a1a1a",borderRadius:999,padding:"4px 10px"}}>
                      <span style={{fontSize:14}}>{m}</span>
                      <span style={{fontSize:11,color:"#555"}}>{c}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── FAMILY SHARING ── */}
        {view==="family"&&(
          <div style={{maxWidth:520,margin:"0 auto",animation:"fadeUp .4s ease"}}>
            <div style={{textAlign:"center",marginBottom:28}}>
              <div style={{fontSize:46,marginBottom:10}}>👨‍👩‍👧</div>
              <h1 style={H1}>Family Sharing</h1>
              <p style={SUB}>Share your memory tapestry with the people you love.</p>
            </div>

            {/* Share your memories */}
            <div style={{background:"#111",border:"1px solid #1a1a1a",borderRadius:18,padding:24,marginBottom:16}}>
              <div style={{fontSize:12,color:"#c9a96e",letterSpacing:1.5,textTransform:"uppercase",marginBottom:12}}>Share Your Memories</div>
              <p style={{fontSize:13,color:"#555",lineHeight:1.7,marginBottom:18}}>Generate a family code and share it with family members so they can view your memories.</p>
              <button className="btn" style={SAVEBTN} onClick={generateFamilyCode}>Generate Family Code</button>
              {familyCode&&(
                <div style={{marginTop:18,background:"#0d0d0d",borderRadius:12,padding:"16px 20px",border:"1px solid #c9a96e30"}}>
                  <div style={{fontSize:11,color:"#c9a96e",letterSpacing:2,marginBottom:8}}>YOUR FAMILY CODE</div>
                  <div style={{fontFamily:"'Playfair Display',serif",fontSize:28,color:"#f0ebe0",letterSpacing:4,marginBottom:12}}>{familyCode}</div>
                  <button className="btn" style={{...SAVEBTN,background:"#c9a96e20",color:"#c9a96e"}} onClick={()=>{navigator.clipboard?.writeText(familyCode);showToast("Code copied!");}}>📋 Copy Code</button>
                </div>
              )}
            </div>

            {/* Join family */}
            <div style={{background:"#111",border:"1px solid #1a1a1a",borderRadius:18,padding:24,marginBottom:16}}>
              <div style={{fontSize:12,color:"#c9a96e",letterSpacing:1.5,textTransform:"uppercase",marginBottom:12}}>View Family Memories</div>
              <p style={{fontSize:13,color:"#555",lineHeight:1.7,marginBottom:14}}>Enter a family code shared with you to view their memory tapestry.</p>
              <input style={{...INP,marginBottom:12}} placeholder="Enter family code e.g. KOFI-A3B2" value={joinCode} onChange={e=>setJoinCode(e.target.value)}/>
              <button className="btn" style={SAVEBTN} onClick={joinFamily}>Connect to Family ✦</button>
            </div>

            {/* Shared memories */}
            {sharedMemories.length>0&&(
              <div>
                <div style={{fontSize:12,color:"#c9a96e",letterSpacing:1.5,textTransform:"uppercase",marginBottom:14}}>Family Memories ({sharedMemories.length})</div>
                <div style={{display:"flex",flexDirection:"column",gap:10}}>
                  {sharedMemories.map(mem=>(
                    <div key={mem.id} style={{background:mem.color,borderRadius:14,padding:"14px 18px",border:"1px solid #ffffff08"}}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                        <span style={{fontSize:18}}>{mem.mood}</span>
                        <span style={{fontSize:10,color:"#ffffff50"}}>{fmt(mem.date)}</span>
                      </div>
                      <div style={{fontFamily:"'Playfair Display',serif",fontSize:15,color:"#f0ebe0",marginBottom:6}}>{mem.title}</div>
                      <p style={{fontSize:12,color:"#ffffff75",lineHeight:1.6}}>{mem.text.slice(0,120)}…</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── REMINDERS ── */}
        {view==="reminders"&&(
          <div style={{maxWidth:480,margin:"0 auto",animation:"fadeUp .4s ease"}}>
            <div style={{textAlign:"center",marginBottom:28}}>
              <div style={{fontSize:46,marginBottom:10}}>🔔</div>
              <h1 style={H1}>Daily Reminders</h1>
              <p style={SUB}>Set a daily nudge to capture your memories.</p>
            </div>

            <div style={{background:"#111",border:"1px solid #1a1a1a",borderRadius:18,padding:26,marginBottom:16}}>
              <div style={{fontSize:12,color:"#c9a96e",letterSpacing:1.5,textTransform:"uppercase",marginBottom:14}}>Set Reminder Time</div>
              <p style={{fontSize:13,color:"#555",lineHeight:1.7,marginBottom:20}}>We'll send you a notification each day at your chosen time — a gentle nudge to write your memory before the day fades.</p>
              <Fld label="What time should we remind you?">
                <input style={INP} type="time" value={reminderTime} onChange={e=>setReminderTime(e.target.value)}/>
              </Fld>
              <div style={{height:16}}/>
              {notifPerm==="denied"&&<p style={{color:"#ff6666",fontSize:13,marginBottom:12}}>⚠️ Notifications are blocked. Please allow them in your browser settings.</p>}
              {reminderSet&&<div style={{background:"#1a3a1a",borderRadius:12,padding:"12px 16px",marginBottom:14,fontSize:13,color:"#88cc88"}}>✓ Reminder set for {reminderTime} daily</div>}
              <button className="btn" style={SAVEBTN} onClick={setReminder}>
                {reminderSet?"Update Reminder ◎":"Set Daily Reminder ✦"}
              </button>
            </div>

            {/* Journal streak */}
            <div style={{background:"#111",border:"1px solid #1a1a1a",borderRadius:18,padding:24}}>
              <div style={{fontSize:12,color:"#c9a96e",letterSpacing:1.5,textTransform:"uppercase",marginBottom:14}}>Your Journal Streak</div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {Array.from({length:7}).map((_,i)=>{
                  const d=new Date();d.setDate(d.getDate()-i);
                  const ds=d.toISOString().slice(0,10);
                  const hasMem=memories.some(m=>m.date===ds);
                  return(
                    <div key={i} style={{flex:1,minWidth:36,background:hasMem?"#1a3a1a":"#1a1a1a",border:`1px solid ${hasMem?"#4a7a4a":"#222"}`,borderRadius:10,padding:"10px 6px",textAlign:"center"}}>
                      <div style={{fontSize:16,marginBottom:4}}>{hasMem?"✦":"·"}</div>
                      <div style={{fontSize:9,color:"#444"}}>{["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][d.getDay()]}</div>
                    </div>
                  );
                })}
              </div>
              <p style={{fontSize:12,color:"#444",marginTop:14,textAlign:"center"}}>
                {memories.filter(m=>m.date===new Date().toISOString().slice(0,10)).length>0
                  ?"✦ You wrote a memory today! Keep going.":"Write a memory today to keep your streak alive."}
              </p>
            </div>
          </div>
        )}

        {/* ── ASK AI ── */}
        {view==="ask"&&(
          <div style={{maxWidth:520,margin:"0 auto",animation:"fadeUp .4s ease"}}>
            <div style={{textAlign:"center",marginBottom:28}}>
              <div style={{fontSize:44,marginBottom:10}}>🔮</div>
              <h1 style={H1}>Ask Your Memories</h1>
              <p style={SUB}>Ask anything about your life, patterns, or people.</p>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:14}}>
              <div style={{display:"flex",flexWrap:"wrap",gap:7}}>
                {["What have I learned this year?","Who do I spend most time with?","What places have I visited?","What moments made me happiest?","What patterns do you see in my life?"].map(q=>(
                  <button key={q} onClick={()=>setAiQ(q)} style={{background:"#111",border:"1px solid #1e1e1e",color:"#666",padding:"7px 13px",borderRadius:999,cursor:"pointer",fontSize:12,fontFamily:"inherit"}}>{q}</button>
                ))}
              </div>
              <textarea style={{...INP,height:80,resize:"vertical"}} placeholder="Ask anything about your memories..." value={aiQ} onChange={e=>setAiQ(e.target.value)}/>
              <button className="btn" style={SAVEBTN} onClick={askAI} disabled={aiLoading}>{aiLoading?"Thinking…":"Ask EchoLink ✦"}</button>
            </div>
            {(aiLoading||aiReply)&&(
              <div style={{background:"#130f0a",border:"1px solid #c9a96e18",borderRadius:18,padding:"22px 26px",marginTop:20}}>
                {aiLoading
                  ?<div style={{display:"flex",alignItems:"center",gap:12}}><div style={SPIN}/><span style={{color:"#555"}}>Reading your memories...</span></div>
                  :<p style={{fontSize:14,lineHeight:1.9,color:"#e8dfc8",fontStyle:"italic"}}>{aiReply}</p>}
              </div>
            )}
          </div>
        )}

        {/* ── STORY ── */}
        {view==="story"&&(
          <div style={{maxWidth:540,margin:"0 auto",textAlign:"center",animation:"fadeUp .4s ease"}}>
            <div style={{marginBottom:24}}>
              <div style={{fontSize:46,marginBottom:10}}>✦</div>
              <h1 style={H1}>Your Living Story</h1>
              <p style={SUB}>AI-woven from all {memories.length} of your memories</p>
            </div>
            {loadingStory
              ?<div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:14,padding:60}}>
                  <div style={SPIN}/>
                  <p style={{color:"#444"}}>Weaving your tapestry...</p>
                </div>
              :story&&<>
                  <div style={{background:"#130f0a",border:"1px solid #c9a96e20",borderRadius:18,padding:"26px 30px",textAlign:"left"}}>
                    <p style={{fontSize:15,lineHeight:1.95,color:"#e8dfc8",fontStyle:"italic"}}>{story}</p>
                  </div>
                  <div style={{display:"flex",gap:10,marginTop:12}}>
                    <button className="btn" style={{...SAVEBTN,flex:1}} onClick={generateStory}>✦ Reweave</button>
                    <button className="btn" style={{...SAVEBTN,flex:1,background:"#c9a96e20",color:"#c9a96e"}} onClick={()=>{navigator.clipboard?.writeText(story);showToast("Story copied!");}}>📋 Copy</button>
                  </div>
                </>
            }
          </div>
        )}
      </main>
    </div>
  );
}

function Fld({label,children,s}){
  return<div style={{display:"flex",flexDirection:"column",gap:7,...s}}>
    <label style={{fontSize:11,color:"#c9a96e",letterSpacing:1.5,textTransform:"uppercase"}}>{label}</label>
    {children}
  </div>;
}

const INP={background:"#141414",border:"1px solid #222",borderRadius:12,padding:"11px 15px",color:"#f0ebe0",fontSize:14,fontFamily:"inherit",outline:"none",width:"100%"};
const SAVEBTN={background:"#c9a96e",color:"#0d0d0d",border:"none",borderRadius:999,padding:"12px 22px",fontSize:14,fontWeight:"bold",cursor:"pointer",fontFamily:"inherit",letterSpacing:.5,transition:"opacity .2s",width:"100%"};
const NAVBTN={background:"transparent",border:"1px solid #1a1a1a",color:"#555",padding:"6px 12px",borderRadius:999,cursor:"pointer",fontSize:11,fontFamily:"inherit",transition:"all .2s",letterSpacing:.3,whiteSpace:"nowrap"};
const NAVACT={background:"#c9a96e18",borderColor:"#c9a96e",color:"#c9a96e"};
const TAG={fontSize:10,background:"#ffffff10",padding:"2px 9px",borderRadius:999,color:"#bbb",letterSpacing:.3};
const MPILL={fontSize:12,padding:"5px 11px",borderRadius:999,cursor:"pointer",fontFamily:"inherit",transition:"all .2s"};
const TOAST={position:"fixed",bottom:24,left:"50%",transform:"translateX(-50%)",background:"#c9a96e",color:"#0d0d0d",padding:"10px 20px",borderRadius:999,fontSize:13,fontWeight:"bold",zIndex:9999,animation:"toast 2.8s ease forwards",whiteSpace:"nowrap",pointerEvents:"none"};
const SPIN={width:32,height:32,border:"3px solid #1a1a1a",borderTop:"3px solid #c9a96e",borderRadius:"50%",animation:"spin 1s linear infinite"};
const H1={fontFamily:"'Playfair Display',serif",fontSize:26,fontWeight:"bold",color:"#f0ebe0",marginBottom:8,lineHeight:1.2};
const SUB={color:"#555",fontSize:13,letterSpacing:.5};
const GCSS=`
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Lora:ital@0;1&display=swap');
*{box-sizing:border-box;margin:0;padding:0;}
::-webkit-scrollbar{width:3px;}::-webkit-scrollbar-track{background:#0d0d0d;}::-webkit-scrollbar-thumb{background:#1e1e1e;border-radius:2px;}
@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes toast{0%{opacity:0;transform:translateX(-50%) translateY(12px)}10%,80%{opacity:1;transform:translateX(-50%) translateY(0)}100%{opacity:0;transform:translateX(-50%) translateY(-8px)}}
.mcard:hover{transform:translateY(-4px);box-shadow:0 12px 40px #00000060!important;}
.btn:hover{opacity:.8!important;}
.nbtn:hover{background:#ffffff08!important;color:#aaa!important;}
`;
