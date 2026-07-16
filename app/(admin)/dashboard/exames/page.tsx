"use client";

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  LabelList,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { api } from "@/lib/api";
import { CHART_CATEGORICAL, CHART_INK } from "@/lib/chart-colors";
import { StatCard } from "@/components/ui/StatCard";
import { formatDate } from "@/lib/format";
import type { Exam } from "@/lib/types";

interface ExamStats {
  total: number;
  byStatus: { status: string; count: number }[];
  byMonth: { month: string; count: number }[];
}

export default function ExamesPage() {
  const [stats, setStats] = useState<ExamStats | null>(null);
  const [exams, setExams] = useState<Exam[]>([]);

  useEffect(() => {
    api.get<ExamStats>("/exams/stats").then(setStats).catch(() => setStats(null));
    api.get<Exam[]>("/exams").then(setExams).catch(() => setExams([]));
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-zinc-900">Exames e resultados</h1>

      {stats && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard label="Total de exames registrados" value={String(stats.total)} />
            <StatCard
              label="Status mais comum"
              value={
                stats.byStatus.length > 0
                  ? [...stats.byStatus].sort((a, b) => b.count - a.count)[0].status
                  : "—"
              }
            />
            <StatCard label="Meses com registros" value={String(stats.byMonth.length)} />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-lg border border-zinc-200 bg-white p-4">
              <h2 className="mb-3 text-sm font-semibold text-zinc-900">
                Distribuição por estado do paciente
              </h2>
              {stats.byStatus.length === 0 ? (
                <p className="text-sm text-zinc-500">Sem dados ainda.</p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={stats.byStatus} margin={{ top: 16, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke={CHART_INK.grid} />
                    <XAxis dataKey="status" stroke={CHART_INK.muted} fontSize={12} />
                    <YAxis allowDecimals={false} stroke={CHART_INK.muted} fontSize={12} />
                    <Tooltip
                      contentStyle={{ borderRadius: 8, borderColor: CHART_INK.axis, fontSize: 13 }}
                    />
                    <Bar dataKey="count" name="Exames" radius={[4, 4, 0, 0]}>
                      {stats.byStatus.map((entry, index) => (
                        <Cell key={entry.status} fill={CHART_CATEGORICAL[index % CHART_CATEGORICAL.length]} />
                      ))}
                      <LabelList dataKey="count" position="top" fill={CHART_INK.secondary} fontSize={12} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="rounded-lg border border-zinc-200 bg-white p-4">
              <h2 className="mb-3 text-sm font-semibold text-zinc-900">Exames registrados por mês</h2>
              {stats.byMonth.length === 0 ? (
                <p className="text-sm text-zinc-500">Sem dados ainda.</p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={stats.byMonth} margin={{ top: 16, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke={CHART_INK.grid} />
                    <XAxis dataKey="month" stroke={CHART_INK.muted} fontSize={12} />
                    <YAxis allowDecimals={false} stroke={CHART_INK.muted} fontSize={12} />
                    <Tooltip
                      contentStyle={{ borderRadius: 8, borderColor: CHART_INK.axis, fontSize: 13 }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="count"
                      name="Exames"
                      stroke={CHART_CATEGORICAL[0]}
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </>
      )}

      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase text-zinc-500">
            <tr>
              <th className="px-4 py-3">Paciente</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Data</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Profissional</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {exams.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-zinc-400">
                  Nenhum exame registrado ainda.
                </td>
              </tr>
            )}
            {exams.map((exam) => (
              <tr key={exam.id} className="transition-colors hover:bg-zinc-50">
                <td className="px-4 py-3 text-zinc-700">{exam.patient?.name}</td>
                <td className="px-4 py-3 text-zinc-700">{exam.type}</td>
                <td className="px-4 py-3 text-zinc-600">{formatDate(exam.date)}</td>
                <td className="px-4 py-3 text-zinc-600">{exam.status}</td>
                <td className="px-4 py-3 text-zinc-600">{exam.staff?.name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
