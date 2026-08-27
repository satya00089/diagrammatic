import type { ProblemGuide } from "../types/problemGuide";
import { materializedProblemGuides } from "./materializedProblemGuides";
import costOptimizedBatchProcessingGuideData from "./public/problemGuides/costOptimizedBatchProcessing.json";
import instagramSystemDesignGuideData from "./public/problemGuides/instagramSystemDesign.json";
import designInstagramGuideData from "./public/problemGuides/designInstagram.json";
import designPastebinGuideData from "./public/problemGuides/designPastebin.json";
import sortLargeDataSetsGuideData from "./public/problemGuides/sortLargeDataSets.json";
import facebookMarketplaceGuideData from "./public/problemGuides/facebookMarketplace.json";
import documentManagementGuideData from "./public/problemGuides/documentManagement.json";
import facebookLikesLiveUpdatesGuideData from "./public/problemGuides/facebookLikesLiveUpdates.json";
import twitterSystemDesignGuideData from "./public/problemGuides/twitterSystemDesign.json";
import topKRankingSystemGuideData from "./public/problemGuides/topKRankingSystem.json";
import jobSchedulerGuideData from "./public/problemGuides/jobScheduler.json";
import pagePresenceGuideData from "./public/problemGuides/pagePresence.json";
import partsCompatibilityGuideData from "./public/problemGuides/partsCompatibility.json";
import priceAlertGuideData from "./public/problemGuides/priceAlert.json";
import urlShortenerGuideData from "./public/problemGuides/urlShortener.json";

const documentManagementGuide = documentManagementGuideData as ProblemGuide;
const costOptimizedBatchProcessingGuide =
  costOptimizedBatchProcessingGuideData as ProblemGuide;
const instagramSystemDesignGuide =
  instagramSystemDesignGuideData as ProblemGuide;
const designInstagramGuide = designInstagramGuideData as ProblemGuide;
const designPastebinGuide = designPastebinGuideData as ProblemGuide;
const sortLargeDataSetsGuide = sortLargeDataSetsGuideData as ProblemGuide;
const facebookMarketplaceGuide = facebookMarketplaceGuideData as ProblemGuide;
const facebookLikesLiveUpdatesGuide =
  facebookLikesLiveUpdatesGuideData as ProblemGuide;
const twitterSystemDesignGuide = twitterSystemDesignGuideData as ProblemGuide;
const topKRankingSystemGuide = topKRankingSystemGuideData as ProblemGuide;
const jobSchedulerGuide = jobSchedulerGuideData as ProblemGuide;
const pagePresenceGuide = pagePresenceGuideData as ProblemGuide;
const partsCompatibilityGuide = partsCompatibilityGuideData as ProblemGuide;
const priceAlertGuide = priceAlertGuideData as ProblemGuide;
const urlShortenerGuide = urlShortenerGuideData as ProblemGuide;

const documentManagementArchitecture = documentManagementGuide.architecture;
const costOptimizedBatchProcessingArchitecture =
  costOptimizedBatchProcessingGuide.architecture;
const instagramSystemDesignArchitecture =
  instagramSystemDesignGuide.architecture;
const designInstagramArchitecture = designInstagramGuide.architecture;
const designPastebinArchitecture = designPastebinGuide.architecture;
const sortLargeDataSetsArchitecture = sortLargeDataSetsGuide.architecture;
const facebookMarketplaceArchitecture = facebookMarketplaceGuide.architecture;
const facebookLikesLiveUpdatesArchitecture =
  facebookLikesLiveUpdatesGuide.architecture;
const twitterSystemDesignArchitecture = twitterSystemDesignGuide.architecture;
const topKRankingSystemArchitecture = topKRankingSystemGuide.architecture;
const jobSchedulerArchitecture = jobSchedulerGuide.architecture;
const pagePresenceArchitecture = pagePresenceGuide.architecture;
const partsCompatibilityArchitecture = partsCompatibilityGuide.architecture;
const priceAlertArchitecture = priceAlertGuide.architecture;
const urlShortenerArchitecture = urlShortenerGuide.architecture;

const PROBLEM_GUIDES: Record<string, ProblemGuide> = {
  ...materializedProblemGuides,
  "url-shortener": urlShortenerGuide,
  "document-management-system": documentManagementGuide,
  "design-a-cost-optimized-architecture-for-batch-processing":
    costOptimizedBatchProcessingGuide,
  "instagram-system-design": instagramSystemDesignGuide,
  "design-instagram": designInstagramGuide,
  "design-pastebin": designPastebinGuide,
  "design-a-system-for-sorting-large-data-sets": sortLargeDataSetsGuide,
  "build-a-marketplace-feature-for-facebook": facebookMarketplaceGuide,
  "design-facebook-likes-feature-with-live-updates":
    facebookLikesLiveUpdatesGuide,
  "twitter-system-design": twitterSystemDesignGuide,
  "top-k-ranking-system": topKRankingSystemGuide,
  "job-scheduler": jobSchedulerGuide,
  "design-a-parts-compatibility-feature-for-an-ecommerce-site":
    partsCompatibilityGuide,
  "design-a-price-alert-system": priceAlertGuide,
  "design-a-feature-to-show-the-number-of-users-viewing-a-page":
    pagePresenceGuide,
};

export const getProblemGuide = (slug: string): ProblemGuide | null =>
  PROBLEM_GUIDES[slug] ?? null;

export const getGuideArchitecture = (slug: string) =>
  getProblemGuide(slug)?.architecture ?? null;

export {
  documentManagementArchitecture,
  costOptimizedBatchProcessingArchitecture,
  instagramSystemDesignArchitecture,
  designInstagramArchitecture,
  designPastebinArchitecture,
  sortLargeDataSetsArchitecture,
  facebookMarketplaceArchitecture,
  facebookLikesLiveUpdatesArchitecture,
  twitterSystemDesignArchitecture,
  topKRankingSystemArchitecture,
  documentManagementGuide,
  costOptimizedBatchProcessingGuide,
  instagramSystemDesignGuide,
  designInstagramGuide,
  designPastebinGuide,
  sortLargeDataSetsGuide,
  facebookMarketplaceGuide,
  facebookLikesLiveUpdatesGuide,
  twitterSystemDesignGuide,
  topKRankingSystemGuide,
  urlShortenerArchitecture,
  urlShortenerGuide,
  jobSchedulerArchitecture,
  jobSchedulerGuide,
  partsCompatibilityArchitecture,
  partsCompatibilityGuide,
  priceAlertArchitecture,
  priceAlertGuide,
  pagePresenceArchitecture,
  pagePresenceGuide,
};
