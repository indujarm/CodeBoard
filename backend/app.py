import subprocess
import tempfile
import os
import sys
import uuid
from datetime import datetime

from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO, join_room, leave_room, emit

from routes.auth import auth
from routes.whiteboard import whiteboard
from database import init_db, get_db

active_users = {}
room_history = {}
room_redo    = {}

app = Flask(__name__)
CORS(app)
app.register_blueprint(auth)
app.register_blueprint(whiteboard)

socketio = SocketIO(app, cors_allowed_origins="*", async_mode="threading")


# ── CONNECT ───────────────────────────────────────────────────────────────────
@socketio.on("connect")
def handle_connect(auth_data):
    room_id  = request.args.get("roomId")
    username = request.args.get("username", "User")

    if not room_id:
        return False

    conn   = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM rooms WHERE id=?", (room_id,))
    room = cursor.fetchone()
    conn.close()

    if not room:
        return False

    join_room(room_id)

    if room_id not in active_users:
        active_users[room_id] = []
    if username not in active_users[room_id]:
        active_users[room_id].append(username)
        try:
            conn   = get_db()
            cursor = conn.cursor()
            cursor.execute(
                "INSERT OR IGNORE INTO user_rooms (username, room_id) VALUES (?, ?)",
                (username, room_id)
            )
            conn.commit()
            conn.close()
        except Exception as e:
            print(f"user_rooms insert error: {e}")

    emit("presence_update", active_users[room_id], room=room_id)
    emit("receive_message", {
        "username": "System",
        "message":  f"{username} joined",
        "time":     datetime.utcnow().isoformat()
    }, room=room_id)
    print(f"{username} joined room {room_id}")


# ── DISCONNECT ────────────────────────────────────────────────────────────────
@socketio.on("disconnect")
def handle_disconnect():
    room_id  = request.args.get("roomId")
    username = request.args.get("username", "User")

    if room_id and room_id in active_users:
        if username in active_users[room_id]:
            active_users[room_id].remove(username)
        emit("presence_update", active_users[room_id], room=room_id)
        emit("receive_message", {
            "username": "System",
            "message":  f"{username} left",
            "time":     datetime.utcnow().isoformat()
        }, room=room_id)
    print(f"{username} left room {room_id}")


# ── LEAVE ROOM ────────────────────────────────────────────────────────────────
@socketio.on("leave_room")
def handle_leave(data):
    room_id  = data.get("roomId")
    username = data.get("username", "User")
    if room_id and room_id in active_users:
        if username in active_users[room_id]:
            active_users[room_id].remove(username)
        emit("presence_update", active_users[room_id], room=room_id)
    emit("receive_message", {
        "username": "System",
        "message":  f"{username} left",
        "time":     datetime.utcnow().isoformat()
    }, room=room_id)
    leave_room(room_id)


# ── CHAT ──────────────────────────────────────────────────────────────────────
@socketio.on("send_message")
def handle_send_message(data):
    room_id = data.get("roomId")
    try:
        conn   = get_db()
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO replay (room_id, event) VALUES (?, ?)",
            (room_id, str({"type": "chat", "data": data}))
        )
        conn.commit()
        conn.close()
    except Exception:
        pass
    emit("receive_message", data, room=room_id)


# ── TYPING ────────────────────────────────────────────────────────────────────
@socketio.on("typing")
def handle_typing_chat(data):
    room_id  = data.get("roomId")
    username = data.get("username")
    emit("typing", {"username": username}, room=room_id, include_self=False)

@socketio.on("typingEditor")
def handle_typing_editor(data):
    room_id = data.get("roomId")
    emit("typingEditor", data, room=room_id, include_self=False)

@socketio.on("user_activity")
def handle_user_activity(data):
    room_id = data.get("roomId")
    emit("user_activity", data, room=room_id, include_self=False)


# ── DRAW ──────────────────────────────────────────────────────────────────────
@socketio.on("draw")
def handle_draw(data):
    room_id = data.get("roomId")
    if room_id not in room_history:
        room_history[room_id] = []
        room_redo[room_id]    = []
    if "snapshot" in data:
        room_history[room_id].append(data["snapshot"])
        room_redo[room_id] = []
    import random
    if random.random() < 0.1:
        try:
            conn   = get_db()
            cursor = conn.cursor()
            cursor.execute(
                "INSERT INTO replay (room_id, event) VALUES (?, ?)",
                (room_id, str({"type": "draw", "data": data}))
            )
            conn.commit()
            conn.close()
        except Exception:
            pass
    emit("draw", data, room=room_id, include_self=False)


