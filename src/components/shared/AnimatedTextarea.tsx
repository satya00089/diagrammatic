import React, { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import TextAlign from '@tiptap/extension-text-align'
import Placeholder from '@tiptap/extension-placeholder'
import Heading from '@tiptap/extension-heading'
import { FieldWrapper } from './AnimatedFieldBase'
import { useFocus } from './useFocus'

export interface AnimatedTextareaProps {
  id: string
  label?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  containerClassName?: string
}

const AnimatedTextarea: React.FC<AnimatedTextareaProps> = ({
  id,
  label,
  value,
  onChange,
  placeholder = 'Start typing…',
  disabled = false,
  className = '',
  containerClassName,
}) => {
  const [, setEditorState] = useState({})
  const { focused, onFocus, onBlur } = useFocus()
  
  const forceUpdate = () => setEditorState({})
  
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({
        openOnClick: false,
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Heading.configure({
        levels: [1, 2, 3],
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: value,
    editable: !disabled,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    onFocus: onFocus,
    onBlur: onBlur,
    onSelectionUpdate: () => {
      // Force re-render when selection changes to update button states
      forceUpdate()
    },
    onTransaction: () => {
      // Force re-render on any transaction to keep UI in sync
      forceUpdate()
    },
  })

  useEffect(() => {
    if (!editor) return
    if (value !== editor.getHTML()) {
      editor.commands.setContent(value, { emitUpdate: false })
    }
    editor.setEditable(!disabled)
  }, [value, disabled, editor])

  if (!editor) return null

  let headingValue = '0'
  if (editor.isActive('heading', { level: 1 })) {
    headingValue = '1'
  } else if (editor.isActive('heading', { level: 2 })) {
    headingValue = '2'
  } else if (editor.isActive('heading', { level: 3 })) {
    headingValue = '3'
  }

  return (
    <FieldWrapper id={id} label={label} focused={focused} containerClassName={containerClassName}>
      <motion.div
        className={`rounded-lg border border-[var(--border)] bg-[var(--surface)] text-theme ${className} ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
        animate={{ boxShadow: focused ? '0 0 0 2px var(--brand)' : '0 0 0 1px var(--border)' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-1 border-b border-[var(--border)] p-1 text-sm">
        <select
          title="Heading level"
          value={headingValue}
          onChange={(e) => {
            const level = parseInt(e.target.value)
            if (level === 0) {
              editor.chain().focus().setParagraph().run()
            } else {
              editor.chain().focus().toggleHeading({ level: level as 1 | 2 | 3 }).run()
            }
          }}
          className="rounded border px-1 py-0.5 bg-[var(--surface)] text-theme"
          disabled={disabled}
        >
          <option value="0">Paragraph</option>
          <option value="1">H1</option>
          <option value="2">H2</option>
          <option value="3">H3</option>
        </select>

        <button 
          onClick={() => editor.chain().focus().toggleBold().run()} 
          disabled={disabled}
          className={`px-2 py-1 rounded transition-colors ${
            editor.isActive('bold') 
              ? 'font-bold bg-[var(--brand)] text-white' 
              : 'hover:bg-[var(--bg-hover)] text-theme'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          B
        </button>
        <button 
          onClick={() => editor.chain().focus().toggleItalic().run()} 
          disabled={disabled}
          className={`px-2 py-1 rounded transition-colors ${
            editor.isActive('italic') 
              ? 'italic bg-[var(--brand)] text-white' 
              : 'hover:bg-[var(--bg-hover)] text-theme'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          I
        </button>
        <button 
          onClick={() => editor.chain().focus().toggleUnderline().run()} 
          disabled={disabled}
          className={`px-2 py-1 rounded transition-colors ${
            editor.isActive('underline') 
              ? 'underline bg-[var(--brand)] text-white' 
              : 'hover:bg-[var(--bg-hover)] text-theme'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          U
        </button>
        <button 
          onClick={() => editor.chain().focus().toggleStrike().run()} 
          disabled={disabled}
          className={`px-2 py-1 rounded transition-colors ${
            editor.isActive('strike') 
              ? 'line-through bg-[var(--brand)] text-white' 
              : 'hover:bg-[var(--bg-hover)] text-theme'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          S
        </button>

        <button 
          onClick={() => editor.chain().focus().toggleBulletList().run()} 
          disabled={disabled}
          className={`px-2 py-1 rounded transition-colors ${
            editor.isActive('bulletList') 
              ? 'bg-[var(--brand)] text-white' 
              : 'hover:bg-[var(--bg-hover)] text-theme'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          • List
        </button>
        <button 
          onClick={() => editor.chain().focus().toggleOrderedList().run()} 
          disabled={disabled}
          className={`px-2 py-1 rounded transition-colors ${
            editor.isActive('orderedList') 
              ? 'bg-[var(--brand)] text-white' 
              : 'hover:bg-[var(--bg-hover)] text-theme'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          1. List
        </button>

        <button 
          onClick={() => editor.chain().focus().toggleBlockquote().run()} 
          disabled={disabled}
          className={`px-2 py-1 rounded transition-colors ${
            editor.isActive('blockquote') 
              ? 'bg-[var(--brand)] text-white' 
              : 'hover:bg-[var(--bg-hover)] text-theme'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          ❝
        </button>
        <button 
          onClick={() => editor.chain().focus().toggleCodeBlock().run()} 
          disabled={disabled}
          className={`px-2 py-1 rounded transition-colors ${
            editor.isActive('codeBlock') 
              ? 'bg-[var(--brand)] text-white' 
              : 'hover:bg-[var(--bg-hover)] text-theme'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {'</>'}
        </button>

        {/* Alignment */}
        <button 
          onClick={() => editor.chain().focus().setTextAlign('left').run()} 
          disabled={disabled}
          className={`px-2 py-1 rounded transition-colors ${
            editor.isActive({ textAlign: 'left' }) 
              ? 'bg-[var(--brand)] text-white' 
              : 'hover:bg-[var(--bg-hover)] text-theme'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          ⬅
        </button>
        <button 
          onClick={() => editor.chain().focus().setTextAlign('center').run()} 
          disabled={disabled}
          className={`px-2 py-1 rounded transition-colors ${
            editor.isActive({ textAlign: 'center' }) 
              ? 'bg-[var(--brand)] text-white' 
              : 'hover:bg-[var(--bg-hover)] text-theme'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          ⬍
        </button>
        <button 
          onClick={() => editor.chain().focus().setTextAlign('right').run()} 
          disabled={disabled}
          className={`px-2 py-1 rounded transition-colors ${
            editor.isActive({ textAlign: 'right' }) 
              ? 'bg-[var(--brand)] text-white' 
              : 'hover:bg-[var(--bg-hover)] text-theme'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          ➡
        </button>
      </div>

        {/* Content */}
        <div className="p-3 min-h-[8rem] prose prose-invert max-w-none">
          <EditorContent editor={editor} />
        </div>
      </motion.div>
    </FieldWrapper>
  )
}

export default AnimatedTextarea
