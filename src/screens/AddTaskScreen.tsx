import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  Platform,
  TouchableOpacity,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import uuid from "react-native-uuid";
import { RootStackParamList } from "../navigation/AppNavigator";

type Navigation = NativeStackNavigationProp<RootStackParamList, "AddTask">;

const AddTaskScreen: React.FC = () => {
  const navigation = useNavigation<Navigation>();
  const insets = useSafeAreaInsets();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState<Date>(new Date());
  const [show, setShow] = useState(false);
  const [mode, setMode] = useState<"date" | "time">("date");
  const [location, setLocation] = useState("");

  const saveTask = async () => {
    if (!title || !date || !location) {
      Alert.alert("Ошибка", "Заполните все обязательные поля");
      return;
    }

    const newTask = {
      id: uuid.v4().toString(),
      title,
      description,
      date: date.toISOString(),
      location: location,
      status: "New",
    };

    try {
      const existing = await AsyncStorage.getItem("tasks");
      const tasks = existing ? JSON.parse(existing) : [];
      tasks.push(newTask);
      await AsyncStorage.setItem("tasks", JSON.stringify(tasks));
      navigation.goBack();
    } catch (e) {
      console.error("❌ saveTask error:", e);
      Alert.alert("Ошибка", "Не удалось сохранить задачу");
    }
  };

  const onChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (event.type === "set" && selectedDate) {
      setDate(selectedDate);

      if (mode === "date") {
        setMode("time");
        if (Platform.OS === "android") {
          setTimeout(() => setShow(true), 0);
        }
      } else {
        setShow(false);
        setMode("date");
      }
    } else {
      setShow(false);
      setMode("date");
    }
  };

  const openPicker = () => {
    setMode("date");
    setShow(true);
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#fff", position: "relative" }}
    >
      <View style={styles.container}>
        <Text style={styles.label}>Название задачи</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Короткое название"
        />

        <Text style={styles.label}>Описание</Text>
        <TextInput
          style={[styles.input, { minHeight: 80 }]}
          value={description}
          onChangeText={setDescription}
          multiline
          placeholder="Подробности задачи (опционально)"
        />
        <Text style={styles.label}>Адрес (местоположение)</Text>
        <TextInput
          style={styles.input}
          value={location}
          onChangeText={setLocation}
          placeholder="Введите адрес вручную"
        />
        <Text style={styles.label}>Дата и время</Text>
        <Text style={styles.label}>{date.toLocaleString()}</Text>

        <View>
          <Button onPress={openPicker} title="Выбрать дату и время" />
        </View>

        {show && (
          <DateTimePicker
            testID="dateTimePicker"
            value={date}
            mode={mode}
            is24Hour={true}
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={onChange}
          />
        )}

        <TouchableOpacity
          style={[
            styles.actionButton,
            { marginTop: 10, backgroundColor: "#2563eb" },
          ]}
          onPress={saveTask}
        >
          <Text style={[styles.actionText, { color: "#fff" }]}>Сохранить</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12, flex: 1 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 8,
    backgroundColor: "#fff",
  },
  label: { fontWeight: "600", marginBottom: 4 },
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

export default AddTaskScreen;
