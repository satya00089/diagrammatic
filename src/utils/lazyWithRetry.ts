/* eslint-disable @typescript-eslint/no-explicit-any */
import { lazy, type ComponentType, type LazyExoticComponent } from "react";

const CHUNK_RETRY_PARAM = "__diagrammatic_chunk_retry";
const CHUNK_RETRY_STORAGE_PREFIX = "diagrammatic:chunk-retry:";
const IMPORT_ATTEMPTS = 2;
const RETRY_DELAY_MS = 250;

type LazyModule<T extends ComponentType<any>> = Promise<{ default: T }>;
type LazyLoader<T extends ComponentType<any>> = () => LazyModule<T>;

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

export const isChunkLoadError = (error: unknown): boolean => {
  const message = getErrorMessage(error);
  return /(?:chunkloaderror|failed to fetch dynamically imported module|importing a module script failed|error loading dynamically imported module|loading chunk .* failed)/i.test(
    message,
  );
};

export const createChunkRetryUrl = (href: string, token: string): string => {
  const url = new URL(href);
  url.searchParams.set(CHUNK_RETRY_PARAM, token);
  return url.toString();
};

const getRetryStorageKey = (): string =>
  `${CHUNK_RETRY_STORAGE_PREFIX}${window.location.pathname}`;

const hasRetriedCurrentPath = (): boolean => {
  if (window.location.search.includes(`${CHUNK_RETRY_PARAM}=`)) return true;

  try {
    return Boolean(sessionStorage.getItem(getRetryStorageKey()));
  } catch {
    return false;
  }
};

const markPathRetried = (chunkName: string): void => {
  try {
    sessionStorage.setItem(getRetryStorageKey(), chunkName);
  } catch {
    // Storage can be unavailable in privacy-restricted browser contexts.
  }
};

const removeRetryQueryParam = (): void => {
  if (!window.location.search.includes(`${CHUNK_RETRY_PARAM}=`)) return;

  try {
    const storageProbeKey = `${CHUNK_RETRY_STORAGE_PREFIX}probe`;
    sessionStorage.setItem(storageProbeKey, "1");
    sessionStorage.removeItem(storageProbeKey);
  } catch {
    // Keep the query marker when storage is unavailable as the reload guard.
    return;
  }

  const url = new URL(window.location.href);
  url.searchParams.delete(CHUNK_RETRY_PARAM);
  window.history.replaceState(window.history.state, "", url.toString());
};

const wait = (delayMs: number): Promise<void> =>
  new Promise((resolve) => window.setTimeout(resolve, delayMs));

const reloadWithCacheBust = (chunkName: string): void => {
  markPathRetried(chunkName);
  window.location.replace(
    createChunkRetryUrl(window.location.href, String(Date.now())),
  );
};

export const retryCurrentPage = (): void => {
  if (typeof window === "undefined") return;

  try {
    sessionStorage.removeItem(getRetryStorageKey());
  } catch {
    // Storage can be unavailable in privacy-restricted browser contexts.
  }

  reloadWithCacheBust("manual");
};

export function lazyWithRetry<T extends ComponentType<any>>(
  load: LazyLoader<T>,
  chunkName: string,
): LazyExoticComponent<T> {
  return lazy(async () => {
    let lastError: unknown;

    for (let attempt = 0; attempt < IMPORT_ATTEMPTS; attempt += 1) {
      try {
        const module = await load();
        removeRetryQueryParam();
        return module;
      } catch (error) {
        lastError = error;
        if (!isChunkLoadError(error) || attempt === IMPORT_ATTEMPTS - 1) {
          break;
        }
        await wait(RETRY_DELAY_MS);
      }
    }

    if (
      typeof window !== "undefined" &&
      isChunkLoadError(lastError) &&
      !hasRetriedCurrentPath()
    ) {
      reloadWithCacheBust(chunkName);
    }

    throw lastError;
  });
}
