from flask import Blueprint, request, jsonify
import uuid
import sqlite3
import datetime
import os
import time
import requests
from dotenv import load_dotenv
from utils.jwt_helper import decode_token
load_dotenv()
# ✅ DEFINE FIRST
whiteboard = Blueprint("whiteboard", __name__)

 
# ✅ THEN USE IT
# @whiteboard.route("/create-room", methods=["POST"])
# def create_room():
#     token = request.headers.get("Authorization")
 
#     # ✅ FIX 1: Remove "Bearer "
#     if token and token.startswith("Bearer "):
#         token = token.split(" ")[1]
 
#     try:
#         decoded = decode_token(token)
 
#         # ✅ FIX 2: correct key
#         username = decoded.get("user")
 
#         if not username:
#             return jsonify({"success": False, "message": "Invalid token"}), 401
 
#     except Exception as e:
#         print("JWT ERROR:", e)
#         return jsonify({"success": False, "message": "Invalid token"}), 401
 
#     room_id = str(uuid.uuid4())[:8]
#     expiry_time = datetime.datetime.utcnow() + datetime.timedelta(hours=2)
 
#     conn = sqlite3.connect("users.db")
#     cursor = conn.cursor()
 
#     cursor.execute(
#         "INSERT INTO rooms (id, created_by, expires_at) VALUES (?, ?, ?)",
#         (room_id, username, expiry_time.isoformat())
#     )
 
#     conn.commit()
#     conn.close()
 
#     return jsonify({
#         "success": True,
#         "roomId": room_id,
#         "expiresAt": expiry_time
#     })
   
#save
@whiteboard.route("/save-session", methods=["POST"])
def save_session():
    data = request.json
    room_id = data["roomId"]
    code = data.get("code", "")
    whiteboard = data.get("whiteboard", "")
 
    conn = sqlite3.connect("users.db")
    cursor = conn.cursor()
 
    cursor.execute("""
    INSERT INTO sessions (room_id, code, whiteboard)
    VALUES (?, ?, ?)
    ON CONFLICT(room_id) DO UPDATE SET
    code=excluded.code,
    whiteboard=excluded.whiteboard
    """, (room_id, code, whiteboard))
 
    conn.commit()
    conn.close()
 
    return jsonify({"success": True})
 
#load session
@whiteboard.route("/load-session/<room_id>", methods=["GET"])
def load_session(room_id):
 
    conn = sqlite3.connect("users.db")
    cursor = conn.cursor()
 
    cursor.execute("SELECT code, whiteboard FROM sessions WHERE room_id=?", (room_id,))
    row = cursor.fetchone()
 
    conn.close()
 
    if row:
        return jsonify({
            "success": True,
            "code": row[0],
            "whiteboard": row[1]
        })
 
    return jsonify({"success": False})
 
#Replay api
# Replay api (AI Copilot)
 # Add this at the top of your file

# import time
# import requests
# import os
# from flask import jsonify, request

@whiteboard.route("/ai", methods=["POST"])
def ai_copilot():
    data = request.json
    messages = data.get("messages", [])
    language = data.get("language", "python")
    api_key = os.getenv("GEMINI_API_KEY")

    if not api_key:
        return jsonify({"success": False, "error": "API Key not found in .env"}), 500

    # Format history for Gemini 3.1
    conversation = ""
    for m in messages:
        role = "User" if m['role'] == "user" else "Assistant"
        conversation += f"{role}: {m['content']}\n"

    prompt = f"You are a coding expert. Language: {language}\n\n{conversation}\nAssistant:"

    # ✅ APRIL 2026 STABLE MODEL (Lite version avoids 503 errors)
    url = "https://generativelanguage.googleapis.com/v1/models/gemini-3.1-flash-lite-preview:generateContent"
    
    # 🔄 EXPONENTIAL BACKOFF RETRY
    max_retries = 3
    for attempt in range(max_retries):
        try:
            response = requests.post(
                url,
                params={"key": api_key},
                json={"contents": [{"parts": [{"text": prompt}]}]},
                timeout=20
            )
            
            res_json = response.json()

            # Handle Success
            if response.status_code == 200:
                reply = res_json['candidates'][0]['content']['parts'][0]['text']
                return jsonify({"success": True, "content": [{"text": reply}]})

            # Handle "High Demand" (503) or "Rate Limit" (429)
            if response.status_code in [503, 429]:
                wait_time = (attempt + 1) * 3 # Wait 3s, then 6s
                print(f"Gemini Busy. Retrying in {wait_time}s...")
                time.sleep(wait_time)
                continue

            # Handle other errors (400, 404, etc.)
            return jsonify({
                "success": False, 
                "error": res_json.get('error', {}).get('message', 'API Error')
            }), response.status_code

        except Exception as e:
            if attempt == max_retries - 1:
                return jsonify({"success": False, "error": str(e)}), 500
            time.sleep(2)

    return jsonify({"success": False, "error": "AI servers are currently overloaded. Try again in 30 seconds."}), 503