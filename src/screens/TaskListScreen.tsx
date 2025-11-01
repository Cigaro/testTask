import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useIsFocused } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/AppNavigator";
import { SafeAreaView } from "react-native-safe-area-context";
import { Task } from "../types/task";

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, "TaskList">;
};

const TaskListScreen: React.FC<Props> = ({ navigation }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [dateAsc, setDateAsc] = useState(true);
  const [statusAsc, setStatusAsc] = useState(true);
  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) loadTasks();
  }, [isFocused]);

  const loadTasks = async () => {
    const json = await AsyncStorage.getItem("tasks");
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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <View style={styles.container}>
        <TouchableOpacity style={styles.sortButton} onPress={sortByDate}>
          <Text style={styles.sortText}>
            Сортировать по дате {dateAsc ? "↑" : "↓"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.sortButton} onPress={sortByStatus}>
          <Text style={styles.sortText}>
            Сортировать по статусу {statusAsc ? "↑" : "↓"}
          </Text>
        </TouchableOpacity>

        <FlatList
          data={tasks}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.task}
              onPress={() =>
                navigation.navigate("TaskDetails", { taskId: item.id })
              }
            >
              <View>
                <Text style={styles.title}>{item.title}</Text>
                <Text>{item.date}</Text>
                <Text style={{ color: getStatusColor(item.status) }}>
                  Status: {item.status}
                </Text>
              </View>
              <Text style={styles.link}>Подробнее</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={<Text>Задач пока нет</Text>}
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
  container: { flex: 1, padding: 16 },
  link: { color: "#2563eb", fontWeight: "600" },
  task: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#f1f1f1",
    padding: 12,
    marginVertical: 6,
    borderRadius: 8,
    alignItems: "center",
  },
  title: { fontWeight: "600", fontSize: 16 },
  sortButton: {
    backgroundColor: "#e5e7eb",
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: "center",
  },
  sortText: {
    fontSize: 16,
    fontWeight: "500",
  },
});

export default TaskListScreen;
