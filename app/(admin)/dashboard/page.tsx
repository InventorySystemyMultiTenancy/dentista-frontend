"use client";

import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { api, ApiError } from "@/lib/api";
import { StatCard } from "@/components/ui/StatCard";
import { Button } from "@/components/ui/Button";
import { CHART_CATEGORICAL, CHART_INK } from "@/lib/chart-colors";
import { formatCurrency, formatDateTime } from "@/lib/format";
import type { Appointment, AppointmentRequest, InventoryItem, Patient } from "@/lib/types";

interface FinancialSummary {
  pendingTotal: number;
  overdueTotal: number;
  receivableTotal: number;
  payableTotal: number;
}

const WEEKDAY_LABEL = new Intl.DateTimeFormat("pt-BR", { weekday: "short" });

function last7Days(): string[] {
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

export default function DashboardOverviewPage() {
  const [patientsCount, setPatientsCount] = useState<number | null>(null);
  const [todayAppointments, setTodayAppointments] = useState<Appointment[] | null>(null);
  const [weekAppointments, setWeekAppointments] = useState<Appointment[] | null>(null);
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [lowStock, setLowStock] = useState<InventoryItem[] | null>(null);
  const [appointmentRequests, setAppointmentRequests] = useState<AppointmentRequest[] | null>(null);

  function loadAppointmentRequests() {
    api
      .get<AppointmentRequest[]>("/appointment-requests?status=PENDING")
      .then(setAppointmentRequests)
      .catch(() => setAppointmentRequests(null));
  }

  useEffect(() => {
    const days = last7Days();
    const today = days[days.length - 1];

    api
      .get<Patient[]>("/patients")
      .then((data) => setPatientsCount(data.length))
      .catch(() => setPatientsCount(null));

    api
      .get<Appointment[]>(`/appointments?date=${today}`)
      .then(setTodayAppointments)
      .catch(() => setTodayAppointments(null));

    api
      .get<Appointment[]>(`/appointments?from=${days[0]}&to=${today}`)
      .then(setWeekAppointments)
      .catch(() => setWeekAppointments(null));

    api
      .get<FinancialSummary>("/financial/summary")
      .then(setSummary)
      .catch(() => setSummary(null));

    api
      .get<InventoryItem[]>("/inventory/low-stock")
      .then(setLowStock)
      .catch(() => setLowStock(null));

    loadAppointmentRequests();
  }, []);

  async function handleMarkContacted(id: string) {
    try {
      await api.patch(`/appointment-requests/${id}/status`, { status: "CONTACTED" });
      loadAppointmentRequests();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Não foi possível atualizar a solicitação");
    }
  }

  const weeklyTrend = weekAppointments
    ? last7Days().map((day) => {
        const count = weekAppointments.filter(
          (a) => a.date.slice(0, 10) === day && a.status !== "CANCELLED",
        ).length;
        const label = WEEKDAY_LABEL.format(new Date(`${day}T12:00:00`));
        return { day: `${label.replace(".", "")} ${Number(day.slice(8, 10))}`, count };
      })
    : [];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-zinc-900">Visão geral</h1>

      {appointmentRequests && appointmentRequests.length > 0 && (
        <div className="rounded-lg border border-teal-200 bg-teal-50 p-4">
          <h2 className="mb-3 text-sm font-semibold text-teal-900">
            {appointmentRequests.length} solicitação(ões) de agendamento pelo portal
          </h2>
          <ul className="divide-y divide-teal-100">
            {appointmentRequests.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                <span className="text-teal-900">
                  {r.patient.name} — {r.patient.phone} · {formatDateTime(r.createdAt)}
                </span>
                <Button variant="secondary" onClick={() => handleMarkContacted(r.id)}>
                  Marcar como contatado
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}

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

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {weekAppointments && (
          <div className="rounded-lg border border-zinc-200 bg-white p-4">
            <h2 className="mb-3 text-sm font-semibold text-zinc-900">Agendamentos nos últimos 7 dias</h2>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={weeklyTrend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="weeklyTrendFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CHART_CATEGORICAL[0]} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={CHART_CATEGORICAL[0]} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke={CHART_INK.grid} />
                <XAxis dataKey="day" stroke={CHART_INK.muted} fontSize={12} />
                <YAxis allowDecimals={false} stroke={CHART_INK.muted} fontSize={12} width={28} />
                <Tooltip contentStyle={{ borderRadius: 8, borderColor: CHART_INK.axis, fontSize: 13 }} />
                <Area
                  type="monotone"
                  dataKey="count"
                  name="Agendamentos"
                  stroke={CHART_CATEGORICAL[0]}
                  strokeWidth={2}
                  fill="url(#weeklyTrendFill)"
                  dot={{ r: 3 }}
                />
              </AreaChart>
            </ResponsiveContainer>
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
    </div>
  );
}
