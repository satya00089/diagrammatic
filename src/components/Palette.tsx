import React from 'react';

export interface PaletteItem {
  id: string;
  componentType: string;
  label: string;
  tokens: Record<string, string>;
}

const paletteItems: PaletteItem[] = [
  {
    id: 'button',
    componentType: 'Button',
    label: 'Button',
    tokens: {
      '--color-bg': '#3b82f6',
      '--color-text': '#ffffff',
      '--padding-x': '16px',
      '--padding-y': '10px',
      '--border-radius': '8px',
      '--font-weight': '600',
      '--font-size': '14px',
      '--border': 'none',
      '--shadow': '0 2px 4px rgba(59, 130, 246, 0.15)'
    }
  },
  {
    id: 'card',
    componentType: 'Card',
    label: 'Card',
    tokens: {
      '--color-bg': '#ffffff',
      '--color-border': '#e5e7eb',
      '--padding': '24px',
      '--border-radius': '12px',
      '--shadow': '0 4px 6px rgba(0, 0, 0, 0.05)',
      '--border-width': '1px',
      '--min-height': '120px',
      '--min-width': '200px'
    }
  },
  {
    id: 'input',
    componentType: 'Input',
    label: 'Text Input',
    tokens: {
      '--color-bg': '#ffffff',
      '--color-border': '#d1d5db',
      '--color-text': '#374151',
      '--padding-x': '14px',
      '--padding-y': '10px',
      '--border-radius': '8px',
      '--font-size': '14px',
      '--border-width': '1px',
      '--placeholder': 'Enter text...',
      '--width': '240px'
    }
  },
  {
    id: 'heading',
    componentType: 'Heading',
    label: 'Heading',
    tokens: {
      '--color-text': '#111827',
      '--font-size': '24px',
      '--font-weight': '700',
      '--line-height': '1.25',
      '--margin-bottom': '8px',
      '--text': 'Heading Text'
    }
  },
  {
    id: 'text',
    componentType: 'Text',
    label: 'Text Block',
    tokens: {
      '--color-text': '#374151',
      '--font-size': '16px',
      '--font-weight': '400',
      '--line-height': '1.5',
      '--max-width': '300px',
      '--text': 'This is a text block that can contain multiple lines of content.'
    }
  }
];

const Palette: React.FC = () => {
  const handleDragStart = (event: React.DragEvent<HTMLDivElement>, item: PaletteItem) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify(item));
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div style={{
      width: '250px',
      padding: '16px',
      backgroundColor: '#f9fafb',
      borderRight: '1px solid #e5e7eb',
      height: '100vh',
      overflowY: 'auto'
    }}>
      <h3 style={{
        margin: '0 0 16px 0',
        fontSize: '16px',
        fontWeight: '600',
        color: '#374151'
      }}>
        Component Palette
      </h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {paletteItems.map((item) => (
          <div
            key={item.id}
            draggable
            onDragStart={(e) => handleDragStart(e, item)}
            style={{
              padding: '12px',
              backgroundColor: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              cursor: 'grab',
              transition: 'all 0.2s',
              userSelect: 'none'
            }}
            onMouseDown={(e) => e.currentTarget.style.cursor = 'grabbing'}
            onMouseUp={(e) => e.currentTarget.style.cursor = 'grab'}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f3f4f6';
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#ffffff';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div style={{
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '4px'
            }}>
              {item.label}
            </div>
            <div style={{
              fontSize: '12px',
              color: '#6b7280'
            }}>
              {Object.keys(item.tokens).length} tokens
            </div>
          </div>
        ))}
      </div>
      
      <div style={{
        marginTop: '24px',
        padding: '12px',
        backgroundColor: '#fef3c7',
        border: '1px solid #fbbf24',
        borderRadius: '6px',
        fontSize: '12px',
        color: '#92400e'
      }}>
        <strong>Tip:</strong> Drag components onto the canvas to create nodes. Select nodes to edit their design tokens in the inspector.
      </div>
    </div>
  );
};

export default Palette;
