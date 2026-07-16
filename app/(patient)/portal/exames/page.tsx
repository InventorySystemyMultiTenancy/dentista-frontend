"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/format";
import type { Exam } from "@/lib/types";

export default function PortalExamesPage() {
  const [exams, setExams] = useState<Exam[]>([]);

  useEffect(() => {
    api.get<Exam[]>("/portal/exams").then(setExams).catch(() => setExams([]));
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-zinc-900">Meus exames e resultados</h1>

      {exams.length === 0 ? (
        <p className="text-sm text-zinc-500">Nenhum exame registrado ainda.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {exams.map((exam) => (
            <div key={exam.id} className="rounded-lg border border-zinc-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <h2 className="font-medium text-zinc-900">{exam.type}</h2>
                <span className="text-sm text-zinc-500">{formatDate(exam.date)}</span>
              </div>
              <p className="mt-1 text-sm text-zinc-600">Resultado: {exam.status}</p>
              {exam.value !== null && <p className="text-sm text-zinc-600">Valor: {exam.value}</p>}
              {exam.notes && <p className="mt-1 text-sm text-zinc-500">{exam.notes}</p>}
              {exam.staff?.name && (
                <p className="mt-1 text-xs text-zinc-400">Registrado por {exam.staff.name}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
