import type {
  SystemDesignSolution,
  SystemDesignProblem,
  ValidationResult,
  ValidationFeedback,
} from "../types/systemDesign";

// AI-powered assessor that calls your FastAPI service
export async function assessSolution(
  solution?: SystemDesignSolution | null,
  problem?: SystemDesignProblem | null
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
    throw new Error('VITE_ASSESSMENT_API_URL not configured. Please add it to your .env file.');
  }

  try {
    // Transform solution to match your FastAPI request format
    const requestPayload = {
      components: solution.components.map(comp => ({
        id: comp.id || `comp-${Date.now()}`,
        type: comp.type,
        label: comp.label,
        properties: comp.properties || {},
        position: comp.position
      })),
      connections: solution.connections?.map(conn => ({
        id: conn.id || `conn-${Date.now()}`,
        source: conn.source,
        target: conn.target,
        label: conn.label,
        type: conn.type
      })) || [],
      explanation: solution.explanation,
      keyPoints: solution.keyPoints,
      // Include problem context for better AI assessment
      problem: problem ? {
        title: problem.title,
        description: problem.description,
        requirements: Array.isArray(problem.requirements) 
          ? problem.requirements.join('.\n') 
          : problem.requirements,
        constraints: Array.isArray(problem.constraints)
          ? problem.constraints.join('.\n')
          : problem.constraints,
        difficulty: problem.difficulty,
        category: problem.category,
        estimatedTime: problem.estimatedTime
      } : null
    };

    console.log('Calling assessment API:', `${apiUrl}/api/v1/assess`);
    console.log('Request payload:', requestPayload);

    const response = await fetch(`${apiUrl}/api/v1/assess`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(requestPayload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Assessment API failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    console.log('Assessment API response:', result);

    // Transform FastAPI response to match frontend ValidationResult interface
    return transformApiResponse(result);
    
  } catch (error) {
    console.error('AI Assessment failed:', error);
    
    // Return error result instead of fallback
    return {
      isValid: false,
      score: 0,
      feedback: [
        {
          type: "error",
          message: `Assessment service unavailable: ${error instanceof Error ? error.message : 'Unknown error'}`,
          category: "maintainability",
        },
      ],
      suggestions: ["Please ensure the assessment service is running and try again."],
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
    }>;
    suggestions?: string[];
    missing_components?: string[];
    strengths?: string[];
    improvements?: string[];
  };

  const feedback: ValidationFeedback[] = (result.feedback || []).map((fb) => ({
    type: fb.type as ValidationFeedback['type'],
    message: fb.message,
    category: fb.category as ValidationFeedback['category']
  }));

  return {
    isValid: result.is_valid || false,
    score: result.overall_score || 0,
    feedback,
    suggestions: result.suggestions || [],
    missingComponents: result.missing_components || [],
    architectureStrengths: result.strengths || [],
    improvements: result.improvements || []
  };
}

// Utility function to test API connectivity
export async function testAssessmentAPI(): Promise<boolean> {
  const apiUrl = import.meta.env.VITE_ASSESSMENT_API_URL;
  
  if (!apiUrl) {
    console.warn('VITE_ASSESSMENT_API_URL not configured');
    return false;
  }

  try {
    const response = await fetch(`${apiUrl}/health`);
    return response.ok;
  } catch (error) {
    console.error('Assessment API health check failed:', error);
    return false;
  }
}

// Backward compatibility - default export with problem parameter
export default assessSolution;
