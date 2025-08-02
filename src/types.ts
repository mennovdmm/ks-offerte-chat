export interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

export interface ApiResponse {
  success: boolean;
  message: string;
  pdfUrl?: string | null;
}

export interface User {
  name: string;
  email: string;
}

export interface SavedSession {
  id: string;
  name: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
  pdfUrl?: string;
}