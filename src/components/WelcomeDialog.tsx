import React from "react";
import { motion } from "framer-motion";
import { useChatBot } from "../hooks/useChatBot";

export const WelcomeDialog: React.FC = () => {
  const { dismissWelcome } = useChatBot();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6"
    >
      <div className="text-center">
        <div className="text-4xl mb-3">👋</div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
          Welcome to Design Assistant!
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          I'm here to help you with smart suggestions based on what you're
          building. Start adding components to your canvas, and I'll provide
          contextual tips!
        </p>
        <button
          onClick={dismissWelcome}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md
            transition-colors font-medium"
        >
          Got it!
        </button>
      </div>
    </motion.div>
  );
};
