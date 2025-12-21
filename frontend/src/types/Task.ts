import { Timestamp } from "firebase/firestore";

export type TaskType = "daily" | "weekly" | "monthly";
export type TaskStatus = "pending" | "completed" | "overdue";

export interface Task {
  id?: string; // ID do documento do Firestore
  title: string;
  description: string;
  type: TaskType;
  assignedTo: string[]; // Array de UIDs
  frequency: {
    weeklyDay?: number; // 0-6
    monthlyDay?: number; // 1-31
  };
  status: TaskStatus;
  dueDate: Timestamp;
  completedAt?: Timestamp;
  completedBy?: string; // UID
  attachmentUrl?: string;
  verifiedBy?: string; // UID (Admin)
  verifiedAt?: Timestamp;
}