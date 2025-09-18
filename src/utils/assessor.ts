import type {
  SystemDesignSolution,
  ValidationResult,
  ValidationFeedback,
  SystemComponent,
} from "../types/systemDesign";

function hasComponent(components: SystemComponent[], type: SystemComponent["type"], labelIncludes?: string) {
  return components.some((c) => c.type === type || (labelIncludes && c.label?.toLowerCase().includes(labelIncludes.toLowerCase())));
}

function clamp(n: number) {
  return Math.max(0, Math.min(100, Math.round(n)));
}

export function assessSolution(solution?: SystemDesignSolution | null): ValidationResult {
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
      suggestions: ["Provide a SystemDesignSolution object with components, connections and an explanation."],
      missingComponents: [],
      architectureStrengths: [],
      improvements: [],
    };
  }

  const comps = solution.components ?? [];

  // Small helpers to keep this function simple (low cognitive complexity)
  function computeScores() {
    let scalability = 50;
    if (hasComponent(comps, "load-balancer")) scalability += 20;
    if (hasComponent(comps, "cache")) scalability += 15;
    if (hasComponent(comps, "cdn")) scalability += 10;
    if (hasComponent(comps, "message-broker") || hasComponent(comps, "queue")) scalability += 10;
    if (hasComponent(comps, "database")) scalability += 5;

    let reliability = 40;
    if (hasComponent(comps, "load-balancer")) reliability += 10;
    if (hasComponent(comps, "message-broker") || hasComponent(comps, "queue")) reliability += 15;
    if (hasComponent(comps, "monitoring") || hasComponent(comps, "analytics")) reliability += 20;
    if (hasComponent(comps, "database")) reliability += 5;

    let security = 30;
    if (hasComponent(comps, "api-gateway") || hasComponent(comps, "external-api")) security += 10;
    if (comps.some((c) => /auth|oauth|identity/i.test(c.label || ""))) security += 25;
    if (hasComponent(comps, "database")) security += 5;

    let deliverability = 50;
    if ((solution?.explanation ?? "").length > 50) deliverability += 15;
    if ((solution?.keyPoints ?? []).length > 0) deliverability += 10;
    if (comps.length >= 3) deliverability += 10;

    return {
      scalability: clamp(scalability),
      reliability: clamp(reliability),
      security: clamp(security),
      deliverability: clamp(deliverability),
    };
  }

  function buildStrengths(): string[] {
    const s: string[] = [];
    if (hasComponent(comps, "load-balancer")) s.push("Load balancer for distributing traffic");
    if (hasComponent(comps, "cache")) s.push("Caching layer to reduce load on origin systems");
    if (hasComponent(comps, "cdn")) s.push("CDN for global content delivery");
    if (hasComponent(comps, "message-broker") || hasComponent(comps, "queue")) s.push("Asynchronous messaging for decoupling and resilience");
    if (hasComponent(comps, "monitoring") || hasComponent(comps, "analytics")) s.push("Monitoring/observability included");
    if (solution?.explanation && solution.explanation.length > 0) s.push("Contains an explanation describing major trade-offs and decisions.");
    return s;
  }

  function buildMissing(): string[] {
    const m: string[] = [];
    if (!hasComponent(comps, "load-balancer")) m.push("load-balancer");
    if (!hasComponent(comps, "cache")) m.push("cache");
    if (!hasComponent(comps, "monitoring")) m.push("monitoring");
    return m;
  }

  function buildSuggestions(): string[] {
    const sug: string[] = [];
    if (!hasComponent(comps, "load-balancer")) sug.push("Add a load balancer to distribute incoming traffic and improve availability.");
    if (!hasComponent(comps, "cache")) sug.push("Introduce a caching layer (Redis/Memcached) to reduce latency and backend load.");
    if (!hasComponent(comps, "monitoring")) sug.push("Add monitoring and alerting (Prometheus, Grafana) to detect and respond to incidents.");
    if (!comps.some((c) => /auth|oauth|identity/i.test(c.label || ""))) sug.push("Include an authentication/authorization component (Auth service or API gateway) to secure endpoints.");
    return sug;
  }

  function buildFeedback(scores: { scalability: number; reliability: number; security: number; deliverability: number; }): ValidationFeedback[] {
    const fb: ValidationFeedback[] = [];

    const criterion = (value: number, category: ValidationFeedback["category"], goodMsg: string, badMsg: string): ValidationFeedback => {
      let type: "success" | "warning" | "error";
      if (value >= 70) {
        type = "success";
      } else if (value >= 40) {
        type = "warning";
      } else {
        type = "error";
      }

      return {
        type,
        message: `${category.charAt(0).toUpperCase() + category.slice(1)} score: ${value}/100. ${value >= 70 ? goodMsg : badMsg}`,
        category,
      };
    };

    fb.push(criterion(scores.scalability, "scalability", "Good horizontal scaling patterns detected.", "Consider adding load balancing, caching, or message-based sharding to improve scalability."));
    fb.push(criterion(scores.reliability, "reliability", "Redundancy and observability look solid.", "Add monitoring, retries, and redundancy for critical components."));
    fb.push(criterion(scores.security, "security", "Authentication and edge controls are present.", "Consider adding auth, API gateway, encryption and secure data stores."));
    fb.push(criterion(scores.deliverability, "maintainability", "Solution is well-documented and feasible.", "Add concrete deployment steps, diagrams, and runbook details to improve deliverability."));

    return fb;
  }

  const scores = computeScores();
  const overall = clamp((scores.scalability + scores.reliability + scores.security + scores.deliverability) / 4);

  const strengths = buildStrengths();
  const missingComponents = buildMissing();
  const suggestions = buildSuggestions();
  const feedback = buildFeedback(scores);

  const improvements: string[] = [];
  if (missingComponents.length > 0) improvements.push(`Consider adding: ${missingComponents.join(", ")}`);
  if (suggestions.length > 0) improvements.push(...suggestions.slice(0, 5));

  const result: ValidationResult = {
    isValid: overall >= 50,
    score: overall,
    feedback,
    suggestions,
    missingComponents,
    architectureStrengths: strengths,
    improvements,
  };

  return result;
}

export default assessSolution;
