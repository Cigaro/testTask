import React, { useEffect } from "react";
import { Provider as PaperProvider } from "react-native-paper";
import AppNavigator from "./src/navigation/AppNavigator";
import { ThemeProvider } from "./src/context/ThemeContext";
import NetInfo from "@react-native-community/netinfo";

import { syncOutboxIfOnline, migrateTasksToOutbox } from "./src/services/sync";

export default function App() {
  useEffect(() => {
    (async () => {
      try {
        await migrateTasksToOutbox();
        await syncOutboxIfOnline();
      } catch (e) {
        console.warn("[app] migrate/sync failed", e);
      }
    })();

    const sub = NetInfo.addEventListener((state) => {
      if (state.isConnected) {
        syncOutboxIfOnline();
      }
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
