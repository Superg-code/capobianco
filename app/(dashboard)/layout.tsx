import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { data: userRow } = await supabase
    .from("users")
    .select("zona")
    .eq("id", Number(session.sub))
    .maybeSingle();

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar role={session.role} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header name={session.name} role={session.role} zona={userRow?.zona ?? null} />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
