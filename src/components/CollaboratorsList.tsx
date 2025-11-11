import React from "react";
import { MdClose } from "react-icons/md";

interface Collaborator {
  id: string;
  email: string;
  permission: "read" | "edit";
}

interface CollaboratorsListProps {
  isLoading: boolean;
  collaborators: Collaborator[];
  onUpdatePermission: (collaboratorId: string, permission: "read" | "edit") => void;
  onRemove: (collaboratorId: string) => void;
}

const CollaboratorsList: React.FC<CollaboratorsListProps> = ({
  isLoading,
  collaborators,
  onUpdatePermission,
  onRemove,
}) => {
  if (isLoading) {
    return (
      <div className="text-center py-4">
        <div className="inline-block w-4 h-4 border border-accent/30 border-t-accent rounded-full animate-spin"></div>
        <p className="text-sm text-muted mt-2">Loading collaborators...</p>
      </div>
    );
  }

  if (collaborators.length === 0) {
    return (
      <div className="text-center py-4 text-muted">
        <p className="text-sm">No collaborators yet</p>
        <p className="text-xs mt-1">Share this diagram to start collaborating</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {collaborators.map((collaborator) => (
        <div
          key={collaborator.id}
          className="flex items-center justify-between p-3 bg-theme/5 rounded-md"
        >
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
              <span className="text-sm font-medium text-accent">
                {collaborator.email[0].toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-theme">
                {collaborator.email}
              </p>
              <p className="text-xs text-muted capitalize">
                {collaborator.permission} access
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <select
              value={collaborator.permission}
              onChange={(e) =>
                onUpdatePermission(
                  collaborator.id,
                  e.target.value as "read" | "edit"
                )
              }
              className="text-xs px-2 py-1 border border-theme/20 rounded bg-theme text-theme"
            >
              <option value="read">Read</option>
              <option value="edit">Edit</option>
            </select>
            <button
              type="button"
              onClick={() => onRemove(collaborator.id)}
              className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
              title="Remove collaborator"
            >
              <MdClose className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CollaboratorsList;
