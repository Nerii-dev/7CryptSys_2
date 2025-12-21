import { Timestamp } from "firebase-admin/firestore";

export type TaskType = "daily" | "weekly" | "monthly";
export type TaskStatus = "pending" | "completed" | "overdue";

export interface Task {
  id?: string;
  title: string;
  description: string;
  type: TaskType;
  assignedTo: string[];
  frequency: {
    weeklyDay?: number;
    monthlyDay?: number;
  };
  status: TaskStatus;
  dueDate: Timestamp;
  createdAt: Timestamp;
  completedAt?: Timestamp;
  completedBy?: string;
  attachmentUrl?: string;
  verifiedBy?: string;
  verifiedAt?: Timestamp;
}