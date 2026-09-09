import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  HiArrowDown,
  HiArrowRight,
  HiArrowUpRight,
  HiBars2,
  HiCheck,
  HiMoon,
  HiPause,
  HiPlay,
  HiSun,
  HiXMark,
} from "react-icons/hi2";
import { Button } from "../components/ui/button";
import ArchitectureDiagram, {
  type DesignPhase,
} from "../components/landing3d/ArchitectureDiagram";
import SEO from "../components/SEO";
import "./Landing3D.css";

/* Systema is the user-selected visual reference; this is an original Diagrammatic adaptation.
 * THESIS: Make the reasoning behind a system visible.
 * OWN-WORLD: Warm paper canvas, near-black sans typography, fine architectural lines, compact square controls.
 * STORY: Draw a first draft, question its read path, then introduce a cache with an explicit trade-off.
 * FIRST VIEWPORT: Left headline and action; large right architecture, with the draft/review/improve sequence beneath it.
 * FORM: User-pinned Systema; code-led geometric diagram, no stock video or abstract flower.
 * FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
 */

const phases = ["Design", "Review", "Improve"] as const;
const examplePath = "/problems/url-shortener-like-bit-ly/";

function Brand() {
  return (
    <Link className="systema-brand" to="/" aria-label="Diagrammatic home">
      <img src="/logo-64.png" alt="" aria-hidden="true" />
      <span>Diagrammatic</span>
    </Link>
  );
}

function FeatureArt({ type }: { type: "design" | "reason" | "review" }) {
  return (
    <svg
      viewBox="0 0 320 140"
      fill="none"
      aria-hidden="true"
      className="systema-feature-art"
    >
      {type === "design" && (
        <g stroke="currentColor">
          <path d="M98 69H135M185 69H225" opacity=".4" />
          <rect x="48" y="44" width="50" height="50" rx="3" />
          <rect x="135" y="31" width="50" height="76" rx="3" />
          <path d="M145 47H175M145 59H175M145 71H175M145 83H166" opacity=".5" />
          <ellipse cx="249" cy="48" rx="24" ry="10" />
          <path d="M225 48V88C225 101 273 101 273 88V48M225 67C225 80 273 80 273 67" />
          <circle cx="117" cy="69" r="3" fill="currentColor" />
        </g>
      )}
      {type === "reason" && (
        <g stroke="currentColor">
          <path d="M28 70H112M196 70H238" opacity=".42" />
          <rect x="28" y="43" width="64" height="54" rx="3" />
          <text
            x="60"
            y="64"
            fill="currentColor"
            stroke="none"
            textAnchor="middle"
            fontSize="10"
          >
            READS
          </text>
          <text
            x="60"
            y="80"
            fill="currentColor"
            stroke="none"
            textAnchor="middle"
            fontSize="11"
          >
            volume
          </text>
          <rect
            x="112"
            y="31"
            width="84"
            height="78"
            rx="3"
            fill="currentColor"
            opacity=".08"
          />
          <path d="M125 50H183M125 62H173" opacity=".42" />
          <text
            x="154"
            y="86"
            fill="currentColor"
            stroke="none"
            textAnchor="middle"
            fontSize="12"
          >
            CACHE
          </text>
          <path
            d="M196 70H214Q226 70 226 55V43M214 70Q226 70 226 85V97H238"
            opacity=".55"
          />
          <rect x="238" y="27" width="54" height="32" rx="3" />
          <rect x="238" y="81" width="54" height="32" rx="3" />
          <text
            x="265"
            y="47"
            fill="currentColor"
            stroke="none"
            textAnchor="middle"
            fontSize="10"
          >
            faster
          </text>
          <text
            x="265"
            y="101"
            fill="currentColor"
            stroke="none"
            textAnchor="middle"
            fontSize="10"
          >
            fresher
          </text>
          <path d="m232 43 6-3v6m-6 54 6-3v6" fill="none" />
        </g>
      )}
      {type === "review" && (
        <g stroke="currentColor">
          <rect x="84" y="25" width="153" height="92" rx="4" />
          <path d="M125 48H216M125 71H202M125 94H189" opacity=".4" />
          <path d="m99 47 5 5 9-10m-14 28 5 5 9-10" />
          <circle cx="106" cy="94" r="6" />
          <path d="M106 90V94M106 97V98" />
        </g>
      )}
    </svg>
  );
}

