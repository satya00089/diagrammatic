import type { ProblemGuide } from "../types/problemGuide";

const guideModules = import.meta.glob<ProblemGuide>(
  "./public/problemGuides/*.json",
  { import: "default" },
);

const GUIDE_PATH_OVERRIDES: Record<string, string> = {
  "url-shortener": "urlShortener.json",
  "document-management-system": "documentManagement.json",
  "design-a-cost-optimized-architecture-for-batch-processing":
    "costOptimizedBatchProcessing.json",
  "instagram-system-design": "instagramSystemDesign.json",
  "design-instagram": "designInstagram.json",
  "design-pastebin": "designPastebin.json",
  "design-a-system-for-sorting-large-data-sets": "sortLargeDataSets.json",
  "build-a-marketplace-feature-for-facebook": "facebookMarketplace.json",
  "design-facebook-likes-feature-with-live-updates":
    "facebookLikesLiveUpdates.json",
  "twitter-system-design": "twitterSystemDesign.json",
  "top-k-ranking-system": "topKRankingSystem.json",
  "job-scheduler": "jobScheduler.json",
  "design-a-parts-compatibility-feature-for-an-ecommerce-site":
    "partsCompatibility.json",
  "design-a-price-alert-system": "priceAlert.json",
  "design-a-feature-to-show-the-number-of-users-viewing-a-page":
    "pagePresence.json",
};

export const getProblemGuide = async (
  slug: string,
): Promise<ProblemGuide | null> => {
  const filename = GUIDE_PATH_OVERRIDES[slug] ?? `${slug}.json`;
  const modulePath = `./public/problemGuides/${filename}`;
  const loadGuide = guideModules[modulePath];

  if (!loadGuide) return null;
  return await loadGuide();
};
