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