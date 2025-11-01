import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Button,
  Alert,
  TouchableOpacity,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/AppNavigator";
import { Task } from "../types/task";
import { SafeAreaView } from "react-native-safe-area-context";

type RouteProps = RouteProp<RootStackParamList, "TaskDetails">;
type Navigation = NativeStackNavigationProp<RootStackParamList, "TaskDetails">;

const TaskDetailsScreen = () => {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<Navigation>();
  const [task, setTask] = useState<Task | null>(null);

  useEffect(() => {
    loadTask();
  }, []);

  const loadTask = async () => {
    const json = await AsyncStorage.getItem("tasks");
    if (!json) return;
    const tasks = JSON.parse(json);
    const found = tasks.find((t: Task) => t.id === route.params.taskId);
    setTask(found);
  };

  const updateStatus = async (newStatus: Task["status"]) => {
    if (!task) return;
    const json = await AsyncStorage.getItem("tasks");
    if (!json) return;

    const tasks = JSON.parse(json).map((t: Task) =>
      t.id === task.id ? { ...t, status: newStatus } : t
    );
    await AsyncStorage.setItem("tasks", JSON.stringify(tasks));
    setTask({ ...task, status: newStatus });
    Alert.alert("Статус обновлён", `Задача отмечена как ${newStatus}`);
  };

  const deleteTask = async () => {
    if (!task) return;
    const json = await AsyncStorage.getItem("tasks");
    if (!json) return;

    const updated = JSON.parse(json).filter((t: Task) => t.id !== task.id);
    await AsyncStorage.setItem("tasks", JSON.stringify(updated));
    Alert.alert("Удалено", "Задача успешно удалена");
    navigation.goBack();
  };

  if (!task) {
    return (
      <View style={styles.container}>
        <Text>Задача не найдена</Text>
      </View>
    );
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#fff", position: "relative" }}
    >
      <View style={styles.container}>
        <Text style={styles.title}>{task.title}</Text>
        <Text style={styles.label}>Описание:</Text>
        <Text style={styles.text}>{task.description || "—"}</Text>

        <Text style={styles.label}>Адрес:</Text>
        <Text style={styles.text}>{task.location || "—"}</Text>

        <Text style={styles.label}>Дата и время:</Text>
        <Text style={styles.text}>{task.date}</Text>

        <Text style={styles.label}>Статус:</Text>
        <Text style={styles.status}>{task.status}</Text>

        <View style={styles.buttons}>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: "#facc15" }]}
            onPress={() => updateStatus("In Progress")}
          >
            <Text style={styles.buttonText}>In Progress</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: "#22c55e" }]}
            onPress={() => updateStatus("Completed")}
          >
            <Text style={styles.buttonText}>Completed</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: "#ef4444" }]}
            onPress={() => updateStatus("Cancelled")}
          >
            <Text style={styles.buttonText}>Cancelled</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={[
            styles.actionButton,
            { marginTop: 10, backgroundColor: "#ef4444" },
          ]}
          onPress={deleteTask}
        >
          <Text style={[styles.actionText, { color: "#fff" }]}>Удалить</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 16 },
  label: { fontWeight: "600", marginTop: 8 },
  text: { fontSize: 16 },
  status: { fontSize: 16, marginVertical: 8, color: "#2563eb" },
  buttons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  button: {
    flex: 1,
    marginHorizontal: 4,
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "600" },
  actionButton: {
    position: "absolute",
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: "#2563eb",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  actionText: {
    fontSize: 16,
    fontWeight: "500",
  },
});

export default TaskDetailsScreen;
