import React from "react";
import { motion } from "framer-motion";
import { useChatBot } from "../hooks/useChatBot";
import { HiSparkles } from "react-icons/hi2";

export const WelcomeDialog: React.FC = () => {
  const { dismissWelcome } = useChatBot();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="bg-[var(--surface)] border border-theme/10 rounded-lg p-5"
    >
      <div className="text-center">
        <HiSparkles className="w-7 h-7 mx-auto mb-3 text-[var(--brand)]" />
        <h3 className="text-sm font-semibold text-theme mb-1">Design Assistant</h3>
        <p className="text-xs text-muted mb-4">
          Add components to your canvas and I'll suggest what to build next.
        </p>
        <button
          onClick={dismissWelcome}
          className="px-4 py-1.5 bg-[var(--brand)] hover:opacity-90 text-white text-sm rounded-md transition-opacity"
        >
          Get started
        </button>
      </div>
    </motion.div>
  );
};
