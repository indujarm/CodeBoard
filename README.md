# 🚀 CodeBoard

![React](https://img.shields.io/badge/Frontend-React-blue)
![Backend](https://img.shields.io/badge/Backend-Flask-green)
![Status](https://img.shields.io/badge/Status-Active-success)
![License](https://img.shields.io/badge/License-MIT-yellow)

> 🧠 A full-stack collaborative workspace for real-time coding, whiteboarding, and seamless communication.



## 🌐 Overview

CodeBoard is designed to eliminate the need for multiple tools by combining coding, brainstorming, and communication into one unified platform.

It enables teams to collaborate efficiently through shared rooms with integrated tools like a whiteboard, code editor, chat system, and replay functionality.

---

## ✨ Features

* 🔐 Secure Authentication (Login & Register)
* 🧑‍🤝‍🧑 Create & Join Rooms using Room ID
* 📊 Smart Dashboard (Search, Rename, Delete Rooms)
* ✏️ Live Collaborative Whiteboard
* 💻 Shared Code Editor
* 💬 Integrated Chat System
* 🔁 Replay Feature (Review past activity)
* 🌗 Light/Dark Theme Toggle

---

## 🛠️ Tech Stack

### 🎨 Frontend

* React
* Tailwind CSS
* Axios

### ⚙️ Backend

* Flask *(or Node.js — update if needed)*
* REST APIs

---

## 📦 Dependencies

### 🔹 Frontend

Install required packages:

```bash
cd frontend
npm install
```

Main packages used:

* react
* react-dom
* react-router-dom
* axios
* tailwindcss

---

### 🔹 Backend

If using Python (Flask):

```bash
cd backend
pip install -r requirements.txt
```

👉 Generate requirements file (if not added):

```bash
pip freeze > requirements.txt
```

---

## 📂 Project Structure

```
CodeBoard/
│
├── frontend/        # React Application
├── backend/         # Server & APIs
├── docs/            # Screenshots & demo GIF
└── README.md
```

---

## ⚙️ Installation & Setup

### 🔹 Clone Repository

```bash
git clone https://github.com/indujarm/CodeBoard.git
cd CodeBoard
```

---

### 🔹 Backend Setup

```bash
cd backend
pip install -r requirements.txt
python app.py
```

---

### 🔹 Frontend Setup

```bash
cd frontend
npm install
npm start
```

---

## 🌐 Environment Variables

Create a `.env` file inside backend:

```
PORT=5000
MONGO_URI=your_database_url
JWT_SECRET=your_secret_key
```

---

## 📸 Screenshots

> *(Add images inside `/docs` folder)*

```
docs/landing.png  
docs/dashboard.png  
docs/room.png  
```

---

## 🚀 Future Enhancements

* ⚡ Real-time collaboration using WebSockets
* 👆 Live cursors
* 💾 Persistent storage
* 🎥 Video/audio communication

---

## 👨‍💻 Author

**Induja R.M**

---

## 📄 License

This project is licensed under the **MIT License**

---

## ⭐ Support

If you like this project, consider giving it a ⭐ on GitHub!
