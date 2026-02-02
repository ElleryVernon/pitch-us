/**
 * Type declarations for markdown-related third-party libraries.
 *
 * This file provides TypeScript type definitions for markdown processing
 * libraries used in the application. These declarations extend the types
 * provided by the libraries to ensure type safety when using markdown
 * rendering and processing features.
 */

/**
 * Type declarations for the react-markdown library.
 *
 * Extends the react-markdown module to provide TypeScript types for the
 * ReactMarkdown component. This component is used throughout the application
 * to render markdown content as React components.
 *
 * @remarks
 * The react-markdown library may not have complete TypeScript definitions,
 * so this declaration ensures proper typing for the component and its props.
 */
declare module "react-markdown" {
  import type { ComponentType, ReactNode } from "react";

  /**
   * Props interface for the ReactMarkdown component.
   *
   * Defines the properties that can be passed to the ReactMarkdown component
   * to control how markdown is rendered.
   *
   * @property children - Optional React node containing the markdown content
   *   to be rendered. Typically a string containing markdown syntax.
   * @property remarkPlugins - Optional array of remark plugins to extend
   *   markdown processing capabilities. Plugins can add features like GitHub
   *   Flavored Markdown (GFM), syntax highlighting, etc.
   * @property className - Optional CSS class name to apply to the rendered
   *   markdown container. Used for styling the markdown output.
   */
  export interface ReactMarkdownProps {
    children?: ReactNode;
    remarkPlugins?: Array<unknown>;
    className?: string;
  }

  /**
   * ReactMarkdown component type.
   *
   * The main component exported by react-markdown for rendering markdown
   * content as React elements.
   */
  const ReactMarkdown: ComponentType<ReactMarkdownProps>;
  export default ReactMarkdown;
}

/**
 * Type declarations for the remark-gfm library.
 *
 * Extends the remark-gfm module to provide TypeScript types. remark-gfm is
 * a remark plugin that adds GitHub Flavored Markdown support, including
 * features like tables, strikethrough, task lists, and autolinks.
 *
 * @remarks
 * The remark-gfm library may not have complete TypeScript definitions,
 * so this declaration ensures it can be imported and used as a remark plugin.
 */
declare module "remark-gfm" {
  /**
   * Default export for the remark-gfm plugin.
   *
   * This plugin extends remark (a markdown processor) with GitHub Flavored
   * Markdown features. It's typically used as a plugin in the remarkPlugins
   * array of ReactMarkdown.
   */
  const remarkGfm: unknown;
  export default remarkGfm;
}
