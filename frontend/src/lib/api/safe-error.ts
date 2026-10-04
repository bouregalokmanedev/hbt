/**
 * Browser, network and parsing failures arrive as raw engine strings —
 * "Failed to fetch", "Unexpected token '<' … is not valid JSON",
 * "Cannot read properties of undefined". Those describe our code, not
 * something the learner can act on, so they are rewritten before anything
 * is rendered.
 *
 * Everything else (the API's own hand written copy, validation text) is
 * passed through untouched.
 */
const INTERNAL_PATTERNS: RegExp[] = [
  /failed to fetch/i,
  /networkerror when attempting/i,
  /\bnetwork error\b/i,
  /\bload failed\b/i,
  /failed to load resource/i,
  /unexpected token/i,
  /is not valid json/i,
  /chunkloaderror/i,
  /failed to fetch dynamically imported module/i,
  /error loading dynamically imported module/i,
  /cannot read propert(?:y|ies) of/i,
  /\bundefined is not an object\b/i,
  /\bis not a function\b/i,
  /\bis not iterable\b/i,
  /\bcannot read.*\bof null\b/i,
  /maximum call stack size exceeded/i,
  /\btypeerror\b/i,
  /\breferenceerror\b/i,
  /\bsyntaxerror\b/i,
  /\.tsx?:\d+/,
  /\.js:\d+/,
  /\/var\/www\/|\/Users\/|\bstack\b.*\bat\b/,
  /\bsqlstate\b/i,
  /\bsql:\s/i,
  /\bconnection:\s/i,
  /integrity constraint/i,
  /stack trace/i,
];

/** Copy we are happy to show in place of an internal message. */
export const REQUEST_FAILED = "The request could not be completed. Please try again.";

/** Rewrites internal-looking messages, leaves product copy alone. */
export function safeErrorMessage(message: string): string {
  const trimmed = message.trim();

  if (!trimmed) {
    return REQUEST_FAILED;
  }

  return INTERNAL_PATTERNS.some((pattern) => pattern.test(trimmed))
    ? REQUEST_FAILED
    : trimmed;
}

/** Normalises any thrown value into a message safe to render. */
export function errorMessage(
  cause: unknown,
  fallback: string = REQUEST_FAILED,
): string {
  if (cause instanceof Error && cause.message.trim()) {
    return safeErrorMessage(cause.message);
  }

  if (typeof cause === "string" && cause.trim()) {
    return safeErrorMessage(cause);
  }

  return fallback;
}
