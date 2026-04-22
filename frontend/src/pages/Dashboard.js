import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

// ─── Design tokens ────────────────────────────────────────────────────────────
const TOKEN = {
  teal:  "#028391",
  navy:  "#01204E",
  cream: "#F6DCAC",
  orange:"#F85525",
  peach: "#FAA968",
};

// ─── Icon primitive ────────────────────────────────────────────────────────────
const Icon = ({ d, size = 16, stroke = "currentColor", fill = "none", strokeWidth = 1.8, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24"
    fill={fill} stroke={stroke} strokeWidth={strokeWidth}
    strokeLinecap="round" strokeLinejoin="round" className={className}>
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
  </svg>
);

const Icons = {
  search:   "M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z",
  edit:     "M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z",
  trash:    "M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2",
  close:    "M18 6L6 18M6 6l12 12",
  check:    "M20 6L9 17l-5-5",
  plus:     "M12 5v14M5 12h14",
  logout:   "M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9",
  users:    ["M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2","M9 7a4 4 0 100 8 4 4 0 000-8z","M23 21v-2a4 4 0 00-3-3.87","M16 3.13a4 4 0 010 7.75"],
  calendar: "M3 4h18v18H3zM16 2v4M8 2v4M3 10h18",
  door:     "M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9zM13 2v7h7",
  moon:     "M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z",
  sun:      ["M12 2v2","M12 20v2","M4.22 4.22l1.42 1.42","M18.36 18.36l1.42 1.42","M2 12h2","M20 12h2","M4.22 19.78l1.42-1.42","M18.36 5.64l1.42-1.42","M12 6a6 6 0 100 12 6 6 0 000-12z"],
};

// ─── Rename modal ─────────────────────────────────────────────────────────────
function RenameModal({ room, isDark, onConfirm, onCancel }) {
  const [value, setValue] = useState(room.name || "");
  const inputRef = useRef(null);
  useEffect(() => { inputRef.current?.focus(); }, []);
  const handleKey = e => {
    if (e.key === "Enter")  onConfirm(value.trim() || room.name);
    if (e.key === "Escape") onCancel();
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(1,20,46,0.72)", backdropFilter: "blur(6px)" }}
      onClick={e => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className={`w-full max-w-sm rounded-2xl shadow-2xl p-6 border
        ${isDark ? "bg-[#01152f] border-[#028391]/40 text-[#F6DCAC]" : "bg-white border-[#FAA968]/60 text-[#01204E]"}`}>
        <h3 className="text-base font-bold mb-4 tracking-tight">Rename Room</h3>
        <input ref={inputRef} value={value} onChange={e => setValue(e.target.value)}
          onKeyDown={handleKey} maxLength={48} placeholder="Room name…"
          className={`w-full px-4 py-2.5 rounded-xl text-sm border outline-none focus:ring-2 focus:ring-[#028391] transition
            ${isDark ? "bg-[#011a3a] border-[#028391]/30 text-[#F6DCAC] placeholder-[#F6DCAC]/30"
                     : "bg-[#F6DCAC]/30 border-[#FAA968] text-[#01204E] placeholder-[#01204E]/40"}`}/>
        <div className="flex gap-2 mt-4 justify-end">
          <button onClick={onCancel}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition
              ${isDark ? "hover:bg-white/10 text-[#F6DCAC]/70" : "hover:bg-black/5 text-[#01204E]/60"}`}>
            Cancel
          </button>
          <button onClick={() => onConfirm(value.trim() || room.name)}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-[#028391] text-white hover:bg-[#028391]/80 transition shadow">
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Delete confirm modal ─────────────────────────────────────────────────────
function DeleteModal({ room, isDark, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(1,20,46,0.72)", backdropFilter: "blur(6px)" }}
      onClick={e => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className={`w-full max-w-sm rounded-2xl shadow-2xl p-6 border
        ${isDark ? "bg-[#01152f] border-[#F85525]/30 text-[#F6DCAC]" : "bg-white border-[#F85525]/30 text-[#01204E]"}`}>
        <h3 className="text-base font-bold mb-1 tracking-tight">Delete Room?</h3>
        <p className={`text-sm mb-5 ${isDark ? "text-[#F6DCAC]/60" : "text-[#01204E]/60"}`}>
          <span className="font-semibold">{room.name || "Untitled Room"}</span> will be permanently removed. This cannot be undone.
        </p>
        <div className="flex gap-2 justify-end">
          <button onClick={onCancel}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition
              ${isDark ? "hover:bg-white/10 text-[#F6DCAC]/70" : "hover:bg-black/5 text-[#01204E]/60"}`}>
            Cancel
          </button>
          <button onClick={onConfirm}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-[#F85525] text-white hover:bg-[#F85525]/80 transition shadow">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Room card ────────────────────────────────────────────────────────────────
function RoomCard({ room, isDark, onNavigate, onRename, onDelete }) {
  const date = room.joinedAt
    ? new Date(room.joinedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
    : "N/A";

  return (
    <div
      className={`group relative rounded-2xl overflow-hidden border transition-all duration-200
        hover:scale-[1.018] hover:shadow-2xl cursor-pointer
        ${isDark ? "bg-[#01204E]/60 border-[#028391]/20 hover:border-[#028391]/60"
                 : "bg-white/80 border-[#FAA968]/40 hover:border-[#FAA968]"}`}
      onClick={() => onNavigate(room.roomId)}
    >
      {/* Thumbnail */}
      <div className={`h-36 flex items-center justify-center overflow-hidden
        ${isDark ? "bg-[#011a3a]" : "bg-[#F6DCAC]/50"}`}>
        {room.thumbnail
          ? <img src={room.thumbnail} alt="preview" className="w-full h-full object-cover"/>
          : <div className="flex flex-col items-center gap-1 opacity-30">
              <Icon d={Icons.door} size={28} stroke={isDark ? TOKEN.cream : TOKEN.navy}/>
              <span className="text-[10px] font-mono uppercase tracking-widest">No Preview</span>
            </div>}
      </div>

      {/* Hover action buttons */}
      <div className="absolute top-2.5 right-2.5 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
        onClick={e => e.stopPropagation()}>
        <button title="Rename room" onClick={() => onRename(room)}
          className={`w-7 h-7 flex items-center justify-center rounded-lg shadow-lg transition
            ${isDark ? "bg-[#01204E]/90 border border-[#028391]/40 text-[#F6DCAC] hover:bg-[#028391] hover:border-[#028391]"
                     : "bg-white/90 border border-[#FAA968]/40 text-[#01204E] hover:bg-[#028391] hover:text-white hover:border-[#028391]"}`}>
          <Icon d={Icons.edit} size={13}/>
        </button>
        <button title="Delete room" onClick={() => onDelete(room)}
          className={`w-7 h-7 flex items-center justify-center rounded-lg shadow-lg transition
            ${isDark ? "bg-[#01204E]/90 border border-[#F85525]/30 text-[#F85525] hover:bg-[#F85525] hover:border-[#F85525] hover:text-white"
                     : "bg-white/90 border border-[#F85525]/30 text-[#F85525] hover:bg-[#F85525] hover:text-white hover:border-[#F85525]"}`}>
          <Icon d={Icons.trash} size={13}/>
        </button>
      </div>

      {/* Details */}
      <div className="p-4">
        <h4 className={`font-bold text-sm mb-0.5 truncate ${isDark ? "text-[#F6DCAC]" : "text-[#01204E]"}`}>
          {room.name || "Untitled Room"}
        </h4>
        <p className={`text-[11px] font-mono mb-3 ${isDark ? "text-[#F6DCAC]/40" : "text-[#01204E]/40"}`}>
          {room.roomId}
        </p>
        <div className={`flex justify-between text-[11px] ${isDark ? "text-[#F6DCAC]/50" : "text-[#01204E]/50"}`}>
          <span className="flex items-center gap-1"><Icon d={Icons.calendar} size={11}/>{date}</span>
          <span className="flex items-center gap-1">
            <Icon d={Icons.users} size={11}/>{room.members ?? 1} member{room.members !== 1 ? "s" : ""}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
function Dashboard({ theme, setTheme }) {
  const navigate = useNavigate();
  const isDark   = theme === "dark";

  const [roomId,        setRoomId]        = useState("");
  const [roomName,      setRoomName]      = useState("");
  const [rooms,         setRooms]         = useState([]);
  const [search,        setSearch]        = useState("");
  const [status,        setStatus]        = useState({ msg: "", type: "error" });
  const [showProfile,   setShowProfile]   = useState(false);
  const [renameTarget,  setRenameTarget]  = useState(null);
  const [deleteTarget,  setDeleteTarget]  = useState(null);
  const [loadingDelete, setLoadingDelete] = useState(false);

  // ── FIX 1: Read email from sessionStorage (set during login) ────────────────
  const username = sessionStorage.getItem("username") || "User";
  const email    = sessionStorage.getItem("email")    || "";   // set by Login page on success

  // ── Fetch rooms ──────────────────────────────────────────────────────────────
  const fetchRooms = async () => {
    try {
      const res  = await fetch(`http://localhost:5000/my-rooms/${username}`);
      const data = await res.json();
      setRooms(data.rooms || []);
    } catch {
      flash("Failed to load rooms.", "error");
    }
  };

  useEffect(() => { fetchRooms(); }, [username]);

  // ── Flash helper ─────────────────────────────────────────────────────────────
  const flash = (msg, type = "error") => {
    setStatus({ msg, type });
    setTimeout(() => setStatus({ msg: "", type: "error" }), 3500);
  };

  // ── Create room ──────────────────────────────────────────────────────────────
  const handleCreateRoom = async () => {
    if (!roomName.trim()) { flash("Please enter a room name."); return; }
    try {
      const res  = await fetch("http://localhost:5000/create-room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: roomName, username }),
      });
      const data = await res.json();
      if (data.success) navigate(`/whiteboard/${data.roomId}`);
      else flash("Could not create room.");
    } catch {
      flash("Could not create room.");
    }
  };

  // ── FIX 2: Join room — persist membership for ALL joiners ───────────────────
  const handleJoinRoom = async () => {
    if (!roomId.trim()) { flash("Enter a valid Room ID."); return; }
    try {
      // Step 1: verify room exists
      const checkRes  = await fetch(`http://localhost:5000/room-exists/${roomId}`);
      const checkData = await checkRes.json();
      if (!checkData.exists) { flash("Room does not exist."); return; }

      // Step 2: persist membership so it shows on THIS user's dashboard
      await fetch("http://localhost:5000/join-room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId, username }),
      });

      navigate(`/whiteboard/${roomId}`);
    } catch {
      flash("Could not verify room.");
    }
  };

  // ── Rename ───────────────────────────────────────────────────────────────────
  const handleRenameConfirm = async (newName) => {
    const room = renameTarget;
    setRenameTarget(null);
    try {
      await fetch("http://localhost:5000/rename-room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId: room.roomId, name: newName }),
      });
      setRooms(prev => prev.map(r => r.roomId === room.roomId ? { ...r, name: newName } : r));
      flash(`Renamed to "${newName}".`, "info");
    } catch {
      flash("Rename failed.");
    }
  };

  // ── Delete ───────────────────────────────────────────────────────────────────
  const handleDeleteConfirm = async () => {
    const room = deleteTarget;
    setLoadingDelete(true);
    try {
      await fetch("http://localhost:5000/delete-room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId: room.roomId }),
      });
      setRooms(prev => prev.filter(r => r.roomId !== room.roomId));
      flash(`"${room.name || "Room"}" deleted.`, "info");
    } catch {
      flash("Delete failed.");
    } finally {
      setDeleteTarget(null);
      setLoadingDelete(false);
    }
  };

  // ── Search filter ─────────────────────────────────────────────────────────────
  const filteredRooms = rooms.filter(r => {
    const q = search.toLowerCase();
    return (r.name || "").toLowerCase().includes(q) || (r.roomId || "").toLowerCase().includes(q);
  });

  const logout = () => { sessionStorage.clear(); localStorage.clear(); navigate("/"); };

  // ── Shared input classes ──────────────────────────────────────────────────────
  const inputCls = `px-4 py-2.5 rounded-xl text-sm border outline-none focus:ring-2 focus:ring-[#028391] transition
    ${isDark ? "bg-[#011a3a] border-[#028391]/30 text-[#F6DCAC] placeholder-[#F6DCAC]/30"
             : "bg-white/80 border-[#FAA968]/60 text-[#01204E] placeholder-[#01204E]/40"}`;

  const btnPrimary = `px-5 py-2.5 rounded-xl text-sm font-bold bg-[#028391] text-white hover:bg-[#028391]/80 transition shadow`;

  // ════════════════════════════════════════════════════════════════════════════
  return (
    <div className={`min-h-screen transition-colors duration-300
        ${isDark ? "bg-[#01204E] text-[#F6DCAC]" : "bg-[#F6DCAC] text-[#01204E]"}`}
      style={{ fontFamily: "'JetBrains Mono','Fira Code',monospace" }}>

      {/* ── NAVBAR ──────────────────────────────────────────────────────────── */}
      <nav className={`sticky top-0 z-30 flex items-center justify-between px-6 md:px-10 h-14 border-b backdrop-blur-xl
        ${isDark ? "bg-[#01204E]/80 border-[#028391]/20" : "bg-[#F6DCAC]/80 border-[#FAA968]/40"}`}>

        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#028391] flex items-center justify-center shadow">
            <span className="text-white text-[11px] font-black">CB</span>
          </div>
          <span className="font-bold text-sm hidden sm:block">CodeBoard</span>
        </div>

        <div className="flex items-center gap-3">
          {/* Theme toggle */}
          <button onClick={() => setTheme(isDark ? "light" : "dark")} title="Toggle theme"
            className={`w-9 h-9 flex items-center justify-center rounded-xl border transition
              ${isDark ? "border-[#028391]/30 hover:bg-[#028391]/20 text-[#F6DCAC]"
                       : "border-[#FAA968]/60 hover:bg-[#FAA968]/30 text-[#01204E]"}`}>
            <Icon d={isDark ? Icons.sun : Icons.moon} size={15}/>
          </button>

          {/* Avatar */}
          <button onClick={() => setShowProfile(p => !p)} title="Profile"
            className="w-8 h-8 rounded-full bg-gradient-to-br from-[#028391] to-[#01204E]
              text-white text-xs font-bold shadow ring-2 ring-[#028391]/40 hover:ring-[#028391] transition">
            {username[0].toUpperCase()}
          </button>
        </div>
      </nav>

      {/* ── PROFILE SIDEBAR ──────────────────────────────────────────────────── */}
      {showProfile && (
        <div className="fixed inset-0 z-40"
          style={{ background: "rgba(1,20,46,0.4)", backdropFilter: "blur(2px)" }}
          onClick={() => setShowProfile(false)}/>
      )}
      <aside className={`fixed top-0 right-0 h-full w-72 z-50 flex flex-col justify-between p-6
        shadow-2xl transition-transform duration-300
        ${isDark ? "bg-[#01152f] border-l border-[#028391]/20" : "bg-white border-l border-[#FAA968]/30"}
        ${showProfile ? "translate-x-0" : "translate-x-full"}`}>
        <div>
          <div className="flex justify-end mb-6">
            <button onClick={() => setShowProfile(false)}
              className={`w-7 h-7 flex items-center justify-center rounded-lg transition
                ${isDark ? "hover:bg-white/10 text-[#F6DCAC]/60" : "hover:bg-black/5 text-[#01204E]/50"}`}>
              <Icon d={Icons.close} size={14}/>
            </button>
          </div>

          <div className="flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#028391] to-[#01204E]
              flex items-center justify-center text-2xl font-bold text-white shadow-xl">
              {username[0].toUpperCase()}
            </div>
            <h2 className="mt-4 text-base font-bold">{username}</h2>

            {/* FIX 1: Show real email, fall back gracefully */}
            {/* <p className={`text-xs mt-0.5 ${isDark ? "text-[#F6DCAC]/50" : "text-[#01204E]/50"}`}>
              {email || <span className="opacity-40 italic">no email on file</span>}
            </p> */}
            <div className="mt-2 flex items-center gap-1.5 text-[11px] text-[#028391]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#028391] animate-pulse"/>
              Online
            </div>
          </div>

          {/* Room count */}
          <div className={`mt-6 rounded-xl p-3 text-center border
            ${isDark ? "bg-[#01204E]/60 border-[#028391]/20" : "bg-[#F6DCAC]/40 border-[#FAA968]/40"}`}>
            <div className="text-2xl font-bold text-[#028391]">{rooms.length}</div>
            <div className={`text-[11px] ${isDark ? "text-[#F6DCAC]/50" : "text-[#01204E]/50"}`}>rooms joined</div>
          </div>
        </div>

        <button onClick={logout}
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl
            bg-[#F85525] text-white text-sm font-bold hover:bg-[#F85525]/80 transition shadow">
          <Icon d={Icons.logout} size={14} stroke="white"/>
          Logout
        </button>
      </aside>

      {/* ── MAIN CONTENT ─────────────────────────────────────────────────────── */}
      <main className="px-6 md:px-10 py-8 max-w-7xl mx-auto">

        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight">Your Workspace</h1>
          <p className={`text-sm mt-1 ${isDark ? "text-[#F6DCAC]/50" : "text-[#01204E]/50"}`}>
            Create, join, and manage your collaboration rooms.
          </p>
        </div>

        {/* CREATE + JOIN */}
        <div className={`rounded-2xl border p-5 mb-6
          ${isDark ? "bg-[#01152f] border-[#028391]/20" : "bg-white/70 border-[#FAA968]/40"}`}>
          <div className="flex flex-wrap gap-4">
            {/* Create */}
            <div className="flex gap-2 flex-1 min-w-[220px]">
              <input placeholder="New room name…" value={roomName}
                onChange={e => setRoomName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleCreateRoom()}
                className={`flex-1 ${inputCls}`}/>
              <button onClick={handleCreateRoom} className={btnPrimary}>
                <span className="flex items-center gap-1.5">
                  <Icon d={Icons.plus} size={13} stroke="white"/> Create
                </span>
              </button>
            </div>

            <div className={`w-px self-stretch ${isDark ? "bg-[#028391]/20" : "bg-[#FAA968]/40"}`}/>

            {/* Join */}
            <div className="flex gap-2 flex-1 min-w-[220px]">
              <input placeholder="Room ID to join…" value={roomId}
                onChange={e => setRoomId(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleJoinRoom()}
                className={`flex-1 ${inputCls}`}/>
              <button onClick={handleJoinRoom}
                className={`px-5 py-2.5 rounded-xl text-sm font-bold transition shadow
                  ${isDark ? "bg-[#F6DCAC]/10 text-[#F6DCAC] border border-[#F6DCAC]/20 hover:bg-[#F6DCAC]/20"
                           : "bg-[#01204E]/10 text-[#01204E] border border-[#01204E]/20 hover:bg-[#01204E]/20"}`}>
                Join
              </button>
            </div>
          </div>

          {/* Status */}
          {status.msg && (
            <div className={`mt-3 text-xs flex items-center gap-2 px-3 py-2 rounded-lg
              ${status.type === "info" ? "bg-[#028391]/10 text-[#028391]" : "bg-[#F85525]/10 text-[#F85525]"}`}>
              <Icon d={status.type === "info" ? Icons.check : Icons.close} size={12}/>
              {status.msg}
            </div>
          )}
        </div>

        {/* SEARCH + HEADER */}
        <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
          <h2 className="text-base font-bold">
            Rooms
            <span className={`ml-2 text-xs font-mono ${isDark ? "text-[#F6DCAC]/40" : "text-[#01204E]/40"}`}>
              {filteredRooms.length}/{rooms.length}
            </span>
          </h2>
          <div className="relative flex-1 max-w-xs">
            <Icon d={Icons.search} size={14}
              className={`absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none
                ${isDark ? "text-[#F6DCAC]/30" : "text-[#01204E]/30"}`}/>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or ID…"
              className={`w-full pl-9 pr-4 py-2 rounded-xl text-xs border outline-none
                focus:ring-2 focus:ring-[#028391] transition
                ${isDark ? "bg-[#011a3a] border-[#028391]/30 text-[#F6DCAC] placeholder-[#F6DCAC]/30"
                         : "bg-white/80 border-[#FAA968]/60 text-[#01204E] placeholder-[#01204E]/40"}`}/>
            {search && (
              <button onClick={() => setSearch("")}
                className={`absolute right-2.5 top-1/2 -translate-y-1/2
                  ${isDark ? "text-[#F6DCAC]/40 hover:text-[#F6DCAC]" : "text-[#01204E]/40 hover:text-[#01204E]"}`}>
                <Icon d={Icons.close} size={12}/>
              </button>
            )}
          </div>
        </div>

        {/* ROOM GRID */}
        {filteredRooms.length === 0 ? (
          <div className={`rounded-2xl border flex flex-col items-center justify-center py-20 gap-3
            ${isDark ? "border-[#028391]/10 bg-[#01152f]/40" : "border-[#FAA968]/30 bg-white/30"}`}>
            <Icon d={Icons.door} size={32} stroke={isDark ? TOKEN.cream : TOKEN.navy} className="opacity-20"/>
            <p className={`text-sm ${isDark ? "text-[#F6DCAC]/30" : "text-[#01204E]/30"}`}>
              {search ? "No rooms match your search." : "No rooms yet — create one above!"}
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredRooms.map((room, i) => (
              <RoomCard key={room.roomId || i} room={room} isDark={isDark}
                onNavigate={id => navigate(`/whiteboard/${id}`)}
                onRename={r  => setRenameTarget(r)}
                onDelete={r  => setDeleteTarget(r)}/>
            ))}
          </div>
        )}
      </main>

      {/* MODALS */}
      {renameTarget && (
        <RenameModal room={renameTarget} isDark={isDark}
          onConfirm={handleRenameConfirm} onCancel={() => setRenameTarget(null)}/>
      )}
      {deleteTarget && (
        <DeleteModal room={deleteTarget} isDark={isDark}
          onConfirm={handleDeleteConfirm} onCancel={() => setDeleteTarget(null)}
          loading={loadingDelete}/>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #028391; border-radius: 4px; }
        .animate-pulse { animation: pulse 2s cubic-bezier(.4,0,.6,1) infinite; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }
      `}</style>
    </div>
  );
}

export default Dashboard;