/**
 * Resilient HTTP Client for StressAlpha Financial Feeds & Ingestion Pipelines.
 *
 * Implements:
 * - Configurable retries (default 3)
 * - Exponential backoff with random jitter: delay = min(maxDelay, baseDelay * 2^attempt + jitter)
 * - Automatic HTTP 429 rate limit handling with Retry-After header parsing (seconds or HTTP date)
 * - Automatic handling of transient 5xx server errors (500, 502, 503, 504)
 * - Request timeout budgeting via AbortController (default 10s)
 */

export interface RetryConfig {
  /** Maximum number of retry attempts (default: 3) */
  maxRetries?: number;
  /** Initial delay before first retry in milliseconds (default: 500ms; 10ms in tests) */
  baseDelayMs?: number;
  /** Ceiling for exponential backoff delay in milliseconds (default: 10,000ms) */
  maxDelayMs?: number;
  /** Request timeout budget in milliseconds (default: 10,000ms) */
  timeoutMs?: number;
  /** HTTP status codes that trigger a retry attempt */
  retryOnStatus?: number[];
}

const isTestEnv =
  process.env.NODE_ENV === "test" || process.env.VITEST === "true";

export const DEFAULT_RETRY_CONFIG: Required<RetryConfig> = {
  maxRetries: 3,
  baseDelayMs: isTestEnv ? 10 : 500,
  maxDelayMs: 10_000,
  timeoutMs: 10_000,
  retryOnStatus: [429, 500, 502, 503, 504],
};

/**
 * Parses HTTP Retry-After header value into millisecond delay.
 * Supports both integer seconds ("5") and IMF-fixdate ("Wed, 21 Oct 2026 07:28:00 GMT").
 */
export function parseRetryAfterHeader(
  headerValue: string | null | undefined,
  maxDelayMs: number,
  baseDelayMs: number
): number | null {
  if (!headerValue) return null;

  // Case 1: Value in seconds
  const seconds = Number(headerValue);
  if (!Number.isNaN(seconds) && seconds >= 0) {
    return Math.min(maxDelayMs, Math.max(baseDelayMs, seconds * 1000));
  }

  // Case 2: Value as HTTP date
  const dateMs = Date.parse(headerValue);
  if (!Number.isNaN(dateMs)) {
    const diff = dateMs - Date.now();
    return Math.min(maxDelayMs, Math.max(baseDelayMs, diff));
  }

  return null;
}

/**
 * Executes an HTTP fetch with timeout budgeting, exponential backoff, and 429/5xx retry handling.
 */
export async function resilientFetch(
  input: string | URL | Request,
  init?: RequestInit,
  config?: RetryConfig
): Promise<Response> {
  const maxRetries = config?.maxRetries ?? DEFAULT_RETRY_CONFIG.maxRetries;
  const baseDelayMs = config?.baseDelayMs ?? DEFAULT_RETRY_CONFIG.baseDelayMs;
  const maxDelayMs = config?.maxDelayMs ?? DEFAULT_RETRY_CONFIG.maxDelayMs;
  const timeoutMs = config?.timeoutMs ?? DEFAULT_RETRY_CONFIG.timeoutMs;
  const retryOnStatus =
    config?.retryOnStatus ?? DEFAULT_RETRY_CONFIG.retryOnStatus;

  let lastError: unknown;
  let lastResponse: Response | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    let timeoutTriggered = false;

    const timeoutId = setTimeout(() => {
      timeoutTriggered = true;
      controller.abort();
    }, timeoutMs);

    // Chain with caller's AbortSignal if provided
    let externalAbortHandler: (() => void) | undefined;
    if (init?.signal) {
      if (init.signal.aborted) {
        clearTimeout(timeoutId);
        throw init.signal.reason || new Error("Operation aborted by caller");
      }
      externalAbortHandler = () => {
        controller.abort(init.signal?.reason);
      };
      init.signal.addEventListener("abort", externalAbortHandler, {
        once: true,
      });
    }

    try {
      const response = await fetch(input, {
        ...init,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      if (externalAbortHandler && init?.signal) {
        init.signal.removeEventListener("abort", externalAbortHandler);
      }

      // Check if response status is transient or rate-limited
      if (retryOnStatus.includes(response.status) && attempt < maxRetries) {
        lastResponse = response;

        let delay: number;
        if (response.status === 429) {
          const retryAfter = response.headers?.get?.("retry-after") ?? null;
          const parsed = parseRetryAfterHeader(
            retryAfter,
            maxDelayMs,
            baseDelayMs
          );
          delay =
            parsed ??
            Math.min(
              maxDelayMs,
              baseDelayMs * 2 ** attempt +
                Math.random() * (isTestEnv ? 10 : 200)
            );
        } else {
          delay = Math.min(
            maxDelayMs,
            baseDelayMs * 2 ** attempt + Math.random() * (isTestEnv ? 10 : 200)
          );
        }

        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      return response;
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (externalAbortHandler && init?.signal) {
        init.signal.removeEventListener("abort", externalAbortHandler);
      }

      // If caller canceled the operation directly, fail fast
      if (init?.signal?.aborted && !timeoutTriggered) {
        throw err;
      }

      lastError = err;

      if (attempt < maxRetries) {
        const delay = Math.min(
          maxDelayMs,
          baseDelayMs * 2 ** attempt + Math.random() * (isTestEnv ? 10 : 200)
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
    }
  }

  if (lastResponse) {
    return lastResponse;
  }

  throw lastError instanceof Error
    ? lastError
    : new Error(String(lastError || "resilientFetch request failed"));
}
