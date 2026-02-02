import {
  OutlineDeltaHandler,
  OutlineDeltaParserOptions,
  SlideDeltaHandler,
  SlideDeltaParserOptions,
  SlidePathSegment,
} from "../types/streaming";
import { MIN_DELTA_INTERVAL_MS } from "./constants";

/**
 * Converts an array of path segments into a dot-notation string path.
 *
 * Path segments represent navigation through nested JSON objects and arrays.
 * This function combines them into a string like "title" or "items[0].value"
 * that can be used to identify specific fields in slide content.
 *
 * @param segments - Array of path segments, each representing a key or array index.
 * @returns A string path in dot-notation format (e.g., "title", "items[0].value").
 */
const buildSlidePath = (segments: SlidePathSegment[]): string => {
  return segments.reduce((acc, seg) => {
    if (seg.type === "key") {
      return acc ? `${acc}.${seg.key}` : seg.key;
    }
    return `${acc}[${seg.index}]`;
  }, "");
};

/**
 * Creates a delta parser for outline streaming that extracts content as it arrives.
 *
 * This parser implements a state machine that processes JSON tokens character-by-character
 * to extract outline content from a streaming JSON response. It tracks:
 * - JSON structure (objects, arrays, strings)
 * - Position within the "slides" array
 * - Content of each outline's "content" field
 *
 * The parser sends incremental updates via the onDelta callback as outline content
 * is detected, allowing the UI to show progress in real-time.
 *
 * State machine tracks:
 * - Stack of container types (object/array) for nested structure
 * - Whether we're inside the "slides" array
 * - Current slide index being processed
 * - String parsing state (key vs value vs content)
 * - Escape sequences and Unicode handling
 *
 * @param minIntervalMs - Minimum milliseconds between delta updates for the same slide.
 *   Throttles updates to prevent overwhelming the client.
 * @param onDelta - Callback function called when outline content is detected or updated.
 *   Receives slide index and current content string.
 * @returns An object with a `push` method that accepts JSON token strings.
 *   Call push() repeatedly with tokens as they arrive from the LLM stream.
 *
 * @example
 * ```typescript
 * const parser = createOutlineDeltaParser({
 *   minIntervalMs: 40,
 *   onDelta: (index, content) => {
 *     console.log(`Slide ${index}: ${content}`);
 *   }
 * });
 * parser.push('{"slides":[');
 * parser.push('{"content":"INTRO:');
 * parser.push(' Company tagline"}');
 * // onDelta called with index=0, content="INTRO: Company tagline"
 * ```
 */
