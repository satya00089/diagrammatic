import type {
  User,
  AuthResponse,
  LoginCredentials,
  SignupCredentials,
  SavedDiagram,
  SaveDiagramPayload,
} from "../types/auth";

const API_BASE_URL = import.meta.env.VITE_ASSESSMENT_API_URL || "http://localhost:8000";

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

  async deleteDiagram(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/v1/diagrams/${id}`, {
      method: "DELETE",
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error("Failed to delete diagram");
    }
  }
}

export const apiService = new ApiService();
