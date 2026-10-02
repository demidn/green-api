export type ChatType = "user" | "group" | "channel" | "bot";

export interface Chat {
  id: string;
  name: string;
  type: ChatType;
  phoneNumber: string | null;
}
