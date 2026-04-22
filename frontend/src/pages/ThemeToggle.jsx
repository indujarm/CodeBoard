import { Sun, Moon } from "lucide-react";

const TOKEN = {
  teal: "#028391",
  navy: "#01204E",
  cream: "#F6DCAC",
  orange: "#F85525",
  peach: "#FAA968",
};

export default function ThemeToggle({ isDark, setTheme }) {
  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={`w-9 h-9 flex items-center justify-center rounded-xl border transition
        ${
          isDark
            ? "border-[#028391]/30 hover:bg-[#028391]/20 text-[#F6DCAC]"
            : "border-[#FAA968]/60 hover:bg-[#FAA968]/30 text-[#01204E]"
        }`}
    >
      {isDark ? <Sun size={15} /> : <Moon size={15} />}
    </button>
  );
}