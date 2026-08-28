import type { ProblemGuide } from "../types/problemGuide";

const guideModules = import.meta.glob<ProblemGuide>(
  "./public/problemGuides/*.json",
  { import: "default" },
);

export const getProblemGuide = async (
  slug: string,
): Promise<ProblemGuide | null> => {
  const modulePath = `./public/problemGuides/${slug}.json`;
  const loadGuide = guideModules[modulePath];

  if (!loadGuide) return null;
  return await loadGuide();
};
