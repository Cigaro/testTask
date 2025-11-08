import React, { useContext, useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Switch,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useIsFocused } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/AppNavigator";
import { SafeAreaView } from "react-native-safe-area-context";
import { Task } from "../types/task";
import { TASKS_KEY } from "../services/storage";
import { ThemeContext } from "../context/ThemeContext";
import { syncOutboxIfOnline } from "../services/sync";

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, "TaskList">;
};

const TaskListScreen: React.FC<Props> = ({ navigation }) => {
  const { theme, toggle } = useContext(ThemeContext);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [dateAsc, setDateAsc] = useState(true);
  const [statusAsc, setStatusAsc] = useState(true);
  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) loadTasks();
  }, [isFocused]);

  const loadTasks = async () => {
    const json = await AsyncStorage.getItem(TASKS_KEY);
    if (json) setTasks(JSON.parse(json));
  };

  const sortByDate = () => {
    const sorted = [...tasks].sort((a, b) =>
      dateAsc
        ? new Date(a.date).getTime() - new Date(b.date).getTime()
        : new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    setTasks(sorted);
    setDateAsc(!dateAsc);
  };

  const sortByStatus = () => {
    const order = ["New", "In Progress", "Completed", "Cancelled"];
    const sorted = [...tasks].sort((a, b) => {
      const diff = order.indexOf(a.status) - order.indexOf(b.status);
      return statusAsc ? diff : -diff;
    });
    setTasks(sorted);
    setStatusAsc(!statusAsc);
  };

  const getStatusColor = (status: Task["status"]) => {
    switch (status) {
      case "New":
        return "#2563eb";
      case "In Progress":
        return "#f59e0b";
      case "Completed":
        return "#16a34a";
      case "Cancelled":
        return "#dc2626";
      default:
        return "#000";
    }
  };
  const forceSync = async () => {
    const result = await syncOutboxIfOnline();
    console.log("Sync result:", result ? "успешно" : "не удалось");
  };
  useEffect(() => {
    forceSync();
  }, []);

  return (
    <SafeAreaView
      style={[
        styles.safe,
        { backgroundColor: theme === "dark" ? "#111" : "#fff" },
      ]}
    >
      <View style={styles.header}>
        <Text
          style={[
            styles.headerText,
            { color: theme === "dark" ? "#fff" : "#000" },
          ]}
        >
          Мои задачи
        </Text>
      </View>
      <View
        style={{
          flexDirection: "row",
          gap: 8,
          marginBottom: 12,
          paddingHorizontal: 16,
        }}
      >
        <TouchableOpacity
          style={[styles.sortButton, { flex: 1, backgroundColor: "#10b981" }]}
          onPress={() => navigation.navigate("Map")}
        >
          <Text style={[styles.sortText, { color: "#fff" }]}>
            Показать на карте
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.sortButton,
            { flex: 1, marginLeft: 8, backgroundColor: "#10b981" },
          ]}
          onPress={() => navigation.navigate("History")}
        >
          <Text
            style={[styles.sortText, { color: "#fff", textAlign: "center" }]}
          >
            История
          </Text>
        </TouchableOpacity>
      </View>
      <View style={styles.container}>
        <TouchableOpacity
          style={[
            styles.sortButton,
            { backgroundColor: theme === "dark" ? "#333" : "#e5e7eb" },
          ]}
          onPress={sortByDate}
        >
          <Text
            style={[
              styles.sortText,
              { color: theme === "dark" ? "#fff" : "#000" },
            ]}
          >
            Сортировать по дате {dateAsc ? "↑" : "↓"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.sortButton,
            { backgroundColor: theme === "dark" ? "#333" : "#e5e7eb" },
          ]}
          onPress={sortByStatus}
        >
          <Text
            style={[
              styles.sortText,
              { color: theme === "dark" ? "#fff" : "#000" },
            ]}
          >
            Сортировать по статусу {statusAsc ? "↑" : "↓"}
          </Text>
        </TouchableOpacity>

        <FlatList
          data={tasks}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.task,
                { backgroundColor: theme === "dark" ? "#222" : "#f1f1f1" },
              ]}
              onPress={() =>
                navigation.navigate("TaskDetails", { taskId: item.id })
              }
            >
              <View>
                <Text
                  style={[
                    styles.title,
                    { color: theme === "dark" ? "#fff" : "#000" },
                  ]}
                >
                  {item.title}
                </Text>
                <Text style={{ color: theme === "dark" ? "#ccc" : "#000" }}>
                  {item.date}
                </Text>
                <Text style={{ color: getStatusColor(item.status) }}>
                  Status: {item.status}
                </Text>
              </View>
              <Text style={styles.link}>Подробнее</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text
              style={{
                color: theme === "dark" ? "#fff" : "#000",
                textAlign: "center",
                marginTop: 20,
              }}
            >
              Задач пока нет
            </Text>
          }
        />

        <TouchableOpacity
          style={[
            styles.sortButton,
            { marginTop: 10, backgroundColor: "#2563eb" },
          ]}
          onPress={() => navigation.navigate("AddTask")}
        >
          <Text style={[styles.sortText, { color: "#fff" }]}>
            Добавить задачу
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerText: { fontSize: 20, fontWeight: "700" },
  switchContainer: { flexDirection: "row", alignItems: "center" },
  container: { flex: 1, paddingHorizontal: 16 },
  link: { color: "#2563eb", fontWeight: "600" },
  task: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 12,
    marginVertical: 6,
    borderRadius: 8,
    alignItems: "center",
  },
  title: { fontWeight: "600", fontSize: 16 },
  sortButton: {
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: "center",
  },
  sortText: { fontSize: 16, fontWeight: "500" },
});

export default TaskListScreen;
