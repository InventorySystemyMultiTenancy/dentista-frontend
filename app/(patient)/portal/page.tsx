"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { formatDate } from "@/lib/format";
import type { Appointment, Exam } from "@/lib/types";

// ScrollVideoHero mexe em window/document (GSAP) e escolhe o vídeo pela
// largura da tela — só pode existir no cliente.
const ScrollVideoHero = dynamic(
  () => import("@/components/ScrollVideoHero").then((m) => m.ScrollVideoHero),
  { ssr: false },
);

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
    <div className="flex flex-col">
      <ScrollVideoHero>
        <div className="flex h-full flex-col items-center justify-center px-6 text-center text-white">
          <p className="text-sm uppercase tracking-widest text-white/70">
            {process.env.NEXT_PUBLIC_CLINIC_NAME ?? "Clínica Odontológica"}
          </p>
          <h1 className="mt-3 text-4xl font-semibold sm:text-5xl">Olá, {user?.name ?? "paciente"}!</h1>
          <p className="mt-3 max-w-md text-white/80">
            Acompanhe seus agendamentos e resultados de exames em um só lugar.
          </p>
        </div>
      </ScrollVideoHero>

      <div className="flex flex-col gap-6 p-6">
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
    </div>
  );
}
