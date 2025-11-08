import React, { useContext } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import TaskListScreen from "../screens/TaskListScreen";
import AddTaskScreen from "../screens/AddTaskScreen";
import TaskDetailsScreen from "../screens/TaskDetailsScreen";
import MapScreen from "../screens/MapScreen";
import HistoryScreen from "../screens/HistoryScreen";
import MapPickerScreen from "../screens/MapPickerScreen";
import { Location as Loc } from "../types/task";
import { ThemeToggleButton } from "../components/ThemeToggleButton";
import { ThemeContext } from "../context/ThemeContext";

export type RootStackParamList = {
  TaskList: undefined;
  AddTask: { pickedLocation?: Loc } | undefined;
  TaskDetails: { taskId: string };
  Map: undefined;
  History: undefined;
  MapPicker:
    | { returnTo?: keyof RootStackParamList; onPick?: (loc: Loc) => void }
    | undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const { theme } = useContext(ThemeContext);

  return (
    <NavigationContainer
      theme={{
        dark: theme === "dark",
        colors: {
          primary: "#2563eb",
          background: theme === "dark" ? "#111" : "#fff",
          card: theme === "dark" ? "#222" : "#f9f9f9",
          text: theme === "dark" ? "#fff" : "#000",
          border: theme === "dark" ? "#333" : "#ccc",
          notification: "#f59e0b",
        },
        fonts: {
          regular: { fontFamily: "System", fontWeight: "400" },
          medium: { fontFamily: "System", fontWeight: "500" },
          bold: { fontFamily: "System", fontWeight: "700" },
          heavy: { fontFamily: "System", fontWeight: "800" },
        },
      }}
    >
      <Stack.Navigator
        initialRouteName="TaskList"
        screenOptions={{
          headerRight: () => <ThemeToggleButton />,
        }}
      >
        <Stack.Screen
          name="TaskList"
          component={TaskListScreen}
          options={{ title: "My Tasks" }}
        />
        <Stack.Screen
          name="AddTask"
          component={AddTaskScreen}
          options={{ title: "Add Task" }}
        />
        <Stack.Screen
          name="TaskDetails"
          component={TaskDetailsScreen}
          options={{ title: "Task Details" }}
        />
        <Stack.Screen name="Map" component={MapScreen} />
        <Stack.Screen name="History" component={HistoryScreen} />
        <Stack.Screen
          name="MapPicker"
          component={MapPickerScreen}
          options={{ title: "Выбор на карте" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
