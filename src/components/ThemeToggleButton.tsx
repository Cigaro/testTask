import React, { useContext } from "react";
import { TouchableOpacity, Text } from "react-native";
import { ThemeContext } from "../context/ThemeContext";

export const ThemeToggleButton: React.FC = () => {
  const { theme, toggle } = useContext(ThemeContext);

  return (
    <TouchableOpacity onPress={toggle} style={{ paddingHorizontal: 10 }}>
      <Text style={{ color: theme === "dark" ? "#fff" : "#000" }}>
        {theme === "dark" ? "🌙" : "☀️"}
      </Text>
    </TouchableOpacity>
  );
};
