import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import path from "path";

const DB_PATH = path.join(process.cwd(), "capobianco.db");
const db = new Database(DB_PATH);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// Ensure tables exist
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    name          TEXT NOT NULL,
    email         TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role          TEXT NOT NULL DEFAULT 'salesperson' CHECK(role IN ('admin','salesperson')),
    created_at    TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

const adminHash = bcrypt.hashSync("Admin1234!", 10);
db.prepare(
  `INSERT OR IGNORE INTO users (name, email, password_hash, role)
   VALUES ('Amministratore', 'admin@capobianco.it', ?, 'admin')`
).run(adminHash);

// Demo salesperson
const salesHash = bcrypt.hashSync("Venditore1!", 10);
db.prepare(
  `INSERT OR IGNORE INTO users (name, email, password_hash, role)
   VALUES ('Mario Rossi', 'mario.rossi@capobianco.it', ?, 'salesperson')`
).run(salesHash);

db.prepare(
  `INSERT OR IGNORE INTO users (name, email, password_hash, role)
   VALUES ('Luca Bianchi', 'luca.bianchi@capobianco.it', ?, 'salesperson')`
).run(salesHash);

console.log("✅ Utenti creati:");
console.log("   Admin:      admin@capobianco.it / Admin1234!");
console.log("   Venditore:  mario.rossi@capobianco.it / Venditore1!");
console.log("   Venditore:  luca.bianchi@capobianco.it / Venditore1!");

db.close();
