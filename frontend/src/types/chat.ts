export type ChatSenderType = "customer" | "ai" | "admin";

export interface ChatMessage {
  id: number;
  conversation_id: number;
  sender_type: ChatSenderType;
  message: string;
  read_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: number;
  user_id: number;
  customer_name: string;
  customer_email: string;
  status: "open" | "closed";
  last_message_at: string | null;
  created_at: string;
  updated_at: string;
  messages: ChatMessage[];
}

export interface AdminConversationsResponse {
  success: boolean;
  conversations: Conversation[];
}

export interface AdminConversationResponse {
  success: boolean;
  conversation: Conversation;
}

export interface CustomerConversationResponse {
  success: boolean;
  conversation: Conversation | null;
}

export interface AdminReplyResponse {
  success: boolean;
  message: string;
  reply: ChatMessage;
}