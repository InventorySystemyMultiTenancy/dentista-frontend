"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { formatDate } from "@/lib/format";
import type { Appointment, Exam } from "@/lib/types";

export default function PortalHomePage() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);

  useEffect(() => {
    api.get<Appointment[]>("/portal/appointments").then(setAppointments).catch(() => setAppointments([]));
    api.get<Exam[]>("/portal/exams").then(setExams).catch(() => setExams([]));
  }, []);

  const nextAppointments = appointments
    .filter((a) => a.status === "SCHEDULED" && new Date(a.date) >= new Date(new Date().toDateString()))
    .slice(0, 3);
  const recentExams = exams.slice(0, 3);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-zinc-900">Olá, {user?.name ?? "paciente"}!</h1>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="rounded-lg border border-zinc-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-900">Próximos agendamentos</h2>
            <Link href="/portal/agendamentos" className="text-sm text-teal-700 hover:underline">
              Ver todos
            </Link>
          </div>
          {nextAppointments.length === 0 ? (
            <p className="text-sm text-zinc-500">Nenhum agendamento futuro.</p>
          ) : (
            <ul className="divide-y divide-zinc-100 text-sm">
              {nextAppointments.map((a) => (
                <li key={a.id} className="py-2">
                  {formatDate(a.date)} às {a.startTime} — {a.staff.name}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-lg border border-zinc-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-900">Últimos exames</h2>
            <Link href="/portal/exames" className="text-sm text-teal-700 hover:underline">
              Ver todos
            </Link>
          </div>
          {recentExams.length === 0 ? (
            <p className="text-sm text-zinc-500">Nenhum exame registrado ainda.</p>
          ) : (
            <ul className="divide-y divide-zinc-100 text-sm">
              {recentExams.map((exam) => (
                <li key={exam.id} className="py-2">
                  <span className="font-medium text-zinc-800">{exam.type}</span> — {exam.status} (
                  {formatDate(exam.date)})
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
