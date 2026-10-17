const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const CORS_HEADERS: Record<string, string> = {
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
};

function json(status: number, payload: Record<string, unknown>): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: CORS_HEADERS,
  });
}

export default async (request: Request, context: { ip?: string }): Promise<Response> => {
  if (request.method !== "POST") {
    return json(405, { error: "method_not_allowed" });
  }

  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    console.error("TURNSTILE_SECRET_KEY is not configured");
    return json(500, { error: "server_misconfigured" });
  }

  let email = "";
  let token = "";
  try {
    const parsed = await request.json();
    email = typeof parsed?.email === "string" ? parsed.email.trim() : "";
    token = typeof parsed?.token === "string" ? parsed.token : "";
  } catch {
    return json(400, { error: "invalid_json" });
  }

  if (!EMAIL_RE.test(email)) {
    return json(400, { error: "invalid_email" });
  }
  if (!token) {
    return json(400, { error: "missing_token" });
  }

  let result: { success?: boolean; "error-codes"?: string[] };
  try {
    const verifyRes = await fetch(VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        secret,
        response: token,
        ...(context?.ip ? { remoteip: context.ip } : {}),
      }),
    });
    result = await verifyRes.json();
  } catch (err) {
    console.error("Turnstile verification request failed", err);
    return json(502, { error: "verification_unavailable" });
  }

  if (!result.success) {
    console.warn("Turnstile verification rejected", result["error-codes"]);
    return json(400, { error: "verification_failed" });
  }

  // Token verified. Wire up your own persistence here (email list, CRM, DB).
  console.log("verified subscription", { email });

  return json(200, { ok: true });
};