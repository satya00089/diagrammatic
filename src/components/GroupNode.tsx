import React from 'react';
import { Handle, Position } from '@xyflow/react';

export interface GroupNodeData {
  label: string;
  icon?: string;
  subtitle?: string;
  backgroundColor?: string;
  borderColor?: string;
}

interface GroupNodeProps {
  data: GroupNodeData;
}

const GroupNode: React.FC<GroupNodeProps> = ({ data }) => {
  const bgColor = data.backgroundColor || 'rgba(100, 100, 255, 0.05)';
  const borderColor = data.borderColor || 'rgba(100, 100, 255, 0.3)';

  return (
    <div
      className="group-node"
      style={{
        padding: '20px',
        borderRadius: '12px',
        border: `2px dashed ${borderColor}`,
        backgroundColor: bgColor,
        minWidth: '300px',
        minHeight: '200px',
        height: '100%',
        position: 'relative',
      }}
    >
      {/* Group Header */}
      <div
        className="group-header"
        style={{
          position: 'absolute',
          top: '-12px',
          left: '10px',
          padding: '4px 12px',
          borderRadius: '6px',
          backgroundColor: 'var(--surface)',
          border: `1px solid ${borderColor}`,
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '14px',
          fontWeight: '600',
          color: 'var(--theme)',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        }}
      >
        {data.icon && <span>{data.icon}</span>}
        <span>{data.label}</span>
      </div>

      {/* Group Subtitle */}
      {data.subtitle && (
        <div
          style={{
            marginTop: '8px',
            fontSize: '12px',
            color: 'var(--muted)',
            fontStyle: 'italic',
          }}
        >
          {data.subtitle}
        </div>
      )}

      {/* Handles for connections */}
      <Handle
        type="target"
        position={Position.Top}
        style={{
          background: borderColor,
          width: '12px',
          height: '12px',
          border: '2px solid var(--surface)',
        }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        style={{
          background: borderColor,
          width: '12px',
          height: '12px',
          border: '2px solid var(--surface)',
        }}
      />
      <Handle
        type="target"
        position={Position.Left}
        style={{
          background: borderColor,
          width: '12px',
          height: '12px',
          border: '2px solid var(--surface)',
        }}
      />
      <Handle
        type="source"
        position={Position.Right}
        style={{
          background: borderColor,
          width: '12px',
          height: '12px',
          border: '2px solid var(--surface)',
        }}
      />
    </div>
  );
};

export default GroupNode;
