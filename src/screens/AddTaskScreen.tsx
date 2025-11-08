import React, { useContext, useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  ScrollView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import uuid from "react-native-uuid";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as Location from "expo-location";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";

import { scheduleTaskNotification } from "../services/notifications";
import { pushLog } from "../services/logs";
import { pushToOutbox } from "../services/sync";
import { loadFromStorage, saveToStorage, TASKS_KEY } from "../services/storage";
import { Task, Attachment, Location as Loc } from "../types/task";
import { ThemeContext } from "../context/ThemeContext";
import { RootStackParamList } from "../navigation/AppNavigator";

type AddTaskNavProp = NativeStackNavigationProp<RootStackParamList, "AddTask">;
type AddTaskRouteProp = RouteProp<RootStackParamList, "AddTask">;

const AddTaskScreen: React.FC<{
  navigation: AddTaskNavProp;
  route: AddTaskRouteProp;
}> = ({ navigation, route }) => {
  const { theme } = useContext(ThemeContext);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState<Date>(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState<"date" | "time">("date");

  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [location, setLocation] = useState<Loc | undefined>(undefined);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        // optional alert
      }
    })();
  }, []);

  useEffect(() => {
    const params = route?.params as any;
    if (params?.pickedLocation) {
      setLocation(params.pickedLocation as Loc);
    }
  }, [route?.params]);

  // ------------------ DateTimePicker Logic ------------------
  const openPicker = () => {
    setPickerMode("date");
    setShowPicker(true);
  };

  const onDateChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (event.type === "set" && selected) {
      setDate(selected);
      if (pickerMode === "date") {
        setPickerMode("time");
        if (Platform.OS === "android") setTimeout(() => setShowPicker(true), 0);
      } else {
        setPickerMode("date");
        setShowPicker(false);
      }
    } else {
      setShowPicker(false);
      setPickerMode("date");
    }
  };

  // ------------------ Attachments ------------------
  const pickAttachment = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({});
      if (res.assets && res.assets.length > 0) {
        const file = res.assets[0];
        const id = uuid.v4().toString();
        const name = file.name || `file_${id}`;
        const dest = `${FileSystem.documentDirectory}${id}_${name}`;
        await FileSystem.copyAsync({ from: file.uri, to: dest });
        const item: Attachment = {
          id,
          uri: dest,
          name,
          mimeType: file.mimeType,
        };
        setAttachments((s) => [item, ...s]);
      }
    } catch (e) {
      console.warn("pickAttachment", e);
    }
  };

  // ------------------ Location ------------------
  const pickCurrentLocation = async () => {
    try {
      const loc = await Location.getCurrentPositionAsync({});
      setLocation({
        lat: loc.coords.latitude,
        lng: loc.coords.longitude,
        address: "",
      });
      Alert.alert(
        "Локация установлена",
        `lat: ${loc.coords.latitude.toFixed(4)}, lng: ${loc.coords.longitude.toFixed(4)}`
      );
    } catch {
      Alert.alert("Ошибка", "Не удалось получить текущее местоположение.");
    }
  };

  // ------------------ Save Task ------------------
  const onSave = async () => {
    if (!title.trim()) {
      Alert.alert("Ошибка", "Введите название задачи");
      return;
    }
    if (saving) return;
    setSaving(true);

    const newTask: Task = {
      id: uuid.v4().toString(),
      title: title.trim(),
      description: description.trim(),
      date: date.toISOString(),
      status: "New",
      attachments,
      location,
      createdAt: new Date().toISOString(),
      notificationId: null,
    };

    try {
      const notifId = await scheduleTaskNotification(newTask);
      newTask.notificationId = notifId;
    } catch (e) {
      console.warn("schedule error", e);
    }

    try {
      const existing = (await loadFromStorage<Task[]>(TASKS_KEY)) || [];
      existing.unshift(newTask);
      await saveToStorage<Task[]>(TASKS_KEY, existing);

      await pushToOutbox("create", newTask);

      await pushLog({
        action: "create",
        taskId: newTask.id,
        details: { title: newTask.title },
      });

      navigation.reset({ index: 0, routes: [{ name: "TaskList" }] });
    } catch (e) {
      console.warn("save error", e);
    } finally {
      setSaving(false);
    }
  };

  // ------------------ Render ------------------
  return (
    <SafeAreaView style={[styles.safe, theme === "dark" && styles.darkSafe]}>
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { backgroundColor: theme === "dark" ? "#111" : "#fff" },
        ]}
      >
        <Text
          style={[styles.label, { color: theme === "dark" ? "#fff" : "#000" }]}
        >
          Название
        </Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme === "dark" ? "#222" : "#fff",
              color: theme === "dark" ? "#fff" : "#000",
            },
          ]}
          value={title}
          onChangeText={setTitle}
          placeholder="Короткое название"
          placeholderTextColor={theme === "dark" ? "#888" : "#999"}
        />

        <Text
          style={[styles.label, { color: theme === "dark" ? "#fff" : "#000" }]}
        >
          Описание
        </Text>
        <TextInput
          style={[
            styles.input,
            {
              minHeight: 80,
              backgroundColor: theme === "dark" ? "#222" : "#fff",
              color: theme === "dark" ? "#fff" : "#000",
            },
          ]}
          multiline
          value={description}
          onChangeText={setDescription}
          placeholder="Подробное описание"
          placeholderTextColor={theme === "dark" ? "#888" : "#999"}
        />

        <Text
          style={[styles.label, { color: theme === "dark" ? "#fff" : "#000" }]}
        >
          Дата и время
        </Text>
        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: theme === "dark" ? "#333" : "#e5e7eb" },
          ]}
          onPress={openPicker}
        >
          <Text
            style={[
              styles.btnText,
              { color: theme === "dark" ? "#fff" : "#111" },
            ]}
          >
            {date.toLocaleString()}
          </Text>
        </TouchableOpacity>
        {showPicker && (
          <DateTimePicker
            value={date}
            mode={pickerMode}
            display="default"
            onChange={onDateChange}
          />
        )}

        {/* Location */}
        <Text
          style={[styles.label, { color: theme === "dark" ? "#fff" : "#000" }]}
        >
          Местоположение
        </Text>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <TouchableOpacity
            style={[
              styles.smallBtn,
              { backgroundColor: theme === "dark" ? "#333" : "#e5e7eb" },
            ]}
            onPress={pickCurrentLocation}
          >
            <Text style={{ color: theme === "dark" ? "#fff" : "#000" }}>
              Использовать текущее
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.smallBtn,
              { backgroundColor: theme === "dark" ? "#333" : "#e5e7eb" },
            ]}
            onPress={() =>
              navigation.navigate("MapPicker", {
                returnTo: "AddTask",
                onPick: (loc: Loc) => setLocation(loc),
              })
            }
          >
            <Text style={{ color: theme === "dark" ? "#fff" : "#000" }}>
              Выбрать на карте
            </Text>
          </TouchableOpacity>
        </View>
        {location && (
          <Text
            style={{ marginTop: 8, color: theme === "dark" ? "#fff" : "#000" }}
          >
            Lat: {location.lat?.toFixed(4)} Lng: {location.lng?.toFixed(4)}
          </Text>
        )}

        {/* Attachments */}
        <Text
          style={[
            styles.label,
            { marginTop: 12, color: theme === "dark" ? "#fff" : "#000" },
          ]}
        >
          Вложения
        </Text>
        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: theme === "dark" ? "#333" : "#e5e7eb" },
          ]}
          onPress={pickAttachment}
        >
          <Text
            style={[
              styles.btnText,
              { color: theme === "dark" ? "#fff" : "#111" },
            ]}
          >
            Добавить вложение
          </Text>
        </TouchableOpacity>

        {attachments.map((a) => (
          <View key={a.id} style={styles.attachment}>
            {a.mimeType?.startsWith("image") ? (
              <Image
                source={{ uri: a.uri }}
                style={{ width: 60, height: 60 }}
              />
            ) : null}
            <Text
              style={{
                marginLeft: 8,
                color: theme === "dark" ? "#fff" : "#000",
              }}
            >
              {a.name}
            </Text>
          </View>
        ))}

        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: "#2563eb" }]}
          onPress={onSave}
        >
          <Text style={{ color: "#fff", fontWeight: "600" }}>Сохранить</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  darkSafe: { backgroundColor: "#111" },
  container: { padding: 16 },
  label: { fontWeight: "600", marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 8,
    backgroundColor: "#fff",
    marginBottom: 12,
  },
  button: {
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 8,
  },
  smallBtn: { padding: 8, borderRadius: 8 },
  btnText: { color: "#111" },
  attachment: { flexDirection: "row", alignItems: "center", marginTop: 8 },
  saveBtn: {
    marginTop: 18,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
});

export default AddTaskScreen;
