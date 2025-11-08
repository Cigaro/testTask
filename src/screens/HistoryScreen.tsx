// src/screens/HistoryScreen.tsx
import React, { useContext, useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getLogs } from "../services/logs";
import { LogItem } from "../types/task";
import { ThemeContext } from "../context/ThemeContext";
import { useIsFocused } from "@react-navigation/native";

const FILTERS: (LogItem["action"] | "all")[] = [
  "all",
  "create",
  "update",
  "delete",
  "sync",
];

const HistoryScreen: React.FC = () => {
  const { theme } = useContext(ThemeContext);
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");
  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) load();
  }, [isFocused]);

  const load = async () => {
    setLoading(true);
    try {
      const l = await getLogs();
      setLogs(l);
    } catch (e) {
      console.warn("getLogs error", e);
    } finally {
      setLoading(false);
    }
  };

  const filtered = filteredLogs(logs, filter);

  function filteredLogs(logs: LogItem[], filter: string) {
    if (filter === "all") return logs;
    if (filter === "update") {
      return logs.filter(
        (x) => x.action === "update" || x.action === "status_change"
      );
    }
    return logs.filter((x) => x.action === filter);
  }

  return (
    <SafeAreaView style={[styles.safe, theme === "dark" && styles.darkSafe]}>
      <View style={styles.header}>
        <Text
          style={[styles.title, { color: theme === "dark" ? "#fff" : "#000" }]}
        >
          История действий
        </Text>
      </View>

      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f}
            onPress={() => setFilter(f)}
            style={[
              styles.filterBtn,
              filter === f && { backgroundColor: "#2563eb" },
              { backgroundColor: theme === "dark" ? "#222" : "#eee" },
            ]}
          >
            <Text
              style={{
                color:
                  filter === f ? (theme === "dark" ? "#fff" : "#000") : "#888",
                fontWeight: "600",
              }}
            >
              {f === "all" ? "Все" : f}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 24 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={
            <Text
              style={{
                textAlign: "center",
                color: theme === "dark" ? "#fff" : "#000",
              }}
            >
              Лог пуст
            </Text>
          }
          renderItem={({ item }) => (
            <View
              style={[
                styles.item,
                { backgroundColor: theme === "dark" ? "#111" : "#f7f7f7" },
              ]}
            >
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontWeight: "700",
                    color: theme === "dark" ? "#fff" : "#000",
                  }}
                >
                  {item.action}
                </Text>
                <Text
                  style={{
                    color: theme === "dark" ? "#ccc" : "#444",
                    marginTop: 4,
                  }}
                >
                  {item.timestamp}
                </Text>
                {item.details && (
                  <Text
                    style={{
                      marginTop: 6,
                      color: theme === "dark" ? "#fff" : "#000",
                    }}
                  >
                    {JSON.stringify(item.details)}
                  </Text>
                )}
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  darkSafe: { backgroundColor: "#111" },
  header: {
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "#e5e5e5",
  },
  title: { fontSize: 20, fontWeight: "700" },
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filterBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
  },
  item: { padding: 12, borderRadius: 8, marginBottom: 10 },
});

export default HistoryScreen;
