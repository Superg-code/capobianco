"use client";

import { useState, useCallback } from "react";
import { ChevronLeft, ChevronRight, Plus, X, Clock, User, Building2, Trash2, Check } from "lucide-react";

type Contact = { id: number; first_name: string; last_name: string; company: string | null };
type Salesperson = { id: number; name: string };
type Appointment = {
  id: number;
  contact_id: number;
  salesperson_id: number;
  title: string | null;
  scheduled_at: string;
  duration_minutes: number;
  notes: string | null;
  status: "scheduled" | "completed" | "cancelled";
  contact: { first_name: string; last_name: string; company: string | null } | null;
  salesperson: { name: string } | null;
};

type Props = {
  initialAppointments: Appointment[];
  contacts: Contact[];
  salespeople: Salesperson[];
  currentUserId: number;
  isAdmin: boolean;
  initialMonth: string;
};

const MONTHS_IT = ["Gennaio","Febbraio","Marzo","Aprile","Maggio","Giugno","Luglio","Agosto","Settembre","Ottobre","Novembre","Dicembre"];
const DAYS_IT = ["Lun","Mar","Mer","Gio","Ven","Sab","Dom"];

const STATUS_COLOR: Record<string, string> = {
  scheduled: "bg-brand/80 text-text",
  completed: "bg-green-500 text-white",
  cancelled: "bg-gray-300 text-gray-600 line-through",
};

function parseMonth(m: string) {
  const [y, mo] = m.split("-").map(Number);
  return { year: y, month: mo };
}

