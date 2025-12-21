import { Timestamp } from "firebase/firestore";

export type UserRole = "admin" | "sales" | "shipping" | "metrics";

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: Timestamp;
}