export default function Landing3D() {
  const [phase, setPhase] = useState<DesignPhase>(0);
  const [paused, setPaused] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window === "undefined") return "light";
    return window.localStorage.getItem("diagrammatic-landing-theme") === "dark"
      ? "dark"
      : "light";
  });
  const storyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    window.localStorage.setItem("diagrammatic-landing-theme", theme);
  }, [theme]);

  useEffect(() => {
    const sections =
      storyRef.current?.querySelectorAll<HTMLElement>("[data-phase]");
    if (!sections) return;
    const desktop = window.matchMedia("(min-width: 900px)");
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting)
            setPhase(
              Number(
                (entry.target as HTMLElement).dataset.phase,
              ) as DesignPhase,
            );
        }
      },
      { rootMargin: "-35% 0px -40% 0px" },
    );
    const syncObserver = () => {
      observer.disconnect();
      if (desktop.matches) {
        sections.forEach((section) => observer.observe(section));
      }
    };
    syncObserver();
    desktop.addEventListener("change", syncObserver);
    return () => {
      observer.disconnect();
      desktop.removeEventListener("change", syncObserver);
    };
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        document.getElementById("systema-menu-toggle")?.focus();
      }
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [menuOpen]);

  return (
    <div className="systema-page" data-theme={theme}>
      <SEO
        title="Diagrammatic — Design systems. Understand every decision."
        description="Practice system design on a visual canvas. Build an architecture, explain your trade-offs, review your assumptions, and improve your next iteration."
        keywords="system design, system design practice, architecture diagram, software architecture, distributed systems, architecture trade-offs, system design interview"
        image="https://diagrammatic.next-zen.dev/og/home.png"
        imageAlt="Diagrammatic system design walkthrough preview"
        url="https://diagrammatic.next-zen.dev/"
      />
      <a href="#systema-main" className="systema-skip">
        Skip to content
      </a>
      <header className="systema-header systema-container">
        <Brand />
        <nav aria-label="Main navigation" className="systema-desktop-nav">
          <a href="#how-it-works">How it works</a>
          <Link to="/problems/">Practice problems</Link>
          <Link to="/learning-paths/">Learning paths</Link>
        </nav>
        <div className="systema-nav-actions">
          <button
            type="button"
            className="systema-theme-toggle"
            aria-label={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
            title={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          >
            {theme === "light" ? <HiMoon /> : <HiSun />}
          </button>
          <Button
            asChild
            size="sm"
            className="systema-nav-cta systema-primary-cta"
          >
            <Link to="/problems/">
              Start designing <HiArrowUpRight />
            </Link>
          </Button>
          <Button
            id="systema-menu-toggle"
            variant="ghost"
            size="icon"
            className="systema-menu-toggle"
            aria-label={menuOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={menuOpen}
            aria-controls="systema-mobile-nav"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <HiXMark /> : <HiBars2 />}
          </Button>
        </div>
        {menuOpen && (
          <nav
            id="systema-mobile-nav"
            aria-label="Mobile navigation"
            className="systema-mobile-nav"
            onClick={() => setMenuOpen(false)}
          >
            <a href="#how-it-works">How it works</a>
            <Link to="/problems/">Practice problems</Link>
            <Link to="/learning-paths/">Learning paths</Link>
            <Link to="/problems/" className="systema-mobile-nav-cta">
              Start designing <HiArrowUpRight />
            </Link>
          </nav>
        )}
      </header>

      <main id="systema-main">
        <div ref={storyRef} className="systema-story systema-container">
          <section
            className="systema-intro systema-story-copy"
            data-phase="0"
            aria-labelledby="systema-title"
          >
            <h1 id="systema-title">
              Design systems.
              <br />
              <span>
                Understand
                <br />
                every decision.
              </span>
            </h1>
            <p>
              Go beyond connecting boxes. Build an architecture, explain your
              trade-offs, and turn thoughtful feedback into a stronger design.
            </p>
            <div className="systema-hero-actions">
              <Button asChild size="lg" className="systema-primary-cta">
                <Link to="/problems/">
                  Start designing <HiArrowUpRight />
                </Link>
              </Button>
              <a className="systema-text-link" href="#how-it-works">
                See how it works <HiArrowDown />
              </a>
            </div>
            <div className="systema-scroll-note">
              <span className="systema-scroll-line" />A first draft is just the
              beginning.
            </div>
          </section>

          <div className="systema-stage-column">
            <figure className="systema-stage">
              <figcaption className="systema-stage-heading">
                <span>URL shortener</span>
                <span>Illustrative walkthrough</span>
              </figcaption>
              <ArchitectureDiagram phase={phase} paused={paused} />
              <div className="systema-stage-toolbar">
                <div
                  className="systema-phase-controls"
                  role="group"
                  aria-label="Architecture walkthrough stage"
                >
                  {phases.map((label, index) => (
                    <button
                      key={label}
                      type="button"
                      aria-pressed={phase === index}
                      onClick={() => setPhase(index as DesignPhase)}
                    >
                      <span>{String(index + 1).padStart(2, "0")}</span>
                      {label}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  className="systema-motion-toggle"
                  aria-label={
                    paused
                      ? "Play diagram animation"
                      : "Pause diagram animation"
                  }
                  onClick={() => setPaused(!paused)}
                >
                  {paused ? <HiPlay /> : <HiPause />}
                </button>
              </div>
              <div
                className={`systema-stage-insight phase-${phase}`}
                aria-live="polite"
                aria-atomic="true"
              >
                <span className="systema-insight-dot" />
                <p>
                  {phase === 0
                    ? "Start with the request path. Make your assumptions visible."
                    : phase === 1
                      ? "A popular link repeats the same database read. What would you change?"
                      : "Cache popular links. Now consider expiry, invalidation, and cache misses."}
                </p>
              </div>
            </figure>
          </div>

          <section
            id="how-it-works"
            className="systema-review systema-story-copy"
            data-phase="1"
            aria-labelledby="systema-review-title"
          >
            <h2 id="systema-review-title">
              Good questions.
              <br />
              <span>Better architecture.</span>
            </h2>
            <p>
              A diagram shows what connects. Your reasoning explains why. Review
              the decisions behind your design, from the busiest read path to
              the failure you haven’t planned for.
            </p>
            <div className="systema-review-excerpt">
              <span>Example review question</span>
              <p>“What happens when one short link goes viral?”</p>
              <span>Scalability · Read path</span>
            </div>
            <Link className="systema-text-link" to={examplePath}>
              Explore the URL shortener problem <HiArrowUpRight />
            </Link>
          </section>

          <section
            className="systema-improve systema-story-copy"
            data-phase="2"
            aria-labelledby="systema-improve-title"
          >
            <h2 id="systema-improve-title">
              Think it through.
              <br />
              <span>Make it stronger.</span>
            </h2>
            <p>
              Add a cache to take repeated reads off the database. Explain the
              new trade-offs. Then review again. Every iteration is a chance to
              understand the system more deeply.
            </p>
            <ul className="systema-decisions">
              <li>
                <HiCheck /> Make a design decision
              </li>
              <li>
                <HiCheck /> Explain what you gain and give up
              </li>
              <li>
                <HiCheck /> Revisit it with structured feedback
              </li>
            </ul>
            <Button asChild variant="outline" className="systema-outline-cta">
              <Link to={examplePath}>
                Try this problem <HiArrowUpRight />
              </Link>
            </Button>
          </section>
        </div>

        <section
          className="systema-capabilities systema-container"
          aria-labelledby="systema-capabilities-title"
        >
          <div className="systema-section-heading">
            <h2 id="systema-capabilities-title">
              A place to build
              <br />
              <span>your systems thinking.</span>
            </h2>
            <p>
              From a blank canvas to a decision
              <br className="systema-desktop-break" /> you can confidently
              explain.
            </p>
          </div>
          <div className="systema-features">
            <Link to="/problems/" className="systema-feature">
              <FeatureArt type="design" />
              <div>
                <h3>
                  Build with purpose <HiArrowUpRight />
                </h3>
                <p>
                  Start with a system-design problem and turn its requirements
                  into an architecture.
                </p>
              </div>
            </Link>
            <Link to="/learning-paths/" className="systema-feature">
              <FeatureArt type="reason" />
              <div>
                <h3>
                  Connect the reasoning <HiArrowUpRight />
                </h3>
                <p>
                  Explore the concepts behind your choices, from caching to
                  distributed systems.
                </p>
              </div>
            </Link>
            <Link to={examplePath} className="systema-feature">
              <FeatureArt type="review" />
              <div>
                <h3>
                  Learn through review <HiArrowUpRight />
                </h3>
                <p>
                  Explain your assumptions. Get structured feedback. Give your
                  next iteration a direction.
                </p>
              </div>
            </Link>
          </div>
        </section>

        <section
          className="systema-value systema-container"
          aria-labelledby="systema-value-title"
        >
          <div className="systema-value-heading">
            <span>THE PAYOFF</span>
            <h2 id="systema-value-title">
              Leave with a design
              <br />
              <span>you can explain.</span>
            </h2>
          </div>
          <div className="systema-value-grid">
            <article>
              <span className="systema-value-index">01</span>
              <h3>Practice before signing in</h3>
              <p>Start with a realistic prompt in the free workflow.</p>
            </article>
            <article>
              <span className="systema-value-index">02</span>
              <h3>Get structured AI feedback</h3>
              <p>
                See where scale, reliability, data design, and trade-offs need
                work.
              </p>
            </article>
            <article>
              <span className="systema-value-index">03</span>
              <h3>Save and share when ready</h3>
              <p>
                Keep your architecture, sync progress, and bring it to your
                team.
              </p>
            </article>
          </div>
        </section>

        <section
          className="systema-close systema-container"
          aria-labelledby="systema-close-title"
        >
          <h2 id="systema-close-title">
            Your next good idea
            <br />
            <span>starts on the canvas.</span>
          </h2>
          <Button asChild size="lg" className="systema-primary-cta">
            <Link to="/problems/">
              Find your first problem <HiArrowRight />
            </Link>
          </Button>
        </section>
      </main>
      <footer className="systema-footer systema-container">
        <Brand />
        <p>Design. Explain. Improve.</p>
        <a href="#systema-main">
          Back to top <HiArrowUpRight />
        </a>
      </footer>
    </div>
  );
}
