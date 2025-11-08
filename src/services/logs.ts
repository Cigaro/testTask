import { LogItem } from "../types/task";
import uuid from "react-native-uuid";
import { loadFromStorage, saveToStorage, LOGS_KEY } from "./storage";

export async function pushLog(entry: Omit<LogItem, "id" | "timestamp">) {
  const logs = (await loadFromStorage<LogItem[]>(LOGS_KEY)) || [];
  const item: LogItem = {
    id: uuid.v4().toString(),
    timestamp: new Date().toISOString(),
    ...entry,
  };
  logs.unshift(item);
  await saveToStorage(LOGS_KEY, logs);
  return item;
}

export async function getLogs() {
  return (await loadFromStorage<LogItem[]>(LOGS_KEY)) || [];
}
