import featuredProblems from "../data/featuredProblems.json";

type ProblemSlugSource = {
  title: string;
  slug?: string;
};

const curatedSlugs = new Map(
  featuredProblems.map((problem) => [problem.title, problem.slug]),
);

export const slugifyProblemTitle = (title: string): string =>
  title
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const getProblemSlug = (problem: ProblemSlugSource): string =>
  curatedSlugs.get(problem.title) ||
  problem.slug ||
  slugifyProblemTitle(problem.title);

export const getFeaturedProblem = (slug: string) =>
  featuredProblems.find((problem) => problem.slug === slug);

export { featuredProblems };

