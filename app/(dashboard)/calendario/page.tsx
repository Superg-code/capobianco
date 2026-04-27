import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import CalendarioClient from "./CalendarioClient";

export default async function CalendarioPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const from = `${month}-01T00:00:00Z`;
  const nextM = now.getMonth() === 11
    ? `${now.getFullYear() + 1}-01`
    : `${now.getFullYear()}-${String(now.getMonth() + 2).padStart(2, "0")}`;
  const to = `${nextM}-01T00:00:00Z`;

  let query = supabase
    .from("appointments")
    .select("*, contact:contacts(first_name,last_name,company), salesperson:users!salesperson_id(name)")
    .gte("scheduled_at", from)
    .lt("scheduled_at", to)
    .order("scheduled_at");

  if (session.role !== "admin") {
    query = query.eq("salesperson_id", Number(session.sub));
  }

  const { data: appointments } = await query;

  const { data: contacts } = await supabase
    .from("contacts")
    .select("id, first_name, last_name, company")
    .order("last_name");

  const { data: salespeople } = session.role === "admin"
    ? await supabase.from("users").select("id, name").in("role", ["admin", "salesperson"]).order("name")
    : { data: null };

  return (
    <CalendarioClient
      initialAppointments={appointments ?? []}
      contacts={contacts ?? []}
      salespeople={salespeople ?? []}
      currentUserId={Number(session.sub)}
      isAdmin={session.role === "admin"}
      initialMonth={month}
    />
  );
}
