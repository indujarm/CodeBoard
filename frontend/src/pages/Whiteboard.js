import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import io from "socket.io-client";
import Editor from "@monaco-editor/react";

/* ─── confetti loader (#5) — loaded once from CDN ──────────────────────────── */
let confettiLoaded = false;
function loadConfetti() {
  if (confettiLoaded || typeof window === "undefined") return;
  confettiLoaded = true;
  const s = document.createElement("script");
  s.src = "https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.3/dist/confetti.browser.min.js";
  document.head.appendChild(s);
}

function fireConfetti() {
  if (typeof window.confetti !== "function") return;
  window.confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 },
    colors: ["#028391","#F6DCAC","#FAA968","#F85525","#33FF57"] });
}

const Icon = ({ d, size=20, fill="none", stroke="currentColor", strokeWidth=1.8, className="", ...p }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke}
    strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className} {...p}>
    {Array.isArray(d) ? d.map((path,i)=><path key={i} d={path}/>) : <path d={d}/>}
  </svg>
);

const Icons = {
  pen:       "M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z",
  eraser:    "M20 20H7L3 16l10-10 7 7-3.5 3.5M6 17l-3-3",
  line:      "M5 19L19 5",
  rect:      "M3 3h18v18H3z",
  circle:    "M12 12m-9 0a9 9 0 1018 0 9 9 0 00-18 0",
  text:      ["M4 7V4h16v3","M9 20h6","M12 4v16"],
  arrow:     "M5 12h14M12 5l7 7-7 7",
  undo:      "M3 7v6h6M3.51 15a9 9 0 101.13-4.6",
  redo:      "M21 7v6h-6M20.49 15a9 9 0 11-1.13-4.6",
  clear:     "M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2",
  download:  "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3",
  play:      "M5 3l14 9L5 21V3z",
  pause:     "M6 4h4v16H6zM14 4h4v16h-4z",
  resume:    "M13 10l7 4-7 4V10zM5 4v16",
  speed:     "M12 2a10 10 0 100 20A10 10 0 0012 2zM12 6v6l4 2",
  chat:      ["M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"],
  users:     ["M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2","M23 21v-2a4 4 0 00-3-3.87","M16 3.13a4 4 0 010 7.75","M9 7a4 4 0 100 8 4 4 0 000-8z"],
  menu:      "M3 12h18M3 6h18M3 18h18",
  copy:      ["M8 17H5a2 2 0 01-2-2V5a2 2 0 012-2h10a2 2 0 012 2v3","M13 21H9a2 2 0 01-2-2v-8a2 2 0 012-2h8a2 2 0 012 2v4"],
  exit:      "M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9",
  send:      "M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z",
  close:     "M18 6L6 18M6 6l12 12",
  run:       "M5 3l14 9L5 21V3z",
  moon:      "M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z",
  sun:       ["M12 2v2","M12 20v2","M4.22 4.22l1.42 1.42","M18.36 18.36l1.42 1.42","M2 12h2","M20 12h2","M4.22 19.78l1.42-1.42","M18.36 5.64l1.42-1.42","M12 6a6 6 0 100 12 6 6 0 000-12z"],
  sparkle:   "M12 3l1.5 5h5l-4 3 1.5 5-4-3-4 3 1.5-5-4-3h5z",
  fix:       "M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-1-7v2h2v-2h-2zm0-8v6h2V7h-2z",
  explain:   "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z",
  convert:   "M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4",
  tests:     "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4",
  summarize: "M4 6h16M4 10h16M4 14h10",
  mic:       "M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3zM19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8",
  micOff:    "M1 1l22 22M9 9v3a3 3 0 005.12 2.12M15 9.34V4a3 3 0 00-5.94-.6M17 16.95A7 7 0 015 12v-2m14 0v2a7 7 0 01-.11 1.23M12 19v4M8 23h8",
  headphone: "M3 18v-6a9 9 0 0118 0v6M3 18a3 3 0 006 0v-2a3 3 0 00-6 0v2zM15 18a3 3 0 006 0v-2a3 3 0 00-6 0v2z",
  volume:    "M11 5L6 9H2v6h4l5 4V5zM19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07",
  clock:     "M12 2a10 10 0 100 20A10 10 0 0012 2zM12 6v6l4 2",
  stickyNote:"M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6",
};

const AI_ACTIONS = [
  { id:"fix",       icon:"fix",       label:"Fix Error",        prompt:(code,out)    => `Fix this code and explain what was wrong:\n\`\`\`\n${code}\n\`\`\`\nError output:\n${out}` },
  { id:"explain",   icon:"explain",   label:"Explain Code",     prompt:(code)         => `Explain what this code does step by step:\n\`\`\`\n${code}\n\`\`\`` },
  { id:"tests",     icon:"tests",     label:"Generate Tests",   prompt:(code)         => `Generate comprehensive test cases:\n\`\`\`\n${code}\n\`\`\`` },
  { id:"convert",   icon:"convert",   label:"Convert Language", prompt:(code,_,lang)  => `Convert this ${lang} code to another language, explain the key differences:\n\`\`\`\n${code}\n\`\`\`` },
  { id:"summarize", icon:"summarize", label:"Summarize",        prompt:(code)         => `Concisely summarize what this code does:\n\`\`\`\n${code}\n\`\`\`` },
];

const EMOJI_LIST = ["👍","✅","❓","🔥","💡","😂","❌","⭐"];

