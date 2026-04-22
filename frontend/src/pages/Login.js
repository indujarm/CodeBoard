import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import loginImg from "../images/Login.png";
import { Eye, EyeOff } from "lucide-react";

// ─── SAME TOKENS ───
const TOKEN = {
  teal: "#028391",
  navy: "#01204E",
  cream: "#F6DCAC",
  orange: "#F85525",
  peach: "#FAA968",
};

function Login({ theme, setTheme }) {
  const isDark = theme === "dark";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:5000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();

      if (data.success) {
        sessionStorage.clear();
        sessionStorage.setItem("token", data.token);
        sessionStorage.setItem("username", data.username);
        localStorage.setItem("email", data.email);

        navigate("/dashboard");
      } else {
        setError(data.message);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    }

    setLoading(false);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center transition-colors duration-300"
      style={{
        background: `linear-gradient(135deg, ${TOKEN.navy}, ${TOKEN.teal}, ${TOKEN.orange})`,
        color: isDark ? TOKEN.cream : TOKEN.navy,
      }}
    >
      <div
        className="w-[90%] md:w-[70%] lg:w-[60%] h-[80vh]
        flex rounded-3xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.2)]"
      >
        {/* LEFT SIDE */}
        <div
          className="hidden md:flex w-1/2 flex-col items-center justify-center p-10"
          style={{
            background: isDark
              ? "rgba(2,131,145,0.15)"
              : "rgba(1,32,78,0.25)",
          }}
        >
          <div className="w-full flex justify-center items-center h-[70%]">
            <img
              src={loginImg}
              alt="Login Visual"
              className="max-h-full max-w-[90%] object-contain drop-shadow-2xl"
            />
          </div>

          <h1 className="text-3xl font-bold mb-2" style={{ color: TOKEN.cream }}>
            CodeBoard
          </h1>

          <p className="opacity-80 text-center max-w-sm" style={{ color: TOKEN.cream }}>
            Collaborate. Code. Create — Together.
          </p>
        </div>

        {/* RIGHT SIDE */}
        <div
          className="w-full md:w-1/2 flex items-center justify-center relative backdrop-blur-xl"
          style={{
            backgroundColor: isDark
              ? "rgba(1,32,78,0.85)"
              : "rgba(246,220,172,0.9)",
          }}
        >
          {/* ✅ DASHBOARD STYLE TOGGLE */}
          <div className="absolute top-5 right-5">
{/* ✅ EXACT SAME DASHBOARD TOGGLE */}
<button
  onClick={() => setTheme(isDark ? "light" : "dark")}
  title="Toggle theme"
  className={`w-9 h-9 flex items-center justify-center rounded-xl border transition
    ${isDark
      ? "border-[#028391]/30 hover:bg-[#028391]/20 text-[#F6DCAC]"
      : "border-[#FAA968]/60 hover:bg-[#FAA968]/30 text-[#01204E]"}`}
>
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {isDark ? (
      <>
        {/* SUN ICON */}
        <path d="M12 2v2" />
        <path d="M12 20v2" />
        <path d="M4.22 4.22l1.42 1.42" />
        <path d="M18.36 18.36l1.42 1.42" />
        <path d="M2 12h2" />
        <path d="M20 12h2" />
        <path d="M4.22 19.78l1.42-1.42" />
        <path d="M18.36 5.64l1.42-1.42" />
        <path d="M12 6a6 6 0 100 12 6 6 0 000-12z" />
      </>
    ) : (
      <>
        {/* MOON ICON */}
        <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
      </>
    )}
  </svg>
</button>
          </div>

          <form
            onSubmit={handleSubmit}
            className="w-[80%] max-w-sm space-y-4"
          >
            <h2
              className="text-2xl font-bold text-center"
              style={{ color: isDark ? TOKEN.cream : TOKEN.navy }}
            >
              Login
            </h2>

            {error && (
              <div className="text-sm text-center" style={{ color: TOKEN.orange }}>
                {error}
              </div>
            )}

            <input
              placeholder="Username or Email"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-3 rounded-lg outline-none"
              style={{
                backgroundColor: isDark
                  ? "rgba(255,255,255,0.08)"
                  : "rgba(255,255,255,0.6)",
              }}
            />

            {/* PASSWORD */}
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 rounded-lg outline-none"
                style={{
                  backgroundColor: isDark
                    ? "rgba(255,255,255,0.08)"
                    : "rgba(255,255,255,0.6)",
                }}
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 transition"
                style={{
                  color: isDark ? "rgba(246,220,172,0.5)" : "rgba(1,32,78,0.5)",
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <button
              disabled={loading}
              className="w-full py-3 rounded-full text-white transition disabled:opacity-50"
              style={{ backgroundColor: TOKEN.orange }}
            >
              {loading ? "Logging in..." : "Login"}
            </button>

            <p
              className="text-center text-sm opacity-70"
              style={{ color: isDark ? TOKEN.cream : TOKEN.navy }}
            >
              Not registered?{" "}
              <Link
                to="/register"
                className="underline transition"
                style={{ color: TOKEN.teal }}
              >
                Register
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;