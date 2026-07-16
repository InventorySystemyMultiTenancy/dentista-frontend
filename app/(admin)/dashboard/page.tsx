"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { StatCard } from "@/components/ui/StatCard";
import { formatCurrency } from "@/lib/format";
import type { Appointment, InventoryItem, Patient } from "@/lib/types";

interface FinancialSummary {
  pendingTotal: number;
  overdueTotal: number;
  receivableTotal: number;
  payableTotal: number;
}

export default function DashboardOverviewPage() {
  const [patientsCount, setPatientsCount] = useState<number | null>(null);
  const [todayAppointments, setTodayAppointments] = useState<Appointment[] | null>(null);
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [lowStock, setLowStock] = useState<InventoryItem[] | null>(null);

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);

    api
      .get<Patient[]>("/patients")
      .then((data) => setPatientsCount(data.length))
      .catch(() => setPatientsCount(null));

    api
      .get<Appointment[]>(`/appointments?date=${today}`)
      .then(setTodayAppointments)
      .catch(() => setTodayAppointments(null));

    api
      .get<FinancialSummary>("/financial/summary")
      .then(setSummary)
      .catch(() => setSummary(null));

    api
      .get<InventoryItem[]>("/inventory/low-stock")
      .then(setLowStock)
      .catch(() => setLowStock(null));
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-zinc-900">Visão geral</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {patientsCount !== null && <StatCard label="Pacientes cadastrados" value={String(patientsCount)} />}
        {todayAppointments !== null && (
          <StatCard
            label="Agendamentos hoje"
            value={String(todayAppointments.filter((a) => a.status === "SCHEDULED").length)}
          />
        )}
        {summary && (
          <>
            <StatCard label="A receber (pendente)" value={formatCurrency(summary.receivableTotal)} />
            <StatCard label="A pagar (pendente)" value={formatCurrency(summary.payableTotal)} />
          </>
        )}
      </div>

      {summary && summary.overdueTotal > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Há {formatCurrency(summary.overdueTotal)} em contas atrasadas. Confira o módulo Financeiro.
        </div>
      )}

      {lowStock && lowStock.length > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {lowStock.length} item(ns) de estoque abaixo do mínimo: {lowStock.map((i) => i.name).join(", ")}.
        </div>
      )}

      {todayAppointments && (
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-zinc-900">Agendamentos de hoje</h2>
          {todayAppointments.length === 0 ? (
            <p className="text-sm text-zinc-500">Nenhum agendamento para hoje.</p>
          ) : (
            <ul className="divide-y divide-zinc-100">
              {todayAppointments.map((a) => (
                <li key={a.id} className="flex items-center justify-between py-2 text-sm">
                  <span className="text-zinc-700">
                    {a.startTime} — {a.patient.name} ({a.staff.name})
                  </span>
                  <span className="text-zinc-400">{a.status}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