function shiftMonth(m: string, delta: number) {
  const { year, month } = parseMonth(m);
  const d = new Date(year, month - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function getDaysInMonth(m: string) {
  const { year, month } = parseMonth(m);
  return new Date(year, month, 0).getDate();
}

function getFirstDayOfWeek(m: string) {
  const { year, month } = parseMonth(m);
  const day = new Date(year, month - 1, 1).getDay();
  return day === 0 ? 6 : day - 1; // Mon=0
}

function toLocalDateStr(iso: string) {
  return new Date(iso).toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

function toLocalTimeStr(iso: string) {
  return new Date(iso).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
}

export default function CalendarioClient({ initialAppointments, contacts, salespeople, currentUserId, isAdmin, initialMonth }: Props) {
  const [month, setMonth] = useState(initialMonth);
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments);
  const [selected, setSelected] = useState<Appointment | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [prefillDate, setPrefillDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    contact_id: "",
    salesperson_id: String(currentUserId),
    title: "",
    date: "",
    time: "09:00",
    duration_minutes: "60",
    notes: "",
  });

  const { year, month: mo } = parseMonth(month);
  const daysInMonth = getDaysInMonth(month);
  const firstDay = getFirstDayOfWeek(month);

  const apptByDay: Record<number, Appointment[]> = {};
  for (const a of appointments) {
    const d = new Date(a.scheduled_at).getDate();
    if (!apptByDay[d]) apptByDay[d] = [];
    apptByDay[d].push(a);
  }

  const changeMonth = useCallback(async (delta: number) => {
    const newMonth = shiftMonth(month, delta);
    setMonth(newMonth);
    const res = await fetch(`/api/appointments?month=${newMonth}`);
    const data = await res.json();
    setAppointments(data.appointments ?? []);
  }, [month]);

  function openCreate(day?: number) {
    const dateStr = day ? `${year}-${String(mo).padStart(2, "0")}-${String(day).padStart(2, "0")}` : "";
    setPrefillDate(dateStr);
    setForm(f => ({ ...f, date: dateStr, time: "09:00", title: "", notes: "", contact_id: "", duration_minutes: "60" }));
    setSelected(null);
    setShowForm(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const scheduled_at = new Date(`${form.date}T${form.time}:00`).toISOString();
      const body = {
        contact_id: Number(form.contact_id),
        salesperson_id: isAdmin ? Number(form.salesperson_id) : currentUserId,
        title: form.title || null,
        scheduled_at,
        duration_minutes: Number(form.duration_minutes),
        notes: form.notes || null,
      };

      const url = selected ? `/api/appointments/${selected.id}` : "/api/appointments";
      const method = selected ? "PATCH" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) { alert(data.error ?? "Errore"); return; }

      const saved = data.appointment;
      if (selected) {
        setAppointments(prev => prev.map(a => a.id === selected.id ? saved : a));
      } else {
        setAppointments(prev => [...prev, saved].sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at)));
      }
      setShowForm(false);
      setSelected(null);
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(appt: Appointment, status: Appointment["status"]) {
    const res = await fetch(`/api/appointments/${appt.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    if (res.ok) {
      setAppointments(prev => prev.map(a => a.id === appt.id ? data.appointment : a));
      setSelected(data.appointment);
    }
  }

  async function handleDelete(appt: Appointment) {
    if (!confirm(`Eliminare l'appuntamento con ${appt.contact?.first_name} ${appt.contact?.last_name}?`)) return;
    const res = await fetch(`/api/appointments/${appt.id}`, { method: "DELETE" });
    if (res.ok) {
      setAppointments(prev => prev.filter(a => a.id !== appt.id));
      setSelected(null);
    }
  }

  function openEdit(appt: Appointment) {
    const dt = new Date(appt.scheduled_at);
    setForm({
      contact_id: String(appt.contact_id),
      salesperson_id: String(appt.salesperson_id),
      title: appt.title ?? "",
      date: dt.toISOString().slice(0, 10),
      time: dt.toTimeString().slice(0, 5),
      duration_minutes: String(appt.duration_minutes),
      notes: appt.notes ?? "",
    });
    setSelected(appt);
    setShowForm(true);
  }

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const inputClass = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition";

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-text">Calendario</h1>
          <p className="text-text-muted text-sm mt-0.5">Appuntamenti e disponibilità</p>
        </div>
        <button
          onClick={() => openCreate()}
          className="flex items-center gap-2 bg-brand hover:bg-brand-dark text-text font-semibold text-sm px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuovo appuntamento
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {/* Month nav */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ChevronLeft className="w-4 h-4 text-text-muted" />
          </button>
          <h2 className="font-heading font-bold text-text text-lg">
            {MONTHS_IT[mo - 1]} {year}
          </h2>
          <button onClick={() => changeMonth(1)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ChevronRight className="w-4 h-4 text-text-muted" />
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-gray-100">
          {DAYS_IT.map(d => (
            <div key={d} className="py-2 text-center text-xs font-bold text-text-muted uppercase">
              {d}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-7 divide-x divide-y divide-gray-50">
          {cells.map((day, i) => {
            const today = new Date();
            const isToday = day === today.getDate() && mo === today.getMonth() + 1 && year === today.getFullYear();
            const dayAppts = day ? (apptByDay[day] ?? []) : [];

            return (
              <div
                key={i}
                onClick={() => day && openCreate(day)}
                className={`min-h-[90px] p-1.5 cursor-pointer hover:bg-gray-50 transition-colors ${!day ? "bg-gray-50/50 cursor-default" : ""}`}
              >
                {day && (
                  <>
                    <span className={`inline-flex items-center justify-center w-6 h-6 text-sm font-semibold rounded-full mb-1 ${
                      isToday ? "bg-brand text-text" : "text-text-muted"
                    }`}>
                      {day}
                    </span>
                    <div className="space-y-0.5">
                      {dayAppts.slice(0, 3).map(a => (
                        <div
                          key={a.id}
                          onClick={e => { e.stopPropagation(); setSelected(a); setShowForm(false); }}
                          className={`text-xs px-1.5 py-0.5 rounded truncate cursor-pointer hover:opacity-90 ${STATUS_COLOR[a.status]}`}
                        >
                          {toLocalTimeStr(a.scheduled_at)} {a.contact?.first_name} {a.contact?.last_name}
                        </div>
                      ))}
                      {dayAppts.length > 3 && (
                        <div className="text-xs text-text-muted px-1">+{dayAppts.length - 3} altri</div>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Appointment detail panel */}
      {selected && !showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelected(null)} />
          <div className="relative bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-md mx-0 sm:mx-4 p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className={`inline-flex text-xs font-bold px-2.5 py-1 rounded-full ${STATUS_COLOR[selected.status]}`}>
                  {selected.status === "scheduled" ? "Programmato" : selected.status === "completed" ? "Completato" : "Annullato"}
                </span>
                <h3 className="font-heading font-bold text-text text-lg mt-2">
                  {selected.title || `Appuntamento con ${selected.contact?.first_name} ${selected.contact?.last_name}`}
                </h3>
              </div>
              <button onClick={() => setSelected(null)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <X className="w-4 h-4 text-text-muted" />
              </button>
            </div>

            <div className="space-y-2 text-sm text-text-muted">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 flex-shrink-0" />
                <span>{toLocalDateStr(selected.scheduled_at)} alle {toLocalTimeStr(selected.scheduled_at)} ({selected.duration_minutes} min)</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 flex-shrink-0" />
                <span>{selected.contact?.first_name} {selected.contact?.last_name}</span>
              </div>
              {selected.contact?.company && (
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 flex-shrink-0" />
                  <span>{selected.contact.company}</span>
                </div>
              )}
              {selected.salesperson && (
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 flex-shrink-0 text-brand-dark" />
                  <span>Venditore: {selected.salesperson.name}</span>
                </div>
              )}
              {selected.notes && (
                <div className="bg-gray-50 rounded-lg p-3 mt-2">
                  <p className="text-text text-sm">{selected.notes}</p>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
              {selected.status === "scheduled" && (
                <button
                  onClick={() => handleStatusChange(selected, "completed")}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg transition-colors"
                >
                  <Check className="w-3.5 h-3.5" /> Completato
                </button>
              )}
              {selected.status !== "cancelled" && (
                <button
                  onClick={() => handleStatusChange(selected, "cancelled")}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Annulla
                </button>
              )}
              <button
                onClick={() => openEdit(selected)}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-brand/10 text-brand-dark hover:bg-brand/20 rounded-lg transition-colors"
              >
                Modifica
              </button>
              <button
                onClick={() => handleDelete(selected)}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors ml-auto"
              >
                <Trash2 className="w-3.5 h-3.5" /> Elimina
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Appointment list */}
      {appointments.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-heading font-semibold text-text text-base">
              Appuntamenti — {MONTHS_IT[mo - 1]} {year}
            </h2>
          </div>
          <div className="divide-y divide-gray-50">
            {[...appointments]
              .sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at))
              .map(a => (
                <div
                  key={a.id}
                  onClick={() => { setSelected(a); setShowForm(false); }}
                  className="flex items-center gap-4 px-6 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="w-14 text-center flex-shrink-0">
                    <div className="text-xs text-text-muted uppercase font-semibold">
                      {new Date(a.scheduled_at).toLocaleDateString("it-IT", { weekday: "short" })}
                    </div>
                    <div className="text-lg font-bold text-text leading-none">
                      {new Date(a.scheduled_at).getDate()}
                    </div>
                  </div>
                  <div className="w-px h-10 bg-gray-100 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-text truncate">
                      {a.title || `${a.contact?.first_name} ${a.contact?.last_name}`}
                    </p>
                    <p className="text-xs text-text-muted truncate">
                      {toLocalTimeStr(a.scheduled_at)} · {a.duration_minutes} min
                      {a.contact?.company ? ` · ${a.contact.company}` : ""}
                      {a.salesperson ? ` · ${a.salesperson.name}` : ""}
                    </p>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0 ${STATUS_COLOR[a.status]}`}>
                    {a.status === "scheduled" ? "Programmato" : a.status === "completed" ? "Completato" : "Annullato"}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Create / Edit form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="relative bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-md mx-0 sm:mx-4 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-heading font-bold text-text text-lg">
                {selected ? "Modifica appuntamento" : "Nuovo appuntamento"}
              </h2>
              <button onClick={() => { setShowForm(false); setSelected(null); }} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <X className="w-4 h-4 text-text-muted" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="block text-sm font-semibold text-text mb-1">Contatto</label>
                <select
                  value={form.contact_id}
                  onChange={e => setForm(f => ({ ...f, contact_id: e.target.value }))}
                  required
                  className={inputClass}
                >
                  <option value="">Seleziona contatto...</option>
                  {contacts.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.first_name} {c.last_name}{c.company ? ` — ${c.company}` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {isAdmin && (
                <div>
                  <label className="block text-sm font-semibold text-text mb-1">Venditore</label>
                  <select
                    value={form.salesperson_id}
                    onChange={e => setForm(f => ({ ...f, salesperson_id: e.target.value }))}
                    className={inputClass}
                  >
                    {salespeople.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-text mb-1">Titolo (opzionale)</label>
                <input
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="es. Visita in sede, Demo trattore..."
                  className={inputClass}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-text mb-1">Data</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                    required
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-text mb-1">Orario</label>
                  <input
                    type="time"
                    value={form.time}
                    onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                    required
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-text mb-1">Durata</label>
                <select value={form.duration_minutes} onChange={e => setForm(f => ({ ...f, duration_minutes: e.target.value }))} className={inputClass}>
                  <option value="30">30 minuti</option>
                  <option value="60">1 ora</option>
                  <option value="90">1 ora e 30</option>
                  <option value="120">2 ore</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-text mb-1">Note</label>
                <textarea
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  rows={2}
                  placeholder="Note sull'appuntamento..."
                  className={inputClass}
                />
              </div>

              <div className="flex gap-3 justify-end pt-1">
                <button type="button" onClick={() => { setShowForm(false); setSelected(null); }}
                  className="px-4 py-2 text-sm font-semibold border border-gray-200 rounded-lg hover:bg-gray-50">
                  Annulla
                </button>
                <button type="submit" disabled={saving}
                  className="px-5 py-2 bg-brand hover:bg-brand-dark text-text font-semibold text-sm rounded-lg disabled:opacity-50">
                  {saving ? "…" : selected ? "Salva modifiche" : "Crea appuntamento"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
