import { supabase } from "@/lib/supabase";
import { signToken, createCookieHeader } from "@/lib/auth";
import type { User } from "@/lib/db";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email e password sono obbligatori" }, { status: 400 });
    }

    const { data: user } = await supabase
      .from("users")
      .select("*")
      .ilike("email", email.trim())
      .maybeSingle() as { data: User | null };

    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return NextResponse.json({ error: "Credenziali non valide" }, { status: 401 });
    }

    const token = await signToken({
      sub: String(user.id),
      email: user.email,
      name: user.name,
      role: user.role,
    });

    return NextResponse.json(
      { user: { id: user.id, name: user.name, email: user.email, role: user.role } },
      { headers: { "Set-Cookie": createCookieHeader(token) } }
    );
  } catch {
    return NextResponse.json({ error: "Errore del server" }, { status: 500 });
  }
}