# ── EMOJI REACTIONS (#10 / #13) ───────────────────────────────────────────────
@socketio.on("emoji_reaction")
def handle_emoji_reaction(data):
    """Broadcast emoji reaction to all room members including sender."""
    room_id = data.get("roomId")
    emit("emoji_reaction", data, room=room_id, include_self=False)


# ── CURSOR / CANVAS ───────────────────────────────────────────────────────────
@socketio.on("cursor_move")
def handle_cursor(data):
    room_id = data.get("roomId")
    emit("cursor_move", data, room=room_id, include_self=False)

@socketio.on("undo")
def handle_undo(data):
    room_id = data.get("roomId")
    if room_id not in room_history or not room_history[room_id]:
        return
    last = room_history[room_id].pop()
    room_redo.setdefault(room_id, []).append(last)
    prev = room_history[room_id][-1] if room_history[room_id] else None
    emit("canvas_state", prev, room=room_id)

@socketio.on("redo")
def handle_redo(data):
    room_id = data.get("roomId")
    if room_id not in room_redo or not room_redo[room_id]:
        return
    state = room_redo[room_id].pop()
    room_history.setdefault(room_id, []).append(state)
    emit("canvas_state", state, room=room_id)

@socketio.on("clear_board")
def handle_clear(data):
    room_id = data.get("roomId")
    emit("clear_board", {}, room=room_id)


# ── CODE ──────────────────────────────────────────────────────────────────────
@socketio.on("code_update")
def handle_code_update(data):
    room_id = data.get("roomId")
    code    = data.get("code")
    try:
        conn   = get_db()
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO replay (room_id, event) VALUES (?, ?)",
            (room_id, str({"type": "code", "data": code}))
        )
        conn.commit()
        conn.close()
    except Exception:
        pass
    emit("code_update", code, room=room_id, include_self=False)

@socketio.on("run_code")
def run_code(data):
    code       = data.get("code", "")
    language   = data.get("language", "python")
    user_input = data.get("input", "")
    room_id    = data.get("roomId")
    result     = ""
    try:
        if language == "python":
            python_cmd = "python3" if sys.platform != "win32" else "python"
            tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".py", mode="w")
            try:
                tmp.write(code); tmp.close()
                run = subprocess.run([python_cmd, tmp.name], input=user_input, text=True, capture_output=True, timeout=5)
                result = run.stdout if run.stdout else run.stderr
            finally:
                os.unlink(tmp.name)
        elif language == "javascript":
            tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".js", mode="w")
            try:
                tmp.write(code); tmp.close()
                run = subprocess.run(["node", tmp.name], input=user_input, text=True, capture_output=True, timeout=5)
                result = run.stdout if run.stdout else run.stderr
            finally:
                os.unlink(tmp.name)
        else:
            result = "Unsupported language"
    except Exception as e:
        result = str(e)
    socketio.emit("code_output", result, room=room_id)


# ── VOICE ─────────────────────────────────────────────────────────────────────
@socketio.on("voice_join")
def handle_voice_join(data):
    room_id = data.get("roomId")
    emit("voice_joined", data, room=room_id, include_self=False)

@socketio.on("voice_leave")
def handle_voice_leave(data):
    room_id = data.get("roomId")
    emit("voice_left", data, room=room_id, include_self=False)

@socketio.on("voice_mute")
def handle_voice_mute(data):
    room_id = data.get("roomId")
    emit("voice_mute", data, room=room_id, include_self=False)

@socketio.on("voice_speaking")
def handle_voice_speaking(data):
    room_id = data.get("roomId")
    emit("voice_speaking", data, room=room_id, include_self=False)


# ══ HTTP ROUTES ════════════════════════════════════════════════════════════════

@app.route("/replay/<room_id>")
def get_replay(room_id):
    conn   = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT event FROM replay WHERE room_id=? ORDER BY timestamp ASC", (room_id,))
    rows = cursor.fetchall()
    conn.close()
    events = []
    for row in rows:
        try:
            events.append(eval(row[0]))
        except Exception:
            pass
    return {"events": events}


