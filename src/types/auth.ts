export interface User {
  id: string;
  email: string;
  name?: string;
  createdAt?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials {
  email: string;
  password: string;
  name?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface SavedDiagram {
  id: string;
  userId: string;
  title: string;
  description?: string;
  nodes: unknown[];
  edges: unknown[];
  createdAt: string;
  updatedAt: string;
}

export interface SaveDiagramPayload {
  title: string;
  description?: string;
  nodes: unknown[];
  edges: unknown[];
}
