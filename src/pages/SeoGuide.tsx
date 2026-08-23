import React from "react";
import { Link, useLocation } from "react-router-dom";
import { MdArrowForward, MdCheckCircleOutline } from "react-icons/md";
import Seo from "../components/SEO";
import ThemeSwitcher from "../components/ThemeSwitcher";
import { featuredProblems } from "../utils/problemSlug";
import NotFound from "./NotFound";

const SITE_URL = "https://diagrammatic.next-zen.dev";

const guides = {
  "system-design-interview": {
    title: "System Design Interview Guide",
    seoTitle:
      "System Design Interview Guide & Practice Questions | Diagrammatic",
    description:
      "Prepare for system design interviews by turning ambiguous prompts into requirements, estimates, architecture decisions, and defensible trade-offs.",
    intro:
      "A strong system design interview is a structured conversation. The diagram matters, but the interviewer is evaluating how you clarify the problem, choose boundaries, find bottlenecks, and revise decisions as constraints change.",
    steps: [
      [
        "Clarify the problem",
        "Identify users, core use cases, non-goals, and the quality attributes that matter most.",
      ],
      [
        "Estimate the shape",
        "Use rough traffic, storage, throughput, and latency estimates to expose decisions that need evidence.",
      ],
      [
        "Draw the critical path",
        "Start with the simplest end-to-end flow before expanding storage, caching, queues, and failure handling.",
      ],
      [
        "Defend the trade-offs",
        "Explain why each major component exists, what it costs, and what would make you replace it.",
      ],
      [
        "Test failure and scale",
        "Walk through overload, partial failure, recovery, consistency, and operational visibility.",
      ],
    ],
    problemSlugs: [
      "url-shortener",
      "rate-limiter",
      "notification-system",
      "distributed-cache",
      "video-streaming-platform",
      "ride-sharing-system",
    ],
    nextHref: "/system-design-practice/",
    nextLabel: "Build a repeatable practice routine",
  },
  "system-design-practice": {
    title: "System Design Practice",
    seoTitle:
      "System Design Practice Online with Architecture Feedback | Diagrammatic",
    description:
      "Practice system design online with realistic prompts, an interactive architecture canvas, explicit trade-offs, and structured review.",
    intro:
      "System design improves through deliberate repetitions, not by memorizing finished diagrams. A useful session forces you to state assumptions, build an architecture, and inspect how it responds to load, failure, and changing requirements.",
    steps: [
      [
        "Choose one narrow prompt",
        "Match the difficulty to the skill you want to isolate instead of attempting the largest possible system.",
      ],
      [
        "Time-box clarification",
        "Write the functional requirements, scale assumptions, and success criteria before placing components.",
      ],
      [
        "Build and annotate",
        "Label important flows and record why each component or boundary exists.",
      ],
      [
        "Review without rewriting history",
        "Capture weaknesses before changing the diagram so each iteration teaches a specific lesson.",
      ],
      [
        "Repeat the weak dimension",
        "Choose the next challenge around the bottleneck you missed: caching, consistency, queues, storage, reliability, or operations.",
      ],
    ],
    problemSlugs: [
      "job-scheduler",
      "pastebin-system-design",
      "google-calendar-system-design",
      "hotel-booking-system",
      "web-crawler",
      "payment-system",
    ],
    nextHref: "/problems/",
    nextLabel: "Browse all practice problems",
  },
  "ai-system-design-interview": {
    title: "AI System Design Interview",
    seoTitle: "AI System Design Interview Questions & Practice | Diagrammatic",
    description:
      "Practice AI and ML system design across data pipelines, retrieval, inference, evaluation, monitoring, latency, reliability, and cost trade-offs.",
    intro:
      "AI system design adds probabilistic behavior and a changing data-model boundary to familiar distributed-systems concerns. Strong answers connect the offline and online paths, define evaluation, and plan for fallback, monitoring, and safe iteration.",
    steps: [
      [
        "Define product behavior",
        "State what the model must produce, who consumes it, and how quality will be measured.",
      ],
      [
        "Separate offline and online paths",
        "Show ingestion, labeling, training or indexing, deployment, inference, and feedback as distinct flows.",
      ],
      [
        "Budget latency, quality, and cost",
        "Explain where caching, batching, smaller models, retrieval, or asynchronous work changes the trade-off.",
      ],
      [
        "Design evaluation and observability",
        "Track data quality, relevance or model quality, drift, failures, and user-impacting regressions.",
      ],
      [
        "Plan degradation and rollback",
        "Describe what happens when a model, index, feature pipeline, or provider is unavailable.",
      ],
    ],
    problemSlugs: [
      "rag-conversational-ai",
      "semantic-search-engine",
      "recommendation-engine",
      "real-time-recommendation-system",
      "observability-platform",
      "video-transcoding-pipeline",
    ],
    nextHref: "/learning-paths/",
    nextLabel: "Study the underlying foundations",
  },
} as const;