export const createOutlineDeltaParser = ({
  minIntervalMs = MIN_DELTA_INTERVAL_MS,
  onDelta,
}: OutlineDeltaParserOptions) => {
  const stack: Array<"object" | "array"> = [];
  let inSlidesArray = false;
  let slidesArrayDepth = -1;
  let pendingSlidesArrayStart = false;

  let currentSlideIndex = -1;
  const contentByIndex: string[] = [];
  const lastSentLengthByIndex: number[] = [];
  const lastSentAtByIndex: number[] = [];

  let inString = false;
  let currentStringType: "key" | "value" | "content" | null = null;
  let stringBuffer = "";
  let lastString = "";
  let lastStringWasKeyCandidate = false;
  let expectingValueForKey: string | null = null;

  let escape = false;
  let unicodeBuffer = "";

  const maybeSendDelta = (index: number, force = false) => {
    const content = contentByIndex[index] ?? "";
    const lastLength = lastSentLengthByIndex[index] ?? 0;
    if (!force && content.length <= lastLength) return;

    const now = Date.now();
    const lastAt = lastSentAtByIndex[index] ?? 0;
    if (!force && now - lastAt < minIntervalMs) return;

    lastSentAtByIndex[index] = now;
    lastSentLengthByIndex[index] = content.length;
    onDelta(index, content);
  };

  const appendContentChar = (char: string) => {
    if (currentSlideIndex < 0) return;
    const current = contentByIndex[currentSlideIndex] ?? "";
    contentByIndex[currentSlideIndex] = current + char;
    maybeSendDelta(currentSlideIndex);
  };

  const handleContentChar = (char: string) => {
    if (unicodeBuffer) {
      if (/^[0-9a-fA-F]$/.test(char)) {
        unicodeBuffer += char;
        if (unicodeBuffer.length === 4) {
          const codePoint = Number.parseInt(unicodeBuffer, 16);
          appendContentChar(String.fromCharCode(codePoint));
          unicodeBuffer = "";
        }
      } else {
        appendContentChar("\\u" + unicodeBuffer + char);
        unicodeBuffer = "";
      }
      return;
    }

    if (escape) {
      escape = false;
      switch (char) {
        case '"':
          appendContentChar('"');
          break;
        case "\\":
          appendContentChar("\\");
          break;
        case "/":
          appendContentChar("/");
          break;
        case "b":
          appendContentChar("\b");
          break;
        case "f":
          appendContentChar("\f");
          break;
        case "n":
          appendContentChar("\n");
          break;
        case "r":
          appendContentChar("\r");
          break;
        case "t":
          appendContentChar("\t");
          break;
        case "u":
          unicodeBuffer = "";
          break;
        default:
          appendContentChar(char);
          break;
      }
      return;
    }

    if (char === "\\") {
      escape = true;
      return;
    }

    appendContentChar(char);
  };

  const handleStringChar = (char: string) => {
    if (currentStringType === "content") {
      handleContentChar(char);
      return;
    }

    if (escape) {
      escape = false;
      stringBuffer += char;
      return;
    }

    if (char === "\\") {
      escape = true;
      return;
    }

    stringBuffer += char;
  };

  const closeString = () => {
    if (currentStringType === "key") {
      lastString = stringBuffer;
      lastStringWasKeyCandidate = true;
    }
    if (currentStringType === "content") {
      maybeSendDelta(currentSlideIndex, true);
    }
    currentStringType = null;
    stringBuffer = "";
    inString = false;
    escape = false;
    unicodeBuffer = "";
  };

  const openString = () => {
    inString = true;
    escape = false;
    unicodeBuffer = "";
    if (expectingValueForKey) {
      if (expectingValueForKey === "content" && inSlidesArray) {
        currentStringType = "content";
        currentSlideIndex += 1;
        if (!contentByIndex[currentSlideIndex]) {
          contentByIndex[currentSlideIndex] = "";
        }
      } else {
        currentStringType = "value";
        stringBuffer = "";
      }
      expectingValueForKey = null;
    } else {
      currentStringType = "key";
      stringBuffer = "";
    }
  };

  const handleNonStringChar = (char: string) => {
    if (char === '"') {
      openString();
      return;
    }

    if (char === ":") {
      if (lastStringWasKeyCandidate) {
        expectingValueForKey = lastString;
        lastStringWasKeyCandidate = false;
        if (expectingValueForKey === "slides") {
          pendingSlidesArrayStart = true;
        }
      }
      return;
    }

    if (char === "[") {
      if (pendingSlidesArrayStart) {
        inSlidesArray = true;
        slidesArrayDepth = stack.length;
        pendingSlidesArrayStart = false;
      }
      stack.push("array");
      if (expectingValueForKey) {
        expectingValueForKey = null;
      }
      return;
    }

    if (char === "{") {
      stack.push("object");
      if (expectingValueForKey) {
        expectingValueForKey = null;
      }
      return;
    }

    if (char === "]") {
      if (stack[stack.length - 1] === "array") {
        const closingDepth = stack.length - 1;
        if (inSlidesArray && closingDepth === slidesArrayDepth) {
          inSlidesArray = false;
          slidesArrayDepth = -1;
        }
        stack.pop();
      }
      return;
    }

    if (char === "}") {
      if (stack[stack.length - 1] === "object") {
        stack.pop();
      }
      return;
    }

    if (!/\s/.test(char) && expectingValueForKey) {
      expectingValueForKey = null;
    }
  };

  const push = (chunk: string) => {
    for (const char of chunk) {
      if (inString) {
        if (char === '"' && !escape && !unicodeBuffer) {
          closeString();
        } else {
          handleStringChar(char);
        }
      } else {
        handleNonStringChar(char);
      }
    }
  };

  return { push };
};

