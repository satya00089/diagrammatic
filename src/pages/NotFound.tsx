import React from "react";
import { Link } from "react-router-dom";
import Seo from "../components/SEO";

const NotFound: React.FC = () => (
  <>
    <Seo
      title="Page Not Found | Diagrammatic"
      description="The Diagrammatic page you requested does not exist or may have moved."
      url="https://diagrammatic.next-zen.dev/404"
      noIndex
    />
    <main className="min-h-screen bg-[var(--bg)] px-6 py-16 text-theme">
      <div className="mx-auto flex min-h-[70vh] max-w-3xl flex-col justify-center">
        <Link
          to="/"
          className="mb-12 inline-flex w-fit items-center gap-3 font-bold text-theme focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--brand)]"
        >
          <img src="/logo.png" alt="" className="h-8 w-8" />
          <span>Diagrammatic</span>
        </Link>
        <h1 className="max-w-2xl text-5xl font-bold leading-[1.02] tracking-[-0.04em] sm:text-7xl">
          This page could not be found
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-muted">
          The address may be outdated, or the page may have moved. Continue with
          a practice problem or return to the homepage.
        </p>
        <div className="mt-9 flex flex-wrap gap-3">
          <Link
            to="/problems"
            className="inline-flex min-h-12 items-center rounded-xl bg-[var(--brand)] px-5 font-semibold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--brand)]"
          >
            Browse practice problems
          </Link>
          <Link
            to="/"
            className="inline-flex min-h-12 items-center rounded-xl border border-theme/20 px-5 font-semibold text-theme focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--brand)]"
          >
            Go to the homepage
          </Link>
        </div>
      </div>
    </main>
  </>
);

export default NotFound;