# ── #14 Room Activity Heatmap endpoint ────────────────────────────────────────
@app.route("/room-activity/<room_id>")
def room_activity(room_id):
    """
    Returns daily event counts for the last 30 days for the heatmap widget
    on the Dashboard room card.
    """
    conn   = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT DATE(timestamp) as day, COUNT(*) as events
        FROM replay
        WHERE room_id = ?
          AND timestamp >= DATE('now', '-29 days')
        GROUP BY DATE(timestamp)
        ORDER BY day ASC
    """, (room_id,))
    rows = cursor.fetchall()
    conn.close()
    return jsonify({"activity": [{"day": r[0], "events": r[1]} for r in rows]})


@app.route("/create-room", methods=["POST"])
def create_room():
    data      = request.get_json()
    room_name = data.get("name") or "Untitled Room"
    username  = data.get("username")
    room_id   = str(uuid.uuid4())[:8]
    conn      = get_db()
    cursor    = conn.cursor()
    cursor.execute("INSERT INTO rooms (id, created_by, name) VALUES (?, ?, ?)", (room_id, username, room_name))
    cursor.execute("INSERT OR IGNORE INTO user_rooms (username, room_id) VALUES (?, ?)", (username, room_id))
    conn.commit()
    conn.close()
    return {"success": True, "roomId": room_id}

@app.route("/join-room", methods=["POST"])
def join_room_http():
    data     = request.get_json()
    room_id  = data.get("roomId")
    username = data.get("username")
    if not room_id or not username:
        return jsonify({"success": False, "message": "Missing roomId or username"}), 400
    conn   = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM rooms WHERE id=?", (room_id,))
    if not cursor.fetchone():
        conn.close()
        return jsonify({"success": False, "message": "Room not found"}), 404
    cursor.execute("INSERT OR IGNORE INTO user_rooms (username, room_id) VALUES (?, ?)", (username, room_id))
    conn.commit()
    conn.close()
    return jsonify({"success": True})

@app.route("/room-exists/<room_id>")
def room_exists(room_id):
    conn   = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM rooms WHERE id=?", (room_id,))
    room = cursor.fetchone()
    conn.close()
    return {"exists": bool(room)}

@app.route("/my-rooms/<username>")
def get_my_rooms(username):
    conn   = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT rooms.id, rooms.name, sessions.whiteboard, user_rooms.joined_at,
               (SELECT COUNT(*) FROM user_rooms ur WHERE ur.room_id = rooms.id) AS members
        FROM rooms
        LEFT JOIN sessions   ON rooms.id = sessions.room_id
        LEFT JOIN user_rooms ON rooms.id = user_rooms.room_id AND user_rooms.username = ?
        WHERE user_rooms.username = ?
        ORDER BY user_rooms.joined_at DESC
    """, (username, username))
    rows = cursor.fetchall()
    conn.close()
    return {"rooms": [
        {"roomId": r[0], "name": r[1], "thumbnail": r[2], "joinedAt": r[3], "members": r[4]}
        for r in rows
    ]}

@app.route("/rename-room", methods=["POST"])
def rename_room():
    data   = request.get_json()
    conn   = get_db()
    cursor = conn.cursor()
    cursor.execute("UPDATE rooms SET name=? WHERE id=?", (data.get("name"), data.get("roomId")))
    conn.commit()
    conn.close()
    return {"success": True}

@app.route("/delete-room", methods=["POST"])
def delete_room():
    data    = request.get_json()
    room_id = data.get("roomId")
    conn    = get_db()
    cursor  = conn.cursor()
    for tbl in ["rooms", "sessions", "replay", "user_rooms"]:
        col = "id" if tbl == "rooms" else "room_id"
        cursor.execute(f"DELETE FROM {tbl} WHERE {col}=?", (room_id,))
    conn.commit()
    conn.close()
    return {"success": True}

@app.route("/save-session", methods=["POST"])
def save_session():
    data   = request.json
    room_id= data.get("roomId")
    conn   = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO sessions (room_id, code, whiteboard) VALUES (?, ?, ?)
        ON CONFLICT(room_id) DO UPDATE SET code=excluded.code, whiteboard=excluded.whiteboard
    """, (room_id, data.get("code"), data.get("whiteboard")))
    conn.commit()
    conn.close()
    return {"status": "saved"}

@app.route("/load-session/<room_id>")
def load_session(room_id):
    conn   = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT code, whiteboard FROM sessions WHERE room_id=?", (room_id,))
    row = cursor.fetchone()
    conn.close()
    return {"code": row[0], "whiteboard": row[1]} if row else {"code": "", "whiteboard": None}

@app.route("/debug-rooms")
def debug_rooms():
    conn   = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id, name, created_by FROM rooms")
    rows = cursor.fetchall()
    conn.close()
    return {"rooms": rows}

if __name__ == "__main__":
    init_db()
    socketio.run(app, debug=True, port=5000)