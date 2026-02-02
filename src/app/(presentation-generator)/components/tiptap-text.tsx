/**
 * Inline rich text editor component using TipTap with bubble menu.
 *
 * This component provides an inline text editor that appears when editing
 * text elements in slides. It features a floating bubble menu that appears
 * when text is selected, allowing quick formatting without a toolbar.
 *
 * Features:
 * - Bubble menu for formatting (bold, italic, underline, strikethrough, code)
 * - Markdown support for content storage
 * - Blur-based change detection (saves on blur, not on every keystroke)
 * - Content synchronization with external content prop
 * - SSR-safe configuration for Next.js
 * - Preserves text styling (font, color, gradient) from parent element
 *
 * The editor is used by TiptapTextReplacer to replace static text elements
 * with editable components in slide layouts.
 */

"use client";

import React, { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "@tiptap/markdown";
import {
  Bold,
  Italic,
  Underline as UnderlinedIcon,
  Strikethrough,
  Code,
} from "lucide-react";

/**
 * Props for the TiptapText component.
 *
 * @property content - Initial markdown content string to display in the editor.
 * @property onContentChange - Optional callback invoked when editor content changes.
 *   Called on blur event, not on every keystroke. Receives markdown string.
 * @property className - Additional CSS classes to apply to the editor container.
 * @property placeholder - Placeholder text to show when editor is empty.
 */
interface TiptapTextProps {
  content: string;
  onContentChange?: (content: string) => void;
  className?: string;
  placeholder?: string;
}

/**
 * Inline rich text editor with bubble menu.
 *
 * Renders a TipTap editor with floating bubble menu for text formatting.
 * Saves content on blur to avoid excessive updates. Synchronizes with
 * external content prop changes.
 *
 * @param props - Component props containing content, change handler, and styling.
 * @returns JSX element containing the TipTap editor with bubble menu.
 */
// In tiptap 3.x, Underline is included by default in StarterKit
const TiptapText: React.FC<TiptapTextProps> = ({
  content,
  onContentChange,
  className = "",
  placeholder = "Enter text...",
}) => {
  /**
   * Initialize TipTap editor with markdown support and bubble menu.
   *
   * Configures StarterKit for basic formatting and Markdown extension.
   * Sets up blur handler to save content when editor loses focus. Uses
   * SSR-safe configuration for Next.js compatibility.
   */
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // tiptap 3.x: Link is included by default, disable if needed
        // link: false,
      }),
      Markdown,
    ],
    content: content || placeholder,
    editorProps: {
      attributes: {
        class: `outline-none focus:outline-none transition-all duration-200 ${className}`,
        "data-placeholder": placeholder,
      },
    },
    /**
     * Handles editor blur event to save content.
     *
     * Extracts markdown from editor storage and calls onContentChange callback.
     * Only saves on blur, not on every keystroke, to reduce update frequency.
     */
    onBlur: ({ editor }) => {
      // tiptap 3.x: storage type access method
      const markdownStorage = editor.storage.markdown as unknown as {
        getMarkdown: () => string;
      };
      const markdown = markdownStorage?.getMarkdown?.();
      if (onContentChange && markdown) {
        onContentChange(markdown);
      }
    },
    editable: true,
    // tiptap 3.x: required options for SSR
    // Prevents hydration mismatches in Next.js by deferring initial render
    immediatelyRender: false,
  });

  /**
   * Effect: Synchronize editor content with external content prop.
   *
   * When content prop changes externally (e.g., from parent component),
   * updates the editor content. Compares current markdown to avoid
   * unnecessary updates that could cause cursor position issues.
   */
  useEffect(() => {
    if (!editor) return;
    // Compare against current plain text to avoid unnecessary updates
    const markdownStorage = editor.storage.markdown as unknown as {
      getMarkdown: () => string;
    };
    const currentText = markdownStorage?.getMarkdown?.() ?? "";
    if ((content || "") !== currentText) {
      editor.commands.setContent(content || "");
    }
  }, [content, editor]);

  if (!editor) {
    return <div className={className}>{content || placeholder}</div>;
  }

  return (
    <>
      {/* tiptap 3.x: BubbleMenu is imported from @tiptap/react/menus */}
      {/* Changed tippyOptions → options (using Floating UI) */}
      <BubbleMenu
        editor={editor}
        options={{
          placement: "top",
          offset: { mainAxis: 8 },
        }}
      >
        <div
          style={{ zIndex: 100 }}
          className="flex text-black bg-white rounded-lg shadow-lg p-2 gap-1 border border-gray-200 z-50"
        >
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-1 rounded hover:bg-gray-100 transition-colors ${
              editor.isActive("bold") ? "bg-blue-100 text-blue-600" : ""
            }`}
            title="Bold"
          >
            <Bold className="h-4 w-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-1 rounded hover:bg-gray-100 transition-colors ${
              editor.isActive("italic") ? "bg-blue-100 text-blue-600" : ""
            }`}
            title="Italic"
          >
            <Italic className="h-4 w-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`p-1 rounded hover:bg-gray-100 transition-colors ${
              editor.isActive("underline") ? "bg-blue-100 text-blue-600" : ""
            }`}
            title="Underline"
          >
            <UnderlinedIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`p-1 rounded hover:bg-gray-100 transition-colors ${
              editor.isActive("strike") ? "bg-blue-100 text-blue-600" : ""
            }`}
            title="Strikethrough"
          >
            <Strikethrough className="h-4 w-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleCode().run()}
            className={`p-1 rounded hover:bg-gray-100 transition-colors ${
              editor.isActive("code") ? "bg-blue-100 text-blue-600" : ""
            }`}
            title="Code"
          >
            <Code className="h-4 w-4" />
          </button>
        </div>
      </BubbleMenu>

      <EditorContent
        editor={editor}
        className="tiptap-text-editor w-full"
        style={{
          // Ensure the editor maintains the same visual appearance
          lineHeight: "inherit",
          fontSize: "inherit",
          fontWeight: "inherit",
          fontFamily: "inherit",
          color: "inherit",
          textAlign: "inherit",
          // Inherit gradient text styles
          background: "inherit",
          backgroundClip: "inherit",
          WebkitBackgroundClip: "inherit",
          WebkitTextFillColor: "inherit",
        }}
      />
    </>
  );
};

export default TiptapText;