const faq = [
  [
    "How should I start a system design problem?",
    "Clarify the users, primary use cases, non-goals, scale assumptions, and quality attributes before choosing components.",
  ],
  [
    "What makes system design practice effective?",
    "Build the architecture yourself, state the reasoning, review specific weaknesses, and repeat challenges that exercise those weak areas.",
  ],
] as const;

const SeoGuide: React.FC = () => {
  const { pathname } = useLocation();
  const guide = pathname.split("/").find(Boolean) || "";
  const data = guides[guide as keyof typeof guides];
  if (!data) return <NotFound />;

  const selectedProblems = data.problemSlugs
    .map((slug) => featuredProblems.find((problem) => problem.slug === slug))
    .filter((problem): problem is (typeof featuredProblems)[number] =>
      Boolean(problem),
    );
  const canonical = `${SITE_URL}/${guide}/`;

  return (
    <>
      <Seo
        title={data.seoTitle}
        description={data.description}
        keywords={`${data.title}, system design questions, architecture interview practice, distributed systems`}
        image="https://diagrammatic.next-zen.dev/og/problems.png"
        imageAlt={`${data.title} on Diagrammatic`}
        url={canonical}
        type="article"
        structuredData={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Article",
              headline: data.title,
              description: data.description,
              url: canonical,
              publisher: {
                "@type": "Organization",
                name: "Diagrammatic",
                url: `${SITE_URL}/`,
              },
            },
            {
              "@type": "FAQPage",
              mainEntity: faq.map(([question, answer]) => ({
                "@type": "Question",
                name: question,
                acceptedAnswer: { "@type": "Answer", text: answer },
              })),
            },
          ],
        }}
      />
      <div className="min-h-screen bg-[var(--bg)] text-theme">
        <header className="border-b border-theme/10 bg-[var(--surface)]">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
            <Link
              to="/"
              className="flex items-center gap-3 font-bold tracking-wide"
            >
              <img src="/logo.png" alt="" className="h-7" />
              <span>Diagrammatic</span>
            </Link>
            <nav
              className="flex items-center gap-3 sm:gap-5"
              aria-label="Primary navigation"
            >
              <Link
                to="/problems/"
                className="text-sm font-semibold text-muted hover:text-theme"
              >
                Problems
              </Link>
              <Link
                to="/learning-paths/"
                className="hidden text-sm font-semibold text-muted hover:text-theme sm:inline"
              >
                Learning paths
              </Link>
              <ThemeSwitcher />
            </nav>
          </div>
        </header>

        <main>
          <section className="border-b border-theme/10 bg-[var(--surface)]">
            <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
              <h1 className="max-w-4xl text-balance text-4xl font-bold leading-tight tracking-[-0.03em] sm:text-6xl">
                {data.title}
              </h1>
              <p className="mt-6 max-w-3xl text-lg leading-8 text-muted sm:text-xl">
                {data.intro}
              </p>
              <Link
                to="/problems/"
                className="mt-8 inline-flex items-center gap-2 rounded-xl bg-[var(--brand)] px-5 py-3 font-semibold text-white shadow-[0_8px_22px_rgba(99,102,241,0.24)] transition hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand)]"
              >
                Choose a practice problem <MdArrowForward />
              </Link>
            </div>
          </section>

          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
            <section
              aria-labelledby="method-heading"
              className="grid gap-8 lg:grid-cols-[18rem_minmax(0,1fr)]"
            >
              <div>
                <h2
                  id="method-heading"
                  className="text-3xl font-bold tracking-[-0.02em]"
                >
                  A method you can repeat
                </h2>
                <p className="mt-4 leading-7 text-muted">
                  Use the same sequence until it becomes a calm interview habit.
                </p>
              </div>
              <ol className="divide-y divide-theme/10 border-y border-theme/10">
                {data.steps.map(([title, description], index) => (
                  <li
                    key={title}
                    className="grid gap-3 py-6 sm:grid-cols-[2.5rem_12rem_1fr] sm:gap-5"
                  >
                    <span className="font-semibold tabular-nums text-[var(--brand)]">
                      {index + 1}.
                    </span>
                    <h3 className="font-bold">{title}</h3>
                    <p className="leading-7 text-muted">{description}</p>
                  </li>
                ))}
              </ol>
            </section>

            <section aria-labelledby="practice-heading" className="mt-20">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                <div>
                  <h2
                    id="practice-heading"
                    className="text-3xl font-bold tracking-[-0.02em]"
                  >
                    Put the method into practice
                  </h2>
                  <p className="mt-3 max-w-2xl leading-7 text-muted">
                    These challenges exercise different parts of the method
                    without showing you a finished solution first.
                  </p>
                </div>
                <Link
                  to="/problems/"
                  className="text-sm font-semibold text-[var(--brand)] hover:underline"
                >
                  View all problems
                </Link>
              </div>
              <div className="mt-8 grid gap-x-8 border-y border-theme/10 md:grid-cols-2">
                {selectedProblems.map((problem) => (
                  <Link
                    key={problem.slug}
                    to={`/problems/${problem.slug}/`}
                    className="group flex items-start justify-between gap-5 border-b border-theme/10 py-5 md:[&:nth-last-child(-n+2)]:border-b-0"
                  >
                    <div>
                      <h3 className="font-bold leading-6 group-hover:text-[var(--brand)]">
                        {problem.title}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-muted">
                        {problem.difficulty} · {problem.estimated_time}
                      </p>
                    </div>
                    <MdArrowForward className="mt-1 shrink-0 text-[var(--brand)] transition group-hover:translate-x-1" />
                  </Link>
                ))}
              </div>
            </section>

            <section
              aria-labelledby="faq-heading"
              className="mt-20 grid gap-8 lg:grid-cols-[18rem_minmax(0,1fr)]"
            >
              <h2
                id="faq-heading"
                className="text-3xl font-bold tracking-[-0.02em]"
              >
                Common questions
              </h2>
              <div className="space-y-8">
                {faq.map(([question, answer]) => (
                  <div key={question}>
                    <h3 className="flex items-start gap-3 text-lg font-bold">
                      <MdCheckCircleOutline className="mt-1 shrink-0 text-[var(--brand)]" />
                      {question}
                    </h3>
                    <p className="mt-3 max-w-3xl pl-8 leading-7 text-muted">
                      {answer}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section className="mt-20 rounded-2xl bg-[var(--brand)] px-6 py-8 text-white sm:flex sm:items-center sm:justify-between sm:gap-8 sm:px-8">
              <div>
                <h2 className="text-2xl font-bold">
                  Continue with a concrete next step
                </h2>
                <p className="mt-2 text-white/85">
                  Move from reading to a problem, a diagram, and a review.
                </p>
              </div>
              <Link
                to={data.nextHref}
                className="mt-5 inline-flex shrink-0 items-center gap-2 rounded-xl bg-white px-5 py-3 font-semibold text-[var(--brand)] sm:mt-0"
              >
                {data.nextLabel}
                <MdArrowForward />
              </Link>
            </section>
          </div>
        </main>
        <footer className="border-t border-theme/10 px-4 py-8 text-center text-sm text-muted">
          Diagrammatic — design architectures, explain decisions, and improve
          the result.
        </footer>
      </div>
    </>
  );
};

export default SeoGuide;