/**
 * Creates a delta parser for slide content streaming that extracts field values by path.
 *
 * This parser implements a more complex state machine than the outline parser because
 * it needs to track the full path to each field (e.g., "title", "items[0].value") as
 * it processes the JSON stream. It extracts values for specific paths and sends delta
 * updates as fields are generated.
 *
 * The parser tracks:
 * - Full path stack through nested objects and arrays
 * - Current field being processed (key detection)
 * - String values as they're parsed
 * - Array indices for array elements
 * - Escape sequences and Unicode handling
 *
 * State machine features:
 * - Tracks path segments (keys and indices) to build full field paths
 * - Detects when entering/exiting objects and arrays
 * - Extracts string values and maps them to their paths
 * - Throttles updates per path to prevent spam
 *
 * @param slideIndex - Zero-based index of the slide being parsed (included in delta updates).
 * @param minIntervalMs - Minimum milliseconds between delta updates for the same path.
 *   Prevents sending too many rapid updates for the same field.
 * @param onDelta - Callback function called when a field value is detected or updated.
 *   Receives an object with `index` (slide index), `path` (field path string),
 *   and `value` (current field value as string).
 * @returns An object with a `push` method that accepts JSON token strings.
 *   Call push() repeatedly with tokens as they arrive from the LLM stream.
 *
 * @example
 * ```typescript
 * const parser = createSlideDeltaParser({
 *   slideIndex: 0,
 *   minIntervalMs: 40,
 *   onDelta: ({ index, path, value }) => {
 *     console.log(`Slide ${index}, field ${path}: ${value}`);
 *   }
 * });
 * parser.push('{"title":"My');
 * parser.push(' Title","items":[');
 * // onDelta called with { index: 0, path: "title", value: "My Title" }
 * ```
 */
