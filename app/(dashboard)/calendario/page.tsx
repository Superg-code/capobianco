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

  const select = "*, contact:contacts(first_name,last_name,company,phone,conversation_summary), salesperson:users!salesperson_id(name,zona)";

  // Calendar grid: current month only
  let gridQuery = supabase
    .from("appointments")
    .select(select)
    .gte("scheduled_at", from)
    .lt("scheduled_at", to)
    .order("scheduled_at");

  // Persistent list: all appointments
  let listQuery = supabase
    .from("appointments")
    .select(select)
    .order("scheduled_at");

  if (session.role !== "admin") {
    gridQuery = gridQuery.eq("salesperson_id", Number(session.sub));
    listQuery = listQuery.eq("salesperson_id", Number(session.sub));
  }

  const [{ data: appointments }, { data: allAppointments }, { data: contacts }, salesResult] =
    await Promise.all([
      gridQuery,
      listQuery,
      supabase.from("contacts").select("id, first_name, last_name, company").order("last_name"),
      session.role === "admin"
        ? supabase.from("users").select("id, name").in("role", ["admin", "salesperson"]).order("name")
        : Promise.resolve({ data: null }),
    ]);

  return (
    <CalendarioClient
      initialAppointments={appointments ?? []}
      initialAllAppointments={allAppointments ?? []}
      contacts={contacts ?? []}
      salespeople={salesResult.data ?? []}
      currentUserId={Number(session.sub)}
      isAdmin={session.role === "admin"}
      initialMonth={month}
    />
  );
}
