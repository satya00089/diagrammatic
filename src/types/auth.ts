export interface User {
  id: string;
  email: string;
  name?: string;
  picture?: string | null;
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

export interface DiagramOwner {
  id: string;
  name: string;
  email: string;
  pictureUrl?: string;
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
  isPublic?: boolean;
  collaborators?: Collaborator[];
  // New fields from backend enhancement
  isOwner: boolean;
  permission: "owner" | "edit" | "read";
  owner: DiagramOwner;
}

export interface Collaborator {
  id: string;
  email: string;
  permission: "read" | "edit";
  addedAt: string;
}

export interface SaveDiagramPayload {
  title: string;
  description?: string;
  nodes: unknown[];
  edges: unknown[];
}
