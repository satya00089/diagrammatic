import React from "react";
import { FiMoon, FiSun } from "react-icons/fi";
import { useTheme } from "../hooks/useTheme";

const ThemeSwitcher: React.FC = () => {
  const { theme, setTheme } = useTheme();

  return (
    <button
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
    >
      {theme === "light" ? <FiMoon size={18} /> : <FiSun size={18} />}
    </button>
  );
};

export default ThemeSwitcher;
