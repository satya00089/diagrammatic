import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import Heading from "@tiptap/extension-heading";
import BulletList from "@tiptap/extension-bullet-list";
import OrderedList from "@tiptap/extension-ordered-list";
import ListItem from "@tiptap/extension-list-item";
import { FieldWrapper } from "./AnimatedFieldBase";
import { useFocus } from "./useFocus";
import {
  MdFormatAlignLeft,
  MdFormatAlignCenter,
  MdFormatAlignRight,
  MdFormatBold,
  MdFormatItalic,
  MdFormatUnderlined,
  MdFormatListBulleted,
  MdFormatListNumbered,
  MdFormatQuote,
  MdCode,
  MdFullscreen,
  MdFullscreenExit,
} from "react-icons/md";

export interface AnimatedTextareaProps {
  id: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  containerClassName?: string;
}

/**
 * Small reusable toolbar button to reduce duplication and nesting.
 */
const ToolbarButton: React.FC<{
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  title?: string;
  children?: React.ReactNode;
}> = ({ onClick, disabled, active, title, children }) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`px-2 py-1 rounded transition-colors ${
        active
          ? "bg-[var(--brand)] text-white"
          : "hover:bg-[var(--bg-hover)] text-theme"
      } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      {children}
    </button>
  );
};

/**
 * Heading select extracted to its own component to keep main component simpler.
 */
const HeadingSelect: React.FC<{
  editor: Editor;
  disabled?: boolean;
}> = ({ editor, disabled }) => {
  let headingValue = "0";
  if (editor.isActive("heading", { level: 1 })) {
    headingValue = "1";
  } else if (editor.isActive("heading", { level: 2 })) {
    headingValue = "2";
  } else if (editor.isActive("heading", { level: 3 })) {
    headingValue = "3";
  }

  return (
    <select
      title="Heading level"
      value={headingValue}
      onChange={(e) => {
        const level = parseInt(e.target.value, 10);
        if (level === 0) {
          editor.chain().focus().setParagraph().run();
        } else {
          editor
            .chain()
            .focus()
            .toggleHeading({ level: level as 1 | 2 | 3 })
            .run();
        }
      }}
      className="rounded border px-1 py-0.5 bg-[var(--surface)] text-theme"
      disabled={disabled}
    >
      <option value="0">P</option>
      <option value="1">H1</option>
      <option value="2">H2</option>
      <option value="3">H3</option>
    </select>
  );
};

const AnimatedTextarea: React.FC<AnimatedTextareaProps> = ({
  id,
  label,
  value,
  onChange,
  placeholder = "Start typing…",
  disabled = false,
  className = "",
  containerClassName,
}) => {
  const [, forceUpdate] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { focused, onFocus, onBlur } = useFocus();

  const triggerUpdate = () => forceUpdate(Date.now());

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Disable StarterKit's default list extensions so we can configure them ourselves
        bulletList: false,
        orderedList: false,
        listItem: false,
      }),
      // Configure list extensions explicitly
      BulletList.configure({
        HTMLAttributes: {
          class: "bullet-list",
        },
      }),
      OrderedList.configure({
        HTMLAttributes: {
          class: "ordered-list",
        },
      }),
      ListItem.configure({
        HTMLAttributes: {
          class: "list-item",
        },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
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
      onChange(editor.getHTML());
    },
    onFocus: onFocus,
    onBlur: onBlur,
    onSelectionUpdate: () => {
      // Force re-render when selection changes to update button states
      triggerUpdate();
    },
    onTransaction: () => {
      // Force re-render on any transaction to keep UI in sync
      triggerUpdate();
    },
  });

  useEffect(() => {
    if (!editor) return;
    if (value !== editor.getHTML()) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
    editor.setEditable(!disabled);
  }, [value, disabled, editor]);

  // Handle ESC key to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    if (isFullscreen) {
      document.addEventListener("keydown", handleKeyDown);
      // Prevent body scroll when in fullscreen
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isFullscreen]);

  if (!editor) return null;

  // build a compact list of buttons to render which reduces branching inside JSX
  const inlineButtons = [
    {
      key: "bold",
      title: "Bold",
      onClick: () => editor.chain().focus().toggleBold().run(),
      active: editor.isActive("bold"),
      node: <MdFormatBold size={16} />,
    },
    {
      key: "italic",
      title: "Italic",
      onClick: () => editor.chain().focus().toggleItalic().run(),
      active: editor.isActive("italic"),
      node: <MdFormatItalic size={16} />,
    },
    {
      key: "underline",
      title: "Underline",
      onClick: () => editor.chain().focus().toggleUnderline().run(),
      active: editor.isActive("underline"),
      node: <MdFormatUnderlined size={16} />,
    },
    {
      key: "strike",
      title: "Strikethrough",
      onClick: () => editor.chain().focus().toggleStrike().run(),
      active: editor.isActive("strike"),
      node: <>S</>,
    },
    {
      key: "bulletList",
      title: "Bullet List",
      onClick: () => editor.chain().focus().toggleBulletList().run(),
      active: editor.isActive("bulletList"),
      node: <MdFormatListBulleted size={16} />,
    },
    {
      key: "orderedList",
      title: "Numbered List",
      onClick: () => editor.chain().focus().toggleOrderedList().run(),
      active: editor.isActive("orderedList"),
      node: <MdFormatListNumbered size={16} />,
    },
    {
      key: "blockquote",
      title: "Quote",
      onClick: () => editor.chain().focus().toggleBlockquote().run(),
      active: editor.isActive("blockquote"),
      node: <MdFormatQuote size={16} />,
    },
    {
      key: "codeBlock",
      title: "Code Block",
      onClick: () => editor.chain().focus().toggleCodeBlock().run(),
      active: editor.isActive("codeBlock"),
      node: <MdCode size={16} />,
    },
  ];

  const alignmentButtons = [
    {
      key: "align-left",
      title: "Align Left",
      onClick: () => editor.chain().focus().setTextAlign("left").run(),
      active: editor.isActive({ textAlign: "left" }),
      node: <MdFormatAlignLeft size={16} />,
    },
    {
      key: "align-center",
      title: "Align Center",
      onClick: () => editor.chain().focus().setTextAlign("center").run(),
      active: editor.isActive({ textAlign: "center" }),
      node: <MdFormatAlignCenter size={16} />,
    },
    {
      key: "align-right",
      title: "Align Right",
      onClick: () => editor.chain().focus().setTextAlign("right").run(),
      active: editor.isActive({ textAlign: "right" }),
      node: <MdFormatAlignRight size={16} />,
    },
  ];

  const utilityButtons = [
    {
      key: "fullscreen",
      title: isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen",
      onClick: toggleFullscreen,
      active: isFullscreen,
      node: isFullscreen ? (
        <MdFullscreenExit size={16} />
      ) : (
        <MdFullscreen size={16} />
      ),
    },
  ];

  return (
    <div
      className={
        isFullscreen ? "fixed inset-0 z-50 bg-[var(--bg)] flex flex-col" : ""
      }
    >
      {isFullscreen ? (
        // Fullscreen mode without FieldWrapper to maximize space
        <motion.div
          className="h-full flex flex-col rounded-lg border border-[var(--border)] bg-[var(--surface)] text-theme m-4"
          animate={{
            boxShadow: focused
              ? "0 0 0 2px var(--brand)"
              : "0 0 0 1px var(--border)",
          }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          {/* Fullscreen Toolbar */}
          <div className="flex flex-wrap items-center gap-1 border-b border-[var(--border)] p-2 text-sm shrink-0">
            <div className="flex items-center gap-2 mr-4">
              {label && <span className="font-medium text-theme">{label}</span>}
            </div>
            <HeadingSelect editor={editor} disabled={disabled} />

            {inlineButtons.map((b) => (
              <ToolbarButton
                key={b.key}
                onClick={b.onClick}
                disabled={disabled}
                active={b.active}
                title={b.title}
              >
                {b.node}
              </ToolbarButton>
            ))}

            {alignmentButtons.map((b) => (
              <ToolbarButton
                key={b.key}
                onClick={b.onClick}
                disabled={disabled}
                active={b.active}
                title={b.title}
              >
                {b.node}
              </ToolbarButton>
            ))}

            {/* Separator */}
            <div className="w-px h-6 bg-[var(--border)] mx-1" />

            {utilityButtons.map((b) => (
              <ToolbarButton
                key={b.key}
                onClick={b.onClick}
                disabled={disabled}
                active={b.active}
                title={b.title}
              >
                {b.node}
              </ToolbarButton>
            ))}
          </div>

          {/* Fullscreen Content */}
          <div className="flex-1 overflow-hidden">
            <div className="h-full overflow-y-auto p-4">
              <div className="prose prose-invert max-w-none min-h-full">
                <EditorContent
                  editor={editor}
                  className="focus:outline-none h-full"
                />
              </div>
            </div>
          </div>
        </motion.div>
      ) : (
        // Normal mode with FieldWrapper
        <FieldWrapper
          id={id}
          label={label}
          focused={focused}
          containerClassName={containerClassName}
        >
          <motion.div
            className={`rounded-lg border border-[var(--border)] bg-[var(--surface)] text-theme ${className} ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
            animate={{
              boxShadow: focused
                ? "0 0 0 2px var(--brand)"
                : "0 0 0 1px var(--border)",
            }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            {/* Normal Toolbar */}
            <div className="flex flex-wrap items-center gap-1 border-b border-[var(--border)] p-1 text-sm">
              <HeadingSelect editor={editor} disabled={disabled} />

              {inlineButtons.map((b) => (
                <ToolbarButton
                  key={b.key}
                  onClick={b.onClick}
                  disabled={disabled}
                  active={b.active}
                  title={b.title}
                >
                  {b.node}
                </ToolbarButton>
              ))}

              {alignmentButtons.map((b) => (
                <ToolbarButton
                  key={b.key}
                  onClick={b.onClick}
                  disabled={disabled}
                  active={b.active}
                  title={b.title}
                >
                  {b.node}
                </ToolbarButton>
              ))}

              {/* Separator */}
              <div className="w-px h-6 bg-[var(--border)] mx-1" />

              {utilityButtons.map((b) => (
                <ToolbarButton
                  key={b.key}
                  onClick={b.onClick}
                  disabled={disabled}
                  active={b.active}
                  title={b.title}
                >
                  {b.node}
                </ToolbarButton>
              ))}
            </div>

            {/* Normal Content */}
            <div className="p-3 min-h-[8rem] prose prose-invert max-w-none">
              <EditorContent editor={editor} className="focus:outline-none" />
            </div>
          </motion.div>
        </FieldWrapper>
      )}
    </div>
  );
};

export default AnimatedTextarea;