export const createSlideDeltaParser = ({
  slideIndex,
  minIntervalMs = MIN_DELTA_INTERVAL_MS,
  onDelta,
}: SlideDeltaParserOptions) => {
  const stack: Array<"object" | "array"> = [];
  const pathStack: SlidePathSegment[] = [];
  const pathMarkerStack: boolean[] = [];
  const arrayIndexStack: number[] = [];
  const objectExpectingKeyStack: boolean[] = [];

  let pendingKey: string | null = null;
  let inString = false;
  let stringType: "key" | "value" | null = null;
  let keyBuffer = "";
  let valueBuffer = "";
  let activePath: string | null = null;
  const lastSentAtByPath = new Map<string, number>();

  let escape = false;
  let unicodeBuffer = "";

  const maybeSendDelta = (path: string, value: string, force = false) => {
    const now = Date.now();
    const lastAt = lastSentAtByPath.get(path) ?? 0;
    if (!force && now - lastAt < minIntervalMs) return;
    lastSentAtByPath.set(path, now);
    onDelta({ index: slideIndex, path, value });
  };

  const takeValueSegment = (): SlidePathSegment | null => {
    if (pendingKey) {
      const key = pendingKey;
      pendingKey = null;
      return { type: "key", key };
    }
    if (stack[stack.length - 1] === "array") {
      const idx = arrayIndexStack[arrayIndexStack.length - 1] ?? 0;
      return { type: "index", index: idx };
    }
    return null;
  };

  const enterContainer = (type: "object" | "array") => {
    const segment = takeValueSegment();
    if (segment) {
      pathStack.push(segment);
      pathMarkerStack.push(true);
    } else {
      pathMarkerStack.push(false);
    }
    stack.push(type);
    if (type === "array") {
      arrayIndexStack.push(0);
    } else {
      objectExpectingKeyStack.push(true);
    }
  };

  const exitContainer = (type: "object" | "array") => {
    if (type === "array") {
      arrayIndexStack.pop();
    } else {
      objectExpectingKeyStack.pop();
    }
    stack.pop();
    const pushed = pathMarkerStack.pop();
    if (pushed) {
      pathStack.pop();
    }
  };

  const openString = () => {
    inString = true;
    escape = false;
    unicodeBuffer = "";
    const topType = stack[stack.length - 1];
    const expectingKey =
      topType === "object" &&
      objectExpectingKeyStack[objectExpectingKeyStack.length - 1];
    if (expectingKey) {
      stringType = "key";
      keyBuffer = "";
      return;
    }

    stringType = "value";
    valueBuffer = "";
    const segment = takeValueSegment();
    const nextPath = buildSlidePath(
      segment ? [...pathStack, segment] : pathStack,
    );
    activePath = nextPath || null;
  };

  const closeString = () => {
    if (stringType === "key") {
      pendingKey = keyBuffer;
      const idx = objectExpectingKeyStack.length - 1;
      if (idx >= 0) {
        objectExpectingKeyStack[idx] = false;
      }
    }
    if (stringType === "value" && activePath) {
      maybeSendDelta(activePath, valueBuffer, true);
    }
    inString = false;
    stringType = null;
    keyBuffer = "";
    valueBuffer = "";
    activePath = null;
    escape = false;
    unicodeBuffer = "";
  };

  const appendValueChar = (char: string) => {
    if (!activePath) return;
    valueBuffer += char;
    maybeSendDelta(activePath, valueBuffer);
  };

  const handleStringChar = (char: string) => {
    if (unicodeBuffer) {
      if (/^[0-9a-fA-F]$/.test(char)) {
        unicodeBuffer += char;
        if (unicodeBuffer.length === 4) {
          const codePoint = Number.parseInt(unicodeBuffer, 16);
          if (stringType === "value") {
            appendValueChar(String.fromCharCode(codePoint));
          } else {
            keyBuffer += String.fromCharCode(codePoint);
          }
          unicodeBuffer = "";
        }
      } else {
        if (stringType === "value") {
          appendValueChar("\\u" + unicodeBuffer + char);
        } else {
          keyBuffer += "\\u" + unicodeBuffer + char;
        }
        unicodeBuffer = "";
      }
      return;
    }

    if (escape) {
      escape = false;
      const mapped = (() => {
        switch (char) {
          case '"':
            return '"';
          case "\\":
            return "\\";
          case "/":
            return "/";
          case "b":
            return "\b";
          case "f":
            return "\f";
          case "n":
            return "\n";
          case "r":
            return "\r";
          case "t":
            return "\t";
          case "u":
            unicodeBuffer = "";
            return "";
          default:
            return char;
        }
      })();
      if (!mapped) return;
      if (stringType === "value") {
        appendValueChar(mapped);
      } else {
        keyBuffer += mapped;
      }
      return;
    }

    if (char === "\\") {
      escape = true;
      return;
    }

    if (stringType === "value") {
      appendValueChar(char);
    } else {
      keyBuffer += char;
    }
  };

  const handleNonStringChar = (char: string) => {
    if (char === '"') {
      openString();
      return;
    }
    if (char === ":") {
      return;
    }
    if (char === "{") {
      enterContainer("object");
      return;
    }
    if (char === "[") {
      enterContainer("array");
      return;
    }
    if (char === "}") {
      exitContainer("object");
      return;
    }
    if (char === "]") {
      exitContainer("array");
      return;
    }
    if (char === ",") {
      const top = stack[stack.length - 1];
      if (top === "array") {
        const idx = arrayIndexStack.length - 1;
        if (idx >= 0) {
          arrayIndexStack[idx] += 1;
        }
      } else if (top === "object") {
        const idx = objectExpectingKeyStack.length - 1;
        if (idx >= 0) {
          objectExpectingKeyStack[idx] = true;
        }
      }
      return;
    }
    if (!/\s/.test(char) && pendingKey) {
      pendingKey = null;
    }
  };

  const push = (chunk: string) => {
    for (const char of chunk) {
      if (inString) {
        if (char === '"' && !escape && !unicodeBuffer) {
          closeString();
        } else {
          handleStringChar(char);
        }
      } else {
        handleNonStringChar(char);
      }
    }
  };

  return { push };
};
