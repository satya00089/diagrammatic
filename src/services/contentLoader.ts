export type LessonType = "article" | "quiz" | "exercise" | "interactive";

export interface ExerciseAnswer {
  type: "numeric" | "integer" | "string";
  value: number | string;
  units?: string;
  // tolerance expressed as a fraction (e.g. 0.1 = 10%)
  tolerance?: number;
  // optional regex for string answers
  regex?: string;
}

export interface ExerciseQuestion {
  id: string;
  prompt?: string;
  hint?: string;
  answer?: ExerciseAnswer;
}

export interface Exercise {
  questions: ExerciseQuestion[];
  assumptions?: string[];
}

export interface Lesson {
  id: string;
  title: string;
  type: LessonType;
  content?: string;
  resources?: string[];
  exercise?: Exercise;
}

export interface Module {
  id: string;
  title: string;
  order: number;
  lessons: Lesson[];
}

export interface LearningPath {
  id: string;
  slug: string;
  title: string;
  summary?: string;
  difficulty?: string;
  tags?: string[];
  modules: Module[];
}

const SAMPLE_URL = "/learning-paths/sample-learning-path.json";

export async function fetchLearningPaths(): Promise<LearningPath[]> {
  const res = await fetch(SAMPLE_URL);
  if (!res.ok) throw new Error(`Failed to load learning paths: ${res.status}`);
  const data = await res.json();
  return Array.isArray(data) ? data : [data];
}

export async function fetchLearningPathBySlug(slug: string): Promise<LearningPath | null> {
  const paths = await fetchLearningPaths();
  return paths.find((p) => p.slug === slug) ?? null;
}
