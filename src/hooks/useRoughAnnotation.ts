import { useLayoutEffect, type RefObject } from "react";
import {
  annotate,
  annotationGroup,
  type RoughAnnotationConfig,
  type RoughAnnotation,
} from "rough-notation";

type AnnotationTarget = {
  ref: RefObject<HTMLElement | null>;
  config: RoughAnnotationConfig;
};

/**
 * Shows a small, non-interactive markup layer over important learning cues.
 * Targets remain normal DOM content so annotations never become required
 * to understand or operate the page.
 */
export const useRoughAnnotation = (
  targets: AnnotationTarget[],
  enabled = true,
) => {
  useLayoutEffect(() => {
    if (!enabled) {
      return;
    }

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const annotations: RoughAnnotation[] = targets.flatMap(({ ref, config }) =>
      ref.current
        ? [
            annotate(ref.current, {
              ...config,
              animate: config.animate ?? !prefersReducedMotion,
            }),
          ]
        : [],
    );

    if (annotations.length === 0) return;

    const group = annotationGroup(annotations);
    const frameId = window.requestAnimationFrame(() => group.show());

    return () => {
      window.cancelAnimationFrame(frameId);
      annotations.forEach((annotation) => annotation.remove());
    };
  }, [enabled, targets]);
};
