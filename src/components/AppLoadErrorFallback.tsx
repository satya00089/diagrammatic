import React, { useState } from "react";
import { retryCurrentPage } from "../utils/lazyWithRetry";

const AppLoadErrorFallback: React.FC = () => {
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = () => {
    setIsRetrying(true);
    retryCurrentPage();
  };

  return (
    <main
      className="grid min-h-screen place-items-center bg-[var(--bg)] px-6 py-16 text-theme"
      role="alert"
    >
      <section className="w-full max-w-lg rounded-2xl border border-theme/10 bg-[var(--surface)] p-8 text-center shadow-[0_20px_60px_rgba(17,24,39,0.12)] sm:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-muted">
          Temporary loading issue
        </p>
        <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
          Diagramwise needs a quick refresh
        </h1>
        <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-muted sm:text-base">
          A temporary connection or deployment update prevented one part of this
          page from loading. Your saved work is not affected.
        </p>
        <button
          type="button"
          onClick={handleRetry}
          disabled={isRetrying}
          className="mt-7 inline-flex min-h-11 items-center justify-center rounded-xl bg-[var(--brand)] px-5 text-sm font-semibold text-white transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand)] disabled:cursor-wait disabled:opacity-70"
        >
          {isRetrying ? "Refreshing…" : "Try again"}
        </button>
      </section>
    </main>
  );
};

export default AppLoadErrorFallback;
