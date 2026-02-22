import type {
  SystemDesignSolution,
  SystemDesignProblem,
  ValidationResult,
  ValidationFeedback,
} from "../types/systemDesign";

// AI-powered assessor that calls your FastAPI service
export async function assessSolution(
  solution?: SystemDesignSolution | null,
  problem?: SystemDesignProblem | null,
): Promise<ValidationResult> {
  if (!solution) {
    return {
      isValid: false,
      score: 0,
      feedback: [
        {
          type: "error",
          message: "No solution provided.",
          category: "maintainability",
        },
      ],
      suggestions: ["Please add components to your design for assessment."],
      missingComponents: [],
      architectureStrengths: [],
      improvements: [],
    };
  }

  const apiUrl = import.meta.env.VITE_ASSESSMENT_API_URL;

  if (!apiUrl) {
    throw new Error(
      "VITE_ASSESSMENT_API_URL not configured. Please add it to your .env file.",
    );
  }

  // Valid component types accepted by the backend
  const VALID_BACKEND_TYPES = new Set([
    "frontend", "backend", "database", "cache", "load-balancer",
    "api-gateway", "message-broker", "queue", "cdn", "monitoring",
    "analytics", "external-api", "storage", "security", "custom",
  ]);

  // Map frontend-only / user-entered types to the nearest valid backend type
  const normalizeComponentType = (type: string): string => {
    if (VALID_BACKEND_TYPES.has(type)) return type;
    const t = type.toLowerCase();
    if (t === "client" || t === "web-server" || t === "web_server") return "frontend";
    if (
      t === "application-server" || t === "application_server" ||
      t === "microservice" || t === "service" || t === "server" ||
      t === "notification-service" || t === "search-engine"
    ) return "backend";
    if (t === "nosql" || t === "sql" || t === "rdbms" || t === "db") return "database";
    if (t === "file-storage" || t === "file_storage" || t === "blob" || t === "s3") return "storage";
    if (t === "firewall" || t === "waf" || t === "auth") return "security";
    // Anything else falls through as custom
    return "custom";
  };

  try {
    // Transform solution to match your FastAPI request format
    const requestPayload = {
      // Filter out group/layout nodes that don't represent real architecture components
      components: solution.components
        .filter((comp) => comp.type !== "group")
        .map((comp) => ({
          id: comp.id || `comp-${Date.now()}`,
          type: normalizeComponentType(comp.type),
          label: comp.label,
          properties: comp.properties || {},
          position: comp.position,
        })),
      connections: (() => {
        // Build set of excluded (group) component IDs so we can drop their connections
        const excludedIds = new Set(
          solution.components
            .filter((c) => c.type === "group")
            .map((c) => c.id),
        );
        return (solution.connections ?? [])
          .filter(
            (conn) =>
              !excludedIds.has(conn.source) && !excludedIds.has(conn.target),
          )
          .map((conn) => ({
            id: conn.id || `conn-${Date.now()}`,
            source: conn.source,
            target: conn.target,
            label: conn.label,
            type: conn.type,
            description:
              conn.description ||
              (conn.properties?.description as string | undefined),
          }));
      })(),
      explanation: solution.explanation,
      keyPoints: solution.keyPoints,
      // Include problem context for better AI assessment
      problem: problem
        ? {
            title: problem.title,
            description: problem.description,
            requirements: Array.isArray(problem.requirements)
              ? problem.requirements.join(".\n")
              : problem.requirements,
            constraints: Array.isArray(problem.constraints)
              ? problem.constraints.join(".\n")
              : problem.constraints,
            difficulty: problem.difficulty,
            category: problem.category,
            estimatedTime: problem.estimated_time,
          }
        : null,
    };

    console.log("Calling assessment API:", `${apiUrl}/api/v1/assess`);
    console.log("Request payload:", requestPayload);

    const response = await fetch(`${apiUrl}/api/v1/assess`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(requestPayload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Assessment API failed: ${response.status} ${response.statusText} - ${errorText}`,
      );
    }

    const result = await response.json();
    console.log("Assessment API response:", result);

    // Transform FastAPI response to match frontend ValidationResult interface
    return transformApiResponse(result);
  } catch (error) {
    console.error("AI Assessment failed:", error);

    // Return error result instead of fallback
    return {
      isValid: false,
      score: 0,
      feedback: [
        {
          type: "error",
          message: `Assessment service unavailable: ${error instanceof Error ? error.message : "Unknown error"}`,
          category: "maintainability",
        },
      ],
      suggestions: [
        "Please ensure the assessment service is running and try again.",
      ],
      missingComponents: [],
      architectureStrengths: [],
      improvements: [],
    };
  }
}

// Transform FastAPI response to frontend ValidationResult format
function transformApiResponse(apiResult: unknown): ValidationResult {
  const result = apiResult as {
    is_valid?: boolean;
    overall_score?: number;
    feedback?: Array<{
      type: string;
      message: string;
      category: string;
      priority?: number;
    }>;
    suggestions?: string[];
    missing_components?: string[];
    strengths?: string[];
    improvements?: string[];
    scores?: import("../types/systemDesign").ScoreBreakdown;
    detailed_analysis?: Record<string, string>;
    interview_questions?: string[];
    missing_descriptions?: string[];
    unclear_connections?: string[];
    processing_time_ms?: number;
  };

  const feedback: ValidationFeedback[] = (result.feedback || []).map((fb) => ({
    type: fb.type as ValidationFeedback["type"],
    message: fb.message,
    category: fb.category as ValidationFeedback["category"],
    priority: fb.priority,
  }));

  return {
    isValid: result.is_valid || false,
    score: result.overall_score || 0,
    feedback,
    suggestions: result.suggestions || [],
    missingComponents: result.missing_components || [],
    architectureStrengths: result.strengths || [],
    improvements: result.improvements || [],
    scores: result.scores,
    detailedAnalysis: result.detailed_analysis,
    interviewQuestions: result.interview_questions || [],
    missingDescriptions: result.missing_descriptions || [],
    unclearConnections: result.unclear_connections || [],
    processingTimeMs: result.processing_time_ms,
  };
}

// Utility function to test API connectivity
export async function testAssessmentAPI(): Promise<boolean> {
  const apiUrl = import.meta.env.VITE_ASSESSMENT_API_URL;

  if (!apiUrl) {
    console.warn("VITE_ASSESSMENT_API_URL not configured");
    return false;
  }

  try {
    const response = await fetch(`${apiUrl}/health`);
    return response.ok;
  } catch (error) {
    console.error("Assessment API health check failed:", error);
    return false;
  }
}

// Backward compatibility - default export with problem parameter
export default assessSolution;
