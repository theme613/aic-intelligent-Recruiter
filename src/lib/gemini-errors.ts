/** Turn Google Generative AI SDK errors into user-facing messages. */
export function formatGeminiError(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);

  if (
    message.includes("API key expired") ||
    message.includes("API_KEY_INVALID")
  ) {
    return (
      "Your Google Gemini API key is expired or invalid. Create a new key at " +
      "https://aistudio.google.com/apikey, put it in .env.local as GEMINI_API_KEY, " +
      "then restart the dev server (npm run dev). Or use Load Demo Data to run offline."
    );
  }

  if (message.includes("GEMINI_API_KEY is not configured")) {
    return (
      "GEMINI_API_KEY is missing. Copy .env.example to .env.local, add your key from " +
      "https://aistudio.google.com/apikey, then restart the dev server."
    );
  }

  if (message.includes("403") || message.includes("PERMISSION_DENIED")) {
    return (
      "Gemini API access denied. Enable the Generative Language API for your key " +
      "in Google AI Studio / Cloud Console, or create a new key."
    );
  }

  return (
    "Agent pipeline failed. Check your GEMINI_API_KEY or use Load Demo Data for offline demo."
  );
}
