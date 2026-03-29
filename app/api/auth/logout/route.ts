import { clearCookieHeader } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { ok: true },
    { headers: { "Set-Cookie": clearCookieHeader() } }
  );
}
