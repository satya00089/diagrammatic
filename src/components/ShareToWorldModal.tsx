import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MdClose, MdCheck, MdContentCopy, MdOpenInNew } from "react-icons/md";
import { FaLinkedin } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { SiMedium } from "react-icons/si";
import { apiService } from "../services/api";
import type { ValidationResult, SystemDesignProblem } from "../types/systemDesign";
import type { User } from "../types/auth";

interface ShareToWorldModalProps {
  isOpen: boolean;
  onClose: () => void;
  assessment: ValidationResult | null;
  problem: SystemDesignProblem | null;
  savedAttemptId: string | null;
  user: User | null;
  captureCanvasPng: () => Promise<string>;
}

const ScoreRing: React.FC<{ score: number }> = ({ score }) => {
  const r = 36;
  const circ = 2 * Math.PI * r;
  let color = "#ef4444";
  if (score >= 80) color = "#10b981";
  else if (score >= 60) color = "#f59e0b";
  return (
    <div className="relative w-24 h-24 flex-shrink-0">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 88 88">
        <circle cx="44" cy="44" r={r} fill="none" stroke="currentColor" strokeWidth="6" className="text-theme/10" />
        <circle
          cx="44" cy="44" r={r} fill="none" stroke={color}
          strokeWidth="6" strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ - (score / 100) * circ}
          style={{ transition: "stroke-dashoffset 1s ease-out" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold leading-none" style={{ color }}>{score}</span>
        <span className="text-[10px] text-[color:var(--share-text)]/90 leading-none mt-0.5">/100</span>
      </div>
    </div>
  );
};

const ShareToWorldModal: React.FC<ShareToWorldModalProps> = ({
  isOpen,
  onClose,
  assessment,
  problem,
  savedAttemptId,
  user,
}) => {
  const [publicUrl, setPublicUrl] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [messageCopied, setMessageCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const publishedRef = useRef(false); // guard against double-publish

  const score = assessment?.score ?? 0;
  const problemTitle = problem?.title ?? "System Design";
  const scoreLabel =
    score >= 80 ? "Outstanding work!" : score >= 60 ? "Solid design!" : "Keep improving!";

  // Auto-publish when the modal opens (one-shot guard via ref)
  useEffect(() => {
    if (!isOpen) {
      setPublicUrl(null);
      setLinkCopied(false);
      setMessageCopied(false);
      setError(null);
      publishedRef.current = false;
      return;
    }
    if (!savedAttemptId || publishedRef.current) return;
    publishedRef.current = true;
    let cancelled = false;
    setIsPublishing(true);
    setError(null);
    apiService
      .publishAttempt(savedAttemptId)
      .then((res) => { if (!cancelled) setPublicUrl(res.publicUrl); })
      .catch(() => { if (!cancelled) setError("Couldn't publish. Please try again."); })
      .finally(() => { if (!cancelled) setIsPublishing(false); });
    return () => { cancelled = true; };
  }, [isOpen, savedAttemptId]);

  const handleCopyLink = useCallback(async () => {
    if (!publicUrl) return;
    await navigator.clipboard.writeText(publicUrl);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  }, [publicUrl]);

  const defaultPost = `?? Just solved "${problemTitle}" on Diagrammatic!\n\nScore: ${score}/100 � ${scoreLabel}\n\nCheck it out: ${publicUrl ?? ""}\n\n#SystemDesign #SoftwareArchitecture`;

  const handleLinkedIn = useCallback(() => {
    if (!publicUrl) return;
    navigator.clipboard.writeText(defaultPost).catch(() => {});
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(publicUrl)}`,
      "_blank", "noopener,noreferrer"
    );
  }, [publicUrl, defaultPost]);

  const handleTwitter = useCallback(() => {
    if (!publicUrl) return;
    const tweet = `?? Solved "${problemTitle}" � ${score}/100 on Diagrammatic!`;
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweet)}&url=${encodeURIComponent(publicUrl)}`,
      "_blank", "noopener,noreferrer"
    );
  }, [publicUrl, problemTitle, score]);

  const handleMedium = useCallback(async () => {
    const article = `# My ${problemTitle} System Design\n\n${defaultPost}`;
    await navigator.clipboard.writeText(article);
    setMessageCopied(true);
    setTimeout(() => setMessageCopied(false), 2500);
    window.open("https://medium.com/new-story", "_blank", "noopener,noreferrer");
  }, [defaultPost, problemTitle]);

  if (!isOpen) return null;

  const isReady = !isPublishing && !!publicUrl;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            className="relative z-10 w-full max-w-md bg-[var(--surface)] rounded-2xl shadow-2xl border border-[var(--border)] overflow-hidden"
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 24, stiffness: 320 }}
          >
            {/* -- Header band -- */}
            <div className="relative bg-[var(--share-bg)] text-[var(--share-text)] dark:bg-[var(--share-bg)] dark:text-[var(--share-text)] px-6 pt-5 pb-5">
              <button
                onClick={onClose}
                className="absolute top-3 right-3 p-1.5 rounded-full bg-white/10 hover:bg-white/25 text-[color:var(--share-text)] transition-colors"
              >
                <MdClose size={17} />
              </button>
              <div className="flex items-center gap-4">
                <ScoreRing score={score} />
                <div className="min-w-0">
                  <p className="text-[color:var(--share-text)]/60 text-[10px] font-semibold uppercase tracking-widest mb-0.5">
                    Achievement unlocked
                  </p>
                  <h2 className="text-[color:var(--share-text)] text-base font-bold leading-snug">{problemTitle}</h2>
                  <p className="text-[color:var(--share-text)]/80 text-sm mt-0.5">{scoreLabel}</p>
                  {user?.name && (
                    <p className="text-[color:var(--share-text)]/50 text-xs mt-1 truncate">by {user.name}</p>
                  )}
                </div>
              </div>
            </div>

            {/* -- Body -- */}
            <div className="px-5 py-4 space-y-4">

              {/* Public link row */}
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-[var(--bg)] border border-[var(--border)]">
                {isPublishing ? (
                  <div className="flex items-center gap-2 flex-1 text-sm text-muted">
                    <svg className="animate-spin h-3.5 w-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Publishing your solution�
                  </div>
                ) : error ? (
                  <span className="flex-1 text-xs text-red-400">{error}</span>
                ) : (
                  <>
                    <span className="text-xs text-muted truncate flex-1 font-mono">{publicUrl}</span>
                    <button
                      onClick={handleCopyLink}
                      className="flex-shrink-0 flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-[var(--brand,#6366f1)]/10 text-[var(--brand,#6366f1)] hover:bg-[var(--brand,#6366f1)]/20 transition-colors"
                    >
                      {linkCopied ? <MdCheck size={13} /> : <MdContentCopy size={13} />}
                      {linkCopied ? "Copied!" : "Copy"}
                    </button>
                    <a
                      href={publicUrl ?? "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-shrink-0 text-muted hover:text-theme transition-colors"
                    >
                      <MdOpenInNew size={15} />
                    </a>
                  </>
                )}
              </div>

              {/* Share buttons */}
              <div className="space-y-2">
                <p className="text-[10px] font-semibold text-muted uppercase tracking-widest">Share on</p>

                {/* LinkedIn */}
                <button
                  onClick={handleLinkedIn}
                  disabled={!isReady}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-[var(--border)] hover:border-[#0077b5]/50 hover:bg-[#0077b5]/6 disabled:opacity-40 disabled:cursor-not-allowed transition-all group"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#0077b5] flex items-center justify-center text-white flex-shrink-0">
                    <FaLinkedin size={16} />
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-semibold text-theme">LinkedIn</p>
                    <p className="text-xs text-muted">Post copied to clipboard automatically</p>
                  </div>
                  <MdOpenInNew size={14} className="text-muted/40 group-hover:text-muted transition-colors flex-shrink-0" />
                </button>

                {/* Twitter / X */}
                <button
                  onClick={handleTwitter}
                  disabled={!isReady}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-[var(--border)] hover:border-white/20 hover:bg-theme/5 disabled:opacity-40 disabled:cursor-not-allowed transition-all group"
                >
                  <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center text-white flex-shrink-0">
                    <FaXTwitter size={14} />
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-semibold text-theme">X / Twitter</p>
                    <p className="text-xs text-muted">Tweet your achievement</p>
                  </div>
                  <MdOpenInNew size={14} className="text-muted/40 group-hover:text-muted transition-colors flex-shrink-0" />
                </button>

                {/* Medium */}
                <button
                  onClick={handleMedium}
                  disabled={!isReady}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-[var(--border)] hover:border-gray-400/30 hover:bg-theme/5 disabled:opacity-40 disabled:cursor-not-allowed transition-all group"
                >
                  <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center text-white flex-shrink-0">
                    <SiMedium size={16} />
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-semibold text-theme">Medium</p>
                    <p className="text-xs text-muted">
                      {messageCopied
                        ? "? Article copied � paste into Medium!"
                        : "Full article copied to clipboard"}
                    </p>
                  </div>
                  <MdOpenInNew size={14} className="text-muted/40 group-hover:text-muted transition-colors flex-shrink-0" />
                </button>
              </div>
            </div>

            {/* -- Footer -- */}
            <div className="px-5 pb-4 pt-1">
              <button
                onClick={onClose}
                className="w-full py-2 text-sm text-muted hover:text-theme transition-colors rounded-xl hover:bg-[var(--bg-hover)]"
              >
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ShareToWorldModal;