function VoiceOrb({ name, color, speaking, muted }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative">
        <div style={{ background:color, width:40, height:40, boxShadow: speaking&&!muted?`0 0 0 3px ${color}55, 0 0 12px ${color}40`:undefined }}
          className="rounded-full flex items-center justify-center text-white text-xs font-bold">
          {name.slice(0,2).toUpperCase()}
        </div>
        {speaking&&!muted&&<span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-400 border-2 border-[#01152f] animate-pulse"/>}
        {muted&&<span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-red-500 flex items-center justify-center"><Icon d={Icons.micOff} size={7} stroke="white" strokeWidth={2.5}/></span>}
      </div>
      <span className="text-[9px] text-[#F6DCAC]/60 max-w-[44px] truncate text-center">{name}</span>
    </div>
  );
}

export default function Whiteboard() {
  useEffect(() => { loadConfetti(); }, []);

  const [theme, setTheme] = useState("dark");
  const { roomId } = useParams();
  const navigate   = useNavigate();

  const canvasRef        = useRef(null);
  const socketRef        = useRef(null);
  const historyRef       = useRef([]);
  const redoRef          = useRef([]);
  const editorRef        = useRef(null);
  const chatEndRef       = useRef(null);
  const aiEndRef         = useRef(null);
  const typingTimeoutRef = useRef(null);
  const replayIndexRef   = useRef(0);
  const replayEventsRef  = useRef([]);
  const replayTimeoutRef = useRef(null);
  const dividerRef       = useRef(null);
  const draggingRef      = useRef(false);
  const localStreamRef   = useRef(null);
  const audioCtxRef      = useRef(null);
  const analyserRef      = useRef(null);
  const voiceRafRef      = useRef(null);
  const sessionStartRef  = useRef(Date.now()); // #4 timer

  const [users,             setUsers]             = useState([]);
  const [cursors,           setCursors]           = useState({});
  const [code,              setCode]              = useState("");
  const [language,          setLanguage]          = useState("python");
  const [output,            setOutput]            = useState("");
  const [messages,          setMessages]          = useState([]);
  const [inputMessage,      setInputMessage]      = useState("");
  const [typingUsersEditor, setTypingUsersEditor] = useState({});
  const [typingUserChat,    setTypingUserChat]    = useState("");
  const [stdin,             setStdin]             = useState("");
  const [tool,              setTool]              = useState("pen");
  const [color,             setColor]             = useState("#ffffff");
  const [brushSize,         setBrushSize]         = useState(2);
  const [isDrawing,         setIsDrawing]         = useState(false);
  const [lastPos,           setLastPos]           = useState(null);
  const [isPaused,          setIsPaused]          = useState(false);
  const [replaySpeed,       setReplaySpeed]       = useState(1);
  const [userColor,         setUserColor]         = useState("#028391");
  const [showProfileMenu,   setShowProfileMenu]   = useState(false);
  const [showWbMenu,        setShowWbMenu]        = useState(false);
  const [rightPanel,        setRightPanel]        = useState(null);
  const [copied,            setCopied]            = useState(false);
  const [isRunning,         setIsRunning]         = useState(false);
  const [activeUsers,       setActiveUsers]       = useState({});
  const [splitPct,          setSplitPct]          = useState(55);
  const [aiMessages,        setAiMessages]        = useState([]);
  const [aiInput,           setAiInput]           = useState("");
  const [aiLoading,         setAiLoading]         = useState(false);
  const [voiceActive,       setVoiceActive]       = useState(false);
  const [isMuted,           setIsMuted]           = useState(false);
  const [voiceUsers,        setVoiceUsers]        = useState({});
  const [speaking,          setSpeaking]          = useState(false);
  // #4 Session timer
  const [sessionTime,       setSessionTime]       = useState("00:00");
  // #7 Room pulse
  const [roomPulse,         setRoomPulse]         = useState("idle"); // idle|drawing|coding|chatting
  // #8 Typing awareness bar
  const [anyoneTyping,      setAnyoneTyping]      = useState(false);
  const typingBarTimeoutRef = useRef(null);
  // #1 Output sticky note on canvas
  const [canvasStickyNotes, setCanvasStickyNotes] = useState([]); // [{id,text,x,y}]
  // #10/#13 Emoji reactions
  const [showEmojiPicker,   setShowEmojiPicker]   = useState(false);
  const [emojiReactions,    setEmojiReactions]    = useState([]); // [{id,emoji,x,y,username}]

  const username = sessionStorage.getItem("username") || "User";
  const COLORS   = ["#FF5733","#33FF57","#3357FF","#FF33A8","#33FFF3","#F3FF33","#FF9933","#9933FF"];

  const isDark = theme === "dark";
  const colors = {
    bgMain:    isDark ? "bg-[#01204E]"     : "bg-[#F6DCAC]",
    bgNav:     isDark ? "bg-[#011a3a]"     : "bg-[#F6DCAC]",
    bgPanel:   isDark ? "bg-[#01204E]"     : "bg-white",
    bgSub:     isDark ? "bg-[#01152f]"     : "bg-[#F6DCAC]",
    text:      isDark ? "text-[#F6DCAC]"   : "text-[#01204E]",
    textMuted: isDark ? "text-[#7a9b7c]"   : "text-[#888]",
    border:    isDark ? "border-[#028391]" : "border-[#FAA968]",
  };

  const pulseColors = { idle:"#028391", drawing:"#FF5733", coding:"#028391", chatting:"#3357FF" };

  // ── Sub-components ────────────────────────────────────────────────────────────
  const TypingDots = () => (
    <span className="inline-flex items-end gap-0.5 h-3">
      {[0,1,2].map(i=>(
        <span key={i} className="w-1 h-1 rounded-full bg-[#028391] animate-bounce"
          style={{animationDelay:`${i*0.15}s`}}/>
      ))}
    </span>
  );
  const Avatar = ({ name, color:ac, size=32 }) => (
    <div style={{width:size,height:size,background:ac,fontSize:size*0.38}}
      className="rounded-full flex items-center justify-center font-bold text-white shrink-0 shadow-md">
      {(name?.slice(0,2)||"?").toUpperCase()}
    </div>
  );
  const Btn = ({ icon, label, onClick, active, danger, className="", size=18, title:t }) => (
    <button title={t||label} onClick={onClick}
      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150
        ${active?"bg-[#028391] text-white shadow-md shadow-[#028391]/30":danger?"hover:bg-red-500/15 text-red-400":`hover:bg-white/10 ${colors.text}`} ${className}`}>
      <Icon d={Icons[icon]} size={size}/>
      {label&&<span className="hidden lg:inline">{label}</span>}
    </button>
  );

  // ── #4 Session Timer ──────────────────────────────────────────────────────────
  useEffect(() => {
    const iv = setInterval(() => {
      const elapsed = Math.floor((Date.now() - sessionStartRef.current) / 1000);
      const h = Math.floor(elapsed / 3600);
      const m = Math.floor((elapsed % 3600) / 60);
      const s = elapsed % 60;
      if (h > 0) setSessionTime(`${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`);
      else       setSessionTime(`${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`);
    }, 1000);
    return () => clearInterval(iv);
  }, []);

  // ── Init Color ────────────────────────────────────────────────────────────────
  useEffect(() => {
    let c = sessionStorage.getItem("color");
    if (!c) { c=COLORS[Math.floor(Math.random()*COLORS.length)]; sessionStorage.setItem("color",c); }
    setUserColor(c);
  }, []);

  // ── Socket ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const socket = io("http://localhost:5000", { query:{roomId,username} });
    socketRef.current = socket;

    socket.on("receive_message",  d=>setMessages(p=>[...p,d]));
    socket.on("typing", d=>{
      setTypingUserChat(d.username);
      // #8 typing bar
      setAnyoneTyping(true);
      clearTimeout(typingBarTimeoutRef.current);
      typingBarTimeoutRef.current = setTimeout(()=>setAnyoneTyping(false),2000);
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current=setTimeout(()=>setTypingUserChat(""),1500);
    });
    socket.on("canvas_state", image=>{
      if (!image||!canvasRef.current) return;
      const img=new Image(); img.src=image;
      img.onload=()=>{const ctx=canvasRef.current.getContext("2d");ctx.clearRect(0,0,canvasRef.current.width,canvasRef.current.height);ctx.drawImage(img,0,0);};
    });
    socket.on("draw", data=>{
      if (!canvasRef.current) return;
      const ctx=canvasRef.current.getContext("2d");
      ctx.lineWidth=data.brushSize||2; ctx.lineCap="round";
      if (data.tool==="eraser") ctx.globalCompositeOperation="destination-out";
      else {ctx.globalCompositeOperation="source-over";ctx.strokeStyle=data.color||"#fff";}
      if (data.type==="text"){ctx.font=`${data.size*5}px 'JetBrains Mono'`;ctx.fillStyle=data.color;ctx.fillText(data.text,data.x,data.y);return;}
      if (data.tool==="pen"||data.tool==="eraser"){ctx.beginPath();ctx.moveTo(data.x1,data.y1);ctx.lineTo(data.x2,data.y2);ctx.stroke();}
      else if(data.tool==="line"){ctx.beginPath();ctx.moveTo(data.x1,data.y1);ctx.lineTo(data.x2,data.y2);ctx.stroke();}
      else if(data.tool==="rect")ctx.strokeRect(data.x1,data.y1,data.x2-data.x1,data.y2-data.y1);
      else if(data.tool==="circle"){const r=Math.sqrt((data.x2-data.x1)**2+(data.y2-data.y1)**2);ctx.beginPath();ctx.arc(data.x1,data.y1,r,0,2*Math.PI);ctx.stroke();}
      else if(data.tool==="arrow"){
        const hl=10,dx=data.x2-data.x1,dy=data.y2-data.y1,angle=Math.atan2(dy,dx);
        ctx.beginPath();ctx.moveTo(data.x1,data.y1);ctx.lineTo(data.x2,data.y2);ctx.stroke();
        ctx.beginPath();ctx.moveTo(data.x2,data.y2);
        ctx.lineTo(data.x2-hl*Math.cos(angle-Math.PI/6),data.y2-hl*Math.sin(angle-Math.PI/6));
        ctx.lineTo(data.x2-hl*Math.cos(angle+Math.PI/6),data.y2-hl*Math.sin(angle+Math.PI/6));
        ctx.lineTo(data.x2,data.y2);ctx.fillStyle=data.color||"#fff";ctx.fill();
      }
    });
    socket.on("code_update",     setCode);
    socket.on("presence_update", members=>setUsers(members));
    socket.on("cursor_move",     data=>setCursors(p=>({...p,[data.username]:{x:data.x,y:data.y,color:data.color,activity:data.activity}})));
    socket.on("undo",            ()=>undo(true));
    socket.on("redo",            ()=>redo(true));
    socket.on("code_output",     result=>{
      setOutput(result);
      setIsRunning(false);
      // #5 Confetti on success
      const isError = /error|exception|traceback|syntaxerror|nameerror|typeerror/i.test(result);
      if (!isError && result.trim().length > 0) {
        setTimeout(fireConfetti, 100);
      }
      // #1 Sticky note on canvas — show output as a floating note
      if (canvasRef.current && result.trim()) {
        const noteId = Date.now();
        const rect   = canvasRef.current.getBoundingClientRect();
        setCanvasStickyNotes(prev=>[...prev,{
          id: noteId,
          text: result.trim().slice(0,120) + (result.trim().length > 120 ? "…" : ""),
          x: 20 + Math.random() * (rect.width * 0.3),
          y: rect.height - 140 - Math.random() * 60,
        }]);
        setTimeout(()=>setCanvasStickyNotes(prev=>prev.filter(n=>n.id!==noteId)), 8000);
      }
    });
    socket.on("typingEditor", data=>{
      // #8 typing bar for editor too
      setAnyoneTyping(true);
      clearTimeout(typingBarTimeoutRef.current);
      typingBarTimeoutRef.current=setTimeout(()=>setAnyoneTyping(false),2000);
      setTypingUsersEditor(prev=>({...prev,[data.username]:true}));
      setTimeout(()=>setTypingUsersEditor(prev=>{const u={...prev};delete u[data.username];return u;}),1500);
    });
    socket.on("user_activity",   data=>{
      setActiveUsers(p=>({...p,[data.username]:data.activity}));
      // #7 update pulse based on most recent activity
      setRoomPulse(data.activity==="canvas"?"drawing":data.activity==="editor"?"coding":data.activity==="chat"?"chatting":"idle");
    });
    socket.on("voice_joined",   data=>setVoiceUsers(p=>({...p,[data.username]:{color:data.color,speaking:false,muted:false}})));
    socket.on("voice_left",     data=>setVoiceUsers(p=>{const u={...p};delete u[data.username];return u;}));
    socket.on("voice_mute",     data=>setVoiceUsers(p=>({...p,[data.username]:{...p[data.username],muted:data.muted}})));
    socket.on("voice_speaking", data=>setVoiceUsers(p=>({...p,[data.username]:{...p[data.username],speaking:data.speaking}})));
    // #10 Emoji reactions from others
    socket.on("emoji_reaction", data=>{
      const id=Date.now()+Math.random();
      setEmojiReactions(prev=>[...prev,{...data,id}]);
      setTimeout(()=>setEmojiReactions(prev=>prev.filter(r=>r.id!==id)),2500);
    });

    return ()=>{socket.disconnect();stopVoice();};
  }, [roomId]);

  useEffect(()=>{
    fetch(`http://localhost:5000/load-session/${roomId}`).then(r=>r.json()).then(data=>{
      if(data.code)setCode(data.code);
      if(data.whiteboard){const img=new Image();img.src=data.whiteboard;img.onload=()=>{if(!canvasRef.current)return;canvasRef.current.getContext("2d").drawImage(img,0,0);};}
    }).catch(()=>{});
  },[roomId]);

  useEffect(()=>{
    const iv=setInterval(()=>{
      if(!canvasRef.current)return;
      fetch("http://localhost:5000/save-session",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({roomId,code,whiteboard:canvasRef.current.toDataURL()})});
    },5000);
    return()=>clearInterval(iv);
  },[code,roomId]);

  useEffect(()=>{
    const h=e=>{
      if(e.ctrlKey&&e.key==="z"){e.preventDefault();undo();}
      if(e.ctrlKey&&e.key==="y"){e.preventDefault();redo();}
      if(e.ctrlKey&&e.key==="Enter"){e.preventDefault();runCode();}
      if(e.ctrlKey&&e.key==="s"){e.preventDefault();handleSave();}
    };
    window.addEventListener("keydown",h);
    return()=>window.removeEventListener("keydown",h);
  },[code,roomId]);

  useEffect(()=>{chatEndRef.current?.scrollIntoView({behavior:"smooth"});},[messages]);
  useEffect(()=>{aiEndRef.current?.scrollIntoView({behavior:"smooth"});},[aiMessages]);

  useEffect(()=>{
    const onMove=e=>{if(!draggingRef.current)return;setSplitPct(Math.max(35,Math.min(72,(e.clientX/window.innerWidth)*100)));};
    const onUp=()=>{draggingRef.current=false;document.body.style.cursor="";};
    window.addEventListener("mousemove",onMove);window.addEventListener("mouseup",onUp);
    return()=>{window.removeEventListener("mousemove",onMove);window.removeEventListener("mouseup",onUp);};
  },[]);

  const emitActivity  = a=>socketRef.current?.emit("user_activity",{roomId,username,activity:a});
  const isSocketReady = ()=>socketRef.current?.connected;

  const getScaled = e=>{
    const rect=canvasRef.current.getBoundingClientRect();
    return{x:(e.clientX-rect.left)*(canvasRef.current.width/rect.width),y:(e.clientY-rect.top)*(canvasRef.current.height/rect.height)};
  };

  const handleMouseDown=e=>{
    emitActivity("canvas");
    const{x,y}=getScaled(e);
    socketRef.current?.emit("draw",{roomId,snapshot:canvasRef.current.toDataURL()});
    if(tool==="text"){const text=prompt("Enter text:");if(!text)return;const ctx=canvasRef.current.getContext("2d");ctx.font=`${brushSize*5}px 'JetBrains Mono'`;ctx.fillStyle=color;ctx.fillText(text,x,y);socketRef.current?.emit("draw",{type:"text",text,x,y,color,size:brushSize,roomId});return;}
    setIsDrawing(true);setLastPos({x,y});
  };
  const handleMouseUp=e=>{
    if(!isDrawing||!lastPos)return;
    const{x,y}=getScaled(e);const endPos={x,y};
    const ctx=canvasRef.current.getContext("2d");
    ctx.lineWidth=brushSize;ctx.strokeStyle=color;ctx.globalCompositeOperation="source-over";
    if(tool==="line"){ctx.beginPath();ctx.moveTo(lastPos.x,lastPos.y);ctx.lineTo(endPos.x,endPos.y);ctx.stroke();}
    if(tool==="rect")ctx.strokeRect(lastPos.x,lastPos.y,endPos.x-lastPos.x,endPos.y-lastPos.y);
    if(tool==="circle"){const r=Math.sqrt((endPos.x-lastPos.x)**2+(endPos.y-lastPos.y)**2);ctx.beginPath();ctx.arc(lastPos.x,lastPos.y,r,0,2*Math.PI);ctx.stroke();}
    if(tool==="arrow"){const hl=10,dx=endPos.x-lastPos.x,dy=endPos.y-lastPos.y,angle=Math.atan2(dy,dx);ctx.beginPath();ctx.moveTo(lastPos.x,lastPos.y);ctx.lineTo(endPos.x,endPos.y);ctx.stroke();ctx.beginPath();ctx.moveTo(endPos.x,endPos.y);ctx.lineTo(endPos.x-hl*Math.cos(angle-Math.PI/6),endPos.y-hl*Math.sin(angle-Math.PI/6));ctx.lineTo(endPos.x-hl*Math.cos(angle+Math.PI/6),endPos.y-hl*Math.sin(angle+Math.PI/6));ctx.lineTo(endPos.x,endPos.y);ctx.fillStyle=color;ctx.fill();}
    if(isSocketReady()&&tool!=="pen"&&tool!=="eraser")socketRef.current.emit("draw",{x1:lastPos.x,y1:lastPos.y,x2:endPos.x,y2:endPos.y,roomId,color,brushSize,tool});
    historyRef.current.push(canvasRef.current.toDataURL());redoRef.current=[];
    setIsDrawing(false);setLastPos(null);
  };
  const handleMouseMove=e=>{
    if(!canvasRef.current)return;
    emitActivity("canvas");
    const{x,y}=getScaled(e);
    if(!window.lastEmit||Date.now()-window.lastEmit>50){socketRef.current?.emit("cursor_move",{roomId,x,y,username,color:userColor,activity:"canvas"});window.lastEmit=Date.now();}
    if(!isDrawing||!lastPos||(tool!=="pen"&&tool!=="eraser"))return;
    const newPos={x,y};
    const ctx=canvasRef.current.getContext("2d");
    ctx.lineWidth=brushSize;ctx.lineCap="round";
    if(tool==="eraser")ctx.globalCompositeOperation="destination-out";
    else{ctx.globalCompositeOperation="source-over";ctx.strokeStyle=color;}
    ctx.beginPath();ctx.moveTo(lastPos.x,lastPos.y);ctx.lineTo(newPos.x,newPos.y);ctx.stroke();
    socketRef.current?.emit("draw",{x1:lastPos.x,y1:lastPos.y,x2:newPos.x,y2:newPos.y,roomId,color,brushSize,tool});
    setLastPos(newPos);
  };

  // #10/#13 Emoji reaction on canvas click when emoji tool active
  const handleCanvasEmojiClick=e=>{
    if(!showEmojiPicker)return;
    setShowEmojiPicker(false);
  };

  const placeEmoji=(emoji,canvasX,canvasY)=>{
    const id=Date.now()+Math.random();
    const reaction={id,emoji,x:canvasX,y:canvasY,username};
    setEmojiReactions(prev=>[...prev,reaction]);
    setTimeout(()=>setEmojiReactions(prev=>prev.filter(r=>r.id!==id)),2500);
    socketRef.current?.emit("emoji_reaction",{roomId,emoji,x:canvasX,y:canvasY,username});
  };

  let _tt;
  const handleCodeChange=newCode=>{
    setCode(newCode);emitActivity("editor");
    clearTimeout(_tt);socketRef.current?.emit("typingEditor",{roomId,username});
    _tt=setTimeout(()=>{},1000);
    socketRef.current?.emit("code_update",{code:newCode,roomId});
  };

  const runCode=()=>{if(!isSocketReady())return;setOutput("Running…");setIsRunning(true);socketRef.current.emit("run_code",{code,language,input:stdin,roomId});};
  const sendMessage=()=>{if(!inputMessage.trim()||!isSocketReady())return;socketRef.current.emit("send_message",{roomId,message:inputMessage,username,time:new Date().toISOString()});setInputMessage("");};

  const undo=(isRemote=false)=>{
    if(!historyRef.current.length)return;
    const canvas=canvasRef.current;const ctx=canvas.getContext("2d");
    const last=historyRef.current.pop();redoRef.current.push(last);
    ctx.clearRect(0,0,canvas.width,canvas.height);
    const prev=historyRef.current[historyRef.current.length-1];if(!prev)return;
    const img=new Image();img.src=prev;img.onload=()=>ctx.drawImage(img,0,0);
    if(!isRemote&&isSocketReady())socketRef.current.emit("undo",{roomId});
  };
  const redo=(isRemote=false)=>{
    if(!redoRef.current.length)return;
    const canvas=canvasRef.current;const ctx=canvas.getContext("2d");
    const state=redoRef.current.pop();historyRef.current.push(state);
    const img=new Image();img.src=state;img.onload=()=>{ctx.clearRect(0,0,canvas.width,canvas.height);ctx.drawImage(img,0,0);};
    if(!isRemote&&isSocketReady())socketRef.current.emit("redo",{roomId});
  };
  const clearBoard=()=>canvasRef.current?.getContext("2d").clearRect(0,0,5000,5000);
  const downloadBoard=()=>{const a=document.createElement("a");a.download="whiteboard.png";a.href=canvasRef.current.toDataURL();a.click();};
  const handleSave=()=>{if(!canvasRef.current)return;fetch("http://localhost:5000/save-session",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({roomId,code,whiteboard:canvasRef.current.toDataURL()})});};
  const exitRoom=()=>{socketRef.current?.emit("leave_room",{roomId,username});navigate("/dashboard");};
  const copyRoomId=()=>{navigator.clipboard.writeText(roomId);setCopied(true);setTimeout(()=>setCopied(false),1500);};

  const startReplay=async()=>{const res=await fetch(`http://localhost:5000/replay/${roomId}`);const data=await res.json();replayEventsRef.current=data.events.filter(e=>e.type==="code");replayIndexRef.current=0;setCode("");playReplay();};
  const playReplay=()=>{if(isPaused)return;const events=replayEventsRef.current;const i=replayIndexRef.current;if(i>=events.length)return;if(events[i].type==="code")setCode(events[i].data);replayIndexRef.current++;replayTimeoutRef.current=setTimeout(playReplay,300/replaySpeed);};
  const pauseReplay=()=>{setIsPaused(true);clearTimeout(replayTimeoutRef.current);};
  const resumeReplay=()=>{setIsPaused(false);playReplay();};

  // AI
  const sendAiMessage=async(overridePrompt)=>{
    const userMsg=overridePrompt||aiInput.trim();if(!userMsg)return;
    const newMsg={role:"user",content:userMsg};const history=[...aiMessages,newMsg];
    setAiMessages(history);setAiInput("");setAiLoading(true);
    try{
      const res=await fetch("http://localhost:5000/ai",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages:history,language})});
      const data=await res.json();
      if(data.success){const reply=data.content?.[0]?.text||"No response.";setAiMessages(prev=>[...prev,{role:"assistant",content:reply}]);}
      else{setAiMessages(prev=>[...prev,{role:"assistant",content:`⚠️ ${data.error||"AI service unavailable."}`}]);}
    }catch(err){setAiMessages(prev=>[...prev,{role:"assistant",content:`⚠️ ${err.message}`}]);}
    finally{setAiLoading(false);}
  };
  const triggerAction=action=>{const prompt=action.prompt(code,output,language);if(rightPanel!=="ai")setRightPanel("ai");sendAiMessage(prompt);};
  const renderAiContent=content=>{
    const parts=content.split(/(```[\s\S]*?```)/g);
    return parts.map((part,i)=>{
      if(part.startsWith("```")){
        const lines=part.split("\n");const lang=lines[0].replace("```","").trim();const codeStr=lines.slice(1,-1).join("\n");
        return(<div key={i} className={`rounded-lg mt-2 mb-2 overflow-hidden border ${colors.border}`}>
          {lang&&<div className="text-[9px] text-[#028391] px-3 py-1 border-b border-[#028391]/20 font-mono uppercase tracking-widest">{lang}</div>}
          <pre className={`text-[11px] p-3 overflow-x-auto ${colors.bgMain} ${colors.text}`}>{codeStr}</pre>
        </div>);
      }
      return<span key={i} className="whitespace-pre-wrap">{part}</span>;
    });
  };

  // Voice
  const toggleVoice=async()=>{
    if(voiceActive){stopVoice();return;}
    try{
      const stream=await navigator.mediaDevices.getUserMedia({audio:true,video:false});
      localStreamRef.current=stream;setVoiceActive(true);
      socketRef.current?.emit("voice_join",{roomId,username,color:userColor});
      const audioCtx=new AudioContext();const analyser=audioCtx.createAnalyser();
      audioCtx.createMediaStreamSource(stream).connect(analyser);analyser.fftSize=512;
      audioCtxRef.current=audioCtx;analyserRef.current=analyser;
      const data=new Uint8Array(analyser.frequencyBinCount);
      const detect=()=>{analyser.getByteFrequencyData(data);const avg=data.reduce((a,b)=>a+b,0)/data.length;const isSpeaking=avg>18;setSpeaking(isSpeaking);if(isSpeaking)socketRef.current?.emit("voice_speaking",{roomId,username,speaking:true});voiceRafRef.current=requestAnimationFrame(detect);};
      detect();
    }catch(err){console.error("Mic error:",err);}
  };
  const stopVoice=()=>{
    localStreamRef.current?.getTracks().forEach(t=>t.stop());localStreamRef.current=null;
    cancelAnimationFrame(voiceRafRef.current);audioCtxRef.current?.close();
    audioCtxRef.current=null;analyserRef.current=null;setVoiceActive(false);setSpeaking(false);
    socketRef.current?.emit("voice_leave",{roomId,username});
  };
  const toggleMute=()=>{
    if(!localStreamRef.current)return;
    const track=localStreamRef.current.getAudioTracks()[0];const newMute=track.enabled;
    track.enabled=!newMute;setIsMuted(newMute);socketRef.current?.emit("voice_mute",{roomId,username,muted:newMute});
  };

  const whiteboardTools=[
    {id:"pen",label:"Pen"},{id:"eraser",label:"Eraser"},{id:"line",label:"Line"},
    {id:"rect",label:"Rect"},{id:"circle",label:"Circle"},{id:"text",label:"Text"},{id:"arrow",label:"Arrow"},
  ];
  const activityColors={editor:"#028391",chat:"#3357FF",canvas:"#FF5733"};
  const activityLabel={editor:"in editor",chat:"in chat",canvas:"on canvas"};
  const chatPanelWidth=rightPanel?300:0;

  // Language badge config (#9 bonus)
  const langBadge={ python:{emoji:"🐍",color:"#3572A5"}, javascript:{emoji:"🟨",color:"#F7DF1E"}, cpp:{emoji:"⚙️",color:"#00599C"}, java:{emoji:"☕",color:"#ED8B00"}, go:{emoji:"🐹",color:"#00ADD8"}, rust:{emoji:"🦀",color:"#CE422B"} };
  const badge=langBadge[language]||{emoji:"📄",color:"#028391"};

  return(
    <div style={{fontFamily:"'JetBrains Mono','Fira Code',monospace"}}
      className={`flex flex-col h-screen overflow-hidden select-none ${colors.bgMain} ${colors.text}`}>

      {/* ── #8 Typing awareness bar ─────────────────────────────────────────── */}
      <div className="fixed top-0 left-0 right-0 z-[100] h-0.5 overflow-hidden">
        <div className={`h-full transition-all duration-500 ${anyoneTyping?"opacity-100":"opacity-0"}`}
          style={{
            width: anyoneTyping?"100%":"0%",
            background:"linear-gradient(90deg,#028391,#FAA968,#F85525,#028391)",
            backgroundSize:"200% 100%",
            animation: anyoneTyping?"gradientShift 1.5s linear infinite":"none",
            transition:"width 0.3s ease, opacity 0.3s ease",
          }}/>
      </div>

      {/* ── #6 Glassmorphism Navbar ──────────────────────────────────────────── */}
      <nav className="h-12 flex items-center justify-between px-4 shrink-0 relative z-20"
        style={{
          background: isDark
            ? "linear-gradient(135deg,rgba(1,26,58,0.92) 0%,rgba(1,32,78,0.82) 100%)"
            : "linear-gradient(135deg,rgba(246,220,172,0.92) 0%,rgba(250,169,104,0.5) 100%)",
          backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",
          borderBottom: isDark?"1px solid rgba(2,131,145,0.25)":"1px solid rgba(250,169,104,0.5)",
          boxShadow: isDark?"0 1px 0 rgba(2,131,145,0.15),0 4px 24px rgba(1,20,46,0.5)":"0 1px 0 rgba(250,169,104,0.3),0 4px 24px rgba(1,32,78,0.1)",
        }}>

        {/* Logo */}
        <div className={`flex items-center gap-2 ${colors.bgPanel} border ${colors.border} rounded-lg px-3 py-1.5`}
          style={{backdropFilter:"blur(8px)"}}>
          <div className="w-7 h-7 rounded-lg bg-[#028391] flex items-center justify-center shadow-lg shadow-[#028391]/30">
            <span className="text-white text-xs font-black">CB</span>
          </div>
          <span className={`font-bold ${colors.text} text-sm hidden sm:block`}>CodeBoard</span>
        </div>

        {/* ── #7 Room pulse pill ─────────────────────────────────────────────── */}
        <div className={`flex items-center gap-2 ${colors.bgPanel} border ${colors.border} rounded-lg px-3 py-1.5`}
          style={{backdropFilter:"blur(8px)"}}>
          {/* Animated pulse dot */}
          <div className="relative flex items-center justify-center w-3 h-3">
            <span className="absolute w-3 h-3 rounded-full animate-ping opacity-60"
              style={{background:pulseColors[roomPulse]}}/>
            <span className="w-2 h-2 rounded-full" style={{background:pulseColors[roomPulse]}}/>
          </div>
          <span className={`${colors.text} text-xs`}>Room</span>
          <code className="text-[#028391] text-xs font-bold tracking-widest">{roomId}</code>
          <button onClick={copyRoomId} className={`ml-1 ${colors.text} hover:text-[#028391] transition-colors`} title="Copy">
            {copied
              ?<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#028391" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
              :<Icon d={Icons.copy} size={14}/>}
          </button>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-2">
          {/* Activity chips */}
          <div className="hidden md:flex items-center gap-1.5">
            {Object.entries(activeUsers).filter(([u])=>u!==username).map(([u,act])=>(
              <div key={u} title={`${u} is ${activityLabel[act]}`}
                className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border"
                style={{borderColor:activityColors[act]+"60",background:activityColors[act]+"18",color:activityColors[act]}}>
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{background:activityColors[act]}}/>
                <span>{u}</span>
              </div>
            ))}
          </div>

          {/* ── #4 Session timer ──────────────────────────────────────────────── */}
          <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${colors.border} text-[11px] ${colors.text}`}
            style={{backdropFilter:"blur(8px)",background:isDark?"rgba(1,21,47,0.6)":"rgba(246,220,172,0.6)"}}>
            <Icon d={Icons.clock} size={12} className="text-[#028391]"/>
            <span className="font-mono text-[#028391]">{sessionTime}</span>
          </div>

          {/* Theme toggle */}
          <button onClick={()=>setTheme(prev=>prev==="dark"?"light":"dark")} title="Toggle theme"
            className={`w-9 h-9 flex items-center justify-center rounded-xl border transition
              ${isDark?"border-[#028391]/40 hover:bg-[#028391]/20 text-[#F6DCAC]":"border-[#FAA968]/60 hover:bg-[#FAA968]/30 text-[#01204E]"}`}>
            <Icon d={isDark?Icons.sun:Icons.moon} size={15}/>
          </button>

          {/* Profile */}
          <div className="relative">
            <button onClick={()=>setShowProfileMenu(p=>!p)} className="rounded-full ring-2 ring-[#028391] transition-all">
              <Avatar name={username} color={userColor} size={30}/>
            </button>
            {showProfileMenu&&(
              <div className={`absolute right-0 top-10 ${colors.bgPanel} border ${colors.border} rounded-xl p-3 w-48 shadow-2xl z-50`}>
                <div className={`flex items-center gap-2 pb-3 border-b ${colors.border} mb-2`}>
                  <Avatar name={username} color={userColor} size={36}/>
                  <div>
                    <div className={`font-bold text-sm ${colors.text}`}>{username}</div>
                    <div className="text-[10px] text-[#028391]">● Online</div>
                  </div>
                </div>
                <button onClick={exitRoom} className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-red-400 hover:bg-red-500/10 text-xs transition-colors">
                  <Icon d={Icons.exit} size={14}/> Exit Room
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* ══ MAIN ════════════════════════════════════════════════════════════════ */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── WHITEBOARD ──────────────────────────────────────────────────────── */}
        <div style={{width:`${splitPct}%`}} className={`relative flex flex-col ${colors.bgPanel} border-r ${colors.border}`}>
          <div className="flex-1 relative overflow-hidden">
            <canvas ref={canvasRef} width={3000} height={3000}
              style={{width:"100%",height:"100%",display:"block",cursor:tool==="eraser"?"cell":"crosshair"}}
              onMouseDown={handleMouseDown} onMouseUp={handleMouseUp} onMouseMove={handleMouseMove}/>

            {/* ── #2 Remote cursors with activity glow ────────────────────────── */}
            {Object.entries(cursors).filter(([u])=>u!==username).map(([user,pos])=>{
              const rect=canvasRef.current?.getBoundingClientRect();
              const dx=rect?(pos.x/canvasRef.current.width)*rect.width:pos.x;
              const dy=rect?(pos.y/canvasRef.current.height)*rect.height:pos.y;
              const glowColor=pos.activity==="canvas"?"#FF5733":pos.activity==="editor"?"#028391":"#3357FF";
              return(
                <div key={user} style={{position:"absolute",left:dx,top:dy,pointerEvents:"none",transition:"left .05s,top .05s"}}>
                  {/* Glow ring */}
                  <div style={{
                    position:"absolute",left:-6,top:-6,width:20,height:20,borderRadius:"50%",
                    background:`radial-gradient(circle,${glowColor}55 0%,transparent 70%)`,
                    animation:"cursorGlow 1.5s ease-in-out infinite",
                    filter:`blur(2px)`,
                  }}/>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill={pos.color} style={{filter:`drop-shadow(0 0 4px ${pos.color}88)`}}>
                    <path d="M0 0l6 16 3-5 5-3z"/>
                  </svg>
                  <span style={{background:pos.color,boxShadow:`0 0 8px ${pos.color}66`}}
                    className="ml-2 text-[10px] px-1.5 py-0.5 rounded text-white font-bold absolute left-3 top-0 whitespace-nowrap">
                    {user}
                  </span>
                </div>
              );
            })}

            {/* ── #1 Output sticky notes on canvas ────────────────────────────── */}
            {canvasStickyNotes.map(note=>(
              <div key={note.id}
                style={{position:"absolute",left:note.x,top:note.y,pointerEvents:"none",animation:"stickyIn 0.3s ease, stickyOut 0.4s ease 7.6s forwards",maxWidth:240,zIndex:15}}
                className={`${isDark?"bg-[#F3FF33] text-[#01204E]":"bg-[#F3FF33] text-[#01204E]"} rounded-xl px-3 py-2 shadow-2xl text-[11px] font-mono`}>
                <div className="flex items-center gap-1.5 mb-1 font-bold text-[10px] opacity-60">
                  <Icon d={Icons.stickyNote} size={10} stroke="#01204E" fill="none"/>OUTPUT
                </div>
                {note.text}
              </div>
            ))}

            {/* ── #10/#13 Floating emoji reactions ────────────────────────────── */}
            {emojiReactions.map(r=>{
              const rect=canvasRef.current?.getBoundingClientRect();
              const dx=rect?(r.x/canvasRef.current.width)*rect.width:r.x;
              const dy=rect?(r.y/canvasRef.current.height)*rect.height:r.y;
              return(
                <div key={r.id} style={{position:"absolute",left:dx,top:dy,pointerEvents:"none",zIndex:20,animation:"emojiFloat 2.5s ease-out forwards"}}>
                  <span style={{fontSize:28,filter:"drop-shadow(0 2px 8px rgba(0,0,0,0.3))"}}>{r.emoji}</span>
                  <div className="text-[9px] text-white font-bold text-center mt-0.5" style={{textShadow:"0 1px 4px rgba(0,0,0,0.8)"}}>{r.username}</div>
                </div>
              );
            })}

            {/* Hamburger */}
            <div className="absolute top-3 left-3 z-20">
              <button onClick={()=>setShowWbMenu(p=>!p)}
                className={`w-8 h-8 flex items-center justify-center rounded-lg ${colors.bgPanel} backdrop-blur border ${colors.border} hover:bg-[#028391]/20 transition-all`}>
                <Icon d={Icons.menu} size={16}/>
              </button>
              {showWbMenu&&(
                <div className={`absolute top-10 left-0 ${colors.bgSub} backdrop-blur-xl border ${colors.border} rounded-2xl p-3 shadow-2xl w-52 z-30`}>
                  <div className="mb-3">
                    <div className="text-[10px] text-[#028391] font-bold uppercase tracking-widest mb-1.5 px-1">Tools</div>
                    <div className="grid grid-cols-4 gap-1">
                      {whiteboardTools.map(t=>(
                        <button key={t.id} onClick={()=>setTool(t.id)} title={t.label}
                          className={`flex flex-col items-center justify-center p-1.5 rounded-lg text-[10px] gap-0.5 transition-all
                            ${tool===t.id?"bg-[#028391] text-white shadow-lg":`hover:bg-white/10 ${colors.text}`}`}>
                          <Icon d={Icons[t.id]} size={15}/><span className="truncate w-full text-center">{t.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-1 mb-3">
                    <button onClick={undo} className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg hover:bg-white/10 ${colors.text} text-xs`}><Icon d={Icons.undo} size={14}/>Undo</button>
                    <button onClick={redo} className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg hover:bg-white/10 ${colors.text} text-xs`}><Icon d={Icons.redo} size={14}/>Redo</button>
                  </div>
                  <div className="mb-3">
                    <div className="text-[10px] text-[#028391] font-bold uppercase tracking-widest mb-1.5 px-1">Color</div>
                    <div className="flex items-center gap-2 px-1">
                      <input type="color" value={color} onChange={e=>setColor(e.target.value)} className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent"/>
                      <div className="flex gap-1 flex-wrap">
                        {["#ffffff","#FF5733","#33FF57","#3357FF","#FF33A8","#F3FF33"].map(c=>(
                          <button key={c} onClick={()=>setColor(c)} style={{background:c,width:16,height:16,borderRadius:4,border:color===c?"2px solid #028391":"2px solid transparent"}}/>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="mb-3 px-1">
                    <div className="text-[10px] text-[#028391] font-bold uppercase tracking-widest mb-1.5">Size: {brushSize}</div>
                    <input type="range" min="1" max="10" value={brushSize} onChange={e=>setBrushSize(Number(e.target.value))} className="w-full accent-[#028391]"/>
                  </div>
                  <div className={`border-t ${colors.border} pt-2 flex gap-1`}>
                    <button onClick={clearBoard} className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg hover:bg-red-500/10 text-red-400 text-xs"><Icon d={Icons.clear} size={13}/>Clear</button>
                    <button onClick={downloadBoard} className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg hover:bg-white/10 ${colors.text} text-xs`}><Icon d={Icons.download} size={13}/>Save</button>
                  </div>
                </div>
              )}
            </div>

            {/* Tool badge */}
            <div className={`absolute bottom-3 left-3 flex items-center gap-1.5 ${colors.bgPanel} backdrop-blur px-2.5 py-1 rounded-full border ${colors.border} text-[11px]`}>
              <Icon d={Icons[tool]} size={12} className="text-[#028391]"/>
              <span className={`${colors.text} capitalize`}>{tool}</span>
              <span className={`w-3 h-3 rounded-sm border ${colors.border}`} style={{background:color}}/>
            </div>

            {/* ── #10/#13 Emoji picker button ──────────────────────────────────── */}
            <div className="absolute bottom-3 right-3 z-20">
              <div className="relative">
                <button
                  onClick={()=>setShowEmojiPicker(p=>!p)}
                  title="React with emoji"
                  className={`w-9 h-9 flex items-center justify-center rounded-full border shadow-lg text-lg transition-all
                    ${showEmojiPicker?"bg-[#028391] border-[#028391] scale-110":`${colors.bgPanel} border ${colors.border} hover:scale-110`}`}>
                  😊
                </button>
                {showEmojiPicker&&(
                  <div className={`absolute bottom-11 right-0 ${colors.bgSub} border ${colors.border} rounded-2xl p-2 shadow-2xl flex gap-1.5 flex-wrap w-44`}>
                    <div className={`w-full text-[9px] text-[#028391] font-bold uppercase tracking-widest mb-1 px-1`}>Click canvas to place</div>
                    {EMOJI_LIST.map(emoji=>(
                      <button key={emoji} onClick={()=>{
                        // place at center of canvas
                        const rect=canvasRef.current?.getBoundingClientRect();
                        const cx=canvasRef.current.width/2+Math.random()*200-100;
                        const cy=canvasRef.current.height/2+Math.random()*200-100;
                        placeEmoji(emoji,cx,cy);
                        setShowEmojiPicker(false);
                      }}
                      className="text-2xl hover:scale-125 transition-transform w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10">
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Drawing indicators */}
            {Object.entries(activeUsers).filter(([u,act])=>u!==username&&act==="canvas").map(([u])=>(
              <div key={u} className="absolute top-3 right-14 flex items-center gap-1 bg-[#FF5733]/20 border border-[#FF5733]/40 px-2 py-1 rounded-full text-[10px] text-[#FF5733]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF5733] animate-ping"/>{u} is drawing
              </div>
            ))}
          </div>
        </div>

        {/* ── DIVIDER ─────────────────────────────────────────────────────────── */}
        <div ref={dividerRef} onMouseDown={()=>{draggingRef.current=true;document.body.style.cursor="col-resize";}}
          className="w-1.5 bg-[#028391] cursor-col-resize shrink-0 relative z-10">
          <div className="absolute inset-y-0 -left-1 -right-1"/>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-8 rounded-full bg-[#028391] flex flex-col items-center justify-center gap-0.5">
            {[0,1,2].map(i=><div key={i} className="w-0.5 h-0.5 rounded-full bg-[#F6DCAC]"/>)}
          </div>
        </div>

        {/* ── CODE EDITOR ─────────────────────────────────────────────────────── */}
        <div style={{width:`${100-splitPct-(rightPanel?(chatPanelWidth/window.innerWidth*100):0)}%`}}
          className={`flex flex-col ${colors.bgPanel}`}>

          {/* Toolbar */}
          <div className={`h-10 ${colors.bgSub} border-b ${colors.border} flex items-center gap-1 px-2 shrink-0`}>
            {/* Language badge #9 */}
            <div className="flex items-center gap-1.5 mr-1">
              <span className="text-sm">{badge.emoji}</span>
              <select value={language} onChange={e=>setLanguage(e.target.value)}
                className={`${colors.bgPanel} border ${colors.border} ${colors.text} text-xs rounded-md px-2 py-1 cursor-pointer focus:outline-none`}>
                {["python","javascript","cpp","java","go","rust"].map(l=><option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div className="h-4 w-px bg-[#028391] mx-1"/>
            <button onClick={runCode} disabled={isRunning}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold transition-all
                ${isRunning?`${colors.text} cursor-not-allowed bg-[#028391]/40`:"bg-[#028391] text-white hover:bg-[#028391]/80 shadow-md shadow-[#028391]/30"}`}>
              <Icon d={Icons.run} size={12} fill={isRunning?"none":"white"}/>{isRunning?"Running…":"Run"}
            </button>
            <div className="h-4 w-px bg-[#028391] mx-1"/>
            <Btn icon="play"   title="Start Replay" onClick={startReplay}/>
            <Btn icon="pause"  title="Pause"        onClick={pauseReplay}/>
            <Btn icon="resume" title="Resume"       onClick={resumeReplay}/>
            <div className="h-4 w-px bg-[#028391] mx-1"/>
            <div className={`flex items-center gap-1 text-[10px] ${colors.text}`}>
              <Icon d={Icons.speed} size={13}/>
              <select value={replaySpeed} onChange={e=>setReplaySpeed(Number(e.target.value))}
                className={`${colors.bgPanel} border ${colors.border} ${colors.text} text-xs rounded-md px-1 cursor-pointer focus:outline-none`}>
                <option value={1}>1x</option><option value={2}>2x</option><option value={5}>5x</option>
              </select>
            </div>
            <div className="h-4 w-px bg-[#028391] mx-1"/>
            <Btn icon="clear"    title="Clear Output"    onClick={()=>setOutput("")}/>
            <Btn icon="download" title="Download Canvas" onClick={downloadBoard}/>

            {Object.keys(typingUsersEditor).filter(u=>u!==username).length>0&&(
              <div className={`ml-auto flex items-center gap-1.5 bg-[#028391]/10 border ${colors.border} px-2 py-0.5 rounded-full text-[10px] text-[#028391]`}>
                <TypingDots/><span>{Object.keys(typingUsersEditor).filter(u=>u!==username).join(", ")} typing…</span>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-hidden">
            <Editor height="100%" language={language} theme={isDark?"vs-dark":"hc-black"}
              value={code} onChange={handleCodeChange} onMount={e=>(editorRef.current=e)}
              options={{fontSize:13,fontFamily:"JetBrains Mono,Fira Code,monospace",minimap:{enabled:false},scrollBeyondLastLine:false,padding:{top:8}}}/>
          </div>

          <div className={`border-t ${colors.border} ${colors.bgSub} px-2 py-1 shrink-0`}>
            <textarea placeholder="stdin (program input)…" value={stdin} onChange={e=>setStdin(e.target.value)} rows={2}
              className={`w-full bg-transparent ${colors.text} text-xs resize-none focus:outline-none placeholder-[#FAA968]`}/>
          </div>

          {output&&(
            <div className={`border-t ${colors.border} ${colors.bgSub} px-3 py-2 shrink-0 max-h-32 overflow-y-auto`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-[#028391] font-bold uppercase tracking-widest">Output</span>
                <button onClick={()=>setOutput("")} className={colors.textMuted}><Icon d={Icons.close} size={12}/></button>
              </div>
              <pre className={`text-[11px] ${colors.text} whitespace-pre-wrap`}>{output}</pre>
            </div>
          )}

          {/* Bottom taskbar */}
          <div className={`h-10 ${colors.bgSub} border-t ${colors.border} flex items-center gap-1 px-3 shrink-0`}>
            {Object.entries(activeUsers).filter(([u,act])=>u!==username&&act==="editor").map(([u])=>(
              <div key={u} className="flex items-center gap-1 text-[10px] text-[#028391]">
                <TypingDots/><span>{u} editing</span>
              </div>
            ))}
            <div className="flex-1"/>

            {/* Users */}
            <button onClick={()=>setRightPanel(p=>p==="users"?null:"users")} title="Members"
              className={`relative flex items-center justify-center w-8 h-8 rounded-lg transition-all
                ${rightPanel==="users"?"bg-[#028391] text-white":`hover:bg-white/10 ${colors.text}`}`}>
              <Icon d={Icons.users} size={16}/>
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#028391] text-white text-[9px] flex items-center justify-center font-bold">{users.length}</span>
            </button>

            {/* Chat */}
            <button onClick={()=>{setRightPanel(p=>p==="chat"?null:"chat");emitActivity("chat");}} title="Chat"
              className={`relative flex items-center justify-center w-8 h-8 rounded-lg transition-all
                ${rightPanel==="chat"?"bg-[#028391] text-white":`hover:bg-white/10 ${colors.text}`}`}>
              <Icon d={Icons.chat} size={16}/>
              {rightPanel!=="chat"&&messages.length>0&&<span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#FF5733] animate-pulse"/>}
            </button>

            {/* AI Copilot */}
            {/* <button onClick={()=>setRightPanel(p=>p==="ai"?null:"ai")} title="AI Copilot"
              className={`relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all
                ${rightPanel==="ai"?"bg-[#028391] text-white shadow-md":"text-[#028391] hover:bg-[#028391]/15"}`}>
              <Icon d={Icons.sparkle} size={14} fill={rightPanel==="ai"?"white":"none"} stroke={rightPanel==="ai"?"white":"#028391"}/>
              <span className="hidden sm:inline">Copilot</span>
            </button> */}

            {/* Voice */}
            {/* <button onClick={()=>{setRightPanel(p=>p==="voice"?null:"voice");if(!voiceActive)toggleVoice();}} title="Voice"
              className={`relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all
                ${voiceActive?"bg-green-500/20 text-green-400 border border-green-400/30":`hover:bg-white/10 ${colors.text}`}`}>
              <Icon d={voiceActive?Icons.volume:Icons.headphone} size={14}/>
              {voiceActive&&<span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"/>}
              <span className="hidden sm:inline">Voice</span>
            </button> */}
          </div>
        </div>

        {/* ══ RIGHT PANEL ════════════════════════════════════════════════════════ */}
        {rightPanel&&(
          <div style={{width:chatPanelWidth}} className={`flex flex-col ${colors.bgPanel} border-l ${colors.border} shrink-0 overflow-hidden`}>
            <div className={`h-10 ${colors.bgSub} border-b ${colors.border} flex items-center justify-between px-3 shrink-0`}>
              <div className={`flex items-center gap-2 text-xs font-bold ${colors.text}`}>
                <Icon d={Icons[rightPanel==="chat"?"chat":rightPanel==="users"?"users":rightPanel==="ai"?"sparkle":"headphone"]}
                  size={14} stroke={rightPanel==="ai"?"#028391":undefined} fill={rightPanel==="ai"?"none":undefined}/>
                {rightPanel==="chat"?"Chat":rightPanel==="users"?"Members":rightPanel==="ai"?"AI Copilot":"Voice Chat"}
              </div>
              <button onClick={()=>setRightPanel(null)} className={colors.textMuted}><Icon d={Icons.close} size={14}/></button>
            </div>

            {/* USERS */}
            {rightPanel==="users"&&(
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {users.length===0&&<p className={`text-xs text-center mt-8 ${colors.textMuted}`}>No members listed yet.</p>}
                {users.map((u,i)=>(
                  <div key={i} className={`flex items-center gap-2.5 p-2 rounded-xl ${colors.bgPanel} border ${colors.border}`}>
                    <Avatar name={u} color={cursors[u]?.color||COLORS[i%COLORS.length]} size={30}/>
                    <div className="flex-1 min-w-0">
                      <div className={`text-xs font-bold ${colors.text} truncate`}>{u}</div>
                      {activeUsers[u]
                        ?<div className="flex items-center gap-1 text-[10px]" style={{color:activityColors[activeUsers[u]]}}><span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{background:activityColors[activeUsers[u]]}}/>{activityLabel[activeUsers[u]]}</div>
                        :<div className="text-[10px] text-[#028391]">● Online</div>}
                    </div>
                    {u===username&&<span className={`text-[9px] text-[#028391] font-bold px-1.5 py-0.5 rounded-full border ${colors.border}`}>You</span>}
                  </div>
                ))}
              </div>
            )}

            {/* CHAT */}
            {rightPanel==="chat"&&(<>
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {messages.map((msg,i)=>{
                  const isMe=msg.username===username;const time=new Date(msg.time);
                  return(
                    <div key={i} className={`flex flex-col ${isMe?"items-end":"items-start"}`}>
                      {!isMe&&<span className={`text-[9px] ${colors.textMuted} mb-0.5 ml-1`}>{msg.username}</span>}
                      <div className={`max-w-[85%] px-2.5 py-1.5 rounded-2xl text-xs
                        ${isMe?"bg-[#028391] text-white rounded-tr-sm":`${colors.bgPanel} ${colors.text} border ${colors.border} rounded-tl-sm`}`}>
                        {msg.message}
                      </div>
                      <span className={`text-[9px] ${colors.textMuted} mt-0.5 mx-1`}>
                        {!isNaN(time)?time.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}):""}
                      </span>
                    </div>
                  );
                })}
                {typingUserChat&&<div className={`flex items-center gap-1.5 text-[10px] ${colors.text}`}><TypingDots/><span>{typingUserChat} typing</span></div>}
                <div ref={chatEndRef}/>
              </div>
              <div className={`border-t ${colors.border} ${colors.bgSub} p-2 flex items-center gap-2 shrink-0`}>
                <input value={inputMessage}
                  onChange={e=>{setInputMessage(e.target.value);emitActivity("chat");socketRef.current?.emit("typing",{roomId,username});}}
                  onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&sendMessage()}
                  placeholder="Message…"
                  className={`flex-1 ${colors.bgPanel} border ${colors.border} rounded-xl px-3 py-1.5 text-xs ${colors.text} placeholder-[#FAA968] focus:outline-none transition-colors`}/>
                <button onClick={sendMessage} className="w-7 h-7 flex items-center justify-center bg-[#028391] rounded-xl hover:bg-[#028391]/80 transition-colors shadow-md">
                  <Icon d={Icons.send} size={12} stroke="white"/>
                </button>
              </div>
            </>)}

            {/* AI COPILOT */}
            {/* {rightPanel==="ai"&&(<>
              <div className={`border-b ${colors.border} px-3 py-2 shrink-0`}>
                <div className="text-[10px] text-[#028391] font-bold uppercase tracking-widest mb-2">Quick Actions</div>
                <div className="flex flex-wrap gap-1.5">
                  {AI_ACTIONS.map(action=>(
                    <button key={action.id} onClick={()=>triggerAction(action)} disabled={aiLoading}
                      className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium border transition-all
                        ${isDark?"border-[#028391]/30 bg-[#028391]/10 text-[#F6DCAC] hover:bg-[#028391]/25":"border-[#FAA968]/50 bg-[#028391]/5 text-[#01204E] hover:bg-[#028391]/10"}
                        disabled:opacity-40 disabled:cursor-not-allowed`}>
                      <Icon d={Icons[action.icon]} size={11}/>{action.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {aiMessages.length===0&&(
                  <div className="flex flex-col items-center justify-center h-full gap-3 opacity-40 pointer-events-none">
                    <Icon d={Icons.sparkle} size={28} stroke="#028391" fill="none"/>
                    <p className={`text-xs text-center ${colors.text}`}>Ask me anything about your code,<br/>or use a quick action above.</p>
                  </div>
                )}
                {aiMessages.map((msg,i)=>(
                  <div key={i} className={`flex flex-col ${msg.role==="user"?"items-end":"items-start"}`}>
                    {msg.role==="assistant"&&(
                      <div className="flex items-center gap-1.5 mb-1">
                        <div className="w-4 h-4 rounded bg-[#028391] flex items-center justify-center"><Icon d={Icons.sparkle} size={9} stroke="white" fill="none"/></div>
                        <span className="text-[9px] text-[#028391] font-bold">Copilot</span>
                      </div>
                    )}
                    <div className={`max-w-[92%] text-xs rounded-2xl px-3 py-2
                      ${msg.role==="user"?"bg-[#028391] text-white rounded-tr-sm":`${isDark?"bg-[#011a3a]":"bg-[#F6DCAC]/60"} ${colors.text} border ${colors.border} rounded-tl-sm`}`}>
                      {msg.role==="assistant"?renderAiContent(msg.content):msg.content}
                    </div>
                  </div>
                ))}
                {aiLoading&&(
                  <div className="flex items-start gap-2">
                    <div className="w-4 h-4 rounded bg-[#028391] flex items-center justify-center mt-0.5"><Icon d={Icons.sparkle} size={9} stroke="white" fill="none"/></div>
                    <div className={`px-3 py-2 rounded-2xl rounded-tl-sm border ${colors.border} ${isDark?"bg-[#011a3a]":"bg-[#F6DCAC]/60"}`}><TypingDots/></div>
                  </div>
                )}
                <div ref={aiEndRef}/>
              </div>
              <div className={`border-t ${colors.border} ${colors.bgSub} p-2 flex items-end gap-2 shrink-0`}>
                <textarea value={aiInput} onChange={e=>setAiInput(e.target.value)}
                  onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendAiMessage();}}}
                  placeholder="Ask Copilot… (Enter to send)" rows={2}
                  className={`flex-1 ${colors.bgPanel} border ${colors.border} rounded-xl px-3 py-1.5 text-xs ${colors.text} placeholder-[#FAA968] focus:outline-none resize-none transition-colors`}/>
                <button onClick={()=>sendAiMessage()} disabled={aiLoading||!aiInput.trim()}
                  className="w-7 h-7 flex items-center justify-center bg-[#028391] rounded-xl hover:bg-[#028391]/80 transition-colors shadow-md disabled:opacity-40 disabled:cursor-not-allowed shrink-0">
                  <Icon d={Icons.send} size={12} stroke="white"/>
                </button>
              </div>
            </>)} */}

            {/* VOICE */}
            {/* {rightPanel==="voice"&&(
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className={`p-4 border-b ${colors.border} shrink-0`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] text-[#028391] font-bold uppercase tracking-widest">Your Mic</span>
                    <div className={`flex items-center gap-1.5 text-[10px] ${voiceActive?"text-green-400":"text-red-400"}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${voiceActive?"bg-green-400 animate-pulse":"bg-red-400"}`}/>{voiceActive?"Live":"Off"}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="relative">
                      <Avatar name={username} color={userColor} size={40}/>
                      {speaking&&!isMuted&&<div className="absolute inset-0 rounded-full animate-ping" style={{background:userColor+"25"}}/>}
                    </div>
                    <div className="flex-1">
                      <div className={`text-xs font-bold ${colors.text}`}>{username} <span className="text-[10px] text-[#028391]">(you)</span></div>
                      <div className={`text-[10px] mt-0.5 ${isMuted?"text-red-400":"text-green-400"}`}>{isMuted?"Muted":speaking?"Speaking…":"Listening"}</div>
                      {voiceActive&&!isMuted&&(
                        <div className="flex items-end gap-0.5 mt-1.5 h-4">
                          {[3,5,4,6,3,5,4].map((h,i)=>(
                            <div key={i} className={`w-1 rounded-sm transition-all ${speaking?"bg-[#028391]":"bg-[#028391]/20"}`} style={{height:speaking?`${h*2}px`:"3px"}}/>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={toggleMute} disabled={!voiceActive}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold border transition-all
                        ${isMuted?"bg-red-500/20 border-red-500/40 text-red-400 hover:bg-red-500/30":`${isDark?"border-[#028391]/30 bg-[#028391]/10 text-[#F6DCAC]":"border-[#FAA968]/40 bg-[#028391]/5 text-[#01204E]"} hover:bg-[#028391]/20`}
                        disabled:opacity-40 disabled:cursor-not-allowed`}>
                      <Icon d={isMuted?Icons.micOff:Icons.mic} size={13}/>{isMuted?"Unmute":"Mute"}
                    </button>
                    <button onClick={()=>{stopVoice();setRightPanel(null);}}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition-all">
                      <Icon d={Icons.close} size={13}/>Leave
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                  <div className="text-[10px] text-[#028391] font-bold uppercase tracking-widest mb-3">In Channel</div>
                  {Object.keys(voiceUsers).length===0
                    ?<p className={`text-[11px] ${colors.textMuted} text-center mt-6 leading-relaxed`}>No one else here yet.</p>
                    :<div className="flex flex-wrap gap-5 justify-center mt-2">
                        {Object.entries(voiceUsers).map(([uname,info])=>(
                          <VoiceOrb key={uname} name={uname} color={info.color||"#028391"} speaking={info.speaking} muted={info.muted}/>
                        ))}
                      </div>}
                </div>
              </div>
            )} */}
          </div>
        )}
      </div>

      {(showProfileMenu||showWbMenu)&&(
        <div className="fixed inset-0 z-10" onClick={()=>{setShowProfileMenu(false);setShowWbMenu(false);setShowEmojiPicker(false);}}/>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #028391; border-radius: 4px; }
        input[type=range] { -webkit-appearance:none; height:3px; border-radius:3px; background:#028391; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance:none; width:12px; height:12px; border-radius:50%; background:#028391; cursor:pointer; }

        /* #8 gradient shift animation */
        @keyframes gradientShift {
          0%   { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
        /* #2 cursor glow pulse */
        @keyframes cursorGlow {
          0%,100% { opacity:0.4; transform:scale(1); }
          50%      { opacity:0.9; transform:scale(1.4); }
        }
        /* #1 sticky note animations */
        @keyframes stickyIn {
          from { opacity:0; transform:scale(0.7) translateY(10px); }
          to   { opacity:1; transform:scale(1) translateY(0); }
        }
        @keyframes stickyOut {
          from { opacity:1; transform:scale(1); }
          to   { opacity:0; transform:scale(0.8) translateY(-10px); }
        }
        /* #10/#13 emoji float animation */
        @keyframes emojiFloat {
          0%   { opacity:1; transform:translateY(0) scale(1); }
          60%  { opacity:0.9; transform:translateY(-40px) scale(1.2); }
          100% { opacity:0; transform:translateY(-80px) scale(0.8); }
        }
        .animate-bounce { animation: bounce 1s infinite; }
        @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-3px)} }
        @keyframes ping   { 0%{transform:scale(1);opacity:1} 75%,100%{transform:scale(2);opacity:0} }
        .animate-ping  { animation: ping 1s cubic-bezier(0,0,.2,1) infinite; }
        .animate-pulse { animation: pulse 2s cubic-bezier(.4,0,.6,1) infinite; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }
      `}</style>
    </div>
  );
}