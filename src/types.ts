export interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  files?: UploadedFile[];
}

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  data: string; // Base64 encoded
}

export interface OfferteSection {
  title: string;
  content: string;
  visible: boolean;
}

export interface User {
  name: string;
  email: string;
  password?: string; // For authentication
}

export interface SavedSession {
  id: string;
  name: string;
  messages: ChatMessage[];
  uploadedFiles: UploadedFile[];
  offertePreview: string;
  pdfUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AppState {
  messages: ChatMessage[];
  sessionId: string;
  uploadedFiles: UploadedFile[];
  offertePreview: string;
  isLoading: boolean;
  error: string | null;
  currentUser: User | null;
  streamingMessage: string | null;
  isStreaming: boolean;
  cancelPolling?: () => void;
  savedSessions: SavedSession[];
  currentSessionName: string;
}