/**
 * Collaboration Indicator Component
 * Displays real-time collaboration status
 *
 * Responsibilities (Single Responsibility Principle):
 * - Show connection status
 * - Display collaborator count
 * - Provide reconnection controls
 */

import { motion, AnimatePresence } from "framer-motion";
import { FiWifi, FiWifiOff, FiUsers } from "react-icons/fi";
import type { CollaborationState } from "../hooks/useYjsCollaboration";

interface CollaborationIndicatorProps {
  state: CollaborationState;
  onReconnect?: () => void;
}

export const CollaborationIndicator = ({
  state,
  onReconnect,
}: CollaborationIndicatorProps) => {
  const { isConnected, isSynced, error, collaboratorCount } = state;

  // Determine status color and icon
  const getStatusConfig = () => {
    if (error) {
      return {
        color: "text-red-500",
        bg: "bg-red-50 dark:bg-red-900/20",
        border: "border-red-200 dark:border-red-800",
        icon: FiWifiOff,
        label: "Disconnected",
      };
    }

    if (isConnected && isSynced) {
      return {
        color: "text-green-500",
        bg: "bg-green-50 dark:bg-green-900/20",
        border: "border-green-200 dark:border-green-800",
        icon: FiWifi,
        label: "Connected",
      };
    }

    return {
      color: "text-yellow-500",
      bg: "bg-yellow-50 dark:bg-yellow-900/20",
      border: "border-yellow-200 dark:border-yellow-800",
      icon: FiWifi,
      label: "Connecting...",
    };
  };

  const config = getStatusConfig();
  const StatusIcon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`
        flex items-center gap-2 px-3 py-2 rounded-lg border
        ${config.bg} ${config.border}
        text-sm font-medium
      `}
    >
      {/* Status Icon */}
      <motion.div
        animate={
          isConnected && isSynced ? { scale: [1, 1.2, 1] } : { scale: 1 }
        }
        transition={{
          repeat: isConnected && isSynced ? Infinity : 0,
          duration: 2,
        }}
      >
        <StatusIcon className={config.color} size={16} />
      </motion.div>

      {/* Status Label */}
      <span className={config.color}>{config.label}</span>

      {/* Collaborator Count */}
      <AnimatePresence mode="wait">
        {collaboratorCount > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center gap-1 ml-2 pl-2 border-l border-gray-300 dark:border-gray-700"
          >
            <FiUsers size={14} className="text-blue-500" />
            <span className="text-blue-600 dark:text-blue-400">
              {collaboratorCount}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reconnect Button */}
      <AnimatePresence>
        {error && onReconnect && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={onReconnect}
            className="
              ml-2 px-2 py-1 rounded
              bg-blue-500 hover:bg-blue-600
              text-white text-xs
              transition-colors
            "
          >
            Reconnect
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
