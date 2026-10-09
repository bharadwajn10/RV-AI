const API = "http://127.0.0.1:8000";
const REQUEST_TIMEOUT_MS = 25_000;

export async function sendToAgnes(message) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let response;

  try {
    response = await fetch(`${API}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message, role: "educator" }),
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Agnes is taking longer than expected. Please try again.");
    }
    throw new Error("Agnes backend is not reachable. Start the backend and try again.");
  } finally {
    clearTimeout(timeoutId);
  }

  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error("Agnes returned an unreadable response. Check the backend logs.");
  }

  if (!response.ok) {
    const detail = typeof data.detail === "string" ? data.detail : "";

    if (/\b401\b|invalid token/i.test(detail)) {
      throw new Error(
        "Agnes rejected its API key. Update AGNES_API_KEY in backend/.env and restart the backend.",
      );
    }

    if (response.status === 504) {
      throw new Error(detail || "Agnes took too long to respond. Please try again.");
    }

    throw new Error(detail || `Agnes request failed (${response.status}).`);
  }

  if (typeof data.response !== "string" || !data.response.trim()) {
    throw new Error("Agnes returned an empty response. Check the backend logs.");
  }

  return data;
}