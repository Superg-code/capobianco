import { supabase } from "@/lib/supabase";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token");
  if (!token) return NextResponse.json({ error: "Token mancante" }, { status: 400 });

  const { data: user } = await supabase
    .from("users")
    .select("id, name, email")
    .eq("activation_token", token)
    .maybeSingle();

  if (!user) return NextResponse.json({ error: "Link non valido o già utilizzato" }, { status: 404 });

  return NextResponse.json({ name: user.name, email: user.email });
}

export async function POST(req: Request) {
  const { token, password } = await req.json();

  if (!token || !password || password.length < 8) {
    return NextResponse.json({ error: "Token e password (min 8 caratteri) obbligatori" }, { status: 400 });
  }

  const { data: user } = await supabase
    .from("users")
    .select("id")
    .eq("activation_token", token)
    .maybeSingle();

  if (!user) return NextResponse.json({ error: "Link non valido o già utilizzato" }, { status: 404 });

  const password_hash = bcrypt.hashSync(password, 10);

  await supabase
    .from("users")
    .update({ password_hash, activation_token: null })
    .eq("id", user.id);

  return NextResponse.json({ ok: true });
}
