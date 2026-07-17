"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/format";
import type { Exam } from "@/lib/types";

// O status do exame é texto livre (definido pela equipe), então a cor do
// selo é inferida por palavras-chave comuns em vez de um enum fixo.
function statusColor(status: string): "green" | "amber" | "red" | "gray" {
  const s = status.toLowerCase();
  if (/(cr[ií]tico|urgente|alterad)/.test(s)) return "red";
  if (/(aten[cç][aã]o|acompanhamento|observ)/.test(s)) return "amber";
  if (/(normal|saud[aá]vel|ok|dentro do esperado)/.test(s)) return "green";
  return "gray";
}

export default function PortalExamesPage() {
  const [exams, setExams] = useState<Exam[]>([]);

  useEffect(() => {
    api.get<Exam[]>("/portal/exams").then(setExams).catch(() => setExams([]));
  }, []);

  return (
    <div className="flex flex-col gap-8 p-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-zinc-900">
          Meus exames e resultados
        </h1>
        <p className="mt-1 text-zinc-500">Linha do tempo dos exames registrados pela equipe.</p>
      </div>

      {exams.length === 0 ? (
        <p className="rounded-xl border border-dashed border-zinc-200 bg-white p-6 text-center text-sm text-zinc-400">
          Nenhum exame registrado ainda.
        </p>
      ) : (
        <ol className="relative flex flex-col gap-6 border-l-2 border-zinc-200 pl-8">
          {exams.map((exam) => (
            <li key={exam.id} className="relative">
              <span className="absolute -left-[2.3rem] top-5 h-3.5 w-3.5 rounded-full bg-teal-600 ring-4 ring-zinc-50" />
              <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="font-display text-lg font-semibold text-zinc-900">{exam.type}</h2>
                  <time className="shrink-0 text-sm text-zinc-500">{formatDate(exam.date)}</time>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Badge color={statusColor(exam.status)}>{exam.status}</Badge>
                  {exam.value !== null && (
                    <span className="text-sm text-zinc-600">
                      Valor: <strong className="font-semibold text-zinc-900">{exam.value}</strong>
                    </span>
                  )}
                </div>
                {exam.notes && <p className="mt-3 text-sm text-zinc-600">{exam.notes}</p>}
                {exam.staff?.name && (
                  <p className="mt-3 text-xs text-zinc-400">Registrado por {exam.staff.name}</p>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
