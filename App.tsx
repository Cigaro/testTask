import React, { useEffect } from "react";
import { Provider as PaperProvider } from "react-native-paper";
import AppNavigator from "./src/navigation/AppNavigator";
import { ThemeProvider } from "./src/context/ThemeContext";
import { syncOutboxIfOnline } from "./src/services/sync";
import NetInfo from "@react-native-community/netinfo";

export default function App() {
  useEffect(() => {
    syncOutboxIfOnline();

    const sub = NetInfo.addEventListener((state) => {
      if (state.isConnected) syncOutboxIfOnline();
    });
    return () => sub();
  }, []);
  return (
    <PaperProvider>
      <ThemeProvider>
        <AppNavigator />
      </ThemeProvider>
    </PaperProvider>
  );
}
