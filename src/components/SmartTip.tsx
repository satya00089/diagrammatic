import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MdClose } from "react-icons/md";
import { useOnboarding } from "../hooks/useOnboarding";

interface SmartTipProps {
  /** Unique tip identifier — dismissed state is persisted by this id */
  id: string;
  /** Tip text to display */
  content: string;
  /** Preferred popover position relative to the child */
  position?: "top" | "bottom" | "left" | "right";
  /** Delay before the tip appears (ms). Default: 600 */
  delay?: number;
  /** Auto-dismiss after this many ms. Default: 8000 */
  autoHideAfter?: number;
  children: React.ReactNode;
}

const ARROW_SIZE = 6;

const arrowStyle: Record<string, React.CSSProperties> = {
  top: {
    bottom: -ARROW_SIZE,
    left: "50%",
    transform: "translateX(-50%)",
    borderLeft: `${ARROW_SIZE}px solid transparent`,
    borderRight: `${ARROW_SIZE}px solid transparent`,
    borderTop: `${ARROW_SIZE}px solid #1e1e2e`,
  },
  bottom: {
    top: -ARROW_SIZE,
    left: "50%",
    transform: "translateX(-50%)",
    borderLeft: `${ARROW_SIZE}px solid transparent`,
    borderRight: `${ARROW_SIZE}px solid transparent`,
    borderBottom: `${ARROW_SIZE}px solid #1e1e2e`,
  },
  left: {
    right: -ARROW_SIZE,
    top: "50%",
    transform: "translateY(-50%)",
    borderTop: `${ARROW_SIZE}px solid transparent`,
    borderBottom: `${ARROW_SIZE}px solid transparent`,
    borderLeft: `${ARROW_SIZE}px solid #1e1e2e`,
  },
  right: {
    left: -ARROW_SIZE,
    top: "50%",
    transform: "translateY(-50%)",
    borderTop: `${ARROW_SIZE}px solid transparent`,
    borderBottom: `${ARROW_SIZE}px solid transparent`,
    borderRight: `${ARROW_SIZE}px solid #1e1e2e`,
  },
};

const popoverMotionVariants = {
  top: { initial: { opacity: 0, y: 6 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: 4 } },
  bottom: { initial: { opacity: 0, y: -6 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -4 } },
  left: { initial: { opacity: 0, x: 6 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: 4 } },
  right: { initial: { opacity: 0, x: -6 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -4 } },
};

const SmartTip: React.FC<SmartTipProps> = ({
  id,
  content,
  position = "top",
  delay = 600,
  autoHideAfter = 8000,
  children,
}) => {
  const { isTipDismissed, dismissTip } = useOnboarding();
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoHideRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismissed = isTipDismissed(id);

  useEffect(() => {
    if (dismissed) return;

    timerRef.current = setTimeout(() => {
      setVisible(true);

      autoHideRef.current = setTimeout(() => {
        setVisible(false);
        dismissTip(id);
      }, autoHideAfter);
    }, delay);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (autoHideRef.current) clearTimeout(autoHideRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dismissed]);

  const handleDismiss = () => {
    setVisible(false);
    dismissTip(id);
    if (autoHideRef.current) clearTimeout(autoHideRef.current);
  };

  const positionClasses: Record<string, string> = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  const variants = popoverMotionVariants[position];

  return (
    <div className="relative inline-flex">
      {children}

      <AnimatePresence>
        {visible && !dismissed && (
          <motion.div
            role="tooltip"
            initial={variants.initial}
            animate={variants.animate}
            exit={variants.exit}
            transition={{ duration: 0.18 }}
            className={`absolute z-50 w-56 ${positionClasses[position]}`}
            style={{ pointerEvents: "auto" }}
          >
            {/* Popover body */}
            <div className="relative rounded-xl px-3 py-2.5 shadow-xl"
              style={{
                background: "#1e1e2e",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              {/* Arrow */}
              <span
                className="absolute w-0 h-0"
                style={arrowStyle[position]}
                aria-hidden="true"
              />

              <div className="flex items-start gap-2">
                {/* Pulsing dot */}
                <span className="mt-0.5 shrink-0 relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--brand,#6366f1)] opacity-60" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--brand,#6366f1)]" />
                </span>

                <p className="text-xs text-white/80 leading-relaxed flex-1">
                  {content}
                </p>

                <button
                  type="button"
                  onClick={handleDismiss}
                  className="shrink-0 mt-0.5 text-white/40 hover:text-white/80 transition-colors cursor-pointer"
                  aria-label="Dismiss tip"
                >
                  <MdClose className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SmartTip;
