/**
 * Markdown editor component using TipTap with markdown support.
 *
 * This component provides a rich text editor that works with markdown syntax.
 * It uses TipTap's StarterKit for basic formatting (bold, italic, headings,
 * lists, etc.) and the Markdown extension for bidirectional markdown conversion.
 *
 * Features:
 * - Real-time markdown editing with visual feedback
 * - Automatic markdown conversion on content changes
 * - Prose styling for readable content
 * - SSR-safe configuration for Next.js
 *
 * The editor calls onChange callback whenever content is updated, providing
 * the markdown string representation of the current content.
 */

"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "@tiptap/markdown";

/**
 * Props for the MarkdownEditor component.
 *
 * @property content - Initial markdown content string to display in the editor.
 * @property onChange - Callback function invoked whenever editor content changes.
 *   Receives the markdown string representation of the current content.
 */
interface MarkdownEditorProps {
  content: string;
  onChange: (content: string) => void;
}

/**
 * Markdown editor component.
 *
 * Renders a TipTap editor configured for markdown editing. Automatically
 * converts editor content to markdown format and calls onChange callback
 * on every update.
 *
 * @param props - Component props containing initial content and change handler.
 * @returns JSX element containing the TipTap editor with markdown support.
 */
export default function MarkdownEditor({
  content,
  onChange,
}: MarkdownEditorProps) {
  /**
   * Initialize TipTap editor with markdown support.
   *
   * Configures StarterKit for basic formatting and Markdown extension for
   * bidirectional markdown conversion. Sets up onUpdate handler to convert
   * editor content to markdown and call onChange callback.
   */
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // tiptap 3.x: Link is included by default in StarterKit
        // link: false,
      }),
      Markdown,
    ],
    content: content,
    editorProps: {
      attributes: {
        class: "outline-none transition-all duration-200",
      },
    },
    /**
     * Handles editor content updates.
     *
     * Extracts markdown from editor storage and calls onChange callback.
     * TipTap 3.x uses storage.markdown.getMarkdown() to access markdown content.
     */
    onUpdate: ({ editor }) => {
      // tiptap 3.x: storage type access method
      const markdownStorage = editor.storage.markdown as unknown as {
        getMarkdown: () => string;
      };
      const markdown = markdownStorage.getMarkdown();
      onChange(markdown);
    },
    // tiptap 3.x: required options for SSR
    // Prevents hydration mismatches in Next.js by deferring initial render
    immediatelyRender: false,
  });

  return (
    <div className="relative">
      <EditorContent
        className="text-sm font-normal outline-none resize-none min-h-[60px] prose prose-sm max-w-none text-text-200 leading-relaxed prose-p:my-0 prose-ul:my-0 prose-ol:my-0"
        editor={editor}
        placeholder="Enter markdown content here..."
      />
    </div>
  );
}
