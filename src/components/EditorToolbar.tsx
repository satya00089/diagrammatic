import React from 'react';

interface EditorToolbarProps {
  onClearAll: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitView: () => void;
  nodeCount: number;
}

const EditorToolbar: React.FC<EditorToolbarProps> = ({
  onClearAll,
  onZoomIn,
  onZoomOut,
  onFitView,
  nodeCount
}) => {
  return (
    <div style={{
      height: '56px',
      backgroundColor: '#ffffff',
      borderBottom: '1px solid #e5e7eb',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 16px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px'
      }}>
        <h1 style={{
          fontSize: '18px',
          fontWeight: '600',
          color: '#111827',
          margin: 0
        }}>
          Design System Editor
        </h1>
        <div style={{
          fontSize: '14px',
          color: '#6b7280',
          padding: '4px 8px',
          backgroundColor: '#f3f4f6',
          borderRadius: '4px'
        }}>
          {nodeCount} components
        </div>
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <button
          onClick={onZoomOut}
          style={{
            padding: '8px 12px',
            backgroundColor: '#f9fafb',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            fontSize: '14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
        >
          −
        </button>
        
        <button
          onClick={onZoomIn}
          style={{
            padding: '8px 12px',
            backgroundColor: '#f9fafb',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            fontSize: '14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
        >
          +
        </button>

        <button
          onClick={onFitView}
          style={{
            padding: '8px 12px',
            backgroundColor: '#f9fafb',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            fontSize: '14px',
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
        >
          Fit View
        </button>

        <div style={{
          width: '1px',
          height: '24px',
          backgroundColor: '#e5e7eb',
          margin: '0 8px'
        }}></div>

        <button
          onClick={onClearAll}
          style={{
            padding: '8px 12px',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '6px',
            fontSize: '14px',
            color: '#dc2626',
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#fee2e2';
            e.currentTarget.style.borderColor = '#fca5a5';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#fef2f2';
            e.currentTarget.style.borderColor = '#fecaca';
          }}
        >
          Clear All
        </button>
      </div>
    </div>
  );
};

export default EditorToolbar;
