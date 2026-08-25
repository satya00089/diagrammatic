import type { ComponentType as ReactComponentType } from "react";
import type { SystemComponent, SystemConnection } from "./systemDesign";

export interface GuideArchitectureComponent extends SystemComponent {
  /** ID from the reusable canvas component catalog, e.g. `api-gateway`. */
  componentId?: string;
  /** Optional React Flow node type for richer node presentations. */
  nodeType?: string;
}

export interface GuideArchitectureLayer {
  id: string;
  label: string;
  description: string;
  componentIds: string[];
}

export interface GuideArchitecturePath {
  id: string;
  label: string;
  description: string;
  componentIds: string[];
}

export interface GuideArchitecture {
  title: string;
  summary: string;
  layers: GuideArchitectureLayer[];
  components: GuideArchitectureComponent[];
  connections: SystemConnection[];
  keyPaths?: GuideArchitecturePath[];
}

export interface GuideMetric {
  label: string;
  value: string;
  description: string;
}

export interface GuideRequirements {
  functional: string[];
  nonFunctional: string[];
  scaleAssumptions: string[];
  metrics: GuideMetric[];
}

export interface GuideEntity {
  name: string;
  fields: string[];
  notes: string;
}

export interface GuideApi {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  contract: string;
  notes: string;
}

export interface GuideDataFlowStep {
  title: string;
  description: string;
}

export interface GuideDeepDive {
  title: string;
  points: string[];
}

export interface GuideTradeoff {
  title: string;
  recommendation: string;
  caution: string;
}

export interface GuideFollowUp {
  question: string;
  answer: string;
}

export interface GuideRubricItem {
  criterion: string;
  description: string;
}

export interface ProblemGuide {
  prompt: {
    brief: string;
    successSignals: string[];
  };
  requirements: GuideRequirements;
  entities: GuideEntity[];
  apis: GuideApi[];
  dataFlow: GuideDataFlowStep[];
  architecture: GuideArchitecture;
  deepDives: GuideDeepDive[];
  tradeoffs: GuideTradeoff[];
  commonMistakes: string[];
  followUps: GuideFollowUp[];
  rubric: GuideRubricItem[];
}

export interface GuideArchitectureCanvasProps {
  architecture: GuideArchitecture;
  onPractice?: () => void;
}

export type GuideArchitectureComponentDefinition = {
  id: string;
  icon?: ReactComponentType;
  iconUrl?: string;
  label: string;
};
