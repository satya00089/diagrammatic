import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { MdClose } from "react-icons/md";
import { LuBrainCircuit } from "react-icons/lu";
import { HiUserGroup } from "react-icons/hi2";
import { useOnboarding } from "../hooks/useOnboarding";
import type { PageId } from "../contexts/OnboardingContext";

interface Announcement {
  id: string;
  icon: React.ReactNode;
  badge: string;
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref?: string;
}

// ---------------------------------------------------------------------------
// Add new feature announcements here. Each shows once then is dismissed forever.
// ---------------------------------------------------------------------------
const ANNOUNCEMENTS: Announcement[] = [
  {
    id: "aiml_problems_v1",
    icon: <LuBrainCircuit className="h-8 w-8 text-[var(--brand,#6366f1)]" />,
    badge: "New Domain",
    title: "AI & ML System Design Problems",
    description:
      "48 new problems covering LLM infrastructure, MLOps pipelines, recommendation systems, AIOps observability, and more.",
    ctaLabel: "Explore AI & ML",
    ctaHref: "/problems",
  },
  {
    id: "realtime_collab_v1",
    icon: <HiUserGroup className="h-8 w-8 text-emerald-400" />,
    badge: "New Feature",
    title: "Real-Time Collaboration is Live",
    description:
      "Invite teammates to your design canvas. Changes sync instantly — just like Figma.",
    ctaLabel: "Try It Now",
    ctaHref: "/playground/free",
  },
];

const FeatureAnnouncement: React.FC = () => {
  const { isAnnouncementSeen, dismissAnnouncement, isNewToPage, isTourCompleted } = useOnboarding();
  const navigate = useNavigate();
  const location = useLocation();

  const mapPathToPageId = (path: string): PageId | undefined => {
    if (path === "/") return "home";
    if (path.startsWith("/problems")) return "dashboard";
    if (path.startsWith("/playground") || path.startsWith("/public")) return "design_studio";
    if (path.startsWith("/diagrams")) return "my_designs";
    if (path.startsWith("/problems/play")) return "problem_playground";
    return undefined;
  };

  const currentPage = mapPathToPageId(location.pathname);
  const deferForTour = Boolean(currentPage && isNewToPage(currentPage) && !isTourCompleted(currentPage));
  const announcement = deferForTour ? undefined : ANNOUNCEMENTS.find((a) => !isAnnouncementSeen(a.id));
  const isVisible = Boolean(announcement);

  // Set a CSS variable so fixed headers shift down on md+ screens
  useEffect(() => {
    if (!isVisible) {
      document.documentElement.style.removeProperty("--announcement-h");
      return;
    }
    const mq = window.matchMedia("(min-width: 768px)");
    const apply = () => {
      document.documentElement.style.setProperty("--announcement-h", mq.matches ? "40px" : "0px");
    };
    apply();
    mq.addEventListener("change", apply);
    return () => {
      document.documentElement.style.removeProperty("--announcement-h");
      mq.removeEventListener("change", apply);
    };
  }, [isVisible]);

  if (!announcement) return null;

  const handleDismiss = () => {
    dismissAnnouncement(announcement.id);
  };

  const handleCta = () => {
    dismissAnnouncement(announcement.id);
    if (announcement.ctaHref) {
      navigate(announcement.ctaHref);
    }
  };

  return (
    <AnimatePresence>
      {/* ── Desktop / Tablet: fixed banner above the header ── */}
      <motion.div
        key="banner"
        initial={{ opacity: 0, y: -48 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -48 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="hidden md:flex fixed top-0 left-0 right-0 z-[60] items-center gap-4 px-6 py-2.5
          bg-[var(--surface)] border-b border-[var(--brand)]/20 shadow-sm"
      >
        {/* Left brand accent */}
        <div className="absolute left-0 inset-y-0 w-[3px] bg-[var(--brand,#6366f1)] rounded-r-full" />

        {/* Icon */}
        <div className="shrink-0 flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--brand,#6366f1)]/10 ml-3">
          {announcement.icon}
        </div>

        {/* Badge + title + description */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-[var(--brand,#6366f1)]/10 text-[var(--brand,#6366f1)]">
            {announcement.badge}
          </span>
          <span className="font-semibold text-theme text-sm shrink-0">{announcement.title}</span>
          <span className="text-muted text-sm hidden lg:block truncate">— {announcement.description}</span>
        </div>

        {/* CTA */}
        <button
          type="button"
          onClick={handleCta}
          className="shrink-0 px-4 py-1.5 rounded-lg bg-[var(--brand,#6366f1)] text-white text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer"
        >
          {announcement.ctaLabel}
        </button>

        {/* Dismiss */}
        <button
          type="button"
          onClick={handleDismiss}
          className="shrink-0 text-muted hover:text-theme transition-colors cursor-pointer"
          aria-label="Dismiss announcement"
        >
          <MdClose className="h-4 w-4" />
        </button>
      </motion.div>

      {/* ── Mobile: modal overlay (unchanged) ── */}
      <div key="modal" className="md:hidden fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/60"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleDismiss}
        />

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 6 }}
          transition={{ duration: 0.22 }}
          className="relative z-10 w-full max-w-sm rounded-2xl border border-theme bg-[var(--surface)] shadow-2xl overflow-hidden"
        >
          <div className="h-1 w-full bg-gradient-to-r from-[var(--brand,#6366f1)] to-purple-400" />
          <button
            type="button"
            onClick={handleDismiss}
            className="absolute top-3 right-3 text-muted hover:text-theme transition-colors cursor-pointer z-10"
            aria-label="Dismiss announcement"
          >
            <MdClose className="h-5 w-5" />
          </button>
          <div className="p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="shrink-0 flex h-14 w-14 items-center justify-center rounded-xl bg-[var(--brand,#6366f1)]/10 border border-[var(--brand,#6366f1)]/20">
                {announcement.icon}
              </div>
              <div className="pt-1">
                <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-[var(--brand,#6366f1)]/15 text-[var(--brand,#6366f1)] mb-1">
                  {announcement.badge}
                </span>
                <h2 className="text-base font-bold text-theme leading-snug">{announcement.title}</h2>
              </div>
            </div>
            <p className="text-sm text-muted leading-relaxed mb-5">{announcement.description}</p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleCta}
                className="flex-1 px-4 py-2.5 rounded-xl bg-[var(--brand,#6366f1)] text-white text-sm font-semibold hover:opacity-90 transition-opacity cursor-pointer"
              >
                {announcement.ctaLabel}
              </button>
              <button
                type="button"
                onClick={handleDismiss}
                className="px-4 py-2.5 rounded-xl border border-theme text-sm font-medium text-muted hover:text-theme transition-colors cursor-pointer"
              >
                Maybe later
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default FeatureAnnouncement;
