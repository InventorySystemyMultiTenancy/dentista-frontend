"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/Badge";
import type { Appointment, AppointmentStatus } from "@/lib/types";

const STATUS_BADGE: Record<AppointmentStatus, { label: string; color: "blue" | "red" | "green" | "amber" }> = {
  SCHEDULED: { label: "Agendado", color: "blue" },
  CANCELLED: { label: "Cancelado", color: "red" },
  COMPLETED: { label: "Concluído", color: "green" },
  NO_SHOW: { label: "Faltou", color: "amber" },
};

const STATUS_ACCENT: Record<AppointmentStatus, string> = {
  SCHEDULED: "border-l-blue-400",
  CANCELLED: "border-l-red-300",
  COMPLETED: "border-l-emerald-400",
  NO_SHOW: "border-l-amber-400",
};

const WEEKDAY = new Intl.DateTimeFormat("pt-BR", { weekday: "long", timeZone: "UTC" });
const MONTH = new Intl.DateTimeFormat("pt-BR", { month: "short", timeZone: "UTC" });

function DateChip({ iso }: { iso: string }) {
  const date = new Date(iso);
  const day = date.toLocaleDateString("pt-BR", { day: "2-digit", timeZone: "UTC" });
  const month = MONTH.format(date).replace(".", "");
  return (
    <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-teal-50 text-teal-700">
      <span className="text-lg font-bold leading-none">{day}</span>
      <span className="text-[10px] font-medium uppercase leading-none tracking-wide">{month}</span>
    </div>
  );
}

function AppointmentCard({ appointment }: { appointment: Appointment }) {
  const status = STATUS_BADGE[appointment.status];
  const weekday = WEEKDAY.format(new Date(appointment.date));
  return (
    <li
      className={`flex items-center gap-4 rounded-xl border border-zinc-200 border-l-4 bg-white p-4 shadow-sm transition-shadow hover:shadow-md ${STATUS_ACCENT[appointment.status]}`}
    >
      <DateChip iso={appointment.date} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold capitalize text-zinc-900">{weekday}</p>
        <p className="text-sm text-zinc-500">
          {appointment.startTime} · {appointment.staff.name}
        </p>
      </div>
      <Badge color={status.color}>{status.label}</Badge>
    </li>
  );
}

export default function PortalAgendamentosPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    api.get<Appointment[]>("/portal/appointments").then(setAppointments).catch(() => setAppointments([]));
  }, []);

  const { upcoming, past } = useMemo(() => {
    const today = new Date(new Date().toDateString());
    const upcoming: Appointment[] = [];
    const past: Appointment[] = [];
    for (const a of appointments) {
      if (a.status === "SCHEDULED" && new Date(a.date) >= today) upcoming.push(a);
      else past.push(a);
    }
    upcoming.sort((a, b) => a.date.localeCompare(b.date));
    past.sort((a, b) => b.date.localeCompare(a.date));
    return { upcoming, past };
  }, [appointments]);

  return (
    <div className="flex flex-col gap-8 p-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-zinc-900">Meus agendamentos</h1>
        <p className="mt-1 text-zinc-500">Seus horários marcados e o histórico de consultas.</p>
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-teal-700">
          Próximos ({upcoming.length})
        </h2>
        {upcoming.length === 0 ? (
          <p className="rounded-xl border border-dashed border-zinc-200 bg-white p-6 text-center text-sm text-zinc-400">
            Nenhum agendamento futuro. Use o botão &ldquo;Agendar consulta&rdquo; na tela inicial.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {upcoming.map((a) => (
              <AppointmentCard key={a.id} appointment={a} />
            ))}
          </ul>
        )}
      </section>

      {past.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-400">Histórico</h2>
          <ul className="flex flex-col gap-3">
            {past.map((a) => (
              <AppointmentCard key={a.id} appointment={a} />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
