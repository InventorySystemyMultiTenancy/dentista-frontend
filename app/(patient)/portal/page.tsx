"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { formatDate } from "@/lib/format";
import type { Appointment, Exam } from "@/lib/types";
import type { HeroSlide } from "@/components/ScrollVideoHero";

// ScrollVideoHero mexe em window/document (GSAP) e escolhe o vídeo pela
// largura da tela — só pode existir no cliente.
const ScrollVideoHero = dynamic(
  () => import("@/components/ScrollVideoHero").then((m) => m.ScrollVideoHero),
  { ssr: false },
);

const CLINIC_NAME = process.env.NEXT_PUBLIC_CLINIC_NAME ?? "Clínica Odontológica";
// Número do WhatsApp do responsável pela clínica para onde vai a solicitação de consulta.
const CLINIC_WHATSAPP = "5511995319977";

export default function PortalHomePage() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [requestState, setRequestState] = useState<"idle" | "sending" | "sent">("idle");

  useEffect(() => {
    api.get<Appointment[]>("/portal/appointments").then(setAppointments).catch(() => setAppointments([]));
    api.get<Exam[]>("/portal/exams").then(setExams).catch(() => setExams([]));
  }, []);

  const handleRequestAppointment = useCallback(async () => {
    setRequestState("sending");
    const message = `Olá! Sou ${user?.name ?? "paciente"} e gostaria de agendar uma consulta na ${CLINIC_NAME}.`;
    window.open(`https://wa.me/${CLINIC_WHATSAPP}?text=${encodeURIComponent(message)}`, "_blank");
    try {
      await api.post("/portal/appointment-requests");
    } catch {
      // O WhatsApp já abriu; se o alerta no admin falhar, o paciente ainda conseguiu pedir por lá.
    } finally {
      setRequestState("sent");
    }
  }, [user?.name]);

  const nextAppointments = appointments
    .filter((a) => a.status === "SCHEDULED" && new Date(a.date) >= new Date(new Date().toDateString()))
    .slice(0, 3);
  const recentExams = exams.slice(0, 3);

  const slides: HeroSlide[] = useMemo(
    () => [
      {
        id: "welcome",
        start: 0,
        end: 0.1,
        content: (
          <>
            <p className="text-sm uppercase tracking-widest text-white/70">{CLINIC_NAME}</p>
            <h1 className="mt-3 text-4xl font-semibold text-white sm:text-5xl">
              Olá, {user?.name ?? "paciente"}!
            </h1>
            <p className="mt-3 max-w-md text-white/80">
              Acompanhe seus agendamentos e resultados de exames em um só lugar.
            </p>
          </>
        ),
      },
      {
        id: "experience",
        start: 0.1,
        end: 0.28,
        content: (
          <>
            <p className="text-sm uppercase tracking-widest text-white/70">Nossa história</p>
            <h2 className="mt-3 max-w-xl text-3xl font-semibold text-white sm:text-4xl">
              Anos de experiência cuidando de sorrisos
            </h2>
            <p className="mt-3 max-w-md text-white/80">
              Uma trajetória dedicada a oferecer tratamentos seguros e resultados duradouros.
            </p>
          </>
        ),
      },
      {
        id: "dedication",
        start: 0.28,
        end: 0.46,
        content: (
          <>
            <p className="text-sm uppercase tracking-widest text-white/70">Nosso cuidado</p>
            <h2 className="mt-3 max-w-xl text-3xl font-semibold text-white sm:text-4xl">
              Uma clínica dedicada ao seu bem-estar
            </h2>
            <p className="mt-3 max-w-md text-white/80">
              Atendimento humanizado, do primeiro contato ao acompanhamento pós-tratamento.
            </p>
          </>
        ),
      },
      {
        id: "verified",
        start: 0.46,
        end: 0.64,
        content: (
          <>
            <p className="text-sm uppercase tracking-widest text-white/70">Confiança</p>
            <h2 className="mt-3 max-w-xl text-3xl font-semibold text-white sm:text-4xl">
              Verificada por órgãos nacionais de saúde
            </h2>
            <p className="mt-3 max-w-md text-white/80">
              Registro e regularidade em dia junto aos conselhos e vigilâncias sanitárias.
            </p>
          </>
        ),
      },
      {
        id: "certified",
        start: 0.64,
        end: 0.82,
        content: (
          <>
            <p className="text-sm uppercase tracking-widest text-white/70">Qualidade</p>
            <h2 className="mt-3 max-w-xl text-3xl font-semibold text-white sm:text-4xl">
              Certificações internacionais de biossegurança
            </h2>
            <p className="mt-3 max-w-md text-white/80">
              Protocolos e equipamentos alinhados aos padrões internacionais de qualidade.
            </p>
          </>
        ),
      },
      {
        id: "navigate",
        start: 0.82,
        end: 1,
        content: (
          <>
            <p className="text-sm uppercase tracking-widest text-white/70">Continue por aqui</p>
            <h2 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">O que você precisa hoje?</h2>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={handleRequestAppointment}
                disabled={requestState === "sending"}
                className="rounded-md bg-teal-500 px-5 py-2.5 text-sm font-medium text-white transition-all duration-150 hover:bg-teal-600 hover:shadow-sm active:scale-[0.97] disabled:opacity-70"
              >
                {requestState === "sent"
                  ? "Solicitação enviada ✓"
                  : requestState === "sending"
                    ? "Abrindo WhatsApp..."
                    : "Agendar consulta"}
              </button>
              <Link
                href="/portal/agendamentos"
                className="rounded-md bg-white px-5 py-2.5 text-sm font-medium text-zinc-900 transition-all duration-150 hover:bg-white/90"
              >
                Meus agendamentos
              </Link>
              <Link
                href="/portal/exames"
                className="rounded-md border border-white/70 px-5 py-2.5 text-sm font-medium text-white transition-all duration-150 hover:bg-white/10"
              >
                Meus exames
              </Link>
            </div>
            {requestState === "sent" && (
              <p className="mt-3 text-sm text-white/70">
                Enviamos sua solicitação pelo WhatsApp e avisamos a equipe da clínica.
              </p>
            )}
          </>
        ),
      },
    ],
    [user?.name, requestState, handleRequestAppointment],
  );

  return (
    <div className="flex flex-col">
      <ScrollVideoHero slides={slides} />

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
