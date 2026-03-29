import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

const supabaseUrl = process.env.SUPABASE_URL ?? "";
const supabaseKey = process.env.SUPABASE_ANON_KEY ?? "";

if (!supabaseUrl || !supabaseKey) {
  console.error("Mancano SUPABASE_URL e SUPABASE_ANON_KEY nelle variabili d'ambiente");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const users = [
  { name: "Amministratore",  email: "admin@capobianco.it",        password: "Admin1234!",  role: "admin" as const },
  { name: "Mario Rossi",     email: "mario.rossi@capobianco.it",  password: "Venditore1!", role: "salesperson" as const },
  { name: "Luca Bianchi",    email: "luca.bianchi@capobianco.it", password: "Venditore1!", role: "salesperson" as const },
];

async function seed() {
  for (const u of users) {
    const password_hash = bcrypt.hashSync(u.password, 10);
    const { error } = await supabase
      .from("users")
      .upsert({ name: u.name, email: u.email, password_hash, role: u.role }, { onConflict: "email" });

    if (error) {
      console.error(`Errore utente ${u.email}:`, error.message);
    } else {
      console.log(`✅ ${u.name} (${u.email})`);
    }
  }

  console.log("\nCredenziali:");
  console.log("   Admin:     admin@capobianco.it / Admin1234!");
  console.log("   Venditore: mario.rossi@capobianco.it / Venditore1!");
  console.log("   Venditore: luca.bianchi@capobianco.it / Venditore1!");
}

seed().catch(console.error);
