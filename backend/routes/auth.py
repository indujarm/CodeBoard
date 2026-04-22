from flask import Blueprint, request, jsonify
import sqlite3
from utils.password_hash import hash_password, check_password
from utils.jwt_helper import generate_token
 
auth = Blueprint("auth", __name__)
 
@auth.route("/register", methods=["POST"])
def register():
    data = request.json
    identifier = data["username"]  
    email = data["email"]
    password = data["password"]
    confirm_password = data["confirmPassword"]
 
    # ✅ check password match
    if password != confirm_password:
        return jsonify({"success": False, "message": "Passwords do not match"}), 400
 
    conn = sqlite3.connect("users.db")
    cursor = conn.cursor()
 
    try:
        cursor.execute(
            "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
            (identifier, email, hash_password(password))
        )
        conn.commit()
        return jsonify({"success": True, "message": "User registered"})
   
    except sqlite3.IntegrityError:
        return jsonify({"success": False, "message": "Username or Email already exists"}), 400
   
    finally:
        conn.close()
 
@auth.route("/login", methods=["POST"])
def login():
    data = request.json
    username, password = data["username"], data["password"]
 
    conn = sqlite3.connect("users.db")
    cursor = conn.cursor()
    cursor.execute(
        "SELECT username, email, password FROM users WHERE username=? OR email=?",
        (username, username)
    )
    row = cursor.fetchone()

    if row and check_password(password, row[2]):
        token = generate_token(row[0])  # real username

        return jsonify({
            "success": True,
            "token": token,
            "username": row[0],
            "email": row[1]
        })    
    else:
        return jsonify({"success": False, "message": "Invalid credentials"}), 401