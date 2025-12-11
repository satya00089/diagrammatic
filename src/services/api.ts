import type {
  User,
  AuthResponse,
  LoginCredentials,
  SignupCredentials,
  SavedDiagram,
  SaveDiagramPayload,
  Collaborator,
} from "../types/auth";
import type { CanvasContext, UserIntent } from "../types/chatBot";

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
    const response = await fetch(
      `${API_BASE_URL}/api/v1/diagrams/${id}/public`,
      {
        headers: { "Content-Type": "application/json" },
      },
    );

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
  async addCollaborator(
    diagramId: string,
    email: string,
    permission: "read" | "edit",
  ): Promise<void> {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/diagrams/${diagramId}/share`,
      {
        method: "POST",
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ email, permission }),
      },
    );

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: "Failed to add collaborator" }));
      throw new Error(error.message || "Failed to add collaborator");
    }
  }

  async getCollaborators(diagramId: string): Promise<Collaborator[]> {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/diagrams/${diagramId}/collaborators`,
      {
        headers: this.getAuthHeaders(),
      },
    );

    if (!response.ok) {
      throw new Error("Failed to fetch collaborators");
    }

    return response.json();
  }

  async updateCollaborator(
    diagramId: string,
    collaboratorId: string,
    permission: "read" | "edit",
  ): Promise<void> {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/diagrams/${diagramId}/collaborators/${collaboratorId}`,
      {
        method: "PUT",
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ permission }),
      },
    );

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: "Failed to update collaborator" }));
      throw new Error(error.message || "Failed to update collaborator");
    }
  }

  async removeCollaborator(
    diagramId: string,
    collaboratorId: string,
  ): Promise<void> {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/diagrams/${diagramId}/collaborators/${collaboratorId}`,
      {
        method: "DELETE",
        headers: this.getAuthHeaders(),
      },
    );

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

  async getAttemptByProblem(problemId: string): Promise<unknown> {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/attempts/problem/${problemId}`,
      {
        headers: this.getAuthHeaders(),
      },
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
    const response = await fetch(
      `${API_BASE_URL}/api/v1/attempts/problem/${problemId}`,
      {
        method: "DELETE",
        headers: this.getAuthHeaders(),
      },
    );

    if (!response.ok) {
      throw new Error("Failed to delete attempt");
    }
  }

  // Recommendations endpoint
  async getRecommendations(payload: {
    userIntent?: UserIntent | null;
    canvasContext: CanvasContext;
    components: Array<{
      id: string;
      type: string;
      label: string;
      hasDescription: boolean;
      properties?: Record<string, unknown>;
    }>;
    connections: Array<{
      source: string;
      target: string;
      type?: string;
      hasLabel: boolean;
    }>;
    maxSuggestions?: number;
  }): Promise<{
    recommendations: Array<{
      id: string;
      title: string;
      description: string;
      icon: string;
      category:
        | "component"
        | "pattern"
        | "tip"
        | "best-practice"
        | "optimization";
      priority: number;
      confidence: number;
      actionType:
        | "add-component"
        | "add-pattern"
        | "info-only"
        | "connect"
        | "refactor";
      componentId?: string;
      componentIds?: string[];
      reasoning?: string;
    }>;
    totalCount: number;
    filteredCount: number;
    minConfidenceThreshold: number;
    contextSummary?: string;
    processingTimeMs?: number;
  }> {
    // Transform frontend types to backend format
    const requestPayload = {
      user_intent: payload.userIntent
        ? {
            title: payload.userIntent.title,
            description: payload.userIntent.description,
          }
        : null,
      canvas_context: {
        node_count: payload.canvasContext.nodeCount,
        edge_count: payload.canvasContext.edgeCount,
        component_types: payload.canvasContext.componentTypes,
        is_empty: payload.canvasContext.isEmpty,
      },
      components: payload.components.map((comp) => ({
        id: comp.id,
        type: comp.type,
        label: comp.label,
        has_description: comp.hasDescription,
        properties: comp.properties || {},
      })),
      connections: payload.connections.map((conn) => ({
        source: conn.source,
        target: conn.target,
        type: conn.type,
        has_label: conn.hasLabel,
      })),
      max_suggestions: payload.maxSuggestions || 5,
    };

    const response = await fetch(`${API_BASE_URL}/api/v1/recommendations`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(requestPayload),
    });

    if (!response.ok) {
      throw new Error("Failed to get recommendations");
    }

    const data = await response.json();

    // Transform backend response to frontend format
    return {
      recommendations: data.recommendations.map(
        (rec: {
          id: string;
          title: string;
          description: string;
          icon: string;
          category: string;
          priority: number;
          confidence: number;
          action_type: string;
          component_id?: string;
          component_ids?: string[];
          reasoning?: string;
        }) => ({
          id: rec.id,
          title: rec.title,
          description: rec.description,
          icon: rec.icon,
          category: rec.category,
          priority: rec.priority,
          confidence: rec.confidence,
          actionType: rec.action_type,
          componentId: rec.component_id,
          componentIds: rec.component_ids,
          reasoning: rec.reasoning,
        }),
      ),
      totalCount: data.total_count,
      filteredCount: data.filtered_count,
      minConfidenceThreshold: data.min_confidence_threshold,
      contextSummary: data.context_summary,
      processingTimeMs: data.processing_time_ms,
    };
  }
}

export const apiService = new ApiService();
