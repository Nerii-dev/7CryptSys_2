import { Timestamp } from "firebase-admin/firestore";

export type OrderStatus = "pending" | "ready_to_ship" | "shipped" | "delivered" | "cancelled";

export interface OrderItem {
  id: string;
  title: string;
  quantity: number;
  price: number;
}

export interface Order {
  id?: string; // ID do documento
  mlOrderId: string;
  status: OrderStatus;
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  items: OrderItem[];
  shipping: {
    trackingNumber?: string;
    carrier?: string;
    labelUrl?: string;
  };
  blingId?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}