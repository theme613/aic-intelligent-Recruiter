/** Parse a fetch Response as JSON; never throw raw SyntaxError on HTML error pages. */
export async function parseApiJson<T>(res: Response): Promise<T> {
  const text = await res.text();

  if (!text.trim()) {
    throw new Error(
      res.ok
        ? "Empty response from server."
        : `Request failed (${res.status} ${res.statusText}).`,
    );
  }

  if (text.trimStart().startsWith("<")) {
    throw new Error(formatHtmlApiError(res.status));
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(
      `Invalid JSON from server (${res.status}): ${text.slice(0, 120)}…`,
    );
  }
}

export function formatHtmlApiError(status: number): string {
  if (status === 404) {
    return (
      "API route not found (404). Redeploy on Vercel with Next.js serverless " +
      "functions enabled — static-only hosts cannot run /api routes."
    );
  }
  if (status === 504 || status === 408) {
    return (
      "Analysis timed out on the server. On Vercel Hobby, functions stop after " +
      "~10s — use Load Demo Data, upgrade to Pro for longer runs, or reduce candidates."
    );
  }
  if (status >= 500) {
    return (
      `Server error (${status}). Check Vercel → Project → Logs for /api/analyze or ` +
      `/api/parse-pdf. Confirm GEMINI_API_KEY is set if not using demo mode.`
    );
  }
  return (
    `Server returned an HTML page instead of JSON (${status}). ` +
    "Check deployment logs and environment variables."
  );
}

export function assertNdjsonResponse(res: Response): void {
  const type = res.headers.get("content-type") ?? "";
  if (type.includes("text/html")) {
    throw new Error(formatHtmlApiError(res.status));
  }
}

export function parseNdjsonLine<T>(line: string): T {
  const trimmed = line.trim();
  if (trimmed.startsWith("<")) {
    throw new Error(formatHtmlApiError(502));
  }
  return JSON.parse(trimmed) as T;
}
