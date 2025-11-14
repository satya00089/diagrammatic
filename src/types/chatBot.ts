export interface UserIntent {
  title: string;
  description: string;
  timestamp: Date;
}

export interface CanvasContext {
  nodeCount: number;
  edgeCount: number;
  componentTypes: string[];
  lastActivity?: string;
  isEmpty: boolean;
}

export interface Suggestion {
  id: string;
  title: string;
  description: string;
  action: () => void;
  icon?: string;
  category: 'component' | 'pattern' | 'tip' | 'next-step' | 'best-practice' | 'optimization';
  priority: number;
  // For actionable suggestions
  componentId?: string; // Single component to add
  componentIds?: string[]; // Multiple components for patterns
  actionType?: 'add-component' | 'add-pattern' | 'info-only' | 'connect' | 'refactor';
  // AI-powered fields
  confidence?: number; // 0.0-1.0 confidence score from AI
  reasoning?: string; // Why this recommendation is relevant
}

export interface ChatMessage {
  id: string;
  type: 'user' | 'bot' | 'suggestion';
  content: string;
  timestamp: Date;
  suggestions?: Suggestion[];
}

export interface ChatBotState {
  isOpen: boolean;
  showWelcome: boolean;
  userIntent: UserIntent | null;
  canvasContext: CanvasContext | null;
  messages: ChatMessage[];
  currentSuggestions: Suggestion[];
}

export interface ChatBotContextType extends ChatBotState {
  toggleChatBot: () => void;
  setUserIntent: (intent: UserIntent) => void;
  updateCanvasContext: (context: CanvasContext) => void;
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  dismissWelcome: () => void;
  resetChatBot: () => void;
}
