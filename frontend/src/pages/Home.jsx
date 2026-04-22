import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import ThemeToggle from "./ThemeToggle";
// ─── SAME TOKENS (copy EXACT from Dashboard) ───
const TOKEN = {
  teal: "#028391",
  navy: "#01204E",
  cream: "#F6DCAC",
  orange: "#F85525",
  peach: "#FAA968",
};

export default function Home({ theme, setTheme }) {
  const navigate = useNavigate();
  const isDark = theme === "dark";

  return (
    <div
      className="min-h-screen transition-colors duration-500"
      style={{
        backgroundColor: isDark ? TOKEN.navy : TOKEN.cream,
        color: isDark ? TOKEN.cream : TOKEN.navy,
      }}
    >
      {/* NAVBAR */}
      <nav className="flex justify-between items-center px-8 py-6 max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold tracking-tight">
          CodeBoard
        </h1>

        <div className="flex items-center gap-6">

          {/* ✅ SAME STYLE TOGGLE AS DASHBOARD */}
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

          <Link to="/login" className="hover:opacity-80">
            Login
          </Link>

          <Link
            to="/register"
            className="px-5 py-2 rounded-full text-white hover:scale-105 transition"
            style={{ backgroundColor: TOKEN.orange }}
          >
            Register
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="text-center px-6 py-24 max-w-6xl mx-auto relative overflow-hidden">

        {/* BACKGROUND GRADIENT */}
        <div
          className="absolute inset-0 -z-10 opacity-30 blur-3xl"
          style={{
            background: `linear-gradient(135deg, ${TOKEN.teal}, ${TOKEN.peach}, ${TOKEN.orange})`,
          }}
        />

        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl md:text-7xl font-bold mb-6 leading-tight"
        >
          Build. Collaborate. Create.
        </motion.h1>

        <p className="text-lg max-w-xl mx-auto opacity-80 mb-10">
          Real-time whiteboard, live coding, and chat — powered by a seamless collaborative experience.
        </p>

        <div className="flex justify-center gap-4">
          <button
            onClick={() => navigate("/register")}
            className="px-8 py-3 rounded-full text-white text-lg shadow-lg hover:scale-105 transition"
            style={{ backgroundColor: TOKEN.orange }}
          >
            Get Started
          </button>

          <button
            onClick={() => navigate("/login")}
            className="px-8 py-3 rounded-full border transition"
            style={{
              borderColor: isDark ? TOKEN.cream : TOKEN.navy,
            }}
          >
            Login
          </button>
        </div>
      </section>

      {/* FEATURES */}
      <section className="px-8 py-20 max-w-6xl mx-auto grid md:grid-cols-3 gap-8">
        {[
          {
            title: "Whiteboard",
            desc: "Draw and brainstorm ideas visually",
            color: TOKEN.teal,
          },
          {
            title: "Live Coding",
            desc: "Collaborate with shared cursors",
            color: TOKEN.peach,
          },
          {
            title: "Chat",
            desc: "Instant communication",
            color: TOKEN.orange,
          },
        ].map((f, i) => (
          <motion.div
            key={i}
            whileHover={{ y: -10 }}
            className="p-6 rounded-2xl backdrop-blur-xl shadow-xl"
            style={{
              backgroundColor: isDark
                ? "rgba(255,255,255,0.08)"
                : "rgba(255,255,255,0.7)",
            }}
          >
            <div
              className="w-12 h-12 rounded-xl mb-4"
              style={{ backgroundColor: f.color }}
            />

            <h3 className="text-xl font-semibold mb-2">
              {f.title}
            </h3>

            <p className="opacity-70">{f.desc}</p>
          </motion.div>
        ))}
      </section>

      {/* SHOWCASE */}
      <section className="px-8 py-20 max-w-5xl mx-auto">
        <div
          className="p-10 rounded-3xl text-white shadow-2xl"
          style={{
            background: `linear-gradient(135deg, ${TOKEN.teal}, ${TOKEN.peach}, ${TOKEN.orange})`,
          }}
        >
          <h2 className="text-3xl font-bold mb-4">
            Everything in One Workspace
          </h2>

          <p className="mb-6 opacity-90">
            No switching tabs. No distractions. Just pure productivity.
          </p>

          <button
            onClick={() => navigate("/dashboard")}
            className="px-6 py-3 rounded-full bg-white text-black hover:scale-105 transition"
          >
            Explore Dashboard
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer
        className="text-center py-10 border-t text-sm opacity-70"
        style={{
          borderColor: isDark
            ? "rgba(255,255,255,0.1)"
            : "rgba(0,0,0,0.1)",
        }}
      >
        © {new Date().getFullYear()} CodeBoard
      </footer>
    </div>
  );
}