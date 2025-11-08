import React, { useEffect, useState, useContext } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { RouteProp, useNavigation } from "@react-navigation/native";
import MapView, { Marker } from "react-native-maps";

import { Task } from "../types/task";
import { loadFromStorage, saveToStorage, TASKS_KEY } from "../services/storage";
import { cancelTaskNotification } from "../services/notifications";
import { pushLog } from "../services/logs";
import { pushToOutbox } from "../services/sync";
import { ThemeContext } from "../context/ThemeContext";

const TaskDetailsScreen: React.FC<{ route: RouteProp<any, any> }> = ({
  route,
}) => {
  const navigation = useNavigation();
  const { theme } = useContext(ThemeContext);
  const { taskId } = route.params || {};
  const [task, setTask] = useState<Task | null>(null);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    (async () => {
      const tasks = (await loadFromStorage<Task[]>(TASKS_KEY)) || [];
      const t = tasks.find((x) => x.id === taskId) || null;
      setTask(t);
    })();
  }, [taskId]);

  if (!task)
    return (
      <SafeAreaView style={[styles.safe, theme === "dark" && styles.darkSafe]}>
        <Text style={{ color: theme === "dark" ? "#fff" : "#000" }}>
          Задача не найдена
        </Text>
      </SafeAreaView>
    );

  const updateStatus = async (newStatus: Task["status"]) => {
    const tasks = (await loadFromStorage<Task[]>(TASKS_KEY)) || [];
    const idx = tasks.findIndex((t) => t.id === task.id);
    if (idx === -1) return;
    const old = tasks[idx];
    tasks[idx] = {
      ...old,
      status: newStatus,
      updatedAt: new Date().toISOString(),
    };
    await saveToStorage<Task[]>(TASKS_KEY, tasks);
    await pushToOutbox("update", tasks[idx]);
    await pushLog({
      taskId: task.id,
      action: "status_change",
      details: { from: old.status, to: newStatus },
    });
    setTask(tasks[idx]);
    Alert.alert(`Статус обновлён на`, `${newStatus}`);
  };

  const removeTask = async () => {
    Alert.alert("Удалить", "Удалить задачу?", [
      { text: "Отмена", style: "cancel" },
      {
        text: "Удалить",
        style: "destructive",
        onPress: async () => {
          if (task?.notificationId)
            await cancelTaskNotification(task.notificationId);
          const tasks = (await loadFromStorage<Task[]>(TASKS_KEY)) || [];
          const rest = tasks.filter((t) => t.id !== task.id);
          await saveToStorage<Task[]>(TASKS_KEY, rest);
          await pushToOutbox("delete", { id: task.id });
          await pushLog({ taskId: task.id, action: "delete" });
          navigation.goBack();
        },
      },
    ]);
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
        return theme === "dark" ? "#fff" : "#000";
    }
  };

  return (
    <SafeAreaView
      style={[
        styles.safe,
        theme === "dark" && styles.darkSafe,
        styles.container,
      ]}
    >
      <Text
        style={[styles.title, { color: theme === "dark" ? "#fff" : "#000" }]}
      >
        {task.title}
      </Text>
      <Text style={{ color: theme === "dark" ? "#fff" : "#000" }}>
        {new Date(task.date).toLocaleString()}
      </Text>
      <Text style={{ marginTop: 8, color: theme === "dark" ? "#fff" : "#000" }}>
        {task.description}
      </Text>

      {task.location?.lat && task.location?.lng && (
        <View style={{ height: 200, marginTop: 12 }}>
          <MapView
            style={{ flex: 1 }}
            initialRegion={{
              latitude: task.location.lat!,
              longitude: task.location.lng!,
              latitudeDelta: 0.02,
              longitudeDelta: 0.02,
            }}
          >
            <Marker
              coordinate={{
                latitude: task.location.lat!,
                longitude: task.location.lng!,
              }}
              title={task.title}
            />
          </MapView>
        </View>
      )}

      <Text
        style={{
          marginTop: 12,
          fontWeight: "700",
          color: theme === "dark" ? "#fff" : "#000",
        }}
      >
        Вложения
      </Text>
      {task.attachments?.map((a) => (
        <View key={a.id} style={{ marginTop: 8 }}>
          {a.mimeType?.startsWith("image") ? (
            <Image
              source={{ uri: a.uri }}
              style={{ width: 200, height: 120 }}
            />
          ) : (
            <Text style={{ color: theme === "dark" ? "#fff" : "#000" }}>
              {a.name}
            </Text>
          )}
        </View>
      ))}

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
          {
            backgroundColor: "#ef4444",
            marginBottom: insets.bottom > 0 ? insets.bottom : 12,
          },
        ]}
        onPress={removeTask}
      >
        <Text style={[styles.actionText, { color: "#fff" }]}>Удалить</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  darkSafe: { backgroundColor: "#111" },
  container: { padding: 16, position: "relative" },
  title: { fontSize: 20, fontWeight: "700" },
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
    bottom: 0,
    left: 16,
    right: 16,
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
