import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import ThemeSwitcher from "../components/ThemeSwitcher";
import { useTheme } from "../hooks/useTheme";
import SEO from "../components/SEO";
import { useAuth } from "../hooks/useAuth";
import { useOnboarding } from "../hooks/useOnboarding";
import { useTour } from "../hooks/useTour";
import { MdHelpOutline } from "react-icons/md";
import { AuthModal } from "../components/AuthModal";
import { apiService } from "../services/api";
import type { SavedDiagram } from "../types/auth";
import { VscAzureDevops } from "react-icons/vsc";
import { VscAzure } from "react-icons/vsc";
import { SiGooglecloud } from "react-icons/si";
import { FaAws } from "react-icons/fa6";
import { FaServer, FaBolt, FaNetworkWired, FaCloud } from "react-icons/fa";
import {
  HiAcademicCap,
  HiPencilSquare,
  HiDocumentPlus,
  HiCube,
  HiCloud,
  HiArrowsRightLeft,
  HiAdjustmentsHorizontal,
  HiSparkles,
  HiArrowUpTray,
  HiDocumentText,
  HiUserGroup,
  HiBriefcase,
} from "react-icons/hi2";

const HERO_WORDS = [
  "Visually, Intuitively",
  "Clearly, Collaboratively",
  "Quickly, Confidently",
  "Precisely, Purposefully",
];

const HERO_ICONS: {
  id: string;
  Icon: React.ComponentType<{ size?: number }>;
  top: number;
  left: number;
  size: number;
  depth: number;
  animDur: string;
  animDelay: string;
}[] = [
  {
    id: "aws",
    Icon: FaAws,
    top: 8,
    left: 74,
    size: 48,
    depth: 28,
    animDur: "22s",
    animDelay: "0s",
  },
  {
    id: "azure",
    Icon: VscAzure,
    top: 55,
    left: 18,
    size: 48,
    depth: 16,
    animDur: "30s",
    animDelay: "4s",
  },
  {
    id: "gcp",
    Icon: SiGooglecloud,
    top: 58,
    left: 80,
    size: 48,
    depth: 22,
    animDur: "26s",
    animDelay: "2s",
  },
  {
    id: "ec2",
    Icon: FaServer,
    top: 8,
    left: 21,
    size: 48,
    depth: 32,
    animDur: "20s",
    animDelay: "6s",
  },
  {
    id: "elb",
    Icon: FaNetworkWired,
    top: 42,
    left: 4,
    size: 48,
    depth: 18,
    animDur: "28s",
    animDelay: "8s",
  },
  {
    id: "lambda",
    Icon: FaBolt,
    top: 84,
    left: 8,
    size: 42,
    depth: 24,
    animDur: "24s",
    animDelay: "3s",
  },
  {
    id: "devops",
    Icon: VscAzureDevops,
    top: 86,
    left: 68,
    size: 42,
    depth: 14,
    animDur: "32s",
    animDelay: "5s",
  },
  {
    id: "amplify",
    Icon: FaCloud,
    top: 83,
    left: 88,
    size: 42,
    depth: 30,
    animDur: "18s",
    animDelay: "7s",
  },
];

