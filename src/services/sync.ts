import { loadFromStorage, saveToStorage, OUTBOX_KEY } from "./storage";
import NetInfo from "@react-native-community/netinfo";
import uuid from "react-native-uuid";
import { pushLog } from "./logs";
import { Platform } from "react-native";

export type OutboxItem = {
  id: string;
  action: "create" | "update" | "delete";
  payload: any;
};

const BASE = "http://192.168.100.22:3000/tasks";

export async function pushToOutbox(action: OutboxItem["action"], payload: any) {
  const queue = (await loadFromStorage<OutboxItem[]>(OUTBOX_KEY)) || [];

  const exists = queue.some(
    (i) => i.payload.id === payload.id && i.action === "create"
  );
  if (exists) return;

  queue.push({ id: uuid.v4().toString(), action, payload });
  await saveToStorage(OUTBOX_KEY, queue);
}

export async function getOutbox() {
  return (await loadFromStorage<OutboxItem[]>(OUTBOX_KEY)) || [];
}

export async function removeOutboxItem(id: string) {
  const queue = (await loadFromStorage<OutboxItem[]>(OUTBOX_KEY)) || [];
  const newQ = queue.filter((i) => i.id !== id);
  await saveToStorage(OUTBOX_KEY, newQ);
}

async function trySendToServer(item: OutboxItem): Promise<boolean> {
  try {
    let res: Response | undefined;

    switch (item.action) {
      case "create":
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

    if (res && !res.ok) {
      console.warn(
        `[sync] Server responded with error`,
        res.status,
        res.statusText,
        "Payload:",
        item.payload
      );
      return false;
    }

    return true;
  } catch (e) {
    console.warn("[sync] Network request failed for item:", item, e);
    return false;
  }
}

export async function syncOutboxIfOnline(): Promise<boolean> {
  const state = await NetInfo.fetch();
  if (!state.isConnected) return false;

  const queue = await getOutbox();

  for (const item of queue) {
    const ok = await trySendToServer(item);
    if (ok) {
      await removeOutboxItem(item.id);
      await pushLog({ action: "sync", details: item });
      console.log("[sync] Successfully sent item:", item);
    } else {
      console.warn("[sync] Failed to send item, will retry later:", item);
    }
  }

  return true;
}
