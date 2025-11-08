// src/screens/MapScreen.tsx
import React, { useEffect, useState, useContext } from "react";
import { View, Text, StyleSheet } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";
import { loadFromStorage } from "../services/storage";
import { Task } from "../types/task";
import { ThemeContext } from "../context/ThemeContext";
import { useNavigation } from "@react-navigation/native";
import { TASKS_KEY } from "../services/storage";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/AppNavigator";

type MapScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Map"
>;

const MapScreen: React.FC = () => {
  const { theme } = useContext(ThemeContext);
  const [tasks, setTasks] = useState<Task[]>([]);
  const navigation = useNavigation<MapScreenNavigationProp>();
  useEffect(() => {
    (async () => {
      const t = (await loadFromStorage<Task[]>(TASKS_KEY)) || [];
      setTasks(t.filter((x) => !!x.location?.lat && !!x.location?.lng));
    })();
  }, []);

  if (!tasks.length) {
    return (
      <SafeAreaView style={[styles.safe, theme === "dark" && styles.darkSafe]}>
        <View style={{ padding: 16 }}>
          <Text style={{ color: theme === "dark" ? "#fff" : "#000" }}>
            Нет задач с геолокацией
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const first = tasks[0];
  const initialRegion = {
    latitude: first.location!.lat!,
    longitude: first.location!.lng!,
    latitudeDelta: 0.5,
    longitudeDelta: 0.5,
  };

  return (
    <SafeAreaView style={[styles.safe, theme === "dark" && styles.darkSafe]}>
      <MapView style={{ flex: 1 }} initialRegion={initialRegion}>
        {tasks.map((task) => (
          <Marker
            key={task.id}
            coordinate={{
              latitude: task.location!.lat!,
              longitude: task.location!.lng!,
            }}
            title={task.title}
            description={task.description}
            onCalloutPress={() =>
              navigation.navigate("TaskDetails" as any, { taskId: task.id })
            }
          />
        ))}
      </MapView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  darkSafe: { backgroundColor: "#111" },
});

export default MapScreen;
