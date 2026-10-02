export type MessageDeliveryStatus = "sent" | "delivered" | "read";

export interface Message {
  id: string;
  senderId: string;
  text: string;
  time: string;
  date: string;
  deliveryStatus?: MessageDeliveryStatus;
}
