import { getSession, type JWTPayload } from "@/lib/auth";

// Autenticazione duale: cookie JWT (UI) oppure Bearer token statico (n8n)
export async function getSessionOrToken(req: Request): Promise<JWTPayload | null> {
  // 1. Prova il cookie JWT standard
  const session = await getSession();
  if (session) return session;

  // 2. Prova Bearer token per n8n
  const apiToken = process.env.CRM_API_TOKEN;
  if (!apiToken) return null;

  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token || token !== apiToken) return null;

  // Restituisce un payload sintetico con ruolo admin per n8n
  return { sub: "0", email: "n8n@capobianco.it", name: "n8n", role: "admin" };
}
