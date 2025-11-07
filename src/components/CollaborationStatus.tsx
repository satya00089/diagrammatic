import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MdWifiOff, MdPeople, MdSync } from 'react-icons/md';
import { getCollaboratorColor } from '../utils/collaborationUtils';

interface CollaboratorUser {
  id: string;
  name: string;
  email: string;
  pictureUrl?: string;
}

interface CollaborationStatusProps {
  isConnected: boolean;
  isConnecting: boolean;
  reconnectAttempts: number;
  collaborators: CollaboratorUser[];
  showCollaborators?: boolean;
}

export const CollaborationStatus: React.FC<CollaborationStatusProps> = ({
  isConnected,
  isConnecting,
  reconnectAttempts,
  collaborators,
  showCollaborators = true,
}) => {
  const [showTooltip, setShowTooltip] = React.useState(false);

  // Only show status indicator when there's an issue (connecting/disconnected) or when there are collaborators
  // This matches Figma's behavior - seamless when working, visible when there's a problem
  const shouldShowStatus = isConnecting || !isConnected;
  const shouldShowCollaborators = showCollaborators && collaborators.length > 0;
  
  // Don't render anything if connection is fine and no collaborators
  if (!shouldShowStatus && !shouldShowCollaborators) {
    return null;
  }

  const getStatusText = () => {
    if (isConnecting) {
      return reconnectAttempts > 0
        ? `Reconnecting... (${reconnectAttempts})`
        : 'Connecting...';
    }
    return 'Connection lost';
  };

  const getStatusIcon = () => {
    if (isConnecting) {
      return <MdSync className="h-4 w-4 animate-spin" />;
    }
    return <MdWifiOff className="h-4 w-4" />;
  };

  const getStatusColor = () => {
    if (isConnecting) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  return (
    <div className="flex items-center gap-2">
      {/* Connection Status - Only shown when there's a problem */}
      {shouldShowStatus && (
        <div
          className="relative"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface border border-theme/10 ${getStatusColor()} transition-colors`}
          >
            {getStatusIcon()}
            <span className="text-xs font-medium">{getStatusText()}</span>
          </div>

          {/* Tooltip */}
          <AnimatePresence>
            {showTooltip && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                className="absolute top-full left-0 mt-2 p-2 bg-surface border border-theme/10 rounded-lg shadow-lg z-50 min-w-[200px]"
              >
                <div className="text-xs text-theme">
                  <div className="font-semibold mb-1">Connection Status</div>
                  <div className="text-muted">
                    {isConnecting
                      ? 'Establishing connection...'
                      : 'Collaboration unavailable'}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Collaborators List - Only shown when there are online collaborators */}
      {shouldShowCollaborators && (
        <div className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface border border-theme/10">
          <MdPeople className="h-4 w-4 text-theme" />
          <div className="flex -space-x-2">
            {collaborators.slice(0, 3).map((collaborator) => (
              <div
                key={collaborator.id}
                className="relative group"
                data-tooltip={collaborator.name}
              >
                {collaborator.pictureUrl ? (
                  <img
                    src={collaborator.pictureUrl}
                    alt={collaborator.name}
                    className="w-6 h-6 rounded-full border-2 border-surface"
                    style={{
                      borderColor: getCollaboratorColor(collaborator.id),
                    }}
                  />
                ) : (
                  <div
                    className="w-6 h-6 rounded-full border-2 border-surface flex items-center justify-center text-xs font-bold text-white"
                    style={{
                      backgroundColor: getCollaboratorColor(collaborator.id),
                    }}
                  >
                    {collaborator.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            ))}
            {collaborators.length > 3 && (
              <div className="w-6 h-6 rounded-full bg-theme/10 border-2 border-surface flex items-center justify-center text-xs font-bold text-theme">
                +{collaborators.length - 3}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
