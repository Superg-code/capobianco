import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
  }

  const url = new URL(req.url);
  const to = url.searchParams.get("to") ?? "gianluca.scaringi.89@gmail.com";

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? "Capobianco CRM <noreply@capobiancocrm.com>";

  if (!apiKey) {
    return NextResponse.json({ ok: false, error: "RESEND_API_KEY non presente in env", from, to });
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject: "Test Capobianco CRM — verifica email",
        html: "<p>Se ricevi questa email, l'invio da Vercel funziona correttamente.</p>",
      }),
    });
    const data = await res.json();
    return NextResponse.json({
      ok: res.ok,
      status: res.status,
      resend_response: data,
      api_key_prefix: apiKey.slice(0, 8) + "...",
      from,
      to,
    });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err), from, to });
  }
}
