import { useCallback, useRef } from "react";
import type { Driver } from "driver.js";
import { TOURS } from "../config/tours";
import { useOnboarding } from "./useOnboarding";
import type { PageId } from "../contexts/OnboardingContext";

/**
 * Returns a `startTour` function that drives the tour for the given page.
 * - On first visit (isNewToPage = true), call startTour() from a useEffect.
 * - The `?` Help button can always call startTour() to re-run the tour.
 */
export const useTour = (pageId: PageId) => {
  const { markTourComplete, isTourCompleted, markPageVisited, isNewToPage } =
    useOnboarding();
  const driverRef = useRef<Driver | null>(null);

  const startTour = useCallback(async () => {
    const tourDef = TOURS[pageId];
    if (!tourDef) return;

    // Filter out steps whose target element doesn't exist in the DOM yet
    const steps = tourDef.steps.filter((step) => {
      if (!step.element) return true; // steps without an element are ok (popover-only)
      return !!document.querySelector(step.element as string);
    });

    if (steps.length === 0) return;

    if (driverRef.current) {
      driverRef.current.destroy();
    }

    const [{ driver }] = await Promise.all([
      import("driver.js"),
      import("driver.js/dist/driver.css"),
      import("../styles/driver-overrides.css"),
    ]);
    driverRef.current = driver({
      showProgress: true,
      animate: true,
      allowClose: true,
      overlayColor: "rgba(0,0,0,0)",
      steps,
      onDestroyStarted: () => {
        driverRef.current?.destroy();
        markTourComplete(pageId);
      },
      onDestroyed: () => {
        markTourComplete(pageId);
        // If this was the user's first visit to the page, record the
        // visit after the tour completes so feature announcements
        // don't appear while the tour is running.
        try {
          if (isNewToPage(pageId)) {
            markPageVisited(pageId);
          }
        } catch {
          // swallow any errors — onboarding persistence is best-effort
        }
      },
    });
    driverRef.current.drive();
  }, [pageId, markTourComplete, isNewToPage, markPageVisited]);

  return { startTour, isTourCompleted: isTourCompleted(pageId) };
};
