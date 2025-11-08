import {
  loadFromStorage,
  saveToStorage,
  OUTBOX_KEY,
  TASKS_KEY,
} from "./storage";
import NetInfo from "@react-native-community/netinfo";
import uuid from "react-native-uuid";
import { pushLog } from "./logs";

export type OutboxItem = {
  id: string; // локальный id записи в очереди
  action: "create" | "update" | "delete";
  payload: any; // должен содержать payload.id
};

const BASE = "http://192.168.100.22:3000/tasks";

// флаг, предотвращающий одновременные запуски синхронизации
let isSyncing = false;

// флаг миграции в storage (ключ)
const MIGRATED_FLAG_KEY = "OUTBOX_MIGRATED_v1";

/**
 * Добавляет элемент в очередь Outbox
 */
export async function pushToOutbox(action: OutboxItem["action"], payload: any) {
  const queue = (await loadFromStorage<OutboxItem[]>(OUTBOX_KEY)) || [];

  if (!payload.id) payload.id = uuid.v4().toString();

  const idx = queue.findIndex((i) => i.payload.id === payload.id);
  if (idx !== -1) {
    const existing = queue[idx];
    if (existing.action === "create" && action === "update") {
      queue[idx].payload = payload;
      await saveToStorage(OUTBOX_KEY, queue);
      console.log(`[outbox] Updated existing queued create for ${payload.id}`);
      return;
    }
    queue[idx] = { ...queue[idx], action, payload };
    await saveToStorage(OUTBOX_KEY, queue);
    console.log(
      `[outbox] Replaced existing queue item for ${payload.id} with action ${action}`
    );
    return;
  }

  queue.push({ id: uuid.v4().toString(), action, payload });
  await saveToStorage(OUTBOX_KEY, queue);
  console.log(`[outbox] Pushed item with id ${payload.id} to queue`);
}

/**
 * Получить все элементы очереди
 */
export async function getOutbox() {
  return (await loadFromStorage<OutboxItem[]>(OUTBOX_KEY)) || [];
}

/**
 * Удалить элемент из очереди
 */
export async function removeOutboxItem(id: string) {
  const queue = (await loadFromStorage<OutboxItem[]>(OUTBOX_KEY)) || [];
  const newQueue = queue.filter((i) => i.id !== id);
  await saveToStorage(OUTBOX_KEY, newQueue);
}

/**
 * Отправка одного элемента на сервер
 */
async function trySendToServer(item: OutboxItem): Promise<boolean> {
  try {
    let res: Response | undefined;

    switch (item.action) {
      case "create":
        // json-server требует POST на /tasks для создания
        res = await fetch(BASE, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item.payload),
        });
        break;

      case "update":
        res = await fetch(`${BASE}/${item.payload.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item.payload),
        });
        break;

      case "delete":
        res = await fetch(`${BASE}/${item.payload.id}`, { method: "DELETE" });
        break;
    }

    if (!res) return false;
    if (res.ok) return true;

    if (res.status === 409) {
      console.warn(
        "[sync] Server says resource already exists (409), treating as success:",
        item.payload.id
      );
      return true;
    }

    console.warn(
      `[sync] Server responded with error`,
      res.status,
      res.statusText,
      "Payload:",
      item.payload
    );
    return false;
  } catch (e) {
    console.warn("[sync] Network request failed for item:", item, e);
    return false;
  }
}

/**
 * Миграция: пробегаем все локальные задачи и добавляем их в Outbox,
 * если они там ещё не присутствуют. Выполняется один раз (флаг в storage).
 */
export async function migrateTasksToOutbox(): Promise<void> {
  try {
    const migrated = await loadFromStorage<boolean>(MIGRATED_FLAG_KEY);
    if (migrated) {
      console.log("[migrate] already migrated, skipping");
      return;
    }

    const tasks = (await loadFromStorage<any[]>(TASKS_KEY)) || [];
    console.log(`[migrate] migrating ${tasks.length} tasks to outbox`);

    for (const task of tasks) {
      try {
        // pushToOutbox сам проверяет дубликаты по payload.id
        await pushToOutbox("create", task);
      } catch (e) {
        console.warn("[migrate] failed to push task to outbox", task?.id, e);
      }
    }

    // помечаем как мигрировано
    await saveToStorage(MIGRATED_FLAG_KEY, true);
    console.log("[migrate] migration finished");
  } catch (e) {
    console.warn("[migrate] migration failed", e);
  }
}

/**
 * Синхронизация всех элементов Outbox
 * Блокирует повторные запуски через isSyncing.
 */
export async function syncOutboxIfOnline(): Promise<boolean> {
  if (isSyncing) {
    console.log("[sync] sync already running, skipping");
    return false;
  }
  isSyncing = true;

  try {
    const state = await NetInfo.fetch();
    if (!state.isConnected) {
      console.log("[sync] offline, aborting");
      return false;
    }

    const queue = await getOutbox();
    if (queue.length === 0) {
      console.log("[sync] outbox empty");
      return true;
    }

    console.log(`[sync] starting sync of ${queue.length} items`);

    for (const item of queue) {
      const ok = await trySendToServer(item);
      if (ok) {
        await removeOutboxItem(item.id);
        await pushLog({ action: "sync", details: item });
        console.log("[sync] Successfully sent item:", item.payload.id);
      } else {
        console.warn(
          "[sync] Failed to send item, will retry later:",
          item.payload.id
        );
      }
    }

    return true;
  } finally {
    isSyncing = false;
    console.log("[sync] finished");
  }
}
