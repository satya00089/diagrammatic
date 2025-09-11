export interface SystemDesignProblem {
  id: string;
  title: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: string;
  estimatedTime: string;
  requirements: string[];
  constraints: string[];
  hints: string[];
  sampleSolution?: SystemDesignSolution;
  tags: string[];
}

export interface SystemDesignSolution {
  components: SystemComponent[];
  connections: SystemConnection[];
  explanation: string;
  keyPoints: string[];
}

export interface SystemComponent {
  id: string;
  type: ComponentType;
  label: string;
  position: { x: number; y: number };
  properties: Record<string, any>;
  description?: string;
}

export interface SystemConnection {
  id: string;
  source: string;
  target: string;
  type: ConnectionType;
  label?: string;
  properties?: Record<string, any>;
}

export type ComponentType = 
  | 'client'
  | 'load-balancer'
  | 'web-server'
  | 'application-server'
  | 'database'
  | 'cache'
  | 'queue'
  | 'cdn'
  | 'api-gateway'
  | 'microservice'
  | 'message-broker'
  | 'search-engine'
  | 'file-storage'
  | 'notification-service'
  | 'monitoring'
  | 'analytics'
  | 'external-api';

export type ConnectionType = 
  | 'http'
  | 'tcp'
  | 'websocket'
  | 'message-queue'
  | 'database-connection'
  | 'api-call'
  | 'data-flow'
  | 'event-stream';

export interface ValidationResult {
  isValid: boolean;
  score: number;
  feedback: ValidationFeedback[];
  suggestions: string[];
  missingComponents: string[];
  architectureStrengths: string[];
  improvements: string[];
}

export interface ValidationFeedback {
  type: 'error' | 'warning' | 'success' | 'info';
  message: string;
  component?: string;
  category: 'scalability' | 'reliability' | 'performance' | 'security' | 'cost' | 'maintainability';
}

export interface ComponentTemplate {
  type: ComponentType;
  label: string;
  icon: string;
  description: string;
  defaultProperties: Record<string, any>;
  category: 'frontend' | 'backend' | 'database' | 'infrastructure' | 'external';
  color: string;
}