const Home: React.FC = () => {
  useTheme();
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { user, isAuthenticated, login, signup, googleLogin, logout } =
    useAuth();
  const { isNewToPage, markPageVisited } = useOnboarding();
  const { startTour } = useTour("home");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [savedDiagrams, setSavedDiagrams] = useState<SavedDiagram[]>([]);
  const [loadingDiagrams, setLoadingDiagrams] = useState(false);
  const [heroWordIndex, setHeroWordIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [statCounts, setStatCounts] = useState([0, 0, 0]);
  const [scrollProgress, setScrollProgress] = useState(0);
  const heroRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mousePxRef = useRef({ x: -9999, y: -9999 });

  const handleNavigate = (route: string, requiresAuth = true) => {
    if (requiresAuth && !isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    navigate(route);
  };

  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Mark page visited + auto-start tour for new users
  useEffect(() => {
    const isNew = isNewToPage("home");
    markPageVisited("home");
    if (isNew) {
      const t = setTimeout(() => startTour(), 1200);
      return () => clearTimeout(t);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
      const total = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(total > 0 ? (window.scrollY / total) * 100 : 0);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Load user's diagrams when authenticated
  useEffect(() => {
    const loadDiagrams = async () => {
      if (!isAuthenticated) {
        setSavedDiagrams([]);
        return;
      }

      setLoadingDiagrams(true);
      try {
        const diagrams = await apiService.getUserDiagrams();
        setSavedDiagrams(diagrams);
      } catch (error) {
        console.error("Failed to load diagrams:", error);
      } finally {
        setLoadingDiagrams(false);
      }
    };

    loadDiagrams();
  }, [isAuthenticated]);

  useEffect(() => {
    const currentWord = HERO_WORDS[heroWordIndex];
    let timeoutId: ReturnType<typeof setTimeout>;

    if (!isDeleting && displayedText === currentWord) {
      timeoutId = setTimeout(() => setIsDeleting(true), 1800);
    } else if (isDeleting && displayedText === "") {
      const next = (heroWordIndex + 1) % HERO_WORDS.length;
      setIsDeleting(false);
      setHeroWordIndex(next);
    } else if (isDeleting) {
      timeoutId = setTimeout(
        () => setDisplayedText(displayedText.slice(0, -1)),
        40,
      );
    } else {
      timeoutId = setTimeout(
        () => setDisplayedText(currentWord.slice(0, displayedText.length + 1)),
        70,
      );
    }

    return () => clearTimeout(timeoutId);
  }, [displayedText, isDeleting, heroWordIndex]);

  useEffect(() => {
    const targets = [1000, 90, 1000];
    const duration = 1600;
    const startTime = Date.now();
    let rafId: number;
    const tick = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setStatCounts([
        Math.round(targets[0] * eased),
        Math.round(targets[1] * eased),
        Math.round(targets[2] * eased),
      ]);
      if (progress < 1) {
        rafId = requestAnimationFrame(tick);
      }
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;
    const onMove = (e: MouseEvent) => {
      const r = hero.getBoundingClientRect();
      mousePxRef.current = { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    const onLeave = () => {
      mousePxRef.current = { x: -9999, y: -9999 };
    };
    hero.addEventListener("mousemove", onMove);
    hero.addEventListener("mouseleave", onLeave);
    return () => {
      hero.removeEventListener("mousemove", onMove);
      hero.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const N = 72;
    const LINK_DIST = 135;
    type P = { x: number; y: number; vx: number; vy: number };
    let particles: P[] = [];
    let W = 0;
    let H = 0;
    let rafId = 0;

    const resize = () => {
      W = canvas.offsetWidth;
      H = canvas.offsetHeight;
      if (W === 0 || H === 0) return;
      canvas.width = W;
      canvas.height = H;
    };

    const frame = () => {
      if (W === 0 || H === 0) {
        rafId = requestAnimationFrame(frame);
        return;
      }
      ctx.clearRect(0, 0, W, H);
      const mx = mousePxRef.current.x;
      const my = mousePxRef.current.y;

      for (const p of particles) {
        const dx = p.x - mx;
        const dy = p.y - my;
        const d2 = dx * dx + dy * dy;
        if (d2 < 14400 && d2 > 0) {
          const d = Math.sqrt(d2);
          const f = ((120 - d) / 120) * 0.07;
          p.vx += (dx / d) * f;
          p.vy += (dy / d) * f;
        }
        p.vx *= 0.987;
        p.vy *= 0.987;
        const spd = Math.hypot(p.vx, p.vy);
        if (spd > 1.4) {
          p.vx = (p.vx / spd) * 1.4;
          p.vy = (p.vy / spd) * 1.4;
        }
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) {
          p.x = 0;
          p.vx = Math.abs(p.vx);
        } else if (p.x > W) {
          p.x = W;
          p.vx = -Math.abs(p.vx);
        }
        if (p.y < 0) {
          p.y = 0;
          p.vy = Math.abs(p.vy);
        } else if (p.y > H) {
          p.y = H;
          p.vy = -Math.abs(p.vy);
        }
      }

      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 0.7;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i];
          const b = particles[j];
          const dist = Math.hypot(a.x - b.x, a.y - b.y);
          if (dist < LINK_DIST) {
            ctx.globalAlpha = (1 - dist / LINK_DIST) * 0.2;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      ctx.fillStyle = "#ffffff";
      ctx.globalAlpha = 0.35;
      for (const p of particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      rafId = requestAnimationFrame(frame);
    };

    resize();
    particles = Array.from({ length: N }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.55,
      vy: (Math.random() - 0.5) * 0.55,
    }));
    rafId = requestAnimationFrame(frame);

    const onResize = () => resize();
    window.addEventListener("resize", onResize, { passive: true });
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add("reveal-visible");
        }),
      { threshold: 0.1 },
    );
    document
      .querySelectorAll("[data-reveal-group], [data-reveal]")
      .forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const handleOpenDiagram = (diagramId: string) => {
    handleNavigate(`/playground/free?diagramId=${diagramId}`);
  };

  const getStatDisplayValue = (index: number): string => {
    if (index === 0) return statCounts[0] >= 1000 ? "1k+" : `${statCounts[0]}`;
    if (index === 1) return statCounts[1] >= 90 ? "90+" : `${statCounts[1]}`;
    if (index === 2) return statCounts[2] >= 1000 ? "1k+" : `${statCounts[2]}`;
    return "\u221e";
  };

  const features = [
    {
      icon: <HiAcademicCap className="w-8 h-8" />,
      title: "Practice Problems",
      description:
        "Work through curated system design problems with real-world scenarios and guided requirements.",
      action: "Browse Problems",
      route: "/problems",
      requiresAuth: false,
    },
    {
      icon: <HiPencilSquare className="w-8 h-8" />,
      title: "Design Studio",
      description:
        "Build system designs, ER diagrams, and UML diagrams on a free-form canvas. Start from scratch.",
      action: "Open Canvas",
      route: "/playground/free",
      requiresAuth: true,
    },
    {
      icon: <HiDocumentPlus className="w-8 h-8" />,
      title: "Custom Problems",
      description:
        "Define your own problem statement, then solve it in an interactive canvas with AI assessment.",
      action: "Create Problem",
      route: "/create-problem",
      requiresAuth: true,
    },
  ];

  const capabilities = [
    {
      icon: <HiCube className="w-6 h-6" />,
      title: "1,000+ Components",
      description:
        "System design, ER, UML, and cloud components all in one palette.",
    },
    {
      icon: <HiCloud className="w-6 h-6" />,
      title: "Cloud Providers",
      description:
        "AWS, Azure, and GCP components for accurate cloud architecture diagrams.",
    },
    {
      icon: <HiArrowsRightLeft className="w-6 h-6" />,
      title: "Smart Connections",
      description:
        "Draw labeled edges to show data flow, dependencies, and relationships.",
    },
    {
      icon: <HiAdjustmentsHorizontal className="w-6 h-6" />,
      title: "Custom Properties",
      description:
        "Attach notes, metadata, and custom fields to any component.",
    },
    {
      icon: <HiSparkles className="w-6 h-6" />,
      title: "AI Assessment",
      description:
        "Get instant AI feedback on your design's quality and trade-offs.",
    },
    {
      icon: <HiArrowUpTray className="w-6 h-6" />,
      title: "Export & Share",
      description: "Export as an image or share a live link with teammates.",
    },
  ];

  const stats = [
    { value: "1k+", label: "Components", icon: <HiCube className="w-5 h-5" /> },
    {
      value: "90+",
      label: "Problems",
      icon: <HiDocumentText className="w-5 h-5" />,
    },
    { value: "1k+", label: "Users", icon: <HiUserGroup className="w-5 h-5" /> },
    {
      value: "∞",
      label: "Possibilities",
      icon: <HiSparkles className="w-5 h-5" />,
    },
  ];

  const testimonials = [
    {
      quote:
        "This tool transformed how I prepare for system design interviews.",
      author: "Software Engineer",
      role: "FAANG Company",
    },
    {
      quote: "Perfect for teaching distributed systems to my students.",
      author: "Professor",
      role: "University CS Dept",
    },
    {
      quote: "I use it daily to plan architecture for client projects.",
      author: "Solutions Architect",
      role: "Tech Consulting",
    },
  ];

  const useCases = [
    {
      icon: <HiAcademicCap className="w-6 h-6" />,
      iconColor: "text-blue-500",
      bg: "bg-blue-500/10",
      title: "Students",
      description:
        "Learn system design concepts through hands-on practice with real-world problems.",
      action: "Start practicing",
    },
    {
      icon: <HiBriefcase className="w-6 h-6" />,
      iconColor: "text-purple-500",
      bg: "bg-purple-500/10",
      title: "Professionals",
      description:
        "Plan and document architecture for your projects with a shareable visual canvas.",
      action: "Start designing",
    },
    {
      icon: <HiUserGroup className="w-6 h-6" />,
      iconColor: "text-orange-500",
      bg: "bg-orange-500/10",
      title: "Educators",
      description:
        "Create custom problems and assignments for students to tackle independently.",
      action: "Create a problem",
    },
  ];

  return (
    <>
      <SEO
        title="Diagrammatic — Interactive System Design Playground | Learn Architecture Design"
        description="Master system design with Diagrammatic - an interactive playground featuring 1k+ components including AWS, Azure & GCP cloud components, AI assessment, UML & ER diagrams, and cloud infrastructure practice problems. Free system architecture tool for students, professionals, and educators."
        keywords="system design, architecture diagram, system design interview, software architecture, distributed systems, scalable architecture, system design tool, architecture playground, cloud architecture, microservices design, ER diagram, entity relationship diagram, UML diagram, class diagram, database design"
        url="https://satya00089.github.io/diagrammatic/"
      />
      <div className="min-h-screen bg-[var(--bg)] text-theme relative grid-pattern-overlay">
        {/* Header */}
        <header
          className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
            isScrolled
              ? "shadow-lg backdrop-blur-md bg-[var(--brand)]/90"
              : "bg-[var(--brand)]"
          }`}
        >
          {/* Scroll progress bar */}
          <div
            className="absolute bottom-0 left-0 h-[2px] bg-white/40 pointer-events-none transition-none"
            style={{ width: `${scrollProgress}%` }}
            aria-hidden="true"
          />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <button
                type="button"
                onClick={() => handleNavigate("/", false)}
                className="flex items-center space-x-3 group cursor-pointer"
              >
                <img
                  src="/logo.png"
                  alt="Logo"
                  className="h-10 transition-transform group-hover:scale-110 duration-300"
                />
                <span className="text-xl font-bold text-white">
                  Diagrammatic
                </span>
              </button>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  data-tour="nav-problems"
                  onClick={() => handleNavigate("/problems", false)}
                  className="hidden md:block px-4 py-2 text-sm font-medium text-white hover:text-white/80 transition-colors cursor-pointer"
                >
                  Problems
                </button>
                {isAuthenticated && (
                  <button
                    type="button"
                    onClick={() => handleNavigate("/diagrams")}
                    className="hidden md:block px-4 py-2 text-sm font-medium text-white hover:text-white/80 transition-colors cursor-pointer"
                  >
                    My Designs
                  </button>
                )}

                {/* Tour trigger */}
                <button
                  type="button"
                  onClick={startTour}
                  className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-white/80 hover:text-white hover:bg-white/20 rounded-md transition-colors cursor-pointer"
                >
                  <MdHelpOutline className="h-4 w-4" />
                  <span className="hidden sm:inline">Tour</span>
                </button>

                <ThemeSwitcher />

                {/* Authentication UI */}
                <div className="relative">
                  {isAuthenticated ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setShowUserMenu(!showUserMenu)}
                        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white hover:bg-white/20 rounded-md transition-colors"
                      >
                        {user?.picture ? (
                          <img
                            src={user.picture}
                            alt={user.name || "User"}
                            className="w-8 h-8 rounded-full object-cover border-2 border-white/30"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-white/30 flex items-center justify-center font-bold">
                            {user?.name?.[0]?.toUpperCase() ||
                              user?.email?.[0]?.toUpperCase() ||
                              "U"}
                          </div>
                        )}
                        <span className="hidden sm:inline">
                          {user?.name || user?.email}
                        </span>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </button>

                      {showUserMenu && (
                        <div className="absolute top-full right-0 mt-1 bg-[var(--surface)] shadow-lg rounded-lg border border-theme/10 py-1 z-50 min-w-[180px]">
                          <div className="px-4 py-2 border-b border-theme/10">
                            <p className="text-sm font-medium text-theme">
                              {user?.name || "User"}
                            </p>
                            <p className="text-xs text-muted truncate">
                              {user?.email}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              logout();
                              setShowUserMenu(false);
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          >
                            Sign Out
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowAuthModal(true)}
                      className="px-4 py-2 text-sm font-medium bg-white/20 text-white rounded-md hover:bg-white/30 transition-colors"
                    >
                      Sign In
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="relative pt-16">
          {/* Hero Background Card */}
          <div
            ref={heroRef}
            className="relative overflow-hidden bg-[var(--brand)] flex flex-col min-h-[calc(100vh-4rem)]"
          >
            {/* Aurora gradient layer */}
            <div
              className="hero-aurora absolute inset-0 pointer-events-none"
              aria-hidden="true"
            />
            {/* Particle network canvas */}
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full pointer-events-none"
              aria-hidden="true"
            />
            {/* Animated decorative graph */}
            <div className="absolute inset-0 pointer-events-none">
              {/* SVG connection lines */}
              {/* Parallax floating nodes */}
              {HERO_ICONS.map((ic) => (
                <div
                  key={ic.id}
                  className="absolute"
                  style={{
                    top: `${ic.top}%`,
                    left: `${ic.left}%`,
                  }}
                >
                  <div
                    className="w-14 h-14 sm:w-20 sm:h-20 text-white/10"
                    style={{
                      animation: `hero-float ${ic.animDur} ease-in-out infinite`,
                      animationDelay: ic.animDelay,
                    }}
                  >
                    <ic.Icon size={ic.size} />
                  </div>
                </div>
              ))}
            </div>

            {/* Grid overlay for design aesthetic */}
            <div className="absolute inset-0 opacity-[0.03] hero-grid-overlay" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex-1 flex flex-col items-center justify-center py-12 sm:py-16 w-full">
              <div
                className={`relative z-10 text-center transition-all duration-1000 ${
                  isVisible
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-10"
                }`}
              >
                <div className="inline-block mb-6">
                  <span className="px-3 py-1.5 sm:px-4 sm:py-2 bg-white/15 text-white/90 text-xs sm:text-sm font-medium rounded-full inline-flex items-center gap-1 flex-wrap justify-center">
                    <span className="text-green-400 animate-pulse text-base sm:text-xl">
                      ●
                    </span>
                    <span>{" 1,000+ components"}</span>
                    <span className="hidden sm:inline">
                      {" · AWS, Azure & GCP · AI assessment"}
                    </span>
                  </span>
                </div>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight tracking-tight text-white">
                  System Design
                  <br />
                  <span className="text-white/85 inline-block">
                    {displayedText}
                    <span className="cursor-blink">|</span>
                  </span>
                </h1>
                <p className="text-sm sm:text-base lg:text-lg text-white/75 max-w-2xl mx-auto mb-8 leading-relaxed">
                  The interactive playground for system design, ER diagrams, and
                  UML — featuring AWS, Azure & GCP cloud components, cloud
                  infrastructure problems, and AI-powered assessment
                </p>

                {/* Stats Bar */}
                <div className="flex flex-wrap justify-center gap-3 sm:gap-6 lg:gap-8 mb-8 sm:mb-12">
                  {stats.map((stat, index) => {
                    const delay =
                      [
                        "fade-in-up-delay-100",
                        "fade-in-up-delay-200",
                        "fade-in-up-delay-300",
                        "fade-in-up-delay-400",
                      ][index] ?? "fade-in-up-delay-400";
                    return (
                      <div
                        key={stat.label}
                        className={`text-center transition-all duration-300 bg-white/10 rounded-xl px-3 py-2 sm:px-5 sm:py-3 hover:bg-white/15 ${
                          isVisible ? "fade-in-up" : "opacity-0 translate-y-5"
                        } ${delay}`}
                      >
                        <div className="flex justify-center mb-1 text-white/80">
                          {stat.icon}
                        </div>
                        <div className="text-xl sm:text-2xl font-bold text-white tabular-nums">
                          {getStatDisplayValue(index)}
                        </div>
                        <div className="text-xs text-white/70 tracking-wide">
                          {stat.label}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center" data-tour="hero-cta">
                  <button
                    type="button"
                    data-tour="nav-studio"
                    onClick={() => handleNavigate("/playground/free")}
                    className="px-7 py-3.5 bg-white text-[var(--brand)] text-base font-semibold rounded-lg hover:shadow-lg cursor-pointer btn-shimmer"
                  >
                    Design Studio →
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNavigate("/problems", false)}
                    className="px-7 py-3.5 bg-white/10 border border-white/25 text-white/85 text-base font-medium rounded-lg hover:bg-white/15 transition-colors cursor-pointer"
                  >
                    Explore Problems →
                  </button>
                </div>

                <p className="mt-5 text-xs text-white/65">
                  Trusted by 1000+ developers · AI-powered feedback · Open
                  source
                </p>
              </div>
            </div>
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 animate-bounce opacity-40 pointer-events-none">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>
        </section>

        {/* My Diagrams Section - Only shown when authenticated */}
        {isAuthenticated && (
          <section className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 relative">
            <div className="max-w-7xl mx-auto relative z-10">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold mb-1">My Designs</h2>
                  <p className="text-muted">
                    Your saved diagrams and shared workspaces
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {savedDiagrams.length > 0 && (
                    <button
                      type="button"
                      onClick={() => handleNavigate("/diagrams")}
                      className="px-5 py-2.5 text-sm font-medium text-theme hover:text-[var(--brand)] transition-colors"
                    >
                      View All
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleNavigate("/playground/free")}
                    className="px-6 py-3 bg-[var(--brand)] text-white font-semibold rounded-lg hover:brightness-95 transition-all flex items-center gap-2"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    New Design
                  </button>
                </div>
              </div>

              {(() => {
                if (loadingDiagrams) {
                  return (
                    <div className="flex items-center justify-center py-20">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--brand)]"></div>
                    </div>
                  );
                }

                if (savedDiagrams.length === 0) {
                  return (
                    <div className="text-center py-12 rounded-xl border border-theme/10 p-8 elevated-card-bg">
                      <div className="flex justify-center mb-4 text-[var(--brand)]/40">
                        <HiPencilSquare className="w-14 h-14" />
                      </div>
                      <h3 className="text-xl font-semibold text-theme mb-2">
                        No designs yet
                      </h3>
                      <p className="text-muted mb-6">
                        Create your first design — it only takes a minute.
                      </p>
                      <button
                        type="button"
                        onClick={() => navigate("/playground/free")}
                        className="px-6 py-3 bg-[var(--brand)] text-white font-semibold rounded-lg hover:brightness-95 transition-all"
                      >
                        Create Your First Design
                      </button>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {savedDiagrams.slice(0, 6).map((diagram) => (
                      <div
                        key={diagram.id}
                        onClick={() => handleOpenDiagram(diagram.id)}
                        className="group rounded-xl border border-theme/8 p-5 hover:shadow-sm transition-all duration-200 hover:-translate-y-0.5 cursor-pointer elevated-card-bg"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-theme group-hover:text-[var(--brand)] transition-colors mb-1 line-clamp-1">
                              {diagram.title}
                            </h3>

                            {/* Owner Info & Permission Badges */}
                            {!diagram.isOwner && (
                              <div className="mb-2 flex items-center gap-2 flex-wrap">
                                {/* Owner Info Badge */}
                                <div className="group/owner relative rounded-lg bg-purple-50 dark:bg-purple-900/20 px-2.5 py-1.5 border border-purple-200/60 dark:border-purple-700/40 transition-all duration-300 inline-flex items-center gap-2">
                                  <div className="relative flex items-center gap-1.5">
                                    {/* Avatar */}
                                    <div className="relative flex-shrink-0">
                                      {diagram.owner.pictureUrl ? (
                                        <img
                                          src={diagram.owner.pictureUrl}
                                          alt={diagram.owner.name}
                                          className="w-5 h-5 rounded-full object-cover ring-1 ring-purple-300 dark:ring-purple-600"
                                        />
                                      ) : (
                                        <div className="w-5 h-5 rounded-full bg-purple-600 flex items-center justify-center text-[9px] text-white font-bold">
                                          {diagram.owner.name[0]?.toUpperCase()}
                                        </div>
                                      )}
                                      {/* Online indicator */}
                                      <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full border border-white dark:border-gray-900" />
                                    </div>

                                    {/* Owner Name */}
                                    <div className="flex items-center gap-1">
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-2.5 w-2.5 text-purple-600 dark:text-purple-400"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth={3}
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                                        />
                                      </svg>
                                      <span className="text-xs font-bold text-purple-800 dark:text-purple-300">
                                        {diagram.owner.name}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* Permission Badge */}
                                <div
                                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-bold text-xs transition-all duration-300 ${
                                    diagram.permission === "edit"
                                      ? "bg-emerald-600 text-white hover:shadow-sm"
                                      : "bg-slate-500 text-white hover:shadow-sm"
                                  }`}
                                >
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-3.5 w-3.5"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={2.5}
                                  >
                                    {diagram.permission === "edit" ? (
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                      />
                                    ) : (
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                      />
                                    )}
                                  </svg>
                                  <span>
                                    {diagram.permission === "edit"
                                      ? "Can Edit"
                                      : "View Only"}
                                  </span>
                                </div>
                              </div>
                            )}

                            {diagram.description && (
                              <p className="text-sm text-muted line-clamp-2">
                                {diagram.description}
                              </p>
                            )}
                          </div>
                          <div className="ml-2 text-muted/30">
                            <HiCube className="w-7 h-7" />
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-muted mb-4">
                          <span className="flex items-center gap-1">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                              />
                            </svg>
                            {diagram.nodes.length} node
                            {diagram.nodes.length !== 1 ? "s" : ""}
                          </span>
                          <span className="flex items-center gap-1">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                              />
                            </svg>
                            {diagram.edges.length} connection
                            {diagram.edges.length !== 1 ? "s" : ""}
                          </span>
                        </div>

                        <div className="text-xs text-muted">
                          Updated{" "}
                          {new Date(diagram.updatedAt).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            },
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </section>
        )}

        {/* Feature Cards */}
        <section className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-7xl mx-auto relative z-10">
            <h2
              className="text-2xl md:text-3xl font-bold tracking-tight text-center mb-3"
              data-reveal
            >
              Choose Your Path
            </h2>
            <p className="text-muted text-center mb-12 max-w-xl mx-auto leading-relaxed">
              Whether you're learning, building, or teaching — we've got you
              covered
            </p>
            <div
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8"
              data-reveal-group
            >
              {features.map((feature, index) => {
                const delay =
                  ["delay-0", "delay-100", "delay-200"][index] ?? "delay-200";
                return (
                  <div
                    key={feature.title}
                    className={`group relative rounded-xl border border-theme/8 p-5 sm:p-7 hover:shadow-md cursor-pointer overflow-hidden transition-all duration-300 elevated-card-bg ${delay}`}
                    onClick={() =>
                      handleNavigate(feature.route, feature.requiresAuth)
                    }
                    onKeyDown={(e) =>
                      e.key === "Enter" &&
                      handleNavigate(feature.route, feature.requiresAuth)
                    }
                    role="button"
                    tabIndex={0}
                  >
                    <div className="mb-5 text-[var(--brand)]">
                      {feature.icon}
                    </div>
                    <h3 className="text-lg font-semibold mb-2 text-theme group-hover:text-[var(--brand)] transition-colors duration-200">
                      {feature.title}
                    </h3>
                    <p className="text-muted mb-5 leading-relaxed text-sm">
                      {feature.description}
                    </p>
                    <div className="inline-flex items-center gap-1 text-[var(--brand)] font-medium text-sm">
                      {feature.action}
                      <span className="inline-block transition-transform duration-200 group-hover:translate-x-1 ml-0.5">
                        →
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Capabilities Grid */}
        <section className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-7xl mx-auto relative z-10">
            <h2
              className="text-2xl md:text-3xl font-bold tracking-tight text-center mb-3"
              data-reveal
            >
              Powerful Features
            </h2>
            <p className="text-muted text-center mb-12 max-w-xl mx-auto leading-relaxed">
              Everything you need to design, document, and share system
              architectures
            </p>
            <div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6"
              data-reveal-group
            >
              {capabilities.map((capability, capIndex) => {
                const delay =
                  [
                    "delay-0",
                    "delay-[50ms]",
                    "delay-[100ms]",
                    "delay-[150ms]",
                    "delay-[200ms]",
                    "delay-[250ms]",
                  ][capIndex] ?? "delay-[250ms]";
                return (
                  <div
                    key={capability.title}
                    className={`group rounded-xl border border-theme/8 p-5 hover:shadow-sm transition-all duration-200 elevated-card-bg ${delay}`}
                  >
                    <div className="mb-3 text-[var(--brand)]">
                      {capability.icon}
                    </div>
                    <h3 className="text-base font-semibold mb-1.5 text-theme">
                      {capability.title}
                    </h3>
                    <p className="text-muted text-sm leading-relaxed">
                      {capability.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-7xl mx-auto relative z-10">
            <h2
              className="text-2xl md:text-3xl font-bold tracking-tight text-center mb-3"
              data-reveal
            >
              Loved by Designers Worldwide
            </h2>
            <p className="text-muted text-center mb-12 max-w-xl mx-auto leading-relaxed">
              Join thousands who trust Diagrammatic for their system design
              needs
            </p>
            <div
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8"
              data-reveal-group
            >
              {testimonials.map((testimonial) => (
                <div
                  key={`${testimonial.author}-${testimonial.role}`}
                  className="group relative rounded-xl border border-theme/8 p-6 hover:shadow-sm transition-all duration-200 elevated-card-bg"
                >
                  <div className="relative z-10">
                    <p className="text-muted mb-5 leading-relaxed text-sm italic">
                      "{testimonial.quote}"
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[var(--brand)]/15 flex items-center justify-center text-[var(--brand)] font-semibold text-sm">
                        {testimonial.author.charAt(0)}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-theme">
                          {testimonial.author}
                        </div>
                        <div className="text-muted text-xs">
                          {testimonial.role}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Use Cases */}
        <section className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-7xl mx-auto relative z-10">
            <h2
              className="text-2xl md:text-3xl font-bold tracking-tight text-center mb-10"
              data-reveal
            >
              Perfect For Every Role
            </h2>
            <div
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-10"
              data-reveal-group
            >
              {useCases.map((useCase) => (
                <div
                  key={useCase.title}
                  className="group text-center p-6 rounded-xl hover:elevated-card-bg hover:shadow-sm transition-all duration-200 hover:-translate-y-0.5"
                  role="button"
                  tabIndex={0}
                >
                  <div className="relative inline-block mb-6">
                    <div
                      className={`relative w-14 h-14 mx-auto ${useCase.bg} ${useCase.iconColor} rounded-2xl flex items-center justify-center group-hover:scale-105 transition-transform duration-200`}
                    >
                      {useCase.icon}
                    </div>
                  </div>
                  <h3 className="text-base font-semibold mb-2 text-theme">
                    {useCase.title}
                  </h3>
                  <p className="text-muted text-sm leading-relaxed mb-4">
                    {useCase.description}
                  </p>
                  <div className="inline-flex items-center gap-1.5 text-sm text-[var(--brand)] font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    {useCase.action} →
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-3xl mx-auto text-center bg-[var(--brand)] rounded-2xl p-6 sm:p-10">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white mb-3">
              Ready to Start Designing?
            </h2>
            <p className="text-white/75 mb-7 max-w-lg mx-auto leading-relaxed">
              Join engineers and architects who use Diagrammatic to plan,
              practice, and communicate system designs.
            </p>
            <button
              type="button"
              onClick={() => handleNavigate("/playground/free")}
              className="px-7 py-3 bg-white text-[var(--brand)] font-semibold rounded-lg hover:shadow-md transition-all duration-200 cursor-pointer"
            >
              Launch Free Canvas
            </button>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-12 px-4 sm:px-6 lg:px-8 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center space-x-3">
                <img src="./logo.png" alt="Logo" className="h-8" />
                <span className="font-semibold text-theme">Diagrammatic</span>
              </div>
              <p className="text-muted text-sm">
                © 2026 Diagrammatic. Built with{" "}
                <span className="inline-block animate-pulse">❤️</span> for
                system designers
              </p>
            </div>
          </div>
        </footer>

        <style>{`
        @property --au1x { syntax: '<percentage>'; initial-value: 20%; inherits: false; }
        @property --au1y { syntax: '<percentage>'; initial-value: 30%; inherits: false; }
        @property --au2x { syntax: '<percentage>'; initial-value: 76%; inherits: false; }
        @property --au2y { syntax: '<percentage>'; initial-value: 62%; inherits: false; }
        @property --au3x { syntax: '<percentage>'; initial-value: 48%; inherits: false; }
        @property --au3y { syntax: '<percentage>'; initial-value: 82%; inherits: false; }
        .hero-aurora {
          --au1x: 20%; --au1y: 30%;
          --au2x: 76%; --au2y: 62%;
          --au3x: 48%; --au3y: 82%;
          background:
            radial-gradient(ellipse 55% 42% at var(--au1x) var(--au1y), rgba(255,255,255,0.10) 0%, transparent 65%),
            radial-gradient(ellipse 48% 36% at var(--au2x) var(--au2y), rgba(255,255,255,0.07) 0%, transparent 65%),
            radial-gradient(ellipse 40% 30% at var(--au3x) var(--au3y), rgba(255,255,255,0.05) 0%, transparent 65%);
          animation: au1 22s ease-in-out infinite alternate, au2 30s ease-in-out infinite alternate, au3 38s ease-in-out infinite alternate;
        }
        @keyframes au1 { from { --au1x: 20%; --au1y: 30%; } to { --au1x: 34%; --au1y: 17%; } }
        @keyframes au2 { from { --au2x: 76%; --au2y: 62%; } to { --au2x: 63%; --au2y: 76%; } }
        @keyframes au3 { from { --au3x: 48%; --au3y: 82%; } to { --au3x: 38%; --au3y: 54%; } }
        @media (prefers-reduced-motion: reduce) {
          .hero-aurora { animation: none; }
        }
        @keyframes hero-float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33%       { transform: translateY(-14px) rotate(3deg); }
          66%       { transform: translateY(-6px) rotate(-2deg); }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0; }
        }
        .cursor-blink {
          display: inline-block;
          margin-left: 1px;
          font-weight: 200;
          animation: blink 1s step-start infinite;
        }
        @keyframes shimmer-sweep {
          0%       { left: -100%; }
          60%, 100% { left: 150%; }
        }
        .btn-shimmer {
          position: relative;
          overflow: hidden;
        }
        .btn-shimmer::after {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 50%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent);
          animation: shimmer-sweep 3s ease-in-out infinite;
        }
        /* Scroll-driven staggered card reveals */
        [data-reveal-group] > * {
          opacity: 0;
          transform: translateY(30px);
          transition: opacity 0.55s ease, transform 0.55s ease;
        }
        [data-reveal-group] > *:nth-child(1) { transition-delay:   0ms; }
        [data-reveal-group] > *:nth-child(2) { transition-delay: 110ms; }
        [data-reveal-group] > *:nth-child(3) { transition-delay: 220ms; }
        [data-reveal-group] > *:nth-child(4) { transition-delay: 330ms; }
        [data-reveal-group] > *:nth-child(5) { transition-delay: 440ms; }
        [data-reveal-group] > *:nth-child(6) { transition-delay: 550ms; }
        [data-reveal-group].reveal-visible > * {
          opacity: 1;
          transform: translateY(0);
        }
        /* Section heading reveals */
        [data-reveal] {
          opacity: 0;
          transform: translateY(18px);
          transition: opacity 0.6s ease, transform 0.6s ease;
        }
        [data-reveal].reveal-visible {
          opacity: 1;
          transform: translateY(0);
        }
      `}</style>

        {/* Auth Modal */}
        {showAuthModal && (
          <AuthModal
            isOpen={showAuthModal}
            onClose={() => setShowAuthModal(false)}
            onLogin={async (email, password) => {
              await login({ email, password });
            }}
            onSignup={async (email, password, name) => {
              await signup({ email, password, name });
            }}
            onGoogleLogin={async (credential) => {
              await googleLogin(credential);
            }}
          />
        )}
      </div>
    </>
  );
};

export default Home;
