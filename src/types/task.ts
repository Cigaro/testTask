export type TaskStatus = "New" | "In Progress" | "Completed" | "Cancelled";

export interface Task {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  status: TaskStatus;
}
