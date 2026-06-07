import { supabase } from "@/lib/supabase";
import { getSessionOrToken } from "@/lib/api-auth";
import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";

export async function POST(req: Request) {
  const session = await getSessionOrToken(req);
  if (!session) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

  const body = await req.json();
  const { appointment_id } = body;

  if (!appointment_id) {
    return NextResponse.json({ error: "appointment_id obbligatorio" }, { status: 400 });
  }

  const { data: appt, error } = await supabase
    .from("appointments")
    .select("*, contact:contacts(first_name,last_name,company), salesperson:users!salesperson_id(name,email)")
    .eq("id", Number(appointment_id))
    .single();

  if (error || !appt) {
    return NextResponse.json({ error: "Appuntamento non trovato" }, { status: 404 });
  }

  const sp = appt.salesperson as { name: string; email: string | null } | null;
  if (!sp?.email) {
    return NextResponse.json({ sent: false, error: "Venditore senza email nel DB" });
  }

  const contact = appt.contact as { first_name: string; last_name: string; company: string | null } | null;
  const apptDate = new Date(appt.scheduled_at).toLocaleString("it-IT", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

  const result = await sendEmail({
    to: sp.email,
    subject: `Nuovo appuntamento — ${contact?.first_name ?? ""} ${contact?.last_name ?? ""}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px">
        <h2 style="color:#333">Nuovo appuntamento</h2>
        <p>Ciao <strong>${sp.name}</strong>,</p>
        <p>È stato prenotato un nuovo appuntamento tramite WhatsApp:</p>
        <table style="border-collapse:collapse;width:100%">
          <tr><td style="padding:6px 0;color:#555">Contatto</td><td style="font-weight:bold">${contact?.first_name ?? ""} ${contact?.last_name ?? ""}${contact?.company ? ` — ${contact.company}` : ""}</td></tr>
          <tr><td style="padding:6px 0;color:#555">Data e ora</td><td style="font-weight:bold">${apptDate}</td></tr>
          <tr><td style="padding:6px 0;color:#555">Durata</td><td>${appt.duration_minutes ?? 60} min</td></tr>
          ${appt.title ? `<tr><td style="padding:6px 0;color:#555">Titolo</td><td>${appt.title}</td></tr>` : ""}
          ${appt.notes ? `<tr><td style="padding:6px 0;color:#555">Note</td><td>${appt.notes}</td></tr>` : ""}
        </table>
        <p style="margin-top:20px;color:#888;font-size:12px">Capobianco CRM</p>
      </div>
    `,
  });

  if (!result.sent) {
    console.error(`[email-notify] Email fallita a ${sp.email}:`, result.error);
    return NextResponse.json({ sent: false, to: sp.email, error: result.error });
  }

  console.log(`[email-notify] Email inviata a ${sp.email} per appuntamento ${appointment_id}`);
  return NextResponse.json({ sent: true, to: sp.email });
}
