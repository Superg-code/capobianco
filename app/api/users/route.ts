import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
  }

  const { data: users } = await supabase
    .from("users")
    .select("id, name, email, role, zona, activation_token, created_at")
    .order("name");

  return NextResponse.json({ users: users ?? [] });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
  }

  const { first_name, last_name, zona, email, role } = await req.json();

  if (!first_name?.trim() || !last_name?.trim() || !email?.trim()) {
    return NextResponse.json({ error: "Nome, cognome ed email sono obbligatori" }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from("users")
    .select("id")
    .ilike("email", email.trim())
    .maybeSingle();

  if (existing) return NextResponse.json({ error: "Email già in uso" }, { status: 409 });

  const activation_token = randomBytes(32).toString("hex");
  const tempHash = bcrypt.hashSync(randomBytes(16).toString("hex"), 10);

  const { data: user, error } = await supabase
    .from("users")
    .insert({
      name: `${first_name.trim()} ${last_name.trim()}`,
      email: email.trim().toLowerCase(),
      password_hash: tempHash,
      role: role === "admin" ? "admin" : "salesperson",
      zona: zona?.trim() || null,
      activation_token,
    })
    .select("id, name, email, role, zona, activation_token, created_at")
    .single();

  if (error) return NextResponse.json({ error: "Errore nella creazione" }, { status: 500 });

  return NextResponse.json({ user, activation_token }, { status: 201 });
}

export async function PATCH(req: Request) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
  }

  const { id, password, role, zona } = await req.json();
  if (!id) return NextResponse.json({ error: "ID obbligatorio" }, { status: 400 });

  const updates: Record<string, string | null> = {};
  if (password) updates.password_hash = bcrypt.hashSync(password, 10);
  if (role) updates.role = role;
  if (zona !== undefined) updates.zona = zona?.trim() || null;

  if (Object.keys(updates).length > 0) {
    await supabase.from("users").update(updates).eq("id", id);
  }

  const { data: user } = await supabase
    .from("users")
    .select("id, name, email, role, zona, activation_token, created_at")
    .eq("id", id)
    .single();

  return NextResponse.json({ user });
}

export async function DELETE(req: Request) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
  }

  const url = new URL(req.url);
  const id = Number(url.searchParams.get("id"));
  if (!id) return NextResponse.json({ error: "ID obbligatorio" }, { status: 400 });

  if (id === Number(session.sub)) {
    return NextResponse.json({ error: "Non puoi eliminare il tuo account" }, { status: 400 });
  }

  await supabase.from("users").delete().eq("id", id);
  return NextResponse.json({ ok: true });
}
