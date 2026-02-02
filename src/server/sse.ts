/**
 * Server-Sent Events (SSE) utilities for streaming responses.
 *
 * This module provides functions for creating SSE streams that can send
 * incremental updates to clients. SSE is used for real-time updates during
 * long-running operations like LLM content generation, allowing the UI to
 * show progress as data arrives.
 */

/**
 * Formats data as an SSE message chunk.
 *
 * Converts a JavaScript object into the SSE message format. SSE messages
 * consist of an event type line and a data line, followed by a blank line.
 * The data is JSON-stringified for transmission.
 *
 * @param data - Data object to send in the SSE message. Can be any
 *   serializable JavaScript value.
 * @returns Formatted SSE message string ready to send to the client.
 *   Format: "event: response\ndata: {...}\n\n"
 *
 * @example
 * ```typescript
 * const chunk = sseChunk({ type: "update", content: "..." });
 * // Returns: "event: response\ndata: {\"type\":\"update\",\"content\":\"...\"}\n\n"
 * ```
 */
export const sseChunk = (data: unknown): string => {
  return `event: response\ndata: ${JSON.stringify(data)}\n\n`;
};

/**
 * Creates a ReadableStream for SSE responses.
 *
 * Creates a ReadableStream that can be used as a Response body for SSE
 * streaming. The stream executes the provided handler function and handles
 * errors gracefully by sending error messages to the client before closing.
 *
 * The handler receives a stream controller that can be used to enqueue data
 * chunks. When the handler completes (or throws an error), the stream is
 * automatically closed.
 *
 * @param handler - Async function that generates SSE data. Receives a stream
 *   controller and should enqueue data chunks using controller.enqueue().
 *   The function can yield data incrementally as it becomes available.
 * @returns A ReadableStream<Uint8Array> that can be used as a Response body.
 *   The stream will send SSE-formatted messages and close when the handler
 *   completes or encounters an error.
 *
 * @example
 * ```typescript
 * const stream = createSseStream(async (controller) => {
 *   for await (const chunk of generateContent()) {
 *     controller.enqueue(
 *       new TextEncoder().encode(sseChunk({ content: chunk }))
 *     );
 *   }
 * });
 * return new Response(stream, { headers: { "Content-Type": "text/event-stream" } });
 * ```
 */
export const createSseStream = (
  handler: (
    controller: ReadableStreamDefaultController<Uint8Array>,
  ) => Promise<void>,
): ReadableStream<Uint8Array> => {
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        await handler(controller);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Streaming error";
        controller.enqueue(
          new TextEncoder().encode(
            sseChunk({ type: "error", detail: message }),
          ),
        );
      } finally {
        controller.close();
      }
    },
  });
};
