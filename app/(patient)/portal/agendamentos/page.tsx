"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/format";
import type { Appointment } from "@/lib/types";

const STATUS_BADGE = {
  SCHEDULED: <Badge color="blue">Agendado</Badge>,
  CANCELLED: <Badge color="red">Cancelado</Badge>,
  COMPLETED: <Badge color="green">Concluído</Badge>,
  NO_SHOW: <Badge color="amber">Faltou</Badge>,
} as const;

export default function PortalAgendamentosPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    api.get<Appointment[]>("/portal/appointments").then(setAppointments).catch(() => setAppointments([]));
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-zinc-900">Meus agendamentos</h1>

      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase text-zinc-500">
            <tr>
              <th className="px-4 py-3">Data</th>
              <th className="px-4 py-3">Horário</th>
              <th className="px-4 py-3">Profissional</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {appointments.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-zinc-400">
                  Nenhum agendamento encontrado.
                </td>
              </tr>
            )}
            {appointments.map((a) => (
              <tr key={a.id}>
                <td className="px-4 py-3 text-zinc-700">{formatDate(a.date)}</td>
                <td className="px-4 py-3 text-zinc-700">{a.startTime}</td>
                <td className="px-4 py-3 text-zinc-700">{a.staff.name}</td>
                <td className="px-4 py-3">{STATUS_BADGE[a.status]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
