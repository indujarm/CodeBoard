import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useTheme } from "./pages/useTheme";
import { useState } from "react";
import { useEffect } from "react";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Whiteboard from "./pages/Whiteboard";

export default function App() {
  const [theme, setTheme] = useState("light");
  useEffect(() => {
  if (theme === "dark") {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
}, [theme]);
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home  theme={theme} setTheme={setTheme}/>} />
<Route path="/login" element={<Login theme={theme} setTheme={setTheme} />} />
<Route path="/register" element={<Register theme={theme} setTheme={setTheme} />} />
<Route path="/dashboard" element={<Dashboard theme={theme} setTheme={setTheme} />} />
<Route path="/whiteboard/:roomId" element={<Whiteboard theme={theme} setTheme={setTheme} />} />
      </Routes>
    </Router>
  );
}