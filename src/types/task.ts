export type Attachment = {
  id: string;
  uri: string;
  name?: string;
  mimeType?: string;
};

export type Location = {
  address?: string;
  lat?: number;
  lng?: number;
};

export type TaskStatus = "New" | "In Progress" | "Completed" | "Cancelled";

export type Task = {
  id: string;
  title: string;
  description?: string;
  date: string; // ISO
  status: TaskStatus;
  location?: Location;
  attachments?: Attachment[];
  createdAt: string;
  updatedAt?: string;
  notificationId?: string | null;
};

export type LogItem = {
  id: string;
  taskId?: string;
  action: "create" | "update" | "status_change" | "delete" | "attach" | "sync";
  details?: any;
  timestamp: string;
};
