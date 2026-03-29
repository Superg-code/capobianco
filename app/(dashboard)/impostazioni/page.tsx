import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import UsersManager from "./UsersManager";

export default async function ImpostazioniPage() {
  const session = await getSession();
  if (!session || session.role !== "admin") redirect("/dashboard");

  const { data: users } = await supabase
    .from("users")
    .select("id, name, email, role, created_at")
    .order("name");

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-heading font-bold text-text">Impostazioni</h1>
        <p className="text-text-muted text-sm mt-0.5">Gestione utenti e accessi</p>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <UsersManager users={users ?? []} currentUserId={Number(session.sub)} />
      </div>
    </div>
  );
}
