import type { Chat } from "@/domains/messaging/domain";

export const chats: Chat[] = [
  { id: "alex", name: "Алексей", type: "user", phoneNumber: "79990000001" },
  { id: "maria", name: "Мария", type: "user", phoneNumber: "79990000002" },
  { id: "design", name: "Команда дизайна", type: "group", phoneNumber: null },
];
