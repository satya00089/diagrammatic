import { Node, Edge } from "@xyflow/react";

/**
 * Learning Module Types
 * Defines the structure for system design learning content
 */

export type LearningLevel = "beginner" | "intermediate" | "advanced";
export type LessonType = "theory" | "interactive" | "exercise" | "quiz";
export type InteractiveType =
  | "canvas"
  | "comparison"
  | "exercise"
  | "simulation";

export interface LearningModule {
  id: string;
  title: string;
  description: string;
  level: LearningLevel;
  estimatedTime: string;
  order: number;
  prerequisites: string[]; // module IDs
  tags: string[];
  icon?: string;
  lessons: Lesson[];
}

export interface Lesson {
  id: string;
  moduleId?: string;
  title: string;
  slug: string;
  contentUrl: string;
  order: number;
  type: LessonType;
  estimatedTime: string;
  interactiveConfig?: InteractiveConfig;
}

export interface InteractiveConfig {
  type: InteractiveType;
  initialComponents?: InitialComponent[];
  instructions: string;
  hints?: string[];
  successCriteria?: SuccessCriteria;
}

export interface InitialComponent {
  componentId: string;
  position: { x: number; y: number };
  data?: Record<string, unknown>;
}

export interface SuccessCriteria {
  requiredComponents?: string[];
  minComponents?: number;
  requiredConnections?: Array<{ from: string; to: string }>;
  minConnections?: number;
  customValidation?: (nodes: Node[], edges: Edge[]) => ValidationResult;
}

export interface ValidationResult {
  isValid: boolean;
  message: string;
  details?: string[];
  score?: number;
}

export interface UserProgress {
  userId: string;
  moduleId: string;
  lessonId: string;
  completed: boolean;
  score?: number;
  completedAt?: Date;
  diagramSnapshot?: {
    nodes: Node[];
    edges: Edge[];
  };
  timeSpent?: number; // in seconds
}

export interface ModuleProgress {
  moduleId: string;
  completedLessons: string[];
  totalLessons: number;
  progress: number; // percentage 0-100
  startedAt?: Date;
  completedAt?: Date;
}

export interface LearningStats {
  totalModules: number;
  completedModules: number;
  totalLessons: number;
  completedLessons: number;
  totalTimeSpent: number; // in seconds
  streak: number; // consecutive days
  achievements: Achievement[];
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: Date;
  type: "module" | "lesson" | "streak" | "special";
}

export interface LearningModuleIndex {
  modules: LearningModule[];
  version: string;
  lastUpdated: string;
}
