import React, { createContext, useEffect, useState } from "react";
import { Appearance } from "react-native";
import { loadFromStorage, saveToStorage, THEME_KEY } from "../services/storage";

export type ThemeType = "light" | "dark";
export const ThemeContext = createContext<{
  theme: ThemeType;
  toggle: () => void;
}>({
  theme: "light",
  toggle: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [theme, setTheme] = useState<ThemeType>("light");

  useEffect(() => {
    (async () => {
      const saved = await loadFromStorage<ThemeType>(THEME_KEY);
      if (saved) setTheme(saved);
      else setTheme(Appearance.getColorScheme() === "dark" ? "dark" : "light");
    })();
  }, []);

  const toggle = async () => {
    const next: ThemeType = theme === "light" ? "dark" : "light";
    setTheme(next);
    await saveToStorage(THEME_KEY, next);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
};
