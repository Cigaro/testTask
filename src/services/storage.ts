import AsyncStorage from "@react-native-async-storage/async-storage";
export const TASKS_KEY = "tasks_v2";
export const LOGS_KEY = "taskLogs_v2";
export const OUTBOX_KEY = "outbox_v2";
export const THEME_KEY = "app_theme";

export async function loadFromStorage<T>(key: string): Promise<T | null> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function saveToStorage<T>(key: string, data: T) {
  await AsyncStorage.setItem(key, JSON.stringify(data));
}
