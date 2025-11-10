import type {
  User,
  AuthResponse,
  LoginCredentials,
  SignupCredentials,
  SavedDiagram,
  SaveDiagramPayload,
  Collaborator,
} from "../types/auth";

const API_BASE_URL = import.meta.env.VITE_ASSESSMENT_API_URL || "";

class ApiService {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem("auth_token");
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  // Authentication endpoints
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: "Login failed" }));
      throw new Error(error.message || "Login failed");
    }

    return response.json();
  }

  async signup(credentials: SignupCredentials): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: "Signup failed" }));
      throw new Error(error.message || "Signup failed");
    }

    return response.json();
  }

  async googleLogin(credential: string): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ credential }),
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: "Google login failed" }));
      throw new Error(error.message || "Google login failed");
    }

    return response.json();
  }

  async getCurrentUser(): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/me`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch user");
    }

    return response.json();
  }

  // Diagram management endpoints
  async saveDiagram(payload: SaveDiagramPayload): Promise<SavedDiagram> {
    const response = await fetch(`${API_BASE_URL}/api/v1/diagrams`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: "Failed to Save Design" }));
      throw new Error(error.message || "Failed to Save Design");
    }

    return response.json();
  }

  async updateDiagram(
    id: string,
    payload: SaveDiagramPayload,
  ): Promise<SavedDiagram> {
    const response = await fetch(`${API_BASE_URL}/api/v1/diagrams/${id}`, {
      method: "PUT",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: "Failed to update diagram" }));
      throw new Error(error.message || "Failed to update diagram");
    }

    return response.json();
  }

  async getUserDiagrams(): Promise<SavedDiagram[]> {
    const response = await fetch(`${API_BASE_URL}/api/v1/diagrams`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch diagrams");
    }

    return response.json();
  }

  async getDiagram(id: string): Promise<SavedDiagram> {
    const response = await fetch(`${API_BASE_URL}/api/v1/diagrams/${id}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch diagram");
    }

    return response.json();
  }

  async getPublicDiagram(id: string): Promise<SavedDiagram> {
    const response = await fetch(`${API_BASE_URL}/api/v1/diagrams/${id}/public`, {
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch diagram");
    }

    return response.json();
  }

  async deleteDiagram(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/v1/diagrams/${id}`, {
      method: "DELETE",
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error("Failed to delete diagram");
    }
  }

  // Collaborator management endpoints
  async addCollaborator(diagramId: string, email: string, permission: 'read' | 'edit'): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/v1/diagrams/${diagramId}/share`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ email, permission }),
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: "Failed to add collaborator" }));
      throw new Error(error.message || "Failed to add collaborator");
    }
  }

  async getCollaborators(diagramId: string): Promise<Collaborator[]> {
    const response = await fetch(`${API_BASE_URL}/api/v1/diagrams/${diagramId}/collaborators`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch collaborators");
    }

    return response.json();
  }

  async updateCollaborator(diagramId: string, collaboratorId: string, permission: 'read' | 'edit'): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/v1/diagrams/${diagramId}/collaborators/${collaboratorId}`, {
      method: "PUT",
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ permission }),
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: "Failed to update collaborator" }));
      throw new Error(error.message || "Failed to update collaborator");
    }
  }

  async removeCollaborator(diagramId: string, collaboratorId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/v1/diagrams/${diagramId}/collaborators/${collaboratorId}`, {
      method: "DELETE",
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error("Failed to remove collaborator");
    }
  }

  // Problem attempts tracking
  async getAttemptedProblems(): Promise<string[]> {
    const response = await fetch(`${API_BASE_URL}/api/v1/problems/attempted`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      // Return empty array if endpoint fails (user not authenticated or endpoint not available)
      return [];
    }

    return response.json();
  }

  async markProblemAsAttempted(problemId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/v1/problems/${problemId}/attempt`, {
      method: "POST",
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      console.warn("Failed to mark problem as attempted");
    }
  }

  // Problem attempts management
  async saveAttempt(payload: {
    problemId: string;
    title: string;
    difficulty?: string;
    category?: string;
    nodes: unknown[];
    edges: unknown[];
    elapsedTime: number;
    lastAssessment?: unknown;
  }): Promise<unknown> {
    const response = await fetch(`${API_BASE_URL}/api/v1/attempts`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: "Failed to save attempt" }));
      throw new Error(error.message || "Failed to save attempt");
    }

    return response.json();
  }

  async getUserAttempts(): Promise<unknown[]> {
    const response = await fetch(`${API_BASE_URL}/api/v1/attempts`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch attempts");
    }

    return response.json();
  }

  async getAttemptByProblem(problemId: string): Promise<unknown | null> {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/attempts/problem/${problemId}`,
      {
        headers: this.getAuthHeaders(),
      }
    );

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error("Failed to fetch attempt");
    }

    return response.json();
  }

  async deleteAttempt(problemId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/v1/attempts/problem/${problemId}`, {
      method: "DELETE",
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error("Failed to delete attempt");
    }
  }
}

export const apiService = new ApiService();
